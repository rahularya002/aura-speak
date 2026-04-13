import { NextResponse } from "next/server";
import { readConfig } from "@/lib/store/configStore";
import { chatBodySchema } from "@/lib/api/schemas";
import { jsonError } from "@/lib/api/errors";
import { generateResponse } from "@/lib/services/llmService";
import { retrieveContext } from "@/lib/services/ragService";
import { insertChatMessage, listChatHistory } from "@/lib/store/chatStore";
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
    return jsonError(400, "INVALID_CHAT_BODY", "Invalid chat payload", parsed.error.flatten());
  }
  const body = parsed.data;
  const assistantId = body.assistant_id || "default";
  const query = (body.message ?? body.query ?? "").trim();
  if (!query) {
    return jsonError(400, "MISSING_MESSAGE", "message or query is required");
  }
  const config = await readConfig(assistantId);
  const baseUrl = config.baseUrl || config.ollamaUrl || "http://localhost:11434";

  let serverHistory = body.messages;
  if (!serverHistory?.length) {
    const history = await listChatHistory({ assistantId, limit: 24, offset: 0 });
    serverHistory = history.map((m) => ({ role: m.role, content: m.content }));
  }
  const { context, sources } = await retrieveContext(query, config, assistantId);
  const messages = buildMessages(config, query, context, serverHistory);

  const genParams = {
    provider: config.provider,
    baseUrl,
    model: config.llmModel,
    prompt: query,
    messages,
    stream: Boolean(body.stream),
    temperature: config.temperature,
    topP: config.topP,
    maxTokens: config.maxTokens,
  };
  await insertChatMessage({ assistantId, role: "user", content: query });

  if (!body.stream) {
    try {
      const result = await generateResponse(genParams);
      if (result.mode !== "text") {
        return jsonError(500, "INVALID_CHAT_MODE", "Expected non-streaming response");
      }
      await insertChatMessage({
        assistantId,
        role: "assistant",
        content: result.text,
      });
      return NextResponse.json({
        answer: result.text,
        sources: sources.map((s) => s.name),
      });
    } catch (e) {
      return jsonError(
        502,
        "CHAT_GENERATION_FAILED",
        e instanceof Error ? e.message : "Chat generation failed"
      );
    }
  }

  let result;
  try {
    result = await generateResponse({ ...genParams, stream: true });
  } catch (e) {
    return jsonError(
      502,
      "CHAT_STREAM_INIT_FAILED",
      e instanceof Error ? e.message : "Failed to initialize stream"
    );
  }
  if (result.mode !== "stream") {
    return jsonError(500, "INVALID_CHAT_MODE", "Expected streaming response");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const tokenStream = result.stream;
  const sourcePayload = sources.map((s) => ({ id: s.id, name: s.name, snippet: s.snippet }));
  let fullAnswer = "";

  const sse = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const reader = tokenStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            fullAnswer += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", t: chunk })}\n\n`)
            );
          }
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources: sourcePayload })}\n\n`)
        );
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        await insertChatMessage({
          assistantId,
          role: "assistant",
          content: fullAnswer,
        });
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
