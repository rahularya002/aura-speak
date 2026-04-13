import { getDb } from "@/lib/db/client";

function main() {
  const db = getDb();
  const assistants = db
    .prepare("SELECT id, name, description, created_at FROM assistants ORDER BY created_at")
    .all();
  const docs = db.prepare("SELECT COUNT(1) as c FROM documents").get() as { c: number };
  const chunks = db
    .prepare("SELECT COUNT(1) as c FROM embedding_chunks")
    .get() as { c: number };
  const chats = db.prepare("SELECT COUNT(1) as c FROM chat_messages").get() as { c: number };
  console.log("SQLite migration complete.");
  console.log(`Assistants: ${assistants.length}`);
  console.log(`Documents: ${docs.c}`);
  console.log(`Chunks: ${chunks.c}`);
  console.log(`Chat messages: ${chats.c}`);
}

main();
