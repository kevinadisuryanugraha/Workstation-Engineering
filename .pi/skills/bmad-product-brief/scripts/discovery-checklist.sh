#!/bin/bash

# discovery-checklist.sh
# Prints the full structured discovery question list for product brief facilitation.
# Useful when the analyst wants to run through all questions systematically,
# or when the user prefers a printed reference over a conversational flow.
#
# Usage: ./discovery-checklist.sh
#
# Part of the BMAD Planning & Orchestrator plugin.
# Adapted from bmad-skills/business-analyst/scripts/discovery-checklist.sh.
# Stripped: velocity, burndown, sprint, coverage, lint references.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_question() {
    echo -e "${GREEN}$1${NC}"
}

print_sub() {
    echo -e "${YELLOW}  - $1${NC}"
}

print_note() {
    echo -e "${NC}    → $1${NC}"
}

# ── Header ─────────────────────────────────────────────────────────────────────
clear
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║         PRODUCT DISCOVERY CHECKLIST                       ║${NC}"
echo -e "${BLUE}║         BMAD Planning & Orchestrator                      ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Use this checklist to guide a stakeholder conversation."
echo "Capture answers, then feed them into the product brief."
echo ""
read -p "Press Enter to begin..."

# ── Section 1: Problem Discovery ───────────────────────────────────────────────
print_section "SECTION 1: PROBLEM DISCOVERY"

print_question "Q1: What problem are you trying to solve?"
print_note "Look for: A specific pain point, not a feature request"
print_note "Probe: Ask 'Why?' up to 5 times to find root cause"
echo ""

print_question "Q2: Who experiences this problem?"
print_sub "What are the primary user segments?"
print_sub "What roles or personas are affected?"
print_sub "Are there secondary users who are impacted?"
print_note "Look for: Specific roles, not generic 'users'"
echo ""

print_question "Q3: How do users currently handle this problem?"
print_sub "What workarounds exist today?"
print_sub "What tools or processes do they use now?"
print_sub "What are the limitations of those current solutions?"
print_note "Look for: Existing behaviors and pain points"
echo ""

print_question "Q4: What is the impact if this problem remains unsolved?"
print_sub "What does it cost in time?"
print_sub "What does it cost in money or opportunity?"
print_sub "What frustration or risk does it create?"
print_note "Look for: Quantifiable impact — the business case"
echo ""

print_question "Q5: Why solve this problem now?"
print_sub "What has changed recently?"
print_sub "Why hasn't it been solved before?"
print_sub "What is the urgency or forcing function?"
print_note "Look for: Business case for timing"
echo ""

print_question "Q6: How often does this problem occur?"
print_sub "Daily? Weekly? Monthly?"
print_sub "For what percentage of users?"
print_sub "Under what conditions?"
print_note "Look for: Frequency data to justify priority"
echo ""

read -p "Press Enter to continue to Section 2..."

# ── Section 2: Target Users ────────────────────────────────────────────────────
print_section "SECTION 2: TARGET USERS"

print_question "Q7: Who are the primary target users?"
print_sub "What are their roles and responsibilities?"
print_sub "What are their goals?"
print_sub "What are their key pain points?"
print_sub "What is their technical proficiency?"
print_sub "What is their typical usage pattern?"
print_note "Look for: Enough detail to write a persona"
echo ""

print_question "Q8: What are the must-have user needs?"
print_sub "What do users absolutely require to adopt this?"
print_sub "What would make them switch from their current solution?"
print_note "Look for: Core value proposition"
echo ""

print_question "Q9: What are the should-have user needs?"
print_sub "What would significantly improve their experience?"
print_sub "What competitive features matter to them?"
print_note "Look for: Differentiation opportunities"
echo ""

print_question "Q10: What are the nice-to-have user needs?"
print_sub "What would delight users but is not essential for launch?"
print_note "Look for: Future roadmap ideas"
echo ""

read -p "Press Enter to continue to Section 3..."

# ── Section 3: Proposed Solution ───────────────────────────────────────────────
print_section "SECTION 3: PROPOSED SOLUTION"

print_question "Q11: What is the proposed solution?"
print_sub "What are the key capabilities?"
print_sub "What is the core value proposition?"
print_sub "How does it solve the identified problem?"
print_note "Look for: Clear, concise solution description"
echo ""

print_question "Q12: What makes this solution different?"
print_sub "What is unique about this approach?"
print_sub "How is it better than existing alternatives?"
print_sub "What is the competitive advantage?"
print_note "Look for: Unique value proposition"
echo ""

print_question "Q13: What is the minimum viable solution (MVP)?"
print_sub "What core functionality is needed at launch?"
print_sub "What can be deferred to later phases?"
print_sub "What is the simplest thing that delivers value?"
print_note "Look for: Scope boundaries for the first release"
echo ""

