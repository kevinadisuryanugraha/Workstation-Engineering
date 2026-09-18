# BMAD Help — Reference

Detailed routing logic and per-track step tables for the orchestration spine. The
SKILL.md keeps the summary; this file holds the full detail.

## Threaded artifacts (every track)

| File | Role |
|------|------|
| `project-context.md` | Project "constitution" — loaded across all skills. Tech constraints, domain, goals, non-goals. If missing, the project is un-initialized. |
| `decision-log.md` | Append-only log of decisions threaded across workflows, including the **confirmed track**. Read it to learn which track is active. |

The detector treats the absence of `project-context.md` as "not initialized."

## Phase map (canonical order)

```
Analysis  ──►  Planning  ──►  Solutioning  ──►  Implementation-handoff
```

- **Analysis** — ALWAYS optional. Product brief, research, brainstorming. Skip freely.
- **Planning** — REQUIRED. PRD (or tech-spec for Quick Flow) + epics. UX here if UI.
- **Solutioning** — CONDITIONAL. Architecture (+ security/devops for Enterprise).
  Skipped entirely for Quick Flow.
- **Implementation-handoff** — REQUIRED. Story files compiled to `ready-for-dev`. This
  is the LAST thing the plugin produces; implementation runs in an external tool.

## Per-track required vs optional steps

### Quick Flow (1–15 stories)

| Step | Artifact | Skill | Status |
|------|----------|-------|--------|
| Project context | project-context.md | bmad-init | required |
| Analysis | product-brief.md | bmad-product-brief | optional |
| Tech spec | tech-spec.md | bmad-tech-spec | required |
| UX | ux-design.md | bmad-ux | optional (only if UI) |
| Architecture | architecture.md | bmad-architecture | skipped |
| Stories | *.story.md | bmad-epics-and-stories | required (ready-for-dev) |

### BMad Method (10–50+ stories)

| Step | Artifact | Skill | Status |
|------|----------|-------|--------|
| Project context | project-context.md | bmad-init | required |
| Analysis | product-brief.md / research | bmad-product-brief / bmad-research | optional |
| PRD | prd.md | bmad-prd | required |
| UX | ux-design.md | bmad-ux | required IF UI, else skip |
| Architecture | architecture.md | bmad-architecture | required |
| Epics | epics.md | bmad-epics-and-stories | required |
| Stories | *.story.md | bmad-epics-and-stories | required (ready-for-dev) |

### Enterprise (30+ stories)

Everything in BMad Method, plus:

| Step | Artifact | Skill | Status |
|------|----------|-------|--------|
| Security plan | architecture.md (security sections) | bmad-architecture | required |
| DevOps / deployment plan | architecture.md (devops sections) / handoff | bmad-architecture | required |

## Full decision table

Evaluate top-down; the first unmet row for the ACTIVE track is the recommendation.

| # | Condition | Recommend | Notes |
|---|-----------|-----------|-------|
| 1 | No project-context.md | bmad-init (or bmad-product-brief) | Confirm track first |
| 2 | Track unconfirmed in decision-log | (ask user) | Heuristic suggests; user confirms |
| 3 | No prd.md AND no tech-spec.md | bmad-tech-spec / bmad-prd | tech-spec for Quick Flow, PRD otherwise |
| 4 | Has UI, no ux-design.md (BMad/Ent) | bmad-ux | Skip if no UI |
| 5 | Needs architecture, no architecture.md | bmad-architecture | Quick Flow skips |
| 6 | Enterprise, no security/devops sections | bmad-architecture | Enterprise only |
| 7 | No epics.md (BMad/Ent) | bmad-epics-and-stories | Quick Flow uses tech-spec instead |
| 8 | No story files | bmad-epics-and-stories | Compile context objects |
| 9 | Stories exist, some not ready-for-dev | bmad-epics-and-stories | Finish compiling |
| 10 | All required present, stories ready-for-dev | (none) | Handoff complete |

## Story status lifecycle (read-only here)

`backlog → ready-for-dev → in-progress → review → done`

This plugin advances stories to **ready-for-dev** only. `in-progress`, `review`, and
`done` are set by the external dev tool. If the detector sees stories beyond
`ready-for-dev`, implementation is underway externally — report it and recommend nothing.

Story file name convention: `{epic}.{story}.{slug}.story.md`
(e.g. `2.1.stripe-integration.story.md`).

## How "has UI" is determined

The detector cannot reliably infer UI presence from files alone. The recommender checks,
in order:
1. `decision-log.md` for a recorded `ui: true|false` / `has_ui` decision.
2. Presence of any `ux-design.md` (implies UI was intended).
3. Otherwise: UX is treated as an OPEN optional question — surface it to the user rather
   than forcing it.

## Delivery tracking (count-based only)

Progress is measured by **stories remaining vs. stories ready-for-dev** — a simple count
and completion rate. There are NO story points, velocity, burndown, or Fibonacci sizing
anywhere in this plugin. Story sizing is qualitative: "small enough for one agent
session" (~2–8h, one dev-day max); larger stories are split by `bmad-epics-and-stories`.
