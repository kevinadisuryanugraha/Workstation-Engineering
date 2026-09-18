# PRFAQ: {{PRODUCT_NAME}}

**Date:** {{DATE}}
**Author:** {{AUTHOR}}
**Status:** {{STATUS}} <!-- Draft | Review | Approved -->
**Version:** {{VERSION}}
**BMAD Track Recommendation:** {{TRACK}} <!-- Quick Flow | BMad Method | Enterprise -->

---

## Press Release

### {{HEADLINE}}

*{{SUBHEADLINE}}*

---

**{{DATELINE}}** — {{OPENING_PARAGRAPH}}

<!-- 2-3 sentences. Set the market context and name the customer.
     Do NOT name the product yet. -->

#### The Problem

{{PROBLEM_PARAGRAPH}}

<!-- 2-3 sentences describing the pain customers experience today.
     Use specific, observable language. Quantify if possible. -->

#### Introducing {{PRODUCT_NAME}}

{{SOLUTION_PARAGRAPH}}

<!-- Introduce the product by name. State what it does in one sentence.
     Describe the primary mechanism or capability. -->

#### {{BENEFIT_1_HEADLINE}}

{{BENEFIT_1_PARAGRAPH}}

<!-- One key customer benefit, described in terms of outcome, not feature.
     Example outcome: "Teams close support tickets 40% faster." -->

#### {{BENEFIT_2_HEADLINE}}

{{BENEFIT_2_PARAGRAPH}}

<!-- Second key customer benefit. -->

#### {{BENEFIT_3_HEADLINE}}

{{BENEFIT_3_PARAGRAPH}}

<!-- Third key customer benefit (optional; omit if the product is narrow). -->

#### What Customers Are Saying

> "{{CUSTOMER_QUOTE}}"
>
> — {{CUSTOMER_NAME}}, {{CUSTOMER_TITLE}}, {{CUSTOMER_COMPANY}}

<!-- Write this as a real person would speak — conversational, specific,
     outcome-focused. Avoid superlatives like "amazing" or "revolutionary". -->

#### How to Get Started

{{CALL_TO_ACTION}}

<!-- Where to sign up, when it launches, what the first step is.
     Include pricing tier or access model if known. -->

#### A Note from {{COMPANY_OR_TEAM_NAME}}

> "{{COMPANY_QUOTE}}"
>
> — {{EXECUTIVE_NAME}}, {{EXECUTIVE_TITLE}}

<!-- Strategic framing from a company leader — why this matters to the
     organisation, not just the customer. 1-3 sentences. -->

---

<!-- WORD COUNT TARGET: 400–600 words above this line.
     If you are over 600 words, the concept is not yet clear enough.
     Trim ruthlessly. -->

---

## Internal FAQ

*For leadership, investors, and engineering leadership. Answers must be
specific. "We will figure it out" is not an acceptable answer.*

---

### Market & Opportunity

**Q: Why now? What has changed that makes this the right time to build this?**

{{INTERNAL_FAQ_WHY_NOW}}

**Q: How large is the addressable market, and how do we define our initial beachhead?**

{{INTERNAL_FAQ_MARKET_SIZE}}

**Q: Who are the direct competitors, and why will customers choose us?**

{{INTERNAL_FAQ_COMPETITION}}

---

### Customer Validation

**Q: How do we know this is a real problem customers will pay to solve?**

{{INTERNAL_FAQ_VALIDATION}}

<!-- Cite specific customer conversations, surveys, or data. -->

**Q: Who is our target customer in specific terms (role, company size, industry, context)?**

{{INTERNAL_FAQ_TARGET_CUSTOMER}}

**Q: What does the customer currently do instead? Why is that not good enough?**

{{INTERNAL_FAQ_CURRENT_ALTERNATIVES}}

---

### Business Model

**Q: How does this product make or save money for the company?**

{{INTERNAL_FAQ_BUSINESS_MODEL}}

**Q: What is our pricing model and what drives willingness to pay?**

{{INTERNAL_FAQ_PRICING}}

**Q: What are the unit economics at scale (CAC, LTV, payback period)?**

{{INTERNAL_FAQ_UNIT_ECONOMICS}}
<!-- Mark as OPEN if not yet known. -->

---

### Technical & Feasibility

**Q: What are the two or three hardest technical problems we must solve?**

{{INTERNAL_FAQ_HARD_TECH}}

