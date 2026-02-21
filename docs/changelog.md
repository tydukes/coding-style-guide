---
title: "Changelog"
description: "Project changelog tracking all notable changes"
author: "Tyler Dukes"
tags: [changelog, history, releases, versions]
category: "Project"
status: "active"
search_keywords: [changelog, release notes, version history, updates, changes]
---

<!-- markdownlint-disable MD024 -->

## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.0] - 2026-02-20

### Added

- **New Language Guides**
  - Go programming language style guide ([#331](https://github.com/tydukes/coding-style-guide/pull/331))
  - Azure Bicep infrastructure as code guide ([#310](https://github.com/tydukes/coding-style-guide/pull/310))
  - Pulumi multi-cloud IaC style guide ([#309](https://github.com/tydukes/coding-style-guide/pull/309))
  - AWS CloudFormation best practices and standards ([#308](https://github.com/tydukes/coding-style-guide/pull/308))
  - ArgoCD and Flux CD GitOps standards ([#307](https://github.com/tydukes/coding-style-guide/pull/307))
  - Dev Container and GitHub Codespaces style guide ([#301](https://github.com/tydukes/coding-style-guide/pull/301))

- **Cloud Provider Guides**
  - Microsoft Azure best practices guide ([#328](https://github.com/tydukes/coding-style-guide/pull/328))
  - Google Cloud Platform best practices guide ([#332](https://github.com/tydukes/coding-style-guide/pull/332))
  - Crossplane cloud-agnostic infrastructure standards ([#333](https://github.com/tydukes/coding-style-guide/pull/333))

- **CI/CD and Security Standards**
  - Comprehensive code signing standards guide ([#299](https://github.com/tydukes/coding-style-guide/pull/299))
  - Distributed tracing and structured logging guide ([#303](https://github.com/tydukes/coding-style-guide/pull/303))
  - Seed data management and environment configuration guides ([#302](https://github.com/tydukes/coding-style-guide/pull/302))
  - Prometheus, Grafana, and sampling standards for observability ([#304](https://github.com/tydukes/coding-style-guide/pull/304))
  - Comprehensive SAST/DAST security testing standards ([#305](https://github.com/tydukes/coding-style-guide/pull/305))
  - Trivy, Snyk, and SonarQube integration standards ([#306](https://github.com/tydukes/coding-style-guide/pull/306))
  - CI/CD performance optimization guide ([#343](https://github.com/tydukes/coding-style-guide/pull/343))
  - Progressive enhancement roadmap and maturity model ([#342](https://github.com/tydukes/coding-style-guide/pull/342))

- **Testing and Quality Standards**
  - Performance testing standards guide: k6, JMeter, Gatling ([#319](https://github.com/tydukes/coding-style-guide/pull/319))
  - Chaos engineering and synthetic monitoring standards ([#320](https://github.com/tydukes/coding-style-guide/pull/320))
  - Smoke test standards for post-deployment verification ([#321](https://github.com/tydukes/coding-style-guide/pull/321))
  - Compliance as Code standards: InSpec, OPA, Sentinel ([#322](https://github.com/tydukes/coding-style-guide/pull/322))
  - Code smell catalog with anti-patterns and fixes ([#323](https://github.com/tydukes/coding-style-guide/pull/323))

- **New Documentation Guides**
  - Jenkins Shared Libraries organization and standards ([#327](https://github.com/tydukes/coding-style-guide/pull/327))
  - JSON Schema validation and documentation standards ([#326](https://github.com/tydukes/coding-style-guide/pull/326))
  - TOML and INI configuration file standards ([#325](https://github.com/tydukes/coding-style-guide/pull/325))
  - Task and Just task runner standards ([#324](https://github.com/tydukes/coding-style-guide/pull/324))
  - Diagram as Code style guide and standards ([#318](https://github.com/tydukes/coding-style-guide/pull/318))
  - AI-powered code review integration guide ([#317](https://github.com/tydukes/coding-style-guide/pull/317))
  - Dependency update policies guide for Renovate and Dependabot ([#314](https://github.com/tydukes/coding-style-guide/pull/314))
  - Changelog automation and release notes guide ([#313](https://github.com/tydukes/coding-style-guide/pull/313))
  - Language interoperability guide ([#341](https://github.com/tydukes/coding-style-guide/pull/341))
  - Real-world sample repository examples ([#340](https://github.com/tydukes/coding-style-guide/pull/340))
  - Glossary auto-generation and documentation versioning ([#338](https://github.com/tydukes/coding-style-guide/pull/338))
  - Productivity shell aliases and functions collection ([#337](https://github.com/tydukes/coding-style-guide/pull/337))
  - Pre-built git hooks library for common tasks ([#336](https://github.com/tydukes/coding-style-guide/pull/336))
  - REPL and interactive shell best practices guide ([#335](https://github.com/tydukes/coding-style-guide/pull/335))
  - Tutorial series for common scenarios ([#344](https://github.com/tydukes/coding-style-guide/pull/344))

- **New Templates**
  - Architecture Decision Records (ADR) template ([#312](https://github.com/tydukes/coding-style-guide/pull/312))
  - Runbook, playbook, and postmortem templates ([#311](https://github.com/tydukes/coding-style-guide/pull/311))
  - Reusable workflows and code generators templates ([#315](https://github.com/tydukes/coding-style-guide/pull/315))

- **Automation and Tooling**
  - Standalone CLI tool for style guide checking ([#316](https://github.com/tydukes/coding-style-guide/pull/316))
  - Automated language release tracking system ([#226](https://github.com/tydukes/coding-style-guide/pull/226))
  - Automated dependency version checking ([#222](https://github.com/tydukes/coding-style-guide/pull/222))
  - Automated changelog generation and semantic versioning ([#218](https://github.com/tydukes/coding-style-guide/pull/218))
  - Custom Claude agents for issue creation, CLI testing, and UI review ([#351](https://github.com/tydukes/coding-style-guide/pull/351))
  - Centralized workflow version management ([#224](https://github.com/tydukes/coding-style-guide/pull/224))
  - GitHub Actions versioning policy documentation ([#225](https://github.com/tydukes/coding-style-guide/pull/225))

- **IDE Improvements**
  - Complete IDE settings for all 19 supported languages ([#297](https://github.com/tydukes/coding-style-guide/pull/297))
  - VS Code debug configuration templates ([#334](https://github.com/tydukes/coding-style-guide/pull/334))

- **Documentation UX**
  - Dark mode toggle, print styles, and copy code buttons ([#346](https://github.com/tydukes/coding-style-guide/pull/346))
  - Improved search functionality and discoverability ([#345](https://github.com/tydukes/coding-style-guide/pull/345))
  - Quick search shortcut and sticky TOC with highlighting ([#347](https://github.com/tydukes/coding-style-guide/pull/347))
  - Related pages suggestions and bookmark/favorites system ([#348](https://github.com/tydukes/coding-style-guide/pull/348))

- **Terraform Enhancements**
  - Phase 1 testing and validation examples ([#233](https://github.com/tydukes/coding-style-guide/pull/233))
  - Phase 2 security and compliance examples ([#236](https://github.com/tydukes/coding-style-guide/pull/236))
  - Phase 3 networking examples ([#237](https://github.com/tydukes/coding-style-guide/pull/237))
  - Phase 4 operations and disaster recovery examples ([#239](https://github.com/tydukes/coding-style-guide/pull/239))

- **Project Health and Governance**
  - Comprehensive project health dashboard ([#208](https://github.com/tydukes/coding-style-guide/pull/208))
  - Interactive decision trees and flowcharts guide ([#207](https://github.com/tydukes/coding-style-guide/pull/207))
  - Getting Started tutorial ([#198](https://github.com/tydukes/coding-style-guide/pull/198))
  - Comprehensive README usage guide ([#200](https://github.com/tydukes/coding-style-guide/pull/200))
  - Retired phase labels and migrated to new label taxonomy ([#215](https://github.com/tydukes/coding-style-guide/pull/215))

### Fixed

- Release workflow changelog push and uv PATH ([#353](https://github.com/tydukes/coding-style-guide/pull/353))
- Broken CNCF supply chain security link ([#349](https://github.com/tydukes/coding-style-guide/pull/349))
- Broken SECURITY.md link in SonarCloud review guide ([#238](https://github.com/tydukes/coding-style-guide/pull/238))
- GitHub Actions composite action removed due to platform limitation ([#231](https://github.com/tydukes/coding-style-guide/pull/231))
- Broken GitHub Discussions links ([#217](https://github.com/tydukes/coding-style-guide/pull/217))
- Broken links throughout documentation ([#206](https://github.com/tydukes/coding-style-guide/pull/206))

### Changed

- Dependency updates
  - Bumped actions/checkout from 4 to 6
  - Bumped actions/setup-python from 5 to 6
  - Bumped astral-sh/setup-uv from 7.1.6 to 7.3.0 (multiple increments)
  - Bumped @isaacs/brace-expansion from 5.0.0 to 5.0.1 in /cli
- Removed assigned reviewers/assignees from Dependabot PRs to enable community contributions ([#219](https://github.com/tydukes/coding-style-guide/pull/219))
- Removed obsolete and supplemental files ([#296](https://github.com/tydukes/coding-style-guide/pull/296))
- Updated VS Code configuration and IDE settings to untrack machine-specific files

## [1.7.0] - 2025-12-20

### Added

- Comprehensive IaC testing framework and standards ([#175](https://github.com/tydukes/coding-style-guide/pull/175))
  - Enhanced Terraform guide with testing best practices
  - Enhanced Ansible guide with role testing strategies
  - GitLab CI tiered pipeline architecture
  - IaC Testing Philosophy and Standards document

### Changed

- Multiple dependency updates
  - Bumped actions/cache from 4 to 5 ([#177](https://github.com/tydukes/coding-style-guide/pull/177))
  - Bumped actions/upload-artifact from 5 to 6 ([#178](https://github.com/tydukes/coding-style-guide/pull/178))
  - Bumped actions/github-script from 7 to 8 ([#179](https://github.com/tydukes/coding-style-guide/pull/179))
  - Bumped peter-evans/create-pull-request from 7 to 8 ([#176](https://github.com/tydukes/coding-style-guide/pull/176))

## [1.6.0] - 2025-12-14

### Added

- Best Practices sections to 9 language guides ([#174](https://github.com/tydukes/coding-style-guide/pull/174))
  - Python, TypeScript, Bash, PowerShell, SQL
  - Terraform, Terragrunt, Ansible, Kubernetes
  - Each section includes code organization, naming, error handling, performance
- Comprehensive Common Pitfalls sections to all 19 language guides ([#163](https://github.com/tydukes/coding-style-guide/pull/163))
  - Real-world examples of common mistakes
  - Solutions and best practices for each pitfall
  - Cross-referenced with anti-patterns sections

### Fixed

- Removed hardcoded dates, versions, and static metadata ([#173](https://github.com/tydukes/coding-style-guide/pull/173))
  - Dynamic date generation for examples
  - Version-agnostic documentation
  - Improved maintainability

### Changed

- Configured Dependabot auto-merge for dependency updates ([#172](https://github.com/tydukes/coding-style-guide/pull/172))
  - Automated patch and minor version updates
  - Streamlined dependency management

## [1.5.0] - 2025-12-13

### Added

- Comprehensive Security Best Practices to all language guides ([#161](https://github.com/tydukes/coding-style-guide/pull/161))
  - Input validation, authentication, encryption
  - Secret management and secure coding practices
  - Language-specific security patterns
- Comprehensive Testing sections to all language guides ([#162](https://github.com/tydukes/coding-style-guide/pull/162))
  - Unit testing, integration testing, test organization
  - Testing frameworks and best practices
  - CI/CD integration patterns

### Changed

- Multiple dependency updates
  - Bumped actions/checkout from 4 to 6 ([#155](https://github.com/tydukes/coding-style-guide/pull/155))
  - Bumped actions/github-script from 7 to 8 ([#156](https://github.com/tydukes/coding-style-guide/pull/156))
  - Bumped peter-evans/create-pull-request from 6 to 7 ([#157](https://github.com/tydukes/coding-style-guide/pull/157))
  - Bumped actions/setup-node from 4 to 6 ([#158](https://github.com/tydukes/coding-style-guide/pull/158))
  - Bumped actions/upload-artifact from 4 to 5 ([#159](https://github.com/tydukes/coding-style-guide/pull/159))

## [1.4.0] - 2025-12-08

### Added

- Anti-patterns sections to all 19 language guides
  - Initial 9 language guides ([#152](https://github.com/tydukes/coding-style-guide/pull/152))
  - Remaining 9 language guides ([#153](https://github.com/tydukes/coding-style-guide/pull/153))
  - Real-world examples of code to avoid
- Code block language tag standards ([#151](https://github.com/tydukes/coding-style-guide/pull/151))
  - Standardized syntax highlighting tags
  - Improved documentation consistency
- Documentation heading structure standards ([#150](https://github.com/tydukes/coding-style-guide/pull/150))
  - Consistent heading hierarchy
  - Improved navigation and readability

### Fixed

- Standardized heading structure across all documentation ([#160](https://github.com/tydukes/coding-style-guide/pull/160))
  - Removed duplicate H1 headings
  - Fixed heading hierarchy issues
- Resolved broken links and updated link-check exclusions ([#154](https://github.com/tydukes/coding-style-guide/pull/154))

## [1.3.0] - 2025-12-07

### Added

- Comprehensive migration guides
  - PEP 8 migration guide ([#147](https://github.com/tydukes/coding-style-guide/pull/147))
  - Google Python Style Guide migration guide ([#148](https://github.com/tydukes/coding-style-guide/pull/148))
  - Airbnb Style Guide migration guide ([#149](https://github.com/tydukes/coding-style-guide/pull/149))
- Visual repository structure diagrams ([#146](https://github.com/tydukes/coding-style-guide/pull/146))
  - Mermaid diagrams for GitFlow, CI/CD, and Metadata Flow ([#145](https://github.com/tydukes/coding-style-guide/pull/145))
- Comprehensive refactoring examples directory ([#144](https://github.com/tydukes/coding-style-guide/pull/144))
  - Before/after examples for common refactoring patterns
- Quick Reference tables to all 19 language guides ([#141](https://github.com/tydukes/coding-style-guide/pull/141))
  - At-a-glance syntax and best practices

### Fixed

- Resolved broken links in documentation ([#142](https://github.com/tydukes/coding-style-guide/pull/142))

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

- [Unreleased](https://github.com/tydukes/coding-style-guide/compare/v1.8.0...HEAD)
- [1.8.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.0) - 2026-02-20
- [1.7.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.7.0) - 2025-12-20
- [1.6.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.6.0) - 2025-12-14
- [1.5.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.5.0) - 2025-12-13
- [1.4.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.4.0) - 2025-12-08
- [1.3.0](https://github.com/tydukes/coding-style-guide/releases/tag/v1.3.0) - 2025-12-07
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
