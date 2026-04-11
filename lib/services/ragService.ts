import { randomUUID } from "node:crypto";
import type { AssistantConfig, ChunkRecord, DocumentRecord } from "@/lib/types/ai";
import { embedTexts } from "@/lib/services/embeddingService";
import { chunkText, extractTextFromFile } from "@/lib/text/extract";
import { cosineSimilarity } from "@/lib/math/vector";
import {
  ensureUploadsDir,
  getAllChunks,
  replaceChunksForDoc,
  uploadPathForDoc,
  upsertDocument,
} from "@/lib/store/vectorStore";
import fs from "node:fs/promises";
import path from "node:path";

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 64;
const TOP_K = 5;

export interface RetrievedSource {
  id: string;
  name: string;
  snippet: string;
}

export async function retrieveContext(
  query: string,
  config: AssistantConfig
): Promise<{ context: string; sources: RetrievedSource[] }> {
  const baseUrl = config.baseUrl || config.ollamaUrl || "http://localhost:11434";
  const chunks = await getAllChunks();
  if (!chunks.length || !config.embeddingModel) {
    return { context: "", sources: [] };
  }
  const [qEmb] = await embedTexts(
    config.provider,
    baseUrl,
    config.embeddingModel,
    [query]
  );
  const scored = chunks
    .map((c) => ({
      chunk: c,
      score: cosineSimilarity(qEmb, c.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  const sources: RetrievedSource[] = scored.map((s, i) => ({
    id: `${s.chunk.id}-${i}`,
    name: s.chunk.name,
    snippet: s.chunk.text.slice(0, 280) + (s.chunk.text.length > 280 ? "…" : ""),
  }));

  const context = scored
    .map((s, i) => `[#${i + 1} ${s.chunk.name}]\n${s.chunk.text}`)
    .join("\n\n");

  return { context, sources };
}

export async function ingestDocumentBuffer(
  config: AssistantConfig,
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  options?: { existingId?: string; createdAt?: string }
): Promise<DocumentRecord> {
  const id = options?.existingId ?? randomUUID();
  const doc: DocumentRecord = {
    id,
    name: originalName,
    status: "processing",
    createdAt: options?.createdAt ?? new Date().toISOString(),
  };
  await upsertDocument(doc);
  await ensureUploadsDir();
  const safe = path.basename(originalName).replace(/[^\w.\-]+/g, "_");
  const dest = uploadPathForDoc(id, safe);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);

  try {
    const text = await extractTextFromFile(buffer, originalName, mimeType);
    const parts = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    const baseUrl = config.baseUrl || config.ollamaUrl || "http://localhost:11434";
    if (!config.embeddingModel) throw new Error("Embedding model not set");
    const embeddings = await embedTexts(
      config.provider,
      baseUrl,
      config.embeddingModel,
      parts
    );
    const chunks: ChunkRecord[] = parts.map((t, i) => ({
      id: randomUUID(),
      docId: id,
      name: originalName,
      text: t,
      embedding: embeddings[i] ?? [],
    }));
    await replaceChunksForDoc(id, chunks);
    doc.status = "indexed";
    await upsertDocument(doc);
    return doc;
  } catch (e) {
    doc.status = "error";
    doc.error = e instanceof Error ? e.message : String(e);
    await upsertDocument(doc);
    throw e;
  }
}

export async function reindexAll(config: AssistantConfig): Promise<void> {
  const { listDocuments } = await import("@/lib/store/vectorStore");
  const docs = await listDocuments();
  await ensureUploadsDir();
  for (const d of docs) {
    const dir = path.join(process.cwd(), ".data", "uploads", d.id);
    let files: string[] = [];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }
    const file = files[0];
    if (!file) continue;
    const buf = await fs.readFile(path.join(dir, file));
    const mime = file.endsWith(".pdf") ? "application/pdf" : "text/plain";
    await ingestDocumentBuffer(config, buf, d.name, mime, {
      existingId: d.id,
      createdAt: d.createdAt,
    });
  }
}
