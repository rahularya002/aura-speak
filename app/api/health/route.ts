import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { readConfig } from "@/lib/store/configStore";

export const runtime = "nodejs";

export async function GET() {
  let ollama = false;
  let db = false;
  try {
    getDb();
    db = true;
  } catch {
    db = false;
  }

  try {
    const config = await readConfig("default");
    const base = (config.baseUrl || config.ollamaUrl || "http://localhost:11434").replace(/\/$/, "");
    const res = await fetch(`${base}/api/tags`, { method: "GET" });
    ollama = res.ok;
  } catch {
    ollama = false;
  }

  return NextResponse.json({
    status: "ok",
    providers: { ollama },
    db,
  });
}
