---
name: bmad-brainstorm
description: |
  Facilitates structured ideation sessions using proven brainstorming techniques
  (SCAMPER, SWOT, 5 Whys, Mind Mapping, Six Thinking Hats, Reverse Brainstorming,
  Starbursting, Brainwriting). Produces a brainstorming-report.md of organized ideas
  and actionable insights. Operates in three intents: Create (new session), Update
  (add techniques or deepen coverage), Validate (confirm insights align with project goals).

  Use when the user says: "brainstorm", "ideate", "generate ideas", "explore options",
  "SCAMPER", "SWOT analysis", "mind map", "Six Thinking Hats", "5 Whys", "creative
  session", "what if we", "let's explore", "think through possibilities", "find
  alternatives", or "problem-solve".

  This skill PLANS only — it never writes application code or runs tests.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, TodoWrite
---

# BMAD Brainstorm

Structured ideation harness for the BMAD planning lifecycle. Produces a
`brainstorming-report.md` of organized ideas and insights ready to feed downstream
planning skills (product-brief, PRD, architecture).

## Three Intents

Ask the user which intent applies — or infer from context:

| Intent | When to use |
|--------|-------------|
| **Create** | New brainstorming session on a topic or problem |
| **Update** | Add techniques, deepen coverage, or incorporate new constraints |
| **Validate** | Confirm generated insights align with project goals or decision-log |

## Technique Menu

| Technique | Best For | Approx Time |
|-----------|----------|-------------|
| **5 Whys** | Root cause analysis | 10-15 min |
| **SCAMPER** | Feature ideation & creative variations | 20-30 min |
| **Mind Mapping** | Idea organization & hierarchy | 15-20 min |
| **Reverse Brainstorming** | Risk and failure-mode identification | 15-20 min |
| **Six Thinking Hats** | Multi-perspective evaluation | 30-45 min |
| **Starbursting** | Question exploration (Who/What/When/Where/Why/How) | 20-30 min |
| **SWOT Analysis** | Strategic positioning | 30-45 min |
| **Brainwriting** | Silent parallel idea generation | 15-20 min |

### Technique Selection Guide

- **Exploring a problem?** → 5 Whys, then Starbursting
- **Generating features or solutions?** → SCAMPER, Mind Mapping
- **Assessing risk or failure modes?** → Reverse Brainstorming, Six Thinking Hats (Black Hat)
- **Strategic planning or positioning?** → SWOT, Six Thinking Hats (full cycle)
- **Need parallel idea volume?** → Brainwriting

## Session Workflow

Use TodoWrite to track each step.

1. **Gather context** — Ask: topic/problem, relevant constraints, which BMAD track is active
2. **Read project context** — Load `bmad-output/project-context.md` and `bmad-output/decision-log.md` if present
3. **Select techniques** — Choose 2-4 complementary techniques; confirm with user
4. **Execute sessions** — Apply each technique systematically (diverge first, do not filter)
5. **Organize ideas** — Categorize all generated ideas; label Impact (H/M/L) and Feasibility (H/M/L)
6. **Extract insights** — Identify top 3-5 actionable insights across all techniques
7. **Identify risks** — Capture risks surfaced during ideation
8. **Produce report** — Fill `templates/brainstorm-session.template.md`; save to output folder
9. **Update decision-log** — Record key decisions or directions confirmed during the session
10. **Recommend next steps** — Which BMAD skill to engage next

## Script Utilities

Generate SCAMPER prompts for a specific topic:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/bmad-brainstorm/scripts/scamper-prompts.sh" "your topic"
```

Generate a SWOT analysis scaffold:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/bmad-brainstorm/scripts/swot-template.sh" "your subject" > bmad-output/swot-draft.md
```

## Output Artifacts

All artifacts go under the user-configured output folder (default `bmad-output/`).

| File | Description |
|------|-------------|
| `bmad-output/brainstorming-report.md` | Primary output — organized ideas + insights |
| `bmad-output/decision-log.md` | Append key decisions made during session |
| `bmad-output/swot-draft.md` | Optional SWOT scaffold (from script) |

Use `templates/brainstorm-session.template.md` for the report structure.

## Subagent Strategy

For sessions covering multiple techniques in parallel, fan out one agent per technique.

**Pattern:** Fan-Out Ideation  
**Agents:** 2-6 parallel (one per selected technique)

| Agent | Task | Output |
|-------|------|--------|
| Agent 1 | Apply SCAMPER to generate feature variations | `bmad-output/brainstorm-scamper.md` |
| Agent 2 | Build Mind Map to organize ideas hierarchically | `bmad-output/brainstorm-mindmap.md` |
| Agent 3 | Reverse Brainstorming — identify failure modes | `bmad-output/brainstorm-risks.md` |
| Agent 4 | Six Thinking Hats — multi-perspective analysis | `bmad-output/brainstorm-hats.md` |
| Agent 5 | Starbursting — Who/What/When/Where/Why/How | `bmad-output/brainstorm-questions.md` |
| Agent 6 | SWOT Analysis — strategic positioning | `bmad-output/brainstorm-swot.md` |

**Coordination:**

1. Write brainstorming objective to `bmad-output/brainstorm-objective.md`
2. Select 2-6 techniques; launch one agent per technique with context path
3. Each agent generates 10-20 ideas/insights using its assigned technique
4. Main context synthesizes all outputs into `bmad-output/brainstorming-report.md`
5. Extract top 3-5 actionable insights; append decisions to `bmad-output/decision-log.md`

**Example subagent prompt:**

```
Task: Apply SCAMPER technique
Context: Read bmad-output/brainstorm-objective.md for topic and constraints
Output: Write 15-20 creative variations to bmad-output/brainstorm-scamper.md

Apply each SCAMPER letter systematically. Generate 2-4 ideas per letter.
For each idea: one-sentence description, potential value, innovation level
(incremental / breakthrough). Conclude with your top 3 most promising ideas.
Do not implement anything — ideation output only.
```

## BMAD Fidelity Notes

- This skill feeds Phase 1 (Analysis) and Phase 2 (Planning). Insights flow into
  the product-brief and PRD skills.
- Insights that become commitments must be logged in `bmad-output/decision-log.md`.
- This skill does not produce stories. It produces raw insight material that
  upstream skills (product-manager, system-architect) refine into epics and stories.
- Scale-adaptive tracks apply: Quick Flow sessions may use 1-2 techniques; Enterprise
  sessions should apply 4-6 for comprehensive coverage.

## Guiding Principles

1. **Diverge before converging** — generate volume first; filter later
2. **Structured over freeform** — every technique has a defined process; follow it
3. **Document everything** — capture all ideas; even "bad" ones can spark breakthroughs
4. **Quantify insights** — numbers make insights actionable (market size, feature counts)
5. **Cross-pollinate** — consider how other industries or domains solve the same problem
6. **No implementation** — this skill plans; it never writes code or runs tests

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-brainstorming`. All methodology credit belongs to the BMAD Code Organization.
