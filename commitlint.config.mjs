// Conventional Commits, enforced locally (lefthook commit-msg) and in CI.
export default {
  extends: ['@commitlint/config-conventional'],
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
