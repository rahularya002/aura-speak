import { dbNowIso, getDb } from "@/lib/db/client";
import { ensureAssistantRow } from "@/lib/store/assistantsStore";
import { defaultAssistantConfig, type AssistantConfig } from "@/lib/types/ai";

const DEFAULT_ASSISTANT_ID = "default";

type ConfigRow = {
  assistant_name: string | null;
  system_prompt: string | null;
  provider: "ollama" | "lmstudio" | "localai";
  base_url: string;
  ollama_url: string | null;
  llm_model: string;
  embedding_model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
};

function ensureConfigRow(assistantId: string) {
  ensureAssistantRow(assistantId);
  const db = getDb();
  const defaults = defaultAssistantConfig();
  const now = dbNowIso();
  db.prepare(
    `
      INSERT OR IGNORE INTO assistant_config (
        assistant_id, assistant_name, system_prompt, provider, base_url, ollama_url,
        llm_model, embedding_model, temperature, top_p, max_tokens, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    assistantId,
    "My Assistant",
    defaults.systemPrompt ?? "",
    defaults.provider,
    defaults.baseUrl,
    defaults.ollamaUrl ?? defaults.baseUrl,
    defaults.llmModel,
    defaults.embeddingModel,
    defaults.temperature,
    defaults.topP,
    defaults.maxTokens,
    now
  );
}

/** `...spread` would overwrite with `undefined` and wipe DB-required fields (e.g. `provider`). */
function mergePartialConfig(
  current: AssistantConfig,
  partial: Partial<AssistantConfig>
): AssistantConfig {
  const out = { ...current };
  for (const [key, val] of Object.entries(partial) as [keyof AssistantConfig, unknown][]) {
    if (val !== undefined) (out as Record<string, unknown>)[key as string] = val;
  }
  return out;
}

function rowToConfig(row?: ConfigRow): AssistantConfig {
  const defaults = defaultAssistantConfig();
  if (!row) return defaults;
  return {
    assistantName: row.assistant_name ?? undefined,
    systemPrompt: row.system_prompt ?? undefined,
    provider: row.provider,
    baseUrl: row.base_url,
    ollamaUrl: row.ollama_url ?? row.base_url,
    llmModel: row.llm_model,
    embeddingModel: row.embedding_model,
    temperature: row.temperature,
    topP: row.top_p,
    maxTokens: row.max_tokens,
  };
}

export async function readConfig(assistantId = DEFAULT_ASSISTANT_ID): Promise<AssistantConfig> {
  const db = getDb();
  ensureConfigRow(assistantId);
  const row = db
    .prepare(
      `
        SELECT assistant_name, system_prompt, provider, base_url, ollama_url,
               llm_model, embedding_model, temperature, top_p, max_tokens
          FROM assistant_config
         WHERE assistant_id = ?
      `
    )
    .get(assistantId) as ConfigRow | undefined;
  return rowToConfig(row);
}

export async function writeConfig(
  partial: Partial<AssistantConfig>,
  assistantId = DEFAULT_ASSISTANT_ID
): Promise<AssistantConfig> {
  const db = getDb();
  ensureConfigRow(assistantId);
  const current = await readConfig(assistantId);
  const next = mergePartialConfig(current, partial);
  if (partial.baseUrl !== undefined || partial.ollamaUrl !== undefined) {
    const url = partial.baseUrl ?? partial.ollamaUrl ?? next.baseUrl;
    next.baseUrl = url.replace(/\/$/, "");
    if (next.provider === "ollama") {
      next.ollamaUrl = next.baseUrl;
    }
  }
  db.prepare(
    `
      UPDATE assistant_config
         SET assistant_name = ?,
             system_prompt = ?,
             provider = ?,
             base_url = ?,
             ollama_url = ?,
             llm_model = ?,
             embedding_model = ?,
             temperature = ?,
             top_p = ?,
             max_tokens = ?,
             updated_at = ?
       WHERE assistant_id = ?
    `
  ).run(
    next.assistantName ?? null,
    next.systemPrompt ?? null,
    next.provider,
    next.baseUrl,
    next.ollamaUrl ?? next.baseUrl,
    next.llmModel,
    next.embeddingModel,
    next.temperature,
    next.topP,
    next.maxTokens,
    dbNowIso(),
    assistantId
  );
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
