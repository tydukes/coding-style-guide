#!/usr/bin/env python3
"""
Migrate issues from phase-* labels to new taxonomy.

@module migrate_phase_labels
@description Migrates GitHub issues from deprecated phase labels to new comprehensive taxonomy
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-28
@status stable
"""

import os
import sys
import requests
from typing import List, Dict, Any

# GitHub API configuration
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_OWNER = "tydukes"
REPO_NAME = "coding-style-guide"
API_BASE_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}"

# Mapping of phase labels to new labels based on their original purpose
PHASE_MAPPING = {
    "phase-1": ["type:maintenance", "priority:high"],  # Critical foundations
    "phase-2": ["type:docs", "scope:language-guide", "priority:high"],  # Core guides
    "phase-3": ["type:docs", "scope:language-guide", "priority:medium"],  # Split files
    "phase-4": ["type:docs", "priority:medium"],  # Templates & examples
    "phase-5": ["type:maintenance", "scope:automation", "priority:high"],  # CI/CD
    "phase-6": ["type:maintenance", "priority:low"],  # Enhancement & polish
}


def check_github_token() -> None:
    """Validate GitHub token is present."""
    if not GITHUB_TOKEN:
        print("❌ ERROR: GITHUB_TOKEN environment variable not set")
        print("Please set it with: export GITHUB_TOKEN=your_token_here")
        sys.exit(1)


def get_headers() -> Dict[str, str]:
    """Get headers for GitHub API requests."""
    return {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }


def get_issues_with_label(label: str) -> List[Dict[str, Any]]:
    """
    Fetch all issues (open and closed) with a specific label.

    Args:
        label: The label name to search for

    Returns:
        List of issue dictionaries from GitHub API
    """
    url = f"{API_BASE_URL}/issues"
    params = {"labels": label, "state": "all", "per_page": 100}

    all_issues = []
    page = 1

    while True:
        params["page"] = page
        response = requests.get(url, headers=get_headers(), params=params)

        if response.status_code != 200:
            print(
                f"❌ Error fetching issues with label '{label}': {response.status_code}"
            )
            print(f"Response: {response.text}")
            break

        issues = response.json()
        if not issues:
            break

        all_issues.extend(issues)
        page += 1

    return all_issues


def update_issue_labels(
    issue_number: int, labels_to_add: List[str], labels_to_remove: List[str]
) -> bool:
    """
    Update labels on an issue.

    Args:
        issue_number: The issue number
        labels_to_add: List of label names to add
        labels_to_remove: List of label names to remove

    Returns:
        True if successful, False otherwise
    """
    url = f"{API_BASE_URL}/issues/{issue_number}"

    # Get current labels
    response = requests.get(url, headers=get_headers())
    if response.status_code != 200:
        print(f"  ❌ Error fetching issue #{issue_number}: {response.status_code}")
        return False

    current_labels = [label["name"] for label in response.json()["labels"]]

    # Remove phase labels, add new labels
    new_labels = [label for label in current_labels if label not in labels_to_remove]
    new_labels.extend(labels_to_add)
    new_labels = list(set(new_labels))  # Remove duplicates

    # Update issue
    data = {"labels": new_labels}
    response = requests.patch(url, headers=get_headers(), json=data)

    if response.status_code != 200:
        print(f"  ❌ Error updating issue #{issue_number}: {response.status_code}")
        return False

    return True


def add_migration_comment(
    issue_number: int, phase_label: str, new_labels: List[str]
) -> bool:
    """
    Add a comment to an issue explaining the label migration.

    Args:
        issue_number: The issue number
        phase_label: The old phase label being removed
        new_labels: List of new labels being added

    Returns:
        True if successful, False otherwise
    """
    label_list = ", ".join([f"`{label}`" for label in new_labels])
    repo_url = f"https://github.com/{REPO_OWNER}/{REPO_NAME}"
    comment = f"""**Label Migration**: This issue has been updated from \
`{phase_label}` to the new label taxonomy:
- {label_list}

The phase labels represented project milestones that are now complete. \
The new labels better reflect ongoing maintenance and priorities.

For more information about the new label system, see \
[CLAUDE.md]({repo_url}/blob/main/CLAUDE.md) and \
[CONTRIBUTING.md]({repo_url}/blob/main/CONTRIBUTING.md)."""

    url = f"{API_BASE_URL}/issues/{issue_number}/comments"
    data = {"body": comment}

    response = requests.post(url, headers=get_headers(), json=data)

    if response.status_code != 201:
        print(
            f"  ⚠️  Warning: Could not add comment to issue #{issue_number}: {response.status_code}"
        )
        return False

    return True


def migrate_phase_labels(dry_run: bool = False) -> None:
    """
    Migrate all phase labels to new taxonomy.

    Args:
        dry_run: If True, only print what would be done without making changes
    """
    print("\n" + "=" * 80)
    print("Phase Label Migration")
    print("=" * 80)

    if dry_run:
        print("\n🔍 DRY RUN MODE - No changes will be made\n")

    total_migrated = 0

    for phase_label, new_labels in PHASE_MAPPING.items():
        print(f"\n📋 Processing {phase_label}...")
        issues = get_issues_with_label(phase_label)

        if not issues:
            print(f"  ℹ️  No issues found with {phase_label}")
            continue

        print(f"  Found {len(issues)} issue(s)")

        for issue in issues:
            issue_number = issue["number"]
            issue_title = issue["title"]
            issue_state = issue["state"]

            print(f"\n  Issue #{issue_number} ({issue_state}): {issue_title}")

            if dry_run:
                print(f"    Would remove: {phase_label}")
                print(f"    Would add: {', '.join(new_labels)}")
                print("    Would add migration comment")
            else:
                # Update labels
                if update_issue_labels(issue_number, new_labels, [phase_label]):
                    print("    ✅ Labels updated")
                    total_migrated += 1

                    # Add comment
                    add_migration_comment(issue_number, phase_label, new_labels)
                    print("    ✅ Migration comment added")
                else:
                    print("    ❌ Failed to update labels")

    print("\n" + "=" * 80)
    if dry_run:
        print(f"🔍 DRY RUN COMPLETE - {total_migrated} issues would be migrated")
    else:
        print(f"✅ MIGRATION COMPLETE - {total_migrated} issues migrated")
    print("=" * 80 + "\n")


def main():
    """Main entry point for the migration script."""
    check_github_token()

    # Check for dry-run flag
    dry_run = "--dry-run" in sys.argv

    print(
        f"""
GitHub Issue Label Migration
Repository: {REPO_OWNER}/{REPO_NAME}

This script will:
1. Find all issues with phase-* labels
2. Add new taxonomy labels based on phase mapping
3. Remove the old phase-* labels
4. Add a comment explaining the migration
    """
    )

    if not dry_run:
        response = input("Are you sure you want to proceed? (yes/no): ")
        if response.lower() != "yes":
            print("❌ Migration cancelled")
            sys.exit(0)

    migrate_phase_labels(dry_run)


if __name__ == "__main__":
    main()
