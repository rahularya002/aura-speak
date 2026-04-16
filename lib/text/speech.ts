const DEFAULT_MAX_SENTENCES = 3;
const DEFAULT_MAX_CHARS = 420;

function stripMarkdown(input: string): string {
  return (
    input
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^>\s*/gm, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/[*_~]/g, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function toSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function addPauses(text: string): string {
  return text
    .replace(/\s*[:;]\s*/g, ", ")
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*\(\s*/g, ", ")
    .replace(/\s*\)\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function shapeSpeechText(
  input: string,
  options?: { maxSentences?: number; maxChars?: number }
): string {
  const maxSentences = options?.maxSentences ?? DEFAULT_MAX_SENTENCES;
  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS;
  const clean = addPauses(stripMarkdown(input));
  if (!clean) return "";

  const sentences = toSentences(clean);
  const picked = sentences.slice(0, maxSentences).join(" ");
  if (picked.length <= maxChars) return picked;
  return `${picked.slice(0, maxChars - 1).trimEnd()}…`;
}
