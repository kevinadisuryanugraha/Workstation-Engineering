---
name: {{skill_name}}
description: |
  {{description_one_paragraph_under_1024_chars}}
  Use when the user says "{{trigger_phrase_1}}", "{{trigger_phrase_2}}",
  "{{trigger_phrase_3}}", or "{{trigger_phrase_4}}".
  This skill PLANS and ORCHESTRATES only — it never writes application code,
  runs tests, lints, checks coverage, or builds.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
---

# BMAD {{Skill Display Name}}

**Function:** {{what_planning_orchestration_problem_this_solves}}

## Scope (PLAN, never build)

This skill produces planning artifacts only. It does NOT write application code,
run tests, lint, check coverage, or execute builds. The last artifact it produces
is a ready-for-dev story file or a handoff manifest. Implementation is handed to
EXTERNAL dev tools/plugins.

## Inputs

1. `{{required_input_1}}` — {{what_it_provides}}
2. `project-context.md` — the project "constitution". Load it; respect it.
3. `decision-log.md` — prior cross-workflow decisions. Read before deciding; append new entries after.
4. (Optional) `{{optional_input}}` — {{when_to_use_it}}

Default output folder: `bmad-output/` (honor the user-configured folder).
Write to: `bmad-output/{{output_filename}}.md`

## Three intents

Always clarify which intent applies if ambiguous; never blindly one-shot.

### Create

1. Read `{{primary_input}}`; extract {{what_to_extract}} (use TodoWrite to track sections).
2. {{step_2}}
3. {{step_3}}
4. Fill `${CLAUDE_PLUGIN_ROOT}/skills/{{skill_name}}/templates/{{output_template}}.template.md`
   → `bmad-output/{{output_filename}}.md`
5. Append a one-line decision summary to `decision-log.md`.
6. Validate (see below).

### Update

1. Read existing `bmad-output/{{output_filename}}.md` and the changed inputs.
2. Diff: what is new or changed? What prior decisions are now contradicted?
3. Extend the document; do not silently overwrite prior decisions.
4. Re-validate.

### Validate

1. Run the validator:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/skills/{{skill_name}}/scripts/validate-output.sh \
     bmad-output/{{output_filename}}.md
   ```
2. Report gaps as a checklist. Fix the plan, not the code.

## Workflow

{{describe_main_workflow_steps_here}}

## Subagent strategy

| Agent | Task | Output |
|-------|------|--------|
| Agent 1 | {{agent_1_task}} | `bmad-output/{{agent_1_output}}` |
| Agent 2 | {{agent_2_task}} | `bmad-output/{{agent_2_output}}` |

Coordination: {{fan_out_fan_in_approach}}

## Reference

Detailed patterns, examples, and checklists live in [REFERENCE.md](REFERENCE.md).

## Notes for LLMs

- Use TodoWrite to track multi-step workflow progress.
- Never implement code; produce planning documents and hand off.
- Use `${CLAUDE_PLUGIN_ROOT}` for all internal paths — never hardcode absolute paths.
- Output artifacts go under `bmad-output/` by default.
- {{skill_specific_note_1}}
- {{skill_specific_note_2}}

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-{{upstream_counterpart}}`. All methodology credit belongs to the BMAD Code Organization.
