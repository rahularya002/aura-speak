import type { LLMProvider } from "@/lib/types/ai";
import * as ollama from "@/lib/providers/ollama";
import * as lmstudio from "@/lib/providers/lmstudio";
import * as localai from "@/lib/providers/localai";
import { normalizeL2 } from "@/lib/math/vector";

const QUERY_EMBED_CACHE_MAX = 200;
const queryEmbedCache = new Map<string, number[]>();

function buildCacheKey(
  provider: LLMProvider,
  baseUrl: string,
  model: string,
  text: string
): string {
  return `${provider}|${baseUrl}|${model}|${text}`;
}

function setCache(key: string, value: number[]) {
  if (queryEmbedCache.has(key)) queryEmbedCache.delete(key);
  queryEmbedCache.set(key, value);
  if (queryEmbedCache.size <= QUERY_EMBED_CACHE_MAX) return;
  const oldest = queryEmbedCache.keys().next().value;
  if (oldest) queryEmbedCache.delete(oldest);
}

export async function embedTexts(
  provider: LLMProvider,
  baseUrl: string,
  model: string,
  texts: string[]
): Promise<number[][]> {
  if (!model) throw new Error("Embedding model is not configured");
  if (texts.length === 1) {
    const key = buildCacheKey(provider, baseUrl, model, texts[0]);
    const hit = queryEmbedCache.get(key);
    if (hit) return [hit.slice()];
  }
  let vectors: number[][];
  switch (provider) {
    case "ollama":
      vectors = await ollama.embedBatch(baseUrl, model, texts);
      break;
    case "lmstudio":
      vectors = await lmstudio.embedBatch(baseUrl, model, texts);
      break;
    case "localai":
      vectors = await localai.embedBatch(baseUrl, model, texts);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
  const normalized = vectors.map((v) => normalizeL2(v));
  if (texts.length === 1 && normalized[0]) {
    const key = buildCacheKey(provider, baseUrl, model, texts[0]);
    setCache(key, normalized[0]);
  }
  return normalized;
}
