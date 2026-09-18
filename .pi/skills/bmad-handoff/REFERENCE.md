# BMAD Handoff — Reference

This document describes the `handoff-manifest.json` schema in detail and provides
adapter notes for two well-known runner patterns. The manifest itself is dev-tool
agnostic; these notes exist to reduce integration friction without creating a hard
dependency on any specific runner.

---

## 1. Manifest Schema Narrative

### Top-level object

```json
{
  "schemaVersion": "1.0",
  "generatedAt": "2026-06-19T14:30:00Z",
  "projectName": "my-project",
  "outputFolder": "bmad-output",
  "stories": [ ... ]
}
```

| Field | Description |
|---|---|
| `schemaVersion` | Semver string. Tools should reject or warn on unknown major versions. Current stable: `"1.0"`. |
| `generatedAt` | ISO-8601 UTC timestamp of when the manifest was written. |
| `projectName` | Human-readable project name. Sourced from `project-context.md` or user input. |
| `outputFolder` | The relative path (from project root) where story files live. Useful for tools that need to resolve `storyFilePath`. |
| `stories` | Array of story objects, sorted by `wave` ascending then `id` ascending. |

### Story object

```json
{
  "id": "2.1.stripe-integration",
  "storyFilePath": "bmad-output/stories/2.1.stripe-integration.story.md",
  "status": "ready-for-dev",
  "epic": "2",
  "storyNumber": "1",
  "title": "Stripe Payment Integration — Checkout Flow",
  "ownedScope": [
    "src/payments/stripe-client.ts",
    "src/payments/checkout-service.ts",
    "src/api/routes/checkout.ts",
    "tests/payments/"
  ],
  "wave": 1,
  "parallelSet": null,
  "dependencies": [],
  "acceptanceCriteriaSummary": [
    "Given a valid cart, when the user clicks Pay, then Stripe checkout session is created within 2 s",
    "Given a failed payment, when Stripe webhook fires, then order status is set to payment-failed",
    "Given a successful payment, when webhook fires, then order is confirmed and email is sent"
  ],
  "lockedSectionsNote": "Sections Acceptance Criteria, Dev Notes, and Testing are LOCKED. External dev tools must not edit them. Populate only the Dev Agent Record section.",
  "devAgentRecord": null
}
```

#### Field-by-field

**`id`** (string, required)
Unique identifier within this manifest. Derived from the story filename stem
(`{epic}.{story}.{slug}`) or from the story file's own ID heading. Must be stable
across manifest regenerations for the same story.

**`storyFilePath`** (string, required)
Path to the `.story.md` file, relative to the project root. Runners should read
this file for the full story context before starting implementation.

**`status`** (string, required)
Always `"ready-for-dev"` in this manifest. This field is included so runners can
sanity-check without re-reading the story file.

**`epic`** (string, required)
The epic identifier extracted from the filename. E.g., `"2"` from
`2.1.stripe-integration.story.md`. Useful for grouping and display.

**`storyNumber`** (string, required)
The story sequence number within the epic. E.g., `"1"` from the same example.

**`title`** (string, required)
Human-readable title taken from the story file's first H1 or the `## Story` section.

**`ownedScope`** (array of strings, required)
Verbatim list of file and directory paths that this story is permitted to modify.
This list is the primary mechanism for parallel-conflict safety: a runner must
not schedule two stories that share any path in their `ownedScope` in the same
parallel slot.

Empty array is valid for stories that only add new files (conflict risk is lower,
but the runner must still handle it).

**`wave`** (integer, required)
Execution wave number, minimum 1. Wave 1 stories have no dependencies and may
start immediately. Wave N stories may start only after all wave N-1 dependencies
are complete.

If the story file includes explicit wave annotations (e.g., in the Dependency Maps
section), those values take precedence. Otherwise, the skill computes wave order
from the dependency graph.

**`parallelSet`** (string or null)
Optional label grouping stories that were explicitly planned to run concurrently
(e.g., `"wave-2-auth-and-payments"`). Null when not annotated. Runners may use
this for display or scheduling hints.

**`dependencies`** (array of strings, required)
List of story `id` values that must be in `done` status before this story may
start. Empty array means no dependencies.

**`acceptanceCriteriaSummary`** (array of strings, required)
The first three acceptance criteria from the story file, each truncated to 120
characters. This allows runners to display a quick preview without reading the
full story file. The authoritative criteria live in the locked `## Acceptance
Criteria` section of the story file.

**`lockedSectionsNote`** (string, required)
Always: `"Sections Acceptance Criteria, Dev Notes, and Testing are LOCKED.
External dev tools must not edit them. Populate only the Dev Agent Record section."`

This field exists so runners can surface the instruction programmatically rather
than requiring the dev agent to have read the story file header.

**`devAgentRecord`** (null at emit time)
Reserved for the external dev tool to populate with implementation metadata
(e.g., branch name, commit SHA, completion timestamp, notes). The planning plugin
always emits `null` here. Runners must not error if this field is null.

---

## 2. Schema Versioning Contract

The `schemaVersion` field follows semantic versioning conventions:

