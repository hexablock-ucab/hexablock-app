# 0007 — Level builders and level mappers (E10)

- **Status:** Draft — specs waiting for a teammate's approval
- **Owner:** Valentina Maza
- **Branch / PR:** `feat/level-builders` · #<n>
- **Requirements:** FR-04, FR-14, FR-40, FR-43, FR-50, C-23a, C-23d, C-23f, NFR-02, NFR-03
- **ADRs:** 0003 (one package per layer), 0004 (grid topology), 0006 (board and level builder in the domain), 0007 (local data)

## Objective

The app reads every bundled level file of Hexa Fit and Hexa Sort into a checked `FitLevel` or `SortLevel`, and refuses an invalid file with an `InvalidLevelError` that names the failed check of the level format.

## Problem

The 25 levels exist as JSON in `hexablock-api/levels/` and are copied into `app/assets/levels/` by `tool/sync-levels.mjs` (task 0004). Nothing in the app reads them yet. E4 (Hexa Fit) and E5 (Hexa Sort) need levels to start, and FR-04 asks for them to load from files. The model of the classes is already fixed in `docs/domain-model.md` (§15: Hexa Fit, Hexa Sort, *Levels*); this task writes them as code.

## Scope

- **In scope:**
  - **Domain (`hexablock_engine`):**
    - `core/levels`: `GameId`, `LevelId`, `LevelNumber`, `LevelVersion`, `Difficulty`, `LevelHeader`, `LevelPar`, `MoveThresholds`, `ColorId`.
    - `core/errors`: `InvalidLevelError`.
    - `variants/hexa_fit`: `FitLevel`, `Figure`, `FitPiece`, `PieceId`, `FitLevelBuilder`.
    - `variants/hexa_sort`: `SortLevel`, `TrayParams`, `StackSizeRange`, `SortLevelBuilder`.
  - **Adapters (`hexablock_adapters`):**
    - `levels`: `LevelDto` (read from JSON), `LevelHeaderMapper`, `IAssetReader`.
    - `variants/hexa_fit`: `FitLevelMapper`.
    - `variants/hexa_sort`: `SortLevelMapper`.
  - **App:** `FlutterAssetReader` in `app/lib/platform/`, and the `assets/levels/` folders declared in `app/pubspec.yaml`.
  - **Tests:** one test over the bundled levels and one over the invalid fixtures of the API.
- **Out of scope:**
  - `LocalLevelRepository`, `LevelCatalog`, `LevelAccess` and the downloaded levels in SQLite: E7 and E4.
  - The level select screen: E4.
  - The game rules of Fit and Sort: E4 and E5.
  - `HttpLevelGateway`: E8.

## Specs

**Bundled levels**

- **S1** (FR-04, FR-40, FR-50): Given the files in `app/assets/levels/hexa-fit/` and `app/assets/levels/hexa-sort/`, when each is read into a `LevelDto` and mapped with `FitLevelMapper` or `SortLevelMapper`, then 15 `FitLevel` and 10 `SortLevel` are built with no error. Each level's `header.id`, `header.number`, `header.version` and `header.difficulty` equal the file's `levelId`, `number`, `version` and `difficulty`.
- **S2** (FR-43, check F5): Given each bundled Fit level whose file has a `solution`, when every piece is turned by its `rotation` and moved to its `at`, then the pieces cover the figure exactly: no gap and no overlap. This check lives only in the test; the builder does not read `solution` (domain model, `FitLevelBuilder`).

**Each check of the level format refuses a level**

