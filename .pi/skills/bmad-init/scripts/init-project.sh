#!/bin/bash
# BMAD Planning & Orchestrator — Workspace Initializer
# Idempotently scaffolds the planning workspace:
#   <output>/                     (folder)
#   <output>/stories/             (folder)
#   <output>/config.yaml          (always rewritten from current args)
#   <output>/decision-log.md      (seeded from template ONLY if missing/empty)
#   <output>/project-context.md   (seeded from template ONLY if missing/empty)
#
# PLANNING ONLY. Creates folders + seed docs. Never writes app code, runs tests,
# lints, or builds. No numbered levels. No story points / velocity / burndown.

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

# Resolve the skill directory so we can find bundled templates regardless of CWD.
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="${SKILL_DIR}/templates"

PROJECT_NAME=""
PROJECT_TRACK=""
OUTPUT_FOLDER="bmad-output"
VALIDATE_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --name)   PROJECT_NAME="$2"; shift 2 ;;
    --track)  PROJECT_TRACK="$2"; shift 2 ;;
    --output) OUTPUT_FOLDER="$2"; shift 2 ;;
    --validate) VALIDATE_ONLY=true; shift ;;
    -h|--help)
      echo "Usage: $0 --name <name> --track <quick-flow|bmad-method|enterprise> [--output <folder>]"
      echo "       $0 --validate [--output <folder>]"
      echo ""
      echo "  --name      Project name (required for init)"
      echo "  --track     quick-flow | bmad-method | enterprise (required for init)"
      echo "  --output    Output folder (default: bmad-output)"
      echo "  --validate  Check an existing workspace without mutating it"
      exit 0 ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

CONFIG_FILE="${OUTPUT_FOLDER}/config.yaml"
DECISION_LOG="${OUTPUT_FOLDER}/decision-log.md"
PROJECT_CONTEXT="${OUTPUT_FOLDER}/project-context.md"
STORIES_DIR="${OUTPUT_FOLDER}/stories"

# --- Validate mode ----------------------------------------------------------
if [ "$VALIDATE_ONLY" = true ]; then
  echo -e "${BLUE}Validating workspace: ${OUTPUT_FOLDER}${NC}"
  echo ""
  ERRORS=0
  check() { if [ "$1" = true ]; then echo -e "${GREEN}\xe2\x9c\x93${NC} $2"; else echo -e "${RED}\xe2\x9c\x97${NC} $2"; ERRORS=$((ERRORS+1)); fi; }

  [ -d "$OUTPUT_FOLDER" ] && check true "output folder exists: $OUTPUT_FOLDER" || check false "output folder missing: $OUTPUT_FOLDER"
  [ -d "$STORIES_DIR" ] && check true "stories folder exists" || check false "stories folder missing"
  [ -f "$CONFIG_FILE" ] && check true "config.yaml exists" || check false "config.yaml missing"
  [ -f "$DECISION_LOG" ] && check true "decision-log.md exists" || check false "decision-log.md missing"
  [ -f "$PROJECT_CONTEXT" ] && check true "project-context.md exists" || check false "project-context.md missing"

  if [ -f "$CONFIG_FILE" ]; then
    grep -q "name:" "$CONFIG_FILE" && check true "config has project.name" || check false "config missing project.name"
    if grep -q "track:" "$CONFIG_FILE"; then
      TRK=$(grep "track:" "$CONFIG_FILE" | head -1 | sed 's/.*: *//' | tr -d '"')
      case "$TRK" in
        quick-flow|bmad-method|enterprise) check true "track is valid: $TRK" ;;
        *) check false "track invalid: '$TRK' (expected quick-flow|bmad-method|enterprise)" ;;
      esac
    else
      check false "config missing project.track"
    fi
  fi

  echo ""
  if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}\xe2\x9c\x93 Workspace is well-formed.${NC}"; exit 0
  else
    echo -e "${RED}\xe2\x9c\x97 ${ERRORS} problem(s) found. Re-run init to repair.${NC}"; exit 1
  fi
fi

# --- Init mode --------------------------------------------------------------
if [ -z "$PROJECT_NAME" ] || [ -z "$PROJECT_TRACK" ]; then
  echo -e "${RED}Error: --name and --track are required.${NC}"
  echo "Run with --help for usage."
  exit 1
