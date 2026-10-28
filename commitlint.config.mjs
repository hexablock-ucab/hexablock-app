// Conventional Commits, enforced locally (lefthook commit-msg) and in CI.
export default {
  extends: ['@commitlint/config-conventional'],
  // Dependabot writes its own messages ("Bump x from 1 to 2"); its pull requests are
  // still reviewed and squash-merged with a Conventional Commits title.
  ignores: [(message) => /^Signed-off-by: dependabot\[bot\]/m.test(message)],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'engine', 'application', 'adapters', 'app',
        'hexa-lines', 'hexa-fit', 'hexa-sort', 'hexa-merge',
        'levels', 'i18n', 'audio',
        'ci', 'docs', 'readme', 'deps', 'deps-dev', 'claude', 'release', 'workspace',
      ],
    ],
  },
};
