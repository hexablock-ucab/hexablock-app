# ADR-0001: Record architecture decisions

- **Status:** Proposed — to review in the first team meeting
- **Date:** 2026-10-28
- **Proposed by:** Eduard Velasco
- **Deciders:** —
- **Requirements:** C-06, C-07, C-27

## Context

The assignment grades design decisions, and the team must defend them live (§7.1). Decisions made in chat or inside an AI session are lost.

## Decision

Every architecturally significant decision is recorded as a short ADR in `docs/adr/`, using `0000-template.md` (the format Michael Nygard proposed). An ADR starts as *Proposed* and becomes *Accepted* when the three members agree in a pull request review. An Accepted ADR is never edited to change its decision: a new ADR supersedes it. Accepted ADRs are requirements for code and for AI agents.

## Alternatives considered

| Option | Why not |
|---|---|
| Decisions only in chat, meetings or AI sessions | They are lost, and the team cannot show why it chose something. |
| A single long design document | Hard to review one decision at a time; it goes stale. |

## Consequences

- The defense preparation starts from the ADRs.
- AI agents read ADRs before designing; an abstraction declared in an Accepted ADR is not speculation.
