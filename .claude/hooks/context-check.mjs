#!/usr/bin/env node
/**
 * UserPromptSubmit hook. Reminds Claude and the user to compact or clear the
 * session when the context grows past a threshold, so long sessions do not
 * drift. It never compacts by itself: the decision stays with the person, at
 * a task boundary.
 *
 * Context size = the input tokens of the last main-thread API call, read from
 * the session transcript. The first reminder fires at HEXABLOCK_CONTEXT_WARN
 * tokens (default 150000, the limit in CLAUDE.md), then again every
 * HEXABLOCK_CONTEXT_STEP tokens (default 50000). The hook stays silent on any
 * error: a reminder must never block a prompt.
 */
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const WARN = Number(process.env.HEXABLOCK_CONTEXT_WARN) || 150_000;
const STEP = Number(process.env.HEXABLOCK_CONTEXT_STEP) || 50_000;
const TAIL_BYTES = 4 * 1024 * 1024;

const silent = () => process.exit(0);

let data = '';
for await (const chunk of process.stdin) data += chunk;

let input;
try {
  input = JSON.parse(data);
} catch {
  silent();
}
const transcript = input?.transcript_path;
if (!transcript || !existsSync(transcript)) silent();

// Read only the end of the transcript; it can be many megabytes long.
function tail(file) {
  const size = statSync(file).size;
  const start = Math.max(0, size - TAIL_BYTES);
  const buffer = Buffer.alloc(size - start);
  const fd = openSync(file, 'r');
  try {
    readSync(fd, buffer, 0, buffer.length, start);
  } finally {
    closeSync(fd);
  }
  return buffer.toString('utf8');
}

let tokens = 0;
try {
  const lines = tail(transcript).split('\n').reverse();
  for (const line of lines) {
    if (!line.includes('"usage"')) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue; // The first line of the tail can be cut in half.
    }
    if (entry.type !== 'assistant' || entry.isSidechain) continue;
    const usage = entry.message?.usage;
    if (!usage) continue;
    tokens = (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
    break;
  }
} catch {
  silent();
}
if (tokens < WARN) silent();

// Remind once per band (150k, 200k, 250k…), not on every prompt.
const band = Math.floor((tokens - WARN) / STEP);
const stateFile = path.join(tmpdir(), `hexablock-context-${String(input.session_id ?? 'unknown').replace(/[^\w-]/g, '')}.json`);
try {
  const last = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')).band : -1;
  if (band <= last) silent();
  writeFileSync(stateFile, JSON.stringify({ band }));
} catch {
  // Without state, remind anyway.
}

const k = Math.round(tokens / 1000);
process.stdout.write(
  JSON.stringify({
    systemMessage: `Context is about ${k}k tokens. At the next task boundary, update the task document and run /compact (same task) or /clear (new task).`,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `The session context is about ${k}k tokens, above the ${Math.round(WARN / 1000)}k limit in CLAUDE.md. Finish the step in progress first. At the next clean boundary (a task or stage done), tell the user it is a good moment to update the ODD task document and then run /compact to continue the same task or /clear to start a different one. Do not run them yourself and do not interrupt the current step for this.`,
    },
  }),
);
process.exit(0);
