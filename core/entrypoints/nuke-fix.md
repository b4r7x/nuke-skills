---
name: nuke-fix
description: >
  Use when executing a fix spec produced by nuke-audit, nuke-review, or
  nuke-verify — "nuke fix", "execute the fix spec", "run the audit fixes".
disable-model-invocation: true
metadata:
  author: b4r7x
  version: "3.0.0"
  argument-hint: "[mode: light|full|plan] <path-to-fix-spec.md> [--yes]"
---

# Nuke Fix

Executes a fix spec phase by phase until everything in it meets the quality bar recorded in the spec's executor context. The counterpart of nuke-audit and nuke-review, but works with any spec that has an executor context, a per-path-prefix Gates table, dependency-ordered phases, parallel-safe batches, and per-task acceptance criteria (structure: references/fix-spec-template.md).

Core principle — asymmetric verification: weak generation + strong verification + fix loop = strong output. Validators are always one tier above implementers.

## Arguments

`[mode]` — `light` | `full` | `plan`. If omitted, use the `mode:` recorded in the spec header; if the spec has none, default to `light`. `plan` runs preflight, prints the plan block, and STOPS — nothing is written.
`<spec-path>` — path to a `fix-spec.md`. If a `fix-progress.md` exists next to it, resume from the first incomplete phase instead of starting over.
`--yes` — skip the preflight confirmation gate.

## Modes

Tier vocabulary (`clerk`/`worker`/`session`/`top`) and per-platform mechanics: references/model-tiers.md. Respect the fallback: platforms without per-agent overrides → every role inherits the session model.

| | **light** — cheap-implementer profile (default) | **full** |
|---|---|---|
| Implementers | `worker`; batches capped at ≤3 tasks (split larger batches) | `top`; batches as specced |
| Validators | `session` (one tier above implementers) — one fresh validator per phase | `top` — a fresh validation wave (multiple agents) per phase |
| Skill loading | mandatory — each implementer loads the skills matching its batch's file types from the spec's file-type → skill map | same |
| Fix-loop cap per phase | 3 cycles | 5 cycles |
| Final sweep | `session`: one reviewer covering correctness + security + structure/quality, plus the completeness checklist in the same pass | `top`: a correctness+security reviewer, a structure+quality reviewer, and a completeness agent — separate fresh agents |
| Cost stance | lean waves; thoroughness comes from stronger validators, the fix loop, and the final sweep | costs do not matter; as many subagents as needed |

Everything else is shared: the per-phase loop, the progress file, the gates discipline, and the report.

## Mandates

1. **Respect the mode and the tier table.** Never silently upgrade or downgrade a role's tier. Light never spawns a validation wave where one validator suffices; full never shrinks a wave to save tokens.
2. **Main context stays thin.** The orchestrator reads only the spec, the progress file, and agent summaries. All implementation and validation detail lives inside subagents.
3. **Fix everything.** Every task, every severity — including low and info. Skipping anything is failure, not triage.
4. **Implementers never validate their own work.** Validation is always fresh agents, one tier above.
5. **No `git add` / `git commit` / `git stash`. No `.bak` files.** The working tree is left for human review.
6. **Evidence before claims.** No success statement without pasted gate output — verbatim, never summarized — and per-task validated acceptance criteria.
7. **Escalate instead of guessing.** An implementer whose task's `Accept:` is not mechanically checkable (grep, test run, or quoted line) stops and returns the task to the orchestrator with the ambiguity named — it never improvises an interpretation.

## Phase 0 — Preflight

Read references/preflight.md and run its plan-then-apply gate:

