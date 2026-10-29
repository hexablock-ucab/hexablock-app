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

## Critical evaluation

- **Approximate share of code with AI assistance:** TODO (updated at the end of the project).
- **Cases where the AI was wrong or suboptimal, and how we detected them:** see the *Errors and corrections* field of each entry; summary TODO.
- **Impact on productivity and quality:** TODO.

## Effective prompts

Prompts that produced the best results, kept as reusable examples.

- "Are you sure about X? Check it against <standard or source> and tell me what is wrong before changing anything." — made the AI find and fix defects in its own catalog.
- "Ask me everything that is not explicit; assume nothing." — turned silent assumptions into explicit decisions.
