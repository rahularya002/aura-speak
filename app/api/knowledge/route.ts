import { NextResponse } from "next/server";
import { readConfig } from "@/lib/store/configStore";
import { listDocuments } from "@/lib/store/vectorStore";
import { ingestDocumentBuffer } from "@/lib/services/ragService";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const docs = await listDocuments();
  return NextResponse.json(docs);
}

export async function POST(request: Request) {
  const config = await readConfig();
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const doc = await ingestDocumentBuffer(config, buf, file.name, file.type || "application/octet-stream");
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ingest failed" },
      { status: 500 }
    );
  }
}
