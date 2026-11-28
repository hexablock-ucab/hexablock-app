# Third-Party Notices and Credits

The team cites every source of code, algorithms, assets and tools that it did not write. Code adapted from a source also carries an `// Adapted from: <title>, <url>` comment where it is used.

## Algorithms and references

| Source | Used for | Where |
|---|---|---|
| Red Blob Games, *Hexagonal Grids* — https://www.redblobgames.com/grids/hexagons/ | Axial coordinates, neighbors, rotation and lines on hex grids (reference for algorithms) | TODO: files that adapt it, each with an `// Adapted from:` comment |
| Tommy Ettinger, *Mulberry32* (2017, public domain, CC0) — https://gist.github.com/tommyettinger/46a874533244883189143505d203312c | The seeded random generator of the domain (NFR-05) | `docs/domain-model.md` §9; the generator class once it is written |

## Development tools (not shipped in the app)

| Tool | License | Used for |
|---|---|---|
| [commitlint](https://commitlint.js.org) | MIT | Checks commit messages (Conventional Commits) |
| [lefthook](https://github.com/evilmartians/lefthook) | MIT | Git hooks |
| [actions/checkout](https://github.com/actions/checkout), [actions/setup-node](https://github.com/actions/setup-node) | MIT | CI |
| [subosito/flutter-action](https://github.com/subosito/flutter-action) | MIT | Installs Flutter in CI |
| [wagoid/commitlint-github-action](https://github.com/wagoid/commitlint-github-action) | MIT | Checks commit messages in CI |
| [amannn/action-semantic-pull-request](https://github.com/amannn/action-semantic-pull-request) | MIT | Checks pull request titles in CI |
| [Cytoscape.js](https://js.cytoscape.org) 3.30.2, The Cytoscape Consortium | MIT (its license header is kept inside the file) | Draws the graph of `docs/diagrams/class-explorer.html`, embedded in that file so it opens offline |
| [PlantUML](https://plantuml.com) 1.2025.2 | GPL-3.0 (the tool only; the generated images are ours) | Renders the class diagrams in `docs/diagrams/` |

## Assets

| Asset | Author | License | Where |
|---|---|---|---|
| [Fredoka](https://fonts.google.com/specimen/Fredoka) (latin subset, weights 500–700, via [Fontsource](https://fontsource.org)) | The Fredoka Project Authors | SIL Open Font License 1.1 | `docs/ui/src/fonts/` (UI mockups) |
| [Nunito](https://fonts.google.com/specimen/Nunito) (latin subset, weights 600–800, via [Fontsource](https://fontsource.org)) | The Nunito Project Authors | SIL Open Font License 1.1 | `docs/ui/src/fonts/` (UI mockups) |
| [Interface Sounds](https://kenney.nl/assets/interface-sounds): 12 effects, unchanged (`click_002`, `toggle_001`, `drop_002`, `tick_002`, `back_002`, `error_008`, `confirmation_002`, `confirmation_003`, `confirmation_004`, `glass_002`, `pluck_001`, `maximize_006`) | Kenney (www.kenney.nl) | CC0 1.0 (public domain; crediting is optional, done here) | `docs/ui/audio/` (proposed sound map) |
| [Sci-fi Puzzle In-Game 3](https://opengameart.org/node/181258): background music loop | MintoDog (OpenGameArt) | CC0 1.0 (public domain; crediting is optional, done here and on the credits screen) | The app's background music (FR-09); the file is added with the app's audio assets |
| TODO (the win and lose jingles, see `docs/ui/audio/README.md`) | | | |
