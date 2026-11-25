# ADR-0003: Clean Architecture enforced with Dart workspace packages

- **Status:** Accepted
- **Date:** 2026-11-25 (proposed 2026-10-28)
- **Proposed by:** Eduard Velasco
- **Deciders:** Eduard Velasco, Ali Dahouk, Valentina Maza
- **Requirements:** C-05, C-22, NFR-02, NFR-03, NFR-05

## Context

The Dependency Rule is easy to state and easy to break by accident, especially when AI agents write code. A folder convention does not stop a domain file from importing Flutter.

## Decision

The repository is a Dart pub workspace. Each Clean Architecture layer is its own package:

```
hexablock-app/
├── packages/
│   ├── hexablock_engine/        # Layer 1 — entities: board, coordinates, pieces, GameEngine, rules, scoring,
│   │                            #   and the interfaces the domain itself calls (piece source, random generator). Pure Dart.
│   ├── hexablock_application/   # Layer 2 — generic use cases and the I/O ports (repositories, remote API, system clock). Pure Dart.
│   └── hexablock_adapters/      # Layer 3 — presenters/view models, repository implementations, mappers, DTOs.
└── app/                         # Layer 4 — Flutter app: widgets, painters, navigation, storage and HTTP drivers, composition root.
```

The `pubspec.yaml` of each package lists only the inner packages it may use. A forbidden import fails to compile. `tool/check-architecture.mjs` adds the rules a package boundary cannot express (no `dart:io`, no platform random generator or system clock in the domain, no variant names in the engine) and runs in CI.

**Where each interface lives.** An interface lives in the layer that calls it (the Dependency Rule):

- The interfaces the domain itself calls, such as the piece source and the random generator, live in `hexablock_engine`. The domain holds its own pure random algorithm, with its state as a value object, so that undo and saved games can restore the sequence (FR-16, FR-66, NFR-05); it is injected, and tests seed it. If these interfaces lived in layer 2, the domain would have to import an outer layer.
- The I/O ports, called by the use cases, live in `hexablock_application`: repositories, the remote API, session storage and the system clock.
- The check "no `Random(` in the domain" forbids the platform generator (`dart:math` `Random`), not the domain's own algorithm.

## Alternatives considered

| Option | Why not |
|---|---|
| One package, folders per layer | The rule depends on discipline only; a lint can help but does not block the build. |
| Feature-first folders (one folder per game) | Encourages duplicating board, flow and persistence per game, which the assignment calls insufficient. |

## Consequences

- The domain can be tested with `dart test`, without Flutter.
- Dependency injection happens in one composition root inside `app/`.
- Slightly more setup (four `pubspec.yaml` files), paid once.
