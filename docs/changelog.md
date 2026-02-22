---
title: "Changelog"
description: "Project changelog tracking all notable changes"
author: "Tyler Dukes"
tags: [changelog, history, releases, versions]
category: "Project"
status: "active"
search_keywords: [changelog, release notes, version history, updates, changes]
---

<!-- markdownlint-disable MD013 MD022 MD024 MD032 -->

## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## About This Changelog

This changelog is automatically generated from GitHub releases. Each release includes auto-generated release notes based on pull requests and commits.

## [Unreleased]

Changes that are in the main branch but not yet released.

## [v1.8.7] - 2026-02-22

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Other Changes
* fix(docs): add missing config examples to python guide — fixes 3:1 ratio by @tydukes in https://github.com/tydukes/coding-style-guide/pull/376


**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.8.6...v1.8.7

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.7)

## [v1.8.6] - 2026-02-22

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Other Changes
* docs(meta): rewrite CLAUDE.md — fix stale data, reduce to 237 lines by @tydukes in https://github.com/tydukes/coding-style-guide/pull/374


**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.8.5...v1.8.6

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.6)

## [v1.8.5] - 2026-02-22

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Other Changes
* fix(docs): update README guide count and badges to reflect 36 guides by @tydukes in https://github.com/tydukes/coding-style-guide/pull/373


**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.8.4...v1.8.5

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.5)

## [v1.8.4] - 2026-02-21

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Other Changes
* fix(docs): repair 25 broken anchor deep-links in refactoring index by @tydukes in https://github.com/tydukes/coding-style-guide/pull/371
* fix(docs): repair broken self-referential anchors in comparison_matrix.md by @tydukes in https://github.com/tydukes/coding-style-guide/pull/372


**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.8.3...v1.8.4

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.4)

## [v1.8.3] - 2026-02-21

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Other Changes
* docs(root): update README branding and remove stale root-level files by @tydukes in https://github.com/tydukes/coding-style-guide/pull/365


**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.8.2...v1.8.3

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.3)

## [v1.8.2] - 2026-02-21

## What's Changed

### 🐛 Bug Fixes / Accuracy

Systematic audit of all 19 language guides and CI/CD templates using MCP-verified current versions.

**GitHub Actions — floating `@master`/`@main` pins replaced (security)**
* `aquasecurity/trivy-action@master` → `@v0.34.1`
* `trufflesecurity/trufflehog@main` → `@v3.93.4`
* `bridgecrewio/checkov-action@master` → `@v12`
* `securego/gosec@master` → `@v2.23.0`
* `fluxcd/flux2/action@main` → `@v2.7.5`

**Node.js 18 EOL (April 2025) — updated to Node.js 22 LTS**
* `node:18-alpine` → `node:22-alpine` across dockerfile, gitlab_ci, jenkins_groovy, docker_compose, github_actions guides and all templates
* `gcr.io/distroless/nodejs18-debian11` → `gcr.io/distroless/nodejs20-debian12`
* `nodejs18.x` Lambda runtime → `nodejs20.x` (Pulumi guide)
* Node version matrices `[16,18,20]` / `[18,20,21]` / `[18,20,22]` → `[20, 22]`

**Language guide version tables corrected**
* **Go**: Added 1.25 (active) and 1.24 (active); marked 1.23 and 1.22 as EOL; updated `go.mod` example to `go 1.24`; updated `golang:1.21` Docker images to `golang:1.24`
* **Python**: Marked 3.9.x as EOL (EOL date Oct 2025 has passed)
* **Kubernetes**: Version range updated 1.28–1.31 → 1.31–1.33; kubeval example updated to 1.32.0
* **Ansible**: Version range updated 2.15–2.17 → 2.17–2.19; `min_ansible_version` 2.15→2.17; `ANSIBLE_VERSION` 2.16→2.18

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.8.1...v1.8.2

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.2)

## [v1.8.1] - 2026-02-21

## What's Changed

### 🐛 Bug Fixes

