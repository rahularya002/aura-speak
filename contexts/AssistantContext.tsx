'use client'
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import {
  createAssistant as apiCreateAssistant,
  deleteAssistant as apiDeleteAssistant,
  listAssistants as apiListAssistants,
  type AssistantItem,
} from "@/services/api";

export interface Assistant {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface AssistantContextType {
  assistants: Assistant[];
  current: Assistant;
  switchAssistant: (id: string) => void;
  createAssistant: (name: string, description: string) => void;
  deleteAssistant: (id: string) => void;
}

const defaultAssistant: Assistant = {
  id: "default",
  name: "My Assistant",
  description: "Default assistant",
  createdAt: new Date().toISOString(),
};

const defaultContextValue: AssistantContextType = {
  assistants: [defaultAssistant],
  current: defaultAssistant,
  switchAssistant: () => {},
  createAssistant: () => {},
  deleteAssistant: () => {},
};

const AssistantContext = createContext<AssistantContextType>(defaultContextValue);

function coerceAssistant(raw: Partial<Assistant> & Pick<Assistant, "id" | "name">): Assistant {
  const desc = typeof raw.description === "string" ? raw.description.trim() : "";
  return {
    id: raw.id,
    name: raw.name,
    description: desc || defaultAssistant.description,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : defaultAssistant.createdAt,
  };
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [assistants, setAssistants] = useState<Assistant[]>(() => {
    if (typeof window === "undefined") return [defaultAssistant];
    const saved = localStorage.getItem("ai-assistants-list");
    if (!saved) return [defaultAssistant];
    try {
      const parsed = JSON.parse(saved) as Assistant[];
      if (!Array.isArray(parsed) || parsed.length === 0) return [defaultAssistant];
      return parsed.map((a) =>
        coerceAssistant({
          id: String(a?.id ?? "default"),
          name: String(a?.name ?? defaultAssistant.name),
          description: a?.description,
          createdAt: a?.createdAt,
        })
      );
    } catch {
      return [defaultAssistant];
    }
  });

  const [currentId, setCurrentId] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem("ai-assistant-current-id") || "default";
  });

  const persist = useCallback((list: Assistant[]) => {
    localStorage.setItem("ai-assistants-list", JSON.stringify(list));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void apiListAssistants()
      .then((rows) => {
        if (cancelled) return;
        const normalized: Assistant[] = rows.map((a: AssistantItem) =>
          coerceAssistant({
            id: a.id,
            name: a.name,
            description: a.description,
            createdAt: a.createdAt,
          })
        );
        if (normalized.length === 0) return;
        setAssistants(normalized);
        persist(normalized);
        // Embed URLs use /embed/[id]; id may not appear in the list yet — do not override.
        if (
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/embed/")
        ) {
          return;
        }
        if (!normalized.some((a) => a.id === currentId)) {
          const nextId = normalized[0].id;
          setCurrentId(nextId);
          localStorage.setItem("ai-assistant-current-id", nextId);
          localStorage.setItem("ai-assistant-name", normalized[0].name);
        }
      })
      .catch(() => {
        /* keep local cache */
      });
    return () => {
      cancelled = true;
    };
  }, [currentId, persist]);

  const current = assistants.find((a) => a.id === currentId) || assistants[0];

  const switchAssistant = useCallback((id: string) => {
    setCurrentId(id);
    localStorage.setItem("ai-assistant-current-id", id);
    const a = assistants.find((x) => x.id === id);
    if (a) localStorage.setItem("ai-assistant-name", a.name);
  }, [assistants]);

  const createAssistant = useCallback((name: string, description: string) => {
    void apiCreateAssistant(name, description)
      .then((row) => {
        const newA = coerceAssistant({
          id: row.id,
          name: row.name,
          description: row.description,
          createdAt: row.createdAt,
        });
        const updated = [...assistants, newA];
        setAssistants(updated);
        persist(updated);
        switchAssistant(newA.id);
        setCurrentId(newA.id);
        localStorage.setItem("ai-assistant-current-id", newA.id);
        localStorage.setItem("ai-assistant-name", name);
      })
      .catch(() => {
        /* fail silently, sidebar toast handles feedback */
      });
  }, [assistants, persist, switchAssistant]);

  const deleteAssistant = useCallback((id: string) => {
    if (assistants.length <= 1) return;
    void apiDeleteAssistant(id)
      .then(() => {
        const updated = assistants.filter((a) => a.id !== id);
        setAssistants(updated);
        persist(updated);
        if (currentId === id && updated.length > 0) {
          setCurrentId(updated[0].id);
          localStorage.setItem("ai-assistant-current-id", updated[0].id);
          localStorage.setItem("ai-assistant-name", updated[0].name);
        }
      })
      .catch(() => {
        /* fail silently, caller handles feedback */
      });
  }, [assistants, currentId, persist]);

  return (
    <AssistantContext.Provider value={{ assistants, current, switchAssistant, createAssistant, deleteAssistant }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  return useContext(AssistantContext);
}
