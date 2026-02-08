#!/usr/bin/env python3
"""
@module generate_glossary
@description Auto-generate glossary from documentation with cross-references
@version 1.0.0
@author Tyler Dukes
@last_updated 2026-02-08
@status stable

Scans documentation files for term definitions and usage, generates an
alphabetical glossary index, and cross-references terms across documents.

Usage:
    python scripts/generate_glossary.py                    # Generate glossary
    python scripts/generate_glossary.py --scan-new         # Detect undefined terms
    python scripts/generate_glossary.py --dry-run          # Preview without writing
    python scripts/generate_glossary.py --cross-ref        # Add cross-references
"""

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, NamedTuple, Optional, Set


class GlossaryTerm(NamedTuple):
    """A glossary term with its definition and metadata."""

    name: str
    definition: str
    section: str  # alphabetical section letter


class TermReference(NamedTuple):
    """A reference to a term in a document."""

    file_path: str
    display_path: str  # relative path for display


# Files to exclude from scanning
EXCLUDED_FILES = {"glossary.md", "changelog.md"}

# Sections in glossary.md that are not alphabetical term sections
NON_TERM_SECTIONS = {
    "Metadata Tags Reference",
    "Common Abbreviations",
    "Tool Names Quick Reference",
}

FRONTMATTER = """---
title: "Glossary"
description: "Comprehensive glossary of terms used in the Dukes Engineering Style Guide"
author: "Tyler Dukes"
tags: [glossary, terms, definitions, reference, dictionary]
category: "Reference"
status: "active"
---"""


def parse_existing_glossary(glossary_path: Path) -> Dict[str, GlossaryTerm]:
    """
    Parse the existing glossary.md file to extract all defined terms.

    Returns:
        Dict mapping lowercase term name to GlossaryTerm.
    """
    terms: Dict[str, GlossaryTerm] = {}

    if not glossary_path.exists():
        return terms

    content = glossary_path.read_text(encoding="utf-8")
    lines = content.split("\n")

    current_section = ""
    current_term = ""
    current_definition_lines: List[str] = []
    in_frontmatter = False
    frontmatter_count = 0
    in_non_term_section = False

    for line in lines:
        # Handle YAML frontmatter
        if line.strip() == "---":
            frontmatter_count += 1
            if frontmatter_count <= 2:
                in_frontmatter = not in_frontmatter
                continue
        if in_frontmatter:
            continue

        # Detect alphabetical section headers (## A, ## B, etc.)
        section_match = re.match(r"^## ([A-Z])$", line.strip())
        if section_match:
            # Save previous term if exists
            if current_term and not in_non_term_section:
                definition = "\n".join(current_definition_lines).strip()
                definition = re.sub(r"(\n*---\s*)+$", "", definition).strip()
                terms[current_term.lower()] = GlossaryTerm(
                    name=current_term,
                    definition=definition,
                    section=current_section,
                )
            current_section = section_match.group(1)
            current_term = ""
            current_definition_lines = []
            in_non_term_section = False
            continue

        # Detect non-term sections
        non_term_match = re.match(r"^## (.+)$", line.strip())
        if non_term_match:
            # Save previous term
            if current_term and not in_non_term_section:
                definition = "\n".join(current_definition_lines).strip()
                definition = re.sub(r"(\n*---\s*)+$", "", definition).strip()
                terms[current_term.lower()] = GlossaryTerm(
                    name=current_term,
                    definition=definition,
                    section=current_section,
                )
            section_name = non_term_match.group(1).strip()
            if section_name in NON_TERM_SECTIONS:
                in_non_term_section = True
            current_term = ""
            current_definition_lines = []
            continue

        if in_non_term_section:
            continue

        # Detect term definitions (### Term Name)
        term_match = re.match(r"^### (.+)$", line.strip())
        if term_match:
            # Save previous term
            if current_term:
                definition = "\n".join(current_definition_lines).strip()
                # Strip trailing horizontal rules from definitions
                definition = re.sub(r"(\n*---\s*)+$", "", definition).strip()
                terms[current_term.lower()] = GlossaryTerm(
                    name=current_term,
                    definition=definition,
                    section=current_section,
                )
            current_term = term_match.group(1).strip()
            current_definition_lines = []
            continue

        # Collect definition lines
        if current_term:
            current_definition_lines.append(line)

    # Save last term
    if current_term and not in_non_term_section:
        definition = "\n".join(current_definition_lines).strip()
        definition = re.sub(r"(\n*---\s*)+$", "", definition).strip()
        terms[current_term.lower()] = GlossaryTerm(
            name=current_term,
            definition=definition,
            section=current_section,
        )

    return terms


