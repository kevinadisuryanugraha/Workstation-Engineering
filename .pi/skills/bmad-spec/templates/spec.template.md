# SPEC — {{PROJECT_NAME}}

> **This is the kernel.** Five fields. Keep it lean.
> Downstream skills (PRD, tech-spec, architecture) expand each field.
> Do not add sections. If something doesn't fit, put it in the PRD.

**Created:** {{DATE}}
**Source:** {{SOURCE_DESCRIPTION}}
**Track:** {{TRACK}}  <!-- quick-flow | bmad-method | enterprise -->
**Status:** {{STATUS}}  <!-- draft | confirmed | superseded -->

---

## Problem

<!--
GUIDANCE: One coherent statement of what hurts and why it matters.
  - Name the affected user or system.
  - Describe the current failure state or gap.
  - State the impact if left unsolved (time lost, revenue at risk, compliance breach, user frustration).
  - 2–5 sentences. No solution language here.

EXAMPLE:
  Analysts on the fraud team must manually cross-reference three internal dashboards
  to identify suspicious transactions. Each review takes 45–90 minutes and is done
  after the fact, meaning chargebacks have already occurred by the time fraud is
  detected. The team flags roughly 60% of fraud cases; the remaining 40% go
  undetected until customers dispute charges. This costs the business an estimated
  $2M/year in chargebacks and erodes customer trust.
-->

{{PROBLEM}}

---

## Capabilities

<!--
GUIDANCE: What the solution must be able to do, framed as outcomes.
  - Write "users can …" or "the system supports …" — NOT "add a button that …"
  - List 3–7 items. More than 7 means the scope is too large; split or defer.
  - Order by importance to the Problem statement.
  - Avoid naming implementation technology here (that belongs in Constraints or the architecture doc).

EXAMPLE:
  - Analysts can view a unified risk signal for any transaction within 5 seconds of it posting.
  - The system surfaces the top 20 highest-risk transactions automatically each hour without manual querying.
  - Reviewers can annotate a transaction with a disposition (fraud / legitimate / needs-review) in one action.
  - The system learns from dispositions and adjusts risk scores over time.
  - Audit logs capture every review action with timestamp and reviewer ID for compliance.
-->

- {{CAPABILITY_1}}
- {{CAPABILITY_2}}
- {{CAPABILITY_3}}

---

## Constraints

<!--
GUIDANCE: Hard limits that are not negotiable. If it can be traded away, it is not a constraint.
  - Include: budget caps, delivery deadlines, mandated tech stack or platforms, regulatory/compliance
    requirements, team-size limits, data residency rules, external API dependencies.
  - State each constraint as a fact, not a wish ("must run on-premise" not "we'd prefer on-premise").
  - 2–6 items. If you have more than six, some are probably soft constraints — note those separately.

EXAMPLE:
  - Must deploy within the existing AWS us-east-1 VPC; no new cloud regions.
  - All transaction data must remain within the EU (GDPR data residency).
  - Must integrate with the existing Splunk SIEM using its REST API; no new logging infrastructure.
  - Budget cap: $150K total (infrastructure + engineering) for v1.
  - Must be delivered before the Q3 PCI-DSS audit (deadline: 2026-08-01).
-->

- {{CONSTRAINT_1}}
- {{CONSTRAINT_2}}

---

## Non-Goals

<!--
GUIDANCE: Scope that is explicitly OUT of this initiative.
  - Name things a reader might reasonably assume are included but are not.
  - Name things that came up in conversation and were consciously deferred.
  - Be specific; vague non-goals cause creep. "We won't build a mobile app" is good.
    "We won't over-engineer it" is not a non-goal.
  - 2–6 items.

EXAMPLE:
  - Replacing the existing transaction database schema or ETL pipelines.
  - Building a customer-facing dispute portal (deferred to v2).
  - Real-time chargeback reversal automation (requires legal sign-off not yet obtained).
  - Support for non-credit-card payment types (ACH, wire transfers).
  - A self-service rule editor for business analysts (requires separate UX investment).
-->

- {{NON_GOAL_1}}
- {{NON_GOAL_2}}

---

## Success Metrics

<!--
GUIDANCE: Observable signals that confirm the Problem is solved.
  - Each metric must be measurable without ambiguity (number, percentage, threshold, boolean).
  - Tie each metric back to the Problem statement.
  - Include a baseline (current state) when known; if unknown, state that and commit to measuring it.
  - 2–5 items. Fewer is better; pick the signals that would make a skeptic say "yes, it worked."

EXAMPLE:
  - Fraud detection rate improves from 60% to ≥85% within 90 days of launch (measured by chargebacks
    on flagged vs. unflagged transactions).
  - Average manual review time per transaction falls from 60 min to ≤10 min (measured by reviewer
    time-tracking data).
  - Chargeback losses decrease by ≥40% year-over-year in the first 12 months post-launch.
  - Zero compliance findings related to audit-log gaps in the next PCI-DSS audit.
  - Analyst satisfaction score (internal survey) ≥4.0/5.0 at 30-day post-launch check-in.
-->

- {{METRIC_1}}
- {{METRIC_2}}

---

<!-- SPEC END — anything else belongs in the PRD, tech-spec, or architecture doc. -->
