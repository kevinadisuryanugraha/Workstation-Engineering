# System Architecture: {PROJECT_NAME}

**Document Version:** 1.0
**Date:** {DATE}
**Author:** Winston (Architect)
**Track:** {Quick Flow | BMad Method | Enterprise}
**Status:** Draft | Review | Approved
**Source PRD:** `bmad-output/prd.md`

> This is the single source of truth for cross-cutting technical decisions. Every
> story compiled by bmad-scrum-master inherits the LOCKED decisions recorded here.
> Catching alignment at this layer is ~10x cheaper than during implementation.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Pattern](#2-architecture-pattern)
3. [Architecture Decision Records](#3-architecture-decision-records)
4. [Component Design](#4-component-design)
5. [Data Model](#5-data-model)
6. [API Specifications](#6-api-specifications)
7. [FR / NFR Coverage Matrix](#7-fr--nfr-coverage-matrix)
8. [Technology Stack](#8-technology-stack)
9. [Trade-off Analysis](#9-trade-off-analysis)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Future Considerations](#11-future-considerations)

---

## 1. System Overview

### Purpose
{What the system does and its primary purpose.}

### Scope
**In Scope:**
- {Capability 1}
- {Capability 2}

**Out of Scope:**
- {Excluded 1}

### Architectural Drivers
The NFRs that most constrain the design (extracted from the PRD):

1. **{NFR-ID}: {Name}** — {impact on architecture}
2. **{NFR-ID}: {Name}** — {impact on architecture}
3. **{NFR-ID}: {Name}** — {impact on architecture}

### Stakeholders & Constraints (from project-context.md)
- **Users:** {…}
- **Team:** {size / expertise — drives tech-selection rubric}
- **Existing constraints:** {stack, budget, compliance the constitution mandates}

---

## 2. Architecture Pattern

**Pattern:** {Monolith | Modular Monolith | Microservices | Serverless | Layered}

**Justification:**
- {Reason tied to track/scale — e.g. BMad Method scale + 5-dev team → modular monolith}
- {Reason 2}

**Alternatives considered:**
- **{Alternative}:** Rejected because {reason}.

**Application:** {How the pattern is applied here.}

---

## 3. Architecture Decision Records

> The core artifact. Each cross-cutting choice is one ADR (full form in
> `adr.template.md`). These are exactly the decisions that, left implicit, cause
> parallel dev agents to diverge. Minimum set for BMad Method: API style, data model,
> AuthN/AuthZ, state management, error/response convention, naming convention.

| ADR | Title | Status | Drives |
|-----|-------|--------|--------|
| ADR-001 | {API style: e.g. REST + JSON:API} | Accepted | FR-…, NFR-… |
| ADR-002 | {Data / persistence model} | Accepted | FR-…, NFR-… |
| ADR-003 | {AuthN / AuthZ model} | Accepted | NFR-… |
| ADR-004 | {State management} | Accepted | FR-… |
| ADR-005 | {Error / response convention} | Accepted | — |
| ADR-006 | {Naming conventions} | Accepted | — |

### ADR-001: {Title}

**Status:** Accepted   **Drives:** {FR/NFR IDs}

**Context:** {forces}

**Decision:** {the choice, stated mechanically}

**Consequences — LOCKED for all stories:** {the rule every dev agent must obey}
- Easier: {…}
- Accepted cost: {…}  Mitigation: {…}

**Alternatives:** {rejected options + why}

**Revisit when:** {measurable trigger}

---

{Repeat ADR block for each decision. Append a one-line summary of each to decision-log.md.}

---

## 4. Component Design

### Component Overview
{Diagram or bulleted topology of components and their boundaries.}

### Component: {Name}

**Responsibility:** {single sentence}

**Interfaces Provided:** {endpoints/methods}
**Interfaces Required:** {dependencies}
**Data Owned:** {entities}
**ADRs that constrain it:** {ADR-IDs}
**NFRs Addressed:** {NFR-ID → how}

{Repeat per component.}

---

## 5. Data Model

> Governed by the data-model ADR. All stories share these entity shapes.

### Entity: {Name}
**Purpose:** {what it represents}

**Attributes:**
- `id` ({type}, PK)
- `{attribute}` ({type}) — {desc}
- `created_at` / `updated_at` (timestamp)

**Relationships:** {to other entities}
**Indexes:** {keys}
**Constraints:** {rules}

{Repeat per entity.}

### Storage Strategy
- **Primary store:** {choice + ADR ref}
- **Cache:** {choice + purpose}
- **File/blob:** {strategy}
- **Retention / backup:** {policy — strategy only}

---

## 6. API Specifications

> Governed by the API-style and error-convention ADRs.

**Protocol:** {per ADR-001}   **AuthN:** {per ADR-003}   **Versioning:** {strategy}

### `{METHOD} /api/v1/{resource}`
**Purpose:** {…}   **Auth:** {Required | None}

**Request / Response:** {shape per the error/response-envelope ADR}

**Error responses:** {codes per convention}

**NFRs:** response-time target {…}, rate limit {…}

{Repeat per endpoint group.}

---

## 7. FR / NFR Coverage Matrix

> Required. One row per FR and per NFR. No orphans — the validator fails if NFR
> mapping is missing. Status = Addressed | Partial | Deferred (with reason).

| ID | Type | Requirement | Component(s) | ADR(s) | Status |
|----|------|-------------|--------------|--------|--------|
| FR-001 | FR | {requirement} | {component} | {ADR} | Addressed |
| NFR-001 | NFR | {<200ms p95} | API, Cache | ADR-00X | Addressed |
| NFR-002 | NFR | {10k concurrent} | App tier, LB | ADR-00X | Addressed |
| NFR-003 | NFR | {PCI DSS} | Payment | ADR-003 | Addressed |

### Detailed NFR notes (per driver)
{For each architectural driver, expand the decision and how it satisfies the target.}

---

## 8. Technology Stack

> Each selection carries a one-line rationale tied to an architectural driver
> (tech-selection rubric in REFERENCE.md). No "because it's popular".

| Layer | Choice | Version | Rationale (→ driver) | ADR |
|-------|--------|---------|----------------------|-----|
| Frontend | {…} | {…} | {…} | {…} |
| Backend | {…} | {…} | {…} | {…} |
| Database | {…} | {…} | {…} | ADR-002 |
| Cache | {…} | {…} | {…} | {…} |
| Infrastructure | {…} | {…} | {…} | {…} |

**Alternatives considered:** {key rejections with reasons.}

---

## 9. Trade-off Analysis

### Trade-off: {Name}
**Decision:** {what was decided} (see ADR-00X)

**Options:** {A vs B with pros/cons}

**Rationale:** {why — reference drivers, constraints, team}

**Accepted:** Benefit {…} / Cost {…} / Mitigation {…}

**Revisit when:** {trigger}

{Repeat per major trade-off.}

---

## 10. Deployment Architecture

### Environments
Development / Staging / Production — {brief description of each}

### Topology
{Deployment diagram or description: load balancing, AZs/regions, data tier.}

### Strategy
- **Deployment method:** {Blue-Green | Rolling | Canary} (strategy — execution handled by external dev/ops tooling)
- **Rollback:** {approach}
- **Scaling:** {horizontal policy, database scaling path}

---

## 11. Future Considerations

**Anticipated changes:** {near / medium / long term and how the architecture supports them.}

**Scalability path:** current capacity {…} → next tier {what changes}.

**Revisit triggers (aggregated from ADRs):** {list the measurable conditions.}

---

## Appendix

### Glossary
| Term | Definition |
|------|------------|
| {Term} | {Definition} |

### References
- PRD: `bmad-output/prd.md`
- Decision log: `bmad-output/decision-log.md`
- Project context: `bmad-output/project-context.md`

### Document History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {DATE} | Winston (Architect) | Initial architecture |

---

**END OF DOCUMENT** — Ready for handoff to bmad-scrum-master once validation passes.