def parse_supplementary_sections(glossary_path: Path) -> str:
    """
    Extract non-term sections (Metadata Tags, Abbreviations, Tools) from
    the existing glossary to preserve them in regenerated output.

    Returns:
        String containing the supplementary sections content.
    """
    if not glossary_path.exists():
        return ""

    content = glossary_path.read_text(encoding="utf-8")
    lines = content.split("\n")

    supplementary_lines: List[str] = []
    capturing = False
    in_frontmatter = False
    frontmatter_count = 0

    for line in lines:
        if line.strip() == "---":
            frontmatter_count += 1
            if frontmatter_count <= 2:
                in_frontmatter = not in_frontmatter
                continue
        if in_frontmatter:
            continue

        # Start capturing at first non-term section
        non_term_match = re.match(r"^## (.+)$", line.strip())
        if non_term_match:
            section_name = non_term_match.group(1).strip()
            if section_name in NON_TERM_SECTIONS:
                capturing = True
            elif re.match(r"^[A-Z]$", section_name):
                capturing = False
                continue

        if capturing:
            supplementary_lines.append(line)

    result = "\n".join(supplementary_lines).strip()

    # Strip trailing footer (Total Terms, GitHub link) to avoid duplication
    footer_patterns = [
        r"\*\*Total Terms\*\*:.*",
        r"For additional terms.*",
        r"\[GitHub repository\].*",
    ]
    for pattern in footer_patterns:
        result = re.sub(pattern, "", result)

    # Clean up trailing separators and whitespace
    result = re.sub(r"\n---\s*$", "", result.rstrip())

    return result.strip()


def scan_docs_for_term_usage(
    docs_dir: Path, terms: Dict[str, GlossaryTerm]
) -> Dict[str, List[TermReference]]:
    """
    Scan all documentation files for usage of glossary terms.

    Returns:
        Dict mapping lowercase term name to list of TermReferences.
    """
    references: Dict[str, List[TermReference]] = defaultdict(list)

    md_files = sorted(docs_dir.rglob("*.md"))

    for md_file in md_files:
        relative_path = md_file.relative_to(docs_dir)

        # Skip excluded files
        if relative_path.name in EXCLUDED_FILES:
            continue

        content = md_file.read_text(encoding="utf-8")

        # Strip code blocks to avoid false positives
        content_no_code = re.sub(r"```[\s\S]*?```", "", content)
        content_no_code = re.sub(r"`[^`]+`", "", content_no_code)

        for term_key, term in terms.items():
            # Build pattern: match the term name as a whole word (case-insensitive)
            # Handle terms with parenthetical notes like "CI/CD (Continuous Integration...)"
            base_name = term.name.split("(")[0].strip()
            if len(base_name) < 2:
                continue

            pattern = re.compile(r"\b" + re.escape(base_name) + r"\b", re.IGNORECASE)
            if pattern.search(content_no_code):
                display = str(relative_path).replace("\\", "/")
                ref = TermReference(file_path=str(md_file), display_path=display)
                # Avoid duplicate references
                if not any(r.display_path == display for r in references[term_key]):
                    references[term_key].append(ref)

    return references


def detect_candidate_terms(docs_dir: Path, known_terms: Set[str]) -> Dict[str, int]:
    """
    Scan docs for bold terms (**Term**) that aren't in the glossary.

    Returns:
        Dict mapping candidate term to occurrence count.
    """
    candidates: Dict[str, int] = defaultdict(int)
    bold_pattern = re.compile(r"\*\*([A-Z][A-Za-z0-9 /\-()]+)\*\*")

    md_files = sorted(docs_dir.rglob("*.md"))

    for md_file in md_files:
        relative_path = md_file.relative_to(docs_dir)
        if relative_path.name in EXCLUDED_FILES:
            continue

        content = md_file.read_text(encoding="utf-8")

        # Strip code blocks
        content_no_code = re.sub(r"```[\s\S]*?```", "", content)

        for match in bold_pattern.finditer(content_no_code):
            term = match.group(1).strip()
            # Skip short terms and known terms
            if len(term) < 3:
                continue
            if term.lower() in known_terms:
                continue
            # Skip common non-term patterns
            if term.startswith(("Version", "Note", "Warning", "Important")):
                continue
            if ":" in term:
                continue
            candidates[term] += 1

    # Filter to terms appearing in 3+ documents
    return {k: v for k, v in candidates.items() if v >= 3}


