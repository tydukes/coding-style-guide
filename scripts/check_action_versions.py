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

from version_utils import get_latest_release_tag, is_version_outdated


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


def collect_all_actions(workflow_dir: Path) -> Dict[str, List[Tuple[str, Path, int]]]:
    """
    Collect all actions from workflow files.

    Args:
        workflow_dir: Path to .github/workflows directory

    Returns:
        Dictionary mapping action repos to list of (version, file, line_num)
    """
    all_actions: Dict[str, List[Tuple[str, Path, int]]] = {}

    for workflow_file in sorted(workflow_dir.glob("*.yml")):
        actions = extract_actions_from_workflow(workflow_file)
        for action_repo, version, line_num in actions:
            if action_repo not in all_actions:
                all_actions[action_repo] = []
            all_actions[action_repo].append((version, workflow_file, line_num))

    return all_actions


def check_action_for_updates(
    action_repo: str,
    usages: List[Tuple[str, Path, int]],
    token: str,
    outdated_actions: List[Tuple[str, str, str, str, int]],
) -> None:
    """
    Check a single action for updates across all its usages.

    Args:
        action_repo: Repository name (e.g., 'actions/checkout')
        usages: List of (version, workflow_file, line_num) tuples
        token: GitHub API token
        outdated_actions: List to append outdated actions to
    """
    latest_tag = get_latest_release_tag(action_repo, token)

    if not latest_tag:
        print(f"⚠️  Could not determine latest version for {action_repo}")
        return

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


def print_outdated_summary(
    outdated_actions: List[Tuple[str, str, str, str, int]],
) -> None:
    """
    Print summary of outdated actions.

    Args:
        outdated_actions: List of (action, current, latest, workflow, line_num)
    """
    print("::error::Outdated GitHub Actions detected!")
    print("\nThe following actions are outdated:\n")
    for action, current, latest, workflow, line_num in outdated_actions:
        print(f"  - {action}: {current} -> {latest} ({workflow}:{line_num})")


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

    print("Checking GitHub Actions versions...\n")

    all_actions = collect_all_actions(workflow_dir)
    outdated_actions = []

    for action_repo, usages in sorted(all_actions.items()):
        check_action_for_updates(action_repo, usages, token, outdated_actions)

    print()

    if outdated_actions:
        print_outdated_summary(outdated_actions)
        return 1

    print("✅ All GitHub Actions are up to date!")
    return 0


if __name__ == "__main__":
    sys.exit(check_action_versions())
