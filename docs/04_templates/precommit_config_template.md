---
title: "Pre-commit Config Template"
description: "Comprehensive .pre-commit-config.yaml templates for automated code quality checks"
author: "Tyler Dukes"
tags: [pre-commit, git-hooks, quality, automation, linting]
category: "Templates"
status: "active"
search_keywords: [pre-commit, hooks, template, linting, formatting, automation, git hooks]
---

## Overview

This document provides comprehensive `.pre-commit-config.yaml` templates for automated code quality checks across
all languages covered in this style guide. Pre-commit hooks run before each commit to catch issues early and maintain
code quality standards.

---

## Installation

```bash
## Install pre-commit
pip install pre-commit

## Install the git hook scripts
pre-commit install

## (Optional) Run against all files
pre-commit run --all-files

## (Optional) Update hooks to latest versions
pre-commit autoupdate
```

---

## Python Projects

```yaml
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-toml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: check-docstring-first
      - id: debug-statements
      - id: name-tests-test
        args: ['--pytest-test-first']
      - id: requirements-txt-fixer

  # Black - Code formatter
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.10
        args: ['--line-length=100']

  # Ruff - Fast Python linter
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: ['--fix', '--exit-non-zero-on-fix']

  # MyPy - Static type checker
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
        args: ['--strict', '--ignore-missing-imports']

  # isort - Import sorting (alternative to Ruff's isort)
  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: ['--profile=black', '--line-length=100']

  # Bandit - Security linting
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        args: ['-c', 'pyproject.toml']
        additional_dependencies: ['bandit[toml]']

  # Safety - Check dependencies for known security vulnerabilities
  - repo: https://github.com/Lucas-C/pre-commit-hooks-safety
    rev: v1.3.3
    hooks:
      - id: python-safety-dependencies-check

  # Pylint - Additional linting
  - repo: https://github.com/pycqa/pylint
    rev: v3.0.3
    hooks:
      - id: pylint
        args: ['--rcfile=.pylintrc']
```

---

## TypeScript / JavaScript Projects

```yaml
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
      - id: check-merge-conflict

  # ESLint - JavaScript/TypeScript linting
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.(js|ts|jsx|tsx)$
        types: [file]
        additional_dependencies:
          - eslint@8.56.0
          - '@typescript-eslint/parser@6.19.0'
          - '@typescript-eslint/eslint-plugin@6.19.0'
          - eslint-config-prettier@9.1.0
        args: ['--fix']

  # Prettier - Code formatter
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        files: \.(js|ts|jsx|tsx|json|yaml|yml|md)$
        args: ['--write']

  # TypeScript compiler check
  - repo: https://github.com/pre-commit/mirrors-tsc
    rev: v5.3.3
    hooks:
      - id: tsc
        pass_filenames: false
        args: ['--noEmit']
```

---

## Terraform Projects

```yaml
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict

  # Terraform hooks
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
        args:
          - '--args=--lockfile=false'
      - id: terraform_tflint
        args:
          - '--args=--config=__GIT_WORKING_DIR__/.tflint.hcl'
      - id: terraform_tfsec
        args:
          - '--args=--minimum-severity=MEDIUM'
      - id: terraform_checkov
        args:
          - '--args=--quiet'
          - '--args=--framework=terraform'

  # Terragrunt hooks
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terragrunt_fmt
      - id: terragrunt_validate

  # TFLint config validation
  - repo: https://github.com/terraform-linters/tflint
    rev: v0.50.0
    hooks:
      - id: tflint
        args: ['--config=.tflint.hcl']
```

---

## Ansible Projects

```yaml
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict

  # Ansible Lint
  - repo: https://github.com/ansible/ansible-lint
    rev: v6.22.1
    hooks:
      - id: ansible-lint
        files: \.(yaml|yml)$
        args: ['--force-color']

  # YAML Lint
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.33.0
    hooks:
      - id: yamllint
        args: ['-c=.yamllint.yml']
```

---

## Bash Scripts

```yaml
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: check-executables-have-shebangs
      - id: check-shebang-scripts-are-executable

  # ShellCheck - Shell script linting
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.6
    hooks:
      - id: shellcheck
        args: ['--severity=warning']

  # shfmt - Shell script formatter
  - repo: https://github.com/scop/pre-commit-shfmt
    rev: v3.8.0-1
    hooks:
      - id: shfmt
        args: ['-i', '2', '-ci', '-w']
```

