import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/store/configStore";
import { configPutSchema } from "@/lib/api/schemas";

export const runtime = "nodejs";

export async function GET() {
  const config = await readConfig();
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = configPutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const next = await writeConfig(parsed.data);
  return NextResponse.json(next);
}
