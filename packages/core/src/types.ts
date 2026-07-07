export type AdapterId = "ollama" | "lmstudio" | "openai" | "anthropic" | "mock" | "rule";

export type RewriteGoal =
  | "improve"
  | "shorten"
  | "expand"
  | "formal"
  | "casual"
  | "confident"
  | "simplify"
  | "humanize";

export type Tone = "neutral" | "formal" | "casual" | "confident";

export interface LlmRequest {
  prompt: string;
  text: string;
  goal?: RewriteGoal;
  model?: string;
  system?: string;
  temperature?: number;
  variants?: number;
}

export interface LlmResponse {
  text: string;
  model: string;
  local: boolean;
  raw?: unknown;
  variants?: string[];
}

export interface LlmChunk {
  text: string;
  done?: boolean;
}

export interface ModelInfo {
  name: string;
  size?: number;
  modifiedAt?: string;
  family?: string;
}

export interface LlmAdapter {
  id: AdapterId;
  isLocal: boolean;
  complete(req: LlmRequest): Promise<LlmResponse>;
  stream?(req: LlmRequest): AsyncIterable<LlmChunk>;
  listModels?(): Promise<ModelInfo[]>;
}

export interface CheckOptions {
  locale?: string;
  customDictionary?: string[];
  ignoredRules?: string[];
}

export interface GrammarEngine {
  check(text: string, opts?: CheckOptions): Promise<Issue[]>;
}

export interface Issue {
  id: string;
  range: { start: number; end: number };
  type: "spelling" | "grammar" | "style" | "punctuation" | "readability";
  severity: "low" | "med" | "high";
  message: string;
  shortMessage: string;
  suggestions: string[];
  rule?: string;
}

export interface DiffOp {
  type: "equal" | "insert" | "delete";
  text: string;
}

export interface RewriteRequest {
  text: string;
  goal: RewriteGoal;
  tone?: Tone;
  strength?: number;
  preserve?: { citations?: boolean; markdown?: boolean; numbers?: boolean };
  locale?: string;
}

export interface RewriteResult {
  text: string;
  diff: DiffOp[];
  meta: {
    model: string;
    local: boolean;
    scoreBefore?: number;
    scoreAfter?: number;
    passes?: number;
    tier?: "noai" | "local" | "cloud";
  };
}

export interface Detector {
  score(text: string): number | Promise<number>;
}

export interface KalamEngine {
  llm: LlmAdapter;
  grammar?: GrammarEngine;
  detector?: Detector;
}
