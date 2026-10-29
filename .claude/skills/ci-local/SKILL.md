---
name: ci-local
description: "Run locally every check the CI runs, before pushing or when CI fails, so problems are found on your machine instead of in a pipeline run. Reads .github/workflows/ci.yml to know the current checks. Triggers: antes de hacer push, falló el CI, correr el CI local, revisar antes de subir, run CI locally, CI failed, pre-push check."
---

# Run the CI locally

A failure found in CI costs a full pipeline run per attempt. Reproduce it here first.

## Steps

1. Read `.github/workflows/ci.yml` now. Do not rely on a list from memory: the workflow may have changed.
2. Take every `run:` step of the `quality` job, in order. Skip steps whose `if:` condition is false for this repository (for example the Dart steps before `pubspec.yaml` exists).
3. Run each command from the repository root and record its exit code. The usual list for this repository is:
   - `node tool/check-architecture.mjs`
   - `node tool/check-test-names.mjs`
   - `flutter pub get`
   - `dart format --output=none --set-exit-if-changed .`
   - `flutter analyze --fatal-infos --fatal-warnings`
   - `flutter test --coverage` in every package that has a `test/` folder
   - `node tool/check-coverage.mjs`
4. For the `commits` job, check the branch's commit messages: `git log --format=%s origin/main..HEAD` must all follow Conventional Commits with the scopes in `commitlint.config.mjs`.
5. When a command fails, fix the cause, rerun that command, then rerun the whole list once more at the end.

## Rules

- Report the real exit code of every command. Never assume a command passes because a similar one did.
- Never lower a threshold or loosen a rule to make a check pass. If a rule is wrong, say so and propose the change to the user.
- If a command cannot run here (missing tool), name it as unverified with the reason.

## Output

A table `command → exit code`, the list of unverified commands with reasons, and one line: **safe to push** or **not safe to push**.
