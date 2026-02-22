# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The **DevOps Engineering Style Guide** is a multi-language coding style guide with automated
validation tools — a containerized validator that other projects can run against their own code.

- **Author**: Tyler Dukes
- **Repository**: <https://github.com/tydukes/coding-style-guide>
- **Documentation Site**: <https://tydukes.github.io/coding-style-guide/>
- **License**: MIT
- **Current Version**: Check `pyproject.toml` — source of truth. Never hardcode versions in docs.

### Covered Languages (36 guides)

ansible, bash, bicep, cdk, cloudformation, comparison_matrix, compliance_as_code, crossplane,
devcontainer, diagram_as_code, docker_compose, dockerfile, github_actions, gitlab_ci, gitops,
go, hcl, interoperability, jenkins_groovy, jenkins_shared_libraries, json, json_schema,
kubernetes, makefile, powershell, pulumi, python, repl, shell_aliases, sql, task_runners,
terraform, terragrunt, toml_ini, typescript, yaml

---

## Development Commands

```bash
uv sync                                          # Install dependencies
uv sync --upgrade                               # Upgrade dependencies
mkdocs serve                                    # Local docs server (http://127.0.0.1:8000)
uv run mkdocs build --strict                    # Build docs (strict mode fails on warnings)
uv run python scripts/analyze_code_ratio.py     # Check 3:1 code-to-text ratio (34/36 pass)
uv run python scripts/validate_metadata.py docs/ # Validate @module metadata tags
pre-commit run --all-files                       # Run all pre-commit hooks
pre-commit run validate-metadata --hook-stage manual  # Run metadata validation manually
uv run black .                                  # Format Python
uv run flake8                                   # Lint Python
```

---

## Architecture: Key Non-Obvious Patterns

### 1. The 3:1 Code-to-Text Ratio

Every file in `docs/02_language_guides/` must maintain ≥3 lines of code examples per 1 line of
explanatory text. This is the primary quality metric — "show, don't tell."

**Algorithm** (in `scripts/analyze_code_ratio.py`):

- Lines inside ` ``` ` fences → "code"
- Non-blank lines outside fences → "text"
- YAML frontmatter excluded
- Ratio = code / text, threshold = 3.0

**Known issue with the checker script**: It uses a simple toggle on ` ``` ` lines and can
miscount when files use 4-backtick fences (` ```` `) for nested code examples. This causes
false positives on some tutorial/example files. Files that generate false positives are
confirmed fine; the script itself needs a more robust fence parser.

**Current status**: 34/36 pass. Failing guides:

- `comparison_matrix` (0.05 — pure reference table, structurally table-only)
- `python` (2.99 — just under threshold)

### 2. Automated Release Workflow

**Releases are triggered manually** via GitHub Actions → `release.yml` → "Run workflow".
The workflow analyzes conventional commits since the last tag to determine the bump type.

```bash
# Trigger a patch release (most common)
gh workflow run release.yml --field bump_type=patch

# Auto-detect bump type from commits (feat→minor, fix/docs/chore→patch, BREAKING→major)
gh workflow run release.yml --field bump_type=auto
```

The workflow automatically: bumps `pyproject.toml`, creates a GitHub release, generates
`docs/changelog.md` via the GitHub API, and commits the changelog. **Never edit
`docs/changelog.md` manually.**

### 3. GitHub Actions Version Constraint

Workflow action versions **cannot** be dynamic — `uses:` fields are evaluated at parse time
before any steps run:

```yaml
# ❌ FAILS — evaluated before steps execute
- uses: actions/cache@${{ steps.versions.outputs.cache-version }}

# ✅ REQUIRED — hardcoded version
- uses: actions/cache@v5
```

`.github/versions.yml` documents the canonical versions as a reference. All workflows use
hardcoded versions that match it. The `dependencies.yml` workflow validates `versions.yml`
stays current with latest releases.

### 4. Dual Metadata System

**YAML frontmatter** (all `.md` files — required):

```yaml
---
title: "Document Title"
description: "Brief purpose description"
author: "Tyler Dukes"
tags: [tag1, tag2]
category: "Category Name"
status: "active"
---
```

