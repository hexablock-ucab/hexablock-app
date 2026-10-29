# Requirements Catalog — HexaBlock Suite

**Status: Draft — pending team review.** The team reviews this catalog in its first meeting and then marks it *Baseline*. After the baseline, IDs are never renumbered or reused: a removed requirement is marked *Withdrawn*.

Source: *Proyecto Semestral HexaBlock Suite*, version 1.0 (2026-10-23), Desarrollo de Software, UCAB, plus guidance the professor gave in class.
This catalog is identical in `hexablock-app` and `hexablock-api`. Change it in both repositories in the same pair of pull requests.

## How to read this catalog

The catalog follows ISO/IEC/IEEE 29148 and tags quality requirements with the ISO/IEC 25010 quality model seen in class.

- **Constraints (C)** restrict how the solution is built, verified, documented or delivered. The assignment imposes them; only the professor can change them.
- **Functional requirements (FR)** state what the system does: a behavior a player or an API client can observe.
- **Non-functional requirements (NFR)** state how well the system does it: a quality attribute with a way to verify it.

Writing rules:

- One requirement per row. When a row lists items (a), (b), (c)…, each item can be cited on its own, for example `C-23e`.
- **shall** marks a mandatory requirement; **should** marks a recommendation.
- Functional requirements use the EARS patterns: *The app shall…*, *When <event>, the app shall…*, *If <unwanted condition>, then the app shall…*.
- `§` is the section of the assignment that states the requirement. *class* means guidance the professor gave in class. *derived* means the team inferred it from the cited sections; the team confirms derived requirements in review.
- `Repo`: **app** is the game client, **api** is the backend, **both** applies to both repositories.
- This catalog states *what*. The acceptance criteria and examples of each piece of work live in its task document (`odd/tasks/`, specs `S#`), which cite these IDs.

## Constraints (C)

