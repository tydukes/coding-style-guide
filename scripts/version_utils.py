#!/usr/bin/env python3
"""
@module version_utils
@description Shared utilities for version checking and comparison
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-03
@status stable
"""

from typing import Optional

import requests


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
