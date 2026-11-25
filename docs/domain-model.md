# Domain model (D1)

The classes of the generic engine, of the four variants and of the layers around them: what each class holds, what it does, which requirement or game rule it serves, its layer and its pattern.
It is the base of the class diagram (D7) and of the code.

- **Source of truth.** [`docs/diagrams/class-model.json`](diagrams/class-model.json) holds the model as data. The diagrams (`docs/diagrams/class-diagram*.puml`) and the sections of this document marked *generated* come from it; the rest is written by hand. Change the model and regenerate; never edit a generated section.
- **Traces.** Each class cites requirement IDs (`docs/requirements.md`), game rules (`docs/game-rules.md`) or ADRs. A trace marked **†** is decided but not yet on `main`: the rules LINES-4..6, MERGE-2..4, FIT-6, LEVEL-1..2 and the requirement FR-16 arrive with the pending pull requests of the game rules and of the requirements baseline.
- **Status.** The layout follows ADR-0003, ADR-0004 and ADR-0006. ADR-0004 is read in the text that pull request #23 accepts (`Board<TCell>`, a coordinate as a list of integers, level files that declare their topology); this model does not change it. Nothing here is code yet.

## 1. Conventions

- **Immutable game state.** Every state, board and value is immutable: an operation returns a new value (`board.withCell(at, cell)`). Only a few holders change over time, and only through their own operations: `GameEngine` (the current state and phase), the undo histories, the stopwatch, the registries, the builders and the view models.
- **Exposed values.** A value that another class needs to read (the screen, a mapper, a test) is a public read-only attribute, drawn in UML as `+name: Type {readOnly}`; derived ones carry `/`. There are no setters anywhere. Everything else is private.
- **Behavior with the data.** The rules live in the domain, next to the data they protect: the use cases orchestrate (find the module, start, forward, save) and decide no game rule (C-22). Inside the domain, each variant's state owns its transitions (`LinesState.withPiecePlaced`, `SortState.withCascade`, `MergeState.afterSlide`, `FitState.withRotated`) and the questions about itself (`FitState.canPlace`, `SortState.hasEmptyCell`); the variant's rules orchestrate those transitions with the reusable rules and the scoring policy, in the steps of the engine's cycle.
- **Value objects** validate their invariant when created (raising `InvalidValueError`), compare by value and never change (C-32). An invariant names only what the constructor can check from its arguments; how a state evolves (a score that only grows, a notice that stays on) is kept by its transitions, not claimed as an invariant. Section 13 lists them with their invariants.
- **Library-private constructors.** `Board`'s constructor is private to the engine package: `BoardBuilder` calls it, and the `with…` operations of a board return boards that keep its invariant.
- **Entities.** `FitLevel`, `SortLevel` and `FitPiece` keep an identity that the content does not give: a level keeps its id across versions, and two equal Fit pieces are still two pieces (FIT-2).
- **No aggregates, domain services or domain events.** No invariant spans several objects that must be loaded and saved as one unit: each game state is one immutable value, and its rules check the invariants. The engine's events are Observer notifications that exist during one game; they carry no time or identities and are not persisted. Value objects, rich behavior and Memento are what the requirements need (C-32, C-19, FR-45, FR-66).
- **Constructors.** Every value object has an unnamed constructor that takes its attributes and checks its invariant; the diagrams leave those out and show named constructors (`Score.zero()`, `Mulberry32.fromSeed(seed)`) as static operations.
- **Types.** Dart types are used as written in code: `T?` is an optional value (multiplicity 0..1 in the diagrams), `List`, `Set`, `Map`, `Future` and `Stream` are the Dart core collections and async types.

## 2. Layers and packages

| Layer | Package (ADR-0003) | Folders | Holds |
|---|---|---|---|
| 1. Domain | `hexablock_engine` | `core/geometry`, `core/board`, `core/errors`, `core/engine`, `core/rules`, `core/phases`, `core/events`, `core/capabilities`, `core/memento`, `core/random`, `core/pieces`, `core/time`, `core/progress`, `core/levels`; `variants/<id>/` | The generic engine and, per variant, its factory, rules, states, moves and builders. Pure Dart. |
| 2. Use cases | `hexablock_application` | `ports/input`, `services`, `ports/output`, `variants`, `session` | Input ports and the services that implement them, output ports, the variant contract (`VariantModule`, `PlayableSession`) and the neutral data the screen reads. Pure Dart. |
| 3. Interface adapters | `hexablock_adapters` | `session`, `levels`, `persistence`, `remote`, `system`, `audio`, `presentation`, `variants/<id>/` | The generic session adapter, repositories, gateways, DTOs, mappers, view models and, per variant, its module, translator, presenter and codec or level mapper. |
| 4. Frameworks and drivers | `app/` | `game`, `rendering`, `platform`, `composition`, `variants/<id>/` | The game screen, the board renderer, the cell painters, the audio facade and the composition root. |

Dependencies point inward only (C-05). The output ports the domain calls (`Clock`) and the interfaces it uses internally (`ITopology`, `IRandomSource`) live in the domain; the ports the use cases call live in layer 2. Layer 3 declares `IAssetReader` and `ILevelDtoSource` for its own mappers, so it does not import Flutter.

## 3. The generic engine

`GameEngine<TCell, TMove, TState>` is a concrete class. It runs the same cycle for every move of every variant (C-19c) and delegates each step that varies to the variant's `IGameRules` (Strategy):

