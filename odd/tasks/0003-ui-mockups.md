# 0003 — UI mockups of the app screens (D12)

- **Status:** Approved
- **Owner:** Valentina Maza
- **Branch / PR:** `docs/ui-mockups` · #
- **Issue:** hexablock-ucab/hexablock-workspace#34 (D12)
- **Requirements:** FR-01, FR-02, FR-03, FR-05, FR-06, FR-07, FR-09, FR-10, FR-37, FR-45, FR-56, FR-66, C-28, NFR-04
- **ADRs:** 0002 (Flutter and Dart), 0004 (grid topology and `BoardRenderer`)

## Objective

The team has high-fidelity mockups of every screen of the app, as editable sources and PNG images in `docs/ui/`, to guide the UI work that starts on 2026-11-16.

## Problem

Coding starts on 2026-11-16 and nobody has defined how the app looks. Without mockups each screen would be designed while coding, the four games could drift into four different layouts (against NFR-04), and the "production quality, beautiful" product asked for in C-28 would be left to the last week.

## Decisions taken with the owner

| # | Question | Decision |
|---|---|---|
| Q1 | Visual style | Dark arcade neon: night-blue background, bright hexagonal tiles, as in the reference games and the assignment schematics |
| Q2 | Orientation and size | Portrait phone only, drawn at 390 × 844 (iPhone 14/15) |
| Q3 | Game screen | One shared template with fixed zones (top bar, board, tray); one mockup per variant on that template |
| Q4 | Fidelity | High fidelity: real colors, type and components |
| Q5 | Format | Editable source (SVG/HTML) plus a PNG export of each screen, both in `docs/ui/` |

## Scope

- In scope: the screens listed in the specs, a small style guide (palette, type, components), a README that indexes the mockups.
- Out of scope: sign-in, register and leaderboard screens (see Open questions); animations; tablet and landscape layouts; Flutter code.

## Specs

- **S1** (C-28): `docs/ui/style-guide` defines the palette (background, surface, text and the tile colors used by the variants), the type scale and the shared components (primary button, icon button, top bar, card, tray slot), all in the dark arcade neon style.
- **S2** (FR-01): The **home** screen shows the suite name, a settings button and a play entry point.
- **S3** (FR-01): The **game select** screen shows the four variants (Hexa Lines, Hexa Fit, Hexa Sort, Hexa Merge), each with its name, a small preview and the player's best result (high score or levels completed).
- **S4** (FR-02): The **level select** screen, shown for Hexa Fit and Hexa Sort, shows a grid of levels with their stars, the next playable level highlighted and locked levels marked.
- **S5** (FR-03, NFR-04): The **game template** defines three fixed zones: a top bar (back or pause, the variant's result such as score or goals, and optional actions), a central board zone, and a bottom tray zone. The board zone does not assume hexagons beyond the drawing itself (ADR-0004).
- **S6** (FR-03, FR-05, FR-37, FR-45, FR-56, FR-66): Four **game** mockups on the template of S5:
  - Hexa Lines: radius-4 board (61 cells), tray with 3 pieces, score and streak; no undo button.
  - Hexa Fit: level figure, tray with the level's pieces, rotate, undo and redo buttons, move count and timer.
  - Hexa Sort: radius-2 board (19 cells) with color stacks, the next stack in the tray, goals reached out of the level's goal count; no undo button.
  - Hexa Merge: radius-2 board with numeric tiles, score, best score and an undo button for one move.
- **S7** (FR-06): The **victory** screen shows the result (score, or stars, moves and time for level-based variants) and the actions "Next level" or "New game", plus "Home".
- **S8** (FR-07): The **defeat** screen shows the final result and the actions "Retry" and "Home".
- **S9** (FR-09, FR-10): The **settings** screen offers music on/off, sound effects on/off and the language (Español / English).
- **S10** (FR-10): Every mockup uses text that fits in both Spanish and English; the mockups are drawn in Spanish, and the README lists the English strings of each screen.
- **S11** (C-11 style, Q5): Each screen exists as an editable source and as a PNG export at 2× (780 × 1688) in `docs/ui/`, and `docs/ui/README.md` shows every PNG with a one-line description and the requirement it covers.

## Allowed edit surfaces

- `docs/ui/**`
- `odd/tasks/0003-ui-mockups.md`
- `AI_USAGE.md` (one entry for this task)

## Tasks

- [ ] **T1** (S1) Style guide.
- [ ] **T2** (S2, S3, S4) Home, game select and level select.
- [ ] **T3** (S5, S6) Game template and the four game mockups.
- [ ] **T4** (S7, S8, S9) Victory, defeat and settings.
- [ ] **T5** (S10, S11) PNG exports and `docs/ui/README.md`.
- [ ] **T6** `log-ai-usage` entry.

## Verification

| Spec | Evidence | Verdict |
|---|---|---|
| S1 | | |
| S2 | | |
| S3 | | |
| S4 | | |
| S5 | | |
| S6 | | |
| S7 | | |
| S8 | | |
| S9 | | |
| S10 | | |
| S11 | | |

## Open questions

- Sign-in, register and leaderboard (FR-11, FR-13) are not in the D12 list of `docs/PLAN.md`. Proposal: add them in a follow-up once D5 (API contract) defines the data they show.
- Task number 0003 assumes the game rules task on `docs/game-rules` keeps 0002; renumber if another task merges first.

## Next step

T1 (style guide) starts on the next working session.

## Log

- 2026-11-09 — Valentina Maza with Claude (Opus 5.5, claude.ai): task drafted after five closed design questions (Q1–Q5); all five recommended options accepted.
- 2026-11-09 — Valentina Maza: document approved without changes.
