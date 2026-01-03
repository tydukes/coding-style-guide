#!/usr/bin/env python3
"""
@module validate_versions
@description Validate that versions.yml is synchronized with latest releases
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-03
@status stable
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
import yaml


def load_versions_yml() -> Dict:
    """
    Load the centralized versions.yml file.

    Returns:
        Dictionary containing all version definitions
    """
    versions_file = Path(".github/versions.yml")
    if not versions_file.exists():
        print("::error::versions.yml not found at .github/versions.yml")
        sys.exit(1)

    with open(versions_file) as f:
        return yaml.safe_load(f)


def get_latest_release_tag(repo: str, token: str) -> Optional[str]:
    """
    Get the latest release tag for a GitHub repository.

    Args:
        repo: Repository in format 'owner/repo'
        token: GitHub API token

    Returns:
        Latest release tag (e.g., 'v4') or None if not found
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


def normalize_version(version: str) -> str:
    """
    Normalize version tags for comparison.

    Args:
        version: Version string (e.g., 'v4', 'v4.1.0')

    Returns:
        Normalized version for comparison
    """
    if version.startswith("v"):
        version = version[1:]

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

    current_normalized = normalize_version(current)
    latest_normalized = normalize_version(latest)

    try:
        current_int = int(current_normalized)
        latest_int = int(latest_normalized)
        return current_int < latest_int
    except ValueError:
        return current != latest


def check_action_version(
    action_name: str, action_repo: str, current_version: str, token: str
) -> Tuple[bool, str]:
    """
    Check if an action version is up to date.

    Args:
        action_name: Friendly name of the action
        action_repo: Repository in format 'owner/repo'
        current_version: Current version in versions.yml
        token: GitHub API token

    Returns:
        Tuple of (is_outdated, latest_version)
    """
    latest_tag = get_latest_release_tag(action_repo, token)

    if not latest_tag:
        print(f"⚠️  Could not determine latest version for {action_name}")
        return False, current_version

    if is_version_outdated(current_version, latest_tag):
        print(f"❌ {action_name}: {current_version} -> {latest_tag} is outdated")
        return True, latest_tag
    else:
        print(f"✅ {action_name}: {current_version} is up to date")
        return False, latest_tag


def validate_versions() -> int:
    """
    Validate that versions.yml contains the latest versions.

    Returns:
        Exit code (0 if all up to date, 1 if outdated versions found)
    """
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("::error::GITHUB_TOKEN environment variable not set!")
        return 1

    print("Validating versions.yml against latest releases...\n")

    versions_data = load_versions_yml()
    outdated: List[Tuple[str, str, str]] = []

    # Map of action names to their GitHub repos
    action_repos = {
        "checkout": "actions/checkout",
        "setup-python": "actions/setup-python",
        "setup-node": "actions/setup-node",
        "cache": "actions/cache",
        "upload-artifact": "actions/upload-artifact",
        "github-script": "actions/github-script",
        "astral-sh-setup-uv": "astral-sh/setup-uv",
        "docker-setup-buildx": "docker/setup-buildx-action",
        "docker-login": "docker/login-action",
        "docker-metadata": "docker/metadata-action",
        "docker-build-push": "docker/build-push-action",
        "anchore-sbom": "anchore/sbom-action",
        "markdown-link-check": "gaurav-nelson/github-action-markdown-link-check",
    }

    # Check each action version
    for action_name, repo in action_repos.items():
        current_version = versions_data["actions"].get(action_name)
        if not current_version:
            print(f"⚠️  {action_name} not found in versions.yml")
            continue

        is_outdated, latest_version = check_action_version(
            action_name, repo, current_version, token
        )

        if is_outdated:
            outdated.append((action_name, current_version, latest_version))

    print()

    if outdated:
        print("::error::Outdated versions detected in versions.yml!")
        print("\nThe following versions are outdated:\n")
        for action, current, latest in outdated:
            print(f"  - {action}: {current} -> {latest}")
        return 1

    print("✅ All versions in versions.yml are up to date!")
    return 0


if __name__ == "__main__":
    sys.exit(validate_versions())
