#!/bin/bash
# BMAD Planning & Orchestrator — Track Selector
# Prints the three scale-adaptive tracks with guidance and a suggested default.
# Tracks are chosen by PLANNING NEED. The heuristic only SUGGESTS — the user confirms.
# No numbered levels. No story points / velocity / burndown.

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

STORIES=""
TEAMS=""        # one | many
COMPLIANCE=""   # yes | no

while [[ $# -gt 0 ]]; do
  case $1 in
    --stories)    STORIES="$2"; shift 2 ;;
    --teams)      TEAMS="$2"; shift 2 ;;
    --compliance) COMPLIANCE="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--stories <N>] [--teams one|many] [--compliance yes|no]"
      echo ""
      echo "Prints the three BMAD tracks with guidance and a suggested default."
      echo "All flags are optional; provide what you know and a heuristic suggests a track."
      exit 0 ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

echo ""
echo -e "${BOLD}BMAD scale-adaptive TRACKS${NC} (choose by planning need; story count is a soft signal)"
echo ""

echo -e "${GREEN}${BOLD}Quick Flow${NC}   — 1-15 stories"
echo -e "   Artifacts: ${BLUE}tech-spec only${NC}"
echo -e "   For: a single feature / focused enhancement, one builder, low coordination."
echo ""

echo -e "${GREEN}${BOLD}BMad Method${NC}  — 10-50+ stories"
echo -e "   Artifacts: ${BLUE}PRD + Architecture${NC} (+ optional UX)"
echo -e "   For: a real product slice, multiple epics, decisions worth writing down."
echo ""

echo -e "${GREEN}${BOLD}Enterprise${NC}   — 30+ stories"
echo -e "   Artifacts: ${BLUE}PRD + Architecture + Security planning + DevOps planning${NC}"
echo -e "   For: compliance/regulatory scope, multiple teams, infra concerns to plan up front."
echo ""

# --- Heuristic suggestion ---------------------------------------------------
SUGGESTION="quick-flow"
REASON="default for small, focused, single-builder work"

is_num() { [[ "$1" =~ ^[0-9]+$ ]]; }

if [[ "$COMPLIANCE" == "yes" ]] || [[ "$TEAMS" == "many" ]]; then
  SUGGESTION="enterprise"
  REASON="compliance/infra requirements or multiple teams need security + DevOps planning"
elif is_num "$STORIES" && [ "$STORIES" -ge 30 ]; then
  SUGGESTION="enterprise"
  REASON="~30+ stories is enterprise-scale coordination"
elif is_num "$STORIES" && [ "$STORIES" -ge 10 ]; then
  SUGGESTION="bmad-method"
  REASON="~10+ stories warrants a PRD + Architecture"
elif is_num "$STORIES" && [ "$STORIES" -ge 1 ]; then
  SUGGESTION="quick-flow"
  REASON="small story count; a tech-spec is enough"
fi

echo -e "${YELLOW}${BOLD}Suggested default:${NC} ${GREEN}${SUGGESTION}${NC}"
echo -e "   ${YELLOW}Why:${NC} ${REASON}"
echo ""
echo -e "${BLUE}This is a suggestion only — confirm with the user, who may override.${NC}"
echo -e "${BLUE}When unsure between two tracks, prefer the lighter one (promote later if needed).${NC}"
echo ""
echo -e "SUGGESTED_TRACK=${SUGGESTION}"
