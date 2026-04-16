import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/store/configStore";
import { configPutSchema } from "@/lib/api/schemas";
import { jsonError } from "@/lib/api/errors";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withApiLogging(request, async () => {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistant_id")?.trim() || "default";
    try {
      const config = await readConfig(assistantId);
      return NextResponse.json({ assistant_id: assistantId, ...config });
    } catch (e) {
      return jsonError(
        500,
        "CONFIG_READ_FAILED",
        e instanceof Error ? e.message : "Failed to read config"
      );
    }
  });
}

export async function PUT(request: Request) {
  return withApiLogging(request, async () => {
    const json = await request.json().catch(() => ({}));
    const parsed = configPutSchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(400, "INVALID_CONFIG_BODY", "Invalid config payload", parsed.error.flatten());
    }
    const body = parsed.data;
    const assistantId = body.assistant_id;
    const partial = {
      assistantName: body.assistantName ?? body.assistant_name,
      systemPrompt: body.systemPrompt ?? body.system_prompt,
      provider: body.provider,
      baseUrl: body.baseUrl ?? body.base_url,
      ollamaUrl: body.ollamaUrl,
      llmModel: body.llmModel ?? body.model,
      embeddingModel: body.embeddingModel ?? body.embedding_model,
      temperature: body.temperature,
      topP: body.topP ?? body.top_p,
      maxTokens: body.maxTokens ?? body.max_tokens,
    };
    try {
      const next = await writeConfig(partial, assistantId);
      return NextResponse.json({ assistant_id: assistantId, ...next });
    } catch (e) {
      return jsonError(
        500,
        "CONFIG_WRITE_FAILED",
        e instanceof Error ? e.message : "Failed to write config"
      );
    }
  });
}
