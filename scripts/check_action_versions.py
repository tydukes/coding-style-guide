#!/usr/bin/env python3
"""
@module check_action_versions
@description Check GitHub Actions for outdated versions using GitHub API
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import requests


def get_latest_release_tag(repo: str, token: str) -> str:
    """
    Get the latest release tag for a GitHub repository.

    Args:
        repo: Repository in format 'owner/repo'
        token: GitHub API token

    Returns:
        Latest release tag (e.g., 'v4')
    """
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }

    url = f"https://api.github.com/repos/{repo}/releases/latest"
    response = requests.get(url, headers=headers)

    if response.status_code == 404:
        # No releases found, try tags
        url = f"https://api.github.com/repos/{repo}/tags"
        response = requests.get(url, headers=headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]["name"]
        return None

    if response.status_code != 200:
        print(
            f"⚠️  Warning: Could not fetch latest release for {repo}: "
            f"{response.status_code}"
        )
        return None

    return response.json().get("tag_name")


def extract_actions_from_workflow(
    workflow_path: Path,
) -> List[Tuple[str, str, int]]:
    """
    Extract all GitHub Actions from a workflow file.

    Args:
        workflow_path: Path to workflow YAML file

    Returns:
        List of tuples (action_repo, version, line_number)
    """
    actions = []
    content = workflow_path.read_text()

    # Pattern to match: uses: owner/repo@version
    uses_pattern = r"uses:\s+([^@\s]+)@([^\s]+)"

    for line_num, line in enumerate(content.split("\n"), start=1):
        match = re.search(uses_pattern, line)
        if match:
            action_repo, version = match.groups()
            # Skip Docker actions and local actions
            if "/" in action_repo and not action_repo.startswith("docker://"):
                actions.append((action_repo, version, line_num))

    return actions


def normalize_version(version: str) -> str:
    """
    Normalize version tags for comparison.

    Args:
        version: Version string (e.g., 'v4', 'v4.1.0')

    Returns:
        Normalized version for comparison
    """
    # Remove 'v' prefix if present
    if version.startswith("v"):
        version = version[1:]

    # Extract major version for comparison (v4 -> 4)
    parts = version.split(".")
    return parts[0]


def is_version_outdated(current: str, latest: str) -> bool:
    """
    Check if current version is outdated compared to latest.

    Args:
        current: Current version tag
        latest: Latest version tag

    Returns:
        True if current version is outdated
    """
    if not latest:
        return False

    # Normalize versions for comparison
    current_normalized = normalize_version(current)
    latest_normalized = normalize_version(latest)

    # Compare major versions
    try:
        current_int = int(current_normalized)
        latest_int = int(latest_normalized)
        return current_int < latest_int
    except ValueError:
        # Non-numeric versions, do string comparison
        return current != latest


def check_action_versions() -> int:
    """
    Check all GitHub Actions in workflows for outdated versions.

    Returns:
        Exit code (0 if all up to date, 1 if outdated actions found)
    """
    workflow_dir = Path(".github/workflows")
    if not workflow_dir.exists():
        print("::error::No .github/workflows directory found!")
        return 1

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("::error::GITHUB_TOKEN environment variable not set!")
        return 1

    all_actions: Dict[str, List[Tuple[str, Path, int]]] = {}
    outdated_actions = []

    print("Checking GitHub Actions versions...\n")

    # Collect all actions from all workflow files
    for workflow_file in sorted(workflow_dir.glob("*.yml")):
        actions = extract_actions_from_workflow(workflow_file)
        for action_repo, version, line_num in actions:
            if action_repo not in all_actions:
                all_actions[action_repo] = []
            all_actions[action_repo].append((version, workflow_file, line_num))

    # Check each unique action
    for action_repo, usages in sorted(all_actions.items()):
        latest_tag = get_latest_release_tag(action_repo, token)

        if not latest_tag:
            print(f"⚠️  Could not determine latest version for {action_repo}")
            continue

        # Check each usage of this action
        for current_version, workflow_file, line_num in usages:
            if is_version_outdated(current_version, latest_tag):
                outdated_actions.append(
                    (
                        action_repo,
                        current_version,
                        latest_tag,
                        workflow_file.name,
                        line_num,
                    )
                )
                print(
                    f"❌ {action_repo}@{current_version} -> {latest_tag} "
                    f"({workflow_file.name}:{line_num})"
                )
            else:
                print(
                    f"✅ {action_repo}@{current_version} is up to date "
                    f"({workflow_file.name}:{line_num})"
                )

    print()

    if outdated_actions:
        print("::error::Outdated GitHub Actions detected!")
        print("\nThe following actions are outdated:\n")
        for (
            action,
            current,
            latest,
            workflow,
            line_num,
        ) in outdated_actions:
            print(f"  - {action}: {current} -> {latest} ({workflow}:{line_num})")
        return 1

    print("✅ All GitHub Actions are up to date!")
    return 0


if __name__ == "__main__":
    sys.exit(check_action_versions())
