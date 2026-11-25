# 0006 — Accept the ADRs of the app

- **Status:** Verifying — waiting for the agreement of the three members in the PR
- **Owner:** Eduard Velasco
- **Branch / PR:** `docs/accept-adrs` · paired with hexablock-api #22
- **Requirements:** C-05, C-16d, C-19a, C-24a, C-30, C-31, C-32, FR-08, FR-11, FR-12, FR-14, FR-15, FR-16, FR-18, FR-66, NFR-02, NFR-03, NFR-05
- **ADRs:** 0001 to 0008

## Objective

ADR-0001 to ADR-0006 are *Accepted* with the team's decisions of 2026-11-24, and ADR-0007 (local data) and ADR-0008 (iOS) record two decisions already taken, so the domain model (D1) and task 0001 can start on settled ground.

## Problem

Every ADR of the app was still *Proposed*, so `AGENTS.md` §3 told every agent not to create packages or topology abstractions. Decisions 1, 17, 18, 19 and 26 of 2026-11-24 change or add to the ADRs, and decision 31 keeps the other design decisions out of ADRs (they go to D1).

## Scope

- In scope: status, date and deciders of ADR-0001 to ADR-0006; the changes of ADR-0001, ADR-0003 and ADR-0004; the new ADR-0007 and ADR-0008; every text that called those ADRs *Proposed* (`AGENTS.md`, `README.md`, `docs/EXTENSIBILITY.md`, `docs/game-rules.md`, task 0001); the storage libraries forbidden in the domain and the use cases (`tool/architecture-rules.json`).
- Out of scope: the design decisions without an ADR of their own (decisions 13 to 17 and 20; they go to D1); the sync ADR (D6); code.

## Decisions taken with the user

All come from the team's change plan of 2026-11-24 (§2.9), approved by Eduard on that date, and from the team decisions of the same day:

| # | Decision | ADR |
|---|---|---|
| 1 | An ADR is accepted with an approving review or the agreement recorded in the PR | 0001 |
| 17 | The domain holds its own random generator; the interfaces the domain calls live in the domain | 0003 |
| 18 | A coordinate is a value object with a list of integers whose length the topology defines; `Board<TCell>` | 0004 |
| 19 | drift, `shared_preferences`, `flutter_secure_storage`; view models in plain Dart, wiring by hand | 0007 (new) |
| 26 | iOS from a Mac without a paid account; early test installation | 0008 (new) |
| 31 | The design decisions of the app have no ADR of their own | — |

## Specs

- **S1** (C-05): Given ADR-0001 to ADR-0008, then each says *Accepted*, the date 2026-11-25 (with the proposal date when earlier) and the three members as deciders.
- **S2**: ADR-0001 accepts an ADR with an approving review or the agreement recorded in the PR.
- **S3** (NFR-03, NFR-05): ADR-0003 places the piece source and the random generator in `hexablock_engine` and the I/O ports in `hexablock_application`, and says the `Random(` check forbids only the platform generator.
- **S4** (C-19a, C-31, C-32): ADR-0004 defines the coordinate as a list of integers validated by the topology, read as `[q, r]` by `HexTopology`; rules never read the numbers; the board is `Board<TCell>`; the topology has a fixed cell order (SORT-2, SORT-3); `Board<C, TCell>` is a rejected alternative; the scope guard stays.
- **S5** (C-24a, FR-08, FR-14, FR-15, FR-16, FR-18): ADR-0007 records drift with an in-memory database in tests, `shared_preferences`, `flutter_secure_storage` and view models in plain Dart wired by hand.
- **S6** (C-30): ADR-0008 records the installation from a Mac without a paid account, the early test installation and the installation in the week of the defense.
- **S7**: no text of the repository calls an ADR *Proposed* any more (`grep -rn "Proposed" --include=*.md .` shows only the ADR template and history).
- **S8** (NFR-03): the domain and the use cases may not import drift or `flutter_secure_storage`; `node tool/check-architecture.mjs` passes.

## Allowed edit surfaces

- `docs/adr/0001-*.md` to `docs/adr/0008-*.md`
- `AGENTS.md` (§1 and §3)
- `README.md` (status, description, architecture, install on a phone)
- `docs/EXTENSIBILITY.md` (status line)
- `docs/game-rules.md` (the two *Proposed* mentions)
- `odd/tasks/0001-bootstrap-workspace.md`, `odd/tasks/0006-accept-adrs.md`
- `tool/architecture-rules.json`
- `AI_USAGE.md`

## Tasks

- [x] **T1** (S1, S2) Status of ADR-0001 to ADR-0006; ADR-0001 text.
- [x] **T2** (S3) ADR-0003.
- [x] **T3** (S4) ADR-0004.
- [x] **T4** (S5, S6) ADR-0007 and ADR-0008.
- [x] **T5** (S7, S8) `AGENTS.md`, `README.md`, `docs/EXTENSIBILITY.md`, `docs/game-rules.md`, task 0001, `tool/architecture-rules.json`.
- [x] **T6** `log-ai-usage` entry.
- [ ] **T7** The three members record their agreement in the PR.
- [ ] **T8** After the merge: close the question about the ADMIN role in the team workspace with a link to ADR-0006 of the API (done on the API side).

## Verification

Documentation and one configuration file change; the Dart checks do not apply yet (no `pubspec.yaml`). Commands, run exactly as written:

```bash
node tool/check-architecture.mjs
node -e "JSON.parse(require('fs').readFileSync('tool/architecture-rules.json','utf8'))"
grep -rn "Proposed" --include=*.md .
```

| Spec | Evidence | Verdict |
|---|---|---|
| S1–S6 | Read against the change plan §2.9 and the decisions table above | Written; needs the team's review (T7) |
| S7 | `grep` shows *Proposed* only in the ADR template, the "Proposed by" fields, the generic instructions of agents and skills (which ask for an ADR's status), and dated history (`AI_USAGE.md`, the 2026-11-08 records of task 0002) | PASS |
| S8 | `node tool/check-architecture.mjs`: "Architecture rules OK (0 of 4 rules applied; the rest wait for their folders)"; the JSON parses | PASS |

## Open questions

- None. The tables of drift and the shape of the saved game are fixed with D1 (ADR-0007, consequences).

## Next step

The three members review the PR; then D1 and task 0001 start.

## Log

- 2026-11-25 — Eduard Velasco (prompt): "La mitad app de docs/requirements-baseline (2.8, igual a api #21) y de docs/accept-adrs (2.9, parte app), con los PR abiertos y enlazados a los de la api." (part of a longer request that applies the team's change plan of 2026-11-24; "Sigue AGENTS.md. No fusiones nada.")
- 2026-11-25 — Claude Code (finding): another session has uncommitted changes to ADR-0004 in the main checkout for the domain model (D1). This branch writes ADR-0004 from the change plan; the two agree on `Board<TCell>`, the coordinate as a list of integers and the fixed cell order. The other session also proposes that the topology be injected instead of named by each level; this branch keeps the current text ("level files declare their topology"), because the level format of the API names the topology, and leaves that point to D1.
- 2026-11-25 — Claude Code (edit): T1 to T6 done. The branch is stacked on `docs/requirements-baseline` (which is stacked on `docs/game-rules`), because it edits `docs/game-rules.md` and the ADRs cite the Baseline IDs.
