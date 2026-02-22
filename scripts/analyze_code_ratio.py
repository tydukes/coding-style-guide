#!/usr/bin/env python3
"""
Analyze code-to-text ratio in language guide markdown files.
Target: 3:1 code-to-text ratio
"""

import sys
from pathlib import Path
from typing import Dict, Tuple


def analyze_markdown_file(file_path: Path) -> Tuple[int, int, float]:
    """
    Analyze a markdown file for code-to-text ratio.

    Returns:
        (code_lines, text_lines, ratio)
    """
    content = file_path.read_text(encoding="utf-8")
    lines = content.split("\n")

    code_lines = 0
    text_lines = 0
    in_code_block = False
    in_frontmatter = False
    frontmatter_count = 0

    for line in lines:
        # Handle YAML frontmatter
        if line.strip() == "---":
            frontmatter_count += 1
            if frontmatter_count <= 2:
                in_frontmatter = not in_frontmatter
                continue

        if in_frontmatter:
            continue

        # Detect code blocks
        if line.strip().startswith("```"):
            in_code_block = not in_code_block
            continue

        # Count lines
        if in_code_block:
            # Count all lines in code blocks, including blank lines
            # (they're part of code formatting)
            code_lines += 1
        else:
            # Only count non-blank lines as text
            if line.strip():
                text_lines += 1

    # Calculate ratio
    ratio = code_lines / text_lines if text_lines > 0 else 0

    return code_lines, text_lines, ratio


# Guides exempt from the 3:1 ratio requirement.
# These are reference/comparison pages whose value is in structured tables,
# not code examples, so the ratio metric is not meaningful for them.
EXEMPT_GUIDES = {
    "comparison_matrix",
}


def main():
    """Main analysis function."""
    guides_dir = Path("docs/02_language_guides")

    if not guides_dir.exists():
        print(f"Error: Directory {guides_dir} not found", file=sys.stderr)
        sys.exit(1)

    guide_files = sorted(guides_dir.glob("*.md"))

    if not guide_files:
        print(f"Error: No markdown files found in {guides_dir}", file=sys.stderr)
        sys.exit(1)

    results: Dict[str, Tuple[int, int, float]] = {}

    print("Code-to-Text Ratio Analysis")
    print("=" * 80)
    print(
        f"{'Language Guide':<30} {'Code Lines':>12} {'Text Lines':>12} {'Ratio':>10} {'Status':>10}"
    )
    print("-" * 80)

    total_code = 0
    total_text = 0
    below_target = []
    exempt_count = 0

    for guide_file in guide_files:
        guide_name = guide_file.stem
        code_lines, text_lines, ratio = analyze_markdown_file(guide_file)
        results[guide_name] = (code_lines, text_lines, ratio)

        if guide_name in EXEMPT_GUIDES:
            status = "⬜ EXEMPT"
            exempt_count += 1
        else:
            total_code += code_lines
            total_text += text_lines
            status = "✅ PASS" if ratio >= 3.0 else "❌ FAIL"
            if ratio < 3.0:
                below_target.append((guide_name, ratio, code_lines, text_lines))

        print(
            f"{guide_name:<30} {code_lines:>12} {text_lines:>12} {ratio:>10.2f} {status:>10}"
        )

    print("-" * 80)
    overall_ratio = total_code / total_text if total_text > 0 else 0
    overall_status = "✅ PASS" if overall_ratio >= 3.0 else "❌ FAIL"
    print(
        f"{'OVERALL':<30} {total_code:>12} {total_text:>12} "
        f"{overall_ratio:>10.2f} {overall_status:>10}"
    )
    print("=" * 80)

    if below_target:
        print(f"\n{len(below_target)} guides below 3:1 target ratio:")
        for guide_name, ratio, code_lines, text_lines in sorted(
            below_target, key=lambda x: x[1]
        ):
            needed_code = (text_lines * 3) - code_lines
            print(
                f"  - {guide_name}: {ratio:.2f} (needs ~{needed_code} more code lines)"
            )

    eligible = len(guide_files) - exempt_count
    passing = eligible - len(below_target)
    print("\nTarget: 3:1 code-to-text ratio")
    if exempt_count:
        print(f"Exempt:  {exempt_count} guide(s) — {', '.join(sorted(EXEMPT_GUIDES))}")
    print(f"Achievement: {passing}/{eligible} guides pass")

    return 0 if not below_target else 1


if __name__ == "__main__":
    sys.exit(main())
