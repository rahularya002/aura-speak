const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const TTS_TIMEOUT_MS = 30_000;

export async function textToSpeech(
  apiKey: string,
  text: string,
  voiceId?: string
): Promise<ArrayBuffer> {
  const voice = (voiceId || DEFAULT_VOICE_ID).trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true,
          speed: 0.98,
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`ElevenLabs TTS failed (${res.status})${msg ? `: ${msg}` : ""}`);
    }
    return res.arrayBuffer();
  } finally {
    clearTimeout(timeout);
  }
}
