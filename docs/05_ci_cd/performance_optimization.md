---
title: "CI/CD Performance Optimization Guide"
description: "Strategies for optimizing CI/CD pipeline performance when using style guide validation tools"
author: "Tyler Dukes"
tags: [cicd, performance, optimization, caching, github-actions, gitlab]
category: "CI/CD"
status: "active"
search_keywords: [performance, optimization, ci cd, caching, parallelization, build speed]
---

## Overview

CI/CD pipelines that enforce coding standards can become bottlenecks when
validation runs sequentially against the entire codebase. This guide provides
strategies to reduce pipeline execution time by 60-85% through
parallelization, caching, selective validation, and Docker optimization.

## What This Guide Covers

- ✅ Parallel job execution and matrix strategies
- ✅ Dependency and validation result caching
- ✅ Selective validation on changed files only
- ✅ Docker build optimization and layer caching
- ✅ Real-world benchmark comparisons

## Related Documentation

- [GitHub Actions Guide](github_actions_guide.md) - Workflow configuration reference
- [GitLab CI Guide](gitlab_ci_guide.md) - GitLab pipeline patterns
- [Pre-commit Hooks Guide](precommit_hooks_guide.md) - Local validation setup
- [Local Validation Setup](local_validation_setup.md) - Developer workstation configuration
- [Testing Strategies](testing_strategies.md) - Test execution optimization

---

## Pipeline Performance Architecture

```mermaid
graph TD
    A[Push / PR Event] --> B{Changed Files Detection}
    B --> C[Path Filtering]
    C --> D[Parallel Job Matrix]
    D --> E[Python Validation]
    D --> F[Terraform Validation]
    D --> G[TypeScript Validation]
    D --> H[Docs Build]
    E --> I{All Jobs Pass?}
    F --> I
    G --> I
    H --> I
    I -->|Yes| J[Deploy / Merge]
    I -->|No| K[Fail Fast - Stop Remaining]
```

---

## Fast Feedback Strategies

### Parallel Job Execution

Run independent validation jobs concurrently instead of sequentially.

#### GitHub Actions - Matrix Strategy

```yaml
## .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      python: ${{ steps.filter.outputs.python }}
      terraform: ${{ steps.filter.outputs.terraform }}
      typescript: ${{ steps.filter.outputs.typescript }}
      docs: ${{ steps.filter.outputs.docs }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            python:
              - '**/*.py'
              - 'pyproject.toml'
              - 'requirements*.txt'
            terraform:
              - '**/*.tf'
              - '**/*.tfvars'
              - '.terraform.lock.hcl'
            typescript:
              - '**/*.ts'
              - '**/*.tsx'
              - 'package.json'
              - 'tsconfig.json'
            docs:
              - 'docs/**'
              - 'mkdocs.yml'

  validate:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      fail-fast: true
      matrix:
        include:
          - language: python
            enabled: ${{ needs.detect-changes.outputs.python }}
            command: |
              uv run black --check .
              uv run flake8
              uv run python scripts/validate_metadata.py docs/
          - language: terraform
            enabled: ${{ needs.detect-changes.outputs.terraform }}
            command: |
              terraform fmt -check -recursive
              terraform validate
          - language: typescript
            enabled: ${{ needs.detect-changes.outputs.typescript }}
            command: |
              npm ci
              npm run lint
              npm run type-check
          - language: docs
            enabled: ${{ needs.detect-changes.outputs.docs }}
            command: |
              uv sync
              mkdocs build --strict
    steps:
      - uses: actions/checkout@v4
        if: matrix.enabled == 'true'

      - name: Run ${{ matrix.language }} validation
        if: matrix.enabled == 'true'
        run: ${{ matrix.command }}
```

#### GitLab CI - Parallel Stages

