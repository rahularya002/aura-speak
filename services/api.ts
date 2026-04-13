export interface AssistantItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface AskResponse {
  answer: string;
  sources?: string[];
}

export interface DocumentItem {
  id: string;
  assistantId?: string;
  name: string;
  status: "indexed" | "processing" | "error";
  createdAt?: string;
  error?: string;
}

export interface StreamSource {
  id: string;
  name: string;
  snippet: string;
}

export interface StreamChatHandlers {
  onToken: (chunk: string) => void;
  onSources?: (sources: StreamSource[]) => void;
  onError?: (err: Error) => void;
}

const getConfig = () => {
  if (typeof window === "undefined") {
    return {
      backendUrl: "",
      assistantId: "default",
      liveAvatarApiKey: "",
      heygenApiKey: "",
      avatarId: "default",
      contextId: "",
      isSandbox: true,
      avatarProvider: "liveavatar" as "liveavatar" | "heygen",
    };
  }
  const liveKey =
    localStorage.getItem("ai-assistant-liveavatar-api-key")?.trim() ||
    localStorage.getItem("ai-assistant-heygen-key")?.trim() ||
    "";
  const sandboxRaw = localStorage.getItem("ai-assistant-liveavatar-sandbox");
  const isSandbox = sandboxRaw === null ? true : sandboxRaw === "true";
  const avatarProvider =
    (localStorage.getItem("ai-assistant-avatar-provider") as
      | "liveavatar"
      | "heygen"
      | null) ?? "liveavatar";
  return {
    backendUrl: localStorage.getItem("ai-assistant-backend-url") ?? "",
    /** `??` alone keeps `""`, which breaks `/api/config` (Zod min(1) on assistant_id). */
    assistantId:
      (localStorage.getItem("ai-assistant-current-id") ?? "").trim() || "default",
    liveAvatarApiKey: liveKey,
    heygenApiKey: localStorage.getItem("ai-assistant-heygen-key") ?? "",
    avatarId: localStorage.getItem("ai-assistant-avatar-id") ?? "default",
    contextId: localStorage.getItem("ai-assistant-liveavatar-context-id") ?? "",
    isSandbox,
    avatarProvider,
  };
};

function withQuery(path: string, params: Record<string, string | undefined>) {
  const p = path.startsWith("/api") ? path : `/api${path}`;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") query.set(k, v);
  }
  const qs = query.toString();
  return qs ? `${p}?${qs}` : p;
}

/** Same-origin `/api/...` when backend URL is empty; otherwise `{backend}/api/...`. */
export function apiPath(path: string): string {
  const base = getConfig().backendUrl.trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const normalized = p.startsWith("/api") ? p : `/api${p}`;
  if (!base) return normalized;
  return `${base}${normalized}`;
}

async function parseOrThrow(res: Response): Promise<unknown> {
  const json = (await res.json().catch(() => ({}))) as {
    error?: unknown;
    message?: string;
  };
  if (!res.ok) {
    const e = json.error;
    if (typeof e === "string") throw new Error(e);
    if (e && typeof e === "object" && "message" in e) {
      const m = (e as { message?: unknown }).message;
      if (typeof m === "string") throw new Error(m);
    }
    if (json.message) throw new Error(json.message);
    throw new Error(`Request failed: ${res.status}`);
  }
  return json;
}

export async function listAssistants(): Promise<AssistantItem[]> {
  const res = await fetch(apiPath("/assistants"));
  const data = (await parseOrThrow(res)) as { assistants?: AssistantItem[] };
  return data.assistants ?? [];
}

export async function createAssistant(
  name: string,
  description = ""
): Promise<AssistantItem> {
  const res = await fetch(apiPath("/assistants"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  const data = (await parseOrThrow(res)) as { assistant: AssistantItem };
  return data.assistant;
}

export async function deleteAssistant(id: string): Promise<void> {
  const res = await fetch(apiPath(`/assistants/${id}`), { method: "DELETE" });
  await parseOrThrow(res);
}

/** Non-streaming chat (JSON `{ answer, sources }`). */
export async function askQuestion(query: string): Promise<AskResponse> {
  const { assistantId } = getConfig();
  const res = await fetch(apiPath("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assistant_id: assistantId,
      message: query,
      stream: false,
    }),
  });
  const data = (await parseOrThrow(res)) as { answer: string; sources?: string[] };
  return { answer: data.answer, sources: data.sources };
}

