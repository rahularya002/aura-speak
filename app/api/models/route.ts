import { NextResponse } from "next/server";
import { readConfig, splitModelsForUi } from "@/lib/store/configStore";
import { modelsPostSchema } from "@/lib/api/schemas";
import { fetchModelsForProvider } from "@/lib/services/modelsService";

export const runtime = "nodejs";

export async function GET() {
  const config = await readConfig();
  const baseUrl = config.baseUrl || config.ollamaUrl || "http://localhost:11434";
  try {
    const names = await fetchModelsForProvider(config.provider, baseUrl);
    const { llm, embedding } = splitModelsForUi(names);
    return NextResponse.json({ llm, embedding, models: names });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list models", llm: [], embedding: [] },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = modelsPostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { provider, base_url } = parsed.data;
  try {
    const models = await fetchModelsForProvider(provider, base_url);
    return NextResponse.json({ models });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list models" },
      { status: 502 }
    );
  }
}
