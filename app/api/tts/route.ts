import { jsonError } from "@/lib/api/errors";
import { ttsBodySchema } from "@/lib/api/schemas";
import { generateSpeech } from "@/lib/services/ttsService";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withApiLogging(request, async () => {
    const body = await request.json().catch(() => ({}));
    const parsed = ttsBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "INVALID_TTS_BODY", "Invalid tts payload", parsed.error.flatten());
    }
    try {
      const audio = await generateSpeech({
        provider: parsed.data.provider,
        text: parsed.data.text,
        voiceId: parsed.data.voiceId,
      });
      return new Response(audio, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      return jsonError(
        502,
        "TTS_REQUEST_FAILED",
        e instanceof Error ? e.message : "Text-to-speech request failed"
      );
    }
  });
}
