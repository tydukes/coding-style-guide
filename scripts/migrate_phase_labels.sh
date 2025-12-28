#!/usr/bin/env bash
#
# Migrate GitHub issues from phase-* labels to new taxonomy
#
# @module migrate_phase_labels
# @description Bash script to migrate GitHub issues using gh CLI
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-28
# @status stable

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Phase to new label mappings
declare -A PHASE_MAPPING=(
    ["phase-1"]="type:maintenance,priority:high"
    ["phase-2"]="type:docs,scope:language-guide,priority:high"
    ["phase-3"]="type:docs,scope:language-guide,priority:medium"
    ["phase-4"]="type:docs,priority:medium"
    ["phase-5"]="type:maintenance,scope:automation,priority:high"
    ["phase-6"]="type:maintenance,priority:low"
)

# Dry run mode
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}\n"
fi

echo "================================================================================"
echo "Phase Label Migration"
echo "================================================================================"
echo ""

total_migrated=0

# Iterate through each phase label
for phase_label in phase-1 phase-2 phase-3 phase-4 phase-5 phase-6; do
    echo -e "${BLUE}📋 Processing $phase_label...${NC}"

    # Get new labels for this phase
    new_labels="${PHASE_MAPPING[$phase_label]}"

    # Get all issues with this label
    issues=$(gh issue list --label "$phase_label" --state all --json number,title,state,labels --limit 1000)
    issue_count=$(echo "$issues" | jq '. | length')

    if [ "$issue_count" -eq 0 ]; then
        echo -e "  ${YELLOW}ℹ️  No issues found with $phase_label${NC}\n"
        continue
    fi

    echo "  Found $issue_count issue(s)"
    echo ""

    # Process each issue
    echo "$issues" | jq -c '.[]' | while read -r issue; do
        issue_number=$(echo "$issue" | jq -r '.number')
        issue_title=$(echo "$issue" | jq -r '.title')
        issue_state=$(echo "$issue" | jq -r '.state')

        echo "  Issue #$issue_number [$issue_state]: $issue_title"

        if [ "$DRY_RUN" = true ]; then
            echo "    Would remove: $phase_label"
            echo "    Would add: $new_labels"
            echo "    Would add migration comment"
        else
            # Update issue labels (gh handles combining current and new labels)
            if gh issue edit "$issue_number" --remove-label "$phase_label" --add-label "$new_labels" 2>/dev/null; then
                echo -e "    ${GREEN}✅ Labels updated${NC}"
                ((total_migrated++)) || true

                # Add migration comment
                formatted_labels=$(echo "$new_labels" | sed 's/,/, /g' | sed "s/\\([^,]*\\)/\`\\1\`/g")
                comment="**Label Migration**: This issue has been updated from \`$phase_label\` to the new label taxonomy:
- $formatted_labels

The phase labels represented project milestones that are now complete. The new labels better reflect ongoing maintenance and priorities.

For more information about the new label system, see [CLAUDE.md](https://github.com/tydukes/coding-style-guide/blob/main/CLAUDE.md) and [CONTRIBUTING.md](https://github.com/tydukes/coding-style-guide/blob/main/CONTRIBUTING.md)."

                if gh issue comment "$issue_number" --body "$comment" 2>/dev/null; then
                    echo -e "    ${GREEN}✅ Migration comment added${NC}"
                else
                    echo -e "    ${YELLOW}⚠️  Warning: Could not add comment${NC}"
                fi
            else
                echo -e "    ${RED}❌ Failed to update labels${NC}"
            fi
        fi
        echo ""
    done
done

echo "================================================================================"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🔍 DRY RUN COMPLETE${NC}"
else
    echo -e "${GREEN}✅ MIGRATION COMPLETE - $total_migrated issues migrated${NC}"
fi
echo "================================================================================"