| ID | Type | Constraint | Repo | § |
|---|---|---|---|---|
| C-01 | Scope | The game client shall be one mobile application that contains the four variants: Hexa Lines, Hexa Fit, Hexa Sort and Hexa Merge. | app | 1, 2 |
| C-02 | Technology | Both repositories shall use a language that supports generic programming (generics or templates). | both | header |
| C-03 | Process | The project shall have two independent GitHub repositories, client and backend, each with a protected main branch, changes through pull requests and a clean, semantic commit history. | both | 2 |
| C-04 | Process | Commit messages shall follow Conventional Commits and be written in English. A commitlint hook should validate them. | both | 6.2 |
| C-05 | Architecture | The code shall follow Clean Architecture (Martin, 2017): four concentric layers (entities, use cases, interface adapters, frameworks and drivers) whose source code dependencies point only inward. | both | 3.4 |
| C-06 | Design | The code shall implement several GoF patterns that cover the creational, structural and behavioral categories, including Strategy and Abstract Factory (or an equivalent). The README shall justify each pattern in the context of the project and show a representative code excerpt. | both | 3.3 |
| C-07 | Design | The README shall document every SOLID principle applied, each with a concrete example from the code: the class or module and the justification. | both | 3.2 |
| C-08 | Architecture | The code shall implement at least one cross-cutting concern as an aspect, built with decorators or proxies on the use cases (an AOP library is not required). The README shall document the strategy. | both | 3.5 |
| C-09 | Documentation | Each repository shall have a `README.md` in English with these sections: (a) title and badges (build, test types, license); (b) description; (c) demo or screenshots of the four variants (app only); (d) architecture, with the layers diagram; (e) generic engine, with a link to `docs/EXTENSIBILITY.md` (app); (f) design patterns; (g) SOLID principles; (h) AOP; (i) getting started; (j) running tests; (k) AI usage; (l) contributing; (m) license. | both | 6.1 |
| C-10 | Documentation | Each repository shall have an `AI_USAGE.md` at its root with: (a) the AI tools used, with model or version and role; (b) one entry per significant use, with task, tool, prompt, result, changes made by the team and lessons; (c) a critical evaluation: approximate share of AI-assisted code, wrong or suboptimal outputs and how the team caught them, and the impact on productivity and quality. | both | 7.2 |
| C-11 | Documentation | The project shall deliver three diagrams, each as a high-resolution image in the README and as an editable source file (`.drawio`, `.puml` or similar) in `/docs`: (a) a class diagram with the main classes (entities, use cases, repositories, services, presenters), the generic types in UML template notation and how each variant instantiates them, inheritance, implementation, association, aggregation and composition, the Clean layer of each class and the design patterns, without low-level UI widgets; (b) a Clean layers diagram with the four concentric layers and their main components, dependency arrows pointing to the center, a color legend, and the ports and adapters between layers; (c) an extensibility diagram (app) with the generic engine in the center, the variants as extensions and the extension points a fifth variant would implement. | both | 3.4, 4 |
| C-12 | Documentation | The client repository shall include `docs/EXTENSIBILITY.md`, which explains step by step, with references to the real classes, which files to create and which files not to modify to add a fifth variant (for example, Hexa Fill). | app | 3.1, 4.3 |
| C-13 | Verification | The automated tests shall run on every pull request in a CI pipeline (GitHub Actions or equivalent). | both | 3.6 |
| C-14 | Integrity | The team shall not copy code from other groups or from public projects without citing the source. | both | 9 |
| C-15 | Integrity | Every member shall contribute significant commits; the commit history is used to assess individual participation. | both | 9 |
| C-16 | Delivery | The team shall deliver: (a) the URLs of both repositories through the M7 inbox; (b) the diagrams and `docs/EXTENSIBILITY.md` in `/docs`; (c) the README and `AI_USAGE.md` of both repositories on `main`; (d) a GitHub Release with an Android or iOS executable that contains the four variants. | both | 8 |
| C-17 | Delivery | The project shall be delivered on Monday 2026-12-14, the date in the assignment. The class plan lists 2026-12-07 to 2026-12-11: **confirm with the professor**. | both | header |
| C-18 | Process | The team shall use AI as §7.3 describes: (a) clear prompts with context, constraints and examples, documenting the ones that worked best; (b) critical review of every output against SOLID, the design patterns and Clean Architecture; (c) unit tests, preferably written by the team, for all AI-generated code; (d) frequent, granular commits; (e) architecture, generics, patterns and principles decided by the team; (f) no credentials, user data or API keys in prompts; (g) citations in code or docs for non-trivial algorithms or explanations the AI provided. | both | 7.3 |
| C-19 | Design | The engine shall be generic, parameterized by cell content, move type and game state, so that each variant is an instantiation of the engine and not a copy. It shall provide at least these elements (names are indicative): (a) `HexBoard<TCell>` with axial coordinates (q, r), configurable shape, neighborhood, traversal by axes and rotation, reused with `TCell` = `Color`, `PieceId`, `ColorStack` and `int`; (b) `IGameRules<TCell, TMove, TState>` for valid moves, applying a move, the resolution rule and the end-of-game check; (c) `GameEngine<TCell, TMove, TState>` for the game cycle (initialize, receive, validate, apply, resolve, evaluate, notify), independent of the variant and of the UI framework; (d) `IPieceSource<TPiece>` for a seeded random generator or a fixed list per level; (e) interchangeable `IScoringPolicy<TState>` and `IProgressModel` (high score or levels with stars); (f) bounded generics where the engine needs a capability of the cell content (for example `TCell: IMergeable<TCell>`), each bound justified in the README. | app | 3.1 |
| C-20 | Design | The rules of every variant shall be substitutable wherever `IGameRules` is expected (LSP), and the engine shall contain no conditional on the variant type. | app | 3.2 |
| C-21 | Design | Optional capabilities shall be separate interfaces (for example `IUndoable`, `ITimed`, `IRandomSeeded`), and each variant shall implement only the ones it uses (ISP). | app | 3.2 |
| C-22 | Architecture | The use cases shall depend only on ports declared in the use-case layer, and shall be generic or parameterized by variant: no use case is duplicated per game. | both | 3.4 |
| C-23 | Verification | Unit tests shall: (a) cover each entity, use case and service in isolation; (b) cover the rules of each variant: line clearing on the three axes, exact cover of the figure, cascade transfer and merge on collision; (c) test the generic engine with a test-double cell type that belongs to no variant; (d) replace external dependencies (repositories, network services, seeded random source) with mocks or stubs; (e) follow Arrange – Act – Assert; (f) be named `should_<expected_result>_when_<condition>`; (g) test behavior, not implementation details. | both | 3.6 |
| C-24 | Verification | Integration tests shall verify: (a) use cases with real repositories on an in-memory database; (b) the REST endpoints with test HTTP clients, including the `gameId` filter; (c) saving and restoring progress end to end for each variant. | both | 3.6 |
| C-25 | Verification | Widget tests shall verify that the game components render and respond to interaction, and the navigation among home, game select, level select, game, victory and defeat. | app | 3.6 |
| C-26 | Verification | Contract tests should verify, with Pact or an equivalent tool, that the contract between client and backend holds across changes. | both | 3.6 |
| C-27 | Integrity | Every member shall be able to explain any piece of the code, the patterns applied, the design of the generic types and the split of responsibilities between the engine and the variants. | both | 7.1, 7.4 |

