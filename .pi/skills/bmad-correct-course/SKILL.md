---
name: bmad-correct-course
description: |
  CROSS-PHASE mid-stream scope correction. Re-enters planning when requirements,
  features, architecture, or constraints change after planning has started. Re-shards
  affected epics/stories, re-sequences sprint-status.yaml, appends rationale to
  decision-log.md. Routes to bmad-epics-and-stories, bmad-sprint-planning, or
  bmad-parallel-plan as needed. Changes the PLAN, never code.

  Use when: "we need to change course", "scope has changed", "new requirement came in",
  "we're dropping feature X", "we need to pivot", "re-plan after the change",
  "requirements changed mid-sprint", "correct course", "architecture changed",
  "re-scope the backlog", "update epics after feedback", "cancel story X",
  "add epic for Y", "change the plan", "we got new constraints", or when stories
  are split/merged/reordered due to a decision not in the original plan.

  Produces: updated epics.md (affected only), revised/new story files, updated
  sprint-status.yaml, new decision-log.md entry. NEVER writes code or runs tests.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
---

# BMAD Correct Course

**Role:** Cross-phase re-entry point for mid-stream planning changes.

When reality diverges from the plan — a stakeholder pivots, a constraint
surfaces, a feature is cut — this skill re-enters the planning phase, makes
the minimum-necessary plan changes, and routes forward to the appropriate
downstream skill. It changes **the plan**, never the code.

**Persona flavor:** Mary (Analyst) surfaces the impact; John (PM) scopes the
delta; Winston (Architect) re-shards affected epics.  
Lightweight flavor only — this is a workflow.

---

## Scope Law (read first)

This skill PLANS. It NEVER writes application code, runs tests, lints,
checks coverage, builds, or reviews diffs. If tempted to "fix the code" or
"run the suite" — STOP. Plan the change and hand it off.

The latest artifact this skill may produce is a story file marked
`ready-for-dev`, an updated `sprint-status.yaml`, or a routing directive
to a downstream planning skill.

---

## When to Use This Skill

Trigger when ANY of the following is true:

- A requirement, feature, or constraint has changed **after** any planning
  artifact (PRD, architecture, epics.md, or stories) was produced.
- Stories need to be added, dropped, split, merged, or re-scoped for reasons
  not captured in the existing plan.
- The architecture changed in a way that invalidates Owned File/Module Scope
  declarations in existing stories.
- The user wants to document a mid-stream decision in `decision-log.md`
  before proceeding.

---

## Inputs (load these first)

| File | Why |
|------|-----|
| `bmad-output/project-context.md` | Project constitution — load every run |
| `bmad-output/decision-log.md` | Threaded decisions; append here |
| `bmad-output/epics.md` | Existing epic map to diff against |
| `bmad-output/prd.md` | Source of truth for requirements |
| `bmad-output/architecture.md` | Tech boundaries (if architecture changed) |
| `bmad-output/sprint-status.yaml` | Current sequencing state |
| `bmad-output/stories/*.story.md` | In-flight and backlog stories |

Output folder default: `bmad-output/`. Honor any user-configured override
from `bmad-output/config.yaml`.

---

## Three Intents

| Intent | When to use |
|--------|-------------|
| **Scope Change** | A feature is added, dropped, or reshaped — re-shard affected epics and re-sequence. |
| **Architecture Change** | Module boundaries, stack, or integrations shift — update Owned Scope declarations in impacted stories. |
| **Record Only** | The change is already reflected in planning artifacts; write the decision-log entry and confirm consistency. |

State the intent explicitly before proceeding. When unclear, ask the user
which scenario applies rather than assuming.

---

## Workflow

Use `TodoWrite` to track progress through these steps.

### Step 1 — Load and orient

1. Read all inputs listed above.
2. Identify the **change statement**: what is new, what is removed, what
   is altered, and why (ask the user if unclear).
