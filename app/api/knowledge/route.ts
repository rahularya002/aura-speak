import { NextResponse } from "next/server";
import { readConfig } from "@/lib/store/configStore";
import { listDocuments } from "@/lib/store/vectorStore";
import { ingestDocumentBuffer } from "@/lib/services/ragService";
import { jsonError } from "@/lib/api/errors";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

function getAssistantId(request: Request): string {
  const { searchParams } = new URL(request.url);
  return searchParams.get("assistant_id")?.trim() || "default";
}

export async function GET(request: Request) {
  return withApiLogging(request, async () => {
    const assistantId = getAssistantId(request);
    try {
      const docs = await listDocuments(assistantId);
      return NextResponse.json(docs);
    } catch (e) {
      return jsonError(
        500,
        "KNOWLEDGE_LIST_FAILED",
        e instanceof Error ? e.message : "Failed to list documents"
      );
    }
  });
}

export async function POST(request: Request) {
  return withApiLogging(request, async () => {
    const formData = await request.formData();
    const assistantIdRaw = formData.get("assistant_id");
    const assistantId =
      (typeof assistantIdRaw === "string" ? assistantIdRaw.trim() : "") || "default";
    const config = await readConfig(assistantId);
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return jsonError(400, "MISSING_FILE", "Missing file field");
    }
    if (file.size > MAX_BYTES) {
      return jsonError(413, "FILE_TOO_LARGE", "File too large (max 10MB)");
    }
    const buf = Buffer.from(await file.arrayBuffer());
    try {
      const doc = await ingestDocumentBuffer(
        config,
        assistantId,
        buf,
        file.name,
        file.type || "application/octet-stream"
      );
      return NextResponse.json(doc);
    } catch (e) {
      return jsonError(
        500,
        "KNOWLEDGE_INGEST_FAILED",
        e instanceof Error ? e.message : "Ingest failed"
      );
    }
  });
}
