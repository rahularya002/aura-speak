import type { LLMProvider } from "@/lib/types/ai";
import * as ollama from "@/lib/providers/ollama";
import * as lmstudio from "@/lib/providers/lmstudio";
import * as localai from "@/lib/providers/localai";
import { isRetriableError } from "@/lib/providers/util";

export interface GenerateParams {
  provider: LLMProvider;
  baseUrl: string;
  model: string;
  prompt: string;
  messages?: { role: string; content: string }[];
  stream: boolean;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export type GenerateResult =
  | { mode: "text"; text: string }
  | { mode: "stream"; stream: ReadableStream<Uint8Array> };

function buildMessages(prompt: string, extra?: { role: string; content: string }[]) {
  if (extra?.length) return extra;
  return [{ role: "user", content: prompt }];
}

async function* mergeStreams(
  gen: AsyncGenerator<string>
): AsyncGenerator<string> {
  for await (const t of gen) {
    if (t) yield t;
  }
}

async function withRetryOnce<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (first) {
    if (!isRetriableError(first)) throw first;
  }
  return task();
}

export async function generateResponse(params: GenerateParams): Promise<GenerateResult> {
  const { provider, baseUrl, model, prompt, messages, stream, temperature, topP, maxTokens } =
    params;
  if (!model) throw new Error("LLM model is not configured");
  const msgs = buildMessages(prompt, messages);
  const opts = { temperature, topP, maxTokens };

  if (!stream) {
    const text = await withRetryOnce(async () => {
      switch (provider) {
        case "ollama":
          return ollama.chatComplete(baseUrl, model, msgs, opts);
        case "lmstudio":
          return lmstudio.chatComplete(baseUrl, model, msgs, opts);
        case "localai":
          return localai.chatComplete(baseUrl, model, msgs, opts);
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    });
    return { mode: "text", text };
  }

  const gen = await withRetryOnce(async () => {
    switch (provider) {
      case "ollama":
        return ollama.streamChat(baseUrl, model, msgs, opts);
      case "lmstudio":
        return lmstudio.streamChat(baseUrl, model, msgs, opts);
      case "localai":
        return localai.streamChat(baseUrl, model, msgs, opts);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  });

  const encoder = new TextEncoder();
  const streamOut = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const token of mergeStreams(gen)) {
          controller.enqueue(encoder.encode(token));
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
  return { mode: "stream", stream: streamOut };
}
