# Stack Adapters

Loaded at preflight (Phase 0) by the orchestrator or recon scout to resolve gates, security surfaces, size splits, and the file-type → skill map; spec-architects and validators consult the row for their language when writing or running gates.

## Resolving gates

Prefer what the repo declares over the defaults below: manifest scripts (`package.json` scripts, `Makefile`, `justfile`, `tox.ini`/`noxfile.py`), then CI workflow steps (`.github/workflows/*.yml`), then the fallback table. Record the resolved commands verbatim — they go into context.md and the fix-spec `Gates:` table.

### A — Manifests and default gates

| Language | Manifests | Gates: test · typecheck · lint |
|---|---|---|
| JS/TS | `package.json` (+ workspace files, `tsconfig.json`) | `npm test` / `vitest run` / `jest` · `tsc --noEmit` · `eslint .` or `biome check .` |
| Python | `pyproject.toml`, `setup.py`/`setup.cfg`, `requirements*.txt` | `pytest` · `mypy .` or `pyright` · `ruff check .` |
| Go | `go.mod` | `go test ./...` · `go vet ./...` (compile: `go build ./...`) · `golangci-lint run`, `gofmt -l .` |
| Rust | `Cargo.toml` | `cargo test` · `cargo check` · `cargo clippy -- -D warnings`, `cargo fmt --check` |
| JVM (Java/Kotlin) | `pom.xml`, `build.gradle(.kts)` | `./gradlew test` or `mvn test` · compile is the typecheck (`./gradlew compileJava` / `compileKotlin`) · ktlint/detekt (Kotlin), checkstyle/spotbugs (Java) |
| C# | `*.sln`, `*.csproj` | `dotnet test` · `dotnet build -warnaserror` · `dotnet format --verify-no-changes` + Roslyn analyzers |
| Ruby | `Gemfile`, `*.gemspec` | `bundle exec rspec` or `rake test` · `srb tc` (Sorbet) / `steep check` — often absent (gateless protocol) · `rubocop` |
| PHP | `composer.json` | `vendor/bin/phpunit` · `vendor/bin/phpstan analyse` or `psalm` · `php-cs-fixer fix --dry-run` or `phpcs` |

### B — Type escapes and error-handling smells (grep these)

| Language | Type-escape vocabulary | Error-handling smells |
|---|---|---|
| JS/TS | `any`, broad `as`, `as unknown as`, non-null `!`, unexplained `@ts-ignore`/`@ts-expect-error` | empty `catch {}`, `.catch(() => {})`, floating promises, throwing strings |
| Python | `Any`, `# type: ignore`, `cast(`, untyped defs in typed modules | bare `except:`, `except Exception: pass`, exceptions swallowed without log or re-raise |
| Go | `interface{}`/`any`, assertion `v.(T)` without `, ok`, `_ = err` | ignored `err` returns, `fmt.Errorf` without `%w` wrapping, `panic` for normal flow |
| Rust | `unwrap()`/`expect()` outside tests, unjustified `unsafe`, truncating `as` casts, blanket `#[allow]` | `let _ = fallible()`, `.ok()` discarding the error, stringly errors where typed errors fit |
| JVM (Java/Kotlin) | raw types, unchecked `(T)` casts, `@SuppressWarnings("unchecked")`, Kotlin `!!` | `catch (Exception e) {}`, `printStackTrace()` as handling, `runCatching {}.getOrNull()` hiding failures |
| C# | `dynamic`, `object` round-trips, null-forgiving `!`, `#pragma warning disable` | empty `catch`, `async void`, `.Result`/`.Wait()` on tasks |
| Ruby | `T.untyped` (Sorbet), `send`/`method_missing` with external input, core-class monkey-patching | `rescue nil`, `rescue Exception`, rescue without log or re-raise |
| PHP | `mixed`, missing `declare(strict_types=1)`, loose `==`, docblock-only types where native types fit | `@` suppression operator, `catch (\Throwable $e) {}`, mixing `return false` with exceptions |

