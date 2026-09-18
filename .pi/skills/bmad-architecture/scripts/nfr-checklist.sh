#!/bin/bash
# NFR Coverage Checklist (BMAD Planning & Orchestrator)
# Prints the full Non-Functional Requirement category checklist to drive
# systematic coverage in architecture.md. PLANNING ONLY — no code is run, built,
# or tested. Items below describe STRATEGY decisions to record, not actions to execute.

set -e

echo "================================================================================"
echo "  Non-Functional Requirements (NFR) Coverage Checklist"
echo "================================================================================"
echo ""
echo "Use this to ensure architecture.md addresses every relevant NFR category."
echo "Mark each as covered by a specific architectural decision / ADR + rationale."
echo ""
echo "================================================================================"
echo ""

cat << 'EOF'
## Performance
  [ ] Response-time targets defined and an architectural decision addresses them
  [ ] Caching strategy designed (application, database, CDN)
  [ ] Database indexing strategy defined
  [ ] Load balancing approach specified
  [ ] Pagination / payload-size strategy
  [ ] Connection pooling strategy

## Scalability
  [ ] Horizontal scaling approach defined
  [ ] Stateless design decision recorded
  [ ] Database scaling strategy (sharding, read replicas)
  [ ] Auto-scaling policy defined
  [ ] Concurrent-user / throughput targets addressed
  [ ] Queue/buffer strategy for load (if applicable)

## Security  (mandatory ADR)
  [ ] Authentication mechanism decided (JWT, OAuth2/OIDC, SAML, session)
  [ ] Authorization model decided (RBAC, ABAC)
  [ ] Encryption in transit (TLS) required
  [ ] Encryption at rest for sensitive data
  [ ] Secret-management approach specified
  [ ] API security (rate limiting, authn) specified
  [ ] Input validation / sanitization strategy
  [ ] Compliance addressed (GDPR, HIPAA, PCI DSS, SOC 2) where applicable
  [ ] Audit-logging strategy defined

## Reliability
  [ ] Redundancy strategy (multi-instance / multi-AZ)
  [ ] Failover mechanism defined
  [ ] Circuit-breaker / retry strategy
  [ ] Graceful degradation approach
  [ ] Health-check strategy
  [ ] Backup strategy
  [ ] Disaster-recovery approach documented
  [ ] Error-rate targets defined and addressed

## Availability
  [ ] Uptime target defined (e.g. 99.9%, 99.99%)
  [ ] Multi-region / multi-AZ decision (if required)
  [ ] Active-active vs active-passive decision
  [ ] Backup / restore strategy
  [ ] Monitoring & alerting strategy
  [ ] Recovery Time Objective (RTO) defined
  [ ] Recovery Point Objective (RPO) defined

## Maintainability
  [ ] Clear module boundaries and interfaces defined
  [ ] Naming conventions decided (ADR)
  [ ] Testing STRATEGY described (unit/integration/e2e — strategy only, not executed)
  [ ] Documentation approach (architecture, API)
  [ ] Logging strategy (structured, centralized)
  [ ] Dependency-management approach

## Observability
  [ ] Structured logging with correlation IDs
  [ ] Centralized log aggregation strategy
  [ ] Application & infrastructure metrics defined
  [ ] Distributed tracing strategy for request flows
  [ ] Alerting rules and thresholds defined
  [ ] Error-tracking approach specified

## Usability / Accessibility (if applicable)
  [ ] UI responsiveness targets
  [ ] Accessibility requirements (WCAG)
  [ ] Browser / device compatibility
  [ ] Internationalization (i18n) support

## Compliance (if applicable)
  [ ] Data residency requirements
  [ ] Data retention & deletion policy
  [ ] Privacy requirements (GDPR, CCPA)
  [ ] Industry compliance (HIPAA, PCI DSS, SOC 2)
  [ ] Audit-trail requirements

## Cost Optimization
  [ ] Infrastructure cost estimates
  [ ] Auto-scaling to match demand
  [ ] Resource right-sizing strategy
  [ ] Cost monitoring & alerting

## Portability (if applicable)
  [ ] Cloud vendor lock-in minimized
  [ ] Containerization strategy
  [ ] Infrastructure-as-Code approach
  [ ] Database migration strategy

## Data Integrity
  [ ] Data validation rules
  [ ] Referential-integrity enforcement
  [ ] Transaction-management strategy
  [ ] Consistency guarantees defined (strong vs eventual)
  [ ] Backup & recovery for data

## Interoperability (if applicable)
  [ ] API versioning strategy
  [ ] External-system integration defined
  [ ] Data-format standards (JSON, XML)
  [ ] Protocol standards (REST, GraphQL, gRPC)
  [ ] Backward-compatibility approach

EOF

echo ""
echo "================================================================================"
echo "  NFR Checklist Complete"
echo "================================================================================"
echo ""
echo "Record each applicable NFR as a row in the FR/NFR coverage matrix and back the"
echo "cross-cutting ones with an ADR."
echo ""
echo "To validate the finished document, run:"
echo '  bash ${CLAUDE_PLUGIN_ROOT}/skills/bmad-architecture/scripts/validate-architecture.sh bmad-output/architecture.md'
echo ""
