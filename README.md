# Kalam

**Website & live rules demo:** https://kalam-write.vercel.app/

> **Write clearly. Sound human.** A local-first writing assistant — browser extension + desktop app — that works fully offline and never requires a cloud account.

## What is this?

Kalam checks grammar, spelling, style, and readability, offers goal-driven rewrites, and includes a **Humanize** pipeline that makes AI-drafted text read naturally — while preserving meaning. Its defining trait is the privacy ladder:

1. **No-AI mode (default)** — deterministic rule-based checks. Always works, nothing leaves your machine.
2. **Local AI** — plug in Ollama or LM Studio models running on your own hardware.
3. **BYO cloud** — optionally use your own OpenAI/Anthropic key, only after explicitly enabling `cloud.enabled=true`.

Every text transformation shows a privacy-tier badge, so you always know which level processed your words.

## What works today

- No-AI grammar/spelling/style checks, readability stats, rewrite goals, Humanize baseline
- Deterministic `RuleAdapter` fallback — users are never blocked behind "no model found"
- Local AI-likelihood heuristic and iterative Humanize with meaning-preservation checks
- Manifest V3 extension builds for Chrome and Firefox
- Tauri desktop app packaged into Windows installers
- Desktop Capture HUD: clipboard-assisted capture/paste, `Ctrl+Alt+K` global shortcut, tray actions, launch-at-login
- API keys stored in Windows Credential Manager (never in `settings.json`)
- Local history via SQLite (JSON fallback), Model Manager that lists and pulls Ollama models

## Architecture

A pnpm monorepo: one shared brain, two faces.

```
                 ┌────────────────────────────────────────┐
                 │        packages/core  (the brain)       │
                 │  engine · settings · text utilities     │
                 │  grammar/style rules · rewrite goals    │
                 │  AI-likelihood detector · Humanize      │
                 │                                          │
                 │  Adapter interfaces (swappable):         │
                 │   RuleAdapter (no-AI, always available)  │
                 │   Local  → Ollama / LM Studio            │
                 │   Cloud  → OpenAI / Anthropic (BYO key,  │
                 │            off by default, guarded)      │
                 └───────────────┬────────────────────────┘
                                 │ shared by
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
     apps/extension       apps/desktop        packages/ui
     Chrome/Firefox MV3   Tauri v2 (Rust      design tokens,
     content overlay,     shell + React):     components,
     popup, options       editor, Humanize,   UI gallery
                          model manager,
                          history, HUD
```

Why this shape: all language logic lives once in `core` and is exhaustively testable; the extension and desktop app are thin shells. The adapter pattern means "no model installed" degrades gracefully to rules instead of breaking, and cloud access is a deliberate, guarded opt-in rather than a default.

Some OS integrations use pragmatic local seams: Windows Credential Manager via FFI for key storage, the `sqlite3` CLI for history, and raw Win32 for the `Ctrl+Alt+K` global shortcut.

## Getting started (from zero)

### Prerequisites

| Tool | Why | Get it |
|---|---|---|
| Node.js 20+ | Everything | <https://nodejs.org> |
| pnpm | Monorepo manager | `npm install -g pnpm` |
| Rust toolchain | Only for building the desktop app | <https://rustup.rs> |
| Ollama (optional) | Local AI models | <https://ollama.com> |

### 1. Install and build

```bash
pnpm install
pnpm -r build      # builds every package in the workspace
```

### 2. Load the browser extension

1. `apps/extension` build output contains the MV3 bundle.
2. Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the extension build folder.
3. Firefox: `about:debugging` → **This Firefox** → **Load Temporary Add-on**.

### 3. Run the desktop app

```bash
pnpm --filter @kalam/desktop tauri build   # Windows installer
```

The first Rust build takes a while; the installer output lands under the desktop app's Tauri target folder.

### 4. (Optional) Add local AI

Install Ollama, then open Kalam's **Model Manager** — it lists installed models and can pull new ones through Ollama's local `/api/pull` endpoint. No configuration files needed.

### Everyday commands

| Command | What it does |
|---|---|
| `pnpm -r build` | Build all packages |
| `pnpm -r test` | Unit tests across the workspace |
| `pnpm -r lint` / `pnpm -r typecheck` | Quality gates |
| `pnpm e2e:ext` | Playwright smoke tests, extension |
| `pnpm e2e:desktop` | Playwright smoke tests, desktop |

## Workspace map

```
packages/core   engine, settings, adapters, grammar/style, rewrite, detector, Humanize
packages/ui     design tokens, components, assets, gallery
apps/extension  MV3 extension: content overlay, popup, options, gallery
apps/desktop    Tauri v2 shell: editor, Humanize, model manager, batch/history/settings
e2e             Playwright smoke tests
```

## Privacy model

Kalam defaults to local/no-AI behavior. Cloud adapters require explicit `cloud.enabled=true` **and** a user-provided API key. Keys never sit in plain config files on Windows — they go to Credential Manager. Transformations are badged with their privacy tier in the UI.

## Troubleshooting

- **"No model found"** → not an error; Kalam falls back to deterministic rules. Install Ollama for local AI.
- **Desktop build fails** → check `cargo --version`; the Rust toolchain is required only for `apps/desktop`.
- **Global shortcut doesn't fire** → another app may own `Ctrl+Alt+K`; change it in desktop settings.
