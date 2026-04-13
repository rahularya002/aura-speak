import { NextResponse } from "next/server";
import { after } from "next/server";
import { readConfig } from "@/lib/store/configStore";
import { reindexAll } from "@/lib/services/ragService";
import { jsonError } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const assistantId = searchParams.get("assistant_id")?.trim() || "default";
  if (!assistantId) {
    return jsonError(400, "MISSING_ASSISTANT_ID", "assistant_id is required");
  }
  after(async () => {
    const config = await readConfig(assistantId);
    await reindexAll(config, assistantId);
  });
  return NextResponse.json({ ok: true, status: "started", assistant_id: assistantId });
}
