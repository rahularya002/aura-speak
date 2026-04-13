import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import type { ChatMessageRecord } from "@/lib/types/ai";

type MessageRow = {
  id: string;
  assistant_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

function rowToMessage(row: MessageRow): ChatMessageRecord {
  return {
    id: row.id,
    assistantId: row.assistant_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function insertChatMessage(input: {
  assistantId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}): Promise<ChatMessageRecord> {
  const db = getDb();
  const id = randomUUID();
  const createdAt = input.createdAt ?? new Date().toISOString();
  db.prepare(
    `
      INSERT INTO chat_messages (id, assistant_id, role, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run(id, input.assistantId, input.role, input.content, createdAt);
  return {
    id,
    assistantId: input.assistantId,
    role: input.role,
    content: input.content,
    createdAt,
  };
}

export async function listChatHistory(params: {
  assistantId: string;
  limit?: number;
  offset?: number;
}): Promise<ChatMessageRecord[]> {
  const db = getDb();
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);
  const rows = db
    .prepare(
      `
        SELECT id, assistant_id, role, content, created_at
          FROM chat_messages
         WHERE assistant_id = ?
         ORDER BY created_at ASC
         LIMIT ? OFFSET ?
      `
    )
    .all(params.assistantId, limit, offset) as MessageRow[];
  return rows.map(rowToMessage);
}
