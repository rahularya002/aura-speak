import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { readConfig } from "@/lib/store/configStore";
import { fetchWithTimeout } from "@/lib/providers/util";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withApiLogging(request, async () => {
    let ollama = false;
    let lmstudio = false;
    let db: "connected" | "disconnected" = "disconnected";
    try {
      getDb();
      db = "connected";
    } catch {
      db = "disconnected";
    }

    try {
      const config = await readConfig("default");
      const base = (config.baseUrl || config.ollamaUrl || "http://localhost:11434").replace(/\/$/, "");
      const res = await fetchWithTimeout(`${base}/api/tags`, { method: "GET" }, 10_000);
      ollama = res.ok;
    } catch {
      ollama = false;
    }
    try {
      const lmstudioBase = (process.env.LMSTUDIO_HEALTH_URL || "http://127.0.0.1:1234").replace(
        /\/$/,
        ""
      );
      const res = await fetchWithTimeout(`${lmstudioBase}/v1/models`, { method: "GET" }, 10_000);
      lmstudio = res.ok;
    } catch {
      lmstudio = false;
    }

    return NextResponse.json({
      status: "ok",
      providers: { ollama, lmstudio },
      db,
    });
  });
}
