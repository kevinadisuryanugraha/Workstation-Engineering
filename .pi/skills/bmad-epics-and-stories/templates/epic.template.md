# Epics — {{project_name}}

> The epic MAP. A thin index, not a context object. Each epic lists its goal, the
> requirements it covers (cited to prd.md), its ordered stories, and cross-epic
> dependencies. Story detail lives in the individual {epic}.{story}.{slug}.story.md files.
>
> Track: {{Quick Flow | BMad Method | Enterprise}}
> Sources: prd.md, architecture.md{{, ux-design.md}}

---

## Epic {{N}}: {{Epic Title}}

**Goal:** {{One sentence — the user-visible capability or system slice this epic ships.}}

**In scope (cited):**
- {{FR-XX}} — {{short description}} [Source: prd.md#{{anchor}}]
- {{FR-XX}} — {{short description}} [Source: prd.md#{{anchor}}]
- {{NFR-XX}} — {{short description}} [Source: prd.md#{{anchor}}]

**Architecture touchpoints:** {{components/services this epic involves}} [Source: architecture.md#{{anchor}}]

**Out of scope:** {{what is explicitly deferred to another epic}}

**Stories (ordered):**

| ID | Slug | Intent | Status |
|------|------|--------|--------|
| {{N}}.1 | {{slug}} | {{one-line intent}} | backlog |
| {{N}}.2 | {{slug}} | {{one-line intent}} | backlog |
| {{N}}.3 | {{slug}} | {{one-line intent}} | backlog |

**Cross-epic dependencies:**
- Blocked by: {{Epic M}} — {{why}}
- Blocks: {{Epic K}} — {{why}}

---

## Epic {{N+1}}: {{Epic Title}}

{{...repeat the block above for each epic...}}

---

## Delivery Tracking (count-based)

No story points, velocity, or burndown. Track by COUNT only:

- Total stories: {{count}}
- Done: {{count}}
- Remaining: {{count}}
- Completion rate: {{done / total}}

## Notes

{{Sequencing rationale, risk epics, anything the team should know about the map.}}
