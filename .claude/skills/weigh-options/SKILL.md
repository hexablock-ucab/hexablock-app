---
name: weigh-options
description: "Compare two or more design or implementation options against the real code and requirements, then recommend one with its cost. Use when the user is choosing between alternatives (A or B, which pattern, which structure). Triggers: cuál conviene, A o B, comparar opciones, ayúdame a decidir, qué patrón uso, which option, compare alternatives, help me decide."
---

# Weigh options

Decisions in this project must be defensible in front of the jury. An option is judged by what it costs in this code base, not by how good it sounds.

## Steps

1. **State each option concretely:** the classes, interfaces and files it would add or change. If an option cannot be stated that way, it is a preference, not an option yet.
2. **Check it is a real choice.** Find one situation where option A fails and B works, and one where B fails and A works. If both exist and differ, the options may combine instead of compete; say so.
3. **Read the inputs first:** the requirement IDs involved (`docs/requirements.md`), the ADRs (`docs/adr/`) and the code the options would touch.
4. **Separate the common cost:** work every option needs anyway does not count in the ranking.
5. **Price each option** against these criteria, marking every claim as *measured* (read in the code) or *estimated*:
   - fit with the requirements and the Accepted ADRs;
   - effect on the Dependency Rule and the extension points (fifth variant, board shape, renderer, backend);
   - number of classes and files, and test effort;
   - how easy it is to explain in the defense.
6. **Recommend one** in the first line, then give the evidence, the cost of the choice and what would change the recommendation.

## Rules

- Do not invent options for symmetry; if reading the code leaves one sensible option, say so.
- An architecture decision is the team's: end by proposing an ADR (status Proposed) when the choice is architectural.
- Answer in the user's language; any ADR text is in English.
