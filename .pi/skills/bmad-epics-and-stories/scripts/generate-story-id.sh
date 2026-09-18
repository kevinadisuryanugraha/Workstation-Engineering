#!/usr/bin/env bash
#
# Story ID Generator for the bmad-epics-and-stories skill.
#
# BMAD story IDs are {epic}.{story} pairs (e.g. 2.1) and story files are named
# {epic}.{story}.{slug}.story.md (e.g. 2.1.stripe-integration.story.md).
#
# Given an epic number, this scans the stories directory for the highest existing
# story number within that epic and prints the next {epic}.{story} id. No story
# points, velocity, or sprint state are involved — this is purely id continuity.
#
# Usage:
#   bash generate-story-id.sh <epic-number> [stories-directory] [slug]
#   bash generate-story-id.sh 2
#   bash generate-story-id.sh 2 bmad-output/stories
#   bash generate-story-id.sh 2 bmad-output/stories stripe-integration
#
# Output (stdout, the id only):
#   2.1                                  (no slug given)
#   2.1.stripe-integration.story.md      (slug given -> full filename)
#
# Exit codes:
#   0 - Success
#   1 - Error (missing/invalid epic number)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error()   { echo -e "${RED}Error: $1${NC}" >&2; }
info()    { echo -e "${YELLOW}$1${NC}" >&2; }

usage() {
    cat << EOF
Usage: $(basename "$0") <epic-number> [stories-directory] [slug]

Print the next {epic}.{story} id for an epic, scanning existing story files.

Arguments:
  epic-number        Required. Integer epic number (e.g. 2).
  stories-directory  Optional. Default: bmad-output/stories
  slug               Optional. If given, prints the full {epic}.{story}.{slug}.story.md
                     filename instead of just the id.

Examples:
  $(basename "$0") 2
  $(basename "$0") 2 bmad-output/stories
  $(basename "$0") 2 bmad-output/stories stripe-integration

Story files are matched by the leading "{epic}.{story}." in their filename.

Exit Codes:
  0 - Success
  1 - Error
EOF
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

EPIC="${1:-}"
STORIES_DIR="${2:-bmad-output/stories}"
SLUG="${3:-}"

if [[ -z "$EPIC" ]]; then
    error "Epic number is required."
    echo "" >&2
    usage
    exit 1
fi

if ! [[ "$EPIC" =~ ^[0-9]+$ ]]; then
    error "Epic number must be an integer (got: '$EPIC')."
    exit 1
fi

# Normalize slug: lowercase, spaces/underscores -> hyphens, strip other punctuation.
normalize_slug() {
    echo "$1" \
        | tr '[:upper:]' '[:lower:]' \
        | sed -E 's/[[:space:]_]+/-/g; s/[^a-z0-9-]//g; s/-+/-/g; s/^-//; s/-$//'
}

# Find the highest story number already used within this epic.
find_highest_story_num() {
    local max=0 num base
    if [[ -d "$STORIES_DIR" ]]; then
        while IFS= read -r file; do
            base="$(basename "$file")"
            # Match leading "<epic>.<story>." at the start of the filename.
            if [[ "$base" =~ ^${EPIC}\.([0-9]+)\. ]]; then
                num="${BASH_REMATCH[1]}"
                num=$((10#$num))
                (( num > max )) && max=$num
            fi
        done < <(find "$STORIES_DIR" -type f -name "${EPIC}.*.story.md" 2>/dev/null || true)
    fi
    echo "$max"
}

main() {
    local highest next id
    highest=$(find_highest_story_num)
    next=$((highest + 1))
    id="${EPIC}.${next}"

    if [[ -n "$SLUG" ]]; then
        local clean
        clean="$(normalize_slug "$SLUG")"
        if [[ -z "$clean" ]]; then
            error "Slug normalized to empty; provide a slug with letters/numbers."
            exit 1
        fi
        echo "${id}.${clean}.story.md"
    else
        echo "$id"
    fi

    if (( highest == 0 )); then
        info "Epic ${EPIC}: no existing stories. Next id: ${id}"
    else
        info "Epic ${EPIC}: highest existing story is ${EPIC}.${highest}. Next id: ${id}"
    fi
}

main
