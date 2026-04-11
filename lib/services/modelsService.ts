import type { LLMProvider } from "@/lib/types/ai";
import * as ollama from "@/lib/providers/ollama";
import * as openaiCompat from "@/lib/providers/openaiCompatible";

export async function fetchModelsForProvider(
  provider: LLMProvider,
  baseUrl: string
): Promise<string[]> {
  switch (provider) {
    case "ollama":
      return ollama.listModels(baseUrl);
    case "lmstudio":
    case "localai":
      return openaiCompat.listModels(baseUrl);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
