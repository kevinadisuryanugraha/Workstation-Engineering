---
name: bmad-epics-and-stories
description: |
  Solutioning flagship — shards a PRD + architecture into epics.md and individual
  {epic}.{story}.{slug}.story.md context objects, the LAST planning artifact before
  external dev handoff. Each story is a self-contained ~8K-token compiled context object:
  Dev Notes with SOURCE CITATIONS back to prd.md/architecture.md, Acceptance Criteria,
  Tasks/Subtasks mapped to ACs, Testing strategy, Dependency Maps, an explicit Owned
  File/Module Scope list (the lever for parallel-conflict-free scheduling), and Learnings
  from Previous Stories. Sized to one dev-day; split if larger; NO story points.
  Use when the user says "shard the PRD", "create epics", "break the PRD into epics",
  "break this epic into stories", "create stories", "create a story", "draft story files",
  "generate the story for X", "prepare stories for dev", "mark the story ready for dev",
  "validate this story", or "what stories are in this epic". Three intents: Create new
  epics/stories, Update an existing story, or Validate a draft against the contract.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
---

# BMAD Epics & Stories

**Track-adaptive sharding.** Turn approved planning docs into the executable backlog: one
`epics.md` map plus per-story context objects. This is the final planning step — the next
thing that touches a story is an **external dev tool**, not this plugin.

**Persona flavor:** the Architect (Winston) shards; the PM (John) confirms scope. Lightweight
flavor only — this is a workflow.

## Scope Law (read first)

This skill PLANS. It NEVER writes application code, runs tests, lints, checks coverage, or
builds. The last artifact it emits is a story file marked `status: ready-for-dev`. Acceptance
Criteria, a Testing **strategy**, and Dev Notes are planning outputs you author. Executing
tests or writing implementation is out of scope — plan it and hand it off. If tempted to
"implement" or "run the suite", STOP.

## Inputs (load these first)

| File | Why |
|------|-----|
| `bmad-output/project-context.md` | Project constitution — load every run |
| `bmad-output/prd.md` | Functional requirements, epic intent |
| `bmad-output/architecture.md` | Tech stack, components, module boundaries |
| `bmad-output/ux-design.md` (if present) | UI acceptance details |
| `bmad-output/decision-log.md` | Threaded decisions to honor |
| existing `bmad-output/stories/*.story.md` | Learnings + ID continuity |

Output folder default: `bmad-output/` (honor user override). Stories go in
`bmad-output/stories/`, the map in `bmad-output/epics.md`.

## Three Intents

- **Create** — shard PRD+architecture into `epics.md`, then compile story files.
- **Update** — revise an existing story (scope, ACs, learnings). Respect LOCKED sections.
- **Validate** — check a draft story against the Context Object contract; report gaps.

Ask which intent if ambiguous. Do not silently regenerate existing stories.

## Tracks (never numbered levels)

Pick interactively; the heuristic suggests, the user confirms.

- **Quick Flow** (1-15 stories) — tech-spec only; shard straight to stories, thin `epics.md`.
- **BMad Method** (10-50+) — PRD + Architecture (+ optional UX); full epic map then stories.
- **Enterprise** (30+) — adds Security + DevOps story streams.

## Sizing Rule (count-based, no points)

A story must be **small enough for one agent session — roughly 2-8h, one dev-day max.**
If a story is larger, **split it**; never inflate scope to fill a sprint. There are NO
Fibonacci points, NO velocity, NO burndown. Delivery is tracked by COUNT: stories remaining
vs. completion rate. See [REFERENCE.md](REFERENCE.md) for the split heuristics.

## Workflow — Create

1. **Load context** — read the inputs above; note the chosen track.
2. **Derive epics** — group PRD requirements into epics (each a shippable slice of value).
   Write `bmad-output/epics.md` from [templates/epic.template.md](templates/epic.template.md):
   epic goal, in-scope requirements (cited), ordered story list, cross-epic dependencies.
3. **Confirm** the epic map with the user before compiling stories.
4. **Generate IDs** — `bash ${CLAUDE_PLUGIN_ROOT}/skills/bmad-epics-and-stories/scripts/generate-story-id.sh <epic-number>`
   gives the next `{epic}.{story}` and a slug stub. Filename: `{epic}.{story}.{slug}.story.md`.
