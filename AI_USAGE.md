# AI Usage Documentation

This file documents every significant use of AI tools in this repository, as the assignment requires (§7.2). The team is responsible for all code and documents, whether or not AI assisted them, and can explain every part of them.

## Tools

| Tool | Version / model | Role in the workflow |
|---|---|---|
| Claude Code | 2.1.312 — Sonnet 5.5 (main session, exploration, verification, review), Opus (implementation sub-agent) | Coding agent in the terminal: exploration, test-first implementation, independent verification and design review. |
| Claude (claude.ai, agent session) | Configured model: Claude Opus 5.5 | Course research, requirement analysis, repository and tooling setup, documentation drafts. |
| Context7 MCP | — | Up-to-date library documentation. |
| Dart MCP server (`dart-flutter` plugin) | 1.0.7 | Analyzer, tests and Flutter guidance. |

## Workflow

The team works with **ODD (Organic Driven Development)** and requirement traceability ([ADR-0005](docs/adr/0005-workflow-odd-with-traceability.md)):

1. Requirements live in [docs/requirements.md](docs/requirements.md) with stable IDs.
2. Each substantial task has one document in [odd/tasks/](odd/tasks/), with specs linked to those IDs and a verbatim log of the prompts.
3. Claude Code delegates to sub-agents defined in [.claude/agents/](.claude/agents/): `odd-explore` (read-only mapping), `odd-worker` (bounded implementation, test first, no commits), `odd-verify` (independent verification per spec) and `architecture-reviewer` (independent design review).
4. Deterministic guardrails: git hooks (Conventional Commits and checks before push), Claude Code hooks (no commits on `main`, no force pushes or skipped hooks, format and analysis after each edit, a reminder to compact long sessions), CI on every pull request and a protected `main`.
5. A team member reviews every AI-assisted change in a pull request, and significant uses are logged below.

Project rules for agents: [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md).

## Usage log

<!-- Entries are added with the log-ai-usage skill. Newest last. -->

### 2026-10-27 to 2026-10-28 — Project foundation: course analysis, repositories, tooling and documentation (setup; no task document)

- **Author:** Eduard Velasco
- **Tool / model:** Claude (claude.ai agent session, configured model Claude Opus 5.5) with access to the course platform, GitHub and a cloud workspace; Claude Code 2.1.312 on Eduard's computer to install tools and verify the setup.
- **Task:** Read Module 7 of the course (assignment, architecture classes, readings); choose an AI workflow; create the organization's repositories with quality gates, agent rules, sub-agents, skills and hooks; write the requirement catalog, the proposed ADRs, the ODD template and the documentation skeletons (C-03, C-04, C-09, C-10, C-13, C-18).
- **Prompts (faithful paraphrase; originals in Spanish):**
  - "Access Module 7, download and analyze everything, convert it to Markdown if that saves tokens, and tell me how we should proceed before doing anything."
  - "Review my installed skills and plugins: which to use, which conflict, and what else we need for a professional result that fully meets the assignment."
  - "Analyze a classmate's agent kit and workflow (explore / worker / verify agents) and tell me what to adopt."
  - "Shouldn't the requirements, architecture, diagrams and use cases be decided by us, step by step? Redo it properly, ask me everything, assume nothing."
  - "Are you sure you classified functional, non-functional and constraints correctly, with the right wording and the required level of detail?"
  - "Keep a list of questions for the professor at all times: only real ambiguities he can settle, not team decisions."
- **Result:** The course material in Markdown, split by chapter; three repositories (client, API, private team workspace) with CI, commit and architecture checks, protected `main` and Dependabot; agent rules, ODD sub-agents, skills and hooks in both project repositories; a requirement catalog traced to the assignment; ADR-0000 to ADR-0005 as *Proposed*; ODD template and first task; README and documentation skeletons; questions for the professor as issues of the team workspace.
- **Team modifications:** Eduard stopped the first version and required that every architecture choice stay *Proposed* until the team decides; that the repositories be recreated so the history starts clean with team authorship; that the work be split into small pull requests reviewed one by one; that the three repositories sit side by side in one project folder; that the agent kit be written in the team's own words; and that the requirement catalog be reclassified and rewritten.
- **Errors and corrections:**
  - The first commits were authored as the AI and had the attribution line glued to the subject — detected by Eduard; the repositories were recreated.
  - Proposed architecture was written as binding rules — detected by Eduard; marked *Proposed*.
  - The first folder layouts put the repositories inside the course folder and later nested them — detected by Eduard; replaced by three sibling repositories.
  - Nine requirements were labelled non-functional although they were design or verification constraints, and several rows bundled many requirements — detected after Eduard questioned the classification; the catalog was rewritten (one requirement per row, `shall` and EARS wording, ISO/IEC 25010 tags).
  - Commit bodies longer than 100 characters failed commitlint in CI — detected by the `commits` check; the pull request was recreated with wrapped messages instead of force-pushing.
  - Dependabot commits failed commitlint — detected in CI; commitlint now ignores Dependabot's sign-off line and updates are grouped.
