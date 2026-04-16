'use client'
import { useState, useCallback, useRef, useEffect } from "react";
import { Database, Cpu, Sparkles, Send, Bot, User, Copy, Check, ChevronDown, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import { askQuestionStream, generateSpeech, getConfig } from "@/services/api";
import { useAssistant } from "@/contexts/AssistantContext";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { document: string; snippet: string }[];
}

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
                  <div key={`${src.document}-${i}`} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <FileText className="h-3 w-3 shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <div className="truncate font-medium text-foreground/90">{src.document}</div>
                      <div>{src.snippet}</div>
                    </div>
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const { current } = useAssistant();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

  const handleSend = useCallback(async (query: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: query };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let started = false;
    let fullAnswer = "";
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
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, sources: src } : m))
          );
        },
      });
      void maybePlayVoice(fullAnswer);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I couldn't reach the backend." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [maybePlayVoice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSend(input.trim());
    setInput("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-1 h-full min-h-0 flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        {!hasMessages ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-6 animate-fade-in">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Welcome to {current.name}</h2>
                <p className="text-sm text-muted-foreground mt-2">Set up your assistant to get started</p>
              </div>

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

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Or try a prompt</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
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
    </div>
  );
};

export default Overview;
