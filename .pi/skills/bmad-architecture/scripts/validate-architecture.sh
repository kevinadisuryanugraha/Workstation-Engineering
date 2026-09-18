#!/bin/bash
# Architecture Document Validation (BMAD Planning & Orchestrator)
# Validates architecture.md for completeness, ADR presence, and NFR coverage.
# PLANNING ONLY — this checks a document. It does not build, test, or lint code.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -eq 0 ]; then
    echo "Usage: $0 <path-to-architecture-document>"
    echo ""
    echo "Example:"
    echo "  $0 bmad-output/architecture.md"
    exit 1
fi

ARCH_DOC="$1"

if [ ! -f "$ARCH_DOC" ]; then
    echo -e "${RED}Error: File not found: $ARCH_DOC${NC}"
    exit 1
fi

echo "================================================================================"
echo "  Architecture Document Validation"
echo "================================================================================"
echo ""
echo "Document: $ARCH_DOC"
echo ""
echo "================================================================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

check_section() {
    local section_name="$1"
    local search_pattern="$2"
    local required="$3"

    if grep -qi "$search_pattern" "$ARCH_DOC"; then
        echo -e "${GREEN}[PASS]${NC} $section_name"
        PASS_COUNT=$((PASS_COUNT+1))
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}[FAIL]${NC} $section_name - MISSING"
            FAIL_COUNT=$((FAIL_COUNT+1))
        else
            echo -e "${YELLOW}[WARN]${NC} $section_name - Not found (optional)"
            WARN_COUNT=$((WARN_COUNT+1))
            return 0
        fi
        return 1
    fi
}

check_keyword() {
    local description="$1"
    local keyword="$2"
    local required="$3"

    if grep -qi "$keyword" "$ARCH_DOC"; then
        echo -e "${GREEN}[PASS]${NC} $description"
        PASS_COUNT=$((PASS_COUNT+1))
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}[FAIL]${NC} $description - MISSING"
            FAIL_COUNT=$((FAIL_COUNT+1))
            return 1
        else
            echo -e "${YELLOW}[WARN]${NC} $description - Not found"
            WARN_COUNT=$((WARN_COUNT+1))
            return 0
        fi
    fi
}

echo -e "${BLUE}1. Required Sections${NC}"
echo "-------------------"
check_section "System Overview" "system overview\|overview\|introduction" "required"
check_section "Architecture Pattern" "architecture pattern\|architectural pattern\|pattern" "required"
check_section "Component Design" "component\|components\|modules" "required"
check_section "Data Model" "data model\|database\|data schema" "required"
check_section "API Specifications" "api\|endpoints\|interface" "required"
check_section "NFR / FR Coverage Matrix" "coverage matrix\|nfr mapping\|requirements mapping\|non-functional requirement" "required"
check_section "Technology Stack" "technology stack\|tech stack\|technologies" "required"
check_section "Trade-off Analysis" "trade-off\|tradeoff\|decisions" "required"
echo ""

echo -e "${BLUE}2. Architecture Decision Records (ADRs)${NC}"
echo "----------------------------------------"
# ADRs are the core artifact of this skill — at least one must be present.
ADR_COUNT=$(grep -ciE "ADR-[0-9]+|architecture decision record" "$ARCH_DOC" || true)
if [ "$ADR_COUNT" -gt 0 ]; then
    echo -e "${GREEN}[PASS]${NC} ADR(s) present ($ADR_COUNT reference(s) found)"
    PASS_COUNT=$((PASS_COUNT+1))
else
    echo -e "${RED}[FAIL]${NC} No Architecture Decision Records (ADR-00N) found"
    FAIL_COUNT=$((FAIL_COUNT+1))
fi
check_keyword "ADRs include Context" "context" "required"
check_keyword "ADRs include Decision" "decision" "required"
check_keyword "ADRs include Consequences" "consequence\|implication\|locked" "required"

# Cross-cutting concerns that prevent semantic conflict across parallel agents.
echo ""
echo -e "${BLUE}3. Cross-Cutting Decisions (semantic conflict prevention)${NC}"
echo "---------------------------------------------------------"
check_keyword "API style decided (REST/GraphQL/gRPC)" "rest\|restful\|graphql\|grpc" "required"
check_keyword "Data model decided" "entity\|entities\|table\|schema\|data model" "required"
check_keyword "AuthN/AuthZ approach decided" "auth\|authentication\|authorization\|rbac\|oauth\|jwt" "required"
check_keyword "Naming/conventions stated" "naming\|convention\|casing" "optional"
check_keyword "State management addressed" "state management\|state\|store" "optional"
echo ""

