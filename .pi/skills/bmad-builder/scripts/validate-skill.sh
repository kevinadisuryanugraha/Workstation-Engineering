#!/bin/bash

# validate-skill.sh
# Validates that a BMAD Planning & Orchestrator SKILL.md file:
#   - Has required YAML frontmatter (name, description)
#   - Has recommended frontmatter (allowed-tools)
#   - Does not contain scope violations (dev/lint/build/coverage language)
#   - Stays within the ~5K token target (~20KB)
#   - Contains the mandatory attribution footer

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    cat <<EOF
Usage: $(basename "$0") <path-to-SKILL.md>

Validates a BMAD Planning & Orchestrator SKILL.md file.

Checks:
  - YAML frontmatter present
  - 'name' field (required, lowercase-hyphen)
  - 'description' field (required, with trigger phrases)
  - 'allowed-tools' field (recommended)
  - No dev/lint/build/coverage scope violations in frontmatter or body
  - File size within ~5K token target (~20KB)
  - Attribution footer present

Examples:
  $(basename "$0") ./SKILL.md
  $(basename "$0") \${CLAUDE_PLUGIN_ROOT}/skills/bmad-example/SKILL.md
EOF
    exit 1
}

if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No file path provided${NC}"
    usage
fi

SKILL_FILE="$1"

if [ ! -f "$SKILL_FILE" ]; then
    echo -e "${RED}Error: File not found: $SKILL_FILE${NC}"
    exit 1
fi

if [[ "$(basename "$SKILL_FILE")" != "SKILL.md" ]]; then
    echo -e "${YELLOW}Warning: File is not named SKILL.md${NC}"
fi

echo "Validating: $SKILL_FILE"
echo ""

# ── Extract YAML frontmatter ──────────────────────────────────────────────────
yaml_content=$(awk '/^---$/{if(++count==1)next; if(count==2)exit} count==1' "$SKILL_FILE")

if [ -z "$yaml_content" ]; then
    echo -e "${RED}FAIL: No YAML frontmatter found${NC}"
    echo "  SKILL.md must start with YAML frontmatter between --- markers"
    exit 1
fi

echo -e "${GREEN}YAML frontmatter found${NC}"

errors=0
warnings=0

# ── Required: name ────────────────────────────────────────────────────────────
if echo "$yaml_content" | grep -q "^name:"; then
    name_value=$(echo "$yaml_content" | grep "^name:" | sed 's/^name: *//' | tr -d '"' | tr -d "'")
    echo -e "${GREEN}  'name' present: $name_value${NC}"
    if [[ ! "$name_value" =~ ^[a-z][a-z0-9-]*$ ]]; then
        echo -e "${YELLOW}    Warning: 'name' should be lowercase-hyphen (e.g., 'bmad-my-skill')${NC}"
        ((warnings++))
    fi
else
    echo -e "${RED}  'name' field missing (REQUIRED)${NC}"
    ((errors++))
fi

