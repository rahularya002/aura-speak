import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { listChatHistory } from "@/lib/store/chatStore";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withApiLogging(request, async () => {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistant_id")?.trim();
    if (!assistantId) {
      return jsonError(400, "MISSING_ASSISTANT_ID", "assistant_id query param is required");
    }
    const limit = Number(searchParams.get("limit") ?? "100");
    const offset = Number(searchParams.get("offset") ?? "0");
    try {
      const history = await listChatHistory({
        assistantId,
        limit: Number.isFinite(limit) ? limit : 100,
        offset: Number.isFinite(offset) ? offset : 0,
      });
      return NextResponse.json({ history });
    } catch (e) {
      return jsonError(
        500,
        "CHAT_HISTORY_FAILED",
        e instanceof Error ? e.message : "Failed to load chat history"
      );
    }
  });
}
