#!/usr/bin/env bash
# sync_repos.sh - cross-repo sync automation
# This script syncs the coding style guide to downstream repositories

set -euo pipefail

UPSTREAM_REPO="${UPSTREAM_REPO:-origin}"
UPSTREAM_BRANCH="${UPSTREAM_BRANCH:-main}"

echo "Starting repository sync..."

# Fetch latest changes from upstream
git fetch "$UPSTREAM_REPO" "$UPSTREAM_BRANCH"

# Check if there are any differences
if git diff --quiet HEAD "FETCH_HEAD"; then
    echo "No changes detected. Repository is up to date."
    exit 0
fi

echo "Changes detected. Updating repository..."

# Merge or rebase based on preference
git merge "FETCH_HEAD" --no-edit || {
    echo "Merge conflict detected. Manual intervention required."
    exit 1
}

echo "Repository sync completed successfully."
