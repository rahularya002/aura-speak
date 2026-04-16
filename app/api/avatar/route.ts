import { NextResponse } from "next/server";
import { avatarBodySchema } from "@/lib/api/schemas";
import { jsonError } from "@/lib/api/errors";
import { createAvatarSession } from "@/lib/services/avatarService";
import { LiveAvatarHttpError } from "@/lib/services/liveAvatarSession";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withApiLogging(request, async () => {
    const json = await request.json().catch(() => ({}));
    const parsed = avatarBodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(400, "INVALID_AVATAR_BODY", "Invalid avatar payload", parsed.error.flatten());
    }
    try {
      const out = await createAvatarSession({
        text: parsed.data.text,
        provider: parsed.data.provider,
        liveAvatarApiKey: parsed.data.liveAvatarApiKey,
        heygenApiKey: parsed.data.heygenApiKey,
        avatarId: parsed.data.avatarId,
        voiceId: parsed.data.voiceId,
        contextId: parsed.data.contextId,
        isSandbox: parsed.data.isSandbox,
      });
      return NextResponse.json({
        sessionId: out.sessionId,
        streamUrl: out.streamUrl,
      });
    } catch (e) {
      if (e instanceof LiveAvatarHttpError) {
        return NextResponse.json({
          fallback: "text-only",
        });
      }
      return NextResponse.json({
        fallback: "text-only",
      });
    }
  });
}
