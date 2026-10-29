# Contributing

## Workflow

1. Pick an issue from the project board and assign it to yourself.
2. Create a branch from `main`: `<type>/<short-slug>`, where type is `feat`, `fix`, `docs`, `test`, `refactor` or `chore`.
3. For substantial work, open a task document in `odd/tasks/` (see `odd/README.md`).
4. Commit in small, logical units following Conventional Commits.
5. Open a pull request with the template filled. CI must be green and a teammate must approve.
6. The PR is squash-merged; its title becomes the commit on `main`.

`main` is protected: no direct pushes, no force pushes, no merges without green CI.

## Setup after cloning

```bash
npm install        # installs commitlint and lefthook, and runs `lefthook install`
```

Requires Node.js 22 LTS. The Flutter toolchain is described in the README *Getting Started* section.

## Conventional Commits

```
<type>(<scope>): <imperative summary in English>

[optional body: why, not what]

[optional footer, e.g. Refs: FR-33, odd/tasks/0003-hexa-lines-rules.md]
```

Examples:

```
feat(engine): add generic HexBoard with axial coordinates
feat(hexa-sort): implement cascade transfer rule
fix(hexa-merge): correct slide direction on north-west axis
test(engine): add unit tests for GameEngine with fake cell type
docs(readme): add extensibility guide
refactor(hexa-lines): extract line detection to Strategy
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
Scopes: `engine`, `application`, `adapters`, `app`, `hexa-lines`, `hexa-fit`, `hexa-sort`, `hexa-merge`, `levels`, `i18n`, `audio`, `ci`, `docs`, `readme`, `deps`, `deps-dev`, `claude`, `release`, `workspace`. The scope is optional.

## Quality gates

Every rule below is a check that fails the build, so it does not depend on anyone remembering it.

| Gate | Tool | Runs on |
|---|---|---|
| Commit messages follow Conventional Commits | commitlint | `commit-msg` hook, CI |
| PR title follows Conventional Commits | action-semantic-pull-request | CI |
| Formatting | `dart format` | `pre-commit` hook, CI |
| Static analysis with zero infos and warnings, strict type modes | `flutter analyze` + `analysis_options.yaml` | CI |
| Clean Architecture import rules and no variant-specific code in the engine | `tool/check-architecture.mjs` + `tool/architecture-rules.json` | `pre-push` hook, CI |
| Test names `should_<expected_result>_when_<condition>` | `tool/check-test-names.mjs` | `pre-push` hook, CI |
| Tests pass | `flutter test` per package | CI |
| Line coverage of at least 90% in the domain and the use cases (the total is reported, not enforced) | `tool/check-coverage.mjs` + `tool/quality-gates.json` | CI |

Run them locally with `npm run check:architecture`, `npm run check:test-names` and, after `flutter test --coverage`, `npm run check:coverage`.

## Code review checklist

- The change traces to requirement IDs.
- Tests were written first where applicable and pass.
- No inner layer depends on an outer one; no variant-specific condition in the engine.
- README, `docs/EXTENSIBILITY.md` and diagrams are updated if affected.
- `AI_USAGE.md` has an entry for significant AI-assisted work.
