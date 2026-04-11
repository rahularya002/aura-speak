import fs from "node:fs/promises";
import path from "node:path";
import type { ChunkRecord, DocumentRecord } from "@/lib/types/ai";
import { DATA_DIR, UPLOADS_DIR, VECTOR_STORE_PATH } from "@/lib/store/paths";

interface VectorStoreFile {
  documents: DocumentRecord[];
  chunks: ChunkRecord[];
}

let ioQueue: Promise<void> = Promise.resolve();

function queue<T>(fn: () => Promise<T>): Promise<T> {
  const run = ioQueue.then(fn, fn);
  ioQueue = run.then(
    () => {},
    () => {}
  );
  return run;
}

async function readStore(): Promise<VectorStoreFile> {
  try {
    const raw = await fs.readFile(VECTOR_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as VectorStoreFile;
    return {
      documents: parsed.documents ?? [],
      chunks: parsed.chunks ?? [],
    };
  } catch {
    return { documents: [], chunks: [] };
  }
}

async function writeStore(store: VectorStoreFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(VECTOR_STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const s = await readStore();
  return s.documents;
}

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  const s = await readStore();
  return s.documents.find((d) => d.id === id);
}

export async function upsertDocument(doc: DocumentRecord): Promise<void> {
  await queue(async () => {
    const s = await readStore();
    const i = s.documents.findIndex((d) => d.id === doc.id);
    if (i >= 0) s.documents[i] = doc;
    else s.documents.push(doc);
    await writeStore(s);
  });
}

export async function removeDocument(id: string): Promise<void> {
  await queue(async () => {
    const s = await readStore();
    s.documents = s.documents.filter((d) => d.id !== id);
    s.chunks = s.chunks.filter((c) => c.docId !== id);
    await writeStore(s);
    try {
      await fs.rm(path.join(UPLOADS_DIR, id), { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
}

export async function replaceChunksForDoc(docId: string, chunks: ChunkRecord[]): Promise<void> {
  await queue(async () => {
    const s = await readStore();
    s.chunks = s.chunks.filter((c) => c.docId !== docId);
    s.chunks.push(...chunks);
    await writeStore(s);
  });
}

export async function getAllChunks(): Promise<ChunkRecord[]> {
  const s = await readStore();
  return s.chunks;
}

export async function clearAllChunks(): Promise<void> {
  await queue(async () => {
    const s = await readStore();
    s.chunks = [];
    await writeStore(s);
  });
}

export async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export function uploadPathForDoc(docId: string, safeName: string): string {
  return path.join(UPLOADS_DIR, docId, safeName);
}