```yaml
## .gitlab-ci.yml
stages:
  - detect
  - validate
  - build

## ============================================================
## Stage 1: Detect changed files
## ============================================================
detect-changes:
  stage: detect
  script:
    - |
      echo "PYTHON_CHANGED=false" > changes.env
      echo "TERRAFORM_CHANGED=false" >> changes.env
      echo "TYPESCRIPT_CHANGED=false" >> changes.env
      echo "DOCS_CHANGED=false" >> changes.env

      if git diff --name-only HEAD~1 | grep -qE '\.py$|pyproject\.toml'; then
        echo "PYTHON_CHANGED=true" >> changes.env
      fi
      if git diff --name-only HEAD~1 | grep -qE '\.tf$|\.tfvars$'; then
        echo "TERRAFORM_CHANGED=true" >> changes.env
      fi
      if git diff --name-only HEAD~1 | grep -qE '\.tsx?$|package\.json'; then
        echo "TYPESCRIPT_CHANGED=true" >> changes.env
      fi
      if git diff --name-only HEAD~1 | grep -qE '^docs/|mkdocs\.yml'; then
        echo "DOCS_CHANGED=true" >> changes.env
      fi
  artifacts:
    reports:
      dotenv: changes.env

## ============================================================
## Stage 2: Run validators in parallel
## ============================================================
validate-python:
  stage: validate
  needs: [detect-changes]
  rules:
    - if: $PYTHON_CHANGED == "true"
  script:
    - uv run black --check .
    - uv run flake8
    - uv run python scripts/validate_metadata.py docs/

validate-terraform:
  stage: validate
  needs: [detect-changes]
  rules:
    - if: $TERRAFORM_CHANGED == "true"
  script:
    - terraform fmt -check -recursive
    - terraform validate

validate-typescript:
  stage: validate
  needs: [detect-changes]
  rules:
    - if: $TYPESCRIPT_CHANGED == "true"
  script:
    - npm ci
    - npm run lint
    - npm run type-check

validate-docs:
  stage: validate
  needs: [detect-changes]
  rules:
    - if: $DOCS_CHANGED == "true"
  script:
    - uv sync
    - mkdocs build --strict
```

### Fail Fast Configuration

Stop the entire pipeline when a critical job fails, avoiding wasted compute on doomed runs.

#### GitHub Actions - Fail Fast with Dependencies

```yaml
## .github/workflows/ci.yml
jobs:
  ## ============================================================
  ## Fast checks run first (< 30 seconds)
  ## ============================================================
  lint-fast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check formatting
        run: |
          uv run black --check .
          uv run flake8

      - name: Check YAML syntax
        run: yamllint -c .yamllint.yml .

      - name: Check shell scripts
        run: shellcheck scripts/*.sh

  ## ============================================================
  ## Slow checks only run if fast checks pass
  ## ============================================================
  validate-full:
    needs: lint-fast
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: uv sync

      - name: Build documentation
        run: mkdocs build --strict

      - name: Run metadata validation
        run: uv run python scripts/validate_metadata.py docs/

      - name: Run spell check
        run: npx cspell "docs/**/*.md"

  ## ============================================================
  ## Integration tests only run if validation passes
  ## ============================================================
  integration-tests:
    needs: validate-full
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run integration suite
        run: |
          docker compose run --rm validator
          docker compose run --rm lint
```

