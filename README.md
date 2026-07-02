# nuke-skills

Four agent skills that audit, review, verify, and fix codebases using waves of subagents. The design bet: a cheap model following a strict protocol — embedded checklists, a forced finding schema, skeptic passes, validators one tier above implementers — beats an expensive model working from intuition. The protocol carries the quality; the model mostly has to follow instructions.

## Install

```
npx skills add b4r7x/nuke-skills
```

That installs the skills into whichever coding agents you have set up (Claude Code, Codex, Cursor, OpenCode, and others).

Claude Code can also take the repo as a plugin marketplace: `/plugin marketplace add b4r7x/nuke-skills`, then `/plugin install nuke@nuke-skills`.

## The four skills

| Skill | What it does | Writes code? | Typical trigger |
|---|---|---|---|
| nuke-audit | Convergent multi-round quality audit of a codebase or scope. Produces a findings ledger and a phased fix spec. | no | "nuke audit", "deep audit src/" |
| nuke-review | One-to-two-wave review of a diff, branch, or PR, plus its blast radius (files importing or imported by the changes). Produces a verdict-first report. | no | "nuke review", "review this branch" |
| nuke-verify | Checks an implementation against its stated intent, then fixes it until clean. | yes | "verify what the agent built" |
| nuke-fix | Executes a fix spec phase by phase with implementer and validator waves. | yes | `nuke fix .nuke/<run>/fix-spec.md` |

Every reported finding must carry file:line references, at least one verbatim quoted line per site, a numbered trace proving the claim, and a refutation attempt: the auditor writes the strongest case that the finding is not real, and reports it only when that case fails to convince them. A finding missing any field is discarded, not reported. This schema is most of why cheap auditors stay precise.

Audit and review only write inside their own run directory. Verify and fix edit source, but nothing ever touches git: no adds, no commits, no stashes. The working tree is left for you to review.

The protocols are stack-neutral. A shared adapter table covers JS/TS, Python, Go, Rust, JVM, C#, Ruby, and PHP (per-language gates, type-escape vocabulary, test idioms), plus rules for mixed monorepos and for repos with no test or lint gates at all.

## Using them

```
nuke audit                        light audit of the whole repo
nuke audit micro src/engine/      smallest useful audit of one area
nuke audit full --yes             everything, no confirmation gate, expensive
nuke review branch                review this branch against main
nuke verify intent: docs/spec.md  verify the working tree against a spec
nuke fix .nuke/<run>/fix-spec.md  execute an audit's fix spec
```

Runs leave their artifacts under `.nuke/`. The skills never edit your `.gitignore`, so add `.nuke/` yourself if the clutter bothers you.

## What an audit run looks like

1. Preflight resolves the scope, builds a file-type → skill map from your local skill library, composes the first wave, and prints the plan. You confirm.
2. A recon scout and a quality-bar researcher run in parallel: project conventions, stack and gates, current best practices for what the repo actually uses.
3. The convergence loop. Each round, charter auditors (behavioral, security, structural, quality) hunt candidates; skeptics try to refute each one separately. Survivors enter the ledger as confirmed findings, casualties as rejected ones that are never re-reported. Later rounds narrow to the files around the previous round's findings, and the loop ends when enough consecutive rounds confirm nothing new at medium or above.
4. A spec architect turns the ledger into a phased, dependency-ordered fix spec; a completeness reviewer verifies every finding maps to a task with a mechanically checkable acceptance criterion.
5. The skill reports a scorecard and stops. It never starts fixing.

Review, verify, and fix are built from the same pieces: the same four charters, the same finding schema, the same preflight gate.

## How they chain

- audit → fix: the audit ends with a `fix-spec.md`. Run nuke-fix on it in a fresh session. The spec is self-contained, so any agent can execute it.
- review → fix: when a review confirms more than 5 findings, or you pass `--spec`, it writes a mini fix spec with the same handoff.
- cheap implementer → verify: let an inexpensive model implement a task, then run nuke-verify against the original spec or task text. It maps every requirement to evidence, hunts regressions the implementation introduced, and repairs what it finds.

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

nuke-verify and nuke-fix have light/full instead: light caps the fix loop at 3 cycles per phase, full at 5, and full raises the tiers.

## Model tiers

Protocol text never names models. Roles map to four tiers:

| Tier | Meaning | Typical roles |
|---|---|---|
| clerk | cheapest available | recon, logs, digests, dedup |
| worker | cheap/mid | charter auditors, implementers |
| session | whatever model your session runs | skeptics, spec architects, light validators |
| top | strongest available, max effort | full-mode auditors and validators |

The load-bearing rule: verification always sits one tier above generation. Worker implementers get session validators; top implementers get top validators. Weak generation plus strong verification plus a fix loop is what makes cheap output hold up.

On platforms without per-agent model overrides, every role inherits the session model. The protocol still works; you just lose the cost savings.

## Repo layout

```
core/entrypoints/    SKILL.md sources, one per skill
core/references/     shared reference pool (lens catalog, skeptic protocol, tiers, ...)
core/manifest.json   which references each skill ships with
skills/              generated and committed; each folder is self-contained, installable alone
scripts/build.mjs    the generator; validates frontmatter and reference links
```

Edit under `core/`, run `node scripts/build.mjs`, commit both. Never edit `skills/` by hand — the build wipes it.

## License

MIT.
