import { NextResponse } from "next/server";
import { avatarBodySchema } from "@/lib/api/schemas";
import { createAvatarSession } from "@/lib/services/avatarService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = avatarBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const out = await createAvatarSession({
      text: parsed.data.text,
      liveAvatarApiKey: parsed.data.liveAvatarApiKey,
      heygenApiKey: parsed.data.heygenApiKey,
      avatarId: parsed.data.avatarId,
      contextId: parsed.data.contextId,
      isSandbox: parsed.data.isSandbox,
    });
    return NextResponse.json({
      sessionId: out.sessionId,
      streamUrl: out.streamUrl,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Avatar request failed" },
      { status: 502 }
    );
  }
}
