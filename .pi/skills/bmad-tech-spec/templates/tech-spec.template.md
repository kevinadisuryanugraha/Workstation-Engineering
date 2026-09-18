# Technical Specification: {{project_name}}

**Date:** {{date}}
**Author:** {{author}}
**Version:** {{version}}
**Track:** Quick Flow (1-15 stories)
**Status:** {{status}}

> **Quick Flow track** — this document replaces a separate PRD and architecture file for
> small-scope work. If scope grows beyond ~15 stories, migrate to the BMad Method track
> (bmad-prd + bmad-architecture) before continuing.

---

## Related Documents

- Project context: `bmad-output/project-context.md`
- Decision log: `bmad-output/decision-log.md`
{{related_docs}}

---

## Problem & Solution

### Problem Statement

{{problem_statement}}

### Proposed Solution

{{proposed_solution}}

### Goals

- {{goal_1}}
- {{goal_2}}
- {{goal_3}}

---

## Scope

### In Scope

- {{in_scope_1}}
- {{in_scope_2}}
- {{in_scope_3}}

### Out of Scope

- {{out_of_scope_1}}
- {{out_of_scope_2}}
- {{out_of_scope_3}}

---

## Requirements

### Functional Requirements

<!-- Tag each requirement: MUST (required for launch), SHOULD (high value), COULD (nice-to-have) -->

#### FR-001: {{fr_1_title}} [MUST/SHOULD/COULD]

{{fr_1_description}}

**Acceptance Criteria:**
- {{fr_1_ac_1}}
- {{fr_1_ac_2}}

---

#### FR-002: {{fr_2_title}} [MUST/SHOULD/COULD]

{{fr_2_description}}

**Acceptance Criteria:**
- {{fr_2_ac_1}}
- {{fr_2_ac_2}}

---

<!-- Add FR-003, FR-004, … as needed -->

### Non-Functional Requirements

<!-- Include only NFRs that are meaningfully constrained for this project. Omit boilerplate. -->

#### Performance

{{nfr_performance}}

#### Security

{{nfr_security}}

#### Accessibility / Compliance

{{nfr_accessibility}}

#### Other

{{nfr_other}}

---

## Technical Approach

### Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| {{layer_1}} | {{tech_1}} | {{tech_1_notes}} |
| {{layer_2}} | {{tech_2}} | {{tech_2_notes}} |
| {{layer_3}} | {{tech_3}} | {{tech_3_notes}} |

### Architecture Overview

{{architecture_overview}}

<!-- Describe components, their responsibilities, and how they interact. Diagrams may be
     added as ASCII or linked Mermaid blocks. -->

### Key Components

#### {{component_1_name}}

**Purpose:** {{component_1_purpose}}

**Responsibilities:**
- {{component_1_resp_1}}
- {{component_1_resp_2}}

**Interfaces / Contracts:**
- {{component_1_interface}}

---

#### {{component_2_name}}

**Purpose:** {{component_2_purpose}}

**Responsibilities:**
- {{component_2_resp_1}}
- {{component_2_resp_2}}

**Interfaces / Contracts:**
- {{component_2_interface}}

---

<!-- Add components as needed -->

### Data Model

<!-- Omit this section if there is no persistent data. Note the omission. -->

{{data_model}}

### API Design

<!-- Omit this section if there is no API surface. Note the omission. -->

{{api_design}}

### Error Handling Strategy

{{error_handling}}

---

## Story List

<!-- One line per story. The bmad-epics-and-stories skill will expand these into full story
     files. Story count must remain 1-15 for the Quick Flow track. -->

| # | Epic | Story Title | Notes |
|---|------|-------------|-------|
| 1 | {{epic_1}} | {{story_1_title}} | {{story_1_notes}} |
| 2 | {{epic_1}} | {{story_2_title}} | {{story_2_notes}} |
| 3 | {{epic_2}} | {{story_3_title}} | {{story_3_notes}} |

**Total stories:** {{story_count}} (Quick Flow ceiling: 15)

---

## Testing Strategy

<!-- PLANNING ONLY. Describe what should be tested and why. Do not write test code.
     Coverage targets are guidance for the dev team, not mandates enforced here. -->

### Unit Testing Focus

{{unit_testing_focus}}

### Integration / End-to-End Scenarios

{{integration_scenarios}}

### Performance / Load Considerations

{{performance_testing_notes}}

### Security Testing Notes

{{security_testing_notes}}

---

## Dependencies

### External Dependencies

| Dependency | Version / Constraint | Purpose | Risk |
|------------|---------------------|---------|------|
| {{dep_1}} | {{dep_1_version}} | {{dep_1_purpose}} | {{dep_1_risk}} |
| {{dep_2}} | {{dep_2_version}} | {{dep_2_purpose}} | {{dep_2_risk}} |

### Internal / Shared Dependencies

- {{internal_dep_1}}
- {{internal_dep_2}}

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| {{risk_1}} | {{impact_1}} | {{prob_1}} | {{mitigation_1}} |
| {{risk_2}} | {{impact_2}} | {{prob_2}} | {{mitigation_2}} |

---

## Assumptions & Constraints

### Assumptions

1. {{assumption_1}}
2. {{assumption_2}}

### Constraints

1. {{constraint_1}}
2. {{constraint_2}}

---

## Success Criteria

How we know this work is complete:

- [ ] {{success_criterion_1}}
- [ ] {{success_criterion_2}}
- [ ] All MUST functional requirements implemented and accepted
- [ ] Non-functional targets met (see NFR section)
- [ ] All stories reach `done` status

---

## Decisions Log Summary

<!-- Record significant choices made while drafting this spec. Full entries belong in
     bmad-output/decision-log.md; summarize here for quick reference. -->

| Decision | Rationale | Date |
|----------|-----------|------|
| {{decision_1}} | {{rationale_1}} | {{date_1}} |

---

## Next Steps

This tech spec is the Quick Flow planning artifact. Proceed to story creation:

1. Use **bmad-epics-and-stories** to expand the Story List into full story files under
   `bmad-output/stories/`.
2. Story file naming: `{epic}.{story}.{slug}.story.md`
   (e.g., `1.1.user-auth.story.md`)
3. Once stories reach `ready-for-dev` status, hand off to your dev tool / plugin.

If scope has grown beyond 15 stories, switch to the BMad Method track before creating
stories: run **bmad-prd** to capture full requirements, then **bmad-architecture** to
design the system, then return to story planning.

---

*Technical Specification — Quick Flow Track — BMAD Method by the BMAD Code Organization*
