#!/bin/bash
# BMAD Next-Step Recommender
# Calls detect-state.sh, maps the detected state -> the single next skill to run.
# ROUTER ONLY — produces no planning documents, runs no tests/builds/lints.
#
# Usage: recommend-next.sh [output-folder]   (default: bmad-output)

set -u

OUT="${1:-bmad-output}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -t 1 ]; then
  GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; GRAY='\033[0;37m'; NC='\033[0m'
else
  GREEN=''; YELLOW=''; BLUE=''; GRAY=''; NC=''
fi

# Pull the machine-readable tail from the detector
STATE="$(bash "$SCRIPT_DIR/detect-state.sh" "$OUT" 2>/dev/null | grep -E '^[A-Z_]+=' )"
get() { echo "$STATE" | grep -E "^$1=" | head -1 | cut -d= -f2-; }

PHASE="$(get PHASE)"
TRACK="$(get TRACK)"
HAS_CTX="$(get HAS_CTX)"
HAS_PRD="$(get HAS_PRD)"
HAS_SPEC="$(get HAS_SPEC)"
HAS_EPICS="$(get HAS_EPICS)"
HAS_UX="$(get HAS_UX)"
HAS_ARCH="$(get HAS_ARCH)"
HAS_STORIES="$(get HAS_STORIES)"
STORY_COUNT="$(get STORY_COUNT)"
READY_COUNT="$(get READY_COUNT)"
BEYOND_COUNT="$(get BEYOND_COUNT)"

# Track flags
needs_arch=0; needs_epics=0; needs_prd=0
case "$TRACK" in
  quick-flow)  needs_prd=0; needs_arch=0; needs_epics=0 ;;
  bmad-method) needs_prd=1; needs_arch=1; needs_epics=1 ;;
  enterprise)  needs_prd=1; needs_arch=1; needs_epics=1 ;;
  *)           needs_prd=1; needs_arch=1; needs_epics=1 ;;  # unknown: assume full
esac

SKILL=""; WHY=""; NOTE=""

if [ "${HAS_CTX:-0}" != "1" ]; then
  SKILL="bmad-init"
  WHY="No project-context.md — the project is not initialized. Establish project context and CONFIRM the track."
  NOTE="Analysis (bmad-product-brief / bmad-research / bmad-brainstorm) is optional; offer it but do not require it."
elif [ "$TRACK" = "unknown" ]; then
  SKILL="(confirm track with the user)"
  WHY="project-context.md exists but no track is recorded in decision-log.md. Confirm Quick Flow / BMad Method / Enterprise before routing track-specific steps."
elif [ "${HAS_PRD:-0}" != "1" ] && [ "${HAS_SPEC:-0}" != "1" ]; then
  if [ "$TRACK" = "quick-flow" ]; then
    SKILL="bmad-tech-spec"
    WHY="No tech-spec yet. Quick Flow needs a tech-spec (no PRD)."
  else
    SKILL="bmad-prd"
    WHY="No PRD yet. This track requires a PRD before solutioning."
  fi
elif [ "$needs_arch" = "1" ] && [ "${HAS_UX:-0}" != "1" ]; then
  SKILL="bmad-ux"
  WHY="No ux-design.md. UX is recommended when the project has a UI."
  NOTE="If the project has NO user interface, skip UX and proceed to architecture."
elif [ "$needs_arch" = "1" ] && [ "${HAS_ARCH:-0}" != "1" ]; then
  SKILL="bmad-architecture"
  WHY="No architecture.md. This track requires solutioning before stories."
  if [ "$TRACK" = "enterprise" ]; then
    NOTE="Enterprise: include security + DevOps/deployment planning in the architecture handoff."
  fi
elif [ "$needs_epics" = "1" ] && [ "${HAS_EPICS:-0}" != "1" ]; then
  SKILL="bmad-epics-and-stories"
  WHY="No epics.md. Break the PRD into epics before story compilation."
elif [ "${HAS_STORIES:-0}" != "1" ]; then
  SKILL="bmad-epics-and-stories"
  WHY="No story files yet. Compile ready-for-dev story context objects."
  NOTE="Story files: {epic}.{story}.{slug}.story.md. Size each 'small enough for one agent session' (~2-8h); split if larger."
elif [ "${STORY_COUNT:-0}" -gt 0 ] && [ "${READY_COUNT:-0}" -lt "${STORY_COUNT:-0}" ]; then
  remaining=$(( ${STORY_COUNT:-0} - ${READY_COUNT:-0} ))
  SKILL="bmad-epics-and-stories"
  WHY="${remaining} of ${STORY_COUNT} stories are not yet ready-for-dev. Finish compiling their context objects."
  NOTE="Delivery is count-based: ${READY_COUNT}/${STORY_COUNT} ready. No velocity/points/burndown."
elif [ "${BEYOND_COUNT:-0}" -gt 0 ]; then
  SKILL="(none — implementation underway externally)"
  WHY="Stories have advanced past ready-for-dev (in-progress/review/done). Implementation is running in an external dev tool — outside this plugin's scope."
else
  SKILL="(none — handoff complete)"
  WHY="All required planning artifacts exist and every story is ready-for-dev. Hand the stories off to your external dev tool."
fi

echo ""
echo -e "${BLUE}== Next Step ==${NC}"
echo -e "${BLUE}Phase:${NC} ${PHASE}    ${BLUE}Track:${NC} ${TRACK}"
echo ""
echo -e "${YELLOW}Run:${NC}  ${GREEN}${SKILL}${NC}"
echo -e "${YELLOW}Why:${NC}  ${WHY}"
[ -n "$NOTE" ] && echo -e "${GRAY}Note: ${NOTE}${NC}"
echo ""

# Skipped optional phases (informational)
echo -e "${GRAY}Skipped/optional: Analysis is always optional."
if [ "$TRACK" = "quick-flow" ]; then
  echo -e "Quick Flow skips Architecture and Epics; UX only if there is a UI.${NC}"
else
  echo -e "UX applies only when the project has a UI.${NC}"
fi
echo ""

echo "NEXT_SKILL=${SKILL}"
