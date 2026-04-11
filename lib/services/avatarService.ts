import { createLiveAvatarEmbed } from "@/lib/services/liveAvatarSession";
import { createHeyGenAvatarSession } from "@/lib/services/heygenAvatarSession";

export type CreateAvatarSessionParams = {
  /** Unused for LiveAvatar embed flow; used by HeyGen streaming.task. */
  text: string;
  liveAvatarApiKey?: string;
  heygenApiKey?: string;
  avatarId?: string;
  contextId?: string;
  /** LiveAvatar sandbox embed (no credits); default true unless LIVEAVATAR_SANDBOX=false */
  isSandbox?: boolean;
};

/**
 * Default: [LiveAvatar](https://docs.liveavatar.com/) `POST /v2/embeddings` → iframe `url`.
 * Set `AVATAR_BACKEND=heygen` to use legacy HeyGen Streaming API instead.
 */
export async function createAvatarSession(
  params: CreateAvatarSessionParams
): Promise<{ sessionId?: string; streamUrl?: string; raw?: unknown }> {
  if (process.env.AVATAR_BACKEND === "heygen") {
    return createHeyGenAvatarSession({
      text: params.text,
      heygenApiKey: params.heygenApiKey,
      avatarId: params.avatarId,
    });
  }

  const apiKey =
    params.liveAvatarApiKey?.trim() || process.env.LIVEAVATAR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "LiveAvatar API key missing. Add it in Avatar settings or set LIVEAVATAR_API_KEY. Keys: https://app.liveavatar.com (developers). Docs: https://docs.liveavatar.com/"
    );
  }

  const avatarId =
    (params.avatarId && params.avatarId !== "default" && params.avatarId.trim()) ||
    process.env.LIVEAVATAR_AVATAR_ID?.trim();
  if (!avatarId) {
    throw new Error(
      "LiveAvatar avatar_id required — set Avatar ID in settings or LIVEAVATAR_AVATAR_ID."
    );
  }

  const contextId =
    params.contextId?.trim() || process.env.LIVEAVATAR_CONTEXT_ID?.trim();
  if (!contextId) {
    throw new Error(
      "LiveAvatar context_id required — create a Context in the LiveAvatar console or set LIVEAVATAR_CONTEXT_ID. See https://docs.liveavatar.com/"
    );
  }

  const isSandbox =
    params.isSandbox ??
    (process.env.LIVEAVATAR_SANDBOX === "false" ? false : true);

  const { streamUrl, raw } = await createLiveAvatarEmbed({
    apiKey,
    avatarId,
    contextId,
    isSandbox,
  });

  return { streamUrl, raw };
}
