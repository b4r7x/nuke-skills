---
name: nuke-debug
description: >
  Use when hunting a bug, regression, failing test, flaky behavior, or
  unexplained output that needs root-cause analysis rather than a quick patch —
  "nuke debug", "find why this fails", "debug this properly".
disable-model-invocation: true
metadata:
  author: b4r7x
  version: "3.0.0"
  argument-hint: "[mode: light|full|plan] <bug description | failing test | command> [--yes]"
---

# Nuke Debug

Root-causes and fixes one bug with evidence discipline. Corrects the cheap-model failure mode: patching where the symptom appears instead of where the cause lives, and "fixing" by wrapping defensive code around the crash site. The pipeline is reproduce → localize → fix → verify; no phase starts until the previous one produced evidence.

Amplifier: when a systematic-debugging skill exists in the local library, the reproducer and localizers load it — its disciplines (root cause before any fix, backward tracing, one variable at a time) are the same ones mandated here.

## Arguments

`[mode]` — `light` (default) | `full` | `plan`. `plan` runs preflight, prints the plan block, and STOPS — nothing is written.
`<bug>` — a description ("save button clears the form"), a failing test (path or name), or the exact failing command.
`--yes` — skip the preflight confirmation gate.

Mode tokens match exactly; anything else in first position is the bug report.

## Modes

Tier vocabulary (`clerk`/`worker`/`session`/`top`) and per-platform mechanics: references/model-tiers.md. Platforms without per-agent overrides → every role inherits the session model.

| | **light** (default) | **full** |
|---|---|---|
| Reproducer | worker | worker |
| Localizers per wave | 2–3 · worker | 3 · session |
| Adjudicator — loads nuke-think when installed | session | top |
| Fixer | worker | worker |
| Validator — one tier above the fixer | session | top |
| Hypothesis-wave cap | 3 | 3 |
| Fix → verify cycle cap | 3 | 5 |
| Cost stance | lean: the smallest wave that separates the hypothesis families | costs do not matter; never shrink a wave |

## Mandates

1. **NO FIX WITHOUT A REPRODUCTION.** The fix phase is unreachable until Phase 1 produces a failing reproduction with verbatim output. If the bug cannot be reproduced after honest effort, STOP and report exactly what information is missing — never patch an unreproduced bug. A fix you cannot watch fail is a guess wearing a diff.
2. **Fix the cause, not the symptom.** No defensive band-aids at the crash site — no null check, retry, try/catch, or sleep added where the error surfaces unless that site IS the root cause. The fix lands at the origin of the first wrong value.
3. **One variable at a time.** Localizers change or instrument exactly one thing per step; every reported claim is labeled **fact** (observed output) or **assumption** (tagged `unverified` until confirmed). An assumption never becomes a root cause.
4. **Evidence before claims.** Failing output, first wrong values, and passing output are pasted verbatim, never summarized.
5. **No `git add` / `git commit` / `git stash`. No `.bak` files.** The working tree is left for human review.
6. **Main context stays thin.** The orchestrator passes the bug report, file lists, and findings — never file contents; detail lives in subagents and debug.md.
7. **Respect the tier table.** Never silently upgrade or downgrade a role's tier.
8. **Never claim success past a dirty state.** Cap hit → the verdict is the honest wave/cycle log, not "probably fixed".

## Artifacts

`run_dir = .nuke/<YYYY-MM-DD>-<HHmmss>-debug-<slug>/` (local 24-hour clock) — fresh per run, never reuse or resume an old one; if the path exists, append `-2`, `-3`, … until `mkdir` succeeds.

| File | Role |
|---|---|
| `plan.md` | Preflight output: bug report (symptom, expected vs actual), scope, gates, skill map, tiers |
| `debug.md` | Reproduction (steps + failing output), wave log (hypotheses, evidence, verdicts), root cause + trace, fix record, sweep results |

## Pipeline

```
Phase 0 preflight → Phase 1 reproduce → Phase 2 localize (waves, cap 3) → Phase 3 fix → Phase 4 verify + sweep → verdict
                      │ unreproducible →          │ no survivor after wave 3 →
                      │ STOP: report what's missing│ STOP: report the eliminations
```

## Phase 0 — Preflight

Read references/preflight.md and follow its plan-then-apply gate. Debug specifics:

1. **Resolve the bug report:** symptom, **expected vs actual** behavior, the repro command or failing test if given, and when it last worked (commit, version, or "never") if known. No statable expected-vs-actual → ask the user; a bug cannot be debugged toward an unknown correct state.
2. **Resolve the suspected scope** — files named by the stack trace, the failing test, or the symptom's feature area — into the localizers' starting file lists. A starting point, not a fence: tracing follows evidence wherever it leads.
3. **Baseline gates:** build the per-path-prefix gates table per references/stack-adapters.md and run the matching rows once, output captured. The baseline separates the target bug from pre-existing breakage: Phase 4 must prove the fix flipped the target failure without regressing anything else. Other failing gates are reported in the verdict, not silently adopted.
4. **File-type → skill map** (references/stack-adapters.md) — drives mandatory skill loading for the fixer.
5. Print the plan block (bug, expected vs actual, scope, wave, tiers, gates, estimate) and WAIT for confirmation. `plan` → print and STOP. `--yes` → skip confirmation. On confirmation: create run_dir, write plan.md.

## Phase 1 — Reproduce (worker)