3. State back to the user what you understood before making any edits.

### Step 2 — Impact triage

Identify the minimum blast radius:

- Which **epics** are affected? (added / dropped / reshaped)
- Which **stories** are affected? (added / dropped / re-scoped /
  invalidated Owned Scope)
- Which **story statuses** must change? (`in-progress` stories touched by
  the change need special care — flag them; do not silently move them.)
- Does `sprint-status.yaml` need re-sequencing?

Present the triage to the user and confirm before editing.

### Step 3 — Update planning artifacts

Apply only the minimum-necessary changes.

#### 3a. Update epics.md (affected epics only)

- Add new epics with a `# COURSE-CORRECTION` annotation and the date.
- Mark dropped epics as `status: cancelled` — do not delete; preserve history.
- Update epic descriptions, scope boundaries, and the ordered story list.
- Do **not** re-generate untouched epics.

#### 3b. Re-shard affected stories (route to bmad-epics-and-stories)

For any epic that changed scope, invoke the story-sharding workflow:

> **Route to `bmad-epics-and-stories` (intent: Update or Create)**  
> Provide the updated epic definition and a list of story IDs to add,
> drop, or revise. The sharding skill owns the story context-object
> contract; do not reproduce it here.

- Stories being dropped: set `status: cancelled` in the story file header
  and in `sprint-status.yaml`. Do not delete files.
- Stories being added: they start at `status: backlog`.
- Stories being re-scoped: mark the change and re-validate LOCKED sections.
  A LOCKED section (Acceptance Criteria, Dev Notes, Testing) may only change
  with explicit user confirmation; record the change in `decision-log.md`.

#### 3c. Re-sequence sprint-status.yaml (route to bmad-sprint-planning)

After all story changes are settled, route to `bmad-sprint-planning` to
re-derive wave assignments:

> **Route to `bmad-sprint-planning` (intent: Update)**  
> Pass the full list of changed story IDs and their new statuses.
> Ask it to recompute the dependency graph and re-assign parallel sets.

Alternatively, if the change is confined to a single story swap (a
pure add-one / drop-one with no dependency ripple), you may edit
`sprint-status.yaml` directly:

```bash
# Validate current sprint-status.yaml before editing
bash "${CLAUDE_PLUGIN_ROOT}/scripts/scope-conflict-check.sh" bmad-output/stories/
```

#### 3d. Re-plan parallelism (route to bmad-parallel-plan, if needed)

If Owned File/Module Scope declarations changed or new stories were added
to the backlog, re-plan the wave assignment:

> **Route to `bmad-parallel-plan` (intent: Update)**  
> Pass the updated story list and note which scopes changed.
> Ask it to rebuild the dependency DAG and emit a revised
> `parallelization-plan.md`.

Only invoke this if the project was previously using parallel waves. If
the project is on Quick Flow or sequential delivery, skip this step.

### Step 4 — Append to decision-log.md

Every course-correction MUST produce a decision-log entry. Use this
format (append newest-first):

```markdown
### YYYY-MM-DD — Course Correction: <short title>
- **Decision:** <what changed in the plan>
- **Rationale:** <why the change was necessary; alternatives considered>
- **Impact:** <epics added/dropped, stories added/dropped/re-scoped,
  status changes in sprint-status.yaml>
- **In-progress stories affected:** <list, or "none">
- **Made by:** bmad-correct-course
- **Supersedes:** <link to prior entry, if any>
```

Append to `bmad-output/decision-log.md` using the template at
[`templates/course-correction.template.md`](templates/course-correction.template.md).

### Step 5 — Summarize and hand off

After all updates are applied, report:

```
Course correction applied.
  Decision log  : entry appended → bmad-output/decision-log.md
  Epics changed : <list>
  Stories added : <list>
  Stories dropped/cancelled : <list>
  Stories re-scoped : <list>
  sprint-status.yaml : re-sequenced (wave assignments updated)
  Next step     : <route taken — epics-and-stories / sprint-planning / parallel-plan>
```

