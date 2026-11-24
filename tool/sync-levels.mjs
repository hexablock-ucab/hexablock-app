#!/usr/bin/env node
/**
 * Copies the hand-designed levels from hexablock-api into the app's assets (FR-04).
 *
 * The team decided on 2026-11-23 that `levels/` in hexablock-api is the single source of the levels:
 * the app bundles a copy so it plays offline, and CI warns when the copy and the source differ.
 *
 * Usage:
 *   node tool/sync-levels.mjs            copy the levels of hexablock-api main into the app
 *   node tool/sync-levels.mjs --check    compare only; exit 1 and list the differences if they differ
 *   options: --ref <branch or tag>  (default main)   --dest <folder>  (default app/assets/levels)
 *
 * Only `levels/<gameId>/*.json` is copied, one folder per gameId; `source.json` records the commit copied.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const REPO = 'https://github.com/hexablock-ucab/hexablock-api.git';
const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const ref = opt('--ref', 'main');
const dest = path.resolve(opt('--dest', 'app/assets/levels'));
const checkOnly = args.includes('--check');

const git = (cwd, ...a) => execFileSync('git', a, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

// 1. Fetch only levels/ from the API, at the given ref.
const work = mkdtempSync(path.join(tmpdir(), 'hexablock-levels-'));
function run() {
  git(work, 'clone', '--quiet', '--depth', '1', '--branch', ref, '--filter=blob:none', '--sparse', REPO, 'api');
  const api = path.join(work, 'api');
  git(api, 'sparse-checkout', 'set', 'levels');
  const commit = git(api, 'rev-parse', 'HEAD');
  const src = path.join(api, 'levels');
  if (!existsSync(src)) { console.error(`hexablock-api ${ref} has no levels/ folder yet.`); process.exitCode = 1; return; }

  // 2. The files the app must hold: levels/<gameId>/*.json.
  const wanted = new Map();
  for (const game of readdirSync(src).filter((d) => statSync(path.join(src, d)).isDirectory()).sort()) {
    for (const file of readdirSync(path.join(src, game)).filter((f) => f.endsWith('.json')).sort()) {
      wanted.set(path.join(game, file), path.join(src, game, file));
    }
  }
  const held = new Map();
  if (existsSync(dest)) {
    for (const game of readdirSync(dest).filter((d) => statSync(path.join(dest, d)).isDirectory())) {
      for (const file of readdirSync(path.join(dest, game)).filter((f) => f.endsWith('.json'))) held.set(path.join(game, file), path.join(dest, game, file));
    }
  }

  // 3. Compare.
  const differences = [];
  for (const [rel, from] of wanted) {
    if (!held.has(rel)) differences.push(`missing in the app: ${rel}`);
    else if (readFileSync(from, 'utf8') !== readFileSync(held.get(rel), 'utf8')) differences.push(`different from the API: ${rel}`);
  }
  for (const rel of held.keys()) if (!wanted.has(rel)) differences.push(`not in the API any more: ${rel}`);

  if (checkOnly) {
    if (differences.length > 0) {
      console.error(`The app's levels differ from hexablock-api ${ref} (${commit.slice(0, 7)}):\n`);
      for (const d of differences) console.error(`  ${d}`);
      console.error('\nRun `node tool/sync-levels.mjs` and commit the result.');
      process.exitCode = 1; return;
    }
    console.log(`Levels in sync with hexablock-api ${ref} (${commit.slice(0, 7)}, ${wanted.size} files).`);
    return;
  }

  // 4. Copy: the app's folder becomes an exact copy of the API's levels.
  rmSync(dest, { recursive: true, force: true });
  for (const [rel, from] of wanted) {
    mkdirSync(path.dirname(path.join(dest, rel)), { recursive: true });
    copyFileSync(from, path.join(dest, rel));
  }
  writeFileSync(path.join(dest, 'source.json'), `${JSON.stringify({ repository: REPO, ref, commit }, null, 2)}\n`);
  console.log(`Copied ${wanted.size} level files from hexablock-api ${ref} (${commit.slice(0, 7)}) to ${path.relative(process.cwd(), dest)}.`);
  if (held.size > 0 && differences.length) for (const d of differences) console.log(`  ${d}`);
}
try { run(); } finally { rmSync(work, { recursive: true, force: true }); }
