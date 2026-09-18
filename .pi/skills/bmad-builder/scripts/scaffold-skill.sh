#!/bin/bash

# scaffold-skill.sh
# Creates a planning/orchestration skill directory structure for the
# BMAD Planning & Orchestrator plugin, with a starter SKILL.md skeleton.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    cat <<EOF
Usage: $(basename "$0") <skill-name>

Scaffolds a new planning/orchestration skill under the skills/ directory.

Creates:
  skills/<skill-name>/SKILL.md        (starter skeleton with required frontmatter)
  skills/<skill-name>/scripts/        (for skill-specific shell scripts)
  skills/<skill-name>/templates/      (for planning document templates)

The skill name must be lowercase and hyphenated, prefixed with "bmad-".

Examples:
  $(basename "$0") bmad-example
  $(basename "$0") bmad-stakeholder-brief
  $(basename "$0") bmad-release-plan

Run from the plugin root (the directory containing skills/).
EOF
    exit 1
}

# Require exactly one argument
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No skill name provided${NC}"
    usage
fi

SKILL_NAME="$1"

# Validate name format (lowercase, hyphenated)
if [[ ! "$SKILL_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    echo -e "${RED}Error: Skill name must be lowercase and hyphenated (e.g., 'bmad-example')${NC}"
    exit 1
fi

# Resolve skills/ directory relative to this script's location (plugin root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Script lives at skills/bmad-builder/scripts/ — plugin root is three levels up
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SKILLS_DIR="$PLUGIN_ROOT/skills"
TARGET_DIR="$SKILLS_DIR/$SKILL_NAME"

# Check skills/ directory exists
if [ ! -d "$SKILLS_DIR" ]; then
    echo -e "${RED}Error: skills/ directory not found at $SKILLS_DIR${NC}"
    echo "Run this script from the plugin root or ensure the skills/ directory exists."
    exit 1
fi

# Refuse to overwrite an existing skill
if [ -d "$TARGET_DIR" ]; then
    echo -e "${RED}Error: Skill directory already exists: $TARGET_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}Scaffolding planning skill: $SKILL_NAME${NC}"
echo ""

# Create directories
mkdir -p "$TARGET_DIR/scripts"
echo -e "${GREEN}Created: $TARGET_DIR/scripts/${NC}"

mkdir -p "$TARGET_DIR/templates"
echo -e "${GREEN}Created: $TARGET_DIR/templates/${NC}"

# Derive a display title from the skill name (strip bmad- prefix, title-case)
DISPLAY_NAME="${SKILL_NAME#bmad-}"
DISPLAY_TITLE="$(echo "$DISPLAY_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')"

# Write the starter SKILL.md
cat > "$TARGET_DIR/SKILL.md" <<SKILLEOF
---
name: ${SKILL_NAME}
description: |
  TODO: Replace this with a <=1024-char description. Include concrete trigger
  phrases ("Use when the user says ...") so Claude auto-invokes this skill.
  This skill PLANS and ORCHESTRATES only — it never writes application code,
  runs tests, lints, checks coverage, or builds.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
---

# BMAD ${DISPLAY_TITLE}

**Function:** TODO — describe what planning/orchestration problem this skill solves.

## Scope (PLAN, never build)

This skill produces planning artifacts only. It does NOT write application code,
run tests, lint, check coverage, or execute builds. The last artifact it produces
is a ready-for-dev story file or a handoff manifest.

## Inputs

1. TODO — list required input documents (e.g., \`prd.md\`, \`project-context.md\`)
2. \`project-context.md\` — the project "constitution". Load it; respect it.
3. \`decision-log.md\` — prior cross-workflow decisions. Read before deciding; append new entries after.

Default output folder: \`bmad-output/\` (honor the user-configured folder).

## Three intents

Always clarify which intent applies if ambiguous.

### Create

1. TODO — step 1
2. TODO — step 2
3. TODO — step 3

### Update

1. TODO — diff existing output against changed inputs.
2. TODO — extend; do not silently overwrite prior decisions.

### Validate

1. Run the validator:
   \`\`\`bash
   bash \${CLAUDE_PLUGIN_ROOT}/skills/${SKILL_NAME}/scripts/validate-output.sh bmad-output/<output-file>.md
   \`\`\`
2. Report gaps as a checklist. Fix the plan, not the code.

## Subagent strategy

| Agent | Task | Output |
|-------|------|--------|
| Agent 1 | TODO | \`bmad-output/...\` |
| Agent 2 | TODO | \`bmad-output/...\` |

Coordination: TODO — describe fan-out/fan-in approach.

## Notes for LLMs

- Use TodoWrite to track multi-step workflow progress.
- Never implement code; produce planning documents and hand off.
- Use \`\${CLAUDE_PLUGIN_ROOT}\` for all internal paths.
- Output artifacts go under \`bmad-output/\` by default.

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of \`bmad-TODO\`. All methodology credit belongs to the BMAD Code Organization.
SKILLEOF

echo -e "${GREEN}Created: $TARGET_DIR/SKILL.md${NC}"

echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}Skill skeleton created: $SKILL_NAME/${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit $TARGET_DIR/SKILL.md"
echo "     - Fill in the description with trigger phrases"
echo "     - Define the three intents (Create / Update / Validate)"
echo "     - Set the upstream BMAD counterpart in the attribution footer"
echo "  2. Add skill-specific scripts to $TARGET_DIR/scripts/"
echo "  3. Add planning document templates to $TARGET_DIR/templates/"
echo "  4. Optionally create REFERENCE.md for details (keeps SKILL.md under 5K tokens)"
echo "  5. Validate:"
echo "     bash \${CLAUDE_PLUGIN_ROOT}/skills/bmad-builder/scripts/validate-skill.sh \\"
echo "       $TARGET_DIR/SKILL.md"
echo ""
echo "Directory structure:"
echo "  $SKILL_NAME/"
echo "  ├── SKILL.md"
echo "  ├── scripts/"
echo "  └── templates/"
