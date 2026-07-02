# Fix Spec Template

Loaded by the spec-architect and completeness reviewer at spec-writing time (nuke-audit Phase 3, nuke-review Phase 3) and by nuke-fix preflight and the nuke-verify escalation path.

## Contract

A fix spec is self-contained: a fresh agent session with zero prior knowledge must be able to execute it. It carries its own executor context, per-path-prefix gates, tier assignments, dependency-ordered phases, parallel-safe batches, per-task mechanical acceptance criteria, and a coverage map back to every finding ID. nuke-review mini-specs use the same template collapsed to a single phase.

## Rules the spec-architect enforces at write time

1. **Every `Accept:` is mechanically checkable** — verifiable by one of:
   - a **command** with its expected exit/output stated (`pytest tests/retry_test.py passes`, `grep -rn 'computeBackoff' src/ matches exactly 2 call sites`);
   - a **named test** that must pass, new or existing;
   - a **quoted line** that must exist (or no longer exist) at a stated file:line.
   "Code is cleaner", "duplication removed", "follows conventions" are NOT acceptance criteria. The completeness reviewer rejects any task whose Accept requires judgment to verify; a nuke-fix implementer that meets one anyway escalates instead of guessing.
2. **`Gates:` is a per-path-prefix table** (built from recon; protocol in stack-adapters.md). Single-stack repos get one row with prefix `./`. Validators run only the rows matching their batch's files. An area with no gates → either the first phase bootstraps a minimal gate, or the header declares `gates: NONE — validation is review-only`; never silently validate against nothing.
3. **Phase ordering** (later phases depend on the file layout earlier phases produce): structural moves/renames → DRY extractions & architecture changes → local fixes (slop, types, errors, simplicity, dead code) → tests → docs/cleanup.
4. **Batches within a phase touch disjoint files** — parallel-safe by construction. Two tasks sharing a file go in the same batch.
5. **Coverage map is total.** Every confirmed F-### maps to ≥1 task. Every U-### (unverified low/info) is routed to the phase whose tasks touch its files, as a validator re-judgment entry — not a task. The phase validator judges it for free while re-auditing: fix if real, close with a written reason if not. A U-### touching no phase's files gets its own entry in the last phase.
6. **Tier assignments and the file-type → skill map are recorded in the executor context**, resolved for this spec's mode from model-tiers.md, so the spec stays self-contained without the skill installed.
7. Record the audit mode in the header; nuke-fix defaults to it.

## Template

```markdown
# Fix Spec — <project> — <date>
source: .nuke/<run>/findings.md (<N> findings: <c> critical / <h> high / <m> medium / <l> low / <i> info · <u> unverified U-###)
mode: <micro|light|full>
scorecard: .nuke/<run>/report.md — target after execution: 5/5 in every category

## Executor context (self-contained — assume zero prior knowledge)
- Project: <one line>. Stack(s): <languages + frameworks, per area if mixed>.
- Conventions: <distilled rules from project instruction files that executors must obey>
- Gates (validators run only the rows matching their batch's files):

| Path prefix | test | typecheck/build | lint |
|---|---|---|---|
| services/api/ | `pytest` | `mypy .` | `ruff check` |
| web/ | `npm test` | `npx tsc --noEmit` | `npx eslint .` |

- Tiers (resolved from model-tiers.md for this mode): implementers `<worker|top>`;
  validators one tier above implementers (`<session|top>`); final sweep `<session|top>`.
  Platform without per-agent overrides → every role inherits the session model.
- File-type → skill map (from plan.md — implementers load their batch's matching
  skills before writing; * = mandatory): `.tsx → react-senior-guide*` · `.ts →
  typescript/clean-code skills` · `<ext> → quality bar carries the lens`
- Rules: never `git add/commit/stash`; no `.bak` files; fix EVERY task including low/info;
  behavior-preserving unless the task says otherwise.

## Execution protocol (for any executor — the nuke-fix skill automates this)
For each phase, in order:
1. Run every batch in the phase as parallel implementation subagents (one per batch;
   batches touch disjoint files).
2. Validation by FRESH subagents one tier above the implementers — per task: verify
   Accept mechanically with file:line evidence; re-audit every changed file for newly
   introduced issues; run the gate rows matching the changed files. Re-judge this
   phase's U-### entries: fix if real, close with a written reason if not.
3. Any failed Accept, failed gate, or new issue of any severity → fix subagents with
   the exact findings → revalidate. Repeat until clean (cap — light: 3 cycles,
   full: 5 — then stop and report honestly).
4. Only then move to the next phase.
After the last phase: run all gate rows, then a final sweep over the complete
changed-file set. Completeness = every T-### done, every F-### resolved, every U-###
fixed or closed with reason, no `.bak` files, no debug leftovers.

## Phase 1 — <name> (<why this is first>)
### Batch 1.A — files: services/api/retry.py, services/api/poll.py
- [ ] T-001 (fixes F-014) — services/api/retry.py, services/api/poll.py
      Change: extract the duplicated exponential backoff into services/api/backoff.py;
      both call sites import it; keep the 2s base delay (poll.py's 3s was drift).
      Accept: `grep -rn "def .*backoff" services/api/` matches only backoff.py;
      `pytest services/api/tests/test_backoff.py` passes.
### Batch 1.B — files: …
### Phase exit
Matching gate rows pass · every T-### in this phase validated · this phase's U-###
entries judged · zero new findings in changed files

## Phase 2 — …

## Coverage map
F-001 → T-007 · F-002 → T-001 · … (every confirmed finding appears at least once)
U-101 → Phase 1 validator re-judgment (files: services/api/args.py) · U-102 → Phase 3 …
```

## Accept patterns (pick the cheapest that fully verifies the change)

| Change kind | Mechanical Accept |
|---|---|
| Extraction / dedup | grep count of the old pattern drops to the stated number; gate row passes |
| Rename / move | old path absent, new path present (`test -f` / grep of imports); build gate passes |
| Behavior fix | named test (added in the same task if missing) passes; quote the asserted line |
| Deletion (dead code) | grep for the symbol returns zero matches outside the ledger |
| Docs / config | quoted line exists at stated location |