## Functional requirements — game client, common (FR-01 to FR-19)

| ID | Requirement | Repo | § |
|---|---|---|---|
| FR-01 | The app shall show a home screen with the suite name, access to settings and a game selector with the four variants. | app | 5.1 |
| FR-02 | The app shall show a level select screen for Hexa Fit and Hexa Sort, with a progress indicator and locked levels. | app | 5.1 |
| FR-03 | The app shall let the player play each variant from start to end on the shared engine: show the board, accept moves, run the resolution rule and detect the end of the game. | app | 5.1 |
| FR-04 | The app shall load the hand-designed levels of Hexa Fit and Hexa Sort from configuration files (for example JSON or YAML). | app | 5.1, 3.3 |
| FR-05 | Each variant shall have a scoring system whose criteria the team defines and documents. | app | 5.1 |
| FR-06 | When the player wins, the app shall show a victory screen with the score obtained and the option to play the next level or a new game. | app | 5.1 |
| FR-07 | When the player loses, the app shall show a defeat screen with the option to retry. | app | 5.1 |
| FR-08 | The app shall save the player's progress per variant on the device (levels completed, stars and scores) and restore it on the next launch. | app | 5.1 |
| FR-09 | The app shall play sound effects and background music, and shall let the player mute them. | app | 5.1 |
| FR-10 | The app shall be available in at least Spanish and English. | app | 5.1 |
| FR-11 | The app shall let the player register and sign in through the backend API. | app | 2, 5.2 (derived) |
| FR-12 | When the player is signed in, the app shall sync the player's progress per variant with the backend. | app | 2, 5.2 (derived) |
| FR-13 | The app shall show the global leaderboard per variant and, for level-based variants, per level. | app | 2, 5.2 (derived) |
| FR-14 | The app shall download level definitions from the backend, so new levels appear without an app update. | app | 5.2 (derived) |

## Functional requirements — backend (FR-20 to FR-29)

| ID | Requirement | Repo | § |
|---|---|---|---|
| FR-20 | The API shall let a user register and sign in, and shall issue a JWT when sign-in succeeds. | api | 5.2 |
| FR-21 | The API shall let a signed-in user sync progress, with `gameId` as a mandatory dimension: one progress entry per user and per variant. | api | 5.2 |
| FR-22 | The API shall return a global leaderboard per `gameId` and, for level-based variants, per level. | api | 5.2 |
| FR-23 | The API shall return and update the level definitions of Hexa Fit and Hexa Sort, using one generic level schema with a section specific to each `gameId`. | api | 5.2 |
| FR-24 | The API shall publish its documentation as Swagger / OpenAPI. | api | 5.2 |
| FR-25 | If a request fails, then the API shall answer with the appropriate HTTP status code and one documented error format; successful responses shall also follow one documented format. | api | 5.2 |

## Functional requirements — Hexa Lines (FR-30 to FR-39)

| ID | Requirement | Repo | § |
|---|---|---|---|
| FR-30 | Hexa Lines shall use a hexagonal board of radius 4 (61 cells). | app | 1.1 |
| FR-31 | The app shall offer 3 pieces in a tray, each a poly-hex of 1 to 5 cells, and shall offer a new tray when the 3 pieces are used. | app | 1.1 |
| FR-32 | When the player drags a piece to a free position where it fits completely, the app shall place it there, with no gravity. If the piece does not fit, then the app shall not place it. | app | 1.1 |
| FR-33 | When a line along any of the 3 axes of the board is complete, the app shall clear it and add points; clearing several lines in one move shall count as a combo. | app | 1.1 |
| FR-34 | The score shall be the cells placed plus a bonus per line cleared, with a multiplier for combos and streaks. | app | 1.1 |
| FR-35 | When none of the available pieces fits on the board, the game shall end. | app | 1.1 |
| FR-36 | Hexa Lines shall be an endless game that records the high score. | app | 1.5, 5.1 |
| FR-37 | Hexa Lines shall not offer undo. | app | 1.5 |

## Functional requirements — Hexa Fit (FR-40 to FR-49)