- **Lessons:** Let the AI prepare infrastructure and drafts, but keep design decisions explicit, reviewed and recorded in ADRs. Review commit metadata, not only file contents. Ask the AI to check its own output against a named standard; it found real defects when asked.

### 2026-11-08 — Document the game rules the assignment leaves open (odd/tasks/0002-game-rules.md, PR #13)

- **Author:** Eduard Velasco
- **Tool / model:** Claude Code 2.1.312 — Sonnet 5.5 for the main session, `odd-explore` and `odd-verify`; Opus for `odd-worker` (models pinned in `.claude/agents/`).
- **Task:** Design task D2: decide and document the Hexa Sort cascade, what a Hexa Lines line is, the Hexa Fit figure, the score and stars of each variant, and the leaderboard order and tie-breaks. Output: `docs/game-rules.md`. Requirements: C-33 (pending in PR #12), FR-05, FR-22, FR-33, FR-34, FR-44, FR-52 to FR-54, FR-65.
- **Prompts (originals in Spanish):**
  - "Tarea de diseño D2 … reglas de juego que el enunciado deja abiertas … Es documentación, no código. … Sigue ODD: crea la rama con ship, explora con odd-explore y hazme las preguntas que falten una por una, cerradas, con tu recomendación y las alternativas. No decidas reglas sin preguntarme. Después crea el documento de la tarea en odd/tasks/ con specs ligadas a requisitos y espera mi aprobación antes de escribir docs/game-rules.md." (full text in the task log)
  - "apruebo todo" — approval of the specs S1 to S16 and the proposals O1 to O5.
  - "okey estoy de acuerdo" — acceptance of `docs/game-rules.md` after the verification.
- **Result:** The AI asked 23 closed questions, each with a recommendation and alternatives. `odd-explore` mapped the sources. `odd-worker` wrote `docs/game-rules.md`. `odd-verify` gave a verdict per spec (15 PASS, 1 PARTIAL) and simulated the Hexa Sort cascade on 200,000 random boards to check that it terminates and is deterministic. Task document `odd/tasks/0002-game-rules.md` holds the decisions, specs and verdicts.
- **Team modifications:** Eduard made every rule decision by answering the closed questions; he chose the recommended option each time. He also approved the specs before the document was written. No rule came from the AI without his answer, except the points listed under errors, which he accepted at the end.
- **Errors and corrections:**
  - The branch was cut from `main`, which lacks C-33 (it exists only in the open PR #12) — detected by `odd-explore`; C-33 is cited as pending.
  - The first description of one option for Hexa Fit moves was self-contradictory (undo "neither adds nor subtracts" yet "follows the active timeline") — detected while reviewing the answer; a clarifying question was asked and the counter only grows.
  - `odd-worker` made 11 detail choices the task document did not state (cascade pair order, rotation counted per step, truncation of seconds, user-id tie-break direction, and others) — it reported them; they are in the task log.
  - `odd-verify` found the Sort tray parameters only as examples (S7), and left unclear the rotation count, whether a rotation starts the Fit clock, and the hole definition at the board edge — three were settled with new questions; the Sort parameters were named without a question.
  - Two clarifications were added without asking (SORT-4 also applies to a stack arriving with a block of 10 or more; the SORT-3 example now says why no pair remains); they follow from earlier decisions.
  - The four fixes made after the verdict were not re-run through `odd-verify`.
- **Lessons:** Closed questions with a recommendation made the decisions fast, but the AI's option wording can hide a contradiction, so reread the options before answering. A verifier that simulates a rule finds more than one that only reads it. Details added by the worker need an explicit list for the team to confirm.

## Critical evaluation

- **Approximate share of code with AI assistance:** TODO (updated at the end of the project).
- **Cases where the AI was wrong or suboptimal, and how we detected them:** see the *Errors and corrections* field of each entry; summary TODO.
- **Impact on productivity and quality:** TODO.

## Effective prompts

Prompts that produced the best results, kept as reusable examples.

- "Are you sure about X? Check it against <standard or source> and tell me what is wrong before changing anything." — made the AI find and fix defects in its own catalog.
- "Ask me everything that is not explicit; assume nothing." — turned silent assumptions into explicit decisions.
