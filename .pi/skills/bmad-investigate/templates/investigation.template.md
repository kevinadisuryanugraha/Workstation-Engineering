# Investigation Case File: {{ISSUE_SLUG}}

**Date:** {{DATE}}
**Project:** {{PROJECT_NAME}}
**Reported By:** {{REPORTED_BY}}          <!-- user / support ticket ID / monitoring alert -->
**Severity:** {{SEVERITY}}               <!-- Data Loss | Outage | Degraded UX | Cosmetic -->
**Status:** {{STATUS}}                   <!-- Open | Hypothesis Confirmed | Closed — Story Created -->
**Case File Version:** {{VERSION}}        <!-- 1.0 for initial; increment on Update -->
**Investigation Case File:** `bmad-output/investigation-{{ISSUE_SLUG}}-{{DATE}}.md`

---

## Summary

**One-sentence description of the issue:**
{{ISSUE_SUMMARY}}

**Expected behavior:** {{EXPECTED_BEHAVIOR}}

**Actual behavior:** {{ACTUAL_BEHAVIOR}}

**User / business impact:** {{BUSINESS_IMPACT}}
<!-- Quantify where possible: "affects ~N% of users", "blocks checkout flow", etc. -->

---

## Symptom Details

**Trigger conditions:**
{{TRIGGER_CONDITIONS}}
<!-- When does this occur? Always? Intermittently? Under load? With specific inputs? -->

**Environments affected:**
- [ ] Production
- [ ] Staging
- [ ] Development / local
- [ ] Specific environment: {{SPECIFIC_ENV}}

**First observed:** {{FIRST_OBSERVED}}
**Frequency:** {{FREQUENCY}}             <!-- e.g. "every request", "~30% of the time", "once" -->
**Reproducible:** {{REPRODUCIBLE}}       <!-- Yes / No / Intermittent -->

**Reproduction steps (if known):**
1. {{REPRO_STEP_1}}
2. {{REPRO_STEP_2}}
3. {{REPRO_STEP_3}}
<!-- Add or remove steps as needed. Write "Unknown" if not yet reproducible. -->

---

## Evidence

> **Grading Key**
> - **[A] Confirmed** — directly observed, reproducible, or corroborated by 2+ independent sources.
> - **[B] Probable** — single source, code-read inference, or intermittent.
> - **[C] Speculative** — pattern match or untested hypothesis only.

### Evidence Item 1: {{EVIDENCE_1_TITLE}}

**Grade:** {{GRADE_1}}  <!-- [A] / [B] / [C] -->
**Source:** {{SOURCE_1}}  <!-- e.g. "production logs, 2026-06-19 03:42 UTC" -->
**Description:**
{{EVIDENCE_1_DESCRIPTION}}

**Verbatim excerpt (if applicable):**
```
{{EVIDENCE_1_EXCERPT}}
```

**Implications:** {{EVIDENCE_1_IMPLICATIONS}}

---

### Evidence Item 2: {{EVIDENCE_2_TITLE}}

**Grade:** {{GRADE_2}}
**Source:** {{SOURCE_2}}
**Description:**
{{EVIDENCE_2_DESCRIPTION}}

**Verbatim excerpt (if applicable):**
```
{{EVIDENCE_2_EXCERPT}}
```

**Implications:** {{EVIDENCE_2_IMPLICATIONS}}

---

### Evidence Item 3: {{EVIDENCE_3_TITLE}}

**Grade:** {{GRADE_3}}
**Source:** {{SOURCE_3}}
**Description:**
{{EVIDENCE_3_DESCRIPTION}}

**Verbatim excerpt (if applicable):**
```
{{EVIDENCE_3_EXCERPT}}
```

**Implications:** {{EVIDENCE_3_IMPLICATIONS}}

<!-- Add Evidence Item 4, 5, … as needed. -->

### Evidence Summary

| # | Title | Grade | Source | Key Implication |
|---|-------|-------|--------|----------------|
| 1 | {{EVIDENCE_1_TITLE}} | {{GRADE_1}} | {{SOURCE_1}} | {{EVIDENCE_1_IMPLICATIONS}} |
| 2 | {{EVIDENCE_2_TITLE}} | {{GRADE_2}} | {{SOURCE_2}} | {{EVIDENCE_2_IMPLICATIONS}} |
| 3 | {{EVIDENCE_3_TITLE}} | {{GRADE_3}} | {{SOURCE_3}} | {{EVIDENCE_3_IMPLICATIONS}} |
<!-- Extend as needed -->

---

## Hypotheses

_Ranked from most to least plausible. Each hypothesis must be falsifiable._

### Hypothesis 1 — {{H1_TITLE}}  [Plausibility: High / Medium / Low]

**Statement:** {{H1_STATEMENT}}

**Supporting evidence:**
- {{H1_SUPPORT_1}} ({{H1_SUPPORT_1_GRADE}})
- {{H1_SUPPORT_2}} ({{H1_SUPPORT_2_GRADE}})

**Contradicting evidence:**
- {{H1_CONTRADICT_1}}
<!-- Write "None identified" if no contradicting evidence -->

**Verification step (for the dev agent):**
{{H1_VERIFICATION}}
<!-- What specific check would confirm or refute this? Be concrete: "add log at X",
     "reproduce with Y input", "diff config A vs B". -->

---

### Hypothesis 2 — {{H2_TITLE}}  [Plausibility: High / Medium / Low]

**Statement:** {{H2_STATEMENT}}

**Supporting evidence:**
- {{H2_SUPPORT_1}} ({{H2_SUPPORT_1_GRADE}})

**Contradicting evidence:**
- {{H2_CONTRADICT_1}}

