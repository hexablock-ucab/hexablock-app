---
name: add-variant
description: "Add a new game variant (or a new rule, board shape, scoring policy or piece shape) through the engine's extension points without modifying the engine. Use when the user asks for a new variant, a fifth game, a rule change from the jury, or wants to rehearse the extensibility demo. Triggers: nueva variante, quinta variante, agregar juego, cambio de regla, demo de extensibilidad, add variant, new game mode."
---

# Add a variant through the extension points

NFR-01: a new variant must be confined to new classes or configuration. The engine is not modified. This skill is also the rehearsal for the live defense.

## Steps

1. Read `docs/EXTENSIBILITY.md`, `AGENTS.md` §3 and ADR-0004. If `docs/EXTENSIBILITY.md` is outdated, stop and tell the user; it must be fixed first.
2. Classify the request against the variability dimensions (assignment §1.5): cell content, board shape, move type, resolution rule, piece source, end condition, progress model, undo.
3. For each dimension, decide: reuse an existing implementation, or create a new class that implements the existing interface. List the decision in a table.
4. Open an ODD task (`odd-task`) with the plan: files to **create** and files that must **not** change (engine package, existing variants).
5. Implement through `odd-worker`, test first: rule tests for the new variant, plus a test that registers the variant through its factory.
6. Register the variant only in configuration and in the composition root (`app/`), never inside the engine.
7. Verify with `odd-verify`, then run `git diff --stat origin/main -- packages/hexablock_engine`. **It must be empty.** If it is not, the design has a gap: report it to the user as a finding, do not hide it.
8. Update `docs/EXTENSIBILITY.md` if the procedure taught something new.
