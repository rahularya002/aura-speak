"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  Save,
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Server,
  Cloud,
  Unplug,
} from "lucide-react";
import { apiPath, fetchModelsViaApi, updateConfig } from "@/services/api";
import { SaveIndicator } from "@/components/SaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
import { toast } from "sonner";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
type ModelSource = "local" | "cloud";

/** Keep Radix Select happy when the saved model name is not in the freshly fetched list. */
function withSavedModel(candidates: string[], saved: string): string[] {
  const s = saved.trim();
  if (!s) return candidates;
  if (candidates.includes(s)) return candidates;
  return [s, ...candidates];
}

const ModelSettings = () => {
  const [source, setSource] = useState<ModelSource>("local");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [llmModel, setLlmModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const values = useMemo(() => ({ llmModel, embeddingModel }), [llmModel, embeddingModel]);
  const storageKeys = useMemo(() => ({
    llmModel: "ai-assistant-llm-model",
    embeddingModel: "ai-assistant-embedding-model",
  }), []);
  const autoSaveStatus = useAutoSave(values, storageKeys);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      let url = localStorage.getItem("ai-assistant-ollama-url") || "http://localhost:11434";
      let llm = localStorage.getItem("ai-assistant-llm-model") || "";
      let emb = localStorage.getItem("ai-assistant-embedding-model") || "";
      let temp = 0.7;
      let tp = 0.9;
      let mt = 2048;

      try {
        const r = await fetch(apiPath("/config"));
        if (r.ok) {
          const c = (await r.json()) as Record<string, unknown>;
          const serverUrl = (typeof c.ollamaUrl === "string" && c.ollamaUrl.trim()
            ? c.ollamaUrl
            : typeof c.baseUrl === "string"
              ? c.baseUrl
              : "") as string;
          if (serverUrl.trim()) url = serverUrl.replace(/\/$/, "");
          if (typeof c.llmModel === "string") llm = c.llmModel;
          if (typeof c.embeddingModel === "string") emb = c.embeddingModel;
          if (typeof c.temperature === "number") temp = c.temperature;
          if (typeof c.topP === "number") tp = c.topP;
          if (typeof c.maxTokens === "number") mt = c.maxTokens;
        }
      } catch {
        /* offline */
      }

      if (cancelled) return;
      setOllamaUrl(url);
      setLlmModel(llm);
      setEmbeddingModel(emb);
      setTemperature(temp);
      setTopP(tp);
      setMaxTokens(mt);
      localStorage.setItem("ai-assistant-ollama-url", url);
      localStorage.setItem("ai-assistant-llm-model", llm);
      localStorage.setItem("ai-assistant-embedding-model", emb);

      try {
        const models = await fetchModelsViaApi("ollama", url);
        if (!cancelled) {
          setAvailableModels(models);
          setConnectionStatus("connected");
        }
      } catch {
        if (!cancelled) {
          setAvailableModels([]);
          setConnectionStatus(llm || emb ? "connected" : "idle");
        }
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleConnect = useCallback(async () => {
    setConnectionStatus("connecting");
    setIsFetching(true);
    try {
      const models = await fetchModelsViaApi("ollama", ollamaUrl);
      setAvailableModels(models);
      setConnectionStatus("connected");
      localStorage.setItem("ai-assistant-ollama-url", ollamaUrl);
      toast.success(`Connected — ${models.length} model${models.length !== 1 ? "s" : ""} found`);
      if (models.length > 0 && !llmModel) setLlmModel(models[0]);
    } catch {
      setConnectionStatus("error");
      setAvailableModels([]);
      toast.error("Failed to connect to Ollama.");
    } finally {
      setIsFetching(false);
    }
  }, [ollamaUrl, llmModel]);

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem("ai-assistant-llm-model", llmModel);
    localStorage.setItem("ai-assistant-embedding-model", embeddingModel);
    try {
      await updateConfig({ llmModel, embeddingModel, temperature, topP, maxTokens, ollamaUrl });
      toast.success("Model settings saved");
    } catch {
      toast.error("Failed to sync with backend");
    } finally {
      setIsSaving(false);
    }
  };

  const embeddingKeywords = ["embed", "minilm", "bge", "e5", "gte"];
  const embeddingModels = availableModels.filter((m) =>
    embeddingKeywords.some((kw) => m.toLowerCase().includes(kw))
  );
  const llmModels = availableModels.filter(
    (m) => !embeddingKeywords.some((kw) => m.toLowerCase().includes(kw))
  );

  const llmSelectOptions = useMemo(
    () => withSavedModel(llmModels.length > 0 ? llmModels : availableModels, llmModel),
    [llmModels, availableModels, llmModel]
  );
  const embeddingSelectOptions = useMemo(
    () =>
      withSavedModel(
        embeddingModels.length > 0 ? embeddingModels : availableModels,
        embeddingModel
      ),
    [embeddingModels, availableModels, embeddingModel]
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Model Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect to your LLM server and configure model parameters.
          </p>
        </div>
        <SaveIndicator status={autoSaveStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Model Source */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-card transition-shadow hover:shadow-card-hover">
            <Label className="text-sm font-medium">Model Source</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSource("local")}
                className={`flex items-center gap-3 rounded-lg border p-3.5 transition-all duration-150 ${
                  source === "local"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Server className={`h-4 w-4 ${source === "local" ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${source === "local" ? "text-foreground" : "text-muted-foreground"}`}>
                    Local (Ollama)
                  </p>
                  <p className="text-xs text-muted-foreground">Self-hosted</p>
                </div>
              </button>
              <button
                onClick={() => setSource("cloud")}
                className={`flex items-center gap-3 rounded-lg border p-3.5 transition-all duration-150 ${
                  source === "cloud"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Cloud className={`h-4 w-4 ${source === "cloud" ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${source === "cloud" ? "text-foreground" : "text-muted-foreground"}`}>
                    Cloud
                  </p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </button>
            </div>
          </div>

          {/* Connection */}
          {source === "local" && connectionStatus === "idle" && (
            <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center text-center shadow-card animate-fade-in">
              <Unplug className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="font-medium text-foreground text-sm">No model connected</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Enter your Ollama server URL and connect to get started.
              </p>
              <div className="flex gap-2 w-full max-w-sm">
                <Input
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="bg-background border-border font-mono text-sm flex-1"
                />
                <Button onClick={handleConnect} disabled={isFetching || !ollamaUrl.trim()} size="sm">
                  <Plug className="h-4 w-4 mr-1.5" />
                  Connect
                </Button>
              </div>
            </div>
          )}

          {source === "local" && connectionStatus !== "idle" && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-card animate-fade-in transition-shadow hover:shadow-card-hover">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Connection</Label>
                {connectionStatus === "connected" ? (
                  <Badge className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </Badge>
                ) : connectionStatus === "error" ? (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" /> Error
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Connecting
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="bg-background border-border font-mono text-sm flex-1"
                />
                <Button onClick={handleConnect} disabled={isFetching || !ollamaUrl.trim()} size="sm">
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Plug className="h-4 w-4 mr-1.5" />
                  )}
                  {isFetching ? "Connecting…" : "Connect"}
                </Button>
              </div>
              {connectionStatus === "error" && (
                <p className="text-xs text-destructive flex items-center gap-1.5 animate-fade-in">
                  <XCircle className="h-3 w-3" />
                  Could not reach Ollama. Ensure the server is running.
                </p>
              )}
              {connectionStatus === "connected" && (
                <div className="flex items-center justify-between animate-fade-in">
                  <p className="text-xs text-muted-foreground">
                    {availableModels.length} model{availableModels.length !== 1 ? "s" : ""} available
                  </p>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleConnect}>
                    <RefreshCw className="h-3 w-3 mr-1.5" /> Refresh
                  </Button>
                </div>
              )}
            </div>
          )}

          {source === "cloud" && (
            <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center text-center shadow-card animate-fade-in">
              <Cloud className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="font-medium text-foreground text-sm">Cloud Models Coming Soon</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect to your local Ollama instance for now.
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {source === "local" && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-5 shadow-card transition-shadow hover:shadow-card-hover">
              <Label className="text-sm font-medium">Model Selection</Label>
              {(llmModel || embeddingModel) && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 space-y-1 text-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saved selection</p>
                  <p>
                    <span className="text-muted-foreground">LLM: </span>
                    <span className="font-mono text-foreground">{llmModel.trim() || "—"}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Embedding: </span>
                    <span className="font-mono text-foreground">{embeddingModel.trim() || "—"}</span>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">LLM Model</Label>
                <Select
                  value={llmModel}
                  onValueChange={setLlmModel}
                  disabled={llmSelectOptions.length === 0 && !llmModel.trim()}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue
                      placeholder={
                        llmSelectOptions.length === 0 && !llmModel.trim()
                          ? "Connect to fetch models or save a model name"
                          : "Select a model"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {llmSelectOptions.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">The language model used for generating responses.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Embedding Model</Label>
                <Select
                  value={embeddingModel}
                  onValueChange={setEmbeddingModel}
                  disabled={embeddingSelectOptions.length === 0 && !embeddingModel.trim()}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue
                      placeholder={
                        embeddingSelectOptions.length === 0 && !embeddingModel.trim()
                          ? "Connect to fetch models or save a model name"
                          : "Select a model"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {embeddingSelectOptions.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover">
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium text-foreground">
                Advanced Settings
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-5 border-t border-border pt-4 animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Temperature</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{temperature.toFixed(2)}</span>
                    </div>
                    <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={1} step={0.01} />
                    <p className="text-xs text-muted-foreground">Lower = focused, higher = creative.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Top P</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{topP.toFixed(2)}</span>
                    </div>
                    <Slider value={[topP]} onValueChange={([v]) => setTopP(v)} min={0} max={1} step={0.01} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Max Tokens</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{maxTokens}</span>
                    </div>
                    <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} min={256} max={8192} step={256} />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Button className="w-full transition-all duration-150 active:scale-[0.98]" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving…" : "Save Model Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModelSettings;
