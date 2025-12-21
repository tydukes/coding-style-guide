#!/usr/bin/env python3
"""
Remove hardcoded version information from document footers.
"""
import re
from pathlib import Path


def remove_version_footer(file_path: Path) -> bool:
    """
    Remove hardcoded version and date information from document footers.

    Returns:
        True if file was modified, False otherwise
    """
    content = file_path.read_text(encoding="utf-8")
    original_content = content

    # Pattern 1: *Template Version: X.Y.Z* (italic format)
    content = re.sub(r"^\*Template Version:.*?\*\s*$", "", content, flags=re.MULTILINE)

    # Pattern 2: *Last Updated: YYYY-MM-DD* (italic format)
    content = re.sub(r"^\*Last Updated:.*?\*\s*$", "", content, flags=re.MULTILINE)

    # Pattern 3: **Version**: X.Y.Z (bold format)
    content = re.sub(r"^\*\*Version\*\*:.*?$", "", content, flags=re.MULTILINE)

    # Pattern 4: **Template Version**: X.Y.Z (bold format)
    content = re.sub(r"^\*\*Template Version\*\*:.*?$", "", content, flags=re.MULTILINE)

    # Clean up multiple consecutive blank lines (max 2)
    content = re.sub(r"\n{4,}", "\n\n\n", content)

    # Clean up trailing whitespace at end of file
    content = content.rstrip() + "\n"

    if content != original_content:
        file_path.write_text(content, encoding="utf-8")
        return True
    return False


def main():
    """Remove hardcoded versions from all documentation files."""
    docs_dir = Path("docs")
    modified_files = []

    for md_file in docs_dir.rglob("*.md"):
        if remove_version_footer(md_file):
            modified_files.append(md_file)
            print(f"✓ Removed version info from: {md_file}")

    print(f"\n{len(modified_files)} files modified")

    if modified_files:
        print("\nModified files:")
        for f in sorted(modified_files):
            print(f"  - {f}")


if __name__ == "__main__":
    main()
