# Kalam - Loop Progress

Current milestone: M8
Loop iteration: 1

## Milestones
- [x] M0 Repo & tooling skeleton
- [x] M1 Core types, settings, text utils
- [x] M2 LLM adapters + MockAdapter
- [x] M3 Grammar engines
- [x] M4 Rewrite pipeline
- [x] M5 Detector + Humanize
- [x] M6 Browser extension
- [x] M7 Desktop app
- [x] M8 Polish, docs, release

## Current milestone task checklist
- [x] Monorepo, package scripts, CI, and pinned toolchain
- [x] `@kalam/core`: settings, text utilities, adapters, grammar/style, rewrite, detector, Humanize
- [x] `@kalam/ui`: tokens, shared components, assets, gallery
- [x] Browser extension: MV3 Chrome/Firefox builds, content overlay, popup/options, e2e smoke
- [x] Desktop app: React workspace, Tauri commands, model manager state, history/settings seams, installer build
- [x] Docs, release notes, and final verification

## Changelog
- 2026-07-07 iter 0: Started from blank workspace containing only `KALAM.md`; initializing M0.
- 2026-07-07 iter 1: Implemented the Kalam monorepo across core, UI, extension, and desktop. Verification: `pnpm -r build` PASS, `pnpm -r test` PASS, `pnpm -r lint` PASS, `pnpm -r typecheck` PASS, `pnpm e2e:ext` PASS, `pnpm e2e:desktop` PASS, `pnpm --filter @kalam/desktop tauri build` PASS.

## BLOCKERS
(none)

## Deferred / TODO discovered
- Production integrations are wired behind local-first seams: replace heuristic Harper-compatible checks with the real Harper WASM package, add Tauri SQL/keyring/global-shortcut plugins for hardened native storage/capture, and connect real Ollama pull progress when those runtime dependencies are present.
