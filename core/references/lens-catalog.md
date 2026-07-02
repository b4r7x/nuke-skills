# Lens Catalog

Loaded by the orchestrator when composing waves — nuke-audit Phase 2, nuke-review Phase 1, and nuke-verify Phase 2 (charter validators). Embed the relevant lens rows (full mode) or the charter bundle plus its checklist (light/micro/review) into each auditor's prompt; auditors receive their charter text, not this whole file.

## How lenses become auditors

| Mode | Unit of coverage |
|---|---|
| full (nuke-audit) | one auditor per lens — per-chunk lenses get one agent per (lens × chunk); cross-cutting lenses get whole-scope agents |
| light / micro (nuke-audit) | the four charter bundles below cover all 15 lenses; each auditor prompt lists its bundled lenses explicitly so none is silently dropped |
| nuke-review | the same four charters, scope = diff + blast radius |

A chunk or area is where the auditor hunts, not a wall — tracing evidence across the whole repo is required. Every candidate must satisfy the candidate finding schema (lens + severity + justification, file:line for all sites, quoted source, end-to-end trace, proposed fix, refutation attempt) or it is invalid and must not be reported.

## The 15 lenses

| Lens | Type (full) | Hunts for | Amplifier hint (load if matched in Phase 1) |
|---|---|---|---|
| correctness | per-chunk | bugs, broken features, subtle cross-module side effects, race conditions, edge cases, feature-gate leaks, devex breakage (env vars, ports, scripts, build flow) | — quality bar carries it |
| security | cross-cutting | route through surface detection first (stack-adapters.md: web / CLI / library / daemon / infra), then hunt only the matching threat class — injection, authn/authz gaps, secrets in code, missing boundary validation, unsafe deps. Web-vulnerability references load only for detected web surfaces | surface-matched security skills (security-review-class, web-vuln references) |
| structure | per-chunk | restructurings that delete complexity, spaghetti growth, oversized files, thin wrappers, logic outside its canonical layer, non-atomic update flows | code-quality / architecture skills |
| dry | cross-cutting | duplicate/near-duplicate logic, repeated types/constants/validation, near-duplicates of canonical helpers (3+ occurrences rule) | code-quality / reusability skills |
| simplicity | per-chunk | KISS/YAGNI violations: cleverness, deep nesting, premature abstraction, factories for 1–2 variants, speculative config/flags, pass-through wrappers, single-use helpers | clean-code-class skills |
| architecture | cross-cutting | circular deps, wrong-direction imports, coupling, god modules, SRP violations, misplaced files, missing or false boundaries | architecture-improvement skills |
| slop | per-chunk | AI slop: comments restating code, over-engineering, defensive over-coding, AI-voice naming (enhanced/robust/graceful), type workarounds, verbose patterns | anti-slop-class skill |
| types | per-chunk | the language's type-escape hatches (see stack-adapters.md): TS `any`/broad `as`/`!`; Python `Any`/`# type: ignore`; Go `interface{}`/unchecked assertions; Rust `unwrap()`/`expect()`/`unsafe`; missing exhaustiveness; ad-hoc shapes where contracts should exist | the language's type-discipline skill, if matched |
| errors | per-chunk | inconsistent throw/return/log, swallowed errors (per-language smells in stack-adapters.md), silent fallbacks hiding bugs, missing boundary handling, unhelpful messages | — quality bar carries it |
| dead-code | per-chunk | unused exports/imports/vars, unreachable code, commented-out code, dead re-exports, redundant overrides | anti-slop-class skill |
| tests | per-chunk | tests asserting implementation details (internal calls, private state, mock wiring) instead of observable behavior; mocking the project's own internals; duplicate/redundant tests; missing critical-path and edge coverage; re-testing the framework or stdlib | behavior-first testing skill, if matched |
| conventions | per-chunk | violations of project instruction files (CLAUDE.md, AGENTS.md, .cursorrules, …), naming–content mismatches, inconsistent naming across similar modules, file-placement rules | project instruction files are the amplifier — always present |
| performance | per-chunk | hot paths for the detected surface (stack-adapters.md): N+1 queries, blocking I/O on request/event paths, O(n²) on unbounded input, unbounded caches/collections, redundant recomputation — clear issues only, no micro-tuning | surface-matched performance skills |
| stack | per-chunk | violations of the Phase 1 quality bar: deprecated APIs, outdated idioms, missing current patterns for the detected stack and its major libraries | matched stack skills from the file-type → skill map |
| hygiene | cross-cutting | repo-level: config drift, broken scripts, CI gaps, docs that lie about behavior, stale TODO/FIXME, declared gates that no longer run | — quality bar carries it |

