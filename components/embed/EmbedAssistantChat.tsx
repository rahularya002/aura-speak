"use client";

import { useLayoutEffect, useState } from "react";
import { useAssistant } from "@/contexts/AssistantContext";
import ChatPage from "@/components/views/ChatPage";

type Props = { assistantId: string };

/**
 * Syncs URL segment to localStorage + context before chat mounts so API calls use the right assistant.
 */
export function EmbedAssistantChat({ assistantId }: Props) {
  const { switchAssistant } = useAssistant();
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const id = assistantId.trim() || "default";
    localStorage.setItem("ai-assistant-current-id", id);
    switchAssistant(id);
    setReady(true);
  }, [assistantId, switchAssistant]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading assistant…
      </div>
    );
  }

  return (
    <div className="h-dvh w-full overflow-hidden">
      <ChatPage />
    </div>
  );
}
