export interface TextChunk {
  text: string;
  start: number;
  end: number;
}

const WORD_RE = /[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu;
const SENTENCE_RE = /[^.!?]+[.!?]+|[^.!?]+$/g;

export function tokenizeWords(text: string): string[] {
  return Array.from(text.matchAll(WORD_RE), (match) => match[0]);
}

export function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/^['-]+|['-]+$/g, "");
}

export function sentenceSplit(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  for (const match of text.matchAll(SENTENCE_RE)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const leading = raw.length - raw.trimStart().length;
    const trailing = raw.length - raw.trimEnd().length;
    const cleanStart = start + leading;
    const cleanEnd = start + raw.length - trailing;
    if (cleanEnd > cleanStart) {
      chunks.push({ text: text.slice(cleanStart, cleanEnd), start: cleanStart, end: cleanEnd });
    }
  }
  return chunks;
}

export function estimateTokens(text: string): number {
  const words = tokenizeWords(text).length;
  return Math.max(1, Math.ceil(words * 1.35));
}

export function chunkText(text: string, tokenBudget = 700): TextChunk[] {
  if (estimateTokens(text) <= tokenBudget) {
    return [{ text, start: 0, end: text.length }];
  }

  const paragraphs = splitWithOffsets(text, /\n{2,}/g);
  const chunks: TextChunk[] = [];
  let current = "";
  let currentStart = 0;
  let currentEnd = 0;

  const flush = () => {
    if (current) {
      chunks.push({ text: current, start: currentStart, end: currentEnd });
      current = "";
    }
  };

  for (const part of paragraphs) {
    if (estimateTokens(part.text) > tokenBudget) {
      flush();
      for (const sentence of sentenceSplit(part.text)) {
        const absolute = {
          text: sentence.text,
          start: part.start + sentence.start,
          end: part.start + sentence.end
        };
        if (!current) {
          current = absolute.text;
          currentStart = absolute.start;
          currentEnd = absolute.end;
        } else if (estimateTokens(`${current} ${absolute.text}`) <= tokenBudget) {
          current += ` ${absolute.text}`;
          currentEnd = absolute.end;
        } else {
          flush();
          current = absolute.text;
          currentStart = absolute.start;
          currentEnd = absolute.end;
        }
      }
      continue;
    }

    if (!current) {
      current = part.text;
      currentStart = part.start;
      currentEnd = part.end;
    } else if (estimateTokens(`${current}\n\n${part.text}`) <= tokenBudget) {
      current += `\n\n${part.text}`;
      currentEnd = part.end;
    } else {
      flush();
      current = part.text;
      currentStart = part.start;
      currentEnd = part.end;
    }
  }

  flush();
  return chunks;
}

function splitWithOffsets(text: string, separator: RegExp): TextChunk[] {
  const parts: TextChunk[] = [];
  let start = 0;
  for (const match of text.matchAll(separator)) {
    const end = match.index ?? start;
    if (end > start) {
      parts.push({ text: text.slice(start, end), start, end });
    }
    start = end + match[0].length;
  }
  if (start < text.length) {
    parts.push({ text: text.slice(start), start, end: text.length });
  }
  return parts;
}
