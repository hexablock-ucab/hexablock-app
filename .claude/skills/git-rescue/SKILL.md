---
name: git-rescue
description: "Recover safely from common git mistakes in this repository: committed on main, wrong commit message, wrong files committed, branch out of date, merge conflict, lost work, pushed something by mistake. Diagnoses first and proposes the least destructive fix. Triggers: me equivoqué con git, arreglar commit, commit en main, deshacer commit, conflicto, perdí cambios, git rescue, undo."
---

# Git rescue

Diagnose before you act. Never run a destructive command without showing the user what it will change and getting a yes.

## Diagnose

Run and read: `git status`, `git branch --show-current`, `git log --oneline -n 10 --graph --all`, `git stash list`, and `git reflog -n 15`.
Say in one sentence what happened, then propose the fix from the table.

## Fixes (least destructive first)

| Situation | Fix |
|---|---|
| Committed on local `main`, not pushed | `git switch -c <type>/<slug>` (keeps the commits on a new branch), then `git switch main && git reset --keep origin/main`. |
| Wrong message on the last commit, not pushed | `git commit --amend -m "<fixed message>"`. |
| Wrong message, already pushed to your branch with an open PR | Leave it; the squash merge uses the PR title. Fix the PR title instead. |
| Forgot a file in the last commit, not pushed | `git add <file> && git commit --amend --no-edit`. |
| Committed a file that must not be there (secret, build output) | Remove it in a new commit, add it to `.gitignore`. If it was a secret: rotate it now and tell the team. |
| Branch behind `main` | `git fetch origin && git merge origin/main`, resolve conflicts, run the tests. |
| Merge conflict | List conflicted files (`git diff --name-only --diff-filter=U`), resolve one by one with the user, run the tests, `git add` and continue. |
| Want to drop local experiments | `git stash push -m "<why>"` instead of deleting. |
| "I lost my work" | Find it with `git reflog` and recover with `git switch -c rescue/<slug> <sha>`. |
| A bad PR was merged into `main` | Revert it through a new PR (`git revert <merge-sha>` on a branch, or the GitHub *Revert* button). Never rewrite `main`. |

## Rules

- Never `git push --force` on a shared branch, and never on `main` (protected anyway).
- Never `git reset --hard` or `git clean -fd` without an explicit yes after showing what is lost.
- After the fix, show `git status` and `git log --oneline -n 5` as evidence.
