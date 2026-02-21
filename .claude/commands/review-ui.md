# Review UI

You are a UI reviewer for the **Dukes Engineering Style Guide** MkDocs documentation site.

The site uses the **Material for MkDocs** theme with custom CSS (`features.css`, `toc.css`,
`print.css`) and JavaScript (`shortcuts.js`, `related-pages.js`, `bookmarks.js`).

Your job is to surface structural, navigational, and visual issues that would affect readers
of the published site at `https://tydukes.github.io/coding-style-guide/`.

Working directory: `/Volumes/Extreme_SSD/repos/coding-style-guide`

---

## Review Sequence

Run each check in order. Do not stop on failure — complete all checks and summarize at the end.

### Check 1 — Build (strict mode)

```bash
uv run mkdocs build --strict 2>&1 \
  | grep -E "^(WARNING|ERROR|INFO.*(anchor|link|relative))" | head -40
```

Captures any MkDocs warnings about missing files, broken anchors, or invalid references.
These are the highest-priority issues — the `--strict` flag would block CI if any
`WARNING`-level messages appear. `INFO`-level anchor warnings are non-blocking but still
indicate broken in-page deep-links that frustrate readers.

### Check 2 — Nav completeness

Verify every file in `nav:` exists on disk, and flag any `.md` files on disk not
referenced in `nav:` (orphaned pages). Note: `mkdocs.yml` uses a `!!python/name:` YAML
tag that requires preprocessing before parsing with `yaml.safe_load`.

```bash
uv run python3 - <<'EOF'
import yaml, os, glob, re

with open("mkdocs.yml") as f:
    content = f.read()

# Strip Python-specific YAML tags that SafeLoader can't handle
content = re.sub(r'!!python/\S+', 'null', content)
cfg = yaml.safe_load(content)

def extract_nav_files(nav, files=None):
    if files is None:
        files = []
    if isinstance(nav, list):
        for item in nav:
            extract_nav_files(item, files)
    elif isinstance(nav, dict):
        for v in nav.values():
            extract_nav_files(v, files)
    elif isinstance(nav, str):
        files.append(nav)
    return files

nav_files = set(extract_nav_files(cfg.get("nav", [])))
disk_files = set(
    os.path.relpath(p, "docs")
    for p in glob.glob("docs/**/*.md", recursive=True)
    if not any(x in p for x in [".venv", "__pycache__"])
)

missing  = [f for f in nav_files  if not os.path.exists(f"docs/{f}")]
orphaned = [f for f in disk_files if f not in nav_files]

print(f"Nav entries:   {len(nav_files)}")
print(f"Files on disk: {len(disk_files)}")
print()
if missing:
    print("MISSING (in nav but not on disk):")
    for f in sorted(missing): print(f"  ❌ {f}")
else:
    print("✅ No missing files")
print()
if orphaned:
    print("ORPHANED (on disk but not in nav):")
    for f in sorted(orphaned): print(f"  ⚠️  {f}")
else:
    print("✅ No orphaned pages")
EOF
```

Known acceptable orphans: `ISSUE_81_CLOSURE_SUMMARY.md`, `TERRAFORM_RATIO_IMPROVEMENT_PLAN.md`
(internal planning docs). `04_templates/language_guide_template.md` is intentionally unlisted.
Flag any new orphans that appear.

### Check 3 — Heading structure

Each page should have exactly one H1 (either via frontmatter `title:` or a `#` heading in
the body) and maintain proper hierarchy (no skipping levels, e.g. H2 → H4 without H3).

MkDocs Material renders `title:` from YAML frontmatter as the page H1 — pages with a
frontmatter title do not need a `#` heading in the body. Files with both frontmatter title
and multiple body H1s are flagged.

