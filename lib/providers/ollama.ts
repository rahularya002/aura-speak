import { normalizeBaseUrl } from "@/lib/providers/util";

export async function listModels(baseUrl: string): Promise<string[]> {
  const u = normalizeBaseUrl(baseUrl);
  const res = await fetch(`${u}/api/tags`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Ollama /api/tags: ${res.status}`);
  const data = (await res.json()) as { models?: { name: string }[] };
  return (data.models ?? []).map((m) => m.name);
}

export async function embedBatch(
  baseUrl: string,
  model: string,
  inputs: string[]
): Promise<number[][]> {
  const u = normalizeBaseUrl(baseUrl);
  if (inputs.length === 0) return [];

  const tryBatch = async (input: string | string[]) => {
    const res = await fetch(`${u}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      embedding?: number[];
      embeddings?: number[][];
    };
    if (data.embeddings?.length) return data.embeddings;
    if (data.embedding) return inputs.length === 1 ? [data.embedding] : null;
    return null;
  };

  const batched = await tryBatch(inputs);
  if (batched && batched.length === inputs.length) return batched;

  const out: number[][] = [];
  for (const input of inputs) {
    const row = await tryBatch(input);
    if (!row?.[0]) throw new Error("Ollama embeddings failed");
    out.push(row[0]);
  }
  return out;
}

export async function chatComplete(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  opts: { temperature: number; topP: number; maxTokens: number }
): Promise<string> {
  const u = normalizeBaseUrl(baseUrl);
  const res = await fetch(`${u}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: opts.temperature,
        top_p: opts.topP,
        num_predict: opts.maxTokens,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama chat: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

export async function* streamChat(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  opts: { temperature: number; topP: number; maxTokens: number }
): AsyncGenerator<string> {
  const u = normalizeBaseUrl(baseUrl);
  const res = await fetch(`${u}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        temperature: opts.temperature,
        top_p: opts.topP,
        num_predict: opts.maxTokens,
      },
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Ollama stream: ${res.status}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  /** Full assistant text assembled so far (Ollama may send cumulative *or* delta chunks). */
  let acc = "";

  const emitChunk = (c: string) => {
    if (!c) return;
    if (acc.length === 0) {
      acc = c;
      return c;
    }
    if (c.startsWith(acc)) {
      const piece = c.slice(acc.length);
      acc = c;
      return piece;
    }
    acc += c;
    return c;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const j = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
        const c = j.message?.content ?? "";
        const out = emitChunk(c);
        if (out) yield out;
      } catch {
        /* skip bad line */
      }
    }
  }
  const tail = buf.trim();
  if (tail) {
    try {
      const j = JSON.parse(tail) as { message?: { content?: string } };
      const c = j.message?.content ?? "";
      const out = emitChunk(c);
      if (out) yield out;
    } catch {
      /* ignore */
    }
  }
}
