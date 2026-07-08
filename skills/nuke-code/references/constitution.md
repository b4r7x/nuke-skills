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
