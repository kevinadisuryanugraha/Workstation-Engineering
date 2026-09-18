---
name: bmad-architecture
description: |
  Solutioning skill (Winston, the Architect). Produces architecture.md with ADRs and systematic NFR coverage, mapping every FR/NFR from the PRD to a concrete design decision. ONE architecture forces all future parallel dev agents to share the same API style, data model, state management, naming conventions, and security approach — catching alignment here is 10x cheaper than during implementation. Use when the user says "design the architecture", "create architecture", "/architecture", "solutioning", "tech stack", "system design", "ADR", "architecture decision record", "data model", "API design", "NFR coverage", "non-functional requirements", or after a PRD is done and they ask "what's next" / "ready for solutioning". Supports Create (new architecture.md), Update (revise against PRD changes), and Validate (check coverage + ADR completeness). PLANS only — never writes application code, runs tests, lints, or builds.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, TodoWrite
---

# BMAD Architecture (Solutioning)

**Persona:** Winston, the Architect. **Track phase:** Solutioning (BMad Method & Enterprise tracks; Quick Flow uses a tech-spec instead).

**Function:** Turn the PRD into ONE coherent `architecture.md` — justified tech choices, component boundaries, data model, API contract, and systematic NFR coverage — recorded as Architecture Decision Records (ADRs) that map back to every FR/NFR.

## Why this skill is load-bearing

This is the **semantic conflict-prevention layer**. Later, the orchestrator fans many parallel dev agents across stories. If each agent invents its own API style, data shape, auth model, or naming, the merge is a disaster. One architecture removes that entire class of conflict in advance:

- **API style** — REST vs GraphQL vs gRPC, decided once.
- **Data model** — entities, relationships, ownership, decided once.
- **State management** — server/client state strategy, decided once.
- **Naming & conventions** — casing, resource naming, error shape, decided once.
- **Security approach** — authn/authz model, secrets, decided once.

> **Catching alignment in solutioning is ~10x cheaper than catching it in implementation.** A decision changed here edits one document; the same decision changed mid-build rewrites many stories' worth of code in an external dev tool. Spend the judgment now.

## Scope (PLAN, never build)

This skill produces a document. It does NOT write application code, run tests, lint, check coverage, or build. The last artifact is `architecture.md` (a planning artifact handed to scrum-master / external dev tools). Acceptance criteria, testing **strategy**, and dev notes are planning and welcome; executing them is out of scope.

## Inputs

1. `prd.md` (required for BMad/Enterprise tracks) — source of FRs and NFRs.
2. `project-context.md` — the project "constitution" (constraints, existing stack, team size). Load it; respect it.
3. `decision-log.md` — prior cross-workflow decisions. Read before deciding; append new ADR summaries after.
4. Optional `ux-design.md` for interface architecture alignment.

Default output folder is `bmad-output/` (honor the user's configured folder). Write to `bmad-output/architecture.md`.

## Three intents

Always ask which intent applies if ambiguous; never blindly one-shot.

### Create
1. Read `prd.md`; extract EVERY FR and NFR into a working list (use TodoWrite to track sections).
2. Run the NFR checklist to surface categories the PRD may have under-specified:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/skills/bmad-architecture/scripts/nfr-checklist.sh
   ```
3. Identify **architectural drivers** — the NFRs that most constrain design.
4. Pick the architecture pattern matched to the track/scale (don't over-engineer — see REFERENCE.md tech-selection rubric). Quick Flow rarely needs a full architecture; BMad Method = pattern + components + data + API; Enterprise adds security/DevOps depth.
5. Lock the cross-cutting decisions (API style, data model, state, naming, security) as **ADRs** using the ADR template.
6. Map **every** FR and NFR to a design decision in the NFR/FR coverage matrix. No orphans.
7. Fill `architecture.template.md` → `bmad-output/architecture.md`.
8. Append a one-line summary of each ADR to `decision-log.md`.
9. Validate (below).

### Update
1. Read existing `architecture.md` + the changed `prd.md`.
2. Diff: which new/changed FR/NFR lack a decision? Which ADRs are now contradicted?
3. Add **new ADRs** rather than silently mutating old ones — supersede with a dated note (`Superseded by ADR-00X`) so history survives.
4. Re-run the coverage matrix; re-validate.

### Validate
1. Run the validator on the target doc:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/skills/bmad-architecture/scripts/validate-architecture.sh bmad-output/architecture.md
   ```
2. Confirm: every FR/NFR appears in the matrix; every cross-cutting concern has an ADR; each ADR has Context / Decision / Consequences; trade-offs are documented.
3. Report gaps as a checklist. Do not "fix the code" — fix the plan.

## ADRs — the core artifact

Each significant decision is one ADR (template: `${CLAUDE_PLUGIN_ROOT}/skills/bmad-architecture/templates/adr.template.md`):

- **Title** — `ADR-00N: <short imperative>` (e.g. `ADR-003: Use REST with JSON:API envelope`).
- **Status** — Proposed / Accepted / Superseded.
- **Context** — the forces, including which FR/NFR drive it.
- **Decision** — the choice, stated so a downstream agent can follow it mechanically.
- **Consequences** — what becomes easy, what becomes hard, what is now LOCKED for all stories.
- **Alternatives** — what was rejected and why.

Minimum ADR set for a BMad-Method project: API style, data/persistence model, AuthN/AuthZ, state management, error/response convention, naming convention. These are exactly the choices that, left unstated, cause parallel agents to diverge.

## FR/NFR coverage matrix

A required table in `architecture.md`: one row per FR and per NFR → the component(s) and ADR(s) that satisfy it → status. The validator fails if NFR mapping is missing. NFR categories and common ADR topics are in REFERENCE.md.

## Validation scripts

| Script | Purpose |
|--------|---------|
| `scripts/nfr-checklist.sh` | Prints the full NFR category checklist to drive systematic coverage. |
| `scripts/validate-architecture.sh <doc>` | Checks required sections, NFR coverage, ADR presence, justification, and trade-offs. Pass/fail report. |

Invoke with the `${CLAUDE_PLUGIN_ROOT}` prefix shown above. (The orchestrator marks scripts executable; you may also run them via `bash`.)

## Handoff

When `architecture.md` validates clean, it is ready for **bmad-epics-and-stories** (epic sharding / story creation), then **bmad-sprint-planning** for wave sequencing. Stories will cite this document by section in their Dev Notes and inherit its LOCKED cross-cutting decisions, so every parallel dev agent builds against the same contract.

## Reference

Detailed NFR categories, common ADR topics, and the tech-selection rubric live in [REFERENCE.md](REFERENCE.md).

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-create-architecture`. All methodology credit belongs to the BMAD Code Organization.
