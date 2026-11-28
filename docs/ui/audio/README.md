# Sounds and music

Proposed sound map for FR-09, in the same pull request as the mockups so the team can listen before the app exists.
Every file here is from [*Interface Sounds* by Kenney](https://kenney.nl/assets/interface-sounds), CC0 1.0 (public domain; [`LICENSE-kenney-interface-sounds.txt`](LICENSE-kenney-interface-sounds.txt)), copied unchanged from the pack.
Listen to all of them in a browser: open [`listen.html`](listen.html).
The files move to the app's assets when the Flutter project exists; the app plays them through one audio port, so a sound is replaced by changing a file, not code.

## Effects

| Event | File | Length | Notes |
|---|---|---|---|
| Tap a button or a card | `click_002.wav` | 0.01 s | |
| Switch a setting | `toggle_001.wav` | 0.16 s | |
| Place a piece or a stack (Lines, Fit, Sort) | `drop_002.wav` | 0.20 s | |
| Rotate a piece (Fit) | `tick_002.wav` | 0.02 s | Once per 60° step. |
| Remove a placed piece, undo (Fit, Merge) | `back_002.wav` | 0.09 s | |
| Invalid placement | `error_008.wav` | 0.14 s | Soft, so it does not punish. |
| Clear one line (Lines) | `confirmation_002.wav` | 0.56 s | |
| Clear several lines at once (Lines) | `confirmation_004.wav` | 0.50 s | |
| One cascade transfer (Sort) | `glass_002.wav` | 0.13 s | Each step of a cascade a little higher in pitch, so a long chain is heard. |
| Remove a block of 10 (Sort) | `confirmation_003.wav` | 0.32 s | |
| Merge two tiles (Merge) | `pluck_001.wav` | 0.11 s | Higher pitch for higher values. |
| Reach the target tile (Merge) | `maximize_006.wav` | 0.39 s | |
| Win a level, lose a game | — | — | Two short jingles from Kenney's [*Music Jingles*](https://kenney.nl/assets/music-jingles) (CC0), still to download and choose. |

## Music

The team chose MintoDog's music (review of #19): [*Sci-fi Puzzle In-Game 3*](https://opengameart.org/node/181258), CC0, loopable, 100 BPM, which fits the neon arcade style. It is credited in `THIRD_PARTY_NOTICES.md` and on the credits screen; the file is downloaded from OpenGameArt and added with the app's audio assets. [*Cozy Puzzle In-Game 2*](https://opengameart.org/node/185146) by the same author (CC0) stays as the alternative.

Music and effects mute separately in Settings (FR-09). When a file is added, its line goes in `THIRD_PARTY_NOTICES.md`.