1. **Accept.** The current `GamePhase` says whether it accepts moves; a paused or finished game refuses them.
2. **Validate.** `rules.validate(state, move)` returns a `MoveValidation`. A rejected move changes nothing; the engine notifies a change with cause `moveRejected` and the event `MoveRejected`.
3. **Apply.** `rules.apply(state, move)` returns the new state (place the piece, slide the tiles, count the move).
4. **Resolve.** `rules.resolve(state)` settles the consequences and returns a `Resolution`: the settled state and the variant's events (lines cleared, cascade, merges, spawned tile). The rules call their `IScoringPolicy` here, so scoring is part of resolving and the engine has no scoring step.
5. **Evaluate.** `rules.evaluate(state)` returns a `GameEnd`: ongoing, won or lost.
6. **Transition.** `phase.ended(end)` gives the next phase.
7. **Notify.** The engine sends its listeners one `StateChange`: the state before and after, the cause `moveApplied`, the events (`MoveApplied`, the variant's events and, at the end, `PhaseChanged` and `GameWon` or `GameLost`) and the phase after.

The engine never asks which variant it runs (C-20). A variant enters through `IGameFactory` (Abstract Factory): `GameAssembler` asks the factory for the board, the rules and the initial state, builds the engine, and then asks the factory for the `CapabilitySet` that observes that engine and for the `IProgressModel` of this game. The result is a `PreparedGame`.

### 3.1 Type parameters

| Parameter | Meaning | Lines | Fit | Sort | Merge |
|---|---|---|---|---|---|
| `TCell` | Content of an occupied board cell | `ColorId` | `PieceId` | `ColorStack` | `TileValue` |
| `TMove` | One player move | `LinesMove` | `FitMove` (place, remove, rotate) | `SortMove` | `MergeMove` |
| `TState` | The whole immutable state of a game | `LinesState` | `FitState` | `SortState` | `MergeState` |

`TCell`, `TMove` and `TState` have no bound in `GameEngine`, `IGameRules`, `IGameFactory` or `Board`: the engine only passes them between the rules and the listeners, and the board only stores and returns contents. A bound appears only where a class calls an operation of the type (C-19f). The generated tables below list every generic class and every bound with its reason.

<!-- BEGIN GENERATED BOUNDS -->
<!-- Generated from docs/diagrams/class-model.json. Edit the model, not this section. -->

| Class | Type parameter | Bound | Why the bound is needed |
|---|---|---|---|
| `SlideMergeRule` | `TCell` | `IMergeable<TCell>` | The rule merges two colliding cells; it can only ask canMergeWith and mergedWith of a content that implements IMergeable. |
| `SnapshotHistory` | `TState` | `ISnapshotable<TState, TSnapshot>` | The history calls toSnapshot on the state before each move and restoredFrom on the current state; both need ISnapshotable. |
| `RedoableSnapshotHistory` | `TState` | `ISnapshotable<TState, TSnapshot>` | Same bound as SnapshotHistory, which it extends. |
| `PieceDraw` | `TSource` | `IPieceSource<TPiece>` | rest must be a source of the same pieces; the bound lets a concrete source return itself as rest (SeededPieceSource<LinesPiece>) while the interface promises only IPieceSource<TPiece>. |

<!-- END GENERATED BOUNDS -->

Every generic class of the model:

<!-- BEGIN GENERATED TYPE-PARAMETERS -->
<!-- Generated from docs/diagrams/class-model.json. Edit the model, not this section. -->

| Class | Type parameters |
|---|---|
| `Board` | `TCell` |
| `BoardBuilder` | `TCell` |
| `IGameRules` | `TCell`, `TMove`, `TState` |
| `GameEngine` | `TCell`, `TMove`, `TState` |
| `IRestorable` | `TState` |
| `Resolution` | `TState` |
| `IGameFactory` | `TCell`, `TMove`, `TState` |
| `PreparedGame` | `TCell`, `TMove`, `TState` |
| `IMergeable` | `T` |
| `SlideMergeRule` | `TCell extends IMergeable<TCell>` |
| `SlideResult` | `TCell` |
| `LineClearRule` | `TCell` |
| `LineClear` | `TCell` |
| `IStateListener` | `TState` |
| `StateChange` | `TState` |
| `ISnapshotable` | `TSelf`, `TSnapshot` |
| `SnapshotHistory` | `TState extends ISnapshotable<TState, TSnapshot>`, `TSnapshot` |
| `RedoableSnapshotHistory` | `TState extends ISnapshotable<TState, TSnapshot>`, `TSnapshot` |
| `RandomDraw` | `T` |
| `IPieceSource` | `TPiece` |
| `PieceDraw` | `TPiece`, `TSource extends IPieceSource<TPiece>` |
| `IPieceRecipe` | `TPiece` |
| `SeededPieceSource` | `TPiece` |
| `FixedPieceSource` | `TPiece` |
| `GameStopwatch` | `TState` |
| `IScoringPolicy` | `TState` |
| `GameSessionAdapter` | `TCell`, `TMove`, `TState` |
| `IIntentTranslator` | `TMove`, `TState` |
| `ISessionPresenter` | `TCell`, `TState` |
| `IStateCodec` | `TState` |

<!-- END GENERATED TYPE-PARAMETERS -->

### 3.2 How each variant binds the engine

Each variant declares a Dart typedef that binds the template; it adds no code. Its rules, factory and scoring realize the generic interfaces with the same arguments.

<!-- BEGIN GENERATED BINDS -->
<!-- Generated from docs/diagrams/class-model.json. Edit the model, not this section. -->

| Variant | Bound engine | TCell | TMove | TState |
|---|---|---|---|---|
| hexa-lines | `HexaLinesEngine` = `GameEngine<ColorId, LinesMove, LinesState>` | `ColorId` | `LinesMove` | `LinesState` |
| hexa-fit | `HexaFitEngine` = `GameEngine<PieceId, FitMove, FitState>` | `PieceId` | `FitMove` | `FitState` |
| hexa-sort | `HexaSortEngine` = `GameEngine<ColorStack, SortMove, SortState>` | `ColorStack` | `SortMove` | `SortState` |
| hexa-merge | `HexaMergeEngine` = `GameEngine<TileValue, MergeMove, MergeState>` | `TileValue` | `MergeMove` | `MergeState` |

<!-- END GENERATED BINDS -->

## 4. Geometry and board

- **Coordinates.** `Coordinate` is a value object that holds a list of integers. The topology defines how many there are and checks them (`ITopology.isValid`). `HexTopology` reads them as axial `[q, r]` (Red Blob Games, cited in the class). Only the topology and the board renderer of the same topology (`HexBoardRenderer`, through `HexLayout`, in layer 4) interpret the numbers; the layer-3 mappers (level mappers and saved-game codecs) copy them to and from JSON without interpreting them. Rules, shapes and the board ask the topology for neighbors, axes, directions, rotation and the fixed order of cells (ADR-0004, game-rules *Terms*).
- **Board.** `Board<TCell>` is generic only in its content; it receives its topology when it is built, and it is the Strategy context of `ITopology`. The assignment's `HexBoard<TCell>` is a `Board<TCell>` built with a `HexTopology`. `BoardBuilder` builds a regular board (`regular(radius)`) or an arbitrary one (a Fit figure) and checks it (ADR-0006).
- **Rows and order.** `rowsAlong(axis, cells)` gives the maximal straight rows of a set of cells (LINES-1), `inFixedOrder` the order of the game rules (SORT-3, Merge spawn), `orderedTowards(direction, cells)` the order of a slide (MERGE-2†).
- **Where the topology comes from.** Each level file names its topology in `board.topology` (the API level format requires the field). The composition root creates one `TopologyRegistry`, registers `HexTopology` (id `"hex"`) and injects the registry into the level mappers. `FitLevelMapper` and `SortLevelMapper` pass the name to their builder as a `TopologyId`; the builder resolves it in the registry and refuses the level with `InvalidLevelError` (check `board.topology`) when it is not registered, before the checks L1, L2 and the variant's own. ADR-0004 says the level builder resolves the topology "through a factory"; that factory is implemented as `TopologyRegistry`, a lookup by id of the instances the composition root registered, because a topology holds no per-level state to build. The level then holds its topology, and its factory builds the board with it, so the factories of Fit and Sort receive no topology of their own. Hexa Lines and Hexa Merge have no level file: the composition root injects the topology of their mode, taken from the same registry, into their modules and their saved-game codecs (ADR-0004, ADR-0006, FR-04). A name that `TopologyId` refuses also ends as `InvalidLevelError` (`board.topology`) in the mapper.
- **One topology per build.** `GameScreen` holds one `IBoardRenderer`. The composition root registers a topology and picks the renderer of that same topology together, so a build draws every level it accepts; a level that names another topology is refused by its builder before it reaches the screen.
- **Changing the shape (C-31, NFR-02).** Square cells need a `SquareTopology` (`ITopology`, id `"square"`) registered by the composition root, a `SquareBoardRenderer` (`IBoardRenderer`) and the value `"square"` in the level schema of the API. Levels that keep `"hex"` stay valid. No rule, state, use case or screen changes.

## 5. Game phases (State)

`GamePhase` is the State pattern; `GameEngine` is its context. Each phase answers whether it accepts moves and which phase follows a pause, a resume or an end (C-19c).

| Phase | Accepts moves | `paused()` | `resumed()` | `ended(won)` / `ended(lost)` | Who enters it | Traces |
|---|---|---|---|---|---|---|
| `PlayingPhase` | yes | Paused | itself | Won / Lost | start, resume | C-19c, FR-03 |
| `PausedPhase` | no | itself | Playing | itself | pause (background, pause button) | FIT-5, FIT-6† |
| `WonPhase` | no | itself | itself | itself | Fit: figure covered; Sort: goal reached | FR-06, FR-43, FR-54 |
| `LostPhase` | no | itself | itself | itself | Lines: no tray piece fits; Sort: board full without the goal; Merge: no direction changes the board | FR-07, FR-35, FR-54, MERGE-1 |

- `restore` (undo, redo) is accepted only while playing; a finished game cannot be rewound.
- In Lines and Merge, the endless games, `LostPhase` is the end of the game: its result is the score, shown on the defeat screen with the option to play again (FR-07, FR-36, FR-67).
- **No "resolving" phase.** Resolving is step 4 of `submit`, which runs synchronously; nothing can happen between applying and resolving. Animations of a cascade belong to the screen, which plays the events it received.
- **No "menu" phase.** Menus and navigation belong to the interface, not to a game.
- **Reaching 2048 is a notice, not a phase.** `HexaMergeRules.resolve` publishes `TargetReached` the first time the target tile appears; the game stays in `PlayingPhase` (MERGE-1, FR-64).
- **Pause hides the board when the game is timed.** The screen hides the board while paused when `capabilities.timer` exists, so the player cannot study a Fit level with the clock stopped (FIT-6†).

## 6. Engine events (Observer)

The engine is the subject. Listeners register on it as `IStateListener<TState>`, the only listener interface, and receive one `StateChange` per change of the game (C-06): the state before and after, its `cause`, its events and the phase after. Every listener decides on `cause` and `phase`, or reads the `kind` and `cells` that every `GameEvent` carries; nobody checks the class of an event, so a new variant's events need no new code in any listener.

**Causes.** `ChangeCause` says why the engine notified, and the generic listeners react to it:

| Cause | When | `SnapshotHistory` | `GameStopwatch` | Session adapter | Traces |
|---|---|---|---|---|---|
| `moveApplied` | a move passed validation and was applied | keeps `before.toSnapshot()`; clears the redo stack | starts on the first one | sends an update | C-19c, FIT-4, FIT-5, FR-45 |
| `moveRejected` | validation refused the move | — | — | sends an update with the reason | C-19c, FR-41 |
| `restored` | undo or redo replaced the state | refreshes `latest` only | — | sends an update | FR-45, FR-66 |
| `paused` | the game was paused | — | pauses | sends an update | FIT-5, FIT-6† |
| `resumed` | the game was resumed | — | resumes | sends an update | FIT-5 |

The stopwatch stops when the phase after a change is over (won or lost). Every listener refreshes what it keeps of the current state on every change.

**Events.** Each event has an `EventKind` (the key that `SoundCueMap` and the presenters use) and the cells it affects, in order:

| Event | Published by | When | `cells` | Traces |
|---|---|---|---|---|
| `MoveApplied` | `GameEngine` | a move passed validation | empty | C-19c, FIT-4 |
| `MoveRejected` | `GameEngine` | validation refused the move (carries the reason) | empty | C-19c, FR-41 |
| `PhaseChanged` | `GameEngine` | pause, resume or end | empty | C-19c, FIT-5 |
| `GameWon` | `GameEngine` | evaluate returned won | empty | FR-06 |
| `GameLost` | `GameEngine` | evaluate returned lost | empty | FR-07, FR-35 |
| `StateRestored` | `GameEngine` | undo or redo restored a state | empty | FR-45, FR-66 |
| `LinesCleared` | `HexaLinesRules` | a move cleared lines | the cleared cells | FR-33 |
| `TrayRefilled` | `HexaLinesRules` | the empty tray got three pieces | empty | FR-31 |
| `StackTransferred` | `CascadeResolver` | a top block moved | `[from, to]` | FR-52, SORT-1 |
| `BlockRemoved` | `CascadeResolver` | a block of 10 or more left the board | `[at]` | FR-53, SORT-4 |
| `TilesMerged` | `HexaMergeRules` | a slide merged tiles | the cells of the merged tiles | FR-62 |
| `TileSpawned` | `HexaMergeRules` | a new tile appeared | `[at]` | FR-63 |
| `TargetReached` | `HexaMergeRules` | 2048 appeared for the first time | the target tile | FR-64, MERGE-1 |

The session adapter (`GameSessionAdapter`) turns each `StateChange` into a `SessionUpdate`: the new view, one `SessionEffect` (kind and cells) per event, and the phase. The view model plays the sound of each effect's kind through `IAudioOutput`, and the game screen animates the effect's cells.

## 7. Optional capabilities

Some games can undo, redo, measure time or replay from a seed; others cannot (FR-37, FR-45, FR-56, FR-66). Each capability is a small interface (ISP), and the variant's factory builds a `CapabilitySet` with the ones its game has (C-21).

| Capability | Lines | Fit | Sort | Merge | Implemented by |
|---|---|---|---|---|---|
| `IUndoable` | — (FR-37) | yes (FR-45) | — (FR-56) | yes, one step (FR-66) | `SnapshotHistory`, `RedoableSnapshotHistory` |
| `IRedoable` | — | yes (FR-45) | — | — | `RedoableSnapshotHistory` |
| `ITimed` | — | yes (FR-44, FIT-5) | — | — | `GameStopwatch` |
| `IRandomSeeded` | yes (seed from `ISeedSource`) | — | yes (seed in the level, SORT-6) | yes (seed from `ISeedSource`) | `SeedRecord` |

How a capability reaches the use cases and the screen without a type check (C-20, C-21):

1. `IGameFactory.createCapabilities(engine)` builds the histories and the stopwatch, registers them as listeners of that engine, and returns the `CapabilitySet`.
2. `PreparedGame` carries it; the variant module hands it to `GameSessionAdapter`, which exposes it as `PlayableSession.capabilities`.
3. `GameSessionService.undo()` calls `capabilities.undo?.undo()`; when the field is absent it does nothing and answers false.
4. `GameViewModel` shows the undo and redo buttons when `capabilities.undo` and `capabilities.redo` exist and the timer when `capabilities.timer` exists.
5. `GameSessionAdapter.outcome()` adds the elapsed time to the rules' `GameOutcome` through `GameOutcome.withTime` when `capabilities.timer` exists, so the time reaches the progress model without the view model.

## 8. Undo snapshots (Memento)

Undo and redo use Memento only. The state is the originator (`ISnapshotable`), the snapshot is the memento, and the history is the caretaker: it keeps snapshots, never reads them, and hands them back to the state.

| Variant | Snapshot | Keeps | Leaves out | Capacity | Redo | Traces |
|---|---|---|---|---|---|---|
| Hexa Fit | `FitSnapshot` | board, placements, orientations of the pieces | move count, clock | unlimited | yes | FR-45, FIT-4 |
| Hexa Merge | `MergeSnapshot` | board, score, tile source with its generator state, target notice | — | one step | no | FR-66, SCORE-2, MERGE-4† |
| Hexa Lines | none | — | — | — | — | FR-37 |
| Hexa Sort | none | — | — | — | — | FR-56 |

How it works:

1. The history listens to the engine as an `IStateListener` and refreshes `latest`, its copy of the current state, on every change, restores included. When the cause is `moveApplied`, it also keeps `before.toSnapshot()`, dropping the oldest when the `HistoryCapacity` is full; a new move also clears the redo stack.
2. `undo()` takes the last snapshot, asks `latest` for `restoredFrom(snapshot)` and gives the result to the engine through `IRestorable.restore`. Because the current state rebuilds itself, what the snapshot leaves out stays as it is: Fit's move count keeps growing (FIT-4) and the clock keeps running.
3. The engine notifies with cause `restored`; the history refreshes `latest` and keeps no snapshot.
4. **Redo (Fit).** Before restoring, `undo()` pushes the snapshot of the state before the undo onto the redo stack; `redo()` pops it and restores it the same way. A change with cause `moveApplied` clears the redo stack.
5. In Merge, a swipe that changes nothing is rejected by `validate` (MERGE-3†), so it never reaches the history. Because the snapshot holds the generator state, undo brings back the same next tile: the player cannot undo to fish for a better spawn (MERGE-4†).
6. **The 2048 notice and undo (Merge).** The snapshot holds `targetReached`. Undoing the move that first reached the target restores `targetReached = false`, so reaching it again shows the notice again. This is intended: the notice describes the current game, and play goes on after it (FR-64).

## 9. The seeded generator

The domain owns its random generator, so a game is the same on every device and in every test (NFR-05, SORT-6).

- **Algorithm.** `Mulberry32`, by Tommy Ettinger (2017, public domain, CC0): <https://gist.github.com/tommyettinger/46a874533244883189143505d203312c>. Its state is one 32-bit word. Each draw adds `0x6D2B79F5` to the state and mixes the result with three xor-shift-multiply steps into a 32-bit output. The code cites the source in a comment, as AGENTS.md §8 asks.
- **32-bit arithmetic.** Dart integers are 64-bit, so every addition, multiplication and shift of the algorithm is masked to 32 bits (`& 0xFFFFFFFF`, with an unsigned right shift); without the mask the sequence differs from the reference.
- **Known limit.** Mulberry32 is not equidistributed: about a third of the 32-bit values never appear as output. A puzzle game only draws small ranges, so this does not matter; the choice favors a short, well-known, reproducible algorithm.
- **Unbiased ranges.** `nextBelow(bound)` rejects the draws above the largest multiple of `bound` that fits in 32 bits, so every value below `bound` is equally likely. `SpawnSlot` uses a raw draw modulo the empty cells, whose bias for 19 cells is below 1 in 10^8.
- **Immutable.** `IRandomSource.next()` returns a `RandomDraw` with the value and the next source. A state that holds a source holds the whole future of its draws.
- **State as a value object.** `Seed` and `GeneratorState` are value objects in `0 .. 2^32 − 1`. `SeededPieceSource.generatorState` exposes the state for saving.
- **Injection.** The composition root creates one `Mulberry32Factory` (`IRandomSourceFactory`); the variant modules pass it to their factories. Tests inject a fake source. The seed comes from the level in Sort (SORT-6) and from `ISeedSource` (`SecureSeedSource`) in Lines and Merge.
- **Saving a game in progress (FR-16†).** Lines and Merge offer `ISaveableSession`. The session adapter asks the variant's `IStateCodec` (`LinesStateMapper`, `MergeStateMapper`, layer 3) to encode the whole state, generator state included; `IResumableVariant.resumeSession` decodes it, restores the source with `IRandomSourceFactory.restore` and calls `GameAssembler.resumeGame`. The resumed game draws exactly the pieces it would have drawn.
- **Undo in Merge (MERGE-4†).** The snapshot holds the tile source, so undo restores the generator too (section 8).

## 10. The boundary between the engine and a variant

The rest of the app sees a variant only through `VariantModule`, which has no type parameters (C-20). Inside, the module builds its factory, assembles its typed `GameEngine<TCell, TMove, TState>` and wraps it in a `GameSessionAdapter`, which implements the untyped `PlayableSession`. The screen sends neutral `PlayerIntent`s (tap a cell, drop a piece, swipe, rotate, lift) and draws a neutral `SessionView`; the variant translates and presents. One `GameSessionService` and one `GameScreen` serve every variant (C-22).

| Part | Owner | Layer | Classes |
|---|---|---|---|
| Cycle, phases, events, history, generator, board, topology and topology registry | engine | 1 | `core/` |
| Rules, states, moves, factory (which also creates the progress model with the level's par or thresholds), scoring, recipes, level builder | variant | 1 | `variants/<id>/` |
| Registration, intent translation, state presentation, saved-game codec or level mapper | variant | 3 | `<Variant>Module`, `<Variant>IntentTranslator`, `<Variant>Presenter`, `<Variant>StateMapper` or `<Variant>LevelMapper` |
| Drawing of one cell | variant | 4 | `<Variant>CellPainter`, registered in `CellPainterRegistry` by game id |
| Texts | variant | 4 (i18n files) | keys named in `VariantTexts` and `StatLine` |
| Sounds | variant | 4 | its `EventKind` → `SoundCue` entries, added to `SoundCueMap` (layer 3) by `CompositionRoot` |
| Wiring | app | 4 | `CompositionRoot`, the only place that names the variants |

**A fifth variant adds** a `variants/<id>/` folder in the domain (rules, state, move, factory, typedef, and a level builder and progress model if it needs them), a `variants/<id>/` folder in the adapters (module, translator, presenter, and a codec or level mapper if it saves or uses levels), a cell painter in the app, its translations, its level files if it has levels (and its `gameId` as a new value in the API level schema), and three wiring lines in `CompositionRoot`: register the module, register the painter, add its sound entries to `SoundCueMap`.

**It does not touch** `GameEngine`, `IGameRules`, `IGameFactory`, `GameAssembler`, the phases, the events, the histories, the generator, `Board`, the topology and its registry, any use case or service, `PlayableSession`, `GameSessionAdapter`, `GameViewModel`, `GameScreen` or `IBoardRenderer` (C-20, C-22, NFR-01), as long as it uses the gestures and the kinds of result that exist. Its events reach the screen and the audio as kind and cells, and its progress model comes from its own factory.

**What it does touch, and when.** Two changes reach outside the variant's folders, and both are additions, not edits of logic:

- **A new kind of gesture** (one that is not a tap, a drop, a swipe, a rotate or a lift) adds a `PlayerIntent` subtype in layer 2 and its recognition in `GameScreen`. The translators of the other variants ignore it.
- **A new kind of result** (one that is not a score, stars, moves or time) adds a field to `GameOutcome` and `GameResult`, to `ProgressDto` and to the backend API.

The four variants of the assignment need neither.

## 11. The four variants

| | Hexa Lines | Hexa Fit | Hexa Sort | Hexa Merge |
|---|---|---|---|---|
| Board | radius 4, 61 cells (FR-30) | the level's figure (FR-40) | radius 2, 19 cells (FR-50) | radius 2, 19 cells (FR-60) |
| Move | place a tray piece (FR-32) | place, remove, rotate (FR-41, FR-42) | place the offered stack (FR-51) | swipe in 6 directions (FR-61) |
| Resolve | clear full lines on 3 axes, score, refill the tray (LINES-1..3) | nothing | cascade, remove blocks of 10, score (SORT-1..4, SCORE-1) | merge, score, spawn one tile, notice the target (FR-62..65, SCORE-2) |
| End | lost when no tray piece fits (FR-35, LINES-6†) | won when covered; never lost (FR-43) | won at the goal, else lost on a full board (SORT-5) | lost when no swipe changes the board (MERGE-1) |
| Pieces | `SeededPieceSource<LinesPiece>` from a fixed catalog without rotation (LINES-4†, LINES-5†) | `FixedPieceSource<FitPiece>` with the level's pieces | `SeededPieceSource<ColorStack>` from the level's parameters (SORT-6) | `SeededPieceSource<TileSpawn>` (FR-63) |
| Scoring | `LinesScoringPolicy`: cells + 10 × L × L × streak (LINES-3) | none | `SortScoringPolicy`: 10 per tile removed (SCORE-1) | `MergeScoringPolicy`: sum of merged values (SCORE-2) |
| Progress | `HighScoreProgress` (FR-36) | `FitLevelProgress`: stars by moves and time (FIT-3) | `SortLevelProgress`: stars by thresholds (SORT-7) | `HighScoreProgress` (FR-67) |
| Capabilities | seeded | undo, redo, timer | seeded | undo (1 step), seeded |
| Saves a game in progress | yes (FR-16†) | no | no | yes (FR-16†) |

`GameOutcome` carries what a finished game measured: the score (Lines, Sort, Merge), the moves (Fit, Sort) and the time (Fit, added from the timer). What a level demands belongs to its progress model: each factory creates its own (`createProgressModel()`), `FitLevelProgress` with the level's par and `SortLevelProgress` with its thresholds, and `PreparedGame` and `PlayableSession` carry it. `SaveProgressUseCase.save(session)` asks that model: `resultOf` turns the outcome into a `GameResult`, and `isBetter` compares it with the saved best in the order of RANK-1. Scoring per move (`IScoringPolicy<TState>`) and the result per game (`IProgressModel`) are separate, because Fit has no points and Lines has no stars (ISP, C-19e).

Each state owns its transitions, and the rules orchestrate them in the engine's cycle:

| Variant | State transitions and questions | The rules call them in |
|---|---|---|
| Hexa Lines | `canPlace(slot, at)`, `anyPieceFits()`, `withPiecePlaced(slot, at)`, `withLinesCleared(clear)`, `withPointsAdded(points)`, `withTrayRefilled()` | validate, evaluate, apply, resolve (with `LineClearRule` and `LinesScoringPolicy`) |
| Hexa Fit | `canPlace(piece, at)`, `isCovered()`, `withPlaced(piece, at)`, `withLifted(piece)`, `withRotated(piece, by)` | validate, evaluate, apply |
| Hexa Sort | `hasEmptyCell()`, `reaches(goal)`, `withStackPlaced(at)`, `withCascade(result)`, `withPointsAdded(points)` | evaluate, apply, resolve (with `CascadeResolver` and `SortScoringPolicy`) |
| Hexa Merge | `afterSlide(result, target)`, `withPointsAdded(points)`, `withSpawn()` | apply (with `SlideMergeRule` and `MergeScoringPolicy`), resolve |

The points come last because the scoring policy reads the state before and after the move (`pointsFor(before, after)`).

## 12. Patterns

| Pattern | Why here |
|---|---|
| Strategy | Everything that varies per variant or per detail sits behind an interface: rules (context `GameEngine`), scoring (context: each variant's rules), progress (context `ProgressService`), piece recipes (context `SeededPieceSource`), topology (context `Board`), board renderer and cell painter (context `GameScreen`) (C-06, C-20, C-31). |
| Abstract Factory | Each variant creates a family of objects that must match (board, rules, state, capabilities, progress model); `GameAssembler` is the client that never names the variant (C-06, C-19). |
| Builder | Boards and levels are built step by step and checked once at `build()` (ADR-0006). |
| State | The phases decide what a game accepts without conditionals in the engine (C-19c). |
| Observer | The engine notifies history, stopwatch, session and audio without knowing them (C-06). |
| Memento | Undo restores what each variant needs, and only that (FR-45, FR-66, FIT-4). |
| Adapter | `GameSessionAdapter` adapts every typed engine to the untyped `PlayableSession`; translators and presenters adapt intents and views. |
| Facade | `AudioManager` hides the audio player behind one port operation per cue (FR-09). |
| Single instance | Topology, topology registry, generator factory, registries, active session and audio exist once and are injected by the composition root, so tests can replace them; there is no static Singleton accessor. |

Command and Template Method are not used: undo needs only Memento, and the engine's cycle delegates to a strategy instead of overriding steps.

Participants by pattern (generated):

<!-- BEGIN GENERATED PATTERNS -->
<!-- Generated from docs/diagrams/class-model.json. Edit the model, not this section. -->

| Pattern | Participants (role) |
|---|---|
| Strategy | `ITopology` (strategy), `HexTopology` (concrete strategy), `Board` (context), `IGameRules` (strategy), `GameEngine` (context), `IPieceRecipe` (strategy), `SeededPieceSource` (context), `IScoringPolicy` (strategy), `IProgressModel` (strategy), `HighScoreProgress` (concrete strategy), `CatalogRecipe` (concrete strategy), `HexaLinesRules` (concrete strategy), `HexaLinesRules` (context), `LinesScoringPolicy` (concrete strategy), `HexaFitRules` (concrete strategy), `FitLevelProgress` (concrete strategy), `HexaSortRules` (concrete strategy), `HexaSortRules` (context), `StackRecipe` (concrete strategy), `SortScoringPolicy` (concrete strategy), `SortLevelProgress` (concrete strategy), `HexaMergeRules` (concrete strategy), `HexaMergeRules` (context), `TileSpawnRecipe` (concrete strategy), `MergeScoringPolicy` (concrete strategy), `ProgressService` (context), `GameScreen` (context), `IBoardRenderer` (strategy), `HexBoardRenderer` (concrete strategy), `ICellPainter` (strategy), `LinesCellPainter` (concrete strategy), `FitCellPainter` (concrete strategy), `SortCellPainter` (concrete strategy), `MergeCellPainter` (concrete strategy) |
| Single instance | `HexTopology` (single instance), `TopologyRegistry` (single instance), `Mulberry32Factory` (single instance), `ActiveSession` (single instance), `VariantRegistry` (single instance), `CellPainterRegistry` (single instance), `AudioManager` (single instance), `CompositionRoot` (creator) |
| Builder | `BoardBuilder` (builder), `FitLevelBuilder` (builder), `SortLevelBuilder` (builder) |
| State | `GameEngine` (context), `GamePhase` (state), `PlayingPhase` (concrete state), `PausedPhase` (concrete state), `WonPhase` (concrete state), `LostPhase` (concrete state) |
| Observer | `GameEngine` (subject), `GameEvent` (event), `IStateListener` (observer), `SnapshotHistory` (concrete observer), `GameStopwatch` (concrete observer), `GameSessionAdapter` (concrete observer) |
| Abstract Factory | `IGameFactory` (abstract factory), `GameAssembler` (client), `HexaLinesFactory` (concrete factory), `HexaFitFactory` (concrete factory), `HexaSortFactory` (concrete factory), `HexaMergeFactory` (concrete factory) |
| Memento | `ISnapshotable` (originator), `SnapshotHistory` (caretaker), `RedoableSnapshotHistory` (caretaker), `FitState` (originator), `FitSnapshot` (memento), `MergeState` (originator), `MergeSnapshot` (memento) |
| Adapter | `PlayableSession` (target), `GameSessionAdapter` (adapter) |
| Facade | `AudioManager` (facade) |

<!-- END GENERATED PATTERNS -->

## 13. Value objects and remaining primitives (C-32)

Every value object, with the invariant it checks when created (generated):

<!-- BEGIN GENERATED VALUE-OBJECTS -->
<!-- Generated from docs/diagrams/class-model.json. Edit the model, not this section. -->

| Value object | Layer · scope | Invariant (checked when created) | Traces |
|---|---|---|---|
| `Coordinate` | domain · generic | At least one component. The topology that receives it checks the length and the range (ITopology.isValid). | C-32, ADR-0004, C-31 |
| `TopologyId` | domain · generic | non-empty. | ADR-0004, C-32, FR-04 |
| `Direction` | domain · generic | index >= 0 (the topology that issues it checks the upper bound). | C-32, FR-61 |
| `Axis` | domain · generic | index >= 0 (the topology that issues it checks the upper bound). | C-32, LINES-1, FR-33 |
| `RotationSteps` | domain · generic | count >= 0. | C-32, FR-42, FIT-2, FIT-4 |
| `Radius` | domain · generic | value >= 0. | C-32, FR-30, FR-50, FR-60 |
| `Shape` | domain · generic | At least one cell, all valid in the topology, connected through neighbors. | C-32, FR-31, FR-40, FIT-2, LINES-5† |
| `CellLine` | domain · generic | At least one cell. | C-32, LINES-1 |
| `Board` | domain · generic | Every coordinate is valid in the topology; contents only on board coordinates. | C-19, C-19f, ADR-0004, NFR-04, C-32 |
| `MoveValidation` | domain · generic | reason is present exactly when the move is rejected. | C-19c, FR-03, FR-32, FR-41 |
| `RejectionReason` | domain · generic | code is a non-empty key in kebab case, prefixed by the game id or "engine". | C-32, FR-10, C-19c |
| `Resolution` | domain · generic | — | C-19c |
| `GameOutcome` | domain · generic | — | C-19e, FR-05, FR-06, FIT-3, SORT-7, SCORE-1, SCORE-2, LINES-3 |
| `PreparedGame` | domain · generic | — | C-21, C-20, C-19e |
| `SlideResult` | domain · generic | merged is empty when changed is false. | FR-62, FR-65, MERGE-3† |
| `LineClear` | domain · generic | clearedCells is the union of the cells of lines. | LINES-2, LINES-3 |
| `EventKind` | domain · generic | name is non-empty kebab case. | C-32, FR-09 |
| `StateChange` | domain · generic | — | C-19c, FIT-5, FR-45 |
| `CapabilitySet` | domain · generic | redo is present only if undo is present. | C-21, C-20, C-22 |
| `SeedRecord` | domain · generic | — | NFR-05, SORT-6 |
| `HistoryCapacity` | domain · generic | steps >= 1 when limited. | C-32, FR-45, FR-66 |
| `RandomDraw` | domain · generic | — | NFR-05 |
| `Seed` | domain · generic | 0 <= value <= 2^32 - 1. | C-32, NFR-05, SORT-6 |
| `GeneratorState` | domain · generic | 0 <= value <= 2^32 - 1. | C-32, FR-16†, MERGE-4† |
| `PieceDraw` | domain · generic | — | NFR-05 |
| `SeededPieceSource` | domain · generic | — | NFR-05, SORT-6, FR-31, FR-63, FR-16† |
| `FixedPieceSource` | domain · generic | — | FR-40 |
| `ElapsedTime` | domain · generic | seconds >= 0. | C-32, FIT-3, FIT-5, RANK-1 |
| `GameResult` | domain · generic | score or stars is present. | FR-08, FR-12, RANK-1, RANK-2 |
| `Score` | domain · generic | points >= 0. | C-32, FR-05, LINES-3, SCORE-1, SCORE-2 |
| `StarCount` | domain · generic | 1 <= value <= 3. | C-32, FR-44, FIT-3, SORT-7 |
| `MoveCount` | domain · generic | value >= 0. | C-32, FIT-4, SORT-7, RANK-1 |
| `ResultDate` | domain · generic | instant is UTC. | C-32, RANK-1, NFR-05 |
| `GoalCount` | domain · generic | value >= 0. | C-32, FR-53, FR-54, SORT-4, SORT-5 |
| `GameId` | domain · generic | lowercase letters, digits and hyphens; non-empty. | C-32, FR-21, C-20 |
| `LevelId` | domain · generic | matches <gameId>-NNN with NNN three digits. | C-32, FR-04, FR-13 |
| `LevelNumber` | domain · generic | value >= 1. | C-32, FR-02 |
| `LevelVersion` | domain · generic | value >= 1. | C-32, FR-14, LEVEL-1† |
| `Difficulty` | domain · generic | 1 <= value <= 5. | C-32, FR-46, FR-55, LEVEL-2† |
| `LevelHeader` | domain · generic | id starts with gameId and ends with number (check L1). | FR-04, FR-14, FR-23, LEVEL-2† |
| `LevelCatalog` | domain · generic | one header per level id; all of the same game. | FR-02, FR-14, LEVEL-1† |
| `LevelAccess` | domain · generic | a completed level is unlocked. | FR-02, LEVEL-1† |
| `LevelPar` | domain · generic | — | FIT-3, FR-44 |
| `MoveThresholds` | domain · generic | first > second. | SORT-7 |
| `ColorId` | domain · generic | key is a non-empty lowercase word. | C-32, FR-31, FR-50, C-31 |
| `LinesState` | domain · hexa-lines | score >= 0. | FR-31, FR-32, FR-34, FR-35, FR-36, FR-16†, LINES-3 |
| `LinesMove` | domain · hexa-lines | — | FR-32 |
| `Tray` | domain · hexa-lines | exactly 3 slots; each holds a piece or nothing. | FR-31 |
| `TrayRefill` | domain · hexa-lines | tray is full. | FR-31, NFR-05 |
| `TraySlot` | domain · hexa-lines | 0 <= index <= 2. | C-32, FR-31 |
| `LinesPiece` | domain · hexa-lines | shape has 1 to 5 cells. | FR-31, LINES-4†, LINES-5† |
| `PieceCatalog` | domain · hexa-lines | at least one entry; every entry has 1 to 5 cells. | FR-31, LINES-5†, C-31 |
| `Streak` | domain · hexa-lines | count >= 0. | FR-34, LINES-3 |
| `ClearReport` | domain · hexa-lines | cellsPlaced in 1..5; linesCleared >= 0. | LINES-3 |
| `Figure` | domain · hexa-fit | connected through neighbors and without interior holes, checked on the unbounded grid (FIT-1). | FR-40, FIT-1 |
| `PieceId` | domain · hexa-fit | value >= 0 (position in the level). | C-32, FIT-2 |
| `FitState` | domain · hexa-fit | a piece is either placed (one placement) or free; the board holds exactly the cells of the placed pieces. | FR-41, FR-42, FR-43, FIT-4, FR-45 |
| `FitSnapshot` | domain · hexa-fit | — | FIT-4, FR-45 |
| `PiecePlacement` | domain · hexa-fit | — | FR-41 |
| `PlaceFitPiece` | domain · hexa-fit | — | FR-41, FIT-4 |
| `RemoveFitPiece` | domain · hexa-fit | — | FR-41, FIT-4 |
| `RotateFitPiece` | domain · hexa-fit | by.count >= 1. | FR-42, FIT-2, FIT-4 |
| `TrayParams` | domain · hexa-sort | at least 2 colors, no color repeated (level format). | SORT-6 |
| `StackSizeRange` | domain · hexa-sort | 1 <= min <= max <= 9 (S1 and the level format). | SORT-6, SORT-4 |
| `ColorStack` | domain · hexa-sort | at least one tile. | FR-50, FR-52, SORT-1 |
| `TopBlock` | domain · hexa-sort | size >= 1. | SORT-1, SORT-4, FR-53 |
| `SortState` | domain · hexa-sort | goals, moves and score >= 0. | FR-51, FR-53, FR-54, SORT-5, SORT-6, SORT-7, SCORE-1 |
| `SortMove` | domain · hexa-sort | — | FR-51, SORT-7 |
| `SortTurn` | domain · hexa-sort | every removed block has size >= 10. | SCORE-1, SORT-4 |
| `CascadeResult` | domain · hexa-sort | every removed block has size >= 10. | SORT-3, SORT-4 |
| `TileValue` | domain · hexa-merge | value is a power of 2 and >= 2. | C-32, FR-60, FR-62, C-19f |
| `MergeState` | domain · hexa-merge | score >= 0. | FR-60, FR-64, FR-65, FR-66, FR-16†, SCORE-2 |
| `MergeSnapshot` | domain · hexa-merge | — | SCORE-2, MERGE-4†, FR-66 |
| `MergeMove` | domain · hexa-merge | — | FR-61 |
| `MergeTurn` | domain · hexa-merge | merged may be empty. | SCORE-2, FR-63 |
| `TileSpawn` | domain · hexa-merge | value is 2 or 4. | FR-63 |
| `SpawnSlot` | domain · hexa-merge | 0 <= draw <= 2^32 - 1. | FR-63, NFR-05, game-rules Terms |
| `SpawnOdds` | domain · hexa-merge | 0 <= fourPerHundred <= 100. | FR-63 |
| `VariantTexts` | application · generic | keys non-empty. | FR-01, FR-10 |
| `StartGameRequest` | application · generic | levelId belongs to gameId when present. | FR-03, NFR-05 |
| `SessionRequest` | application · generic | — | NFR-05, C-20 |
| `TapCell` | application · generic | — | FR-51 |
| `DropPiece` | application · generic | — | FR-32, FR-41 |
| `Swipe` | application · generic | — | FR-61 |
| `RotatePiece` | application · generic | — | FR-42 |
| `LiftPiece` | application · generic | — | FR-41 |
| `PieceRef` | application · generic | index >= 0. | C-20 |
| `SessionView` | application · generic | — | C-20, C-22, FR-03 |
| `BoardView` | application · generic | no two cell views share a coordinate; each coordinate is valid in the topology. | C-20, ADR-0004 |
| `CellView` | application · generic | — | C-20 |
| `ColorToken` | application · generic | key non-empty. | C-20, C-31 |
| `PieceView` | application · generic | cells non-empty. | C-20 |
| `StatLine` | application · generic | labelKey non-empty. | FR-03, FR-10 |
| `SessionUpdate` | application · generic | — | FR-09, C-19c |
| `SessionEffect` | application · generic | — | FR-09, C-19c, C-20 |
| `SavedGame` | application · generic | payload non-empty. | FR-16† |
| `ProgressRecord` | application · generic | levelId belongs to gameId when present. | FR-08, FR-12, FR-21 |
| `SaveProgressResult` | application · generic | — | FR-06, FR-08 |
| `DownloadedLevel` | application · generic | payload non-empty. | FR-14, FR-23 |
| `LeaderboardEntry` | application · generic | position >= 1. | FR-13, RANK-1, RANK-2 |
| `UserId` | application · generic | non-empty. | FR-11, RANK-1 |
| `Credentials` | application · generic | both valid. | FR-11 |
| `Email` | application · generic | one @ and a dot in the domain. | FR-11, C-32 |
| `Password` | application · generic | at least 8 characters. | FR-11, NFR-06 |
| `AuthSession` | application · generic | — | FR-11, FR-20 |
| `AccessToken` | application · generic | non-empty. | FR-20, NFR-06 |
| `Preferences` | application · generic | — | FR-09, FR-10 |
| `LanguageCode` | application · generic | "es" or "en". | FR-10 |
| `SoundCue` | adapters · generic | asset path non-empty. | FR-09 |

<!-- END GENERATED VALUE-OBJECTS -->

Primitives that remain in layers 1 and 2, and why each needs no value object of its own:

| Primitive | Where | Justification |
|---|---|---|
| `bool` | flags such as `isAccepted`, `targetReached`, `acceptsMoves`, `musicOn` | C-32 accepts booleans. |
| `int` inside a value object | `Coordinate.components`, `Direction.index`, `Axis.index`, `RotationSteps.count`, `Radius.value`, `Score.points`, `StarCount.value`, `MoveCount.value`, `GoalCount.value`, `TileValue.value`, `Seed.value`, `GeneratorState.value`, `TraySlot.index`, `PieceId.value`, `PieceRef.index`, `LevelNumber.value`, `LevelVersion.value`, `Difficulty.value`, `ElapsedTime.seconds`, `StackSizeRange.min/max`, `SpawnOdds.fourPerHundred` | The representation of the value object; the value object validates it. Only the topology and the board renderer of the same topology read `Coordinate.components`. |
| Counts | `Shape.size`, `Figure.area`, `PieceCatalog.size`, `LineClear.lineCount`, `ClearReport.cellsPlaced` and `linesCleared`, `TopBlock.size`, `ColorStack.height`, `GoalCount.plus(count)`, `HistoryCapacity.steps(count)` and `allows(size)`, `PieceCatalog.entryAt(index)` | A cardinality used in arithmetic (scores, checks); a value object would only wrap a number of things. |
| Raw random numbers | `IRandomSource.next()`, `nextBelow(bound)`, `RandomDraw<int>`, `SpawnSlot.draw`, `SpawnOdds.valueFor(draw)` | A 32-bit word is the domain of the generator itself; recipes turn it into domain values at once. |
| Keys and diagnostics | `RejectionReason.code`, `EventKind.name`, `DomainError.message`, `InvalidLevelError.check`, `ColorId.key` | Translation keys, map keys and error texts; wrapped in a value object where other code uses them, and nothing branches on their text. |
| `DateTime`, `Duration` | `Clock.now()`, `ResultDate.instant`, `GameStopwatch` fields, `ElapsedTime.truncating` | Dart's own immutable time values at the port; the domain wraps them in `ResultDate` and `ElapsedTime` before any rule uses them. |
| `String` and `int` in layer-2 view data | `VariantTexts`, `StatLine`, `CellView.label`, `ColorToken.key`, `SavedGame.payload`, `DownloadedLevel.payload`, `LeaderboardEntry.position` and `displayName`, `UserId`, `Email`, `Password`, `AccessToken`, `LanguageCode` | Display text, translation keys and opaque payloads for the screen and the adapters; the identifiers and credentials are wrapped in value objects. |

DTOs of layer 3 (`LevelDto`, `ProgressDto`, `LeaderboardEntryDto`) hold primitives by design: they are the boundary, and the mappers convert them.

## 14. Model choices to confirm as game rules

The model takes these choices; a game rule should confirm them before the code depends on them:

- **Hexa Fit rotates only free pieces.** `HexaFitRules.validate` refuses to rotate a placed piece; FIT-4's example rotates a free piece. To turn a placed piece, the player lifts it first.
- **Hexa Sort tray stacks.** `StackRecipe` draws a size uniformly in the level's range and each tile's color uniformly among the level's colors (SORT-6 leaves the distribution open).
- **Hexa Lines catalog entries carry their color**, so a shape always has the same color.

## 15. Class reference

Every class of the model, grouped by package, scope and folder (generated).

<!-- BEGIN GENERATED CLASS-REFERENCE -->
<!-- Generated from docs/diagrams/class-model.json. Edit the model, not this section. -->

### Generic engine (`hexablock_engine`, `core/`)

**Folder `core/geometry`**

#### `Coordinate` — value object

domain · `hexablock_engine` · `core/geometry` · Traces: C-32, ADR-0004, C-31

A cell position as a list of integers. Only the topology and the board renderer of the same topology interpret the numbers; the layer-3 mappers copy them to and from JSON without interpreting them; rules ask the topology.

- **Invariant:** At least one component. The topology that receives it checks the length and the range (ITopology.isValid).
- **Attributes:** `+components: List<int> {readOnly}`

#### `ITopology` — interface

domain · `hexablock_engine` · `core/geometry` · Strategy (strategy) · Traces: ADR-0004, C-31, NFR-02, game-rules Terms

The grid geometry: neighbors, axes, directions, rotation and the fixed order of cells. The board, the rules and the shapes depend on it, never on hexagons. Its id is the name a level file gives in board.topology.

- **Attributes:** `+id: TopologyId {readOnly}`, `+origin: Coordinate {readOnly}`, `+directions: List<Direction> {readOnly}`, `+axes: List<Axis> {readOnly}`, `+fullTurn: RotationSteps {readOnly}`
- **Operations:** `+isValid(at : Coordinate) : bool`, `+neighborsOf(at : Coordinate) : List<Coordinate>`, `+step(from : Coordinate, towards : Direction) : Coordinate`, `+translate(cell : Coordinate, by : Coordinate) : Coordinate`, `+rotate(cell : Coordinate, by : RotationSteps) : Coordinate`, `+rowsAlong(axis : Axis, cells : Set<Coordinate>) : List<CellLine>`, `+inFixedOrder(cells : Iterable<Coordinate>) : List<Coordinate>`, `+orderedTowards(towards : Direction, cells : Iterable<Coordinate>) : List<Coordinate>`, `+regularShape(radius : Radius) : Set<Coordinate>`
- **Relations:** association `TopologyId` [1] id; «use» `Coordinate`; «create» `CellLine`

#### `HexTopology` — class

domain · `hexablock_engine` · `core/geometry` · Strategy (concrete strategy), Single instance (single instance) · Traces: ADR-0004, FR-30, FR-50, FR-60, FIT-2

Hexagonal topology on axial coordinates [q, r]. Rotation by one step maps [q, r] to [-r, q + r]. Fixed order: r ascending, then q ascending. Its id is "hex". Adapted from Red Blob Games, "Hexagonal Grids" (Amit Patel), https://www.redblobgames.com/grids/hexagons/. One instance, registered in the TopologyRegistry by the composition root.

- **Attributes:** `-unitDirections: List<Coordinate> {readOnly}`
- **Operations:** `-q(at : Coordinate) : int`, `-r(at : Coordinate) : int`
- **Relations:** realization `ITopology`

#### `TopologyId` — value object

domain · `hexablock_engine` · `core/geometry` · Traces: ADR-0004, C-32, FR-04

The name of a topology as the level format writes it in board.topology ("hex").

- **Invariant:** non-empty.
- **Attributes:** `+name: String {readOnly}`

#### `TopologyRegistry` — class

domain · `hexablock_engine` · `core/geometry` · Single instance (single instance) · Traces: ADR-0004, C-31, NFR-02, FR-04

The topologies the app knows, keyed by id. The composition root registers them; the level builders resolve the topology a level declares here. It implements the "factory" through which ADR-0004 resolves the topology of a level: a lookup by id of the instances the composition root registered, because a topology has no per-level state to build. A level that names a topology not registered is refused. One instance, injected.

- **Invariant:** one topology per id.
- **Attributes:** `-topologies: Map<TopologyId, ITopology> {readOnly}`
- **Operations:** `+register(topology : ITopology)`, `+isRegistered(id : TopologyId) : bool`, `+resolve(id : TopologyId) : ITopology`
- **Relations:** aggregation `ITopology` [1..*] topologies; «use» `TopologyId`; «create» `InvalidValueError`

#### `Direction` — value object

domain · `hexablock_engine` · `core/geometry` · Traces: C-32, FR-61

One of the directions of a topology (6 in hex). Slides (Merge) and swipes use it.

- **Invariant:** index >= 0 (the topology that issues it checks the upper bound).
- **Attributes:** `+index: int {readOnly}`

#### `Axis` — value object

domain · `hexablock_engine` · `core/geometry` · Traces: C-32, LINES-1, FR-33

One of the axes along which the topology draws straight rows (3 in hex).

- **Invariant:** index >= 0 (the topology that issues it checks the upper bound).
- **Attributes:** `+index: int {readOnly}`

#### `RotationSteps` — value object

domain · `hexablock_engine` · `core/geometry` · Traces: C-32, FR-42, FIT-2, FIT-4

A rotation as a count of the topology's rotation steps (60° each in hex). Fit counts one move per step.

- **Invariant:** count >= 0.
- **Attributes:** `+count: int {readOnly}`
- **Operations:** `+plus(other : RotationSteps) : RotationSteps`, `+within(fullTurn : RotationSteps) : RotationSteps`

#### `Radius` — value object

domain · `hexablock_engine` · `core/geometry` · Traces: C-32, FR-30, FR-50, FR-60

The radius of a regular board (4 for Lines, 2 for Sort and Merge).

- **Invariant:** value >= 0.
- **Attributes:** `+value: int {readOnly}`

#### `Shape` — value object

domain · `hexablock_engine` · `core/geometry` · Traces: C-32, FR-31, FR-40, FIT-2, LINES-5†

A set of cells relative to the origin: a piece outline. It moves and rotates through its topology.

- **Invariant:** At least one cell, all valid in the topology, connected through neighbors.
- **Attributes:** `+cells: Set<Coordinate> {readOnly}`, `+/size: int {readOnly}`, `-topology: ITopology {readOnly}`
- **Operations:** `+placedAt(anchor : Coordinate) : Set<Coordinate>`, `+rotated(by : RotationSteps) : Shape`
- **Relations:** association `ITopology` [1] topology; aggregation `Coordinate` [1..*] cells

#### `CellLine` — value object

domain · `hexablock_engine` · `core/geometry` · Traces: C-32, LINES-1

A maximal straight row of board cells along one axis.

- **Invariant:** At least one cell.
- **Attributes:** `+axis: Axis {readOnly}`, `+cells: List<Coordinate> {readOnly}`
- **Relations:** association `Axis` [1] axis; aggregation `Coordinate` [1..*] cells

**Folder `core/board`**

#### `Board<TCell>` — value object

domain · `hexablock_engine` · `core/board` · Strategy (context) · Traces: C-19, C-19f, ADR-0004, NFR-04, C-32

The immutable board: a set of coordinates of one topology and the content of the occupied ones. Every change returns a new board. HexBoard<TCell> of the assignment is Board<TCell> with a HexTopology. TCell has no bound: the board only stores and returns contents. Its constructor is library-private: BoardBuilder calls it, and the with… operations return boards that keep the invariant. Strategy context of ITopology.

- **Invariant:** Every coordinate is valid in the topology; contents only on board coordinates.
- **Attributes:** `+topology: ITopology {readOnly}`, `+coordinates: List<Coordinate> {readOnly}`, `-contents: Map<Coordinate, TCell> {readOnly}`
- **Operations:** `+contains(at : Coordinate) : bool`, `+cellAt(at : Coordinate) : TCell [0..1]`, `+isEmptyAt(at : Coordinate) : bool`, `+isFull() : bool`, `+emptyCoordinates() : List<Coordinate>`, `+occupied() : Map<Coordinate, TCell>`, `+neighborsOf(at : Coordinate) : List<Coordinate>`, `+neighborTowards(from : Coordinate, towards : Direction) : Coordinate [0..1]`, `+rows() : List<CellLine>`, `+canPlace(cells : Set<Coordinate>) : bool`, `+withCell(at : Coordinate, cell : TCell) : Board<TCell>`, `+withCells(cells : Map<Coordinate, TCell>) : Board<TCell>`, `+withoutCells(cells : Iterable<Coordinate>) : Board<TCell>`
- **Relations:** association `ITopology` [1] topology; aggregation `Coordinate` [1..*] coordinates

#### `BoardBuilder<TCell>` — class

domain · `hexablock_engine` · `core/board` · Builder (builder) · Traces: ADR-0006, C-06, NFR-05

Builds a valid Board step by step: a regular shape or an arbitrary set of cells (a Fit figure), then initial contents.

- **Attributes:** `-topology: ITopology {readOnly}`, `-cells: Set<Coordinate>`, `-contents: Map<Coordinate, TCell>`
- **Operations:** `+regular(radius : Radius) : BoardBuilder<TCell>`, `+cells(cells : Iterable<Coordinate>) : BoardBuilder<TCell>`, `+withCell(at : Coordinate, cell : TCell) : BoardBuilder<TCell>`, `+build() : Board<TCell>`
- **Relations:** association `ITopology` [1] topology; «create» `Board`; «create» `InvalidBoardError`

**Folder `core/errors`**

#### `DomainError` — abstract

domain · `hexablock_engine` · `core/errors` · Traces: C-32, NFR-05

Base of the errors a domain object raises when asked to break an invariant.

- **Attributes:** `+message: String {readOnly}`

#### `InvalidValueError` — class

domain · `hexablock_engine` · `core/errors` · Traces: C-32

A value object refused its input (for example Radius(-1)).

- **Relations:** generalization `DomainError`

#### `InvalidBoardError` — class

domain · `hexablock_engine` · `core/errors` · Traces: ADR-0006

BoardBuilder refused a board (invalid coordinate, content outside the board).

- **Relations:** generalization `DomainError`

#### `InvalidLevelError` — class

domain · `hexablock_engine` · `core/errors` · Traces: ADR-0006, FR-04, FR-14, FIT-1

A level builder refused a level; check names the failed check of the level format (for example F1, S2, L1), or board.topology when the level names a topology that is not registered.

- **Attributes:** `+check: String {readOnly}`
- **Relations:** generalization `DomainError`

**Folder `core/engine`**

#### `IGameRules<TCell, TMove, TState>` — interface

domain · `hexablock_engine` · `core/engine` · Strategy (strategy) · Traces: C-19, C-19c, C-06, C-20, NFR-01

The rules of one variant: the steps of the game cycle that vary. GameEngine delegates each step to it.

- **Operations:** `+boardOf(state : TState) : Board<TCell>`, `+validate(state : TState, move : TMove) : MoveValidation`, `+apply(state : TState, move : TMove) : TState`, `+resolve(state : TState) : Resolution<TState>`, `+evaluate(state : TState) : GameEnd`, `+outcomeOf(state : TState) : GameOutcome`
- **Relations:** «use» `MoveValidation`; «use» `Resolution`; «use» `GameOutcome`

#### `GameEngine<TCell, TMove, TState>` — class

domain · `hexablock_engine` · `core/engine` · Strategy (context), State (context), Observer (subject) · Traces: C-19, C-19c, C-20, NFR-01, NFR-04, FR-03

The generic engine. Runs the cycle for every move: phase accepts it → validate → apply → resolve → evaluate → phase transition → notify listeners with one StateChange that names its cause. Concrete; it never asks which variant it runs. restore replaces the state for the undo history: the state, not the engine, is the Memento originator. Scoring happens inside the rules' resolve.

- **Attributes:** `-rules: IGameRules<TCell, TMove, TState> {readOnly}`, `-current: TState`, `-currentPhase: GamePhase`, `-stateListeners: List<IStateListener<TState>>`, `+/state: TState {readOnly}`, `+/phase: GamePhase {readOnly}`, `+/board: Board<TCell> {readOnly}`
- **Operations:** `+submit(move : TMove) : MoveValidation`, `+pause()`, `+resume()`, `+restore(state : TState)`, `+outcome() : GameOutcome`, `+addStateListener(listener : IStateListener<TState>)`, `+removeStateListener(listener : IStateListener<TState>)`, `-notify(change : StateChange<TState>)`
- **Relations:** realization `IRestorable`; association `IGameRules` [1] rules; association `GamePhase` [1] currentPhase; aggregation `IStateListener` [0..*] stateListeners; «send» `StateChange`

#### `IRestorable<TState>` — interface

domain · `hexablock_engine` · `core/engine` · Traces: FR-45, FR-66, C-21

Something whose current state can be replaced by a restored one. The undo history only needs this of the engine (ISP).

- **Operations:** `+restore(state : TState)`

#### `MoveValidation` — value object

domain · `hexablock_engine` · `core/engine` · Traces: C-19c, FR-03, FR-32, FR-41

The answer of validate: accepted, or rejected with a reason.

- **Invariant:** reason is present exactly when the move is rejected.
- **Attributes:** `+isAccepted: bool {readOnly}`, `+reason: RejectionReason [0..1] {readOnly}`
- **Operations:** `static +accepted() : MoveValidation`, `static +rejected(reason : RejectionReason) : MoveValidation`
- **Relations:** association `RejectionReason` [0..1] reason

#### `RejectionReason` — value object

domain · `hexablock_engine` · `core/engine` · Traces: C-32, FR-10, C-19c

Why a move was refused, as a translation key the screen shows (FR-10). Nothing branches on it.

- **Invariant:** code is a non-empty key in kebab case, prefixed by the game id or "engine".
- **Attributes:** `+code: String {readOnly}`

#### `Resolution<TState>` — value object

domain · `hexablock_engine` · `core/engine` · Traces: C-19c

What resolve returns: the settled state and the variant events it produced (lines cleared, cascades, merges).

- **Attributes:** `+state: TState {readOnly}`, `+events: List<GameEvent> {readOnly}`
- **Relations:** aggregation `GameEvent` [0..*] events

#### `GameEnd` — enum

domain · `hexablock_engine` · `core/engine` · Traces: C-19c, FR-06, FR-07, FR-35, FR-43, FR-54, MERGE-1

The verdict of evaluate after each move.

- **Literals:** `ongoing`, `won`, `lost`

#### `GameOutcome` — value object

domain · `hexablock_engine` · `core/engine` · Traces: C-19e, FR-05, FR-06, FIT-3, SORT-7, SCORE-1, SCORE-2, LINES-3

What a finished game measured, for its progress model. Each variant fills only what it has: Lines and Merge a score; Fit the moves and (from the timer capability) the time; Sort score and moves. What a level demands (par, thresholds) lives in the progress model, not here.

- **Attributes:** `+end: GameEnd {readOnly}`, `+score: Score [0..1] {readOnly}`, `+moves: MoveCount [0..1] {readOnly}`, `+time: ElapsedTime [0..1] {readOnly}`
- **Operations:** `+withTime(time : ElapsedTime) : GameOutcome`
- **Relations:** association `GameEnd` [1] end; association `Score` [0..1] score; association `MoveCount` [0..1] moves; association `ElapsedTime` [0..1] time

#### `IGameFactory<TCell, TMove, TState>` — interface

domain · `hexablock_engine` · `core/engine` · Abstract Factory (abstract factory) · Traces: C-06, C-19, C-20, C-21, NFR-01

Creates the family of objects of one variant: board, rules, initial state, capabilities and progress model. One instance per game, configured through its constructor (level, seed, clock).

- **Attributes:** `+gameId: GameId {readOnly}`
- **Operations:** `+createBoard() : Board<TCell>`, `+createRules() : IGameRules<TCell, TMove, TState>`, `+createInitialState(board : Board<TCell>) : TState`, `+createCapabilities(engine : GameEngine<TCell, TMove, TState>) : CapabilitySet`, `+createProgressModel() : IProgressModel`
- **Relations:** «create» `IGameRules`; «create» `Board`; «create» `CapabilitySet`; «create» `IProgressModel`

#### `GameAssembler` — class

domain · `hexablock_engine` · `core/engine` · Abstract Factory (client) · Traces: C-20, C-22, FR-16†

Puts a game together from a factory: creates board, rules and state, builds the engine, then asks the factory for the capabilities that observe it and for the progress model. Never names a variant.

- **Operations:** `static +newGame(factory : IGameFactory<TCell, TMove, TState>) : PreparedGame<TCell, TMove, TState>`, `static +resumeGame(factory : IGameFactory<TCell, TMove, TState>, state : TState) : PreparedGame<TCell, TMove, TState>`
- **Relations:** «use» `IGameFactory`; «create» `GameEngine`; «create» `PreparedGame`

#### `PreparedGame<TCell, TMove, TState>` — value object

domain · `hexablock_engine` · `core/engine` · Traces: C-21, C-20, C-19e

A ready game: the engine, the optional capabilities of its variant and the progress model of this game (with its level's par or thresholds).

- **Attributes:** `+engine: GameEngine<TCell, TMove, TState> {readOnly}`, `+capabilities: CapabilitySet {readOnly}`, `+progressModel: IProgressModel {readOnly}`
- **Relations:** association `GameEngine` [1] engine; association `CapabilitySet` [1] capabilities; association `IProgressModel` [1] progressModel

**Folder `core/rules`**

#### `IMergeable<T>` — interface

domain · `hexablock_engine` · `core/rules` · Traces: C-19f, FR-62, MERGE-2†

A cell content that can merge with an equal one. T is the content type itself (TileValue implements IMergeable<TileValue>); the bound that enforces it sits on the consumer, SlideMergeRule.

- **Operations:** `+canMergeWith(other : T) : bool`, `+mergedWith(other : T) : T`

#### `SlideMergeRule<TCell extends IMergeable<TCell>>` — class

domain · `hexablock_engine` · `core/rules` · Traces: C-19f, NFR-04, FR-61, FR-62, FR-64, MERGE-2†

Slides every content of a board to the edge in one direction and merges equal neighbors once per move. Reusable by any variant whose cells merge.

- **Operations:** `+slide(board : Board<TCell>, towards : Direction) : SlideResult<TCell>`, `+canSlide(board : Board<TCell>) : bool`
- **Relations:** «use» `Board`; «create» `SlideResult`; «use» `IMergeable`

#### `SlideResult<TCell>` — value object

domain · `hexablock_engine` · `core/rules` · Traces: FR-62, FR-65, MERGE-3†

The board after a slide, the values produced by its merges (in fixed order) and whether anything moved.

- **Invariant:** merged is empty when changed is false.
- **Attributes:** `+board: Board<TCell> {readOnly}`, `+merged: List<TCell> {readOnly}`, `+changed: bool {readOnly}`
- **Relations:** association `Board` [1] board

#### `LineClearRule<TCell>` — class

domain · `hexablock_engine` · `core/rules` · Traces: NFR-04, FR-33, LINES-1, LINES-2

Finds the full rows of a board along every axis and empties them in one step; a cell on two full rows is cleared once. TCell has no bound: the rule only asks whether a cell is empty.

- **Operations:** `+clearFullRows(board : Board<TCell>) : LineClear<TCell>`
- **Relations:** «use» `Board`; «create» `LineClear`

#### `LineClear<TCell>` — value object

domain · `hexablock_engine` · `core/rules` · Traces: LINES-2, LINES-3

The board after clearing, the rows cleared and the cells emptied.

- **Invariant:** clearedCells is the union of the cells of lines.
- **Attributes:** `+board: Board<TCell> {readOnly}`, `+lines: List<CellLine> {readOnly}`, `+clearedCells: Set<Coordinate> {readOnly}`, `+/lineCount: int {readOnly}`
- **Relations:** association `Board` [1] board; aggregation `CellLine` [0..*] lines

**Folder `core/phases`**

#### `GamePhase` — abstract

domain · `hexablock_engine` · `core/phases` · State (state) · Traces: C-19c, C-06, FIT-5, FIT-6†

The phase of a game (State pattern). Each phase says whether it accepts moves and which phase follows a pause, a resume or an end.

- **Attributes:** `+kind: PhaseKind {readOnly}`, `+acceptsMoves: bool {readOnly}`, `+isOver: bool {readOnly}`
- **Operations:** `abstract +paused() : GamePhase`, `abstract +resumed() : GamePhase`, `abstract +ended(end : GameEnd) : GamePhase`
- **Relations:** association `PhaseKind` [1] kind

#### `PlayingPhase` — class

domain · `hexablock_engine` · `core/phases` · State (concrete state) · Traces: C-19c, FR-03

Accepts moves. pause → Paused; ended(won) → Won; ended(lost) → Lost; ended(ongoing) → itself.

- **Relations:** generalization `GamePhase`

#### `PausedPhase` — class

domain · `hexablock_engine` · `core/phases` · State (concrete state) · Traces: FIT-5, FIT-6†

Accepts no moves; only resume (→ Playing). Fit's timer stops; the screen hides the board when the game has a timer.

- **Relations:** generalization `GamePhase`

#### `WonPhase` — class

domain · `hexablock_engine` · `core/phases` · State (concrete state) · Traces: FR-06, FR-43, FR-54

Terminal: the player won (Fit, Sort). Accepts nothing.

- **Relations:** generalization `GamePhase`

#### `LostPhase` — class

domain · `hexablock_engine` · `core/phases` · State (concrete state) · Traces: FR-07, FR-35, FR-54, MERGE-1

Terminal: the game is over without a win (Sort defeat; the end of the endless games Lines and Merge, whose result is the score).

- **Relations:** generalization `GamePhase`

#### `PhaseKind` — enum

domain · `hexablock_engine` · `core/phases` · Traces: C-19c

The name of a phase, for events, views and tests.

- **Literals:** `playing`, `paused`, `won`, `lost`

**Folder `core/events`**

#### `GameEvent` — abstract

domain · `hexablock_engine` · `core/events` · Observer (event) · Traces: C-06, C-19c, FR-09

Something that happened in the engine, sent to the listeners inside the StateChange of each move. Immutable. Audio and the screen react to kind and cells (the cells it affects, in order); nobody checks the class of an event.

- **Attributes:** `+kind: EventKind {readOnly}`, `+cells: List<Coordinate> {readOnly}`
- **Relations:** association `EventKind` [1] kind; aggregation `Coordinate` [0..*] cells

#### `EventKind` — value object

domain · `hexablock_engine` · `core/events` · Traces: C-32, FR-09

The key of an event (for example "lines-cleared"). The audio map and the presenters map it to a sound or an animation.

- **Invariant:** name is non-empty kebab case.
- **Attributes:** `+name: String {readOnly}`

#### `MoveApplied` — class

domain · `hexablock_engine` · `core/events` · Traces: C-19c, FIT-4, FIT-5

A move passed validation and was applied.

- **Relations:** generalization `GameEvent`

#### `MoveRejected` — class

domain · `hexablock_engine` · `core/events` · Traces: C-19c, FR-41

A move failed validation; the state did not change.

- **Attributes:** `+reason: RejectionReason {readOnly}`
- **Relations:** generalization `GameEvent`; association `RejectionReason` [1] reason

#### `PhaseChanged` — class

domain · `hexablock_engine` · `core/events` · Traces: C-19c, FIT-5

The phase changed (pause, resume, end).

- **Attributes:** `+from: PhaseKind {readOnly}`, `+to: PhaseKind {readOnly}`
- **Relations:** generalization `GameEvent`

#### `GameWon` — class

domain · `hexablock_engine` · `core/events` · Traces: FR-06, FIT-5

The game ended with a win.

- **Relations:** generalization `GameEvent`

#### `GameLost` — class

domain · `hexablock_engine` · `core/events` · Traces: FR-07, FR-35

The game ended without a win.

- **Relations:** generalization `GameEvent`

#### `StateRestored` — class

domain · `hexablock_engine` · `core/events` · Traces: FR-45, FR-66

Undo or redo replaced the state (cause restored).

- **Relations:** generalization `GameEvent`

#### `IStateListener<TState>` — interface

domain · `hexablock_engine` · `core/events` · Observer (observer) · Traces: C-06, FR-45, FR-66

Receives each change of a game: the state before and after, its cause, its events and the phase. The only listener interface (undo history, stopwatch, session adapter).

- **Operations:** `+onStateChanged(change : StateChange<TState>)`

#### `StateChange<TState>` — value object

domain · `hexablock_engine` · `core/events` · Traces: C-19c, FIT-5, FR-45

One notification: the state before and after, why it changed, the events and the phase after. Listeners decide on cause and phase, never on the class of an event.

- **Attributes:** `+before: TState {readOnly}`, `+after: TState {readOnly}`, `+cause: ChangeCause {readOnly}`, `+events: List<GameEvent> {readOnly}`, `+phase: PhaseKind {readOnly}`
- **Relations:** association `ChangeCause` [1] cause; aggregation `GameEvent` [0..*] events

#### `ChangeCause` — enum

domain · `hexablock_engine` · `core/events` · Traces: C-19c, FR-45, FR-66, FIT-5, FIT-6†

Why the engine notified: a move applied or rejected, a restore (undo, redo), a pause or a resume. The history keeps a snapshot only on moveApplied; the stopwatch starts, pauses and resumes on it.

- **Literals:** `moveApplied`, `moveRejected`, `restored`, `paused`, `resumed`

**Folder `core/capabilities`**

#### `IUndoable` — interface

domain · `hexablock_engine` · `core/capabilities` · Traces: C-21, FR-45, FR-66, FR-37, FR-56

Optional capability: undo the last move.

- **Attributes:** `+/canUndo: bool {readOnly}`
- **Operations:** `+undo()`

#### `IRedoable` — interface

domain · `hexablock_engine` · `core/capabilities` · Traces: C-21, FR-45

Optional capability: redo an undone move.

- **Attributes:** `+/canRedo: bool {readOnly}`
- **Operations:** `+redo()`

#### `ITimed` — interface

domain · `hexablock_engine` · `core/capabilities` · Traces: C-21, FR-44, FIT-5

Optional capability: the game measures its time.

- **Attributes:** `+/elapsed: ElapsedTime {readOnly}`, `+/isRunning: bool {readOnly}`

#### `IRandomSeeded` — interface

domain · `hexablock_engine` · `core/capabilities` · Traces: C-21, NFR-05, SORT-6

Optional capability: the game was started from a seed, so it can be replayed.

- **Attributes:** `+seed: Seed {readOnly}`

#### `CapabilitySet` — value object

domain · `hexablock_engine` · `core/capabilities` · Traces: C-21, C-20, C-22

The optional capabilities of one game, as typed optional fields. Use cases and the screen read the fields; nobody checks the type of the rules or the variant.

- **Invariant:** redo is present only if undo is present.
- **Attributes:** `+undo: IUndoable [0..1] {readOnly}`, `+redo: IRedoable [0..1] {readOnly}`, `+timer: ITimed [0..1] {readOnly}`, `+seeded: IRandomSeeded [0..1] {readOnly}`
- **Operations:** `static +none() : CapabilitySet`
- **Relations:** association `IUndoable` [0..1] undo; association `IRedoable` [0..1] redo; association `ITimed` [0..1] timer; association `IRandomSeeded` [0..1] seeded

#### `SeedRecord` — value object

domain · `hexablock_engine` · `core/capabilities` · Traces: NFR-05, SORT-6

The seeded capability of a game: the seed it started from.

- **Relations:** realization `IRandomSeeded`; association `Seed` [1] seed

**Folder `core/memento`**

#### `ISnapshotable<TSelf, TSnapshot>` — interface

domain · `hexablock_engine` · `core/memento` · Memento (originator) · Traces: C-19f, C-06, FIT-4, SCORE-2, MERGE-4†

A state that exports what undo must bring back and rebuilds itself from it. TSelf is the state type itself, so restoredFrom returns FitState or MergeState without a cast; the bound that enforces it sits on the consumer, SnapshotHistory. What the snapshot leaves out (Fit's move count) is kept from the current state.

- **Operations:** `+toSnapshot() : TSnapshot`, `+restoredFrom(snapshot : TSnapshot) : TSelf`

#### `SnapshotHistory<TState extends ISnapshotable<TState, TSnapshot>, TSnapshot>` — class

domain · `hexablock_engine` · `core/memento` · Memento (caretaker), Observer (concrete observer) · Traces: FR-45, FR-66, FIT-4, SCORE-2, MERGE-4†, C-21

Caretaker. Listens to state changes and refreshes latest on every one, restores included. When the cause is moveApplied it also keeps before.toSnapshot(), within its capacity. undo restores latest.restoredFrom(the last snapshot) into the engine. Never reads a snapshot.

- **Attributes:** `-target: IRestorable<TState> {readOnly}`, `-capacity: HistoryCapacity {readOnly}`, `#past: List<TSnapshot>`, `#latest: TState`
- **Operations:** `+onStateChanged(change : StateChange<TState>)`, `+undo()`
- **Relations:** realization `IUndoable`; realization `IStateListener`; association `IRestorable` [1] target; association `HistoryCapacity` [1] capacity

#### `RedoableSnapshotHistory<TState extends ISnapshotable<TState, TSnapshot>, TSnapshot>` — class

domain · `hexablock_engine` · `core/memento` · Memento (caretaker) · Traces: FR-45, FIT-4

A history that also redoes: undo pushes the snapshot of the state before the undo onto the future stack; redo restores it; a change with cause moveApplied clears the future.

- **Attributes:** `-future: List<TSnapshot>`
- **Operations:** `+undo()`, `+redo()`
- **Relations:** generalization `SnapshotHistory`; realization `IRedoable`

#### `HistoryCapacity` — value object

domain · `hexablock_engine` · `core/memento` · Traces: C-32, FR-45, FR-66

How many snapshots a history keeps: unlimited (Fit) or a number of steps (Merge: 1).

- **Invariant:** steps >= 1 when limited.
- **Attributes:** `-limit: int [0..1] {readOnly}`
- **Operations:** `static +unlimited() : HistoryCapacity`, `static +steps(count : int) : HistoryCapacity`, `+allows(size : int) : bool`

**Folder `core/random`**

#### `IRandomSource` — interface

domain · `hexablock_engine` · `core/random` · Traces: NFR-05, SORT-6, FR-63, FR-16†, MERGE-4†

An immutable pseudo-random generator. Each draw returns the value and the next source, so a state that holds a source can be saved and replayed.

- **Attributes:** `+state: GeneratorState {readOnly}`
- **Operations:** `+next() : RandomDraw<int>`, `+nextBelow(bound : int) : RandomDraw<int>`
- **Relations:** «create» `RandomDraw`

#### `Mulberry32` — class

domain · `hexablock_engine` · `core/random` · Traces: NFR-05, C-14

Mulberry32 generator by Tommy Ettinger (2017, public domain CC0), https://gist.github.com/tommyettinger/46a874533244883189143505d203312c. 32-bit state; increment 0x6D2B79F5. Every operation is masked to 32 bits, because Dart integers are 64-bit. Not equidistributed (about a third of the 32-bit values never appear), which does not matter for a game. nextBelow rejects the biased tail.

- **Attributes:** `-generatorState: GeneratorState {readOnly}`
- **Operations:** `static +fromSeed(seed : Seed) : Mulberry32`, `static +restore(state : GeneratorState) : Mulberry32`
- **Relations:** realization `IRandomSource`; association `GeneratorState` [1] generatorState

#### `IRandomSourceFactory` — interface

domain · `hexablock_engine` · `core/random` · Traces: NFR-05, FR-16†

Creates random sources. Factories of variants receive it, so tests can inject a fake.

- **Operations:** `+fromSeed(seed : Seed) : IRandomSource`, `+restore(state : GeneratorState) : IRandomSource`
- **Relations:** «create» `IRandomSource`

#### `Mulberry32Factory` — class

domain · `hexablock_engine` · `core/random` · Single instance (single instance) · Traces: NFR-05

Creates Mulberry32 sources. One instance, injected by the composition root.

- **Relations:** realization `IRandomSourceFactory`; «create» `Mulberry32`

#### `RandomDraw<T>` — value object

domain · `hexablock_engine` · `core/random` · Traces: NFR-05

A drawn value and the source to draw the next one from.

- **Attributes:** `+value: T {readOnly}`, `+next: IRandomSource {readOnly}`
- **Relations:** association `IRandomSource` [1] next

#### `Seed` — value object

domain · `hexablock_engine` · `core/random` · Traces: C-32, NFR-05, SORT-6

The seed of a game.

- **Invariant:** 0 <= value <= 2^32 - 1.
- **Attributes:** `+value: int {readOnly}`

#### `GeneratorState` — value object

domain · `hexablock_engine` · `core/random` · Traces: C-32, FR-16†, MERGE-4†

The internal state of a generator, saved with the game and in Merge's undo snapshot.

- **Invariant:** 0 <= value <= 2^32 - 1.
- **Attributes:** `+value: int {readOnly}`

**Folder `core/pieces`**

#### `IPieceSource<TPiece>` — interface

domain · `hexablock_engine` · `core/pieces` · Traces: C-19f, NFR-04, FR-31, FR-40, FR-51, FR-63

Where pieces come from: a seeded random source (Lines tray, Sort tray, Merge spawns) or a fixed list (Fit). Immutable. Each implementation narrows the return type of next to itself (a covariant override in Dart), so a state that holds a SeededPieceSource keeps it typed, and can save its generator state, without a cast.

- **Operations:** `+next() : PieceDraw<TPiece, IPieceSource<TPiece>>`
- **Relations:** «create» `PieceDraw`

#### `PieceDraw<TPiece, TSource extends IPieceSource<TPiece>>` — value object

domain · `hexablock_engine` · `core/pieces` · Traces: NFR-05

A piece and the source that gives the following ones.

- **Attributes:** `+piece: TPiece {readOnly}`, `+rest: TSource {readOnly}`

#### `IPieceRecipe<TPiece>` — interface

domain · `hexablock_engine` · `core/pieces` · Strategy (strategy) · Traces: C-06, NFR-04, SORT-6

How a variant turns random numbers into one piece (a catalog entry, a stack, a spawned tile).

- **Operations:** `+draw(random : IRandomSource) : RandomDraw<TPiece>`
- **Relations:** «use» `IRandomSource`

#### `SeededPieceSource<TPiece>` — value object

domain · `hexablock_engine` · `core/pieces` · Strategy (context) · Traces: NFR-05, SORT-6, FR-31, FR-63, FR-16†

A piece source driven by a random source and a recipe. Same seed and recipe give the same pieces.

- **Attributes:** `-random: IRandomSource {readOnly}`, `-recipe: IPieceRecipe<TPiece> {readOnly}`, `+/generatorState: GeneratorState {readOnly}`
- **Operations:** `+next() : PieceDraw<TPiece, SeededPieceSource<TPiece>>`
- **Relations:** realization `IPieceSource`; association `IRandomSource` [1] random; association `IPieceRecipe` [1] recipe

#### `FixedPieceSource<TPiece>` — value object

domain · `hexablock_engine` · `core/pieces` · Traces: FR-40

A piece source over a fixed list, delivered in order. Hexa Fit's factory builds one from the level's pieces and hands them all out at the start with drawAll.

- **Attributes:** `-pieces: List<TPiece> {readOnly}`, `+/isExhausted: bool {readOnly}`
- **Operations:** `+next() : PieceDraw<TPiece, FixedPieceSource<TPiece>>`, `+drawAll() : List<TPiece>`
- **Relations:** realization `IPieceSource`

**Folder `core/time`**

#### `Clock` — interface (output port)

domain · `hexablock_engine` · `core/time` · Traces: NFR-05, FIT-5, C-05

Output port declared in the domain: the current time. SystemClock implements it; tests use a fake.

- **Operations:** `+now() : DateTime`

#### `GameStopwatch<TState>` — class

domain · `hexablock_engine` · `core/time` · Observer (concrete observer) · Traces: FR-44, FIT-5, FIT-6†, NFR-05

Fit's timer. Reads only the cause and the phase of each change: starts on the first moveApplied, pauses on paused, resumes on resumed, stops when the phase is over; reports whole seconds, truncated. Generic only because IStateListener is; it never reads the state.

- **Attributes:** `-clock: Clock {readOnly}`, `-startedAt: DateTime [0..1]`, `-accumulated: Duration`, `-stopped: bool`
- **Operations:** `+onStateChanged(change : StateChange<TState>)`
- **Relations:** realization `ITimed`; realization `IStateListener`; association `Clock` [1] clock; «create» `ElapsedTime`

#### `ElapsedTime` — value object

domain · `hexablock_engine` · `core/time` · Traces: C-32, FIT-3, FIT-5, RANK-1

A playing time in whole seconds.

- **Invariant:** seconds >= 0.
- **Attributes:** `+seconds: int {readOnly}`
- **Operations:** `static +truncating(duration : Duration) : ElapsedTime`, `+atMost(limit : ElapsedTime) : bool`, `+isShorterThan(other : ElapsedTime) : bool`

**Folder `core/progress`**

#### `IScoringPolicy<TState>` — interface

domain · `hexablock_engine` · `core/progress` · Strategy (strategy) · Traces: C-06, C-19, FR-05, LINES-3, SCORE-1, SCORE-2

The points one move earns, from the state before and after it. The rules call it inside resolve. Fit has none (it has no points).

- **Operations:** `+pointsFor(before : TState, after : TState) : Score`

#### `IProgressModel` — interface

domain · `hexablock_engine` · `core/progress` · Strategy (strategy) · Traces: C-19e, C-06, FR-08, FR-36, FR-67, RANK-1

How a game turns its outcome into a result and compares it with the saved best. The variant's factory creates it with what the level demands (par, thresholds). Not generic: it reads only GameOutcome.

- **Attributes:** `+usesLevels: bool {readOnly}`
- **Operations:** `+resultOf(outcome : GameOutcome, at : ResultDate) : GameResult`, `+isBetter(candidate : GameResult, best : GameResult [0..1]) : bool`
- **Relations:** «use» `GameOutcome`; «create» `GameResult`

#### `GameResult` — value object

domain · `hexablock_engine` · `core/progress` · Traces: FR-08, FR-12, RANK-1, RANK-2

The result of one game as it is saved and ranked: a score (Lines, Merge, Sort) or stars, moves and time (Fit, Sort).

- **Invariant:** score or stars is present.
- **Attributes:** `+score: Score [0..1] {readOnly}`, `+stars: StarCount [0..1] {readOnly}`, `+moves: MoveCount [0..1] {readOnly}`, `+time: ElapsedTime [0..1] {readOnly}`, `+achievedAt: ResultDate {readOnly}`
- **Relations:** association `Score` [0..1] score; association `StarCount` [0..1] stars; association `MoveCount` [0..1] moves; association `ElapsedTime` [0..1] time; association `ResultDate` [1] achievedAt

#### `HighScoreProgress` — class

domain · `hexablock_engine` · `core/progress` · Strategy (concrete strategy) · Traces: FR-36, FR-67, RANK-1, C-19e

Progress of the endless games (Lines, Merge): the result is the score; a result is better when its score is higher (RANK-1: the earlier date keeps a tie).

- **Relations:** realization `IProgressModel`

#### `Score` — value object

domain · `hexablock_engine` · `core/progress` · Traces: C-32, FR-05, LINES-3, SCORE-1, SCORE-2

Points.

- **Invariant:** points >= 0.
- **Attributes:** `+points: int {readOnly}`
- **Operations:** `static +zero() : Score`, `+plus(other : Score) : Score`, `+isHigherThan(other : Score) : bool`

#### `StarCount` — value object

domain · `hexablock_engine` · `core/progress` · Traces: C-32, FR-44, FIT-3, SORT-7

Stars of a won level.

- **Invariant:** 1 <= value <= 3.
- **Attributes:** `+value: int {readOnly}`
- **Operations:** `+isMoreThan(other : StarCount) : bool`

#### `MoveCount` — value object

domain · `hexablock_engine` · `core/progress` · Traces: C-32, FIT-4, SORT-7, RANK-1

Moves made. Only grows (FIT-4).

- **Invariant:** value >= 0.
- **Attributes:** `+value: int {readOnly}`
- **Operations:** `static +zero() : MoveCount`, `+next() : MoveCount`, `+advancedBy(steps : RotationSteps) : MoveCount`, `+atMost(limit : MoveCount) : bool`, `+isFewerThan(other : MoveCount) : bool`

#### `ResultDate` — value object

domain · `hexablock_engine` · `core/progress` · Traces: C-32, RANK-1, NFR-05

When a result was achieved, in UTC, from the Clock port.

- **Invariant:** instant is UTC.
- **Attributes:** `+instant: DateTime {readOnly}`
- **Operations:** `+isEarlierThan(other : ResultDate) : bool`

#### `GoalCount` — value object

domain · `hexablock_engine` · `core/progress` · Traces: C-32, FR-53, FR-54, SORT-4, SORT-5

Goals of a Sort level (blocks removed).

- **Invariant:** value >= 0.
- **Attributes:** `+value: int {readOnly}`
- **Operations:** `static +zero() : GoalCount`, `+plus(count : int) : GoalCount`, `+reaches(target : GoalCount) : bool`

**Folder `core/levels`**

#### `GameId` — value object

domain · `hexablock_engine` · `core/levels` · Traces: C-32, FR-21, C-20

The identifier of a variant (for example "hexa-lines"). Mandatory dimension of progress, levels and leaderboards.

- **Invariant:** lowercase letters, digits and hyphens; non-empty.
- **Attributes:** `+value: String {readOnly}`

#### `LevelId` — value object

domain · `hexablock_engine` · `core/levels` · Traces: C-32, FR-04, FR-13

The identifier of a level: "<gameId>-NNN".

- **Invariant:** matches <gameId>-NNN with NNN three digits.
- **Attributes:** `+value: String {readOnly}`, `+/gameId: GameId {readOnly}`

#### `LevelNumber` — value object

domain · `hexablock_engine` · `core/levels` · Traces: C-32, FR-02

The position of a level in its game.

- **Invariant:** value >= 1.
- **Attributes:** `+value: int {readOnly}`

#### `LevelVersion` — value object

domain · `hexablock_engine` · `core/levels` · Traces: C-32, FR-14, LEVEL-1†

The version of a level definition; a download replaces a lower version.

- **Invariant:** value >= 1.
- **Attributes:** `+value: int {readOnly}`
- **Operations:** `+isNewerThan(other : LevelVersion) : bool`

#### `Difficulty` — value object

domain · `hexablock_engine` · `core/levels` · Traces: C-32, FR-46, FR-55, LEVEL-2†

The difficulty of a level.

- **Invariant:** 1 <= value <= 5.
- **Attributes:** `+value: int {readOnly}`

#### `LevelHeader` — value object

domain · `hexablock_engine` · `core/levels` · Traces: FR-04, FR-14, FR-23, LEVEL-2†

What every level shares, whatever its game.

- **Invariant:** id starts with gameId and ends with number (check L1).
- **Attributes:** `+id: LevelId {readOnly}`, `+gameId: GameId {readOnly}`, `+number: LevelNumber {readOnly}`, `+version: LevelVersion {readOnly}`, `+difficulty: Difficulty {readOnly}`
- **Relations:** association `LevelId` [1] id; association `GameId` [1] gameId; association `LevelNumber` [1] number; association `LevelVersion` [1] version; association `Difficulty` [1] difficulty

#### `LevelCatalog` — value object

domain · `hexablock_engine` · `core/levels` · Traces: FR-02, FR-14, LEVEL-1†

The levels of one game: bundled ones merged with downloaded ones (the higher version wins), in number order.

- **Invariant:** one header per level id; all of the same game.
- **Attributes:** `-headers: List<LevelHeader> {readOnly}`
- **Operations:** `+mergedWith(other : LevelCatalog) : LevelCatalog`, `+inOrder() : List<LevelHeader>`, `+accessGiven(completed : Set<LevelId>) : List<LevelAccess>`
- **Relations:** aggregation `LevelHeader` [0..*] headers; «create» `LevelAccess`

#### `LevelAccess` — value object

domain · `hexablock_engine` · `core/levels` · Traces: FR-02, LEVEL-1†

A level as the level select shows it: unlocked or locked, completed or not.

- **Invariant:** a completed level is unlocked.
- **Attributes:** `+header: LevelHeader {readOnly}`, `+isUnlocked: bool {readOnly}`, `+isCompleted: bool {readOnly}`
- **Relations:** association `LevelHeader` [1] header

#### `LevelPar` — value object

domain · `hexablock_engine` · `core/levels` · Traces: FIT-3, FR-44

The move par and time par of a Fit level.

- **Attributes:** `+moves: MoveCount {readOnly}`, `+time: ElapsedTime {readOnly}`
- **Operations:** `+starsFor(moves : MoveCount, time : ElapsedTime) : StarCount`
- **Relations:** association `MoveCount` [1] moves; association `ElapsedTime` [1] time

#### `MoveThresholds` — value object

domain · `hexablock_engine` · `core/levels` · Traces: SORT-7

The two move thresholds of a Sort level.

- **Invariant:** first > second.
- **Attributes:** `+first: MoveCount {readOnly}`, `+second: MoveCount {readOnly}`
- **Operations:** `+starsFor(moves : MoveCount) : StarCount`
- **Relations:** association `MoveCount` [2] thresholds

#### `ColorId` — value object

domain · `hexablock_engine` · `core/levels` · Traces: C-32, FR-31, FR-50, C-31

A color of the palette shared by Lines pieces and Sort tiles (for example "red"). Painters map it to a screen color.

- **Invariant:** key is a non-empty lowercase word.
- **Attributes:** `+key: String {readOnly}`

### Hexa Lines (domain)

**Folder `variants/hexa_lines`**

#### `HexaLinesEngine` — class

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: C-19, C-19f, C-11a

Dart typedef: the generic engine bound to Hexa Lines. Adds no code.

- **Relations:** bind `GameEngine<ColorId, LinesMove, LinesState>`

#### `HexaLinesFactory` — class

domain · `hexablock_engine` · `variants/hexa_lines` · Abstract Factory (concrete factory) · Traces: FR-30, FR-31, FR-37, NFR-05, C-20

Creates the Hexa Lines family: a radius-4 board, the rules with their scoring and line clearing, the first tray from the seed, the seeded capability and the high-score progress model.

- **Attributes:** `+gameId: GameId {readOnly}`, `-catalog: PieceCatalog {readOnly}`, `-seed: Seed {readOnly}`, `-randomSources: IRandomSourceFactory {readOnly}`, `-topology: ITopology {readOnly}`, `-radius: Radius {readOnly}`
- **Operations:** `+createBoard() : Board<ColorId>`, `+createRules() : IGameRules<ColorId, LinesMove, LinesState>`, `+createInitialState(board : Board<ColorId>) : LinesState`, `+createCapabilities(engine : GameEngine<ColorId, LinesMove, LinesState>) : CapabilitySet`, `+createProgressModel() : IProgressModel`
- **Relations:** realization `IGameFactory<ColorId, LinesMove, LinesState>`; association `PieceCatalog` [1] catalog; association `IRandomSourceFactory` [1] randomSources; association `ITopology` [1] topology; «create» `HexaLinesRules`; «create» `LinesState`; «create» `SeedRecord`; «create» `CatalogRecipe`; «create» `HighScoreProgress`

#### `LinesState` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-31, FR-32, FR-34, FR-35, FR-36, FR-16†, LINES-3

The whole state of a Hexa Lines game. Immutable; each transition returns a new one and keeps its own consistency (the placed cells are free; the tray slot held a piece). Saved whole for FR-16, generator included.

- **Invariant:** score >= 0.
- **Attributes:** `+board: Board<ColorId> {readOnly}`, `+tray: Tray {readOnly}`, `+score: Score {readOnly}`, `+streak: Streak {readOnly}`, `+source: SeededPieceSource<LinesPiece> {readOnly}`, `+lastTurn: ClearReport [0..1] {readOnly}`
- **Operations:** `+canPlace(slot : TraySlot, at : Coordinate) : bool`, `+anyPieceFits() : bool`, `+withPiecePlaced(slot : TraySlot, at : Coordinate) : LinesState`, `+withLinesCleared(clear : LineClear<ColorId>) : LinesState`, `+withPointsAdded(points : Score) : LinesState`, `+withTrayRefilled() : LinesState`
- **Relations:** association `Board` [1] board; composition `Tray` [1] tray; association `Score` [1] score; association `Streak` [1] streak; association `SeededPieceSource` [1] source; association `ClearReport` [0..1] lastTurn; «use» `LineClear`

#### `LinesMove` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-32

Place the piece of one tray slot with its origin at a cell.

- **Attributes:** `+slot: TraySlot {readOnly}`, `+at: Coordinate {readOnly}`
- **Relations:** association `TraySlot` [1] slot; association `Coordinate` [1] at

#### `Tray` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-31

The three slots of offered pieces. A taken slot stays empty until the tray is empty and refills.

- **Invariant:** exactly 3 slots; each holds a piece or nothing.
- **Attributes:** `-slots: List<LinesPiece?> {readOnly}`
- **Operations:** `+pieceAt(slot : TraySlot) : LinesPiece [0..1]`, `+offered() : Map<TraySlot, LinesPiece>`, `+taken(slot : TraySlot) : Tray`, `+isEmpty() : bool`, `+refilled(source : SeededPieceSource<LinesPiece>) : TrayRefill`
- **Relations:** aggregation `LinesPiece` [0..3] slots; «create» `TrayRefill`

#### `TrayRefill` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-31, NFR-05

A refilled tray and the piece source after drawing its three pieces.

- **Invariant:** tray is full.
- **Attributes:** `+tray: Tray {readOnly}`, `+source: SeededPieceSource<LinesPiece> {readOnly}`
- **Relations:** association `Tray` [1] tray

#### `TraySlot` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: C-32, FR-31

One of the three tray positions.

- **Invariant:** 0 <= index <= 2.
- **Attributes:** `+index: int {readOnly}`

#### `LinesPiece` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-31, LINES-4†, LINES-5†

A poly-hex of 1 to 5 cells with its color. It never rotates.

- **Invariant:** shape has 1 to 5 cells.
- **Attributes:** `+shape: Shape {readOnly}`, `+color: ColorId {readOnly}`
- **Operations:** `+cellsAt(anchor : Coordinate) : Set<Coordinate>`
- **Relations:** association `Shape` [1] shape; association `ColorId` [1] color

#### `PieceCatalog` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-31, LINES-5†, C-31

The fixed catalog of Hexa Lines pieces, loaded from configuration (no rotation: each orientation is its own entry).

- **Invariant:** at least one entry; every entry has 1 to 5 cells.
- **Attributes:** `-entries: List<LinesPiece> {readOnly}`, `+/size: int {readOnly}`
- **Operations:** `+entryAt(index : int) : LinesPiece`
- **Relations:** aggregation `LinesPiece` [1..*] entries

#### `CatalogRecipe` — class

domain · `hexablock_engine` · `variants/hexa_lines` · Strategy (concrete strategy) · Traces: FR-31, NFR-05

Draws one catalog entry uniformly.

- **Attributes:** `-catalog: PieceCatalog {readOnly}`
- **Operations:** `+draw(random : IRandomSource) : RandomDraw<LinesPiece>`
- **Relations:** realization `IPieceRecipe<LinesPiece>`; association `PieceCatalog` [1] catalog

#### `HexaLinesRules` — class

domain · `hexablock_engine` · `variants/hexa_lines` · Strategy (concrete strategy), Strategy (context) · Traces: FR-32, FR-33, FR-35, LINES-1, LINES-2, LINES-6†, C-19c

Orchestrates; the state holds the logic. validate: state.canPlace(slot, at). apply: state.withPiecePlaced. resolve: LineClearRule finds the full rows, state.withLinesCleared empties them and extends or breaks the streak, the scoring policy gives the points from the states before and after, state.withPointsAdded adds them, state.withTrayRefilled refills an empty tray. evaluate: lost when not state.anyPieceFits(). Strategy context of IScoringPolicy.

- **Attributes:** `-scoring: IScoringPolicy<LinesState> {readOnly}`, `-clearRule: LineClearRule<ColorId> {readOnly}`
- **Operations:** `+boardOf(state : LinesState) : Board<ColorId>`, `+validate(state : LinesState, move : LinesMove) : MoveValidation`, `+apply(state : LinesState, move : LinesMove) : LinesState`, `+resolve(state : LinesState) : Resolution<LinesState>`, `+evaluate(state : LinesState) : GameEnd`, `+outcomeOf(state : LinesState) : GameOutcome`
- **Relations:** realization `IGameRules<ColorId, LinesMove, LinesState>`; association `IScoringPolicy` [1] scoring; association `LineClearRule` [1] clearRule; «create» `LinesCleared`; «create» `TrayRefilled`

#### `Streak` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-34, LINES-3

Consecutive moves that cleared at least one line.

- **Invariant:** count >= 0.
- **Attributes:** `+count: int {readOnly}`
- **Operations:** `+extended() : Streak`, `+broken() : Streak`

#### `ClearReport` — value object

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: LINES-3

What the last move did: cells placed and lines cleared. The scoring policy reads it.

- **Invariant:** cellsPlaced in 1..5; linesCleared >= 0.
- **Attributes:** `+cellsPlaced: int {readOnly}`, `+linesCleared: int {readOnly}`

#### `LinesScoringPolicy` — class

domain · `hexablock_engine` · `variants/hexa_lines` · Strategy (concrete strategy) · Traces: FR-34, LINES-3, FR-05

Points of one move: cells placed + 10 × L × L × streak, where L is the lines cleared by the move.

- **Operations:** `+pointsFor(before : LinesState, after : LinesState) : Score`
- **Relations:** realization `IScoringPolicy<LinesState>`

#### `LinesCleared` — class

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-33, FR-09

One or more lines were cleared; cells are the cleared cells.

- **Attributes:** `+lines: List<CellLine> {readOnly}`, `+streak: Streak {readOnly}`
- **Relations:** generalization `GameEvent`; aggregation `CellLine` [1..*] lines

#### `TrayRefilled` — class

domain · `hexablock_engine` · `variants/hexa_lines` · Traces: FR-31

The tray was empty and got three new pieces; cells is empty.

- **Attributes:** `+tray: Tray {readOnly}`
- **Relations:** generalization `GameEvent`

### Hexa Fit (domain)

**Folder `variants/hexa_fit`**

#### `HexaFitEngine` — class

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: C-19, C-19f, C-11a

Dart typedef: the generic engine bound to Hexa Fit. Adds no code.

- **Relations:** bind `GameEngine<PieceId, FitMove, FitState>`

#### `HexaFitFactory` — class

domain · `hexablock_engine` · `variants/hexa_fit` · Abstract Factory (concrete factory) · Traces: FR-40, FR-44, FR-45, FIT-5, C-21

Creates the Hexa Fit family from one level: the figure as the board, in the topology the level declares, the rules, the state with every piece free (a FixedPieceSource over the level's pieces, taken whole with drawAll), the capabilities undo + redo (unlimited history) and timer (stopwatch on the Clock port), and the progress model with the level's par.

- **Attributes:** `+gameId: GameId {readOnly}`, `-level: FitLevel {readOnly}`, `-clock: Clock {readOnly}`
- **Operations:** `+createBoard() : Board<PieceId>`, `+createRules() : IGameRules<PieceId, FitMove, FitState>`, `+createInitialState(board : Board<PieceId>) : FitState`, `+createCapabilities(engine : GameEngine<PieceId, FitMove, FitState>) : CapabilitySet`, `+createProgressModel() : IProgressModel`
- **Relations:** realization `IGameFactory<PieceId, FitMove, FitState>`; association `FitLevel` [1] level; association `Clock` [1] clock; «create» `HexaFitRules`; «create» `FitState`; «create» `RedoableSnapshotHistory`; «create» `GameStopwatch`; «create» `FixedPieceSource`; «create» `FitLevelProgress`

#### `FitLevel` — entity

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: FR-40, FR-46, FIT-1, FIT-3, FR-04

A Hexa Fit level: its identity is header.id, which stays the same across versions. It holds the topology its file declares. Built only by FitLevelBuilder.

- **Invariant:** figure area = total area of the pieces (F3, FR-40); at least one piece; piece ids unique.
- **Attributes:** `+header: LevelHeader {readOnly}`, `+topology: ITopology {readOnly}`, `+figure: Figure {readOnly}`, `+pieces: List<FitPiece> {readOnly}`, `+par: LevelPar {readOnly}`
- **Relations:** association `LevelHeader` [1] header; association `ITopology` [1] topology; composition `Figure` [1] figure; composition `FitPiece` [1..*] pieces; association `LevelPar` [1] par

#### `Figure` — value object

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: FR-40, FIT-1

The closed figure to cover: an arbitrary set of cells.

- **Invariant:** connected through neighbors and without interior holes, checked on the unbounded grid (FIT-1).
- **Attributes:** `+cells: Set<Coordinate> {readOnly}`, `+/area: int {readOnly}`

#### `FitPiece` — entity

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: FR-40, FIT-2

A piece of a level. Two equal shapes are two pieces with their own identity (FIT-2), which is why it is an entity. FitLevel keeps the ids unique.

- **Invariant:** none beyond its parts.
- **Attributes:** `+id: PieceId {readOnly}`, `+shape: Shape {readOnly}`
- **Relations:** association `PieceId` [1] id; association `Shape` [1] shape

#### `PieceId` — value object

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: C-32, FIT-2

The identity of a piece in its level; the content of a covered board cell.

- **Invariant:** value >= 0 (position in the level).
- **Attributes:** `+value: int {readOnly}`

#### `FitState` — value object

domain · `hexablock_engine` · `variants/hexa_fit` · Memento (originator) · Traces: FR-41, FR-42, FR-43, FIT-4, FR-45

The state of a Hexa Fit game: board covered by piece ids, placements, orientations of the pieces, and the move count. Each transition returns a new state and adds its moves (1, or the rotation steps).

- **Invariant:** a piece is either placed (one placement) or free; the board holds exactly the cells of the placed pieces.
- **Attributes:** `+board: Board<PieceId> {readOnly}`, `+pieces: List<FitPiece> {readOnly}`, `+placements: Map<PieceId, PiecePlacement> {readOnly}`, `+orientations: Map<PieceId, RotationSteps> {readOnly}`, `+moves: MoveCount {readOnly}`
- **Operations:** `+toSnapshot() : FitSnapshot`, `+restoredFrom(snapshot : FitSnapshot) : FitState`, `+isPlaced(piece : PieceId) : bool`, `+freePieces() : List<FitPiece>`, `+isCovered() : bool`, `+canPlace(piece : PieceId, at : Coordinate) : bool`, `+withPlaced(piece : PieceId, at : Coordinate) : FitState`, `+withLifted(piece : PieceId) : FitState`, `+withRotated(piece : PieceId, by : RotationSteps) : FitState`
- **Relations:** realization `ISnapshotable<FitState, FitSnapshot>`; association `Board` [1] board; aggregation `FitPiece` [1..*] pieces; aggregation `PiecePlacement` [0..*] placements; association `MoveCount` [1] moves

#### `FitSnapshot` — value object

domain · `hexablock_engine` · `variants/hexa_fit` · Memento (memento) · Traces: FIT-4, FR-45

Memento of Hexa Fit: board, placements and orientations. No move count and no clock: undo and redo never change them (FIT-4). Only FitState reads it.

- **Attributes:** `+board: Board<PieceId> {readOnly}`, `+placements: Map<PieceId, PiecePlacement> {readOnly}`, `+orientations: Map<PieceId, RotationSteps> {readOnly}`
- **Relations:** association `Board` [1] board

#### `PiecePlacement` — value object

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: FR-41

Where a placed piece sits. Its rotation lives only in FitState.orientations.

- **Attributes:** `+at: Coordinate {readOnly}`
- **Relations:** association `Coordinate` [1] at

#### `FitMove` — sealed

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: FR-41, FR-42, FIT-4

The closed set of Hexa Fit moves (Dart sealed class): place, remove, rotate.

- **Attributes:** `+piece: PieceId {readOnly}`
- **Relations:** association `PieceId` [1] piece

#### `PlaceFitPiece` — value object

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: FR-41, FIT-4

Place a free piece, in its current orientation, with its origin at a cell.

- **Attributes:** `+at: Coordinate {readOnly}`
- **Relations:** generalization `FitMove`

#### `RemoveFitPiece` — value object

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: FR-41, FIT-4

Take a placed piece off the figure.

- **Relations:** generalization `FitMove`

#### `RotateFitPiece` — value object

domain · `hexablock_engine` · `variants/hexa_fit` · Traces: FR-42, FIT-2, FIT-4

Turn a free piece by some rotation steps (each step counts one move).

- **Invariant:** by.count >= 1.
- **Attributes:** `+by: RotationSteps {readOnly}`
- **Relations:** generalization `FitMove`

#### `HexaFitRules` — class

domain · `hexablock_engine` · `variants/hexa_fit` · Strategy (concrete strategy) · Traces: FR-41, FR-42, FR-43, FIT-2, FIT-4, C-19c

Orchestrates; the state holds the logic. validate: place only when state.canPlace; remove only a placed piece; rotate only a free piece (to confirm as a rule). apply: state.withPlaced, withLifted or withRotated. resolve: nothing to settle. evaluate: won when state.isCovered(); never lost (FR-43).

- **Operations:** `+boardOf(state : FitState) : Board<PieceId>`, `+validate(state : FitState, move : FitMove) : MoveValidation`, `+apply(state : FitState, move : FitMove) : FitState`, `+resolve(state : FitState) : Resolution<FitState>`, `+evaluate(state : FitState) : GameEnd`, `+outcomeOf(state : FitState) : GameOutcome`
- **Relations:** realization `IGameRules<PieceId, FitMove, FitState>`

#### `FitLevelBuilder` — class

domain · `hexablock_engine` · `variants/hexa_fit` · Builder (builder) · Traces: ADR-0006, FIT-1, FR-04, FR-14

Builds a valid FitLevel and refuses an invalid one with InvalidLevelError: the topology the level declares must be registered (board.topology), then the Hexa Fit checks of the level format F1–F4 and the common checks (L1, L2), including FIT-1, and it gives each piece a unique id. F5 checks the optional solution, which the game never reads: the API validator and a test over the bundled levels check it, not the builder. It builds the pieces' shapes in the resolved topology.

- **Attributes:** `-topologies: TopologyRegistry {readOnly}`, `-topologyId: TopologyId [0..1]`, `-header: LevelHeader [0..1]`, `-figureCells: Set<Coordinate>`, `-pieceCells: List<Set<Coordinate>>`, `-par: LevelPar [0..1]`
- **Operations:** `+withHeader(header : LevelHeader) : FitLevelBuilder`, `+withTopology(id : TopologyId) : FitLevelBuilder`, `+withFigure(cells : Iterable<Coordinate>) : FitLevelBuilder`, `+withPiece(cells : Iterable<Coordinate>) : FitLevelBuilder`, `+withPar(par : LevelPar) : FitLevelBuilder`, `+build() : FitLevel`
- **Relations:** association `TopologyRegistry` [1] topologies; «create» `FitLevel`; «create» `Shape`; «create» `InvalidLevelError`

#### `FitLevelProgress` — class

domain · `hexablock_engine` · `variants/hexa_fit` · Strategy (concrete strategy) · Traces: FIT-3, FR-44, RANK-1, C-19e

Hexa Fit progress for one level: stars = 1 + (moves <= move par) + (time <= time par); better by stars, then fewer moves, then less time (RANK-1). The factory creates it with the level's par.

- **Attributes:** `-par: LevelPar {readOnly}`
- **Relations:** realization `IProgressModel`; association `LevelPar` [1] par

### Hexa Sort (domain)

**Folder `variants/hexa_sort`**

#### `HexaSortEngine` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: C-19, C-19f, C-11a

Dart typedef: the generic engine bound to Hexa Sort. Adds no code.

- **Relations:** bind `GameEngine<ColorStack, SortMove, SortState>`

#### `HexaSortFactory` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Abstract Factory (concrete factory) · Traces: FR-50, FR-51, FR-56, SORT-6, NFR-05

Creates the Hexa Sort family from one level: a regular board of the level's radius (2 in the bundled levels) in the topology the level declares, the rules with goal, cascade and scoring, the first stack from the level's seed, the seeded capability, and the progress model with the level's thresholds. No undo (FR-56).

- **Attributes:** `+gameId: GameId {readOnly}`, `-level: SortLevel {readOnly}`, `-randomSources: IRandomSourceFactory {readOnly}`
- **Operations:** `+createBoard() : Board<ColorStack>`, `+createRules() : IGameRules<ColorStack, SortMove, SortState>`, `+createInitialState(board : Board<ColorStack>) : SortState`, `+createCapabilities(engine : GameEngine<ColorStack, SortMove, SortState>) : CapabilitySet`, `+createProgressModel() : IProgressModel`
- **Relations:** realization `IGameFactory<ColorStack, SortMove, SortState>`; association `SortLevel` [1] level; association `IRandomSourceFactory` [1] randomSources; «create» `HexaSortRules`; «create» `SortState`; «create» `StackRecipe`; «create» `SeedRecord`; «create» `SortLevelProgress`

#### `SortLevel` — entity

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: FR-50, FR-54, FR-55, SORT-6, SORT-7, FR-04

A Hexa Sort level: its identity is header.id. It holds the topology its file declares. Built only by SortLevelBuilder. The seed lives in the level, so every player gets the same trays.

- **Invariant:** goal >= 1; thresholds.first > thresholds.second.
- **Attributes:** `+header: LevelHeader {readOnly}`, `+topology: ITopology {readOnly}`, `+radius: Radius {readOnly}`, `+goal: GoalCount {readOnly}`, `+tray: TrayParams {readOnly}`, `+thresholds: MoveThresholds {readOnly}`
- **Relations:** association `LevelHeader` [1] header; association `ITopology` [1] topology; association `Radius` [1] radius; association `GoalCount` [1] goal; composition `TrayParams` [1] tray; association `MoveThresholds` [1] thresholds

#### `TrayParams` — value object

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: SORT-6

What the tray generator may draw in one level: the seed, the colors in play and the size range of a stack.

- **Invariant:** at least 2 colors, no color repeated (level format).
- **Attributes:** `+seed: Seed {readOnly}`, `+colors: List<ColorId> {readOnly}`, `+stackSize: StackSizeRange {readOnly}`
- **Relations:** association `Seed` [1] seed; aggregation `ColorId` [2..*] colors; association `StackSizeRange` [1] stackSize

#### `StackSizeRange` — value object

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: SORT-6, SORT-4

The minimum and maximum tiles of a drawn stack. At most 9, so a drawn stack never arrives already holding a block of 10 to remove.

- **Invariant:** 1 <= min <= max <= 9 (S1 and the level format).
- **Attributes:** `+min: int {readOnly}`, `+max: int {readOnly}`

#### `SortLevelBuilder` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Builder (builder) · Traces: ADR-0006, FR-04, FR-14, SORT-6, SORT-7

Builds a valid SortLevel and refuses an invalid one with InvalidLevelError: the topology the level declares must be registered (board.topology), then the Hexa Sort checks of the level format (S1, S2) and the common checks (L1, L2).

- **Attributes:** `-topologies: TopologyRegistry {readOnly}`, `-topologyId: TopologyId [0..1]`, `-header: LevelHeader [0..1]`, `-radius: Radius [0..1]`, `-goal: GoalCount [0..1]`, `-tray: TrayParams [0..1]`, `-thresholds: MoveThresholds [0..1]`
- **Operations:** `+withHeader(header : LevelHeader) : SortLevelBuilder`, `+withTopology(id : TopologyId) : SortLevelBuilder`, `+withBoard(radius : Radius) : SortLevelBuilder`, `+withGoal(goal : GoalCount) : SortLevelBuilder`, `+withTray(tray : TrayParams) : SortLevelBuilder`, `+withThresholds(thresholds : MoveThresholds) : SortLevelBuilder`, `+build() : SortLevel`
- **Relations:** association `TopologyRegistry` [1] topologies; «create» `SortLevel`; «create» `InvalidLevelError`

#### `ColorStack` — value object

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: FR-50, FR-52, SORT-1

A stack of colored tiles, bottom to top; the content of a Sort cell.

- **Invariant:** at least one tile.
- **Attributes:** `+tiles: List<ColorId> {readOnly}`, `+/height: int {readOnly}`
- **Operations:** `+top() : ColorId`, `+topBlock() : TopBlock`, `+withBlockOnTop(block : TopBlock) : ColorStack`, `+withoutTopBlock() : ColorStack [0..1]`
- **Relations:** aggregation `ColorId` [1..*] tiles; «create» `TopBlock`

#### `TopBlock` — value object

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: SORT-1, SORT-4, FR-53

The contiguous run of same-color tiles at the top of a stack: the unit of transfer.

- **Invariant:** size >= 1.
- **Attributes:** `+color: ColorId {readOnly}`, `+size: int {readOnly}`
- **Operations:** `+reachesRemoval() : bool`, `+joinedWith(other : TopBlock) : TopBlock`
- **Relations:** association `ColorId` [1] color

#### `SortState` — value object

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: FR-51, FR-53, FR-54, SORT-5, SORT-6, SORT-7, SCORE-1

The state of a Hexa Sort game: board of stacks, the offered stack, the tray source, goals, moves and score. Each transition returns a new state; goals, moves and score only grow because the transitions only add.

- **Invariant:** goals, moves and score >= 0.
- **Attributes:** `+board: Board<ColorStack> {readOnly}`, `+offered: ColorStack {readOnly}`, `+source: SeededPieceSource<ColorStack> {readOnly}`, `+goals: GoalCount {readOnly}`, `+moves: MoveCount {readOnly}`, `+score: Score {readOnly}`, `+lastTurn: SortTurn [0..1] {readOnly}`
- **Operations:** `+hasEmptyCell() : bool`, `+reaches(goal : GoalCount) : bool`, `+withStackPlaced(at : Coordinate) : SortState`, `+withCascade(result : CascadeResult) : SortState`, `+withPointsAdded(points : Score) : SortState`
- **Relations:** association `Board` [1] board; association `ColorStack` [1] offered; association `SeededPieceSource` [1] source; association `GoalCount` [1] goals; association `MoveCount` [1] moves; association `Score` [1] score; association `SortTurn` [0..1] lastTurn; «use» `CascadeResult`

#### `SortMove` — value object

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: FR-51, SORT-7

Place the offered stack on an empty cell.

- **Attributes:** `+at: Coordinate {readOnly}`
- **Relations:** association `Coordinate` [1] at

#### `SortTurn` — value object

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: SCORE-1, SORT-4

What the last cascade removed; the scoring policy reads it.

- **Invariant:** every removed block has size >= 10.
- **Attributes:** `+removedBlocks: List<TopBlock> {readOnly}`
- **Relations:** aggregation `TopBlock` [0..*] removedBlocks

#### `HexaSortRules` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Strategy (concrete strategy), Strategy (context) · Traces: FR-51, FR-52, FR-53, FR-54, SORT-5, C-19c

Orchestrates; the state holds the logic. validate: the cell is on the board and empty. apply: state.withStackPlaced(at) puts the offered stack there, counts the move and draws the next stack. resolve: CascadeResolver runs the cascade from the placed cell, state.withCascade applies it and counts the goals, the scoring policy gives the points, state.withPointsAdded adds them. evaluate: won when state.reaches(goal), else lost when not state.hasEmptyCell() (SORT-5). Strategy context of IScoringPolicy.

- **Attributes:** `-goal: GoalCount {readOnly}`, `-cascade: CascadeResolver {readOnly}`, `-scoring: IScoringPolicy<SortState> {readOnly}`
- **Operations:** `+boardOf(state : SortState) : Board<ColorStack>`, `+validate(state : SortState, move : SortMove) : MoveValidation`, `+apply(state : SortState, move : SortMove) : SortState`, `+resolve(state : SortState) : Resolution<SortState>`, `+evaluate(state : SortState) : GameEnd`, `+outcomeOf(state : SortState) : GameOutcome`
- **Relations:** realization `IGameRules<ColorStack, SortMove, SortState>`; association `CascadeResolver` [1] cascade; association `IScoringPolicy` [1] scoring

#### `CascadeResolver` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: FR-52, FR-53, SORT-1, SORT-2, SORT-3, SORT-4

The cascade of SORT-1..4: top blocks of the same color move toward the stack with more of that color (tie: SORT-2), in the order of SORT-3, until nothing moves; a block of 10 or more is removed (SORT-4).

- **Operations:** `+resolveFrom(board : Board<ColorStack>, placedAt : Coordinate) : CascadeResult`
- **Relations:** «create» `CascadeResult`; «create» `StackTransferred`; «create» `BlockRemoved`

#### `CascadeResult` — value object

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: SORT-3, SORT-4

The board after the cascade, the blocks removed and the events in the order of SORT-3.

- **Invariant:** every removed block has size >= 10.
- **Attributes:** `+board: Board<ColorStack> {readOnly}`, `+removedBlocks: List<TopBlock> {readOnly}`, `+events: List<GameEvent> {readOnly}`
- **Relations:** association `Board` [1] board; aggregation `TopBlock` [0..*] removedBlocks

#### `StackRecipe` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Strategy (concrete strategy) · Traces: SORT-6, NFR-05

Draws one stack: a size uniform in the level's range, and each tile's color uniform among the level's colors (to confirm as a rule).

- **Attributes:** `-params: TrayParams {readOnly}`
- **Operations:** `+draw(random : IRandomSource) : RandomDraw<ColorStack>`
- **Relations:** realization `IPieceRecipe<ColorStack>`; association `TrayParams` [1] params

#### `SortScoringPolicy` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Strategy (concrete strategy) · Traces: SCORE-1, FR-05

10 points per tile removed in the move.

- **Operations:** `+pointsFor(before : SortState, after : SortState) : Score`
- **Relations:** realization `IScoringPolicy<SortState>`

#### `SortLevelProgress` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Strategy (concrete strategy) · Traces: SORT-7, RANK-1, C-19e

Hexa Sort progress for one level: stars = 1 + thresholds met (SORT-7); better by stars, then fewer moves (RANK-1). The factory creates it with the level's thresholds.

- **Attributes:** `-thresholds: MoveThresholds {readOnly}`
- **Relations:** realization `IProgressModel`; association `MoveThresholds` [1] thresholds

#### `StackTransferred` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: FR-52, SORT-1

A top block moved from one stack to a neighbor; cells are [from, to].

- **Attributes:** `+from: Coordinate {readOnly}`, `+to: Coordinate {readOnly}`, `+block: TopBlock {readOnly}`
- **Relations:** generalization `GameEvent`

#### `BlockRemoved` — class

domain · `hexablock_engine` · `variants/hexa_sort` · Traces: FR-53, SORT-4

A block of 10 or more tiles left the board and counted one goal; cells are [at].

- **Attributes:** `+at: Coordinate {readOnly}`, `+block: TopBlock {readOnly}`
- **Relations:** generalization `GameEvent`

### Hexa Merge (domain)

**Folder `variants/hexa_merge`**

#### `HexaMergeEngine` — class

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: C-19, C-19f, C-11a

Dart typedef: the generic engine bound to Hexa Merge. Adds no code.

- **Relations:** bind `GameEngine<TileValue, MergeMove, MergeState>`

#### `HexaMergeFactory` — class

domain · `hexablock_engine` · `variants/hexa_merge` · Abstract Factory (concrete factory) · Traces: FR-60, FR-63, FR-66, MERGE-3†, NFR-05

Creates the Hexa Merge family: a radius-2 board, the rules with the reusable SlideMergeRule<TileValue>, a state with two spawned tiles, and the capabilities undo (one step, no redo) and seeded, and the high-score progress model.

- **Attributes:** `+gameId: GameId {readOnly}`, `-seed: Seed {readOnly}`, `-randomSources: IRandomSourceFactory {readOnly}`, `-topology: ITopology {readOnly}`, `-radius: Radius {readOnly}`, `-target: TileValue {readOnly}`, `-odds: SpawnOdds {readOnly}`
- **Operations:** `+createBoard() : Board<TileValue>`, `+createRules() : IGameRules<TileValue, MergeMove, MergeState>`, `+createInitialState(board : Board<TileValue>) : MergeState`, `+createCapabilities(engine : GameEngine<TileValue, MergeMove, MergeState>) : CapabilitySet`, `+createProgressModel() : IProgressModel`
- **Relations:** realization `IGameFactory<TileValue, MergeMove, MergeState>`; association `IRandomSourceFactory` [1] randomSources; association `ITopology` [1] topology; association `SpawnOdds` [1] odds; «create» `HexaMergeRules`; «create» `MergeState`; «create» `SnapshotHistory`; «create» `TileSpawnRecipe`; «create» `SeedRecord`; «create» `HighScoreProgress`

#### `TileValue` — value object

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: C-32, FR-60, FR-62, C-19f

A numeric tile: a power of 2. Merges with an equal tile into its double.

- **Invariant:** value is a power of 2 and >= 2.
- **Attributes:** `+value: int {readOnly}`
- **Operations:** `+canMergeWith(other : TileValue) : bool`, `+mergedWith(other : TileValue) : TileValue`, `+reaches(target : TileValue) : bool`, `+asScore() : Score`
- **Relations:** realization `IMergeable<TileValue>`

#### `MergeState` — value object

domain · `hexablock_engine` · `variants/hexa_merge` · Memento (originator) · Traces: FR-60, FR-64, FR-65, FR-66, FR-16†, SCORE-2

The state of a Hexa Merge game. Saved whole for FR-16, generator included. afterSlide sets targetReached when a merged value reaches the target; undoing that move restores targetReached = false, so the notice can show again.

- **Invariant:** score >= 0.
- **Attributes:** `+board: Board<TileValue> {readOnly}`, `+score: Score {readOnly}`, `+source: SeededPieceSource<TileSpawn> {readOnly}`, `+targetReached: bool {readOnly}`, `+lastTurn: MergeTurn [0..1] {readOnly}`
- **Operations:** `+toSnapshot() : MergeSnapshot`, `+restoredFrom(snapshot : MergeSnapshot) : MergeState`, `+afterSlide(result : SlideResult<TileValue>, target : TileValue) : MergeState`, `+withPointsAdded(points : Score) : MergeState`, `+withSpawn() : MergeState`
- **Relations:** realization `ISnapshotable<MergeState, MergeSnapshot>`; association `Board` [1] board; association `Score` [1] score; association `SeededPieceSource` [1] source; association `MergeTurn` [0..1] lastTurn; «use» `SlideResult`

#### `MergeSnapshot` — value object

domain · `hexablock_engine` · `variants/hexa_merge` · Memento (memento) · Traces: SCORE-2, MERGE-4†, FR-66

Memento of Hexa Merge: board, score, the tile source with its generator state, and whether the target was reached. Undo brings back the same next tile (MERGE-4). Only MergeState reads it.

- **Attributes:** `+board: Board<TileValue> {readOnly}`, `+score: Score {readOnly}`, `+source: SeededPieceSource<TileSpawn> {readOnly}`, `+targetReached: bool {readOnly}`
- **Relations:** association `Board` [1] board; association `Score` [1] score

#### `MergeMove` — value object

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: FR-61

Swipe in one of the topology's directions.

- **Attributes:** `+direction: Direction {readOnly}`
- **Relations:** association `Direction` [1] direction

#### `MergeTurn` — value object

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: SCORE-2, FR-63

What the last move did: the values produced by merges and the spawned tile.

- **Invariant:** merged may be empty.
- **Attributes:** `+merged: List<TileValue> {readOnly}`, `+spawned: TileSpawn [0..1] {readOnly}`
- **Relations:** aggregation `TileValue` [0..*] merged; association `TileSpawn` [0..1] spawned

#### `HexaMergeRules` — class

domain · `hexablock_engine` · `variants/hexa_merge` · Strategy (concrete strategy), Strategy (context) · Traces: FR-61, FR-62, FR-63, FR-64, MERGE-1, MERGE-3†, C-19c

Orchestrates; the state holds the logic. validate: refuse a swipe that changes nothing (it never reaches the history). apply: SlideMergeRule slides and merges, state.afterSlide keeps the result, the scoring policy gives the points, state.withPointsAdded adds them. resolve: state.withSpawn adds one tile in an empty cell; TargetReached is raised the first time the target appears. evaluate: lost when SlideMergeRule.canSlide is false (MERGE-1). The game starts with two tiles (MERGE-3). Strategy context of IScoringPolicy.

- **Attributes:** `-slide: SlideMergeRule<TileValue> {readOnly}`, `-scoring: IScoringPolicy<MergeState> {readOnly}`, `-target: TileValue {readOnly}`
- **Operations:** `+boardOf(state : MergeState) : Board<TileValue>`, `+validate(state : MergeState, move : MergeMove) : MoveValidation`, `+apply(state : MergeState, move : MergeMove) : MergeState`, `+resolve(state : MergeState) : Resolution<MergeState>`, `+evaluate(state : MergeState) : GameEnd`, `+outcomeOf(state : MergeState) : GameOutcome`
- **Relations:** realization `IGameRules<TileValue, MergeMove, MergeState>`; association `SlideMergeRule` [1] slide; association `IScoringPolicy` [1] scoring; «create» `TilesMerged`; «create» `TileSpawned`; «create» `TargetReached`

#### `TileSpawn` — value object

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: FR-63

A tile to add after a move: its value and the slot that picks the cell.

- **Invariant:** value is 2 or 4.
- **Attributes:** `+value: TileValue {readOnly}`, `+slot: SpawnSlot {readOnly}`
- **Relations:** association `TileValue` [1] value; association `SpawnSlot` [1] slot

#### `SpawnSlot` — value object

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: FR-63, NFR-05, game-rules Terms

A raw draw that picks one of the empty cells in fixed order (draw modulo the number of empty cells; the bias, below 1 in 10^8 for 19 cells, does not matter in a game).

- **Invariant:** 0 <= draw <= 2^32 - 1.
- **Attributes:** `-draw: int {readOnly}`
- **Operations:** `+cellIn(empty : List<Coordinate>) : Coordinate`

#### `SpawnOdds` — value object

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: FR-63

The chance that a spawned tile is a 4 instead of a 2, per hundred.

- **Invariant:** 0 <= fourPerHundred <= 100.
- **Attributes:** `+fourPerHundred: int {readOnly}`
- **Operations:** `+valueFor(draw : int) : TileValue`

#### `TileSpawnRecipe` — class

domain · `hexablock_engine` · `variants/hexa_merge` · Strategy (concrete strategy) · Traces: FR-63, NFR-05

Draws one TileSpawn: a value from the odds and a raw slot.

- **Attributes:** `-odds: SpawnOdds {readOnly}`
- **Operations:** `+draw(random : IRandomSource) : RandomDraw<TileSpawn>`
- **Relations:** realization `IPieceRecipe<TileSpawn>`; association `SpawnOdds` [1] odds

#### `MergeScoringPolicy` — class

domain · `hexablock_engine` · `variants/hexa_merge` · Strategy (concrete strategy) · Traces: FR-65, SCORE-2

Points of one move: the sum of the merged values; spawned tiles add nothing.

- **Operations:** `+pointsFor(before : MergeState, after : MergeState) : Score`
- **Relations:** realization `IScoringPolicy<MergeState>`

#### `TilesMerged` — class

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: FR-62

One or more merges happened; cells are the cells of the merged tiles.

- **Attributes:** `+values: List<TileValue> {readOnly}`
- **Relations:** generalization `GameEvent`

#### `TileSpawned` — class

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: FR-63

A new tile appeared; cells are [at].

- **Attributes:** `+at: Coordinate {readOnly}`, `+value: TileValue {readOnly}`
- **Relations:** generalization `GameEvent`

#### `TargetReached` — class

domain · `hexablock_engine` · `variants/hexa_merge` · Traces: FR-64, MERGE-1

The target tile appeared for the first time in this game: a notice; play continues. cells are [the target tile].

- **Attributes:** `+target: TileValue {readOnly}`
- **Relations:** generalization `GameEvent`

### Use cases (`hexablock_application`)

**Folder `ports/input`**

#### `StartGameUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-03, C-22, C-20

Start a game of any variant, by game id, level and seed.

- **Operations:** `+start(request : StartGameRequest) : Future<PlayableSession>`

#### `ApplyMoveUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-03, C-22, C-19c

Send one player intent to the active game.

- **Operations:** `+apply(intent : PlayerIntent) : MoveValidation`

#### `UndoMoveUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-45, FR-66, C-21

Undo the last move when the active game offers undo; answers whether it did.

- **Operations:** `+undo() : bool`

#### `RedoMoveUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-45, C-21

Redo an undone move when the active game offers redo.

- **Operations:** `+redo() : bool`

#### `PauseGameUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FIT-5, FIT-6†

Pause the active game (app sent to the background, pause button).

- **Operations:** `+pause()`

#### `ResumeGameUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FIT-5

Resume the active game.

- **Operations:** `+resume()`

#### `SaveProgressUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-08, FR-06, RANK-1, C-19e

Turn a finished game into a result with the session's own progress model and keep it when it beats the saved best.

- **Operations:** `+save(session : PlayableSession) : Future<SaveProgressResult>`

#### `GetProgressUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-08, FR-02

Read the saved best results of one game.

- **Operations:** `+progressOf(gameId : GameId) : Future<List<ProgressRecord>>`

#### `ListLevelsUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-02, LEVEL-1†

List the levels of a level-based game with their lock and completion.

- **Operations:** `+levelsOf(gameId : GameId) : Future<List<LevelAccess>>`

#### `DownloadLevelsUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-14, FR-15

Fetch new or changed level definitions and store them.

- **Operations:** `+download(gameId : GameId) : Future<LevelCatalog>`

#### `SaveGameUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-16†

Save the game in progress when its variant supports it.

- **Operations:** `+saveActive() : Future<bool>`

#### `ResumeSavedGameUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-16†

Resume a saved game of one variant, if there is one.

- **Operations:** `+resumeSaved(gameId : GameId) : Future<PlayableSession?>`

#### `SyncProgressUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-12, FR-15, FR-21

Send the unsynced results to the backend and bring the remote ones.

- **Operations:** `+sync() : Future<void>`

#### `GetLeaderboardUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-13, RANK-1, RANK-2

Read the global leaderboard of a game or a level.

- **Operations:** `+leaderboard(gameId : GameId, levelId : LevelId [0..1]) : Future<List<LeaderboardEntry>>`

#### `RegisterUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-11

Create an account.

- **Operations:** `+register(credentials : Credentials) : Future<UserId>`

#### `SignInUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-11

Sign in.

- **Operations:** `+signIn(credentials : Credentials) : Future<UserId>`

#### `SignOutUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-11

Sign out.

- **Operations:** `+signOut() : Future<void>`

#### `GetPreferencesUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-09, FR-10

Read sound and language preferences.

- **Operations:** `+current() : Future<Preferences>`

#### `UpdatePreferencesUseCase` — interface, use case (input port)

application · `hexablock_application` · `ports/input` · Traces: FR-09, FR-10

Change sound and language preferences and apply them.

- **Operations:** `+update(preferences : Preferences) : Future<void>`

**Folder `services`**

#### `ActiveSession` — class

application · `hexablock_application` · `services` · Single instance (single instance) · Traces: C-22, FR-03

Holds the game being played, shared by the services that act on it. One instance, injected.

- **Attributes:** `-session: PlayableSession [0..1]`, `+/current: PlayableSession [0..1] {readOnly}`
- **Operations:** `+replace(session : PlayableSession)`, `+clear()`
- **Relations:** association `PlayableSession` [0..1] session

#### `GameSessionService` — class

application · `hexablock_application` · `services` · Traces: C-22, C-20, C-21, FR-03, FR-45, FR-66

Implements the game use cases for every variant: finds the variant module by game id, starts its session, forwards intents, and reaches undo, redo and pause through the session's CapabilitySet. No rule and no variant name in it.

- **Attributes:** `-registry: VariantRegistry {readOnly}`, `-seeds: ISeedSource {readOnly}`, `-active: ActiveSession {readOnly}`
- **Operations:** `+start(request : StartGameRequest) : Future<PlayableSession>`, `+apply(intent : PlayerIntent) : MoveValidation`, `+undo() : bool`, `+redo() : bool`, `+pause()`, `+resume()`
- **Relations:** realization `StartGameUseCase`; realization `ApplyMoveUseCase`; realization `UndoMoveUseCase`; realization `RedoMoveUseCase`; realization `PauseGameUseCase`; realization `ResumeGameUseCase`; association `VariantRegistry` [1] registry; association `ISeedSource` [1] seeds; association `ActiveSession` [1] active

#### `ProgressService` — class

application · `hexablock_application` · `services` · Strategy (context) · Traces: FR-08, C-19e, RANK-1, NFR-05

Asks the session's progress model for the result of its outcome and whether it beats the saved best; saves it with the date from Clock. Strategy context of IProgressModel; it never names a variant.

- **Attributes:** `-repository: IProgressRepository {readOnly}`, `-clock: Clock {readOnly}`
- **Operations:** `+save(session : PlayableSession) : Future<SaveProgressResult>`, `+progressOf(gameId : GameId) : Future<List<ProgressRecord>>`
- **Relations:** realization `SaveProgressUseCase`; realization `GetProgressUseCase`; association `IProgressRepository` [1] repository; association `Clock` [1] clock; «use» `PlayableSession`; «use» `IProgressModel`

#### `LevelCatalogService` — class

application · `hexablock_application` · `services` · Traces: FR-02, FR-14, FR-15, LEVEL-1†

Lists the levels of a game with their access, and downloads new or changed definitions.

- **Attributes:** `-levels: ILevelRepository {readOnly}`, `-gateway: ILevelGateway {readOnly}`, `-progress: IProgressRepository {readOnly}`
- **Operations:** `+levelsOf(gameId : GameId) : Future<List<LevelAccess>>`, `+download(gameId : GameId) : Future<LevelCatalog>`
- **Relations:** realization `ListLevelsUseCase`; realization `DownloadLevelsUseCase`; association `ILevelRepository` [1] levels; association `ILevelGateway` [1] gateway; association `IProgressRepository` [1] progress

#### `SavedGameService` — class

application · `hexablock_application` · `services` · Traces: FR-16†

Saves the active game through its saving capability and resumes a saved one through the variant's resumable module.

- **Attributes:** `-registry: VariantRegistry {readOnly}`, `-repository: ISavedGameRepository {readOnly}`, `-active: ActiveSession {readOnly}`
- **Operations:** `+saveActive() : Future<bool>`, `+resumeSaved(gameId : GameId) : Future<PlayableSession?>`
- **Relations:** realization `SaveGameUseCase`; realization `ResumeSavedGameUseCase`; association `VariantRegistry` [1] registry; association `ISavedGameRepository` [1] repository; association `ActiveSession` [1] active

#### `SyncService` — class

application · `hexablock_application` · `services` · Traces: FR-12, FR-15, FR-21

When the player is signed in, pushes unsynced results and pulls remote ones; does nothing offline.

- **Attributes:** `-repository: IProgressRepository {readOnly}`, `-gateway: IProgressGateway {readOnly}`, `-sessions: ISessionStore {readOnly}`
- **Operations:** `+sync() : Future<void>`
- **Relations:** realization `SyncProgressUseCase`; association `IProgressRepository` [1] repository; association `IProgressGateway` [1] gateway; association `ISessionStore` [1] sessions

#### `LeaderboardService` — class

application · `hexablock_application` · `services` · Traces: FR-13

Reads a leaderboard from the backend.

- **Attributes:** `-gateway: ILeaderboardGateway {readOnly}`
- **Operations:** `+leaderboard(gameId : GameId, levelId : LevelId [0..1]) : Future<List<LeaderboardEntry>>`
- **Relations:** realization `GetLeaderboardUseCase`; association `ILeaderboardGateway` [1] gateway

#### `AccountService` — class

application · `hexablock_application` · `services` · Traces: FR-11

Registers, signs in and signs out; keeps the session in the session store.

- **Attributes:** `-gateway: IAccountGateway {readOnly}`, `-sessions: ISessionStore {readOnly}`
- **Operations:** `+register(credentials : Credentials) : Future<UserId>`, `+signIn(credentials : Credentials) : Future<UserId>`, `+signOut() : Future<void>`
- **Relations:** realization `RegisterUseCase`; realization `SignInUseCase`; realization `SignOutUseCase`; association `IAccountGateway` [1] gateway; association `ISessionStore` [1] sessions

#### `PreferencesService` — class

application · `hexablock_application` · `services` · Traces: FR-09, FR-10

Reads and changes preferences, and applies the sound ones to the audio output.

- **Attributes:** `-repository: IPreferencesRepository {readOnly}`, `-audio: IAudioOutput {readOnly}`
- **Operations:** `+current() : Future<Preferences>`, `+update(preferences : Preferences) : Future<void>`
- **Relations:** realization `GetPreferencesUseCase`; realization `UpdatePreferencesUseCase`; association `IPreferencesRepository` [1] repository; association `IAudioOutput` [1] audio

**Folder `ports/output`**

#### `IProgressRepository` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-08, FR-15, NFR-02

Local store of the best result per game and level.

- **Operations:** `+bestOf(gameId : GameId, levelId : LevelId [0..1]) : Future<ProgressRecord?>`, `+save(record : ProgressRecord) : Future<void>`, `+allOf(gameId : GameId) : Future<List<ProgressRecord>>`, `+unsynced() : Future<List<ProgressRecord>>`, `+markSynced(records : List<ProgressRecord>) : Future<void>`

#### `ILevelRepository` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-04, FR-14, NFR-02

Bundled and downloaded level definitions.

- **Operations:** `+catalogOf(gameId : GameId) : Future<LevelCatalog>`, `+storeDownloaded(levels : List<DownloadedLevel>) : Future<void>`

#### `ISavedGameRepository` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-16†, NFR-02

One saved game per variant.

- **Operations:** `+save(game : SavedGame) : Future<void>`, `+load(gameId : GameId) : Future<SavedGame?>`, `+discard(gameId : GameId) : Future<void>`

#### `IPreferencesRepository` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-09, FR-10

Stored preferences.

- **Operations:** `+load() : Future<Preferences>`, `+save(preferences : Preferences) : Future<void>`

#### `ISessionStore` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-11, NFR-06

Secure storage of the signed-in session.

- **Operations:** `+current() : Future<AuthSession?>`, `+keep(session : AuthSession) : Future<void>`, `+clear() : Future<void>`

#### `IProgressGateway` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-12, FR-21, NFR-02

Remote progress API.

- **Operations:** `+push(records : List<ProgressRecord>, session : AuthSession) : Future<void>`, `+pull(session : AuthSession) : Future<List<ProgressRecord>>`

#### `ILeaderboardGateway` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-13, FR-22

Remote leaderboard API.

- **Operations:** `+fetch(gameId : GameId, levelId : LevelId [0..1]) : Future<List<LeaderboardEntry>>`

#### `IAccountGateway` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-11, FR-20

Remote account API.

- **Operations:** `+register(credentials : Credentials) : Future<AuthSession>`, `+signIn(credentials : Credentials) : Future<AuthSession>`

#### `ILevelGateway` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-14, FR-23

Remote level API.

- **Operations:** `+fetchChanged(gameId : GameId, known : LevelCatalog) : Future<List<DownloadedLevel>>`

#### `ISeedSource` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: NFR-05, SORT-6

Seeds for new games of the seeded variants without a level seed (Lines, Merge).

- **Operations:** `+newSeed() : Seed`

#### `IAudioOutput` — interface (output port)

application · `hexablock_application` · `ports/output` · Traces: FR-09, NFR-02

Sound effects and music.

- **Operations:** `+play(cue : EventKind)`, `+applyPreferences(preferences : Preferences)`

**Folder `variants`**

#### `VariantModule` — interface

application · `hexablock_application` · `variants` · Traces: C-20, C-22, NFR-01, C-31

The extension contract of a variant, without type parameters. Each variant registers one; inside it wraps its typed engine in a PlayableSession. A fifth variant adds a module; no use case and no screen changes.

- **Attributes:** `+gameId: GameId {readOnly}`, `+texts: VariantTexts {readOnly}`, `+resumable: IResumableVariant [0..1] {readOnly}`
- **Operations:** `+startSession(request : SessionRequest) : Future<PlayableSession>`
- **Relations:** association `VariantTexts` [1] texts; association `IResumableVariant` [0..1] resumable; «create» `PlayableSession`

#### `IResumableVariant` — interface

application · `hexablock_application` · `variants` · Traces: FR-16†, C-21

Optional part of a module: resume a saved game (Lines, Merge).

- **Operations:** `+resumeSession(saved : SavedGame) : PlayableSession`

#### `VariantRegistry` — class

application · `hexablock_application` · `variants` · Single instance (single instance) · Traces: C-20, C-22, NFR-01

The registered modules, keyed by game id. The composition root registers them; nothing switches on the variant. One instance, injected.

- **Attributes:** `-modules: Map<GameId, VariantModule>`
- **Operations:** `+register(module : VariantModule)`, `+moduleFor(gameId : GameId) : VariantModule`, `+all() : List<VariantModule>`
- **Relations:** aggregation `VariantModule` [0..*] modules

#### `VariantTexts` — value object

application · `hexablock_application` · `variants` · Traces: FR-01, FR-10

Translation keys of a variant: its name and its rules summary.

- **Invariant:** keys non-empty.
- **Attributes:** `+nameKey: String {readOnly}`, `+rulesKey: String {readOnly}`

#### `PlayableSession` — interface

application · `hexablock_application` · `variants` · Adapter (target) · Traces: C-20, C-21, C-22, FR-03

A running game seen without its types: takes neutral intents, gives a neutral view, its capabilities, its progress model, its outcome (with the time, when it has a timer) and a stream of updates.

- **Attributes:** `+gameId: GameId {readOnly}`, `+levelId: LevelId [0..1] {readOnly}`, `+/view: SessionView {readOnly}`, `+capabilities: CapabilitySet {readOnly}`, `+progressModel: IProgressModel {readOnly}`, `+saving: ISaveableSession [0..1] {readOnly}`, `+updates: Stream<SessionUpdate> {readOnly}`
- **Operations:** `+submit(intent : PlayerIntent) : MoveValidation`, `+pause()`, `+resume()`, `+outcome() : GameOutcome`
- **Relations:** association `CapabilitySet` [1] capabilities; association `IProgressModel` [1] progressModel; association `ISaveableSession` [0..1] saving; «use» `SessionView`; «use» `SessionUpdate`; «use» `PlayerIntent`

#### `ISaveableSession` — interface

application · `hexablock_application` · `variants` · Traces: FR-16†, C-21

Optional part of a session: export the whole game.

- **Operations:** `+save() : SavedGame`

#### `StartGameRequest` — value object

application · `hexablock_application` · `variants` · Traces: FR-03, NFR-05

What the screen asks to start.

- **Invariant:** levelId belongs to gameId when present.
- **Attributes:** `+gameId: GameId {readOnly}`, `+levelId: LevelId [0..1] {readOnly}`, `+seed: Seed [0..1] {readOnly}`

#### `SessionRequest` — value object

application · `hexablock_application` · `variants` · Traces: NFR-05, C-20

What a module receives to start a session: the seed is always resolved (from the request, the level or ISeedSource).

- **Attributes:** `+gameId: GameId {readOnly}`, `+levelId: LevelId [0..1] {readOnly}`, `+seed: Seed {readOnly}`

**Folder `session`**

#### `PlayerIntent` — sealed

application · `hexablock_application` · `session` · Traces: C-20, C-22, FR-03

What the player did on screen, independent of the variant (Dart sealed class). Each variant's translator turns it into its move, or ignores it.


#### `TapCell` — value object

application · `hexablock_application` · `session` · Traces: FR-51

Tap on a cell (Sort).

- **Attributes:** `+at: Coordinate {readOnly}`
- **Relations:** generalization `PlayerIntent`

#### `DropPiece` — value object

application · `hexablock_application` · `session` · Traces: FR-32, FR-41

Drop a tray piece on a cell (Lines, Fit).

- **Attributes:** `+piece: PieceRef {readOnly}`, `+at: Coordinate {readOnly}`
- **Relations:** generalization `PlayerIntent`; association `PieceRef` [1] piece

#### `Swipe` — value object

application · `hexablock_application` · `session` · Traces: FR-61

Swipe in a direction (Merge).

- **Attributes:** `+direction: Direction {readOnly}`
- **Relations:** generalization `PlayerIntent`

#### `RotatePiece` — value object

application · `hexablock_application` · `session` · Traces: FR-42

Rotate a tray piece one step (Fit).

- **Attributes:** `+piece: PieceRef {readOnly}`
- **Relations:** generalization `PlayerIntent`; association `PieceRef` [1] piece

#### `LiftPiece` — value object

application · `hexablock_application` · `session` · Traces: FR-41

Lift a placed piece off a cell (Fit).

- **Attributes:** `+at: Coordinate {readOnly}`
- **Relations:** generalization `PlayerIntent`

#### `PieceRef` — value object

application · `hexablock_application` · `session` · Traces: C-20

A piece of the tray view, by position.

- **Invariant:** index >= 0.
- **Attributes:** `+index: int {readOnly}`

#### `SessionView` — value object

application · `hexablock_application` · `session` · Traces: C-20, C-22, FR-03

Everything the game screen draws, the same for every variant.

- **Attributes:** `+board: BoardView {readOnly}`, `+tray: List<PieceView> {readOnly}`, `+stats: List<StatLine> {readOnly}`, `+phase: PhaseKind {readOnly}`
- **Relations:** composition `BoardView` [1] board; composition `PieceView` [0..*] tray; composition `StatLine` [0..*] stats

#### `BoardView` — value object

application · `hexablock_application` · `session` · Traces: C-20, ADR-0004

The board to draw: its topology and one view per cell.

- **Invariant:** no two cell views share a coordinate; each coordinate is valid in the topology.
- **Attributes:** `+topology: ITopology {readOnly}`, `+cells: List<CellView> {readOnly}`
- **Relations:** composition `CellView` [1..*] cells

#### `CellView` — value object

application · `hexablock_application` · `session` · Traces: C-20

One cell to draw: its fills bottom to top and an optional label (a tile value).

- **Attributes:** `+coordinate: Coordinate {readOnly}`, `+fills: List<ColorToken> {readOnly}`, `+label: String [0..1] {readOnly}`
- **Relations:** aggregation `ColorToken` [0..*] fills

#### `ColorToken` — value object

application · `hexablock_application` · `session` · Traces: C-20, C-31

A color the painter knows (a palette key, a tile value or a piece id).

- **Invariant:** key non-empty.
- **Attributes:** `+key: String {readOnly}`

#### `PieceView` — value object

application · `hexablock_application` · `session` · Traces: C-20

A tray piece to draw.

- **Invariant:** cells non-empty.
- **Attributes:** `+ref: PieceRef {readOnly}`, `+cells: Set<Coordinate> {readOnly}`, `+fill: ColorToken {readOnly}`
- **Relations:** association `PieceRef` [1] ref

#### `StatLine` — value object

application · `hexablock_application` · `session` · Traces: FR-03, FR-10

A labeled value on the game screen (score, moves, goals, time).

- **Invariant:** labelKey non-empty.
- **Attributes:** `+labelKey: String {readOnly}`, `+value: String {readOnly}`

#### `SessionUpdate` — value object

application · `hexablock_application` · `session` · Traces: FR-09, C-19c

What a session sends after each change: the new view, one effect per event (for sound and animation) and the phase.

- **Attributes:** `+view: SessionView {readOnly}`, `+effects: List<SessionEffect> {readOnly}`, `+phase: PhaseKind {readOnly}`
- **Relations:** association `SessionView` [1] view; composition `SessionEffect` [0..*] effects

#### `SessionEffect` — value object

application · `hexablock_application` · `session` · Traces: FR-09, C-19c, C-20

One event as the screen and the audio see it: its kind and the cells it affects, in order. The session adapter builds it from any event without asking its class.

- **Attributes:** `+kind: EventKind {readOnly}`, `+cells: List<Coordinate> {readOnly}`
- **Relations:** association `EventKind` [1] kind

#### `SavedGame` — value object

application · `hexablock_application` · `session` · Traces: FR-16†

A game in progress exported by its variant: the game id and an opaque payload only that variant's codec reads.

- **Invariant:** payload non-empty.
- **Attributes:** `+gameId: GameId {readOnly}`, `+payload: String {readOnly}`

#### `ProgressRecord` — value object

application · `hexablock_application` · `session` · Traces: FR-08, FR-12, FR-21

The best result of a game or a level.

- **Invariant:** levelId belongs to gameId when present.
- **Attributes:** `+gameId: GameId {readOnly}`, `+levelId: LevelId [0..1] {readOnly}`, `+best: GameResult {readOnly}`, `+synced: bool {readOnly}`
- **Relations:** association `GameResult` [1] best

#### `SaveProgressResult` — value object

application · `hexablock_application` · `session` · Traces: FR-06, FR-08

The result of a finished game and whether it became the new best.

- **Attributes:** `+record: ProgressRecord {readOnly}`, `+isNewBest: bool {readOnly}`
- **Relations:** association `ProgressRecord` [1] record

#### `DownloadedLevel` — value object

application · `hexablock_application` · `session` · Traces: FR-14, FR-23

A level definition from the API: its header and the raw document in the API level format.

- **Invariant:** payload non-empty.
- **Attributes:** `+header: LevelHeader {readOnly}`, `+payload: String {readOnly}`

#### `LeaderboardEntry` — value object

application · `hexablock_application` · `session` · Traces: FR-13, RANK-1, RANK-2

One row of a leaderboard.

- **Invariant:** position >= 1.
- **Attributes:** `+position: int {readOnly}`, `+userId: UserId {readOnly}`, `+displayName: String {readOnly}`, `+result: GameResult {readOnly}`
- **Relations:** association `UserId` [1] userId; association `GameResult` [1] result

#### `UserId` — value object

application · `hexablock_application` · `session` · Traces: FR-11, RANK-1

The stable id of a user in the backend.

- **Invariant:** non-empty.
- **Attributes:** `+value: String {readOnly}`

#### `Credentials` — value object

application · `hexablock_application` · `session` · Traces: FR-11

Email and password to register or sign in.

- **Invariant:** both valid.
- **Attributes:** `+email: Email {readOnly}`, `+password: Password {readOnly}`
- **Relations:** association `Email` [1] email; association `Password` [1] password

#### `Email` — value object

application · `hexablock_application` · `session` · Traces: FR-11, C-32

An email address.

- **Invariant:** one @ and a dot in the domain.
- **Attributes:** `+value: String {readOnly}`

#### `Password` — value object

application · `hexablock_application` · `session` · Traces: FR-11, NFR-06

A password; never logged, never stored on the device.

- **Invariant:** at least 8 characters.
- **Attributes:** `+value: String {readOnly}`

#### `AuthSession` — value object

application · `hexablock_application` · `session` · Traces: FR-11, FR-20

A signed-in session: the user and the access token.

- **Attributes:** `+userId: UserId {readOnly}`, `+token: AccessToken {readOnly}`
- **Relations:** association `UserId` [1] userId; association `AccessToken` [1] token

#### `AccessToken` — value object

application · `hexablock_application` · `session` · Traces: FR-20, NFR-06

The JWT the API issued.

- **Invariant:** non-empty.
- **Attributes:** `+value: String {readOnly}`

#### `Preferences` — value object

application · `hexablock_application` · `session` · Traces: FR-09, FR-10

Sound and language preferences.

- **Attributes:** `+musicOn: bool {readOnly}`, `+effectsOn: bool {readOnly}`, `+language: LanguageCode {readOnly}`
- **Relations:** association `LanguageCode` [1] language

#### `LanguageCode` — value object

application · `hexablock_application` · `session` · Traces: FR-10

An app language.

- **Invariant:** "es" or "en".
- **Attributes:** `+value: String {readOnly}`

### Interface adapters, generic (`hexablock_adapters`)

**Folder `session`**

#### `GameSessionAdapter<TCell, TMove, TState>` — adapter

adapters · `hexablock_adapters` · `session` · Adapter (adapter), Observer (concrete observer) · Traces: C-20, C-22, C-06, FR-03, FR-16†

Adapts a typed GameEngine to the untyped PlayableSession: translates intents into moves, presents states as views, streams an update after each change with one SessionEffect per event (its kind and cells, never its class), and saves through an optional codec. outcome() adds the elapsed time from capabilities.timer when the game has one. Written once for every variant.

- **Attributes:** `+gameId: GameId {readOnly}`, `+levelId: LevelId [0..1] {readOnly}`, `+capabilities: CapabilitySet {readOnly}`, `+progressModel: IProgressModel {readOnly}`, `-engine: GameEngine<TCell, TMove, TState> {readOnly}`, `-translator: IIntentTranslator<TMove, TState> {readOnly}`, `-presenter: ISessionPresenter<TCell, TState> {readOnly}`, `-codec: IStateCodec<TState> [0..1] {readOnly}`, `-updates: StreamController<SessionUpdate> {readOnly}`
- **Operations:** `+submit(intent : PlayerIntent) : MoveValidation`, `+pause()`, `+resume()`, `+outcome() : GameOutcome`, `+onStateChanged(change : StateChange<TState>)`, `+save() : SavedGame`
- **Relations:** realization `PlayableSession`; realization `IStateListener`; realization `ISaveableSession`; association `GameEngine` [1] engine; association `IIntentTranslator` [1] translator; association `ISessionPresenter` [1] presenter; association `IStateCodec` [0..1] codec; «create» `SessionEffect`

#### `IIntentTranslator<TMove, TState>` — interface

adapters · `hexablock_adapters` · `session` · Traces: C-20, C-22

Turns a neutral intent into a variant move, or null when the intent means nothing in this variant.

- **Operations:** `+toMove(intent : PlayerIntent, state : TState) : TMove [0..1]`

#### `ISessionPresenter<TCell, TState>` — interface

adapters · `hexablock_adapters` · `session` · Traces: C-20, C-22

Turns a variant state into the neutral view of the game screen.

- **Operations:** `+present(state : TState, phase : PhaseKind) : SessionView`

#### `IStateCodec<TState>` — interface

adapters · `hexablock_adapters` · `session` · Traces: FR-16†, NFR-05

Encodes a whole state, generator state included, as a saved-game payload and back.

- **Operations:** `+encode(state : TState) : String`, `+decode(payload : String) : TState`

**Folder `levels`**

#### `LevelDto` — dto

adapters · `hexablock_adapters` · `levels` · Traces: FR-04, FR-14, FR-23

A level document in the API level format, as read from an asset or the API. Primitives only.

- **Attributes:** `+id: String {readOnly}`, `+gameId: String {readOnly}`, `+number: int {readOnly}`, `+version: int {readOnly}`, `+difficulty: int {readOnly}`, `+data: Map<String, Object?> {readOnly}`

#### `ILevelDtoSource` — interface

adapters · `hexablock_adapters` · `levels` · Traces: FR-04, FR-14

Where variant modules read the document of one level. Declared in layer 3, where the level mappers use it.

- **Operations:** `+dtoFor(levelId : LevelId) : Future<LevelDto>`

#### `LocalLevelRepository` — class

adapters · `hexablock_adapters` · `levels` · Traces: FR-04, FR-14, FR-15, NFR-02

Bundled level assets plus downloaded definitions stored in SQLite; the higher version wins.

- **Attributes:** `-assets: IAssetReader {readOnly}`, `-database: SqliteDatabase {readOnly}`, `-headers: LevelHeaderMapper {readOnly}`
- **Operations:** `+catalogOf(gameId : GameId) : Future<LevelCatalog>`, `+storeDownloaded(levels : List<DownloadedLevel>) : Future<void>`, `+dtoFor(levelId : LevelId) : Future<LevelDto>`
- **Relations:** realization `ILevelRepository`; realization `ILevelDtoSource`; association `IAssetReader` [1] assets; association `LevelHeaderMapper` [1] headers

#### `LevelHeaderMapper` — mapper

adapters · `hexablock_adapters` · `levels` · Traces: FR-14, C-32

LevelDto ⇄ LevelHeader and DownloadedLevel.

- **Operations:** `+toHeader(dto : LevelDto) : LevelHeader`, `+toDownloaded(dto : LevelDto) : DownloadedLevel`
- **Relations:** «use» `LevelDto`; «create» `LevelHeader`

#### `IAssetReader` — interface

adapters · `hexablock_adapters` · `levels` · Traces: FR-04, NFR-02

Reads a bundled text asset. Declared in layer 3; the Flutter app implements it, so this package does not import Flutter.

- **Operations:** `+readText(path : String) : Future<String>`

**Folder `persistence`**

#### `SqliteProgressRepository` — class

adapters · `hexablock_adapters` · `persistence` · Traces: FR-08, NFR-02

Progress in SQLite.

- **Attributes:** `-database: SqliteDatabase {readOnly}`, `-mapper: ProgressMapper {readOnly}`
- **Operations:** `+bestOf(gameId : GameId, levelId : LevelId [0..1]) : Future<ProgressRecord?>`, `+save(record : ProgressRecord) : Future<void>`, `+allOf(gameId : GameId) : Future<List<ProgressRecord>>`, `+unsynced() : Future<List<ProgressRecord>>`, `+markSynced(records : List<ProgressRecord>) : Future<void>`
- **Relations:** realization `IProgressRepository`; association `ProgressMapper` [1] mapper

#### `SqliteSavedGameRepository` — class

adapters · `hexablock_adapters` · `persistence` · Traces: FR-16†, NFR-02

Saved games in SQLite.

- **Attributes:** `-database: SqliteDatabase {readOnly}`
- **Operations:** `+save(game : SavedGame) : Future<void>`, `+load(gameId : GameId) : Future<SavedGame?>`, `+discard(gameId : GameId) : Future<void>`
- **Relations:** realization `ISavedGameRepository`

#### `SqlitePreferencesRepository` — class

adapters · `hexablock_adapters` · `persistence` · Traces: FR-09, FR-10

Preferences in SQLite.

- **Attributes:** `-database: SqliteDatabase {readOnly}`
- **Operations:** `+load() : Future<Preferences>`, `+save(preferences : Preferences) : Future<void>`
- **Relations:** realization `IPreferencesRepository`

#### `SecureSessionStore` — class

adapters · `hexablock_adapters` · `persistence` · Traces: FR-11, NFR-06

The signed-in session in the platform's secure storage.

- **Attributes:** `-storage: SecureStorage {readOnly}`
- **Operations:** `+current() : Future<AuthSession?>`, `+keep(session : AuthSession) : Future<void>`, `+clear() : Future<void>`
- **Relations:** realization `ISessionStore`

#### `ProgressMapper` — mapper

adapters · `hexablock_adapters` · `persistence` · Traces: FR-08, FR-21, C-32

ProgressRecord ⇄ ProgressDto (rows and API bodies).

- **Operations:** `+toDto(record : ProgressRecord) : ProgressDto`, `+toRecord(dto : ProgressDto) : ProgressRecord`
- **Relations:** «create» `ProgressDto`; «create» `ProgressRecord`

#### `ProgressDto` — dto

adapters · `hexablock_adapters` · `persistence` · Traces: FR-21

Progress with primitives, as stored and sent.

- **Attributes:** `+gameId: String {readOnly}`, `+levelId: String [0..1] {readOnly}`, `+score: int [0..1] {readOnly}`, `+stars: int [0..1] {readOnly}`, `+moves: int [0..1] {readOnly}`, `+timeSeconds: int [0..1] {readOnly}`, `+achievedAt: String {readOnly}`

**Folder `remote`**

#### `HttpProgressGateway` — class

adapters · `hexablock_adapters` · `remote` · Traces: FR-12, FR-21, NFR-02

Progress API over HTTP.

- **Attributes:** `-client: Client {readOnly}`, `-baseUrl: Uri {readOnly}`, `-mapper: ProgressMapper {readOnly}`
- **Operations:** `+push(records : List<ProgressRecord>, session : AuthSession) : Future<void>`, `+pull(session : AuthSession) : Future<List<ProgressRecord>>`
- **Relations:** realization `IProgressGateway`; association `ProgressMapper` [1] mapper

#### `HttpLeaderboardGateway` — class

adapters · `hexablock_adapters` · `remote` · Traces: FR-13, FR-22

Leaderboard API over HTTP.

- **Attributes:** `-client: Client {readOnly}`, `-baseUrl: Uri {readOnly}`, `-mapper: LeaderboardMapper {readOnly}`
- **Operations:** `+fetch(gameId : GameId, levelId : LevelId [0..1]) : Future<List<LeaderboardEntry>>`
- **Relations:** realization `ILeaderboardGateway`; association `LeaderboardMapper` [1] mapper

#### `LeaderboardMapper` — mapper

adapters · `hexablock_adapters` · `remote` · Traces: FR-13, C-32

LeaderboardEntryDto → LeaderboardEntry.

- **Operations:** `+toEntry(dto : LeaderboardEntryDto) : LeaderboardEntry`
- **Relations:** «use» `LeaderboardEntryDto`; «create» `LeaderboardEntry`

#### `LeaderboardEntryDto` — dto

adapters · `hexablock_adapters` · `remote` · Traces: FR-22

A leaderboard row as the API sends it.

- **Attributes:** `+position: int {readOnly}`, `+userId: String {readOnly}`, `+displayName: String {readOnly}`, `+result: ProgressDto {readOnly}`

#### `HttpAccountGateway` — class

adapters · `hexablock_adapters` · `remote` · Traces: FR-11, FR-20

Account API over HTTP.

- **Attributes:** `-client: Client {readOnly}`, `-baseUrl: Uri {readOnly}`
- **Operations:** `+register(credentials : Credentials) : Future<AuthSession>`, `+signIn(credentials : Credentials) : Future<AuthSession>`
- **Relations:** realization `IAccountGateway`

#### `HttpLevelGateway` — class

adapters · `hexablock_adapters` · `remote` · Traces: FR-14, FR-23

Level API over HTTP.

- **Attributes:** `-client: Client {readOnly}`, `-baseUrl: Uri {readOnly}`, `-headers: LevelHeaderMapper {readOnly}`
- **Operations:** `+fetchChanged(gameId : GameId, known : LevelCatalog) : Future<List<DownloadedLevel>>`
- **Relations:** realization `ILevelGateway`; association `LevelHeaderMapper` [1] headers

**Folder `system`**

#### `SystemClock` — class

adapters · `hexablock_adapters` · `system` · Traces: NFR-05, FIT-5

The device clock, in UTC.

- **Operations:** `+now() : DateTime`
- **Relations:** realization `Clock`

#### `SecureSeedSource` — class

adapters · `hexablock_adapters` · `system` · Traces: NFR-05

New seeds from dart:math Random.secure.

- **Operations:** `+newSeed() : Seed`
- **Relations:** realization `ISeedSource`

**Folder `audio`**

#### `SoundCueMap` — class

adapters · `hexablock_adapters` · `audio` · Traces: FR-09, C-20

Which sound each event kind plays; unknown kinds play nothing. CompositionRoot builds it with the entries of every variant (one with() line per entry), so a variant names its sounds there.

- **Attributes:** `-cues: Map<EventKind, SoundCue> {readOnly}`
- **Operations:** `+cueFor(kind : EventKind) : SoundCue [0..1]`, `+with(kind : EventKind, cue : SoundCue) : SoundCueMap`
- **Relations:** aggregation `SoundCue` [0..*] cues

#### `SoundCue` — value object

adapters · `hexablock_adapters` · `audio` · Traces: FR-09

A sound asset.

- **Invariant:** asset path non-empty.
- **Attributes:** `+asset: String {readOnly}`

**Folder `presentation`**

#### `HomeViewModel` — viewmodel

adapters · `hexablock_adapters` · `presentation` · Traces: FR-01

The game selector: one card per registered module.

- **Attributes:** `-registry: VariantRegistry {readOnly}`, `+/games: List<VariantTexts> {readOnly}`
- **Operations:** `+open(gameId : GameId)`
- **Relations:** association `VariantRegistry` [1] registry

#### `LevelSelectViewModel` — viewmodel

adapters · `hexablock_adapters` · `presentation` · Traces: FR-02

Levels of a level-based game with progress and locks.

- **Attributes:** `-listLevels: ListLevelsUseCase {readOnly}`, `+/levels: List<LevelAccess> {readOnly}`
- **Operations:** `+load(gameId : GameId) : Future<void>`
- **Relations:** association `ListLevelsUseCase` [1] listLevels

#### `GameViewModel` — viewmodel

adapters · `hexablock_adapters` · `presentation` · Traces: FR-03, C-21, C-22, FIT-6†, FR-09

The game screen state for any variant: the view, which buttons to show from the CapabilitySet, the timer, and whether to hide the board while paused (FIT-6). Forwards intents to the use cases.

- **Attributes:** `-startGame: StartGameUseCase {readOnly}`, `-applyMove: ApplyMoveUseCase {readOnly}`, `-undoMove: UndoMoveUseCase {readOnly}`, `-redoMove: RedoMoveUseCase {readOnly}`, `-pauseGame: PauseGameUseCase {readOnly}`, `-resumeGame: ResumeGameUseCase {readOnly}`, `-saveProgress: SaveProgressUseCase {readOnly}`, `-audio: IAudioOutput {readOnly}`, `-session: PlayableSession [0..1]`, `+/view: SessionView [0..1] {readOnly}`, `+/canUndo: bool {readOnly}`, `+/canRedo: bool {readOnly}`, `+/showsTimer: bool {readOnly}`, `+/hidesBoard: bool {readOnly}`
- **Operations:** `+start(request : StartGameRequest) : Future<void>`, `+onIntent(intent : PlayerIntent)`, `+onUndo()`, `+onRedo()`, `+onPause()`, `+onResume()`
- **Relations:** association `StartGameUseCase` [1] startGame; association `ApplyMoveUseCase` [1] applyMove; association `UndoMoveUseCase` [1] undoMove; association `RedoMoveUseCase` [1] redoMove; association `PauseGameUseCase` [1] pauseGame; association `ResumeGameUseCase` [1] resumeGame; association `SaveProgressUseCase` [1] saveProgress; association `IAudioOutput` [1] audio

#### `ResultViewModel` — viewmodel

adapters · `hexablock_adapters` · `presentation` · Traces: FR-06, FR-07

Victory or defeat screen: result, new best, retry.

- **Attributes:** `+/result: SaveProgressResult [0..1] {readOnly}`, `+/won: bool {readOnly}`
- **Operations:** `+retry()`

#### `LeaderboardViewModel` — viewmodel

adapters · `hexablock_adapters` · `presentation` · Traces: FR-13

A leaderboard table.

- **Attributes:** `-getLeaderboard: GetLeaderboardUseCase {readOnly}`, `+/entries: List<LeaderboardEntry> {readOnly}`
- **Operations:** `+load(gameId : GameId, levelId : LevelId [0..1]) : Future<void>`
- **Relations:** association `GetLeaderboardUseCase` [1] getLeaderboard

#### `SettingsViewModel` — viewmodel

adapters · `hexablock_adapters` · `presentation` · Traces: FR-09, FR-10

Sound and language settings.

- **Attributes:** `-getPreferences: GetPreferencesUseCase {readOnly}`, `-updatePreferences: UpdatePreferencesUseCase {readOnly}`, `+/preferences: Preferences [0..1] {readOnly}`
- **Operations:** `+load() : Future<void>`, `+changeMusic(on : bool) : Future<void>`, `+changeEffects(on : bool) : Future<void>`, `+changeLanguage(language : LanguageCode) : Future<void>`
- **Relations:** association `GetPreferencesUseCase` [1] getPreferences; association `UpdatePreferencesUseCase` [1] updatePreferences

#### `AccountViewModel` — viewmodel

adapters · `hexablock_adapters` · `presentation` · Traces: FR-11, FR-12

Register, sign in, sign out, sync.

- **Attributes:** `-register: RegisterUseCase {readOnly}`, `-signIn: SignInUseCase {readOnly}`, `-signOut: SignOutUseCase {readOnly}`, `-syncProgress: SyncProgressUseCase {readOnly}`, `+/user: UserId [0..1] {readOnly}`
- **Operations:** `+submitRegister(credentials : Credentials) : Future<void>`, `+submitSignIn(credentials : Credentials) : Future<void>`, `+submitSignOut() : Future<void>`
- **Relations:** association `RegisterUseCase` [1] register; association `SignInUseCase` [1] signIn; association `SignOutUseCase` [1] signOut; association `SyncProgressUseCase` [1] syncProgress

### Hexa Lines (adapters)

**Folder `variants/hexa_lines`**

#### `HexaLinesModule` — class

adapters · `hexablock_adapters` · `variants/hexa_lines` · Traces: C-20, C-22, NFR-01, FR-30, FR-16†

The Hexa Lines module: registers its game id and texts, builds HexaLinesFactory per game, assembles the engine (with the progress model the factory creates) and wraps it in a GameSessionAdapter. Also resumes saved games.

- **Attributes:** `+gameId: GameId {readOnly}`, `+texts: VariantTexts {readOnly}`, `+resumable: IResumableVariant [0..1] {readOnly}`, `-catalog: PieceCatalog {readOnly}`, `-randomSources: IRandomSourceFactory {readOnly}`, `-topology: ITopology {readOnly}`, `-codec: LinesStateMapper {readOnly}`
- **Operations:** `+startSession(request : SessionRequest) : Future<PlayableSession>`, `+resumeSession(saved : SavedGame) : PlayableSession`
- **Relations:** realization `VariantModule`; realization `IResumableVariant`; «create» `HexaLinesFactory`; «use» `GameAssembler`; «create» `GameSessionAdapter`; association `LinesStateMapper` [1] codec

#### `LinesIntentTranslator` — adapter

adapters · `hexablock_adapters` · `variants/hexa_lines` · Traces: C-20, FR-32

Hexa Lines: DropPiece → LinesMove (slot from the piece ref); other intents mean nothing.

- **Operations:** `+toMove(intent : PlayerIntent, state : LinesState) : LinesMove [0..1]`
- **Relations:** realization `IIntentTranslator<LinesMove, LinesState>`

#### `LinesPresenter` — adapter

adapters · `hexablock_adapters` · `variants/hexa_lines` · Traces: C-20, FR-03, FR-34

Hexa Lines: board colors, the three tray pieces, score and streak.

- **Operations:** `+present(state : LinesState, phase : PhaseKind) : SessionView`
- **Relations:** realization `ISessionPresenter<ColorId, LinesState>`

#### `LinesCatalogMapper` — mapper

adapters · `hexablock_adapters` · `variants/hexa_lines` · Traces: FR-31, LINES-5†, C-31

Reads the fixed Hexa Lines piece catalog from its configuration asset.

- **Attributes:** `-assets: IAssetReader {readOnly}`, `-topology: ITopology {readOnly}`
- **Operations:** `+load() : Future<PieceCatalog>`
- **Relations:** association `IAssetReader` [1] assets; «create» `PieceCatalog`

#### `LinesStateMapper` — mapper

adapters · `hexablock_adapters` · `variants/hexa_lines` · Traces: FR-16†, NFR-05

LinesState ⇄ saved-game payload (JSON with primitives, generator state included). decode rebuilds the board in the injected topology and the piece source from the catalog and a source restored with the saved generator state.

- **Attributes:** `-topology: ITopology {readOnly}`, `-randomSources: IRandomSourceFactory {readOnly}`, `-catalog: PieceCatalog {readOnly}`
- **Operations:** `+encode(state : LinesState) : String`, `+decode(payload : String) : LinesState`
- **Relations:** realization `IStateCodec<LinesState>`; association `ITopology` [1] topology; association `IRandomSourceFactory` [1] randomSources; association `PieceCatalog` [1] catalog

### Hexa Fit (adapters)

**Folder `variants/hexa_fit`**

#### `HexaFitModule` — class

adapters · `hexablock_adapters` · `variants/hexa_fit` · Traces: C-20, C-22, NFR-01, FR-40, FR-46

The Hexa Fit module: registers its game id and texts, builds HexaFitFactory per game, assembles the engine (with the progress model the factory creates) and wraps it in a GameSessionAdapter.

- **Attributes:** `+gameId: GameId {readOnly}`, `+texts: VariantTexts {readOnly}`, `+resumable: IResumableVariant [0..1] {readOnly}`, `-levels: ILevelDtoSource {readOnly}`, `-levelMapper: FitLevelMapper {readOnly}`, `-clock: Clock {readOnly}`
- **Operations:** `+startSession(request : SessionRequest) : Future<PlayableSession>`
- **Relations:** realization `VariantModule`; «create» `HexaFitFactory`; «use» `GameAssembler`; «create» `GameSessionAdapter`; association `ILevelDtoSource` [1] levels; association `FitLevelMapper` [1] levelMapper

#### `FitIntentTranslator` — adapter

adapters · `hexablock_adapters` · `variants/hexa_fit` · Traces: C-20, FR-41, FR-42

Hexa Fit: DropPiece → PlaceFitPiece; LiftPiece → RemoveFitPiece of the piece at that cell; RotatePiece → RotateFitPiece by one step.

- **Operations:** `+toMove(intent : PlayerIntent, state : FitState) : FitMove [0..1]`
- **Relations:** realization `IIntentTranslator<FitMove, FitState>`

#### `FitPresenter` — adapter

adapters · `hexablock_adapters` · `variants/hexa_fit` · Traces: C-20, FR-03, FR-44

Hexa Fit: covered cells by piece, the free pieces in their orientation, moves; time comes from the timer capability.

- **Operations:** `+present(state : FitState, phase : PhaseKind) : SessionView`
- **Relations:** realization `ISessionPresenter<PieceId, FitState>`

#### `FitLevelMapper` — mapper

adapters · `hexablock_adapters` · `variants/hexa_fit` · Traces: FR-04, FR-14, ADR-0006

LevelDto → FitLevel through a new FitLevelBuilder per level, so every check of the format runs, the registered-topology check included. It passes board.topology as a TopologyId; a name TopologyId refuses becomes InvalidLevelError (board.topology).

- **Attributes:** `-topologies: TopologyRegistry {readOnly}`
- **Operations:** `+toLevel(dto : LevelDto) : FitLevel`
- **Relations:** association `TopologyRegistry` [1] topologies; «create» `FitLevelBuilder`; «create» `TopologyId`; «use» `LevelDto`

### Hexa Sort (adapters)

**Folder `variants/hexa_sort`**

#### `HexaSortModule` — class

adapters · `hexablock_adapters` · `variants/hexa_sort` · Traces: C-20, C-22, NFR-01, FR-50, FR-55

The Hexa Sort module: registers its game id and texts, builds HexaSortFactory per game, assembles the engine (with the progress model the factory creates) and wraps it in a GameSessionAdapter.

- **Attributes:** `+gameId: GameId {readOnly}`, `+texts: VariantTexts {readOnly}`, `+resumable: IResumableVariant [0..1] {readOnly}`, `-levels: ILevelDtoSource {readOnly}`, `-levelMapper: SortLevelMapper {readOnly}`, `-randomSources: IRandomSourceFactory {readOnly}`
- **Operations:** `+startSession(request : SessionRequest) : Future<PlayableSession>`
- **Relations:** realization `VariantModule`; «create» `HexaSortFactory`; «use» `GameAssembler`; «create» `GameSessionAdapter`; association `ILevelDtoSource` [1] levels; association `SortLevelMapper` [1] levelMapper

#### `SortIntentTranslator` — adapter

adapters · `hexablock_adapters` · `variants/hexa_sort` · Traces: C-20, FR-51

Hexa Sort: TapCell → SortMove; other intents mean nothing.

- **Operations:** `+toMove(intent : PlayerIntent, state : SortState) : SortMove [0..1]`
- **Relations:** realization `IIntentTranslator<SortMove, SortState>`

#### `SortPresenter` — adapter

adapters · `hexablock_adapters` · `variants/hexa_sort` · Traces: C-20, FR-03, FR-54

Hexa Sort: the stacks as fills bottom to top, the offered stack, goals and moves.

- **Operations:** `+present(state : SortState, phase : PhaseKind) : SessionView`
- **Relations:** realization `ISessionPresenter<ColorStack, SortState>`

#### `SortLevelMapper` — mapper

adapters · `hexablock_adapters` · `variants/hexa_sort` · Traces: FR-04, FR-14, ADR-0006

LevelDto → SortLevel through a new SortLevelBuilder per level, so every check of the format runs, the registered-topology check included. It passes board.topology as a TopologyId; a name TopologyId refuses becomes InvalidLevelError (board.topology). Sort levels use only the regular shape.

- **Attributes:** `-topologies: TopologyRegistry {readOnly}`
- **Operations:** `+toLevel(dto : LevelDto) : SortLevel`
- **Relations:** association `TopologyRegistry` [1] topologies; «create» `SortLevelBuilder`; «create» `TopologyId`; «use» `LevelDto`

### Hexa Merge (adapters)

**Folder `variants/hexa_merge`**

#### `HexaMergeModule` — class

adapters · `hexablock_adapters` · `variants/hexa_merge` · Traces: C-20, C-22, NFR-01, FR-60, FR-16†

The Hexa Merge module: registers its game id and texts, builds HexaMergeFactory per game, assembles the engine (with the progress model the factory creates) and wraps it in a GameSessionAdapter. Also resumes saved games.

- **Attributes:** `+gameId: GameId {readOnly}`, `+texts: VariantTexts {readOnly}`, `+resumable: IResumableVariant [0..1] {readOnly}`, `-randomSources: IRandomSourceFactory {readOnly}`, `-topology: ITopology {readOnly}`, `-codec: MergeStateMapper {readOnly}`
- **Operations:** `+startSession(request : SessionRequest) : Future<PlayableSession>`, `+resumeSession(saved : SavedGame) : PlayableSession`
- **Relations:** realization `VariantModule`; realization `IResumableVariant`; «create» `HexaMergeFactory`; «use» `GameAssembler`; «create» `GameSessionAdapter`; association `MergeStateMapper` [1] codec

#### `MergeIntentTranslator` — adapter

adapters · `hexablock_adapters` · `variants/hexa_merge` · Traces: C-20, FR-61

Hexa Merge: Swipe → MergeMove; other intents mean nothing.

- **Operations:** `+toMove(intent : PlayerIntent, state : MergeState) : MergeMove [0..1]`
- **Relations:** realization `IIntentTranslator<MergeMove, MergeState>`

#### `MergePresenter` — adapter

adapters · `hexablock_adapters` · `variants/hexa_merge` · Traces: C-20, FR-03, FR-64, FR-65

Hexa Merge: tile values as labels and fills, the score, the target notice.

- **Operations:** `+present(state : MergeState, phase : PhaseKind) : SessionView`
- **Relations:** realization `ISessionPresenter<TileValue, MergeState>`

#### `MergeStateMapper` — mapper

adapters · `hexablock_adapters` · `variants/hexa_merge` · Traces: FR-16†, NFR-05

MergeState ⇄ saved-game payload (generator state included). decode rebuilds the board in the injected topology and the tile source from the spawn odds and a source restored with the saved generator state.

- **Attributes:** `-topology: ITopology {readOnly}`, `-randomSources: IRandomSourceFactory {readOnly}`, `-odds: SpawnOdds {readOnly}`
- **Operations:** `+encode(state : MergeState) : String`, `+decode(payload : String) : MergeState`
- **Relations:** realization `IStateCodec<MergeState>`; association `ITopology` [1] topology; association `IRandomSourceFactory` [1] randomSources; association `SpawnOdds` [1] odds

### Frameworks and drivers (`app`)

**Folder `game`**

#### `GameScreen` — class

frameworks · `app` · `game` · Strategy (context) · Traces: C-20, C-22, FR-03, NFR-01

The one game screen for every variant. Draws the SessionView with the board renderer and the painter registered for the game id, animates the cells of each SessionEffect, turns gestures into PlayerIntents, shows undo, redo and the timer from the view model. Never names a variant. Strategy context of IBoardRenderer and ICellPainter.

- **Attributes:** `-viewModel: GameViewModel {readOnly}`, `-renderer: IBoardRenderer {readOnly}`, `-painters: CellPainterRegistry {readOnly}`
- **Operations:** `+build(context : BuildContext) : Widget`
- **Relations:** association `GameViewModel` [1] viewModel; association `IBoardRenderer` [1] renderer; association `CellPainterRegistry` [1] painters

**Folder `rendering`**

#### `IBoardRenderer` — interface

frameworks · `app` · `rendering` · Strategy (strategy) · Traces: ADR-0004, NFR-02, C-31

Draws a board view and maps screen positions and gestures back to cells and directions. One per topology.

- **Operations:** `+paint(canvas : Canvas, board : BoardView, painter : ICellPainter)`, `+cellAt(position : Offset, board : BoardView) : Coordinate [0..1]`, `+directionOf(gesture : Offset) : Direction [0..1]`
- **Relations:** «use» `ICellPainter`

#### `HexBoardRenderer` — class

frameworks · `app` · `rendering` · Strategy (concrete strategy) · Traces: ADR-0004

Renders a hexagonal board with HexLayout.

- **Attributes:** `-layout: HexLayout {readOnly}`
- **Operations:** `+paint(canvas : Canvas, board : BoardView, painter : ICellPainter)`, `+cellAt(position : Offset, board : BoardView) : Coordinate [0..1]`, `+directionOf(gesture : Offset) : Direction [0..1]`
- **Relations:** realization `IBoardRenderer`; association `HexLayout` [1] layout

#### `HexLayout` — class

frameworks · `app` · `rendering` · Traces: ADR-0004, C-14

Axial ⇄ pixel conversion for pointy hexagons. Adapted from Red Blob Games, "Hexagonal Grids", https://www.redblobgames.com/grids/hexagons/.

- **Attributes:** `+cellSize: double {readOnly}`, `+origin: Offset {readOnly}`
- **Operations:** `+toPixel(at : Coordinate) : Offset`, `+toCoordinate(point : Offset) : Coordinate`, `+corners(at : Coordinate) : List<Offset>`

#### `ICellPainter` — interface

frameworks · `app` · `rendering` · Strategy (strategy) · Traces: C-20, C-22, NFR-01

Draws the content of one cell (fills, label) inside the outline the renderer gives. One per variant.

- **Operations:** `+paint(canvas : Canvas, cell : CellView, outline : Path)`

#### `CellPainterRegistry` — class

frameworks · `app` · `rendering` · Single instance (single instance) · Traces: C-20, C-22

Painters by game id, filled by the composition root.

- **Attributes:** `-painters: Map<GameId, ICellPainter>`
- **Operations:** `+register(gameId : GameId, painter : ICellPainter)`, `+painterFor(gameId : GameId) : ICellPainter`
- **Relations:** aggregation `ICellPainter` [0..*] painters

**Folder `platform`**

#### `AudioManager` — class

frameworks · `app` · `platform` · Facade (facade), Single instance (single instance) · Traces: FR-09, C-06, NFR-02

Facade over the audio player: one call plays the cue of an event kind with the current preferences. Implements the IAudioOutput port. One instance, injected.

- **Attributes:** `-cues: SoundCueMap {readOnly}`, `-effects: AudioPlayer {readOnly}`, `-music: AudioPlayer {readOnly}`, `-preferences: Preferences`
- **Operations:** `+play(cue : EventKind)`, `+applyPreferences(preferences : Preferences)`
- **Relations:** realization `IAudioOutput`; association `SoundCueMap` [1] cues

#### `FlutterAssetReader` — class

frameworks · `app` · `platform` · Traces: FR-04

Reads bundled assets with rootBundle.

- **Operations:** `+readText(path : String) : Future<String>`
- **Relations:** realization `IAssetReader`

**Folder `composition`**

#### `CompositionRoot` — class

frameworks · `app` · `composition` · Single instance (creator) · Traces: C-20, C-22, NFR-01, NFR-02

Creates every single instance (topology registry, generator factory, clock, variant registry, audio), registers HexTopology, injects the registry into the level mappers and the topology of their mode into the Lines and Merge modules and their state mappers, which have no level file, picks the board renderer of that same topology, registers the four variant modules and their painters, and wires the services. The only place that names the variants and the topologies.

- **Attributes:** `+registry: VariantRegistry {readOnly}`, `+painters: CellPainterRegistry {readOnly}`
- **Operations:** `+build() : Future<void>`
- **Relations:** association `VariantRegistry` [1] registry; association `CellPainterRegistry` [1] painters; «create» `HexTopology`; «create» `TopologyRegistry`; «create» `SoundCueMap`; «create» `HexaLinesModule`; «create» `HexaFitModule`; «create» `HexaSortModule`; «create» `HexaMergeModule`; «create» `LinesCellPainter`; «create» `FitCellPainter`; «create» `SortCellPainter`; «create» `MergeCellPainter`; «create» `Mulberry32Factory`; «create» `SystemClock`; «create» `AudioManager`; «create» `GameSessionService`

### Hexa Lines (app)

**Folder `variants/hexa_lines`**

#### `LinesCellPainter` — class

frameworks · `app` · `variants/hexa_lines` · Strategy (concrete strategy) · Traces: C-20, FR-30

Paints a filled hexagon in the cell color.

- **Operations:** `+paint(canvas : Canvas, cell : CellView, outline : Path)`
- **Relations:** realization `ICellPainter`; «use» `CellView`

### Hexa Fit (app)

**Folder `variants/hexa_fit`**

#### `FitCellPainter` — class

frameworks · `app` · `variants/hexa_fit` · Strategy (concrete strategy) · Traces: C-20, FR-40

Paints the cell in the color of the piece that covers it, figure cells outlined.

- **Operations:** `+paint(canvas : Canvas, cell : CellView, outline : Path)`
- **Relations:** realization `ICellPainter`; «use» `CellView`

### Hexa Sort (app)

**Folder `variants/hexa_sort`**

#### `SortCellPainter` — class

frameworks · `app` · `variants/hexa_sort` · Strategy (concrete strategy) · Traces: C-20, FR-50

Paints a stack as layered tiles, bottom to top.

- **Operations:** `+paint(canvas : Canvas, cell : CellView, outline : Path)`
- **Relations:** realization `ICellPainter`; «use» `CellView`

### Hexa Merge (app)

**Folder `variants/hexa_merge`**

#### `MergeCellPainter` — class

frameworks · `app` · `variants/hexa_merge` · Strategy (concrete strategy) · Traces: C-20, FR-60

Paints a tile with its value and a color per value.

- **Operations:** `+paint(canvas : Canvas, cell : CellView, outline : Path)`
- **Relations:** realization `ICellPainter`; «use» `CellView`


<!-- END GENERATED CLASS-REFERENCE -->

## 16. Glossary (Spanish – English)

One name per concept, used in code, tests, diagrams and documents. Each row cites the requirement, game rule or ADR that introduces the concept.

| Español | English | Class | Traces |
|---|---|---|---|
| tablero | board | `Board<TCell>` | C-19, ADR-0004 |
| celda | cell | a `Coordinate` of a board | C-19, game-rules *Terms* |
| coordenada | coordinate | `Coordinate` | C-32, ADR-0004 |
| topología | topology | `ITopology`, `HexTopology` | ADR-0004, C-31 |
| identificador de topología | topology id | `TopologyId` | ADR-0004, FR-04, C-32 |
| registro de topologías | topology registry | `TopologyRegistry` | ADR-0004, C-31 |
| eje | axis | `Axis` | LINES-1 |
| dirección | direction | `Direction` | FR-61 |
| línea | line (row) | `CellLine` | LINES-1, FR-33 |
| paso de rotación | rotation step | `RotationSteps` | FR-42, FIT-4 |
| forma | shape | `Shape` | FR-31, FIT-2 |
| radio | radius | `Radius` | FR-30, FR-50, FR-60 |
| motor | engine | `GameEngine` | C-19, C-19c |
| reglas | rules | `IGameRules` | C-19, C-06 |
| jugada | move | `TMove`, `LinesMove`, `FitMove`, `SortMove`, `MergeMove` | C-19, FR-03 |
| estado de la partida | game state | `TState` | C-19 |
| partida | game | one `GameEngine` run | FR-03 |
| fase | phase | `GamePhase` | C-19c |
| jugando / en pausa / ganada / perdida | playing / paused / won / lost | `PhaseKind` | C-19c, FIT-5, FR-06, FR-07 |
| evento | event | `GameEvent` | C-06, FR-09 |
| causa del cambio | change cause | `ChangeCause` | C-19c, FR-45, FIT-5 |
| oyente | listener | `IStateListener` | C-06 |
| efecto (en pantalla) | effect | `SessionEffect` | FR-09, C-20 |
| capacidad | capability | `CapabilitySet` | C-21 |
| deshacer / rehacer | undo / redo | `IUndoable`, `IRedoable` | FR-45, FR-66 |
| foto (de deshacer) | snapshot | `FitSnapshot`, `MergeSnapshot` | FIT-4, SCORE-2, MERGE-4† |
| historial | history | `SnapshotHistory` | FR-45, FR-66 |
| semilla | seed | `Seed` | NFR-05, SORT-6 |
| estado del generador | generator state | `GeneratorState` | NFR-05, FR-16†, MERGE-4† |
| fuente aleatoria | random source | `IRandomSource` | NFR-05 |
| fuente de piezas | piece source | `IPieceSource` | FR-31, FR-40, FR-51, FR-63 |
| receta | recipe | `IPieceRecipe` | SORT-6, FR-63 |
| reloj | clock | `Clock` | NFR-05, FIT-5 |
| cronómetro | stopwatch | `GameStopwatch` | FR-44, FIT-5 |
| tiempo | elapsed time | `ElapsedTime` | FIT-3, FIT-5 |
| puntaje | score | `Score` | FR-05, SCORE-1, SCORE-2, LINES-3 |
| racha | streak | `Streak` | LINES-3 |
| estrellas | stars | `StarCount` | FIT-3, SORT-7 |
| número de jugadas | move count | `MoveCount` | FIT-4, SORT-7 |
| par (de jugadas y de tiempo) | par | `LevelPar` | FIT-3 |
| umbral | threshold | `MoveThresholds` | SORT-7 |
| meta | goal | `GoalCount` | FR-53, SORT-5 |
| resultado | result | `GameResult` | FR-08, RANK-1 |
| desenlace | outcome | `GameOutcome` | C-19e |
| modelo de progreso | progress model | `IProgressModel` | C-19e, RANK-1 |
| política de puntaje | scoring policy | `IScoringPolicy` | FR-05, C-19 |
| nivel | level | `FitLevel`, `SortLevel` | FR-04, FR-46, FR-55 |
| cabecera de nivel | level header | `LevelHeader` | FR-04, FR-14 |
| catálogo de niveles | level catalog | `LevelCatalog` | FR-02, FR-14 |
| dificultad | difficulty | `Difficulty` | LEVEL-2† |
| versión | version | `LevelVersion` | FR-14, LEVEL-1† |
| color | color | `ColorId` | FR-31, FR-50 |
| pieza | piece | `LinesPiece`, `FitPiece` | FR-31, FR-40, FIT-2 |
| catálogo de piezas | piece catalog | `PieceCatalog` | LINES-5† |
| bandeja | tray | `Tray` | FR-31 |
| hueco de la bandeja | tray slot | `TraySlot` | FR-31 |
| figura | figure | `Figure` | FR-40, FIT-1 |
| colocación | placement | `PiecePlacement` | FR-41 |
| pila | stack | `ColorStack` | FR-50, SORT-1 |
| ficha | tile | a tile of a `ColorStack`; `TileValue` in Merge | FR-50, FR-60 |
| bloque superior | top block | `TopBlock` | SORT-1, SORT-4 |
| cascada | cascade | `CascadeResolver` | SORT-1..4 |
| fusión | merge | `IMergeable`, `SlideMergeRule` | FR-62, MERGE-2† |
| deslizar | slide | `SlideMergeRule.slide` | FR-61 |
| aparición de ficha | tile spawn | `TileSpawn` | FR-63 |
| ficha objetivo | target tile | `TargetReached` | FR-64, MERGE-1 |
| tabla de clasificación | leaderboard | `LeaderboardEntry` | FR-13, RANK-1 |
| variante | variant | `VariantModule` | C-20, NFR-01 |
| sesión de juego | game session | `PlayableSession` | C-20, C-22 |
| intención del jugador | player intent | `PlayerIntent` | C-20, FR-03 |
| vista | view | `SessionView` | C-20, FR-03 |
| partida guardada | saved game | `SavedGame` | FR-16† |
| preferencias | preferences | `Preferences` | FR-09, FR-10 |
| caso de uso | use case | input ports, `*UseCase` | C-22 |
| puerto | port | input and output ports | C-05, NFR-02 |
| adaptador | adapter | layer-3 classes | C-05, NFR-02 |
| objeto de valor | value object | `«Value Object»` | C-32 |
| constructor (patrón) | builder | `BoardBuilder`, `FitLevelBuilder`, `SortLevelBuilder` | ADR-0006 |
| fábrica | factory | `IGameFactory` | C-06, C-19 |
