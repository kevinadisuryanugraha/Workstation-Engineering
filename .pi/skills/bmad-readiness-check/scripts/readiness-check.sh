#!/bin/bash
# readiness-check.sh
# BMAD Planning & Orchestrator — Readiness Check pre-flight
#
# Checks that expected planning artifacts exist and prints cross-reference
# counts. Returns a PASS / CONCERNS / FAIL verdict.
#
# Usage:
#   readiness-check.sh [output-folder]
#
# Arguments:
#   output-folder   Root folder containing BMAD planning artifacts.
#                   Defaults to "bmad-output" in the current directory.
#
# Exit codes:
#   0  PASS
#   1  CONCERNS (artifacts present but cross-reference counts are low)
#   2  FAIL (required artifacts missing or severe coverage gap)

set -euo pipefail

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ── Argument / defaults ────────────────────────────────────────────────────────
OUTPUT_DIR="${1:-bmad-output}"

if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${RED}[FAIL]${NC} Output folder not found: $OUTPUT_DIR"
    echo "       Run BMAD planning first, or pass the correct folder as an argument."
    exit 2
fi

echo ""
echo -e "${BOLD}================================================================================${NC}"
echo -e "${BOLD}  BMAD Readiness Check — Pre-flight Artifact Scan${NC}"
echo -e "${BOLD}================================================================================${NC}"
echo ""
echo "Scanning: $OUTPUT_DIR"
echo ""

# ── Artifact discovery ─────────────────────────────────────────────────────────
# Priority: PRD > tech-spec.  Architecture is always required.
PRD_FILE=""
TECHSPEC_FILE=""
ARCH_FILE=""
EPICS_FILE=""
STORIES_DIR=""

# PRD
PRD_FILE=$(find "$OUTPUT_DIR" -maxdepth 2 -type f -name "prd*.md" | sort | head -1)
# Tech-spec fallback
if [ -z "$PRD_FILE" ]; then
    TECHSPEC_FILE=$(find "$OUTPUT_DIR" -maxdepth 2 -type f \( -name "tech-spec*.md" -o -name "techspec*.md" \) | sort | head -1)
fi
# Architecture
ARCH_FILE=$(find "$OUTPUT_DIR" -maxdepth 2 -type f -name "architecture*.md" | sort | head -1)
# Epics (optional)
EPICS_FILE=$(find "$OUTPUT_DIR" -maxdepth 2 -type f \( -name "epics*.md" -o -name "epic*.md" \) | sort | head -1)
# Stories dir (optional)
if [ -d "$OUTPUT_DIR/stories" ]; then
    STORIES_DIR="$OUTPUT_DIR/stories"
fi

# ── Artifact presence report ───────────────────────────────────────────────────
MISSING_REQUIRED=0

echo -e "${BLUE}1. Required Artifacts${NC}"
echo "---------------------"

REQ_DOC=""
if [ -n "$PRD_FILE" ]; then
    echo -e "${GREEN}[FOUND]${NC}  PRD                : $PRD_FILE"
    REQ_DOC="$PRD_FILE"
elif [ -n "$TECHSPEC_FILE" ]; then
    echo -e "${GREEN}[FOUND]${NC}  Tech-spec          : $TECHSPEC_FILE"
    REQ_DOC="$TECHSPEC_FILE"
else
    echo -e "${RED}[MISSING]${NC} Requirements doc  : no prd*.md or tech-spec*.md found in $OUTPUT_DIR"
    MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
fi

if [ -n "$ARCH_FILE" ]; then
    echo -e "${GREEN}[FOUND]${NC}  Architecture       : $ARCH_FILE"
else
    echo -e "${RED}[MISSING]${NC} Architecture doc  : no architecture*.md found in $OUTPUT_DIR"
    MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
fi
echo ""

echo -e "${BLUE}2. Optional Artifacts${NC}"
echo "---------------------"
if [ -n "$EPICS_FILE" ]; then
    echo -e "${GREEN}[FOUND]${NC}  Epics              : $EPICS_FILE"
else
    echo -e "${YELLOW}[ABSENT]${NC} Epics              : not found (OK for Quick Flow)"
fi

if [ -n "$STORIES_DIR" ]; then
    STORY_COUNT=$(find "$STORIES_DIR" -maxdepth 1 -type f -name "*.story.md" | wc -l | tr -d ' ')
    echo -e "${GREEN}[FOUND]${NC}  Stories            : $STORIES_DIR ($STORY_COUNT story files)"
else
    STORY_COUNT=0
    echo -e "${YELLOW}[ABSENT]${NC} Stories dir        : not found (expected after epic/story decomposition)"
fi
echo ""

