# ADR-0004: Grid geometry is an extension point (topology strategy)

- **Status:** Proposed — to review in the first team meeting
- **Date:** 2026-10-28
- **Proposed by:** Eduard Velasco
- **Deciders:** —
- **Requirements:** C-19a, NFR-01, NFR-02, NFR-04

## Context

All four variants share the hexagonal board, its geometry (axial coordinates, neighbors, rotation), rendering, navigation and persistence (§1.5). The professor said in class that, shortly before the defense, he may ask for a change in a low-level detail, for example square cells instead of hexagons or a 3D board, and that the design must absorb it without rewriting the project (NFR-02). If rules speak in terms of hexagons, every such change touches every variant.

## Decision

Rules depend on an abstract **grid topology**, not on hexagons:

- A topology defines the coordinate type, the neighbors of a cell, the directions, the line axes, the rotation step and the shapes of regions.
- `HexTopology` (axial coordinates, 6 directions, 3 axes, 60° rotation) is the only implementation required by the assignment.
- Rules use topology concepts: Hexa Lines clears "full lines along the topology's axes"; Hexa Merge slides "in the topology's directions"; pieces rotate "by the topology's rotation step".
- The generic board is `Board<C, TCell>` over a coordinate type `C`; `HexBoard<TCell>` names the hexagonal instantiation required by the assignment.
- Level files declare their topology, and the level builder resolves it through a factory.
- Rendering is a separate port in the outer layers (`BoardRenderer`), so a different drawing (for example 3D) does not touch rules.

**Scope guard:** we build only `HexTopology`. We do not build square or triangle topologies; we only keep the seam that would allow them. Extra abstractions beyond this ADR need their own ADR.

## Alternatives considered

| Option | Why not |
|---|---|
| Hexagon-specific board and rules | Simplest today, but a change of cell shape rewrites every variant (fails NFR-02). |
| Fully generic N-dimensional grid framework | Over-engineering; no requirement needs it. |

## Consequences

- One more interface in the engine, justified by NFR-02.
- `docs/EXTENSIBILITY.md` documents "add a topology" next to "add a variant".
- Tests of the engine run against a fake topology as well as the fake cell type.

## References

- Red Blob Games, *Hexagonal Grids* — axial coordinates, neighbors, rotation, lines. https://www.redblobgames.com/grids/hexagons/ (algorithm reference; cite in code where used).
