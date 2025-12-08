---
title: "Pre-commit Hooks Guide"
description: "Comprehensive guide to implementing pre-commit hooks for automated code quality checks, security scanning, and consistent formatting across all supported languages"
author: "Tyler Dukes"
date: "2025-12-01"
tags: [pre-commit, hooks, code-quality, automation, linting, formatting, security]
category: "CI/CD"
status: "active"
version: "1.0.0"
---

## Introduction

Pre-commit hooks are automated checks that run before each Git commit, ensuring code quality, consistency,
and security across your entire codebase. This guide covers installation, configuration, and best practices
for all languages in the Dukes Engineering Style Guide.

---

## Table of Contents

1. [Installation and Setup](#installation-and-setup)
2. [Configuration](#configuration)
3. [Language-Specific Hooks](#language-specific-hooks)
4. [Security Hooks](#security-hooks)
5. [Custom Hooks](#custom-hooks)
6. [CI/CD Integration](#cicd-integration)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)

---

## Installation and Setup

### Prerequisites

Install pre-commit via your preferred package manager:

**Python (pip/pipx)**:

```bash
## Using pip
pip install pre-commit

## Using pipx (recommended for global install)
pipx install pre-commit
```

**Homebrew (macOS/Linux)**:

```bash
brew install pre-commit
```

**System Package Managers**:

```bash
## Ubuntu/Debian
sudo apt install pre-commit

## Fedora
sudo dnf install pre-commit

## Arch Linux
sudo pacman -S pre-commit
```

### Initialize in Repository

```bash
## Navigate to your repository
cd /path/to/your/repo

## Install pre-commit hooks
pre-commit install

## Install commit-msg hooks (optional, for conventional commits)
pre-commit install --hook-type commit-msg

## Install pre-push hooks (optional, for expensive checks)
pre-commit install --hook-type pre-push
```

### Verify Installation

```bash
## Run hooks on all files to verify setup
pre-commit run --all-files

## Check installed hooks
pre-commit run --hook-stage manual
```

---

## Configuration

### Basic .pre-commit-config.yaml

Create `.pre-commit-config.yaml` in your repository root:

```yaml
## Basic pre-commit configuration
repos:
  # General file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: mixed-line-ending
        args: ['--fix=lf']
      - id: detect-private-key

  # Python
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        additional_dependencies: [flake8-docstrings]

  # YAML
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.33.0
    hooks:
      - id: yamllint
        args: ['-d', '{extends: default, rules: {line-length: {max: 120}}}']

  # Shell scripts
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.6
    hooks:
      - id: shellcheck

  # Markdown
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.38.0
    hooks:
      - id: markdownlint
        args: ['--fix']

  # Terraform
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
        args:
          - '--hook-config=--path-to-file=README.md'
          - '--hook-config=--add-to-existing-file=true'
          - '--hook-config=--create-file-if-not-exist=true'

  # Secret detection
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### Full-Stack Configuration

For projects with multiple languages:

```yaml
## .pre-commit-config.yaml - Full-stack example
repos:
  # ===== General =====
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
        exclude: \.svg$
      - id: end-of-file-fixer
        exclude: \.svg$
      - id: check-yaml
        args: ['--allow-multiple-documents']
      - id: check-json
      - id: check-toml
      - id: check-xml
      - id: check-added-large-files
        args: ['--maxkb=2000']
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: mixed-line-ending
        args: ['--fix=lf']
      - id: detect-private-key
      - id: check-symlinks
      - id: destroyed-symlinks
      - id: check-executables-have-shebangs
      - id: check-shebang-scripts-are-executable

  # ===== Python =====
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11
        args: ['--line-length=120']

  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: ['--profile=black', '--line-length=120']

  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=120', '--extend-ignore=E203,W503']
        additional_dependencies:
          - flake8-docstrings
          - flake8-bugbear
          - flake8-comprehensions
          - flake8-simplify

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [types-requests, types-PyYAML]
        args: ['--ignore-missing-imports', '--strict']

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        args: ['-ll', '-i']

  # ===== JavaScript / TypeScript =====
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx, json, yaml, markdown]
        additional_dependencies:
          - prettier@3.1.0
          - '@prettier/plugin-xml@3.2.2'

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.[jt]sx?$
        types: [file]
        additional_dependencies:
          - eslint@8.56.0
          - eslint-config-airbnb-base@15.0.0
          - eslint-plugin-import@2.29.1

  # ===== YAML =====
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.33.0
    hooks:
      - id: yamllint
        args:
          - '-d'
          - '{extends: default, rules: {line-length: {max: 120}, indentation: {spaces: 2}}}'

  # ===== Shell Scripts =====
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.6
    hooks:
      - id: shellcheck
        args: ['--severity=warning']

  - repo: https://github.com/scop/pre-commit-shfmt
    rev: v3.7.0-4
    hooks:
      - id: shfmt
        args: ['-i', '2', '-ci', '-w']

  # ===== Markdown =====
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.38.0
    hooks:
      - id: markdownlint
        args: ['--fix', '--config', '.markdownlint.yaml']

  # ===== Terraform / Terragrunt =====
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
        args:
          - '--hook-config=--retry-once-with-cleanup=true'
      - id: terraform_docs
        args:
          - '--hook-config=--path-to-file=README.md'
          - '--hook-config=--add-to-existing-file=true'
          - '--hook-config=--create-file-if-not-exist=true'
      - id: terraform_tflint
        args:
          - '--args=--config=__GIT_WORKING_DIR__/.tflint.hcl'
      - id: terraform_trivy
        args:
          - '--args=--severity=HIGH,CRITICAL'
          - '--args=--skip-dirs="**/.terraform"'

  # ===== Ansible =====
  - repo: https://github.com/ansible/ansible-lint
    rev: v6.22.2
    hooks:
      - id: ansible-lint
        files: \.(yaml|yml)$
        args: ['-c', '.ansible-lint']

  # ===== Dockerfile =====
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint
        args: ['--ignore', 'DL3008', '--ignore', 'DL3009']

  # ===== Docker Compose =====
  - repo: https://github.com/IamTheFij/docker-pre-commit
    rev: v3.0.1
    hooks:
      - id: docker-compose-check

  # ===== SQL =====
  - repo: https://github.com/sqlfluff/sqlfluff
    rev: 2.3.5
    hooks:
      - id: sqlfluff-lint
        args: ['--dialect', 'postgres']
      - id: sqlfluff-fix
        args: ['--dialect', 'postgres']

  # ===== Security Scanning =====
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args:
          - '--baseline'
          - '.secrets.baseline'
          - '--exclude-files'
          - '\.lock$'
          - '--exclude-files'
          - '\.svg$'

  - repo: https://github.com/trufflesecurity/trufflehog
    rev: v3.63.7
    hooks:
      - id: trufflehog
        args:
          - '--no-update'
          - 'filesystem'
          - '.'
          - '--exclude-paths'
          - '.trufflehog-exclude.txt'

  # ===== Commit Message Validation =====
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.0.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
        args: ['--strict']

  # ===== License Headers =====
  - repo: https://github.com/Lucas-C/pre-commit-hooks
    rev: v1.5.4
    hooks:
      - id: insert-license
        files: \.(py|sh|yaml|yml|tf)$
        args:
          - '--license-filepath'
          - 'LICENSE-HEADER.txt'
          - '--comment-style'
          - '#'
```

### Configuration File Organization

For large projects, split configuration by environment:

**.pre-commit-config.yaml** (main config):

```yaml
## Main pre-commit configuration
default_install_hook_types: [pre-commit, commit-msg, pre-push]
default_stages: [commit]

repos:
  # Fast checks run on every commit
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: detect-private-key

  # Language-specific fast checks
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black

  # Expensive checks run on pre-push
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        stages: [pre-push]

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        stages: [pre-push]
```

---

## Language-Specific Hooks

### Python

**Complete Python Hook Configuration**:

```yaml
repos:
  # Formatting
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11
        args: ['--line-length=120', '--target-version=py311']

  # Import sorting
  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args:
          - '--profile=black'
          - '--line-length=120'
          - '--skip-gitignore'

  # Linting
  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        args:
          - '--max-line-length=120'
          - '--extend-ignore=E203,W503'
          - '--max-complexity=10'
        additional_dependencies:
          - flake8-docstrings>=1.7.0
          - flake8-bugbear>=23.12.2
          - flake8-comprehensions>=3.14.0
          - flake8-simplify>=0.21.0
          - flake8-annotations>=3.0.1

  # Type checking
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies:
          - types-requests
          - types-PyYAML
          - types-toml
        args:
          - '--ignore-missing-imports'
          - '--strict'
          - '--no-implicit-optional'
          - '--warn-redundant-casts'

  # Security
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        args:
          - '-ll'  # Only show medium/high severity
          - '-i'   # Show confidence level
          - '-x'   # Exclude test directories
          - 'tests/'

  # Docstring coverage
  - repo: https://github.com/econchick/interrogate
    rev: 1.5.0
    hooks:
      - id: interrogate
        args: ['-vv', '--fail-under=80', '--ignore-init-method']

  # Requirements.txt sorting
  - repo: https://github.com/pre-commit/mirrors-pip-tools
    rev: v7.3.0
    hooks:
      - id: pip-compile
        files: ^requirements\.(in|txt)$
```

**pyproject.toml** configuration:

```toml
[tool.black]
line-length = 120
target-version = ['py311']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.venv
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
line_length = 120
skip_gitignore = true
known_first_party = ["myapp"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
ignore_missing_imports = true

[tool.flake8]
max-line-length = 120
extend-ignore = ["E203", "W503"]
max-complexity = 10
docstring-convention = "google"

[tool.bandit]
exclude_dirs = ["/tests", "/venv"]
skips = ["B101", "B601"]
```

### JavaScript / TypeScript

```yaml
repos:
  # Formatting
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx, json, yaml, markdown, html, css, scss]
        additional_dependencies:
          - prettier@3.1.0
          - '@prettier/plugin-xml@3.2.2'
          - 'prettier-plugin-organize-imports@3.2.4'

  # Linting
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.[jt]sx?$
        types: [file]
        additional_dependencies:
          - eslint@8.56.0
          - eslint-config-airbnb-base@15.0.0
          - eslint-config-airbnb-typescript@17.1.0
          - eslint-plugin-import@2.29.1
          - '@typescript-eslint/parser@6.18.1'
          - '@typescript-eslint/eslint-plugin@6.18.1'
        args: ['--fix', '--max-warnings=0']

  # TypeScript type checking
  - repo: local
    hooks:
      - id: tsc
        name: TypeScript Compiler
        entry: npx tsc --noEmit
        language: system
        files: \.tsx?$
        pass_filenames: false
```

**.prettierrc.json**:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**.eslintrc.json**:

```json
{
  "extends": [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "import/prefer-default-export": "off"
  }
}
```

### Terraform / Terragrunt

```yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      # Format Terraform files
      - id: terraform_fmt

      # Validate Terraform syntax
      - id: terraform_validate
        args:
          - '--hook-config=--retry-once-with-cleanup=true'
          - '--tf-init-args=-backend=false'

      # Generate/update README.md
      - id: terraform_docs
        args:
          - '--hook-config=--path-to-file=README.md'
          - '--hook-config=--add-to-existing-file=true'
          - '--hook-config=--create-file-if-not-exist=true'
          - '--args=--sort-by required'

      # Lint with TFLint
      - id: terraform_tflint
        args:
          - '--args=--config=__GIT_WORKING_DIR__/.tflint.hcl'
          - '--args=--module'
          - '--args=--enable-rule=terraform_deprecated_index'

      # Security scanning with Trivy
      - id: terraform_trivy
        args:
          - '--args=--severity=HIGH,CRITICAL'
          - '--args=--skip-dirs="**/.terraform"'
          - '--args=--format=table'

      # Security scanning with Checkov
      - id: terraform_checkov
        args:
          - '--args=--quiet'
          - '--args=--framework=terraform'
          - '--args=--skip-check=CKV_AWS_*'

      # Cost estimation (optional)
      - id: infracost_breakdown
        args:
          - '--args=--path=.'
        verbose: true
```

**.tflint.hcl**:

```hcl
plugin "aws" {
  enabled = true
  version = "0.29.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "terraform_documented_variables" {
  enabled = true
}

rule "terraform_module_pinned_source" {
  enabled = true
}

rule "terraform_unused_declarations" {
  enabled = true
}
```

### Ansible

```yaml
repos:
  - repo: https://github.com/ansible/ansible-lint
    rev: v6.22.2
    hooks:
      - id: ansible-lint
        files: \.(yaml|yml)$
        args:
          - '-c'
          - '.ansible-lint'
          - '--profile=production'
          - '--exclude=.github/'
```

**.ansible-lint**:

```yaml
## .ansible-lint
profile: production

exclude_paths:
  - .cache/
  - .github/
  - test/
  - molecule/

skip_list:
  - yaml[line-length]
  - name[casing]

warn_list:
  - experimental
  - role-name

## Enable specific rules
enable_list:
  - args
  - empty-string-compare
  - no-log-password
  - no-same-owner
```

### Shell Scripts

```yaml
repos:
  # Linting
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.6
    hooks:
      - id: shellcheck
        args:
          - '--severity=warning'
          - '--shell=bash'
          - '--exclude=SC1091'  # Exclude sourcing errors

  # Formatting
  - repo: https://github.com/scop/pre-commit-shfmt
    rev: v3.7.0-4
    hooks:
      - id: shfmt
        args:
          - '-i'
          - '2'      # Indent with 2 spaces
          - '-ci'    # Switch case indent
          - '-bn'    # Binary ops at line start
          - '-w'     # Write to file
```

### Docker

```yaml
repos:
  # Dockerfile linting
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint
        args:
          - '--ignore'
          - 'DL3008'  # Pin versions in apt-get
          - '--ignore'
          - 'DL3009'  # Delete apt-get lists
          - '--failure-threshold'
          - 'warning'

  # Docker Compose validation
  - repo: https://github.com/IamTheFij/docker-pre-commit
    rev: v3.0.1
    hooks:
      - id: docker-compose-check
        args: ['-f', 'docker-compose.yml']
```

**.hadolint.yaml**:

```yaml
## .hadolint.yaml
ignored:
  - DL3008  # Pin versions in apt-get install
  - DL3009  # Delete apt-get lists after installing

trustedRegistries:
  - docker.io
  - gcr.io
  - ghcr.io

failure-threshold: warning
```

---

## Security Hooks

### Secret Detection

**detect-secrets configuration**:

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args:
          - '--baseline'
          - '.secrets.baseline'
          - '--exclude-files'
          - '\.lock$'
          - '--exclude-files'
          - '\.svg$'
          - '--exclude-files'
          - 'package-lock\.json$'
```

**Initialize baseline**:

```bash
## Generate initial baseline
detect-secrets scan > .secrets.baseline

## Audit findings
detect-secrets audit .secrets.baseline

## Update baseline after adding legitimate secrets
detect-secrets scan --baseline .secrets.baseline
```

**.secrets.baseline** example:

```json
{
  "version": "1.4.0",
  "filters_used": [
    {
      "path": "detect_secrets.filters.allowlist.is_line_allowlisted"
    },
    {
      "path": "detect_secrets.filters.common.is_ignored_due_to_verification_policies",
      "min_level": 2
    }
  ],
  "results": {},
  "generated_at": "2025-12-01T10:00:00Z"
}
```

### TruffleHog Integration

```yaml
repos:
  - repo: https://github.com/trufflesecurity/trufflehog
    rev: v3.63.7
    hooks:
      - id: trufflehog
        name: TruffleHog Secret Scan
        entry: trufflehog
        args:
          - '--no-update'
          - 'filesystem'
          - '.'
          - '--exclude-paths'
          - '.trufflehog-exclude.txt'
          - '--fail'
          - '--json'
```

**.trufflehog-exclude.txt**:

```text
## Exclude common false positives
**/*.lock
**/*.min.js
**/*.svg
**/node_modules/**
**/.git/**
**/dist/**
**/build/**
```

### Gitleaks Alternative

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.1
    hooks:
      - id: gitleaks
        args: ['--verbose', '--config', '.gitleaks.toml']
```

**.gitleaks.toml**:

```toml
[extend]
useDefault = true

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''(?i)api[_-]?key[_-]?=["']?[a-z0-9]{32,}["']?'''
tags = ["api", "key"]

[allowlist]
paths = [
  '''(.*?)(jpg|gif|doc|pdf|bin)$''',
  '''node_modules/''',
]

commits = [
  "commit-hash-to-ignore"
]
```

---

## Custom Hooks

### Local Custom Hooks

Create local hooks for project-specific checks:

```yaml
repos:
  - repo: local
    hooks:
      # Custom Python imports check
      - id: check-python-imports
        name: Check Python Import Order
        entry: python scripts/check_imports.py
        language: system
        files: \.py$
        pass_filenames: true

      # Custom license header check
      - id: check-license-headers
        name: Check License Headers
        entry: bash scripts/check_license.sh
        language: system
        files: \.(py|ts|js|sh)$

      # Custom TODO tracker
      - id: check-todos
        name: Check TODO Format
        entry: python scripts/check_todos.py
        language: system
        files: \.(py|ts|js|md)$

      # Custom metadata validation
      - id: validate-metadata
        name: Validate YAML Frontmatter
        entry: python scripts/validate_metadata.py
        language: system
        files: \.md$
```

**scripts/check_imports.py**:

```python
#!/usr/bin/env python3
"""Check that Python imports follow project conventions."""
import sys
from pathlib import Path

def check_imports(filepath: Path) -> bool:
    """Check import order and style."""
    content = filepath.read_text()
    lines = content.split('\n')

    issues = []

    # Check for relative imports in src/
    if 'src/' in str(filepath):
        for i, line in enumerate(lines, 1):
            if line.strip().startswith('from .'):
                issues.append(f"{filepath}:{i}: Avoid relative imports in src/")

    # Check for wildcard imports
    for i, line in enumerate(lines, 1):
        if 'import *' in line:
            issues.append(f"{filepath}:{i}: Avoid wildcard imports")

    if issues:
        for issue in issues:
            print(issue, file=sys.stderr)
        return False

    return True

if __name__ == '__main__':
    files = [Path(f) for f in sys.argv[1:]]
    all_passed = all(check_imports(f) for f in files)
    sys.exit(0 if all_passed else 1)
```

**scripts/check_license.sh**:

```bash
#!/bin/bash
## Check that all source files have license headers

EXIT_CODE=0

for file in "$@"; do
  if ! head -n 5 "$file" | grep -q "Copyright"; then
    echo "ERROR: Missing license header in $file" >&2
    EXIT_CODE=1
  fi
done

exit $EXIT_CODE
```

**scripts/check_todos.py**:

```python
#!/usr/bin/env python3
"""Validate TODO comment format."""
import re
import sys
from pathlib import Path

## Required format: TODO(username): Description [TICKET-123]
TODO_PATTERN = re.compile(r'TODO\([a-z]+\):\s+.+\s+\[[A-Z]+-\d+\]')

def check_todos(filepath: Path) -> bool:
    """Check TODO comments follow project convention."""
    content = filepath.read_text()
    lines = content.split('\n')

    issues = []

    for i, line in enumerate(lines, 1):
        if 'TODO' in line and not TODO_PATTERN.search(line):
            issues.append(
                f"{filepath}:{i}: TODO must follow format: "
                "TODO(username): Description [TICKET-123]"
            )

    if issues:
        for issue in issues:
            print(issue, file=sys.stderr)
        return False

    return True

if __name__ == '__main__':
    files = [Path(f) for f in sys.argv[1:]]
    all_passed = all(check_todos(f) for f in files)
    sys.exit(0 if all_passed else 1)
```

### Hook with Dependencies

```yaml
repos:
  - repo: local
    hooks:
      - id: pytest-check
        name: Run Fast Tests
        entry: pytest tests/unit -v --maxfail=1
        language: system
        pass_filenames: false
        always_run: true
        stages: [commit]

      - id: integration-tests
        name: Run Integration Tests
        entry: pytest tests/integration -v
        language: system
        pass_filenames: false
        stages: [pre-push]
```

---

## CI/CD Integration

### GitHub Actions

**.github/workflows/pre-commit.yml**:

```yaml
name: Pre-commit Checks

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - uses: pre-commit/action@v3.0.0
        with:
          extra_args: --all-files --show-diff-on-failure

      - name: Upload pre-commit cache
        if: always()
        uses: actions/cache@v3
        with:
          path: ~/.cache/pre-commit
          key: pre-commit-${{ hashFiles('.pre-commit-config.yaml') }}
```

### GitLab CI

**.gitlab-ci.yml**:

```yaml
pre-commit:
  stage: validate
  image: python:3.11-slim
  cache:
    key: pre-commit-cache
    paths:
      - .pre-commit-cache/
  before_script:
    - pip install pre-commit
    - export PRE_COMMIT_HOME=.pre-commit-cache
  script:
    - pre-commit run --all-files --show-diff-on-failure
  only:
    - merge_requests
    - main
    - develop
```

### Jenkins

```groovy
stage('Pre-commit Checks') {
    agent {
        docker {
            image 'python:3.11-slim'
        }
    }
    steps {
        sh '''
            pip install pre-commit
            pre-commit run --all-files --show-diff-on-failure
        '''
    }
}
```

---

## Performance Optimization

### Parallel Execution

Run independent hooks in parallel:

```yaml
repos:
  # These hooks can run in parallel
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        require_serial: false  # Allow parallel execution

  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        require_serial: false
```

### Skip Slow Hooks Locally

Use environment variables to skip expensive checks during development:

```bash
## Skip expensive hooks locally
SKIP=mypy,bandit,terraform_trivy git commit -m "WIP: feature development"

## Skip all hooks (emergency only)
git commit --no-verify -m "hotfix: critical bug"
```

### Staged Hooks

Run different hooks at different stages:

```yaml
repos:
  # Fast checks on every commit
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
        stages: [commit]

  # Moderate checks before commit
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        stages: [commit]

  # Expensive checks on pre-push only
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        stages: [pre-push]

  # Critical checks before manual stage
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        stages: [manual]
```

Enable pre-push hooks:

```bash
pre-commit install --hook-type pre-push
```

### File Filtering

Only run hooks on relevant files:

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        files: '^src/.*\.py$'        # Only run on src/**/*.py
        exclude: '^tests/.*$'        # Exclude tests/

  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint
        files: '^.*Dockerfile.*$'    # Match Dockerfile variants
```

---

## Troubleshooting

### Common Issues

**Hook fails with "command not found"**:

```bash
## Solution 1: Install the tool globally
pip install black flake8 mypy

## Solution 2: Use language_version to specify Python
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11
```

**Hook modifies files, causing re-run**:

```yaml
## This is expected behavior - hooks auto-fix and re-stage
## Just run git commit again after hooks modify files

## If you want to see what changed:
git diff
```

**Hooks take too long**:

```bash
## Run only on changed files (default)
pre-commit run

## Skip specific hooks
SKIP=mypy,bandit git commit -m "message"

## Move expensive hooks to pre-push
## See "Staged Hooks" section above
```

**Hook cache issues**:

```bash
## Clean pre-commit cache
pre-commit clean

## Reinstall all hooks
pre-commit uninstall
pre-commit install

## Clear specific hook cache
rm -rf ~/.cache/pre-commit/repo*
```

**Python version mismatch**:

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11  # Force specific version
```

### Debug Mode

```bash
## Run with verbose output
pre-commit run --verbose --all-files

## Debug specific hook
pre-commit run black --verbose

## Show hook execution environment
pre-commit run --hook-stage manual --all-files -v
```

### Updating Hooks

```bash
## Update all hooks to latest versions
pre-commit autoupdate

## Update specific hooks
pre-commit autoupdate --repo https://github.com/psf/black

## Freeze at current versions (for reproducibility)
pre-commit autoupdate --freeze
```

---

## Best Practices

### Development Workflow

1. **Install hooks immediately**:

   ```bash
   git clone repo && cd repo
   pre-commit install --install-hooks
   ```

2. **Run on all files initially**:

   ```bash
   pre-commit run --all-files
   ```

3. **Commit hook configuration**:

   ```bash
   git add .pre-commit-config.yaml
   git commit -m "chore: add pre-commit hooks"
   ```

4. **Update regularly**:

   ```bash
   pre-commit autoupdate
   ```

### Team Adoption

1. **Document in README.md**:

   ````markdown
   ## Development Setup

   Install pre-commit hooks:

   ```bash
   pre-commit install
   ```
   ````

2. **Add to CI/CD** (see CI/CD Integration section)

3. **Provide escape hatch**:

   ```bash
   # For emergencies only
   git commit --no-verify -m "hotfix"
   ```

4. **Keep hooks fast** - move slow checks to pre-push

### Hook Organization

1. **Fast checks first** - fail fast principle
2. **Group by type** - formatting, linting, security
3. **Clear hook names** - use descriptive IDs
4. **Document custom hooks** - add comments explaining purpose

---

## Resources

- [Pre-commit Official Docs](https://pre-commit.com/)
- [Pre-commit Hooks Repository](https://github.com/pre-commit/pre-commit-hooks)
- [Supported Hooks List](https://pre-commit.com/hooks.html)
- [Creating Custom Hooks](https://pre-commit.com/#creating-new-hooks)

---

**Next Steps:**

- Review the [AI Validation Pipeline](ai_validation_pipeline.md) for comprehensive CI/CD integration
- See [GitHub Actions Guide](github_actions_guide.md) for GitHub-specific CI setup
- Check [GitLab CI Guide](gitlab_ci_guide.md) for GitLab-specific patterns
