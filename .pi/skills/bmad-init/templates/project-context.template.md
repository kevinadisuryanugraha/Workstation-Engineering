# Project Context — {{PROJECT_NAME}}

> The project **constitution**. This document is loaded by every BMAD planning skill
> so they all share the same ground truth. Keep it tight, current, and authoritative.
> When a major decision changes scope, update this file and append the change to
> `decision-log.md`.

- **Track:** {{PROJECT_TRACK}}  _(quick-flow | bmad-method | enterprise)_
- **Created:** {{TIMESTAMP}}

---

## Project Goal

_One or two sentences on the outcome this project delivers. What does "done and
successful" look like?_

## Primary Users

_Who is this for? What do they need? What problem are we solving for them?_

## Scope

_The shape of the work at a high level — the major capabilities or epics in play._

## Core Constraints

_Non-negotiables: tech stack mandates, budget, timeline, compliance, platform limits,
existing systems we must integrate with._

## Non-Goals

_Explicitly out of scope. Listing these prevents drift later — be specific._

## Key Stakeholders / Roles

_Who decides, who builds, who reviews. One builder or multiple teams?_

## Glossary

_Domain terms and their definitions, so every workflow uses words the same way._

---

## Decision Thread

Running decisions live in [`decision-log.md`](./decision-log.md). The first entry is
the track choice from initialization. Consult it before making decisions that might
contradict earlier ones.

## Planning Status (count-based)

- **Track:** {{PROJECT_TRACK}}
- **Stories defined:** _(updated by sprint-planning / story creation)_
- **Stories remaining:** _(count-based delivery — no points, no velocity)_

_This document plans the work. Implementation is handed to external dev tools via
ready-for-dev story files; the planning plugin never writes or tests application code._
