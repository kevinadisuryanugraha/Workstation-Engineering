# BMAD Epics & Stories — Reference

Detailed mechanics for sharding planning docs into an executable, parallel-safe backlog.
The SKILL.md body is the operational summary; this file is the depth.

---

## 1. The Sharding Method

**Sharding** = decomposing approved planning prose (`prd.md` + `architecture.md`) into
self-contained, executable units. Two levels of output:

1. **`epics.md`** — the map. Each epic is a coherent, shippable slice of value with an
   ordered list of its stories and cross-epic dependencies. It is an index, not a context
   object — keep it thin.
2. **`{epic}.{story}.{slug}.story.md`** — the leaf. Each is a **compiled context object**: a
   dev agent reading only this file must have everything needed. ~8K tokens is the working
   target; if you can't fit it, the story is probably too big — split it.

### Sharding procedure

1. **Inventory requirements.** Pull every functional requirement (FR) and relevant
   non-functional requirement (NFR) from `prd.md`. Note the architecture component each maps to.
2. **Cluster into epics.** Group requirements that deliver one user-visible capability or one
   cohesive system slice. An epic should be independently demoable. Aim for the track:
   Quick Flow may have 1-3 epics; BMad Method 3-8; Enterprise more, including Security and
   DevOps streams.
3. **Order epics** by dependency and value — foundational/enabling epics first.
4. **Within each epic, enumerate stories.** Walk the epic's requirements and slice them along
   natural seams (a single endpoint, a single screen, one migration, one integration). Each
   slice becomes a story sized to one dev-day (Section 2).
5. **Compile each story** into a context object (Section 3), pulling exact citations from the
   source docs rather than paraphrasing from memory.
6. **Declare Owned Scope** per story (Section 4) and run the shared conflict checker.

### Citation discipline (Dev Notes)

Every claim in Dev Notes that originates from a planning doc MUST carry a source tag so the
dev agent can trust it without re-deriving:

- `[Source: prd.md#FR-12]`
- `[Source: architecture.md#payment-service]`
- `[Source: ux-design.md#checkout-flow]`
- `[Source: epics.md#epic-2]`

If a Dev Note is your own inference (not in any doc), label it `[Inference]` so it is
distinguishable from cited fact. Never invent an architecture detail and present it as cited.

---

## 2. Sizing Rule — Count-Based, No Points

A story must be **small enough for one agent session: ~2-8 hours, one dev-day maximum.**

There are **NO story points, NO Fibonacci, NO velocity, NO burndown.** Those concepts are
deliberately removed. Progress is tracked purely by COUNT:

```
remaining = stories with status in {backlog, ready-for-dev, in-progress, review}
done      = stories with status: done
completion rate = done / total   (a simple ratio, reported as needed)
```

### Split heuristics — split a story when ANY of these is true

- It would touch more than ~3-5 files/modules of genuinely new logic.
- It spans two layers that could ship independently (e.g. API endpoint AND its UI screen).
- It has more than ~7 acceptance criteria.
- It bundles a schema migration with feature logic — split the migration out first.
- It mixes "happy path" with a large error/edge-case surface — split the hardening out.
- You cannot write its Dev Notes in roughly 8K tokens without hand-waving.

### How to split

- **By layer:** data model → API → UI as separate stories with explicit Blocked-by links.
- **By capability:** create vs. read vs. update vs. delete as separate stories.
- **By path:** happy path first, then a follow-up story for validation/edge cases.
- **By integration:** stub/contract first, real integration second.

When you split, renumber within the epic and update Dependency Maps and `epics.md`.

---

## 3. The Context Object Contract

Required sections, in order (see `templates/story.template.md`):

