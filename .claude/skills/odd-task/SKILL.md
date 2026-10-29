---
name: odd-task
description: "Create or update an ODD task document in odd/tasks/ for substantial work: specs linked to requirement IDs, tasks, verification evidence and a verbatim log of the user's prompts. Use when a task has two or more meaningful steps, a design decision, or work worth resuming; also use to append decisions, verdicts and progress to an existing task document. Triggers: nueva tarea, abrir tarea ODD, documento de tarea, task doc, track this work, retomar tarea."
---

# ODD task document

One document per substantial task. It is the memory that survives a context reset and the evidence for `AI_USAGE.md`.

## Create

1. Pick the next number: list `odd/tasks/` and add one to the highest `NNNN`. Name the file `odd/tasks/NNNN-<kebab-slug>.md`.
2. Copy `odd/_TEMPLATE.md`. Fill `Objective`, `Problem`, `Requirements` (IDs from `docs/requirements.md`), `Scope` and `Out of scope`.
3. Write `## Specs` as numbered, testable statements `S1`, `S2`, …. Each spec names the requirement IDs it serves and, when possible, a concrete example (input → expected outcome).
4. Write `## Tasks` as a checklist `T1`, `T2`, …, each linked to the specs it covers. Mark the tasks that need a human decision.
5. Copy the user's original request **verbatim** as the first `## Log` entry, with the date and the author's name.
6. Show the document to the user and wait for approval of the specs before implementation starts.

## Update

- Append to `## Log`, never rewrite it. One entry per event: user prompt (verbatim), decision (with who decided), delegation (agent and scope), verdict (agent and result), commit or PR link.
- Tick tasks only with observed evidence (test output, verifier verdict).
- Keep `## Next step` to one line that a teammate could act on tomorrow.

## Rules

- Specs describe observable behavior, not implementation.
- Never invent a requirement ID. When the work needs a requirement that is not in the catalog, propose a catalog change to the user.
- Specs and tasks are in English. Log entries keep the language the person used.
