 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw, Video, VideoOff, Wifi, WifiOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchLiveAvatarVoices, type LiveAvatarVoice } from "@/services/api";
import { toast } from "sonner";

export type AvatarStatus = "idle" | "connecting" | "speaking" | "error";

interface AvatarPanelProps {
  status: AvatarStatus;
  streamUrl?: string;
  /** Changes when the parent loads a new embed so the iframe remounts cleanly. */
  embedFrameKey?: number;
  onReloadEmbed?: () => void;
}

const statusConfig: Record<AvatarStatus, { label: string; color: string }> = {
  idle: { label: "Ready", color: "bg-muted-foreground" },
  connecting: { label: "Connecting...", color: "bg-yellow-500" },
  speaking: { label: "Speaking", color: "bg-green-500" },
  error: { label: "Unavailable", color: "bg-destructive" },
};

const AvatarPanel = ({ status, streamUrl, embedFrameKey = 0, onReloadEmbed }: AvatarPanelProps) => {
  const { label, color } = statusConfig[status];
  const busy = status === "connecting";
  const [voices, setVoices] = useState<LiveAvatarVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [voiceId, setVoiceId] = useState("");
  const [manualVoiceId, setManualVoiceId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [controlsReady, setControlsReady] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const key =
      localStorage.getItem("ai-assistant-liveavatar-api-key") ||
      localStorage.getItem("ai-assistant-heygen-key") ||
      "";
    setApiKey(key);
    setHasApiKey(Boolean(key.trim()));
    const savedVoice = localStorage.getItem("ai-assistant-avatar-voice-id") ?? "";
    setVoiceId(savedVoice);
    setManualVoiceId(savedVoice);
    setControlsReady(true);
  }, []);

  const loadVoices = async () => {
    if (!apiKey.trim()) return;
    setLoadingVoices(true);
    try {
      const list = await fetchLiveAvatarVoices(apiKey);
      setVoices(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load voices");
    } finally {
      setLoadingVoices(false);
    }
  };

  useEffect(() => {
    if (!apiKey.trim()) return;
    void loadVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const applyVoice = (next: string) => {
    const resolved = next === "__default__" ? "" : next;
    setVoiceId(resolved);
    setManualVoiceId(resolved);
    localStorage.setItem("ai-assistant-avatar-voice-id", resolved);
    if (onReloadEmbed) onReloadEmbed();
  };

  const applyManualVoice = () => {
    const next = manualVoiceId.trim();
    setVoiceId(next);
    localStorage.setItem("ai-assistant-avatar-voice-id", next);
    toast.success(next ? "Manual voice_id applied" : "Using provider default voice");
    if (onReloadEmbed) onReloadEmbed();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col font-body">
      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-outline-variant/35 bg-surface-container-lowest/85 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          {status === "error" ? <WifiOff className="h-4 w-4 shrink-0" /> : <Wifi className="h-4 w-4 shrink-0" />}
          <span className="font-headline text-on-surface">{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onReloadEmbed && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-outline-variant/40 bg-surface-container-low text-xs hover:bg-surface-container-high"
              disabled={busy}
              onClick={onReloadEmbed}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
              {status === "error" ? "Retry connection" : "Reload session"}
            </Button>
          )}
          <span className={`h-2.5 w-2.5 rounded-full ${color} ${busy ? "animate-pulse" : ""}`} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant/35 bg-surface-container-lowest/70 px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          <Select
            value={voiceId || "__default__"}
            onValueChange={applyVoice}
            disabled={!controlsReady}
          >
            <SelectTrigger className="h-8 border-outline-variant/40 bg-surface-container-low text-xs">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Provider default voice</SelectItem>
              {voices.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                  {v.language ? ` · ${v.language}` : ""}
                  {v.provider ? ` · ${v.provider}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-on-surface-variant hover:bg-surface-container-high"
          onClick={() => void loadVoices()}
          disabled={loadingVoices || !controlsReady || !hasApiKey}
          title="Reload voices"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingVoices ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant/35 bg-surface-container-lowest/70 px-4 py-2">
        <Input
          value={manualVoiceId}
          onChange={(e) => setManualVoiceId(e.target.value)}
          placeholder="Manual voice_id from LiveAvatar"
          className="h-8 border-outline-variant/40 bg-surface-container-low text-xs font-mono"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-outline-variant/40 bg-surface-container-low text-xs hover:bg-surface-container-high"
          onClick={applyManualVoice}
        >
          Apply
        </Button>
      </div>
      {streamUrl && (
        <div className="shrink-0 space-y-1.5 border-b border-outline-variant/35 bg-surface-container-low px-4 py-2 text-[11px] leading-snug text-muted-foreground">
          <p className="text-[10px] text-foreground/90">
            LiveAvatar <span className="font-medium">FULL</span> vs <span className="font-medium">LITE</span>: this screen uses the{" "}
            <span className="font-medium">embed</span> iframe (FULL-style pipeline).{" "}
            <Link href="/avatar" className="font-medium text-primary underline underline-offset-2">
              Details
            </Link>
          </p>
          <p>
            <span className="font-mono text-[10px]">POST /v1/sessions/start</span> returning 400 often means{" "}
            <span className="font-medium text-foreground">sandbox is on but Avatar ID isn&apos;t Wayne</span> (see
            sandbox rules in{" "}
            <Link href="/avatar" className="font-medium text-primary underline underline-offset-2">
              Avatar Settings
            </Link>
            ). Also try <span className="font-medium text-foreground">Reload session</span>, allow camera/mic, and
            ensure API key, avatar, and context belong to the same account.
          </p>
        </div>
      )}

      {/* Fills all space below the header; iframe uses absolute fill so it isn’t height-auto */}
      <div className="relative min-h-0 flex-1 p-3">
        <div className="relative h-full min-h-[200px] w-full overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-high/40 shadow-[0_20px_60px_-48px_rgba(87,95,117,0.7)]">
          {streamUrl ? (
            <iframe
              key={embedFrameKey}
              src={streamUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="camera; microphone"
              title="Avatar Stream"
            />
          ) : (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
              {status === "error" ? (
                <>
                  <VideoOff className="h-16 w-16 opacity-30" />
                  <div className="max-w-xs space-y-2 px-4 text-center">
                    <p className="text-sm text-foreground">
                      Couldn&apos;t load the avatar stream (missing keys, wrong backend, or network).
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Set LiveAvatar or HeyGen in{" "}
                      <Link href="/avatar" className="font-medium text-primary underline underline-offset-2">
                        Avatar Settings
                      </Link>
                      . Chat on the right still works.
                    </p>
                    {onReloadEmbed && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={onReloadEmbed}
                      >
                        Retry avatar connection
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Video className="h-16 w-16 opacity-20" />
                  <p className="text-sm">Avatar will appear here</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarPanel;
