#!/usr/bin/env node
/**
 * Quality gate: every test name follows `should_<expected_result>_when_<condition>`
 * (assignment §3.6). Group/describe titles are free text.
 *
 * Usage: node tool/check-test-names.mjs [--root <dir>]
 * Exit code 1 lists every test with a non-conforming name.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const root = path.resolve(args.includes('--root') ? args[args.indexOf('--root') + 1] : '.');

const NAME = /^should_[a-z0-9]+(?:_[a-z0-9]+)*_when_[a-z0-9]+(?:_[a-z0-9]+)*$/;
const SKIP_DIRS = new Set(['node_modules', '.dart_tool', 'build', 'dist', 'coverage', '.git']);

// Test files and the calls that declare a single test case, per language.
const KINDS = [
  { file: /_test\.dart$/, call: /\b(?:test|testWidgets)\(\s*(['"])(.*?)\1/g },
  { file: /\.(?:spec|e2e-spec|test)\.ts$/, call: /\b(?:it|test)\(\s*(['"`])(.*?)\1/g },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

if (!existsSync(root)) process.exit(0);

let checked = 0;
const bad = [];
for (const file of walk(root)) {
  const kind = KINDS.find((k) => k.file.test(file));
  if (!kind) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const match of line.matchAll(kind.call)) {
      checked += 1;
      if (!NAME.test(match[2])) bad.push(`${path.relative(root, file)}:${i + 1}  "${match[2]}"`);
    }
  });
}

if (bad.length > 0) {
  console.error(`Test names must match should_<expected_result>_when_<condition> (lowercase, underscores).\n`);
  for (const b of bad) console.error(`  ${b}`);
  console.error(`\n${bad.length} of ${checked} test names fail.`);
  process.exit(1);
}
console.log(`Test names OK (${checked} tests checked).`);