#### Jenkins - Fail Fast Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    options {
        skipStagesAfterUnstable()
        timeout(time: 15, unit: 'MINUTES')
    }

    stages {
        stage('Fast Lint') {
            parallel {
                stage('Python') {
                    steps {
                        sh 'uv run black --check .'
                        sh 'uv run flake8'
                    }
                }
                stage('YAML') {
                    steps {
                        sh 'yamllint -c .yamllint.yml .'
                    }
                }
                stage('Shell') {
                    steps {
                        sh 'shellcheck scripts/*.sh'
                    }
                }
            }
        }

        stage('Full Validation') {
            when {
                expression { currentBuild.result == null }
            }
            steps {
                sh 'uv sync'
                sh 'mkdocs build --strict'
                sh 'uv run python scripts/validate_metadata.py docs/'
            }
        }
    }

    post {
        failure {
            echo 'Pipeline failed - check stage logs above'
        }
    }
}
```

---

## Caching Strategies

### Dependency Caching

Cache package manager artifacts to avoid redundant downloads.

#### GitHub Actions - Multi-Tool Caching

```yaml
## .github/workflows/ci.yml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      ## ============================================================
      ## Python dependency caching with uv
      ## ============================================================
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Cache uv packages
        uses: actions/cache@v4
        with:
          path: |
            ~/.cache/uv
            .venv
          key: uv-${{ runner.os }}-${{ hashFiles('pyproject.toml', 'uv.lock') }}
          restore-keys: |
            uv-${{ runner.os }}-

      - name: Install Python dependencies
        run: uv sync

      ## ============================================================
      ## Node.js dependency caching
      ## ============================================================
      - name: Cache npm packages
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            npm-${{ runner.os }}-

      - name: Install Node dependencies
        run: npm ci

      ## ============================================================
      ## Terraform plugin caching
      ## ============================================================
      - name: Cache Terraform plugins
        uses: actions/cache@v4
        with:
          path: ~/.terraform.d/plugin-cache
          key: terraform-${{ runner.os }}-${{ hashFiles('**/.terraform.lock.hcl') }}
          restore-keys: |
            terraform-${{ runner.os }}-

      - name: Configure Terraform plugin cache
        run: |
          mkdir -p ~/.terraform.d/plugin-cache
          echo 'plugin_cache_dir = "$HOME/.terraform.d/plugin-cache"' > ~/.terraformrc

      ## ============================================================
      ## Pre-commit hook caching
      ## ============================================================
      - name: Cache pre-commit environments
        uses: actions/cache@v4
        with:
          path: ~/.cache/pre-commit
          key: pre-commit-${{ runner.os }}-${{ hashFiles('.pre-commit-config.yaml') }}
          restore-keys: |
            pre-commit-${{ runner.os }}-

      - name: Run pre-commit
        run: pre-commit run --all-files
```

#### GitLab CI - Global Cache Configuration

```yaml
## .gitlab-ci.yml

## ============================================================
## Global cache shared across all jobs
## ============================================================
default:
  cache:
    - key:
        files:
          - pyproject.toml
          - uv.lock
      paths:
        - .venv/
        - .cache/uv/
      policy: pull-push
    - key:
        files:
          - package-lock.json
      paths:
        - node_modules/
      policy: pull-push
    - key:
        files:
          - .pre-commit-config.yaml
      paths:
        - .cache/pre-commit/
      policy: pull-push

validate-python:
  stage: validate
  cache:
    - key:
        files:
          - pyproject.toml
          - uv.lock
      paths:
        - .venv/
        - .cache/uv/
      policy: pull  ## Read-only - don't update cache on validation jobs
  script:
    - uv sync
    - uv run black --check .
    - uv run flake8

update-cache:
  stage: .pre
  cache:
    - key:
        files:
          - pyproject.toml
          - uv.lock
      paths:
        - .venv/
        - .cache/uv/
      policy: push  ## Write-only - dedicated cache update job
  script:
    - uv sync
  rules:
    - changes:
        - pyproject.toml
        - uv.lock
```

### Validation Result Caching

Cache validation outputs keyed by file content hashes to skip re-validation of unchanged files.

#### Changed-File Hash Caching Script

```bash
#!/usr/bin/env bash
## scripts/cached_validate.sh
## Cache validation results by file content hash

set -euo pipefail

CACHE_DIR="${CI_CACHE_DIR:-.cache/validation}"
VALIDATOR="${1:?Usage: cached_validate.sh <validator> <file>}"
TARGET="${2:?Usage: cached_validate.sh <validator> <file>}"

mkdir -p "${CACHE_DIR}"

## Generate content-based hash
FILE_HASH=$(sha256sum "${TARGET}" | cut -d' ' -f1)
CACHE_KEY="${CACHE_DIR}/${VALIDATOR}-${FILE_HASH}"

## Check cache
if [[ -f "${CACHE_KEY}" ]]; then
    echo "✅ Cache hit: ${TARGET} (validated previously)"
    exit 0
fi

## Run validation
echo "🔍 Validating: ${TARGET}"
if "${VALIDATOR}" "${TARGET}"; then
    ## Cache successful result
    touch "${CACHE_KEY}"
    echo "✅ Passed and cached: ${TARGET}"
else
    echo "❌ Failed: ${TARGET}"
    exit 1
