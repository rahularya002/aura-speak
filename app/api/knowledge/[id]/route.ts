import { NextResponse } from "next/server";
import { removeDocument } from "@/lib/store/vectorStore";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await removeDocument(id);
  return new NextResponse(null, { status: 204 });
}
