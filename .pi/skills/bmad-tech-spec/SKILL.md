---
name: bmad-tech-spec
description: |
  Quick Flow lightweight technical specification for small-scope work (1-15 stories).
  Replaces the full PRD + architecture pair when scope is small and requirements are clear.
  Produces bmad-output/tech-spec.md as the single planning artifact before story creation.

  Use when the user says: "write a tech spec", "create a technical specification",
  "I need a tech spec for this feature", "quick spec", "small project spec", "we don't
  need a full PRD", "just a tech spec", "spec out this change", "document this feature".

  QUICK FLOW TRACK ONLY (1-15 stories). If scope grows beyond ~15 stories or involves
  multiple teams / external integrations at scale, stop and redirect to bmad-prd +
  bmad-architecture instead — those skills are built for that complexity.

  Supports three intents: Create (new spec), Update (revise an existing tech-spec.md),
  Validate (review a draft for completeness against BMAD criteria).
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, TodoWrite
---

# BMAD Tech Spec — Quick Flow

This skill produces a focused `tech-spec.md` for **Quick Flow** work: small, well-scoped
features or changes that sit in the 1-15 story range. It consolidates the product
rationale, technical approach, and story backlog into a single lightweight document,
skipping the separate PRD + architecture artifacts that larger tracks require.

> **Track guidance**
> - 1-15 stories, single team, clear requirements → **Quick Flow** (this skill)
> - 10-50+ stories, multiple concerns, or uncertain scope → use **bmad-prd** then **bmad-architecture**
> - 30+ stories, cross-org, security/compliance/DevOps dimensions → **Enterprise** track

---

## Workflow

### Step 1 — Identify intent

Ask the user (or infer from context) which of three intents applies:

| Intent | When |
|--------|------|
| **Create** | No tech-spec.md exists yet |
| **Update** | Revising scope, requirements, or approach in an existing spec |
| **Validate** | Checking a draft spec for BMAD completeness before moving to stories |

### Step 2 — Gather context

For **Create**, collect (interactively or from existing project files):

1. **Problem & solution** — what are we solving and how?
2. **Scope** — what is in scope? What is explicitly out of scope?
3. **Functional requirements** — numbered, MoSCoW-tagged (MUST / SHOULD / COULD)
4. **Non-functional requirements** — performance, security, accessibility targets that are relevant; omit boilerplate that does not apply
5. **Technical approach** — stack, key components, data model sketch, API surface (if any)
6. **Story list** — high-level backlog items; the scrum-master skill will compile them into full story files
7. **Dependencies & risks** — third-party libs, external services, known unknowns
8. **Decision log entries** — any choices made during this conversation that belong in `bmad-output/decision-log.md`

Load `bmad-output/project-context.md` if present — it is the project constitution and must
not be contradicted without a recorded decision.

For **Update**, read the existing `bmad-output/tech-spec.md` first, then apply targeted
edits and log what changed in the decision log.

For **Validate**, read the existing spec and report against the checklist in the
[Validation Checklist](#validation-checklist) section below.

### Step 3 — Draft or revise

Render the template at:

```
${CLAUDE_PLUGIN_ROOT}/skills/bmad-tech-spec/templates/tech-spec.template.md
```

Fill every section. Omit sections that genuinely do not apply (e.g., no API design for a
pure-CLI tool) and note the omission inline. Do not leave unreplaced `{{placeholders}}`.

Testing strategy in the spec is **planning only** — describe what should be tested and
why. Do not write test code. Do not set coverage numbers as mandatory targets; frame them
as guidance for the dev team.

### Step 4 — Write output

Write to `bmad-output/tech-spec.md` (respecting the `outputFolder` user config if set).

If decision-log entries were made, append them to `bmad-output/decision-log.md`
(create the file if it does not exist, using the format: `## [YYYY-MM-DD] <title>` /
`**Decision:** ...` / `**Rationale:** ...`).

### Step 5 — Confirm next steps

After writing, tell the user:

- The spec is the Quick Flow planning artifact. Story creation is the next step.
- Use **bmad-epics-and-stories** to compile stories from the story list in the spec.
- If scope has grown during this conversation beyond ~15 stories, recommend switching to
  the BMad Method track (bmad-prd + bmad-architecture) before proceeding.

---

## Validation Checklist

When intent is **Validate**, report pass/fail for each item:

- [ ] Problem statement is clear and specific
- [ ] Solution is described without implementation code
- [ ] All functional requirements are numbered and MoSCoW-tagged
- [ ] Non-functional requirements include at least one performance or security entry if applicable
- [ ] Technical approach names the stack and describes key components
- [ ] Story list exists and each story title is one-line, action-oriented
- [ ] Story count is 1-15 (flag if over)
- [ ] No unreplaced `{{placeholders}}` remain
- [ ] Testing section describes strategy only (no executable test code)
- [ ] Dependencies table lists version or version constraint
- [ ] Risks table lists at least one risk with a mitigation
- [ ] Decision log entries have been written for any significant choices
- [ ] No content instructs a dev agent to run tests, lint, build, or deploy

---

## Subagent Strategy

This skill is primarily single-threaded (one conversation, one document). Parallelism is
optional and limited to information gathering:

- If the user wants **concurrent research** (e.g., compare two tech options), spawn two
  WebSearch/WebFetch agents in parallel and synthesize results before writing the spec.
- Do not spawn parallel agents for writing — the spec is one coherent document and must
  be written atomically to avoid merge conflicts.

---

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-tech-spec`. All methodology credit belongs to the BMAD Code Organization.