One worker agent produces the **minimal failing reproduction**: a failing test where the stack has a framework, else the smallest script or exact command that fails deterministically. Shrink it — drop every input, step, and dependency the failure survives without. Flaky bugs: find the forcing condition (seed, ordering, timing, load) that makes the failure reliable; a reproduction that fails one run in ten localizes nothing. CI-only failures: mirror the CI environment locally (runtime version, env vars, locale/timezone, clean install) before calling the bug unreproducible.

Into debug.md: exact repro steps, the failing output verbatim, the reduction trail (what was dropped, what the failure needed).

**Unreproducible after honest effort** — reported inputs tried, environment matched as far as available, forcing conditions searched — → STOP the run and report exactly what is missing: which input data, environment detail, version, or event sequence would make it reproducible (Mandate 1). Never proceed to a fix.

## Phase 2 — Localize

Waves of parallel localizers, each wave adjudicated. Cap: 3 waves.

**Wave:** 2–3 localizers (mode table), each assigned a DIFFERENT hypothesis family as its stance — `data/state` (the value is wrong before this code runs) vs `logic/algorithm` (the code computes the wrong thing) vs `environment/config` (dependency, version, platform, configuration) — or bisect axes: git-history bisect, input bisect, code-path bisect. Assigned stances are the point: unstanced localizers converge on the same first idea. Each localizer instruments or bisects **one variable at a time** (Mandate 3) and returns:

- the **first wrong value** — the earliest point in execution where an observed value diverges from expected, with file:line and the verbatim observation
- a numbered trace from a known-good input to that point
- every claim labeled **fact** or **assumption** (`unverified` where unconfirmed)
- a verdict on its own family: `guilty | cleared | inconclusive`, with the evidence that decides it

**Adjudication:** one adjudicator (mode table; loads nuke-think when installed) picks the root cause by **evidence quality, never eloquence** — a quoted first wrong value beats a plausible story. Verdict + confidence + falsifier into debug.md. Root cause found → Phase 3.

**No survivor:** compose the next wave carrying what was learned — cleared families become constraints, inconclusive ones get sharper stances or new bisect axes. After wave 3 without a root cause: STOP and report honestly — hypotheses eliminated (with evidence), what remains uncertain, and the most informative next observation a human could make.

## Phase 3 — Fix (worker)

One worker fixer receives the root cause, its trace, and the reproduction. Requirements:

- **Minimal change at the root cause** — the smallest diff that makes the reproduction pass because the cause is gone, not because the symptom is masked. No while-I'm-here refactors.
- **Mandatory skill loading** per the plan's file-type → skill map, before writing.
- **The reproduction becomes a regression test** wherever the stack allows: converted to a permanent test in the adapter's test idiom (references/stack-adapters.md), named after the behavior it protects. No framework (gateless repo) → keep the repro script and record its path in debug.md.
- A fix that keeps widening — more sites, more special cases, each edit revealing another — is architecture pushing back: stop, report the pattern, and recommend nuke-audit on the area instead of forcing the patch.

## Phase 4 — Verify (validator, one tier above the fixer)

One fresh validator — never the fixer:

1. **Reproduction now passes** — output verbatim. The regression test must assert observable behavior, not the fix's implementation; a test that would pass even without the fix is a defect.
2. **All matching gates pass** against the Phase 0 baseline — the target failure flipped, nothing else regressed; outputs verbatim.
3. **Instrumentation removed** — every Phase 2 probe, log line, and temp file is gone from the working tree.
4. **Blast-radius sweep for the bug class:** pattern-search the codebase for the same mistake elsewhere — same misused API, same wrong assumption, same escape idiom (grep vocabulary: references/stack-adapters.md table B). Hits inside the changed scope → back to the fixer. Hits outside scope → **reported, never fixed** — findings for the verdict; a systemic spread is grounds to recommend nuke-audit.

Validator findings → back to Phase 3 with the exact findings. The reproduction still failing → the root cause was wrong: return to Phase 2 as a new wave, counting against the wave cap. Cycle cap per the mode table; cap hit → stop and report per Mandate 8.

## Verdict

Report verdict first:

- **"FIXED — root cause: <one line>. Reproduction passes, regression test added, gates match baseline, working tree ready for review (nothing committed)."**
- **NOT REPRODUCED** — what was tried, what information is missing.
- **NOT LOCALIZED** — waves used, hypotheses eliminated with evidence, the most informative next observation.
- **NOT CLEAN** — cycles used, what is fixed, what remains, verbatim failing output.

Always: the root-cause trace, the fix record (files + line refs), sweep results including out-of-scope hits, run stats (agents, waves, cycles). Append the run's calibration line to `.nuke/calibration.log` (format in references/preflight.md).

## Orchestration notes

- **All orchestrators:** create run_dir before launching any agent and pass that exact path in every prompt. Localizers within a wave run in parallel; instrumentation is additive and temporary — when two localizers must touch the same file, serialize them or give each an isolated worktree. The fixer writes alone.
- **Claude Code:** parallel Agent calls; map tiers per references/model-tiers.md (worker → mid model override, session → no override, top → strongest at max effort). Preflight gate via AskUserQuestion with options run / switch mode / narrow scope.
- **Other CLIs:** spawn subagents per role; without parallelism, run localizers sequentially, each in a FRESH context. Without per-agent model overrides, every role inherits the session model — the protocol still holds.