**Code comment metadata** (source files — optional):

```python
"""
@module module_name
@description Brief purpose description
@version 1.0.0
"""
```

The same schema works across all languages. Validated by `scripts/validate_metadata.py`
(non-blocking in CI — warnings only, never fails the build).

### 5. CONTRACT.md Pattern for IaC

`docs/04_templates/contract_template.md` defines a 13-section template for Terraform modules
and Ansible roles. The key pattern is numbered guarantees (`G1`, `G2`...) that are explicitly
testable and map directly to test descriptions:

```markdown
## Guarantees
- **G1**: Creates exactly 1 VPC with DNS hostnames enabled
```

```go
// test_vpc_creation.go: Tests G1, G2
```

### 6. CI/CD Pipeline Stages

```text
Stage 1: Pre-commit hooks  (<30s)  formatting, linting, secret detection
Stage 2: CI pipeline       (<10m)  metadata validation (warn), linting (block), docs build
Stage 3: Quality gates     (<10m)  spell-check (BLOCKS merge), link-check
Stage 4: Deployment        (<5m)   GitHub Pages, container publish
Stage 5: Auto-merge        (auto)  squash-merge for dependabot[bot] and tydukes
```

**Spell checker blocks merges.** New technical terms must be whitelisted in `.github/cspell.json`
under the `words` array before pushing.

---

## Working with Documentation

### Adding a New Language Guide

1. Create `docs/02_language_guides/{language}.md` with required YAML frontmatter
2. Follow `docs/04_templates/language_guide_template.md` structure
3. **Maintain ≥3:1 code-to-text ratio** — verify with `analyze_code_ratio.py`
4. Add entry to `mkdocs.yml` nav
5. Test locally with `mkdocs serve`

### Critical Rules for All Doc Changes

- **Always preserve YAML frontmatter** — required by MkDocs
- **All code blocks must have language tags** — bare ` ``` ` blocks fail markdownlint
- **Use canonical language tags**: `python` not `py`, `yaml` not `yml`, `bash` not `sh`
- **Never add body `# H1` headings** — frontmatter `title:` is the H1 in Material theme;
  body sections start at `##`
- **Avoid `&` in headings** — markdownlint and MkDocs generate different anchors for it;
  use `and` instead to keep both tools in agreement

---

## Commit and Branch Conventions

**Always use feature branches — never commit directly to `main`.**

```bash
git checkout -b <type>/<short-description>
# ... commit changes ...
# push and open PR against main
```

**Conventional commits are enforced** — `commit-lint.yml` blocks merge on violations:

```text
type(scope): subject
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`,
`build`, `revert`

---

## CI/CD Automation Notes

**Auto-merge**: PRs from `dependabot[bot]` or `tydukes` squash-merge automatically after CI.

**Blocking checks** (prevent merge):

- Spell checker (`spell-checker.yml`)
- Commit lint (`commit-lint.yml`)
- Dependency version check (`dependencies.yml`) — fails if any outdated action, package, or Docker image

**Non-blocking checks** (warn only):

- Metadata validation
- Link checker (creates issues but doesn't block)

**Version management**: `.github/versions.yml` is documentation-only. To update a workflow
action version: edit `versions.yml`, manually update all workflow files to match, then CI
validates they stay in sync.

---

## Container Usage

```bash
# Validate any project
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest validate

# Other modes: lint, format, docs, metadata
docker run --rm ghcr.io/tydukes/coding-style-guide:latest help
```

Multi-platform builds (linux/amd64, linux/arm64) publish to `ghcr.io/tydukes/coding-style-guide`
on every push to main.

---

## Label Taxonomy (for issues/PRs)

| Prefix | Examples |
|--------|---------|
| `type:` | `feature`, `bug`, `docs`, `maintenance`, `security` |
| `scope:` | `dependencies`, `language-guide`, `ide-settings`, `automation` |
| `priority:` | `critical`, `high`, `medium`, `low` |
| `status:` | `blocked`, `in-progress`, `needs-review` |
| Language | `terraform`, `python`, `bash`, `typescript`, … |
