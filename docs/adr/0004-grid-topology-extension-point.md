# ADR-0004: Grid geometry is an extension point (topology strategy)

- **Status:** Accepted
- **Date:** 2026-11-25 (proposed 2026-10-28)
- **Proposed by:** Eduard Velasco
- **Deciders:** Eduard Velasco, Ali Dahouk, Valentina Maza
- **Requirements:** C-19a, C-31, C-32, NFR-01, NFR-02, NFR-04, NFR-05

## Context

All four variants share the hexagonal board, its geometry (axial coordinates, neighbors, rotation), rendering, navigation and persistence (§1.5). Shortly before the defense, a change in a low-level detail may be requested, for example square cells instead of hexagons (C-31), and the design must absorb it without rewriting the project (NFR-02). If rules speak in terms of hexagons, every such change touches every variant.

## Decision

Rules depend on an abstract **grid topology**, not on hexagons:

- A topology defines how many integers a coordinate has and which coordinates are valid, the neighbors of a cell, the directions, the line axes, the rotation step, the fixed order of its cells and the shapes of regions.
- `HexTopology` (axial coordinates, 6 directions, 3 axes, 60° rotation) is the only implementation required by the assignment.
- Rules use topology concepts: Hexa Lines clears "full lines along the topology's axes"; Hexa Merge slides "in the topology's directions"; pieces rotate "by the topology's rotation step".
- A coordinate is one value object holding a list of integers (C-32). The topology defines the length of the list and validates it. `HexTopology` reads it as axial `[q, r]` (C-19a, assignment §3.1).
- Rules never read the numbers of a coordinate: they ask the topology for neighbors, axes, directions and rotation.
- Every topology lists its cells in one fixed order that never changes during a game. The Hexa Sort cascade uses it to break ties and to choose the next transfer (SORT-2, SORT-3 in `docs/game-rules.md`), so the same move always gives the same board (NFR-05).
- The generic board is `Board<TCell>`, generic only in the content of its cells. It is the `HexBoard<TCell>` of the assignment when it is built with `HexTopology`.
- Level files declare their topology, and the level builder resolves it through a factory.
- Rendering is a separate port in the outer layers (`BoardRenderer`), so a different drawing (for example 3D) does not touch rules.

**Scope guard:** we build only `HexTopology`. We do not build square or triangle topologies; we only keep the seam that would allow them. Extra abstractions beyond this ADR need their own ADR.

## Alternatives considered

| Option | Why not |
|---|---|
| Hexagon-specific board and rules | Simplest today, but a change of cell shape rewrites every variant (fails NFR-02). |
| Fully generic N-dimensional grid framework | Over-engineering; no requirement needs it. |
| `Board<C, TCell>` with a generic coordinate type `C` | One more type parameter through every generic class of the engine (rules, engine, factories, histories), with no requirement that needs it, and it lets the rules see the concrete coordinate. A list of integers checked by the topology absorbs another cell shape (C-31) without it. |

## Consequences

- One more interface in the engine, justified by NFR-02.
- `docs/EXTENSIBILITY.md` documents "add a topology" next to "add a variant".
- Tests of the engine run against a fake topology as well as the fake cell type.

## References

- Red Blob Games, *Hexagonal Grids* — axial coordinates, neighbors, rotation, lines. https://www.redblobgames.com/grids/hexagons/ (algorithm reference; cite in code where used).
