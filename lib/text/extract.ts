import { PDFParse } from "pdf-parse";

const TEXT_LIKE = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
]);

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }
  if (TEXT_LIKE.has(mimeType) || lower.endsWith(".md") || lower.endsWith(".txt")) {
    return buffer.toString("utf-8").trim();
  }
  throw new Error(`Unsupported file type: ${mimeType || fileName}`);
}

export function chunkText(text: string, size: number, overlap: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < normalized.length) {
    chunks.push(normalized.slice(i, i + size));
    i += Math.max(1, size - overlap);
  }
  return chunks;
}
