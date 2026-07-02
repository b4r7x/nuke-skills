---
name: nuke-verify
description: >
  Use when an implementation produced by another agent, a cheaper model, or a
  colleague needs verification against its spec/task/plan — "nuke verify",
  "verify this implementation", "check what the agent built" — and should be
  fixed until clean, not just reviewed.
disable-model-invocation: true
metadata:
  author: b4r7x
  version: "3.0.0"
  argument-hint: "[mode: light|full|plan] [intent: <spec/plan/task file>|<text>] [scope: changed|staged|branch|<path>] [--yes]"
---

# Nuke Verify

An implementation just landed — produced by a cheaper agent, another tool, or a colleague — and must be confirmed against its intent and the quality bar, then repaired until clean. Family positioning: **audit** finds everything (read-only) · **review** judges a change (read-only) · **verify** confirms an implementation matches intent and repairs it (writes) · **fix** executes an existing spec (writes).

Core principle — asymmetric verification: the implementer is presumed cheap; validators sit one tier above it, and every defect they catch returns to a cheap fixer as an exact finding. Detection plus the fix loop is what turns a weak implementation into a strong one.

## Arguments

`[mode]` — `light` (default) | `full` | `plan`. `plan` runs preflight, prints the plan block, and STOPS — nothing is written.
`[intent]` — the source of truth to verify against: a spec/plan/task file path, or free text (`intent: add retry with backoff to the fetch layer`).
`[scope]` — `changed` (vs HEAD, default) | `staged` | `branch` (vs main/master) | `<path>`
`--yes` — skip the preflight confirmation gate.

Mode tokens match exactly; anything else in first position is the intent.

## Modes

Tier vocabulary (`clerk`/`worker`/`session`/`top`) and per-platform mechanics: references/model-tiers.md. Platforms without per-agent overrides → every role inherits the session model.

| | **light** (default) | **full** |
|---|---|---|
| Completeness checker | session | session |
| Charter validators (4) — one tier above the presumed-cheap implementer | session | top |
| Fix subagents | worker | worker |
| Revalidation (per fix cycle + final) | session | top |
| Fix-loop cap | 3 cycles | 5 cycles |
| Cost stance | lean: one validator wave; validator tier carries precision | costs do not matter; never shrink the wave |

**No skeptics.** The validator tier carries precision, the finding schema's refutation field carries the rigor, and findings are acted on, not ledgered.

## Mandates

1. **Never verify against a guessed intent.** No resolvable intent source in Phase 0 → ask the user and wait. An intent reverse-engineered from the diff would make every diff self-consistent and the verification meaningless.
2. **No `git add` / `git commit` / `git stash`. No `.bak` files.** Verify writes source fixes, but the working tree is left for human review.
3. **Evidence before claims.** Every requirement verdict and finding carries file:line + a verbatim quote; every gate claim carries the gate's output verbatim, never summarized.
4. **Fix subagents never validate their own fixes.** Revalidation is always fresh agents at the validator tier.
5. **Main context stays thin.** The orchestrator passes paths and findings, never file contents; detail lives in subagents and the run_dir.
6. **Respect the tier table.** Never silently upgrade or downgrade a role's tier.
7. **Never claim success past a dirty state.** The verdict is VERIFIED or the honest remaining-issues list — nothing in between.

## Artifacts

`run_dir = .nuke/<YYYY-MM-DD>-<HHmmss>-verify-<slug>/` (local 24-hour clock) — fresh per run, never reuse or resume an old one; if the path exists, append `-2`, `-3`, … until `mkdir` succeeds.

| File | Role |
|---|---|
| `plan.md` | Preflight output: intent source, requirement list, scope, blast radius, gates, skill map, tiers |
| `verify.md` | Requirement map, findings with dispositions, gate outputs, cycles, verdict |
| `fix-spec.md` | Escalation only — >15 open findings or systemic problems |

## Pipeline

```
Phase 0 preflight (intent + plan → confirm) → Phase 1 completeness check ∥ Phase 2 validator wave + gates → Phase 3 fix loop (cap 3/5) → Phase 4 verdict
                                                                 └── escalation at any point: emit fix-spec, hand off to nuke-fix ──┘
```

## Phase 0 — Preflight

Read references/preflight.md and follow its plan-then-apply gate. Verify specifics:

