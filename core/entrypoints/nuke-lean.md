---
name: nuke-lean
description: >
  Use when the user says "no overengineering", "keep it simple", "straight
  forward", "just do what's needed", "stop gold-plating" — or when generated
  code keeps growing guards, wrappers, options, or refactors nobody asked
  for. Also loadable as a charter by implementer roles inside other nuke
  skills.
metadata:
  author: b4r7x
  version: "3.2.0"
  argument-hint: "[scope to sweep] — normally loaded as a charter, not invoked"
---

# Nuke Lean

A discipline like nuke-think, not a ceremony: no agents, no artifacts, no confirmation gate. It is a charter the current context applies to its own hands; implementer roles in other nuke skills may load it. It deepens nuke-code's BUILD charter — minimal diff, no defensive noise — into a contract you can check a diff against. It never overrides the constitution's ship rule: lean code still carries gates and a validator's verdict.

## The contract — what lean code IS

Check every numbered rule against the diff. Each is countable; none is a judgment call.

1. **The diff answers the ask and nothing else.** Lines changed outside the ask's scope: zero. Renames, reformats, and refactors of untouched code: zero. The ask includes everything the engaged loop mandates in the same diff — a behavior test for changed behavior, the decision note; lean strips speculation, never mandated deliverables.
2. **Validation exists exactly at trust boundaries.** A trust boundary is where data enters the process: user input, network responses, file contents, env/argv, third-party API returns. One check per boundary, at the boundary. Internal functions trust their callers — a value validated at the boundary is never re-validated downstream.
3. **Every check names its triggering input** — the concrete value that reaches this line and makes it fire. A check whose triggering input you cannot name is deleted.
4. **Error handling exists only where a recovery action exists.** No try/catch around operations that cannot fail; no catch that only logs when nothing continues past it — log-and-continue over a batch's remaining items IS a recovery.
5. **An abstraction requires ≥3 concrete call sites existing today**; otherwise inline. A config option, flag, or parameter requires a second real value needed today; otherwise hardcode.
6. **Fallbacks never mask failures.** A `?? default` on a value that should always exist hides a bug — let it surface.

## Security is boundary work, not decoration

This skill is anti-theater, not anti-security. Real surfaces — auth/authz, injection sinks, crypto, secrets — get real treatment ONCE, at the surface. Duplicated sanitization on internal hops is the theater being deleted, not the protection. Unsure whether something is a real boundary? That is a judgment call — nuke-think territory — never a reason to add a second check.

## The self-sweep

After writing, re-read your own diff hunting your own additions against the contract. Every guard, wrapper, option, helper, and comment that fails a numbered rule is deleted before the hand-back. State the result in one line:

```
lean sweep: deleted 2 guards, 1 speculative option
```

or `lean sweep: clean`. A hand-back without the sweep line skipped the sweep.

## Rationalizations

| Excuse | Reality |
|---|---|
| "just in case" | The case has no nameable triggering input — rule 3. Delete it. |
| "defensive is safer" | A dead check is read forever and trusted by nobody. It costs every future reader and catches nothing. |
| "while I'm here" | Scope violation — rule 1. The ask defines the diff; the rest is a separate task. |
| "it might be needed later" | Rule 5 counts call sites today. Later can add it later, with the real requirements in hand. |
| "more validation = more secure" | Validation off the boundary is theater. Security lives at the surface, once. |
| "the linter didn't complain" | Linters count syntax, not necessity. The contract is the bar. |

## Red flags — stop and sweep

- A null check on a value you just produced.
- A second sanitization of an input already sanitized at its boundary.
- A helper with one caller.
- An options object only ever passed one shape.
- A try/catch whose catch block only logs and nothing continues past it.

## When NOT to apply

- Genuine boundary hardening: data enters the process here, and rule 2 wants the check.
- Crypto, and concurrency guards backed by a named race.
- Project conventions that mandate a pattern — documented intent beats leanness.
