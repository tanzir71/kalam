# Kalam — Build Specification & Codex Loop Handoff

> **What this document is:** A complete, self-contained build brief for an autonomous coding agent (Codex, run in a loop). It defines *what* to build, *how* to build it, *in what order*, and *how to know when each piece is done*. Every milestone has machine-checkable acceptance criteria. An agent should be able to run this in a loop and converge on a working product with no further human input.
>
> **Read this first, then read `AGENT_LOOP.md` conventions in Section 2 before writing any code.**

---

## 0. TL;DR for the agent

You are building **Kalam** — a **local-first** writing assistant (a Grammarly alternative) with two shipping targets that share one core engine:

1. **Kalam Browser Extension** (Chrome/Edge/Firefox, Manifest V3) — the easy-access, cross-platform surface. Works inline in text fields on any website.
2. **Kalam Desktop** (Tauri v2 — Rust core + web UI) — the more powerful surface. System-wide text capture, larger local models, batch processing, offline model management.

Both consume a shared TypeScript **core package** (`@kalam/core`) that implements: grammar/style checking, rewrite orchestration, and the flagship **Humanize** feature (rewriting text to reduce the probability that AI-content detectors such as Pangram, GPTZero, Originality.ai, etc. flag it as machine-generated).

**AI is optional — the app is fully useful with zero AI (core principle).** Kalam must deliver real value with **no LLM available at all**: grammar, spelling, style, readability, and a deterministic rule-based rewrite/humanize baseline all run with no model, no server, no network. AI (a local LLM, or optionally a cloud model) is a **capability booster** layered on top — it produces higher-quality rewrites and more fluent humanization, but is never a hard dependency. Three capability tiers, and the app degrades gracefully down them:

| Tier | Requires | What works |
|---|---|---|
| **T0 — No AI (always available)** | Nothing (offline, no models) | Grammar/spelling (Harper WASM), style + readability rules, custom dictionary, AI-likelihood *estimate*, and **deterministic rule-based rewrite & humanize** (transition trimming, contraction/register swaps, sentence-length variation, conciseness edits) |
| **T1 — Local AI (default when present)** | Ollama / LM Studio running | Everything in T0 **plus** LLM-quality rewrite, multi-variant humanize with the meaning-preservation guard, tone transforms |
| **T2 — Cloud AI (opt-in)** | User's own API key | Highest-quality rewrites when the user explicitly enables it |

The UI always reflects the active tier (badge + a "Boost with AI" affordance that appears only when a model is reachable). Never block a T0 action behind "no model found" — offer the rule-based result and *invite* the user to connect a model for better output.

