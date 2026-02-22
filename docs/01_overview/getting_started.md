---
title: "Getting Started"
description: "Quickstart guide for adopting the DevOps Engineering Style Guide — Docker, local setup, and choosing your path"
author: "Tyler Dukes"
tags: [getting-started, quickstart, installation, setup]
category: "Overview"
status: "active"
search_keywords: [getting started, setup, installation, quickstart, onboarding, first steps]
---

Welcome to the DevOps Engineering Style Guide! This page gets you validating code in under 30 seconds
and points you to the right in-depth tutorial for your project type.

## Prerequisites

### Option 1: Docker (Recommended — fastest start)

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))

### Option 2: Local Python setup

- Python 3.10 or higher
- [uv package manager](https://docs.astral.sh/uv/)
- Git

## Quick Start (30 Seconds)

```bash
# Navigate to your project
cd /path/to/your/project

# Run full validation — no installation required
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

You'll immediately see linting errors, missing metadata tags, and formatting issues across all languages.

**Auto-fix what's fixable:**

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format
```

**Prefer a local setup?**

```bash
git clone https://github.com/tydukes/coding-style-guide.git
cd coding-style-guide
uv sync
mkdocs serve
# Browse to http://127.0.0.1:8000
```

---

## Choose Your Path

Select the tutorial that matches your project:

| Your Project | Time | Tutorial |
|---|---|---|
| Python project (Flask, FastAPI, scripts) | 30 min | [Tutorial 1: Zero to Validated Python Project](../12_tutorials/python_project.md) |
| Terraform / IaC module | 45 min | [Tutorial 2: Migrating Existing Terraform Module](../12_tutorials/terraform_migration.md) |
| Multi-language monorepo | 60 min | [Tutorial 3: Full-Stack App with Multiple Languages](../12_tutorials/fullstack_app.md) |
| Team adoption / onboarding | 20 min | [Tutorial 4: Team Onboarding](../12_tutorials/team_onboarding.md) |
| Manual → automated workflow | 40 min | [Tutorial 5: From Manual to Automated](../12_tutorials/manual_to_automated.md) |
| MkDocs documentation site | 12 min | [MkDocs Site Example](../05_examples/mkdocs_site_example.md) |

Not sure where to start? Begin with [Tutorial 4: Team Onboarding](../12_tutorials/team_onboarding.md) —
it covers the foundations for every other path.

---

## Integration Patterns

### GitHub Actions

```yaml
# .github/workflows/validate.yml
name: Code Quality
on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Full Validation
        run: |
          docker run --rm -v $(pwd):/workspace \
            ghcr.io/tydukes/coding-style-guide:latest validate
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: coding-style-validator
        name: Validate Coding Standards
        entry: docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest
        args: [lint]
        language: system
        pass_filenames: false
        stages: [commit]
```

```bash
pip install pre-commit
pre-commit install
```

### Docker Compose (Team Development)

```yaml
# docker-compose.yml
services:
  validate:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: validate

  lint:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: lint

  format:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: format
```

```bash
docker-compose run --rm validate
docker-compose run --rm format
```

### Makefile

```makefile
.PHONY: validate lint format

validate:
 docker run --rm -v $(PWD):/workspace \
   ghcr.io/tydukes/coding-style-guide:latest validate

lint:
 docker run --rm -v $(PWD):/workspace \
   ghcr.io/tydukes/coding-style-guide:latest lint

format:
 docker run --rm -v $(PWD):/workspace \
   ghcr.io/tydukes/coding-style-guide:latest format
```

---

## Common Issues

| Problem | Quick Fix |
|---------|-----------|
| `Permission denied` in Docker | Add `--user $(id -u):$(id -g)` to the docker run command |
| Hundreds of errors on first run | Run `format` first, then `validate` again |
| CI pipeline is slow | Use `lint` mode instead of `validate` (skips docs build) |
| Metadata validation fails on legacy code | Start with non-blocking mode; add `@module` tags incrementally |
| Pre-commit hooks are slow | Move full validation to `push` stage; keep only formatters on `commit` |
| Container fails to pull in CI | Pin to a specific version tag: `ghcr.io/tydukes/coding-style-guide:v1.8.0` |

See [FAQ](../faq.md) for more detailed answers.

---

## Next Steps

After completing your first validation:

- Read the [language guide](../02_language_guides/python.md) for your primary language
- Review [Anti-Patterns](../08_anti_patterns/index.md) to avoid common mistakes
- Configure [IDE settings](../04_templates/ide_settings_template.md) for real-time feedback
- Explore [Metadata Schema](../03_metadata_schema/schema_reference.md) for AI-annotation standards
- Check your team's adoption level with the [Maturity Model](maturity_model.md)

---

## Resources

- **Documentation**: [https://tydukes.github.io/coding-style-guide/](https://tydukes.github.io/coding-style-guide/)
- **GitHub**: [https://github.com/tydukes/coding-style-guide](https://github.com/tydukes/coding-style-guide)
- **Container**: `ghcr.io/tydukes/coding-style-guide:latest`
- **Issues**: [GitHub Issues](https://github.com/tydukes/coding-style-guide/issues)
- [Changelog](../changelog.md) — Version history
- [Glossary](../glossary.md) — Terminology

## Container Commands Cheat Sheet

```bash
# Validate entire project
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest validate

# Lint only (faster — skips docs build)
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest lint

# Auto-format code
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest format

# Build documentation
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest docs

# Validate metadata tags only
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest metadata

# Show all available commands
docker run --rm ghcr.io/tydukes/coding-style-guide:latest help
```