5. **Compile each story** as a CONTEXT OBJECT from
   [templates/story.template.md](templates/story.template.md). It MUST be self-contained
   (~8K tokens) so a dev agent needs no other file. Fill every section:
   - **Story** — as-a / I-want / so-that.
   - **Acceptance Criteria** — numbered, testable. **LOCKED.**
   - **Tasks/Subtasks** — checkboxes, each mapped to an AC via `(AC: #N)`.
   - **Dev Notes** — concrete guidance WITH SOURCE CITATIONS (e.g.
     `[Source: architecture.md#auth-service]`, `[Source: prd.md#FR-12]`). **LOCKED.**
   - **Testing** — strategy only (what to verify, test types, fixtures). No execution. **LOCKED.**
   - **Dependency Maps** — Blocked-by / Blocks other story IDs.
   - **Owned File/Module Scope** — explicit list of paths this story may touch. This is the
     lever for conflict-free parallel scheduling; declare it precisely. See REFERENCE.md.
   - **Learnings from Previous Stories** — carried forward from completed siblings.
   - **Dev Agent Record** — leave EMPTY for the external dev tool.
6. **Scope-conflict check** — run the shared checker over the new/edited stories:
   `bash ${CLAUDE_PLUGIN_ROOT}/scripts/scope-conflict-check.sh bmad-output/stories/`
   Resolve any overlapping Owned Scope before marking stories parallel-safe.
7. **Set status** — `backlog` while drafting; flip to `ready-for-dev` only when every section
   is complete, ACs are testable, scope is declared, and the conflict check is clean.
8. **Log + hand off** — append decisions to `decision-log.md`; tell the user which stories are
   `ready-for-dev` and hand off to the external dev tool. Do NOT implement.

## Workflow — Update / Validate

- **Update:** locate the file by ID, edit non-locked sections freely. Changing a LOCKED
  section (AC/Dev Notes/Testing) requires explicit user confirmation and a decision-log entry.
  Re-run the scope-conflict check if Owned Scope changed.
- **Validate:** for each story confirm all required sections exist, every Task cites an AC,
  Dev Notes carry source citations, Owned Scope is non-empty and conflict-free, and status is
  legal. Report a checklist of pass/fail — do not edit unless asked.

## Status Lifecycle

`backlog → ready-for-dev → in-progress → review → done`. This skill only owns
`backlog` and `ready-for-dev`. Everything past handoff belongs to external dev tooling.

## LOCKED Sections — contract

Acceptance Criteria, Dev Notes, and Testing are LOCKED. The story template states that
external dev tools MUST NOT edit them. They are the compiled, cited source of truth.

## Subagent Strategy

**Pattern:** parallel section/story generation — one agent per epic or per independent story.

| Agent | Task | Output |
|-------|------|--------|
| Agent N | Compile stories for Epic N as full context objects | `bmad-output/stories/N.*.story.md` |

Coordination: write shared context (PRD/architecture/track/sizing rule) to
`bmad-output/context/sharding-context.md`; fan out one agent per epic; on return, the main
context runs the scope-conflict check across ALL stories and resolves overlaps before any
story is marked `ready-for-dev`.

Example prompt:
```
Task: Compile stories for Epic 2 (Payments) as context objects.
Context: read bmad-output/context/sharding-context.md.
For each story: number AC, map every Task to an AC (AC: #N), cite Dev Notes to
prd.md/architecture.md sections, declare an explicit Owned File/Module Scope, leave
Dev Agent Record empty. Size to one dev-day; split anything larger. NO story points.
Output: bmad-output/stories/2.*.story.md, status: backlog.
```

## Reference

- [REFERENCE.md](REFERENCE.md) — sharding method, sizing/split rule, scope-declaration discipline.
- [templates/epic.template.md](templates/epic.template.md)
- [templates/story.template.md](templates/story.template.md)
- `${CLAUDE_PLUGIN_ROOT}/skills/bmad-epics-and-stories/scripts/generate-story-id.sh` — next `{epic}.{story}` ID + slug.
- `${CLAUDE_PLUGIN_ROOT}/scripts/scope-conflict-check.sh` — shared Owned-Scope overlap checker.

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-create-epics-and-stories`. All methodology credit belongs to the BMAD Code Organization.
