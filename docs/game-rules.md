# Game rules

The assignment fixes the shape of the four games but leaves many details open.
This document records one decision for each open rule, so the engine, the rule tests and the level files all follow the same rules.

- **Who decides:** the team decides and documents these rules (C-33).
- **Format of each rule:** the decision, the reason (an assignment section, the team's logic or a requirement ID) and a worked example.
  Each example is written so that a rule test can reuse it as its Arrange – Act – Assert data (C-23b).
- **Topology:** the rules speak of "the topology's axes and neighbors", not of hexagons, because the grid geometry may change (ADR-0004, Proposed).
  Values that hold only for the current hexagonal topology are marked **[hex]**.
- **Value objects:** scores, stars, moves, time and goals are domain concepts (`Score`, `StarCount`, `MoveCount`, `ElapsedTime`, `GoalCount`), not bare numbers.
  This document names them only; it does not design the classes.

Rules are labeled (`SORT-1`, `LINES-1`, ...) so tests and the final table can refer to them.

## Terms

- **Neighbors:** two cells are neighbors when the topology says they share an edge.
- **Axes:** the directions along which the topology draws straight rows of cells.
- **Fixed order:** every topology lists its cells in one fixed order of its own.
  "Lowest cell" means the cell that comes first in that order.
  This document does not fix a coordinate scheme; the topology defines the order, and the order never changes during a game.
- **Top block:** the contiguous run of same-color tiles at the top of a stack.

## Hexa Sort

Board: radius 2, 19 cells **[hex]** (FR-50). Each cell holds a stack of colored tiles or is empty.

### SORT-1 — Unit of transfer and direction

- **Decision:** a transfer moves the whole top block of one color at once.
  It moves from the stack with the smaller top block of that color to the neighboring stack with the larger one.
  "Most tiles of that color" compares the top blocks only, not tiles of that color buried lower in the stack.
- **Reason:** FR-52 (assignment 1.3) says tiles transfer "toward the stack with the most tiles of that color" but does not say how many move or how to count. Moving whole blocks and comparing only what is visible keeps each step simple and predictable for the player.
- **Example:** cell A has red×2 on top, its neighbor B has red×3 on top.
  The cascade moves A's red×2 onto B. B now has red×5 on top. A exposes the tile below its old block, or becomes empty if it held nothing else.

### SORT-2 — Tie between two stacks

- **Decision:** when two neighboring top blocks of the same color have the same size, the destination is the stack that was just placed or most recently changed.
  If neither stack is, the destination is the lowest cell in the topology's fixed order.
- **Reason:** FR-52 does not cover a tie. Favoring the stack the player just touched matches what the player expects; the fixed order makes every other case deterministic (NFR-05).
- **Example:** the player places a stack P with red×3 on top. Its neighbor N has red×3 on top.
  N's red×3 moves onto P. P now has red×6 on top.

### SORT-3 — Cascade order

- **Decision:** after a stack is placed, the cascade repeats these steps until no transfer is possible:
  1. Find every eligible pair: two neighboring non-empty stacks whose top tiles have the same color.
  2. If one or more pairs touch the most recently changed stack, take one of those. Among them, take the pair whose other cell is lowest in the fixed order.
  3. Otherwise, take the pair whose lower cell is lowest in the fixed order; if two pairs share that cell, take the one whose other cell is lower.
  4. Run that one transfer (SORT-1, SORT-2), then apply SORT-4.
  5. The destination of that transfer becomes the most recently changed stack. At the start, the placed stack is the most recently changed stack.
- **Reason:** FR-52 says "in cascade" but not in which order. Without a fixed order the same move could end in different boards, and the replay test of NFR-05 could not pass. Starting from the stack the player just changed keeps the chain local, as the player sees it.
- **Example:** cells are named by their place in the fixed order (#1 is the lowest).
  - Before the move: #4 has red×3 on top; #11 has red×1 on top; #2 and #3 are neighbors and each has green×1 on top. #10 is empty. #10 neighbors #4 and #11; #4 and #11 are not neighbors. No other neighboring stacks share a top color.
  - The player places P = blue×1 under red×2 on #10.
  - Step 1: pairs touching #10 are #10–#4 and #10–#11. #4 is lower than #11, so #10–#4 runs first. #10's red×2 is smaller than #4's red×3, so it moves to #4. #4 has red×5 on top; #10 shows blue×1. #4 is now the most recently changed stack.
  - Step 2: no pair touches #4 (#10 is blue now, #11 is not its neighbor). The lowest pair is #2–#3. It is a tie, and neither cell was changed last, so the destination is #2, the lower cell. #2 has green×2 on top; #3 shows what was below or is empty.
  - Step 3: no eligible pair remains, because the tiles exposed under the moved blocks match no neighbor's top color. The cascade stops.
  Running the same move on the same board always gives this final board.

### SORT-4 — Removal at 10 tiles

- **Decision:** when a top block reaches 10 or more tiles, the whole block is removed at once and counts as one goal.
  The score gains 10 points per removed tile (SCORE-1).
  Tiles below the removed block stay, and the cascade goes on (SORT-3).
  The rule applies whenever a top block reaches 10 or more tiles, so it also applies to a stack that arrives from the tray already holding such a block.
- **Reason:** FR-53 says a stack of 10 same-color tiles is removed and counts one goal. A transfer can push a block past 10, so the rule says "10 or more" and removes the whole block; keeping the tiles below lets the cascade continue naturally.
- **Example:** a stack has red×7 on top. A neighbor's red×6 moves onto it, making red×13.
  All 13 red tiles are removed. The goal count rises by 1. The score rises by 13 × 10 = 130.
  The stack now shows the tile that was under the red block, or the cell is empty.

### SORT-5 — End of game

- **Decision:** the end of game is checked once the cascade stops.
  First, if the goal count of the level is met, the player wins, even if no empty cell remains.
  Otherwise, if no empty cell remains, the player loses.
  Otherwise, the game goes on.
- **Reason:** FR-54 (assignment 1.3). In Hexa Sort the only move is to place a stack on an empty cell (FR-51), so a full board means no valid move remains. Checking victory first rewards the move that reaches the goal.
- **Example:** the level goal is 3 goals and the player has 2. Only one cell is empty.
  - The player places a stack there and the cascade removes a block: 3 goals, so the player wins, even though the board may still be full.
  - If instead the cascade removes nothing and empties no cell, the board is full with 2 goals: the player loses.
  - If a transfer or a removal empties a cell, the game goes on.

### SORT-6 — Tray

- **Decision:** the tray offers one stack at a time. A seeded generator draws each stack, and the level's parameters set what a stack may contain (SORT-8).
  The generator gets its randomness through an injected random source, so the same seed and the same parameters give the same sequence of stacks.
  The level stores the seed, so every player gets the same stacks.
- **Reason:** FR-51 says the player places "the stack offered by the tray". NFR-05 requires every random source to be injectable and replayable. Level parameters let each level tune its difficulty without code. A seed stored in the level keeps the per-level leaderboard fair (RANK-1), because every player faces the same sequence, and lets the designer calibrate the move thresholds (SORT-7) against a known sequence.
- **Example:** two games of the same level both start with seed 42. Both trays offer the same first stack, the same second stack, and so on.

### SORT-7 — Moves and stars

- **Decision:** a Hexa Sort move is one stack placed. Hexa Sort has no undo, so nothing else changes the count.
  A won level earns 1 star, plus 1 star for each move threshold met. A threshold is met when the moves are less than or equal to it.
  Each level has two move thresholds, so the maximum is 3 stars, as in Hexa Fit.
- **Reason:** FR-05 lets the team define the scoring; FR-06 and FR-08 need a result per level (score and stars), and C-19e names a progress model with stars. Two thresholds give the same 3-star scale as Hexa Fit (FIT-3).
  Assignment §1.5 gives Hexa Sort the progress model "levels", without stars; the team adds stars because FR-05 lets it define the scoring and FR-08 saves stars per level, so the level select screen shows the same progress for both level-based variants.
- **Example:** a level with a goal of one 10-tile block and thresholds 30 and 24. The player wins with 25 moves.
  25 ≤ 30 meets the first threshold; 25 > 24 misses the second. Stars = 1 + 1 + 0 = 2.

### SORT-8 — How the tray draws a stack

- **Decision:** for each stack, the generator first draws its size, a whole number in the level's `stackSize` range (both ends included).
  Then it draws the color of each tile, from the bottom tile to the top tile, among the level's `colors`.
  Every size in the range and every color is equally likely, each tile is drawn on its own, and all draws come from the generator seeded with the level's seed (SORT-6).
- **Reason:** SORT-6 says the level's parameters set what a stack may contain, but not how; a fixed order of draws is what makes the same seed give the same stacks (NFR-05). Drawing each tile on its own lets one stack hold several color blocks, which is what feeds the cascade (FR-52). The level format keeps `stackSize` at most 9, so no stack arrives already holding a block to remove (SORT-4).
- **Example:** a level has `colors` red, cyan and green and `stackSize` 1 to 4.
  A random source stubbed to answer, in order, size 3 and then the 1st, 1st and 2nd color of the list gives a stack of red, red, cyan from bottom to top: cyan×1 on top of red×2.
  Two games of the same level, with the same seed, offer the same stacks in the same order.

### What a Hexa Sort level file must provide

The level format (`docs/level-format.md` of `hexablock-api`) provides, for each Hexa Sort level:

- the goal count;
- the tray generator parameters (SORT-6, SORT-8): the seed, the colors in play and the size range of a stack (its minimum and maximum number of tiles);
- two move thresholds for the stars (SORT-7).

## Hexa Lines

Board: radius 4, 61 cells **[hex]** (FR-30).

### LINES-1 — What a line is

- **Decision:** a line is every complete row of cells along one of the topology's axes, whatever its length.
  Short rows near the edge count as lines too.
- **Reason:** FR-33 (assignment 1.1) speaks of lines "along any of the 3 axes" but not of their length. Counting every row keeps the rule the same for any board shape the topology produces.
- **Example [hex]:** the radius-4 board has 3 axes with 9 rows each, 27 rows in all. Along one axis the rows hold 5, 6, 7, 8, 9, 8, 7, 6 and 5 cells (61 cells in total). Filling the last empty cell of a 5-cell edge row completes one line.

### LINES-2 — Clearing

- **Decision:** after a piece is placed, all lines it completes clear at the same time. Nothing falls: there is no gravity.
  A cell that belongs to two or more completed lines clears once, and every one of those lines counts toward L, the number of lines cleared.
- **Reason:** FR-32 places pieces with no gravity, so clearing has none either. Clearing all lines at once makes the result independent of the order in which the lines are found.
- **Example [hex]:** a piece completes a 5-cell row on one axis and a 9-cell row on another axis. The rows cross at one cell.
  L = 2. The board loses 5 + 9 − 1 = 13 cells.

### LINES-3 — Score

- **Decision:** each move scores `cells placed + 10 × L × combo × streak`.
  - `cells placed` is the number of cells of the piece.
  - `L` is the number of lines the move clears (LINES-2).
  - `combo` = L.
  - `streak` is the number of consecutive moves that clear at least one line, counting the current one. A move that clears no line scores only its cells and resets the streak to 0.
  So a clearing move scores `cells placed + 10 × L × L × streak`.
- **Reason:** FR-34 (assignment 1.1) asks for cells placed plus a bonus per line, with multipliers for combos and streaks, but gives no numbers. These are the team's numbers.
- **Example:** four moves in a row, starting with streak 0.

  | Move | Piece cells | L | Streak | Points |
  |---|---|---|---|---|
  | 1 | 2 | 1 | 1 | 2 + 10 × 1 × 1 × 1 = 12 |
  | 2 | 3 | 3 | 2 | 3 + 10 × 3 × 3 × 2 = 183 |
  | 3 | 4 | 0 | 0 | 4 |
  | 4 | 1 | 2 | 1 | 1 + 10 × 2 × 2 × 1 = 41 |

  The total after move 4 is 12 + 183 + 4 + 41 = 240.

### LINES-4 — Pieces do not rotate

- **Decision:** a Hexa Lines piece never rotates and never mirrors. The catalog (LINES-5) lists each orientation the team wants as a separate piece.
- **Reason:** FR-32 asks the player to drag a piece where it fits and says nothing about rotation, and FR-42 gives rotation to Hexa Fit only. Listing orientations as pieces keeps the move a single drag and leaves the variety to the catalog.
- **Example:** a straight bar of 3 cells along one axis and the same bar along another axis are two entries of the catalog.

### LINES-5 — Piece catalog

- **Decision:** the tray takes its pieces from a fixed catalog kept as configuration: poly-hexes of 1 to 5 cells (FR-31). Each entry has a shape and a color (LINES-7). A new shape is new data, not new code.
- **Reason:** FR-31 fixes the size of the pieces, not their shapes. NFR-01 asks that a new piece shape need only new configuration.
- **Example:** adding a 4-cell piece changes the catalog only; no class changes.

### LINES-6 — Drawing the pieces

- **Decision:** each piece of the tray is drawn at random among the catalog entries, with a seeded generator, and with no check that it fits. The game ends when none of the available pieces fits (FR-35).
- **Reason:** FR-31 asks for 3 pieces and a new tray when the 3 are used; FR-35 ends the game when none fits, which only happens if the draw does not guarantee a fit. NFR-05 requires the generator to be injectable and replayable.
- **Example:** two games started with the same seed offer the same three pieces, in the same order, in their first tray.

### LINES-7 — Piece colors

- **Decision:** each catalog entry carries its color, as a name of the palette (`red`, `cyan`, ...), never as a hex code. Placing a piece fills its cells with that color. The color never changes a rule: a line clears whatever the colors of its cells.
- **Reason:** assignment §1.5 gives Hexa Lines the cell content "Color", so a placed cell needs a color, and the only thing the player places is a piece. Taking it from the catalog entry keeps the color a datum of the piece (LINES-5), needs no extra random draw, and lets the client map the name to its palette and its symbol, as it does for the level files.
- **Example:** the catalog entry "bar of 3" has color cyan. Placing it fills 3 cells with cyan. A row made of 4 cyan cells and 1 red cell is complete and clears (LINES-1).

Hexa Lines is endless; its result is the score (RANK-1).

## Hexa Fit

### FIT-1 — The figure

- **Decision:** a level's figure is connected through shared edges (the topology's neighbors) and has no interior holes.
  A hole is a group of cells outside the figure that has no path to the outside: every route of non-figure cells that leaves the figure is blocked by the figure.
  The check looks at the unbounded grid, because a Hexa Fit board is the figure itself and has no border to act as a wall. An open bay, with one way out, is not a hole.
  The figure's area equals the total area of the level's pieces.
- **Reason:** FR-40 (assignment 1.2) calls the figure "closed" and "an arbitrary set of cells" with an area equal to the pieces. The team reads "closed" as one connected piece with no holes, so the player always fills one solid shape. ADR-0006 (Proposed) proposes that the level builder checks these conditions.
- **Example [hex]:** a center cell and its 6 neighbors form a 7-cell figure; pieces of 3 and 4 cells fit it. The same 6 neighbors without the center form a ring around a hole: not a valid figure. Two groups of cells that share no edge: not a valid figure.

### FIT-2 — Pieces

- **Decision:** a piece rotates by the topology's rotation step (60° **[hex]**), only while it is off the board (FIT-7), and never mirrors.
  A level may contain the same piece more than once. Equal pieces are interchangeable: the win check looks only at which cells are covered, not at which copy covers them.
- **Reason:** FR-42 asks for rotation and says nothing about mirroring; leaving mirroring out keeps the level design under control. FR-43 defines victory by coverage only.
- **Example:** a level has two identical 3-cell pieces. The player places them in either order and wins the same way. A piece whose mirror image differs cannot be flipped to fit.

### FIT-3 — Stars

- **Decision:** a won level earns 1 star, +1 if the moves are less than or equal to the level's move par, +1 if the time is less than or equal to the level's time par. The maximum is 3 stars.
  Hexa Fit has no points: its result is stars, moves and time (RANK-1).
- **Reason:** FR-44 (assignment 1.2) awards stars by moves and time. FR-05 lets the team define the scoring, and FR-43 says Hexa Fit has no defeat, so winning is the only result.
- **Example:** move par 8 and time par 60 s. The player wins with 8 moves in 75 s. Stars = 1 + 1 + 0 = 2.

### FIT-4 — Counting moves

- **Decision:** place, remove and rotate each add 1 to the move count. A rotation adds 1 per rotation step of the topology (60° **[hex]**), so turning a piece 180° adds 3.
  Undo and redo add nothing and subtract nothing: the move count only grows.
- **Reason:** FR-44 counts moves and FR-45 offers unlimited undo and redo. If undo subtracted moves, the player could rewind for free; a count that only grows keeps the par meaningful.
- **Example:** place, undo, place again = 2 moves.
  A longer one: place A (1), rotate B by one step (2), place B (3), undo (3), redo (3), remove A (4) = 4 moves.
  Turning a piece 180° adds 3 moves, one per 60° step.

### FIT-5 — Counting time

- **Decision:** the time starts at the player's first action, which is any place, remove or rotate (the actions that count as moves, FIT-4). It pauses while the app is in the background or the game is paused (FIT-6), and stops on victory.
  It is counted in whole seconds: the total is truncated to the second below.
  It comes from an injected `Clock`, never from the system clock directly.
- **Reason:** FR-44 counts time. The player should not lose time for reading the level before acting, or for leaving the app. NFR-05 requires an injectable, testable source, so tests use a fake clock.
- **Example:** the player acts first at t = 0, plays 40.6 s, leaves the app for 30 s, comes back and wins 20.7 s later.
  Time = 40.6 + 20.7 = 61.3 s, counted as 61 s. With a time par of 60 s, the time star is missed.

### FIT-6 — Pause

- **Decision:** the pause button and the "How to play" modal stop the clock and hide the board until the player continues.
- **Reason:** FR-44 counts time, so a player who stops must not lose time; hiding the board stops a player from planning while the clock is stopped, which would make the time par meaningless.
- **Example:** the player has played 20 s, pauses for 30 s and continues. The clock still shows 20 s: the 30 s of pause add nothing.

### FIT-7 — Rotation off the board

- **Decision:** a piece rotates only while it is off the board. A piece on the board does not rotate: to turn it, the player removes it, rotates it and places it again, and each of those actions counts (FIT-4).
- **Reason:** FR-42 asks for rotation but not where. A piece rotated on the board would need a pivot and a rule for every case where the turned piece overlaps another one or leaves the figure (FR-41). Rotating off the board leaves one check, at placement, and matches the example of FIT-4 (rotate B, then place B) and the level format's solution, which turns a piece and then places it.
- **Example:** piece A is on the board. The player wants it turned one step: remove A (1), rotate A by one step (2), place A (3) = 3 moves. Asking to rotate A while it is on the board is not a valid action: the board and the move count stay the same.

### What a Hexa Fit level file must provide

Besides the figure and the pieces (FR-40), each Hexa Fit level provides a move par and a time par (FIT-3). The format is in `docs/level-format.md` of `hexablock-api`.

## Hexa Merge

### MERGE-1 — Target tile and end of game

- **Decision:** Hexa Merge is an endless game. Reaching the target tile (2048) does not end it: the first time the tile appears in a game, the app tells the player that the target was reached, and play continues.
  The game ends only when no move changes the board (FR-64). Its result is the score (SCORE-2), which updates the high score (FR-67).
- **Reason:** assignment §1.4 names the target tile as the victory, while §1.5 (progress model: high score) and §5.1 item 4 ask for an endless game with a high score. Ending the game at the target would cap the score and contradict §1.5 and §5.1; marking the target as reached keeps the victory of §1.4 without ending the game.
- **Example:** the score is 20 400 and the board has two 1024 tiles in line. A swipe merges them: a 2048 tile appears, the score becomes 22 448 (SCORE-2), the app shows that the target was reached, and the next swipe is accepted.
  Later, no swipe in any of the six directions changes the board: the game ends with its current score.

### MERGE-2 — Merge order

- **Decision:** a tile made by a merge does not merge again in the same move. When three or more equal tiles stand in a row, the pair nearest the edge the tiles slide toward merges first.
- **Reason:** FR-62 says two equal tiles that collide merge, but not what happens with three or with a tile just made. One merge per tile per move, starting from the edge, gives one result for every row (NFR-05) and is the rule players know from 2048-style games.
- **Example:** a row is read with the edge it slides toward on the right.
  `2, 2, 4` slides to `_, 4, 4`: the two 2s merge, and the new 4 does not merge with the 4 that was already there.
  `2, 2, 2` slides to `_, 2, 4`: the two 2s nearest the edge merge, and the 4 sits against the edge.

### MERGE-3 — New tiles

- **Decision:** a game starts with 2 tiles. After each move that changes the board, a new tile appears in a random empty cell: a 2 with probability 90 % and a 4 with probability 10 %. Both numbers are parameters of the tile source, not constants of the engine.
  A swipe that changes nothing is not a move: it adds no tile and cannot be undone.
- **Reason:** FR-63 asks for a new 2 or 4 after each valid move but gives no odds. Parameters keep the odds out of the engine (NFR-01), and the source is seeded and injected (NFR-05).
- **Example:** every tile already rests against the edge in the swiped direction. The swipe changes nothing: no new tile appears, and undo still refers to the previous move.

### MERGE-4 — Undo

- **Decision:** the player can undo one move, and cannot undo twice in a row. Undo restores the board, the score, the state of the random generator and the "target reached" notice.
  So repeating the undone move gives the same new tile in the same cell, and undoing the move that made the first 2048 tile also takes back the notice.
- **Reason:** FR-66 offers undo of the last move. Restoring the generator stops the player from undoing until a better tile appears; restoring the score keeps it consistent with the board (SCORE-2). Undo returns exactly the earlier state, so a notice tied to a tile that no longer exists goes too; reaching 2048 again shows it again.
- **Example:** the player swipes and a 2 appears in cell X. The player undoes and swipes the same way again: a 2 appears in X again. A second undo right after the first is not accepted.

## Scoring of Hexa Sort and Hexa Merge

Hexa Lines scores in LINES-3 and Hexa Fit in FIT-3.

### SCORE-1 — Hexa Sort score

- **Decision:** Hexa Sort scores 10 points per tile removed (SORT-4). The level result also carries stars and moves (SORT-7).
- **Reason:** FR-05 lets the team define the scoring; FR-06 shows the score on the victory screen. Counting tiles rewards cascades that push a block well past 10.
- **Example:** a level removes two blocks, one of 10 tiles and one of 13. Score = 10 × 10 + 13 × 10 = 230. Goals = 2.

### SCORE-2 — Hexa Merge score

- **Decision:** each merge adds the value of the resulting tile. A new tile that appears after a move adds nothing.
  Undo restores both the board and the score of the move it undoes.
- **Reason:** FR-65 (assignment 1.4) sums "the values produced by every merge". FR-66 offers undo; restoring the score with the board keeps the two consistent. FR-67 records the high score.
- **Example:** the score is 100. A swipe merges 4 and 4: +8, so the score is 108. Undo: the board returns and the score drops by 8, back to 100.
  A swipe that merges 2 + 2 and 8 + 8 adds 4 + 16 = 20.

## Levels

These rules apply to the level-based variants, Hexa Fit and Hexa Sort.

### LEVEL-1 — Unlocking

- **Decision:** level 1 is open. Each level unlocks when the player completes the one before it. Levels that arrive from the server are added at the end, in the order of their `number`.
- **Reason:** FR-02 shows locked levels but does not say how they open; FR-14 adds levels without an app update, so they need a place in the order.
- **Example:** the player has completed levels 1 to 15. A level 16 arrives on the next sync: it appears unlocked at the end of the list.

### LEVEL-2 — Progressive difficulty

- **Decision:** each level has a `difficulty` from 1 to 5 that never goes down from one level to the next within a variant. A test checks it on the level files.
- **Reason:** FR-46 and FR-55 ask for progressive difficulty; a number per level makes that checkable instead of a matter of opinion.
- **Example:** difficulties 1, 1, 2, 2, 3 are valid; a 3 followed by a 2 fails the test.

## Leaderboard

The leaderboard exists per `gameId` and, for level-based variants (Hexa Fit and Hexa Sort), per level (FR-22, FR-13). Each of these is one table.

### RANK-1 — Order

- **Decision:** each table is ordered as follows. "Date" is the moment the result was achieved, taken from the phone; earlier ranks higher. The API rejects a date in the future.

  | Variant | Order |
  |---|---|
  | Hexa Lines | score descending, then date ascending |
  | Hexa Merge | score descending, then date ascending |
  | Hexa Fit | stars descending, moves ascending, time ascending, then date ascending |
  | Hexa Sort | stars descending, moves ascending, then date ascending |

  If every criterion ties, the user id decides, ascending. This needs the API to expose a stable user id (design task D5).
- **Reason:** FR-22 and FR-13 ask for a global leaderboard but no order. Each order uses the result its variant produces (LINES-3, SCORE-2, FIT-3, SORT-7). Earlier date first rewards whoever reached the result first. The user id gives every table a total order, so two clients always show the same ranking.
- **Example:** on one Hexa Fit level, user U1 has 3 stars, 20 moves and 95 s; user U2 has 3 stars, 20 moves and 80 s. U2 ranks first.
  In Hexa Lines, U1 scores 1200 on 3 November and U2 scores 1200 on 1 November: U2 ranks first.

### RANK-2 — One entry per user

- **Decision:** each user appears once per table, with the user's best result under that table's order (RANK-1).
- **Reason:** a global leaderboard (FR-22) compares players, not attempts. One entry per user stops one player from filling the table.
- **Example:** on one Hexa Sort level, a user wins first with 2 stars and 25 moves, then with 3 stars and 23 moves, then with 2 stars and 20 moves. The table shows one entry: 3 stars, 23 moves.

### RANK-3 — Global leaderboard of the level-based variants

- **Decision:** the table per `gameId` of Hexa Fit orders users by total stars descending, levels completed descending, sum of moves ascending, sum of time ascending, date of the latest of those results ascending, then user id ascending.
  Hexa Sort uses the same order without the time.
  The sums use each user's best result in each level (RANK-2).
- **Reason:** FR-13 and FR-22 ask for a leaderboard per variant as well as per level, and RANK-1 only orders one level. Stars first rewards the quality of the play, then the number of levels rewards progress; the sums break ties the same way RANK-1 does inside a level.
- **Example:** in Hexa Fit, two users have 45 stars and 15 levels each. One has 150 moves in total, the other 160: the one with 150 ranks first.

## Rules and requirements

| Rule | Topic | Requirement IDs |
|---|---|---|
| SORT-1 | Unit of transfer and direction | FR-52 |
| SORT-2 | Tie between two stacks | FR-52, NFR-05 |
| SORT-3 | Cascade order | FR-52, NFR-05 |
| SORT-4 | Removal at 10 tiles | FR-53 |
| SORT-5 | End of game | FR-54, FR-51 |
| SORT-6 | Tray | FR-51, NFR-05 |
| SORT-7 | Moves and stars | FR-05, FR-06, FR-08, C-19e |
| SORT-8 | How the tray draws a stack | FR-51, FR-52, NFR-05 |
| LINES-1 | What a line is | FR-33 |
| LINES-2 | Clearing | FR-33, FR-32 |
| LINES-3 | Score | FR-34, FR-05 |
| LINES-4 | Pieces do not rotate | FR-32, FR-42 |
| LINES-5 | Piece catalog | FR-31, NFR-01 |
| LINES-6 | Drawing the pieces | FR-31, FR-35, NFR-05 |
| LINES-7 | Piece colors | FR-31, FR-33 |
| FIT-1 | The figure | FR-40 |
| FIT-2 | Pieces | FR-42, FR-43 |
| FIT-3 | Stars | FR-44, FR-43, FR-05 |
| FIT-4 | Counting moves | FR-44, FR-45 |
| FIT-5 | Counting time | FR-44, NFR-05 |
| FIT-6 | Pause | FR-44 |
| FIT-7 | Rotation off the board | FR-41, FR-42, FR-44 |
| MERGE-1 | Target tile and end of game | FR-64, FR-67 |
| MERGE-2 | Merge order | FR-62 |
| MERGE-3 | New tiles | FR-63, NFR-05 |
| MERGE-4 | Undo | FR-66, NFR-05 |
| SCORE-1 | Hexa Sort score | FR-05, FR-06 |
| SCORE-2 | Hexa Merge score | FR-65, FR-66, FR-67 |
| RANK-1 | Order | FR-22, FR-13 |
| RANK-2 | One entry per user | FR-22, FR-13 |
| RANK-3 | Global leaderboard of the level-based variants | FR-13, FR-22 |
| LEVEL-1 | Unlocking | FR-02, FR-14 |
| LEVEL-2 | Progressive difficulty | FR-46, FR-55 |

Every rule also traces to C-33 and C-23b (its example is a rule test).

## Out of scope

- The level file format: `docs/level-format.md` of `hexablock-api`. This document only names what the files must provide.
- The API contract, including how the user id and the leaderboard are exposed (design task D5).
- The README summary of these rules that C-33 asks for. It follows in a separate change.
