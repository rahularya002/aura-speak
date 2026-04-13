import { randomUUID } from "node:crypto";
import { dbNowIso, getDb } from "@/lib/db/client";
import { defaultAssistantConfig, type AssistantConfig, type AssistantRecord } from "@/lib/types/ai";
import { removeAllAssistantUploads } from "@/lib/store/vectorStore";

const DEFAULT_ASSISTANT_ID = "default";

type AssistantRow = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

function rowToAssistant(row: AssistantRow): AssistantRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

export async function listAssistants(): Promise<AssistantRecord[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT id, name, description, created_at
          FROM assistants
         ORDER BY created_at ASC
      `
    )
    .all() as AssistantRow[];
  return rows.map(rowToAssistant);
}

/**
 * Ensures a row exists in `assistants` so FK writes to `assistant_config` (and other tables) succeed.
 * Used when the client still references an id (e.g. stale localStorage) that was never inserted here.
 */
export function ensureAssistantRow(assistantId: string): void {
  const db = getDb();
  const now = dbNowIso();
  db.prepare(
    `
      INSERT OR IGNORE INTO assistants (id, name, description, created_at)
      VALUES (?, ?, ?, ?)
    `
  ).run(assistantId, "My Assistant", "", now);
}

export async function getAssistant(id: string): Promise<AssistantRecord | undefined> {
  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT id, name, description, created_at
          FROM assistants
         WHERE id = ?
      `
    )
    .get(id) as AssistantRow | undefined;
  return row ? rowToAssistant(row) : undefined;
}

export async function createAssistant(
  name: string,
  description = ""
): Promise<AssistantRecord> {
  const db = getDb();
  const id = randomUUID();
  const now = dbNowIso();
  const defaults = defaultAssistantConfig();
  const tx = db.transaction(() => {
    db.prepare(
      `
        INSERT INTO assistants (id, name, description, created_at)
        VALUES (?, ?, ?, ?)
      `
    ).run(id, name, description, now);

    db.prepare(
      `
        INSERT INTO assistant_config (
          assistant_id, assistant_name, system_prompt, provider, base_url, ollama_url,
          llm_model, embedding_model, temperature, top_p, max_tokens, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      id,
      name,
      "",
      defaults.provider,
      defaults.baseUrl,
      defaults.ollamaUrl ?? defaults.baseUrl,
      defaults.llmModel,
      defaults.embeddingModel,
      defaults.temperature,
      defaults.topP,
      defaults.maxTokens,
      now
    );
  });
  tx();
  return { id, name, description, createdAt: now };
}

export async function deleteAssistant(id: string): Promise<boolean> {
  if (id === DEFAULT_ASSISTANT_ID) {
    throw new Error("Cannot delete the default assistant.");
  }
  const db = getDb();
  const tx = db.transaction(() => {
    const result = db.prepare("DELETE FROM assistants WHERE id = ?").run(id);
    return result.changes > 0;
  });
  const deleted = tx();
  if (deleted) {
    await removeAllAssistantUploads(id);
  }
  return deleted;
}

export async function getAssistantWithConfig(
  id: string
): Promise<{ assistant: AssistantRecord; config: AssistantConfig } | undefined> {
  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT
          a.id as id, a.name as name, a.description as description, a.created_at as created_at,
          c.assistant_name as assistant_name, c.system_prompt as system_prompt,
          c.provider as provider, c.base_url as base_url, c.ollama_url as ollama_url,
          c.llm_model as llm_model, c.embedding_model as embedding_model,
          c.temperature as temperature, c.top_p as top_p, c.max_tokens as max_tokens
        FROM assistants a
        LEFT JOIN assistant_config c ON c.assistant_id = a.id
        WHERE a.id = ?
      `
    )
    .get(id) as
    | (AssistantRow & {
        assistant_name: string | null;
        system_prompt: string | null;
        provider: "ollama" | "lmstudio" | "localai" | null;
        base_url: string | null;
        ollama_url: string | null;
        llm_model: string | null;
        embedding_model: string | null;
        temperature: number | null;
        top_p: number | null;
        max_tokens: number | null;
      })
    | undefined;
  if (!row) return undefined;
  const defaults = defaultAssistantConfig();
  return {
    assistant: rowToAssistant(row),
    config: {
      assistantName: row.assistant_name ?? row.name,
      systemPrompt: row.system_prompt ?? undefined,
      provider: row.provider ?? defaults.provider,
      baseUrl: row.base_url ?? defaults.baseUrl,
      ollamaUrl: row.ollama_url ?? row.base_url ?? defaults.baseUrl,
      llmModel: row.llm_model ?? "",
      embeddingModel: row.embedding_model ?? "",
      temperature: row.temperature ?? defaults.temperature,
      topP: row.top_p ?? defaults.topP,
      maxTokens: row.max_tokens ?? defaults.maxTokens,
    },
  };
}
