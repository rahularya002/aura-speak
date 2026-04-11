import type { LLMProvider } from "@/lib/types/ai";
import * as ollama from "@/lib/providers/ollama";
import * as lmstudio from "@/lib/providers/lmstudio";
import * as localai from "@/lib/providers/localai";

export async function embedTexts(
  provider: LLMProvider,
  baseUrl: string,
  model: string,
  texts: string[]
): Promise<number[][]> {
  if (!model) throw new Error("Embedding model is not configured");
  switch (provider) {
    case "ollama":
      return ollama.embedBatch(baseUrl, model, texts);
    case "lmstudio":
      return lmstudio.embedBatch(baseUrl, model, texts);
    case "localai":
      return localai.embedBatch(baseUrl, model, texts);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
