---
name: nuke-audit
description: >
  Use when the user wants a deep multi-agent quality audit of a codebase or scope —
  "nuke audit", "deep audit", "full quality audit", "audit everything", "make it all
  SOTA". Produces a findings ledger and a phased fix spec; never edits source.
disable-model-invocation: true
metadata:
  author: b4r7x
  version: "3.0.0"
  argument-hint: "[mode: micro|light|full|plan] [scope: changed|staged|branch|<path-or-glob>] [--yes]"
---

# Nuke Audit

Preflight → audit → converge → spec → stop. This skill produces a findings ledger and a phased fix spec, then hands off. It never fixes anything itself.

## Arguments

`[mode]` — `micro` | `light` (default) | `full` | `plan` (print the preflight plan, then stop)
`[scope]` — whole codebase (default) | `changed` (vs HEAD) | `staged` | `branch` (vs main/master) | `<path or glob>`
`[--yes]` — skip the preflight confirmation gate

A bare `full` always means the mode, never the scope — `nuke-audit full` is a full-intensity audit of the whole codebase; `nuke-audit light src/` is a light audit of `src/`.

## Modes

| | **micro** | **light** (default) | **full** |
|---|---|---|---|
| Round 1 wave | 4 charter auditors | 4–6 (area split), hard cap 8 | one per (lens × chunk) + cross-cutting, no cap |
| Rounds 2+ | hot charters only, delta-scoped; a charter is retired after 1 charter-dry round | hot charters delta-scoped + 1 fresh-eyes (rounds 2, 4, 6 only) + miss-hunter (round 2; later only after new medium+) | full rotation, ≥3 fresh-eyes + miss-hunter every round |
| Skeptics | 1 batched panel per round | capping per references/skeptic-protocol.md | per references/skeptic-protocol.md |
| Dry rounds to converge | 1 | 2 | 2 |
| Round cap | 4 | 8 | 10 |
| Cost stance | minimum agents that preserve medium+ recall | lean; the convergence loop is the coverage | costs do not matter; never shrink a wave |

**Convergence threshold (all modes): medium+.** A round is dry when it confirms zero new medium+ findings. Low/info are still recorded — `U-###` unverified in micro/light, skeptic-batched in full — but NEVER reset the dry counter. rounds.md names the active threshold every round.

## Mandates

These override convenience at every step:

1. **Respect the mode and the tier table.** In micro/light never spawn one agent per lens or per finding; in full never shrink a wave to save tokens. Assign each role the tier references/model-tiers.md gives it — never silently upgrade a role's tier.
2. **Main context stays thin.** The orchestrator never pulls source files into the main context. Agents receive file paths and artifact paths, not contents; agents return short structured results; everything durable lives in the artifact files.
3. **Read-only on the codebase.** Writes happen only inside the run directory. Never run `git add`, `git commit`, or `git stash`; never edit source, config, or `.gitignore`. Leave `.nuke/` untracked.
4. **Fresh run directory.** Never write into an existing audit run. Preflight allocates a new `run_dir` on confirmation; if the computed path already exists, append `-2`, `-3`, … until `mkdir` succeeds. Every artifact of this audit lives only there; pass that exact path in every agent prompt.
5. **Evidence before existence.** A candidate missing any field of the schema in Phase 2 does not enter the ledger. A convergence claim without the rounds log backing it is false reporting.

## Artifacts

`run_dir = .nuke/<YYYY-MM-DD>-<HHmmss>-<slug>/` — local 24-hour clock, e.g. `.nuke/2026-07-02-131502-src-engine/`.

| File | Role |
|---|---|
| `plan.md` | Preflight output: scope, mode, wave, tiers, estimate |
| `context.md` | Snapshot for every agent: stack, conventions, gates table, scope file list, quality bar, file-type → skill map |
| `findings.md` | The ledger — confirmed `F-###`, rejected `R-###`, unverified low/info `U-###`. Single source of truth between rounds |
| `rounds.md` | Per-round log: wave, threshold, candidate/new/duplicate/rejected counts, dry counter |
| `fix-spec.md` | Final self-contained handoff spec |
| `report.md` | Scorecard + run summary |

## Pipeline

