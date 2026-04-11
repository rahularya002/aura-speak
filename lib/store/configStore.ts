import fs from "node:fs/promises";
import type { AssistantConfig } from "@/lib/types/ai";
import { defaultAssistantConfig } from "@/lib/types/ai";
import { CONFIG_PATH, DATA_DIR } from "@/lib/store/paths";

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readConfig(): Promise<AssistantConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as AssistantConfig;
    return { ...defaultAssistantConfig(), ...parsed };
  } catch {
    return defaultAssistantConfig();
  }
}

export async function writeConfig(partial: Partial<AssistantConfig>): Promise<AssistantConfig> {
  await ensureDir();
  const current = await readConfig();
  const next: AssistantConfig = {
    ...current,
    ...partial,
  };
  if (partial.baseUrl !== undefined || partial.ollamaUrl !== undefined) {
    const url = partial.baseUrl ?? partial.ollamaUrl ?? next.baseUrl;
    next.baseUrl = url.replace(/\/$/, "");
    if (next.provider === "ollama") {
      next.ollamaUrl = next.baseUrl;
    }
  }
  await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export function splitModelsForUi(models: string[]): { llm: string[]; embedding: string[] } {
  const embeddingKeywords = ["embed", "minilm", "bge", "e5", "gte"];
  const embedding = models.filter((m) =>
    embeddingKeywords.some((kw) => m.toLowerCase().includes(kw))
  );
  const llm = models.filter(
    (m) => !embeddingKeywords.some((kw) => m.toLowerCase().includes(kw))
  );
  return { llm, embedding };
}
