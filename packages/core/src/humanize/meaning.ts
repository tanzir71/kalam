import { normalizeToken, tokenizeWords } from "../text";

const NUMBER_RE = /\b\d+(?:[.,]\d+)?%?\b/g;
const ENTITY_RE = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
const ENTITY_STOPWORDS = new Set([
  "Additionally",
  "Furthermore",
  "Moreover",
  "Overall",
  "Teh",
  "This",
  "That",
  "The"
]);

export interface MeaningScore {
  score: number;
  tokenOverlap: number;
  lengthRatio: number;
  numbersPreserved: boolean;
  entitiesPreserved: boolean;
}

export function meaningPreserved(before: string, after: string): MeaningScore {
  const beforeTokens = contentTokens(before);
  const afterTokens = contentTokens(after);
  const overlap = overlapRatio(beforeTokens, afterTokens);
  const lengthRatio =
    Math.min(beforeTokens.length, afterTokens.length) / Math.max(1, Math.max(beforeTokens.length, afterTokens.length));
  const numbersPreserved = containsAll(extract(before, NUMBER_RE), extract(after, NUMBER_RE));
  const entitiesPreserved = containsAll(extractEntities(before), extractEntities(after));
  const score =
    overlap * 0.55 + Math.min(1, lengthRatio / 0.75) * 0.2 + (numbersPreserved ? 0.15 : 0) + (entitiesPreserved ? 0.1 : 0);

  return {
    score: Math.round(score * 100) / 100,
    tokenOverlap: Math.round(overlap * 100) / 100,
    lengthRatio: Math.round(lengthRatio * 100) / 100,
    numbersPreserved,
    entitiesPreserved
  };
}

export function hasUnicodeObfuscation(text: string): boolean {
  return /[\u200B-\u200D\uFEFF\u2060]/u.test(text);
}

function contentTokens(text: string): string[] {
  return tokenizeWords(text)
    .map(normalizeToken)
    .filter((token) => token.length > 2);
}

function overlapRatio(before: string[], after: string[]): number {
  if (before.length === 0) return 1;
  const afterSet = new Set(after);
  const retained = before.filter((token) => afterSet.has(token)).length;
  return retained / before.length;
}

function extract(text: string, pattern: RegExp): string[] {
  return Array.from(text.matchAll(pattern), (match) => match[0]);
}

function extractEntities(text: string): string[] {
  return extract(text, ENTITY_RE).filter((entity) => !ENTITY_STOPWORDS.has(entity.split(/\s+/)[0]));
}

function containsAll(required: string[], actual: string[]): boolean {
  const actualSet = new Set(actual);
  return required.every((value) => actualSet.has(value));
}
