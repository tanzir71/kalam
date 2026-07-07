import type { Detector } from "../types";
import { sentenceLengthBurstiness, sentenceSplit, tokenizeWords, typeTokenRatio } from "../text";

const FORMULAIC = /\b(moreover|furthermore|in conclusion|it is important to note|additionally|overall)\b/gi;

export class HeuristicDetector implements Detector {
  score(text: string): number {
    const words = tokenizeWords(text);
    if (words.length < 8) return 10;
    const sentences = sentenceSplit(text);
    const ttr = typeTokenRatio(words);
    const burst = sentenceLengthBurstiness(text);
    const formulaicCount = Array.from(text.matchAll(FORMULAIC)).length;
    const punctuationVariety = new Set((text.match(/[;:!?-]/g) ?? []).map(String)).size;
    const openerUniformity = uniformOpeners(sentences.map((sentence) => sentence.text));

    let score = 0;
    score += ttr < 0.48 ? 22 : ttr < 0.62 ? 12 : 4;
    score += burst < 3 ? 24 : burst < 7 ? 12 : 3;
    score += Math.min(24, formulaicCount * 8);
    score += openerUniformity * 18;
    score += punctuationVariety <= 1 ? 10 : 2;
    score += averageWordLength(words) > 6.2 ? 8 : 0;

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

function uniformOpeners(sentences: string[]): number {
  if (sentences.length <= 1) return 0;
  const openers = sentences.map((sentence) => tokenizeWords(sentence)[0]?.toLowerCase()).filter(Boolean);
  const counts = new Map<string, number>();
  for (const opener of openers) counts.set(opener, (counts.get(opener) ?? 0) + 1);
  return Math.max(...counts.values()) / openers.length;
}

function averageWordLength(words: string[]): number {
  return words.reduce((sum, word) => sum + word.length, 0) / Math.max(1, words.length);
}
