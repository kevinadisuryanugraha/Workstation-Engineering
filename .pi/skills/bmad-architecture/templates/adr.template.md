# ADR-{NNN}: {Short imperative title}

> One Architecture Decision Record per significant choice. These records are the
> mechanism that forces every future parallel dev agent to share the same contract.
> Number sequentially. Never delete a record — supersede it.

**Status:** {Proposed | Accepted | Superseded by ADR-{NNN}}
**Date:** {YYYY-MM-DD}
**Deciders:** {who decided}
**Drives / driven by:** {FR-IDs and NFR-IDs this decision serves, e.g. NFR-003 (<200ms p95), FR-012}

---

## Context

{The forces at play. Why does this decision need to be made now? What constraints
from project-context.md, the PRD, or prior ADRs apply? State the problem so a reader
who has never seen the project understands the pressure.}

## Decision

{The choice, stated so a downstream agent can follow it mechanically with no further
interpretation. Be concrete: name the technology, the pattern, the convention, the shape.}

Example phrasings:
- "All HTTP APIs use REST with a JSON:API response envelope. No GraphQL."
- "Persistence is PostgreSQL 15. All IDs are UUID v7. Table/column names are snake_case."
- "AuthN is OAuth2 / OIDC; AuthZ is RBAC with roles {admin, member, viewer}."

## Consequences

**Now LOCKED for all stories:** {the specific rule every dev agent must obey — this is
what prevents semantic conflict.}

**Easier:** {what this decision makes simple}

**Harder / accepted cost:** {what we give up}

**Mitigation:** {how we reduce the cost}

## Alternatives considered

| Alternative | Pros | Cons | Why rejected |
|-------------|------|------|--------------|
| {Option B} | {…} | {…} | {…} |
| {Option C} | {…} | {…} | {…} |

## Revisit conditions

{Under what future conditions should this be reconsidered — e.g. "if traffic exceeds
50k concurrent users", "if a second client platform is added". Tie to measurable triggers.}
