---
name: nuke-review
description: >
  Use when the user wants a thorough review of a diff, branch, PR, or staged
  changes — "nuke review", "review this branch/PR", "review my changes" —
  heavier than a glance, cheaper than a full audit.
disable-model-invocation: true
metadata:
  author: b4r7x
  version: "3.0.0"
  argument-hint: "[scope: changed|staged|branch|<pr-ref>|<path>] [plan] [--yes] [--spec]"
---

# Nuke Review

Review → verdict → stop. One preflighted wave of four worker-tier charter auditors over the diff and its blast radius, one session-tier skeptic, a verdict-first report. The scaffolding — precomputed file lists, embedded checklists, a schema-forced finding format, mandatory amplifier skills — is what lets cheap auditors deliver near-top-tier review. Never edits source.

## Arguments

`[scope]` — `changed` (vs HEAD, default) | `staged` | `branch` (vs main/master) | `<pr-ref>` | `<path>`
`plan` — print the preflight plan and stop (no run_dir created)
`--yes` — skip plan confirmation
`--spec` — always write the mini fix-spec, regardless of finding count

## Roles and tiers

| Role | Tier |
|---|---|
| Blast-radius recon | clerk (or direct orchestrator grep) |
| Charter auditors (4) | worker |
| Batched skeptic | session |
| Mini-spec architect | session |

Tier definitions and platform mapping: references/model-tiers.md. Platforms without per-agent model overrides: every role inherits the session model. Weak generation + strong verification is the design — never silently upgrade a role's tier, and never downgrade the skeptic below the auditors.

## Mandates

1. **Read-only on the codebase.** Writes happen only inside the run directory. Never run `git add`, `git commit`, or `git stash`. Leave `.nuke/` untracked.
2. **Main context stays thin.** The orchestrator passes file paths and artifact paths, never file contents; agents return short structured results; durable detail lives in the artifacts.
3. **Evidence before existence.** A finding missing any mandatory schema field (Phase 1) is invalid and must not be reported — not by an auditor, not in the final report.
4. **Respect the tier table.** Never silently upgrade a role's tier to "be safe"; the protocol, not the model, carries the quality.
5. **One skeptic wave per auditor wave is the ceiling, and two auditor waves is the hard ceiling.** This is a review, not an audit — when systemic issues surface (architecture rot, pervasive duplication, repo-wide convention drift), say so and recommend nuke-audit; never loop.

## Artifacts

`run_dir = .nuke/<YYYY-MM-DD>-<HHmmss>-review-<slug>/` (local 24-hour clock) — fresh per run, never reuse or resume an old one; if the path exists, append `-2`, `-3`, … until `mkdir` succeeds.

| File | Role |
|---|---|
| `plan.md` | Preflight output: scope, blast radius, skill map, wave, tiers, estimate |
| `findings.md` | Confirmed `F-###` + rejected `R-###`, full schema entries with skeptic verdicts |
| `review.md` | The verdict-first report |
| `fix-spec.md` | Only when `--spec` passed or >5 confirmed findings |

## Pipeline

```
Phase 0 preflight (plan → confirm) → Phase 1 auditor wave (worker — one per charter, more when area-split) → Phase 2 skeptic (1 × session) → Phase 3 report + handoff (STOP)
                                            └────── second wave only on Phase 2 triggers — two waves max ──────┘
```

## Phase 0 — Preflight

Read references/preflight.md and follow its plan-then-apply gate. Review specifics:

1. Resolve `[scope]` to a concrete diff: changed-file list + diff stat (files, insertions, deletions). Exclude lockfiles, generated code, vendored deps.
2. **Blast radius:** files that import or are imported by the changed files — one clerk agent or direct grep over import statements and changed-export call sites. The orchestrator precomputes each auditor's file lists (changed files to judge + blast-radius files to trace into); workers never navigate blind.
3. **File-type → skill map** (references/stack-adapters.md): list the local skill library ONCE, map extensions to present amplifier skills (`.tsx`/`.jsx` → react-senior-guide, `.ts` → the matched type-discipline skill, `.py` → matched python skills, …). Record the map in plan.md.
4. Compose the wave: 4 charter auditors, ≤8 changed files per auditor — split by charter first, then by area within a charter when the diff is larger (behavioral-A, behavioral-B, …).
5. Estimate: single wave ≈ 6–7 agents (recon + 4 auditors + skeptic + optional architect); a second wave adds ≈5. Cost band per the calibration table in references/preflight.md.
6. Print the plan block and WAIT for confirmation. `plan` argument → print and STOP. `--yes` → skip confirmation. On confirmation: create run_dir, write plan.md.

