---
title: "Core Principles"
description: "Foundational principles governing the style guide: automation, AI-friendly metadata, and semantic versioning"
author: "Tyler Dukes"
tags: [principles, foundations, automation, metadata, standards]
category: "Overview"
status: "active"
search_keywords: [principles, philosophy, core values, design decisions, best practices]
---

<!-- markdownlint-disable MD024 -->

## Core Principles

DevOps Engineering Style Guide is built on core principles that prioritize automation, AI integration, consistency,
and maintainability. These principles guide every decision in the style guide and shape how teams write, review, and
maintain code.

## Guiding Philosophy

**Code is read far more often than it is written.** This style guide optimizes for:

- **Readability**: Code should be immediately understandable by humans and AI assistants
- **Consistency**: Uniform patterns across languages, projects, and teams
- **Automation**: Enforce standards automatically, not through manual review
- **AI-Optimization**: Structure code and metadata to maximize AI assistant effectiveness
- **Maintainability**: Code should be easy to modify, refactor, and extend

## Core Principles

### 1. Automation Over Manual Enforcement

**Principle**: Standards must be automatically enforceable through tooling. Manual code review should focus on logic,
architecture, and design—not formatting or style violations.

#### Why This Matters

- **Consistency**: Automated tools apply standards uniformly across all code
- **Efficiency**: Developers spend time solving problems, not debating formatting
- **Early Detection**: Issues caught in IDE or pre-commit, not in CI or code review
- **Objective Standards**: No subjective interpretation of style rules

#### Implementation

**Pre-commit Hooks**: Enforce standards before code reaches version control

```yaml
## .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    hooks:
      - id: black        # Python formatting
  - repo: https://github.com/pycqa/flake8
    hooks:
      - id: flake8       # Python linting
```

**CI/CD Validation**: Fail builds on standard violations

```yaml
## .github/workflows/ci.yml
- name: Validate coding standards
  uses: tydukes/coding-style-guide/.github/actions/validate@latest
  with:
    mode: validate
```

**IDE Integration**: Real-time feedback during development

- VSCode: `.vscode/settings.json` with format-on-save
- JetBrains: EditorConfig integration
- Vim: ALE or CoC with language servers

#### Tools by Language

| Language | Formatter | Linter | Type Checker |
|----------|-----------|--------|--------------|
| Python | Black | Flake8, Pylint | mypy |
| TypeScript | Prettier | ESLint | tsc |
| Terraform | terraform fmt | tflint | terraform validate |
| Bash | shfmt | shellcheck | - |
| YAML | prettier | yamllint | - |

### 2. AI-Friendly Metadata

**Principle**: All code modules must include structured metadata that helps AI assistants understand context, purpose,
dependencies, and usage patterns.

#### Why This Matters

- **AI Assistant Effectiveness**: Metadata helps AI understand code intent and relationships
- **Automated Documentation**: Metadata enables auto-generated documentation
- **Dependency Tracking**: Clear declaration of module dependencies and requirements
- **Searchability**: Structured metadata improves code search and discovery

#### Metadata Schema

Every module includes a `@module` metadata block:

**Python Example**:

```python
"""
@module user_authentication
@description Handles user authentication, session management, and JWT token generation
@dependencies fastapi, pyjwt, passlib, python-dotenv
@version 1.2.0
@author Tyler Dukes
@last_updated 2025-10-27
@security_classification internal
@api_endpoints POST /auth/login, POST /auth/logout, POST /auth/refresh
"""

import jwt
from fastapi import APIRouter
```

**Terraform Example**:

```hcl
/**
 * @module vpc
 * @description Creates VPC with public/private subnets, NAT gateways, and route tables
 * @dependencies aws_vpc, aws_subnet, aws_nat_gateway
 * @version 2.1.0
 * @author Tyler Dukes
 * @last_updated 2025-10-27
 * @terraform_version >= 1.0
 */

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
}
```

#### Benefits for AI Assistants

- **Context Awareness**: AI knows module purpose without reading entire codebase
- **Accurate Suggestions**: Dependencies help AI suggest compatible libraries
- **Version Compatibility**: AI can warn about version mismatches
- **Security Context**: Classification helps AI avoid suggesting insecure patterns

### 3. Consistency Across Languages

**Principle**: While each language has unique conventions, overarching patterns (naming, structure, documentation)
remain consistent across the codebase.

#### Cross-Language Standards

**Naming Conventions**:

- **Variables/Functions**: `snake_case` (Python, Bash), `camelCase` (TypeScript, Java)
- **Constants**: `UPPER_SNAKE_CASE` (all languages)
- **Classes**: `PascalCase` (all languages)
- **Files**: `snake_case.ext` (Python: `user_auth.py`, TypeScript: `user_auth.ts`)

**Directory Structure**:

```text
src/
├── core/              # Core business logic
├── api/               # API endpoints
├── services/          # External service integrations
└── utils/             # Utility functions

tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/               # End-to-end tests
```

**Documentation Structure**:

- Module-level docstrings/comments at file top
- Function/method documentation before definition
- Inline comments only for complex logic
- README.md in each major directory