### C — Test idioms and performance hot spots

| Language | Test idioms (flag violations) | Performance hot spots |
|---|---|---|
| JS/TS | Vitest/Jest/node:test; behavior over internals; never mock the project's own modules | sync fs/crypto on request paths, sequential `await` in loops (missing `Promise.all`), unbounded caches, re-render storms on web surfaces |
| Python | pytest fixtures/parametrize; no `mock.patch` of own privates; test the public API | N+1 ORM queries, sync I/O inside `async def`, per-row loops over vectorizable data, CPU-bound threading (GIL) |
| Go | table-driven tests, `go test -race`; real values over interface mocks | goroutine leaks, unbounded channels/slices, allocation churn in hot loops, missing `context` cancellation |
| Rust | `#[cfg(test)]` units + `tests/` integration; property tests for invariants | needless `clone()`/allocations in hot paths, blocking calls inside async executors, lock contention |
| JVM (Java/Kotlin) | JUnit 5; never Mockito-mock value objects or own internals; containers over deep fakes | Hibernate N+1 lazy loads, blocking on reactive threads, string concat in loops, GC pressure from churn |
| C# | xUnit/NUnit; avoid over-mocking internals with Moq | sync-over-async (`.Result`), EF N+1, LINQ allocations in tight loops |
| Ruby | RSpec/minitest; request specs over controller internals; no stubbing own privates | ActiveRecord N+1 (missing `includes`), O(n²) array scans, memory bloat in long-lived workers |
| PHP | PHPUnit; feature tests over implementation assertions; no mocking own privates | Eloquent/Doctrine N+1, per-request re-bootstrapping, unbounded in-memory collections |

### D — Default surface and amplifier hints

| Language | Default security surface | Amplifier-skill hints (Phase 1 match) |
|---|---|---|
| JS/TS | web (SPA/SSR/API); CLI when `bin` is declared | look for react-*/nextjs-*/typescript-*/node-* skills; none → quality bar carries the lens |
| Python | daemon/API (FastAPI, Django, Flask) or library | look for python-*/django-*/fastapi-* skills; none → quality bar carries the lens |
| Go | daemon or CLI | look for go-* skills; none → quality bar carries the lens |
| Rust | CLI or library | look for rust-* skills; none → quality bar carries the lens |
| JVM (Java/Kotlin) | daemon (Spring, Ktor) | look for java-*/kotlin-*/spring-* skills; none → quality bar carries the lens |
| C# | daemon (ASP.NET) | look for csharp-*/dotnet-* skills; none → quality bar carries the lens |
| Ruby | web (Rails) | look for ruby-*/rails-* skills; none → quality bar carries the lens |
| PHP | web (Laravel, Symfony, WordPress) | look for php-*/laravel-* skills; none → quality bar carries the lens |

## Security surfaces

Classify before auditing — the security lens applies only the rows matching detected surfaces. A repo can have several; enumerate all; missing a surface is the worst failure mode.

| Surface | Detection signals | Threat focus |
|---|---|---|
| web | route handlers, SPA/SSR framework, templates rendering dynamic data, session/auth middleware | XSS/injection sinks, CSRF, authn/authz per route, IDOR, open redirects, secrets in client bundles. Load web-vulnerability references here only |
| CLI | bin entries, argv parsing, process spawning (`spawn`, `subprocess`, `exec.Command`, backticks) | shell/argument injection (array args, `--` separators), path traversal, predictable temp files, untrusted content echoed to terminal (ANSI escapes) |
| library | publishable manifest (`exports`, classifiers, gemspec), API consumed by third parties | all caller input hostile: ReDoS, unsafe deserialization, options-merge/prototype pollution, no eval on input, install-script behavior |
| daemon | long-running listener (HTTP/gRPC/socket/queue), incl. dev and control servers | bind address (`127.0.0.1` vs `0.0.0.0`), Host/Origin validation — loopback binding alone is insufficient (DNS rebinding), auth on state-changing endpoints, secrets at rest, unbounded-input DoS |
| infra | CI workflows, Dockerfiles, IaC, deploy scripts | secrets reachable from PR-triggered contexts, unpinned third-party actions, over-broad `permissions:`, untrusted input interpolated into run steps, tokens baked into images |

