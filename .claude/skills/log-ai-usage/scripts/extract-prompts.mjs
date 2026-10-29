#!/usr/bin/env node
/**
 * List the user prompts of recent Claude Code sessions for one repository.
 * Helper for the log-ai-usage skill. It reads Claude Code's local transcripts
 * under ~/.claude/projects/. The transcript format is internal and can change.
 *
 * Usage: node extract-prompts.mjs [--repo <dir>] [--since YYYY-MM-DD] [--max 20]
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};

const repo = path.resolve(flag('--repo', process.cwd()));
const since = flag('--since', null) ? new Date(flag('--since', null)) : null;
const max = Number(flag('--max', '20'));
const root = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'projects');

if (!existsSync(root)) {
  console.error(`No transcripts folder at ${root}`);
  process.exit(1);
}

// Claude Code names each project folder after its path, with separators replaced by "-".
const slug = repo.replace(/[^a-zA-Z0-9]/g, '-');
const dirs = readdirSync(root).filter((d) => d === slug || d.endsWith(path.basename(repo).replace(/[^a-zA-Z0-9]/g, '-')));

const files = [];
for (const d of dirs) {
  for (const f of readdirSync(path.join(root, d))) {
    if (!f.endsWith('.jsonl')) continue;
    const full = path.join(root, d, f);
    const mtime = statSync(full).mtime;
    if (!since || mtime >= since) files.push({ full, mtime });
  }
}
files.sort((a, b) => b.mtime - a.mtime);

const textOf = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n');
  }
  return '';
};

for (const { full, mtime } of files.slice(0, max)) {
  const prompts = [];
  for (const line of readFileSync(full, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type !== 'user' || entry.isMeta || !entry.message) continue;
    const text = textOf(entry.message.content).trim();
    if (!text || text.startsWith('<') || text.startsWith('Caveat:')) continue;
    prompts.push({ at: entry.timestamp || '', text });
  }
  if (prompts.length === 0) continue;
  console.log(`\n## Session ${path.basename(full, '.jsonl')} (last change ${mtime.toISOString()})`);
  for (const p of prompts) console.log(`- [${p.at}] ${p.text.replace(/\s+/g, ' ').slice(0, 1200)}`);
}
