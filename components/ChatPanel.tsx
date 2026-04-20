"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { document: string; snippet: string }[];
}

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (query: string) => void;
}

const ThinkingIndicator = () => (
  <div className="flex items-start gap-3 px-4">
    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-outline-variant/35 bg-surface-container-low px-4 py-3">
      <span className="thinking-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="thinking-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="thinking-dot h-2 w-2 rounded-full bg-muted-foreground" />
    </div>
  </div>
);

const ChatPanel = ({ messages, isLoading, onSend }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [openSourcesByMessage, setOpenSourcesByMessage] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col font-body">
      <div className="border-b border-outline-variant/30 bg-surface-container-lowest/80 px-4 py-3">
        <p className="font-headline text-sm font-semibold tracking-tight text-on-surface">
          Conversation Studio
        </p>
        <p className="text-xs text-on-surface-variant">Ask, refine, and iterate in real time.</p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-outline-variant/35 bg-surface-container-low px-6 py-20 text-muted-foreground">
              <p className="font-headline text-base font-semibold text-on-surface">Ask me anything to get started.</p>
              <p className="mt-1 text-sm text-on-surface-variant">I can answer from your linked knowledge and model setup.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} px-2`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-tr-sm bg-stitch-primary text-on-primary shadow-[0_10px_24px_-14px_rgba(87,95,117,0.9)]"
                    : "rounded-tl-sm border border-outline-variant/35 bg-surface-container-low text-on-surface"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <Collapsible
                  open={Boolean(openSourcesByMessage[msg.id])}
                  onOpenChange={(open) =>
                    setOpenSourcesByMessage((prev) => ({ ...prev, [msg.id]: open }))
                  }
                >
                  <CollapsibleTrigger className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    <FileText className="h-3 w-3" />
                    <span>Sources ({msg.sources.length})</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        openSourcesByMessage[msg.id] ? "rotate-180" : ""
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1 rounded-md border border-outline-variant/35 bg-surface-container-low p-2">
                    {msg.sources.map((source, i) => (
                      <div key={`${source.document}-${i}`} className="space-y-0.5 text-[11px]">
                        <div className="font-medium text-foreground/90 truncate">{source.document}</div>
                        <div className="text-muted-foreground line-clamp-2">{source.snippet}</div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}
          {isLoading && <ThinkingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t border-outline-variant/35 bg-surface-container-lowest p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border-outline-variant/50 bg-surface-container-low focus-visible:ring-stitch-primary/40"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          className="bg-stitch-primary text-on-primary hover:bg-primary-dim"
        >
          <Send className="h-4 w-4" />
        </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
