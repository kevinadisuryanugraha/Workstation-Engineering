# BMAD Architecture — Reference

Detailed material for the `bmad-architecture` skill. Keep SKILL.md lean; consult this when designing.

---

## 1. NFR categories (for systematic coverage)

Every NFR in the PRD must land in one of these categories and map to an ADR or component decision. Use `scripts/nfr-checklist.sh` for the full item-level checklist.

| Category | What to decide | Drives which cross-cutting choice |
|----------|----------------|-----------------------------------|
| **Performance** | Response-time targets, caching tiers, indexing, pagination, payload size | Caching ADR, data-access pattern |
| **Scalability** | Horizontal vs vertical, statelessness, sharding/replicas, queueing | Compute topology, data-model ADR |
| **Security** | AuthN, AuthZ model (RBAC/ABAC), encryption in transit/at rest, secrets, input validation, compliance (GDPR/PCI/HIPAA/SOC2) | **Security ADR (mandatory)** |
| **Reliability** | Redundancy, failover, circuit breakers, retries, graceful degradation, RTO/RPO | Resilience ADR |
| **Availability** | Uptime target, multi-AZ/region, health checks, backup/restore | Deployment topology |
| **Maintainability** | Module boundaries, naming conventions, testing **strategy**, docs | **Naming ADR**, module-boundary ADR |
| **Observability** | Structured logging, correlation IDs, metrics, tracing, alerting | Logging/telemetry convention |
| **Usability/Accessibility** | Responsiveness targets, WCAG, i18n | UI architecture (with UX) |
| **Compliance** | Data residency, retention, deletion, audit trail | Data-governance ADR |
| **Cost** | Right-sizing, autoscaling-to-demand, budget guardrails | Infra topology |
| **Portability** | Vendor lock-in, containerization, IaC | Infra topology |
| **Data integrity** | Validation rules, referential integrity, transaction strategy, consistency (strong vs eventual) | **Data-model ADR** |
| **Interoperability** | API versioning, external integrations, data-format standards | **API-style ADR** |

A NFR with no row in the coverage matrix is a defect. The validator flags missing Performance/Scalability/Security mapping as failures.

---

## 2. Common ADR topics

These are the decisions that, if left implicit, cause parallel dev agents to diverge. Minimum set for a BMad-Method project is marked **(core)**.

| ADR topic | Typical options | Why it must be decided once |
|-----------|-----------------|-----------------------------|
| **API style** (core) | REST, GraphQL, gRPC, REST+JSON:API | Every endpoint-touching story must match; mixing styles fractures the client and the contract. |
| **Data / persistence model** (core) | Relational (PostgreSQL/MySQL), document (MongoDB), key-value, CQRS, event sourcing | Entity shapes and ownership are shared by all stories; divergent models corrupt data. |
| **AuthN / AuthZ** (core) | JWT, OAuth2/OIDC, session; RBAC vs ABAC | Security cannot be retrofitted per-story; one model or holes appear. |
| **State management** (core) | Server-authoritative, client store (Redux/Zustand/signals), hybrid | UI stories must share one state contract or the app desyncs. |
| **Error / response convention** (core) | Envelope shape, error codes, HTTP status usage | Clients and services must agree on the wire format. |
| **Naming conventions** (core) | Resource naming, casing (snake/camel), table/column naming | Cheap to set, expensive to reconcile after the fact. |
| **Application architecture** | Monolith, modular monolith, microservices, serverless | Sets deployment + module boundaries for all stories. |
| **Integration / messaging** | Sync REST, message queue, event streaming | Determines coupling and ordering guarantees. |
| **Caching** | None, app cache (Redis), CDN, read-through | Affects performance NFRs and invalidation rules. |
| **Configuration / secrets** | Env vars, vault, parameter store | Security + portability. |
| **Logging / observability** | Structured logs, correlation IDs, tracing vendor | Cross-cutting; must be uniform to be useful. |

Write each as its own ADR using `templates/adr.template.md`. Number sequentially; never delete — supersede.

---

## 3. Tech-selection rubric

Score candidate technologies against the project's drivers; pick the simplest option that clears the bar. Bias toward simplicity (YAGNI) — match the pattern to the **track/scale**, not to ambition.

### Pattern-by-track guidance

| Track | Scale | Typical application pattern | Architecture depth |
|-------|-------|-----------------------------|--------------------|
| **Quick Flow** | 1–15 stories | Monolith / single service | Usually a tech-spec, not a full architecture.md |
| **BMad Method** | 10–50+ stories | Modular monolith (default) or selective services | Full architecture.md: pattern + components + data + API + ADRs + NFR matrix |
| **Enterprise** | 30+ stories | Modular monolith → microservices where justified | + dedicated Security and DevOps depth |

### Scoring dimensions (rank candidates 1–5 each)

1. **Fit to architectural drivers** — does it directly satisfy the hardest NFRs? (highest weight)
2. **Team familiarity** — existing expertise in `project-context.md` lowers risk.
3. **Operational simplicity** — fewer moving parts > theoretical power.
4. **Ecosystem & longevity** — maintained, documented, hireable.
5. **Cost** — license + infra + operational burden.
6. **Reversibility** — how hard to swap later? Prefer choices with clean boundaries.

### Decision rules

- If two options tie, choose the **simpler / more reversible** one and note the revisit condition in the ADR.
- Never introduce microservices, event sourcing, or polyglot persistence without an NFR that demands it. Record the demanding NFR in the ADR Context.
- For unfamiliar tech, use WebSearch/WebFetch to confirm current maturity before committing; cite the source in the ADR.
- Every selected technology gets a one-line rationale tied to a driver. No "because it's popular".

---

## 4. Coverage-matrix shape

Required table in `architecture.md`:

| ID | Type | Requirement | Component(s) | ADR(s) | Status |
|----|------|-------------|--------------|--------|--------|
| FR-001 | FR | User can place order | Order, Payment | ADR-002 | Addressed |
| NFR-003 | NFR | <200ms p95 API | API gateway, Cache | ADR-006 | Addressed |

One row per FR and per NFR. "Status" is Addressed / Partial / Deferred (with reason). The validator and the Validate intent both check this.

---

## 5. What stays OUT of scope

This skill plans. It must never: write application/source code, run a test suite, lint, measure coverage, build/compile, or review an implemented diff. If a request drifts that way, capture it as an ADR, an acceptance criterion, or a testing **strategy** note and hand off to the external dev tooling.
