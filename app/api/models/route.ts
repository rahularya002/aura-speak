import { NextResponse } from "next/server";
import { readConfig, splitModelsForUi } from "@/lib/store/configStore";
import { modelsPostSchema } from "@/lib/api/schemas";
import { fetchModelsForProvider } from "@/lib/services/modelsService";
import { jsonError } from "@/lib/api/errors";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withApiLogging(request, async () => {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistant_id")?.trim() || "default";
    const config = await readConfig(assistantId);
    const baseUrl = config.baseUrl || config.ollamaUrl || "http://localhost:11434";
    try {
      const names = await fetchModelsForProvider(config.provider, baseUrl);
      const { llm, embedding } = splitModelsForUi(names);
      return NextResponse.json({ assistant_id: assistantId, llm, embedding, models: names });
    } catch (e) {
      return jsonError(
        502,
        "MODELS_FETCH_FAILED",
        e instanceof Error ? e.message : "Failed to list models",
        { llm: [], embedding: [] }
      );
    }
  });
}

export async function POST(request: Request) {
  return withApiLogging(request, async () => {
    const json = await request.json().catch(() => ({}));
    const parsed = modelsPostSchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(400, "INVALID_MODELS_BODY", "Invalid models payload", parsed.error.flatten());
    }
    const { provider, base_url } = parsed.data;
    try {
      const models = await fetchModelsForProvider(provider, base_url);
      return NextResponse.json({ models });
    } catch (e) {
      return jsonError(
        502,
        "MODELS_FETCH_FAILED",
        e instanceof Error ? e.message : "Failed to list models"
      );
    }
  });
}
