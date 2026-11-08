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
This app talks to it only through ports and adapters, so the backend can be replaced without touching the engine or the use cases.

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

### Course sources and questions for the professor

The team's private workspace sits next to this repository (`../hexablock-workspace`). When it is present, read from it (never write to it from here):

- `../hexablock-workspace/context/proyecto/ENUNCIADO_HexaBlockSuite_v1.0.md`: the assignment. It overrides every other source, and `docs/requirements.md` traces to it. Read the section itself; do not rely on a summary.
- `../hexablock-workspace/library/README.md`: maps each topic (Clean Architecture, SOLID, GoF patterns, generics, AOP, DDD, testing, UML) to the chapters of the books the professor published. Read only the chapter you need.
- `../hexablock-workspace/docs/preguntas-profesor.md`: what the professor already clarified in class.

Never copy text from these folders into this repository: the books are copyrighted and the course material is internal. Cite author and chapter instead. If the folders are missing, say so and continue with `docs/requirements.md`.

When the assignment is ambiguous, or a choice affects grading and is not the team's to make, stop and tell the user; never resolve it silently. The team keeps these questions as issues labeled `pregunta-profesor` in the workspace repository: check the open ones first and, with the user's approval, create one in Spanish (`gh issue create -R hexablock-ucab/hexablock-workspace --label pregunta-profesor --label prioridad-<alta|media|baja> --title "..." --body "..."`).

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

Binding rules (C-05, C-19 to C-22, NFR-02 to NFR-05):

- The domain and the use cases are **pure Dart** (with the proposed layout: `hexablock_engine` and `hexablock_application`). They never import `package:flutter`, a database, `http`, or a random-number library. The package boundary enforces this: a forbidden import does not compile.
- Ports (interfaces) are declared in the inner layer that **uses** them. Adapters implement them in an outer layer.
- The engine never contains a condition on the variant type (`if (rules is HexaSortRules)`). Variation lives behind interfaces.
- Data crosses layer boundaries as domain types inward and as DTOs or view models outward. Mappers live in layer 3.
- Randomness, time and IDs are injected (ports), never created inside the domain. Tests use seeded sources.
- Rendering, persistence and the remote API are replaceable details behind ports (NFR-02). Grid geometry as an extension point is proposed in ADR-0004. Do not hard-code a widget or an HTTP detail inside the domain.
- **Do not over-engineer.** Add an abstraction only when a requirement, an ADR or a second real implementation needs it. Abstractions declared in an ADR are requirements, not speculation.

The professor's guidance (class, and the team's meeting with him on 2026-11-05): the day before the defense he may ask for a change in a low-level detail (the database, the board shape such as square cells instead of hexagons, the user interface or the levels; never the architecture), and the design must absorb it without rewriting the project (C-31, NFR-02). Hard-coded low-level details are the main thing he penalizes.

## 4. Code conventions

- Everything in the repository is **English**: code, identifiers, comments, docs, commit messages, PR text. Team chat and `odd/tasks` logs may be Spanish.
- Names say what a thing is in the domain: `HexCoord`, `ColorStack`, `LineClearRule`. No `Manager`, `Helper`, `Util` or `Data` suffix without a real reason.
- **No primitive obsession** (professor's guidance in class and on 2026-11-05): the domain and the use cases model their concepts as value objects, not as bare numbers or strings: coordinates, identifiers, scores, colors, tile values, `gameId`. Booleans, and an integer that only expresses a quantity, are acceptable (C-32). Primitives appear only at the boundaries (DTOs, persistence, UI) and the mappers in layer 3 convert them. A value object validates itself when created and compares by value.
- **Names say the role and the layer** (professor's guidance): input ports are interfaces named after the use case (`StartGameUseCase`, `ApplyMoveUseCase`); the application class that implements them is a service (`GameSessionService`); output ports name what the inner layer needs (`ProgressRepository`, `PieceSource`, `Clock`); adapters name the technology and the role (`SqliteProgressRepository`, `HttpLeaderboardGateway`); presentation classes name their screen (`GameViewModel`). Repositories, factories, builders and value objects carry those names too.
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
- Avoid structural coupling: a test exercises one behavior through the public API of the engine or a use case, not one test per class or method. Use real domain objects; replace only what sits behind a port (storage, network, clock, randomness).
- Build test data with the domain's builders (ADR-0006) instead of long hand-written fixtures, and test level loading also with the real level files.
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

## 10. Working with another AI agent (Codex, ChatGPT, Copilot)

Everything above applies to any agent. Claude Code adds automation in `.claude/`; other agents can use the same material by hand:

- `.claude/skills/<name>/SKILL.md` and `.claude/agents/*.md` are plain Markdown instructions. Ask the agent to read and follow one, for example: "read `.claude/skills/ship/SKILL.md` and follow it to open the pull request".
- For a substantial task, create the task document from `odd/_TEMPLATE.md`, get the specs approved, then implement test first (`odd/README.md`).
- The git hooks (lefthook), the CI and the protection of `main` apply to everyone, whatever the agent. The Claude Code hooks do not run in other agents, so never use `--no-verify`, never push to `main` and never force-push.
- Record the tool and model in `AI_USAGE.md` (for example "Codex, GPT-5") in every entry.
