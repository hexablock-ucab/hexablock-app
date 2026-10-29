@AGENTS.md

# Claude Code rules for this repository

The rules in `AGENTS.md` apply first. This file adds how Claude Code works here.

## The task size picks the level

| Task | Level | What you do |
|---|---|---|
| A question, an explanation, a review | **Chat** | Answer. Do not edit files. |
| A small, understood change (one or two files, clear outcome) | **Agent** | Do it directly, test first, verify, done. No task document. |
| A substantial change (two or more meaningful steps, a design decision, or work worth resuming later) | **Agent team** | Open an ODD task document, then orchestrate `odd-explore` → `odd-worker` → `odd-verify`. |

When in doubt between two levels, ask the user with one closed question.

## ODD: Organic Driven Development

ODD is the workflow of this repository. It applies spec-driven principles (Martinelli, 2026) only where they pay off: one document per substantial task, nothing for small tasks.

For a substantial task:

1. **Explore.** Delegate read-only mapping to `odd-explore`. Read the requirement IDs the task touches in `docs/requirements.md`, the relevant ADRs and, when available, the assignment section they trace to (see *Course sources*).
2. **Resolve uncertainty.** If a real decision is open, ask the user. Use the `grill-me` skill for design questions and `weigh-options` when two options compete. Never decide architecture silently.
3. **Track.** Create `odd/tasks/NNNN-<slug>.md` from `odd/_TEMPLATE.md` with the `odd-task` skill. Each spec `S#` links to requirement IDs. Copy the user's request verbatim into `## Log`.
4. **Implement.** Delegate bounded work to `odd-worker`. Always pass `## Allowed edit surfaces` (exact paths) and `## Verification` (exact commands).
5. **Verify.** Delegate to `odd-verify` for a verdict per `S#`. Delegate to `architecture-reviewer` when the change touches a layer boundary, an extension point or a public interface.
6. **Close.** Update the README sections, `docs/EXTENSIBILITY.md` and diagrams if needed. Run `ci-local` and `log-ai-usage`. Ship with the `ship` skill.

Keep the task document current. Append every user decision and every verdict to `## Log` as it happens. The document is what survives a context reset.

## Course sources (local, outside this repository)

Each teammate's setup can link two read-only folders of the team's private workspace through the personal `.claude/settings.local.json`:

- `../hexablock-workspace/context/proyecto/ENUNCIADO_HexaBlockSuite_v1.0.md`: the assignment. It overrides every other source, and `docs/requirements.md` traces to it. Read the section itself; do not rely on a summary.
- `../hexablock-workspace/library/README.md`: maps each topic (Clean Architecture, SOLID, GoF patterns, generics, AOP, testing, UML) to the chapters of the books the professor published. Read only the chapter you need; each book's `_INDEX.md` lists sizes in tokens.

Never copy text from these folders into this repository: the books are copyrighted and the course material is internal. Cite author and chapter in ADRs and the README instead. If the folders are missing, say so and continue with `docs/requirements.md`.

When the assignment is ambiguous, or a choice affects grading and is not the team's to make, stop and tell the user. Never resolve such a question silently. The team keeps these questions as issues labeled `pregunta-profesor` in its private workspace repository: check the open ones first, and with the user's approval create the issue in Spanish with `gh issue create -R hexablock-ucab/hexablock-workspace --label pregunta-profesor --label prioridad-<alta|media|baja> --title "..." --body "..."`.

## Delegation routing

- Read-only exploration: `subagent_type: odd-explore` (never `general-purpose` for this).
- Bounded implementation: `subagent_type: odd-worker`.
- Tests, builds and spec probes: `subagent_type: odd-verify`.
- Independent design review: `subagent_type: architecture-reviewer`.
- Do not pass `model` on these calls. The agent files pin model and effort.
- Independent work runs in parallel. Two writers never share an edit surface.

## Context hygiene

- One task per session. When a task closes, start a new session (`/clear`) for the next one.
- Compact (`/compact`) or restart when the context passes about 150k tokens, after you write the state to the task document.
- Read whole files once instead of many small ranges. Batch independent tool calls.

## Skills of this repository

| Skill | Use it to |
|---|---|
| `odd-task` | Create or update an ODD task document. |
| `add-variant` | Add a new game variant through the engine's extension points. |
| `document-pattern` | Add a design pattern to the README table with justification and a code excerpt. |
| `log-ai-usage` | Write the `AI_USAGE.md` entry for the current task, with the real prompts. |
| `ship` | Create the branch, make Conventional Commits and open the PR. |
| `git-rescue` | Recover from a git mistake safely. |
| `ci-local` | Run every CI check locally before a push. |
| `weigh-options` | Compare design options against the code and requirements, and recommend one. |

The `Mentor` output style (`.claude/output-styles/mentor.md`) is optional: turn it on with `/output-style mentor` when you want each design decision explained for the defense.

Global skills that also help here: `grill-me` (interview the user about a design), `handoff` (pass the session to a teammate), `writing-for-agents` (edit this file or a skill), `context7` (current library docs).

**Do not use the superpowers planning skills** (`brainstorming`, `writing-plans`, `executing-plans`) in this repository. The superpowers plugin is disabled here because ODD owns planning. Two planning systems produce conflicting documents.

## Things you never do

- Edit the engine to make one variant work. Find or create the extension point instead.
- Commit, push or merge without the user asking. Commits happen through the `ship` skill.
- Answer "it works" without observed test output.
- Invent an API, a package version or a Flutter widget. Check with `context7` or the Dart MCP server.
