#!/usr/bin/env node
/**
 * Copies the hand-designed levels from hexablock-api into the app's assets (FR-04).
 *
 * The team decided on 2026-11-23 that `levels/` in hexablock-api is the single source of the levels:
 * the app bundles a copy so it plays offline, and CI fails when the copy and the source differ.
 *
 * It writes only level files (`<gameId>/*.json`): new and changed levels are copied, a level the API
 * no longer has is deleted, and any other file in the destination folder is left alone.
 * `source.json` records the commit copied.
 *
 * Usage:
 *   node tool/sync-levels.mjs            copy the levels of hexablock-api main into the app
 *   node tool/sync-levels.mjs --check    compare only; exit 1 and list the differences if they differ
 *   options: --ref <branch or tag>  (default main)   --dest <folder>  (default app/assets/levels)
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'https://github.com/hexablock-ucab/hexablock-api.git';

/** The level files under a folder, as a map from `<gameId>/<file>.json` to its full path. */
export function levelFiles(root) {
  const files = new Map();
  if (!existsSync(root)) return files;
  for (const game of readdirSync(root).filter((d) => statSync(path.join(root, d)).isDirectory()).sort()) {
    for (const file of readdirSync(path.join(root, game)).filter((f) => f.endsWith('.json')).sort()) {
      files.set(path.join(game, file), path.join(root, game, file));
    }
  }
  return files;
}

/** What differs between the source levels and the app's copy, one line per file. */
export function differences(source, copy) {
  const wanted = levelFiles(source);
  const held = levelFiles(copy);
  const lines = [];
  for (const [rel, from] of wanted) {
    if (!held.has(rel)) lines.push(`missing in the app: ${rel}`);
    else if (readFileSync(from, 'utf8') !== readFileSync(held.get(rel), 'utf8')) lines.push(`different from the API: ${rel}`);
  }
  for (const rel of held.keys()) if (!wanted.has(rel)) lines.push(`not in the API any more: ${rel}`);
  return lines;
}

/** Makes the level files of `copy` equal to those of `source`; other files in `copy` stay. */
export function syncLevels(source, copy) {
  const wanted = levelFiles(source);
  const held = levelFiles(copy);
  let copied = 0;
  let removed = 0;
  for (const [rel, from] of wanted) {
    const to = path.join(copy, rel);
    if (existsSync(to) && readFileSync(from, 'utf8') === readFileSync(to, 'utf8')) continue;
    mkdirSync(path.dirname(to), { recursive: true });
    copyFileSync(from, to);
    copied += 1;
  }
  for (const [rel, file] of held) {
    if (!wanted.has(rel)) { rmSync(file); removed += 1; }
  }
  return { copied, removed, equal: wanted.size - copied };
}

function main(args) {
  const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
  const ref = opt('--ref', 'main');
  const dest = path.resolve(opt('--dest', 'app/assets/levels'));
  const git = (cwd, ...a) => execFileSync('git', a, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

  // Fetch only levels/ from the API, at the given ref.
  const work = mkdtempSync(path.join(tmpdir(), 'hexablock-levels-'));
  try {
    git(work, 'clone', '--quiet', '--depth', '1', '--branch', ref, '--filter=blob:none', '--sparse', REPO, 'api');
    const api = path.join(work, 'api');
    git(api, 'sparse-checkout', 'set', 'levels');
    const commit = git(api, 'rev-parse', 'HEAD');
    const source = path.join(api, 'levels');
    if (!existsSync(source)) {
      console.error(`hexablock-api ${ref} has no levels/ folder yet.`);
      return 1;
    }

    if (args.includes('--check')) {
      const lines = differences(source, dest);
      if (lines.length > 0) {
        console.error(`The app's levels differ from hexablock-api ${ref} (${commit.slice(0, 7)}):\n`);
        for (const line of lines) console.error(`  ${line}`);
        console.error('\nRun `npm run sync:levels` and commit the result.');
        return 1;
      }
      console.log(`Levels in sync with hexablock-api ${ref} (${commit.slice(0, 7)}, ${levelFiles(source).size} files).`);
      return 0;
    }

    const { copied, removed, equal } = syncLevels(source, dest);
    writeFileSync(path.join(dest, 'source.json'), `${JSON.stringify({ repository: REPO, ref, commit }, null, 2)}\n`);
    console.log(`Levels from hexablock-api ${ref} (${commit.slice(0, 7)}) in ${path.relative(process.cwd(), dest)}: ${copied} copied, ${removed} removed, ${equal} already equal.`);
    return 0;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