## Mixed monorepo protocol

Trigger: more than one manifest family in scope (e.g. `package.json` + `go.mod` + `pyproject.toml`).

1. Recon finds every manifest (excluding vendored/generated dirs); each manifest's directory is a candidate path prefix. Nested manifests: prefer the most specific prefix with its own runnable gates; workspace roots keep only gates that cannot run narrower.
2. Recon emits a per-prefix gates table into context.md (and plan.md at preflight):

| Path prefix | Test | Typecheck | Lint |
|---|---|---|---|
| apps/web/ | pnpm --filter web test | pnpm --filter web exec tsc --noEmit | pnpm --filter web lint |
| services/api/ | go test ./... | go vet ./... | golangci-lint run |
| ml/ | pytest ml/ | mypy ml/ | ruff check ml/ |

3. The fix-spec `Gates:` header carries this table verbatim (fix-spec-template.md).
4. Validators run ONLY the rows whose prefix matches their batch's files; a batch spanning prefixes runs every matching row.
5. A file matching no prefix inherits the nearest ancestor row; no ancestor → gateless protocol below.
6. When waves assign areas, split them along prefixes too — never hand one worker a chunk mixing languages when a per-language split fits the same wave size.

## Gateless repo protocol

1. During recon, classify each area: gates present (at least one runnable test/typecheck/lint command) or absent. Partial counts — a repo with tests but no linter validates with tests and records lint as absent.
2. Area with no gates → the spec-architect picks one path and states which in the spec header:
   - Bootstrap: the first fix-spec phase adds a minimal gate — the smallest command that exercises the code (one smoke test + `pytest`; `go vet ./...`; `cargo check`; `tsc --noEmit` with a minimal tsconfig).
   - Declare: spec header states `gates: NONE — validation is review-only`; validators substitute a second independent review pass for the gate run.
3. Never silently validate against nothing: a validator that ran zero gates must state "review-only validation — no gates configured" in its report.

## Size heuristics (files AND KLOC)

Compute both at preflight over the resolved scope (exclude vendored dirs, generated code, lockfiles): file count, and KLOC = total `wc -l` / 1000. Record both in plan.md. Whichever threshold trips FIRST decides:

| Decision | Threshold |
|---|---|
| light: split scope into 2 areas | > ~80 files or > ~40 KLOC |
| full: per-chunk lens chunk size | 5–15 files or ~3–8 KLOC per chunk; very large scopes grow chunks to 15–25 files / ≤15 KLOC before ever dropping a lens |
| micro fits | ≤ ~25 files or ~10 KLOC — larger scope: recommend light in the preflight plan |

## File-type → skill map

Built ONCE at preflight (preflight.md step 2) by the orchestrator or one clerk agent; recorded in plan.md and copied into context.md. Never rebuilt per auditor.

1. List the local skill library once (skill directory listing / plugin registry — whatever the platform exposes).
2. Collect the distinct file extensions in scope, ordered by file count.
3. Match each extension against skill names/descriptions using table D's hints; emit the map:

| Ext (files) | Matched skills (* = mandatory load) | Fallback |
|---|---|---|
| .tsx (61) | react-senior-guide*, a type-discipline skill | |
| .ts (214) | typescript/clean-code-class skills | |
| .py (38) | — | quality bar carries the lens |

4. A matched React-class skill is mandatory for the quality and behavioral charters on `.tsx`/`.jsx` files — run its review checklist verbatim when it ships one. An extension with no match records `quality bar carries the lens` — the lens text plus the Phase 1 quality bar becomes the charter, and Phase 1 deepens research for that territory instead.
5. The map drives MANDATORY loading in every downstream prompt: auditors (nuke-audit, nuke-review) and implementers (nuke-fix) whose files match a mapped extension load the mapped skills before working.
