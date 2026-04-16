import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/store/configStore";
import { configPutSchema } from "@/lib/api/schemas";
import { jsonError } from "@/lib/api/errors";
import { withApiLogging } from "@/lib/api/log";
import { defaultAssistantConfig, type AssistantConfig } from "@/lib/types/ai";

export const runtime = "nodejs";

function isStorageRuntimeError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const normalized = msg.toLowerCase();
  return (
    normalized.includes("readonly") ||
    normalized.includes("read-only") ||
    normalized.includes("permission denied") ||
    normalized.includes("sqlite_cantopen") ||
    normalized.includes("sqlitedb") ||
    normalized.includes("unable to open database file")
  );
}

function mergeConfigFallback(partial: Partial<AssistantConfig>): AssistantConfig {
  const base = defaultAssistantConfig();
  const out: AssistantConfig = { ...base, ...partial };
  if (partial.baseUrl || partial.ollamaUrl) {
    const url = (partial.baseUrl ?? partial.ollamaUrl ?? base.baseUrl).replace(/\/$/, "");
    out.baseUrl = url;
    if (out.provider === "ollama") out.ollamaUrl = url;
  }
  return out;
}

export async function GET(request: Request) {
  return withApiLogging(request, async () => {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistant_id")?.trim() || "default";
    try {
      const config = await readConfig(assistantId);
      return NextResponse.json({ assistant_id: assistantId, ...config });
    } catch (e) {
      if (isStorageRuntimeError(e)) {
        const config = defaultAssistantConfig();
        return NextResponse.json({
          assistant_id: assistantId,
          ...config,
          persistence: "ephemeral",
          warning: "Persistent config storage unavailable in this runtime",
        });
      }
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
      if (isStorageRuntimeError(e)) {
        const next = mergeConfigFallback(partial);
        return NextResponse.json({
          assistant_id: assistantId,
          ...next,
          persistence: "ephemeral",
          warning: "Config accepted but not persisted in this runtime",
        });
      }
      return jsonError(
        500,
        "CONFIG_WRITE_FAILED",
        e instanceof Error ? e.message : "Failed to write config"
      );
    }
  });
}