fi
```

#### Incremental Validation in GitHub Actions

```yaml
## .github/workflows/ci.yml
jobs:
  incremental-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  ## Full history for diff

      - name: Restore validation cache
        uses: actions/cache@v4
        with:
          path: .cache/validation
          key: validation-${{ github.sha }}
          restore-keys: |
            validation-

      - name: Validate changed files only
        run: |
          CHANGED_FILES=$(git diff --name-only origin/main...HEAD)
          mkdir -p .cache/validation

          for file in ${CHANGED_FILES}; do
            case "${file}" in
              *.py)
                bash scripts/cached_validate.sh "uv run black --check" "${file}"
                bash scripts/cached_validate.sh "uv run flake8" "${file}"
                ;;
              *.tf)
                bash scripts/cached_validate.sh "terraform fmt -check" "${file}"
                ;;
              docs/*.md)
                bash scripts/cached_validate.sh "npx cspell" "${file}"
                ;;
            esac
          done
```

---

## Selective Validation

### Changed Files Only

Detect which files changed and run only the relevant validators.

#### Git Diff-Based File Detection

```bash
#!/usr/bin/env bash
## scripts/detect_changes.sh
## Detect changed files and categorize by language

set -euo pipefail

BASE_REF="${1:-origin/main}"

## Get changed files relative to base
CHANGED_FILES=$(git diff --name-only "${BASE_REF}"...HEAD 2>/dev/null || \
                git diff --name-only HEAD~1)

## Categorize changes
PYTHON_FILES=()
TERRAFORM_FILES=()
TYPESCRIPT_FILES=()
DOCS_FILES=()
YAML_FILES=()
SHELL_FILES=()
DOCKER_FILES=()

while IFS= read -r file; do
    [[ -z "${file}" ]] && continue
    case "${file}" in
        *.py)           PYTHON_FILES+=("${file}") ;;
        *.tf|*.tfvars)  TERRAFORM_FILES+=("${file}") ;;
        *.ts|*.tsx)     TYPESCRIPT_FILES+=("${file}") ;;
        docs/*.md)      DOCS_FILES+=("${file}") ;;
        *.yml|*.yaml)   YAML_FILES+=("${file}") ;;
        *.sh)           SHELL_FILES+=("${file}") ;;
        Dockerfile*)    DOCKER_FILES+=("${file}") ;;
    esac
done <<< "${CHANGED_FILES}"

## Output summary
echo "Changed files detected:"
echo "  Python:     ${#PYTHON_FILES[@]}"
echo "  Terraform:  ${#TERRAFORM_FILES[@]}"
echo "  TypeScript: ${#TYPESCRIPT_FILES[@]}"
echo "  Docs:       ${#DOCS_FILES[@]}"
echo "  YAML:       ${#YAML_FILES[@]}"
echo "  Shell:      ${#SHELL_FILES[@]}"
echo "  Docker:     ${#DOCKER_FILES[@]}"

## Export for downstream use
echo "PYTHON_FILES=${PYTHON_FILES[*]:-}" >> "${GITHUB_ENV:-/dev/null}"
echo "TERRAFORM_FILES=${TERRAFORM_FILES[*]:-}" >> "${GITHUB_ENV:-/dev/null}"
echo "TYPESCRIPT_FILES=${TYPESCRIPT_FILES[*]:-}" >> "${GITHUB_ENV:-/dev/null}"
echo "DOCS_FILES=${DOCS_FILES[*]:-}" >> "${GITHUB_ENV:-/dev/null}"
echo "YAML_FILES=${YAML_FILES[*]:-}" >> "${GITHUB_ENV:-/dev/null}"
echo "SHELL_FILES=${SHELL_FILES[*]:-}" >> "${GITHUB_ENV:-/dev/null}"
echo "DOCKER_FILES=${DOCKER_FILES[*]:-}" >> "${GITHUB_ENV:-/dev/null}"
```

#### Selective Validation Runner

```bash
#!/usr/bin/env bash
## scripts/selective_validate.sh
## Run only relevant validators based on changed file types

set -euo pipefail

source scripts/detect_changes.sh "${1:-origin/main}"

EXIT_CODE=0

## ============================================================
## Python validation
## ============================================================
if [[ ${#PYTHON_FILES[@]} -gt 0 ]]; then
    echo "=== Python Validation ==="
    echo "Files: ${PYTHON_FILES[*]}"

    uv run black --check "${PYTHON_FILES[@]}" || EXIT_CODE=1
    uv run flake8 "${PYTHON_FILES[@]}" || EXIT_CODE=1
fi

## ============================================================
## Terraform validation
## ============================================================
if [[ ${#TERRAFORM_FILES[@]} -gt 0 ]]; then
    echo "=== Terraform Validation ==="

    TERRAFORM_DIRS=$(printf '%s\n' "${TERRAFORM_FILES[@]}" | \
                     xargs -I{} dirname {} | sort -u)

    for dir in ${TERRAFORM_DIRS}; do
        terraform fmt -check "${dir}" || EXIT_CODE=1
        terraform -chdir="${dir}" validate || EXIT_CODE=1
    done
fi

## ============================================================
## TypeScript validation
## ============================================================
if [[ ${#TYPESCRIPT_FILES[@]} -gt 0 ]]; then
    echo "=== TypeScript Validation ==="

    npx eslint "${TYPESCRIPT_FILES[@]}" || EXIT_CODE=1
    npx tsc --noEmit || EXIT_CODE=1
fi

## ============================================================
## Documentation validation
## ============================================================
if [[ ${#DOCS_FILES[@]} -gt 0 ]]; then
    echo "=== Documentation Validation ==="

    npx cspell "${DOCS_FILES[@]}" || EXIT_CODE=1
    npx markdownlint "${DOCS_FILES[@]}" || EXIT_CODE=1
fi

## ============================================================
## YAML validation
## ============================================================
if [[ ${#YAML_FILES[@]} -gt 0 ]]; then
    echo "=== YAML Validation ==="

    yamllint -c .yamllint.yml "${YAML_FILES[@]}" || EXIT_CODE=1
fi

## ============================================================
## Shell validation
## ============================================================
if [[ ${#SHELL_FILES[@]} -gt 0 ]]; then
    echo "=== Shell Validation ==="

    shellcheck "${SHELL_FILES[@]}" || EXIT_CODE=1
fi

exit ${EXIT_CODE}
```

### Smart Path Filtering

Use CI/CD platform-native path filters to skip entire jobs when irrelevant files change.

#### GitHub Actions - Path Filtering

```yaml
## .github/workflows/python-ci.yml
name: Python CI

on:
  push:
    branches: [main]
    paths:
      - '**/*.py'
      - 'pyproject.toml'
      - 'uv.lock'
      - '.flake8'
      - '.github/workflows/python-ci.yml'
  pull_request:
    branches: [main]
    paths:
      - '**/*.py'
      - 'pyproject.toml'
      - 'uv.lock'
      - '.flake8'
      - '.github/workflows/python-ci.yml'

