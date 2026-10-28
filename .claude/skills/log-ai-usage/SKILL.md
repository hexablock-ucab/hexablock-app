---
name: log-ai-usage
description: "Write or update the AI_USAGE.md entry for the current task with the tool and model, the real prompts, the result, what the team changed and the lessons learned. Use at the end of every significant AI-assisted task, before shipping. Triggers: registrar uso de IA, AI usage, documentar prompts, log the prompts, AI_USAGE."
---

# Log AI usage

The assignment (§7.2) requires one entry per significant AI use. Undocumented AI use is treated like plagiarism. Entries must be honest and specific.

## Steps

1. Collect the prompts:
   - First, the verbatim entries in `## Log` of the task document (`odd/tasks/*.md`).
   - If needed, run `node .claude/skills/log-ai-usage/scripts/extract-prompts.mjs --repo . --since <YYYY-MM-DD>` to list the user prompts of recent Claude Code sessions for this repository. It reads Claude Code's local transcripts; the format can change, so treat its output as a helper and check it.
2. Ask the user two closed questions if the answer is not already in the log:
   - What did the team change, reject or rewrite in the AI's output?
   - What did the AI get wrong or do poorly, and how did you notice?
3. Append an entry under `## Usage log` in `AI_USAGE.md` with this exact structure:

```markdown
### <YYYY-MM-DD> — <task title> (<odd/tasks/NNNN-slug.md>, PR #<n>)

- **Author:** <team member who drove the session>
- **Tool / model:** Claude Code <version> — <model(s) used, e.g. Sonnet for orchestration, Opus for odd-worker>
- **Task:** <problem addressed, with requirement IDs>
- **Prompts:** <verbatim or faithful paraphrase; quote the key ones>
- **Result:** <what the AI produced: files, design, explanation>
- **Team modifications:** <what we changed and why>
- **Errors and corrections:** <wrong or suboptimal outputs and how we detected them, or "none detected">
- **Lessons:** <one or two lines>
```

4. Update the running estimate in `## Critical evaluation` only when the user gives a new figure; never invent percentages.

## Rules

- Never fabricate a prompt, a figure or a correction. Missing information is asked for or marked `TODO(team)`.
- Never include secrets, tokens or personal data in an entry.
- The entry is in English. Quoted prompts keep their original language.