**AI backend policy (decided):** **Local-first with optional BYO API key.**
- Default path: 100% local. Grammar via a local engine (Harper + LanguageTool). Rewrite/humanize via a local LLM through **Ollama** (fallback: LM Studio's OpenAI-compatible server) **when available; otherwise the T0 rule-based engine.**
- Optional path: user pastes their own OpenAI/Anthropic API key in settings for higher-quality rewrites. Never hardcode keys. Never send text anywhere unless the user has explicitly enabled a cloud provider.

**Name:** Kalam. **Tagline:** *"Write clearly. Sound human."* Package scope: `@kalam/*`. Bundle IDs: `app.kalam.desktop`, extension name "Kalam".

---

## 1. Legal / ethics guardrails (bake these into the product, do not skip)

The "beat AI detectors" feature is legitimate for a real and large use case: **false positives**. AI detectors are unreliable and routinely flag genuine human writing (especially from non-native English speakers) as AI. Kalam's Humanize feature is framed and built as a tool to **help writing read naturally and avoid false accusations**, and to give users control over their own voice.

Build the following in, non-negotiable:
- On first run of Humanize, show a one-time notice: *"Humanize rewrites your text to read more naturally. Use it on your own work. Don't use it to misrepresent authorship where that's prohibited (e.g., academic integrity policies)."* Require an acknowledge click. Store the ack locally.
- Do not market or label anything as "cheat", "bypass exams", or target minors/students specifically.
- Everything is local by default; the product's privacy story is a core feature, not a footnote.

The agent should not add functionality beyond what this spec describes that facilitates fraud. If a requirement seems to cross that line, implement the neutral version described here.

---

## 2. How to run the loop (agent operating protocol)

This is the most important section for autonomous operation. Follow it exactly.

### 2.1 The loop
Each iteration:
1. **Read state.** Open `PROGRESS.md` (create it on iteration 1 from the template in §12). It records which milestone/task you are on and what's done.
2. **Pick the next unchecked task** in the current milestone (milestones are strictly ordered M0 → M8; do not skip ahead).
3. **Implement** the smallest coherent slice of that task.
4. **Verify** against the task's acceptance criteria by running the commands in §2.3. Do not self-attest — run the checks.
5. **Update `PROGRESS.md`:** check off completed items, append a short changelog entry (date, what changed, test results), and note anything deferred or newly discovered.
6. **Commit** (see §2.4).
7. If the milestone's "Definition of Done" (DoD) checks all pass, mark the milestone complete and move to the next. Otherwise loop again on the same milestone.

Stop condition: all milestones M0–M8 complete and their DoD checks green. Then produce a final `RELEASE_NOTES.md`.

### 2.2 Guardrails for the loop
- **Never leave the tree broken.** If a change breaks `pnpm build` or `pnpm test`, fix it before committing or revert it.
- **One concern per commit.** Small, reversible commits.
- **Tests are the contract.** When a task says "add tests", the tests must actually assert behavior, not just import a module.
- **If blocked** (ambiguous requirement, missing external dependency, a check that cannot pass locally), do NOT stall silently: write the blocker into `PROGRESS.md` under "## BLOCKERS" with a proposed default, then implement the proposed default and continue. Never hang waiting for input.
- **Determinism first.** Prefer pure functions and dependency injection so logic is unit-testable without a live model. All LLM calls go through one adapter interface that can be mocked.
- **Idempotence.** Re-running the loop on an already-done task should be a no-op, not a duplicate.

### 2.3 Canonical verification commands
From repo root. These must exist and pass; wiring them up is itself part of M0.

```bash
pnpm install
pnpm -r build            # builds all packages + both apps
pnpm -r test             # unit + integration tests (Vitest)
pnpm -r lint             # eslint + prettier check
pnpm -r typecheck        # tsc --noEmit across workspace
pnpm e2e:ext             # Playwright: extension loaded in headless Chromium
pnpm e2e:desktop         # Tauri app smoke test (webdriver / tauri-driver)
```
A milestone is only "done" when every command relevant to its DoD exits 0.

**If a command cannot run in the current environment** (no display for e2e, missing OS toolchain for `tauri build`, no network), do not fake a pass and do not stall: log it in `PROGRESS.md` under BLOCKERS as `ENV-BLOCKED: <command> — <what a human/CI must run>`, ensure every runnable check passes, and continue. CI note: build/test/lint/typecheck run on `ubuntu-latest`; `tauri build` and desktop e2e run as separate OS-matrix jobs and must not block the loop when the runner lacks the toolchain.

### 2.4 Commit / branch conventions
- Conventional Commits: `feat(core): add humanize pipeline`, `fix(ext): overlay z-index`, `test(desktop): model manager`, `chore`, `docs`.
- Work on `main` is fine for a solo agent loop; tag each completed milestone: `git tag m0-complete` … `m8-complete`.
- Every commit message ends with a line: `Loop-iter: <n>`.

### 2.5 Tech decisions already made (do not re-litigate)
| Decision | Choice |
|---|---|
| Monorepo tool | pnpm workspaces + Turborepo |
| Language | TypeScript everywhere; Rust only for Tauri core/sidecar |
| Core engine | `@kalam/core` (pure TS, no DOM, no Node-only APIs in hot path) |
| Grammar engine | Harper (WASM, fast, offline) as primary; LanguageTool (local server / JVM or Docker) as deep check |
| Local LLM runtime | Ollama HTTP API (`http://localhost:11434`); LM Studio OpenAI-compatible as fallback |
| Optional cloud | BYO key: OpenAI + Anthropic adapters, off by default |
| Extension | Manifest V3, React + Vite (`@crxjs/vite-plugin`) |
| Desktop | Tauri v2, React + Vite frontend, Rust backend |
| UI kit | React + Tailwind + Radix primitives; shared `@kalam/ui` |
| Testing | Vitest (unit), Playwright (ext e2e), tauri-driver (desktop smoke) |
| State/store | Zustand in UIs; settings persisted via extension storage / Tauri store plugin |
| Detector model | Local heuristic + optional ONNX classifier (see §7). No dependency on Pangram's API. |

---

## 3. Product scope & feature list

### 3.1 Shared features (both surfaces)
1. **Grammar & spelling checks** — underline issues, hover card with explanation + one-click fix.
2. **Style suggestions** — conciseness, passive voice, weak/hedge words, repetition, readability grade.
3. **Rewrite** — select text → choose a goal (Improve, Shorten, Expand, Formal, Casual, Confident, Simplify) → get rewrites; accept/replace.
4. **Humanize (flagship)** — rewrite text to read naturally and lower AI-detector flag probability, while preserving meaning. Shows a local "AI-likelihood" score before/after (see §7). Iterative: user can re-run to push the score down.
5. **Tone/readability meter** — live readability (Flesch-Kincaid), tone label, word/char count.
6. **Custom dictionary + ignore rules**, per-language (start with English; architecture must allow more).
7. **Privacy indicator** — always-visible badge: "Local" (green) vs "Cloud: <provider>" (amber) so the user knows where their text is going.
8. **History / snapshots** — recent rewrites, undo.

### 3.2 Extension-only
- Inline underlines in editable fields (`input`, `textarea`, `contenteditable`) via an injected overlay.
- Floating action button near the caret / on selection.
- Popup with settings + quick stats.
- Options page for full settings and model/provider config.
- Site allowlist/denylist.

### 3.3 Desktop-only (the "more powerful" surface)
- System-wide capture: global hotkey grabs selected text from the frontmost app (clipboard-assisted), rewrites, and pastes back or shows in a HUD window.
- Built-in editor workspace (paste/type long docs, full checking + humanize on large text with chunking).
- **Model Manager**: detect Ollama, list/pull/remove models, pick default rewrite + humanize models, show RAM/VRAM guidance.
- Batch mode: run humanize/grammar over a folder of `.txt`/`.md` files.
- Local, on-disk history DB (SQLite via Tauri SQL plugin).
- Menu-bar/tray presence, launch on login (optional).

### 3.4 Explicit non-goals for v1
- No account system, no cloud sync, no telemetry server. (Optional anonymous local-only usage counters allowed, off by default.)
- No mobile app.
- No real-time collaboration.
- No payment/licensing system (leave a clean seam for it later).

---

## 4. Repository layout

Create exactly this structure (M0 builds the skeleton):

```
kalam/
├─ package.json                 # root, pnpm workspaces + turbo scripts
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
├─ .eslintrc.cjs / eslint.config.js
├─ .prettierrc
├─ .github/workflows/ci.yml     # runs the §2.3 commands on push
├─ KALAM.md                     # this file (copy in)
├─ AGENT_LOOP.md                # condensed §2 for quick reference
├─ PROGRESS.md                  # loop state (agent-maintained)
├─ RELEASE_NOTES.md             # produced at the end
├─ packages/
│  ├─ core/                     # @kalam/core — engine, no UI
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ grammar/            # Harper + LanguageTool adapters
│  │  │  ├─ rewrite/            # rewrite goals + orchestration
│  │  │  ├─ humanize/           # humanize pipeline (§6)
│  │  │  ├─ detect/             # AI-likelihood scorer (§7)
│  │  │  ├─ llm/                # LLM adapter interface + providers
│  │  │  ├─ text/               # tokenization, chunking, diffing, readability
│  │  │  ├─ settings/           # settings schema (zod) + defaults
│  │  │  └─ types.ts
│  │  └─ test/
│  ├─ ui/                       # @kalam/ui — shared React components
│  └─ tsconfig-config/          # shared tsconfig presets
├─ apps/
│  ├─ extension/                # @kalam/extension (MV3, Vite + crxjs)
│  │  ├─ src/{background,content,popup,options,overlay}/
│  │  ├─ manifest.config.ts
│  │  └─ vite.config.ts
│  └─ desktop/                  # @kalam/desktop (Tauri v2)
│     ├─ src/                   # React frontend
│     ├─ src-tauri/             # Rust backend
│     │  ├─ src/{main.rs,commands.rs,capture.rs,ollama.rs,store.rs}
│     │  ├─ Cargo.toml
│     │  └─ tauri.conf.json
│     └─ vite.config.ts
└─ e2e/                         # Playwright + tauri-driver specs
```

---

## 5. `@kalam/core` — the shared engine (build this thoroughly; both apps depend on it)

The core is UI-agnostic and side-effect-free except through injected adapters. This is what makes the whole thing testable in the loop without a live model.

### 5.1 Central interfaces (`types.ts`)
Define (agent may refine, keep names stable):

```ts
export interface LlmAdapter {
  id: 'ollama' | 'lmstudio' | 'openai' | 'anthropic' | 'mock';
  isLocal: boolean;
  complete(req: LlmRequest): Promise<LlmResponse>;      // non-streaming
  stream?(req: LlmRequest): AsyncIterable<LlmChunk>;     // optional streaming
  listModels?(): Promise<ModelInfo[]>;
}

export interface GrammarEngine {
  check(text: string, opts: CheckOptions): Promise<Issue[]>;
}

export interface Issue {
  id: string;
  range: { start: number; end: number };     // char offsets into original text
  type: 'spelling' | 'grammar' | 'style' | 'punctuation' | 'readability';
  severity: 'low' | 'med' | 'high';
  message: string;
  shortMessage: string;
  suggestions: string[];                       // ordered best-first
  rule?: string;
}

export interface RewriteRequest {
  text: string;
  goal: RewriteGoal;                            // 'improve'|'shorten'|...|'humanize'
  tone?: Tone;
  strength?: number;                            // 0..1 how aggressive
  preserve?: { citations?: boolean; markdown?: boolean; numbers?: boolean };
  locale?: string;
}

export interface RewriteResult {
  text: string;
  diff: DiffOp[];                               // for inline accept/reject
  meta: { model: string; local: boolean; scoreBefore?: number; scoreAfter?: number };
}
```

All public core functions accept their adapters as parameters (or via a small `KalamEngine` class constructed with `{ llm, grammar, detector }`). No global singletons.

### 5.2 Grammar (`grammar/`)
- **HarperEngine**: wrap Harper's WASM linter. Runs everywhere (browser + Tauri webview). Fast, use for live checking. Map Harper lints → `Issue`.
- **LanguageToolEngine**: talk to a local LanguageTool HTTP server (`http://localhost:8081/v2/check`). Used for deeper on-demand checks in desktop. Provide a docker-compose / instructions file; degrade gracefully if not running (return []).
- **CompositeEngine**: merges results, dedups overlapping ranges (prefer higher severity), stable sort by range start.
- Readability + style rules that don't need a server live in `text/` as pure functions (passive voice heuristic, hedge-word list, sentence-length flags, repetition detector, Flesch-Kincaid).

### 5.3 LLM adapters (`llm/`)
- `OllamaAdapter`: POST `/api/generate` or `/api/chat`; support streaming; `listModels()` via `/api/tags`.
- `LmStudioAdapter`: OpenAI-compatible `/v1/chat/completions` at `http://localhost:1234`.
- `OpenAiAdapter`, `AnthropicAdapter`: BYO key from settings; **guard**: throw if `settings.cloud.enabled !== true`.
- `RuleAdapter`: **the no-AI (T0) engine, not a mock.** Implements `LlmAdapter` but performs the deterministic rule-based transforms (§6.2 `postProcess`, conciseness/style rewrites) with zero LLM. This is the real fallback that ships and runs when no model is reachable. `isLocal: true`, `id: 'rule'`.
- `MockAdapter`: deterministic, echo-with-transform; used by ALL unit tests and CI. (Distinct from `RuleAdapter` — Mock is for tests, Rule is a real shipping fallback.)
- A `resolveAdapter(settings): LlmAdapter` factory picks the adapter per the privacy policy **and availability**: cloud (if opt-in + key) → local LLM (if a model is reachable via health check) → **`RuleAdapter` (always succeeds, never throws "no model")**. Availability is probed with a fast timeout; failures fall through to the next tier, never to an error the user sees as a dead end.

### 5.4 Rewrite (`rewrite/`)
- Prompt templates per goal in a `prompts/` map, versioned. Templates instruct: preserve meaning, keep length band, respect `preserve` flags, return only rewritten text.
- `rewrite(engine, req)` → calls adapter, post-processes (strip model preambles like "Here is…"), computes `diff` via a word-level diff in `text/diff.ts`.
- Chunking for long text: split on paragraph/sentence boundaries under a token budget, rewrite per chunk, stitch. Keep offsets correct.

### 5.5 Settings (`settings/`)
- Zod schema `SettingsSchema` with defaults. Fields: `backend` (`local`|`cloud`), `cloud: { enabled, provider, apiKey (never logged) }`, `models: { rewrite, humanize }`, `humanize: { targetScore, maxPasses, preserveMeaningStrict }`, `privacy: { showBadge }`, `locale`, `customDictionary: string[]`, `ignoredRules: string[]`, `humanizeAckAt?: number`.
- Serialize/deserialize; migrations by `version` field.

---

## 6. Humanize pipeline (`humanize/`) — the flagship feature

Goal: rewrite text so it **reads naturally / like a specific human register** and **scores lower on AI-likelihood**, while preserving meaning. This is an iterative optimize-against-a-local-scorer loop. It must be fully deterministic in tests via the MockAdapter + a stubbed detector.

### 6.1 Algorithm
```
humanize(engine, text, opts):
  ack_gate()                                  # enforce §1 one-time acknowledgement
  chunks = chunk(text)
  for each chunk:
    best = chunk; best_score = detector.score(chunk)
    for pass in 1..opts.maxPasses (default 3):
      if best_score <= opts.targetScore: break
      variants = llm.rewrite(best, HUMANIZE_PROMPT(strength, pass))  # 2–3 variants
      variants = variants.filter(meaningPreserved(best, v) >= threshold)  # semantic guard
      scored   = variants.map(v => (v, detector.score(v)))
      pick     = argmin(scored, score)
      if pick.score < best_score: best, best_score = pick
    result_chunks.push(best)
  stitch, recompute diff, return {text, scoreBefore, scoreAfter}
```

### 6.2 What "humanizing" actually does (bake into prompts + optional deterministic post-processors)
Detectors key on low burstiness/perplexity and over-regular structure. The humanize prompt and post-processors should:
- **Vary sentence length** (mix short and long; increase burstiness).
- **Reduce formulaic transitions** ("Moreover", "Furthermore", "In conclusion", "It is important to note that").
- **Prefer concrete, specific wording** over generic filler; cut hedging and redundancy.
- **Allow mild, natural informality** where tone permits (contractions, varied punctuation) — configurable, off for "formal".
- **Preserve meaning, facts, numbers, citations, and markdown** (respect `preserve` flags).
- Never inject invisible/zero-width unicode or homoglyph tricks — that's brittle, detectable, and dishonest. Do NOT implement unicode obfuscation. (Explicit anti-requirement.)

Provide a deterministic `postProcess()` (no LLM) that applies safe swaps (transition-word trimming, contraction application by register, sentence-length variation, redundancy/hedge removal). **This is not just a test baseline — it is the shipping T0 humanize path** (via `RuleAdapter`), so it must produce genuinely useful output on real text, not a token change. When an LLM is present, the LLM variants and this rule pass are both fed through the scorer and the best is chosen, so AI strictly improves on the no-AI result.

### 6.3 Meaning-preservation guard
Implement `meaningPreserved(a, b)`:
- Baseline (offline, always available): normalized token-set overlap / cosine on bag-of-words + length ratio + number/entity retention check. Cheap, deterministic.
- Optional better path: embedding cosine via a local embedding model if available (Ollama embeddings). Behind capability check.
- Reject variants below threshold so humanize can't silently change facts.

### 6.4 Acceptance criteria for Humanize (M5)
- Unit tests with MockAdapter + StubDetector prove: iterates up to `maxPasses`, stops early when `targetScore` reached, never returns a variant that fails the meaning guard, preserves numbers and markdown, is deterministic given fixed inputs.
- `scoreBefore >= scoreAfter` in the mocked scenario where the mock rewrite is designed to reduce score.
- No zero-width/unicode-obfuscation characters ever appear in output (assert via regex test).

---

## 7. AI-likelihood detector (`detect/`)

Kalam ships its **own local** likelihood estimator. It does not call Pangram or any third-party detector API (no dependency, no data leaving the machine). It's used (a) to show users a before/after score and (b) as the optimization signal inside Humanize. Frame it in UI as an *estimate*, not ground truth.

**Anti-overfitting rule:** the humanize loop optimizes against this local estimate, so treat the score as a proxy, not the objective. The meaning guard and readability always outrank the score — reject any variant that lowers the score but reads worse, drops content, or games individual heuristic features (e.g., mechanically injecting rare words to inflate lexical diversity).

Two tiers:
1. **Heuristic scorer (always on, pure TS, deterministic):** combine features known to correlate with machine text — low burstiness (variance of sentence lengths), low lexical diversity (type-token ratio), high rate of formulaic transitions, uniform sentence openers, low punctuation variety, average dependency on high-frequency words. Output 0–100 "AI-likelihood estimate". Fully unit-testable.
2. **Optional ONNX classifier (desktop, if model present):** load a small text classifier via `onnxruntime` if a model file is provided; otherwise silently fall back to heuristic. Do NOT bundle a large model; document how to drop one in. The interface is `Detector.score(text): number` regardless of tier.

Acceptance: given a hand-written "human-like" sample and a "machine-like" sample fixture, the heuristic ranks machine-like higher. Test asserts the ordering, not absolute values.

---

## 8. Browser extension (`apps/extension`) — MV3

### 8.1 Architecture
- **Background service worker**: owns settings, routes messages, calls `@kalam/core` (adapters that use `fetch` to localhost Ollama / LanguageTool). Handles allowlist.
- **Content script**: detects editable elements, tracks caret/selection, injects the **overlay** (a shadow-DOM UI so host CSS can't break it). Debounced live grammar check via Harper WASM — run the WASM in the background service worker or an offscreen document and message results to the content script (loading WASM inside content scripts trips extension CSP / `wasm-unsafe-eval` and duplicates the engine per tab).
- **Overlay**: underlines (positioned divs, not modifying host DOM text), hover cards, floating action button on selection with Rewrite/Humanize actions and the privacy badge.
- **Popup**: quick toggle (on/off for site), stats, open options.
- **Options page**: full settings — backend (local/cloud), Ollama URL + model pickers (fetched live), BYO key entry, humanize defaults, dictionary, allowlist.
- **Key storage caveat:** browsers expose no keychain — extension BYO keys live in `browser.storage.local` (never `storage.sync`), masked in UI, with the storage location stated plainly next to the field. Desktop uses the OS keychain (§9.1).

### 8.2 Cross-browser
- Manifest V3. Use `webextension-polyfill`. Firefox build variant (MV3 in current Firefox) produced by the same Vite config with a target flag. Provide `pnpm --filter @kalam/extension build:chrome` and `build:firefox`.
- **Firefox background model differs:** Firefox MV3 runs the background as an event page, not a service worker — the Firefox manifest must use `background.scripts` (+ `browser_specific_settings.gecko`). Keep background code stateless and worker-safe so both targets share one implementation.
- Host permissions: request localhost for Ollama/LanguageTool; `activeTab` + user-granted site permissions rather than `<all_urls>` where possible.

### 8.3 Acceptance criteria (M6)
- Loads unpacked in Chromium (Playwright `pnpm e2e:ext`) with no console errors.
- On a test page with a `<textarea>`, typing text with a known error surfaces an underline; clicking the suggestion replaces the text.
- Selecting text shows the action bar; clicking Humanize (with MockAdapter wired in test/dev mode) replaces selection and updates the badge.
- Privacy badge reflects local vs cloud correctly.
- Settings persist across popup reloads.

---

## 9. Desktop app (`apps/desktop`) — Tauri v2

### 9.1 Architecture
- Rust backend exposes `#[tauri::command]`s: `capture_selection`, `paste_text`, `list_ollama_models`, `pull_ollama_model` (streamed progress via events), `grammar_deep_check`, `run_humanize`, `history_query`, `settings_get/set`.
- Frontend (React) reuses `@kalam/core` and `@kalam/ui`. Long-text editor workspace, Model Manager, Batch mode, History, Settings.
- **System-wide capture:** global shortcut (Tauri global-shortcut plugin) → read current selection (via clipboard copy simulation, OS-appropriate) → rewrite/humanize → show HUD or paste back. Implement per-OS; if an OS path is unavailable, degrade to "read from clipboard / write to clipboard" and document it.
- **Storage:** Tauri SQL plugin (SQLite) for history; Tauri store plugin for settings. Secrets (BYO API key) via OS keychain (Tauri stronghold/keyring) — never plaintext on disk.
- **Ollama integration:** detect install, health-check `:11434`, pull models with progress, guidance on model size vs RAM.

### 9.2 Acceptance criteria (M7)
- `pnpm --filter @kalam/desktop tauri build` produces an installer for the host OS.
- `pnpm e2e:desktop` launches the app; a smoke test drives the editor: paste text → run grammar check (Harper) → issues render; run humanize with MockAdapter → text updates, before/after score shown.
- Model Manager lists Ollama models when Ollama is running; shows a clear empty/error state when not (must not crash).
- API key stored via keychain, not readable from the settings file.

---

## 10. UI / Design System guideline (build `@kalam/ui` to this; it is the source of truth for both surfaces)

**Design principle:** *Calm, trustworthy, out of the way.* Kalam is a privacy tool that touches the user's writing everywhere, so the UI must feel quiet and precise — never loud, never nagging. Suggestions are offered, not shouted. The interface earns trust by always making it obvious **where the text is going** (local vs cloud) and **which capability tier** is active.

Everything below ships as **design tokens + React components in `@kalam/ui`**, consumed identically by the extension and desktop. Do not hardcode colors, spacing, or type sizes in app code — reference tokens only. Tokens are defined once as CSS custom properties + a Tailwind preset (`@kalam/ui/tailwind-preset`) and mirrored to a TS object for non-DOM use.

### 10.1 Brand
- **Name/wordmark:** "Kalam" set in the display font, lowercase-friendly. Tagline lockup: *Write clearly. Sound human.*
- **Logo:** a minimal nib/pen mark. Provide `mark`, `wordmark`, and `lockup` SVGs; monochrome variants for tray/favicon at 16/32/48/128px.
- **Voice/tone in copy:** plain, warm, second person, low jargon. Encouraging, never scolding ("Try a shorter sentence here" not "Error: sentence too long"). Honesty over hype — especially around detector scores ("estimate", "detectors vary").

### 10.2 Color tokens
Define semantic tokens (not raw hex in components). Provide **light and dark** themes; default to system preference. Contrast must meet WCAG AA (≥4.5:1 text, ≥3:1 large text/UI).

```
Brand
  --k-primary            #3B3B98   (ink-indigo — brand, primary actions)
  --k-primary-hover      #32328A
  --k-primary-subtle     #EBEBFB   (tinted backgrounds, selected states)
  --k-accent             #16B8A6   (teal — "Humanize"/AI-boost accent only)

Surfaces (light)
  --k-bg                 #FBFAF7   (warm off-white app background)
  --k-surface            #FFFFFF   (cards, panels)
  --k-surface-2          #F3F2EE   (insets, hover rows)
  --k-border             #E4E2DC
  --k-text               #1C1B22   (primary text)
  --k-text-muted         #63616C   (secondary)
  --k-text-subtle        #94929C   (hints, placeholders)

Surfaces (dark)  — mirror with #14131A bg, #1E1D26 surface, #2A2933 border, #ECEBF0 text …

Issue / status semantics (underlines + chips)
  --k-spelling           #E5484D   (red)
  --k-grammar            #F5A623   (amber)
  --k-style              #3B82F6   (blue)
  --k-readability        #8B5CF6   (violet)
  --k-success            #12A150   (green — accepted, resolved)

Privacy / tier badge (semantic, load-bearing — do not restyle ad hoc)
  --k-local              #12A150   (green  = fully local / no data leaves device)
  --k-cloud              #F5A623   (amber  = cloud provider active, named)
  --k-tier-noai          #63616C   (grey   = T0 rule-based, no model)
```

Underline colors map 1:1 to issue `type`. Never use color as the *only* signal — pair with icon/shape and text in the hover card (a11y + colorblindness).

### 10.3 Typography
- **UI/sans:** Inter (bundled/self-hosted, no CDN for privacy). **Display:** Inter Display or the same at tighter tracking for headings/wordmark. **Mono:** JetBrains Mono for diffs/code.
- **Type scale (rem):** `xs .75 / sm .875 / base 1 / md 1.125 / lg 1.25 / xl 1.5 / 2xl 1.875 / 3xl 2.25`. Line-height 1.5 body, 1.25 headings.
- **Editor/reading text** (desktop workspace): 1.0625rem, generous 1.6 line-height, max measure ~72ch for comfortable long-form editing.
- Weights: 400 body, 500 medium (labels/buttons), 600 semibold (headings). Avoid 700+ except wordmark.

### 10.4 Spacing, radius, elevation, motion
- **Spacing scale (px):** 2, 4, 8, 12, 16, 20, 24, 32, 40, 48 (`--k-space-*`). Base rhythm = 8.
- **Radius:** `sm 6 / md 10 / lg 14 / pill 999`. Cards `md`, buttons `md`, chips `pill`, popovers `lg`.
- **Elevation:** three levels only — `e1` hover cards, `e2` popovers/floating bar, `e3` modals/HUD. Soft, low-spread shadows (privacy-tool calm), no harsh drop shadows.
- **Motion:** fast and subtle. Durations `120ms` micro, `180ms` standard, `240ms` panel. Easing `cubic-bezier(.2,.8,.2,1)`. Underlines fade in, never bounce. **Respect `prefers-reduced-motion`: disable non-essential transitions, no dial animation.** Motion must never delay a suggestion appearing.

### 10.5 Iconography
- Single icon set (Lucide), 1.5px stroke, 16/20/24 sizes. Consistent metaphors: sparkle = AI boost, shield = privacy/local, wand = humanize, check = accept, x = dismiss, book = dictionary, gauge = readability/score.

### 10.6 Core components (in `@kalam/ui`, one implementation, both apps)
Each with all interaction states (default/hover/active/focus-visible/disabled/loading) and full keyboard + ARIA:
1. **PrivacyBadge** — always-visible pill showing tier: 🛡 *Local* (green) / ☁ *Cloud: OpenAI* (amber) / *No AI · rules* (grey). Tooltip explains what it means. This is load-bearing; render it on every surface that transforms text.
2. **TierChip / "Boost with AI"** — appears when a model becomes reachable; inviting, not nagging. Shows current tier and a one-tap way to enable local/cloud AI. Absent when already at best tier.
3. **SuggestionCard** (hover/popover) — issue icon + type label + plain-language message + before/after preview + primary "Apply" and secondary "Dismiss"/"Add to dictionary". Keyboard: arrows to move between suggestions, Enter apply, Esc dismiss.
4. **FloatingActionBar** — appears on text selection: Rewrite ▾ (goal menu), Humanize (accent), Check. Compact, positioned above selection, flips when near viewport edge, never covers the caret.
5. **RewriteGoalMenu** — Improve / Shorten / Expand / Formal / Casual / Confident / Simplify + Humanize. Icons + short descriptions.
6. **HumanizePanel** — see §10.8.
7. **DiffView** — inline word-level additions (underlined, `--k-success`) and deletions (strikethrough, muted); accept/reject per hunk and "Accept all". Mono not required for prose diffs.
8. **ReadabilityMeter** — compact gauge: Flesch-Kincaid grade + tone label + word/char count. Honest, non-alarming.
9. **Underline** (overlay primitive) — positioned, colored per issue type, wavy for spelling/grammar, straight dotted for style; must not shift host layout.
10. **SettingsForm controls** — Toggle, Select (model pickers), SegmentedControl (backend: No-AI / Local / Cloud), ApiKeyField (masked, "stored in your OS keychain" helper), List editor (dictionary/allowlist).
11. **EmptyState / ErrorState** — friendly illustrations + one clear action (see §10.9).
12. **Toast** — brief, bottom, auto-dismiss; used sparingly (e.g., "Rewrite applied · Undo").

### 10.7 Layout per surface
**Extension popup** (~360×480px): header with wordmark + PrivacyBadge; site on/off toggle; today's quick stats; "Open full settings". Nothing scrolls unnecessarily.
**Extension options page** (full tab): left nav (General · Models & AI · Humanize · Dictionary · Sites · About), right content max ~720px measure. Cloud key entry gated behind an explicit "Enable cloud AI" toggle with a plain privacy explanation.
**Extension overlay** (in-page): only the underlines, FloatingActionBar, and SuggestionCard — zero chrome, Shadow DOM, high but polite z-index, dismiss on scroll/click-away.
**Desktop workspace:** three-pane — left rail (Editor · Humanize · Batch · Model Manager · History · Settings), center editor (max ~72ch, live underlines), right inspector (issue list, ReadabilityMeter, or HumanizePanel depending on mode). Top bar: document title, PrivacyBadge, tier/model selector, Boost-with-AI.
**Desktop HUD** (global-capture result): small always-on-top window near cursor — original vs rewritten, PrivacyBadge, Apply (paste back) / Copy / Humanize-again / Close. Fast to summon, fast to dismiss (Esc).
**Desktop Model Manager:** list installed Ollama models (name, size, RAM guidance), pull-with-progress, set default rewrite/humanize models, health status of Ollama; clear guidance + "works without this" reassurance when Ollama absent.

### 10.8 Humanize panel (the flagship UI — get this right)
- **Before/after AI-likelihood** shown as two dial/bar readouts with the honest caption **"Estimated — real detectors vary."** Never claim certainty or name a guarantee against Pangram/any detector.
- **Meaning-preservation indicator** — a clear "Meaning preserved ✓ / ⚠ check this" state driven by `meaningPreserved()`. If a pass would drop below threshold it's rejected and the UI says so.
- **Pass controls** — shows pass count; primary **"Lower further"** re-runs another pass; **"Revert"** returns to original. Strength slider (subtle→strong) and a Register selector (keep formal / allow casual).
- **Tier awareness** — if no model: runs the rule-based humanize and shows "Rules only — connect a local model for stronger results" as an invite, not an error. If local model: shows model name. If cloud: amber badge + provider name.
- **DiffView** of the change with per-hunk accept/reject.
- **First-run ethics acknowledgement** (§1) appears here once, inline and calm, with an "I understand" action; stored locally.

### 10.9 States (design every one — no dead ends)
For every AI-dependent action define: **loading** (skeleton/inline spinner, cancellable), **no-model** (offer rule-based result + invite to connect — never a blocking error), **model-error/timeout** (fall back to rules, quiet toast), **cloud-disabled** (explain + link to enable), **empty** (no issues found = a calm "Looks clean ✓", not a blank void), **offline** (everything T0 still works — say so). The absence of AI is always framed as "still works, better with a model," never as failure.

### 10.10 Accessibility (required, part of M8 DoD)
- WCAG 2.1 AA: contrast ≥4.5:1 (text) / ≥3:1 (UI + large text) verified against tokens; color never the sole signal.
- Full keyboard operability: every suggestion, goal, and control reachable and operable; visible `:focus-visible` ring (2px, `--k-primary`, ≥3:1 against bg). Logical tab order; Esc closes popovers/HUD.
- Screen readers: ARIA roles/labels on badge, suggestion cards (announce issue type + message + suggestion), diff hunks, and score readouts (announce "estimated AI-likelihood: X of 100"). Underlines exposed via accessible description, not color alone.
- `prefers-reduced-motion` honored; `prefers-color-scheme` drives theme; respects OS text-size where the platform allows.
- Touch/click targets ≥ 24×24px (≥44px on any touch context). Use the available accessibility-review resources to audit before M8 sign-off.

### 10.11 Deliverables for the design system (part of M0/M8)
- `@kalam/ui`: tokens (CSS vars + Tailwind preset + TS mirror), all §10.6 components with stories/examples, light+dark themes, icon wrapper.
- A single **`ui-gallery`** page (dev-only route in desktop + a static page) rendering every component in every state — this doubles as a visual regression + a11y audit surface for the loop.
- Brand assets (logo variants, favicons, tray icons, extension store icons at required sizes).

---

## 11. Milestones (STRICTLY ORDERED — this is the loop's backbone)

Each milestone: **Tasks** (checklist) + **Definition of Done** (the green-check gate). The agent fills checkboxes in `PROGRESS.md`.

### M0 — Repo & tooling skeleton + design tokens
Tasks: init pnpm workspace + turbo; pin the toolchain for loop reproducibility (`engines` + `packageManager` fields, `.nvmrc`); add a LICENSE (MIT unless instructed otherwise); base tsconfig/eslint/prettier; empty `@kalam/core`, `@kalam/ui`, `apps/extension`, `apps/desktop` that build; **scaffold `@kalam/ui` design tokens per §10.2–10.5 (CSS vars + Tailwind preset + TS mirror, light+dark) and a `ui-gallery` route stub**; wire all §2.3 scripts (real for build/test/lint/typecheck; e2e scripts may be stubs that exit 0 with a TODO but must exist); CI workflow; create `PROGRESS.md` + `AGENT_LOOP.md`.
**DoD:** `pnpm -r build`, `test`, `lint`, `typecheck` all exit 0 on empty-but-structured packages; tokens importable from `@kalam/ui`. CI green. Tag `m0-complete`.

> UI components from §10.6 are built incrementally as the milestones that use them land (SuggestionCard/overlay in M6, HumanizePanel in M5/M6, Model Manager in M7), all styled from the M0 tokens. M8 completes the full `ui-gallery` and a11y audit.

### M1 — Core types, settings, text utils
Tasks: implement `types.ts`; zod `SettingsSchema` + defaults + migration; `text/` utilities (tokenize, sentence split, chunker with token budget, word-level diff, Flesch-Kincaid, TTR, burstiness). Full unit tests.
**DoD:** `pnpm -r test` covers text utils and settings (≥90% of `text/` and `settings/` lines). Diff round-trips (apply(diff, a) === b).

### M2 — LLM adapters + MockAdapter
Tasks: adapter interface; `MockAdapter` (deterministic); `OllamaAdapter` + `LmStudioAdapter` (integration-tested behind a flag, unit-tested with fetch mocks); `OpenAiAdapter`/`AnthropicAdapter` with the cloud-enabled guard; `resolveAdapter` factory enforcing privacy policy.
**DoD:** tests prove cloud adapters throw when `cloud.enabled=false`; `resolveAdapter` returns local by default; Ollama adapter parses `/api/tags` fixture.

### M3 — Grammar engines
Tasks: HarperEngine (WASM) mapping to `Issue`; LanguageToolEngine (HTTP, graceful degrade); CompositeEngine (merge/dedup/sort); style/readability rules as pure functions.
**DoD:** unit tests: Harper flags a seeded error and offers a fix; composite dedups overlapping ranges; LT engine returns [] when server absent without throwing.

### M4 — Rewrite pipeline
Tasks: prompt templates per goal; **`RuleAdapter` deterministic no-AI rewrite for every goal**; `rewrite()` with post-processing + chunking + diff; preserve flags (markdown/numbers/citations); `resolveAdapter` availability fallthrough to `RuleAdapter`.
**DoD:** with MockAdapter, each goal returns transformed text + valid diff; **with `RuleAdapter` (no LLM), each goal still returns a meaningfully improved result** (asserted, not a no-op); markdown/numbers preserved; long text chunked with correct stitched offsets; `resolveAdapter` returns `RuleAdapter` (never throws) when no model is reachable.

### M5 — Detector + Humanize (flagship)
Tasks: heuristic detector (§7 tier 1) + ONNX seam (tier 2); humanize pipeline (§6) with meaning-preservation guard, iterative passes, ack gate; deterministic `postProcess()` baseline.
**DoD:** all §6.4 + §7 acceptance tests pass. **Humanize runs end-to-end with `RuleAdapter` (no LLM) and lowers the AI-likelihood estimate on a fixture while preserving meaning** — proving the feature works with zero AI. With an LLM present, output is at least as good as the rule-only pass. No unicode-obfuscation in output (regex test). scoreAfter ≤ scoreBefore.

### M6 — Browser extension
Tasks: MV3 scaffold (crxjs); background/content/overlay/popup/options; live Harper underlines; selection action bar (Rewrite/Humanize); privacy badge; settings UI + persistence; allowlist; Chrome + Firefox builds; Playwright e2e.
**DoD:** §8.3 all pass. `pnpm e2e:ext` green. Both browser builds produce loadable artifacts.

### M7 — Desktop app
Tasks: Tauri v2 scaffold; commands; editor workspace; Model Manager (Ollama detect/list/pull w/ progress); global-hotkey capture (+ clipboard fallback); SQLite history; keychain for secrets; Batch mode; tray + optional launch-at-login.
**DoD:** §9.2 all pass. `tauri build` yields an installer. `pnpm e2e:desktop` green.

### M8 — Polish, docs, release
Tasks: **complete `ui-gallery` (every §10.6 component in every §10.9 state, light+dark)**; a11y pass per §10.10 (keyboard, contrast against tokens, SR labels, focus-visible, reduced-motion, target sizes); error/empty states everywhere (Ollama down, no models, no network for cloud) framed as "still works, better with a model"; onboarding (first-run: use no-AI now / connect Ollama / optional BYO key); brand assets (logo/favicon/tray/store icons); README per app + root; `RELEASE_NOTES.md`; version bump; final full-suite run.
**DoD:** every §2.3 command green; `ui-gallery` renders all components/states; automated + manual a11y checks pass (WCAG AA per §10.10); docs + brand assets complete; `m8-complete` tag.

---

## 12. `PROGRESS.md` template (agent creates on iteration 1)

```markdown
# Kalam — Loop Progress

Current milestone: M0
Loop iteration: 0

## Milestones
- [ ] M0 Repo & tooling skeleton
- [ ] M1 Core types, settings, text utils
- [ ] M2 LLM adapters + MockAdapter
- [ ] M3 Grammar engines
- [ ] M4 Rewrite pipeline
- [ ] M5 Detector + Humanize
- [ ] M6 Browser extension
- [ ] M7 Desktop app
- [ ] M8 Polish, docs, release

## Current milestone task checklist
(copy tasks for the active milestone here, check them off)

## Changelog
- <date> iter <n>: <what changed> — build:PASS test:PASS lint:PASS

## BLOCKERS
(none)

## Deferred / TODO discovered
(none)
```

---

## 13. Definition of "fully refined working app" (global exit criteria)
All true simultaneously:
1. `pnpm -r build && pnpm -r test && pnpm -r lint && pnpm -r typecheck && pnpm e2e:ext && pnpm e2e:desktop` all exit 0.
2. Extension loads in Chrome & Firefox; live grammar + rewrite + humanize work (a) with **no AI at all** via `RuleAdapter`, (b) against a local Ollama model, and (c) against MockAdapter in tests. The app is never in a dead-end "no model" state.
3. Desktop app builds to an installer; editor, Model Manager, global-capture, humanize, and history all function; secrets in keychain.
4. Humanize measurably lowers the local AI-likelihood estimate on real samples while the meaning-preservation guard holds; no unicode obfuscation.
5. Privacy default is local; no text leaves the machine unless the user turned on a cloud provider and entered a key.
6. Legal/ethics guardrails (§1) present. Docs + RELEASE_NOTES complete. All milestones tagged.

---

## 14. Quick reference — external dependencies the agent will touch
- **Harper**: `harper.js` / WASM linter (offline grammar).
- **LanguageTool**: local HTTP server (optional deep check) — provide docker instructions.
- **Ollama**: local LLM runtime, HTTP API on `:11434`. Suggested default models to document (not bundle): a small instruct model for rewrite (e.g. an 8B-class model) with guidance that bigger = better quality but more RAM/VRAM.
- **onnxruntime-web / onnxruntime-node**: optional detector classifier.
- **crxjs/vite-plugin, webextension-polyfill**: extension.
- **Tauri v2 plugins**: sql, store, global-shortcut, keyring/stronghold, autostart.
- **Vitest, Playwright, tauri-driver**: testing.

Document exact versions in each `package.json`/`Cargo.toml` as you add them; pin versions for loop reproducibility.

---

*End of spec. Begin at M0. Maintain `PROGRESS.md` every iteration. Do not skip milestones. Verify with real commands, not assertions.*