```
Phase 0 preflight (plan → confirm → run_dir)
  ─→ Phase 1 recon ∥ quality-bar research
  ─→ Phase 2 convergence loop:  wave → skeptics → ledger ─┐
                                └─ until dry target met ──┘
  ─→ Phase 3 scorecard + fix spec ─→ Phase 4 handoff (STOP)
```

## Phase 0 — Preflight

Read `references/preflight.md` and follow it exactly:

1. Resolve arguments into a concrete scope: file list + file count + KLOC.
2. Build the file-type → skill map from the local skill library, listing it once (rules in `references/stack-adapters.md`).
3. Compose the round-1 wave and tier assignments (`references/model-tiers.md`, audit table).
4. Estimate the cost band from preflight.md's calibration table.
5. Print the plan block and WAIT for confirmation. `plan` argument → print and STOP, no run_dir. `--yes` → skip confirmation.
6. On confirmation: create the fresh `run_dir`, write `plan.md` into it.

## Phase 1 — Recon ∥ quality-bar research

Run both in parallel; both distill into `context.md`.

**Recon** — one scout produces:

1. Project instruction files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`) → the conventions agents must respect. These define what is *intentional*, not a finding.
2. Stack and manifests; the per-path-prefix gates table (test/typecheck/lint per prefix — protocol in `references/stack-adapters.md`); gateless areas flagged per the same file. The gates table goes verbatim into the fix spec later.
3. The final scope file list (exclude vendored, generated, lockfiles). Area split: confirm the split recorded in plan.md; a changed split is a plan change. light: scope past ~80 files or ~40 KLOC → split into 2 areas by directory/feature. full: chunk files into areas of 5–15 by directory/feature (15–25 for very large scopes — grow chunk size before ever dropping a lens).
4. The file-type → skill map from preflight, recorded for every agent.

**Quality-bar research** — one session-tier researcher (or the orchestrator where search tools are main-context-only); degrade gracefully; skip unavailable tools:

1. Web-search current best practices for the detected stack, current year in queries — deprecations, new idioms, changed defaults.
2. Docs lookup (context7 or equivalent) for the major libraries in use.
3. Note which amplifier skills from the lens catalog exist locally. Where no amplifier exists, the lens text plus this quality bar IS the charter — deepen the research for those lenses proportionally.

The distilled "Quality bar" section of context.md defines what the quality bar means *for this repo today*.

## Phase 2 — Convergence loop

Read `references/lens-catalog.md`, `references/skeptic-protocol.md`, and `references/ledger-format.md` before composing the first wave.

```
dry = 0; round = 1; threshold = medium+; ledger = empty findings.md
repeat:
  1. compose wave per mode (below). Round 1: agents get context.md + charter.
     Rounds 2+: auditors get the ledger DIGEST only; skeptics get full entries for
     their assigned candidates + the digest (rule in references/ledger-format.md)
  2. auditors report candidates not already in the ledger — full schema below required
  3. skeptic pass per references/skeptic-protocol.md; micro/light: low/info candidates
     get NO skeptic and enter the ledger as U-### unverified
  4. confirmed → F-### · rejected → R-### · unverified low/info → U-###
  5. log the round in rounds.md, threshold named
  6. dry = (new medium+ confirmed == 0) ? dry + 1 : 0    # low/info never reset dry
  7. apply mode rules: charter retirement (micro) · half-wave (light) · delta scope
