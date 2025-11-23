#!/usr/bin/env python3
"""
@module validate_metadata
@description Comprehensive metadata validation tool for code metadata tags
@dependencies pathlib, re, argparse, sys, json
@version 2.0.0
@author Tyler Dukes
@last_updated 2025-10-28
@status stable
@python_version >= 3.8
"""
import argparse
import json
import pathlib
import re
import sys
from typing import Dict, List, Optional

# Semantic versioning regex pattern
SEMVER_PATTERN = re.compile(r"^\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\.\d+)?$")

# ISO 8601 date pattern (YYYY-MM-DD)
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Language-specific file extensions and comment patterns
LANGUAGE_CONFIG = {
    "python": {
        "extensions": [".py"],
        "patterns": [
            re.compile(r'""".*?@module\s+(\S+)', re.DOTALL),  # Docstring
            re.compile(r"#\s*@module\s+(\S+)"),  # Comment
        ],
    },
    "terraform": {
        "extensions": [".tf", ".hcl"],
        "patterns": [
            re.compile(r"/\*\*.*?@module\s+(\S+)", re.DOTALL),  # Block comment
            re.compile(r"#\s*@module\s+(\S+)"),  # Inline comment
        ],
    },
    "typescript": {
        "extensions": [".ts", ".tsx", ".js", ".jsx"],
        "patterns": [
            re.compile(r"/\*\*.*?@module\s+(\S+)", re.DOTALL),  # JSDoc
            re.compile(r"//\s*@module\s+(\S+)"),  # Inline comment
        ],
    },
    "bash": {
        "extensions": [".sh", ".bash"],
        "patterns": [
            re.compile(r"#\s*@module\s+(\S+)"),
        ],
    },
    "powershell": {
        "extensions": [".ps1", ".psm1"],
        "patterns": [
            re.compile(r"#\s*@module\s+(\S+)"),
        ],
    },
    "yaml": {
        "extensions": [".yml", ".yaml"],
        "patterns": [
            re.compile(r"#\s*@module\s+(\S+)"),
        ],
    },
    "sql": {
        "extensions": [".sql"],
        "patterns": [
            re.compile(r"/\*.*?@module\s+(\S+)", re.DOTALL),
        ],
    },
    "markdown": {
        "extensions": [".md"],
        "patterns": [
            re.compile(r"<!--.*?@module\s+(\S+)", re.DOTALL),
        ],
    },
}

# All supported extensions
ALL_EXTENSIONS = []
for config in LANGUAGE_CONFIG.values():
    ALL_EXTENSIONS.extend(config["extensions"])


