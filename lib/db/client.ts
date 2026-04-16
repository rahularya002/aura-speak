import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { defaultAssistantConfig, type AssistantConfig, type LLMProvider } from "@/lib/types/ai";
import { CONFIG_PATH, DATA_DIR, DB_PATH, VECTOR_STORE_PATH } from "@/lib/store/paths";

type LegacyVectorStore = {
  documents?: Array<{
    id: string;
    name: string;
    status: "indexed" | "processing" | "error";
    createdAt: string;
    error?: string;
  }>;
  chunks?: Array<{
    id: string;
    docId: string;
    name: string;
    text: string;
    embedding: number[];
  }>;
};

type LegacyConfig = Partial<AssistantConfig> & {
  assistantName?: string;
  systemPrompt?: string;
  provider?: LLMProvider;
};

let dbInstance: Database.Database | null = null;

const DEFAULT_ASSISTANT_ID = "default";
const DEFAULT_ASSISTANT_NAME = "My Assistant";
const DEFAULT_ASSISTANT_DESCRIPTION = "Default assistant";

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function initSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS assistants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assistant_config (
      assistant_id TEXT PRIMARY KEY REFERENCES assistants(id) ON DELETE CASCADE,
      assistant_name TEXT,
      system_prompt TEXT,
      provider TEXT NOT NULL,
      base_url TEXT NOT NULL,
      ollama_url TEXT,
      llm_model TEXT NOT NULL DEFAULT '',
      embedding_model TEXT NOT NULL DEFAULT '',
      temperature REAL NOT NULL DEFAULT 0.7,
      top_p REAL NOT NULL DEFAULT 0.9,
      max_tokens INTEGER NOT NULL DEFAULT 2048,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      assistant_id TEXT NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS embedding_chunks (
      id TEXT PRIMARY KEY,
      assistant_id TEXT NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
      doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      embedding_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_documents_assistant_id ON documents(assistant_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_assistant_id ON embedding_chunks(assistant_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON embedding_chunks(doc_id);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      assistant_id TEXT NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_assistant_id_created_at
      ON chat_messages(assistant_id, created_at);
  `);
}

function upsertDefaultAssistant(db: Database.Database) {
  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT OR IGNORE INTO assistants (id, name, description, created_at)
      VALUES (?, ?, ?, ?)
    `
  ).run(DEFAULT_ASSISTANT_ID, DEFAULT_ASSISTANT_NAME, DEFAULT_ASSISTANT_DESCRIPTION, now);

  const fallback = defaultAssistantConfig();
  db.prepare(
    `
      INSERT OR IGNORE INTO assistant_config (
        assistant_id, assistant_name, system_prompt, provider, base_url, ollama_url,
        llm_model, embedding_model, temperature, top_p, max_tokens, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    DEFAULT_ASSISTANT_ID,
    DEFAULT_ASSISTANT_NAME,
    fallback.systemPrompt ?? "",
    fallback.provider,
    fallback.baseUrl,
    fallback.ollamaUrl ?? fallback.baseUrl,
    fallback.llmModel,
    fallback.embeddingModel,
    fallback.temperature,
    fallback.topP,
    fallback.maxTokens,
    now
  );
}

function migrateLegacyFiles(db: Database.Database) {
  const docsCount = Number(
    (db.prepare("SELECT COUNT(1) as c FROM documents").get() as { c: number }).c
  );
  const chunksCount = Number(
    (db.prepare("SELECT COUNT(1) as c FROM embedding_chunks").get() as { c: number }).c
  );
  const configCount = Number(
    (db.prepare("SELECT COUNT(1) as c FROM assistant_config").get() as { c: number }).c
  );

  if (docsCount > 0 || chunksCount > 0 || configCount > 1) {
    return;
  }

  const tx = db.transaction(() => {
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
        const parsed = JSON.parse(raw) as LegacyConfig;
        const defaults = defaultAssistantConfig();
        const merged: AssistantConfig = {
          ...defaults,
          ...parsed,
          provider: parsed.provider ?? defaults.provider,
          baseUrl: (parsed.baseUrl ?? parsed.ollamaUrl ?? defaults.baseUrl).replace(/\/$/, ""),
          ollamaUrl:
            (parsed.ollamaUrl ?? parsed.baseUrl ?? defaults.ollamaUrl ?? defaults.baseUrl).replace(
              /\/$/,
              ""
            ),
        };
        db.prepare(
          `
            UPDATE assistant_config
               SET assistant_name = ?,
                   system_prompt = ?,
                   provider = ?,
                   base_url = ?,
                   ollama_url = ?,
                   llm_model = ?,
                   embedding_model = ?,
                   temperature = ?,
                   top_p = ?,
                   max_tokens = ?,
                   updated_at = ?
             WHERE assistant_id = ?
          `
        ).run(
          parsed.assistantName ?? DEFAULT_ASSISTANT_NAME,
          parsed.systemPrompt ?? defaults.systemPrompt ?? "",
          merged.provider,
          merged.baseUrl,
          merged.ollamaUrl ?? merged.baseUrl,
          merged.llmModel,
          merged.embeddingModel,
          merged.temperature,
          merged.topP,
          merged.maxTokens,
          new Date().toISOString(),
          DEFAULT_ASSISTANT_ID
        );
      } catch {
        /* ignore legacy config parse failures */
      }
    }

    if (fs.existsSync(VECTOR_STORE_PATH)) {
      try {
        const raw = fs.readFileSync(VECTOR_STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw) as LegacyVectorStore;
        const documents = parsed.documents ?? [];
        const chunks = parsed.chunks ?? [];

        const insertDoc = db.prepare(
          `
            INSERT OR REPLACE INTO documents
            (id, assistant_id, name, status, created_at, error)
            VALUES (?, ?, ?, ?, ?, ?)
          `
        );
        const insertChunk = db.prepare(
          `
            INSERT OR REPLACE INTO embedding_chunks
            (id, assistant_id, doc_id, name, text, embedding_json)
            VALUES (?, ?, ?, ?, ?, ?)
          `
        );
        for (const d of documents) {
          insertDoc.run(
            d.id,
            DEFAULT_ASSISTANT_ID,
            d.name,
            d.status,
            d.createdAt ?? new Date().toISOString(),
            d.error ?? null
          );
        }
        for (const c of chunks) {
          insertChunk.run(
            c.id,
            DEFAULT_ASSISTANT_ID,
            c.docId,
            c.name,
            c.text,
            JSON.stringify(Array.isArray(c.embedding) ? c.embedding : [])
          );
        }
      } catch {
        /* ignore legacy vector parse failures */
      }
    }
  });
  tx();
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  ensureDataDir();
  dbInstance = new Database(DB_PATH);
  initSchema(dbInstance);
  upsertDefaultAssistant(dbInstance);
  migrateLegacyFiles(dbInstance);
  return dbInstance;
}

export function dbNowIso(): string {
  return new Date().toISOString();
}

export function uploadDirForAssistant(assistantId: string): string {
  return path.join(DATA_DIR, "uploads", assistantId);
}
