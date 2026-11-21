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

## Check Local Files with Docker

Start Docker and run these commands from the project directory you want to check.
The bind mount exposes that directory as `/workspace` in the container.

```bash
cd /path/to/your/project
image=ghcr.io/tydukes/coding-style-guide:latest
docker pull "$image"

# Read-only lint check
docker run --rm -v "$PWD:/workspace:ro" "$image" lint

# Run linters and report metadata findings. MkDocs builds if mkdocs.yml exists.
docker run --rm -v "$PWD:/workspace" "$image" validate

# Rewrite Python and Terraform files in the mounted project.
docker run --rm -v "$PWD:/workspace" "$image" format
git diff
```

Use a published release tag in place of `latest` for repeatable checks. Use the
read-only mount with `lint` or `metadata`. A MkDocs build can write the
configured site output, and `format` needs write access to the source files.

### Check Terraform modules

Formatting differences are warnings by default. Set `STRICT=true` to fail the
check when the formatter reports a difference. The container checks Terraform
formatting without initializing a backend,
downloading providers, or contacting a cloud account. For configuration
validation, run `terraform init -backend=false` and `terraform validate` from
each module root using that project's supported Terraform version. Initialization
can download providers and modules. Run plans and applies in your project's
configured execution environment.

```bash
# Use the module directory as the workspace to narrow the lint check.
docker run --rm -v "$PWD/infra/network:/workspace:ro" "$image" lint

# Treat linter warnings as failures.
docker run --rm -e STRICT=true -v "$PWD:/workspace:ro" "$image" lint
```

### Test a local validator build

Run these commands in the style guide repository. Then change to your target
project before running the image.

```bash
(cd cli && npm ci && npm run build)
docker build --tag coding-style-guide:local .

cd /path/to/your/project
docker run --rm -v "$PWD:/workspace:ro" coding-style-guide:local lint
```

The image uses `uv.lock` for Python dependencies and `docker/node-tools/package-lock.json`
for its JavaScript linters. When changing their dependency declarations, refresh the
matching lockfile with `uv lock` or `npm install --package-lock-only --ignore-scripts`
from `docker/node-tools` for the JavaScript linters.

If Docker cannot access the project on macOS or Windows, check Docker Desktop's
file-sharing settings. If a lint or formatting command fails, read the tool
output and rerun against the affected module or directory.

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
          docker run --rm -v "$PWD:/workspace" \
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
        entry: >-
          bash -c 'docker run --rm -v "$PWD:/workspace:ro"
          ghcr.io/tydukes/coding-style-guide:latest lint'
        language: system
        pass_filenames: false
        stages: [pre-commit]
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

Copy the [example Makefile](https://github.com/tydukes/coding-style-guide/blob/main/examples/local/Makefile)
into your project root, then run one of the targets below.

```bash
make lint
make validate
make format
```

---

## Common Issues

| Problem | Quick Fix |
|---------|-----------|
| Docker cannot access the project | Check that Docker is running and has permission to mount the project directory |
| Hundreds of errors on first run | Run `format` first, then `validate` again |
| CI pipeline is slow | Use `lint` mode instead of `validate` (skips docs build) |
| Metadata validation fails on legacy code | Start with non-blocking mode; add `@module` tags incrementally |
| Pre-commit hooks are slow | Move full validation to `push` stage; keep only formatters on `commit` |
| Container fails to pull in CI | Confirm the release tag exists and the runner can reach GHCR |

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
docker run --rm -v "$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest validate

# Lint only (faster — skips docs build)
docker run --rm -v "$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest lint

# Auto-format code
docker run --rm -v "$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest format

# Build documentation
docker run --rm -v "$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest docs

# Validate metadata tags only
docker run --rm -v "$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest metadata

# Show all available commands
docker run --rm ghcr.io/tydukes/coding-style-guide:latest help
```
