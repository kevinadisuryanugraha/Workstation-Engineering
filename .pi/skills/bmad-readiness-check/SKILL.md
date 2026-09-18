---
name: bmad-readiness-check
description: |
  SOLUTIONING GATE — validates cohesion across planning artifacts before any
  implementation begins. Cross-references PRD (or tech-spec), architecture document,
  and epics/stories for coverage consistency and missing pieces. Returns a verdict
  of PASS, CONCERNS, or FAIL with specifics. Does NOT touch code.

  Use when the user says:
  - "check if we're ready to build" / "are we ready to implement?"
  - "validate planning" / "gate check" / "readiness check"
  - "run the solutioning gate" / "check implementation readiness"
  - "is the architecture complete?" / "do requirements match architecture?"
  - "sign off on planning" / "planning done, check it"
  - "validate PRD against architecture" / "cross-reference planning docs"

  Intents supported: Validate (primary).
  Track-adaptive: works for Quick Flow (tech-spec + architecture), BMad Method
  (PRD + architecture + epics), and Enterprise (all of the above + optional
  security/DevOps addenda).
allowed-tools: Read, Write, Bash, Glob, Grep, TodoWrite
---

# BMAD Readiness Check

**"Planning ends here."** This skill is the gate between Solutioning and
Implementation. It validates that the planning corpus is internally consistent
— requirements are covered by architecture, epics trace back to requirements,
and nothing critical is missing — before a single line of code is written.

The output is a `readiness-report.md` with a clear PASS / CONCERNS / FAIL
verdict and actionable specifics.

---

## Workflow

Use TodoWrite to track: Load Artifacts → Cross-Reference → Quality Checks →
Generate Report → Display Verdict.

---

### Step 1 — Locate Planning Artifacts

Run the bundled existence check:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/bmad-readiness-check/scripts/readiness-check.sh" <output-folder>
```

The script checks for required artifact files and prints a PASS / CONCERNS /
FAIL pre-flight verdict. Read its output; it will also print artifact paths
for you to load in Step 2.

Default search root is `bmad-output/` (or the user-configured `outputFolder`).
If the user supplies a custom path, pass it as the argument.

---

### Step 2 — Load and Parse Artifacts

Read each artifact the script located:

**Requirements document** (PRD or tech-spec):
- Extract labelled Functional Requirements (FR-001, FR-002 …) or requirement
  bullets if not labelled.
- Extract Non-Functional Requirements (NFR-001 … or named sections:
  Performance, Security, Scalability, Reliability, Maintainability).
- Note epic count and high-level scope statements.

**Architecture document**:
- Extract system components and their responsibilities.
- Locate FR traceability matrix or explicit FR-to-component mappings.
- Locate NFR coverage sections.
- Note technology stack decisions and trade-off notes.

**Epics / stories** (if present):
- Count epics and stories.
- For each epic, identify which PRD requirement(s) it references.

Record a baseline:

```
Baseline
- FRs found: N
- NFRs found: N
- Epics found: N  (0 if Quick Flow)
- Stories found: N  (0 if not yet decomposed)
```

---

### Step 3 — Cross-Reference Checks

#### 3a. FR → Architecture Coverage
For each FR, search the architecture document for the FR identifier AND for
the subject matter of the requirement. Mark:
- **Covered** — FR explicitly addressed, component assigned.
- **Implied** — subject matter covered but not explicitly linked.
- **Missing** — no evidence of coverage.

#### 3b. NFR → Architecture Coverage
For each NFR category, check for a dedicated architecture section or explicit
strategy:
- Performance: caching, response-time targets, async patterns.
- Security: auth/authz model, encryption, secrets management.
- Scalability: horizontal/vertical strategy, load balancing.
- Reliability: failover, backup, uptime targets.
- Others as present.

Mark each: **Addressed** / **Partial** / **Missing**.

#### 3c. Epic → FR Traceability (BMad Method / Enterprise tracks)
For each epic, verify it references at least one FR or PRD section.
Flag orphan epics (no traceable requirement).

#### 3d. Architecture Quality Spot-Checks
Verify the architecture document contains:
- [ ] Architectural pattern stated and justified
- [ ] Component responsibilities and interfaces defined
- [ ] Data model / entity relationships
- [ ] API design or service contracts
- [ ] Technology choices with rationale
- [ ] Trade-offs documented
- [ ] Assumptions and constraints listed

---

### Step 4 — Compute Verdict

Apply these thresholds (adapted from BMAD Method v6 gate criteria, expressed
as PASS / CONCERNS / FAIL):

| Criterion | PASS | CONCERNS | FAIL |
|-----------|------|----------|------|
| FR coverage (covered + implied) | ≥ 90 % | 80–89 % | < 80 % |
| NFR coverage (addressed + partial) | ≥ 90 % | 80–89 % | < 80 % |
| Architecture quality checks | ≥ 80 % | 70–79 % | < 70 % |
| Blocker issues (critical gaps) | 0 | have mitigation | unmitigated |
| Epic traceability (if applicable) | all linked | ≥ 80 % linked | < 80 % |

**Overall verdict rule:**
- **PASS** — all criteria at PASS threshold, no blockers.
- **CONCERNS** — one or more criteria in CONCERNS band, blockers have
  mitigation plans. Proceed with caution; address concerns during story
  refinement.
- **FAIL** — any criterion below CONCERNS threshold, or any unmitigated
  blocker. Do not proceed to story creation until issues are resolved.

---

### Step 5 — Generate Report

Write the readiness report using the template:

```
${CLAUDE_PLUGIN_ROOT}/skills/bmad-readiness-check/templates/readiness-report.template.md
```

Save to: `<outputFolder>/readiness-report-<project-slug>-<date>.md`

Use the Write tool. Fill all `{{placeholder}}` fields from your analysis.

---

### Step 6 — Display Verdict

Print a concise summary to the user:

```
Readiness Check Complete

Artifact Coverage
  FR coverage:          XX %
  NFR coverage:         XX %
  Architecture quality: XX %

Verdict: PASS | CONCERNS | FAIL

<One-sentence rationale>

Report saved: <file path>
```

Then give a concrete **Next Step** recommendation:
- **PASS** → Proceed to epic/story decomposition
  (`/bmad-planning-orchestrator:bmad-epics-and-stories`).
- **CONCERNS** → Proceed with caution; list the open items the story author
  must carry forward as Dev Notes.
- **FAIL** → List the top 3–5 required fixes; re-run readiness check after
  addressing them.

---

## Scope Boundary

This skill validates **planning documents only**. It does not:
- Write application code.
- Run tests, linters, or build tools.
- Review pull requests or diffs.
- Execute coverage or velocity metrics.

When the verdict is PASS or CONCERNS, hand off to your dev tools via the
story files produced by the epic/story skill.

---

## Persona Note

This gate is traditionally owned by Winston (System Architect) in the BMAD
Method. The skill is a workflow, not a character, but Winston's voice —
thorough, systematic, quality-focused — should guide the tone of the report.

---

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-check-implementation-readiness`. All methodology credit belongs to the BMAD Code Organization.
