#!/usr/bin/env node
/**
 * Quality gate: architecture rules as checks (Clean Architecture, C-05).
 * Reads tool/architecture-rules.json. Each rule names the folders it applies to
 * and the import patterns or identifiers they must never contain.
 * A rule whose folders do not exist yet is skipped, so the check can live in CI
 * before the code exists.
 *
 * Usage: node tool/check-architecture.mjs [--rules tool/architecture-rules.json]
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const rulesPath = path.resolve(args.includes('--rules') ? args[args.indexOf('--rules') + 1] : 'tool/architecture-rules.json');
const { sourceExtensions, rules } = JSON.parse(readFileSync(rulesPath, 'utf8'));

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (sourceExtensions.some((ext) => full.endsWith(ext))) yield full;
  }
}

const violations = [];
let applied = 0;
for (const rule of rules) {
  const roots = rule.paths.filter((p) => existsSync(p));
  if (roots.length === 0) continue;
  applied += 1;
  const patterns = rule.forbidden.map((f) => ({ ...f, re: new RegExp(f.pattern) }));
  const except = (rule.except ?? []).map((e) => path.normalize(e));
  for (const root of roots) {
    for (const file of walk(root)) {
      if (except.some((e) => path.normalize(file).startsWith(e))) continue;
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        for (const f of patterns) {
          if (f.re.test(line)) violations.push(`${file}:${i + 1}  [${rule.id}] ${f.reason}\n      ${line.trim()}`);
        }
      });
    }
  }
}

if (violations.length > 0) {
  console.error('Architecture rules violated:\n');
  for (const v of violations) console.error(`  ${v}`);
  console.error(`\n${violations.length} violation(s). See AGENTS.md §3 and docs/adr/.`);
  process.exit(1);
}
console.log(`Architecture rules OK (${applied} of ${rules.length} rules applied; the rest wait for their folders).`);
