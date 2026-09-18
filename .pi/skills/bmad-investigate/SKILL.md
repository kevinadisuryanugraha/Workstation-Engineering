---
name: bmad-investigate
description: |
  Forensic bug and issue triage. Produces a graded investigation case file:
  symptoms, evidence (graded A/B/C by confidence), ranked hypotheses, suspected
  components, and a recommended planning response. INVESTIGATES and DOCUMENTS only —
  does NOT fix code, run tests, or implement. Hands off as a story to an external
  dev tool.

  Use when the user says:
  - "investigate this bug" / "triage this issue" / "debug triage"
  - "what's causing [symptom]" / "why is [feature] broken"
  - "something's wrong with [component]" / "users are reporting [problem]"
  - "figure out what happened" / "root cause this"
  - "I need a bug report" / "create an investigation case file"
  - "forensic analysis" / "diagnose this"
  - "error triage" / "issue investigation"
  - "what do we know about [incident/issue]"

  Three intents: Create (new case file), Update (add evidence to open case),
  Validate (check draft for completeness before handoff). Output lands in
  bmad-output/; a fix story is drafted on handoff.
allowed-tools: Read, Write, Edit, Glob, Grep, TodoWrite
---

# BMAD Investigate

**Forensic triage — plan the fix, don't apply it.**

This skill builds a structured, evidence-graded investigation case file so that
whoever picks up the story has a clear picture of what is known, what is suspected,
and exactly what needs verifying before any code changes. It deliberately stops
before implementation; the result of every investigation is a story handed off to
an external dev tool.

**Persona flavor:** Mary (Business Analyst) frames the user impact; Winston (Architect)
maps the component topology. The skill is a workflow, not a character.

---

## Scope Law (read first)

This skill PLANS. It reads planning artifacts and existing code to gather evidence.
It does NOT write application code, run tests, lint, build, or review diffs.
The last artifact it emits is either an updated planning document or a story file
marked `status: ready-for-dev`. If tempted to "fix the bug", "run the suite", or
"apply the patch" — STOP. Investigate and hand off.

---

## Inputs (load these first)

| Source | Why |
|--------|-----|
| `bmad-output/project-context.md` | Project constitution — architecture, stack, ownership |
| `bmad-output/architecture.md` | Component boundaries, module responsibilities |
| `bmad-output/prd.md` or `tech-spec.md` | Requirements the broken behavior should satisfy |
| `bmad-output/decision-log.md` | Prior decisions that may relate to the issue |
| User-provided symptom description | Primary input — what is failing, when, how |
| Logs / error messages the user pastes in | Raw evidence to grade and analyze |
| Existing story files in `bmad-output/stories/` | Check for duplicate or related work |

If project-context.md does not exist, ask the user to describe the stack and
affected area before proceeding.

---

## Three Intents

Ask which intent applies if ambiguous.

- **Create** — new investigation case file from scratch.
- **Update** — add new evidence to an existing case file, re-rank hypotheses.
- **Validate** — check a draft case file for completeness against the case-file contract.

---

## Workflow — Create

Use TodoWrite to track progress through these steps.

### Step 1 — Clarify the Symptom

Before investigating, confirm exactly what is observable. Ask (or infer from context):

1. **Symptom** — what behavior is wrong? What is the expected behavior?
2. **Trigger** — when does it occur? Every time? Intermittently? Under load?
3. **Scope** — which users, environments, or configurations are affected?
4. **First seen** — when was the issue introduced or first noticed?
5. **Severity** — data loss, service outage, degraded UX, cosmetic?

Record these as the "Symptom Summary" — this is the anchor for all grading later.

---

### Step 2 — Load Context

Read all available inputs listed above. Extract:

- **Affected components** — which modules/services does the symptom implicate?
  (Cross-reference architecture.md for component responsibilities.)
- **Related requirements** — which FR or NFR does the broken behavior touch?
  (Search prd.md for the area.)
- **Recent decisions** — any ADR or decision-log entry touching the suspected area?
- **Similar stories** — any existing story file referencing the same component?

---

### Step 3 — Gather and Grade Evidence

Collect all available evidence. Assign each item an evidence grade:

| Grade | Meaning |
|-------|---------|
| **A** | Directly observed, reproducible, or confirmed by multiple independent sources. High confidence. |
| **B** | Single-source, inferred from logs, or plausible but not yet reproduced. Medium confidence. |
| **C** | Speculative, based on code reading only, or pattern-matched without direct confirmation. Low confidence. |

Evidence types to gather:
- Error messages and stack traces (paste verbatim; mark as grade A if directly from logs)
- Reproduction steps (grade A if reliably reproduced; B if intermittent)
- Code paths identified via Grep/Glob (grade B — code reading is inference, not proof)
- Configuration or environment differences (grade B unless confirmed in both envs)
- Historical changes — recent commits or PRs that touched the area (grade C without
  reproduction confirmation)
- User reports or support tickets (grade B — external, non-reproducible by default)

Use Grep and Glob to search the codebase for error strings, function names, or
file paths the user mentions. Read code files to trace call paths. Do NOT run the
code — read it.

---

### Step 4 — Form Hypotheses

