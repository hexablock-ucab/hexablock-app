# ADR-0002: Flutter and Dart for the game client

- **Status:** Proposed — to review in the first team meeting
- **Date:** 2026-10-28
- **Proposed by:** Eduard Velasco
- **Deciders:** —
- **Requirements:** C-01, C-02, C-16d, C-19, C-25

## Context

The assignment leaves the technology open (Flutter, React Native, Unity, Godot, Kotlin and others) but requires generic programming with bounded generics (C-02, C-19), widget tests (C-25) and an Android or iOS executable (C-16d).

## Decision

Use Flutter (stable channel) and Dart 3 for the client.

## Alternatives considered

| Option | Why not |
|---|---|
| Unity / Godot | Strong for real-time games, but heavy for turn-based puzzles; the engine framework tends to invade the domain, and generic programming and unit testing are less natural. |
| React Native | Viable, but TypeScript generics are erased at runtime and mobile canvas rendering needs extra libraries. |
| Kotlin (Android only) | Good generics, but locks the app to Android. |

## Consequences

- Dart generics are reified and support bounds (`T extends Mergeable<T>`), which fits C-19f.
- `flutter_test` gives unit and widget tests out of the box; `integration_test` covers navigation.
- The board is drawn with `CustomPainter`; no game engine (such as Flame) is needed for turn-based puzzles, which keeps dependencies few.
- The official `dart-flutter` Claude Code plugin and the Dart MCP server support AI-assisted work.
- An iOS build needs a Mac with Xcode; the delivery targets Android (C-16d allows either).
