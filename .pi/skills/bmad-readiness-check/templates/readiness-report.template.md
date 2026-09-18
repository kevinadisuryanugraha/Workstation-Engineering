# BMAD Readiness Report

**Date:** {{date}}
**Project:** {{project_name}}
**Track:** {{track}}  _(Quick Flow | BMad Method | Enterprise)_
**Requirements doc:** {{req_doc_path}}
**Architecture doc:** {{arch_doc_path}}

---

## Verdict

**{{VERDICT}}**  _(PASS | CONCERNS | FAIL)_

{{verdict_summary}}

---

## Requirements Coverage

### Functional Requirements

| Metric | Value |
|--------|-------|
| Total FRs identified | {{fr_total}} |
| Covered in architecture (explicit) | {{fr_covered}} |
| Implied / subject-matter coverage | {{fr_implied}} |
| Missing — no evidence of coverage | {{fr_missing}} |
| **Coverage %** (covered + implied) | **{{fr_coverage_pct}} %** |

**Threshold:** PASS ≥ 90 % · CONCERNS 80–89 % · FAIL < 80 %

#### Missing or Partially Covered FRs

{{missing_fr_list}}
_(List each uncovered FR with its description and a recommended architecture
action, or write "None — all FRs are addressed." if coverage is full.)_

---

### Non-Functional Requirements

| Metric | Value |
|--------|-------|
| Total NFRs identified | {{nfr_total}} |
| Fully addressed in architecture | {{nfr_addressed}} |
| Partially addressed | {{nfr_partial}} |
| Missing — no architecture strategy | {{nfr_missing}} |
| **Coverage %** (addressed + partial) | **{{nfr_coverage_pct}} %** |

**Threshold:** PASS ≥ 90 % · CONCERNS 80–89 % · FAIL < 80 %

#### NFR Coverage Detail

| NFR | Status | Architecture Strategy | Notes |
|-----|--------|----------------------|-------|
| Performance | {{nfr_perf_status}} | {{nfr_perf_strategy}} | {{nfr_perf_notes}} |
| Security | {{nfr_sec_status}} | {{nfr_sec_strategy}} | {{nfr_sec_notes}} |
| Scalability | {{nfr_scale_status}} | {{nfr_scale_strategy}} | {{nfr_scale_notes}} |
| Reliability | {{nfr_rel_status}} | {{nfr_rel_strategy}} | {{nfr_rel_notes}} |
| Maintainability | {{nfr_maint_status}} | {{nfr_maint_strategy}} | {{nfr_maint_notes}} |
| {{nfr_other_name}} | {{nfr_other_status}} | {{nfr_other_strategy}} | {{nfr_other_notes}} |

_(Status values: Addressed · Partial · Missing)_

---

## Epic / Story Traceability

_(Omit this section for Quick Flow projects with no epics.)_

| Metric | Value |
|--------|-------|
| Total epics | {{epic_total}} |
| Epics linked to a PRD requirement | {{epic_linked}} |
| Orphan epics (no traceable requirement) | {{epic_orphan}} |
| Total story files found | {{story_total}} |

**Threshold:** PASS = all linked · CONCERNS ≥ 80 % linked · FAIL < 80 %

#### Orphan Epics

{{orphan_epic_list}}
_(List orphan epics and the suspected requirement gap, or write "None.")_

---

## Architecture Quality

**Score:** {{arch_quality_pct}} % ({{arch_pass}} / {{arch_total}} checks)

**Threshold:** PASS ≥ 80 % · CONCERNS 70–79 % · FAIL < 70 %

| Check | Result |
|-------|--------|
| Architectural pattern stated | {{q_pattern}} |
| Components / modules defined | {{q_components}} |
| API or service contracts described | {{q_api}} |
| Data model or entities specified | {{q_data}} |
| Technology stack present | {{q_stack}} |
| Technology choices justified | {{q_rationale}} |
| Security strategy addressed | {{q_security}} |
| Scalability or performance addressed | {{q_scalability}} |
| Trade-offs documented | {{q_tradeoffs}} |
| Assumptions or constraints listed | {{q_assumptions}} |

_(Result values: PASS · FAIL)_

---

## Issues Summary

### Blockers — must fix before implementation begins

{{blockers_list}}
_(List each blocker with: what is missing, which artifact to update, and
the specific section or requirement ID. Write "None." if there are no blockers.)_

### Concerns — address during story refinement

{{concerns_list}}
_(List each concern with a recommended action and the story/epic where it
should be surfaced as a Dev Note. Write "None." if clean.)_

### Minor observations

{{minor_list}}
_(Nice-to-have improvements that do not block implementation.)_

---

## Recommendations

{{recommendations}}
_(3–5 specific, actionable recommendations ordered by priority.)_

---

## Gate Decision

**Verdict: {{VERDICT}}**

**Rationale:** {{verdict_rationale}}

### If PASS
All planning artifacts are cohesive and cover requirements adequately.
Proceed to epic/story decomposition:
`/bmad-planning-orchestrator:bmad-epics-and-stories`

### If CONCERNS
Core planning is solid. Proceed with caution.
Carry forward the listed concerns as Dev Notes in affected stories so the
implementation agent has full context. Re-validate after story refinement if
any concern touches a Must Have requirement.

### If FAIL
Implementation must not begin until blockers are resolved.

Required actions:
{{fail_required_actions}}

After addressing blockers:
1. Update the relevant planning artifact(s).
2. Re-run `/bmad-planning-orchestrator:bmad-readiness-check`.
3. Proceed to story decomposition only after a PASS or CONCERNS verdict.

---

## Next Step

{{next_step}}

---

_BMAD Planning & Orchestrator · Readiness Check · tracks `bmad-check-implementation-readiness` from the BMAD Method by the BMAD Code Organization (https://github.com/bmad-code-org/BMAD-METHOD)_
