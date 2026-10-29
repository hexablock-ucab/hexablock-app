# Extensibility Guide

How to extend HexaBlock Suite **without modifying the engine** (NFR-01, NFR-02). This guide is a deliverable (C-12) and the script for the live demonstration in the defense. Keep it true: every class name below must exist in the code.

> **Status:** skeleton. It is filled in as the engine is built; the package paths follow the proposed layout of ADR-0003. Each section lists the files to **create**, the files to **configure** and the files that must **not change**.

## Extension points

| Extension point | Interface | Existing implementations | ADR |
|---|---|---|---|
| Game rules | `IGameRules<TCell, TMove, TState>` | TODO | — |
| Piece source | `IPieceSource<TPiece>` | TODO | — |
| Scoring policy | `IScoringPolicy<TState>` | TODO | — |
| Progress model | `IProgressModel` | TODO | — |
| Variant family | Abstract Factory per variant | TODO | — |
| Grid topology | TODO | `HexTopology` | [ADR-0004](adr/0004-grid-topology-extension-point.md) |
| Board renderer | `BoardRenderer` (outer layers) | TODO | [ADR-0004](adr/0004-grid-topology-extension-point.md) |
| Remote API | Repository/gateway ports in `hexablock_application` | TODO | — |

## Add a fifth variant — example: *Hexa Fill* (paint cells under constraints)

1. TODO
2. TODO

Files that must not change: `packages/hexablock_engine/**`, the other variants.

Check: `git diff --stat main -- packages/hexablock_engine` is empty.

## Small rule changes the jury may ask for

| Change | Where it goes | Engine touched? |
|---|---|---|
| New board size | TODO | No |
| Different scoring policy | TODO | No |
| New piece shape | TODO | No |
| Another grid shape (for example squares), a change the professor may request before the defense | New topology class (ADR-0004) | No |
| Another way to draw the board (for example 3D) | New `BoardRenderer` implementation | No |
