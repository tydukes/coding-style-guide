---
title: "Documentation Versioning Guide"
description: "Standards for multi-version documentation using MkDocs and Mike"
author: "Tyler Dukes"
tags: [documentation, versioning, mike, mkdocs, deployment, gh-pages]
category: "CI/CD"
status: "active"
search_keywords: [documentation, versioning, mike, mkdocs, multi-version, releases]
---

## Overview

Multi-version documentation allows users to access documentation for specific releases while
defaulting to the latest version. This guide defines standards for managing documentation
versions using [Mike](https://github.com/jimporter/mike) with MkDocs Material.

### What This Guide Covers

- Mike plugin setup and configuration
- Version deployment workflow
- Version naming conventions
- Alias management (latest, stable, dev)
- CI/CD integration for automated versioning
- Version support and deprecation policy
- URL structure standards

## Mike Plugin Configuration

### mkdocs.yml Setup

```yaml
# mkdocs.yml
plugins:
  - search
  - mike:
      alias_type: symlink
      canonical_version: latest

extra:
  version:
    provider: mike
    alias: true
    default: latest
```

### Configuration Options

```yaml
# Full mike plugin options
plugins:
  - mike:
      # How aliases are created: symlink (default), redirect, or copy
      alias_type: symlink
      # Redirect template for alias_type: redirect
      redirect_template: null
      # Version to use for canonical URLs in sitemap
      canonical_version: latest
      # Enable CSS for version selector
      css_dir: css
      # Enable JavaScript for version selector
      javascript_dir: js
      # Custom version selector template
      version_selector: true
```

### Version Selector Configuration

```yaml
# extra section in mkdocs.yml
extra:
  version:
    # Enable mike as the version provider
    provider: mike
    # Show aliases in the version selector dropdown
    alias: true
    # Default version when accessing root URL
    default: latest
```

## Version Naming Conventions

### Standard Format

Use `<major>.<minor>` format for version directories:

```text
docs-site/
├── 1.5/              # Version 1.5.x docs
├── 1.6/              # Version 1.6.x docs
├── 1.7/              # Version 1.7.x docs (current)
├── latest/           # Alias -> 1.7
├── dev/              # Alias -> development docs
└── versions.json     # Version metadata
```

### Version Aliases

```bash
# Standard aliases
latest    # Points to the most recent stable release
dev       # Points to development/pre-release docs
```

### URL Structure

```text
# Version-specific URLs
https://example.com/1.7/                    # Version 1.7 root
https://example.com/1.7/language-guides/    # Version 1.7 language guides
https://example.com/latest/                 # Alias to latest stable
https://example.com/dev/                    # Development docs

# Default redirect
https://example.com/                        # Redirects to latest/
```

## Deploying Versions

### Deploy a New Version

```bash
# Deploy current docs as version 1.7 with 'latest' alias
mike deploy --push --update-aliases 1.7 latest

# Deploy a specific version without alias
mike deploy --push 1.6
```

### Set Default Version

```bash
# Set 'latest' as the default redirect target
mike set-default --push latest
```

### List Deployed Versions

```bash
# Show all deployed versions and their aliases
mike list
```

```text
# Example output
1.7 [latest]
1.6
1.5
```

### Delete Old Versions

```bash
# Delete a specific version
mike delete --push 1.5

# Delete all versions (use with caution)
mike delete --push --all
```

### Retitle a Version

```bash
# Change the display title of a version
mike retitle --push 1.7 "1.7 (Current)"
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Documentation

on:
  push:
    branches: [main]
    tags: ['v*']

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install mkdocs-material mike

      - name: Configure git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Extract version
        id: version
        run: |
          if [[ "${{ github.ref }}" == refs/tags/v* ]]; then
            VERSION="${GITHUB_REF#refs/tags/v}"
            MIKE_VERSION="${VERSION%.*}"
            echo "version=${MIKE_VERSION}" >> "$GITHUB_OUTPUT"
            echo "alias=latest" >> "$GITHUB_OUTPUT"
          else
            echo "version=dev" >> "$GITHUB_OUTPUT"
            echo "alias=" >> "$GITHUB_OUTPUT"
          fi

      - name: Deploy docs
        run: |
          mike deploy --push \
            ${{ steps.version.outputs.alias && '--update-aliases' || '' }} \
            ${{ steps.version.outputs.version }} \
            ${{ steps.version.outputs.alias }}
          mike set-default --push latest
```

### Deployment Strategy

```text
Push to main  ──> Deploy as 'dev' alias
Tag v1.7.0    ──> Deploy as '1.7' with 'latest' alias
Tag v1.7.1    ──> Deploy as '1.7' (patch update, same version dir)
Tag v1.8.0    ──> Deploy as '1.8' with 'latest' alias
```

## Version Support Policy

### Support Window

```text
Policy: Support N-2 versions (current + 2 previous)

Example (current: 1.7):
  1.7  ──  Active    (latest alias, full support)
  1.6  ──  Supported (bug fixes to docs only)
  1.5  ──  Supported (critical fixes only)
  1.4  ──  EOL       (removed from deployment)
```

### Version Lifecycle

```text
┌─────────┐     ┌───────────┐     ┌─────────────┐     ┌─────┐
│ Active  │ ──> │ Supported │ ──> │ Maintenance │ ──> │ EOL │
│ (N)     │     │ (N-1)     │     │ (N-2)       │     │     │
└─────────┘     └───────────┘     └─────────────┘     └─────┘
  latest          bug fixes         critical only       delete
  alias           only              only
```

### Deprecation Notice Template

```markdown
!!! warning "Outdated Version"
    You are viewing documentation for version **1.5**. This version is no
    longer actively maintained. Please upgrade to the
    [latest version](../latest/).
```

## Glossary Auto-Generation

The glossary auto-generation script (`scripts/generate_glossary.py`) maintains
a consistent, up-to-date glossary by extracting and cross-referencing terms
from documentation sources.

### Usage

```bash
# Regenerate glossary from existing terms (preserves structure)
uv run python scripts/generate_glossary.py

# Preview changes without writing
uv run python scripts/generate_glossary.py --dry-run

# Add cross-reference links showing where terms are used
uv run python scripts/generate_glossary.py --cross-ref

# Detect candidate terms not yet in the glossary
uv run python scripts/generate_glossary.py --scan-new
```

### Term Definition Format

```markdown
## A

### API (Application Programming Interface)

A set of rules and protocols that allows different software applications
to communicate with each other.

### Automation

The use of tools and scripts to perform tasks automatically without
manual intervention.
```

### Cross-Referencing

```bash
# Generate glossary with cross-reference links
uv run python scripts/generate_glossary.py --cross-ref
```

```markdown
### Terraform

An infrastructure as code tool that allows defining cloud and
on-premises resources in declarative configuration files.

*Referenced in: 02_language_guides/terraform.md,
04_templates/terraform_module_template.md and 12 more*
```

### Detecting New Terms

```bash
# Scan docs for bold terms not yet defined in the glossary
uv run python scripts/generate_glossary.py --scan-new
```

```text
Found 15 candidate terms (3+ occurrences):
------------------------------------------------------------
  Blue-Green Deployment           (8 occurrences)
  Feature Flag                    (5 occurrences)
  Service Mesh                    (4 occurrences)
------------------------------------------------------------
Add these terms to docs/glossary.md manually, then re-run.
```

### Glossary Organization

```text
docs/glossary.md structure:
├── Frontmatter (YAML metadata)
├── Introduction
├── Alphabetical Sections (## A through ## Z)
│   └── Term Definitions (### Term Name)
│       └── Definition paragraph
│       └── Optional cross-references
├── Metadata Tags Reference
├── Common Abbreviations
└── Tool Names Quick Reference
```

## Local Development

### Preview Versioned Docs

```bash
# Serve the current version locally
mike serve

# Serve a specific version
mike serve --branch gh-pages
```

### Testing Version Deployment

```bash
# Deploy locally without pushing
mike deploy 1.7 latest

# Verify deployed versions
mike list

# Clean up local deployment
mike delete --all
```

## Standards Summary

### Version Naming

```text
Format:    <major>.<minor>
Examples:  1.7, 2.0, 1.12
Aliases:   latest (most recent stable), dev (development)
```

### Deployment Rules

```text
1. Every minor release gets its own version directory
2. Patch releases update the existing minor version directory
3. The 'latest' alias always points to the most recent stable release
4. The 'dev' alias tracks the main branch
5. Support N-2 versions minimum
6. Remove EOL versions after N-3
```

### Glossary Standards

```text
1. Run generate_glossary.py after adding new terms
2. Use --cross-ref to maintain term-to-document links
3. Run --scan-new periodically to discover undefined terms
4. All terms use ### heading level within ## letter sections
5. Definitions should be 1-3 sentences, starting with articles
6. Include parenthetical expansions for acronyms
```
