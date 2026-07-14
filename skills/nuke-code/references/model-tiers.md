# Model Tiers

Loaded during preflight (Phase 0) by every run skill to assign a tier to every role in the plan block; the orchestrator re-reads the relevant table before composing each wave. nuke-spec, nuke-debug, and nuke-test carry their role×tier tables in their own mode tables.

## Tier definitions

| Tier | Meaning | Typical work |
|---|---|---|
| `clerk` | cheapest model available | mechanical: recon, rounds log, digests, dedup |
| `worker` | cheap/mid tier | charter auditors, implementers |
| `session` | inherit the session model — no override | verification, spec writing |
| `top` | strongest available, maximum effort/thinking | full-mode auditing and validation |

Protocol text names tiers, never model IDs. The mapping to concrete models happens once, at preflight, per platform.

## nuke-audit

| Role | micro | light | full |
|---|---|---|---|
| Recon scout / clerking (rounds log, digest, dedup) | clerk | clerk | session |
| Charter auditors | worker | worker | top |
| Fresh-eyes / miss-hunter | — | session | top |
| Skeptics (medium+ candidates) | session | session | top |
| Skeptics (low/info candidates) | none → `U-###` unverified | none → `U-###` unverified | batched, session |
| Spec-architect | session | session | top |
| Completeness reviewer | clerk | worker | session |

## nuke-review

| Role | tier |
|---|---|
| Blast-radius / recon clerking | clerk |
| Charter auditors | worker |
| Batched skeptic | session |
| Mini-spec architect | session |

## nuke-verify

| Role | light | full |
|---|---|---|
| Completeness checker | session | session |
| Charter validators — one tier above the presumed-cheap implementer | session | top |
| Fix subagents | worker | worker |
| Revalidation (per fix cycle + final) | session | top |

## nuke-fix

| Role | light | full |
|---|---|---|
| Implementers | worker | top |
| Validators — always one tier above implementers | session | top |
| Final sweep | session | top |

## nuke-code

| Role | standard | elevated |
|---|---|---|
| Ship validator — fresh context, never the authoring context | session | top |
| Revalidation (per fix cycle) | session | top |

The everyday floor of asymmetric verification: in nuke-code the implementer is the session itself, so "one tier above" would mean `top` on every task. The floor is therefore **equal tier but fresh** — a fresh context satisfies "no agent ever verifies its own work" and removes the author's anchoring — and the ladder engages with risk: any elevated-mode flag (public API, auth/security, concurrency, data migration, new dependency) raises the validator to `top`. The family invariant holds: verification is never cheaper than generation.

## Declaration mechanics

- **Claude Code:** pass `model` / `effort` per Agent or Workflow `agent()` call. clerk/worker map to the cheapest/mid models available (today haiku/sonnet-class); session = omit the override; top = strongest available at max effort. Pin the tier explicitly in every spawn so the human can see which model ran each role — never rely on implicit inheritance when tiers differ within a wave.
- **Codex / other CLIs:** map tiers to their model flags the same way.
- **No per-agent override support:** every role inherits the session model (v2 behavior). The protocols still work — they just cost more.
- **Ceiling collapse — the strongest available model IS the session model** (a top-tier model is down, rate-limited, or not offered): `top` and `session` resolve to the same model and the tier ladder flattens. The invariant degrades to the nuke-code floor: **equal tier but fresh, maximum effort/thinking dials, nuke-think loaded for every judgment role**. A fresh context still satisfies "no agent verifies its own work"; the protocol carries what the tier gap no longer can. State the collapse in the preflight plan block so the user knows which rungs flattened; nuke-code, which has no preflight, marks it in the hand-back instead (e.g. `validator: session (top unavailable)`).
- Never silently upgrade or downgrade a role's tier. A tier change is a plan change and belongs in the preflight plan block, confirmed by the user.

## Asymmetric verification

Weak generation + strong verification + a fix loop = strong output. Producing a correct change is harder than checking one: a worker-tier implementer's mistakes are visible to a session-tier validator holding the acceptance criteria, because judging a claim against evidence is an easier task than producing the claim. The fix loop converts detection into quality — every validator-caught defect returns to a cheap implementer as an exact finding, so final quality is bounded by the strongest verifier, not the weakest generator. This is why validators always sit one tier above implementers, and why cutting the verification tier is the one economy this family never makes.

Judgment-tier roles (skeptics, spec-architect, completeness checker, nuke-spec's designer, nuke-debug's adjudicator, reconcilers) load the nuke-think skill when installed.
