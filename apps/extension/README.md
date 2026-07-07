# Kalam Browser Extension

Manifest V3 extension surface for inline writing help.

## Commands

```bash
pnpm --filter @kalam/extension build:chrome
pnpm --filter @kalam/extension build:firefox
pnpm e2e:ext
```

## Surfaces

- Content script overlay for editable fields.
- Popup with site toggle, privacy badge, quick stats.
- Options page for backend/cloud/dictionary/Humanize settings.
- UI gallery at `ui-gallery.html`.

Extension BYO keys are stored in `chrome.storage.local` and are never synced.
