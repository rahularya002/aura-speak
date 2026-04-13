"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Save, Video, Volume2, Loader2, UserCircle, ExternalLink, RefreshCw } from "lucide-react";
import { fetchLiveAvatarContexts, triggerAvatar, updateConfig } from "@/services/api";
import { LIVEAVATAR_SANDBOX_WAYNE_AVATAR_ID } from "@/lib/constants/liveavatar";
import { toast } from "sonner";

const AvatarSettings = () => {
  const [avatarId, setAvatarId] = useState("");
  const [contextId, setContextId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);
  const [voice, setVoice] = useState("default");
  const [speed, setSpeed] = useState(1.0);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contexts, setContexts] = useState<{ id: string; name: string }[]>([]);
  const [loadingContexts, setLoadingContexts] = useState(false);
  const [manualContext, setManualContext] = useState(false);

  useEffect(() => {
    setAvatarId(localStorage.getItem("ai-assistant-avatar-id") || "");
    setContextId(localStorage.getItem("ai-assistant-liveavatar-context-id") || "");
    const key =
      localStorage.getItem("ai-assistant-liveavatar-api-key") ||
      localStorage.getItem("ai-assistant-heygen-key") ||
      "";
    setApiKey(key);
    const sb = localStorage.getItem("ai-assistant-liveavatar-sandbox");
    setIsSandbox(sb === null ? true : sb === "true");
  }, []);

  const hasAvatar = Boolean(avatarId.trim());

  const contextSelectItems = (() => {
    if (contextId.trim() && !contexts.some((c) => c.id === contextId)) {
      return [
        { id: contextId, name: `Saved: ${contextId.slice(0, 8)}…` },
        ...contexts,
      ];
    }
    return contexts;
  })();

  const canTestEmbed = Boolean(apiKey.trim() && avatarId.trim() && contextId.trim());

  const loadContexts = async () => {
    if (!apiKey.trim()) {
      toast.error("Enter your LiveAvatar API key first.");
      return;
    }
    setLoadingContexts(true);
    try {
      const list = await fetchLiveAvatarContexts(apiKey);
      setContexts(list);
      toast.success(
        list.length === 0
          ? "No contexts found — create one in the LiveAvatar console."
          : `Loaded ${list.length} context${list.length === 1 ? "" : "s"}.`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load contexts.");
    } finally {
      setLoadingContexts(false);
    }
  };

  const persistLocal = () => {
    localStorage.setItem("ai-assistant-avatar-id", avatarId);
    localStorage.setItem("ai-assistant-liveavatar-context-id", contextId);
    localStorage.setItem("ai-assistant-liveavatar-api-key", apiKey);
    localStorage.setItem("ai-assistant-heygen-key", apiKey);
    localStorage.setItem("ai-assistant-liveavatar-sandbox", isSandbox ? "true" : "false");
  };

  const handleSave = async () => {
    setIsSaving(true);
    persistLocal();
    try {
      await updateConfig({ avatarId, voice, speed });
      toast.success("Avatar settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      persistLocal();
      await triggerAvatar("Hello! This is a test of the avatar playback.");
      toast.success("Embed session created — check chat/overview for the iframe if wired there.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Test failed.";
      toast.error(msg);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Avatar Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Uses{" "}
          <a
            href="https://docs.liveavatar.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 hover:underline"
          >
            LiveAvatar
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          (<code className="text-xs bg-muted px-1 rounded">POST /v2/embeddings</code>) for a embeddable session URL.
          Contexts are account resources; the API lets you{" "}
          <a
            href="https://docs.liveavatar.com/api-reference/contexts/list-user-contexts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            list them
          </a>{" "}
          (<code className="text-xs bg-muted px-1 rounded">GET /v1/contexts</code>) and pick one below.
          Legacy HeyGen Streaming is available server-side with <code className="text-xs bg-muted px-1 rounded">AVATAR_BACKEND=heygen</code>.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p className="font-medium text-foreground">LiveAvatar has two session types: FULL and LITE</p>
          <p>
            <a
              href="https://docs.liveavatar.com/docs/full-mode/overview.md"
              className="text-primary font-medium hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              FULL
            </a>
            : LiveAvatar runs STT → LLM → TTS → avatar (all-in-one).{" "}
            <a
              href="https://docs.liveavatar.com/docs/lite-mode/overview.md"
              className="text-primary font-medium hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              LITE
            </a>
            : you run STT/LLM/TTS; LiveAvatar only renders video from the audio you send (usually fewer credits per minute).
          </p>
          <p>
            <strong className="text-foreground">This app</strong> uses the{" "}
            <strong className="text-foreground">Embed API</strong> (
            <code className="text-xs bg-background px-1 rounded border border-border">POST /v2/embeddings</code>) and loads LiveAvatar&apos;s{" "}
            <strong className="text-foreground">hosted iframe</strong>. That experience is the managed, full pipeline — effectively{" "}
            <strong className="text-foreground">FULL-style</strong> usage and billing. There is no LITE switch on the embed endpoint.
          </p>
          <p>
            A true <strong className="text-foreground">LITE</strong> integration would use{" "}
            <code className="text-xs bg-background px-1 rounded border border-border">POST /v1/sessions/token</code> with{" "}
            <code className="text-xs bg-background px-1 rounded border border-border">&quot;mode&quot;: &quot;LITE&quot;</code> and the Web SDK to pipe
            audio — not implemented here yet.
          </p>
          <p className="text-xs border-t border-border pt-2 mt-2">
            To spend less today: use <strong className="text-foreground">sandbox</strong> (Wayne avatar only, no credits), or set server env{" "}
            <code className="text-xs bg-background px-1 rounded border border-border">LIVEAVATAR_MAX_SESSION_DURATION_SECONDS</code> to cap
            each embed session length.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-lg border border-border bg-card overflow-hidden shadow-card transition-shadow hover:shadow-card-hover">
          <div className="aspect-video flex items-center justify-center bg-background">
            {hasAvatar ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground px-4 text-center">
                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                  <Video className="h-10 w-10 opacity-20" />
                </div>
                <p className="text-sm">Avatar embed loads after Test Playback</p>
                <p className="text-xs text-muted-foreground font-mono break-all">avatar_id: {avatarId}</p>
                {contextId.trim() ? (
                  <p className="text-xs text-muted-foreground font-mono break-all">context_id: {contextId}</p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-500">Add a Context ID from the LiveAvatar console.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground animate-fade-in">
                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                  <UserCircle className="h-10 w-10 opacity-20" />
                </div>
                <p className="text-sm font-medium">No avatar selected</p>
                <p className="text-xs">Enter avatar_id and context_id from LiveAvatar</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {canTestEmbed ? "Ready to request embed URL" : "API key, avatar, and context required"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting || !canTestEmbed}
              className="transition-all duration-150 active:scale-[0.98] shrink-0"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isTesting ? "Testing…" : "Test Playback"}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-card transition-shadow hover:shadow-card-hover">
            <Label className="text-sm font-medium">LiveAvatar API</Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">API key (X-API-KEY)</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="From app.liveavatar.com → Developers"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Avatar ID</Label>
              <Input
                value={avatarId}
                onChange={(e) => setAvatarId(e.target.value)}
                placeholder="avatar_id (UUID)"
                className="bg-background border-border font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground">Context</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setManualContext((m) => !m)}
                >
                  {manualContext ? "Use picker" : "Enter ID manually"}
                </Button>
              </div>
              {manualContext ? (
                <Input
                  value={contextId}
                  onChange={(e) => setContextId(e.target.value)}
                  placeholder="context UUID"
                  className="bg-background border-border font-mono text-sm"
                />
              ) : (
                <>
                  <Select
                    value={contextId}
                    onValueChange={setContextId}
                    disabled={contextSelectItems.length === 0}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue
                        placeholder={
                          contextSelectItems.length === 0
                            ? 'Click "Load contexts" after saving your API key'
                            : "Select a context"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {contextSelectItems.map((c) => (
                        <SelectItem key={c.id} value={c.id} title={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={loadContexts}
                    disabled={loadingContexts || !apiKey.trim()}
                  >
                    {loadingContexts ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    )}
                    Load contexts from LiveAvatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Uses your API key to call{" "}
                    <code className="bg-muted px-1 rounded">GET /v1/contexts</code> — same as the official docs.
                  </p>
                </>
              )}
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sandbox"
                  checked={isSandbox}
                  onCheckedChange={(v) => setIsSandbox(v === true)}
                />
                <label htmlFor="sandbox" className="text-sm text-muted-foreground cursor-pointer leading-none">
                  Sandbox embed (no credits; see{" "}
                  <a
                    href="https://docs.liveavatar.com/docs/sandbox-mode.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    sandbox rules
                  </a>
                  )
                </label>
              </div>
              {isSandbox && (
                <p className="text-xs text-muted-foreground pl-7 max-w-lg leading-relaxed">
                  Sandbox only allows the <span className="font-mono text-[11px]">Wayne</span> avatar (
                  <span className="font-mono text-[11px] break-all">{LIVEAVATAR_SANDBOX_WAYNE_AVATAR_ID}</span>
                  ). Using any other Avatar ID causes the embed to load but{" "}
                  <code className="rounded bg-muted px-1">/v1/sessions/start</code> to return 400. Turn off sandbox
                  to use your own avatar (uses credits).
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-card transition-shadow hover:shadow-card-hover">
            <Label className="text-sm font-medium">Voice & Playback</Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Voice (UI only)</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="male-1">Male 1</SelectItem>
                  <SelectItem value="female-1">Female 1</SelectItem>
                  <SelectItem value="male-2">Male 2</SelectItem>
                  <SelectItem value="female-2">Female 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Speed</Label>
                <span className="text-xs text-muted-foreground tabular-nums">{speed.toFixed(1)}x</span>
              </div>
              <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={0.5} max={2} step={0.1} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full transition-all duration-150 active:scale-[0.98]"
              onClick={handleTest}
              disabled={isTesting || !canTestEmbed}
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Test embed
            </Button>
          </div>

          <Button
            className="w-full transition-all duration-150 active:scale-[0.98]"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving…" : "Save Avatar Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSettings;
