---
title: "Changelog"
description: "Project changelog tracking all notable changes"
author: "Tyler Dukes"
tags: [changelog, history, releases, versions]
category: "Project"
status: "active"
---

<!-- markdownlint-disable MD024 -->

## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive YAML frontmatter to all 21 documentation files ([#83](https://github.com/tydukes/coding-style-guide/pull/83))
  - Includes title, description, author, date, tags, category, status, version
  - Improves MkDocs Material theme integration
  - Enables better search and navigation
- Comprehensive repository structure documentation ([#84](https://github.com/tydukes/coding-style-guide/pull/84))
  - Expanded structure.md from 14 to 467+ lines
  - Added three recommended organizational patterns (monorepo, multi-repo, hybrid)
  - Directory standards and naming conventions
  - File organization best practices
  - Infrastructure as Code organization guidance
  - CI/CD organization patterns
  - Version control patterns (GitFlow)
  - Makefile organization examples
  - Migration strategies between patterns

### Fixed

- Critical contradiction in structure.md that incorrectly stated project is "multi-repo" ([#84](https://github.com/tydukes/coding-style-guide/pull/84))
- Duplicate H1 headings in documentation (MkDocs Material uses frontmatter titles) ([#83](https://github.com/tydukes/coding-style-guide/pull/83))

### Changed

- Documentation structure now uses frontmatter titles instead of markdown H1 headings ([#83](https://github.com/tydukes/coding-style-guide/pull/83))
- structure.md version bumped from 1.0.0 to 1.1.0 for significant content addition ([#84](https://github.com/tydukes/coding-style-guide/pull/84))

## [1.2.1] - 2025-10-28

### Changed

- Optimized Dockerfile to reduce image layers and improve build efficiency ([#9](https://github.com/tydukes/coding-style-guide/pull/9))
  - Sorted apt-get package names alphabetically (bash, curl, git, shellcheck)
  - Merged consecutive RUN instructions
  - Used COPY --chmod=755 instead of separate RUN chmod command
  - Combined UV installation with system dependencies setup

### Fixed

- Hadolint warnings in Dockerfile ([#9](https://github.com/tydukes/coding-style-guide/pull/9))
  - DL3018: Sort package names alphabetically
  - DL3031: Merge consecutive RUN instructions

## [1.2.0] - 2025-10-27

### Changed

- Dependency updates via Dependabot
  ([#5](https://github.com/tydukes/coding-style-guide/pull/5),
  [#6](https://github.com/tydukes/coding-style-guide/pull/6),
  [#7](https://github.com/tydukes/coding-style-guide/pull/7),
  [#8](https://github.com/tydukes/coding-style-guide/pull/8))
  - Bumped Python base image from 3.10-slim to 3.14-slim
  - Bumped actions/checkout from v4 to v5
  - Bumped docker/build-push-action from v5 to v6
  - Bumped actions/upload-artifact from v4 to v5

## [1.1.0] - 2025-10-27

### Added

- Comprehensive integration guide at `docs/07_integration/integration_prompt.md` ([#3](https://github.com/tydukes/coding-style-guide/pull/3))
  - Copy-paste prompts for integrating validator into other repositories
  - GitHub Actions integration examples
  - GitLab CI integration examples
  - Local development integration patterns
  - Platform-specific prompts
  - Customization options

### Fixed

- Nested code block rendering issues by escaping inner backticks ([#3](https://github.com/tydukes/coding-style-guide/pull/3))
- Line length issues in mkdocs.yml and docs/index.md ([#3](https://github.com/tydukes/coding-style-guide/pull/3))
- Container workflow unauthorized error during PR testing ([#3](https://github.com/tydukes/coding-style-guide/pull/3))
  - Added `load: true` for PRs to make built image available locally
  - Tests locally built image instead of pulling from registry
  - Builds only amd64 for PRs (faster), multi-arch for main branch pushes

### Changed

- Updated mkdocs.yml navigation to include integration guide ([#3](https://github.com/tydukes/coding-style-guide/pull/3))

## [1.0.0] - 2025-10-27

Initial release of the Dukes Engineering Style Guide.

### Added

- **Container Infrastructure**
  - Multi-stage Dockerfile with UV and all validation tools
    ([#1](https://github.com/tydukes/coding-style-guide/pull/1),
    [#2](https://github.com/tydukes/coding-style-guide/pull/2))
  - Smart docker-entrypoint.sh with multiple modes (validate, lint, format, docs, metadata)
  - docker-compose.yml for local development
  - .dockerignore for efficient build context

- **GitHub Actions Integration**
  - Reusable composite action at `.github/actions/validate/action.yml`
  - Container build/publish workflow with GHCR
  - Support for all validation modes with configurable inputs
  - Multi-architecture builds (linux/amd64, linux/arm64)

- **Documentation**
  - MkDocs-based documentation site with Material theme
  - Container usage guide at `docs/06_container/usage.md`
  - Integration examples for various platforms
  - Language guides (Python, Terraform, Bash, TypeScript, etc.)
  - Metadata schema documentation
  - CI/CD pipeline documentation

- **Validation Tools**
  - Python linting and formatting (Black, Flake8)
  - YAML validation (yamllint)
  - Shell script validation (shellcheck)
  - Markdown validation (markdownlint)
  - Terraform validation (fmt, validate, docs)
  - Metadata validation script

- **Development Workflow**
  - Pre-commit hooks configuration
  - Makefile with common targets
  - CLI wrapper script (scripts/validate-container.sh)
  - GitHub Actions workflows (CI, deployment)

- **Templates and Examples**
  - README template
  - Example integrations for GitHub Actions, GitLab CI, Jenkins
  - Makefile examples
  - Shell script examples

### Project Structure

```text
coding-style-guide/
├── docs/                  # MkDocs documentation
│   ├── 01_overview/      # Principles, governance, structure
│   ├── 02_language_guides/ # Language-specific guides
│   ├── 03_metadata_schema/ # Schema documentation
│   ├── 04_templates/     # Document templates
│   ├── 05_ci_cd/         # CI/CD patterns
│   ├── 06_container/     # Container usage
│   └── index.md          # Home page
├── .github/
│   ├── workflows/        # CI/CD workflows
│   └── actions/          # Custom actions
├── scripts/              # Automation scripts
├── Dockerfile           # Container definition
├── docker-compose.yml   # Local development
└── mkdocs.yml          # Documentation config
```

---

## Release Links

- [Unreleased](https://github.com/tydukes/coding-style-guide/compare/v1.2.1...HEAD)
- [1.2.1](https://github.com/tydukes/coding-style-guide/releases/tag/v1.2.1) - 2025-10-28
- [1.2.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.2.0) - 2025-10-27
- [1.1.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.1.0) - 2025-10-27
- [1.0.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.0.0) - 2025-10-27

## Versioning Policy

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Incompatible changes to validation rules or container interface
- **MINOR** version: New features, language guides, or significant documentation additions
- **PATCH** version: Bug fixes, dependency updates, documentation improvements

## Contributing

See [CONTRIBUTING.md](https://github.com/tydukes/coding-style-guide/blob/main/CONTRIBUTING.md) for guidelines on
proposing changes and creating pull requests.

## Security

For security-related changes or vulnerability reports,
see [SECURITY.md](https://github.com/tydukes/coding-style-guide/blob/main/SECURITY.md).
