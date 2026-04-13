import { NextResponse } from "next/server";
import { modelsConnectSchema } from "@/lib/api/schemas";
import { fetchModelsForProvider } from "@/lib/services/modelsService";
import { jsonError } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = modelsConnectSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, "INVALID_MODELS_CONNECT_BODY", "Invalid models/connect payload", parsed.error.flatten());
  }
  const { provider, base_url } = parsed.data;
  try {
    const models = await fetchModelsForProvider(provider, base_url);
    return NextResponse.json({ models });
  } catch (e) {
    return jsonError(
      502,
      "MODELS_CONNECT_FAILED",
      e instanceof Error ? e.message : "Failed to list models"
    );
  }
}