## Amplifier rule

Amplifiers are conditional: the hints above are likely names, not requirements. The authoritative list is whatever Phase 1 discovery matched in the LOCAL skill library, recorded as the file-type → skill map (stack-adapters.md). Two obligations follow:

1. A hinted skill that exists locally is MANDATORY for the auditor owning that lens — load it before hunting; where it ships a checklist, run the checklist verbatim on matching files.
2. **No amplifier → the quality bar carries the lens.** The lens's hunts-for text plus the Phase 1 quality bar IS the charter. Deepen Phase 1 research proportionally for uncovered lenses: current-year best-practice search plus docs lookup for that lens's territory in the detected stack, distilled into the quality-bar section of context.md.

## Severity calibration

Severities: `critical | high | medium | low | info`. The convergence threshold is medium+, so miscalibration breaks the loop: an inflated low resets the dry counter for nothing; a deflated medium hides a real defect from the fix loop. When torn between low and medium, write the end-to-end trace first — if the trace shows a consequence, it is medium.

| Severity | Bar | Typical examples |
|---|---|---|
| critical | broken behavior or exploitable exposure on a real path, no mitigating control | data-loss path, authn bypass, secret reachable in a public repo |
| high | wrong behavior or security gap one realistic precondition away; or rot actively spreading | race on a common path, missing authz on one route, duplicated logic already drifted |
| medium | real defect or debt with bounded blast radius; the fix clearly improves the code | swallowed error hiding failures, escape hatch on a public contract, god module coupling two features |
| low | hygiene or idiom violation with no behavioral consequence | dead export, verbose pattern, single-use helper |
| info | observation; no action strictly required | naming inconsistency, doc-drift note |

Rate against the detected surface's threat model and the repo's conventions, not an imagined ideal — a missing security header on a loopback control UI is not critical. The one-sentence severity justification must survive the skeptic: state consequence and reachability, not vibes.

## Charter bundles (light / micro / review)

| Charter | Bundled lenses | Amplifiers (conditional, from the Phase 1 map) |
|---|---|---|
| behavioral | correctness, errors, tests, performance | the behavior-first testing skill matched in Phase 1, if any |
| security | security, hygiene | security skills matched to the detected surface, if any; web-vuln references only when a web surface exists |
| structural | architecture, structure, dry, dead-code | the architecture/code-quality skills matched in Phase 1, if any |
| quality | simplicity, slop, types, conventions, stack | the type-discipline skill matched in Phase 1, if any; the anti-slop-class skill, if any; matched stack skills |

## Charter checklists

Embed the matching checklist verbatim in each charter auditor's prompt. Execute every numbered item; report candidates in the finding schema; skip nothing silently. Before reporting, check the ledger digest you were given — anything already confirmed OR rejected is a duplicate and must not be re-reported.

