# ODD task documents

ODD (Organic Driven Development) is the workflow of this repository (ADR-0005). It keeps **one document per substantial task** in `odd/tasks/`. Small, understood changes need no document.

## When a task needs a document

| The work is… | Document? |
|---|---|
| A question, an explanation or a review | No |
| A small, understood change (one or two files, clear outcome) | No: test first, change, verify |
| Two or more meaningful steps, a design decision, or work someone may resume later | **Yes** |

## What a task document holds

- **Specs** (`S1`, `S2`, …): observable, testable behavior in *Given / When / Then* form, each linked to requirement IDs in `docs/requirements.md`. Specs are the acceptance criteria; the catalog only says *what*.
- **Allowed edit surfaces:** the exact paths the implementation may change.
- **Tasks** (`T1`, …): the checklist, each linked to specs.
- **Verification:** the exact commands, then the evidence and the verdict per spec.
- **Log:** append-only history: the team's prompts verbatim, decisions and who made them, delegations, verdicts, commits and PRs. It feeds `AI_USAGE.md`.

## Life cycle

`Draft` → `Approved` (a teammate approves the specs) → `In progress` → `Verifying` → `Done` (PR merged).

Traceability: requirement ID → spec `S#` → test → commit → pull request → `AI_USAGE.md` entry.

## How to start one

Ask Claude Code, opened in this repository, for a new task (the `odd-task` skill), or copy `_TEMPLATE.md` to `tasks/NNNN-<slug>.md` with the next number. Review and approve the specs before implementation starts.

If a task raises a question only the professor can answer, record it as a team question (see `CLAUDE.md`) and link it in the log; do not guess.
