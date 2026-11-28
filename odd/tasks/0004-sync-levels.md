# 0004 — Copy the levels from hexablock-api into the app

- **Status:** Verifying
- **Owner:** Valentina Maza
- **Branch / PR:** `build/sync-levels` · #
- **Requirements:** FR-04, FR-14, FR-23, C-13
- **ADRs:** 0006 (the level builder reads the files); in `hexablock-api`: 0004 (generic level schema)

## Objective

The app bundles an exact copy of the levels of `hexablock-api`, and CI says when the copy is out of date.

## Problem

The team decided on 2026-11-23 that `levels/` in `hexablock-api` is the single source of the levels: the app must bundle them to play offline (FR-04), and the API serves the same files (FR-23). Copying them by hand would let the two drift apart.

## Scope

- In scope: `tool/sync-levels.mjs`, two npm scripts and a CI step.
- Out of scope: the asset entry in `pubspec.yaml` and the level loader (the Flutter project, task 0001 and the engine tasks); the first copy of the files, made when `app/` exists.

## Specs

- **S1** (FR-04): `node tool/sync-levels.mjs` makes the level files in `app/assets/levels/<gameId>/` equal to `levels/` in `hexablock-api` (`main` by default): it copies new and changed levels, deletes the levels the API no longer has, leaves every other file alone, and records the commit in `source.json`.
- **S2** (FR-14): `--check` compares without writing; it lists every file missing, different or removed, and exits 1 when they differ.
- **S3** (C-13): CI runs the check on every pull request once the copy exists, and the build fails when the levels differ (review of #20).
- **S4**: the script needs only Node and git: no new dependency.

## Allowed edit surfaces

- `tool/sync-levels.mjs`, `tool/sync-levels.test.mjs`, `package.json`, `.github/workflows/ci.yml`, `AI_USAGE.md`, this file

## Tasks

- [x] **T1** (S1, S2, S4) Write `tool/sync-levels.mjs` (sparse clone of `levels/` only).
- [x] **T2** (S3) `npm run sync:levels`, `npm run check:levels-sync` and the CI step.
- [ ] **T3** (S1) Run it once and commit `app/assets/levels/` when the Flutter project exists. **After task 0001.**
- [x] **T4** `log-ai-usage` entry.

## Verification

| Spec | Evidence | Verdict |
|---|---|---|
| S1 | `--ref feat/levels --dest /tmp/synctest`: "Copied 25 level files … (1bd6bf2)"; `source.json` holds the repository, ref and commit. | Pass |
| S2 | Right after the copy: "Levels in sync … 25 files", exit 0. After editing `hexa-fit-003.json` in the copy: "different from the API: hexa-fit/hexa-fit-003.json", exit 1. After deleting `hexa-sort-010.json`: "missing in the app", exit 1. | Pass |
| S2 | Against `main` before hexablock-api #19 is merged: "hexablock-api main has no levels/ folder yet.", exit 1. | Pass |
| S1, S2 | `node --test "tool/**/*.test.mjs"`: 4 tests of the copy pass (first copy; `source.json`, `README.md` and a non-level file kept; only the changed level copied and the stale one deleted; every difference listed). Against hexablock-api `main` (6cc4858): 25 copied with a `README.md` kept; an extra level reported by `--check` (exit 1), then removed. | Pass |
| S3 | Step "Levels in sync with hexablock-api" in `ci.yml`, with no `continue-on-error`, after the tool tests, and a condition on `app/assets/levels/source.json`. | Pending CI run once the copy exists |

## Open questions

- None.

## Next step

After task 0001 creates `app/`, run `npm run sync:levels`, declare the folder in `pubspec.yaml` and commit.

## Log

- 2026-11-24 — Valentina Maza (verbatim): "si" (answering the offer to prepare the script that copies the levels to the app and the CI warning).
- 2026-11-24 — Valentina Maza with Claude (Opus 5.5, claude.ai): T1, T2 and T4 done; checked against the `feat/levels` branch of hexablock-api because `main` does not have the levels yet.
- 2026-11-28 — Review of #20 (Valentina with Claude): the CI step fails instead of warning; the script writes only level files and keeps everything else in the folder; the copy logic is exported and covered by tool tests; `main` merged into the branch.