print_question "Q14: What alternatives were considered?"
print_sub "What other approaches were evaluated?"
print_sub "Why was this approach chosen over alternatives?"
print_sub "What trade-offs were made?"
print_note "Look for: Decision rationale (log in decision-log.md)"
echo ""

read -p "Press Enter to continue to Section 4..."

# ── Section 4: Goals & Success Metrics ────────────────────────────────────────
print_section "SECTION 4: GOALS & SUCCESS METRICS"

print_question "Q15: What are the business goals?"
print_sub "What does the business need this to achieve?"
print_sub "How does it align with strategic priorities?"
print_note "Look for: Business objectives beyond user value"
echo ""

print_question "Q16: How will you measure success?"
print_sub "What are the key performance metrics?"
print_sub "What is the current baseline (before launch)?"
print_sub "What is the target (after launch)?"
print_sub "What is the timeline to hit that target?"
print_note "Look for: SMART goals — Specific, Measurable, Achievable, Relevant, Time-bound"
echo ""

print_question "Q17: What does success look like over time?"
print_sub "In 3 months?"
print_sub "In 6 months?"
print_sub "In 12 months?"
print_note "Look for: Vision and phased milestones"
echo ""

print_question "Q18: What constraints must the solution respect?"
print_sub "Regulatory or compliance requirements?"
print_sub "Platform or technology constraints?"
print_sub "Budget or team size constraints?"
print_sub "Timeline or deadline constraints?"
print_note "Look for: Non-negotiable guardrails"
echo ""

read -p "Press Enter to continue to Section 5..."

# ── Section 5: Market & Competition ───────────────────────────────────────────
print_section "SECTION 5: MARKET & COMPETITION"

print_question "Q19: What is the market context?"
print_sub "What is the approximate market size?"
print_sub "What are the key market trends?"
print_sub "What market segment is being targeted?"
print_note "Look for: Market opportunity validation"
echo ""

print_question "Q20: Who are the main competitors?"
print_sub "What are their strengths and weaknesses?"
print_sub "How are they priced?"
print_sub "What is their market position?"
print_note "Look for: At least 3 competitors analyzed"
echo ""

print_question "Q21: What are your competitive advantages?"
print_sub "What do you do better than competitors?"
print_sub "What gaps exist in the market you can fill?"
print_sub "What gaps do you need to close?"
print_note "Look for: Differentiation strategy"
echo ""

read -p "Press Enter to continue to Section 6..."

# ── Section 6: Risks & Assumptions ────────────────────────────────────────────
print_section "SECTION 6: RISKS & ASSUMPTIONS"

print_question "Q22: What are the high-priority risks?"
print_sub "What could go wrong?"
print_sub "What is the probability and impact of each?"
print_sub "What is the mitigation strategy?"
print_sub "Who owns each risk?"
print_note "Look for: Top 3–5 risks documented"
echo ""

print_question "Q23: What critical assumptions are you making?"
print_sub "What do you assume about users and their behavior?"
print_sub "What do you assume about the technology?"
print_sub "What do you assume about the market?"
print_sub "How will you validate these assumptions?"
print_note "Look for: Assumptions that, if wrong, would kill the project"
echo ""

read -p "Press Enter to continue to Section 7..."

# ── Section 7: Dependencies & Next Steps ──────────────────────────────────────
print_section "SECTION 7: DEPENDENCIES & NEXT STEPS"

print_question "Q24: What are the internal dependencies?"
print_sub "What teams or systems must be involved?"
print_sub "What approvals are required?"
print_note "Look for: Dependencies that could delay delivery"
echo ""

print_question "Q25: What are the external dependencies?"
print_sub "What third-party services, APIs, or partners are needed?"
print_sub "What are the current blockers and their resolution plans?"
print_note "Look for: External risks outside your control"
echo ""

print_question "Q26: What are the immediate next steps?"
print_sub "What needs to happen first?"
print_sub "Who is responsible for each action?"
print_sub "Who should this be handed off to? (Product Manager / UX Designer / Architect)"
print_note "Look for: Clear handoff plan"
echo ""

# ── Completion ─────────────────────────────────────────────────────────────────
print_section "DISCOVERY CHECKLIST COMPLETE"

echo -e "${GREEN}You have completed the discovery checklist.${NC}"
echo ""
echo "Next steps:"
echo "  1. Review your notes and fill any gaps"
echo "  2. Populate the product brief template"
echo "  3. Validate with: scripts/validate-brief.sh bmad-output/product-brief-<slug>.md"
echo "  4. Hand off to the Product Manager for PRD creation"
echo ""
echo -e "${YELLOW}Template:${NC}"
echo "  \${CLAUDE_PLUGIN_ROOT}/skills/bmad-product-brief/templates/product-brief.template.md"
echo ""
echo -e "${GREEN}Good discovering!${NC}"
echo ""
