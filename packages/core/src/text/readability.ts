import { sentenceSplit, tokenizeWords } from "./tokenize";

export interface ReadabilityStats {
  words: number;
  characters: number;
  sentences: number;
  fleschKincaidGrade: number;
  typeTokenRatio: number;
  burstiness: number;
}

export function analyzeText(text: string): ReadabilityStats {
  const words = tokenizeWords(text);
  const sentences = Math.max(1, sentenceSplit(text).length);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const grade = 0.39 * (words.length / sentences) + 11.8 * (syllables / Math.max(1, words.length)) - 15.59;

  return {
    words: words.length,
    characters: text.length,
    sentences,
    fleschKincaidGrade: roundOne(Math.max(0, grade)),
    typeTokenRatio: typeTokenRatio(words),
    burstiness: sentenceLengthBurstiness(text)
  };
}

export function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return 0;
  if (clean.length <= 3) return 1;
  const trimmed = clean.replace(/(?:e|es|ed)$/u, "");
  const groups = trimmed.match(/[aeiouy]+/gu);
  return Math.max(1, groups?.length ?? 1);
}

export function typeTokenRatio(wordsOrText: string[] | string): number {
  const words = Array.isArray(wordsOrText) ? wordsOrText : tokenizeWords(wordsOrText);
  if (words.length === 0) return 0;
  const unique = new Set(words.map((word) => word.toLowerCase()));
  return roundTwo(unique.size / words.length);
}

export function sentenceLengthBurstiness(text: string): number {
  const lengths = sentenceSplit(text).map((sentence) => tokenizeWords(sentence.text).length);
  if (lengths.length <= 1) return 0;
  const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
  const variance = lengths.reduce((sum, value) => sum + (value - mean) ** 2, 0) / lengths.length;
  return roundTwo(Math.sqrt(variance));
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
