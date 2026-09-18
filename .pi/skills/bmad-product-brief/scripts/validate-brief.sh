#!/bin/bash

# validate-brief.sh
# Validates that a product brief has all required sections and quality signals.
# Usage: ./validate-brief.sh <product-brief-file>
#
# Part of the BMAD Planning & Orchestrator plugin.
# Adapted from bmad-skills/business-analyst/scripts/validate-brief.sh.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Required sections (matches product-brief.template.md)
declare -a REQUIRED_SECTIONS=(
    "Problem Statement"
    "Target Users"
    "Proposed Solution"
    "Success Metrics"
    "Market"
    "Risks"
    "Dependencies"
    "Next Steps"
)

# ── Argument check ─────────────────────────────────────────────────────────────
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo "Usage: $0 <product-brief-file>"
    echo ""
    echo "Example: $0 bmad-output/product-brief-my-project-2026-06-19.md"
    exit 1
fi

BRIEF_FILE="$1"

if [ ! -f "$BRIEF_FILE" ]; then
    echo -e "${RED}Error: File not found: $BRIEF_FILE${NC}"
    exit 1
fi

# ── Header ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║         PRODUCT BRIEF VALIDATION                          ║${NC}"
echo -e "${BLUE}║         BMAD Planning & Orchestrator                      ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Validating: $BRIEF_FILE"
echo ""

# ── Section checks ─────────────────────────────────────────────────────────────
TOTAL_SECTIONS=${#REQUIRED_SECTIONS[@]}
FOUND_SECTIONS=0
MISSING_SECTIONS=()

echo -e "${BLUE}Checking required sections...${NC}"
echo ""

for section in "${REQUIRED_SECTIONS[@]}"; do
    if grep -qi "^#.*${section}" "$BRIEF_FILE" || \
       grep -qi "^## .*${section}" "$BRIEF_FILE" || \
       grep -qi "^### .*${section}" "$BRIEF_FILE"; then
        echo -e "${GREEN}✓${NC} $section"
        ((FOUND_SECTIONS++))
    else
        echo -e "${RED}✗${NC} $section ${YELLOW}(MISSING)${NC}"
        MISSING_SECTIONS+=("$section")
    fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

COMPLETENESS=$((FOUND_SECTIONS * 100 / TOTAL_SECTIONS))
echo "Sections found: $FOUND_SECTIONS / $TOTAL_SECTIONS ($COMPLETENESS%)"
echo ""

# ── Placeholder check ──────────────────────────────────────────────────────────
echo -e "${BLUE}Checking for unfilled placeholders...${NC}"
echo ""

PLACEHOLDER_COUNT=$(grep -o "{{[A-Z_]*}}" "$BRIEF_FILE" 2>/dev/null | wc -l | tr -d ' ' || echo "0")

if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC}  Found $PLACEHOLDER_COUNT placeholder(s) that need to be filled"
    echo ""
    echo "Placeholders found:"
    grep -n "{{[A-Z_]*}}" "$BRIEF_FILE" 2>/dev/null | head -10 || true
    if [ "$PLACEHOLDER_COUNT" -gt 10 ]; then
        echo "  ... and $((PLACEHOLDER_COUNT - 10)) more"
    fi
else
    echo -e "${GREEN}✓${NC} No unfilled placeholders found"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Quality signals ────────────────────────────────────────────────────────────
echo -e "${BLUE}Checking content quality...${NC}"
echo ""

LINE_COUNT=$(wc -l < "$BRIEF_FILE")
if [ "$LINE_COUNT" -lt 80 ]; then
    echo -e "${YELLOW}⚠${NC}  Brief is short ($LINE_COUNT lines). Consider adding more detail."
else
    echo -e "${GREEN}✓${NC} Brief has sufficient length ($LINE_COUNT lines)"
fi

if grep -q "[0-9]\+%" "$BRIEF_FILE" || \
   grep -q "[0-9]\+ users" "$BRIEF_FILE" || \
   grep -q "[0-9]\+ days\|weeks\|months" "$BRIEF_FILE"; then
    echo -e "${GREEN}✓${NC} Brief includes quantifiable metrics"
else
    echo -e "${YELLOW}⚠${NC}  Add quantifiable metrics (%, user counts, timeframes)"
fi

if grep -qi "risk\|mitigation\|assumption" "$BRIEF_FILE"; then
    echo -e "${GREEN}✓${NC} Brief addresses risks and assumptions"
else
    echo -e "${YELLOW}⚠${NC}  Brief should include risk analysis and key assumptions"
fi

if grep -qi "mvp\|minimum viable\|phase 1\|deferred" "$BRIEF_FILE"; then
    echo -e "${GREEN}✓${NC} Brief distinguishes MVP scope from future scope"
else
    echo -e "${YELLOW}⚠${NC}  Clarify which features are MVP vs. future"
fi

if grep -qi "stakeholder\|interview\|consulted\|persona" "$BRIEF_FILE"; then
    echo -e "${GREEN}✓${NC} Brief references user research or stakeholders"
else
    echo -e "${YELLOW}⚠${NC}  Document stakeholders consulted or user research conducted"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Final assessment ───────────────────────────────────────────────────────────
echo -e "${BLUE}FINAL ASSESSMENT${NC}"
echo ""

if [ "$COMPLETENESS" -eq 100 ] && [ "$PLACEHOLDER_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ Product brief is COMPLETE and ready for handoff.${NC}"
    echo ""
    echo "Recommended next step:"
    echo "  Hand off to the Product Manager to create the PRD."
    echo ""
    exit 0
elif [ "$COMPLETENESS" -ge 75 ]; then
    echo -e "${YELLOW}⚠ Product brief is MOSTLY COMPLETE ($COMPLETENESS%).${NC}"
    echo ""
    if [ ${#MISSING_SECTIONS[@]} -gt 0 ]; then
        echo "Missing sections:"
        for section in "${MISSING_SECTIONS[@]}"; do
            echo "  - $section"
        done
        echo ""
    fi
    [ "$PLACEHOLDER_COUNT" -gt 0 ] && echo "Fill $PLACEHOLDER_COUNT remaining placeholder(s)."
    echo ""
    echo "Complete these items, then re-run validation before handoff."
    echo ""
    exit 1
else
    echo -e "${RED}✗ Product brief is INCOMPLETE ($COMPLETENESS%).${NC}"
    echo ""
    echo "Missing sections:"
    for section in "${MISSING_SECTIONS[@]}"; do
        echo "  - $section"
    done
    echo ""
    [ "$PLACEHOLDER_COUNT" -gt 0 ] && echo "Fill $PLACEHOLDER_COUNT placeholder(s)."
    echo ""
    echo "Resume the guided discovery conversation or use the checklist:"
    echo "  scripts/discovery-checklist.sh"
    echo ""
    exit 1
fi
