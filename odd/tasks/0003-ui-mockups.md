# 0003 — UI mockups of the app screens (D12)

- **Status:** Verifying
- **Owner:** Valentina Maza
- **Branch / PR:** `docs/ui-mockups` · #14
- **Issue:** hexablock-ucab/hexablock-workspace#34 (D12)
- **Requirements:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-09, FR-10, FR-14, FR-15, FR-32, FR-37, FR-45, FR-56, FR-64, FR-66, C-28, NFR-02, NFR-04
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
| Q6 | Game selector (review B1) | On the home screen, as assignment 5.1.1 and FR-01 ask; the separate game select screen is removed |
| Q7 | Light theme (review, Ali) | Yes, as a second set of tokens; the dark theme stays the default |

## Scope

- In scope: the screens listed in the specs, a small style guide (palette, type, components), a README that indexes the mockups.
- Out of scope: sign-in, register and leaderboard screens (see Open questions); animations; tablet and landscape layouts; Flutter code.

## Specs

- **S1** (C-28): `docs/ui/style-guide` defines the palette (background, surface, text and the tile colors used by the variants), the type scale and the shared components (primary button, icon button, top bar, card, tray slot), all in the dark arcade neon style.
- **S2** (FR-01): The **home** screen shows the suite name, a settings button and the selector of the four variants (changed after review B1).
- **S3** (FR-01): On the home screen, each variant (Hexa Lines, Hexa Fit, Hexa Sort, Hexa Merge) shows its name, a small preview and the player's best result (high score or levels completed); the whole card is the touch target.
- **S4** (FR-02): The **level select** screen, drawn for Hexa Fit and for Hexa Sort from one source, shows a grid of levels with their stars, the next playable level highlighted, locked levels marked, and what tapping a locked level does.
- **S5** (FR-03, NFR-04): The **game template** defines three fixed zones: a top bar (back or pause, the variant's result such as score or goals, and optional actions), a central board zone, and a bottom tray zone. The board zone does not assume hexagons beyond the drawing itself (ADR-0004).
- **S6** (FR-03, FR-05, FR-37, FR-45, FR-56, FR-66): Four **game** mockups on the template of S5:
  - Hexa Lines: radius-4 board (61 cells), tray with 3 pieces, score and streak; no undo button.
  - Hexa Fit: level figure, tray with the level's pieces, rotate, undo and redo buttons, move count and timer.
  - Hexa Sort: radius-2 board (19 cells) with color stacks, the next stack in the tray, goals reached out of the level's goal count; no undo button.
  - Hexa Merge: radius-2 board with numeric tiles, score, best score and an undo button for one move.
- **S7** (FR-06): The **victory** screen shows the result (score, or stars, moves and time for level-based variants) and the forward action ("Next level", or "See levels" after the last level), plus "Retry" and a way back; drawn for Hexa Fit and for the last level of Hexa Sort.
- **S8** (FR-07, FR-64): The **defeat** screen shows the final result and the actions "Retry" and a way back, for every variant that can lose: Hexa Lines (no piece fits), Hexa Sort (board full, SORT-5) and Hexa Merge (no move, MERGE-1). Hexa Merge also shows the target-reached message while the game goes on.
- **S9** (FR-09, FR-10): The **settings** screen offers music on/off, sound effects on/off and the language (Español / English).
- **S10** (FR-10): Every mockup uses text that fits in both Spanish and English; the mockups are drawn in Spanish, and the README lists the English strings of each screen.
- **S11** (C-11 style, Q5): Each screen exists as an editable source and as a PNG export at 2× (780 × 1688) in `docs/ui/`, and `docs/ui/README.md` shows every PNG with a one-line description and the requirement it covers.
- **S12** (FR-03): A **pause menu** (resume, restart, settings, quit) and a **leave confirmation** that says what is lost; the system back button and the iOS swipe-back open the pause menu.
- **S13** (FR-04, FR-14, FR-15, FR-32): A **states** sheet: sync status (up to date, syncing, offline, failed, guest), level loading and download failure, first launch, valid and invalid placement, and the back-button rules.
- **S14** (WCAG 2.2 AA): Color is never the only signal (a glyph per Hexa Sort color; outlined missing stars); text contrast >= 4.5:1 and meaningful non-text contrast >= 3:1; touch targets >= 48 × 48; Hexa Lines accepts tap-then-tap besides drag.
- **S15** (NFR-02, C-31): A **light theme** made only by redefining tokens; key screens exported in `docs/ui/png/light/`.
- **S16** (FR-10): Two screens exported in English (`docs/ui/png/en/`), and every screen fits at 360 × 780 without horizontal overflow.

## Allowed edit surfaces

- `docs/ui/**`
- `odd/tasks/0003-ui-mockups.md`
- `AI_USAGE.md` (one entry for this task)
- `THIRD_PARTY_NOTICES.md` (credits for fonts or other assets used by the mockups, C-14)

## Tasks

- [x] **T1** (S1) Style guide.
- [x] **T2** (S2, S3, S4) Home, game select and level select.
- [x] **T3** (S5, S6) Game template and the four game mockups.
- [x] **T4** (S7, S8, S9) Victory, defeat and settings.
- [x] **T5** (S10, S11) PNG exports and `docs/ui/README.md`.
- [x] **T6** `log-ai-usage` entry.
- [x] **T7** (S2, S3, S7, S8, S12–S16) Changes after the review of PR #14 (Eduard: B1–B5, S1–S9, O1–O7; Ali: light theme).

## Verification

| Spec | Evidence | Verdict |
|---|---|---|
| S1 | `docs/ui/png/style-guide.png`, sources `docs/ui/src/style-guide.html` and `docs/ui/src/tokens.css` | Pending team review |
| S2 | `docs/ui/png/01-home.png` (source `docs/ui/src/01-home.html`) | Pending team review |
| S3 | `docs/ui/png/01-home.png`: the four cards | Pending team review |
| S4 | `docs/ui/png/03-level-select.png` and `03b-level-select-sort.png`, both from `levels.js` | Pending team review |
| S5 | `docs/ui/png/04-game-template.png`; zones defined once in `docs/ui/src/game.css` | Pending team review |
| S6 | `docs/ui/png/05-hexa-lines.png`, `06-hexa-fit.png`, `07-hexa-sort.png`, `08-hexa-merge.png`, all on `game.css` and `hexgrid.js` | Pending team review |
| S7 | `docs/ui/png/09-victory.png`, `12-victory-sort-last.png` | Pending team review |
| S8 | `docs/ui/png/10-defeat.png`, `13-defeat-sort.png`, `14-defeat-merge.png`, `15-merge-target.png`; the three defeat boards checked by script (no move left) | Pending team review |
| S9 | `docs/ui/png/11-settings.png` | Pending team review |
| S10 | Spanish in the mockups; English strings per screen in `docs/ui/README.md` | Pending team review |
| S11 | Sources in `docs/ui/src/`, PNG exports at 780 × 1688 in `docs/ui/png/` (style guide and states sheet at 1440 wide), index `docs/ui/README.md` | Pending team review |
| S12 | `docs/ui/png/16-pause-menu.png`, `17-leave-confirm.png` | Pending team review |
| S13 | `docs/ui/png/18-states.png`; sync status on `01-home.png` and `11-settings.png` | Pending team review |
| S14 | Contrast computed from `tokens.css` with the WCAG formula (script in the review reply); glyphs on `07-hexa-sort.png`; targets in `tokens.css` and `06-hexa-fit.png` | Pending team review |
| S15 | `docs/ui/png/light/` (6 screens); only `tokens.css` defines the theme | Pending team review |
| S16 | `docs/ui/png/en/` (home, Hexa Fit); every phone screen rendered at 360 × 780 with a script that reports elements outside the screen: none horizontally | Pending team review |

## Open questions

- Sign-in, register and leaderboard (FR-11, FR-13) are not in the D12 list of `docs/PLAN.md`. Proposal: add them in a follow-up once D5 (API contract) defines the data they show.
- Task number 0003 assumes the game rules task on `docs/game-rules` keeps 0002; renumber if another task merges first.
- Proposal for the team: keep an endless game (Hexa Lines, Hexa Merge) when the player leaves it, so "Continue" resumes it. No requirement asks for it yet; it is marked as a proposal in `docs/ui/README.md`.

## Next step

Eduard re-reviews PR #14 against his comments of 2026-11-09; then merge and mark Done.

## Log

- 2026-11-09 — Valentina Maza (request, verbatim): "ok esta bien hagamso d12". Answers to Q1–Q5, verbatim: "A", "A", "A", "A", "A".
- 2026-11-09 — Valentina Maza with Claude (Opus 5.5, claude.ai): task drafted after five closed design questions (Q1–Q5); all five recommended options accepted.
- 2026-11-09 — Valentina Maza: "apruebalo asi perfecto" — specs approved by the owner without changes. Teammate approval of the specs (`odd/README.md` life cycle) is requested in PR #14.
- 2026-11-09 — Valentina Maza with Claude (Opus 5.5, claude.ai): T1 done. Shared tokens in `docs/ui/src/tokens.css` (palette, type, components) so every mockup reuses them; fonts Fredoka and Nunito (OFL 1.1) bundled and credited in `THIRD_PARTY_NOTICES.md`; PNG rendered with headless Chrome.
- 2026-11-09 — Valentina Maza with Claude (Opus 5.5, claude.ai): T2 done. Added `screens.css` (phone frame 390 × 844) and `hexgrid.js` (draws hexagonal boards from axial coordinates, adapted from Red Blob Games) so every screen and every game reuses one board drawing. Home adds a "Continue" shortcut to the last level; game select shows each variant's best result; level select is one screen for both level-based variants.
- 2026-11-09 — Valentina Maza with Claude (Opus 5.5, claude.ai): T3 done. `game.css` defines the three zones once; each game only fills them. Zone 3 holds pieces (Lines, Fit), one stack (Sort, as in SORT-6) or the six swipe directions (Merge). The Hexa Sort board was checked by hand so that no two neighboring stacks share a top color (the state after a cascade, SORT-3). Undo appears only in Fit (undo and redo) and Merge (one move).
- 2026-11-09 — Valentina Maza with Claude (Opus 5.5, claude.ai): T4, T5 and T6 done. Victory (Hexa Fit), defeat (Hexa Lines) and settings; `docs/ui/README.md` indexes every screen with its requirements and English strings; `AI_USAGE.md` entry added. All specs await team review in the pull request.
- 2026-11-09 — Valentina Maza: PR #14 opened. Self-check against `AGENTS.md`, `CLAUDE.md` and the `ship`, `odd-task` and `log-ai-usage` skills: PR body rewritten on the project template, verbatim prompts added to this log, page titles of the mockups switched to English.
- 2026-11-09 — Review of PR #14. Ali (AS18DC): approved; suggests trying a light background. Eduard (Eduardvs13): blocking B1–B5, should-fix S1–S9, optional O1–O7.
- 2026-11-16 — Valentina Maza (verbatim): "ya voy a aprobar esto y continuamos avanzando lo mas posible". Decisions, verbatim: B1 "Exacto a." (selector on the home screen, game select removed); light theme "Dale perfect.". On saving endless games when leaving: "si me gusta la idea" (kept as a proposal for the team).
- 2026-11-16 — Valentina Maza with Claude (Opus 5.5, claude.ai): T7 done. B2 victory for the last Sort level, defeats for Sort and Merge, target reached in Merge (rule from PR #13 and #18); B3 pause menu and leave confirmation; B4 glyph per Sort color; B5 dark text on Merge tiles from 8; S1 `--line-strong` and outlined stars; S2 48 px targets, rotate button moved off the tray; S3 tap-then-tap in Lines; S4 checked at 360 × 780 and fixed (icon buttons no longer shrink, tighter top bar); S5 `strings.js` and two English exports; S6/S7 states sheet and sync status; S8 next threshold in Sort; S9 Sort level select and a "Levels" action; O1–O6 applied; light theme. Each defeat board was checked with a script. FR-15 exists on `main` (merged with PR #12 after the review).