fi

case "$PROJECT_TRACK" in
  quick-flow|bmad-method|enterprise) ;;
  *)
    echo -e "${RED}Error: invalid track '$PROJECT_TRACK'.${NC}"
    echo "Valid tracks: quick-flow | bmad-method | enterprise"
    exit 1 ;;
esac

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TIMESTAMP_DATE=$(date -u +"%Y-%m-%d")

echo -e "${GREEN}${BOLD}Initializing BMAD planning workspace${NC}"
echo -e "  Project: ${BOLD}${PROJECT_NAME}${NC}"
echo -e "  Track:   ${BOLD}${PROJECT_TRACK}${NC}"
echo -e "  Output:  ${BOLD}${OUTPUT_FOLDER}${NC}"
echo ""

# Folders (idempotent)
mkdir -p "$STORIES_DIR"
echo -e "${GREEN}\xe2\x9c\x93${NC} folders ready: ${OUTPUT_FOLDER}/ , ${STORIES_DIR}/"

# Helper: substitute template placeholders to stdout
render() {
  sed -e "s|{{PROJECT_NAME}}|${PROJECT_NAME}|g" \
      -e "s|{{PROJECT_TRACK}}|${PROJECT_TRACK}|g" \
      -e "s|{{OUTPUT_FOLDER}}|${OUTPUT_FOLDER}|g" \
      -e "s|{{TIMESTAMP}}|${TIMESTAMP}|g" \
      -e "s|{{TIMESTAMP_DATE}}|${TIMESTAMP_DATE}|g" \
      "$1"
}

# config.yaml — always (re)written from current args
if [ -f "${TEMPLATE_DIR}/config.template.yaml" ]; then
  render "${TEMPLATE_DIR}/config.template.yaml" > "$CONFIG_FILE"
else
  cat > "$CONFIG_FILE" <<EOF
bmad_version: "6.x"
project:
  name: "${PROJECT_NAME}"
  track: "${PROJECT_TRACK}"
  created: "${TIMESTAMP}"
paths:
  output_folder: "${OUTPUT_FOLDER}"
  stories_folder: "${OUTPUT_FOLDER}/stories"
  decision_log: "${OUTPUT_FOLDER}/decision-log.md"
  project_context: "${OUTPUT_FOLDER}/project-context.md"
languages:
  communication: "English"
  document_output: "English"
delivery:
  metric: "count-based"
EOF
fi
echo -e "${GREEN}\xe2\x9c\x93${NC} wrote: ${CONFIG_FILE}"

# decision-log.md — seed ONLY if missing or empty (never clobber)
seed_if_empty() {
  local target="$1" tmpl="$2" label="$3"
  if [ -s "$target" ]; then
    echo -e "${YELLOW}\xe2\x8a\x98${NC} kept existing: ${target} (not overwritten)"
    return
  fi
  if [ -f "$tmpl" ]; then
    render "$tmpl" > "$target"
  else
    echo "# ${label} — ${PROJECT_NAME}" > "$target"
  fi
  echo -e "${GREEN}\xe2\x9c\x93${NC} seeded: ${target}"
}

seed_if_empty "$DECISION_LOG" "${TEMPLATE_DIR}/decision-log.template.md" "Decision Log"
seed_if_empty "$PROJECT_CONTEXT" "${TEMPLATE_DIR}/project-context.template.md" "Project Context"

echo ""
echo -e "${GREEN}${BOLD}Workspace ready.${NC}"
echo ""
echo -e "${BLUE}Next:${NC}"
echo -e "  1. Fill the first sections of ${BOLD}${PROJECT_CONTEXT}${NC} (goal, users, constraints, non-goals)."
echo -e "  2. Record the track rationale as the first entry in ${BOLD}${DECISION_LOG}${NC}."
case "$PROJECT_TRACK" in
  quick-flow)  echo -e "  3. Proceed to the ${BOLD}tech-spec${NC}, then sprint-planning / story creation." ;;
  bmad-method) echo -e "  3. Proceed to ${BOLD}product brief -> PRD -> architecture${NC}." ;;
  enterprise)  echo -e "  3. Proceed to ${BOLD}product brief -> PRD -> architecture (+ security & DevOps planning)${NC}." ;;
esac
echo ""