- **Patch** (e.g., `1.0` → `1.0.1`): Non-breaking additions (new optional fields).
- **Minor** (e.g., `1.0` → `1.1`): New optional features; backwards compatible.
- **Major** (e.g., `1.0` → `2.0`): Breaking change (field removed or renamed).

Runners should:
1. Read `schemaVersion` before processing.
2. Reject manifests with a higher major version than they understand.
3. Warn (not fail) on a higher minor version.
4. Accept any patch version within the same minor.

---

## 3. Adapter Notes

These notes describe how two common runner patterns can consume the manifest.
They are informational only. Neither pattern is required or depended on by this
plugin.

### 3.1 Git-Worktree Parallel Development

**Pattern overview:** Each ready-for-dev story is checked out into a separate git
worktree so multiple dev agents can work concurrently without filesystem conflicts.
Stories within the same wave are eligible to run in parallel; each subsequent wave
starts only after all stories in the previous wave are complete.

**How to read the manifest:**

1. Parse `stories`, group by `wave`.
2. For each wave (ascending), collect stories in that wave.
3. Conflict-check within the wave: two stories in the same wave must not share
   any entry in their `ownedScope` arrays. If a conflict is found, promote the
   lower-priority story to the next wave.
4. For each conflict-free story in the wave, create a worktree:
   ```
   git worktree add .worktrees/<story-id> -b dev/<story-id>
   ```
5. Launch a dev agent pointed at `storyFilePath` within that worktree.
6. When the agent completes, merge or PR the branch, then remove the worktree.
7. Advance to the next wave.

**Key fields used:** `id`, `storyFilePath`, `ownedScope`, `wave`, `dependencies`.

**What to populate in `devAgentRecord`:** branch name, worktree path, merge commit
SHA, completion timestamp.

**Conflict detection pseudocode:**
```python
def check_wave_conflicts(stories_in_wave):
    seen_paths = {}
    for story in stories_in_wave:
        for path in story["ownedScope"]:
            if path in seen_paths:
                yield Conflict(story["id"], seen_paths[path], path)
            seen_paths[path] = story["id"]
```

---

### 3.2 Autonomous Dependency-Graph Orchestrator

**Pattern overview:** An orchestrator reads the full dependency graph from the
manifest and schedules stories as soon as their dependencies are satisfied, without
fixed waves. This allows maximum parallelism and handles partial failures gracefully.

**How to read the manifest:**

1. Build a directed acyclic graph (DAG): nodes = story `id`, edges = `dependencies`.
2. Validate the DAG is acyclic (cycle = planning error; surface to the user).
3. Use a topological sort / ready-queue approach:
   - Initially enqueue all stories with empty `dependencies`.
   - When a story completes successfully, remove it from the pending set; any
     story whose entire dependency set is now in the completed set becomes ready.
   - Apply `ownedScope` conflict checks before starting concurrent stories
     (same logic as the worktree adapter above).
4. On failure: mark the failed story; transitively mark all downstream dependents
   as `blocked`. Do not cancel stories that have no path through the failed story.
5. Write completion metadata back into `devAgentRecord` for each finished story.

**Key fields used:** `id`, `storyFilePath`, `dependencies`, `ownedScope`,
`acceptanceCriteriaSummary`, `devAgentRecord`.

**Suggested `devAgentRecord` shape for this runner:**
```json
{
  "startedAt": "2026-06-19T15:00:00Z",
  "completedAt": "2026-06-19T16:42:00Z",
  "agentId": "agent-3",
  "outcome": "success",
  "notes": "Added 3 integration tests not listed in ACs; see PR #42"
}
```

**Re-entrancy:** The orchestrator may re-read the manifest at any time. The
`schemaVersion` and `generatedAt` fields allow it to detect a refresh and
re-plan remaining work without disturbing already-completed stories.

---

## 4. Frequently Asked Questions

**Can I add custom fields to the manifest?**
Yes — add them at the story object level using a namespace prefix (e.g.,
`"x-myrunner-priority": 3`). The planning plugin will ignore unknown fields on
the next refresh and will not strip them if the manifest already exists and is
being appended to.

**What if a story has no `## Owned File/Module Scope` section?**
The skill emits `"ownedScope": []` and logs a warning. The runner should treat an
empty scope as "unknown" rather than "no files touched" and may refuse to schedule
that story in parallel with others until a human reviews it.

**What if the manifest already exists?**
The skill overwrites it. If your runner needs to preserve `devAgentRecord` values
from completed stories, read the existing manifest first, merge completed records
into the new output, and write the merged result. The skill does not do this merge
— it always re-emits clean `null` for `devAgentRecord`.

**Can the manifest represent stories from multiple sprints/waves?**
Yes. The `wave` field handles ordering; there is no sprint-level grouping in the
schema. If your runner needs sprint-level grouping, add an `"x-sprint"` field or
build a separate index.

**Is this manifest the only handoff mechanism?**
No — it is the canonical artifact this plugin produces, but nothing prevents a
runner from also reading the story `.md` files directly for full context. The
manifest is designed as a lightweight index; the story file is the authoritative
context object.