class MetadataValidator:
    """Validates metadata tags in code and documentation files."""

    def __init__(
        self,
        paths: List[pathlib.Path],
        language: Optional[str] = None,
        strict: bool = False,
        check_unique: bool = True,
    ):
        self.paths = paths
        self.language = language
        self.strict = strict
        self.check_unique = check_unique
        self.errors: List[Dict] = []
        self.warnings: List[Dict] = []
        self.module_names: Dict[str, str] = {}  # module_name -> file_path

    def validate_all(self) -> bool:
        """Validate all files and return True if valid."""
        files_to_check = self._collect_files()

        if not files_to_check:
            print(f"No files found matching criteria in {self.paths}")
            return True

        print(f"Validating {len(files_to_check)} files...")

        for file_path in files_to_check:
            self._validate_file(file_path)

        return self._report_results()

    def _collect_files(self) -> List[pathlib.Path]:
        """Collect all files to validate."""
        files = []
        for path in self.paths:
            if path.is_file():
                files.append(path)
            elif path.is_dir():
                for ext in self._get_extensions():
                    files.extend(path.rglob(f"*{ext}"))
        return sorted(set(files))

    def _get_extensions(self) -> List[str]:
        """Get file extensions to check based on language filter."""
        if self.language and self.language in LANGUAGE_CONFIG:
            return LANGUAGE_CONFIG[self.language]["extensions"]
        return ALL_EXTENSIONS

    def _validate_file(self, file_path: pathlib.Path) -> None:
        """Validate metadata in a single file."""
        # Skip hidden files and macOS resource forks
        if file_path.name.startswith(".") or file_path.name.startswith("._"):
            return

        try:
            content = file_path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, IOError) as e:
            self.warnings.append(
                {
                    "file": str(file_path),
                    "type": "read_error",
                    "message": f"Could not read file: {e}",
                }
            )
            return

        # Skip empty files
        if not content.strip():
            return

        # Extract metadata tags
        metadata = self._extract_metadata(file_path, content)

        # Validate required tags
        self._validate_required_tags(file_path, metadata)

        # Validate tag formats
        self._validate_tag_formats(file_path, metadata)

        # Check for duplicate module names
        if self.check_unique and "@module" in metadata:
            module_name = metadata["@module"]
            if module_name in self.module_names:
                self.errors.append(
                    {
                        "file": str(file_path),
                        "type": "duplicate_module",
                        "tag": "@module",
                        "value": module_name,
                        "message": f"Duplicate module name '{module_name}' "
                        f"(also in {self.module_names[module_name]})",
                    }
                )
            else:
                self.module_names[module_name] = str(file_path)

    def _extract_metadata(
        self, file_path: pathlib.Path, content: str
    ) -> Dict[str, str]:
        """Extract all metadata tags from file content."""
        metadata = {}

        # Only look in the first 100 lines (metadata should be in file header)
        lines = content.split("\n")[:100]
        header_content = "\n".join(lines)

        # Extract all metadata tags from header only
        # Use non-greedy match and stop at newline or comma (for multi-value fields)
        tag_pattern = re.compile(r"@(\w+)\s+([^\n]+)")
        for match in tag_pattern.finditer(header_content):
            tag_name = f"@{match.group(1)}"
            tag_value = match.group(2).strip()
            # Skip if value looks like a description of the tag itself
            if "format" not in tag_value.lower() and len(tag_value) < 200:
                metadata[tag_name] = tag_value

        return metadata

    def _get_patterns_for_file(self, file_path: pathlib.Path) -> List[re.Pattern]:
        """Get regex patterns for a specific file type."""
        for lang_config in LANGUAGE_CONFIG.values():
            if file_path.suffix in lang_config["extensions"]:
                return lang_config["patterns"]
        return []

    def _validate_required_tags(
        self, file_path: pathlib.Path, metadata: Dict[str, str]
    ) -> None:
        """Validate that required tags are present."""
        required_tags = ["@module", "@description", "@version"]

        for tag in required_tags:
            if tag not in metadata:
                self.errors.append(
                    {
                        "file": str(file_path),
                        "type": "missing_required_tag",
                        "tag": tag,
                        "message": f"Missing required tag: {tag}",
                    }
                )

    def _validate_tag_formats(
        self, file_path: pathlib.Path, metadata: Dict[str, str]
    ) -> None:
        """Validate format of metadata tag values."""
        # Validate @version format (semantic versioning)
        if "@version" in metadata:
            version = metadata["@version"]
            if not SEMVER_PATTERN.match(version):
                self.errors.append(
                    {
                        "file": str(file_path),
                        "type": "invalid_version_format",
                        "tag": "@version",
                        "value": version,
                        "message": f"Invalid version format '{version}' "
                        "(expected semantic versioning: MAJOR.MINOR.PATCH)",
                    }
                )

        # Validate @last_updated format (ISO 8601 date)
        if "@last_updated" in metadata:
            date = metadata["@last_updated"]
            if not DATE_PATTERN.match(date):
                self.errors.append(
                    {
                        "file": str(file_path),
                        "type": "invalid_date_format",
                        "tag": "@last_updated",
                        "value": date,
                        "message": f"Invalid date format '{date}' "
                        "(expected ISO 8601: YYYY-MM-DD)",
                    }
                )

        # Validate @module format (lowercase with underscores or kebab-case)
        if "@module" in metadata:
            module = metadata["@module"]
            if not re.match(r"^[a-z][a-z0-9_-]*$", module):
                self.warnings.append(
                    {
                        "file": str(file_path),
                        "type": "invalid_module_format",
                        "tag": "@module",
                        "value": module,
                        "message": f"Module name '{module}' should be lowercase with "
                        "underscores or hyphens",
                    }
                )

        # Validate @status values
        if "@status" in metadata:
            status = metadata["@status"]
            valid_statuses = [
                "draft",
                "in-progress",
                "review",
                "stable",
                "deprecated",
                "archived",
            ]
            if status not in valid_statuses:
                self.warnings.append(
                    {
                        "file": str(file_path),
                        "type": "invalid_status",
                        "tag": "@status",
                        "value": status,
                        "message": f"Invalid status '{status}' "
                        f"(valid: {', '.join(valid_statuses)})",
                    }
                )

    def _report_results(self) -> bool:
        """Report validation results and return success status."""
        print()

        if self.warnings:
            print(f"⚠️  {len(self.warnings)} warnings:")
            for warning in self.warnings[:20]:  # Limit output
                print(f"  - {warning['file']}: {warning['message']}")
            if len(self.warnings) > 20:
                print(f"  ... and {len(self.warnings) - 20} more warnings")
            print()

        if self.errors:
            print(f"❌ {len(self.errors)} errors:")
            for error in self.errors[:20]:  # Limit output
                print(f"  - {error['file']}: {error['message']}")
            if len(self.errors) > 20:
                print(f"  ... and {len(self.errors) - 20} more errors")
            print()
            print("Metadata validation FAILED.")
            return False

        print("✅ Metadata validation PASSED.")
        if self.warnings:
            print(f"   ({len(self.warnings)} warnings)")
        return True


def main():
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(
        description="Validate metadata tags in code and documentation files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Validate all files in docs/
  %(prog)s docs/

  # Validate specific file
  %(prog)s src/api/auth.py

  # Validate only Python files
  %(prog)s --language python src/

  # Validate all Terraform modules
  %(prog)s --language terraform infrastructure/

  # Strict mode (warnings treated as errors)
  %(prog)s --strict docs/

  # Export results to JSON
  %(prog)s --output results.json src/
        """,
    )

    parser.add_argument(
        "paths",
        nargs="+",
        type=pathlib.Path,
        help="Files or directories to validate",
    )

    parser.add_argument(
        "--language",
        choices=list(LANGUAGE_CONFIG.keys()),
        help="Filter by language (only check files of this type)",
    )

    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as errors",
    )

    parser.add_argument(
        "--no-unique-check",
        action="store_true",
        help="Skip checking for duplicate module names",
    )

    parser.add_argument(
        "--output",
        type=pathlib.Path,
        help="Output results to JSON file",
    )

    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 2.0.0",
    )

    args = parser.parse_args()

    # Validate paths exist
    for path in args.paths:
        if not path.exists():
            print(f"Error: Path does not exist: {path}", file=sys.stderr)
            sys.exit(1)

    # Create validator
    validator = MetadataValidator(
        paths=args.paths,
        language=args.language,
        strict=args.strict,
        check_unique=not args.no_unique_check,
    )

    # Run validation
    success = validator.validate_all()

    # Export to JSON if requested
    if args.output:
        results = {
            "success": success,
            "errors": validator.errors,
            "warnings": validator.warnings,
        }
        args.output.write_text(json.dumps(results, indent=2))
        print(f"\nResults exported to: {args.output}")

    # Exit with appropriate code
    if args.strict and validator.warnings:
        sys.exit(1)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