**Q: What must be true about our infrastructure, data, or integrations for this to work?**

{{INTERNAL_FAQ_PREREQUISITES}}

**Q: What are the top risks of building this, and how do we mitigate them?**

{{INTERNAL_FAQ_BUILD_RISKS}}

---

### Risk & Failure Modes

**Q: What are the top three ways this product fails, and what triggers each?**

{{INTERNAL_FAQ_FAILURE_MODES}}

**Q: What assumptions, if wrong, would kill this product?**

{{INTERNAL_FAQ_CRITICAL_ASSUMPTIONS}}

**Q: What are the key regulatory, legal, or compliance risks?**

{{INTERNAL_FAQ_COMPLIANCE_RISKS}}
<!-- Mark as N/A if genuinely not applicable. -->

---

### Alternatives Considered

**Q: What other approaches did we consider, and why did we choose this one?**

{{INTERNAL_FAQ_ALTERNATIVES}}

---

### Success Metrics

**Q: What does success look like at 30 days post-launch?**

{{INTERNAL_FAQ_SUCCESS_30D}}

**Q: What does success look like at 90 days post-launch?**

{{INTERNAL_FAQ_SUCCESS_90D}}

**Q: What does success look like at 180 days post-launch?**

{{INTERNAL_FAQ_SUCCESS_180D}}

**Q: What is the single most important metric we are optimising for in Year 1?**

{{INTERNAL_FAQ_NORTH_STAR}}

---

### Dependencies & Timeline

**Q: What must exist — teams, systems, data, partners — before we can ship?**

{{INTERNAL_FAQ_DEPENDENCIES}}

**Q: What are the key milestones and rough timeline to an MVP?**

{{INTERNAL_FAQ_MILESTONES}}
<!-- High-level only; story-level breakdown happens in the scrum-master skill. -->

---

### Open Questions

The following questions are explicitly unresolved and must be answered before
the PRD is approved:

1. {{OPEN_QUESTION_1}}
2. {{OPEN_QUESTION_2}}
3. {{OPEN_QUESTION_3}}
<!-- Add more as needed. Do not paper over genuine uncertainty. -->

---

## External FAQ

*For prospective customers, press, and analysts. Tone: clear, confident,
honest. Avoid jargon.*

---

**Q: What is {{PRODUCT_NAME}} and who is it for?**

{{EXTERNAL_FAQ_WHAT_IS_IT}}

**Q: How does it work?**

{{EXTERNAL_FAQ_HOW_IT_WORKS}}

<!-- Describe the experience from the customer's perspective, not the
     technical implementation. 3-5 sentences. -->

**Q: How is this different from {{TOP_COMPETITOR}}?**

{{EXTERNAL_FAQ_DIFFERENTIATION}}

**Q: How much does it cost?**

{{EXTERNAL_FAQ_PRICING}}

**Q: How do I get started?**

{{EXTERNAL_FAQ_GET_STARTED}}

**Q: Is my data secure and private?**

{{EXTERNAL_FAQ_SECURITY_PRIVACY}}

**Q: What integrations or platforms does it support?**

{{EXTERNAL_FAQ_INTEGRATIONS}}

**Q: What support is available?**

{{EXTERNAL_FAQ_SUPPORT}}

**Q: What is on the roadmap?**

{{EXTERNAL_FAQ_ROADMAP}}
<!-- Be appropriately vague — this is public-facing. Commit only to direction,
     not dates or specific features. -->

**Q: {{CUSTOMER_HESITATION_QUESTION}}**

{{EXTERNAL_FAQ_HESITATION_ANSWER}}
<!-- Add the question you most expect a hesitant customer to ask, and answer
     it honestly. -->

---

## Document Metadata

| Field | Value |
|-------|-------|
| Output file | `{{OUTPUT_FOLDER}}/prfaq.md` |
| Decision log | `{{OUTPUT_FOLDER}}/decision-log.md` |
| Next skill | `product-manager` (PRD) or `creative-intelligence` (more research) |
| BMAD track | {{TRACK}} |
| Open questions | {{OPEN_QUESTION_COUNT}} (see Internal FAQ above) |
| Press release word count | {{PR_WORD_COUNT}} |

---

*Generated by the BMAD Planning & Orchestrator plugin — Working-Backwards method.*
*All methodology credit: BMAD Code Organization (https://github.com/bmad-code-org/BMAD-METHOD).*
