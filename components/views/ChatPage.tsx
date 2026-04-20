"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ChatPanel, { type Message } from "@/components/ChatPanel";
import AvatarPanel, { type AvatarStatus } from "@/components/AvatarPanel";
import { askQuestionStream, generateSpeech, getConfig, triggerAvatar } from "@/services/api";
import { toast } from "sonner";
import { formatForSpeech, trimResponse } from "@/lib/utils/speechFormatter";

/** Avoid duplicate preload when React Strict Mode remounts (dev). */
let avatarPreloadStarted = false;
const AVATAR_INIT_DELAY_MS = 1000;
const AVATAR_RELOAD_COOLDOWN_MS = 1200;

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("idle");
  const [streamUrl, setStreamUrl] = useState<string>();
  /** Bumps when we need a fresh iframe even if the URL string repeats. */
  const [embedFrameKey, setEmbedFrameKey] = useState(0);
  const streamUrlRef = useRef<string>();
  const liveAvatarStartRef = useRef<Promise<boolean> | null>(null);
  const lastReloadAtRef = useRef(0);

  useEffect(() => {
    streamUrlRef.current = streamUrl;
  }, [streamUrl]);

  const maybePlayVoice = useCallback(async (text: string) => {
    const config = getConfig();
    if (!config.enableVoicePlayback || !text.trim()) return;
    try {
      const audioBlob = await generateSpeech(text, "elevenlabs", config.ttsVoiceId || undefined);
      const objectUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(objectUrl);
      audio.onended = () => URL.revokeObjectURL(objectUrl);
      audio.onerror = () => URL.revokeObjectURL(objectUrl);
      void audio.play();
    } catch {
      toast.warning("Voice playback unavailable");
    }
  }, []);

  const loadEmbed = useCallback(async (text = ""): Promise<boolean> => {
    const now = Date.now();
    if (liveAvatarStartRef.current) return liveAvatarStartRef.current;
    if (now - lastReloadAtRef.current < AVATAR_RELOAD_COOLDOWN_MS) {
      return Boolean(streamUrlRef.current);
    }
    lastReloadAtRef.current = now;

    const pending = (async () => {
      setAvatarStatus("connecting");
      try {
        const res = await triggerAvatar(text);
        if (res.fallback === "text-only") {
          setAvatarStatus("idle");
          toast.warning("Avatar unavailable. Continuing in text-only mode.");
          return false;
        }
        if (res.streamUrl) {
          setStreamUrl(res.streamUrl);
          setEmbedFrameKey((k) => k + 1);
          streamUrlRef.current = res.streamUrl;
        }
        setAvatarStatus("idle");
        return Boolean(streamUrlRef.current);
      } catch (e) {
        setAvatarStatus("error");
        toast.error(e instanceof Error ? e.message : "Could not start avatar session");
        return false;
      } finally {
        liveAvatarStartRef.current = null;
      }
    })();

    liveAvatarStartRef.current = pending;
    return pending;
  }, []);

  const ensureLiveAvatarEmbed = useCallback(async (): Promise<boolean> => {
    if (streamUrlRef.current) return true;
    return loadEmbed("");
  }, [loadEmbed]);

  const markAvatarSpeaking = useCallback(() => {
    setAvatarStatus("speaking");
    setTimeout(() => setAvatarStatus("idle"), 15000);
  }, []);

  useEffect(() => {
    if (avatarPreloadStarted) return;
    avatarPreloadStarted = true;
    const timer = setTimeout(() => {
      void ensureLiveAvatarEmbed();
    }, AVATAR_INIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ensureLiveAvatarEmbed]);

  const handleSend = useCallback(async (query: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: query };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let fullAnswer = "";
    let started = false;
    try {
      await askQuestionStream(query, {
        onToken: (t) => {
          fullAnswer += t;
          if (!started) {
            started = true;
            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: t }]);
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + t } : m))
            );
          }
        },
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, sources } : m))
          );
        },
      });

      const rawText = fullAnswer;
      const trimmed = trimResponse(rawText);
      const speechText = formatForSpeech(trimmed || rawText) || rawText;
      const { avatarProvider } = getConfig();

      // LiveAvatar embed should be long-lived. Recreating it for every reply can
      // cause LiveKit reconnection churn and unstable playback in production.
      if (avatarProvider === "liveavatar") {
        const ok = await ensureLiveAvatarEmbed();
        if (ok) {
          markAvatarSpeaking();
        }
      } else {
        setAvatarStatus("connecting");
        triggerAvatar(speechText)
          .then((res) => {
            if (res.fallback === "text-only") {
              setAvatarStatus("idle");
              toast.warning("Avatar unavailable. Continuing in text-only mode.");
              return;
            }
            if (res.streamUrl) {
              setStreamUrl(res.streamUrl);
              setEmbedFrameKey((k) => k + 1);
            }
            markAvatarSpeaking();
          })
          .catch(() => setAvatarStatus("error"));
      }
      void maybePlayVoice(rawText);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't reach the backend.",
        },
      ]);
      setAvatarStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, [ensureLiveAvatarEmbed, markAvatarSpeaking, maybePlayVoice]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface lg:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(218,226,253,0.45),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,200,249,0.25),transparent_42%)]" />
      {/* flex column so AvatarPanel can grow to full row height */}
      <div className="relative flex max-lg:min-h-[min(50vh,20rem)] min-h-0 min-w-0 flex-1 flex-col border-y border-outline-variant/35 bg-surface-container-low/50 lg:flex-[1.25] lg:border-x lg:border-y-0">
        <AvatarPanel
          status={avatarStatus}
          streamUrl={streamUrl}
          embedFrameKey={embedFrameKey}
          onReloadEmbed={() => void loadEmbed("")}
        />
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col border-t border-outline-variant/35 bg-surface-container-lowest/90 backdrop-blur lg:w-[min(100%,29rem)] lg:max-w-xl lg:border-l lg:border-t-0">
        <ChatPanel messages={messages} isLoading={isLoading} onSend={handleSend} />
      </div>
    </div>
  );
};

export default ChatPage;