- **S3** (ADR-0006, FR-04): Given a builder that receives one invalid part, when `build()` runs, then it raises `InvalidLevelError` and its `check` is the code in the table. Every other part of the level is valid.

  | `check` | Invalid part | Builder |
  |---|---|---|
  | `L1` | `levelId` `hexa-fit-002` with `number` 3, or `gameId` `hexa-sort` with `levelId` `hexa-fit-001` | both |
  | `L2` | a cell that is not a valid coordinate of the topology | both |
  | `board.topology` | a topology id that `TopologyRegistry` does not hold, for example `"square"` | both |
  | `F1` | a figure of two separate parts, and a ring of six cells around an empty one | Fit |
  | `F2` | a piece of two cells that are not neighbors | Fit |
  | `F3` | pieces with 1 cell more in total than the figure | Fit |
  | `F4` | `par.moves` 2 with 3 pieces | Fit |
  | `S1` | `stackSize` min 5, max 3 | Sort, through the mapper (S7) |
  | `S2` | `moveThresholds` [20, 30] | Sort, through the mapper (S7) |

- **S4** (ADR-0006, C-23d): Given the 10 invalid fixtures of `hexablock-api/tool/fixtures/invalid-levels/`, copied into `packages/hexablock_adapters/test/fixtures/invalid-levels/`, when each one is mapped, then each fails in the same place as the API validator:

  | Fixture | Expected |
  |---|---|
  | `fit-area-mismatch.json` | `InvalidLevelError` F3 |
  | `fit-ring-hole.json` | `InvalidLevelError` F1 |
  | `gameid-mismatch.json` | `InvalidLevelError` L1 |
  | `sort-min-gt-max.json` | `InvalidLevelError` S1 |
  | `sort-thresholds-ascending.json` | `InvalidLevelError` S2 |
  | `unknown-topology.json` | `InvalidLevelError` board.topology |
  | `sort-unknown-color.json` | builds; see *Open questions* |
  | `not-json.json` | `FormatException` from `LevelDto` |
  | `fit-bad-solution.json` | builds; the S2 check rejects it |
  | `fit-unknown-field.json` | builds; see *Open questions* |

**Identity, values and boundaries**

- **S5** (FIT-2): Given a Fit level with two pieces of the same shape, when it is built, then they are two `FitPiece` with different `PieceId`.
- **S6** (C-32): Each value object of the scope refuses the values its invariant forbids (domain model §13) with `InvalidValueError`. Example: `LevelId("hexa-fit-1")` fails, and `LevelId("hexa-fit-001").gameId` is `hexa-fit`.
- **S7** (FR-04): Given a value of a level part that its value object refuses (`stackSize` min 5, max 3; `moveThresholds` [20, 30]), when a mapper builds the level, then the `InvalidValueError` reaches the caller as `InvalidLevelError` with the check of that part (S1, S2). See *Open questions* 3.
- **S8** (FR-04): Given a document without a common field (`levelId`, `gameId`, `number`, `version`, `difficulty`, `board`), or with one of the wrong type, when `LevelDto` reads it, then it raises `FormatException`, and the message names the field.
- **S9** (NFR-03, C-05): The engine and adapter classes import no Flutter and no `dart:io`. The tests read the level files with `dart:io`, and only the app reads assets, through `FlutterAssetReader`. `node tool/check-architecture.mjs` passes.
- **S10** (C-23a, C-23f): Every class of the scope has unit tests named `should_<result>_when_<condition>`, written as Arrange – Act – Assert. `node tool/check-coverage.mjs` stays at or above 90% in the engine.

## Allowed edit surfaces

- `packages/hexablock_engine/lib/hexablock_engine.dart` (exports)
- `packages/hexablock_engine/lib/src/core/levels/**`, `packages/hexablock_engine/lib/src/core/errors/**`
- `packages/hexablock_engine/lib/src/variants/hexa_fit/**`, `packages/hexablock_engine/lib/src/variants/hexa_sort/**` (only the classes of the scope)
- `packages/hexablock_engine/test/**`
- `packages/hexablock_adapters/lib/hexablock_adapters.dart` (exports)
- `packages/hexablock_adapters/lib/src/levels/**`, `packages/hexablock_adapters/lib/src/variants/hexa_fit/fit_level_mapper.dart`, `packages/hexablock_adapters/lib/src/variants/hexa_sort/sort_level_mapper.dart`
- `packages/hexablock_adapters/test/**`
- `app/lib/platform/flutter_asset_reader.dart`, `app/pubspec.yaml` (the `assets:` list), `app/test/**`
- `odd/tasks/0007-level-builders.md`, `AI_USAGE.md`