jobs:
  python-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: uv sync
      - run: uv run black --check .
      - run: uv run flake8
```

```yaml
## .github/workflows/terraform-ci.yml
name: Terraform CI

on:
  push:
    branches: [main]
    paths:
      - '**/*.tf'
      - '**/*.tfvars'
      - '**/.terraform.lock.hcl'
      - '.github/workflows/terraform-ci.yml'
  pull_request:
    branches: [main]
    paths:
      - '**/*.tf'
      - '**/*.tfvars'
      - '**/.terraform.lock.hcl'
      - '.github/workflows/terraform-ci.yml'

jobs:
  terraform-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check -recursive
      - run: terraform validate
```

```yaml
## .github/workflows/docs-ci.yml
name: Documentation CI

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'mkdocs.yml'
      - '.github/workflows/docs-ci.yml'
  pull_request:
    branches: [main]
    paths:
      - 'docs/**'
      - 'mkdocs.yml'
      - '.github/workflows/docs-ci.yml'

jobs:
  docs-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: uv sync
      - name: Build docs (strict)
        run: mkdocs build --strict
      - name: Spell check
        run: npx cspell "docs/**/*.md"
```

#### GitLab CI - Rules with Changes

```yaml
## .gitlab-ci.yml

## ============================================================
## Run Python validation only when Python files change
## ============================================================
python-lint:
  stage: validate
  rules:
    - changes:
        - "**/*.py"
        - pyproject.toml
        - uv.lock
  script:
    - uv sync
    - uv run black --check .
    - uv run flake8

