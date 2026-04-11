import { NextResponse } from "next/server";
import { readConfig } from "@/lib/store/configStore";
import { chatBodySchema } from "@/lib/api/schemas";
import { generateResponse } from "@/lib/services/llmService";
import { retrieveContext } from "@/lib/services/ragService";
import type { AssistantConfig } from "@/lib/types/ai";

export const runtime = "nodejs";

function buildMessages(
  config: AssistantConfig,
  query: string,
  context: string,
  clientMessages?: { role: string; content: string }[]
): { role: string; content: string }[] {
  if (clientMessages?.length) {
    const systemParts = [config.systemPrompt, context && `Relevant knowledge:\n${context}`].filter(
      Boolean
    ) as string[];
    const sys = systemParts.join("\n\n");
    if (sys) {
      return [{ role: "system", content: sys }, ...clientMessages];
    }
    return clientMessages;
  }
  const systemParts = [config.systemPrompt, context && `Relevant knowledge:\n${context}`].filter(
    Boolean
  ) as string[];
  const system = systemParts.join("\n\n");
  const messages: { role: string; content: string }[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: query });
  return messages;
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = chatBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const config = await readConfig();
  const baseUrl = config.baseUrl || config.ollamaUrl || "http://localhost:11434";

  const { context, sources } = await retrieveContext(body.query, config);
  const messages = buildMessages(config, body.query, context, body.messages);

  const genParams = {
    provider: config.provider,
    baseUrl,
    model: config.llmModel,
    prompt: body.query,
    messages,
    stream: Boolean(body.stream),
    temperature: config.temperature,
    topP: config.topP,
    maxTokens: config.maxTokens,
  };

  if (!body.stream) {
    const result = await generateResponse(genParams);
    if (result.mode !== "text") {
      return NextResponse.json({ error: "Expected non-streaming response" }, { status: 500 });
    }
    return NextResponse.json({ answer: result.text, sources: sources.map((s) => s.name) });
  }

  const result = await generateResponse({ ...genParams, stream: true });
  if (result.mode !== "stream") {
    return NextResponse.json({ error: "Expected streaming response" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const tokenStream = result.stream;
  const sourcePayload = sources.map((s) => ({ id: s.id, name: s.name, snippet: s.snippet }));

  const sse = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const reader = tokenStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", t: chunk })}\n\n`)
            );
          }
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources: sourcePayload })}\n\n`)
        );
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(sse, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
