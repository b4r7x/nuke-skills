---
name: nuke-code
description: >
  Use when implementing anything beyond trivial — more than one file, more
  than ~30 changed lines, or any change to a public API, dependency, schema,
  or behavior contract. THINK (done-criteria + ≥2 shapes) → BUILD
  (house-idiom charter) → SHIP (fresh validator + gates before "done").
  Engaged automatically by the nuke constitution; "nuke code" forces it.
metadata:
  author: b4r7x
  version: "3.1.0"
  argument-hint: "[task] — normally engaged by the constitution, not invoked"
---

# Nuke Code

The discipline below every ceremony. Family positioning: **audit** finds everything (read-only) · **review** judges a change (read-only) · **verify** repairs another agent's implementation (writes) · **code** is how this session itself works — the loop it runs for its own everyday changes, so ordinary work arrives already reviewed.

Core principle — the family doctrine applied to the session's own hands: weak generation + fresh verification + a fix loop beats trusting the first draft. Final quality is bounded by the strongest verifier, not by the model that typed the code. Nothing leaves the session unreviewed.

## Engagement

The constitution (references/constitution.md) routes here with countable triggers; never engage by feel.

| Mode | Trips when | Machinery |
|---|---|---|
| **inline** | single file AND ≤~30 changed lines AND no contract change | BUILD charter + narrowest gate. No agents. |
| **standard** | anything beyond inline | full loop; ship validator at `session`, fresh context |
| **elevated** | any risk flag — public API, auth/security, concurrency, data migration, new dependency — even when size says inline | full loop; ship validator at `top` |

Escalate out instead of stretching: diff past ~5 files / ~300 lines → checkpoint and propose **nuke-review** or **nuke-verify**; hard design call (expensive to reverse, or two shapes with no nameable winner) → **nuke-think** before code; unproven bug cause or 2 failed fix attempts → **nuke-debug** discipline.

Two deliberate divergences from the ceremonies: no preflight confirmation gate and no run_dir. This loop runs inside ordinary tasks — a confirmation on every task would be unbearable, so the size trigger above is the escape hatch to ceremonies, which do confirm; and the hand-back carries the evidence, so ceremonies keep the artifacts.

## THINK — before any code

1. **Contract.** Restate the ask as 2–5 falsifiable done-criteria: observable behaviors, constraints, non-goals. These become the ship validator's intent — it must never verify against a guessed one.
2. **Read.** Read every file you will touch plus its immediate neighbors; name what you read. Shape from the actual code, never from memory or training idiom.
3. **Shapes.** Write ≥2 genuinely different shapes — where it lives · what owns the state · how it is wired — one-line trade-off each, then pick with a named reason: a decision note of ≤5 lines that ships in the hand-back. A purely mechanical change may collapse to one shape with a stated reason; the done-criteria are never skipped.
4. **Hard call?** Constitution trigger met → run nuke-think (dials + discipline) before proceeding.

## BUILD — while the code is written

The charter, absolute:

1. Never edit a file you have not read in this session; after any interruption or tool feedback, re-read before re-editing.
2. Neighbor files are the style guide — naming, comment density, patterns. Match the house, not the training set.
3. Load the mapped local skills for every file type you touch (file-type → skill map, references/stack-adapters.md) before writing.
4. Minimal diff: the ask and nothing else. No drive-by refactors, renames, or reformats.
5. No defensive noise: trust internal code; validate at real boundaries only.
6. A comment states a constraint the code cannot; it never narrates the change.
7. Changed behavior → a behavior-focused test in the same diff, per the repo's test conventions; gateless areas: say so.
8. Boring beats clever.

## SHIP — before the word "done"

1. **Gates.** Resolve and run the gate rows for the touched path prefixes (references/stack-adapters.md): narrowest test first, then typecheck/lint. Output captured verbatim. A failing gate is fixed before proceeding and counts toward the cycle cap. Gateless area → state "review-only validation — no gates configured"; never silently validate against nothing.
2. **Fresh validator.** Spawn ONE validator at the mode's tier (references/model-tiers.md) in a fresh context. It receives exactly: the task text, the done-criteria, the diff, repo access — and never the author's reasoning; the missing anchoring is the design. Its charter: verdict every done-criterion (`met | partial | unmet`, each with file:line and one verbatim quoted line), then hunt what the change introduced — regressions, broken or untraced callers of changed contracts, duplication, slop, type escapes, convention drift — by applying the four charter bundles of references/lens-catalog.md in one pass over the diff and its blast radius. Findings use the family schema (lens + severity + justification, file:line, quoted source, numbered trace, proposed fix, refutation attempt); a finding missing a field is invalid and must not be reported.
3. **Fix loop.** Fix every confirmed finding of any severity — everyday diffs are small enough that nothing is beneath fixing. Fresh revalidation after each cycle. Cap: 2 cycles. Cap hit or unfixable → honest hand-back, open list first.
4. **Hand-back**, verdict first:
   - `SHIP: clean — validator: 0 findings · gates: pass`, plus the verbatim gate tail and the THINK decision note, or
   - the honest list: open findings by severity, failing gates with output, cycles used, exactly where it stopped.

   Never claim success past a dirty state. No `git add` / `git commit` / `git stash` — the working tree is left for the human (family mandate).

## Degradations

- No subagents on this platform → inline validator: an explicit role switch, the diff re-read from disk (`git diff`, never from memory), the same charter and schema, and the hand-back marked `validator: inline (degraded)`.
- No per-agent model overrides → every role inherits the session model; elevated mode still applies the platform's maximum effort/thinking dial where one exists.
- Constitution not installed → this description is the only trigger. Install it for reliable engagement: the text ships as references/constitution.md; the Claude Code plugin injects it automatically, other harnesses use the installer (README, "Install the constitution").
