# Kalam - Loop Progress

Current milestone: M7/M8 hardening audit
Loop iteration: 2

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
- [ ] Replace the current local secret-file workaround with OS keychain-backed storage
- [ ] Replace JSON history with SQLite-backed history
- [ ] Implement real global shortcut/capture/paste integration beyond clipboard-safe fallbacks
- [ ] Complete the M8 accessibility and full component-state gallery audit

## Changelog
- 2026-07-07 iter 0: Started from blank workspace containing only `KALAM.md`; initializing M0.
- 2026-07-07 iter 1: Implemented the Kalam monorepo across core, UI, extension, and desktop. Verification: `pnpm -r build` PASS, `pnpm -r test` PASS, `pnpm -r lint` PASS, `pnpm -r typecheck` PASS, `pnpm e2e:ext` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.
- 2026-07-07 iter 2: Audited completion claims, fixed the extension Humanize result redraw bug, added native desktop settings/history/Ollama command behavior with tests, and wired the React desktop app to Tauri invoke with browser-safe fallbacks. Verification: `pnpm -r build` PASS, `pnpm -r test` PASS, `pnpm -r lint` PASS, `pnpm -r typecheck` PASS, `pnpm e2e:ext` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.

## BLOCKERS
- OS keychain, SQLite, global shortcut, and hardened capture/paste are still implemented with local-first workarounds rather than the final Tauri plugin integrations required by the full spec.

## Deferred / TODO discovered
- Replace heuristic Harper-compatible checks with the real Harper WASM package.
- Add Tauri SQL/keyring/global-shortcut integrations for the remaining M7 native requirements.
- Connect real Ollama pull progress instead of the current queued-pull placeholder.
- Expand M8 UI gallery/a11y coverage beyond the current smoke gallery.
