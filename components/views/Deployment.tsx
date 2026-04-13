"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Check, Monitor, Bot } from "lucide-react";
import { toast } from "sonner";

const Deployment = () => {
  const [assistantId, setAssistantId] = useState("my-assistant");
  const [displayName, setDisplayName] = useState("My Assistant");
  const [baseUrl, setBaseUrl] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    const name = localStorage.getItem("ai-assistant-name") || "My Assistant";
    setDisplayName(name);
    /** Must match real `assistant_id` (UUID or `default`), not a display slug — otherwise APIs/RAG target the wrong row. */
    const id = localStorage.getItem("ai-assistant-current-id")?.trim() || "default";
    setAssistantId(id);
  }, []);

  const embedIframe = useMemo(
    () =>
      `<iframe src="${baseUrl}/embed/${assistantId}" width="400" height="600" frameborder="0" style="border-radius:12px;border:none;"></iframe>`,
    [baseUrl, assistantId],
  );
  const embedScript = useMemo(
    () => `<script src="${baseUrl}/widget.js" data-assistant="${assistantId}" data-theme="dark"></script>`,
    [baseUrl, assistantId],
  );
  const previewLink = useMemo(() => `${baseUrl}/embed/${assistantId}`, [baseUrl, assistantId]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Deployment</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Embed your assistant on any website or share a direct link.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Embed codes */}
        <div className="space-y-4">
          {/* Preview Link */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 shadow-card transition-shadow hover:shadow-card-hover">
            <Label className="text-sm font-medium">Preview Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={previewLink} className="bg-background border-border font-mono text-xs flex-1" />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 transition-all duration-150 active:scale-95"
                onClick={() => handleCopy(previewLink, "link")}
              >
                {copiedField === "link" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" className="shrink-0" asChild>
                <a href={previewLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Iframe Embed */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Embed via iframe</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs transition-all duration-150"
                onClick={() => handleCopy(embedIframe, "iframe")}
              >
                {copiedField === "iframe" ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                {copiedField === "iframe" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <Textarea
              readOnly
              value={embedIframe}
              className="font-mono text-xs h-20 resize-none bg-background border-border"
            />
          </div>

          {/* Script Widget */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Embed via Script Widget</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs transition-all duration-150"
                onClick={() => handleCopy(embedScript, "script")}
              >
                {copiedField === "script" ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                {copiedField === "script" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <Textarea
              readOnly
              value={embedScript}
              className="font-mono text-xs h-14 resize-none bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              Script widget URL is not implemented yet — use the iframe embed above.
            </p>
          </div>
        </div>

        {/* Right — Live Preview */}
        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden flex flex-col transition-shadow hover:shadow-card-hover">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
          </div>
          <div className="flex-1 min-h-[400px] flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-xs rounded-xl border border-border bg-card shadow-card p-6 space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                Your embedded assistant will appear like this.
              </p>
              <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground text-left">
                How can I help you today?
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deployment;
