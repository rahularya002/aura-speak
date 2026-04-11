const getConfig = () => {
  if (typeof window === "undefined") {
    return {
      backendUrl: "",
      liveAvatarApiKey: "",
      heygenApiKey: "",
      avatarId: "default",
      contextId: "",
      isSandbox: true,
    };
  }
  const liveKey =
    localStorage.getItem("ai-assistant-liveavatar-api-key")?.trim() ||
    localStorage.getItem("ai-assistant-heygen-key")?.trim() ||
    "";
  const sandboxRaw = localStorage.getItem("ai-assistant-liveavatar-sandbox");
  const isSandbox = sandboxRaw === null ? true : sandboxRaw === "true";
  return {
    backendUrl: localStorage.getItem("ai-assistant-backend-url") ?? "",
    liveAvatarApiKey: liveKey,
    heygenApiKey: localStorage.getItem("ai-assistant-heygen-key") ?? "",
    avatarId: localStorage.getItem("ai-assistant-avatar-id") ?? "default",
    contextId: localStorage.getItem("ai-assistant-liveavatar-context-id") ?? "",
    isSandbox,
  };
};

/** Same-origin `/api/...` when backend URL is empty; otherwise `{backend}/api/...`. */
export function apiPath(path: string): string {
  const base = getConfig().backendUrl.trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const normalized = p.startsWith("/api") ? p : `/api${p}`;
  if (!base) return normalized;
  return `${base}${normalized}`;
}

export interface AskResponse {
  answer: string;
  sources?: string[];
}

export interface DocumentItem {
  id: string;
  name: string;
  status: "indexed" | "processing" | "error";
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

/** Non-streaming chat (JSON `{ answer, sources }`). */
export async function askQuestion(query: string): Promise<AskResponse> {
  const res = await fetch(apiPath("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, stream: false }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  const data = (await res.json()) as { answer: string; sources?: string[] };
  return { answer: data.answer, sources: data.sources };
}

/** SSE streaming from `POST /api/chat` with `{ stream: true }`. */
export async function askQuestionStream(query: string, handlers: StreamChatHandlers): Promise<void> {
  const res = await fetch(apiPath("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, stream: true }),
  });
  if (!res.ok) {
    handlers.onError?.(new Error(`Chat error: ${res.status}`));
    throw new Error(`Chat error: ${res.status}`);
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

/** Lists contexts for the authenticated LiveAvatar account (GET /v1/contexts). */
export async function fetchLiveAvatarContexts(
  apiKey: string
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(apiPath("/liveavatar/contexts"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    contexts?: { id: string; name: string }[];
  };
  if (!res.ok) {
    throw new Error(data.error || `Contexts error: ${res.status}`);
  }
  return data.contexts ?? [];
}

export async function triggerAvatar(text: string): Promise<{ sessionId?: string; streamUrl?: string }> {
  const { liveAvatarApiKey, heygenApiKey, avatarId, contextId, isSandbox } = getConfig();
  const res = await fetch(apiPath("/avatar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      liveAvatarApiKey,
      heygenApiKey,
      avatarId,
      contextId,
      isSandbox,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    sessionId?: string;
    streamUrl?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || `Avatar error: ${res.status}`);
  }
  return data;
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(apiPath("/knowledge"));
  if (!res.ok) throw new Error(`Documents error: ${res.status}`);
  return res.json();
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(apiPath("/knowledge"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload error: ${res.status}`);
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(apiPath(`/knowledge/${id}`), { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete error: ${res.status}`);
}

export async function reindexDocuments(): Promise<void> {
  const res = await fetch(apiPath("/reindex"), { method: "POST" });
  if (!res.ok) throw new Error(`Reindex error: ${res.status}`);
}

export async function getModels(): Promise<{ llm: string[]; embedding: string[] }> {
  const res = await fetch(apiPath("/models"));
  if (!res.ok) throw new Error(`Models error: ${res.status}`);
  return res.json();
}

/** Dynamic model list for a provider + base URL (proxied through Next.js). */
export async function fetchModelsViaApi(provider: "ollama" | "lmstudio" | "localai", baseUrl: string): Promise<string[]> {
  const res = await fetch(apiPath("/models"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, base_url: baseUrl }),
  });
  if (!res.ok) throw new Error(`Models error: ${res.status}`);
  const data = (await res.json()) as { models: string[] };
  return data.models ?? [];
}

export async function updateConfig(config: object): Promise<void> {
  const res = await fetch(apiPath("/config"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`Config error: ${res.status}`);
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
