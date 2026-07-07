# Kalam Desktop

Tauri v2 desktop surface for Kalam.

## Commands

```bash
pnpm --filter @kalam/desktop build
pnpm e2e:desktop
pnpm --filter @kalam/desktop tauri build
```

## Surfaces

- Editor workspace with grammar check, rewrite, readability meter, and issue list.
- Humanize workspace with first-run acknowledgement, score before/after, meaning state, and diff.
- Batch, Model Manager, History, and Settings views.
- Capture HUD with clipboard-assisted capture/paste, `Ctrl+Alt+K` global shortcut fallback, and tray entry.
- Model Manager can list and pull Ollama models from the local Ollama HTTP API.
- Settings include backend/provider/API key controls, OS keychain-backed API key storage on Windows, and launch-at-login.
- Rust command boundary for capture, paste, Ollama, Humanize, history, settings, tray, shortcut, and startup behavior.

The Tauri build produces Windows MSI and NSIS installers under `apps/desktop/src-tauri/target/release/bundle/`.