1. **Resolve the intent source, in order:** the explicit `intent:` file or text argument → the PR or branch description (PR body, linked issue or task file, the branch's stated purpose) → ask the user. Never guess (Mandate 1).
2. **Distill the intent into a numbered requirement list** — observable behaviors, constraints, non-goals. This list is the contract for Phase 1; it goes into plan.md.
3. Resolve `[scope]` to a concrete diff: changed-file list + diff stat, plus **blast radius** — files importing or imported by the changed files. Exclude lockfiles, generated code, vendored deps.
4. **Baseline gates:** build the per-path-prefix gates table per references/stack-adapters.md and run every matching row once, output captured. A failing gate in the implementation's own area becomes finding #1. Gateless areas fall under the gateless-repo rule: plan.md declares `gates: NONE — validation is review-only`; never silently validate against nothing.
5. **File-type → skill map** (references/stack-adapters.md): list the local skill library ONCE; fix subagents load their mapped skills before writing.
6. Print the plan block (intent source, requirement count, diff stat, gates, wave, tiers, estimate) and WAIT for confirmation. `plan` → print and STOP. `--yes` → skip confirmation. On confirmation: create run_dir, write plan.md.

## Phase 1 — Completeness check (session)

One session-tier agent maps **every numbered requirement → implementing evidence**: file:line + at least one verbatim quoted line per requirement, plus a one-hop trace showing the code is reachable (wired in, not just written). Verdict per requirement: `met | partial | unmet | contradicted`. Every `partial`, `unmet`, or `contradicted` requirement becomes a finding.

All findings — here and in Phase 2 — use the candidate finding schema; a finding missing any field is invalid and must not be reported:

1. lens + severity (`critical | high | medium | low | info`) + one-sentence severity justification
2. `file:line` references — every involved site
3. **quoted source** — at least one verbatim quoted line per cited site (mandatory)
4. **end-to-end trace** — numbered hops proving the claim (mandatory)
5. proposed fix — imperative, one–three sentences
6. **refutation attempt** — the strongest reason this is NOT real (mandatory). Unrefuted → report; convinced → discard.

## Phase 2 — Validator wave

Read references/lens-catalog.md. Four charter validators (behavioral / security / structural / quality — the review charter bundles) at the mode's validator tier re-audit the changed files + blast radius, hunting issues the implementation **introduced**: regressions, broken or untraced callers of changed contracts, new duplication, slop, type escapes, convention drift. Each validator prompt embeds its charter checklist, its precomputed file lists, mandatory amplifier loading per the plan's file-type → skill map, and the finding schema.

In parallel, run every gates-table row matching the changed path prefixes — full output captured verbatim into verify.md.

No skeptic pass follows (see Modes): findings go straight to the fix loop.

## Phase 3 — Fix loop

Every failed gate, every `partial`/`unmet`/`contradicted` requirement, and every finding of **any** severity — low and info included — becomes work:

1. **Fix wave** — worker-tier fix subagents, each receiving its exact findings (full schema entries), write ownership of disjoint files, and the mandatory skill list for its file types from the plan's skill map — loaded before writing.
2. **Fresh revalidation** at the validator tier (Mandate 4): each finding's fix verified with file:line evidence, the matching gates re-run with output captured, changed files re-audited for issues the fixes introduced, and every requirement whose evidence moved re-verified.
3. Repeat until clean. Cap: 3 cycles (light) / 5 (full). Cap hit → stop and report honestly per Phase 4.

**Escalation — checked after Phase 2 and after every cycle:** more than 15 open findings, or structural/systemic problems (wrong architecture, pervasive duplication, an intent the implementation fundamentally misread) → stop looping. Read references/fix-spec-template.md, emit `fix-spec.md` covering everything open, and recommend running **nuke-fix** on it in a fresh session — or **nuke-audit** on the whole area when the rot extends past this change. A fix loop repairs an implementation; it does not re-do one.

## Phase 4 — Report

Write verify.md and report to the user, verdict first:

- **"VERIFIED — implementation matches intent, gates pass, working tree ready for review (nothing committed)"** — only when every requirement is `met`, every finding is fixed and revalidated, and every gate passes with captured output.
- Otherwise the honest list: unmet requirements, open findings by severity, failing gates with verbatim output, cycles used, and exactly where the run stopped — plus the handoff line when a fix-spec was emitted.
- Always: the requirement map (met/partial/unmet/contradicted), findings fixed per cycle, gate outputs, run stats (agents, cycles, scope size).

## Orchestration notes

- **All orchestrators:** create run_dir before launching any agent and pass that exact path in every prompt. Phase 1 and Phase 2 run in parallel once preflight is confirmed; the fix loop alternates fix wave → revalidation, with fixers within a wave parallel on disjoint files — never two agents writing the same file.
- **Claude Code:** parallel Agent calls; map tiers per references/model-tiers.md (worker → mid model override, session → no override, top → strongest at max effort). Preflight gate via AskUserQuestion with options run / switch mode / narrow scope.
- **Other CLIs:** spawn subagents per role; without parallelism, run them sequentially, each in a FRESH context. Without per-agent model overrides, every role inherits the session model — the protocol still holds.