1. Read the spec fully. It is self-contained: executor context (quality bar + tier assignments), per-path-prefix Gates table, file-type → skill map, dependency-ordered phases, batches, tasks, coverage map including `U-###` unverified entries.
2. Run every row of the Gates table once for a **baseline**. A failing baseline gate becomes the first task of the run — never validate around a broken baseline, and never write off later failures as "pre-existing". An area with no gates falls under the gateless-repo rule in references/stack-adapters.md: the spec's first phase bootstraps a minimal gate, or its header declares `gates: NONE — validation is review-only`. Never silently validate against nothing.
3. Print the plan block (scope, mode, phases × batches, tier assignments, cost estimate) and wait for confirmation. `plan` → stop here. `--yes` → skip confirmation.
4. On confirmation: write `plan.md` next to the spec (the preflight record — references/preflight.md), then create or update `fix-progress.md` beside it.

### Progress format (`fix-progress.md`)

```markdown
# Fix Progress
spec: fix-spec.md | mode: light | started: 2026-07-02
baseline: tests PASS · typecheck PASS · lint FAIL (2 errors — adopted as task T-000)

| Phase | Status | Cycles | Notes |
|---|---|---|---|
| 1 | done | 2 | T-003 needed a second pass — validator found a new duplication |
| 2 | in-progress | 1 | |
| 3 | pending | — | |
```

## Per-phase loop

For each phase, in spec order:

1. **Implementation wave** — one subagent per batch, all batches of the phase in parallel (they touch disjoint files by construction). Each implementer receives:
   - the spec's Executor context block + only its own tasks
   - write ownership of only its batch's files
   - the mandatory skill list for its file types from the spec's file-type → skill map (e.g. `.tsx`/`.jsx` → react-senior-guide when present locally) — load before writing
   - return format: per task → status, files changed with line refs, deviations from the spec; a non-checkable `Accept:` → escalate per Mandate 7
2. **Validation** — fresh subagents one tier above the implementers, never the implementers (light: one `session` validator for the whole phase; full: a `top` wave):
   - per task: acceptance criteria verified mechanically with file:line evidence
   - re-audit of every changed file against the executor context's quality bar — hunting issues the fixes *introduced* (new duplication, new slop, broken conventions, regressions)
   - **re-judge every `U-###` entry** the coverage map routes to this phase: real → add to the fix loop as a task; not real → close with a written reason in `fix-progress.md`
   - run the Gates-table rows matching the phase's changed path prefixes, full output captured
3. **Fix loop** — any failed criterion, failed gate, escalated task, or new finding of **any** severity → dispatch fix subagents with the exact findings → re-run validation. Repeat until clean. Cap per phase (light: 3 cycles, full: 5) — if hit, stop, record honest status in `fix-progress.md`, and report the remaining issues. Never proceed past a dirty phase.
4. Mark the phase `done` in `fix-progress.md` only when validation is fully clean.

## Final verification

After the last phase:

1. Every Gates-table row — capture outputs verbatim.
2. Final sweep over the complete changed-file set, per the mode table above.
   - Completeness checklist: every T-### done, every F-### resolved per the coverage map, every U-### fixed or closed-with-reason, no `.bak` files, no debug leftovers, no commented-out code.
3. Anything found → one more fix loop, then re-sweep.

## Report

- Mode, phases × cycles table, issue counts fixed per phase, U-### dispositions
- Gate outputs (verbatim — no summaries in place of evidence)
- Verdict: **"CLEAN — every task validated, all gates pass, working tree ready for review (nothing committed)"** — or the honest list of remaining blockers and exactly where the run stopped

## Orchestration notes

- **Claude Code:** Workflow tool (phases map to `phase()`, batches to `parallel()`, the fix loop to a while-loop) or parallel Agent calls with `run_in_background`. Pass `model`/`effort` per agent from the tier table in references/model-tiers.md.
- **Codex / OpenCode / Cursor / other CLIs:** spawn subagents per batch, mapping tiers to their model flags. Sequential fallback: one batch at a time, each in a FRESH context, same validation protocol.
- If the environment offers isolated worktrees and two batches unexpectedly conflict, isolate them; otherwise serialize the conflicting batches — never let two agents write the same file concurrently.
