# ADR-0007: Local data with drift, preferences and secure storage; view models in plain Dart

- **Status:** Accepted
- **Date:** 2026-11-25
- **Proposed by:** Eduard Velasco
- **Deciders:** Eduard Velasco, Ali Dahouk, Valentina Maza
- **Requirements:** C-05, C-24a, FR-08, FR-11, FR-12, FR-14, FR-15, FR-16, FR-18, NFR-02, NFR-03

## Context

The app is fully playable offline (FR-15). It keeps on the device the progress of each variant (FR-08), the levels downloaded from the API (FR-14), the game in progress of Hexa Lines and Hexa Merge (FR-16), the preferences (sound, language, theme and tile symbols; FR-09, FR-10, FR-18) and the session token of a signed-in player (FR-11, FR-12).

The integration tests must run the use cases with real repositories on an in-memory database (C-24a). Storage is a low-level detail that may be replaced before the defense (C-31, NFR-02), so it must stay behind ports.

The screens also need a way to hold their state and talk to the use cases. A state management library would bring its own concepts and wiring for a project that has few screens.

## Decision

- **Progress, downloaded levels and the saved game:** drift, on SQLite. Tests use drift's in-memory database (C-24a).
- **Preferences:** `shared_preferences`.
- **Session token:** `flutter_secure_storage`, so the token is stored with the operating system's protection.
- Each of the three sits behind a port of layer 2 (ADR-0003) and is used only by its adapter. The domain and the use cases never import them; `tool/architecture-rules.json` forbids those imports.
- **View models:** plain Dart classes in layer 3, one per screen, which call the use cases and expose what the screen shows. The Flutter widgets listen to them. Dependencies are wired by hand in the composition root of `app/`, with no state management or dependency injection library.

## Alternatives considered

| Option | Why not |
|---|---|
| `sqflite` with hand-written SQL | No typed queries and no in-memory database for tests out of the box; drift gives both on the same SQLite. |
| A key-value store (for example Hive) for everything | Progress and levels are queried by `gameId` and level; a relational store fits them better, and the token needs the platform's secure storage anyway. |
| Everything in `shared_preferences` | Meant for small settings, not for level documents or saved games; it offers no queries and no in-memory test database. |
| A state management library (Provider, Riverpod, Bloc) | One more concept and set of wiring for few screens; plain view models are testable without Flutter and keep the composition root as the only place that wires objects. |

## Consequences

- Swapping the database (C-31) means a new adapter behind the same port and a change in the composition root; no use case changes.
- The drift tables and the shape of the saved game are fixed with the domain model (D1).
- The composition root grows by hand as screens are added; if it becomes hard to read, the team revisits this decision in a new ADR.
- Three new dependencies of the app, each mainstream and maintained; they are added in task 0001 with a one-line justification.

## References

- drift documentation, in-memory databases for tests: https://drift.simonbinder.eu/testing/
- Martin, *Clean Architecture* (2017), chapter 30, "The Database Is a Detail".
