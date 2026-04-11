"use client";

import { useState, useCallback } from "react";
import ChatPanel, { type Message } from "@/components/ChatPanel";
import AvatarPanel, { type AvatarStatus } from "@/components/AvatarPanel";
import { askQuestionStream, triggerAvatar } from "@/services/api";

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("idle");
  const [streamUrl, setStreamUrl] = useState<string>();

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
      });

      setAvatarStatus("connecting");
      triggerAvatar(fullAnswer)
        .then((res) => {
          if (res.streamUrl) setStreamUrl(res.streamUrl);
          setAvatarStatus("speaking");
          setTimeout(() => setAvatarStatus("idle"), 15000);
        })
        .catch(() => setAvatarStatus("error"));
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
  }, []);

  return (
    <div className="flex flex-1 h-full flex-col md:flex-row">
      <div className="flex-[3] border-r border-border min-h-0">
        <ChatPanel messages={messages} isLoading={isLoading} onSend={handleSend} />
      </div>
      <div className="flex-[2] min-h-0">
        <AvatarPanel status={avatarStatus} streamUrl={streamUrl} />
      </div>
    </div>
  );
};

export default ChatPage;
