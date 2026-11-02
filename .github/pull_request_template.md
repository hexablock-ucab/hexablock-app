## Summary

<!-- What changes and why, in two or three sentences. -->

## Traceability

- Requirements: <!-- e.g. FR-33, C-20 -->
- Task document: <!-- odd/tasks/NNNN-slug.md, or "small change" -->
- ADRs: <!-- if any -->

## Evidence

<!-- Test output, screenshots for UI changes, verifier verdict. -->

## Checklist

- [ ] Tests written first where applicable; all pass locally and in CI (quality gates: architecture, test names, analyze, format, coverage).
- [ ] No inner layer depends on an outer one; no variant-specific condition in the engine.
- [ ] README / `docs/EXTENSIBILITY.md` / diagrams updated if affected.
- [ ] `AI_USAGE.md` entry added for significant AI-assisted work.
- [ ] Third-party code or assets cited in code and in `THIRD_PARTY_NOTICES.md`.
- [ ] PR title follows Conventional Commits (it becomes the squash commit).
