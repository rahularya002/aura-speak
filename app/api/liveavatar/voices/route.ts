import { NextResponse } from "next/server";
import { liveAvatarVoicesBodySchema } from "@/lib/api/schemas";
import { jsonError } from "@/lib/api/errors";
import { fetchWithTimeout } from "@/lib/providers/util";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

type VoiceRecord = {
  id: string;
  name: string;
  language?: string;
  gender?: string;
  provider?: string;
};

function extractVoices(payload: unknown): VoiceRecord[] {
  if (!payload || typeof payload !== "object") return [];
  const candidates: Record<string, unknown>[] = [];
  const queue: unknown[] = [payload];
  let scanned = 0;
  while (queue.length > 0 && scanned < 5000) {
    const cur = queue.shift();
    scanned += 1;
    if (Array.isArray(cur)) {
      for (const item of cur) queue.push(item);
      continue;
    }
    if (!cur || typeof cur !== "object") continue;
    const obj = cur as Record<string, unknown>;
    const maybeId =
      (typeof obj.id === "string" && obj.id) ||
      (typeof obj.voice_id === "string" && obj.voice_id) ||
      (typeof obj.provider_voice_id === "string" && obj.provider_voice_id) ||
      "";
    if (maybeId) candidates.push(obj);
    for (const value of Object.values(obj)) {
      if (value && (Array.isArray(value) || typeof value === "object")) {
        queue.push(value);
      }
    }
  }
  const out: VoiceRecord[] = [];
  for (const v of candidates) {
    const id =
      (typeof v.id === "string" && v.id) ||
      (typeof v.voice_id === "string" && v.voice_id) ||
      (typeof v.provider_voice_id === "string" && v.provider_voice_id) ||
      "";
    if (!id) continue;
    const name =
      (typeof v.name === "string" && v.name) ||
      (typeof v.display_name === "string" && v.display_name) ||
      (typeof v.voice_name === "string" && v.voice_name) ||
      `Voice ${id.slice(0, 8)}`;
    const provider =
      (typeof v.provider === "string" && v.provider) ||
      (typeof v.source === "string" && v.source) ||
      (typeof v.voice_provider === "string" && v.voice_provider) ||
      undefined;
    out.push({
      id,
      name,
      language:
        (typeof v.language === "string" && v.language) ||
        (typeof v.locale === "string" && v.locale) ||
        undefined,
      gender: typeof v.gender === "string" ? v.gender : undefined,
      provider,
    });
  }
  const seen = new Set<string>();
  return out.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
}

async function fetchVoicePages(url: string, headers: Record<string, string>): Promise<VoiceRecord[]> {
  const all: VoiceRecord[] = [];
  for (let page = 1; page <= 4; page++) {
    const u = url.includes("{page}")
      ? url.replace("{page}", String(page))
      : page === 1
        ? url
        : `${url}${url.includes("?") ? "&" : "?"}page=${page}`;
    const res = await fetchWithTimeout(
      u,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
      15_000
    );
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const message =
        (typeof body.message === "string" && body.message) ||
        (typeof body.error === "string" && body.error) ||
        `Voice list failed (${res.status})`;
      throw { status: res.status, message };
    }
    const voices = extractVoices(body);
    if (voices.length === 0) break;
    all.push(...voices);
    const maybeTotal =
      (body.data && typeof body.data === "object" && "count" in (body.data as Record<string, unknown>)
        ? Number((body.data as Record<string, unknown>).count)
        : NaN);
    if (Number.isFinite(maybeTotal) && all.length >= maybeTotal) break;
    if (voices.length < 20 && !u.includes("{page}")) break;
  }
  const seen = new Set<string>();
  return all.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
}

export async function POST(request: Request) {
  return withApiLogging(request, async () => {
    const json = await request.json().catch(() => ({}));
    const parsed = liveAvatarVoicesBodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(
        400,
        "INVALID_LIVEAVATAR_VOICES_BODY",
        "Invalid LiveAvatar voices payload",
        parsed.error.flatten()
      );
    }

    const apiKey = parsed.data.apiKey.trim();
    const attempts: Array<{
      url: string;
      headers: Record<string, string>;
    }> = [
      {
        url: "https://api.liveavatar.com/v1/voices?page={page}&page_size=200",
        headers: { "X-API-KEY": apiKey, Accept: "application/json" },
      },
      {
        url: "https://api.liveavatar.com/v1/voices",
        headers: { "X-API-KEY": apiKey, Accept: "application/json" },
      },
      {
        url: "https://api.heygen.com/v2/voices?include_third_party=true",
        headers: { "x-api-key": apiKey, Accept: "application/json" },
      },
      {
        url: "https://api.heygen.com/v2/voices",
        headers: { "x-api-key": apiKey, Accept: "application/json" },
      },
    ];

    let lastStatus = 502;
    let lastMessage = "Failed to list LiveAvatar voices";

    for (const attempt of attempts) {
      try {
        const voices = await fetchVoicePages(attempt.url, attempt.headers);
        if (voices.length > 0) {
          return NextResponse.json({ voices });
        }
        lastMessage = "Voices endpoint returned no voice records";
        continue;
      } catch (err) {
        const status =
          err && typeof err === "object" && "status" in err ? Number((err as { status?: number }).status) : 502;
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Failed to list LiveAvatar voices";
        lastStatus = status === 401 || status === 403 ? status : 502;
        lastMessage = message;
        continue;
      }
    }

    return jsonError(lastStatus, "LIVEAVATAR_VOICES_FAILED", lastMessage);
  });
}
