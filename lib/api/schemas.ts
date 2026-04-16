import { z } from "zod";

export const llmProviderSchema = z.enum(["ollama", "lmstudio", "localai"]);

const nonEmpty = z.string().min(1);

export const assistantScopedQuerySchema = z.object({
  assistant_id: z.string().min(1),
});

export const assistantCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const chatBodySchema = z.object({
  assistant_id: z.string().min(1).default("default"),
  query: z.string().optional(),
  message: z.string().optional(),
  messages: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .optional(),
  stream: z.boolean().optional(),
});

export const modelsPostSchema = z.object({
  provider: llmProviderSchema,
  base_url: z.string().min(1),
});

export const configPutSchema = z
  .object({
    /** Coerce "" so clients that send blank (e.g. cleared localStorage) still validate. */
    assistant_id: z
      .string()
      .default("default")
      .transform((s) => s.trim() || "default"),
    assistantName: z.string().optional(),
    assistant_name: z.string().optional(),
    systemPrompt: z.string().optional(),
    system_prompt: z.string().optional(),
    provider: llmProviderSchema.optional(),
    baseUrl: z.string().optional(),
    base_url: z.string().optional(),
    model: z.string().optional(),
    ollamaUrl: z.string().optional(),
    llmModel: z.string().optional(),
    embedding_model: z.string().optional(),
    embeddingModel: z.string().optional(),
    temperature: z.number().optional(),
    topP: z.number().optional(),
    top_p: z.number().optional(),
    maxTokens: z.number().optional(),
    max_tokens: z.number().optional(),
  })
  .passthrough();

export const liveAvatarContextsBodySchema = z.object({
  apiKey: z.string().min(1),
});

export const liveAvatarVoicesBodySchema = z.object({
  apiKey: z.string().min(1),
});

export const avatarBodySchema = z.object({
  /** HeyGen: empty = session/iframe only (no streaming.task). LiveAvatar ignores text for embed. */
  text: z.string().default(""),
  provider: z.enum(["liveavatar", "heygen"]).optional(),
  /** LiveAvatar: https://docs.liveavatar.com/ */
  liveAvatarApiKey: z.string().optional(),
  heygenApiKey: z.string().optional(),
  avatarId: z.string().optional(),
  voiceId: z.string().optional(),
  contextId: z.string().optional(),
  isSandbox: z.boolean().optional(),
});

export const modelsConnectSchema = z.object({
  provider: llmProviderSchema,
  base_url: nonEmpty,
});

export const ttsBodySchema = z.object({
  text: z.string().min(1),
  provider: z.enum(["elevenlabs"]),
  voiceId: z.string().optional(),
});
