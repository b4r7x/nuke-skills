# nuke-skills

Nine agent skills and one always-on constitution. Seven skills spec, audit, review, verify, fix, debug, and test codebases using waves of subagents; the eighth raises the reasoning quality of whichever model runs the others; the ninth — nuke-code — plus the constitution turn the same discipline inward: the everyday loop the session runs for its own changes, so ordinary work arrives already reviewed. The design bet: a cheap model following a strict protocol — embedded checklists, a forced finding schema, skeptic passes, validators one tier above implementers — beats an expensive model working from intuition. The protocol carries the quality; the model mostly has to follow instructions.

## Install

```
npx skills add b4r7x/nuke-skills
```

That installs the skills into whichever coding agents you have set up (Claude Code, Codex, Cursor, OpenCode, and others).

Claude Code can also take the repo as a plugin marketplace: `/plugin marketplace add b4r7x/nuke-skills`, then `/plugin install nuke@nuke-skills`.

The plugin also installs the constitution: a SessionStart hook injects it into every session automatically — nothing to edit. On every other harness, install it once, globally (see [Install the constitution](#install-the-constitution)).

## The nine skills

| Skill | What it does | Writes code? | Typical trigger |
|---|---|---|---|
| nuke-audit | Convergent multi-round quality audit of a codebase or scope. Produces a findings ledger and a phased fix spec. | no | "nuke audit", "deep audit src/" |
| nuke-review | One-to-two-wave review of a diff, branch, or PR, plus its blast radius (files importing or imported by the changes). Produces a verdict-first report. | no | "nuke review", "review this branch" |
| nuke-verify | Checks an implementation against its stated intent, then fixes it until clean. | yes | "verify what the agent built" |
| nuke-fix | Executes a fix spec phase by phase with implementer and validator waves. | yes | `nuke fix .nuke/<run>/fix-spec.md` |
| nuke-spec | Compiles a feature request into a build spec: numbered requirements, recorded design decisions, mechanically checkable acceptance criteria. | no | "nuke spec", "spec this feature" |
| nuke-debug | Root-causes one bug through reproduce → localize → fix → verify. No fix without a failing reproduction. | yes | "nuke debug", "find why this fails" |
| nuke-test | Maps behaviors from the public interface, writes tests, then proves them by mutating the source and watching them fail. | yes | "nuke test", "cover this with tests" |
| nuke-think | Maxes the platform's thinking dials and runs a six-step reasoning discipline; a stance-assigned panel for the hardest calls. | no | "nuke think", auto-loaded by judgment roles |
| nuke-code | The everyday loop below the ceremonies: THINK (done-criteria, ≥2 solution shapes) → BUILD (house-idiom charter) → SHIP (fresh validator + gates) for the session's own changes. | yes | engaged automatically by the constitution; "nuke code" forces it |

Every reported finding must carry file:line references, at least one verbatim quoted line per site, a numbered trace proving the claim, and a refutation attempt: the auditor writes the strongest case that the finding is not real, and reports it only when that case fails to convince them. A finding missing any field is discarded, not reported. This schema is most of why cheap auditors stay precise.

Audit, review, and spec never edit source; they write only under `.nuke/` — their run directory plus the shared repo map and calibration log. Verify, fix, debug, and test edit source, but nothing ever touches git: no adds, no commits, no stashes. The working tree is left for you to review.

The protocols are stack-neutral. A shared adapter table covers JS/TS, Python, Go, Rust, JVM, C#, Ruby, and PHP (per-language gates, type-escape vocabulary, test idioms), plus rules for mixed monorepos and for repos with no test or lint gates at all.

## The constitution

The ceremonies cover invoked operations. The constitution covers everything else: a ~25-line always-on router injected into every session, built on one observation — "notice this task is hard" is precisely the judgment a mid-tier model fails at, so the model that most needs a protocol is the least likely to invoke one. Routing therefore never asks the model to judge; every trigger is countable.

```markdown
## Nuke constitution — everyday discipline

Applies to every coding task in this session. Invoked nuke ceremonies
(audit / review / verify / fix / spec / debug / test) override it for
their duration.

Routing — countable triggers, never judgment calls:

- Implementation beyond trivial (>1 file, or >~30 changed lines, or any
  change to a public API, dependency, schema, or behavior contract)
  → run the nuke-code loop (THINK → BUILD → SHIP).
- Trivial change → nuke-code inline mode: BUILD charter + narrowest
  gate. No agents.
- Hard decision — expensive to reverse, or two plausible designs and you
  cannot name why one wins → nuke-think BEFORE writing code.
- A bug whose cause you have not proven, or 2 failed fix attempts →
  stop patching; switch to nuke-debug discipline (failing reproduction
  before any fix).
- Diff outgrew everyday scale (>~5 files or >~300 lines) → checkpoint
  and propose nuke-review or nuke-verify instead.

Ship rule: nothing is "done" without evidence — gates run with output
shown; non-trivial work additionally carries a fresh validator's
verdict. Never claim success past a dirty state. Report failures and
dropped scope plainly; never silently narrow the ask.

Project instruction files may tune the numeric thresholds; everything
else is not negotiable.
```

Invoked ceremonies override the constitution for their duration, so an audit's subagent waves never recurse into nuke-code. Numeric thresholds are calibration defaults; a project's instruction file (AGENTS.md, CLAUDE.md, …) may tune them — everything else is not negotiable.

## Install the constitution

| Harness | How |
|---|---|
| Claude Code | nothing to do — the plugin's SessionStart hook injects it automatically and updates with the plugin |
| Codex | `node scripts/install-constitution.mjs --codex` → `~/.codex/AGENTS.md` |
| opencode | `node scripts/install-constitution.mjs --opencode` → `~/.config/opencode/AGENTS.md` |
| Claude Code without the plugin | `node scripts/install-constitution.mjs --claude` → `~/.claude/CLAUDE.md` (explicit only — with the plugin installed you would get it twice) |
| anything else | `node scripts/install-constitution.mjs --file <path to its global instructions>` |

Run with no flags to auto-detect Codex and opencode. The installer writes a marker-delimited block (`<!-- nuke:constitution:start/end -->`): re-run it to update after pulling a new version, `--remove` to uninstall cleanly. It needs a repo checkout; `npx skills add` users find the same text shipped at `skills/nuke-code/references/constitution.md` and can paste it between the markers by hand.

## Using them

```
nuke audit                        light audit of the whole repo
nuke audit micro src/engine/      smallest useful audit of one area
nuke audit full --yes             everything, no confirmation gate, expensive
nuke review branch                review this branch against main
nuke verify intent: docs/spec.md  verify the working tree against a spec
nuke fix .nuke/<run>/fix-spec.md  execute an audit's fix spec
nuke spec add retry to the fetch layer    compile a feature request into a build spec
nuke debug "save button clears the form"  root-cause and fix one bug
nuke test src/lib/                        write tests, then prove them by mutation
nuke code <task>                          force the everyday loop (normally the constitution engages it for you)
```

Runs leave their artifacts under `.nuke/`. The skills never edit your `.gitignore`, so add `.nuke/` yourself if the clutter bothers you.

## What an audit run looks like

1. Preflight resolves the scope, builds a file-type → skill map from your local skill library, composes the first wave, and prints the plan. You confirm.
2. A recon scout and a quality-bar researcher run in parallel: project conventions, stack and gates, current best practices for what the repo actually uses.
3. The convergence loop. Each round, charter auditors (behavioral, security, structural, quality) hunt candidates; skeptics try to refute each one separately. Survivors enter the ledger as confirmed findings, casualties as rejected ones that are never re-reported. Later rounds narrow to the files around the previous round's findings, and the loop ends when enough consecutive rounds confirm nothing new at medium or above.
4. A spec architect turns the ledger into a phased, dependency-ordered fix spec; a completeness reviewer verifies every finding maps to a task with a mechanically checkable acceptance criterion.
5. The skill reports a scorecard and stops. It never starts fixing.

Review, verify, and fix are built from the same pieces: the same four charters, the same finding schema, the same preflight gate.

## What an everyday task looks like

1. You ask for a change in a plain session — no nuke command. The constitution decides: a single-file, ≤~30-line, no-contract change runs inline (BUILD charter + narrowest gate, zero agents); anything bigger runs the full loop.
2. THINK: the ask restated as 2–5 falsifiable done-criteria, the touched files and their neighbors actually read, ≥2 solution shapes weighed, the winner named in a ≤5-line decision note. A hard design call routes to nuke-think before any code exists.
3. BUILD: house idiom, minimal diff, the mapped local skills loaded for every touched file type.
4. SHIP: the narrowest matching gates run with output captured; one fresh validator — never the authoring context — verdicts every done-criterion and hunts what the change introduced, using the same four charters and finding schema as the ceremonies; findings are fixed and revalidated, two cycles max.
5. The hand-back leads with the verdict:

```
SHIP: clean — validator: 0 findings · gates: pass

done-criteria: 3/3 met (validator-verified)
gates: pnpm --filter web test → 14 passed · tsc --noEmit → clean
shape: extend the existing reducer (rejected: parallel store — duplicate state ownership)
cycles: 1 — validator caught a swallowed error on the retry path; fixed, revalidated
```

When the loop cannot get clean — cap hit, unfixable finding, failing gate — the hand-back leads with the honest open list instead. `SHIP: clean` past a dirty state is a protocol violation, exactly as in the ceremonies.

## How they chain

- audit → fix: the audit ends with a `fix-spec.md`. Run nuke-fix on it in a fresh session. The spec is self-contained, so any agent can execute it.
- review → fix: when a review confirms more than 5 findings, or you pass `--spec`, it writes a mini fix spec with the same handoff.
- cheap implementer → verify: let an inexpensive model implement a task, then run nuke-verify against the original spec or task text. It maps every requirement to evidence, hunts regressions the implementation introduced, and repairs what it finds.
- spec → fix → verify: for new features. nuke-spec compiles the request into the same executable spec format an audit emits; nuke-fix builds it; nuke-verify takes the spec as intent and confirms the build matches.
- test → debug: a new behavior test that fails against the current code is reported as a bug with a nuke-debug recommendation, never weakened until it passes.
- debug → audit: when the fix keeps widening or the closing sweep finds the same bug class spread across the codebase, nuke-debug recommends nuke-audit on the area instead of forcing the patch.
- judgment roles → think: skeptics, spec architects, completeness checkers, and reconcilers load nuke-think automatically when it is installed, so the reasoning-heavy roles inside the other skills get the discipline for free.
- constitution → everything: the always-on router engages nuke-code for ordinary implementation, nuke-think for hard calls, nuke-debug discipline after two failed fixes, and proposes nuke-review or nuke-verify when a diff outgrows everyday scale — countable triggers, so no model ever has to notice it is in over its head.
- code → think / debug / review: the same escalations fire from inside the loop; nuke-code stretches nothing — it hands off.

## Modes and cost

nuke-audit has three modes:

| | micro | light (default) | full |
|---|---|---|---|
| Agents, ballpark | ~8–15 | ~15–30 | uncapped (real runs: 65–133) |
| Round cap | 4 | 8 | 10 |
| Dry rounds to converge | 1 | 2 | 2 |

Convergence counts only what matters: a round is dry when it confirms zero new medium-or-higher findings, and low/info findings are recorded but never reset the dry counter, so the loop cannot chase nits forever.

Nothing spawns blind. Every skill first resolves its scope, composes the wave, prints a short plan with a cost estimate, and waits for your confirmation. Pass `plan` as an argument for a pure dry run (plan printed, nothing created), or `--yes` to skip the gate.

Be warned about full mode: the 65–133 agent figures come from real runs that burned 5–9M input tokens on the strongest model. It exists for code where cost genuinely does not matter.

The other run skills — verify, fix, spec, debug, test — have light/full instead. Light keeps waves lean; full raises the tiers and, where a fix loop exists, its cycle cap (verify, fix, and debug go from 3 to 5; test keeps 2 write→mutate cycles in both).

nuke-code is priced for every day:

| | inline | standard | elevated |
|---|---|---|---|
| Trips when | 1 file, ≤~30 lines, no contract change | anything beyond inline | risk flags: public API, auth/security, concurrency, data migration, new dependency |
| Agents | 0 | 1–2 (fresh validator + revalidation), `session` tier | 1–2, validator at `top` |

It never gates on confirmation and writes no run_dir — the hand-back carries the evidence; ceremonies keep the artifacts.

## Model tiers

Protocol text never names models. Roles map to four tiers:

| Tier | Meaning | Typical roles |
|---|---|---|
| clerk | cheapest available | recon, logs, digests, dedup |
| worker | cheap/mid | charter auditors, implementers |
| session | whatever model your session runs | skeptics, spec architects, light validators |
| top | strongest available, max effort | full-mode auditors and validators |

The load-bearing rule: verification always sits one tier above generation. Worker implementers get session validators; top implementers get top validators. Weak generation plus strong verification plus a fix loop is what makes cheap output hold up.

nuke-code carries the one deliberate refinement: its implementer is the session itself, so "one tier above" would mean `top` on every task. The everyday floor is instead **equal tier but fresh** — a fresh context still satisfies "no agent verifies its own work" and removes the author's anchoring — and risk flags raise the validator to `top`. Verification is never cheaper than generation.

On platforms without per-agent model overrides, every role inherits the session model. The protocol still works; you just lose the cost savings.

## Repo layout

```
core/entrypoints/    SKILL.md sources, one per skill
core/references/     shared reference pool (lens catalog, skeptic protocol, tiers, constitution, ...)
core/manifest.json   which references each skill ships with
skills/              generated and committed; each folder is self-contained, installable alone
scripts/build.mjs    the generator; validates frontmatter and reference links
scripts/install-constitution.mjs   marker-based global install of the constitution (Codex, opencode, ...)
hooks/hooks.json     Claude Code plugin hook — injects the constitution at session start
docs/specs/          design docs
```

Edit under `core/`, run `node scripts/build.mjs`, commit both. Never edit `skills/` by hand — the build wipes it.

## License

MIT.