# ── Required: description ─────────────────────────────────────────────────────
if echo "$yaml_content" | grep -q "^description:"; then
    # Grab the whole description block (scalar or block scalar)
    desc_block=$(awk '/^description:/{found=1; next} found && /^[a-z]/{exit} found' "$SKILL_FILE")
    desc_inline=$(echo "$yaml_content" | grep "^description:" | sed 's/^description: *//')
    desc_combined="$desc_inline $desc_block"
    echo -e "${GREEN}  'description' present${NC}"
    if [ ${#desc_combined} -lt 40 ]; then
        echo -e "${YELLOW}    Warning: description is very short. Include trigger phrases like 'Use when the user says ...'${NC}"
        ((warnings++))
    fi
    if ! echo "$desc_combined" | grep -qi "use when\|trigger\|when the user"; then
        echo -e "${YELLOW}    Warning: description should contain trigger phrases (e.g., 'Use when the user says ...')${NC}"
        ((warnings++))
    fi
else
    echo -e "${RED}  'description' field missing (REQUIRED)${NC}"
    ((errors++))
fi

# ── Recommended: allowed-tools ────────────────────────────────────────────────
if echo "$yaml_content" | grep -q "^allowed-tools:"; then
    tools_value=$(echo "$yaml_content" | grep "^allowed-tools:" | sed 's/^allowed-tools: *//')
    echo -e "${GREEN}  'allowed-tools' present: $tools_value${NC}"
else
    echo -e "${YELLOW}  'allowed-tools' not found (recommended)${NC}"
    ((warnings++))
fi

# ── Scope violation check ─────────────────────────────────────────────────────
# Forbidden terms: dev tooling, test execution, build/lint/coverage commands
# Note: 'test' and 'testing' alone are NOT forbidden (planning a test strategy is fine);
#       only execution-oriented patterns are flagged.
# Lines whose purpose is to PROHIBIT an action are skipped (they contain negation
# keywords like "NOT", "never", "does not", "do not", "don't", "must not").
# We also skip comment lines (starting with #).
SCOPE_PATTERNS=(
    "npm (test|build|lint|run)"
    "yarn (test|build|lint)"
    "pnpm (test|build|lint)"
    "jest[[:space:]]"
    "pytest[[:space:]]"
    "eslint[[:space:]]"
    "tslint[[:space:]]"
    "go test[[:space:]]"
    "cargo test"
    "coverage report"
    "code coverage"
    "coverage threshold"
    "run the (test|tests|suite|linter|lint|build)"
    "execute (the )?(test|tests|suite)"
    "fix the code"
    "review the diff"
    "implement the"
    "write application code"
    "grep.*coverage"
    "nyc[[:space:]]"
    "istanbul[[:space:]]"
    "make (test|build|check)"
    "docker build"
    "kubectl apply"
)

# Build a filtered version of the file holding only AFFIRMATIVE prose — lines that
# could be a genuine scope violation. We drop:
#   - comment lines and markdown headings (start with #)
#   - negation/prohibition lines ("does not", "never", "tempted to ...", "STOP", etc.)
#   - bullet items that sit under a negation HEADER ending in ':' (e.g.
#       "This skill does not:\n - Write application code.")
# Markdown emphasis (*, _, `) is stripped first so "does **not**" still reads as a
# negation and so backtick-wrapped commands are still detected.
filtered_content=$(awk '
/^[[:space:]]*#/ { next }
{
  norm = tolower($0); gsub(/[*_`]/, "", norm)
  out  = $0;          gsub(/[*_`]/, "", out)
  isneg = (norm ~ /does not|do not|never|must not|cannot|without|out of scope|out-of-scope|tempted|prohibit|forbidden|hand it off|hand off|hands off|stop/)
  # a negation header (ends with ":") opens a prohibited list block
  if (isneg && norm ~ /:[[:space:]]*$/) { inneg = 1; next }
  if ($0 ~ /^[[:space:]]*$/) { next }
  # inside a negated block, skip list items; a non-list line closes the block
  if (inneg && $0 ~ /^[[:space:]]*([-*]|[0-9]+[.)])[[:space:]]/) { next }
  if (inneg && $0 !~ /^[[:space:]]*([-*]|[0-9]+[.)])/) { inneg = 0 }
  if (isneg) next
  print out
}' "$SKILL_FILE")

scope_violations=0
for pattern in "${SCOPE_PATTERNS[@]}"; do
    if echo "$filtered_content" | grep -qiE "$pattern" 2>/dev/null; then
        if [ $scope_violations -eq 0 ]; then
            echo -e "${RED}  SCOPE VIOLATIONS detected (this plugin PLANS; it does not build/test/lint):${NC}"
        fi
        matches=$(echo "$filtered_content" | grep -niE "$pattern" | head -3)
        echo -e "${RED}    Pattern '$pattern':${NC}"
        while IFS= read -r line; do
            echo -e "${RED}      $line${NC}"
        done <<< "$matches"
        ((scope_violations++))
        ((errors++))
    fi
done

if [ $scope_violations -eq 0 ]; then
    echo -e "${GREEN}  No scope violations found${NC}"
fi

# ── File size check ───────────────────────────────────────────────────────────
file_size=$(wc -c < "$SKILL_FILE")
if [ "$file_size" -gt 20000 ]; then
    echo -e "${YELLOW}  Warning: File is ${file_size} bytes (target <20KB / ~5K tokens). Move detail to REFERENCE.md.${NC}"
    ((warnings++))
else
    echo -e "${GREEN}  File size OK: ${file_size} bytes${NC}"
fi

# ── Attribution footer check ──────────────────────────────────────────────────
if grep -q "BMAD Planning & Orchestrator" "$SKILL_FILE" && grep -q "BMAD Code Organization" "$SKILL_FILE"; then
    echo -e "${GREEN}  Attribution footer present${NC}"
else
    echo -e "${YELLOW}  Warning: Attribution footer may be missing or incomplete.${NC}"
    echo "    Every SKILL.md must end with the standard attribution block."
    ((warnings++))
fi

# ── Hardcoded path check ──────────────────────────────────────────────────────
# Skip lines that are telling authors NOT to use hardcoded paths (negation context).
if echo "$filtered_content" | grep -qE '~\/\.claude|\/Users\/|\/home\/' 2>/dev/null; then
    echo -e "${YELLOW}  Warning: Hardcoded paths found. Use \${CLAUDE_PLUGIN_ROOT} instead of absolute paths.${NC}"
    ((warnings++))
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
if [ $errors -eq 0 ]; then
    if [ $warnings -eq 0 ]; then
        echo -e "${GREEN}VALIDATION PASSED — no errors or warnings${NC}"
    else
        echo -e "${GREEN}VALIDATION PASSED${NC} — ${YELLOW}$warnings warning(s)${NC}"
    fi
    exit 0
else
    echo -e "${RED}VALIDATION FAILED — $errors error(s), $warnings warning(s)${NC}"
    exit 1
fi