echo -e "${BLUE}4. NFR Coverage${NC}"
echo "---------------"
check_keyword "Performance NFRs addressed" "performance\|caching\|response time\|latency" "required"
check_keyword "Scalability NFRs addressed" "scalability\|scaling\|horizontal\|load" "required"
check_keyword "Security NFRs addressed" "security\|authentication\|authorization\|encryption" "required"
check_keyword "Reliability NFRs addressed" "reliability\|redundancy\|failover\|backup" "optional"
check_keyword "Availability NFRs addressed" "availability\|uptime\|monitoring" "optional"
check_keyword "Maintainability addressed" "maintainability\|module boundaries\|documentation" "optional"
echo ""

echo -e "${BLUE}5. Technical Completeness${NC}"
echo "-------------------------"
check_keyword "Technology choices justified" "rationale\|reason\|because\|chosen\|selected" "required"
check_keyword "Component interfaces defined" "interface\|api\|contract\|endpoint" "required"
check_keyword "Data entities specified" "entity\|entities\|table\|schema\|model" "required"
check_keyword "Trade-offs documented" "trade-off\|tradeoff\|cost\|benefit" "required"
check_keyword "Deployment described" "deployment\|deploy\|infrastructure\|hosting" "optional"
check_keyword "Future considerations" "future\|growth\|evolution\|revisit" "optional"
echo ""

echo -e "${BLUE}6. Architectural Pattern Identified${NC}"
echo "------------------------------------"
PATTERN_FOUND=0
for p in "monolith" "microservice" "serverless" "layered\|layer"; do
    if grep -qi "$p" "$ARCH_DOC"; then PATTERN_FOUND=1; fi
done
if [ $PATTERN_FOUND -eq 1 ]; then
    echo -e "${GREEN}[PASS]${NC} Architectural pattern identified"
    PASS_COUNT=$((PASS_COUNT+1))
else
    echo -e "${RED}[FAIL]${NC} No architectural pattern clearly identified"
    FAIL_COUNT=$((FAIL_COUNT+1))
fi
echo ""

TOTAL_CHECKS=$((PASS_COUNT + FAIL_COUNT))
if [ $TOTAL_CHECKS -gt 0 ]; then
    PASS_RATE=$((PASS_COUNT * 100 / TOTAL_CHECKS))
else
    PASS_RATE=0
fi

echo "================================================================================"
echo "  Validation Results"
echo "================================================================================"
echo ""
echo -e "Passed:   ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed:   ${RED}$FAIL_COUNT${NC}"
echo -e "Warnings: ${YELLOW}$WARN_COUNT${NC}"
echo ""
echo -e "Pass Rate: ${BLUE}${PASS_RATE}%${NC} (${PASS_COUNT}/${TOTAL_CHECKS})"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}================================================================================"
    echo "  VALIDATION PASSED"
    echo -e "================================================================================${NC}"
    echo ""
    echo "Architecture document meets completeness requirements and is ready for handoff"
    echo "to bmad-scrum-master for sprint planning."
    if [ $WARN_COUNT -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Note: $WARN_COUNT optional items missing. Consider adding for completeness.${NC}"
    fi
    exit 0
else
    echo -e "${RED}================================================================================"
    echo "  VALIDATION FAILED"
    echo -e "================================================================================${NC}"
    echo ""
    echo "Architecture document is incomplete. Address the failed checks above."
    echo ""
    echo "Common fixes:"
    echo "  1. Ensure all required sections are present with clear headings"
    echo "  2. Record cross-cutting choices as ADRs (ADR-00N: Context/Decision/Consequences)"
    echo "  3. Provide an FR/NFR coverage matrix mapping every requirement to a decision"
    echo "  4. Include technology rationale tied to architectural drivers"
    echo "  5. Document trade-offs and the chosen architectural pattern"
    echo ""
    echo "Templates:"
    echo '  ${CLAUDE_PLUGIN_ROOT}/skills/bmad-architecture/templates/architecture.template.md'
    echo '  ${CLAUDE_PLUGIN_ROOT}/skills/bmad-architecture/templates/adr.template.md'
    echo ""
    exit 1
fi