/** SSE streaming from `POST /api/chat` with `{ stream: true }`. */
export async function askQuestionStream(
  query: string,
  handlers: StreamChatHandlers
): Promise<void> {
  const { assistantId } = getConfig();
  const res = await fetch(apiPath("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assistant_id: assistantId,
      message: query,
      stream: true,
    }),
  });
  if (!res.ok) {
    let msg = `Chat error: ${res.status}`;
    try {
      const data = (await res.json()) as { error?: { message?: string } | string };
      if (typeof data.error === "string") msg = data.error;
      else if (data.error && typeof data.error === "object" && data.error.message) {
        msg = data.error.message;
      }
    } catch {
      /* no-op */
    }
    const err = new Error(msg);
    handlers.onError?.(err);
    throw err;
  }
  const reader = res.body?.getReader();
  if (!reader) {
    const err = new Error("No response body");
    handlers.onError?.(err);
    throw err;
  }
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const blocks = buf.split("\n\n");
      buf = blocks.pop() ?? "";
      for (const block of blocks) {
        const line = block
          .split("\n")
          .find((l) => l.startsWith("data: "));
        if (!line) continue;
        const payload = line.slice(6).trim();
        try {
          const json = JSON.parse(payload) as {
            type: string;
            t?: string;
            sources?: StreamSource[];
            message?: string;
          };
          if (json.type === "token" && json.t) handlers.onToken(json.t);
          if (json.type === "sources" && json.sources) handlers.onSources?.(json.sources);
          if (json.type === "error" && json.message) {
            handlers.onError?.(new Error(json.message));
          }
        } catch {
          /* ignore partial JSON */
        }
      }
    }
  } catch (e) {
    handlers.onError?.(e instanceof Error ? e : new Error(String(e)));
    throw e;
  }
}

export async function getChatHistory(limit = 100, offset = 0) {
  const { assistantId } = getConfig();
  const res = await fetch(
    apiPath(
      withQuery("/chat/history", {
        assistant_id: assistantId,
        limit: String(limit),
        offset: String(offset),
      })
    )
  );
  return parseOrThrow(res);
}

/** Lists contexts for the authenticated LiveAvatar account (GET /v1/contexts). */
export async function fetchLiveAvatarContexts(
  apiKey: string
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(apiPath("/liveavatar/contexts"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = (await parseOrThrow(res)) as {
    contexts?: { id: string; name: string }[];
  };
  return data.contexts ?? [];
}

export async function triggerAvatar(
  text = ""
): Promise<{ sessionId?: string; streamUrl?: string }> {
  const {
    liveAvatarApiKey,
    heygenApiKey,
    avatarId,
    contextId,
    isSandbox,
    avatarProvider,
  } = getConfig();
  const res = await fetch(apiPath("/avatar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      provider: avatarProvider,
      liveAvatarApiKey,
      heygenApiKey,
      avatarId,
      contextId,
      isSandbox,
    }),
  });
  const data = (await parseOrThrow(res)) as {
    sessionId?: string;
    streamUrl?: string;
  };
  return data;
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const { assistantId } = getConfig();
  const res = await fetch(apiPath(withQuery("/knowledge", { assistant_id: assistantId })));
  return (await parseOrThrow(res)) as DocumentItem[];
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const { assistantId } = getConfig();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("assistant_id", assistantId);
  const res = await fetch(apiPath("/knowledge"), {
    method: "POST",
    body: formData,
  });
  return (await parseOrThrow(res)) as DocumentItem;
}

export async function deleteDocument(id: string): Promise<void> {
  const { assistantId } = getConfig();
  const res = await fetch(
    apiPath(withQuery(`/knowledge/${id}`, { assistant_id: assistantId })),
    { method: "DELETE" }
  );
  await parseOrThrow(res);
}

export async function reindexDocuments(): Promise<void> {
  const { assistantId } = getConfig();
  const res = await fetch(apiPath(withQuery("/reindex", { assistant_id: assistantId })), {
    method: "POST",
  });
  await parseOrThrow(res);
}

export async function getModels(): Promise<{ llm: string[]; embedding: string[] }> {
  const { assistantId } = getConfig();
  const res = await fetch(apiPath(withQuery("/models", { assistant_id: assistantId })));
  return (await parseOrThrow(res)) as { llm: string[]; embedding: string[] };
}

/** Dynamic model list for a provider + base URL (proxied through Next.js). */
export async function fetchModelsViaApi(
  provider: "ollama" | "lmstudio" | "localai",
  baseUrl: string
): Promise<string[]> {
  const res = await fetch(apiPath("/models/connect"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, base_url: baseUrl }),
  });
  const data = (await parseOrThrow(res)) as { models: string[] };
  return data.models ?? [];
}

export async function updateConfig(config: object): Promise<void> {
  const { assistantId } = getConfig();
  const res = await fetch(apiPath("/config"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assistant_id: assistantId, ...config }),
  });
  await parseOrThrow(res);
}

export async function fetchOllamaModels(ollamaUrl: string): Promise<string[]> {
  const res = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/tags`);
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return (data.models || []).map((m: { name: string }) => m.name);
}

export async function checkOllamaConnection(ollamaUrl: string): Promise<boolean> {
  const res = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/tags`);
  return res.ok;
}

export { getConfig };
