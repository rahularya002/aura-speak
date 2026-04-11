'use client'
import { useState, useCallback, useRef, useEffect } from "react";
import { Database, Cpu, Sparkles, Send, Bot, User, Video, Wifi, WifiOff, VideoOff, Play, Copy, Check, ChevronDown, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import { askQuestionStream, triggerAvatar } from "@/services/api";
import { useAssistant } from "@/contexts/AssistantContext";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

type AvatarStatus = "idle" | "connecting" | "speaking" | "disconnected";

const statusConfig: Record<AvatarStatus, { label: string; dotClass: string }> = {
  idle: { label: "Idle", dotClass: "bg-muted-foreground" },
  connecting: { label: "Connecting…", dotClass: "bg-amber-500 animate-pulse" },
  speaking: { label: "Speaking", dotClass: "bg-emerald-500" },
  disconnected: { label: "Disconnected", dotClass: "bg-destructive" },
};

const suggestedPrompts = [
  "Summarize my documents",
  "Explain key insights",
  "Answer questions from my files",
];

const ThinkingIndicator = () => (
  <div className="flex items-start gap-3 px-1 animate-fade-in">
    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <Bot className="h-3.5 w-3.5 text-primary" />
    </div>
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5">
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      </div>
      <span className="text-[11px] text-muted-foreground pl-1">Thinking…</span>
    </div>
  </div>
);

const MessageBubble = ({ msg }: { msg: Message }) => {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-start gap-3 animate-fade-in group ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
        msg.role === "user" ? "bg-secondary" : "bg-primary/10"
      }`}>
        {msg.role === "user" ? (
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-primary" />
        )}
      </div>
      <div className="max-w-[75%] space-y-1.5">
        <div className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
          msg.role === "user"
            ? "bg-secondary text-secondary-foreground"
            : "bg-card border border-border text-card-foreground shadow-xs"
        }`}>
          {msg.role === "assistant" ? (
            <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            msg.content
          )}
        </div>

        {/* Actions for assistant messages */}
        {msg.role === "assistant" && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {/* Source References */}
        {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
          <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors pl-1">
              <FileText className="h-3 w-3" />
              <span>Sources ({msg.sources.length})</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${sourcesOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1.5 space-y-1 pl-1">
                {msg.sources.map((src, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate">{src}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
};

const Overview = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("idle");
  const [streamUrl, setStreamUrl] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { current } = useAssistant();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: "assistant", content: t },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + t } : m
              )
            );
          }
        },
        onSources: (src) => {
          const names = src.map((s) => s.name);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, sources: names } : m))
          );
        },
      });

      setAvatarStatus("connecting");
      triggerAvatar(fullAnswer)
        .then((res) => {
          if (res.streamUrl) setStreamUrl(res.streamUrl);
          setAvatarStatus("speaking");
          setTimeout(() => setAvatarStatus("idle"), 15000);
        })
        .catch(() => setAvatarStatus("disconnected"));
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I couldn't reach the backend." },
      ]);
      setAvatarStatus("disconnected");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSend(input.trim());
    setInput("");
  };

  const hasMessages = messages.length > 0;
  const { label: statusLabel, dotClass } = statusConfig[avatarStatus];

  return (
    <div className="flex flex-1 h-full">
      {/* Chat Panel */}
      <div className="flex-[3] flex flex-col border-r border-border min-h-0">
        {!hasMessages ? (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-6 animate-fade-in">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Welcome to {current.name}</h2>
                <p className="text-sm text-muted-foreground mt-2">Set up your assistant to get started</p>
              </div>

              {/* Action Cards */}
              <div className="grid gap-3 text-left">
                <Link
                  href="/knowledge"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent transition-all duration-150 shadow-xs group"
                >
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Database className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Upload Knowledge Base</p>
                    <p className="text-xs text-muted-foreground">Add documents for RAG-powered responses</p>
                  </div>
                </Link>
                <Link
                  href="/models"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent transition-all duration-150 shadow-xs group"
                >
                  <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Cpu className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Connect Model</p>
                    <p className="text-xs text-muted-foreground">Connect to your local Ollama instance</p>
                  </div>
                </Link>
              </div>

              {/* Suggested Prompts */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Or try a prompt</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-accent transition-all duration-150 shadow-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isLoading && <ThinkingIndicator />}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 bg-background border-border transition-shadow focus-visible:shadow-xs"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="transition-transform active:scale-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Avatar Panel */}
      <div className="hidden lg:flex flex-[2] flex-col min-h-0 bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {avatarStatus === "disconnected" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span>{statusLabel}</span>
          </div>
          <span className={`h-2 w-2 rounded-full transition-colors ${dotClass}`} />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full aspect-video rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden transition-shadow hover:shadow-card">
            {streamUrl ? (
              <iframe
                src={streamUrl}
                className="w-full h-full"
                allow="camera; microphone; autoplay"
                title="Avatar Stream"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                {avatarStatus === "disconnected" ? (
                  <>
                    <VideoOff className="h-12 w-12 opacity-20" />
                    <p className="text-xs">Avatar unavailable</p>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                      <Video className="h-8 w-8 opacity-30" />
                    </div>
                    <p className="text-xs">Avatar will appear here</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full transition-all duration-150 active:scale-[0.98]"
            size="sm"
          >
            <Play className="h-3.5 w-3.5 mr-2" />
            Start Session
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Overview;
