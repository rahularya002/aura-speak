import Link from "next/link";
import { RefreshCw, Video, VideoOff, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          {status === "error" ? <WifiOff className="h-4 w-4 shrink-0" /> : <Wifi className="h-4 w-4 shrink-0" />}
          <span>{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onReloadEmbed && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={busy}
              onClick={onReloadEmbed}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
              Reload session
            </Button>
          )}
          <span className={`h-2.5 w-2.5 rounded-full ${color} ${busy ? "animate-pulse" : ""}`} />
        </div>
      </div>
      {streamUrl && (
        <div className="shrink-0 space-y-1.5 border-b border-border bg-muted/20 px-4 py-2 text-[11px] leading-snug text-muted-foreground">
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
        <div className="relative h-full min-h-[200px] w-full overflow-hidden rounded-xl bg-muted/30">
          {streamUrl ? (
            <iframe
              key={embedFrameKey}
              src={streamUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="camera; microphone; autoplay"
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