---

## Docker Projects

```yaml
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict

  # Hadolint - Dockerfile linting
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint-docker
        args: ['--ignore', 'DL3008', '--ignore', 'DL3009']

  # Docker Compose validation
  - repo: https://github.com/IamTheFij/docker-pre-commit
    rev: v3.0.1
    hooks:
      - id: docker-compose-check
```

---

## Kubernetes / Helm

```yaml
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict

  # Kubernetes manifest validation
  - repo: https://github.com/Lucas-C/pre-commit-hooks
    rev: v1.5.4
    hooks:
      - id: insert-license
        files: \.(yaml|yml)$
        args:
          - '--license-filepath'
          - 'LICENSE.txt'
          - '--comment-style'
          - '#'

  # Helm lint
  - repo: https://github.com/gruntwork-io/pre-commit
    rev: v0.1.23
    hooks:
      - id: helmlint

  # Kubeval - Kubernetes manifest validation
  - repo: https://github.com/instrumenta/kubeval
    rev: v0.16.1
    hooks:
      - id: kubeval
        files: \.yaml$
```

---

## Multi-Language Projects

```yaml
repos:
  # ==========================================
  # General Checks
  # ==========================================
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: ['--allow-multiple-documents']
      - id: check-json
      - id: check-toml
      - id: check-xml
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: check-symlinks
      - id: destroyed-symlinks
      - id: mixed-line-ending
        args: ['--fix=lf']
      - id: detect-private-key

  # ==========================================
  # Python
  # ==========================================
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.10

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: ['--fix']

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]

  # ==========================================
  # TypeScript / JavaScript
  # ==========================================
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.(js|ts|jsx|tsx)$
        additional_dependencies:
          - eslint@8.56.0
          - '@typescript-eslint/parser@6.19.0'
          - '@typescript-eslint/eslint-plugin@6.19.0'
        args: ['--fix']

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        files: \.(js|ts|jsx|tsx|json|yaml|yml|md)$

  # ==========================================
  # Terraform
  # ==========================================
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint

  # ==========================================
  # Shell Scripts
  # ==========================================
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.6
    hooks:
      - id: shellcheck

  - repo: https://github.com/scop/pre-commit-shfmt
    rev: v3.8.0-1
    hooks:
      - id: shfmt
        args: ['-i', '2', '-ci', '-w']

  # ==========================================
  # Docker
  # ==========================================
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint-docker

  # ==========================================
  # YAML
  # ==========================================
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.33.0
    hooks:
      - id: yamllint
        args: ['-c=.yamllint.yml']

  # ==========================================
  # Markdown
  # ==========================================
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.38.0
    hooks:
      - id: markdownlint
        args: ['--fix']

  # ==========================================
  # Security Scanning
  # ==========================================
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  # ==========================================
  # Git Commit Messages
  # ==========================================
  - repo: https://github.com/jorisroovers/gitlint
    rev: v0.19.1
    hooks:
      - id: gitlint
        stages: [commit-msg]
```

---

## Language-Specific Configurations

### Go Projects

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-added-large-files

  # Go formatting
  - repo: https://github.com/dnephin/pre-commit-golang
    rev: v0.5.1
    hooks:
      - id: go-fmt
      - id: go-vet
      - id: go-imports
      - id: go-cyclo
        args: ['-over=15']
      - id: validate-toml
      - id: no-go-testing
      - id: golangci-lint
      - id: go-unit-tests
```

### SQL Projects

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-added-large-files

  # SQL formatting and linting
  - repo: https://github.com/sqlfluff/sqlfluff
    rev: 2.3.5
    hooks:
      - id: sqlfluff-lint
        args: ['--dialect=postgres']
      - id: sqlfluff-fix
        args: ['--dialect=postgres']
```

---

## Configuration Files

### .yamllint.yml

```yaml
extends: default

rules:
  line-length:
    max: 120
    level: warning
  indentation:
    spaces: 2
    indent-sequences: true
  comments:
    min-spaces-from-content: 1
  document-start: disable
  truthy:
    allowed-values: ['true', 'false', 'yes', 'no']
```

### .markdownlint.json

