import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { deleteAssistant, getAssistantWithConfig } from "@/lib/store/assistantsStore";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return jsonError(400, "MISSING_ASSISTANT_ID", "Missing assistant id");
  try {
    const out = await getAssistantWithConfig(id);
    if (!out) return jsonError(404, "ASSISTANT_NOT_FOUND", "Assistant not found");
    return NextResponse.json(out);
  } catch (e) {
    return jsonError(
      500,
      "ASSISTANT_GET_FAILED",
      e instanceof Error ? e.message : "Failed to get assistant"
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return jsonError(400, "MISSING_ASSISTANT_ID", "Missing assistant id");
  try {
    const deleted = await deleteAssistant(id);
    if (!deleted) return jsonError(404, "ASSISTANT_NOT_FOUND", "Assistant not found");
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return jsonError(
      400,
      "ASSISTANT_DELETE_FAILED",
      e instanceof Error ? e.message : "Failed to delete assistant"
    );
  }
}
