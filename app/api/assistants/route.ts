import { NextResponse } from "next/server";
import { assistantCreateSchema } from "@/lib/api/schemas";
import { jsonError } from "@/lib/api/errors";
import { createAssistant, listAssistants } from "@/lib/store/assistantsStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const assistants = await listAssistants();
    return NextResponse.json({ assistants });
  } catch (e) {
    return jsonError(
      500,
      "ASSISTANTS_LIST_FAILED",
      e instanceof Error ? e.message : "Failed to list assistants"
    );
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = assistantCreateSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, "INVALID_ASSISTANT_BODY", "Invalid assistant payload", parsed.error.flatten());
  }
  try {
    const assistant = await createAssistant(
      parsed.data.name.trim(),
      parsed.data.description?.trim() ?? ""
    );
    return NextResponse.json({ assistant }, { status: 201 });
  } catch (e) {
    return jsonError(
      500,
      "ASSISTANT_CREATE_FAILED",
      e instanceof Error ? e.message : "Failed to create assistant"
    );
  }
}
