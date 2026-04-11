import { NextResponse } from "next/server";
import { after } from "next/server";
import { readConfig } from "@/lib/store/configStore";
import { reindexAll } from "@/lib/services/ragService";

export const runtime = "nodejs";

export async function POST() {
  after(async () => {
    const config = await readConfig();
    await reindexAll(config);
  });
  return NextResponse.json({ ok: true, status: "started" });
}
