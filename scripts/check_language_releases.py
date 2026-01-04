#!/usr/bin/env python3
"""
Check all 19 supported languages for new releases.
Combines EndOfLife.date API + custom polling.

@module check_language_releases
@description Monitors 19 supported languages for new releases
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-03
@status stable
"""

import os
import sys
import json
import requests
import re
from packaging import version
from typing import Dict, Optional, Any


# Language configuration
LANGUAGES = {
    "python": {
        "source": "endoflife",
        "api": "https://endoflife.date/api/python.json",
        "guide_path": "docs/02_language_guides/python.md",
        "version_pattern": r"Python\s+(\d+\.\d+)(?:\.\d+)?(?:\+)?",
    },
    "terraform": {
        "source": "endoflife",
        "api": "https://endoflife.date/api/terraform.json",
        "guide_path": "docs/02_language_guides/terraform.md",
        "version_pattern": r"Terraform\s+(\d+\.\d+)(?:\.\d+)?(?:\+)?",
    },
    "kubernetes": {
        "source": "endoflife",
        "api": "https://endoflife.date/api/kubernetes.json",
        "guide_path": "docs/02_language_guides/kubernetes.md",
        "version_pattern": r"Kubernetes\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "powershell": {
        "source": "endoflife",
        "api": "https://endoflife.date/api/powershell.json",
        "guide_path": "docs/02_language_guides/powershell.md",
        "version_pattern": r"PowerShell\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "gitlab": {
        "source": "endoflife",
        "api": "https://endoflife.date/api/gitlab.json",
        "guide_path": "docs/02_language_guides/gitlab.md",
        "version_pattern": r"GitLab\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "typescript": {
        "source": "npm",
        "package": "typescript",
        "guide_path": "docs/02_language_guides/typescript.md",
        "version_pattern": r"TypeScript\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "ansible": {
        "source": "pypi",
        "package": "ansible",
        "guide_path": "docs/02_language_guides/ansible.md",
        "version_pattern": r"Ansible\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "bash": {
        "source": "github",
        "repo": "bminor/bash",
        "guide_path": "docs/02_language_guides/bash.md",
        "version_pattern": r"Bash\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "hcl": {
        "source": "terraform",  # HCL versions tied to Terraform
        "api": "https://endoflife.date/api/terraform.json",
        "guide_path": "docs/02_language_guides/hcl.md",
        "version_pattern": r"HCL\s+(\d+)(?:\.\d+)?",
    },
    "yaml": {
        "source": "spec",
        "url": "https://yaml.org/spec/",
        "guide_path": "docs/02_language_guides/yaml.md",
        "version_pattern": r"YAML\s+(\d+\.\d+)(?:\.\d+)?",
        "current": "1.2",  # YAML spec rarely changes
    },
    "json": {
        "source": "spec",
        "url": "https://www.json.org/",
        "guide_path": "docs/02_language_guides/json.md",
        "version_pattern": r"JSON\s+",
        "current": "RFC 8259",  # JSON is stable
    },
    "sql": {
        "source": "spec",
        "url": "https://www.iso.org/standard/",
        "guide_path": "docs/02_language_guides/sql.md",
        "version_pattern": r"SQL\s+",
        "current": "SQL:2023",
    },
    "dockerfile": {
        "source": "docker",
        "guide_path": "docs/02_language_guides/dockerfile.md",
        "version_pattern": r"Docker\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "docker-compose": {
        "source": "github",
        "repo": "docker/compose",
        "guide_path": "docs/02_language_guides/docker_compose.md",
        "version_pattern": r"Compose\s+(?:v)?(\d+\.\d+)(?:\.\d+)?",
    },
    "makefile": {
        "source": "gnu",
        "package": "make",
        "guide_path": "docs/02_language_guides/makefile.md",
        "version_pattern": r"GNU Make\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "groovy": {
        "source": "github",
        "repo": "apache/groovy",
        "guide_path": "docs/02_language_guides/groovy.md",
        "version_pattern": r"Groovy\s+(\d+\.\d+)(?:\.\d+)?",
    },
    "terragrunt": {
        "source": "github",
        "repo": "gruntwork-io/terragrunt",
        "guide_path": "docs/02_language_guides/terragrunt.md",
        "version_pattern": r"Terragrunt\s+(?:v)?(\d+\.\d+)(?:\.\d+)?",
    },
    "cdk": {
        "source": "npm",
        "package": "aws-cdk",
        "guide_path": "docs/02_language_guides/cdk.md",
        "version_pattern": r"AWS CDK\s+(?:v)?(\d+\.\d+)(?:\.\d+)?",
    },
    "github-actions": {
        "source": "docs",
        "url": "https://docs.github.com/en/actions",
        "guide_path": "docs/02_language_guides/github_actions.md",
        "version_pattern": r"Actions\s+",
        "current": "latest",  # GitHub Actions evolve continuously
    },
}


