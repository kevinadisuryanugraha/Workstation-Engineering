---
name: bmad-spec
description: |
  Distills ANY messy input — brain dump, transcript, long PRD, stakeholder notes,
  feature request, voice memo — into a tight five-field SPEC.md kernel that any
  downstream planning skill can consume. The five fields are: Problem, Capabilities,
  Constraints, Non-Goals, Success Metrics.

  Use when the user says "create a spec", "write a spec for", "distill this into a
  spec", "I have a brain dump", "turn this into something structured", "clean up these
  notes", "make a SPEC from", "I want to define the problem", "help me scope this",
  "summarize what we're building", "I have a PRD but need a kernel", "what are we
  actually solving?", or drops raw text/transcript and asks for structure. Also use
  when starting any new initiative and a clean shared definition is missing.
allowed-tools: Read, Write, Edit, Glob, Grep, TodoWrite
---

# BMAD Spec — Five-Field Kernel Distiller

**Function:** Accept messy, unstructured, or verbose input and produce a lean
`SPEC.md` kernel (five fields, no more) that anchors every downstream planning
workflow. This is a **planning** skill. It never writes application code, runs
tests, or builds anything.

## What it produces

A single file under the configured output folder (default `bmad-output/`):

```
bmad-output/
└── SPEC.md    # the five-field kernel
```

The kernel is intentionally small — a SPEC is not a PRD, not a brief, not an
architecture doc. It is the shared definition of what is being built and why.
Every downstream skill (PRD, tech-spec, architecture) loads it as the ground
truth for scope.

## The five fields

| Field | Purpose |
|---|---|
| **Problem** | The one thing that hurts right now and why it matters |
| **Capabilities** | What the solution must be able to do (outcome-framed) |
| **Constraints** | Hard limits that are not negotiable (budget, tech, time, compliance) |
| **Non-Goals** | Scope that is explicitly out — prevents creep and confusion |
| **Success Metrics** | Observable signals that confirm the problem is solved |

See `templates/spec.template.md` for the exact template with guidance and examples.

## Workflow

### 1. Ingest

Accept whatever the user hands over:
- Paste of raw text, notes, or a transcript
- A path to an existing file (`Read` it)
- Verbal description in the chat

If the input exceeds a few hundred words, briefly acknowledge what you received
before proceeding. Do not ask the user to reformat it — that is the skill's job.

### 2. Extract (silent analysis)

Read the input and locate signal for each field:
- **Problem:** What pain, gap, or failure state is described? Who experiences it?
- **Capabilities:** What outcomes or abilities are requested? Rephrase features
  as capabilities ("users can …", "the system supports …").
- **Constraints:** What is fixed? Look for budget figures, tech mandates, deadlines,
  regulatory mentions, team-size limits.
- **Non-Goals:** What is the input silent about that a reader might assume? What
  is explicitly ruled out? What is deferred?
- **Success Metrics:** What does "done" or "working" look like? Numbers,
  observable behaviors, thresholds.

### 3. Draft and present

Write a concise draft of all five fields and show it to the user in the chat
before writing to disk. Keep each field tight:
- Problem: 2–5 sentences max.
- Capabilities: 3–7 bullet points, outcome-framed.
- Constraints: 2–6 bullet points, hard limits only.
- Non-Goals: 2–6 bullet points, clear and unambiguous.
- Success Metrics: 2–5 bullet points, each with a measurable signal.

After presenting, ask one targeted question: "Does anything here need to change
before I write SPEC.md?"

### 4. Write

Once the user confirms (or revises), write `SPEC.md` using the template:

```
${CLAUDE_PLUGIN_ROOT}/skills/bmad-spec/templates/spec.template.md
```

Output path: `<outputFolder>/SPEC.md` (read `bmad-output/config.yaml` if it
exists to find the configured output folder; fall back to `bmad-output/`).

Append a new entry to `bmad-output/decision-log.md` (create it if absent):

```markdown
## SPEC created — <ISO date>
- Source: <one-line description of the input, e.g. "stakeholder brain dump">
- Key scope decision: <the single most important Non-Goal or Constraint>
```

### 5. Hand off

After writing, tell the user what the SPEC unlocks:
- **Quick Flow track** → hand off to `bmad-tech-spec` to turn the kernel into a
  deployable spec.
- **BMad Method / Enterprise track** → hand off to `bmad-product-brief` or the
  PM role (`bmad-prfaq`) for a full PRD.
- If no workspace exists yet, suggest running `/bmad-planning-orchestrator:bmad-init`
  first to pick a track.

## Three intents

- **Create** — distill fresh input into a new `SPEC.md` (the common case).
- **Update** — the user has new information or changed scope. Read the existing
  `SPEC.md`, apply the changes, present a diff-style summary, confirm, then
  overwrite. Record the change in `decision-log.md`.
- **Validate** — review `SPEC.md` against the five-field contract: are all fields
  present and non-empty? Is the Problem one coherent statement? Are Capabilities
  outcome-framed (not feature-list)? Are Non-Goals unambiguous? Flag any gaps and
  offer to fix them.

## Distillation heuristics

Follow these when mapping noisy input to the five fields:

| Input pattern | Maps to |
|---|---|
| "we need to fix / users complain / it's broken" | Problem |
| "it should / users can / the system supports" | Capabilities |
| "we can't / no budget / must use / by deadline" | Constraints |
| "not in scope / later / out of v1 / won't do" | Non-Goals |
| "if X% then / we'll know it works when / target" | Success Metrics |

When a constraint sounds aspirational (e.g., "we'd like to finish in Q3"), move
it to Non-Goals or flag it as a soft constraint and note the ambiguity.

When capabilities sound like features rather than outcomes, rephrase: "add a
search bar" → "users can find any record within 3 keystrokes".

When no success metrics appear in the input, use the Problem statement to derive
proxy metrics: if the problem is "users can't find X", a metric is "time-to-find
X reduced by Y%".

## Guardrails

- **Lean by design.** Resist adding a sixth field. If important information does
  not fit the five fields, note it as context in the file header and direct the
  user to expand it in the PRD or tech-spec stage.
- **No solutioning.** The Capabilities field names outcomes, not implementation
  choices. Architecture, tech stack, and approach live downstream.
- **No story points, velocity, or burndown** anywhere in the SPEC.
- **Scope law.** This skill's last artifact is `SPEC.md`. It does not create
  stories, write code, or produce acceptance criteria. Hand those to downstream
  skills.

See `REFERENCE.md` for extended distillation patterns and edge cases.

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-spec`. All methodology credit belongs to the BMAD Code Organization.