**Verification step (for the dev agent):**
{{H2_VERIFICATION}}

---

### Hypothesis 3 — {{H3_TITLE}}  [Plausibility: High / Medium / Low]

**Statement:** {{H3_STATEMENT}}

**Supporting evidence:**
- {{H3_SUPPORT_1}} ({{H3_SUPPORT_1_GRADE}})

**Contradicting evidence:**
- {{H3_CONTRADICT_1}}

**Verification step (for the dev agent):**
{{H3_VERIFICATION}}

<!-- Add Hypothesis 4, 5 as needed. Remove if fewer apply. -->

---

## Suspected Components

_Mapped from the top hypotheses. Cross-referenced against architecture.md._

### Component: {{COMPONENT_1_NAME}}

| Attribute | Detail |
|-----------|--------|
| Type | {{COMPONENT_1_TYPE}}  <!-- module / service / library / config / infra --> |
| File / path | {{COMPONENT_1_PATH}} |
| Responsibility | {{COMPONENT_1_RESPONSIBILITY}} |
| Confidence | {{COMPONENT_1_CONFIDENCE}}  <!-- High / Medium / Low — from evidence grade --> |
| Architecture reference | {{COMPONENT_1_ARCH_REF}}  <!-- e.g. "architecture.md#auth-service" --> |

**Why suspected:**
{{COMPONENT_1_WHY}}

**Blast radius (if hypothesis is correct):**
{{COMPONENT_1_BLAST_RADIUS}}

---

### Component: {{COMPONENT_2_NAME}}

| Attribute | Detail |
|-----------|--------|
| Type | {{COMPONENT_2_TYPE}} |
| File / path | {{COMPONENT_2_PATH}} |
| Responsibility | {{COMPONENT_2_RESPONSIBILITY}} |
| Confidence | {{COMPONENT_2_CONFIDENCE}} |
| Architecture reference | {{COMPONENT_2_ARCH_REF}} |

**Why suspected:**
{{COMPONENT_2_WHY}}

**Blast radius (if hypothesis is correct):**
{{COMPONENT_2_BLAST_RADIUS}}

<!-- Add Component 3+ as needed. -->

---

## Related Requirements

_Which functional or non-functional requirements does this broken behavior touch?_

| Requirement | Type | Source | Status |
|-------------|------|--------|--------|
| {{REQ_1_ID}} — {{REQ_1_TITLE}} | FR / NFR | {{REQ_1_SOURCE}} | Violated / At Risk |
| {{REQ_2_ID}} — {{REQ_2_TITLE}} | FR / NFR | {{REQ_2_SOURCE}} | Violated / At Risk |
<!-- Cite prd.md or tech-spec.md sections: e.g. "prd.md#FR-12" -->
<!-- Write "None identified" if no direct requirement link -->

---

## Recommended Action

**Planning Response:** {{PLANNING_RESPONSE}}   <!-- Option A / B / C -->

### Option A — Create a Fix Story  _(recommended when root cause is scoped)_

**Story to create:**

| Field | Value |
|-------|-------|
| Epic | {{STORY_EPIC}} |
| Story title | {{STORY_TITLE}} |
| As a | {{STORY_AS_A}} |
| I want | {{STORY_I_WANT}} |
| So that | {{STORY_SO_THAT}} |
| Suggested AC 1 | {{STORY_AC_1}} |
| Suggested AC 2 | {{STORY_AC_2}} |
| Suspected files / modules | {{STORY_SCOPE}} |
| Verification steps (from hypotheses) | {{STORY_VERIFICATION}} |
| Investigation reference | `bmad-output/investigation-{{ISSUE_SLUG}}-{{DATE}}.md` |

> Proceed with `/bmad-planning-orchestrator:bmad-epics-and-stories` to compile the
> full story context object. Dev Notes in that story MUST cite this case file.

---

### Option B — Update an Existing Story  _(recommended when a related backlog item exists)_

**Story to update:** `{{EXISTING_STORY_PATH}}`

**What to add:**
- Dev Notes: {{OPTION_B_DEV_NOTE}}
- Additional AC: {{OPTION_B_AC}}
- Updated scope (if new files implicated): {{OPTION_B_SCOPE_UPDATE}}

> Proceed with `/bmad-planning-orchestrator:bmad-epics-and-stories` (Update intent).

---

### Option C — Escalate to Planning  _(recommended when root cause implicates architecture or PRD gaps)_

**Rationale:** {{OPTION_C_RATIONALE}}

**Recommended next skill:**
- [ ] `/bmad-planning-orchestrator:bmad-architecture` (Update intent) — if a design
      decision needs revision.
- [ ] `/bmad-planning-orchestrator:bmad-prd` (Update intent) — if a requirement is
      missing or ambiguous.
- [ ] `/bmad-planning-orchestrator:bmad-readiness-check` — if multiple areas are at risk.

**Specific gap to address:** {{OPTION_C_GAP}}

---

## Open Questions

_Items that could not be answered from available evidence. Carry forward to the story
or escalate to planning as appropriate._

1. {{OPEN_Q_1}}
2. {{OPEN_Q_2}}
3. {{OPEN_Q_3}}
<!-- Remove if none -->

---

## Update History

| Version | Date | Summary of Changes |
|---------|------|--------------------|
| 1.0 | {{DATE}} | Initial investigation case file |
<!-- Add rows on Update-intent runs -->

---

_BMAD Planning & Orchestrator · Investigation Case File · tracks `bmad-investigate` from the BMAD Method by the BMAD Code Organization (https://github.com/bmad-code-org/BMAD-METHOD)_