### behavioral
1. Trace each entry point in your area end-to-end; at every branch ask "what input makes this branch wrong?" — off-by-one, empty, null/None/nil, unicode, concurrent access.
2. Grep every public or recently changed function for its callers; verify each caller survives the current signature and semantics.
3. Hunt swallowed failures using the error-handling smells for the repo's language (stack-adapters.md table B): empty catch, `_ = err`, bare except, `rescue nil`, `.ok()` discards.
4. Judge every fallback value (`?? default`, `or default`, zero-value returns): does it hide a failure that should surface?
5. For each test file in your area: does it assert observable behavior (outputs, state transitions, emitted events) or implementation details (internal calls, private state, mock wiring)? Flag the latter.
6. List critical paths with no test at all, and boundary values with no edge coverage.
7. Scan hot paths (request handlers, loops over unbounded input, startup) against the language's performance hot spots (stack-adapters.md table C) — clear issues only, no micro-tuning.
8. Grep for shared mutable state (module-level variables, singletons, global maps) touched from concurrent or async paths; trace whether interleaving can corrupt it.
9. Check devex behavior: manifest scripts actually run; documented env vars exist; ports and flags match the docs.

### security
1. Classify every surface in scope per stack-adapters.md (web / CLI / library / daemon / infra); state the classification in your report. A scope can have several — missing a surface is the worst failure.
2. Apply only the matching threat rows from the surface table: injection/XSS/CSRF/authz-per-route/IDOR for web; shell+argument injection, path traversal, temp-file safety for CLI; hostile-caller-input (ReDoS, deserialization, options-merge pollution) for library; bind address, Host/Origin validation, auth on control endpoints for daemon; secret reachability, unpinned actions, over-broad permissions for infra.
3. Grep for secrets in source, config, fixtures, CI files, and error messages: keys, tokens, passwords, connection strings.
4. Name every external input (params, env, files read, network responses) that reaches use without validation at the boundary.
5. Trace untrusted content to sinks: prompt, terminal (ANSI escapes), DOM, shell, file path, object merge, URL fetch.
6. Check manifests for install scripts and unpinned or git-sourced dependencies; flag undisclosed network or exec at install time.
7. Hygiene: verify each declared gate command still runs; scripts referenced by docs and CI exist; flag config drift between files, docs that lie about behavior, stale TODO/FIXME.

### structural
1. Build the import graph of your area: cycles, wrong-direction imports (lower layers importing upper), god modules imported by most of the scope.
2. Flag files past ~500–1000 lines or mixing concerns — look for a restructuring that deletes complexity rather than adding a layer.
3. Grep for 3+ occurrences of near-identical logic, types, constants, or validation; check whether a canonical helper exists and is being bypassed.
4. Flag thin wrappers and pass-through layers that add no behavior.
5. Flag logic outside its canonical layer (per project instruction files) and misplaced files.
6. Dead code: grep each suspicious export for importers; flag unused exports/imports/vars, unreachable branches, commented-out blocks, re-exports nothing consumes.
7. Flag non-atomic update flows: multi-step state changes observable or interruptible half-done.
8. Verify boundaries match the layering declared in project instruction files; flag imports that bypass a feature's public entry point.

### quality
1. Load the type-discipline skill matched in Phase 1, if any; otherwise apply the type-escape vocabulary for the repo's language (stack-adapters.md table B) — grep each escape hatch (`any`, `# type: ignore`, `interface{}`, `unwrap()`, `!!`, `dynamic`, `mixed`, …) and judge every hit against project-sanctioned exceptions.
2. Flag missing exhaustiveness where the language supports it: discriminated unions, sealed classes, enum match arms.
3. Flag ad-hoc shapes (dicts/maps/anonymous objects) crossing module boundaries where a named contract should exist.
4. AI slop: comments restating code, defensive over-coding (null checks on non-nullables, try/catch on infallible ops), AI-voice naming, verbose patterns replaceable by idioms.
5. KISS/YAGNI: premature abstraction, factories for 1–2 variants, speculative config, single-use helpers, deep nesting and cleverness.
6. Read the project instruction files first; flag violations, naming–content mismatches, placement-rule breaks. Documented intentional decisions are NOT findings.
7. Check code against the Phase 1 quality bar: deprecated APIs, outdated idioms, missing current patterns. Where the file-type → skill map lists a skill with a review checklist (e.g. a React guide), run that checklist verbatim on matching files.
