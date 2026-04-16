import { textToSpeech } from "@/lib/providers/elevenlabs";
import { shapeSpeechText } from "@/lib/text/speech";

type TtsProvider = "elevenlabs";

export async function generateSpeech(args: {
  provider: TtsProvider;
  text: string;
  voiceId?: string;
}): Promise<ArrayBuffer> {
  const { provider, text, voiceId } = args;
  if (provider !== "elevenlabs") {
    throw new Error(`Unsupported TTS provider: ${provider}`);
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }
  const spokenText = shapeSpeechText(text, { maxSentences: 4, maxChars: 500 });
  return textToSpeech(apiKey, spokenText || text, voiceId);
}
