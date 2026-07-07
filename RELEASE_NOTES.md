# Kalam 0.1.0

Initial local-first build.

## Highlights

- Added the monorepo, CI, TypeScript tooling, linting, tests, and Playwright e2e.
- Built `@kalam/core` with settings, text utilities, LLM adapters, grammar/style checks, rewrite, detector, and Humanize.
- Built the deterministic no-AI `RuleAdapter` fallback.
- Added shared UI tokens, components, brand assets, and gallery.
- Added MV3 Chrome/Firefox extension builds with inline textarea correction and selected-text Humanize smoke coverage.
- Added Tauri desktop app with editor, Humanize panel, model manager state, history/settings seams, and Windows installer output.

## Verification

- `pnpm -r build`
- `pnpm -r test`
- `pnpm -r lint`
- `pnpm -r typecheck`
- `pnpm e2e:ext`
- `pnpm e2e:desktop`
- `pnpm --filter @kalam/desktop tauri build`