until dry == target (micro 1; light/full 2) or round > cap (micro 4; light 8; full 10)
```

**Candidate schema** — every field mandatory; a candidate missing any is invalid and must not be reported:

1. lens + severity + one-sentence severity justification
2. `file:line` references for every involved site
3. at least one verbatim quoted line per cited site
4. numbered end-to-end trace proving the claim
5. proposed fix, imperative, one–three sentences
6. refutation attempt — the strongest reason this is NOT real; the author who cannot refute it reports it; the author the refutation convinces discards it

**Delta scope (rounds 2+, micro/light):** hot charters re-run over the delta only — files cited in the previous round's new findings plus files importing or imported by them — never the whole scope again. Fresh-eyes and miss-hunter agents are never delta-scoped.

**Charter retirement (micro):** a charter that confirms zero new medium+ in a round is retired for the rest of the run.

**Half-wave (light):** a round confirming <3 new medium+ with rejection rate <10% → halve the next wave's auditor count (round up).

If the round cap is hit without convergence, report honestly: "NOT converged", with the per-round trail. Never fake convergence. In light/full a dry round 1 still needs a dry round 2.

### Wave composition

**micro** — round 1: 4 charter auditors (behavioral, security, structural, quality — lens bundles in references/lens-catalog.md), each hunting the whole scope. Rounds 2+: hot charters only (confirmed a new medium+ last round), delta-scoped. One batched skeptic panel per round, every candidate verdicted separately.

**light** — round 1: one auditor per charter; if recon split the scope into 2 areas, behavioral and quality get one agent per area (6 agents), security and structural stay whole-scope; hard cap 8. Rounds 2+: one delta-scoped agent per hot charter, plus 1 fresh-eyes generalist (full lens catalog, no area) on rounds 2, 4, 6 only, plus 1 miss-hunter in round 2 — charter: "what could previous waves structurally not have seen?" (cross-file interactions, runtime config, generated code, scripts, docs drift). After round 2 the miss-hunter returns only in the round following a new medium+ confirmation.

**full** — round 1: one agent per (per-chunk lens × chunk) + one whole-scope agent per cross-cutting lens; security additionally gets one agent per entry surface (surface detection in references/stack-adapters.md). Rounds 2+: rotate the chunk axis (by-directory ↔ by-feature ↔ by-layer), re-run every lens that confirmed findings last round on its hot areas, add ≥3 fresh-eyes generalists and 1 miss-hunter. Never shrink a wave, drop a lens, or merge charters.

## Phase 3 — Scorecard & fix spec

Read `references/fix-spec-template.md` first.

1. **Scorecard** (into `report.md`): score each lens 1–5 (5 = no issues; 1 = critical/pervasive). Target after fixes is 5/5 everywhere; any lens that cannot reach 5/5 gets a stated reason and the maximum achievable.
2. **Spec writing:** dispatch one spec-architect + one completeness reviewer (tiers per references/model-tiers.md). The architect writes `fix-spec.md` from the ledger; the reviewer verifies: every confirmed F-### maps to ≥1 task; every U-### is routed to the phase touching its files; every task lists files + exact change + a mechanically checkable Accept (grep, test run, or quoted line); batches within a phase touch disjoint files; phases are dependency-ordered; the per-prefix gates table and the file-type → skill map are present. Reviewer rejects → architect revises → loop (micro/light: cap 3 cycles; full: until it passes).
3. **Phase ordering:** structural moves/renames → DRY extractions and architecture changes → local fixes (slop, types, errors, simplicity, dead code) → tests → docs/cleanup.
4. The spec covers **all** findings — every severity, U-### included. Record mode and tier assignments in the spec header; nuke-fix defaults to them.

## Phase 4 — Handoff (STOP)

Report to the user and stop — do **not** start fixing:

- Mode, rounds run, dry trail with threshold (e.g. `light · 4 rounds: 12 → 3 → 0 → 0 (medium+)`)
- Counts: confirmed by severity, rejected, unverified + the scorecard
- Artifact paths
- The handoff line: *"Run the **nuke-fix** skill on `.nuke/<run>/fix-spec.md` in a fresh session — or hand `fix-spec.md` to any AI agent; its Executor context + Execution protocol sections make it self-contained."*

## Orchestration notes

- **Tiers:** every spawned agent gets its role's tier from `references/model-tiers.md` (audit table). Platforms without per-agent model overrides → every role inherits the session model.
- **All orchestrators:** the run_dir exists before any agent launches (preflight confirmation creates it); pass that exact path in every prompt. Never ask agents to infer "the latest" run directory or reuse one by date/scope.
- **Claude Code:** prefer the Workflow tool — the loop maps 1:1 to loop-until-dry; use schema-validated outputs for candidates and verdicts — or parallel Agent calls with `run_in_background` per wave. Pass `model`/`effort` per the tier mapping in model-tiers.md.
- **Codex / OpenCode / Cursor / other CLIs:** subagents per charter. If parallelism is unavailable, run charters sequentially — each in a FRESH context (never reuse one long context across charters; fresh eyes are the point), same ledger protocol.
- **Amplifier skills:** each agent loads its charter's matched skills from the file-type → skill map when they exist locally; when absent, the charter text plus the quality bar carries the lens.
- **micro/light:** wave caps are hard ceilings — grow the per-agent area, add a round, or split into two scoped runs; never exceed the cap. **full:** concurrency limits just queue agents — never a reason to drop lenses or merge charters.
