# nuke-code + constitution — design

Date: 2026-07-06 · Status: approved (sections 1–3 approved in-session), implemented alongside this doc.

## Problem

The eight nuke skills are ceremonies: invoked operations with preflight, waves, and cost gates. The everyday work — "add this feature" in an ordinary session — runs below all of them with no protocol, and that is where mid-tier models diverge most from a top-tier one: first-idea code, edits to unread files, "done" without evidence, anchored self-review, silent scope narrowing. The family doctrine (weak generation + strong verification + a fix loop; final quality bounded by the strongest verifier) already recovers the gap inside ceremonies. This design applies it to the 95% of work outside them.

The routing insight: "notice this task is hard" is precisely the metacognition that degrades fastest with model tier, so the model that most needs a protocol is the least likely to self-invoke one. Routing must therefore be ambient and countable, never a judgment call.

## Decision 1 — the constitution

A ~25-line always-on router (`core/references/constitution.md`). It teaches nothing; all teaching lives in nuke-code. Contents: countable triggers (beyond-trivial → nuke-code loop; trivial → inline mode; hard decision → nuke-think; unproven bug cause or 2 failed fixes → nuke-debug; >~5 files / >~300 lines → propose nuke-review/verify), the ship rule (evidence or it is not done; never claim success past a dirty state; never silently narrow the ask), and a one-line threshold-tuning clause for project instruction files. Invoked ceremonies override it for their duration.

Delivery, zero per-project work:

- **Claude Code:** the plugin ships a SessionStart hook (`hooks/hooks.json`) that cats the constitution into context. Main sessions only — ceremony subagents are unaffected, so ceremonies do not recurse into nuke-code.
- **Codex / opencode / others:** `scripts/install-constitution.mjs` writes a marker-delimited block (`<!-- nuke:constitution:start/end -->`) into global instruction files (`~/.codex/AGENTS.md`, `~/.config/opencode/AGENTS.md`; `--claude` explicit-only to avoid double injection alongside the plugin hook). Idempotent: re-run to update, `--remove` to uninstall.
- **Redundancy:** nuke-code's frontmatter description carries the countable triggers, so harnesses that list skill descriptions get routing even before the constitution lands.

## Decision 2 — nuke-code, the ninth skill

`core/entrypoints/nuke-code.md`. Family positioning: audit finds everything · review judges a change · verify repairs another agent's implementation · **code is how the session itself works**.

- **Modes** (selected by the constitution's countable triggers): `inline` (single file, ≤~30 lines, no contract change → BUILD charter + narrowest gate, no agents), `standard` (everything else → full loop, validator at `session` in a fresh context), `elevated` (risk flags: public API, auth/security, concurrency, data migration, new dependency → validator at `top`).
- **THINK:** 2–5 falsifiable done-criteria (they become the ship validator's intent — never verified against a guess, echoing verify's Mandate 1); read files + neighbors before shaping; ≥2 genuinely different shapes with a named winner (≤5-line decision note); constitution hard-call trigger → nuke-think.
- **BUILD:** 8-imperative charter (read-before-edit and re-read after interruptions; neighbors are the style guide; mapped local skills per stack-adapters' file-type → skill map; minimal diff; no defensive noise; comments only for inexpressible constraints; behavior test in the same diff; boring beats clever).
- **SHIP:** stack-adapters gates (narrowest first, verbatim output, gateless protocol respected) → ONE fresh validator receiving only task + done-criteria + diff (never the author's reasoning), applying the four lens-catalog charter bundles in one pass, findings in the 6-field family schema → fix loop, all severities, fresh revalidation, cap 2 cycles → verdict-first hand-back. No git operations.
- **Degradations:** no subagents → inline validator (role switch + diff re-read from disk, marked `degraded`); no model overrides → session tier everywhere; no constitution → description-only triggering.

## Decision 3 — tier doctrine refinement

Asymmetric verification says validators sit one tier above implementers; in nuke-code the implementer is the session itself, so "one above" would mean `top` on every task. Resolution recorded in model-tiers.md: the everyday floor is **equal tier but fresh** — a fresh context satisfies "no agent ever verifies its own work" and removes author anchoring — and risk flags raise the validator to `top`. The family invariant holds: verification is never cheaper than generation.

## Decision 4 — deliberate divergences from ceremonies

No preflight confirmation gate (a per-task confirmation would be unbearable; the size trigger escapes to ceremonies, which do confirm) and no run_dir/artifacts (the hand-back carries the evidence; ceremonies keep the audit trail).

## Repo integration

New: `core/references/constitution.md`, `core/entrypoints/nuke-code.md`, `hooks/hooks.json`, `scripts/install-constitution.mjs`, this doc. Modified: `core/manifest.json` (nuke-code entry; constitution ships as a nuke-code reference so `npx skills add` distributes it), `core/references/model-tiers.md` (nuke-code role table + equal-but-fresh doctrine), `.claude-plugin/marketplace.json` (skill path, hooks path, version 3.0.0 → 3.1.0), `README.md` (two-layer intro, nine-skills table, "The constitution", "Install the constitution", "What an everyday task looks like", chaining, modes/cost, tiers, layout).

## Validation

Mechanical: `node scripts/build.mjs` passes (frontmatter + manifest/reference-link validation covers the new skill); installer run twice produces identical output (idempotence); `--remove` restores the pre-install file. Manual (post-merge): fresh Claude Code session with the plugin shows the constitution in context; ceremonies still run unaffected. Behavioral (ongoing): same task to a weaker model with and without the layer, compare hand-backs; initial effectiveness evidence is anecdotal, thresholds calibrate from use.

## Honest bounds

This raises the floor, not the ceiling: process discipline and fresh verification recover a large share of the everyday tier gap on decomposable, gate-verifiable work; pure one-pass insight and taste stay in the weights. Numeric thresholds (30 lines, 5 files, 300 lines, 2 cycles) are calibration defaults, expected to move with use.