Do NOT implement. The plan is ready; external dev tools pick it up.

---

## Guardrails

- **Never delete** planning artifacts. Cancel them in place with a status
  annotation and a decision-log entry. History is a first-class concern.
- **Minimum blast radius.** Only change what the scope change requires.
  Untouched epics, stories, and wave assignments must not be regenerated.
- **In-progress stories are sensitive.** If a story is `in-progress` or
  `review`, flag it to the user and wait for explicit confirmation before
  altering scope or cancelling it. Do not silently mutate live work.
- **LOCKED sections require confirmation.** Acceptance Criteria, Dev Notes,
  and Testing in an existing story are LOCKED. Changing them requires the
  user to explicitly authorize the change; record the authorization in
  decision-log.md.
- **No metrics.** Do not compute velocity, burndown, or story points at any
  step. Delivery tracking is count-based: stories remaining and completion
  rate. Never introduce points fields into sprint-status.yaml.
- **Route, don't reproduce.** Story context-object compilation belongs to
  `bmad-epics-and-stories`. Wave math belongs to `bmad-sprint-planning` and
  `bmad-parallel-plan`. Route rather than duplicating their logic.

---

## Routing Summary

| Downstream skill | When to route |
|-----------------|---------------|
| `bmad-epics-and-stories` (Update or Create) | Epic scope changed; stories need to be re-sharded or new ones compiled |
| `bmad-sprint-planning` (Update) | Dependency graph or wave assignments need recomputation |
| `bmad-parallel-plan` (Update) | Owned File/Module Scope changed; parallel waves need to be rebuilt |

You may route to more than one downstream skill in sequence. Always update
`decision-log.md` before routing.

---

## Status Lifecycle Reference

```
backlog → ready-for-dev → in-progress → review → done
                                                     ↑
cancelled  (set here on drop; never deleted)     ──── 
```

`cancelled` is a terminal state. Cancelled stories remain in
`sprint-status.yaml` with `status: cancelled` so the history is preserved.

---

## Subagent Strategy

**Pattern:** parallel impact analysis, sequential application.

For large backlogs (15+ stories, 3+ affected epics), fan out analysis:

| Agent | Task | Output |
|-------|------|--------|
| Agent 1 | Diff epics.md against the change statement; list affected epic IDs | `bmad-output/context/affected-epics.md` |
| Agent 2 | Scan all story files; identify stories whose Owned Scope or dependencies are invalidated | `bmad-output/context/affected-stories.yaml` |
| Agent 3 | Read sprint-status.yaml; identify dependency ripple from cancelled/added stories | `bmad-output/context/ripple-analysis.yaml` |

Coordinator (main context): merge outputs, confirm triage with the user,
then apply changes and route to downstream skills.

Example subagent prompt:
```
Task: Identify stories affected by the scope change.
Context: Read all *.story.md files under bmad-output/stories/.
Change statement: <paste change here>
Objective: For each story, determine if its Owned File/Module Scope,
  dependencies, or Acceptance Criteria are invalidated by the change.
Output: Write YAML list to bmad-output/context/affected-stories.yaml

Format:
- id: "2.1.stripe-integration"
  affected: true
  reason: "owned scope includes src/payments/ which moves to new module"
  status: "ready-for-dev"
```

---

## Reference

- [templates/course-correction.template.md](templates/course-correction.template.md) — decision-log entry template.
- `bmad-output/decision-log.md` — append here; never overwrite prior entries.
- `${CLAUDE_PLUGIN_ROOT}/scripts/scope-conflict-check.sh` — validate Owned Scope after story changes.
- Downstream: `bmad-epics-and-stories`, `bmad-sprint-planning`, `bmad-parallel-plan`.

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-correct-course`. All methodology credit belongs to the BMAD Code Organization.
