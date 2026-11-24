# ADR-0006: Boards and levels are assembled by a Builder in the domain

- **Status:** Proposed — to review in the first team meeting
- **Date:** 2026-11-01
- **Proposed by:** Eduard Velasco
- **Deciders:** —
- **Requirements:** C-05, C-06, C-19a, FR-04, FR-30, FR-40, FR-50, FR-60, NFR-02, NFR-03

## Context

The variants build different boards: a hexagon of radius 4 (Hexa Lines), a hexagon of radius 2 (Hexa Sort, Hexa Merge) and an arbitrary closed figure per level (Hexa Fit). Hexa Fit and Hexa Sort levels also bring pieces and goals, and they come from configuration files (FR-04).

The assignment proposes a Builder that assembles Hexa Fit and Hexa Sort levels step by step from files (§3.3), and the game logic must stay independent of the framework (C-05, NFR-03).

A board needs several optional steps (topology, shape, initial cells, blocked cells) and invariants that must hold before the game starts, for example that the pieces of a Hexa Fit level cover exactly the area of its figure (FR-40). A constructor with many parameters hides those rules; reading a file inside the domain would couple the domain to a format.

## Decision

- The domain provides a `BoardBuilder` that assembles a board step by step (topology from ADR-0004, shape, initial and blocked cells) and checks the board's invariants in `build()`. Level-based variants use a `LevelBuilder` that adds the figure, the pieces and the goals and checks the level's invariants.
- The builders know nothing about JSON, YAML, Flutter or storage. Reading a level file is an adapter (layer 3): it maps the file to a DTO and drives the builder. Another file format or a level downloaded from the API (FR-14) is another adapter, not a change in the domain.
- Each variant's factory (Abstract Factory, C-06) uses the builder to create its board, so the radius or the figure is configuration of the variant, not code in the engine.

Names are indicative; the team fixes them when the engine is built.

## Alternatives considered

| Option | Why not |
|---|---|
| Constructors with many parameters | Unreadable calls and no single place to check the invariants. |
| Only static factory methods (`Board.hexagon(4)`) | Enough for fixed hexagons, but not for Hexa Fit figures with pieces and goals and their checks. They can still exist as shortcuts on top of the builder. |
| Parse the level file inside the domain | Couples the domain to a file format and to I/O (breaks C-05 and NFR-03). |

## Consequences

- One place assembles and validates every board and level; invalid levels fail at build time with a domain error.
- A new board size is configuration; a new shape is a new builder step or a new topology (NFR-02).
- Tests build boards and levels with the same builders (the test data builder pattern, covered in the course's testing classes), which keeps the tests short and readable.
- Requires two more classes in the domain, justified by C-06 and NFR-03.

## References

- Blancarte, *Introducción a los patrones de diseño*, Patrón Builder.
- Gamma, Helm, Johnson and Vlissides (1994), *Design Patterns*, Builder.
