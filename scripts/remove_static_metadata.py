#!/usr/bin/env python3
"""
Remove static metadata from documentation files.

This script removes:
1. date: field from YAML frontmatter
2. version: field from YAML frontmatter
3. **Last Updated**: footers from the end of files
"""

import re
from pathlib import Path
from typing import Tuple


def process_frontmatter(content: str) -> Tuple[str, bool]:
    """Remove date and version fields from YAML frontmatter."""
    modified = False

    # Match frontmatter block
    frontmatter_pattern = r"^---\n(.*?)\n---\n"
    match = re.match(frontmatter_pattern, content, re.DOTALL)

    if not match:
        return content, modified

    frontmatter = match.group(1)
    rest_of_content = content[match.end() :]

    # Remove date field
    new_frontmatter = re.sub(r"^date:.*$\n?", "", frontmatter, flags=re.MULTILINE)

    # Remove version field
    new_frontmatter = re.sub(
        r"^version:.*$\n?", "", new_frontmatter, flags=re.MULTILINE
    )

    if new_frontmatter != frontmatter:
        modified = True

    # Reconstruct content
    result = f"---\n{new_frontmatter}---\n{rest_of_content}"

    return result, modified


def remove_last_updated_footer(content: str) -> Tuple[str, bool]:
    """Remove 'Last Updated' footer from end of file."""
    modified = False

    # Pattern for Last Updated footer (with various formats)
    patterns = [
        r"\n\*\*Last Updated\*\*:.*?$",
        r"\n__Last Updated__:.*?$",
        r"\nlast updated:.*?$",
    ]

    for pattern in patterns:
        new_content = re.sub(pattern, "", content, flags=re.MULTILINE | re.IGNORECASE)
        if new_content != content:
            modified = True
            content = new_content

    return content, modified


def process_file(file_path: Path, base_path: Path) -> bool:
    """Process a single markdown file."""
    try:
        content = file_path.read_text()
        modified = False

        # Remove frontmatter fields
        content, frontmatter_modified = process_frontmatter(content)
        modified = modified or frontmatter_modified

        # Remove Last Updated footer
        content, footer_modified = remove_last_updated_footer(content)
        modified = modified or footer_modified

        if modified:
            file_path.write_text(content)
            print(f"✓ Updated: {file_path.relative_to(base_path)}")
            return True

        return False

    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return False


def main():
    """Process all markdown files in docs directory."""
    base_path = Path("/Volumes/Extreme_SSD/repos/coding-style-guide")
    docs_dir = base_path / "docs"

    if not docs_dir.exists():
        print("Error: docs directory not found")
        return

    md_files = list(docs_dir.rglob("*.md"))
    print(f"Found {len(md_files)} markdown files\n")

    modified_count = 0

    for md_file in sorted(md_files):
        if process_file(md_file, base_path):
            modified_count += 1

    print(f"\n{'='*60}")
    print(f"Modified {modified_count} file(s)")
    print(f"Skipped {len(md_files) - modified_count} file(s) (no changes needed)")


if __name__ == "__main__":
    main()
