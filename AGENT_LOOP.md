# Kalam Agent Loop

This is the condensed operating loop from `KALAM.md`.

1. Read `PROGRESS.md`.
2. Work on the next unchecked task in the current milestone, in order from M0 to M8.
3. Implement the smallest coherent slice.
4. Run the relevant verification commands.
5. Update `PROGRESS.md` with completed tasks, changelog, blockers, and deferred work.
6. Commit with a Conventional Commit message ending in `Loop-iter: <n>`.
7. Tag completed milestones as `m0-complete` through `m8-complete`.

Canonical checks:

```bash
pnpm install
pnpm -r build
pnpm -r test
pnpm -r lint
pnpm -r typecheck
pnpm e2e:ext
pnpm e2e:desktop
```

If an environment cannot run a command, record it under `PROGRESS.md#BLOCKERS` as
`ENV-BLOCKED: <command> - <what a human/CI must run>`, ensure all runnable checks pass, and continue.
