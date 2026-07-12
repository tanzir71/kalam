# Deploy the Kalam website

The production site is a static Vite build of `apps/web`. It bundles the real `@kalam/core` RuleAdapter, HarperEngine, readability analysis, heuristic detector, and meaning-preservation checks. The public playground does not call a backend or enable cloud adapters.

## Local verification

```powershell
pnpm install --frozen-lockfile
pnpm --filter @kalam/web test
pnpm --filter @kalam/web lint
pnpm --filter @kalam/web typecheck
pnpm --filter @kalam/web build
pnpm --filter @kalam/web dev
```

Open the local URL printed by Vite. The page ships with seeded text and needs no environment variables.

## Production deployment

1. Install and authenticate the Vercel CLI.
2. From the repository root, run:

```powershell
vercel deploy --prod --yes --name kalam-write
```

3. Confirm the production alias is `https://kalam-write.vercel.app/`.
4. Verify `/llms.txt`, the demo's Check and Humanize actions, mobile navigation, and response security headers.

No secrets or runtime environment variables are required.
