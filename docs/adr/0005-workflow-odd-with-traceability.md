# ADR-0005: Development workflow — ODD with requirement traceability

- **Status:** Proposed — to review in the first team meeting
- **Date:** 2026-10-28
- **Proposed by:** Eduard Velasco
- **Deciders:** —
- **Requirements:** C-03, C-04, C-10, C-13, C-18, C-27

## Context

The course promotes spec-driven development (Martinelli, 2026) and the assignment requires a rigorous AI usage log (§7). Full spec-driven toolchains create several documents per change, which is heavy for small changes and for a six-week project.

## Decision

We apply spec-driven principles proportionally, with **Organic Driven Development (ODD)**:

- `docs/requirements.md` is the specification core: stable IDs for constraints, functional and non-functional requirements.
- Small, understood changes go straight to code, test first.
- Each substantial change gets **one** document in `odd/tasks/`, with specs (`S#`) linked to requirement IDs, tasks, verification evidence and a log that keeps the team's prompts verbatim (input for `AI_USAGE.md`).
- Claude Code orchestrates three sub-agents: `odd-explore` (read-only mapping), `odd-worker` (bounded implementation, test first, no commits) and `odd-verify` (independent verification per `S#`), plus `architecture-reviewer` for boundary changes.
- Quality gates are automatic: lefthook (commit message, format), CI on every PR, protected `main` with pull requests, squash merge and, once the three members have joined, one approval.

## Alternatives considered

| Option | Why not |
|---|---|
| OpenSpec / GitHub Spec Kit | Good tools, but a second planning system and several files per change; more ceremony than the project needs. |
| No written specs | Loses traceability and the prompt log the assignment requires. |

## Consequences

- Traceability chain: requirement ID → task spec `S#` → tests → commit → PR.
- The `.claude/` folder (agents, skills, hooks) is part of the deliverable and is documented in `AI_USAGE.md`.

## References

- Martinelli, S. (2026). *Spec-Driven Development*. Apress Pocket Guides. https://doi.org/10.1007/979-8-8688-2851-5
- Osmani, A., Saboo, S., & Kartakis, S. (2026). *The New SDLC With Vibe Coding: From ad-hoc prompting to Agentic Engineering*.
