/**
 * LiveAvatar embed session — see https://docs.liveavatar.com/
 * Quickstart: POST /v2/embeddings returns a short-lived iframe URL (data.url).
 */
const LIVEAVATAR_API = "https://api.liveavatar.com";

function parseLiveAvatarError(json: Record<string, unknown>, status: number): string {
  if (typeof json.message === "string" && json.message.trim()) return json.message;
  const err = json.error;
  if (typeof err === "string") return err;
  return `Request failed (${status})`;
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

/**
 * Creates an embed session and returns the iframe URL from `data.url`.
 * The optional `text` from chat is not sent here — the embed runs the LiveAvatar
 * session; use FULL/LITE APIs separately if you need to drive speech from your LLM.
 */
export async function createLiveAvatarEmbed(params: {
  apiKey: string;
  avatarId: string;
  contextId: string;
  isSandbox: boolean;
}): Promise<LiveAvatarEmbedResult> {
  const res = await fetch(`${LIVEAVATAR_API}/v2/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": params.apiKey.trim(),
    },
    body: JSON.stringify({
      avatar_id: params.avatarId,
      context_id: params.contextId,
      is_sandbox: params.isSandbox,
    }),
  });

  const json = await readJsonSafe(res);

  if (!res.ok) {
    const detail = parseLiveAvatarError(json, res.status);
    throw new Error(
      res.status === 401 || res.status === 403
        ? `LiveAvatar rejected the API key (${res.status}): ${detail}. Get a key at https://app.liveavatar.com (developers).`
        : `LiveAvatar /v2/embeddings (${res.status}): ${detail}`
    );
  }

  const code = json.code;
  if (code !== undefined && code !== 1000) {
    throw new Error(
      typeof json.message === "string"
        ? json.message
        : `LiveAvatar error (code ${String(code)})`
    );
  }

  const data = json.data as { url?: string; script?: string } | undefined;
  const streamUrl = data?.url;
  if (!streamUrl || typeof streamUrl !== "string") {
    throw new Error("LiveAvatar response missing data.url — check avatar_id and context_id.");
  }

  return { streamUrl, raw: json };
}
