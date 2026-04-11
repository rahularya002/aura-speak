import type { LLMProvider } from "@/lib/types/ai";
import * as ollama from "@/lib/providers/ollama";
import * as lmstudio from "@/lib/providers/lmstudio";
import * as localai from "@/lib/providers/localai";

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

export async function generateResponse(params: GenerateParams): Promise<GenerateResult> {
  const { provider, baseUrl, model, prompt, messages, stream, temperature, topP, maxTokens } =
    params;
  if (!model) throw new Error("LLM model is not configured");
  const msgs = buildMessages(prompt, messages);
  const opts = { temperature, topP, maxTokens };

  if (!stream) {
    let text: string;
    switch (provider) {
      case "ollama":
        text = await ollama.chatComplete(baseUrl, model, msgs, opts);
        break;
      case "lmstudio":
        text = await lmstudio.chatComplete(baseUrl, model, msgs, opts);
        break;
      case "localai":
        text = await localai.chatComplete(baseUrl, model, msgs, opts);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    return { mode: "text", text };
  }

  let gen: AsyncGenerator<string>;
  switch (provider) {
    case "ollama":
      gen = ollama.streamChat(baseUrl, model, msgs, opts);
      break;
    case "lmstudio":
      gen = lmstudio.streamChat(baseUrl, model, msgs, opts);
      break;
    case "localai":
      gen = localai.streamChat(baseUrl, model, msgs, opts);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

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
