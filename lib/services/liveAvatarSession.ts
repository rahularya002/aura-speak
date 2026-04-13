/**
 * LiveAvatar embed session — see https://docs.liveavatar.com/
 * Quickstart: POST /v2/embeddings returns a short-lived iframe URL (data.url).
 */
const LIVEAVATAR_API = "https://api.liveavatar.com";

/** Thrown when LiveAvatar returns a non-2xx or unusable body; `httpStatus` is the upstream status. */
export class LiveAvatarHttpError extends Error {
  readonly httpStatus: number;

  constructor(httpStatus: number, message: string) {
    super(message);
    this.name = "LiveAvatarHttpError";
    this.httpStatus = httpStatus;
  }
}

function parseLiveAvatarError(json: Record<string, unknown>, status: number): string {
  const parts: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  };

  push(json.message);

  const detail = json.detail;
  if (typeof detail === "string") push(detail);
  else if (Array.isArray(detail)) {
    for (const item of detail) {
      if (item && typeof item === "object" && "msg" in item) {
        push((item as { msg?: unknown }).msg);
      }
    }
  }

  const err = json.error;
  if (typeof err === "string") push(err);
  else if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    push(o.message);
    push(o.detail);
  }

  push(json.msg);

  if (parts.length > 0) {
    return [...new Set(parts)].join(" — ");
  }
  return `HTTP ${status} (no message body)`;
}

async function readJsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export interface LiveAvatarEmbedResult {
  streamUrl: string;
  raw?: unknown;
}

/** POST /v2/embeddings body — see Create Embed V2 in LiveAvatar OpenAPI. */
function buildEmbeddingsBody(params: {
  avatarId: string;
  contextId: string;
  voiceId?: string;
  isSandbox: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    avatar_id: params.avatarId,
    context_id: params.contextId,
    is_sandbox: params.isSandbox,
  };
  if (params.voiceId?.trim()) {
    body.voice_id = params.voiceId.trim();
  }
  const rawMax = process.env.LIVEAVATAR_MAX_SESSION_DURATION_SECONDS?.trim();
  if (rawMax && /^\d+$/.test(rawMax)) {
    const n = parseInt(rawMax, 10);
    if (n > 0) {
      body.max_session_duration = n;
    }
  }
  return body;
}

/**
 * Creates an embed session and returns the iframe URL from `data.url`.
 * The optional `text` from chat is not sent here — the embed runs the LiveAvatar
 * session; use FULL/LITE APIs separately if you need to drive speech from your LLM.
 */
export async function createLiveAvatarEmbed(params: {
  apiKey: string;
  avatarId: string;
  contextId: string;
  voiceId?: string;
  isSandbox: boolean;
}): Promise<LiveAvatarEmbedResult> {
  const res = await fetch(`${LIVEAVATAR_API}/v2/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": params.apiKey.trim(),
    },
    body: JSON.stringify(buildEmbeddingsBody(params)),
  });

  const json = await readJsonSafe(res);

  if (!res.ok) {
    const detail = parseLiveAvatarError(json, res.status);
    const msg =
      res.status === 401 || res.status === 403
        ? `LiveAvatar rejected the API key (${res.status}): ${detail}. Get a key at https://app.liveavatar.com (developers).`
        : `LiveAvatar /v2/embeddings (${res.status}): ${detail}`;
    throw new LiveAvatarHttpError(res.status, msg);
  }

  const code = json.code;
  if (code !== undefined && code !== 1000) {
    throw new LiveAvatarHttpError(
      502,
      typeof json.message === "string"
        ? json.message
        : `LiveAvatar error (code ${String(code)})`
    );
  }

  const data = json.data as { url?: string; script?: string } | undefined;
  const streamUrl = data?.url;
  if (!streamUrl || typeof streamUrl !== "string") {
    throw new LiveAvatarHttpError(
      502,
      "LiveAvatar response missing data.url — check avatar_id and context_id."
    );
  }

  return { streamUrl, raw: json };
}
