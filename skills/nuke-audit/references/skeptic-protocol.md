# Skeptic Protocol

Loaded by the nuke-audit and nuke-review orchestrators before dispatching the first verification pass (audit Phase 2, review Phase 2); embed the refute charter verbatim in every skeptic prompt.

## Refute charter

A skeptic is an independent subagent that did NOT author the candidate it judges. Its charter is to refute, not to confirm. For every assigned candidate, answer all five questions with evidence:

1. **Real?** Factually true at the cited lines — read them; re-run the candidate's trace end to end.
2. **Duplicate?** Of any ledger entry — confirmed (F-###) *or rejected* (R-###)?
3. **Intentional?** Permitted or mandated by project conventions, instruction files, or documented decisions?
4. **In scope?** Inside the run's resolved scope?
5. **Worth fixing?** Would the proposed fix genuinely improve the code, or churn it?

Verdicts: passes all five → confirmed, appended as F-###. Fails any → rejected, appended as R-### with a one-line written reason naming the failed question. High signal beats high count.

Judge the code, not the claim: open every cited file, verify each quoted line exists verbatim, re-walk the trace hop by hop. A verdict formed from the claim text alone is invalid.

Every candidate arrives with its author's refutation attempt (candidate schema field 6). The skeptic's work starts where the author's refutation stopped — extend it, never repeat it.

Inputs per skeptic: full ledger entries for its assigned candidates plus the one-line digest of the rest of the ledger (see ledger-format.md).

## Verdict format

One block per candidate, returned to the orchestrator for the ledger merge:

```
candidate: <charter>/<n> · <severity> · <file:line>
verdict: confirm | reject
question failed: <1–5, or — when confirming>
reason: <one line>
```

## Capping — who verifies what, per round

Skeptics are a verification pass and never count against auditor wave caps. Tiers per model-tiers.md: micro/light skeptics run on `session`; full runs on `top` (low/info batches in full: `session`).

| Candidates | micro / light | full |
|---|---|---|
| medium+ — rounds 1–2 | micro: one batched panel per round · light: one skeptic per charter that produced candidates | one skeptic per critical/high candidate; medium batched ≤5 per skeptic |
| medium+ — rounds 3+ | single merged panel per round whenever total candidates < 8; otherwise the rounds 1–2 rule | same rule |
| low / info | **no skeptic** — enter the ledger directly as `U-###` unverified | batched skeptics, `session` tier |

nuke-review: capping does not apply — one batched `session` skeptic verdicts every candidate of every severity, low/info included; review has no U-### path. Wave-2 triggers are defined in the review skill.

Why capping exists: in measured v2 runs, rounds 3–6 dispatched 14 skeptics that rejected 0 of 45 candidates — late-round verification was pure overhead. The merged panel and the spot-check rule reclaim that cost without dropping adversarial review where it pays.

Routing: candidates from fresh-eyes and miss-hunter agents go to the skeptic (or panel) owning the charter of their lens.

## Unverified path (micro/light only)

Low/info candidates skip verification and are recorded as `U-###` (format in ledger-format.md). They cost nothing now and are re-judged for free later: the nuke-fix phase validator that touches their files fixes each one if real or closes it with a written reason if not. Never promote a U-### to F-### without a skeptic verdict.

## Spot-check rule

A charter whose candidates were 100% confirmed in 2 consecutive rounds drops to 1-in-3 verification for the next round: every third candidate gets a skeptic; the rest are confirmed directly with `skeptic: spot-check waived` in their ledger entry. A single rejection during a spot-check round restores full verification for that charter from the next round on.

## Invariants — never relaxed

- Every candidate is verdicted **separately**. Batches and merged panels share context; they never merge judgments — one explicit verdict per candidate, always.
- Uncertain after full end-to-end research → reject, with a written reason.
- Rejected entries stay in the ledger forever; they are never re-reported and never re-judged. This is what makes the loop converge.
- No agent ever verifies its own findings.
