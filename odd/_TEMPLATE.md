# NNNN — <task title>

- **Status:** Draft | Approved | In progress | Verifying | Done
- **Owner:** <team member>
- **Branch / PR:** `<type>/<slug>` · #<n>
- **Requirements:** <IDs from docs/requirements.md>
- **ADRs:** <ADR numbers that constrain this task>

## Objective

One sentence: the outcome when this task is done.

## Problem

Why this is needed now. What fails or is missing today.

## Scope

- In scope: …
- Out of scope: …

## Specs

Observable, testable statements. Each links to requirement IDs. Quote exact values, messages and examples.

- **S1** (FR-xx): Given …, when …, then ….
- **S2** (NFR-xx): …

## Allowed edit surfaces

The only paths the implementation may change. Anything else needs a decision first.

- `<path>`

## Tasks

- [ ] **T1** (S1) …
- [ ] **T2** (S1, S2) …
- [ ] **T3** Update the README, `docs/EXTENSIBILITY.md` and diagrams if affected.
- [ ] **T4** `log-ai-usage` entry.

## Verification

Commands, run exactly as written:

```bash
dart format --output=none --set-exit-if-changed .
flutter analyze --fatal-infos
flutter test --coverage
node tool/check-architecture.mjs
node tool/check-test-names.mjs
node tool/check-coverage.mjs
```

| Spec | Evidence | Verdict |
|---|---|---|
| S1 | | |

## Open questions

Questions for the team or the professor, with a link when recorded.

## Next step

One line a teammate could act on tomorrow.

## Log

Append-only. User prompts verbatim, decisions with who decided, delegations, verdicts, commits and PRs.

- YYYY-MM-DD HH:MM — <name> (prompt): "…"