## Phase 1 — Charter auditor wave (worker tier)

Read references/lens-catalog.md before composing prompts. Four charters, each bundling its lenses:

| Charter | Bundled lenses |
|---|---|
| behavioral | correctness, errors, tests, performance |
| security | security, hygiene |
| structural | architecture, structure, dry, dead-code |
| quality | simplicity, slop, types, conventions, stack |

Every auditor prompt embeds ALL of the following — cheap models follow checklists, not vibes:

- The charter's checklist from references/lens-catalog.md, in full.
- Its precomputed file lists: changed files (the material under judgment) + blast radius (where to trace).
- **Mandatory amplifier loading** per the plan's file-type → skill map: when `.tsx`/`.jsx` files are in the list, load react-senior-guide and run its AI code review checklist verbatim on every touched component; same rule for every other mapped skill. When no amplifier is mapped for a file type, the lens text plus the plan's quality bar IS the charter.
- **Side-effect tracing duty:** every changed export, signature, schema, or config value must be traced to its callers and consumers in the blast radius — that is what the blast radius is for. A changed contract with untraced callers is an automatic candidate.
- **The candidate finding schema.** A finding missing any mandatory field is invalid — discard it, do not report it:
  1. lens + severity (`critical | high | medium | low | info`) + one-sentence severity justification
  2. `file:line` references — every involved site
  3. **quoted source** — at least one verbatim quoted line per cited site (mandatory)
  4. **end-to-end trace** — numbered hops proving the claim (mandatory)
  5. proposed fix — imperative, one–three sentences
  6. **refutation attempt** — the strongest reason this is NOT real (mandatory). If you cannot refute it, report it; if the refutation convinces you, discard it.

Auditors return candidates to the orchestrator; they do not write findings.md.

## Phase 2 — Skeptic (session tier)

Read references/skeptic-protocol.md. ONE batched skeptic verdicts every candidate **separately** — batching shares context, never merges judgments. The charter is to refute: real at the cited lines? duplicate of a confirmed OR rejected entry? intentional per project conventions? in scope? does the fix improve or churn? Uncertain after full research → reject with a written reason. Confirmed → `F-###`, rejected → `R-###`, both appended to findings.md with the full schema entry and the verdict reason. Rejected entries are never re-reported or re-judged. Entry and digest formats: references/ledger-format.md.

**Second auditor wave — only on these triggers, never otherwise:**

- the skeptic confirms **≥8 findings** (coverage signal: a diff this hot likely hides more), or
- the skeptic rejects **≥40% of candidates** (precision signal: auditors misread the repo — re-brief them with the rejection reasons).

Wave 2 is 4 fresh worker auditors under the same protocol, prompts extended with a one-line digest of every confirmed and rejected finding ("do not re-report these"). Its candidates get one batched skeptic pass. Then stop regardless of results — two waves is the hard ceiling; persistent heat is what the escalation line in Phase 3 is for.

## Phase 3 — Report and handoff (STOP)

1. **`review.md` — verdict first.** Opening line: `verdict: approve | approve-with-nits | request-changes` + one-sentence rationale. Then three sections: **Blockers** (critical/high), **Improvements** (medium), **Nits** (low/info) — every finding with file:line, the quoted source line, and the proposed fix. Close with the rejected-candidate count and run stats (waves, agents, scope size).
2. **Mini fix-spec** — only when `--spec` was passed or >5 findings confirmed. Read references/fix-spec-template.md: single phase, tasks batched by disjoint files, every `Accept:` mechanically checkable (grep, test run, or quoted line). Carry the file-type → skill map and per-prefix gates from plan.md into the spec.
3. Report to the user and stop — never start fixing:
   - the verdict, counts by severity, artifact paths
   - when a fix-spec exists: *"Run the **nuke-fix** skill on `.nuke/<run>/fix-spec.md` in a fresh session — or hand `fix-spec.md` to any agent; its executor context makes it self-contained."*
   - when systemic issues surfaced: *"These findings point past this diff — run **nuke-audit** on `<area>` for a convergent audit."*

## Orchestration notes

- **All orchestrators:** create run_dir before launching any agent and pass that exact path in every prompt. Auditors run in parallel; the skeptic runs only after all auditors return.
- **Claude Code:** parallel Agent calls for the wave; map tiers per references/model-tiers.md (clerk/worker → cheapest/mid model override, session → no override). Preflight gate via AskUserQuestion with options run / narrow scope / plan-only.
- **Other CLIs:** spawn subagents per charter; without parallelism, run charters sequentially, each in a FRESH context. Without per-agent model overrides, every role inherits the session model — the protocol still holds.
