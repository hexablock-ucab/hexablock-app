#!/usr/bin/env node
/**
 * PostToolUse hook for Edit, Write and MultiEdit on Dart files.
 * 1. Formats the file with `dart format`.
 * 2. Analyzes the file with `dart analyze`. When the analyzer reports issues,
 *    the hook writes them to stderr and exits with code 2, so Claude sees the
 *    problems right away and fixes them before it continues.
 * The hook stays silent when the file is not Dart, the Dart SDK is missing, or
 * the file is not inside a Dart package yet.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

let data = '';
for await (const chunk of process.stdin) data += chunk;

let file = '';
try {
  file = String(JSON.parse(data)?.tool_input?.file_path ?? '');
} catch {
  process.exit(0);
}
if (!file.endsWith('.dart') || !existsSync(file)) process.exit(0);

// Find the package that owns the file; without one the analyzer has no context.
let dir = path.dirname(path.resolve(file));
while (!existsSync(path.join(dir, 'pubspec.yaml'))) {
  const parent = path.dirname(dir);
  if (parent === dir) process.exit(0);
  dir = parent;
}

const run = (args) =>
  spawnSync('dart', args, { cwd: dir, encoding: 'utf8', shell: process.platform === 'win32', timeout: 60_000 });

const format = run(['format', file]);
if (format.error) process.exit(0); // Dart SDK not available.

const analysis = run(['analyze', '--fatal-infos', file]);
if (analysis.status !== 0) {
  const output = `${analysis.stdout ?? ''}${analysis.stderr ?? ''}`.trim();
  process.stderr.write(`dart analyze found issues in ${file}. Fix them before you continue:\n${output}\n`);
  process.exit(2);
}
process.exit(0);
