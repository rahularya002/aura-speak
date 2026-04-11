'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [assistants, setAssistants] = useState<Assistant[]>(() => {
    if (typeof window === "undefined") return [defaultAssistant];
    const saved = localStorage.getItem("ai-assistants-list");
    if (!saved) return [defaultAssistant];
    try {
      const parsed = JSON.parse(saved) as Assistant[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [defaultAssistant];
    } catch {
      return [defaultAssistant];
    }
  });

  const [currentId, setCurrentId] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem("ai-assistant-current-id") || "default";
  });

  const current = assistants.find((a) => a.id === currentId) || assistants[0];

  const persist = useCallback((list: Assistant[]) => {
    localStorage.setItem("ai-assistants-list", JSON.stringify(list));
  }, []);

  const switchAssistant = useCallback((id: string) => {
    setCurrentId(id);
    localStorage.setItem("ai-assistant-current-id", id);
    const a = assistants.find((x) => x.id === id);
    if (a) localStorage.setItem("ai-assistant-name", a.name);
  }, [assistants]);

  const createAssistant = useCallback((name: string, description: string) => {
    const newA: Assistant = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    const updated = [...assistants, newA];
    setAssistants(updated);
    persist(updated);
    switchAssistant(newA.id);
    setCurrentId(newA.id);
    localStorage.setItem("ai-assistant-current-id", newA.id);
    localStorage.setItem("ai-assistant-name", name);
  }, [assistants, persist, switchAssistant]);

  const deleteAssistant = useCallback((id: string) => {
    if (assistants.length <= 1) return;
    const updated = assistants.filter((a) => a.id !== id);
    setAssistants(updated);
    persist(updated);
    if (currentId === id) {
      setCurrentId(updated[0].id);
      localStorage.setItem("ai-assistant-current-id", updated[0].id);
      localStorage.setItem("ai-assistant-name", updated[0].name);
    }
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
