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
| 2026-11-08 | [Document the game rules the assignment leaves open](#2026-11-08--document-the-game-rules-the-assignment-leaves-open-oddtasks0002-game-rulesmd-pr-13) |
| 2026-11-09 | [README and AI usage log adjusted after reviewing reference repositories](#2026-11-09--readme-and-ai-usage-log-adjusted-after-reviewing-reference-repositories-docs-no-task-document) |
| 2026-11-09 | [Domain modeling rules for DDD tactical patterns](#2026-11-09--domain-modeling-rules-for-ddd-tactical-patterns-docs-no-task-document) |
| 2026-11-09 | [UI mockups of the app screens (D12)](#2026-11-09--ui-mockups-of-the-app-screens-d12-odd-tasks-0003-ui-mockupsmd-pr-14) |
| 2026-11-24 to 2026-11-25 | [Domain model (D1) and class diagram (D7)](#2026-11-24-to-2026-11-25--domain-model-d1-and-class-diagram-d7-oddtasks0005-domain-modelmd) |
| 2026-11-25 | [Class-model generator moved to `tool/`](#2026-11-25--class-model-generator-moved-to-tool-oddtasks0005-domain-modelmd) |
| 2026-11-25 | [Domain model rules without DDD](#2026-11-25--domain-model-rules-without-ddd-docs-no-task-document) |
| 2026-11-25 | [Game rules completed with the team decisions of 2026-11-24](#2026-11-25--game-rules-completed-with-the-team-decisions-of-2026-11-24-oddtasks0002-game-rulesmd-pr-13) |
| 2026-11-25 | [Requirements baseline](#2026-11-25--requirements-baseline-docs-no-task-document) |
| 2026-11-25 | [ADRs of the app accepted](#2026-11-25--adrs-of-the-app-accepted-oddtasks0006-accept-adrsmd) |
| 2026-11-25 | [App skeleton: pub workspace, composition root and CI](#2026-11-25--app-skeleton-pub-workspace-composition-root-and-ci-oddtasks0001-bootstrap-workspacemd) |

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

### 2026-11-08 — Document the game rules the assignment leaves open (odd/tasks/0002-game-rules.md, PR #13)

- **Author:** Eduard Velasco
- **Pull request:** #13
- **Tool / model:** Claude Code 2.1.312 — Sonnet 5.5 for the main session, `odd-explore` and `odd-verify`; Opus for `odd-worker` (models pinned in `.claude/agents/`).
- **Task:** Design task D2: decide and document the Hexa Sort cascade, what a Hexa Lines line is, the Hexa Fit figure, the score and stars of each variant, and the leaderboard order and tie-breaks. Output: `docs/game-rules.md`. Requirements: C-33, FR-05, FR-22, FR-33, FR-34, FR-44, FR-52 to FR-54, FR-65.
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
- **Verification:** `odd-verify` verdict per spec (15 PASS, 1 PARTIAL, then fixed) and a simulation of the Hexa Sort cascade on 200,000 random boards; Eduard reviewed the document.
- **Lessons:** Closed questions with a recommendation made the decisions fast, but the AI's option wording can hide a contradiction, so reread the options before answering. A verifier that simulates a rule finds more than one that only reads it. Details added by the worker need an explicit list for the team to confirm.

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
- **Team decisions applied (2026-11-24):** prompt, verbatim: "sigamos". Result: review point O5 (state colors separated from tile colors), the how-to-play modal (screen 19 and the steps of the four variants in the ARB files), the Hexa Fit board hidden while paused, and the saving of endless games marked as accepted.
  - The pause sheet behind the Hexa Fit modal lost the page's theme once the iframe got its own query (`?paused`), because `hexgrid.js` only passed the query to an iframe without one — detected while writing the change; the page's query is now appended.
- **Verification:** every mockup rendered to PNG and reviewed at full size; a script rendered every phone screen at 360 × 780 and listed overflowing elements; the contrast of every token pair was computed with the WCAG formula; the defeat boards were checked by script against `docs/game-rules.md`; the ARB files were checked for equal keys and placeholders and parsed as ICU. Eduard reviewed the pull request.
- **Lessons:** Render and look at every mockup at full size; diagrams that look right in code can read wrong on screen. Check example game states against the written rules, not only the visual style. Shared tokens and one template made each later screen faster and kept the four games consistent. Check a design against the assignment's exact wording and an accessibility standard before asking for review, not after.

### 2026-11-24 to 2026-11-25 — Domain model (D1) and class diagram (D7) (odd/tasks/0005-domain-model.md)

- **Pull request:** #24

- **Author:** Eduard Velasco
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5 for the main session; sub-agents `odd-explore`, `odd-verify` and `architecture-reviewer` with the models their agent files pin. PlantUML 1.2025.2 run locally with Java 21 to render the diagrams.
- **Task:** Write the domain model of the app and the first class diagram: every class of the generic engine, the four variants and the layers around them, with type parameters and bounds, value objects, phases, events, capabilities, undo snapshots, the seeded generator and the engine/variant boundary (C-06, C-11a, C-19 to C-22, C-32, NFR-01, NFR-02, NFR-04, NFR-05).
- **Prompts:** The full request is quoted in the task document's log. The parts that fixed the design, verbatim:
  - "Solo documentos, sin código." / "No escribas código de producción en esta sesión."
  - "Decisiones ya tomadas (no las reabras; si encuentras que alguna contradice el enunciado, dímelo antes de seguir)", followed by the list: no DDD building blocks, read-only attributes and no setters, Memento without Command, the four phases, a concrete `GameEngine` with Strategy, an injected seeded generator, `Coordinate` as a value object read only by the topology, `Board<TCell>`.
  - "Puntos abiertos que decido yo. Preséntamelos todos juntos en una sola ronda […]. Después de mi respuesta no me pidas más confirmaciones: escribe todo y solo para si encuentras una contradicción con el enunciado."
  - "El .puml y el JSON salen del mismo modelo y no pueden diferir."
  - "PlantUML no está instalado; si no lo puedes correr localmente con Java, pregúntame antes de usar un servicio web para renderizar."
  - After the reviews: "sigue cuando terminen los revisores" and "ya compacté, aplica las correcciones".
  - On the topology: "los niveles declaran su topología (el formato de la api lo exige en board.topology) y la raíz de composición inyecta las topologías registradas; el LevelBuilder resuelve la del nivel en ese registro y rechaza un nivel cuya topología no esté registrada. Así no cambia ni el formato ni ADR-0004 de app #23. Modélalo así."
- **Result:** `docs/domain-model.md` (narrative sections plus sections generated from the model); `docs/diagrams/class-model.json` (299 classes); 13 PlantUML views (`class-diagram*.puml`: a package-only overview, four of the engine, two of the use cases, adapters, frameworks and one per variant) with PNG at 2x and SVG; `docs/diagrams/class-explorer.html`, a self-contained explorer (classes, packages and list views) that opens offline; `docs/diagrams/README.md` updated (legend without DDD stereotypes, the views, the JSON schema); ADR-0004 is not changed (the model follows the text that PR #23 accepts). The AI wrote the model in a small script outside the repository that generates the JSON, the views and the generated sections, so the three cannot disagree. It also published the same explorer as a private page, and aligned `docs/EXTENSIBILITY.md` with the model.
- **Team modifications:**
  - **Decisions taken before modeling** (the request): no DDD building blocks; read-only values and no setters, with immutable game state; undo and redo only with Memento (Fit's snapshot without moves or clock, Merge's with board, score and generator); four phases (playing, paused, won, lost; reaching 2048 is a notice); a concrete `GameEngine` that delegates to each variant's rules (Strategy, not Template Method); an own seeded generator in the domain, injected; `Coordinate` as a list of integers that only the topology interprets, and `Board<TCell>`; Sort's seed in the level, Lines' fixed catalog without rotation; saving a game in progress in Lines and Merge (FR-16); the list of patterns, without Command or Template Method.
  - **Decisions in the one round of open points** (seven decisions; in all seven Eduard chose the option the AI recommended, after weighing it against the alternatives, because it was the best fit): a type-erased `VariantModule` and `PlayableSession` as the engine–variant boundary, with the cell painter registered by game id; a `CapabilitySet` with typed optional fields (undo, timer, seed); scoring per move (`IScoringPolicy`) separate from the result of a game (`IProgressModel`); Fit's stopwatch in the domain behind a `Clock` port; immutable states and closed move types per variant, and one `IPieceSource<TPiece>` for random and fixed sources; Mulberry32 as the generator; only the diagrams README fixed in this branch, the DDD rules left to their own pull request.
  - **What Eduard changed in the AI's output:**
    - Rejected the AI's amendment of ADR-0004 (one topology injected, none in the level files). Levels declare their topology in `board.topology`, as the API level format requires; a `TopologyRegistry` filled by the composition root resolves it in the level builders, which refuse an unregistered topology. ADR-0004 is left as PR #23 accepts it, its renderer names (`BoardRenderer`, `IBoardRenderer`) are indicative, and the document records that its "factory" is `TopologyRegistry`.
    - Turned the three choices the model had left "to confirm" into game rules: FIT-7 (a piece rotates only off the board), SORT-8 (how the tray draws a stack: size, then each tile's color, from the level's seed) and LINES-7 (each catalog piece carries its color). The model now traces them.
    - Rejected the first explorer: its graph did not draw, it opened on all 299 classes and it existed only as a private page. Asked for an opening view of the generic engine, a package view that opens on click, a list view, centering on a clicked class, and a self-contained copy in the repository that opens offline.
    - Asked for formats the whole team can use without Claude: PlantUML views per package with PNG (2x) and SVG, a package-only overview, and a "how to view the model" section with every file.
    - Asked to remove the invariants that only said a field is present, to add Sort's limits from the level format (at most 9 tiles per stack, no repeated colors), and to align `docs/EXTENSIBILITY.md` with the model's names and with the variant module as what a new variant creates.
    - Asked to move the CI rule that forbids variant names in the engine from `lib/src/engine` to the model's `core/` folder, since the variants live beside it in `variants/<id>/`.
    - Asked for a second and a third pass of `architecture-reviewer` and for the blocking findings to be fixed before merge.
  - **When `main` was merged into this branch** (after the rules without DDD and the accepted ADRs), the branch's diagram rules disagreed with those of `main` on two points. The team decided:
    - Constructors: `main`'s rule stays. `docs/diagrams/README.md` asks the class diagram to show the constructors with their parameters, so every constructor is now drawn with the standard UML 2.5.1 stereotype `«create»`: the unnamed constructor of each value object, which the generator derives from its attributes (neither static nor derived), and the named constructors as static operations. `Board`'s library-private constructor is drawn with package visibility.
    - Generics: the branch's notation stays (`TCell extends IMergeable<TCell>` in the template box, `«bind»` per variant), because PlantUML cannot draw UML 2.5.1's `TCell > IMergeable<TCell>` inside that box; each class with a bound now has a note with the standard notation, and the legend says why.
    - The generator of PR #26 entered this pull request, so the model and its check reach `main` together.
  - Changes the other teammates make in review are added here before merge.
- **Errors and corrections:**
  - The first complete model had seven blocking defects that the `architecture-reviewer` agent found: the engine labeled as the Memento originator; a Merge invariant that undo breaks (the 2048 notice); listeners that would have to check the class of an event; a piece source with no user and an unneeded F-bound; invariants a constructor cannot check; states with no behavior of their own (anemic); and a progress design that made a fifth variant touch shared classes. All seven were fixed in the model and the document, and the document now says what a fifth variant does touch (a new kind of gesture or of result).
  - `odd-verify` found the glossary without traces (S10 partial); a Traces column was added.
  - The AI amended ADR-0004 so that one topology was injected and level files named none, arguing that a second topology does not exist yet. That contradicted the API level format, which requires `board.topology`, and the text of ADR-0004 accepted in PR #23. Eduard noticed it when reading the amendment; the amendment was dropped and the model changed to a topology registry.
  - The second `architecture-reviewer` pass found what the AI had missed: the saved-game codecs of Lines and Merge had nothing to rebuild a board or a piece source with; the document said only the topology reads a coordinate's integers, while the mappers copy them; the Fit level builder claimed the check F5, which it cannot run; and two invariants (`BoardView`, `FitPiece`) that one object cannot check. All four were fixed in the model and the document.
  - While applying the fixes, the planned state transitions took the points as an argument, which the scoring policy cannot give before the state after the move exists; the AI noticed it and added a separate `withPointsAdded`.
  - The first explorer was published without being opened in a browser: its graph drew nothing (a force layout spread the classes over about 370,000 px, beyond the zoom limit). Eduard found it; the AI rewrote the layout to be deterministic and from then on checked every version in a headless browser with real clicks and screenshots.
  - The package overview exposed a generic adapter (`LinesCatalogMapper`) that depended on a Hexa Lines class; it was moved into the Lines folder.
  - The third `architecture-reviewer` pass found that the rewritten `EXTENSIBILITY.md` named `core/` folders that only the engine has, that no class added a variant's sounds to `SoundCueMap`, and that `CompositionRoot` had no relation to the variants it registers. Fixed: the guide names the real folders, `CompositionRoot` builds `SoundCueMap` (a third wiring line) and depends on the four modules and painters, and the overview shows it as its own box.
  - The branch's legend left the unnamed constructors of the value objects out of the diagrams, against the rule of `docs/diagrams/README.md` on `main` that constructors are shown. Detected as a conflict when merging `main`; the generator now derives and draws them.
  - Rendering: a `skinparam` block that PlantUML rejected, PNGs cut at 4096 px, and arrow glyphs missing in the diagram font. Detected with `plantuml -checkonly` and by looking at the PNGs; fixed in the generator.
- **Verification:** `architecture-reviewer`, first pass (request changes, 7 blockers, all fixed); second pass after the fixes and the topology change (request changes: B1–B4, B6 and B7 confirmed fixed, B5 partly fixed, plus three new blockers, all fixed); third pass (request changes: three text and relation blockers, all fixed; not run a fourth time). The explorer was checked in Brave headless through the DevTools protocol with real clicks (start view, focus on a class, packages, opening a package, list) and `odd-verify` (S1–S9 and S11–S13 pass, S10 partial and then fixed, S14 not verifiable by the agent). After the fixes: the JSON parses; `java -jar plantuml.jar -checkonly docs/diagrams/class-diagram*.puml` passes on the 13 files; the explorer computes 0 warnings; the generator that will move to `tool/` reproduces the 13 `.puml` files, the generated sections of the document and the explorer byte for byte; `git diff --stat main -- packages app lib test` is empty (no production code).
- **Lessons:** Generating the diagrams and the document's tables from one model kept them consistent through two rounds of changes. An independent reviewer agent found design defects (anemic states, type checks hidden in listeners) that the agent that wrote the model had not seen.

### 2026-11-25 — Class-model generator moved to `tool/` (odd/tasks/0005-domain-model.md)

- **Pull request:** opened as #26 on top of #24, then merged into #24
- **Author:** Eduard Velasco
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5.
- **Task:** Put in the repository the script that generates the class diagram views, the generated sections of `docs/domain-model.md` and the explorer from `docs/diagrams/class-model.json`, with a test that fails when the JSON and the `.puml` files differ (C-11, NFR-02).
- **Prompts:** "Después, en otro PR, pasa a tool/ el generador del JSON y de los .puml, con una prueba que falle si el JSON y los .puml difieren."
- **Result:** `tool/class-model/generate.mjs` (writes the files, or `--check` to compare and report model errors), `generate.test.mjs` (four tests with `node:test`), the explorer template and Cytoscape 3.30.2 (MIT) in `tool/class-model/`; two CI steps (tool tests, class model check); npm scripts; `docs/diagrams/README.md` and `AGENTS.md` §9 updated. The AI derived the generator from the session script that had produced the model, dropping the part that wrote the JSON: from now on the JSON is the source and is edited directly.
- **Team modifications:** The team decided to bring the generator into PR #24 instead of merging it separately, and to extend it for the diagram rules of `docs/diagrams/README.md` and UML 2.5.1: every constructor drawn with `«create»`, the unnamed constructor of each value object derived from its attributes (with `constructorVisibility` in the model for the one that is not public), and a note with the standard bound notation beside each class with a bounded type parameter. Two tests cover the derived constructor and the bound note (six tests in all).
- **Errors and corrections:** The first version of the test of an unknown relation target crashed the generator instead of reporting the error; the generator now stops and reports structural errors before drawing. `node --test tool/` did not find the tests on Node 24; the command uses the glob `"tool/**/*.test.mjs"`.
- **Verification:** `node tool/class-model/generate.mjs --check` reports the 15 generated files equal to the committed ones; `node --test "tool/**/*.test.mjs"` passes 4 of 4; with one `.puml` edited by hand, both the test and `--check` fail and name the file, and pass again once it is restored.
- **Lessons:** Making the JSON the only source closes the gap between the diagram and the data; CI now enforces what the README used to ask of reviewers.

### 2026-11-25 — Domain model rules without DDD (docs; no task document)

- **Author:** Eduard Velasco
- **Pull request:** this pull request, paired with the `docs/domain-model-without-ddd` pull request of hexablock-api
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5.
- **Task:** Replace the DDD tactical patterns of `AGENTS.md` §4 with the modeling rules the team keeps, before the domain model (D1) is written (C-05, C-32, NFR-03, FR-45, FR-66).
- **Prompts (faithful paraphrase; originals in Spanish):**
  - "Apply the team's change plan of 2026-11-24: the app half of the `docs/domain-model-without-ddd` pair, following AGENTS.md, without asking me between steps; stop only if something contradicts the assignment."
- **Result:** The *Domain model* subsection of `AGENTS.md` §4 (one name per concept, behavior with its data, immutable game state, read-only getters, value objects, classes with identity, Memento, an injected pure random generator, Observer for game events, and a table of roles without DDD); two stereotypes in `docs/diagrams/README.md` and read-only values drawn as `{readOnly}` attributes; the *Domain model* question of the `architecture-reviewer` agent.
- **Team modifications:** The team decided on 2026-11-13 to leave DDD out and on 2026-11-24 to allow read-only getters; the AI wrote the text from that decision and the change plan. The team reviews the wording in this pull request.
- **Errors and corrections:** None detected in this change.
- **Verification:** The cited chapters were checked in the team's library before citing them (Martin 2017, ch. 20; Esposito 2024, ch. 6; the Memento and Observer chapters of the course's pattern book). Every edit replaced text found exactly once; the diff was reviewed, and commitlint and CI run on it.
- **Lessons:** A rule set is easier to defend when each rule names the requirement it serves; the DDD rules had no requirement behind aggregates, domain services or domain events. The entry of 2026-11-09 stays as history.

### 2026-11-25 — Game rules completed with the team decisions of 2026-11-24 (odd/tasks/0002-game-rules.md, PR #13)

- **Author:** Eduard Velasco
- **Pull request:** #13
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5. RANK-3 comes from the team's software requirements specification draft, which a teammate wrote with Gemini (Google); the team reviewed that draft critically on 2026-11-24 before taking the rule.
- **Task:** Add to `docs/game-rules.md` the rules the team decided on 2026-11-24 (LINES-4 to LINES-6, MERGE-2 to MERGE-4, FIT-6, LEVEL-1, LEVEL-2, RANK-3) and three more the domain model needs (FIT-7, SORT-8, LINES-7), each with its reason and an example a test can reuse (C-23b, C-33).
- **Prompts (original in Spanish, verbatim in the task log):**
  - "app #13 (2.4): rebase y las reglas nuevas, más estas tres que necesita el modelo de dominio, cada una con su razón y un ejemplo que sirva de prueba: (a) en Hexa Fit una pieza solo se rota mientras está fuera del tablero (como muestra el ejemplo de FIT-4); (b) en Hexa Sort cada pila de la bandeja sortea su tamaño dentro de stackSize del nivel y el color de cada ficha entre los colores del nivel, con la semilla del nivel; (c) en Hexa Lines cada entrada del catálogo de piezas trae su color."
- **Result:** Thirteen new rules and changes to SORT-6 (the level stores the seed), SORT-7 (why Hexa Sort has stars), FIT-2, FIT-5, RANK-1 (the date comes from the phone), the level file sections and *Out of scope*; specs S17 to S29 and decisions 25 to 39 in the task document.
- **Team modifications:** The team took every decision (2026-11-24 change plan; FIT-7, SORT-8 and LINES-7 from Eduard on 2026-11-25). The AI wrote the reasons and the examples; a teammate reviews them in this pull request.
- **Errors and corrections:** None detected. One deviation from the request: it asked for a rebase, and the AI merged `main` instead, because a rebase needs a force push, which `AGENTS.md` §6 forbids.
- **Verification:** Every cited requirement ID was checked against `docs/requirements.md`; the MERGE-2 rows and the RANK-3 example were recomputed by hand; the rules were read against assignment §1.1 to §1.5 for contradictions (none found). A teammate's full review is still required before merging.
- **Lessons:** A rule drafted by another AI tool (RANK-3) needs the same review as any other: the team checked it against FR-13 and FR-22 before adopting it.

### 2026-11-25 — Requirements baseline (docs; no task document)

- **Author:** Eduard Velasco
- **Pull request:** this pull request, paired with hexablock-api #21
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5. The requirements for the optional account (FR-11, FR-12, FR-20, FR-21) and usability (NFR-07) originate in the team's requirements specification, which a teammate drafted with Gemini (Google); the team reviewed that draft critically on 2026-11-24 before anything entered this catalog.
- **Task:** Turn the catalog into the *Baseline* with the decisions the team took on 2026-11-10, 2026-11-11 and 2026-11-24 (C-05, C-09, C-17, C-19, C-25, FR-11, FR-12, FR-16 to FR-21, FR-23, FR-25, FR-53, NFR-06, NFR-07), and trace FIT-6 of `docs/game-rules.md` to the new FR-17.
- **Prompts (faithful paraphrase; original in Spanish):**
  - "The app half of `docs/requirements-baseline` (change plan 2.8, the same as api #21), with the pull request open and linked to the API one. `docs/requirements.md` must stay identical in both repositories. Follow AGENTS.md. Do not merge anything."
- **Result:** `docs/requirements.md` is a byte-for-byte copy of the file in hexablock-api #21; the FIT-6 row of `docs/game-rules.md` cites FR-17.
- **Verification:** `diff` between this file and the file of hexablock-api #21 prints nothing; on `main` the two catalogs were also identical before the change. commitlint and the pre-push checks.
- **Team modifications:** Open until the merge: the three members (Eduard Velasco, Ali Dahouk, Valentina Maza) review the catalog and record their agreement in this pull request and in hexablock-api #21; any change they ask for goes into both pull requests and is listed here before merging.
- **Errors and corrections:** None detected yet.
- **Lessons:** Copying the reviewed file from the paired pull request, instead of editing the catalog a second time, is what keeps the two repositories identical.

### 2026-11-25 — ADRs of the app accepted (odd/tasks/0006-accept-adrs.md)

- **Author:** Eduard Velasco
- **Pull request:** this pull request, paired with hexablock-api #22
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5.
- **Task:** Accept ADR-0001 to ADR-0006 with the team's decisions of 2026-11-24, add ADR-0007 (local data and view models) and ADR-0008 (iOS from a Mac), and remove every *Proposed* condition from the repository (C-05, C-24a, C-30, C-32, NFR-03, NFR-05).
- **Prompts (faithful paraphrase; original in Spanish, verbatim in the task log):**
  - "The app half of `docs/accept-adrs` (change plan 2.9, app part), with the pull request open and linked to the API one. Follow AGENTS.md. Do not merge anything."
- **Result:** The changes listed in `odd/tasks/0006-accept-adrs.md`: the interfaces the domain calls live in the domain (ADR-0003); the coordinate is a list of integers checked by the topology and the board is `Board<TCell>` (ADR-0004); two new ADRs; `AGENTS.md` §3, the README, `docs/EXTENSIBILITY.md`, the game rules and task 0001 no longer wait for the ADRs; the domain and the use cases may not import drift or `flutter_secure_storage`.
- **Team modifications:** The team took every decision on 2026-11-24; the AI wrote the text. Open until the merge: the three members record their agreement in this pull request; any change they ask for is listed here before merging.
- **Errors and corrections:** None detected yet. The AI found that another session was editing ADR-0004 for the domain model and kept this change consistent with it (task log).
- **Verification:** `node tool/check-architecture.mjs` passes and `tool/architecture-rules.json` parses; a search for "Proposed" leaves only templates, generic instructions and dated history; every cited chapter was checked in the team's library (Martin 2017, ch. 30).
- **Lessons:** Writing the decisions with their reasons in the team's plan first turned the acceptance into a translation step; the review time goes to the two new ADRs.

### 2026-11-25 — App skeleton: pub workspace, composition root and CI (odd/tasks/0001-bootstrap-workspace.md)

- **Author:** Eduard Velasco
- **Pull request:** #25 (draft, stacked on #23)
- **Tool / model:** Claude Code (VS Code extension), model Claude Opus 5.5.
- **Task:** Create the Dart pub workspace of ADR-0003 (three layer packages and the Flutter app for Android and iOS), an empty composition root wired by hand (ADR-0007), the CI of every pull request and one smoke test per package (C-02, C-05, C-13, C-23, NFR-03).
- **Prompts (faithful paraphrase; original in Spanish, verbatim in the task log):**
  - "Task 0001 of the app: the skeleton. Work in a separate worktree and do not touch the domain model branch. Read the task, AGENTS.md, the requirements, the rule files and the ADRs as they stand in #23. Build the workspace, an empty composition root with a minimal screen, the CI and one minimal test per package. No domain classes. Open the pull request as a draft and merge nothing. Tell me what Valentina must do for the iPhone test installation."
- **Result:** Root `pubspec.yaml` with the workspace; `packages/hexablock_engine`, `packages/hexablock_application`, `packages/hexablock_adapters` and `app/` (Flutter 3.47.8, Android and iOS); `CompositionRoot` and a placeholder home screen; `tool/run-tests.mjs`, which fails when a package with code runs no test (S7); CI pinned to Flutter 3.47.8; README *Getting Started* and *Running Tests*.
- **Team modifications:** TODO(team): record what the team changes in review, including the answer to the open question on where the plugin-backed adapters live.
- **Errors and corrections:** The test-name check written in the setup session read one line at a time, so it silently skipped two of the four tests after `dart format` wrapped their names. The AI detected it by comparing the count it printed with the number of tests that ran, and fixed it in this task.
- **Verification:** Format, `flutter analyze --fatal-infos --fatal-warnings`, `node tool/run-tests.mjs` (4 tests ran), coverage, architecture and test-name checks, all exit 0; probes for S3 (a Flutter import in the engine fails both the analyzer and the architecture check) and S7 (a package with code and no tests fails the test gate). CI run 45682789103 on #25 green, with 4 tests reported.
- **Lessons:** A quality gate should print what it checked; a count that does not match reality is how a silent gap shows up.

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
| 2026-11-25 | Domain model with seven blocking design defects (anemic states, event type checks, uncheckable invariants, a fifth variant touching shared classes) | `architecture-reviewer` agent | Design |
| 2026-11-25 | State transitions that needed the points before the scoring policy could compute them | The AI noticed it while applying the review fixes | Design |
| 2026-11-25 | PlantUML files that did not parse, and PNGs cut at 4096 px | `plantuml -checkonly` and inspection of the PNGs | Tooling |
| 2026-11-25 | The test-name check skipped tests whose name `dart format` moved to the next line | The count it printed (2) did not match the tests that ran (4) | Tooling |
- **Impact on productivity and quality:** TODO.

## Effective prompts

Prompts that produced the best results, kept as reusable examples.

- "Are you sure about X? Check it against <standard or source> and tell me what is wrong before changing anything." — made the AI find and fix defects in its own catalog.
- "Ask me everything that is not explicit; assume nothing." — turned silent assumptions into explicit decisions.
