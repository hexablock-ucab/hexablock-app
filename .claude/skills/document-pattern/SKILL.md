---
name: document-pattern
description: "Document a GoF design pattern, SOLID principle or AOP aspect in the README with category, justification in the game context, a short code excerpt and a link to the file. Use after implementing or changing a pattern, a principle example or an aspect. Triggers: documentar patrón, agregar patrón al README, SOLID en README, documentar aspecto, document pattern."
---

# Document a pattern, principle or aspect

The assignment (§3.2, §3.3, §3.5, §6.1) grades the README sections *Design Patterns*, *SOLID Principles* and *AOP*. Each entry must point at real code.

## Steps

1. Find the code: the participants of the pattern (or the class that shows the principle, or the decorator/proxy that implements the aspect). Read them.
2. Check that it is the real pattern: intent and structure match the GoF definition. If it does not match, tell the user instead of documenting it.
3. Update the README:
   - **Design Patterns** table row: `| Pattern | Category | Where (link) | Why here |`.
   - Below the table, a subsection with the justification in the game context (2–4 sentences) and a code excerpt of at most 15 lines, with a link to the file and line.
   - **SOLID Principles:** one concrete example per principle with class, justification and excerpt.
   - **AOP:** which concern, which use cases it wraps, and how it is composed (decorator/proxy around the generic use case, so it applies to every variant).
4. If the class diagram does not show the pattern, add a `TODO(diagram)` note to the task document.
5. Keep the README in English, concise and consistent with the rest of the document.
