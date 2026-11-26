# 0001 — Bootstrap the Dart workspace on the quality gates

- **Status:** In review — draft pull request #25, CI green
- **Owner:** Eduard Velasco
- **Branch / PR:** `chore/bootstrap-workspace` · #25
- **Requirements:** C-02, C-05, C-13, C-23, NFR-03
- **ADRs:** 0002 (Flutter and Dart), 0003 (one package per layer), 0007 (local data and view models), 0008 (iOS from a Mac)

## Objective

The repository builds, analyzes and tests an empty Flutter app on top of three pure-Dart layer packages, locally and in CI.

## Problem

There is no code yet. Every later task needs the package layout, the dependency direction and the CI checks running on real code. The CI workflow and the architecture check already exist; their Dart steps start running as soon as `pubspec.yaml` exists.

## Scope

- In scope: the pub workspace, the four packages, one smoke test per package, the shared analysis options, the architecture rules pointing at the real package paths, CI green.
- Out of scope: game logic; any UI beyond a placeholder screen.

## Specs

- **S1** (C-05, NFR-03): Given the workspace, when `pubspec.yaml` of `packages/hexablock_engine` and `packages/hexablock_application` are read, then neither depends on Flutter.
- **S2** (C-05): `hexablock_application` depends only on `hexablock_engine`; `hexablock_adapters` only on the two inner packages; `app/` on all three.
- **S3** (C-05, NFR-03): Given a temporary file in `hexablock_engine` that imports `package:flutter/material.dart`, when `flutter analyze` and `node tool/check-architecture.mjs` run, then both fail. The file is removed afterwards and the evidence is reported.
- **S4** (C-23e, C-23f): Each package has one passing smoke test named `should_<result>_when_<condition>`, written as Arrange – Act – Assert.
- **S5** (C-13): The CI workflow is green on the pull request: architecture, test names, format, analysis, tests and coverage.
- **S6** (C-02): The README *Getting Started* section records the Flutter and Dart versions used.
- **S7** (C-13): Given production code and a test step that finds no tests, when CI runs, then it fails; every CI run prints how many tests ran. A green check that verified nothing is not accepted.
## Allowed edit surfaces

- `pubspec.yaml` (workspace root), `analysis_options.yaml`
- `packages/hexablock_engine/**`, `packages/hexablock_application/**`, `packages/hexablock_adapters/**`
- `app/**`
- `tool/architecture-rules.json` (paths only)
- `README.md` (*Getting Started*, *Running Tests*)
- `tool/**` and `.github/workflows/ci.yml` (S7 only)
- `odd/tasks/0001-bootstrap-workspace.md`, `AI_USAGE.md` (task record)

## Tasks

- [x] **T1** (S1, S2) Create the workspace root `pubspec.yaml` and the four packages (`dart create -t package` for the layers, `flutter create` for `app/`).
- [x] **T2** (S3) Shared `analysis_options.yaml` with strict casts, inference and raw types.
- [x] **T3** (S4) One smoke test per package.
- [x] **T4** (S5) CI green on the pull request.
- [x] **T5** (S6) README *Getting Started* and *Running Tests*.
- [x] **T6** `log-ai-usage` entry.

## Verification

Commands, run exactly as written:

```bash
flutter pub get
dart format --output=none --set-exit-if-changed .
flutter analyze --fatal-infos
flutter test --coverage
node tool/check-architecture.mjs
node tool/check-test-names.mjs
node tool/check-coverage.mjs
```

| Spec | Evidence | Verdict |
|---|---|---|
| S1 | `packages/hexablock_engine/pubspec.yaml` has no `dependencies`; `packages/hexablock_application/pubspec.yaml` lists only `hexablock_engine`. The smoke tests of both packages assert it. | Pass |
| S2 | Application → engine; adapters → engine, application and `drift` (no Flutter, no app); `app/` → the three packages plus `flutter_secure_storage` and `shared_preferences` (ADR-0007). | Pass |
| S3 | Temporary `packages/hexablock_engine/lib/probe.dart` importing `package:flutter/material.dart`: `check-architecture` exit 1 (`[domain-is-pure-dart] The domain must not depend on Flutter.`); `flutter analyze --fatal-infos --fatal-warnings` exit 1 (`depend_on_referenced_packages`). File removed. | Pass |
| S4 | Four tests, one per package, all `should_…_when_…`, Arrange – Act – Assert; `check-test-names`: "Test names OK (4 tests checked)". | Pass |
| S5 | Locally and in CI run 45682789103 on #25: `quality`, `commits` and `pr-title` pass; the log shows "Tests ran in total: 4", "Test names OK (4 tests checked)", "No issues found!" and the architecture rules OK. | Pass |
| S6 | README *Getting Started*: Flutter 3.47.8, Dart 3.13.7; CI pins `flutter-version: 3.47.8`. | Pass |
| S7 | `tool/run-tests.mjs` prints the tests that ran per package and in total. With `packages/hexablock_engine/test` moved away it exits 1: "has production code in lib/ but no *_test.dart file". It also fails when `flutter test` passes with zero tests. | Pass |

