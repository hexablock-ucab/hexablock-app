#!/usr/bin/env node
/**
 * Quality gate: minimum line coverage, per area and in total.
 * Reads every lcov.info under the given roots and the thresholds in
 * tool/quality-gates.json. Paths in lcov files are matched by prefix,
 * relative to the repository root.
 *
 * Usage: node tool/check-coverage.mjs [--config tool/quality-gates.json]
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const configPath = path.resolve(args.includes('--config') ? args[args.indexOf('--config') + 1] : 'tool/quality-gates.json');
const { coverage } = JSON.parse(readFileSync(configPath, 'utf8'));
const repo = process.cwd();

function* lcovFiles(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === '.dart_tool') continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* lcovFiles(full);
    else if (entry === 'lcov.info') yield full;
  }
}

// Collect hit/found lines per source file, normalized to repo-relative paths.
const files = new Map();
for (const lcov of lcovFiles(repo)) {
  // Dart writes paths relative to the package (lib/...); Jest writes absolute paths.
  const packageDir = path.dirname(path.dirname(lcov));
  let current = null;
  for (const line of readFileSync(lcov, 'utf8').split('\n')) {
    if (line.startsWith('SF:')) {
      const sf = line.slice(3).trim();
      const abs = path.isAbsolute(sf) ? sf : path.join(packageDir, sf);
      current = path.relative(repo, abs).split(path.sep).join('/');
      files.set(current, files.get(current) ?? { found: 0, hit: 0 });
    } else if (line.startsWith('LF:') && current) {
      files.get(current).found += Number(line.slice(3));
    } else if (line.startsWith('LH:') && current) {
      files.get(current).hit += Number(line.slice(3));
    } else if (line.startsWith('end_of_record')) {
      current = null;
    }
  }
}

if (files.size === 0) {
  console.log('No coverage data found (no tests yet). Skipping coverage gate.');
  process.exit(0);
}

const pct = (h, f) => (f === 0 ? 100 : (100 * h) / f);
const failures = [];
const report = [];
for (const area of coverage.areas) {
  let found = 0;
  let hit = 0;
  for (const [file, c] of files) {
    if (file.startsWith(area.path)) { found += c.found; hit += c.hit; }
  }
  if (found === 0) continue;
  const value = pct(hit, found);
  report.push(`  ${area.path.padEnd(40)} ${value.toFixed(1)}% (min ${area.min}%)`);
  if (value < area.min) failures.push(area.path);
}
let totalFound = 0;
let totalHit = 0;
for (const c of files.values()) { totalFound += c.found; totalHit += c.hit; }
const total = pct(totalHit, totalFound);
const totalGate = typeof coverage.totalMin === 'number';
report.push(`  ${'TOTAL'.padEnd(40)} ${total.toFixed(1)}% ${totalGate ? `(min ${coverage.totalMin}%)` : '(reported only)'}`);
if (totalGate && total < coverage.totalMin) failures.push('TOTAL');

console.log('Line coverage:\n' + report.join('\n'));
if (failures.length > 0) {
  console.error(`\nCoverage below the minimum in: ${failures.join(', ')}.`);
  process.exit(1);
}
