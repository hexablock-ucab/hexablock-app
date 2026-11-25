#!/usr/bin/env node
/**
 * Quality gate: run the tests of every workspace package with coverage, and
 * fail when a package with production code runs no tests (task 0001, S7).
 * A green check that verified nothing is not accepted.
 *
 * Reads the members from the `workspace:` list of the root pubspec.yaml.
 * Each member runs `flutter test --coverage` in its own folder, which writes
 * coverage/lcov.info for tool/check-coverage.mjs. A JSON file reporter counts
 * the tests that really ran.
 *
 * Usage: node tool/run-tests.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repo = process.cwd();

function workspaceMembers() {
  const lines = readFileSync(path.join(repo, 'pubspec.yaml'), 'utf8').split(/\r?\n/);
  const start = lines.findIndex((l) => /^workspace:\s*$/.test(l));
  if (start === -1) return [];
  const members = [];
  for (const line of lines.slice(start + 1)) {
    const item = line.match(/^\s+-\s+(\S+)\s*$/);
    if (item) members.push(item[1]);
    else if (/^\S/.test(line)) break;
  }
  return members;
}

function* dartFiles(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* dartFiles(full);
    else if (full.endsWith('.dart')) yield full;
  }
}

// Counts the visible tests that finished, and the ones that did not pass.
function readReport(file) {
  let ran = 0;
  let failed = 0;
  if (!existsSync(file)) return { ran, failed };
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type !== 'testDone' || event.hidden || event.skipped) continue;
    ran += 1;
    if (event.result !== 'success') failed += 1;
  }
  return { ran, failed };
}

const members = workspaceMembers();
if (members.length === 0) {
  console.log('No Dart workspace yet (no workspace members in pubspec.yaml). Skipping tests.');
  process.exit(0);
}

const problems = [];
let total = 0;
for (const member of members) {
  const dir = path.join(repo, member);
  const hasProductionCode = [...dartFiles(path.join(dir, 'lib'))].length > 0;
  const testFiles = [...dartFiles(path.join(dir, 'test'))].filter((f) => f.endsWith('_test.dart'));

  if (testFiles.length === 0) {
    if (hasProductionCode) problems.push(`${member}: has production code in lib/ but no *_test.dart file.`);
    else console.log(`${member}: no production code and no tests.`);
    continue;
  }

  const report = path.join(dir, '.dart_tool', 'test-report.json');
  rmSync(report, { force: true });
  console.log(`\n=== flutter test ${member}`);
  // A shell lets Windows resolve flutter.bat; the only variable part is a path
  // this script builds inside the repository.
  const run = spawnSync(`flutter test --coverage "--file-reporter=json:${report}"`, {
    cwd: dir,
    stdio: 'inherit',
    shell: true,
  });
  const { ran, failed } = readReport(report);
  total += ran;
  console.log(`${member}: ${ran} test(s) ran, ${failed} failed.`);

  if (run.status !== 0) problems.push(`${member}: flutter test exited with code ${run.status}.`);
  else if (ran === 0) problems.push(`${member}: flutter test passed but ran no test.`);
}

console.log(`\nTests ran in total: ${total}.`);
if (problems.length > 0) {
  console.error('\nTest gate failed:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
