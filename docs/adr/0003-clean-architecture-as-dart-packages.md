# ADR-0003: Clean Architecture enforced with Dart workspace packages

- **Status:** Proposed — to review in the first team meeting
- **Date:** 2026-10-28
- **Proposed by:** Eduard Velasco
- **Deciders:** —
- **Requirements:** C-05, C-22, NFR-02, NFR-03

## Context

The Dependency Rule is easy to state and easy to break by accident, especially when AI agents write code. A folder convention does not stop a domain file from importing Flutter.

## Decision

The repository is a Dart pub workspace. Each Clean Architecture layer is its own package:

```
hexablock-app/
├── packages/
│   ├── hexablock_engine/        # Layer 1 — entities: board, coordinates, pieces, GameEngine, rules, scoring. Pure Dart.
│   ├── hexablock_application/   # Layer 2 — generic use cases and ports (repositories, piece sources, clock, random). Pure Dart.
│   └── hexablock_adapters/      # Layer 3 — presenters/view models, repository implementations, mappers, DTOs.
└── app/                         # Layer 4 — Flutter app: widgets, painters, navigation, storage and HTTP drivers, composition root.
```

The `pubspec.yaml` of each package lists only the inner packages it may use. A forbidden import fails to compile. `tool/check-architecture.mjs` adds the rules a package boundary cannot express (no `dart:io`, no randomness or clock in the domain, no variant names in the engine) and runs in CI.

## Alternatives considered

| Option | Why not |
|---|---|
| One package, folders per layer | The rule depends on discipline only; a lint can help but does not block the build. |
| Feature-first folders (one folder per game) | Encourages duplicating board, flow and persistence per game, which the assignment calls insufficient. |

## Consequences

- The domain can be tested with `dart test`, without Flutter.
- Dependency injection happens in one composition root inside `app/`.
- Slightly more setup (four `pubspec.yaml` files), paid once.
