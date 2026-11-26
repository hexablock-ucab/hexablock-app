# Extensibility Guide

How to extend HexaBlock Suite **without modifying the engine** (NFR-01, NFR-02). This guide is a deliverable (C-12) and the script for the live demonstration in the defense.

The rule for this guide is that every name in it is a class of the domain model ([`docs/domain-model.md`](domain-model.md), [`docs/diagrams/class-model.json`](diagrams/class-model.json)). Once the code exists, every name must also exist in the code.

> **Status:** follows the domain model (D1). There is no code yet. The package paths follow the layout of ADR-0003, and the folders are those of `docs/domain-model.md` §2:
> - in `hexablock_engine`, the generic engine lives under `core/`;
> - in `hexablock_application`, every folder is generic;
> - in `hexablock_adapters` and `app`, every folder is generic except `variants/<id>/`, which holds one variant's classes.
>
> Each section lists the files to **create**, the files to **configure** and the files that must **not change**.

## Extension points

| Extension point | Interface | Existing implementations | Created or registered by | ADR |
|---|---|---|---|---|
| Variant (the whole game) | `VariantModule` (layer 2) | `HexaLinesModule`, `HexaFitModule`, `HexaSortModule`, `HexaMergeModule` | `CompositionRoot`, into `VariantRegistry` | — |
| Variant family | `IGameFactory<TCell, TMove, TState>` (Abstract Factory) | `HexaLinesFactory`, `HexaFitFactory`, `HexaSortFactory`, `HexaMergeFactory` | the variant's module | ADR-0006 |
| Game rules | `IGameRules<TCell, TMove, TState>` | `HexaLinesRules`, `HexaFitRules`, `HexaSortRules`, `HexaMergeRules` | the variant's factory | — |
| Piece source | `IPieceSource<TPiece>` | `SeededPieceSource`, `FixedPieceSource` | the variant's factory | — |
| Piece recipe | `IPieceRecipe<TPiece>` | `CatalogRecipe`, `StackRecipe`, `TileSpawnRecipe` | the variant's factory | — |
| Scoring policy | `IScoringPolicy<TState>` | `LinesScoringPolicy`, `SortScoringPolicy`, `MergeScoringPolicy` | the variant's rules | — |
| Progress model | `IProgressModel` | `HighScoreProgress`, `FitLevelProgress`, `SortLevelProgress` | the variant's factory | — |
| Intent translation | `IIntentTranslator<TMove, TState>` (layer 3) | one per variant (`LinesIntentTranslator`, …) | the variant's module | — |
| State presentation | `ISessionPresenter<TCell, TState>` (layer 3) | one per variant (`LinesPresenter`, …) | the variant's module | — |
| Saved game (FR-16) | `IStateCodec<TState>` (layer 3) | `LinesStateMapper`, `MergeStateMapper` | the variant's module | — |
| Cell drawing | `ICellPainter` (layer 4) | `LinesCellPainter`, `FitCellPainter`, `SortCellPainter`, `MergeCellPainter` | `CompositionRoot`, into `CellPainterRegistry` | — |
| Grid topology | `ITopology` | `HexTopology` | `CompositionRoot`, into `TopologyRegistry` | [ADR-0004](adr/0004-grid-topology-extension-point.md) |
| Board renderer | `IBoardRenderer` (layer 4) | `HexBoardRenderer` | `CompositionRoot`, with the topology it draws | [ADR-0004](adr/0004-grid-topology-extension-point.md) |
| Randomness and time | `IRandomSourceFactory`, `Clock` | `Mulberry32Factory`, `SystemClock` | `CompositionRoot` | — |
| Remote API and storage | output ports in `hexablock_application` (`ILevelRepository`, `IProgressGateway`, `ILeaderboardGateway`, …) | `LocalLevelRepository`, `HttpProgressGateway`, `HttpLeaderboardGateway`, … | `CompositionRoot` | ADR-0003 |

## Add a fifth variant: the example *Hexa Fill* (paint cells under constraints)

A new variant is a new `VariantModule`. The module builds its own factory, and the factory creates everything the generic engine needs.

1. **Domain:** create `packages/hexablock_engine/.../variants/hexa_fill/` with:
   - `FillState`, which owns its transitions;
   - `FillMove`;
   - `HexaFillRules` (`IGameRules`);
   - `HexaFillFactory` (`IGameFactory`), which creates the board, the rules, the initial state, the capabilities and the progress model;
   - the typedef `HexaFillEngine = GameEngine<…>`.

   If the variant needs them, also create a scoring policy, a piece recipe, a level builder and a progress model.
2. **Adapters:** create `packages/hexablock_adapters/.../variants/hexa_fill/` with:
   - `HexaFillModule` (`VariantModule`);
   - `FillIntentTranslator`;
   - `FillPresenter`.

   Also create a `FillLevelMapper` if the variant has level files, and a `FillStateMapper` if a game can be saved.
3. **App:** create a `FillCellPainter` and the translations named in `VariantTexts`.
4. **Levels**, if the variant has them: add the level files, and add the new `gameId` as a value in the API level schema.
5. **Wiring:** add three lines in `CompositionRoot`:
   - register `HexaFillModule` in `VariantRegistry`;
   - register `FillCellPainter` in `CellPainterRegistry`;
   - add the variant's sounds to `SoundCueMap`, one `EventKind` → `SoundCue` entry per kind it raises.

**Files that must not change:**
- `core/` of `hexablock_engine`;
- all of `hexablock_application`;
- every folder of `hexablock_adapters` and `app` outside `variants/`, except `CompositionRoot`;
- the other variants.

The last group includes `GameSessionService`, `GameViewModel`, `GameScreen` and `IBoardRenderer`.

**Check:** `git diff --stat main -- packages/hexablock_engine/lib/src/core packages/hexablock_application ':(glob)packages/hexablock_adapters/lib/src/*' ':(exclude)packages/hexablock_adapters/lib/src/variants'` is empty. The paths assume the usual `lib/src/` layout; adjust them once the packages exist.

**Two additions that would reach outside the variant**, as `docs/domain-model.md` §10 explains:
- A new kind of gesture adds a `PlayerIntent` subtype.
- A new kind of result adds a field to `GameOutcome` and `GameResult`.

The four variants of the assignment need neither.

## Changes the defense may ask for

| Change | Where it goes | Engine touched? |
|---|---|---|
| New board size | Hexa Fit and Hexa Sort: the level file (`board.shape`). Hexa Lines and Hexa Merge: the `Radius` their factory holds. | No |
| Different scoring policy | A new `IScoringPolicy<TState>`, created by the variant's factory. | No |
| New piece shape | Hexa Lines: the piece catalog asset, read by `LinesCatalogMapper`. Hexa Fit: the level file. | No |
| Another grid shape (for example squares), which may be requested the day before the defense (C-31) | A `SquareTopology` (`ITopology`, id `"square"`) registered in `TopologyRegistry`, a `SquareBoardRenderer` (`IBoardRenderer`) and `"square"` in the API level schema. `CompositionRoot` hands the new topology to Hexa Lines and Hexa Merge, which have no level file. The Hexa Lines piece catalog asset is written in the coordinates of its topology, so it gets a square version. Levels that keep `"hex"` stay valid. | No |
| Another way to draw the board (for example 3D) | A new `IBoardRenderer` implementation, chosen by `CompositionRoot`. | No |
| Another database or backend | A new adapter for the output port (`ILevelRepository`, `IProgressGateway`, …), chosen by `CompositionRoot`. | No |
