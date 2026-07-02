# Preflight

Loaded by all four skills as Phase 0, before any agent is dispatched, any artifact is written, or any run directory is created. Preflight turns arguments into a concrete plan, prices it, and gets explicit user confirmation — plan, then apply.

## Steps

1. **Resolve scope.** Turn the arguments into concrete numbers (table below). Exclude vendored and generated files (node_modules, dist, lockfiles, build output).
2. **Build the file-type → skill map.** List the local skill library ONCE and match it against the file types in scope, per stack-adapters.md. The map is built here and only here — later phases read it from plan.md, never re-list the library.
3. **Compose the first wave.** The first wave (audit/review round 1, verify Phases 1–2, fix phase 1) plus the tier of every role, from model-tiers.md and the skill's mode table.
4. **Estimate the cost band** from the calibration table below.
5. **Print the plan block and WAIT** for confirmation (platform notes below). Never start work on an unconfirmed plan.
6. **Apply the verdict.** On confirmation: create the run_dir and write the plan block into `<run_dir>/plan.md`, then proceed to Phase 1.

Argument semantics: `plan` → execute steps 1–5, print the block, and STOP — nothing is created on disk, no run_dir, no plan.md. `--yes` → skip the confirmation wait in step 5 and apply immediately.

plan.md is the durable record of the confirmed plan: later phases read the scope list, skill map, and tier assignments from it instead of recomputing them, and it is the proof that confirmation happened.

## Scope resolution per skill

| Skill | Resolve to | run_dir |
|---|---|---|
| nuke-audit | file list + file count + KLOC; area split per mode rules | `.nuke/<YYYY-MM-DD>-<HHmmss>-<slug>/` |
| nuke-review | diff stat (files, ±lines) + blast radius = files importing / imported-by the changed files + precomputed per-auditor file lists | `.nuke/<YYYY-MM-DD>-<HHmmss>-review-<slug>/` |
| nuke-verify | intent source → numbered requirement list + diff stat + blast radius + baseline gates run once (per-prefix table) | `.nuke/<YYYY-MM-DD>-<HHmmss>-verify-<slug>/` |
| nuke-fix | spec phases, task and batch counts + baseline gates from the spec's per-path-prefix gates table | the spec's directory — `plan.md` written next to `fix-spec.md` |

Blast radius for review and verify is computed once here (one clerk agent or direct grep) so worker auditors never navigate blind. Verify and fix preflights run the baseline gates as part of resolution; a failing baseline becomes finding #1 (verify) or the first task of the run (fix), never something to validate around.

## Calibration table

| Anchor | Cost |
|---|---|
| One whole-scope auditor read | ≈ 60–200K input tokens |
| micro | ≈ 8–15 agents total |
| light | ≈ 15–30 agents total |
| full | uncapped — historic runs: 65–133 agents |
| review | ≈ 6–7 agents (one wave); +≈5 if a second wave triggers |
| verify | light ≈ 6–10 agents + fix cycles; full grows with validator tier, not count |

State the band, not a fake precise number. If the resolved scope pushes a mode past its band (a very large scope in light, say), flag it in the plan block and offer narrowing or splitting into two runs.

## Plan block

Compact, ~10 lines, printed verbatim and later written as plan.md:

```
## Nuke Preflight — nuke-audit
scope: src/engine/ — 64 files · ~21 KLOC
mode: light · threshold: medium+ · dry-to-converge: 2 · round cap: 8
wave 1: 4 charter auditors (worker) + recon scout (clerk)
verification: skeptics session, per skeptic-protocol.md · low/info → U-### unverified
spec: architect (session) + completeness reviewer (worker)
skill map: .ts → typescript-best-practices, clean-code · .tsx → react-senior-guide
estimate: light band, 15–30 agents · ~60–200K input tokens per whole-scope read
run_dir: .nuke/2026-07-02-141530-src-engine/ (created on confirmation)
```

## Confirmation — platform notes

- **Claude Code:** AskUserQuestion with exactly three options: **run** / **switch mode** / **narrow scope** (skills without modes — nuke-review — replace *switch mode* with *plan-only*). "switch mode" re-runs steps 3–5 with the new mode; "narrow scope" asks for the new scope and re-runs from step 1.
- **Other CLIs / no interactive prompt tool:** print the plan block and wait for the user's reply. An affirmative → apply; anything else → treat as a mode or scope adjustment and re-plan.
- `--yes` skips this section entirely; `plan` prints the block and stops without asking.
