# Kalam - Loop Progress

Current milestone: M7/M8 hardening audit
Loop iteration: 10

## Milestones
- [x] M0 Repo & tooling skeleton
- [x] M1 Core types, settings, text utils
- [x] M2 LLM adapters + MockAdapter
- [x] M3 Grammar engines
- [x] M4 Rewrite pipeline
- [x] M5 Detector + Humanize
- [x] M6 Browser extension
- [ ] M7 Desktop app
- [ ] M8 Polish, docs, release

## Current milestone task checklist
- [x] Fix extension selected-text Humanize result so the action bar does not overwrite the result card
- [x] Add native desktop settings persistence with API keys kept out of `settings.json`
- [x] Add native desktop history persistence and wire it into the React store
- [x] Replace the stubbed native Ollama model list with a localhost `/api/tags` query and graceful empty fallback
- [x] Include Rust command tests in the canonical desktop package test script
- [x] Replace the current local secret-file workaround with OS keychain-backed storage on Windows, with file fallback elsewhere
- [x] Replace JSON history with SQLite-backed history through the local `sqlite3` CLI fallback path
- [x] Expand the UI gallery to cover button, suggestion, Humanize, underline, form, empty, and error states
- [x] Replace static desktop capture/paste placeholders with clipboard-assisted PowerShell fallbacks and test isolation
- [x] Add automated WCAG AA contrast checks for semantic UI text tokens and adjust the light subtle-text token
- [x] Replace queued Ollama pull placeholder with real `/api/pull` progress parsing and Model Manager pull controls
- [x] Add automated focus/reduced-motion/touch-target checks and coarse-pointer 44px target CSS
- [x] Add a single-file no-module `ui-gallery-static.html` artifact that opens directly from disk
- [ ] Implement real global shortcut/capture/paste integration beyond clipboard-safe fallbacks
- [ ] Complete the M8 accessibility and full component-state gallery audit

## Changelog
- 2026-07-07 iter 0: Started from blank workspace containing only `KALAM.md`; initializing M0.
- 2026-07-07 iter 1: Implemented the Kalam monorepo across core, UI, extension, and desktop. Verification: `pnpm -r build` PASS, `pnpm -r test` PASS, `pnpm -r lint` PASS, `pnpm -r typecheck` PASS, `pnpm e2e:ext` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.
- 2026-07-07 iter 2: Audited completion claims, fixed the extension Humanize result redraw bug, added native desktop settings/history/Ollama command behavior with tests, and wired the React desktop app to Tauri invoke with browser-safe fallbacks. Verification: `pnpm -r build` PASS, `pnpm -r test` PASS, `pnpm -r lint` PASS, `pnpm -r typecheck` PASS, `pnpm e2e:ext` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.
- 2026-07-07 iter 3: Replaced desktop history JSON persistence with a real SQLite database path using the local `sqlite3` CLI and JSON fallback when unavailable. Verification: `pnpm --filter @kalam/desktop test` PASS, `pnpm --filter @kalam/desktop build` PASS, `pnpm --filter @kalam/desktop lint` PASS, `pnpm --filter @kalam/desktop typecheck` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.
- 2026-07-07 iter 4: Expanded `@kalam/ui` gallery state coverage and fixed extension build asset paths to be relative. Verification: `pnpm --filter @kalam/ui test` PASS, `pnpm --filter @kalam/ui build` PASS, `pnpm --filter @kalam/ui lint` PASS, `pnpm --filter @kalam/ui typecheck` PASS, `pnpm --filter @kalam/extension build` PASS, `pnpm e2e:ext` PASS. Browser plugin validation was attempted but `iab` was unavailable; Playwright fallback confirmed the served gallery renders the new sections with no console errors.
- 2026-07-07 iter 5: Replaced desktop capture/paste static placeholders with clipboard-assisted PowerShell fallbacks and test-only isolated clipboard storage. Verification: `pnpm --filter @kalam/desktop test` PASS, `pnpm --filter @kalam/desktop build` PASS, `pnpm --filter @kalam/desktop lint` PASS, `pnpm --filter @kalam/desktop typecheck` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.
- 2026-07-07 iter 6: Added UI token WCAG AA contrast tests and darkened the light `textSubtle` token to pass 4.5:1. Verification: `pnpm --filter @kalam/ui test` PASS, `pnpm --filter @kalam/ui build` PASS, `pnpm --filter @kalam/ui lint` PASS, `pnpm --filter @kalam/ui typecheck` PASS, `pnpm --filter @kalam/extension build` PASS, `pnpm e2e:ext` PASS.
- 2026-07-07 iter 7: Replaced desktop API key file storage on Windows with Credential Manager (`CredWriteW`/`CredReadW`/`CredDeleteW`) while retaining the file fallback for unsupported platforms or keychain failures. Verification: `pnpm --filter @kalam/desktop test` PASS, `pnpm --filter @kalam/desktop build` PASS, `pnpm --filter @kalam/desktop lint` PASS, `pnpm --filter @kalam/desktop typecheck` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.
- 2026-07-07 iter 8: Replaced the desktop Ollama pull placeholder with a real `/api/pull` request, streaming progress parser, native command result, and Model Manager pull controls. Verification: `pnpm --filter @kalam/desktop test` PASS, `pnpm --filter @kalam/desktop build` PASS, `pnpm --filter @kalam/desktop lint` PASS, `pnpm --filter @kalam/desktop typecheck` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.
- 2026-07-07 iter 9: Added automated UI CSS checks for reduced motion, focus-visible, and coarse-pointer touch target sizing; added 44px touch targets under `@media (pointer: coarse)`. Verification: `pnpm --filter @kalam/ui test` PASS, `pnpm --filter @kalam/ui build` PASS, `pnpm --filter @kalam/ui lint` PASS, `pnpm --filter @kalam/ui typecheck` PASS, `pnpm --filter @kalam/extension build` PASS, `pnpm e2e:ext` PASS.
- 2026-07-07 iter 10: Added post-build server-rendered `ui-gallery-static.html` artifacts for Chrome and Firefox extension builds, with inline CSS and no module scripts, so the gallery opens directly from disk. Verification: `pnpm --filter @kalam/extension test` PASS, `pnpm --filter @kalam/extension typecheck` PASS, `pnpm --filter @kalam/extension lint` PASS, `pnpm --filter @kalam/extension build` PASS, Playwright `file://.../ui-gallery-static.html` PASS, `pnpm e2e:ext` PASS.

## BLOCKERS
- Global shortcut and hardened capture/paste beyond clipboard-assisted fallbacks are still implemented with local-first workarounds rather than the final Tauri plugin integrations required by the full spec.
- `cargo add rusqlite --features bundled` is ENV-BLOCKED on this machine by a Windows Schannel certificate revocation error (`CRYPT_E_NO_REVOCATION_CHECK`); current workaround uses the installed `sqlite3` CLI.
- Browser plugin validation is ENV-BLOCKED in this session (`Browser is not available: iab`); Playwright is being used for rendered gallery checks.
- `pnpm view harper.js version` timed out while checking the real Harper WASM package; keep the heuristic engine until package lookup/install succeeds.

## Deferred / TODO discovered
- Replace heuristic Harper-compatible checks with the real Harper WASM package.
- Add Tauri global-shortcut integration for the remaining M7 native requirement.
- Consider replacing the Windows Credential Manager FFI with the official Tauri keyring/stronghold plugin when dependency fetching is reliable.
- Replace the `sqlite3` CLI history workaround with Tauri SQL/rusqlite once crate fetching is available.
- Complete M8 a11y coverage beyond the current expanded gallery smoke checks.
