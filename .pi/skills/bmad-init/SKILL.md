---
name: bmad-init
description: |
  Initialize a BMAD planning workspace: pick a scale-adaptive TRACK (Quick Flow /
  BMad Method / Enterprise) interactively, then scaffold the output folder, a config
  file, an empty decision-log.md, and a project-context.md "constitution". Use when
  the user says "initialize BMAD", "set up BMAD", "start a new BMAD project",
  "scaffold the planning workspace", "bmad init", "create the bmad config", or is
  beginning planning and has no bmad-output/ folder yet. Also use when the user asks
  "which track should I use?" or "what scale is my project?". This is the FIRST skill
  to run before any other planning workflow (brief, PRD, architecture, stories).
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
---

# BMAD Init — Workspace Scaffolder

Set up the planning workspace and choose the TRACK that scales the rest of the BMAD
planning workflows. This is a **planning** skill: it creates folders and seed
documents only. It never writes application code, runs tests, or builds anything.

## What it produces

Under the configured output folder (default `bmad-output/`):

```
bmad-output/
├── config.yaml          # project name, track, output paths, languages
├── decision-log.md      # empty threaded decision log (grows across workflows)
├── project-context.md   # the project "constitution" loaded by every later skill
└── stories/             # empty; future story files land here
```

`config.yaml` is the single source of truth other skills read to find the output
folder and the chosen track.

## The three TRACKS (never numbered Levels)

| Track | Story count | Planning artifacts |
|-------|-------------|--------------------|
| **Quick Flow** | 1–15 stories | tech-spec only |
| **BMad Method** | 10–50+ stories | PRD + Architecture (+ optional UX) |
| **Enterprise** | 30+ stories | PRD + Architecture + Security + DevOps planning |

The track is a **planning-need** decision, not a points/velocity decision. Story
count is a rough signal only; let scope, cross-team coordination, and risk drive the
call. A heuristic may suggest a default — **the user always confirms**.

## Workflow

1. **Check for an existing workspace.** Glob for `bmad-output/config.yaml` (or a
   custom output folder if the user names one). If it exists, read it and ask whether
   to keep, re-run idempotently (safe — existing files are preserved), or change the
   track. Do not clobber a populated decision-log.md or project-context.md.

2. **Gather rough scope signals** in conversation (don't interrogate):
   - One-line project description.
   - Roughly how many distinct pieces of work / stories? (ranges are fine)
   - Multiple teams or just one builder?
   - Hard compliance / security / infra requirements?

3. **Suggest a track.** Run the helper to print the three tracks and a suggested
   default, then state your recommendation and **ask the user to confirm or override**:

   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/skills/bmad-init/scripts/select-track.sh" --stories <N> --teams <one|many> --compliance <yes|no>
   ```

   Heuristic the helper applies (you may reason past it):
   - compliance/infra = yes, or 30+ stories → **Enterprise**
   - 10+ stories, or PRD/architecture clearly needed → **BMad Method**
   - otherwise → **Quick Flow**

4. **Scaffold.** Once the user confirms name + track, run:

   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/skills/bmad-init/scripts/init-project.sh" \
     --name "<project name>" \
     --track <quick-flow|bmad-method|enterprise> \
     --output "bmad-output"
   ```

   The script is **idempotent**: it creates missing folders and seeds any missing
   template files, but never overwrites `decision-log.md` or `project-context.md`
   if they already contain content. It always (re)writes `config.yaml`.

5. **Open the constitution.** Walk the user through filling the first sections of
   `project-context.md` (project goal, primary users, constraints, non-goals). This
   is the document every downstream skill loads, so a few good sentences here pay off.
   Record the track choice and rationale as the first entry in `decision-log.md`.

6. **Hand off.** Recommend the next planning step based on track:
   - Quick Flow → tech-spec, then sprint-planning / story creation.
   - BMad Method → product brief → PRD → architecture.
   - Enterprise → product brief → PRD → architecture (+ security & DevOps planning).

## Three intents

- **Create** — fresh workspace (the common case).
- **Update** — change the track or rename the project: edit `config.yaml` and append
  the change to `decision-log.md` with a date and reason. Do not wipe other files.
- **Validate** — confirm the workspace is well-formed:
  ```bash
  bash "${CLAUDE_PLUGIN_ROOT}/skills/bmad-init/scripts/init-project.sh" --validate --output "bmad-output"
  ```

## Guardrails

- No numbered Levels anywhere — only the three named tracks.
- No story points, velocity, burndown. Delivery is **count-based** (stories
  remaining / completion rate). Story sizing target: small enough for one agent
  session (~2–8h); split anything larger.
- This skill stops at scaffolding. It hands off to other planning skills; it never
  implements, tests, lints, or builds.

See `REFERENCE.md` for the full config schema, track decision detail, and the
project-context section guide.

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-init`. All methodology credit belongs to the BMAD Code Organization.