def generate_glossary_content(
    terms: Dict[str, GlossaryTerm],
    references: Optional[Dict[str, List[TermReference]]] = None,
    supplementary: str = "",
    cross_ref: bool = False,
) -> str:
    """
    Generate the full glossary.md content from parsed terms.

    Args:
        terms: Dict of parsed glossary terms.
        references: Optional cross-reference data.
        supplementary: Preserved non-term sections content.
        cross_ref: Whether to include cross-reference links.

    Returns:
        Complete glossary.md content string.
    """
    sections: Dict[str, List[GlossaryTerm]] = defaultdict(list)

    for term in terms.values():
        sections[term.section].append(term)

    # Sort terms within each section alphabetically
    for section in sections:
        sections[section].sort(key=lambda t: t.name.lower())

    lines = [FRONTMATTER, ""]
    lines.append(
        "This glossary defines terms used throughout the Dukes Engineering "
        "Style Guide, including technical concepts, tool names,"
    )
    lines.append("metadata tags, and industry terminology.")
    lines.append("")

    # Generate alphabetical sections
    for letter in sorted(sections.keys()):
        lines.append(f"## {letter}")
        lines.append("")

        for term in sections[letter]:
            lines.append(f"### {term.name}")
            lines.append("")
            lines.append(term.definition)

            # Add cross-references if enabled
            if cross_ref and references and term.name.lower() in references:
                refs = references[term.name.lower()]
                if refs:
                    lines.append("")
                    ref_links = []
                    for ref in sorted(refs, key=lambda r: r.display_path):
                        # Create relative link from glossary to the doc
                        ref_links.append(f"[{ref.display_path}]({ref.display_path})")
                    ref_text = f"*Referenced in: {', '.join(ref_links[:5])}"
                    if len(refs) > 5:
                        ref_text += f" and {len(refs) - 5} more*"
                    else:
                        ref_text += "*"
                    lines.append(ref_text)

            lines.append("")

    # Add supplementary sections
    if supplementary:
        lines.append("---")
        lines.append("")
        lines.append(supplementary)
        lines.append("")

    # Footer
    lines.append("---")
    lines.append("")
    lines.append(f"**Total Terms**: {len(terms)}+")
    lines.append("")
    lines.append(
        "For additional terms or clarifications, please refer to the specific "
        "language guides or open an issue on the"
    )
    lines.append(
        "[GitHub repository](https://github.com/tydukes/coding-style-guide/issues)."
    )
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Auto-generate glossary from documentation"
    )
    parser.add_argument(
        "--scan-new",
        action="store_true",
        help="Detect candidate terms not yet in the glossary",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing to file",
    )
    parser.add_argument(
        "--cross-ref",
        action="store_true",
        help="Add cross-reference links to glossary terms",
    )
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=Path("docs"),
        help="Path to documentation directory (default: docs/)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output path (default: docs/glossary.md)",
    )
    args = parser.parse_args()

    docs_dir = args.docs_dir
    glossary_path = docs_dir / "glossary.md"
    output_path = args.output or glossary_path

    if not docs_dir.exists():
        print(f"Error: Documentation directory {docs_dir} not found", file=sys.stderr)
        return 1

    # Parse existing glossary
    print("Parsing existing glossary...")
    terms = parse_existing_glossary(glossary_path)
    print(f"  Found {len(terms)} defined terms")

    # Preserve supplementary sections
    supplementary = parse_supplementary_sections(glossary_path)

    # Scan for term usage across docs
    references: Optional[Dict[str, List[TermReference]]] = None
    if args.cross_ref or args.scan_new:
        print("Scanning documentation for term usage...")
        references = scan_docs_for_term_usage(docs_dir, terms)
        referenced_count = sum(1 for refs in references.values() if refs)
        print(f"  {referenced_count}/{len(terms)} terms referenced in docs")

    # Detect candidate terms
    if args.scan_new:
        print("\nScanning for candidate terms not in glossary...")
        candidates = detect_candidate_terms(docs_dir, set(terms.keys()))
        if candidates:
            print(f"\n  Found {len(candidates)} candidate terms (3+ occurrences):")
            print("  " + "-" * 60)
            for term, count in sorted(candidates.items(), key=lambda x: (-x[1], x[0])):
                print(f"    {term:<40} ({count} occurrences)")
            print("  " + "-" * 60)
            print(
                "  Add these terms to docs/glossary.md manually, then re-run "
                "to include them."
            )
        else:
            print("  No new candidate terms found.")
        return 0

    # Generate glossary content
    print("Generating glossary...")
    content = generate_glossary_content(
        terms=terms,
        references=references,
        supplementary=supplementary,
        cross_ref=args.cross_ref,
    )

    if args.dry_run:
        print(f"\n--- Preview ({output_path}) ---")
        # Show first 50 lines and last 10 lines
        preview_lines = content.split("\n")
        if len(preview_lines) > 60:
            for line in preview_lines[:50]:
                print(line)
            print(f"\n... ({len(preview_lines) - 60} lines omitted) ...\n")
            for line in preview_lines[-10:]:
                print(line)
        else:
            print(content)
        print(f"\nTotal: {len(preview_lines)} lines, {len(terms)} terms")
        return 0

    # Write output
    output_path.write_text(content, encoding="utf-8")
    print(f"\n  Wrote {len(terms)} terms to {output_path}")

    if args.cross_ref and references:
        referenced = sum(1 for refs in references.values() if refs)
        print(f"  Cross-referenced {referenced} terms across documentation")

    print("\nDone!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
