# AGENTS.md — HexaBlock Suite (game client)

Rules for every AI agent and every human that works in this repository.
`CLAUDE.md` imports this file. Other agents (Copilot, Gemini, Codex) read it directly.

## 1. What this repository is

HexaBlock Suite is a mobile app (Flutter, proposed in ADR-0002) with four casual puzzle games on one hexagonal board:
Hexa Lines, Hexa Fit, Hexa Sort and Hexa Merge.
It is the semester project of *Desarrollo de Software* (UCAB, 2026-2).

**The goal is one generic engine, not four games.**
The four variants are instantiations of the same engine.
A fifth variant must need new classes or configuration only. It must never need an edit in the engine.
The jury will ask for a small rule change live during the defense.

The backend lives in a separate repository: `hexablock-ucab/hexablock-api`.
This app talks to it only through ports and adapters, so it can work with another team's backend.

## 2. Sources of truth

Read these before you design or change behavior. Do not rely on memory or summaries.

| File | Holds |
|---|---|
| `docs/requirements.md` | Requirement catalog with stable IDs (`FR-`, `NFR-`, `C-`). Every change traces to one or more IDs. |
| `docs/adr/` | Architecture Decision Records. An ADR in status *Accepted* is a requirement. |
| `odd/tasks/` | One document per substantial task: specs, tasks and log. |
| `docs/EXTENSIBILITY.md` | How to add a fifth variant. Keep it true. |
| `README.md` | The public face of the project. It is graded. |
| `AI_USAGE.md` | Mandatory log of AI usage. It is graded. |

## 3. Architecture rules (Clean Architecture)

> **Decision status.** The assignment fixes Clean Architecture and the Dependency Rule (C-05): those rules are binding now.
> The concrete layout below (one Dart package per layer, ADR-0003) and the grid-topology extension point (ADR-0004) are **Proposed**.
> Until the team accepts those ADRs, do not create packages or topology abstractions; ask the user instead.

Four concentric layers. Source code dependencies point inward only (the Dependency Rule).

Proposed layout (ADR-0003):

| Layer | Package (Dart pub workspace) | May depend on |
|---|---|---|
| 1. Entities (domain) | `packages/hexablock_engine` | nothing outside the Dart core libraries |
| 2. Use cases (application) | `packages/hexablock_application` | `hexablock_engine` |
| 3. Interface adapters | `packages/hexablock_adapters` | layers 1–2 (and small, mainstream packages) |
| 4. Frameworks and drivers | `app/` (the Flutter app) | everything above |

Binding rules (C-05, NFR-02 to NFR-07):

- The domain and the use cases are **pure Dart** (with the proposed layout: `hexablock_engine` and `hexablock_application`). They never import `package:flutter`, a database, `http`, or a random-number library. The package boundary enforces this: a forbidden import does not compile.
- Ports (interfaces) are declared in the inner layer that **uses** them. Adapters implement them in an outer layer.
- The engine never contains a condition on the variant type (`if (rules is HexaSortRules)`). Variation lives behind interfaces.
- Data crosses layer boundaries as domain types inward and as DTOs or view models outward. Mappers live in layer 3.
- Randomness, time and IDs are injected (ports), never created inside the domain. Tests use seeded sources.
- Rendering, persistence and the remote API are replaceable details behind ports (NFR-02). Grid geometry as an extension point is proposed in ADR-0004. Do not hard-code a widget or an HTTP detail inside the domain.
- **Do not over-engineer.** Add an abstraction only when a requirement, an ADR or a second real implementation needs it. Abstractions declared in an ADR are requirements, not speculation.

The professor's guidance: the design must survive change (another grid shape, another renderer, another team's backend) without rewriting the project. Hard-coded low-level details are the main thing he penalizes.

## 4. Code conventions

