---
name: nuke-test
description: >
  Use when a scope, change, or module needs tests designed and written —
  "nuke test", "write tests for this", "cover this with tests" — especially
  when the tests must be proven to catch real bugs, not just raise coverage
  numbers.
disable-model-invocation: true
metadata:
  author: b4r7x
  version: "3.0.0"
  argument-hint: "[mode: light|full|plan] [scope: changed|<path>] [--yes]"
---

# Nuke Test

Design and write behavior-based tests that provably catch bugs. Map behaviors from the public interface, write tests with worker-tier writers under embedded rules, then prove the tests by mutating the source and watching them fail — a suite is judged by the bugs it catches, not the coverage number it prints. Corrects the three cheap-model failure modes: implementation-mirroring tests, mock-asserting tests, and tests that cannot fail.

## Arguments

`[mode]` — `light` (default) | `full` | `plan`. `plan` runs preflight, prints the plan block, and STOPS — nothing is written.
`[scope]` — `changed` (files changed vs HEAD, default) | `<path>` (file, directory, or glob)
`--yes` — skip the preflight confirmation gate.

## Modes

Tier vocabulary (`clerk`/`worker`/`session`/`top`) and per-platform mechanics: references/model-tiers.md. Platforms without per-agent overrides → every role inherits the session model.

| | **light** (default) | **full** |
|---|---|---|
| Behavior mapper | session | session |
| Test writers | worker | worker |
| Breaker (mutation check) | session | top |
| Coverage target | uncovered behaviors in risk order; the low-risk tail may be declared a gap | every uncovered behavior in the map |
| Mutations | 5–10, targeting the riskiest covered behaviors | ≥1 per newly covered behavior, in passes of ≤10 |
| Write → mutate cycles | cap 2 | cap 2 |
| Cost stance | lean: riskiest behaviors first | costs do not matter; never shrink the map |

Weak generation + strong verification: writers stay cheap; the breaker that proves their tests sits above them. Never downgrade the breaker below the writers.

## Mandates

1. **A test that cannot fail is a defect.** Every test must fail when its behavior breaks; the mutation check is the proof. Vacuous tests — no real assertion, asserting on the mock, mirroring the implementation — are deleted, never kept.
2. **Behaviors come from the public interface.** Signatures, exported types, docs, specs, and call sites — never function bodies. A behavior phrased as internal steps ("calls X then sets Y") is invalid.
3. **Mock only true boundaries.** Network, clock, filesystem, subprocess, browser APIs absent from the test environment — never the project's own modules. Asserting on a mock proves the mock.
4. **Never leave a mutation applied.** One mutation in the tree at a time; every mutation reverted and the revert verified before the next; on any abort or error, restore before stopping. The final working tree contains only test-file changes and vacuous-test deletions. No `git add` / `git commit` / `git stash`; leave `.nuke/` untracked.
5. **Fewer, better tests.** Dedup against the existing inventory before writing; one behavior per test; never re-test the framework or third-party code.
6. **Main context stays thin.** The orchestrator passes file paths, behavior entries, and artifact paths, never file contents.
7. **Respect the tier table.** Never silently upgrade or downgrade a role's tier.

## Artifacts

`run_dir = .nuke/<YYYY-MM-DD>-<HHmmss>-test-<slug>/` (local 24-hour clock) — fresh per run, never reuse or resume an old one; if the path exists, append `-2`, `-3`, … until `mkdir` succeeds.

| File | Role |
|---|---|
| `plan.md` | Preflight output: scope, framework + gates, baseline gate results, existing-test inventory, skill map, wave, tiers, estimate |
| `baseline.diff` | Pre-run source state (`git diff` + noted untracked source files) — the reference for revert checks and Phase 4's clean-tree check |
| `behaviors.md` | The numbered, risk-ranked behavior map with coverage marks |
| `mutations.md` | Every mutation with target, exact change, verdict, and the killing test |

## Pipeline

