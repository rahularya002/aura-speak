import { z } from "zod";

export const llmProviderSchema = z.enum(["ollama", "lmstudio", "localai"]);

export const chatBodySchema = z.object({
  query: z.string().min(1),
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
    assistantName: z.string().optional(),
    systemPrompt: z.string().optional(),
    provider: llmProviderSchema.optional(),
    baseUrl: z.string().optional(),
    ollamaUrl: z.string().optional(),
    llmModel: z.string().optional(),
    embeddingModel: z.string().optional(),
    temperature: z.number().optional(),
    topP: z.number().optional(),
    maxTokens: z.number().optional(),
  })
  .passthrough();

export const liveAvatarContextsBodySchema = z.object({
  apiKey: z.string().min(1),
});

export const avatarBodySchema = z.object({
  text: z.string().min(1),
  /** LiveAvatar: https://docs.liveavatar.com/ */
  liveAvatarApiKey: z.string().optional(),
  heygenApiKey: z.string().optional(),
  avatarId: z.string().optional(),
  contextId: z.string().optional(),
  isSandbox: z.boolean().optional(),
});
