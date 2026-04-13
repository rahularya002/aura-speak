export type LLMProvider = "ollama" | "lmstudio" | "localai";

export interface AssistantConfig {
  assistantName?: string;
  systemPrompt?: string;
  provider: LLMProvider;
  /** Base URL for the LLM server (Ollama, LM Studio, LocalAI). */
  baseUrl: string;
  /** Legacy field kept in sync with baseUrl for Ollama-style setups */
  ollamaUrl?: string;
  llmModel: string;
  embeddingModel: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export const defaultAssistantConfig = (): AssistantConfig => ({
  provider: "ollama",
  baseUrl: "http://localhost:11434",
  ollamaUrl: "http://localhost:11434",
  llmModel: "",
  embeddingModel: "",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
});

export interface AssistantRecord {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  assistantId: string;
  name: string;
  status: "indexed" | "processing" | "error";
  createdAt: string;
  error?: string;
}

export interface ChunkRecord {
  id: string;
  assistantId: string;
  docId: string;
  name: string;
  text: string;
  embedding: number[];
}

export interface ChatMessageRecord {
  id: string;
  assistantId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}