- Everything in the repository is **English**: code, identifiers, comments, docs, commit messages, PR text. Team chat and `odd/tasks` logs may be Spanish.
- Names say what a thing is in the domain: `HexCoord`, `ColorStack`, `LineClearRule`. No `Manager`, `Helper`, `Util` or `Data` suffix without a real reason.
- One reason to change per class (SRP). Small interfaces (ISP). Depend on abstractions (DIP).
- Use bounded generics when the engine needs a capability of the cell content (for example `TCell extends Mergeable<TCell>`). Document each bound in the README *Generic Engine* section.
- Prefer composition over inheritance. Use inheritance only for a real *is-a* relation or a Template Method.
- Comments explain *why*, not *what*. Short sentences, active voice, present tense.
- Prefer the Dart and Flutter SDKs and already-installed packages. A new dependency needs a one-line justification in the PR and must be a mainstream, maintained package.
- Run `dart format` and `flutter analyze --fatal-infos` before you finish; CI fails on any finding.

## 5. Tests

- Test first when a deterministic, runnable test exists: RED, then GREEN, then REFACTOR.
- Name: `should_<expected result>_when_<condition>`, for example `should_clear_three_lines_when_piece_completes_all_axes`.
- Structure every test as Arrange – Act – Assert, with a blank line between the parts.
- Test behavior through public interfaces, never private state. No fragile tests.
- The engine has tests with a **fake cell type** that belongs to no variant.
- Each variant has its own rule tests (lines on 3 axes, exact cover, cascade transfer, merge on collision).
- Unit tests use fakes or stubs for repositories, network, clock and the seeded random source.
- Widget tests cover rendering and navigation (home, game select, level select, game, victory, defeat).

## 6. Git workflow

- `main` is protected. Every change enters through a pull request with green CI and, once the three members have joined, one approval.
- One branch per task: `feat/<task>`, `fix/<task>`, `docs/<task>`, `test/<task>`, `refactor/<task>`, `chore/<task>`.
- Commits follow Conventional Commits, in English: `feat(engine): add generic HexBoard with axial coordinates`.
- Scopes: `engine`, `application`, `adapters`, `app`, `hexa-lines`, `hexa-fit`, `hexa-sort`, `hexa-merge`, `levels`, `i18n`, `audio`, `ci`, `docs`, `readme`, `deps`, `claude`, `release`, `workspace`.
- Never commit on `main`, never force-push, never skip hooks (`--no-verify`). Hooks in `.claude/hooks/` and lefthook enforce this.
- PRs are squash-merged. The PR title is the final commit message, so it follows Conventional Commits too.

## 7. Definition of Done (every PR)

- [ ] Traces to requirement IDs and, for substantial work, to an `odd/tasks/` document.
- [ ] Tests written first where applicable; all tests pass locally and in CI.
- [ ] `dart format` and `flutter analyze` are clean.
- [ ] No new dependency of an inner layer on an outer one.
- [ ] README sections affected (patterns, SOLID, AOP, generic engine) are updated.
- [ ] `docs/EXTENSIBILITY.md` and diagrams are updated when an extension point changes.
- [ ] An `AI_USAGE.md` entry exists for every significant AI-assisted change.
- [ ] Third-party code or assets are cited in code and in `THIRD_PARTY_NOTICES.md`.

## 8. AI usage and academic integrity

- The team owns every line. Architecture, generics and pattern choices are decided by the team; AI implements and advises.
- Log each significant AI use in `AI_USAGE.md` (tool, prompt, result, what the team changed, lessons).
- Never paste credentials, tokens or personal data into a prompt.
- When an agent uses a known algorithm or code from a source (for example Red Blob Games for hex grids), it says so and adds a citation comment: `// Adapted from: <title>, <url>`.
- Never copy code from another team or an uncited public repository.
- Never commit copyrighted books or course PDFs.

## 9. Commands

```bash
npm install                                 # once after cloning: git hooks (commitlint, lefthook)
flutter pub get                             # install (pub workspace: run at the repo root)
dart format .                               # format
flutter analyze --fatal-infos               # static analysis (CI fails on any finding)
flutter test --coverage                     # tests of the current package
node tool/check-architecture.mjs            # Clean Architecture import rules
node tool/check-test-names.mjs              # should_<result>_when_<condition>
node tool/check-coverage.mjs                # 90% minimum in domain and use cases
```

The quality gates are described in `CONTRIBUTING.md`. A rule that matters has a check; if you add a rule here, add its check too.
