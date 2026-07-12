# Kalam

**Website & live rules demo:** https://kalam-write.vercel.app/

Kalam is a local-first writing assistant with a shared TypeScript core, browser extension, and Tauri desktop app.

Tagline: **Write clearly. Sound human.**

## What Works

- No-AI grammar/spelling/style checks, readability stats, rewrite goals, and Humanize baseline.
- Deterministic `RuleAdapter` fallback that never blocks users behind "no model found".
- Mock/local/cloud adapter interfaces with privacy guards for BYO cloud keys.
- Local AI-likelihood heuristic and iterative Humanize pipeline with meaning-preservation checks.
- Shared `@kalam/ui` tokens/components plus a UI gallery.
- Manifest V3 extension builds for Chrome and Firefox, including a static no-module UI gallery artifact.
- Desktop React workspace packaged by Tauri into Windows installers.
- Desktop Capture HUD with clipboard-assisted capture/paste, a `Ctrl+Alt+K` global shortcut fallback, tray actions, and launch-at-login setting.
- Desktop settings keep API keys out of `settings.json` and use Windows Credential Manager when available.
- Desktop history persists locally through SQLite when the local `sqlite3` CLI is available, with JSON fallback.
- Model Manager lists Ollama models and can pull models through Ollama's local `/api/pull` endpoint.

## Commands

```bash
pnpm install
pnpm -r build
pnpm -r test
pnpm -r lint
pnpm -r typecheck
pnpm e2e:ext
pnpm e2e:desktop
pnpm --filter @kalam/desktop tauri build
```

## Privacy Model

Kalam defaults to local/no-AI behavior. Cloud adapters require explicit `cloud.enabled=true` and a user-provided API key. Text transformations show a privacy tier badge in the UI.

## Workspace

- `packages/core`: engine, settings, text utilities, adapters, grammar/style, rewrite, detector, Humanize.
- `packages/ui`: design tokens, components, assets, gallery.
- `apps/extension`: MV3 extension with content overlay, popup, options, gallery.
- `apps/desktop`: Tauri v2 desktop shell with editor, Humanize, model manager, batch/history/settings views.
- `e2e`: Playwright smoke tests.

## External Integrations

The repo has local-first seams for Harper, LanguageTool, Ollama, LM Studio, OpenAI, Anthropic, Tauri SQL/keyring, and global capture. The current implementation ships graceful deterministic fallbacks so checks and UI flows work without those services. Some OS integrations use local workarounds while package fetching is blocked: Windows Credential Manager FFI for key storage, `sqlite3` CLI for history, and raw Win32 `Ctrl+Alt+K` for global HUD launch.
