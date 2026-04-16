import fs from "node:fs/promises";
import path from "node:path";
import { getDb, uploadDirForAssistant } from "@/lib/db/client";
import type { ChunkRecord, DocumentRecord } from "@/lib/types/ai";
import { UPLOADS_DIR } from "@/lib/store/paths";

type DocumentRow = {
  id: string;
  assistant_id: string;
  name: string;
  status: "indexed" | "processing" | "error";
  created_at: string;
  error: string | null;
};

type ChunkRow = {
  id: string;
  assistant_id: string;
  doc_id: string;
  name: string;
  text: string;
  embedding_json: string;
};

const DEFAULT_ASSISTANT_ID = "default";

function rowToDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    assistantId: row.assistant_id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    error: row.error ?? undefined,
  };
}

function rowToChunk(row: ChunkRow): ChunkRecord {
  let embedding: number[] = [];
  try {
    const parsed = JSON.parse(row.embedding_json) as unknown;
    if (Array.isArray(parsed)) embedding = parsed as number[];
  } catch {
    embedding = [];
  }
  return {
    id: row.id,
    assistantId: row.assistant_id,
    docId: row.doc_id,
    name: row.name,
    text: row.text,
    embedding,
  };
}

export async function listDocuments(
  assistantId = DEFAULT_ASSISTANT_ID
): Promise<DocumentRecord[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT id, assistant_id, name, status, created_at, error
          FROM documents
         WHERE assistant_id = ?
         ORDER BY created_at DESC
      `
    )
    .all(assistantId) as DocumentRow[];
  return rows.map(rowToDocument);
}

export async function getDocument(
  id: string,
  assistantId = DEFAULT_ASSISTANT_ID
): Promise<DocumentRecord | undefined> {
  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT id, assistant_id, name, status, created_at, error
          FROM documents
         WHERE id = ? AND assistant_id = ?
      `
    )
    .get(id, assistantId) as DocumentRow | undefined;
  return row ? rowToDocument(row) : undefined;
}

export async function upsertDocument(doc: DocumentRecord): Promise<void> {
  const db = getDb();
  db.prepare(
    `
      INSERT INTO documents (id, assistant_id, name, status, created_at, error)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        assistant_id = excluded.assistant_id,
        name = excluded.name,
        status = excluded.status,
        created_at = excluded.created_at,
        error = excluded.error
    `
  ).run(
    doc.id,
    doc.assistantId,
    doc.name,
    doc.status,
    doc.createdAt,
    doc.error ?? null
  );
}

export async function removeDocument(
  id: string,
  assistantId = DEFAULT_ASSISTANT_ID
): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM documents WHERE id = ? AND assistant_id = ?").run(
    id,
    assistantId
  );
  try {
    await fs.rm(path.join(uploadDirForAssistant(assistantId), id), {
      recursive: true,
      force: true,
    });
  } catch {
    /* ignore */
  }
}

export async function replaceChunksForDoc(
  assistantId: string,
  docId: string,
  chunks: ChunkRecord[]
): Promise<void> {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      "DELETE FROM embedding_chunks WHERE assistant_id = ? AND doc_id = ?"
    ).run(assistantId, docId);
    const insert = db.prepare(
      `
        INSERT INTO embedding_chunks
        (id, assistant_id, doc_id, name, text, embedding_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    );
    for (const c of chunks) {
      insert.run(
        c.id,
        assistantId,
        docId,
        c.name,
        c.text,
        JSON.stringify(c.embedding ?? [])
      );
    }
  });
  tx();
}

export async function getChunksForAssistant(
  assistantId = DEFAULT_ASSISTANT_ID,
  options?: { limit?: number }
): Promise<ChunkRecord[]> {
  const db = getDb();
  const limit = options?.limit && options.limit > 0 ? Math.floor(options.limit) : null;
  const rows = db
    .prepare(limit ? `
        SELECT id, assistant_id, doc_id, name, text, embedding_json
          FROM embedding_chunks
         WHERE assistant_id = ?
         LIMIT ?
      ` : `
        SELECT id, assistant_id, doc_id, name, text, embedding_json
          FROM embedding_chunks
         WHERE assistant_id = ?
      `)
    .all(...(limit ? [assistantId, limit] : [assistantId])) as ChunkRow[];
  return rows.map(rowToChunk);
}

export async function clearAllChunks(
  assistantId = DEFAULT_ASSISTANT_ID
): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM embedding_chunks WHERE assistant_id = ?").run(
    assistantId
  );
}

export async function ensureUploadsDir(assistantId: string): Promise<void> {
  await fs.mkdir(uploadDirForAssistant(assistantId), { recursive: true });
}

export function uploadPathForDoc(
  assistantId: string,
  docId: string,
  safeName: string
): string {
  return path.join(uploadDirForAssistant(assistantId), docId, safeName);
}

export async function removeAllAssistantUploads(assistantId: string): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.rm(uploadDirForAssistant(assistantId), { recursive: true, force: true });
}