```bash
uv run python3 - <<'EOF'
import glob, re

issues = []
for path in sorted(glob.glob("docs/**/*.md", recursive=True)):
    with open(path) as f:
        lines = f.readlines()

    has_frontmatter_title = False
    content_lines = lines
    if lines and lines[0].strip() == "---":
        end = next((i for i, l in enumerate(lines[1:], 1) if l.strip() == "---"), None)
        if end:
            fm = "".join(lines[1:end])
            has_frontmatter_title = bool(re.search(r"^title:", fm, re.MULTILINE))
            content_lines = lines[end + 1:]

    headings = []
    in_code = False
    for line in content_lines:
        if line.lstrip().startswith("```"):
            in_code = not in_code
        if in_code:
            continue
        m = re.match(r"^(#{1,6})\s", line)
        if m:
            headings.append(len(m.group(1)))

    rel = path.replace("docs/", "")
    h1_count = headings.count(1)

    if h1_count == 0 and not has_frontmatter_title:
        issues.append(f"  ❌ {rel}: no H1 and no frontmatter title")
    elif h1_count > (0 if has_frontmatter_title else 1):
        issues.append(f"  ⚠️  {rel}: {h1_count} H1 headings in body")

    if headings:
        prev = headings[0]
        for h in headings[1:]:
            if h > prev + 1:
                issues.append(f"  ⚠️  {rel}: heading jump H{prev}→H{h}")
                break
            prev = h

if issues:
    print(f"Heading issues ({len(issues)} files):")
    for i in issues: print(i)
else:
    print("✅ Heading structure clean across all pages")
EOF
```

Note: template files (`04_templates/`) often contain multiple H1s intentionally as part of
the template content they are demonstrating. Use judgement when reviewing those results.

### Check 4 — Custom CSS review

Read each stylesheet and flag overly broad selectors, hardcoded pixel values that should use
CSS variables, or missing rules:

```bash
cat docs/stylesheets/features.css docs/stylesheets/toc.css docs/stylesheets/print.css
```

Review the output and note:

- Rules referencing non-existent Material theme classes (common typos)
- Missing `@media print` block in `print.css`
- Any `!important` overrides that could cause maintenance issues

### Check 5 — Custom JavaScript review

Read each JS file and flag common issues:

```bash
cat docs/javascripts/shortcuts.js docs/javascripts/related-pages.js \
  docs/javascripts/bookmarks.js
```

Flag:

- `console.log` left in production code
- `querySelector` calls missing null-guards before property access
- Hardcoded URLs pointing to localhost or staging

Note: `document.querySelector(".md-search__input")`, `.md-header__inner`, and
`article.md-content__inner` are valid Material theme selectors — do not flag these.

### Check 6 — Images and alt text

```bash
uv run python3 - <<'EOF'
import glob, re

missing_alt = []
for path in sorted(glob.glob("docs/**/*.md", recursive=True)):
    with open(path) as f:
        content = f.read()
    for m in re.finditer(r"!\[([^\]]*)\]\(([^)]+)\)", content):
        alt, src = m.group(1).strip(), m.group(2)
        if not alt:
            rel = path.replace("docs/", "")
            missing_alt.append(f"  ⚠️  {rel}: ![]({src})")

if missing_alt:
    print(f"Images missing alt text ({len(missing_alt)}):")
    for i in missing_alt: print(i)
else:
    print("✅ All images have alt text")
EOF
```

### Check 7 — Live site spot-check (optional)

Fetch key pages and verify they return 200:

```bash
for url in \
  "https://tydukes.github.io/coding-style-guide/" \
  "https://tydukes.github.io/coding-style-guide/01_overview/principles/" \
  "https://tydukes.github.io/coding-style-guide/02_language_guides/terraform/"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" = "200" ]; then
    echo "✅ $url"
  else
    echo "❌ $url — HTTP $code"
  fi
done
```

---

## Summary Report Format

```text
Check                        Result   Notes
─────────────────────────────────────────────────────────────────
1. MkDocs strict build       ✅ PASS
2. Nav completeness          ⚠️  WARN  3 known orphans (expected)
3. Heading structure         ⚠️  WARN  16 files with issues
4. Custom CSS                ✅ PASS
5. Custom JavaScript         ✅ PASS
6. Images / alt text         ✅ PASS
7. Live site spot-check      ✅ PASS
─────────────────────────────────────────────────────────────────
Issues requiring action: 0
Warnings to review: 2
```

For each issue, provide:

- **File and line** where possible
- **What the problem is**
- **Suggested fix** (edit the file, update `mkdocs.yml`, etc.)

After summarizing, ask the user which issues they want to fix and proceed with the fixes.