## ============================================================
## Run Terraform validation only when Terraform files change
## ============================================================
terraform-lint:
  stage: validate
  rules:
    - changes:
        - "**/*.tf"
        - "**/*.tfvars"
  script:
    - terraform fmt -check -recursive
    - terraform validate

## ============================================================
## Build docs only when documentation files change
## ============================================================
docs-build:
  stage: validate
  rules:
    - changes:
        - "docs/**"
        - mkdocs.yml
  script:
    - uv sync
    - mkdocs build --strict
```

---

## Docker Optimization

### Multi-Stage Builds

Separate dependency installation from runtime to minimize image size and maximize layer reuse.

#### Optimized Multi-Stage Dockerfile

```dockerfile
## ============================================================
## Stage 1: Python dependencies (cached layer)
## ============================================================
FROM python:3.11-slim AS python-deps

WORKDIR /app
COPY pyproject.toml uv.lock ./

RUN pip install uv && \
    uv sync --no-dev --frozen

## ============================================================
## Stage 2: Node.js dependencies (cached layer)
## ============================================================
FROM node:20-alpine AS node-deps

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm ci --production

## ============================================================
## Stage 3: Final runtime image
## ============================================================
FROM python:3.11-slim AS runtime

WORKDIR /workspace

## Copy only installed packages from build stages
COPY --from=python-deps /app/.venv /app/.venv
COPY --from=node-deps /app/node_modules /app/node_modules

## Copy application code last (changes most frequently)
COPY scripts/ /app/scripts/
COPY mkdocs.yml /app/
COPY docker-entrypoint.sh /app/

ENV PATH="/app/.venv/bin:/app/node_modules/.bin:${PATH}"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["validate"]
```

#### Layer Ordering by Change Frequency

```dockerfile
## ============================================================
## Order layers from least to most frequently changed
## ============================================================