# ── Early exit if required artifacts are missing ───────────────────────────────
if [ "$MISSING_REQUIRED" -gt 0 ]; then
    echo -e "${BOLD}================================================================================${NC}"
    echo -e "${RED}${BOLD}  PRE-FLIGHT VERDICT: FAIL${NC}"
    echo -e "${BOLD}================================================================================${NC}"
    echo ""
    echo "  $MISSING_REQUIRED required artifact(s) are missing."
    echo "  Complete the following before re-running readiness check:"
    [ -z "$PRD_FILE" ] && [ -z "$TECHSPEC_FILE" ] && echo "    - Create a PRD (/bmad-planning-orchestrator:bmad-prd) or tech-spec"
    [ -z "$ARCH_FILE" ] && echo "    - Create an Architecture document (/bmad-planning-orchestrator:bmad-architecture)"
    echo ""
    exit 2
fi

# ── Cross-reference counts ─────────────────────────────────────────────────────
echo -e "${BLUE}3. Cross-Reference Counts${NC}"
echo "-------------------------"

# Count FR labels in requirements doc
FR_COUNT=$(grep -oiE 'FR-[0-9]+' "$REQ_DOC" 2>/dev/null | sort -u | wc -l | tr -d ' ')
# Count FR references in architecture
ARCH_FR_REFS=$(grep -oiE 'FR-[0-9]+' "$ARCH_FILE" 2>/dev/null | sort -u | wc -l | tr -d ' ')

# Count NFR labels in requirements doc
NFR_COUNT=$(grep -oiE 'NFR-[0-9]+' "$REQ_DOC" 2>/dev/null | sort -u | wc -l | tr -d ' ')
# Count NFR references in architecture
ARCH_NFR_REFS=$(grep -oiE 'NFR-[0-9]+' "$ARCH_FILE" 2>/dev/null | sort -u | wc -l | tr -d ' ')

# If no labelled FRs, estimate requirement count by bullet-point proxy
if [ "$FR_COUNT" -eq 0 ]; then
    FR_COUNT=$(grep -cE '^\s*[-*] |^#+.*[Rr]equirement' "$REQ_DOC" 2>/dev/null || echo 0)
    ARCH_FR_REFS="(unlabelled — manual review needed)"
    UNLABELLED_FR=true
else
    UNLABELLED_FR=false
fi

echo "  Requirements doc  : $REQ_DOC"
echo "  Architecture doc  : $ARCH_FILE"
echo ""
if [ "$UNLABELLED_FR" = true ]; then
    echo "  FR labels (FR-NNN) : none found — requirements appear unlabelled"
    echo "  Estimated req items: $FR_COUNT (bullet/heading proxy)"
    echo "  Arch FR refs       : $ARCH_FR_REFS"
else
    echo "  FR labels in req   : $FR_COUNT"
    echo "  FR refs in arch    : $ARCH_FR_REFS"
fi

if [ "$NFR_COUNT" -gt 0 ]; then
    echo "  NFR labels in req  : $NFR_COUNT"
    echo "  NFR refs in arch   : $ARCH_NFR_REFS"
else
    echo "  NFR labels (NFR-NNN): none found — NFR coverage requires manual review"
fi

if [ -n "$EPICS_FILE" ]; then
    EPIC_COUNT=$(grep -cE '^##? Epic|^##? [0-9]+\.' "$EPICS_FILE" 2>/dev/null || echo 0)
    echo "  Epics in epics doc : $EPIC_COUNT"
fi
echo ""

# ── Architecture quality spot-check ───────────────────────────────────────────
echo -e "${BLUE}4. Architecture Quality Spot-Check${NC}"
echo "----------------------------------"

ARCH_PASS=0
ARCH_TOTAL=0

arch_check() {
    local label="$1"
    local pattern="$2"
    ARCH_TOTAL=$((ARCH_TOTAL + 1))
    if grep -qiE "$pattern" "$ARCH_FILE" 2>/dev/null; then
        echo -e "  ${GREEN}[PASS]${NC} $label"
        ARCH_PASS=$((ARCH_PASS + 1))
    else
        echo -e "  ${RED}[FAIL]${NC} $label"
    fi
}

arch_check "Architectural pattern stated"         "monolith|microservice|serverless|layered|event.driven|hexagonal|cqrs"
arch_check "Components / modules defined"          "component|module|service|layer"
arch_check "API or service contracts described"    "api|endpoint|rest|graphql|grpc|contract|interface"
arch_check "Data model or entities specified"      "entity|entities|schema|table|model|data model"
arch_check "Technology stack present"             "tech stack|technology stack|framework|language|database"
arch_check "Technology choices justified"         "rationale|reason|because|chosen|selected|justify|trade"
arch_check "Security strategy addressed"          "authentication|authorization|auth|encryption|security"
arch_check "Scalability or performance addressed" "scalability|scale|performance|caching|latency|throughput"
arch_check "Trade-offs documented"                "trade.off|tradeoff|pros|cons|decision|alternative"
arch_check "Assumptions or constraints listed"    "assumption|constraint|limitation|note"

echo ""
ARCH_SCORE=0
if [ "$ARCH_TOTAL" -gt 0 ]; then
    ARCH_SCORE=$((ARCH_PASS * 100 / ARCH_TOTAL))
fi
echo "  Quality score: $ARCH_PASS / $ARCH_TOTAL checks passed ($ARCH_SCORE %)"
echo ""

