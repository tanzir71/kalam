# Kalam website handoff

## Shape

- Public site and same-instance demo: `apps/web`
- Shared browser-safe product logic: `packages/core`
- Production build: `pnpm --filter @kalam/web build`
- Production output: `apps/web/dist`
- Hosting configuration: `vercel.json`
- Agent-readable product/API summary: `apps/web/public/llms.txt`

## Demo contract

The playground is a real client-side integration of `HarperEngine`, `RuleAdapter`, `HeuristicDetector`, `analyzeText`, `humanize`, and `meaningPreserved`. It stays in the `noai` tier and performs no outbound request. It must remain useful when Ollama, LM Studio, and cloud keys are absent.

## Positioning

Headline: **Grammarly-class checks. Zero cloud. $0.**

Use the privacy ladder honestly: deterministic rules by default, optional local AI on the user's hardware, and BYO cloud only after both a key and explicit enablement. Never promise GPT-level reasoning from rules or guaranteed AI-detector evasion.