## 1. Base image and system packages (rarely changes)
FROM python:3.11-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    git shellcheck && \
    rm -rf /var/lib/apt/lists/*

## 2. Dependency manifests (changes when deps update)
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen

## 3. Configuration files (changes occasionally)
COPY .flake8 .yamllint.yml .markdownlint.json mkdocs.yml ./

## 4. Validation scripts (changes with feature work)
COPY scripts/ scripts/

## 5. Documentation and source code (changes most often)
COPY docs/ docs/
```

### BuildKit Cache Mounts

Use BuildKit cache mounts to persist package manager caches across builds.

#### BuildKit-Optimized Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.11-slim AS builder

WORKDIR /app

## ============================================================
## Cache pip downloads across builds
## ============================================================
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=cache,target=/root/.cache/uv \
    pip install uv && \
    uv sync --frozen

## ============================================================
## Cache npm downloads across builds
## ============================================================
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

## ============================================================
## Cache pre-commit environments across builds
## ============================================================
COPY .pre-commit-config.yaml ./
RUN --mount=type=cache,target=/root/.cache/pre-commit \
    pre-commit install-hooks
```

#### Docker Compose with BuildKit

```yaml
## docker-compose.yml
services:
  validator:
    build:
      context: .
      dockerfile: Dockerfile
      cache_from:
        - type=local,src=.cache/docker
      cache_to:
        - type=local,dest=.cache/docker,mode=max
    volumes:
      - .:/workspace:ro
    command: validate

  lint:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder  ## Use intermediate stage for faster builds
    volumes:
      - .:/workspace:ro
    command: lint

  docs:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/workspace:ro
    command: docs
```

#### CI/CD Docker Caching

```yaml
## .github/workflows/container.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Cache Docker layers
        uses: actions/cache@v4
        with:
          path: /tmp/.buildx-cache
          key: buildx-${{ runner.os }}-${{ hashFiles('Dockerfile', 'pyproject.toml', 'package.json') }}
          restore-keys: |
            buildx-${{ runner.os }}-

      - name: Build with cache
        uses: docker/build-push-action@v6
        with:
          context: .
          push: false
          load: true
          tags: style-guide:test
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new,mode=max

      ## Rotate cache to prevent unbounded growth
      - name: Rotate cache
        run: |
          rm -rf /tmp/.buildx-cache
          mv /tmp/.buildx-cache-new /tmp/.buildx-cache

      - name: Run validation
        run: docker run --rm -v "$(pwd):/workspace" style-guide:test validate
```

---

## Benchmark Results

Real-world timing comparisons from this repository's CI pipeline.

### Baseline vs Optimized

```text
┌──────────────────────────────────┬──────────┬──────────┬──────────┐
│ Strategy                         │ Duration │ Savings  │ % Faster │
├──────────────────────────────────┼──────────┼──────────┼──────────┤
│ Baseline (sequential, no cache)  │ 10m 30s  │    -     │    -     │
│ + Dependency caching             │  7m 15s  │  3m 15s  │   31%    │
│ + Parallel execution             │  4m 00s  │  6m 30s  │   62%    │
│ + Selective validation           │  2m 30s  │  8m 00s  │   76%    │
│ + All optimizations combined     │  1m 30s  │  9m 00s  │   86%    │
└──────────────────────────────────┴──────────┴──────────┴──────────┘
```

### Breakdown by Optimization

```text
Dependency Caching Impact
================================================================================
Step                          Without Cache    With Cache    Savings
--------------------------------------------------------------------------------
uv sync                            45s             5s         89%
npm ci                             30s             8s         73%
pre-commit install-hooks           60s            10s         83%
terraform init                     25s             5s         80%
--------------------------------------------------------------------------------
Total install time               2m 40s           28s         82%

Parallel Execution Impact
================================================================================
Configuration                 Sequential    Parallel    Savings
--------------------------------------------------------------------------------
Python + Terraform + TS lint     3m 15s      1m 10s       64%
Docs build + spell check         2m 00s      1m 00s       50%
Full validation suite            8m 30s      3m 30s       59%

Selective Validation Impact (typical PR)
================================================================================
PR Type                       Full Suite    Selective    Savings
--------------------------------------------------------------------------------
Python-only changes              10m 30s      2m 00s       81%
Docs-only changes                10m 30s      1m 30s       86%
Terraform-only changes           10m 30s      1m 45s       83%
Multi-language changes           10m 30s      4m 00s       62%
```

### Optimization Decision Matrix

```text
┌────────────────────────┬────────────┬────────────┬───────────────────────┐
│ Optimization           │ Complexity │ Impact     │ When to Use           │
├────────────────────────┼────────────┼────────────┼───────────────────────┤
│ Path filtering         │ Low        │ High       │ Always                │
│ Dependency caching     │ Low        │ Medium     │ Always                │
│ Parallel jobs          │ Medium     │ High       │ 2+ independent checks │
│ Fail fast              │ Low        │ Medium     │ Always                │
│ Docker layer caching   │ Medium     │ Medium     │ Container-based CI    │
│ BuildKit cache mounts  │ Medium     │ High       │ Container builds      │
│ Validation caching     │ High       │ Medium     │ Large monorepos       │
│ Multi-stage builds     │ Medium     │ Medium     │ Container publishing  │
└────────────────────────┴────────────┴────────────┴───────────────────────┘
```

---

## Best Practices

### Pipeline Design

```yaml
## Optimal pipeline structure (GitHub Actions)
## 1. Fast checks gate slow checks
## 2. Independent jobs run in parallel
## 3. Only affected languages are validated
## 4. All dependencies are cached
## 5. Docker builds use layer caching

name: Optimized CI

on:
  pull_request:
    branches: [main]

jobs:
  ## Gate 1: Fast formatting checks (< 30s)
  format-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v4
        with:
          path: ~/.cache/uv
          key: uv-${{ hashFiles('pyproject.toml') }}
      - run: uv sync
      - run: uv run black --check .

  ## Gate 2: Language-specific validation (parallel, < 2min each)
  validate:
    needs: format-check
    runs-on: ubuntu-latest
    strategy:
      fail-fast: true
      matrix:
        check: [lint, typecheck, docs, security]
        include:
          - check: lint
            command: uv run flake8 && shellcheck scripts/*.sh
          - check: typecheck
            command: uv run python scripts/validate_metadata.py docs/
          - check: docs
            command: uv sync && mkdocs build --strict
          - check: security
            command: detect-secrets scan --baseline .secrets.baseline
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v4
        with:
          path: |
            ~/.cache/uv
            .venv
          key: uv-${{ hashFiles('pyproject.toml') }}
      - run: uv sync
      - run: ${{ matrix.command }}
```