# ── Compute FR coverage percentage (labelled FRs only) ─────────────────────────
FR_COVERAGE=0
if [ "$UNLABELLED_FR" = false ] && [ "$FR_COUNT" -gt 0 ]; then
    FR_COVERAGE=$((ARCH_FR_REFS * 100 / FR_COUNT))
fi

NFR_COVERAGE=0
if [ "$NFR_COUNT" -gt 0 ]; then
    NFR_COVERAGE=$((ARCH_NFR_REFS * 100 / NFR_COUNT))
fi

# ── Verdict logic ──────────────────────────────────────────────────────────────
# PASS   : FR≥90, NFR≥90 (or unlabelled), quality≥80, no blockers
# CONCERNS: at least one criterion in 80-89 range or quality 70-79
# FAIL   : any criterion below 80 (or quality below 70)

VERDICT="PASS"
EXIT_CODE=0
CONCERNS_LIST=()
FAIL_LIST=()

if [ "$UNLABELLED_FR" = false ]; then
    if [ "$FR_COVERAGE" -lt 80 ]; then
        FAIL_LIST+=("FR coverage ${FR_COVERAGE}% is below the 80% minimum (${ARCH_FR_REFS}/${FR_COUNT} FRs referenced in architecture)")
        VERDICT="FAIL"
    elif [ "$FR_COVERAGE" -lt 90 ]; then
        CONCERNS_LIST+=("FR coverage ${FR_COVERAGE}% is below the 90% target (${ARCH_FR_REFS}/${FR_COUNT} FRs referenced in architecture)")
        [ "$VERDICT" = "PASS" ] && VERDICT="CONCERNS"
    fi
fi

if [ "$NFR_COUNT" -gt 0 ]; then
    if [ "$NFR_COVERAGE" -lt 80 ]; then
        FAIL_LIST+=("NFR coverage ${NFR_COVERAGE}% is below the 80% minimum (${ARCH_NFR_REFS}/${NFR_COUNT} NFRs referenced in architecture)")
        VERDICT="FAIL"
    elif [ "$NFR_COVERAGE" -lt 90 ]; then
        CONCERNS_LIST+=("NFR coverage ${NFR_COVERAGE}% is below the 90% target (${ARCH_NFR_REFS}/${NFR_COUNT} NFRs referenced in architecture)")
        [ "$VERDICT" = "PASS" ] && VERDICT="CONCERNS"
    fi
fi

if [ "$ARCH_SCORE" -lt 70 ]; then
    FAIL_LIST+=("Architecture quality score ${ARCH_SCORE}% is below the 70% minimum")
    VERDICT="FAIL"
elif [ "$ARCH_SCORE" -lt 80 ]; then
    CONCERNS_LIST+=("Architecture quality score ${ARCH_SCORE}% is below the 80% target")
    [ "$VERDICT" = "PASS" ] && VERDICT="CONCERNS"
fi

# Set exit code
case "$VERDICT" in
    PASS)     EXIT_CODE=0 ;;
    CONCERNS) EXIT_CODE=1 ;;
    FAIL)     EXIT_CODE=2 ;;
esac

# ── Print verdict banner ───────────────────────────────────────────────────────
echo -e "${BOLD}================================================================================${NC}"
case "$VERDICT" in
    PASS)
        echo -e "${GREEN}${BOLD}  PRE-FLIGHT VERDICT: PASS${NC}"
        ;;
    CONCERNS)
        echo -e "${YELLOW}${BOLD}  PRE-FLIGHT VERDICT: CONCERNS${NC}"
        ;;
    FAIL)
        echo -e "${RED}${BOLD}  PRE-FLIGHT VERDICT: FAIL${NC}"
        ;;
esac
echo -e "${BOLD}================================================================================${NC}"
echo ""

if [ "${#FAIL_LIST[@]}" -gt 0 ]; then
    echo -e "${RED}Blockers (must fix before proceeding):${NC}"
    for item in "${FAIL_LIST[@]}"; do
        echo "  - $item"
    done
    echo ""
fi

if [ "${#CONCERNS_LIST[@]}" -gt 0 ]; then
    echo -e "${YELLOW}Concerns (address during story refinement):${NC}"
    for item in "${CONCERNS_LIST[@]}"; do
        echo "  - $item"
    done
    echo ""
fi

if [ "$VERDICT" = "PASS" ]; then
    echo -e "${GREEN}All pre-flight checks passed. Proceed to in-depth cross-reference analysis.${NC}"
    echo ""
fi

# Print machine-readable summary line for the skill to parse
echo "SUMMARY: verdict=$VERDICT fr_coverage=${FR_COVERAGE}pct nfr_coverage=${NFR_COVERAGE}pct arch_quality=${ARCH_SCORE}pct"
echo "ARTIFACTS: req=$REQ_DOC arch=$ARCH_FILE epics=${EPICS_FILE:-none} stories_dir=${STORIES_DIR:-none} story_count=$STORY_COUNT"
echo ""

exit "$EXIT_CODE"
