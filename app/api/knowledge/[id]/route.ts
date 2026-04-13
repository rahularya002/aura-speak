import { NextResponse } from "next/server";
import { removeDocument } from "@/lib/store/vectorStore";
import { jsonError } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const assistantId = searchParams.get("assistant_id")?.trim() || "default";
  if (!id) {
    return jsonError(400, "MISSING_DOCUMENT_ID", "Missing id");
  }
  await removeDocument(id, assistantId);
  return new NextResponse(null, { status: 204 });
}