## Open questions

- Where the plugin-backed adapters live (team to confirm in the pull request): `drift` sits in `hexablock_adapters`, which stays plain Dart so the view models test without Flutter; `shared_preferences` and `flutter_secure_storage` are Flutter plugins, so they sit in `app/` as storage drivers (ADR-0003 puts "storage drivers" in layer 4). The alternative is to make `hexablock_adapters` a Flutter package.

## Next step

1. Valentina does the early test installation on an iPhone from her Mac (ADR-0008) and records the result here.
2. The team answers the open question and marks the pull request ready for review.

## Log

- 2026-10-28 — Eduard Velasco with Claude Code (setup): task drafted as the first task of the repository.
- 2026-11-25 — Eduard Velasco with Claude Code (Opus 5.5), request verbatim:
  > Tarea 0001 de la app: el esqueleto. Hay otra sesión haciendo el modelo de dominio en este repo: trabaja en un worktree aparte (EnterWorktree) y no toques su rama.
  >
  > Lee odd/tasks/ (la tarea 0001), AGENTS.md, docs/requirements.md, tool/architecture-rules.json, tool/quality-gates.json, y los ADR tal como quedan en app #23 (gh pr diff 23): ADR-0003 (un paquete Dart por capa en un pub workspace), ADR-0007 (drift, shared_preferences, flutter_secure_storage, view models en Dart puro, inyección a mano) y ADR-0008 (iOS desde una Mac).
  >
  > Haz:
  > 1. El pub workspace con packages/hexablock_engine, packages/hexablock_application y packages/hexablock_adapters, y app/ (Flutter, Android e iOS). Cada pubspec solo depende de las capas internas que le corresponden.
  > 2. La raíz de composición vacía en app/, con inyección a mano, y una pantalla mínima que arranque.
  > 3. La CI de cada PR: formato, análisis, pruebas, cobertura, check-architecture y nombres de pruebas, con las rutas de las reglas actualizadas a esta estructura.
  > 4. Una prueba mínima por paquete, para que la CI tenga algo que correr.
  >
  > Nada de clases de dominio: esas salen del modelo de dominio cuando se apruebe. Sin pedirme confirmación entre pasos; para solo si algo contradice el enunciado o los ADR. Abre el PR como borrador y no fusiones nada. Al final dime qué tiene que hacer Valentina para la instalación de prueba en iPhone.
- 2026-11-25 — Implementation decisions (AI, for the team to review):
  - The branch stacks on `docs/accept-adrs` (#23), because the accepted ADRs and the rule paths live there; the draft pull request targets that branch until #23 merges.
  - `tool/architecture-rules.json` already pointed at the package paths of ADR-0003 in #23; no path changed.
  - With no domain classes yet, each layer package's smoke test is a fitness test of its own `pubspec.yaml` (the Dependency Rule); the app's is a widget test that starts the app through the composition root.
  - Bundle identifier `ve.edu.ucab.hexablock.hexablockApp` (iOS) and application ID `ve.edu.ucab.hexablock.hexablock_app` (Android); display name "HexaBlock". The signing team is chosen in Xcode by whoever installs (ADR-0008).
  - CI pins Flutter 3.47.8 so local and CI analysis agree.
  - `tool/check-test-names.mjs` read one line at a time and missed tests whose name `dart format` moves to the next line (2 of 4 checked). It now matches across lines; a probe with a bad name on its own line fails.
  - Verdicts: S1–S4, S6, S7 pass locally (evidence above); S5 waits for CI.
- 2026-11-25 — Draft pull request #25 opened against `docs/accept-adrs`; CI run 45682789103 green (S5 pass). All specs pass.
