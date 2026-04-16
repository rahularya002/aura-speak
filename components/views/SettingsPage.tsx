"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";
import { updateConfig } from "@/services/api";
import { useAutoSave } from "@/hooks/useAutoSave";
import { SaveIndicator } from "@/components/SaveIndicator";
import { toast } from "sonner";

const SettingsPage = () => {
  const [assistantName, setAssistantName] = useState("My Assistant");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [backendUrl, setBackendUrl] = useState("");
  const [enableVoicePlayback, setEnableVoicePlayback] = useState(false);
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const values = useMemo(() => ({
    assistantName,
    systemPrompt,
    backendUrl,
    enableVoicePlayback: String(enableVoicePlayback),
    elevenLabsVoiceId,
  }), [assistantName, systemPrompt, backendUrl, enableVoicePlayback, elevenLabsVoiceId]);

  const storageKeys = useMemo(() => ({
    assistantName: "ai-assistant-name",
    systemPrompt: "ai-assistant-system-prompt",
    backendUrl: "ai-assistant-backend-url",
    enableVoicePlayback: "ai-assistant-voice-playback",
    elevenLabsVoiceId: "ai-assistant-elevenlabs-voice-id",
  }), []);

  useEffect(() => {
    setAssistantName(localStorage.getItem("ai-assistant-name") || "My Assistant");
    setSystemPrompt(localStorage.getItem("ai-assistant-system-prompt") || "");
    setBackendUrl(localStorage.getItem("ai-assistant-backend-url") ?? "");
    setEnableVoicePlayback(localStorage.getItem("ai-assistant-voice-playback") === "true");
    setElevenLabsVoiceId(localStorage.getItem("ai-assistant-elevenlabs-voice-id") ?? "");
  }, []);

  const autoSaveStatus = useAutoSave(values, storageKeys);

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem("ai-assistant-name", assistantName);
    localStorage.setItem("ai-assistant-system-prompt", systemPrompt);
    localStorage.setItem("ai-assistant-backend-url", backendUrl);
    localStorage.setItem("ai-assistant-voice-playback", String(enableVoicePlayback));
    localStorage.setItem("ai-assistant-elevenlabs-voice-id", elevenLabsVoiceId);
    try {
      await updateConfig({ assistantName, systemPrompt });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to sync with backend");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">General assistant configuration.</p>
        </div>
        <SaveIndicator status={autoSaveStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-5 shadow-card transition-shadow hover:shadow-card-hover">
          <Label className="text-sm font-medium">General</Label>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Backend URL</Label>
            <Input
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="Leave empty to use this app (same origin)"
              className="bg-background border-border font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use API routes on this site, or set another server base URL.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Assistant Name</Label>
            <Input
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="My Assistant"
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Enable Voice Playback</Label>
              <Switch
                checked={enableVoicePlayback}
                onCheckedChange={setEnableVoicePlayback}
                aria-label="Enable voice playback"
              />
            </div>
            <Input
              value={elevenLabsVoiceId}
              onChange={(e) => setElevenLabsVoiceId(e.target.value)}
              placeholder="ElevenLabs voice id (optional)"
              className="bg-background border-border font-mono text-sm"
            />
          </div>
        </div>

        {/* Behavior */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-5 shadow-card transition-shadow hover:shadow-card-hover">
          <Label className="text-sm font-medium">Behavior</Label>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant that answers questions based on the provided knowledge base..."
              className="h-44 resize-none bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              Prepended to every conversation to guide assistant behavior.
            </p>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="transition-all duration-150 active:scale-[0.98]">
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {isSaving ? "Saving…" : "Save Settings"}
      </Button>
    </div>
  );
};

export default SettingsPage;
