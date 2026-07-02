---
name: nuke-think
description: >
  Use when a task needs unusually deep or careful reasoning — hard architecture
  decisions, root-cause analysis, ambiguous trade-offs, adjudicating conflicting
  findings, high-stakes irreversible choices — especially when running on a
  mid-tier model or as a judgment role (skeptic, spec-architect, reconciler)
  inside another nuke skill.
metadata:
  author: b4r7x
  version: "3.0.0"
  argument-hint: "[question or decision to reason about]"
---

# Nuke Think

This skill cannot add capability. It turns every available thinking dial to maximum and enforces a protocol that recovers a large part of the mid-tier gap on decomposable judgment tasks; it does not close the gap on pure-insight tasks.

Two ways in: other agents load it as a discipline when they hold a judgment role (skeptic, spec-architect, completeness checker, reconciler), and it is invocable directly with a hard question or decision as the argument. Either way: Part 1 first, then Part 2, always both. Escalate to Part 3 only on its triggers.

## Part 1 — Thinking dials (mechanical, always first)

| Platform | Dial |
|---|---|
| Claude Code, main loop | Include the word "ultrathink" in the working prompt |
| Claude Code, subagents | Pass the highest available `effort` (and the tier-appropriate model) on the Agent / Workflow `agent()` call |
| Claude API | Extended thinking with a large token budget |
| Codex / GPT CLIs | Highest reasoning-effort flag |
| No dials available | Part 2 + Part 3 carry the load alone |

When a dial exists, turn it AND run the discipline — never one without the other. A maxed dial without the protocol reproduces the same failure modes at higher cost; the protocol without the dial leaves free depth unused.

## Part 2 — The discipline

Single-agent protocol. Six steps, in order, none skipped. Write each step's output down — in the response or the scratch file below — before starting the next; reasoning that happens only "in your head" is the reasoning that silently collapses back to the first idea.

1. **Frame.** Restate the question in your own words: the actual decision to be made, the success criteria, and what evidence would settle it. If you cannot say what would settle it, you are not ready to answer it.
2. **Diverge.** Write ≥3 genuinely different hypotheses or options — including one contrarian ("the obvious answer is wrong because…") — BEFORE evaluating any of them. Options that are the same answer in different phrasing count as one.
3. **Evidence.** Per hypothesis, gather concrete evidence: quotes, file:line, docs, measurements. Label every item **fact** or **assumption**. Verify assumptions where possible; tag the rest explicitly `unverified` — an unverified assumption never silently becomes a fact in step 5.
4. **Attack.** Write the strongest possible refutation of the current leader — steelman the opposition, never strawman it. If the attack lands, return to step 2 carrying what it taught you.
5. **Reconcile.** Verdict + confidence (`high | medium | low`) + the falsifier: the observation that would change your mind.
6. **Compress.** State the answer in ≤3 sentences before any supporting detail.

**Externalized memory.** On long tasks, write intermediate state — the frame, the option list, the evidence table, attack results — to a scratch file and re-read it before the verdict. The file is the thread a mid-tier model would otherwise lose: it survives context pressure, and re-reading it forces the verdict to answer the question actually asked, not the one remembered.

Failure modes this protocol corrects, and where:

| Failure mode | Corrected by |
|---|---|
| First-idea anchoring | Step 2 — diverge before evaluating anything |
| Assumption/fact conflation | Step 3 — every item labeled; assumptions verified or tagged |
| Missing self-attack | Step 4 — refutation is mandatory, not optional |
| Context drift | Externalized memory — re-read the scratch file before the verdict |
| Buried verdicts | Step 6 — answer first, detail after |

## Part 3 — The panel

Orchestrated protocol for the hardest calls only. Triggers — any one suffices:

- the decision is expensive to reverse
- two prior attempts (agents, rounds, or your own passes) disagreed
- the orchestrator's own confidence after Part 2 is low

Protocol:

1. Spawn 2–3 independent reasoners at max dials (Part 1), same question, each with a different **assigned stance** — defend-A / defend-B / find-the-third-option, or builder / breaker / economist. Each runs the full Part 2 discipline and reports verdict, confidence, evidence, falsifier.
2. One reconciler — max dials, running Part 2 itself — then: lists what the reasoners agree on as settled; adjudicates every disagreement by **evidence quality, never eloquence** (a quoted measurement beats a confident paragraph); produces the final answer plus a **dissent note** recording the strongest losing argument and what would revive it.

Cost: 3–4 agents. The assigned stances are the point — independent reasoners without stances converge on the same first idea, and the panel buys nothing.

## When NOT to use

- Mechanical or checklist work — the charter checklists ARE the discipline there; layering this one on top slows them down for no recall.
- Simple lookups. Read the file, read the doc.
- Anything a test can settle. Evidence you can execute beats reasoning about evidence — write the test, run it, done.

## Family integration

Judgment roles across the nuke family — skeptics, the spec-architect, verify's completeness checker, nuke-spec's designer, nuke-debug's adjudicator, panel reconcilers — load nuke-think when it is installed. Worker-tier charter auditors do not: their checklist is their discipline, and this protocol would multiply their cost without adding recall.
