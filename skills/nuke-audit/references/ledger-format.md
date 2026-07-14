# Ledger Format

Loaded by the nuke-audit and nuke-review orchestrators when creating `findings.md` and `rounds.md` (audit Phase 2) or `findings.md` (review Phase 2 — review has no rounds log); the entry, digest, and rounds formats below are embedded in every auditor and skeptic prompt.

## findings.md — the ledger

Append-only, the single source of truth between rounds. Three sections: `## Confirmed` (F-###), `## Rejected` (R-###), `## Unverified (low/info)` (U-###). IDs are stable, sequential per prefix, never reused. Every entry carries the mandatory candidate-schema fields — an entry without a quoted line and an end-to-end trace never enters the ledger.

Low/info candidates are ledger scope, even though they are outside the convergence threshold. Auditor prompts must ask for all severities. Do not write prompts or round notes that say low/info observations are intentionally not recorded, skipped because the threshold is medium+, or omitted to preserve dry convergence. If a low/info lead is too vague to satisfy the schema, log it as invalid/incomplete rather than counting it as recorded.

Header:

```markdown
# Findings Ledger
scope: src/engine/ | started: 2026-07-02 | status: in-progress
counts: 1 critical / 4 high / 9 medium / 12 low / 3 info · rejected: 7 · unverified: 5
```

### Worked example — confirmed entry

```markdown
## Confirmed

### F-014 · high · dry · src/engine/retry.ts:12-31, src/cli/poll.ts:88-102
Identical 16-line exponential backoff implemented twice; constants already drifted (2s vs 3s base).
Quote: `const BASE_DELAY_MS = 2_000;` (retry.ts:14) · `const base = 3_000;` (poll.ts:91)
Trace: (1) retry.ts:12-31 defines the backoff → (2) poll.ts:88-102 reimplements it line for line → (3) no shared helper exists under src/lib/ → (4) drift confirmed at poll.ts:91.
Fix: extract a single retry helper; reuse at both sites.
round: 1 · skeptic: confirmed (drift is real, not intentional)
```

The `skeptic:` field also records severity recalibrations: `skeptic: confirmed — recalibrated high→medium (bounded blast radius)`. The entry's severity slot always carries the final, post-skeptic severity; the claimed severity survives only in the skeptic field.

### Worked example — rejected entry

```markdown
## Rejected — do not re-report, do not re-judge

### R-003 · simplicity · src/engine/graph.ts:204
Claimed "clever reduce chain"; refuted — direct, idiomatic, covered by tests; rewriting adds lines (failed question 5).
round: 1
```

### Worked example — unverified entry

```markdown
## Unverified (low/info)

### U-007 · low · slop · src/cli/help.ts:44
Comment restates the line below it.
Quote: `// print usage` (directly above the printUsage() call)
Fix: delete the comment.
Author refutation: "may aid scanning" — unconvincing, the function name says the same.
round: 2 · unverified — no skeptic at this severity in this mode; re-judged by the nuke-fix phase validator (fix if real, close with reason if not)
```

## Digest — one line per entry

Built by the clerk after each round's ledger merge:

```
<ID> · <severity> · <lens> · <file:line> — <claim, ≤120 chars>
```

```
F-014 · high · dry · src/engine/retry.ts:12 — identical 16-line exponential backoff implemented twice; constants drifted
R-003 · rejected · simplicity · src/engine/graph.ts:204 — idiomatic reduce; rewrite adds lines
U-007 · low · slop · src/cli/help.ts:44 — comment restates the call below it
```

R entries carry `rejected` in the severity slot; the claim slot states the rejection reason so future auditors dedupe against rejections too.

## Distribution rule

- **Rounds 2+ auditors receive the digest only** — never full entries. It is enough to dedupe against and cheap to read.
- **Skeptics receive full entries for their assigned candidates** plus the digest of the rest of the ledger.
- The orchestrator distributes paths, digests, and entries — never source file contents.

## rounds.md — the rounds log

The header carries a mandatory `threshold:` line; a convergence claim without it, and without the per-round trail backing it, is false reporting. If the threshold ever changes mid-run, log the change in the round where it happened and name it in the final report.

```markdown
# Rounds Log
threshold: medium+ — a round is dry only when it confirms zero new medium+ findings; low/info are recorded but never reset the dry counter
```

That threshold line is a convergence statement, not a reporting filter. A round with new low/info but zero new medium+ is still dry; the new low/info entries still appear in the ledger and in the round's candidate/new counts.

### Worked example — round entry

```markdown
## Round 3
wave: 2 hot charters (delta-scoped, axis: by-layer) + 1 fresh-eyes · skeptics: merged panel (1)
candidates: 6 | confirmed new: 2 (F-041, F-042) | unverified new: 1 (U-007) | duplicates: 2 | rejected: 1 (R-013)
new medium+: 2 → dry = 0 · trail: 21 → 8 → 2
```

The trail is the running sequence of new-medium+ counts, one number per round, extended every round — it is the evidence behind any convergence or non-convergence claim in the final report.