```
Phase 0 preflight (plan → confirm) → Phase 1 behavior map (session) → Phase 2 writers (worker, ≤5 behaviors each) → Phase 3 mutation check (breaker) → Phase 4 gates + report (STOP)
                                                          └──────── surviving mutation → Phase 2 for that behavior — cap 2 cycles ────────┘
```

## Phase 0 — Preflight

Read references/preflight.md and follow its plan-then-apply gate. Test specifics:

1. Resolve `[scope]` to a concrete file list + count + KLOC. `changed` resolving to zero files → STOP and ask the user for an explicit scope. Exclude vendored dirs, generated code, lockfiles, and existing test files (they are inventory, not material).
2. **Test framework and idioms** per references/stack-adapters.md: resolve the test gate command verbatim (manifest scripts first, then the fallback table); note the language's test-idioms row — it goes into every writer prompt. Mixed scopes get the per-prefix gates table.
3. **Baseline gates:** run the resolved gate rows once, output captured in plan.md. A green baseline is what lets Phase 4 claim every gate green; a red baseline is recorded and Phase 4 verifies no NEW failures instead.
4. **Existing-test inventory:** find the tests already covering the scope (colocated or mirrored test files + grep for the scope's exported symbols in test dirs). Record the paths in plan.md — this is Phase 1's dedup baseline.
5. **File-type → skill map** (references/stack-adapters.md): list the local skill library ONCE. The test-behavior-not-implementation skill, when present, is a mandatory load for every writer regardless of extension.
6. Estimate: one cycle ≈ 4–9 agents (mapper + 1–5 writers + breaker); a second cycle adds ≈ 2–4.
7. Print the plan block and WAIT for confirmation. `plan` → print and STOP. `--yes` → skip confirmation. On confirmation: create run_dir, write plan.md, and record the pre-run source state: `git diff > <run_dir>/baseline.diff` (and note untracked source files).

## Phase 1 — Behavior map (session tier)

One mapper enumerates the scope's behaviors from the **public interface only**: exported functions and types, routes, CLI commands, documented options, specs, and how call sites actually use them — never from reading function bodies (a map built from internals produces implementation-mirroring tests). Output `behaviors.md`:

- Numbered `B-##` entries, one observable behavior each, **risk-ranked**: critical paths first, then error paths, then edge cases (empty input, boundaries, cleanup and cancellation).
- Each entry marked `covered` (with the covering test cited `file:line` — never rewrite these) or `uncovered`.

```
B-07 · high · uncovered — after three consecutive failures, retryFetch rejects with the last error (public: retryFetch)
B-03 · medium · covered — parseConfig rejects unknown keys (src/config/parse.test.ts:41)
```

The mapper also flags **suspect existing tests** — names smelling of implementation ("should call …"), assertions on mocks — for the breaker's vacuous-test check in Phase 3.

## Phase 2 — Write (worker tier)

Writers in parallel, **≤5 behaviors per writer, disjoint test files** — never two writers in one file. Every writer prompt embeds ALL of the following — cheap models follow checklists, not vibes:

- Its assigned `B-##` entries verbatim, plus the existing-test inventory for its files ("extend, don't duplicate").
- The language's test-idioms row from plan.md and the mandatory skills from the skill map — test-behavior-not-implementation when present — loaded before writing.
- **The five rules.** Violating any one makes the test invalid:
  1. Test through the public interface — import what a consumer imports.
  2. Mock only true boundaries — never the project's own modules.
  3. One behavior per test; every assertion belongs to that behavior alone.
  4. The test name states the behavior in plain language ("rejects with the last error after three failures"), never the implementation ("calls retry() three times").
  5. A test that cannot fail is a defect — assert on observable output, never on the mock or on internal state.

Writers run their new tests before returning. A pass → done. A fail is one of two things: the test is wrong — fix the test; or **the code is wrong — report it as a bug with the failing output verbatim, and never weaken a correct test to make it pass.** Mark the test with the framework's expected-failure idiom when one exists (`xfail`, `fails`, `todo`) so the suite stays green while the bug stays visible; bugs go into the Phase 4 report with a nuke-debug recommendation.

## Phase 3 — Mutation check (the breaker)

The centerpiece: proof that the new tests catch bugs. One breaker agent (tier per mode) works from behaviors.md and the new test files.

1. **Propose** 5–10 concrete mutations (`M-##`), each: target `file:line`, the exact one-line change (before → after), and the `B-##` it must trip. Mutations are realistic bug classes — inverted condition, off-by-one boundary (`<` → `<=`), dropped error propagation, swapped arguments, removed call, wrong constant or default, early return. Never syntax errors: a mutation the compiler or typechecker rejects proves nothing about the tests — discard and replace it. Never mutate test files.
2. **Apply one at a time.** Isolated git worktree when available; else apply-run-revert in place. Per mutation: apply → run the relevant tests (the new tests for the target behavior + the existing tests covering it) → record the verdict → revert → verify the revert (the file's content matches its recorded pre-mutation state — capture each target file's content or hash before applying; never revert with `git checkout`/`git restore`, which would also discard pre-existing uncommitted work) before touching the next.
3. **Verdicts.** A test fails → **killed**: coverage proven; record the killing test. All tests pass → **survived**: coverage gap — that behavior returns to Phase 2 with the surviving mutation quoted verbatim in the writer's prompt ("your test must fail under this change"). Cap: 2 write → mutate cycles total; whatever survives cycle 2 is reported as a gap, never hidden.
4. **Vacuous tests.** Tests that cannot fail — tautological assertions, assertions on the mock, implementation mirrors (flagged in Phase 1 or found here) — are deleted in the same cycle. The fix for a vacuous test is a real test via the Phase 2 return, or nothing — never the vacuous one.

```
M-04 · src/lib/retry.ts:12 · `attempt < 3` → `attempt <= 3` · targets B-07 · KILLED by "rejects with the last error after three failures"
M-06 · src/lib/retry.ts:29 · `throw lastError` → `return undefined` · targets B-07 · SURVIVED → B-07 back to Phase 2 (cycle 2)
```

Every mutation and verdict lands in mutations.md.

## Phase 4 — Gates and report (STOP)

1. **Verify the tree is clean of mutations:** the working diff matches the Phase 0 baseline plus test-file changes. Any other source diff is a leaked mutation — restore that file to its recorded pre-mutation state before anything else.
2. Run every gates-table row matching the scope's prefixes — test, typecheck, lint — full output captured verbatim. The new tests must leave every gate green; with a red Phase 0 baseline, verify no NEW failures instead.
3. Report to the user, scorecard first:
   - **Mutation scorecard: killed X / survived Y.** Every survivor named — file:line, the change, the behavior still uncovered.
   - Behaviors: mapped, previously covered, newly covered, and the honest gaps (named `B-##`s with one line why each remains).
   - Vacuous tests deleted, by name.
   - Bugs found: behavior tests that fail against current code, output verbatim — recommend **nuke-debug** for root-cause.
   - Run stats (agents, cycles, scope size) + artifact paths. Append the run's calibration line to `.nuke/calibration.log` (format in references/preflight.md).
4. STOP. Never start fixing source bugs — that is nuke-debug's or nuke-fix's job.

## Orchestration notes

- **All orchestrators:** create run_dir before launching any agent and pass that exact path in every prompt. Writers run in parallel on disjoint test files; the breaker runs alone and applies mutations strictly serially — never two mutations in the tree, never a writer running while a mutation is applied.
- **Claude Code:** parallel Agent calls for the writer wave; map tiers per references/model-tiers.md (worker → mid model override, session → no override, top → strongest at max effort). Preflight gate via AskUserQuestion with options run / switch mode / narrow scope.
- **Other CLIs:** spawn subagents per role; without parallelism, run writers sequentially, each in a FRESH context. Without per-agent model overrides, every role inherits the session model — the protocol still holds.