def check_endoflife_api(language_config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Check EndOfLife.date API for latest versions and EOL dates."""
    try:
        response = requests.get(language_config["api"], timeout=10)
        response.raise_for_status()
        releases = response.json()

        if not releases:
            return None

        latest = releases[0]
        return {
            "version": latest.get("cycle", latest.get("latest", "unknown")),
            "eol_date": latest.get("eol"),
            "support_status": latest.get("support", "unknown"),
            "latest_release": latest.get("latest"),
            "release_date": latest.get("releaseDate"),
        }
    except Exception as e:
        print(f"Error checking EndOfLife API: {e}")
        return None


def check_github_releases(repo: str) -> Optional[Dict[str, Any]]:
    """Check GitHub API for latest release."""
    try:
        url = f"https://api.github.com/repos/{repo}/releases/latest"
        headers = {"Authorization": f"token {os.environ.get('GITHUB_TOKEN', '')}"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        release = response.json()

        return {
            "version": release["tag_name"].lstrip("v"),
            "release_date": release["published_at"],
            "url": release["html_url"],
        }
    except Exception as e:
        print(f"Error checking GitHub releases for {repo}: {e}")
        return None


def check_npm_package(package_name: str) -> Optional[Dict[str, Any]]:
    """Check npm registry for latest version."""
    try:
        url = f"https://registry.npmjs.org/{package_name}/latest"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        return {
            "version": data["version"],
            "release_date": data.get("time", {}).get(data["version"]),
        }
    except Exception as e:
        print(f"Error checking npm package {package_name}: {e}")
        return None


def check_pypi_package(package_name: str) -> Optional[Dict[str, Any]]:
    """Check PyPI for latest version."""
    try:
        url = f"https://pypi.org/pypi/{package_name}/json"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        return {
            "version": data["info"]["version"],
            "release_date": None,  # PyPI doesn't provide release dates easily
        }
    except Exception as e:
        print(f"Error checking PyPI package {package_name}: {e}")
        return None


def get_current_version_from_guide(guide_path: str, pattern: str) -> str:
    """Extract current documented version from language guide."""
    try:
        with open(guide_path, "r") as f:
            content = f.read()

        # Look for version patterns
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            # Return the highest version found
            versions = [v for v in matches if v]
            if versions:
                return max(
                    versions,
                    key=lambda v: version.parse(v) if v else version.parse("0.0.0"),
                )
        return "0.0.0"
    except Exception as e:
        print(f"Error reading {guide_path}: {e}")
        return "0.0.0"


def normalize_version(ver: str) -> str:
    """Normalize version string for comparison."""
    # Remove 'v' prefix and common suffixes
    ver = ver.lstrip("v").split("-")[0].split("+")[0]
    # Ensure at least major.minor format
    parts = ver.split(".")
    while len(parts) < 2:
        parts.append("0")
    return ".".join(parts[:3])  # Take only major.minor.patch


def main():
    """Main execution function."""
    new_releases = []

    for lang_name, config in LANGUAGES.items():
        print(f"Checking {lang_name}...", file=sys.stderr)

        latest_info = None

        # Get latest version from source
        if config["source"] == "endoflife":
            latest_info = check_endoflife_api(config)
        elif config["source"] == "github":
            latest_info = check_github_releases(config["repo"])
        elif config["source"] == "npm":
            latest_info = check_npm_package(config["package"])
        elif config["source"] == "pypi":
            latest_info = check_pypi_package(config["package"])
        elif config["source"] in ["spec", "docs", "terraform", "docker", "gnu"]:
            # These have stable specs or special handling
            latest_info = {
                "version": config.get("current", "latest"),
                "eol_date": None,
            }

        if not latest_info:
            print(f"Could not fetch info for {lang_name}", file=sys.stderr)
            continue

        # Get current documented version
        current = get_current_version_from_guide(
            config["guide_path"], config.get("version_pattern", r"(\d+\.\d+)")
        )

        # Normalize versions for comparison
        try:
            latest_ver = normalize_version(str(latest_info["version"]))
            current_ver = normalize_version(current)

            # Compare versions
            if version.parse(latest_ver) > version.parse(current_ver):
                new_releases.append(
                    {
                        "language": lang_name,
                        "current_version": current,
                        "latest_version": latest_info["version"],
                        "eol_date": latest_info.get("eol_date"),
                        "release_date": latest_info.get("release_date"),
                        "guide_path": config["guide_path"],
                        "url": latest_info.get("url", ""),
                    }
                )
                print(
                    f"  → New version available: {current} → {latest_info['version']}",
                    file=sys.stderr,
                )
            else:
                print(f"  ✓ Up to date: {current}", file=sys.stderr)
        except Exception as e:
            print(f"Error comparing versions for {lang_name}: {e}", file=sys.stderr)

    # Output for GitHub Actions
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"new_releases={json.dumps(new_releases)}\n")

    # Also print summary
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"Found {len(new_releases)} language(s) with new releases", file=sys.stderr)
    print(f"{'='*60}", file=sys.stderr)

    return 0 if not new_releases else 1


if __name__ == "__main__":
    sys.exit(main())
