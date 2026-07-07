# Kalam 0.1.0

Initial local-first build.

## Highlights

- Added the monorepo, CI, TypeScript tooling, linting, tests, and Playwright e2e.
- Built `@kalam/core` with settings, text utilities, LLM adapters, grammar/style checks, rewrite, detector, and Humanize.
- Built the deterministic no-AI `RuleAdapter` fallback.
- Added shared UI tokens, components, brand assets, and gallery.
- Added MV3 Chrome/Firefox extension builds with inline textarea correction, selected-text Humanize smoke coverage, and static no-module UI gallery output.
- Added Tauri desktop app with editor, Humanize panel, Capture HUD, batch mode, Model Manager, history, settings, tray actions, `Ctrl+Alt+K` HUD shortcut fallback, launch-at-login, and Windows installer output.
- Added native desktop hardening: Windows Credential Manager API key storage, local SQLite history through the installed `sqlite3` CLI fallback path, Ollama `/api/tags` and `/api/pull` integration, and clipboard-assisted capture/paste.
- Completed the shared UI gallery/a11y audit with dark-theme states, WCAG token contrast checks, focus/reduced-motion/touch-target checks, and assistive underline labels.

## Known Environment Workarounds

- Hardened capture/paste beyond clipboard-assisted fallbacks still needs the final Tauri plugin path once dependency fetching works reliably.
- SQLite currently uses the local `sqlite3` CLI fallback because adding `rusqlite` was blocked by Windows Schannel certificate revocation checks.
- Harper is represented by the local heuristic-compatible engine until the real Harper WASM package can be fetched.

## Verification

- `pnpm -r build`
- `pnpm -r test`
- `pnpm -r lint`
- `pnpm -r typecheck`
- `pnpm e2e:ext`
- `pnpm e2e:desktop`
- `pnpm --filter @kalam/desktop tauri build`
