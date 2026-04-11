import { Video, VideoOff, Wifi, WifiOff } from "lucide-react";

export type AvatarStatus = "idle" | "connecting" | "speaking" | "error";

interface AvatarPanelProps {
  status: AvatarStatus;
  streamUrl?: string;
}

const statusConfig: Record<AvatarStatus, { label: string; color: string }> = {
  idle: { label: "Ready", color: "bg-muted-foreground" },
  connecting: { label: "Connecting...", color: "bg-yellow-500" },
  speaking: { label: "Speaking", color: "bg-green-500" },
  error: { label: "Unavailable", color: "bg-destructive" },
};

const AvatarPanel = ({ status, streamUrl }: AvatarPanelProps) => {
  const { label, color } = statusConfig[status];

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {status === "error" ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          <span>{label}</span>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full ${color} ${status === "connecting" ? "animate-pulse" : ""}`} />
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 m-4 rounded-xl overflow-hidden">
        {streamUrl ? (
          <iframe
            src={streamUrl}
            className="w-full h-full"
            allow="camera; microphone; autoplay"
            title="Avatar Stream"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            {status === "error" ? (
              <>
                <VideoOff className="h-16 w-16 opacity-30" />
                <p className="text-sm">Avatar unavailable — text mode active</p>
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
  );
};

export default AvatarPanel;
