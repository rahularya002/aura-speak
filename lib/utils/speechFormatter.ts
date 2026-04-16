function stripMarkdownNoise(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function trimResponse(text: string): string {
  const clean = stripMarkdownNoise(text);
  if (!clean) return "";
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.slice(0, 4).join(" ").trim();
}

export function formatForSpeech(text: string): string {
  const clean = stripMarkdownNoise(text);
  if (!clean) return "";
  return clean
    .replace(/\.\s+/g, "... ")
    .replace(/\?\s+/g, "?... ")
    .replace(/!\s+/g, "!... ")
    .replace(/\s+/g, " ")
    .trim();
}
