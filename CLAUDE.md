# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Dukes Engineering Style Guide** is a comprehensive, multi-language coding
style guide that defines consistent, secure, and AI-optimized standards for
DevOps and software engineering practices.

- **Author**: Tyler Dukes
- **Repository**: <https://github.com/tydukes/coding-style-guide>
- **Documentation Site**: <https://tydukes.github.io/coding-style-guide/>
- **License**: MIT
- **Current Version**: 1.7.0 (in `pyproject.toml`)

### Covered Languages

- **Infrastructure as Code**: Terraform, Terragrunt, HCL, AWS CDK, Kubernetes/Helm, Ansible
- **Programming**: Python, TypeScript, Bash, PowerShell, SQL, Groovy (Jenkins)
- **CI/CD**: GitHub Actions, GitLab CI/CD
- **Configuration**: YAML, JSON
- **Containers**: Dockerfile, Docker Compose
- **Build Tools**: Makefile

## Development Commands

### Prerequisites

- Python 3.10+
- [uv package manager](https://docs.astral.sh/uv/)

### Building & Serving Documentation

```bash
# Install dependencies
uv sync

# Upgrade dependencies
uv sync --upgrade

# Start local documentation server (http://127.0.0.1:8000)
mkdocs serve

# Build documentation
mkdocs build

# Build with strict mode (fails on warnings)
mkdocs build --strict
```

### Validation & Testing

```bash
# Validate @module metadata tags in all documentation
uv run python scripts/validate_metadata.py docs/

# Analyze code-to-text ratio in language guides (target: 3:1)
uv run python scripts/analyze_code_ratio.py

# Run pre-commit linters
bash scripts/pre_commit_linter.sh

# Run all pre-commit hooks
pre-commit run --all-files

# Run metadata validation manually (manual-stage hook)
pre-commit run validate-metadata --hook-stage manual

# Python formatting and linting
uv run black .
uv run flake8
```

### Docker-based Workflows

```bash
# Run full validation suite
docker-compose run --rm validator

# Run linters only
docker-compose run --rm lint

# Auto-format code
docker-compose run --rm format

# Build and validate docs
docker-compose run --rm docs

# Validate metadata tags
docker-compose run --rm metadata
```

### Using Published Container

```bash
# Run full validation
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest validate

# Run linters only
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest lint

# Auto-format code
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest format

# Build docs
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest docs

# Validate metadata
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest metadata

# Show help
docker run --rm ghcr.io/tydukes/coding-style-guide:latest help
```

## Architecture & Unique Patterns

This project has several distinctive architectural patterns that aren't obvious from the file structure:

### 1. 3:1 Code-to-Text Ratio Requirement

**Philosophy**: "Show, don't tell" - language guides should be heavy on examples, light on prose.

- **Requirement**: All language guides in `docs/02_language_guides/` must
  maintain at least 3 lines of code examples for every 1 line of explanatory text
- **Validation**: `scripts/analyze_code_ratio.py`
- **Current Status**: 18/19 guides pass (94.7%)
- **Algorithm**:
  - Lines inside ``` code blocks count as "code"
  - Non-blank lines outside code blocks count as "text"
  - YAML frontmatter is excluded
  - Ratio = code_lines / text_lines

**Running the analysis**:

```bash
$ uv run python scripts/analyze_code_ratio.py

Code-to-Text Ratio Analysis
================================================================================
Language Guide                   Code Lines   Text Lines      Ratio     Status
--------------------------------------------------------------------------------
terraform                              2124         6285       0.34     ❌ FAIL
ansible                                2258          330       6.84     ✅ PASS
...
================================================================================
Achievement: 18/19 guides pass
```

### 2. CONTRACT.md Template for IaC

**Purpose**: Enable contract-based development for reusable Terraform modules and Ansible roles.

**Key Pattern**: Numbered guarantees (G1, G2, G3...) that are:

- Explicitly testable
- Mapped directly to automated tests
- Versioned with semantic versioning
- Include breaking change deprecation timeline

**Structure**: 13-section template (`docs/04_templates/contract_template.md`):

1. Purpose
2. Guarantees (G1, G2, G3... numbered for test traceability)
3. Inputs/Outputs with validation rules
4. Platform requirements matrix
5. Dependencies and IAM permissions
6. Side effects and cost implications
7. Idempotency contract (Ansible)
8. Testing requirements
9. Breaking changes policy
10. Known limitations
11. Support and maintenance
12. Usage examples
13. Test mapping

**Example guarantee**:

```markdown
## Guarantees

- **G1**: Creates exactly 1 VPC with DNS hostnames enabled
- **G2**: Creates N public subnets distributed across at least 2 AZs
- **G3**: All S3 buckets have encryption enabled by default
```

Each guarantee is referenced in test descriptions: `test_vpc_creation.go: Tests G1, G2`.

### 3. Dual Metadata System

**Two complementary metadata approaches**:

**A. YAML Frontmatter** (for documentation files):

```yaml
---
title: "Document Title"
description: "Brief purpose description"
author: "Tyler Dukes"
tags: [tag1, tag2, tag3]
category: "Category Name"
status: "active"
---
```

**B. Code Comment Metadata** (for source code):

```python
"""
@module module_name
@description Brief purpose description
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""
```

**Unique aspect**: Same metadata schema works across **all** languages
(Python, Terraform, Bash, YAML, etc.) enabling universal tooling.

**Validation**: `scripts/validate_metadata.py` supports 8 languages with
language-specific comment syntax but universal tag format.

### 4. Progressive Enforcement in CI/CD

**5-Stage Validation Pipeline**:

```text
Stage 1: Pre-commit Hooks (< 30 sec)
  └─> Formatting, linting, secret detection

Stage 2: CI Pipeline (< 10 min)
  └─> Metadata validation, lint checks, docs build

Stage 3: Quality Gates (< 10 min)
  └─> Spell checking, link checking

Stage 4: Deployment (< 5 min)
  └─> GitHub Pages deployment, container publish

Stage 5: Auto-Merge (after CI success)
  └─> Auto-approve and merge for allowed authors
```

**Key behavior**: Metadata validation is **non-blocking** (warning only), but spell checking **blocks** merges.

## IDE Settings

This repository includes **pre-configured IDE settings** that automatically
enforce the style guide standards. These files can be copied to other projects
for instant compliance.

### Files Included

```text
.vscode/
├── settings.json           # Comprehensive VS Code settings for all languages
└── extensions.json         # Recommended extension list

.idea/
├── codeStyles/
│   ├── Project.xml        # IntelliJ code style settings
│   └── codeStyleConfig.xml
└── inspectionProfiles/
    ├── Project.xml        # IntelliJ inspection rules
    └── profiles_settings.xml

.editorconfig               # Universal editor configuration
```

### Key Features

**VS Code settings include:**

- Black formatter for Python (100 char line)
- Flake8 linting (extends ignore E203, W503)
- yamllint integration (120 char line)
- markdownlint with custom rules
- shellcheck integration
- Terraform language server with auto-format
- Format on save for all languages
- Language-specific rulers and tab sizes

**IntelliJ settings include:**

- Code style settings matching pre-commit hooks exactly
- Inspection profiles for all languages
- Auto-format on save configuration
- EditorConfig support enabled

**EditorConfig provides:**

- Universal settings that work across all editors
- Language-specific indentation (Python: 4 spaces, YAML: 2 spaces, etc.)
- Line ending normalization (LF)
- Trailing whitespace removal (except Markdown)
- Final newline enforcement

### Usage in Other Projects

Users can copy these settings to their projects:

```bash
# Copy all IDE settings
cp -r .vscode your-project/
cp -r .idea your-project/
cp .editorconfig your-project/
```

See `docs/04_templates/ide_settings_template.md` for comprehensive documentation.

## Project Structure

```text
coding-style-guide/
├── .vscode/                        # VS Code IDE settings
│   ├── settings.json              # Language-specific formatting/linting
│   └── extensions.json            # Recommended extensions
├── .idea/                         # IntelliJ/PyCharm IDE settings
│   ├── codeStyles/                # Code style configurations
│   └── inspectionProfiles/        # Inspection rules
├── .editorconfig                  # Universal editor configuration
├── docs/                           # MkDocs documentation source
│   ├── 00_standards/               # Documentation standards
│   ├── 01_overview/                # Principles, governance, structure
│   ├── 02_language_guides/         # 19 language-specific guides
│   ├── 03_metadata_schema/         # Universal metadata schema
│   ├── 04_templates/               # CONTRACT.md, TESTING.md, ide_settings_template.md, etc.
│   ├── 05_ci_cd/                   # IaC testing standards, pipelines
│   ├── 05_examples/                # Full example implementations
│   ├── 06_container/               # Container usage documentation
│   ├── 07_integration/             # Integration guides
│   ├── 08_anti_patterns/           # Anti-patterns documentation
│   ├── 09_refactoring/             # Refactoring examples
│   ├── 10_migration_guides/        # Migration from other style guides
│   ├── changelog.md                # Project changelog
│   ├── glossary.md                 # Terminology
│   └── index.md                    # Documentation home
├── scripts/                        # Validation and utility scripts
│   ├── analyze_code_ratio.py      # Enforces 3:1 code-to-text ratio
│   ├── validate_metadata.py       # Validates @module tags
│   ├── remove_hardcoded_versions.py # Removes static version references
│   └── pre_commit_linter.sh       # Pre-commit linter wrapper
├── .github/
│   ├── workflows/                  # CI/CD automation
│   │   ├── ci.yml                 # Main CI pipeline
│   │   ├── deploy.yml             # Documentation deployment
│   │   ├── container.yml          # Container build/publish
│   │   ├── auto-merge.yml         # Auto-merge approved PRs
│   │   ├── spell-checker.yml      # Spell checking (BLOCKING)
│   │   └── link-checker.yml       # Link validation
│   └── actions/validate/          # Custom validation action
├── Dockerfile                      # Multi-stage container
├── docker-compose.yml             # Service definitions
├── docker-entrypoint.sh           # Container entrypoint with modes
├── mkdocs.yml                     # MkDocs configuration
├── pyproject.toml                 # Python dependencies (uv)
└── .pre-commit-config.yaml        # Pre-commit hooks
```

## Label Taxonomy

This project uses a comprehensive label system for issue and PR categorization:

### Type Labels

- `type:feature` - New feature or request
- `type:bug` - Something isn't working
- `type:docs` - Documentation improvements or additions
- `type:maintenance` - Routine maintenance and upkeep
- `type:security` - Security-related improvements or fixes

### Scope Labels

- `scope:dependencies` - Dependency updates and management
- `scope:language-guide` - Language-specific style guide updates
- `scope:ide-settings` - IDE configuration and settings
- `scope:automation` - CI/CD, scripts, and automated workflows
- `scope:container` - Docker and container-related changes

### Priority Labels

- `priority:critical` - Critical priority - immediate action required
- `priority:high` - High priority - important but not urgent
- `priority:medium` - Medium priority - normal importance
- `priority:low` - Low priority - nice to have

### Status Labels

- `status:blocked` - Blocked by another issue or external dependency
- `status:in-progress` - Work is currently in progress
- `status:needs-review` - Needs review or feedback

### Language Labels

Each supported language has a dedicated label for easy filtering:

- `terraform`, `python`, `bash`, `typescript`, `ansible`, `kubernetes`, `yaml`, `json`, `docker`, `makefile`,
  `github-actions`, `gitlab`, `jenkins`, `sql`, `powershell`, `terragrunt`, `hcl`, `cdk`

### Usage Guidelines

- **Every issue should have at least one `type:` label** to indicate the kind of work
- Add `scope:` labels to indicate which part of the project is affected
- Set `priority:` based on urgency and impact
- Use `status:` labels to track work progress
- Add language labels when the issue is language-specific

### Historical Note

The `phase-1` through `phase-6` labels were retired in January 2025 after the initial project milestones
were completed. All issues were migrated to the new taxonomy to better reflect ongoing maintenance and
priorities.

## CI/CD & Automation

### Auto-Merge Behavior

**IMPORTANT**: PRs from specific authors are automatically merged after CI passes.

- **Allowed authors**: `dependabot[bot]`, `tydukes`
- **Merge strategy**: Squash
- **Branch cleanup**: Auto-deletes branch after merge
- **Trigger**: Runs after `ci.yml` workflow succeeds
- **Requirement**: `AUTO_MERGE_TOKEN` secret must be configured

### GitHub Workflows

**ci.yml** (Main CI Pipeline):

- Triggers: Push/PR to main
- Steps:
  1. Installs UV and syncs dependencies (with caching)
  2. Validates metadata with `scripts/validate_metadata.py` (non-blocking)
  3. Runs linters via `scripts/pre_commit_linter.sh` (blocking)
  4. Builds MkDocs with `--strict` flag (blocking)
  5. Uploads docs artifact (7-day retention)

**deploy.yml** (Documentation Deployment):

- Triggers: Push to main
- Deploys MkDocs to GitHub Pages using `mkdocs gh-deploy --force`

**container.yml** (Container Build):

- Triggers: Push to main, tags (v\*), PRs, manual
- Multi-platform: linux/amd64, linux/arm64
- Publishes to: `ghcr.io/tydukes/coding-style-guide`
- Generates SBOM with Anchore

**spell-checker.yml** (Quality Gate - BLOCKING):

- Triggers: Push/PR to main, weekly on Mondays
- **FAILS workflow** if spelling errors found
- Uses cSpell with 275+ whitelisted technical terms
- Creates issues on main branch failures
- Comments on PRs with errors

**link-checker.yml** (Quality Gate):

- Triggers: Push/PR to main, weekly on Mondays
- Auto-creates issues with `broken-links` label
- Retries on 429 (rate limit)
- Config: `.github/markdown-link-check-config.json`

### Pre-commit Hooks

**Hooks that run on every commit**:

```yaml
# File checks
- trailing-whitespace, end-of-file-fixer
- check-yaml (--unsafe), check-json
- check-added-large-files (max 1000kb)
- check-merge-conflict, check-case-conflict
- mixed-line-ending, detect-private-key

# Python
- black (formatting)
- flake8 (linting, max line 100, ignores E203/W503)

# YAML
- yamllint (max line 120, document-start disabled)

# Shell
- shellcheck

# Markdown
- markdownlint (with --fix, config: .markdownlint.json)

# Terraform
- terraform_fmt, terraform_validate, terraform_docs
```

**Manual-stage hooks** (run with `--hook-stage manual`):

```yaml
- validate-metadata  # Runs scripts/validate_metadata.py
```

## Validation Scripts

### analyze_code_ratio.py

**Purpose**: Enforce 3:1 code-to-text ratio in language guides.

**Usage**:

```bash
uv run python scripts/analyze_code_ratio.py
```

**Output**:

```text
Language Guide                   Code Lines   Text Lines      Ratio     Status
--------------------------------------------------------------------------------
terraform                              2124         6285       0.34     ❌ FAIL
ansible                                2258          330       6.84     ✅ PASS
python                                 1012          318       3.18     ✅ PASS
...
--------------------------------------------------------------------------------
OVERALL                               26337        10740       2.45     ❌ FAIL
================================================================================
Achievement: 18/19 guides pass
```

### validate_metadata.py

**Purpose**: Validate @module metadata tags across all languages.

**Supported languages**: Python, Terraform/HCL, TypeScript, Bash, PowerShell, YAML, SQL, Markdown

**Required tags**: `@module`, `@description`, `@version`

**Validates**:

- Semantic versioning format (MAJOR.MINOR.PATCH)
- ISO 8601 date format (YYYY-MM-DD)
- Module name format (lowercase, underscores/hyphens only)
- Status values (draft, in-progress, review, stable, deprecated, archived)
- Unique module names (no duplicates)

**Usage**:

```bash
# Validate all docs
python scripts/validate_metadata.py docs/

# Validate specific language
python scripts/validate_metadata.py --language python src/

# Strict mode (exit 1 on errors)
python scripts/validate_metadata.py --strict docs/
```

### remove_hardcoded_versions.py

**Purpose**: Remove hardcoded version/date information from document footers to maintain dynamic versioning.

**Patterns removed**:

- `**Version**: X.Y.Z`
- `**Template Version**: X.Y.Z`
- `*Template Version: X.Y.Z*`
- `*Last Updated: YYYY-MM-DD*`

**Usage**:

```bash
uv run python scripts/remove_hardcoded_versions.py
```

## Working with Documentation

### Adding a New Language Guide

1. Create file: `docs/02_language_guides/{language}.md`
2. Add YAML frontmatter with all required fields:

   ```yaml
   ---
   title: "{Language} Style Guide"
   description: "Brief description"
   author: "Tyler Dukes"
   tags: [language, tag2, tag3]
   category: "Language Guides"
   status: "active"
   ---
   ```

3. Follow `docs/04_templates/language_guide_template.md` structure
4. **Ensure 3:1 code-to-text ratio** (verify with `analyze_code_ratio.py`)
5. Update `mkdocs.yml` navigation under appropriate category
6. Test locally: `mkdocs serve`
7. Validate: `uv run python scripts/validate_metadata.py docs/02_language_guides/{language}.md`

### Modifying Existing Guides

**Critical rules**:

1. **Always preserve YAML frontmatter** - Required for MkDocs metadata
2. **Maintain or improve code-to-text ratio** - Don't add prose without adding examples
3. **Use proper code block language tags** - No bare ``` blocks (enforced by markdownlint)
4. **Test links** - Link checker runs weekly, creates issues for broken links
5. **Check spelling** - Spell checker **blocks** merge if errors found
6. **Verify locally**: `mkdocs serve` before pushing

### Code Block Language Tags

**Strict enforcement**: ALL code blocks must have language tags.

**CORRECT** (with language tag):

```python
def example():
    pass
```

**INCORRECT** (bare code block without language tag) - Don't do this!

Use proper language tags for all code blocks to enable syntax highlighting
and pass markdownlint validation.

**Standard tags**: Use canonical names (`python` not `py`, `yaml` not `yml`, `bash` not `sh`)

### Metadata Schema Requirements

**For documentation files** (`.md`):

- Required: `title`, `description`, `author`, `tags`, `category`, `status`
- Validated by CI (non-blocking warnings)

**For source code** (optional but encouraged):

- Use `@module`, `@description`, `@version` tags in comments
- Follows language-specific comment syntax
- Validated by `scripts/validate_metadata.py`

## Important Notes for AI Assistants

### Version Management

When updating versions:

1. **Update `pyproject.toml`** - Source of truth for project version
2. **Update `docs/changelog.md`** - Document changes in [Unreleased] section
3. **Create GitHub release** - Use `gh release create v{X.Y.Z}`
4. **Never hardcode versions** in document footers - Use dynamic references

### Automation Awareness

**Auto-merge behavior**:

- PRs from `dependabot[bot]` or `tydukes` will auto-merge after CI passes
- Other PRs require manual approval
- All merges use squash strategy

**Spell checking blocks merges**:

- If you add new technical terms, they may trigger spell check failures
- Whitelist terms in `.github/cspell.json` under `words` array
- Run locally: `npx cspell "docs/**/*.md"`

**Metadata validation is non-blocking**:

- Warnings appear in CI but don't fail builds
- Fix warnings to maintain code quality

### Container-First Workflows

The repository is designed to be used as a containerized validator:

```bash
# Other projects can use this as a validation tool
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

When making changes to validation logic:

- Test container builds locally: `docker build -t test .`
- Verify entrypoint modes work: `docker run --rm test help`
- Multi-platform builds happen automatically on main branch pushes

## 3:1 Code Ratio Philosophy

This is **THE** defining quality metric for language guides:

- Readers learn better from examples than explanations
- Code is self-documenting when following the style guide
- Reduces maintenance burden (code examples are validated by linters)
- AI models train better on example-heavy documentation

**When adding content**:

- For every paragraph of explanation, add 3+ code examples
- Use real-world, production-ready examples (not trivial "hello world")
- Show complete context (imports, error handling, not just snippets)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

## Security

See [SECURITY.md](SECURITY.md) for security policies and vulnerability reporting.

---

*This file is specifically designed to help AI assistants understand and work effectively with this repository.*