## Tasks

- [ ] **T1** (S6) Value objects of `core/levels` and `InvalidLevelError`, test first.
- [ ] **T2** (S3, S5) `FitLevelBuilder` with `Figure`, `FitPiece` and `PieceId`.
- [ ] **T3** (S3) `SortLevelBuilder` with `TrayParams` and `StackSizeRange`.
- [ ] **T4** (S8) `LevelDto` and `LevelHeaderMapper`.
- [ ] **T5** (S1, S4, S7) `FitLevelMapper`, `SortLevelMapper`, the test over the bundled levels and the test over the fixtures.
- [ ] **T6** (S2) Test of the solutions of the bundled Fit levels.
- [ ] **T7** (S9) `FlutterAssetReader` and the assets in `app/pubspec.yaml`.
- [ ] **T8** README *Levels* section (it is still TODO).
- [ ] **T9** `log-ai-usage` entry.

## Verification

Commands, run exactly as written, from the repository root:

```bash
flutter pub get
dart format --output=none --set-exit-if-changed .
flutter analyze --fatal-infos --fatal-warnings
node tool/run-tests.mjs
node tool/check-coverage.mjs
node tool/check-architecture.mjs
node tool/check-test-names.mjs
node tool/sync-levels.mjs --check
```

| Spec | Evidence | Verdict |
|---|---|---|
| S1 | | |
| S2 | | |
| S3 | | |
| S4 | | |
| S5 | | |
| S6 | | |
| S7 | | |
| S8 | | |
| S9 | | |
| S10 | | |

## Open questions

1. **Classes E10 needs from E2 (Eduard).** The builders need `Coordinate`, `ITopology`, `HexTopology`, `TopologyId`, `TopologyRegistry`, `Radius`, `Shape`, `DomainError`, `InvalidValueError`, `Seed`, `GoalCount`, `MoveCount`, `ElapsedTime` and `StarCount`. There are two options:
   - (a) E10 starts when E2 has merged them.
   - (b) E10 writes only the ones E2 has not written yet, exactly as the domain model defines them, in their `core/` folders, and E2 reuses them.

   The proposal is (b), agreed in the group first so the same class is not written twice.
2. **Checks that only the JSON Schema makes (`fit-unknown-field.json`, `sort-unknown-color.json`).** The schema of the API refuses a field the format does not define (`additionalProperties: false`) and a color outside the palette. The app has neither check: `ColorId` accepts any lowercase word ("pink"). The proposal is to leave it so, because every level reaches the app already checked by the API: the bundled ones in CI, the downloaded ones by the server. The fixture test then records that both build.

3. **S1 and S2 cannot reach the builders as the model is written.** `StackSizeRange` (1 ≤ min ≤ max ≤ 9) and `MoveThresholds` (first > second) refuse those values in their constructors, before `SortLevelBuilder` sees them. The proposal is S7: the mappers turn that `InvalidValueError` into `InvalidLevelError` with the check of the part. The other option is for the builder to receive plain integers. `docs/diagrams/class-model.json` would change only with the second option.

## Next step

A teammate approves S1–S10 and answers the three open questions in the PR; then T1 starts on a branch from `main` once #25 is merged.

## Log

- 2026-11-28 — Valentina Maza (verbatim): "ok perfect, nada continuemos sigamos avanzando TODO lo q pueda y me avisas cuando terminemos de hacer todo todo, y hago lo de la mac de mi papa"
- 2026-11-28 — Valentina Maza with Claude (Opus 5.5, claude.ai): draft of the task from `docs/domain-model.md` §15, the level format of the API (`docs/level-format.md`, checks L1, L2, F1–F5, S1, S2) and its invalid fixtures. Specs only; no code until they are approved.