Based on all grade-A and grade-B evidence, draft 2–5 hypotheses. For each:

- **Hypothesis** — a concise statement of the suspected root cause.
- **Supporting evidence** — which evidence items support it (cite grade).
- **Contradicting evidence** — anything that argues against it.
- **Plausibility rank** — High / Medium / Low (derived from weight of A+B evidence).
- **Verification step** — what a dev agent would need to do to confirm or refute this.

Order hypotheses from most to least plausible.

---

### Step 5 — Map Suspected Components

For each top-2 hypothesis, list:

- **Component** — the module, service, or file suspected.
- **Why suspected** — evidence linkage (grade + description).
- **Blast radius** — what else could be affected if this hypothesis is correct?
- **Confidence** — derived from the highest-grade evidence linking to this component.

---

### Step 6 — Write the Case File

Fill the template:

```
${CLAUDE_PLUGIN_ROOT}/skills/bmad-investigate/templates/investigation.template.md
```

Save to: `bmad-output/investigation-<issue-slug>-<date>.md`

Use Write. Fill every `{{placeholder}}` from your analysis.

---

### Step 7 — Recommend the Planning Response

After completing the case file, determine the planning response:

**Option A — Create a fix story:**
Draft a story file using the standard story contract from bmad-epics-and-stories.
The story Dev Notes MUST cite the investigation case file. Status: `ready-for-dev`.
Naming: `{epic}.{story}.{slug}.story.md` in `bmad-output/stories/`.

**Option B — Update an existing backlog story:**
If a related story exists in backlog, recommend updating its Dev Notes and ACs
to incorporate the investigation findings. Do NOT edit the story yourself unless
asked; describe what needs updating.

**Option C — Escalate to planning:**
If the investigation reveals a systemic issue touching multiple epics, recommend
that the user run `/bmad-planning-orchestrator:bmad-prd` or
`/bmad-planning-orchestrator:bmad-architecture` (Update intent) before a story
is created.

Tell the user which option applies and why. If creating a fix story (Option A),
draft it now unless the user says otherwise.

---

### Step 8 — Log the Decision

Append to `bmad-output/decision-log.md`:

```
## Investigation: [Issue Slug] — [Date]
- Symptom: [one sentence]
- Primary hypothesis: [one sentence]
- Primary suspected component: [name]
- Case file: bmad-output/investigation-<slug>-<date>.md
- Recommended response: [Option A/B/C + story ID if created]
```

---

## Workflow — Update

1. Read the existing case file.
2. Ask: what new evidence has arrived?
3. Add new evidence items with grades; re-rank hypotheses if the weight shifts.
4. Increment the case file version in the header.
5. If the primary hypothesis has changed, note it in the decision-log.

---

## Workflow — Validate

Check the draft case file against this contract checklist:

- [ ] Symptom Summary is concrete and testable (not vague)
- [ ] Every evidence item has a grade (A / B / C)
- [ ] At least two hypotheses are present
- [ ] Each hypothesis has: supporting evidence, contradicting evidence, plausibility rank, verification step
- [ ] Suspected Components section maps each component to specific evidence
- [ ] Recommended Action is stated (Option A / B / C)
- [ ] If Option A: a story draft exists or is clearly specified
- [ ] Decision-log entry exists

Report pass/fail per item. Do not edit unless asked.

---

## Evidence Grading Summary

| Grade | Label | Typical Sources |
|-------|-------|----------------|
| A | Confirmed | Direct logs, reproducible steps, two-source corroboration |
| B | Probable | Single logs, code-read inference, intermittent reproduction, user reports |
| C | Speculative | Educated guess, pattern match, untested hypothesis only |

Never promote a C to an A in the case file — the external dev agent needs to know
what is solid and what is guesswork before they start.

---

## Subagent Strategy

For large-scale investigations spanning multiple suspected components, fan out
parallel read-only agents:

**Agent 1 — Evidence Collector**
```
Read the investigation brief at bmad-output/investigation-scratch/brief.md.
Search the codebase with Grep/Glob for error strings, function names, and file
paths listed. Collect stack-trace context. Write findings (verbatim excerpts +
file paths + line numbers) to bmad-output/investigation-scratch/evidence.md.
Do NOT modify any source files. Grade each item A/B/C.
```

**Agent 2 — Component Mapper**
```
Read bmad-output/architecture.md and the brief at
bmad-output/investigation-scratch/brief.md. For each suspected component,
extract its responsibilities, dependencies, and API contracts.
Write findings to bmad-output/investigation-scratch/components.md.
```

After agents complete, synthesize evidence.md + components.md into the final
case file using the template. Delete scratch files after synthesis.

---

## Reference

- [templates/investigation.template.md](templates/investigation.template.md)
- `bmad-output/decision-log.md` — threaded decision record
- `bmad-output/project-context.md` — project constitution
- `/bmad-planning-orchestrator:bmad-epics-and-stories` — creates the fix story
- `/bmad-planning-orchestrator:bmad-readiness-check` — if investigation reveals
  systemic planning gaps before the fix story is safe to hand off

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-investigate`. All methodology credit belongs to the BMAD Code Organization.
