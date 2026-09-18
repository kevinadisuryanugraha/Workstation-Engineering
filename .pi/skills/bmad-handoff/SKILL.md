---
name: bmad-handoff
description: |
  Emits a dev-tool-agnostic handoff manifest from ready-for-dev stories so an external
  dev plugin or runner can pick up and execute the work.

  Use when the user says "generate a handoff", "create handoff manifest", "export stories
  for dev", "hand off to dev tool", "produce handoff manifest", "ready to hand off",
  "prepare handoff for external tool", "export ready-for-dev stories", or "create the
  handoff package". Also trigger when the user asks "what stories are ready for dev?" and
  wants an exportable artifact rather than a status report.

  Produces: handoff-manifest.json listing all ready-for-dev stories with id, story file
  path, status, owned file/module scope, wave/parallel_set, dependencies,
  acceptance-criteria summary, locked-sections note, and a schemaVersion field.
  See REFERENCE.md (bundled) for the full manifest schema and adapter notes for
  git-worktree parallel development and autonomous dependency-graph orchestrators.
allowed-tools: Read, Write, Edit, Glob, Grep, TodoWrite
---

# BMAD Handoff

**Purpose:** Scan the planning output folder for all stories at status `ready-for-dev`,
compile them into a single `handoff-manifest.json`, and leave it where any downstream
dev tool can read it — without coupling to any specific runner.

This is the last artifact the planning plugin produces. What happens next is owned by
the external dev tool, not by this skill.

## When to Run

Run this skill after the story-writing phase is complete and you (or the user) have
confirmed that at least one story carries status `ready-for-dev`. The manifest is a
point-in-time snapshot; re-run the skill to refresh it.

## Workflow

Use TodoWrite to track progress through these steps.

### 1. Locate the output folder

Look for `bmad-output/project-context.md` (the default output folder) or ask the
user for the output folder. Default: `bmad-output/`.

### 2. Discover story files

Glob for `**/{epic}.{story}.*.story.md` under the output folder.
Accept alternative flat layouts (`stories/*.story.md`) if the glob turns up nothing.

### 3. Filter to ready-for-dev

Read the `**Status:**` header field of each story file (in the story header block, not a
`## Status` heading). Include only stories whose status value is exactly `ready-for-dev`.

If none are found, report which statuses were seen and stop — do not produce an
empty manifest.

### 4. Extract per-story fields

For each qualifying story file, extract:

| Field | Source in story file |
|---|---|
| `id` | Filename stem or `## Story` heading ID |
| `storyFilePath` | Relative path from project root |
| `status` | `**Status:**` header field value |
| `epic` | First segment of filename, e.g. `"2"` in `2.1.stripe.story.md` |
| `storyNumber` | Second segment, e.g. `"1"` |
| `title` | First H1 or `## Story` heading text |
| `ownedScope` | `## Owned File/Module Scope` — list every path verbatim |
| `wave` | `## Dependency Maps` → wave/parallel_set annotation (integer or null) |
| `parallelSet` | Same section — parallel set label if present (string or null) |
| `dependencies` | `## Dependency Maps` → blocked-by story IDs (array, may be empty) |
| `acceptanceCriteriaSummary` | First 3 AC items from `## Acceptance Criteria`, each ≤120 chars |
| `lockedSectionsNote` | Static string — see schema |
| `devAgentRecord` | Static null — placeholder for the dev tool to populate |

### 5. Compute wave order

If stories do not already carry explicit wave annotations:
- Stories with empty `dependencies` arrays are wave 1.
- A story whose every dependency is in wave N or lower is wave N+1.
- Add the computed `wave` value; leave `parallelSet` null when not annotated.

### 6. Write the manifest

Write to `{outputFolder}/handoff-manifest.json`.

Use the schema from
`${CLAUDE_PLUGIN_ROOT}/skills/bmad-handoff/templates/handoff-manifest.schema.json`
as the structural contract. Populate `schemaVersion: "1.0"`.

Sort stories by `wave` ascending, then by `id` ascending within each wave.

### 7. Report to the user

Print a compact summary:

```
Handoff manifest written → bmad-output/handoff-manifest.json
  schemaVersion : 1.0
  stories       : <N> ready-for-dev
  waves         : <W>  (wave 1 has <X> stories, can start immediately)
  output path   : bmad-output/handoff-manifest.json
```

If any story was missing required sections (e.g. no `## Owned File/Module Scope`),
list those as warnings — do not silently omit or fabricate data.

## Manifest Field Definitions (Quick Reference)

See REFERENCE.md for the full schema narrative and adapter notes.

| Field | Type | Required | Notes |
|---|---|---|---|
| `schemaVersion` | string | yes | Semver string; current = `"1.0"` |
| `generatedAt` | string | yes | ISO-8601 UTC timestamp |
| `projectName` | string | yes | From project-context.md or user input |
| `outputFolder` | string | yes | Relative path used to find stories |
| `stories` | array | yes | One object per ready-for-dev story |
| `stories[].id` | string | yes | Unique story identifier |
| `stories[].storyFilePath` | string | yes | Relative path to the .story.md file |
| `stories[].status` | string | yes | Always `"ready-for-dev"` in this manifest |
| `stories[].epic` | string | yes | Epic identifier |
| `stories[].storyNumber` | string | yes | Story number within epic |
| `stories[].title` | string | yes | Human-readable story title |
| `stories[].ownedScope` | array | yes | File/module paths this story may modify |
| `stories[].wave` | integer | yes | Execution wave (1 = no dependencies) |
| `stories[].parallelSet` | string\|null | no | Label if explicitly grouped |
| `stories[].dependencies` | array | yes | Story IDs that must complete first |
| `stories[].acceptanceCriteriaSummary` | array | yes | First 3 AC items, ≤120 chars each |
| `stories[].lockedSectionsNote` | string | yes | Instruction to dev tools |
| `stories[].devAgentRecord` | null | yes | Dev tool populates; always null at emit time |

`lockedSectionsNote` is always the string:
> "Sections Acceptance Criteria, Dev Notes, and Testing are LOCKED. External dev tools
> must not edit them. Populate only the Dev Agent Record section."

## Subagent Strategy

For small backlogs (≤15 stories), this skill runs single-threaded — the extraction
loop is fast and context fits in one session.

For large backlogs (16+ stories), fan out story extraction in parallel:

| Agent | Task |
|---|---|
| Agent 1…N | Read story files in their assigned slice; extract fields; return JSON fragment |
| Coordinator | Merge fragments; compute wave order; write manifest |

Each agent receives the list of file paths for its slice plus the field extraction
table above. It returns a JSON array of story objects (no wave field yet).
The coordinator merges, computes waves, sorts, and writes the manifest.

## Key Guidelines

1. Never fabricate field values — if a field is missing from a story file, emit `null`
   and add a warning to the summary.
2. Do not modify story files — this skill is read-only with respect to story content.
3. `ownedScope` is critical for parallel-conflict safety; never collapse or summarize it.
4. This manifest is a STABLE versioned interface. Increment `schemaVersion` (as a
   separate schema revision, not within this run) before adding or removing fields.
5. Do not filter out stories based on anything other than `ready-for-dev` status —
   dependency resolution is the dev tool's job.
6. If the user asks to "re-run" or "refresh" the manifest, overwrite the existing file.

---

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-handoff`. All methodology credit belongs to the BMAD Code Organization.
