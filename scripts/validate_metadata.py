#!/usr/bin/env python3
"""Simple metadata validator: scans docs/ and code files for required @module tag."""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent / "docs"
pattern = re.compile(r"@module:\s*\w+")
missing = []
for p in root.rglob("*.*"):
    # Skip macOS resource fork files and hidden files
    if p.name.startswith("._") or p.name.startswith("."):
        continue

    if p.suffix.lower() in [
        ".md",
        ".tf",
        ".yml",
        ".yaml",
        ".sh",
        ".py",
        ".ps1",
        ".groovy",
        ".json",
    ]:
        try:
            text = p.read_text(encoding="utf-8")
            if "##" in text or len(text.splitlines()) > 0:  # skip empty
                if not pattern.search(text):
                    missing.append(str(p.relative_to(root.parent)))
        except (UnicodeDecodeError, IOError) as e:
            print(f"Warning: Skipping {p} due to error: {e}")
if missing:
    print("Files missing @module metadata:")
    for m in missing[:50]:
        print(" -", m)
    sys.exit(1)
print("Metadata validation passed.")
