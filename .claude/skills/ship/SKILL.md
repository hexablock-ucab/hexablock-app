---
name: ship
description: "Git delivery for this repository: start a task branch, make Conventional Commits, sync with main and open a pull request with the project template. Use whenever the user asks to start a branch, commit, push or open a PR. Triggers: crear rama, empezar tarea, commit, hacer commit, subir cambios, push, abrir PR, pull request, ship."
---

# Ship

`main` is protected: every change enters through a PR with one approval and green CI, squash-merged. This skill is the only way agents touch git history.

## start <slug> [type]

1. `git status --short` must be clean, or ask the user what to do with the changes. Never discard them.
2. `git switch main && git pull --ff-only`.
3. `git switch -c <type>/<slug>` with type in `feat|fix|docs|test|refactor|chore` (default `feat`).

## commit

1. Run `git status --short` and `git diff --stat`. Show the user what will be committed.
2. Group the changes into logical work units (one idea per commit: e.g. tests + implementation of one rule).
3. For each unit: `git add <exact paths>` (never `git add -A` blindly) and `git commit -m "<type>(<scope>): <imperative summary>"`.
   - English, imperative mood, first word lowercase, no final period, at most 72 characters.
   - Scopes are listed in `AGENTS.md` §6.
   - Add a body when the why is not obvious, and a `Refs: <requirement IDs>, odd/tasks/NNNN-slug.md` footer.
4. Never use `--no-verify`. If the commit-msg or pre-commit hook fails, fix the cause and commit again.

## pr

1. Run the `ci-local` skill first. Do not push with a failing required check.
2. `git fetch origin && git rebase origin/main` only if the branch has no PR yet and the user agrees; otherwise `git merge origin/main`. Resolve conflicts with the user.
3. `git push -u origin HEAD` (ask the user first; never force-push).
4. `gh pr create --base main --title "<type>(<scope>): <summary>" --body-file <temp file>` with the body following `.github/pull_request_template.md`, filled: summary, requirement IDs, task document, test evidence, AI usage entry, checklist.
5. Report the PR URL. Ask a teammate to review; never merge your own PR without the approval.

## Rules

- Never commit on `main`, never `git push --force`, never `git reset --hard` on shared history.
- If something goes wrong, stop and use the `git-rescue` skill.
