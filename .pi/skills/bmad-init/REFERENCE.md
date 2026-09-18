# BMAD Init — Reference

Detailed reference for the workspace scaffolder. The SKILL.md is the operating
guide; this file holds the schema and the long-form track decision detail.

## Config schema (`config.yaml`)

```yaml
bmad_version: "6.x"
project:
  name: "My Project"          # human-readable project name
  track: "bmad-method"        # quick-flow | bmad-method | enterprise
  created: "2026-06-19T00:00:00Z"
paths:
  output_folder: "bmad-output"          # all planning artifacts live here
  stories_folder: "bmad-output/stories" # story context objects
  decision_log: "bmad-output/decision-log.md"
  project_context: "bmad-output/project-context.md"
languages:
  communication: "English"     # how Claude talks to the user
  document_output: "English"   # language of generated artifacts
```

Other planning skills read `paths.output_folder` and `project.track` from this file.
Keep it the single source of truth — do not duplicate paths elsewhere.

## Tracks in depth

Tracks are scale-adaptive and chosen by **planning need**, never by estimating
points. Story count is a soft signal; the real driver is how much up-front structure
the work demands to stay coordinated and de-risked.

### Quick Flow (1–15 stories)
- Artifacts: **tech-spec only**. No full PRD, no formal architecture doc.
- Good for: a single feature, a focused enhancement, one builder, low coordination.
- Flow: `tech-spec` → sprint-planning → story creation → hand off to dev.

### BMad Method (10–50+ stories)
- Artifacts: **PRD + Architecture**, optional **UX** when there's meaningful UI.
- Good for: a real product slice with multiple epics, requirements worth writing
  down, architecture decisions that affect many stories.
- Flow: product brief → PRD → architecture (+ UX) → sprint-planning → stories.

### Enterprise (30+ stories)
- Artifacts: BMad Method set **plus Security planning and DevOps planning**.
- Good for: compliance/regulatory scope, multiple teams, infra and deployment
  concerns that must be planned (not executed) up front.
- Flow: product brief → PRD → architecture → security plan → DevOps plan →
  sprint-planning → stories.
- Note: "DevOps planning" and "Security planning" here mean **planning artifacts**
  (strategies, requirements, acceptance criteria) — this plugin never runs pipelines,
  deploys, or executes scans.

### Suggestion heuristic (`select-track.sh`)
1. compliance/security/infra required, OR ~30+ stories → **Enterprise**
2. ~10+ stories, OR PRD/architecture clearly needed → **BMad Method**
3. otherwise → **Quick Flow**

The heuristic only *suggests*. Surface the recommendation with its reason and let the
user confirm or override. When unsure between two tracks, prefer the lighter one —
you can always promote later via the Update intent.

## Story sizing (count-based delivery)

- Target: **one agent session** of work (~2–8h, one dev-day max).
- Anything larger → split into multiple stories before it reaches a dev tool.
- Track progress by **stories remaining** and **completion rate**, not velocity,
  Fibonacci points, or burndown charts. Those are deliberately removed.

## project-context.md — the constitution

Loaded by every downstream skill so they share the same ground truth. Fill at least:

- **Project Goal** — one or two sentences on the outcome.
- **Primary Users** — who it's for and what they need.
- **Core Constraints** — tech, budget, timeline, compliance non-negotiables.
- **Non-Goals** — what is explicitly out of scope (prevents drift).
- **Key Decisions** — a pointer to `decision-log.md` for the running thread.

Keep it tight and current. When a major decision changes scope, update this file and
append the change to the decision log.

## decision-log.md — threaded decisions

Append-only across workflows. Each entry: date, the decision, the rationale, and
which skill/workflow made it. The first entry is always the track choice from init.

## Idempotency contract (`init-project.sh`)

- Creates `output_folder/` and `output_folder/stories/` if absent.
- Always (re)writes `config.yaml` from current args.
- Seeds `decision-log.md` and `project-context.md` from templates **only if they do
  not already exist** (or exist but are empty). Never clobbers populated files.
- `--validate` checks structure and required config fields without mutating anything.

## Voice

Functional and direct. You may nod to the BMAD personas (Mary=Analyst, John=PM,
Winston=Architect, Sally=UX) for flavor, but init is a workflow, not a character.
