# 0001 — Bootstrap the Dart workspace on the quality gates

- **Status:** Draft — starts after the team accepts ADR-0002 and ADR-0003
- **Owner:** TBD
- **Branch / PR:** `chore/bootstrap-workspace` · #
- **Requirements:** C-02, C-05, C-13, C-23, NFR-03
- **ADRs:** 0002 (Flutter and Dart), 0003 (one package per layer)

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

## Allowed edit surfaces

- `pubspec.yaml` (workspace root), `analysis_options.yaml`
- `packages/hexablock_engine/**`, `packages/hexablock_application/**`, `packages/hexablock_adapters/**`
- `app/**`
- `tool/architecture-rules.json` (paths only)
- `README.md` (*Getting Started*, *Running Tests*)

## Tasks

- [ ] **T1** (S1, S2) Create the workspace root `pubspec.yaml` and the four packages (`dart create -t package` for the layers, `flutter create` for `app/`).
- [ ] **T2** (S3) Shared `analysis_options.yaml` with strict casts, inference and raw types.
- [ ] **T3** (S4) One smoke test per package.
- [ ] **T4** (S5) CI green on the pull request.
- [ ] **T5** (S6) README *Getting Started* and *Running Tests*.
- [ ] **T6** `log-ai-usage` entry.

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
| S1 | | |
| S2 | | |
| S3 | | |
| S4 | | |
| S5 | | |
| S6 | | |

## Open questions

- None yet.

## Next step

The team accepts ADR-0002 and ADR-0003; then someone takes this task.

## Log

- 2026-10-28 — Eduard Velasco with Claude Code (setup): task drafted as the first task of the repository.
