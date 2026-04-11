/**
 * Legacy HeyGen Streaming API — enable with AVATAR_BACKEND=heygen.
 * Migration: https://docs.liveavatar.com/ (HeyGen to LiveAvatar Migration)
 */
const HEYGEN_BASE = "https://api.heygen.com";

function parseHeyGenError(json: Record<string, unknown>, fallback: string): string {
  if (typeof json.message === "string" && json.message.trim()) return json.message;
  const err = json.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  if (typeof json.msg === "string") return json.msg;
  return fallback;
}

async function readJsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function findStreamUrl(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  const candidates = ["url", "stream_url", "streamUrl", "livekit_url", "webrtc_url", "session_url"];
  for (const k of candidates) {
    const v = o[k];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  for (const v of Object.values(o)) {
    const nested = findStreamUrl(v);
    if (nested) return nested;
  }
  return undefined;
}

function findSessionId(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  const keys = ["session_id", "sessionId", "id", "data"];
  for (const k of keys) {
    const v = o[k];
    if (k === "data" && v && typeof v === "object") {
      const sid = findSessionId(v);
      if (sid) return sid;
    }
    if (typeof v === "string" && v.length > 8) return v;
  }
  return undefined;
}

export async function createHeyGenAvatarSession(params: {
  text: string;
  heygenApiKey?: string;
  avatarId?: string;
}): Promise<{ sessionId?: string; streamUrl?: string; raw?: unknown }> {
  const apiKey = params.heygenApiKey?.trim() || process.env.HEYGEN_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("HeyGen API key missing (set HEYGEN_API_KEY or Avatar settings).");
  }

  const avatar_id =
    params.avatarId && params.avatarId !== "default"
      ? params.avatarId
      : process.env.HEYGEN_AVATAR_ID || undefined;

  const body: Record<string, unknown> = {
    quality: "medium",
    video_encoding: "H264",
    ...(avatar_id ? { avatar_id } : {}),
  };

  const res = await fetch(`${HEYGEN_BASE}/v1/streaming.new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = await readJsonSafe(res);

  if (!res.ok) {
    const detail = parseHeyGenError(json, res.statusText || "Request failed");
    throw new Error(
      res.status === 401 || res.status === 403
        ? `HeyGen rejected the API key (${res.status}): ${detail}.`
        : `HeyGen streaming.new (${res.status}): ${detail}`
    );
  }

  const data = (json.data ?? json) as Record<string, unknown>;
  let streamUrl = findStreamUrl(data) ?? findStreamUrl(json);
  const sessionId = findSessionId(data) ?? findSessionId(json);

  if (sessionId && params.text) {
    const taskRes = await fetch(`${HEYGEN_BASE}/v1/streaming.task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        session_id: sessionId,
        text: params.text,
      }),
    });
    const taskJson = await taskRes.json().catch(() => ({}));
    if (taskRes.ok) {
      streamUrl =
        findStreamUrl(taskJson) ??
        findStreamUrl((taskJson as { data?: unknown }).data) ??
        streamUrl;
    }
  }

  return {
    sessionId,
    streamUrl,
    raw: json,
  };
}