| ID | Requirement | Repo | § |
|---|---|---|---|
| FR-40 | Each Hexa Fit level shall define a closed figure (an arbitrary set of cells) and a fixed set of pieces whose total area equals the area of the figure. | app | 1.2 |
| FR-41 | The app shall let the player place pieces inside the figure, and remove and reposition them freely. If a piece would overlap another piece or leave the figure, then the app shall not place it. | app | 1.2 |
| FR-42 | The app shall let the player rotate a piece in steps of 60°. | app | 1.2 |
| FR-43 | When all pieces cover the figure with no gaps or overlaps, the player shall win the level. Hexa Fit has no defeat condition. | app | 1.2 |
| FR-44 | The app shall award stars per level according to the number of moves and the time taken. | app | 1.2 |
| FR-45 | The app shall offer unlimited undo and redo in Hexa Fit. | app | 1.2, 5.1 |
| FR-46 | Hexa Fit shall have at least 15 hand-designed levels with progressive difficulty. | app | 1.2, 5.1 |

## Functional requirements — Hexa Sort (FR-50 to FR-59)

| ID | Requirement | Repo | § |
|---|---|---|---|
| FR-50 | Hexa Sort shall use a hexagonal board of radius 2 (19 cells), where each cell can hold a stack of colored tiles. | app | 1.3 |
| FR-51 | The app shall let the player place the stack offered by the tray on an empty cell. | app | 1.3 |
| FR-52 | When a stack is placed, the same-color tiles on top of adjacent stacks shall transfer toward the stack with the most tiles of that color, in cascade, until no transfer is possible. | app | 1.3 |
| FR-53 | When a stack holds 10 tiles of the same color, the app shall remove it from the board and count one goal. | app | 1.3 |
| FR-54 | When the player reaches the goal count of the level, the player shall win. If the board is full and no valid move remains, then the player shall lose. | app | 1.3 |
| FR-55 | Hexa Sort shall have at least 10 hand-designed levels with progressive difficulty. | app | 5.1 |
| FR-56 | Hexa Sort shall not offer undo. | app | 1.5 |

## Functional requirements — Hexa Merge (FR-60 to FR-69)

| ID | Requirement | Repo | § |
|---|---|---|---|
| FR-60 | Hexa Merge shall use a hexagonal board of radius 2 with numeric tiles that are powers of 2. | app | 1.4 |
| FR-61 | When the player swipes in one of the 6 directions, all tiles shall slide to the edge in that direction. | app | 1.4 |
| FR-62 | When two tiles with the same value collide, they shall merge into one tile with double the value. | app | 1.4 |
| FR-63 | After each valid move, the app shall add a new tile with value 2 or 4 in a random empty cell. | app | 1.4 |
| FR-64 | When the target tile (for example 2048) appears, the player shall win. If no move changes the board, then the player shall lose. | app | 1.4 |
| FR-65 | The score shall be the sum of the values produced by every merge. | app | 1.4 |
| FR-66 | The app shall let the player undo the last move. | app | 1.5, 5.1 |
| FR-67 | Hexa Merge shall be an endless game that records the high score. | app | 1.5, 5.1 |

## Non-functional requirements (NFR)

| ID | Quality characteristic (ISO/IEC 25010) | Requirement | How it is verified | Repo | § |
|---|---|---|---|---|---|
| NFR-01 | Maintainability — modifiability | Adding a fifth variant, a new board size, a new scoring policy or a new piece shape shall require only new classes or configuration, never a change in the engine. | The engine's diff is empty for such a change; shown live in the defense. | app | 2, 3.1 |
| NFR-02 | Maintainability — modifiability; portability | Replacing a low-level detail — the grid geometry (for example square cells instead of hexagons), the renderer (for example 3D), the persistence mechanism or the backend — shall be confined to new classes, configuration and the composition root, without rewriting the existing entities or use cases. The professor may request such a change shortly before the defense. | Design review: each detail sits behind a port or an extension point; architecture review before merge; a rehearsal of one such change. | both | class |
| NFR-03 | Maintainability — testability, modularity | The entities and use cases shall not depend on frameworks, UI, databases or network libraries, and their tests shall run without UI or database. | `tool/check-architecture.mjs` in CI; domain tests run as plain unit tests. | both | 3.4 |
| NFR-04 | Maintainability — reusability | What the variants share — board, geometry, rendering, navigation, persistence and the game flow — shall exist once. What varies — cell content, board shape, move type, resolution rule, piece source, end condition, progress model and undo — shall sit behind the engine's extension points. | Architecture review: no board, renderer, persistence or game flow duplicated per variant. | app | 1.5, 2 |
| NFR-05 | Maintainability — testability | Every random source shall be injectable and, given the same seed, shall produce the same sequence, so a game can be replayed deterministically. | Tests replay a game with a fixed seed. | app | 1.4, 3.6 |
| NFR-06 | Security | The API shall store only hashed passwords, validate every input and keep no secrets in the repository (OWASP practices). | Tests for invalid input; code review; secret scanning. | api | 5.2, 10 (derived) |
