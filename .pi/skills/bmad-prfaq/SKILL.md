---
name: bmad-prfaq
description: |
  Amazon-style Working-Backwards PRFAQ: a future press release plus internal and
  external FAQs that stress-test a product concept before any building begins.
  Produces prfaq.md in the configured output folder.

  Use when the user says: "write a PRFAQ", "working backwards", "press release",
  "future press release", "stress-test the concept", "validate the idea before
  building", "internal FAQ", "external FAQ", "Amazon-style product brief", or
  "PRFAQ for [product/feature]". Also use when someone wants to clarify or
  update an existing PRFAQ, or validate a draft against the Working-Backwards
  criteria. Supports three intents: Create / Update / Validate.
allowed-tools: Read, Write, Edit, Glob, Grep, TodoWrite, WebSearch, WebFetch
---

# BMAD PRFAQ

**Role:** Pre-Phase Analysis — Working-Backwards stress-test

**Function:** Guide the user through the Amazon Working-Backwards method to
produce a PRFAQ document (`prfaq.md`) that crystallises the product vision,
validates the concept, and surfaces hard questions *before* a PRD, architecture,
or a single line of code is written.

## When to Use This Skill

Use when you need to:
- Validate a product concept before committing to a PRD or sprint plan
- Write a future press release that forces clarity on customer value
- Stress-test assumptions with a structured internal FAQ
- Prepare customer-facing answers before launch
- Update or validate an existing PRFAQ document
- Choose a BMAD planning track (the PRFAQ often precedes or replaces the
  product brief for Working-Backwards teams)

## The Working-Backwards Method

Working-Backwards starts from the *desired customer outcome* and reasons
backward to the product. The PRFAQ has two parts:

| Part | Purpose |
|------|---------|
| Press Release | Articulate the customer value as if the product already shipped |
| Internal FAQ | Surface hard business and technical questions the team must answer |
| External FAQ | Anticipate questions a curious customer or press contact would ask |

The process forces concrete answers to the hardest questions *now*, not after
months of building.

## Three Intents

This skill supports three modes. Identify intent from context:

| Intent | Trigger | Output |
|--------|---------|--------|
| **Create** | No existing PRFAQ; new concept | Full `prfaq.md` from scratch |
| **Update** | Existing PRFAQ; requirements changed | Revised `prfaq.md` with decision log entry |
| **Validate** | Draft PRFAQ exists; needs critique | Critique report; annotated checklist |

## Core Workflow

### 1. Orient (all intents)

- Check output folder for existing `prfaq.md`, `project-context.md`, and
  `decision-log.md`.
- Confirm intent with the user (Create / Update / Validate).
- For **Create**: proceed to Step 2.
- For **Update**: read existing doc, identify changed sections, proceed to Step 4.
- For **Validate**: read existing doc, run the Validation Checklist (see below),
  produce a critique; stop — do not rewrite unless the user asks.

### 2. Gather (Create / Update)

Ask the minimum questions needed to fill the template. Stop after each cluster
and confirm before moving on. Suggested clusters:

**Cluster A — Customer & Problem**
- Who is the target customer (role, segment, context)?
- What is the specific problem or unmet need?
- How do they currently cope without this product?

**Cluster B — Product & Value**
- What does the product do in one sentence?
- What is the single most important customer benefit?
- What measurable outcome does the customer achieve?

**Cluster C — Differentiation & Availability**
- How is this different from existing solutions?
- When and how will customers get it?
- What is the call to action at launch?

**Cluster D — Hard Questions (Internal)**
- What are the top 3 risks or unknowns?
- What must be true technically for this to work?
- What does success look like in 6 months? 12 months?

**Cluster E — Customer Questions (External)**
- What will customers ask first?
- What might make them hesitate?
- What evidence or proof do they need?

### 3. Draft Press Release

Use the template at `${CLAUDE_PLUGIN_ROOT}/skills/bmad-prfaq/templates/prfaq.template.md`.

Fill in order:
1. Headline — product name + primary customer benefit in one line
2. Subheadline — who it is for and the key outcome
3. Opening paragraph — problem context (2-3 sentences)
4. Problem paragraph — paint the pain without naming the solution
5. Solution paragraph — introduce the product and its core capability
6. Benefit paragraphs — 2-3 paragraphs, one key benefit each
7. Customer quote — a realistic quote from a named persona
8. Call to action — how to get it, when, what to do next
9. Company quote — internal leader framing strategic intent

Keep the press release under 600 words. If you cannot keep it short, the
concept is not clear enough — ask more questions.

### 4. Draft Internal FAQ

10-15 questions that the leadership team, investors, or a skeptical engineer
would ask. Required question categories:

- **Market**: Why now? How large is the opportunity?
- **Customer**: How do we know this is a real problem?
- **Business model**: How does this make or save money?
- **Technical**: What are the hardest engineering problems?
- **Risk**: What are the top 3 ways this fails?
- **Metrics**: What does success look like at 30/90/180 days?
- **Alternatives considered**: What else did we consider and why not?
- **Dependencies**: What must exist before we can ship?

Answers must be specific. "We will figure it out" is not acceptable.

### 5. Draft External FAQ

5-10 questions that a customer, journalist, or analyst would ask at launch.
Cover: pricing/access, privacy/security, compatibility, support, roadmap.

### 6. Assemble and Write

Assemble the three sections into `prfaq.md` in the output folder.

File path: `{outputFolder}/prfaq.md`

### 7. Log Decision (Create / Update)

Append a concise entry to `{outputFolder}/decision-log.md`:
- Date
- Intent (Created / Updated)
- Key decisions captured in the PRFAQ
- Open questions deferred to PRD phase

### 8. Recommend Next Steps

Suggest the appropriate BMAD track and next skill:

- If the PRFAQ is thin (few stories expected): **Quick Flow** → hand off to
  product-manager for a tech spec.
- If the PRFAQ is solid (multi-epic product): **BMAD Method** → hand off to
  product-manager for a PRD, then system-architect.
- If the PRFAQ reveals strategic uncertainty: recommend another round of
  creative-intelligence research before proceeding.

## Validation Checklist

When intent is **Validate** (or as a self-check before finalising):

- [ ] Headline names a specific customer benefit (not a feature)
- [ ] Press release stays under 600 words
- [ ] Customer quote sounds like a real person, not marketing copy
- [ ] Internal FAQ has at least 10 questions with specific answers
- [ ] Internal FAQ includes at least one "how does this fail?" question
- [ ] Internal FAQ includes success metrics at 30/90/180 days
- [ ] External FAQ anticipates hesitation (not just enthusiasm)
- [ ] All open questions are explicitly labelled as open (not papered over)
- [ ] No implementation details in the press release section
- [ ] Document does not include velocity, story points, or burndown charts

## Output Quality Standards

A complete PRFAQ must:
- Be readable by a non-technical executive *and* a skeptical engineer
- Surface at least 3 genuine open questions (not rhetorical ones)
- Be grounded in specific customer language, not internal jargon
- Avoid commitments to specific technical approaches (that is architecture's job)
- Be 1,000–2,500 words total (press release + both FAQs)

## Subagent Strategy

**Pattern:** Sequential gather, parallel draft

For large or complex products where multiple customer segments exist, fan out
FAQ drafting across segments:

| Agent | Task | Output |
|-------|------|--------|
| Agent 1 | Draft Internal FAQ (business/market/risk questions) | `{outputFolder}/prfaq-internal-faq-draft.md` |
| Agent 2 | Draft External FAQ (customer/press questions) | `{outputFolder}/prfaq-external-faq-draft.md` |

**Coordination:**
1. Complete Clusters A–E interactively (sequential).
2. Write gathered context to `{outputFolder}/prfaq-inputs.md`.
3. Draft press release in main context (short, judgment-intensive).
4. Launch Agent 1 and Agent 2 in parallel with shared inputs.
5. Main context reviews both FAQ drafts, merges, and writes `prfaq.md`.

**Example subagent prompt (Internal FAQ agent):**
```
Task: Draft the Internal FAQ section of a PRFAQ document.
Context: Read {outputFolder}/prfaq-inputs.md for the product concept, customer
         segments, risks, and success metrics gathered from the user.
Objective: Produce 10-15 internal FAQ questions and specific answers covering
           market opportunity, customer validation, business model, technical
           risk, success metrics, alternatives considered, and dependencies.
Output: Write draft to {outputFolder}/prfaq-internal-faq-draft.md.
Constraints:
- Answers must be specific, not aspirational placeholders.
- Include at least one "what are the top ways this fails?" question.
- Include success metrics at 30, 90, and 180 days.
- Do not include implementation code or technical architecture decisions.
```

## Integration

**Receives input from:**
- business-analyst (product brief, discovery notes)
- creative-intelligence (research, brainstorm outputs)
- User (direct concept description)

**Provides output to:**
- product-manager (PRFAQ feeds into PRD creation)
- system-architect (open technical questions from internal FAQ)
- decision-log.md (decisions recorded for future skills)

## Tips for LLMs

- Use TodoWrite to track the cluster-by-cluster gather process.
- Ask one cluster of questions at a time; do not dump all questions at once.
- If the user is vague, use WebSearch to ground the problem in real market data
  before drafting (cite sources in the internal FAQ).
- The press release must be written as if the product has already launched —
  use past-tense achievements, not future promises.
- Customer quotes should sound human. Revise until they pass the "would a real
  person say this?" test.
- Do not proceed to architecture or story creation from this skill. Hand off.

---

> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-prfaq`. All methodology credit belongs to the BMAD Code Organization.