```json
{
  "default": true,
  "MD013": {
    "line_length": 120,
    "code_blocks": false,
    "tables": false
  },
  "MD033": false,
  "MD041": false
}
```

### .secrets.baseline

```json
{
  "version": "1.4.0",
  "plugins_used": [
    {
      "name": "ArtifactoryDetector"
    },
    {
      "name": "AWSKeyDetector"
    },
    {
      "name": "Base64HighEntropyString",
      "limit": 4.5
    },
    {
      "name": "BasicAuthDetector"
    },
    {
      "name": "CloudantDetector"
    },
    {
      "name": "HexHighEntropyString",
      "limit": 3.0
    },
    {
      "name": "JwtTokenDetector"
    },
    {
      "name": "KeywordDetector"
    },
    {
      "name": "MailchimpDetector"
    },
    {
      "name": "PrivateKeyDetector"
    },
    {
      "name": "SlackDetector"
    },
    {
      "name": "SoftlayerDetector"
    },
    {
      "name": "StripeDetector"
    },
    {
      "name": "TwilioKeyDetector"
    }
  ],
  "filters_used": [
    {
      "path": "detect_secrets.filters.allowlist.is_line_allowlisted"
    },
    {
      "path": "detect_secrets.filters.common.is_baseline_file",
      "filename": ".secrets.baseline"
    },
    {
      "path": "detect_secrets.filters.heuristic.is_indirect_reference"
    }
  ],
  "results": {},
  "generated_at": "2025-01-01T00:00:00Z"
}
```

---

## Best Practices

### Running Pre-commit Hooks

```bash
## Run hooks against all files
pre-commit run --all-files

## Run specific hook
pre-commit run black --all-files

## Run hooks against staged files only
pre-commit run

## Skip hooks for a specific commit (use sparingly)
git commit --no-verify -m "message"

## Update all hooks to latest versions
pre-commit autoupdate
```

### Performance Optimization

```yaml
## Use local hooks for faster execution
- repo: local
  hooks:
    - id: pytest-check
      name: pytest-check
      entry: pytest
      language: system
      pass_filenames: false
      always_run: true

## Limit files checked
- id: mypy
  files: ^src/
  exclude: ^tests/

## Use stages for specific git operations
- id: pytest
  stages: [push]
```

### CI/CD Integration

```yaml
## GitHub Actions example
name: Pre-commit

on:
  pull_request:
  push:
    branches: [main]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - uses: pre-commit/action@v3.0.0
```

---

## Common Hooks Reference

### File Checks

- `trailing-whitespace` - Remove trailing whitespace
- `end-of-file-fixer` - Ensure files end with newline
- `check-yaml` - Validate YAML syntax
- `check-json` - Validate JSON syntax
- `check-toml` - Validate TOML syntax
- `check-added-large-files` - Prevent large files
- `check-merge-conflict` - Check for merge conflict markers

### Security

- `detect-private-key` - Detect private keys
- `detect-secrets` - Scan for secrets and credentials
- `bandit` - Python security issues
- `safety` - Python dependency vulnerabilities

### Formatting

- `black` - Python code formatter
- `prettier` - JavaScript/TypeScript/JSON/Markdown formatter
- `terraform_fmt` - Terraform formatter
- `shfmt` - Shell script formatter

### Linting

- `ruff` - Fast Python linter
- `eslint` - JavaScript/TypeScript linter
- `shellcheck` - Shell script linter
- `hadolint` - Dockerfile linter
- `tflint` - Terraform linter
- `ansible-lint` - Ansible linter

---

## References

### Official Documentation

- [Pre-commit Documentation](https://pre-commit.com/)
- [Pre-commit Hooks Repository](https://github.com/pre-commit/pre-commit-hooks)
- [Supported Hooks](https://pre-commit.com/hooks.html)

### Language-Specific Hook Repositories

- [pre-commit-terraform](https://github.com/antonbabenko/pre-commit-terraform)
- [pre-commit-golang](https://github.com/dnephin/pre-commit-golang)
- [ansible-lint](https://github.com/ansible/ansible-lint)

### Tools

- [pre-commit.ci](https://pre-commit.ci/) - Continuous integration for pre-commit
- [detect-secrets](https://github.com/Yelp/detect-secrets) - Secret detection
- [hadolint](https://github.com/hadolint/hadolint) - Dockerfile linter

---

**Status**: Active
