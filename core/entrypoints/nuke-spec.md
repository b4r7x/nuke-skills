---
name: nuke-spec
description: >
  Use when turning a feature request, requirement, or rough idea into an
  implementation-ready, self-contained spec — "nuke spec", "spec this feature",
  "prepare a spec for the implementer" — before handing the work to nuke-fix,
  a cheaper model, or another agent.
disable-model-invocation: true
metadata:
  author: b4r7x
  version: "3.0.0"
  argument-hint: "[mode: light|full|plan] <feature description | path-to-notes> [--yes]"
---

# Nuke Spec

nuke-audit and nuke-spec emit the **same executable spec format from opposite inputs**: audit compiles *problems in existing code* into a repair spec; nuke-spec compiles a *feature request* into a build spec. Both are executed by nuke-fix, and both serve as the intent for nuke-verify. Chain: **spec → fix → verify**.

This skill produces the spec and stops — it never implements anything. Its output quality is what lets a cheap implementer succeed: numbered testable requirements, recorded design decisions, and mechanically checkable acceptance criteria stand in for the judgment the implementer does not have.

## Arguments

`[mode]` — `light` (default) | `full` | `plan` (run preflight, print the plan block, STOP — nothing written)
`<feature>` — inline description (`nuke-spec add retry with backoff to the fetch layer`) or a path to a notes/requirements file
`[--yes]` — skip the preflight confirmation gate. It does NOT skip clarifying questions — ambiguity always asks (Mandate 1).

Mode tokens match exactly; anything else in first position is part of the feature description.

## Modes

Tier vocabulary (`clerk`/`worker`/`session`/`top`) and per-platform mechanics: references/model-tiers.md. Platforms without per-agent overrides → every role inherits the session model.

| | **light** (default) | **full** |
|---|---|---|
| Recon scout | clerk | session |
| Requirements distiller | session | session |
| Designer (loads nuke-think when installed) | session | top |
| Spec architect | session | top |
| Completeness reviewer | worker | session |
| Reviewer loop cap | 3 | 3 |
| Cost stance | lean: one agent per phase | top-tier design and spec; panel-reason the hardest trade-offs |

## Mandates

1. **Clarifying questions are protocol, not weakness.** This is the one skill in the family where asking is the job: requirements ambiguous → up to 5 targeted questions BEFORE the plan gate. Never invent a requirement; never ask what recon can answer.
2. **Read-only on the codebase.** Writes happen only under `.nuke/` — the run directory plus the shared `.nuke/repo-map.md` and `.nuke/calibration.log`. Never run `git add`, `git commit`, or `git stash`; never edit source or config.
3. **Every requirement is testable.** A requirement that cannot be verified by observable behavior, a gate, or a quoted line is a wish — rewrite it or move it to non-goals.
4. **Main context stays thin.** The orchestrator passes paths, not contents; requirements, design, and spec live in the run_dir artifacts.
5. **Respect the tier table.** Never silently upgrade or downgrade a role's tier.
6. **Fresh run directory.** Never write into an existing run; if the computed path exists, append `-2`, `-3`, … until `mkdir` succeeds.

## Artifacts

`run_dir = .nuke/<YYYY-MM-DD>-<HHmmss>-spec-<slug>/` (local 24-hour clock).

| File | Role |
|---|---|
| `plan.md` | Preflight output: feature, clarification answers, scope area, gates, skill map, wave, tiers |
| `requirements.md` | Numbered REQ-### requirements, non-goals, constraints + `## Design` and `## Decisions` |
| `spec.md` | The self-contained build spec — nuke-fix executes it; nuke-verify takes it as intent |

## Pipeline

```
Phase 0 preflight (clarify → plan → confirm → run_dir)
  ─→ Phase 1 requirements ─→ Phase 2 design
  ─→ Phase 3 spec writing (architect ⇄ completeness reviewer, cap 3)
  ─→ Phase 4 handoff (STOP)
```

## Phase 0 — Preflight

Read references/preflight.md and follow its plan-then-apply gate. Spec specifics:

1. **Resolve the feature source:** inline text, or read the given file (notes, issue export, PRD). Neither resolvable → ask the user and wait.
2. **Recon the relevant area.** Consume `.nuke/repo-map.md` when present; otherwise one recon scout maps only what the feature touches: stack and manifests; project instruction files (the conventions the spec must encode); neighboring modules and the existing patterns the feature must follow; the per-path-prefix gates table and file-type → skill map per references/stack-adapters.md.
3. **Clarify.** Compare the feature description against recon. Genuine ambiguity in scope, behavior, edge cases, or constraints → up to 5 targeted questions, each with concrete options where possible, asked BEFORE the plan gate. Answers are recorded in plan.md; they are requirements input, not suggestions.
4. **Plan gate:** print the plan block (feature one-liner, scope area, mode, wave, tiers, estimate, run_dir) and WAIT for confirmation. `plan` → print and STOP. `--yes` → skip confirmation only. On confirmation: create the fresh run_dir, write plan.md into it.

