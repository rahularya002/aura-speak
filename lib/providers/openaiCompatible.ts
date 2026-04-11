import { normalizeBaseUrl } from "@/lib/providers/util";

/** LM Studio, LocalAI, and other OpenAI-compatible servers. */
export async function listModels(baseUrl: string): Promise<string[]> {
  const u = normalizeOpenAI(baseUrl);
  const res = await fetch(`${u}/models`, { cache: "no-store" });
  if (!res.ok) throw new Error(`OpenAI-compatible /models: ${res.status}`);
  const data = (await res.json()) as { data?: { id: string }[] };
  return (data.data ?? []).map((m) => m.id);
}

export async function embedBatch(
  baseUrl: string,
  model: string,
  inputs: string[]
): Promise<number[][]> {
  const u = normalizeOpenAI(baseUrl);
  const res = await fetch(`${u}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: inputs }),
  });
  if (!res.ok) throw new Error(`OpenAI-compatible embeddings: ${res.status}`);
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}

export async function chatComplete(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  opts: { temperature: number; topP: number; maxTokens: number }
): Promise<string> {
  const u = normalizeOpenAI(baseUrl);
  const res = await fetch(`${u}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: opts.temperature,
      top_p: opts.topP,
      max_tokens: opts.maxTokens,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI-compatible chat: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string }; text?: string }[];
  };
  const ch = data.choices?.[0];
  return ch?.message?.content ?? ch?.text ?? "";
}

export async function* streamChat(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  opts: { temperature: number; topP: number; maxTokens: number }
): AsyncGenerator<string> {
  const u = normalizeOpenAI(baseUrl);
  const res = await fetch(`${u}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: opts.temperature,
      top_p: opts.topP,
      max_tokens: opts.maxTokens,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`OpenAI-compatible stream: ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const block of parts) {
      const line = block
        .split("\n")
        .find((l) => l.startsWith("data: "));
      if (!line) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const j = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const piece = j.choices?.[0]?.delta?.content;
        if (piece) yield piece;
      } catch {
        /* ignore */
      }
    }
  }
}

function normalizeOpenAI(baseUrl: string): string {
  const n = normalizeBaseUrl(baseUrl);
  return n.endsWith("/v1") ? n : `${n}/v1`;
}
