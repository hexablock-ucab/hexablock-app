# 0002 — Document the game rules the assignment leaves open

- **Status:** Verifying — accepted by Eduard on 2026-11-08; ready to ship (Done after the PR merges)
- **Owner:** Eduard Velasco
- **Branch / PR:** `docs/game-rules` · #
- **Requirements:** C-33 (pending in PR #12), FR-05, FR-22, FR-33, FR-34, FR-44, FR-52, FR-53, FR-54, FR-65 (also FR-06, FR-08, FR-13, FR-40 to FR-43, FR-45, NFR-05, C-19e, C-23b)
- **ADRs:** 0004 (grid topology, Proposed), 0006 (board and level builder, Proposed). No ADR is Accepted, so the rules speak of "the topology's axes and neighbors", not of hexagons, wherever the rule allows it.

Plan reference: design task D2 of the workspace plan. D3 (level format) depends on this task.

## Objective

`docs/game-rules.md` states, for every rule the assignment leaves open, one decision with its justification and a worked example, so the engine, the tests and the level format can be built from it.

## Problem

The assignment fixes the shape of the four games but not their details: how the Hexa Sort cascade resolves, what a Hexa Lines "line" is, which figures Hexa Fit accepts, how each variant is scored and starred, and how the leaderboard is ordered. The professor said the team decides and documents these rules (C-33). Without a written decision, D3 (level format), the rule tests and the API leaderboard would each invent their own answer.

## Scope

- In scope: one new file, `docs/game-rules.md`, with one section per topic: Hexa Sort cascade and end of game, Hexa Lines lines and score, Hexa Fit figure and stars, Hexa Sort and Hexa Merge score, leaderboard order.
- Out of scope: code; the level file format (D3); the README summary that C-33 also asks for (follow-up after PR #12 merges); the API contract (D5); numeric level data (par values, goal counts).

## Decisions taken with the user (2026-11-08)

Each row was asked as a closed question, with a recommendation and alternatives. All were answered with the recommended option.

| # | Topic | Decision |
|---|---|---|
| 1 | C-33 | Cite as "pending in PR #12"; branch stays on `main`. |
| 2 | Sort: unit of transfer | The whole contiguous top block of one color moves at once. |
| 3 | Sort: "most tiles of that color" | Compared by the size of the top block only. |
| 4 | Sort: tie between targets | The stack just placed or most recently changed wins; otherwise the lowest cell in the topology's fixed order. |
| 5 | Sort: 10 tiles | When a top block reaches 10 or more tiles, the whole block is removed and counts as one goal. Tiles below stay and the cascade continues. |
| 6 | Sort: end of game | Defeat when no empty cell remains after resolving and the goal is not met. If the same move meets the goal, the player wins. |
| 7 | Sort: tray | One stack at a time; seeded generator; stack composition set by level parameters. |
| 8 | Lines: what is a line | Every complete row along one of the topology's axes, of any length (27 rows on the radius-4 board). |
| 9 | Lines: clearing | All completed lines clear at once, with no gravity; a shared cell clears once. |
| 10 | Lines: score | `cells placed + 10 × L × combo × streak`, with `combo = L` and `streak` = consecutive moves that clear at least one line, counting the current one. |
| 11 | Fit: figure | Connected (edge-adjacent) and with no interior holes. |
| 12 | Fit: pieces | Rotation only, no mirroring; a level may repeat a piece, and equal pieces are interchangeable. |
| 13 | Fit: stars | 1 for winning, +1 if moves ≤ the level's move par, +1 if time ≤ the level's time par. Maximum 3. |
| 14 | Fit: moves | Place, remove and rotate each count 1. Undo and redo neither add nor subtract: the counter only grows. Place, undo, place again = 2. |
| 15 | Fit: time | Starts at the first player action, pauses while the app is in the background, stops on victory, whole seconds, read through an injected `Clock`. |
| 16 | Sort: score | 10 points per tile removed. |
| 17 | Sort: stars | Yes, by moves: 1 for winning, plus one star per move threshold met; thresholds per level. |
| 18 | Merge: score | The value of the resulting tile (4 + 4 adds 8). Undo restores board and score. |
| 19 | Ranking: order | Lines and Merge: score descending, then date ascending. Fit: stars descending, moves ascending, time ascending, then date ascending. Sort: stars descending, moves ascending, then date ascending. "Date" is when the result was achieved. |
| 20 | Ranking: entries | One entry per user per table (per `gameId` and, in level-based variants, per level): the user's best result under that order. |

## Specs

Each spec is checked by reading `docs/game-rules.md`; every rule carries a worked example that a rule test can reuse (C-23b).

- **S1** (C-33, FR-05): Given `docs/game-rules.md`, when it is read, then each rule states its decision, the reason (the assignment, the team's logic or a requirement ID) and one worked example, and C-33 is cited as "pending in PR #12". The document says "the topology's axes and neighbors" and flags every hexagon-specific value as such (ADR-0004).
- **S2** (FR-52): Given a placed stack, when the cascade runs, then each transfer moves the whole contiguous top block of one color from the stack with the smaller top block of that color to the adjacent stack with the larger one. Example: top blocks red×2 and red×3 on adjacent cells → the stack holds red×5 on top and the other cell exposes the tile below, or is empty.
- **S3** (FR-52): Given two adjacent stacks whose top blocks of the same color are equal, when a transfer is chosen, then the destination is the stack just placed or most recently changed; if neither is, the destination is the lowest cell in the topology's fixed order. Example: red×3 on the placed stack and red×3 on a neighbor → the neighbor's block moves onto the placed stack.
- **S4** (FR-52, NFR-05): Given the same board and the same stack, when the cascade runs twice, then the final board is identical. The order in which eligible transfers run is written in the document (see open question O1).
- **S5** (FR-53): Given a top block that reaches 10 or more tiles, when the cascade reaches that state, then the whole block is removed, one goal is counted and 10 points per removed tile are added to the score; tiles below stay and the cascade continues. Example: red×7 receives red×6 → 13 tiles removed, one goal, 130 points.
- **S6** (FR-54): Given a move that leaves no empty cell and the goal not met, then the player loses; given a move that meets the goal, then the player wins even if no empty cell remains.
- **S7** (FR-51, NFR-05, C-19e): Given a Hexa Sort level, when the tray refills, then it offers one stack drawn from a seeded generator configured by the level's parameters. The document names the parameters D3 must define.
- **S8** (FR-33): Given the board, when a piece is placed, then a line is every complete row along one of the topology's axes, of any length, and all lines completed by that move clear together with no gravity. Example: on the radius-4 board there are 27 rows (9 per axis, 5 to 9 cells); a cell shared by two cleared rows clears once and both rows count toward L.
- **S9** (FR-34): Given a move, when it is scored, then `points = cells placed + 10 × L × L × streak`. Example: placing a 3-cell piece that clears 3 lines on the second consecutive clearing move scores `3 + 10 × 3 × 3 × 2 = 183`; a move that clears no line scores its cells and resets the streak.
- **S10** (FR-40, ADR-0006): Given a Hexa Fit level, then its figure is connected by shared edges, has no interior holes and has an area equal to the pieces' total area. Pieces may rotate in steps of 60° and never mirror; a level may repeat a piece.
- **S11** (FR-44): Given a won Hexa Fit level, then stars are 1 for winning, +1 if moves ≤ the level's move par, +1 if time ≤ the level's time par. Example: moves within par and time over par → 2 stars.
- **S12** (FR-44, FR-45): Given the player's actions, then place, remove and rotate each add 1 to the move count; undo and redo add and subtract nothing. Example: place, undo, place again = 2 moves.
- **S13** (FR-44, NFR-05): Given a Hexa Fit level, then time starts at the first player action, stops while the app is in the background, stops on victory, is counted in whole seconds and comes from an injected `Clock`.
- **S14** (FR-05, FR-06): Given a won Hexa Sort level, then the score is 10 per removed tile and the stars are 1 for winning plus one per move threshold met, with thresholds per level. Example: a 10-tile goal reached with 25 moves, with thresholds 30 and 24 → 2 stars.
- **S15** (FR-65, FR-66): Given a merge, then the score adds the value of the resulting tile, and undo restores both the board and the score. Example: 4 and 4 merge → +8; undo → the score drops by 8.
- **S16** (FR-22, FR-13): Given the results of a table, then the order is: Lines and Merge by score descending then date ascending; Fit by stars descending, moves ascending, time ascending then date ascending; Sort by stars descending, moves ascending then date ascending. Each user appears once per table with the best result under that order. Example: two users with 3 stars and 20 moves → the one with less time ranks first.

## Allowed edit surfaces

- `docs/game-rules.md` (new)
- `odd/tasks/0002-game-rules.md`
- `AI_USAGE.md` (the entry for this task)

## Tasks

- [x] **T1** (S1) Create `docs/game-rules.md` with the structure and the C-33 note. **Needs the user's approval of the specs first.**
- [x] **T2** (S2 to S7) Hexa Sort section: cascade, tie, removal, end of game, tray.
- [x] **T3** (S8, S9) Hexa Lines section: lines, clearing, score.
- [x] **T4** (S10 to S13) Hexa Fit section: figure, pieces, stars, moves, time.
- [x] **T5** (S14, S15) Score of Hexa Sort and Hexa Merge.
- [x] **T6** (S16) Leaderboard order and entries.
- [x] **T7** Update the README, `docs/EXTENSIBILITY.md` and diagrams if affected: none expected. Record the README summary C-33 asks for as a follow-up after PR #12.
- [x] **T8** `log-ai-usage` entry.

## Verification

This task changes documentation only, so the Dart checks do not apply. Commands, run exactly as written:

```bash
git diff --stat main...HEAD
grep -oE '\b(NFR|FR|C)-[0-9]+[a-z]?\b' docs/game-rules.md | sort -u
```

The first command must list only the allowed edit surfaces. Every ID printed by the second must exist in `docs/requirements.md`, except C-33, which is flagged as pending in PR #12. `odd-verify` also reads the document against each spec.

| Spec | Evidence | Verdict |
|---|---|---|
| S1 | `odd-verify`: C-33 flagged at lines 6 and 263, [hex] marks, ADR-0004 and 0006 marked Proposed | PASS |
| S2 | SORT-1 | PASS |
| S3 | SORT-2 | PASS |
| S4 | SORT-3; `odd-verify` simulated 200,000 random radius-2 boards: no loop, total order | PASS |
| S5 | SORT-4; 13 × 10 = 130 | PASS |
| S6 | SORT-5 | PASS |
| S7 | `odd-verify` found the parameters only as examples; the document now names the colors in play and the stack size range. Re-check pending | PARTIAL, fixed, not re-verified |
| S8 | LINES-1, LINES-2; 27 rows, 5 + 9 − 1 = 13 | PASS |
| S9 | LINES-3; 12, 183, 4, 41, total 240 | PASS |
| S10 | FIT-1, FIT-2; hole definition clarified after decision 23 | PASS (clarification not re-verified) |
| S11 | FIT-3 | PASS |
| S12 | FIT-4; rotation counts 1 per 60° step (decision 21) | PASS (wording changed after the check) |
| S13 | FIT-5; first action defined as place, remove or rotate (decision 22) | PASS (wording changed after the check) |
| S14 | SORT-7, SCORE-1 | PASS |
| S15 | SCORE-2 | PASS |
| S16 | RANK-1, RANK-2 | PASS |

Checks run: every cited ID exists in `docs/requirements.md` except C-33 (pending in PR #12); the numeric examples were recomputed by `odd-verify`. `git diff --stat main...HEAD` prints nothing because the two new files are still untracked.

## Open questions

These points were not asked as such; the specs fill them with a proposal that the approval of this document covers or corrects.

- **O1** — Cascade order (S4). The user decided the unit, the comparison and the tie, but not which eligible transfer runs first. Proposal: process the pairs that touch the most recently changed stack first, then follow the topology's fixed order. A spec cannot be tested without it.
- **O2** — Ranking (S16). If score or stars, moves, time and date all tie, nothing orders the entries. Proposal: order by user id. It needs the API to expose a stable user id.
- **O3** — Hexa Sort star thresholds (S14). The user chose "one star per move threshold met". Proposal: two thresholds per level, so the maximum is 3 stars like Hexa Fit. D3 must name the fields.
- **O4** — Hexa Sort moves count the stacks placed. Undo does not exist in Sort, so no counting rule is needed beyond that.
- **O5** — C-33 asks for the rules in the README; the plan asks for `docs/game-rules.md`. This task writes the file and leaves the README summary for after PR #12.

## Next step

Ship with the `ship` skill (run `ci-local` first), and add the README summary of the rules after PR #12 merges.

## Log

- 2026-11-08 — Eduard Velasco (prompt): "Tarea de diseño D2 de ../hexablock-workspace/docs/PLAN.md: reglas de juego que el enunciado deja abiertas (cascada de Hexa Sort, qué es una línea, figura de Hexa Fit, puntuación y estrellas por variante, criterio y desempates del ranking).
  Es documentación, no código. Antes de proponer nada lee: las secciones 1.1 a 1.5 y 5.1 del enunciado (../hexablock-workspace/context/proyecto/ENUNCIADO_HexaBlockSuite_v1.0.md), docs/requirements.md (C-33, FR-05, FR-22, FR-33, FR-40 a FR-46, FR-52 a FR-54, FR-65), los ADRs y ../hexablock-workspace/docs/reuniones/2026-11-05-reunion-profesor.md.
  Sigue ODD: crea la rama con ship, explora con odd-explore y hazme las preguntas que falten una por una, cerradas, con tu recomendación y las alternativas. No decidas reglas sin preguntarme. Después crea el documento de la tarea en odd/tasks/ con specs ligadas a requisitos y espera mi aprobación antes de escribir docs/game-rules.md."
- 2026-11-08 — Claude Code (delegation): branch `docs/game-rules` created from `main` with `ship`. `odd-explore` mapped the sources (read-only).
- 2026-11-08 — Claude Code (finding): C-33 exists only in PR #12 (`docs/professor-answers`), not on `main`.
- 2026-11-08 — Eduard Velasco (decision): decisions 1 to 20 in the table above, each answered as a closed question; every answer was the recommended option. For decision 14 a clarifying question was needed, because my first description of the option was ambiguous; the user confirmed that the move counter only grows (place, undo, place = 2).
- 2026-11-08 — Eduard Velasco (prompt): "apruebo todo"
- 2026-11-08 — Eduard Velasco (decision): approved specs S1 to S16 and the proposals O1 to O5 as written (cascade order, user-id final tie-break, two Sort star thresholds, Sort moves = stacks placed, README summary after PR #12).
- 2026-11-08 — Claude Code (delegation): `odd-worker` wrote `docs/game-rules.md` (edit surface: that file only). It reported 11 detail choices not in this document: (1) "most recently changed stack" = destination of the last transfer, initially the placed stack; (2) pairs ordered by lowest other cell, then by lower cell of the pair; (3) SORT-4 runs after each single transfer; (4) end of game checked only after the cascade, victory first; (5) tray parameters left to D3; (6) hole definition; (7) a rotation counts per step; (8) seconds truncated, first action includes a rotation; (9) a spawned Merge tile adds no score; (10) final tie-break is user id ascending; (11) rule labels SORT-1, LINES-1, FIT-1, SCORE-1, RANK-1.
- 2026-11-08 — Claude Code (verdict): `odd-verify` gave 15 PASS and 1 PARTIAL (S7), no blocker. Defects: S7 parameters named only as examples; rotation count wording; "first action" undefined for rotation; hole definition at the board edge.
- 2026-11-08 — Eduard Velasco (decision 21, closed question, recommended option): a rotation counts 1 per 60° step; turning a piece 180° adds 3.
- 2026-11-08 — Eduard Velasco (decision 22, closed question, recommended option): any place, remove or rotate starts the Hexa Fit clock.
- 2026-11-08 — Eduard Velasco (decision 23, closed question, recommended option): a hole is a group of non-figure cells with no path to the outside on the unbounded grid; an open bay is not a hole.
- 2026-11-08 — Claude Code (edit, no question asked): S7 now names the colors in play and the stack size range, and leaves to D3 whether the level stores the seed; SORT-4 states that it also applies to a stack arriving from the tray with a top block of 10 or more; the SORT-3 example states why no pair remains. These two points follow from decisions 5 and 7 and are not new rules, but the user should confirm them.
- 2026-11-08 — Eduard Velasco (prompt): "okey estoy de acuerdo"
- 2026-11-08 — Claude Code (log): `AI_USAGE.md` entry added (T8). T7: no README, `docs/EXTENSIBILITY.md` or diagram change is needed; the README summary of the rules stays as a follow-up after PR #12.
