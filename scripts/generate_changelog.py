#!/usr/bin/env python3
"""
@module generate_changelog
@description Generate CHANGELOG.md from GitHub releases using the GitHub API
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""

import os
import sys
from datetime import datetime
from typing import Any, Dict, List

try:
    import requests
except ImportError:
    print("Error: requests library not found.")
    print("Please install it using: uv sync")
    sys.exit(1)


def fetch_releases() -> List[Dict[str, Any]]:
    """
    Fetch all releases from GitHub API.

    Returns:
        List of release dictionaries from GitHub API

    Raises:
        SystemExit: If GITHUB_TOKEN is not set or API request fails
    """
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Error: GITHUB_TOKEN environment variable not set")
        sys.exit(1)

    url = "https://api.github.com/repos/tydukes/coding-style-guide/releases"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=30,  # 30 second timeout
            verify=True,  # Verify SSL certificates
        )
        response.raise_for_status()
        releases = response.json()
        print(f"Successfully fetched {len(releases)} releases")
        return releases
    except requests.exceptions.RequestException as e:
        print(f"Error fetching releases from GitHub API: {e}")
        sys.exit(1)


def parse_release_date(published_at: str) -> str:
    """
    Parse ISO 8601 datetime to YYYY-MM-DD format.

    Args:
        published_at: ISO 8601 datetime string

    Returns:
        Date string in YYYY-MM-DD format
    """
    try:
        dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, AttributeError):
        return published_at[:10]  # Fallback to first 10 chars


def generate_markdown(releases: List[Dict[str, Any]]) -> str:
    """
    Convert releases to Markdown changelog format.

    Args:
        releases: List of release dictionaries from GitHub API

    Returns:
        Markdown-formatted changelog string
    """
    changelog = "# Changelog\n\n"
    changelog += (
        "All notable changes to this project will be documented in this file.\n\n"
    )
    changelog += (
        "The format is based on [Keep a Changelog]"
        "(https://keepachangelog.com/en/1.0.0/),\n"
    )
    changelog += (
        "and this project adheres to [Semantic Versioning]"
        "(https://semver.org/spec/v2.0.0.html).\n\n"
    )
    changelog += "## About This Changelog\n\n"
    changelog += "This changelog is automatically generated from GitHub releases. "
    changelog += (
        "Each release includes auto-generated release notes based on "
        "pull requests and commits.\n\n"
    )

    if not releases:
        changelog += "## [Unreleased]\n\nNo releases yet.\n"
        return changelog

    # Add unreleased section
    changelog += "## [Unreleased]\n\n"
    changelog += "Changes that are in the main branch but not yet released.\n\n"

    # Add each release
    for release in releases:
        tag_name = release.get("tag_name", "Unknown")
        published_at = release.get("published_at", "")
        release_date = parse_release_date(published_at)
        body = release.get("body", "No release notes provided.")
        html_url = release.get("html_url", "")
        is_prerelease = release.get("prerelease", False)
        is_draft = release.get("draft", False)

        # Skip draft releases
        if is_draft:
            continue

        # Add prerelease indicator
        prerelease_tag = " (Pre-release)" if is_prerelease else ""

        # Format the release entry
        changelog += f"## [{tag_name}]{prerelease_tag} - {release_date}\n\n"

        # Add release notes body
        if body:
            # Clean up the body
            body = body.strip()
            changelog += f"{body}\n\n"

        # Add link to release page
        if html_url:
            changelog += f"[View Release]({html_url})\n\n"

    # Add footer
    changelog += "---\n\n"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    changelog += f"*This changelog was automatically generated on {timestamp}*\n"

    return changelog


def main():
    """Main execution function."""
    print("Generating changelog from GitHub releases...")

    # Fetch releases
    releases = fetch_releases()

    # Generate markdown
    changelog = generate_markdown(releases)

    # Write to file
    output_file = "docs/changelog.md"
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(changelog)
        print(f"✅ Changelog successfully generated at {output_file}")
        print(
            f"   Total releases: {len([r for r in releases if not r.get('draft', False)])}"
        )
    except IOError as e:
        print(f"Error writing changelog to {output_file}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
