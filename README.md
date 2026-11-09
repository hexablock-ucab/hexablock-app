# HexaBlock Suite — Four games, one engine

[![CI](https://github.com/hexablock-ucab/hexablock-app/actions/workflows/ci.yml/badge.svg)](https://github.com/hexablock-ucab/hexablock-app/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-unit%20%7C%20integration%20%7C%20widget-blue)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Semester project — *Desarrollo de Software*, Universidad Católica Andrés Bello (UCAB), 2026-2.
> Team: Valentina Maza · Ali Dahouk · Eduard Velasco — see [Team](#team).

> **Project status:** foundation stage. Requirements, architecture decisions (all *Proposed*) and quality gates are in place; development starts after the team review. Sections marked *TODO* are filled as the work lands.

## Description

HexaBlock Suite is a mobile app with four casual puzzle games played on a hexagonal board — **Hexa Lines**, **Hexa Fit**, **Hexa Sort** and **Hexa Merge** — built on **one generic game engine**. Each game is an instantiation of the engine, not a copy: adding a fifth variant means adding classes or configuration, never editing the engine.

Proposed stack: Flutter and Dart ([ADR-0002](docs/adr/0002-flutter-and-dart.md)). Progress, leaderboards and level definitions sync with the [HexaBlock API](https://github.com/hexablock-ucab/hexablock-api).

## Documentation

| Document | Holds |
|---|---|
| [docs/requirements.md](docs/requirements.md) | Requirement catalog: constraints, functional and non-functional requirements with stable IDs |
| [docs/adr/](docs/adr/) | Architecture Decision Records |
| [docs/EXTENSIBILITY.md](docs/EXTENSIBILITY.md) | How to add a fifth variant without touching the engine |
| [docs/diagrams/](docs/diagrams/) | Class, Clean layers and extensibility diagrams (image and editable source) |
| [odd/](odd/) | One document per substantial task: specs, verification and log |
| [AGENTS.md](AGENTS.md) | Rules every contributor and AI agent follows |

## Demo / Screenshots

> TODO: screenshots or GIF of the four variants.

| Hexa Lines | Hexa Fit | Hexa Sort | Hexa Merge |
|---|---|---|---|
| _TODO_ | _TODO_ | _TODO_ | _TODO_ |

## Architecture

> TODO: embed `docs/diagrams/clean-architecture.png` and explain each layer.

The project follows Clean Architecture (Martin, 2017): four concentric layers whose dependencies point inward only. The proposed layout makes each layer a separate Dart package, so the compiler enforces the rule ([ADR-0003](docs/adr/0003-clean-architecture-as-dart-packages.md)); `tool/check-architecture.mjs` checks the rest in CI.

| Layer | Package | Contents | Must not depend on |
|---|---|---|---|
| Entities | `hexablock_engine` | TODO | Any other package; Flutter, `dart:io`, storage or network libraries. Randomness and clocks come in through ports. |
| Use cases | `hexablock_application` | TODO | `hexablock_adapters`, `app`; Flutter, `dart:io`, storage or network libraries |
| Interface adapters | `hexablock_adapters` | TODO | `app` |
| Frameworks & drivers | `app` | TODO | — (outermost layer) |

Placements that are not obvious:

- **Composition root:** `app/` is the only place that creates concrete classes and wires them to ports (ADR-0003).
- **Repository implementations and storage drivers:** TODO — fixed with the local persistence ADR.

## Generic Engine

> TODO: explain the generic types, their parameters and bounds, and how each variant instantiates them. Details: [docs/EXTENSIBILITY.md](docs/EXTENSIBILITY.md).

| Generic type | Type parameters | Bound and why | Lines | Fit | Sort | Merge |
|---|---|---|---|---|---|---|
| `HexBoard<TCell>` | TODO | TODO | TODO | TODO | TODO | TODO |

## Design Patterns

> TODO: one row per implemented pattern, with the justification and a code excerpt below the table.

| Pattern | Category | Where | Why here |
|---|---|---|---|
| Strategy | Behavioral | TODO | TODO |
| Abstract Factory | Creational | TODO | TODO |

## SOLID Principles

> TODO: one concrete example per principle, with the class, the justification and an excerpt.

## AOP

> TODO: the aspects implemented, the use cases they wrap and the SOLID-based strategy (decorators or proxies around the generic use cases).

## Offline play and sync

The game is fully playable without a network connection. Levels ship inside the app, progress is saved on the device, and both sync with the [HexaBlock API](https://github.com/hexablock-ucab/hexablock-api) when the player is signed in and the connection returns; new or changed levels are downloaded on sync.

> TODO (offline and sync ADR): what is stored on the device, when sync runs and how changes from two devices are reconciled.

| Situation | What the app does |
|---|---|
| No connection | TODO |
| The API is unreachable or returns an error | TODO |
| The player is not signed in | TODO |
| A level is new or changed on the server | TODO |
| The same progress changed on two devices | TODO |

## Levels

> TODO (level format): where the bundled levels live, the format they follow and how new levels arrive from the API.

Hexa Fit has at least 15 levels and Hexa Sort at least 10, designed by hand with progressive difficulty. Every bundled level is checked by an automated test that fails the build if the level is invalid or cannot be completed.

## Getting Started

> TODO (task 0001): prerequisites with versions, installation and run commands.

After cloning, run `npm install` once to install the git hooks (commit message and pre-push checks).

### Install on a phone

- **Android:** download the APK from the latest [GitHub Release](https://github.com/hexablock-ucab/hexablock-app/releases/latest).
- **iOS:** TODO — the route (TestFlight or direct installation from a Mac) is chosen in a follow-up ADR (see [ADR-0002](docs/adr/0002-flutter-and-dart.md)).

## Running Tests

> TODO (task 0001).

## AI Usage Documentation

How the team uses AI tools, with the prompts, results, corrections and a critical evaluation: [AI_USAGE.md](AI_USAGE.md).

## Contributing

Conventional Commits, branch naming, quality gates and the pull request process: [CONTRIBUTING.md](CONTRIBUTING.md).

## Team

| Member | GitHub | Main areas |
|---|---|---|
| Eduard Velasco | [Eduardvs13](https://github.com/Eduardvs13) | Generic engine, Hexa Lines, client architecture |
| Valentina Maza | [valenmaza](https://github.com/valenmaza) | User interface, Hexa Fit, Hexa Sort, level design |
| Ali Dahouk | [AS18DC](https://github.com/AS18DC) | API: authentication, progress, leaderboards, levels, deployment |

The areas follow the current work plan and say who leads each part; every member can explain any part of the project.

## Credits

Third-party code, algorithms, tools and assets: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

[MIT](LICENSE) © 2026 Valentina Maza, Ali Dahouk, Eduard Velasco.