* fix(docs): resolve broken links detected by automated link checker (closes #358) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/361

### 📖 Documentation

* docs: full site audit — refresh overview pages, refactor Getting Started, fix governance (closes #359) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/360

## Details

The automated link checker flagged two 404s at `v1.8.0` due to a race condition — the GitHub release was published 13 minutes after the link checker ran. Both URLs are now valid. This patch release formally closes that issue and bundles the concurrent documentation site audit.

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.8.0...v1.8.1

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.1)

## [v1.8.0] - 2026-02-21

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### 🚀 Features
* feat(automation): add custom Claude agents for issue creation, CLI testing, and UI review by @tydukes in https://github.com/tydukes/coding-style-guide/pull/351
### 🐛 Bug Fixes
* fix(ci): fix release workflow changelog push and uv PATH by @tydukes in https://github.com/tydukes/coding-style-guide/pull/353
### 🔧 Maintenance
* chore: remove obsolete and supplemental files by @tydukes in https://github.com/tydukes/coding-style-guide/pull/296
### Other Changes
* Fix link checker failures by excluding DNS-blocked domains and correcting internal anchors by @Copilot in https://github.com/tydukes/coding-style-guide/pull/182
* feat: add IDE settings files for VS Code and IntelliJ (#184) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/196
* feat: Create comprehensive Getting Started tutorial (Closes #185) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/198
* Enhance README with comprehensive usage guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/199
* feat: Create comprehensive language guide comparison matrix (Closes #191) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/200
* feat: Add comprehensive plan to achieve 3:1 ratio for terraform.md (Closes #192) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/201
* fix: resolve broken links in documentation (Closes #197) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/206
* feat: Add interactive decision trees and flowcharts guide (Closes #188) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/207
* feat: Add comprehensive project health dashboard (#187) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/208
* Retire phase labels and migrate to new label taxonomy by @tydukes in https://github.com/tydukes/coding-style-guide/pull/215
* fix: Remove broken GitHub Discussions links (#216) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/217
* feat(automation): implement automated changelog generation and semantic versioning by @tydukes in https://github.com/tydukes/coding-style-guide/pull/218
* Update Dependabot Configuration for Community Contributions by @tydukes in https://github.com/tydukes/coding-style-guide/pull/219
* feat(ci): implement automated dependency version checking (#210) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/222
* feat(ci): parameterize workflow versions for centralized management by @tydukes in https://github.com/tydukes/coding-style-guide/pull/224
* docs(security): add GitHub Actions versioning policy to prefer version tags by @tydukes in https://github.com/tydukes/coding-style-guide/pull/225
* feat(automation): implement automated language release tracking system by @tydukes in https://github.com/tydukes/coding-style-guide/pull/226
* fix(ci): remove composite action due to GitHub Actions limitation by @tydukes in https://github.com/tydukes/coding-style-guide/pull/231
* feat(terraform): add Phase 1 testing and validation examples by @tydukes in https://github.com/tydukes/coding-style-guide/pull/233
* feat(terraform): add Phase 2 security and compliance examples (#203) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/236
* fix(terraform): resolve Phase 2 double-fence parsing bugs and add Phase 3 networking examples by @tydukes in https://github.com/tydukes/coding-style-guide/pull/237
* fix(docs): correct broken SECURITY.md link in sonarcloud review guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/238
* feat(terraform): add operations and disaster recovery examples for Phase 4 by @tydukes in https://github.com/tydukes/coding-style-guide/pull/239
* feat(ide): Complete IDE settings for all 19 supported languages (#248) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/297
* feat(ci-cd): add comprehensive code signing standards guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/299
* feat(devcontainer): add Dev Container and GitHub Codespaces style guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/301
* feat(ci-cd): add seed data management and environment configuration guides by @tydukes in https://github.com/tydukes/coding-style-guide/pull/302
* feat(ci-cd): add distributed tracing and structured logging guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/303
* feat(ci-cd): add Prometheus, Grafana, and sampling standards to observability guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/304
* feat(ci-cd): add comprehensive SAST/DAST security testing standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/305
* feat(ci-cd): add comprehensive Trivy, Snyk, and SonarQube integration standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/306
* feat(language-guide): add ArgoCD and Flux CD GitOps standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/307
* feat(language-guide): add AWS CloudFormation best practices and standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/308
* feat(language-guide): add Pulumi style guide for multi-cloud IaC by @tydukes in https://github.com/tydukes/coding-style-guide/pull/309
* feat(language-guide): add Azure Bicep style guide for infrastructure as code by @tydukes in https://github.com/tydukes/coding-style-guide/pull/310
* feat(templates): add runbook, playbook, and postmortem templates by @tydukes in https://github.com/tydukes/coding-style-guide/pull/311
* feat(templates): add Architecture Decision Records (ADR) template by @tydukes in https://github.com/tydukes/coding-style-guide/pull/312
* feat(docs): add changelog automation and release notes guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/313
* feat(docs): add dependency update policies guide for Renovate and Dependabot by @tydukes in https://github.com/tydukes/coding-style-guide/pull/314
* feat(templates): add reusable workflows and code generators templates by @tydukes in https://github.com/tydukes/coding-style-guide/pull/315
* feat(cli): add standalone CLI tool for style guide checking by @tydukes in https://github.com/tydukes/coding-style-guide/pull/316
* feat(docs): add AI-powered code review integration guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/317
* feat(docs): add Diagram as Code style guide and standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/318
* feat(docs): add performance testing standards (k6, JMeter, Gatling) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/319
* feat(docs): add chaos engineering and synthetic monitoring standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/320
* feat(docs): add smoke test standards for post-deployment verification by @tydukes in https://github.com/tydukes/coding-style-guide/pull/321
* feat(docs): add Compliance as Code standards (InSpec, OPA, Sentinel) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/322
* feat(docs): add code smell catalog with anti-patterns and fixes by @tydukes in https://github.com/tydukes/coding-style-guide/pull/323
* feat(docs): add Task and Just task runner standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/324
* feat(docs): add TOML and INI configuration file standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/325
* feat(docs): add JSON Schema validation and documentation standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/326
* feat(docs): add Jenkins Shared Libraries organization and standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/327
* feat(docs): add Microsoft Azure cloud provider best practices guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/328
* feat(docs): add Go programming language style guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/331
* feat(docs): add Google Cloud Platform cloud provider best practices guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/332
* feat(docs): add Crossplane cloud-agnostic infrastructure standards by @tydukes in https://github.com/tydukes/coding-style-guide/pull/333
* feat(ide): add VS Code debug configuration templates by @tydukes in https://github.com/tydukes/coding-style-guide/pull/334
* feat(docs): add REPL and interactive shell best practices guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/335
* feat(docs): add pre-built git hooks library for common tasks (#282) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/336
* feat(docs): add productivity shell aliases and functions collection (#283) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/337
* feat(docs): add glossary auto-generation and documentation versioning by @tydukes in https://github.com/tydukes/coding-style-guide/pull/338
* feat(docs): add real-world sample repository examples by @tydukes in https://github.com/tydukes/coding-style-guide/pull/340
* feat(docs): add language interoperability guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/341
* feat(docs): add progressive enhancement roadmap and maturity model by @tydukes in https://github.com/tydukes/coding-style-guide/pull/342
* feat(docs): add CI/CD performance optimization guide by @tydukes in https://github.com/tydukes/coding-style-guide/pull/343
* feat(docs): add tutorial series for common scenarios (#194) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/344
* feat(docs): improve search functionality and discoverability (#195) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/345
* feat(docs): add dark mode toggle, print styles, and copy code buttons by @tydukes in https://github.com/tydukes/coding-style-guide/pull/346
* feat(docs): add quick search shortcut and sticky TOC with highlighting by @tydukes in https://github.com/tydukes/coding-style-guide/pull/347
* feat(docs): add related pages suggestions and bookmark/favorites system by @tydukes in https://github.com/tydukes/coding-style-guide/pull/348
* fix(docs): replace broken CNCF supply chain security link by @tydukes in https://github.com/tydukes/coding-style-guide/pull/349
* docs(changelog): backfill changelog and bump version to v1.8.0 by @tydukes in https://github.com/tydukes/coding-style-guide/pull/356
* fix(docs): resolve broken links (closes #350) by @tydukes in https://github.com/tydukes/coding-style-guide/pull/357

## New Contributors
* @Copilot made their first contribution in https://github.com/tydukes/coding-style-guide/pull/182

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.3.0...v1.8.0

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.8.0)

## [v1.7.0] - 2025-12-21

## What's Changed

### Added

- Comprehensive IaC testing framework and standards ([#175](https://github.com/tydukes/coding-style-guide/pull/175))
  - Enhanced Terraform guide with testing best practices
  - Enhanced Ansible guide with role testing strategies
  - GitLab CI tiered pipeline architecture
  - IaC Testing Philosophy and Standards document
- Production-ready code examples for Terraform guide ([#180](https://github.com/tydukes/coding-style-guide/pull/180))
  - CI/CD pipeline examples (GitHub Actions, GitLab CI)
  - Complete Terratest integration test suite
  - Production modules: EKS, Monitoring, ECS, Lambda, DynamoDB
  - 4,673 lines of deployment-ready code following best practices
- CONTRACT.md template for IaC modules and roles
- TESTING.md template for IaC projects
- Code-to-text ratio analysis tool

### Changed

- Multiple dependency updates
  - Bumped actions/cache from 4 to 5 ([#177](https://github.com/tydukes/coding-style-guide/pull/177))
  - Bumped actions/upload-artifact from 5 to 6 ([#178](https://github.com/tydukes/coding-style-guide/pull/178))
  - Bumped actions/github-script from 7 to 8 ([#179](https://github.com/tydukes/coding-style-guide/pull/179))
  - Bumped peter-evans/create-pull-request from 7 to 8 ([#176](https://github.com/tydukes/coding-style-guide/pull/176))

### Fixed

- Removed all hardcoded version numbers from document footers
- Updated changelog with versions 1.3.0 through 1.7.0
- Navigation structure to include IaC templates
- Broken anchor links in documentation
- Metadata validation errors

## Metrics

- **Code-to-Text Ratio Achievement**: 18/19 guides now pass 3:1 target (94.7%)
- **New Content**: ~13,867 lines of documentation and code examples
- **Files Changed**: 54 files across documentation, templates, and tooling

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.6.0...v1.7.0

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.7.0)

## [v1.6.0] - 2025-12-21

## What's Changed

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

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.5.0...v1.6.0

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.6.0)

## [v1.5.0] - 2025-12-21

## What's Changed

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

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.4.0...v1.5.0

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.5.0)

## [v1.4.0] - 2025-12-21

## What's Changed

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

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.3.0...v1.4.0

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.4.0)

## [v1.3.0] - 2025-12-21

## What's Changed

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

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.2.1...v1.3.0

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.3.0)

## [v1.2.0] - 2025-10-27

## What's New

This release adds comprehensive repository documentation and community files to improve project discoverability and contributor experience.

### Added
- MIT License for open source distribution
- Contributing guidelines (CONTRIBUTING.md)
- Code of Conduct (CODE_OF_CONDUCT.md) - Contributor Covenant v2.1
- Security policy (SECURITY.md)
- AI assistant guide (CLAUDE.md)
- Pull request template
- Issue templates (bug report, feature request, documentation)
- Dependabot configuration for automated dependency updates
- Comprehensive README badges

### Files Changed
- 13 files added
- 1,124 lines inserted

**Full Changelog**: https://github.com/tydukes/coding-style-guide/compare/v1.1.0...v1.2.0

[View Release](https://github.com/tydukes/coding-style-guide/releases/tag/v1.2.0)

---

*This changelog was automatically generated on 2026-02-22 01:09:50 UTC*