#### Why Consistency Matters

- **Cognitive Load**: Developers switch between languages seamlessly
- **Onboarding**: New team members learn patterns once, apply everywhere
- **Tooling**: Consistent patterns enable shared validation scripts
- **AI Assistance**: AI learns patterns faster with consistency

### 4. Semantic Versioning

**Principle**: All modules, libraries, and the style guide itself follow strict semantic versioning (MAJOR.MINOR.PATCH).

#### Versioning Rules

- **MAJOR**: Breaking changes to API, interface, or validation rules
- **MINOR**: New features, language guides, backward-compatible additions
- **PATCH**: Bug fixes, documentation improvements, dependency updates

#### Examples

**Breaking Change (MAJOR: 1.0.0 → 2.0.0)**:

- Changed required metadata fields (breaks existing validation)
- Removed support for Python 3.8
- Changed Terraform module variable names

**New Feature (MINOR: 1.0.0 → 1.1.0)**:

- Added new language guide (PowerShell)
- Added new validation mode (security scanning)
- Added optional metadata fields

**Bug Fix (PATCH: 1.0.0 → 1.0.1)**:

- Fixed typo in documentation
- Corrected linter configuration
- Updated dependency versions

#### Version Tags

```bash
## Releases
git tag v1.0.0
git tag v1.1.0
git tag v2.0.0

## Pre-releases
git tag v1.0.0-rc.1
git tag v1.0.0-beta.2
```

### 5. Repository Flexibility

**Principle**: Support both monorepo and multi-repo patterns. Language guides are modular and can be used independently
or together.

#### Monorepo Benefits

- Atomic cross-service changes
- Shared tooling and validation
- Single source of truth
- Simplified CI/CD

#### Multi-Repo Benefits

- Clear ownership boundaries
- Independent release cycles
- Smaller, focused repositories
- Granular access control

#### Implementation

The style guide itself is a **monorepo** but provides guidance for both patterns. Each language guide can be:

- Referenced independently via documentation portal
- Integrated into any repository via container or GitHub Action
- Adopted incrementally (start with one language, expand over time)

See [Repository Structure](structure.md) for detailed guidance.

## Supporting Principles

### Readability First

**Code clarity trumps cleverness.** Prefer explicit, verbose code over compact, obscure solutions.

**Good**:

```python
def calculate_user_discount(user_tier: str, purchase_amount: float) -> float:
    """Calculate discount based on user tier and purchase amount."""
    if user_tier == "premium":
        return purchase_amount * 0.20
    elif user_tier == "standard":
        return purchase_amount * 0.10
    return 0.0
```

**Bad**:

```python
def calc_disc(t, a): return a * (0.2 if t == "p" else 0.1 if t == "s" else 0)
```

### Security by Default

**Secure coding patterns are mandatory, not optional.**

- No hardcoded secrets (use environment variables, secret managers)
- Input validation on all external data
- Least privilege access (IAM, database permissions)
- Dependency scanning (Dependabot, Snyk)
- Security linting (bandit for Python, tfsec for Terraform)

### Test-Driven Quality

**All code must be testable and tested.**

- Unit tests for business logic (80%+ coverage)
- Integration tests for API endpoints
- E2E tests for critical user flows
- Tests run in CI before merge

### Documentation as Code

**Documentation lives with code and is versioned together.**

- README.md in every directory
- API documentation generated from code (OpenAPI, JSDoc)
- Architecture Decision Records (ADRs) for major decisions
- MkDocs for comprehensive project documentation

## How Principles Work Together

These principles reinforce each other:

1. **Automation** ensures **consistency** is maintained automatically
2. **AI-friendly metadata** enables better **automation** through AI-assisted tooling
3. **Semantic versioning** supports **repository flexibility** by enabling safe upgrades
4. **Consistency** improves **readability** across languages and teams
5. **Readability** enhances **AI-friendliness** by making intent clear

## Implementation Checklist

When adopting this style guide:

- [ ] Set up pre-commit hooks for automated formatting
- [ ] Configure CI/CD to validate standards on every PR
- [ ] Add metadata blocks to all existing modules
- [ ] Adopt semantic versioning for all libraries and modules
- [ ] Document repository structure (monorepo vs multi-repo)
- [ ] Enable IDE auto-formatting on save
- [ ] Train team on core principles and tooling
- [ ] Create CONTRIBUTING.md with standards reference
- [ ] Set up Dependabot or similar for dependency updates
- [ ] Add security scanning to CI pipeline

## Evolution of Principles

These principles evolve based on:

- **Team Feedback**: Practical experience reveals needed adjustments
- **Technology Changes**: New languages, frameworks, and tools require updates
- **AI Advancement**: As AI capabilities grow, metadata schemas adapt
- **Security Landscape**: New threats require updated security principles

Propose changes via pull request with clear rationale. Major principle changes trigger MAJOR version bumps.

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [The Zen of Python](https://peps.python.org/pep-0020/)
- [Google Style Guides](https://google.github.io/styleguide/)
- [Infrastructure as Code Best Practices](https://developer.hashicorp.com/terraform/language/style)
