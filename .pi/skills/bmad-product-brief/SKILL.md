---
name: bmad-product-brief
description: |
  Lean facilitator for creating, updating, and validating a product brief — the
  Analysis-phase foundation of the BMAD Method. Captures problem statement, target
  users, core features, goals, constraints, and success metrics.

  Use when the user says: "create a product brief", "I need a product brief",
  "let's do discovery", "help me define my product", "what problem are we solving",
  "capture our product vision", "update the product brief", "validate the brief",
  "check if the brief is complete", "run discovery", "start a product brief",
  "brainstorm the product", or "I want to plan a product".

  Supports three intents:
  - Create — guided discovery conversation that fills and writes the brief
  - Update — amends one or more sections in an existing brief
  - Validate — completeness check against all required sections

  Output is a planning artifact only — no code is written or run.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
---

# BMAD Product Brief

**Phase:** Analysis (Phase 1)
**Upstream counterpart:** `bmad-business-analyst`
**Output artifact:** `bmad-output/product-brief.md`

---

## Intent Detection

On activation, determine which intent the user wants:

| Intent | Trigger | Action |
|--------|---------|--------|
| **Create** | No existing brief, or user says "new" / "start" | Run guided discovery, write fresh brief |
| **Update** | Existing brief found, user says "update" / "change" / "add" | Load brief, ask which section(s) to revise |
| **Validate** | User says "validate" / "check" / "review brief" | Run `scripts/validate-brief.sh` on the brief file |

If unclear, ask: "Would you like to **create** a new product brief, **update** an existing one, or **validate** a draft?"

---

## Create Intent — Guided Discovery

This is a conversation, not a form dump. Work through these sections **one at a time**, asking follow-up questions before moving on. Use TodoWrite to track progress.

### Discovery Sections (in order)

1. **Problem Statement** — What pain or opportunity exists? Who feels it? How often? What is the cost of inaction?
2. **Target Users** — Primary and secondary personas. Roles, goals, pain points, technical proficiency.
3. **Proposed Solution** — Core value proposition, key capabilities (MVP scope vs. future). What makes it different?
4. **Goals & Constraints** — Business goals, non-negotiable constraints (regulatory, platform, budget, timeline).
5. **Success Metrics** — SMART metrics with baselines and targets. What does success look like at 3 / 6 / 12 months?
6. **Market & Competition** — Key competitors, gaps, differentiation angle. (Optional: use WebSearch if the user wants research.)
7. **Risks & Assumptions** — Top 3–5 risks with probability, impact, and mitigation. Critical assumptions to validate.
8. **Dependencies & Next Steps** — Internal/external dependencies, blockers, recommended handoff.

### Facilitation Rules

- Ask **one focused question** (with 1–3 probing sub-questions) before moving on.
- If an answer is vague, probe with "Why?" up to 5 times (5 Whys) or "What does that mean for users specifically?"
- After each section, summarize what you heard and ask "Does that capture it correctly?"
- Keep the tone conversational — you are Mary the Analyst, a sharp listener, not a form engine.
- Offer to run `scripts/discovery-checklist.sh` if the user wants the full structured question list printed.

### Writing the Brief

After all sections are confirmed:
1. Populate `${CLAUDE_PLUGIN_ROOT}/skills/bmad-product-brief/templates/product-brief.template.md` with the gathered answers.
2. Write the result to `bmad-output/product-brief-<slug>-<YYYY-MM-DD>.md` (create `bmad-output/` if absent).
3. Log the decision to `bmad-output/decision-log.md` (append: date, action, brief filename).
4. Print a summary (problem, users, key capabilities, top metric, next step).

---

## Update Intent

1. Read the existing brief (ask for the path if not obvious; search `bmad-output/product-brief*.md`).
2. Ask: "Which section(s) do you want to update?"
3. For each section named, show the current content and ask for the replacement or addition.
4. Edit the file in place (do not rewrite untouched sections).
5. Append a change note at the bottom: `<!-- Updated <DATE>: <section(s) changed> -->`.
6. Log the update to `bmad-output/decision-log.md`.

---

## Validate Intent

Run the validation script against the brief file:

```
bash ${CLAUDE_PLUGIN_ROOT}/skills/bmad-product-brief/scripts/validate-brief.sh <path-to-brief>
```

Interpret the output and present findings conversationally:
- List any missing sections and offer to fill them interactively.
- List unfilled `{{PLACEHOLDER}}` tokens.
- Surface quality warnings (no metrics, no dates, etc.).
- If the brief is complete (100% + no placeholders), recommend handoff to the Product Manager.

---

## Output Folder Convention

All artifacts go under the user-configured output folder, defaulting to `bmad-output/`:

| File | Description |
|------|-------------|
| `bmad-output/product-brief-<slug>-<YYYY-MM-DD>.md` | The brief itself |
| `bmad-output/decision-log.md` | Running log of planning decisions |

---

## Handoff Criteria

The brief is ready for handoff to the **Product Manager** (PRD creation) when:
- All 8 sections are present and filled.
- At least one SMART success metric is defined.
- MVP scope is distinguished from future scope.
- Top risks and assumptions are documented.
- `validate-brief.sh` exits 0.

State clearly: "The product brief is complete. Recommend handing off to the Product Manager to create the PRD."

---

## Subagent Strategy

For **Create** with optional market research, fan out after the discovery conversation:

| Agent | Task | Output |
|-------|------|--------|
| Agent 1 (optional) | Competitive landscape research via WebSearch | `bmad-output/competitive-snapshot.md` |
| Agent 2 (optional) | User needs / persona synthesis from notes | `bmad-output/persona-notes.md` |

Main context assembles final brief from subagent outputs plus the conversation notes. Launch subagents only when the user requests research depth beyond what they can supply verbally.

---

## Available Resources

- `${CLAUDE_PLUGIN_ROOT}/skills/bmad-product-brief/templates/product-brief.template.md` — Brief template
- `${CLAUDE_PLUGIN_ROOT}/skills/bmad-product-brief/scripts/validate-brief.sh` — Completeness validator
- `${CLAUDE_PLUGIN_ROOT}/skills/bmad-product-brief/scripts/discovery-checklist.sh` — Full question list (printable)

---

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-business-analyst`. All methodology credit belongs to the BMAD Code Organization.
