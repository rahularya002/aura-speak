import { randomUUID } from "node:crypto";
import type { AssistantConfig, ChunkRecord, DocumentRecord } from "@/lib/types/ai";
import { embedTexts } from "@/lib/services/embeddingService";
import { chunkText, extractTextFromFile } from "@/lib/text/extract";
import { cosineSimilarity, normalizeL2 } from "@/lib/math/vector";
import {
  ensureUploadsDir,
  getChunksForAssistant,
  replaceChunksForDoc,
  uploadPathForDoc,
  upsertDocument,
  listDocuments,
} from "@/lib/store/vectorStore";
import fs from "node:fs/promises";
import path from "node:path";
import { uploadDirForAssistant } from "@/lib/db/client";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const TOP_K = 3;
const MAX_ASSISTANT_CHUNKS = 5000;

export interface RetrievedSource {
  document: string;
  snippet: string;
}

export async function retrieveContext(
  query: string,
  config: AssistantConfig,
  assistantId: string
): Promise<{ context: string; sources: RetrievedSource[] }> {
  const baseUrl = config.baseUrl || config.ollamaUrl || "http://localhost:11434";
  const chunks = await getChunksForAssistant(assistantId, { limit: MAX_ASSISTANT_CHUNKS });
  if (!chunks.length || !config.embeddingModel) {
    return { context: "", sources: [] };
  }
  const [qEmb] = await embedTexts(
    config.provider,
    baseUrl,
    config.embeddingModel,
    [query]
  );
  const normalizedQuery = normalizeL2(qEmb);
  const scored: Array<{ chunk: ChunkRecord; score: number }> = [];
  for (const chunk of chunks) {
    const score = cosineSimilarity(normalizedQuery, normalizeL2(chunk.embedding));
    if (scored.length < TOP_K) {
      scored.push({ chunk, score });
      scored.sort((a, b) => a.score - b.score);
      continue;
    }
    if (score <= scored[0].score) continue;
    scored[0] = { chunk, score };
    scored.sort((a, b) => a.score - b.score);
  }
  scored.sort((a, b) => b.score - a.score);

  const sources: RetrievedSource[] = scored.map((s) => ({
    document: s.chunk.name,
    snippet: s.chunk.text.slice(0, 280) + (s.chunk.text.length > 280 ? "…" : ""),
  }));

  const context = scored
    .map((s, i) => `[#${i + 1} ${s.chunk.name}]\n${s.chunk.text}`)
    .join("\n\n");

  return { context, sources };
}

export async function ingestDocumentBuffer(
  config: AssistantConfig,
  assistantId: string,
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  options?: { existingId?: string; createdAt?: string }
): Promise<DocumentRecord> {
  const id = options?.existingId ?? randomUUID();
  const doc: DocumentRecord = {
    id,
    assistantId,
    name: originalName,
    status: "processing",
    createdAt: options?.createdAt ?? new Date().toISOString(),
  };
  await upsertDocument(doc);
  await ensureUploadsDir(assistantId);
  const safe = path.basename(originalName).replace(/[^\w.\-]+/g, "_");
  const dest = uploadPathForDoc(assistantId, id, safe);
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
      assistantId,
      docId: id,
      name: originalName,
      text: t,
      embedding: embeddings[i] ?? [],
    }));
    await replaceChunksForDoc(assistantId, id, chunks);
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

export async function reindexAll(
  config: AssistantConfig,
  assistantId: string
): Promise<void> {
  const docs = await listDocuments(assistantId);
  await ensureUploadsDir(assistantId);
  for (const d of docs) {
    const dir = path.join(uploadDirForAssistant(assistantId), d.id);
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
    await ingestDocumentBuffer(config, assistantId, buf, d.name, mime, {
      existingId: d.id,
      createdAt: d.createdAt,
    });
  }
}