| Section | Content | Locked? |
|---------|---------|---------|
| Status | one of the lifecycle values | no |
| Story | as-a / I-want / so-that | no |
| Acceptance Criteria | numbered, testable outcomes | **LOCKED** |
| Tasks / Subtasks | checkboxes, each `(AC: #N)` | no |
| Dev Notes | cited implementation guidance | **LOCKED** |
| Testing | strategy only — types, fixtures, what to verify | **LOCKED** |
| Dependency Maps | Blocked-by / Blocks story IDs | no |
| Owned File/Module Scope | explicit path list (Section 4) | no |
| Learnings from Previous Stories | carried-forward notes | no |
| Dev Agent Record | EMPTY at handoff | no |

**LOCKED** means the external dev tool must not edit AC, Dev Notes, or Testing. They are the
compiled, cited contract. If planning genuinely needs to change one, that is an **Update**
intent in this skill: confirm with the user and log it in `decision-log.md`.

**Testing is strategy, not execution.** Describe *what* to test (unit/integration/e2e targets,
key scenarios, fixtures/mocks, the acceptance check per AC). Never run a suite, never quote
coverage numbers — that belongs to the external dev tool.

**Tasks map to ACs.** Every task or subtask ends with `(AC: #N)` (or several) so the dev agent
can trace work to acceptance. A task with no AC mapping is a smell — either add the AC or drop
the task.

---

## 4. Scope-Declaration Discipline (the parallel-safety lever)

**Owned File/Module Scope** is the single most important field for orchestration. It is the
explicit list of paths a story is permitted to create or modify. Two stories whose Owned Scope
do not intersect can be scheduled to run **in parallel without merge conflicts**; two that
overlap must be serialized (linked via Dependency Maps) or re-sliced.

### Rules for declaring scope

1. **Be explicit and path-based.** List files or tight directory globs, e.g.
   `src/payments/stripe_client.py`, `src/payments/__init__.py`, `tests/payments/**`.
2. **Prefer files over broad directories.** `src/api/routes/checkout.ts` beats `src/api/**`.
   Broad globs manufacture false conflicts and kill parallelism.
3. **Include test paths** the story owns — they are real files that can collide.
4. **Call out shared/contended files** (e.g. a central `routes.ts`, `schema.prisma`, a DI
   container). If two stories must both edit a shared file, that is a conflict: either make one
   Blocked-by the other, or extract the shared edit into its own tiny enabling story.
5. **No wildcards over the whole repo.** A story that claims `src/**` owns everything and can
   never run in parallel — re-slice it.

### Running the shared checker

The overlap checker is authored once for the whole plugin and lives at
`${CLAUDE_PLUGIN_ROOT}/scripts/scope-conflict-check.sh`. **Do not copy or reimplement it.**

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/scope-conflict-check.sh bmad-output/stories/
```

It reads the Owned Scope block from each `*.story.md`, computes pairwise path intersections,
and reports any pair that shares a path. Workflow:

- **Clean report** → the stories are parallel-safe; they may be marked `ready-for-dev`.
- **Conflicts reported** → for each conflicting pair, either (a) add a Dependency Map
  Blocked-by link so they serialize, or (b) re-slice so scopes are disjoint, or (c) extract the
  shared file into a small enabling story everything depends on. Re-run until clean (or until
  every remaining overlap is intentionally serialized).

A story is only truly `ready-for-dev` once its scope is declared and the checker is satisfied.

---

## 5. Learnings from Previous Stories

When compiling story N in an epic, scan completed sibling stories (`status: done`, and the
`Dev Agent Record` the external tool filled in on returned stories) for reusable facts:
chosen patterns, gotchas, helper modules created, naming conventions settled. Summarize the
relevant ones into the new story's **Learnings** section so each story compounds context
rather than rediscovering it. Keep it to what is actionable for THIS story.

---

## 6. epics.md Structure

A thin index, not a context object. Per epic: ID + title, goal, in-scope requirement IDs
(cited to `prd.md`), ordered story list (`{epic}.{story}` + slug + one-line intent), and
cross-epic Blocked-by/Blocks links. Update it whenever stories are added, split, or reordered
so it stays the authoritative map. See `templates/epic.template.md`.