## Phase 1 — Requirements (session)

One session-tier agent distills the feature, the clarification answers, and recon into `requirements.md`:

- **Requirements** `REQ-###` — numbered, each stating an observable, testable behavior (`REQ-003: a failed fetch retries 3× with exponential backoff starting at 2s`). No implementation detail — that is Phase 2's job.
- **Non-goals** — explicit exclusions, so the implementer and later nuke-verify know where the feature stops.
- **Constraints** — distilled from project instruction files: conventions, layering rules, gates the change must keep green.

Each REQ-### is phrased so nuke-verify's completeness checker can later map it to evidence (file:line + quote). A requirement the user's answers contradict goes back to the user — never silently resolved.

## Phase 2 — Design (session light / top full)

One design agent — it loads **nuke-think** when installed; this is a judgment role — reads requirements.md plus the recon and appends to requirements.md:

- `## Design` — file-by-file plan: files to create or modify, the contracts at each boundary (signatures, data shapes), data flow between them. New code follows the patterns recon found; deviating from them is a decision, recorded.
- `## Decisions` — every key decision as one line carrying the strongest rejected alternative: `Decision: store retry state in the queue record. Rejected: in-memory map — lost on restart, violates REQ-005.`

Hard trade-offs — expensive to reverse, or two plausible designs disagree — get the nuke-think panel protocol, in full mode especially.

## Phase 3 — Spec writing (architect ⇄ reviewer)

Read references/fix-spec-template.md first — spec.md follows its conventions with the build-spec deltas:

- Header `source:` points at `requirements.md (<N> requirements, <M> non-goals)` instead of a findings ledger; no U-### entries exist; omit the `scorecard:` line — build specs have none.
- **Executor context** carries the recon output verbatim: project one-liner, conventions, the per-prefix gates table, tier assignments resolved from references/model-tiers.md, and the file-type → skill map. Embed the REQ-### list verbatim (from requirements.md) so spec.md stands alone as nuke-verify's intent.
- **Phase ordering for a build spec:** contracts/types/scaffolding → core behavior → integration and wiring → tests → docs. (The template's repair ordering applies to audit specs only.)
- **Coverage map:** `REQ-001 → T-003 · …` — every REQ-### maps to ≥1 task.

The architect writes; the completeness reviewer verifies: every REQ-### mapped; no task violates a non-goal; every Accept mechanically checkable (command, named test, or quoted line — template rule 1); batches within a phase touch disjoint files; phases dependency-ordered; gates table and skill map present; every `## Decisions` line reflected in the tasks. Reviewer rejects → architect revises → loop, cap 3 cycles. Cap hit → report the open objections honestly; never present a spec the reviewer rejected as if it passed.

## Phase 4 — Handoff (STOP)

Report to the user and stop — do NOT start implementing:

- Requirement count, non-goals, clarifications asked and answered
- Spec shape: phases, tasks, batches, decision-log lines
- Artifact paths. Append the run's calibration line to `.nuke/calibration.log` (format in references/preflight.md)
- The handoff line: *"Run the **nuke-fix** skill on `.nuke/<run>/spec.md` in a fresh session — or hand `spec.md` to any AI agent; its Executor context + Execution protocol sections make it self-contained. After implementation, run **nuke-verify** with `intent: .nuke/<run>/spec.md` to confirm the build matches the spec."*

## Orchestration notes

- **All orchestrators:** the run_dir exists before any agent launches (preflight confirmation creates it); pass that exact path in every prompt. Phases are sequential by design — each consumes the previous phase's artifact; the recon scout inside Phase 0 is the only parallel-friendly role.
- **Claude Code:** clarifying questions and the plan gate via AskUserQuestion (plan gate options: run / switch mode / narrow scope). Pass `model`/`effort` per the tier mapping in references/model-tiers.md.
- **Other CLIs:** print the questions and the plan block; wait for replies. Without per-agent model overrides, every role inherits the session model — the protocol still holds.
- **Amplifiers:** the file-type → skill map is recorded in the spec's executor context for implementers to load at execution time; the designer and architect may consult those skills for the area's idioms, but nuke-think is the mandatory load for judgment.
