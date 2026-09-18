<!--
  STORY CONTEXT OBJECT — bmad-epics-and-stories
  File name: {epic}.{story}.{slug}.story.md  (e.g. 2.1.stripe-integration.story.md)

  This file is SELF-CONTAINED (~8K-token target): a dev agent should need nothing else.
  It is the LAST planning artifact before external dev handoff.

  LOCKED SECTIONS: Acceptance Criteria, Dev Notes, and Testing are LOCKED.
  External dev tools MUST NOT edit them — they are the compiled, cited contract.
  Only this planning skill may change a LOCKED section, via an explicit Update + decision-log entry.

  The external dev tool fills ONLY the "Dev Agent Record" section.
-->

# {{epic}}.{{story}}: {{Story Title}}

**Story ID:** {{epic}}.{{story}}
**Epic:** {{epic}} — {{Epic Title}}
**Slug:** {{slug}}
**Status:** backlog   <!-- lifecycle: backlog -> ready-for-dev -> in-progress -> review -> done -->

> Owned by planning until `ready-for-dev`. Sized to one dev-day (~2-8h). No story points.

## Story

As a **{{user type / role}}**,
I want **{{capability}}**,
so that **{{business value}}**.

## Acceptance Criteria

<!-- LOCKED. Numbered, testable. External dev tools must not edit. -->

1. {{Specific, verifiable outcome.}}
2. {{Specific, verifiable outcome.}}
3. {{Specific, verifiable outcome.}}

<!-- Keep to ~3-7. More than ~7 means the story is too big — split it. -->

## Tasks / Subtasks

<!-- Every task maps to one or more ACs via (AC: #N). A task with no AC mapping is a smell. -->

- [ ] {{Task}} (AC: #1)
  - [ ] {{Subtask}} (AC: #1)
  - [ ] {{Subtask}} (AC: #1)
- [ ] {{Task}} (AC: #2, #3)
- [ ] {{Task}} (AC: #3)

## Dev Notes

<!-- LOCKED. Concrete guidance compiled from the planning docs WITH SOURCE CITATIONS.
     Cite every fact: [Source: prd.md#anchor] / [Source: architecture.md#anchor] /
     [Source: ux-design.md#anchor]. Label your own inferences [Inference]. -->

- {{Architecture/pattern guidance.}} [Source: architecture.md#{{anchor}}]
- {{Data model / API contract detail.}} [Source: architecture.md#{{anchor}}]
- {{Requirement detail this story satisfies.}} [Source: prd.md#{{FR-XX}}]
- {{UI/UX acceptance detail, if relevant.}} [Source: ux-design.md#{{anchor}}]
- {{A judgment call not in any doc.}} [Inference]

## Testing

<!-- LOCKED. STRATEGY ONLY — what to verify and how. NEVER run tests or quote coverage here. -->

- **Approach:** {{unit / integration / e2e mix appropriate to this story}}
- **Key scenarios:** {{the behaviors that prove each AC}}
- **Per-AC verification:** AC #1 → {{how it's checked}}; AC #2 → {{...}}; AC #3 → {{...}}
- **Fixtures / mocks:** {{data, stubs, or doubles the dev tool will need}}
- **Edge cases to cover:** {{error paths, boundaries}}

## Dependency Maps

- **Blocked by:** {{epic.story}} — {{why}} | {{none}}
- **Blocks:** {{epic.story}} — {{why}} | {{none}}
- **External:** {{API / service / library / env this story needs}}

## Owned File/Module Scope

<!-- EXPLICIT list of paths this story may create or modify. This is the lever for
     parallel-conflict-free scheduling: disjoint scopes can run in parallel. Be path-precise,
     prefer files over broad globs, include test paths, and call out shared/contended files.
     Validated by ${CLAUDE_PLUGIN_ROOT}/scripts/scope-conflict-check.sh. -->

- `{{path/to/file_a}}`
- `{{path/to/file_b}}`
- `{{tests/path/**}}`
- Shared/contended (must serialize if another story also lists it): `{{path/to/shared_file}}`

## Learnings from Previous Stories

<!-- Carried forward from completed sibling stories: chosen patterns, gotchas, helpers
     created, naming conventions. Only what is actionable for THIS story. -->

- {{Learning carried forward}} (from {{epic.story}})
- {{...}}

## Dev Agent Record

<!-- LEFT EMPTY by planning. The external dev tool fills this in during implementation. -->

_(empty — to be completed by the external dev tool)_
