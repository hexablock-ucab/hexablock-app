#!/usr/bin/env node
/**
 * PreToolUse hook for Bash. Blocks git commands that break the team's workflow:
 * commits or pushes on main, force pushes, skipped hooks and hard resets.
 * Exit code 2 blocks the call; stderr tells Claude why and what to do instead.
 * Cross-platform: needs only Node.js and git.
 */
import { execFileSync } from 'node:child_process';

const read = async () => {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
};

const block = (reason) => {
  process.stderr.write(`BLOCKED by .claude/hooks/guard-git.mjs: ${reason}\nUse the ship or git-rescue skill instead.\n`);
  process.exit(2);
};

let input;
try {
  input = JSON.parse(await read());
} catch {
  process.exit(0); // Not our business if the payload is unreadable.
}

const command = String(input?.tool_input?.command ?? '');
if (!/\bgit\b/.test(command)) process.exit(0);

const currentBranch = () => {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: input.cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

const protectedBranch = (name) => name === 'main' || name === 'master';

// Check each command of a chain (a && b; c | d) on its own.
for (const raw of command.split(/&&|\|\||;|\|/)) {
  const part = raw.trim();
  const words = part.split(/\s+/);
  const gitAt = words.indexOf('git');
  if (gitAt === -1) continue;
  const sub = words.slice(gitAt + 1).filter((w) => !w.startsWith('-C') && !w.startsWith('--git-dir'));
  const verb = sub.find((w) => !w.startsWith('-'));
  const rest = sub.slice(sub.indexOf(verb) + 1);

  if (rest.includes('--no-verify')) block('hooks must never be skipped (--no-verify).');

  if (verb === 'commit') {
    if (rest.includes('-n')) block('git commit -n skips hooks.');
    if (protectedBranch(currentBranch())) block('never commit on main. Create a task branch first (ship start <slug>).');
  }

  if (verb === 'push') {
    if (rest.some((w) => w === '-f' || w.startsWith('--force') || /^\+/.test(w))) block('force pushes are forbidden.');
    if (rest.some((w) => /(^|:)(main|master)$/.test(w))) block('never push to main; open a pull request.');
    if (protectedBranch(currentBranch())) block('you are on main; push a task branch and open a pull request.');
  }

  if (verb === 'reset' && rest.includes('--hard')) block('git reset --hard can destroy work. Use git-rescue to pick a safe fix.');
  if (verb === 'clean' && rest.some((w) => /^-[a-zA-Z]*f/.test(w))) block('git clean -f deletes untracked files. Use git stash or git-rescue.');
  if (verb === 'branch' && rest.some((w) => w === '-D') && rest.some((w) => protectedBranch(w))) block('main cannot be deleted.');
}

process.exit(0);
