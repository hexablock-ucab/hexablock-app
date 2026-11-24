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

### What each entry records

- **One entry per significant AI use**, not one per prompt. The full prompts of a task stay in its task document in [odd/tasks/](odd/tasks/).
- **Prompt policy:** prompts that led to a design decision or exposed an AI error are quoted **verbatim**, in their original language. Routine prompts are summarized as a faithful paraphrase.
- **Verification:** each entry names the tests, commands or reviews that checked the AI's output.
- **Traceability:** each entry names its pull request. AI-assisted commits carry a `Co-Authored-By` trailer that names the model, so the history shows which commits had AI assistance.
- **Completion:** an entry is complete before its pull request is merged; no field stays pending. If something is still open, the entry says what and who closes it.
- **AI-generated content** (for example levels): the entry also states how many items were generated, how each one was checked and what was adjusted by hand.

## Usage log

<!-- Entries are added with the log-ai-usage skill. Newest last. -->

| Date | Entry |
|---|---|
| 2026-10-27 to 2026-10-28 | [Project foundation: course analysis, repositories, tooling and documentation](#2026-10-27-to-2026-10-28--project-foundation-course-analysis-repositories-tooling-and-documentation-setup-no-task-document) |
| 2026-11-08 | [Professor's answers of 2026-11-05 applied to the requirements](#2026-11-08--professors-answers-of-2026-11-05-applied-to-the-requirements-docs-no-task-document) |
| 2026-11-09 | [README and AI usage log adjusted after reviewing reference repositories](#2026-11-09--readme-and-ai-usage-log-adjusted-after-reviewing-reference-repositories-docs-no-task-document) |
| 2026-11-09 | [Domain modeling rules for DDD tactical patterns](#2026-11-09--domain-modeling-rules-for-ddd-tactical-patterns-docs-no-task-document) |
| 2026-11-09 | [UI mockups of the app screens (D12)](#2026-11-09--ui-mockups-of-the-app-screens-d12-odd-tasks-0003-ui-mockupsmd-pr-14) |

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

### 2026-11-08 — Professor's answers of 2026-11-05 applied to the requirements (docs; no task document)

- **Author:** Eduard Velasco
- **Tool / model:** Claude (claude.ai agent session, configured model Claude Opus 5.5).
- **Task:** Review the automatic transcription of the team's meeting with the professor against its context, record each answer in the team's question tracker, and apply the confirmed answers to the requirement catalog, `AGENTS.md` and the affected ADRs (C-05, C-06, C-08, C-11, C-17, C-18, C-27 to C-33, FR-04, FR-12, FR-14, FR-15, NFR-02).
- **Prompts (faithful paraphrase; original in Spanish):**
  - "Here are the transcription and the audio of everything the professor told us in the meeting; the transcription has errors. Make every change needed, record those decisions and arrange the next steps, very professionally, without inventing anything."
- **Result:** A revised transcription with the doubtful passages marked for the team to check against the audio; seventeen answered questions closed with the professor's words; new constraints C-28 to C-33 and FR-15; updated C-05, C-06, C-08, C-11, C-17, C-18, C-27, FR-04, FR-12, FR-14 and NFR-02.
- **Team modifications:** Pending: the team reviews the catalog before it becomes *Baseline*.
- **Errors and corrections:** The AI could not run speech recognition on the audio in its environment, so it corrected the existing transcription from context instead of producing a new one, and listed the passages a person must check by listening (for example, whether the AOP answer refers only to the aspect).
- **Lessons:** Quote the professor's exact words next to each decision, and keep the AI's interpretation in a separate column, so the team can tell what was said from what was inferred.

### 2026-11-09 — README and AI usage log adjusted after reviewing reference repositories (docs; no task document)

- **Author:** Eduard Velasco
- **Pull request:** #15, paired with hexablock-api #14
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5.
- **Task:** Compare the reference repositories from the previous semester that the course shared with this project's documents and with this semester's assignment, then apply the README and AI usage changes the team approved (C-09, C-10, C-18).
- **Prompts (faithful paraphrase; originals in Spanish):**
  - "Analyze in depth the reference repositories the professor sent and compare them with what the team has or plans. Describe each topic with evidence, classify each finding, and list proposed changes for the README and AI_USAGE.md and points for the team to review. Do not copy text or code from those repositories, do not invent, and do not assume something is right because they did it."
  - "I approve everything in the first list; make the pull requests."
- **Result:** An internal comparison kept in the team workspace (not in this repository) and, in this pull request: a "Must not depend on" column in the architecture table, the *Offline play and sync*, *Levels*, *Install on a phone* and *Team* sections of the README; the "What each entry records" rules, the entry index and the running error table in this file; the *Verification* field and the completion rule in the `log-ai-usage` skill, the pull request template and `CONTRIBUTING.md`.
- **Team modifications:** Eduard reviewed the proposed changes and approved them; the design points the comparison raised were left for the team to decide in the ADRs and design tasks.
- **Errors and corrections:** None detected in this change.
- **Verification:** Each edit was applied by exact text replacement that fails if the original text is not found once; the diff was reviewed in the pull request, and commitlint and CI run on it.
- **Lessons:** Reference projects help with documentation and process, but every finding was checked against this semester's assignment before adopting it; none of them had a generic engine to learn from.

### 2026-11-09 — Domain modeling rules for DDD tactical patterns (docs; no task document)

- **Author:** Eduard Velasco
- **Pull request:** #16, paired with hexablock-api #15
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5.
- **Task:** Write down how the domain model uses DDD tactical patterns before the domain model (D1) and the code exist, so that every agent and teammate follows the same rules (C-05, C-32).
- **Prompts (faithful paraphrase; originals in Spanish):**
  - "Are we using value objects, entities, aggregate roots, domain services, repositories and factories where they are needed? No plain getters and setters: rich names in the ubiquitous language that say the business intent. Distinguish clearly when something is a DDD tactical pattern and when it is not."
  - "Make the linked pull requests, and review carefully that there is no anemic code or other anti-patterns."
- **Result:** A *Domain model (DDD tactical patterns)* subsection in `AGENTS.md` §4 (rich model, tell-don't-ask, value objects, aggregates, domain services, domain events, and a table that tells DDD roles apart from GoF patterns and Clean Architecture parts), and a *Domain model* question in the `architecture-reviewer` agent.
- **Team modifications:** Eduard asked for the rules and approved the plan; the team reviews the wording in this pull request.
- **Errors and corrections:** A first draft used examples (an email value object, a registration command) that no requirement backs; the AI replaced them with examples taken from the requirements before committing.
- **Verification:** The rules were checked against Esposito (2024), chapter 6 (aggregates, methods over properties, anemic model) and the course's Clean Architecture class; the diff was reviewed in the pull request, and commitlint and CI run on it.
- **Lessons:** Writing the modeling rules before the domain model gives the reviewer agent something concrete to check, and the table of roles prepares the answer to "is this a DDD pattern or a GoF pattern?" in the defense.

### 2026-11-09 — UI mockups of the app screens (D12, [odd/tasks/0003-ui-mockups.md](odd/tasks/0003-ui-mockups.md), PR #14)

- **Author:** Valentina Maza
- **Pull request:** #14
- **Tool / model:** Claude (claude.ai agent session, Claude Opus 5.5) with access to Valentina's computer to read the team workspace and write the files; mockups rendered to PNG with headless Chrome in the agent's workspace.
- **Task:** Set up Valentina's machine for the project, take issue #34 (D12) and produce the high-fidelity mockups of every screen: style guide, home, game select, level select, game template, the four game screens, victory, defeat and settings (FR-01 to FR-10, C-28, NFR-04).
- **Prompts (faithful paraphrase; originals in Spanish):**
  - "Analyze the whole organization's repositories against the assignment; the professor stresses SOLID and that a change such as the database or the cell shape must be just adding a class."
  - "Eduard asked us to take a task from the workspace and approve the requirement PRs; how do I do it?" (followed by step-by-step help to install `gh`, clone the repositories and fix a push rejected for the wrong GitHub account).
  - "Let's do D12." Then five closed design questions, answered with the recommended option: dark arcade neon style; portrait phone only; one shared game template with fixed zones and one mockup per variant; high fidelity; editable source plus PNG.
  - "Approve the task document as is, and keep a report of what we did today for my teammates."
  - "Continue with T2", "continue with T3", "continue" (T4 and T5).
- **Result:** Task document `odd/tasks/0003-ui-mockups.md` (11 specs linked to requirements); `docs/ui/` with shared design tokens (`tokens.css`), phone frame (`screens.css`), game template zones (`game.css`) and a board-drawing helper (`hexgrid.js`), 11 screen sources with their PNG exports at 2×, a style guide and an index README with the English strings of each screen; font and algorithm credits in `THIRD_PARTY_NOTICES.md`.
- **Team modifications:** Valentina chose the five design options and approved the task document; she reviewed each batch of screens before committing them and asked for the work to continue screen by screen.
- **Errors and corrections:**
  - The first commit used the scope `ui`, which the repository does not allow — detected by the commitlint hook; changed to `docs`.
  - The first push was rejected (403) because git used an old GitHub account stored on the computer — detected from the error; the stored credential was removed and git now uses the `gh` login.
  - The six swipe arrows of Hexa Merge were drawn as near-equilateral triangles, so the diagonal ones seemed to point sideways — detected when reviewing the rendered PNG at full size; replaced by chevrons.
  - The first Hexa Sort board had two neighboring stacks with the same top color, a state the cascade rule (SORT-3) never leaves — detected by checking the board by hand against `docs/game-rules.md`; two stacks changed.
  - The first Hexa Lines defeat board left full rows that would have been cleared (LINES-2) — detected by the same check; the free cells were chosen with a small search so that every row of the three axes has one free cell and no two free cells touch.
  - Smaller visual defects found on review of each render: two yellow tiles side by side in the logo, a misaligned status bar, result chips wrapping to two lines, a squeezed icon, a faded "game over" stamp.
- **Review round (2026-11-16):** Eduard's review of PR #14 found defects the AI had not caught; they were fixed with the same session. Prompts, verbatim: "ya voy a aprobar esto y continuamos avanzando lo mas posible"; decisions "Exacto a." (game selector on the home screen) and "Dale perfect." (light theme).
  - The game selector was a separate screen, against assignment 5.1.1 and FR-01 — detected by Eduard (B1); moved to the home screen.
  - Result screens covered only Hexa Fit and Hexa Lines, and the games had no pause menu or way out — detected by Eduard (B2, B3); added for every variant.
  - Hexa Sort relied on color alone, and white numbers on bright Hexa Merge tiles had 2.3–2.9:1 contrast — detected by Eduard with the WCAG formula (B4, B5); a glyph per color and dark text were added, and the contrast was recomputed with a script.
  - Small touch targets, a rotate button overlapping the tray, a pause button that shrank at 360 px, missing offline and error states — detected by Eduard (S1–S9) and by a script that renders every screen at 360 × 780.
  - Adding a shared `.chip` component silently broke the color swatches of the style guide, which used the same class name — detected when looking at the rendered PNG; the swatch class was renamed.
  - The first light theme had three accents below 4.5:1 as text — detected by computing the contrast before publishing; the colors were darkened.
- **Both themes and the strings (2026-11-16):** prompt, verbatim: "q mas puedo adelantra? ir haciendo? acuerdate de hacer todo con sus verxipnes claras y oscuras y eso pues". Result: every screen exported in the light theme, theme and symbol settings, `docs/ui/tokens.json` and the ARB files in Spanish and English (120 keys, checked for equal keys and placeholders and parsed as ICU).
  - The pause menu and leave confirmation drew the game behind them in the dark theme even in the light export, because the iframe did not receive `?theme` — detected when looking at the light exports; `hexgrid.js` now passes the page's query to the iframe.
  - The style guide ignored `?theme` and printed the dark hex codes by hand — detected the same way; it now reads each value from the active theme.
  - Settings offered no way to choose the theme or to hide the color symbols promised in B4 — detected while writing the strings; both rows added.
- **Verification:** every mockup rendered to PNG and reviewed at full size; a script rendered every phone screen at 360 × 780 and listed overflowing elements; the contrast of every token pair was computed with the WCAG formula; the defeat boards were checked by script against `docs/game-rules.md`; the ARB files were checked for equal keys and placeholders and parsed as ICU. Eduard reviewed the pull request.
- **Lessons:** Render and look at every mockup at full size; diagrams that look right in code can read wrong on screen. Check example game states against the written rules, not only the visual style. Shared tokens and one template made each later screen faster and kept the four games consistent. Check a design against the assignment's exact wording and an accessibility standard before asking for review, not after.

## Critical evaluation

- **Approximate share of code with AI assistance:** TODO (updated at the end of the project).
- **Cases where the AI was wrong or suboptimal, and how we detected them:** the *Errors and corrections* field of each entry has the details. The table below collects them and is updated at every milestone, not only at the end.

| Date | What the AI got wrong | How it was detected | Category |
|---|---|---|---|
| 2026-10-28 | First commits authored as the AI, with the attribution line glued to the subject | Eduard reviewed the commit metadata | Process |
| 2026-10-28 | Proposed architecture written as binding rules | Eduard's review | Design |
| 2026-10-28 | Repository folders placed inside the course folder, then nested | Eduard's review | Process |
| 2026-10-28 | Nine requirements misclassified as non-functional; rows bundling several requirements | Eduard questioned the classification | Requirements |
| 2026-10-28 | Commit bodies over 100 characters | The `commits` check in CI | Tooling |
| 2026-10-28 | Dependabot commits rejected by commitlint | CI | Tooling |
| 2026-11-08 | Could not run speech recognition on the meeting audio; corrected the existing transcription from context instead | The AI reported the limitation itself and listed the passages to check by ear | Tooling |
| 2026-11-09 | Scope `ui` not allowed by commitlint; push rejected for an old GitHub account | commitlint hook; the 403 error | Tooling |
| 2026-11-09 | Merge swipe arrows pointing sideways; Sort and Lines example boards impossible under the rules | Valentina's review of each render; checking boards against `docs/game-rules.md` | Design |
| 2026-11-16 | Game selector on its own screen, missing result and pause screens, color-only cues, low contrast, small targets | Eduard's review of PR #14 | Design |
| 2026-11-16 | Shared `.chip` class broke the style guide; light-theme exports drew dark iframes | Looking at the rendered PNGs | Design |
- **Impact on productivity and quality:** TODO.

## Effective prompts

Prompts that produced the best results, kept as reusable examples.

- "Are you sure about X? Check it against <standard or source> and tell me what is wrong before changing anything." — made the AI find and fix defects in its own catalog.
- "Ask me everything that is not explicit; assume nothing." — turned silent assumptions into explicit decisions.
