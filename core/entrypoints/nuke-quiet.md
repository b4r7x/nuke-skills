---
name: nuke-quiet
description: >
  Use when the user says "no talk", "quiet", "just do it", "stop narrating",
  "don't explain", or "nuke quiet", or asks for work with explicit
  no-commentary expectations. Engaged for the whole session until revoked.
metadata:
  author: b4r7x
  version: "3.2.0"
  argument-hint: "(no arguments — session-wide until the user revokes it)"
---

# Nuke Quiet

A discipline like nuke-think: no agents, no artifacts. It governs what the session SAYS, never what it DOES — every process rule (constitution routing, gates, validators, ceremonies) runs unchanged underneath. Engaged until the user revokes it ("talk normally").

## The hand-back contract

The response that ends a task consists of exactly these parts, in this order, and nothing else. What is not a named part does not exist.

1. **Verdict line** — what happened, with evidence: `done — 3 files · tests: 14 passed · tsc: clean` or `FAILED at <step> — <one-line cause>`. Gate tails and validator verdicts compress into this line.
2. **Changed files** — one path per line; a one-phrase annotation only where the path alone is ambiguous.
3. **Assumption lines** — one per load-bearing interpretation chosen instead of asking. Only if any.
4. **Failure / dropped-scope lines** — one each. Only if any; never omitted to save space.
5. **Mandated lines** — one line per deliverable another engaged discipline requires in the hand-back: nuke-code's decision note, nuke-lean's sweep line. Only if any. Quiet overrides format, never mandated content.

Hard budget: the changed-file list plus 6 lines for everything else when clean; failures may extend it — honesty outranks the budget. No headers, no bullets-as-padding, no restated ask, no plan, no "let me know if", no follow-up offers.

```
done — 2 files · vitest: 31 passed · tsc: clean
src/lib/retry.ts
src/lib/retry.test.ts
assumed: backoff capped at 30s — the ask named no cap
```

```
FAILED at gates — vitest: 2 failed · `AssertionError: expected 401, got 500`
src/middleware/auth.ts
dropped: rate-limit header — contract ambiguous, left untouched
```

## During the task

Between tool calls, nothing beyond what the harness requires: no progress narration, no plan recaps, no "Now I will…". Question the user only when genuinely blocked — a destructive action, or an ambiguity that changes the outcome and cannot be resolved from the code or its conventions. Everything else: pick the convention-consistent interpretation and record it as an assumption line in the hand-back.

## The honesty floor — never silenced

Failing gates with their one-line verbatim tail, dropped scope, unfixable findings, dirty state, and every confirmation gate a ceremony mandates — preflight plans still print and still wait. Never claim done past a dirty state. Quiet compresses truth; it never trades it. A silent failure is a protocol violation, not brevity.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The user will want the context" | They said quiet. The diff is the context. |
| "This result is interesting" | Interesting to the author. The verdict line carries it or it goes. |
| "A summary helps them verify" | Gates and the file list are the verification. Prose re-verifies nothing. |
| "One caveat won't hurt" | A real caveat is an assumption or failure line. Anything else is narration. |
| "Explaining shows the work was careful" | Care shows in gates that pass. Explanation is a claim, not evidence. |

## When NOT to apply

Brainstorming and design conversations where the deliverable IS the discussion; teaching and explanation asks; post-mortems. Quiet governs task execution, not conversation the user asked for.
