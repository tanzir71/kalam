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
- Rust command boundary for capture, paste, Ollama, Humanize, history, and settings.

The Tauri build produces Windows MSI and NSIS installers under `apps/desktop/src-tauri/target/release/bundle/`.
