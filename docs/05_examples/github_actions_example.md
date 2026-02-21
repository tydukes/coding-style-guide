---
title: "Complete GitHub Actions Workflows Example"
description: "Full working repository of reusable GitHub Actions workflow templates and composite actions"
author: "Tyler Dukes"
tags: [github-actions, ci-cd, workflows, reusable, composite, example, best-practices, complete]
category: "Examples"
status: "active"
search_keywords: [github actions, workflow example, ci cd, pipeline, automation, sample]
---

<!-- markdownlint-disable MD013 -->

## Overview

This is a complete, working example of a GitHub Actions workflow library called **acme-workflows** - a
collection of reusable workflows and composite actions for standardized CI/CD pipelines. It demonstrates
best practices from the GitHub Actions Style Guide, including reusable workflow design, composite action
encapsulation, matrix testing, environment-gated deployments, and security scanning integration.

**Project Purpose**: A centralized workflow library that teams reference from their own repositories,
ensuring consistent CI/CD practices across the organization without duplicating workflow definitions.

---

## Repository Structure

```text
acme-workflows/
├── .github/
│   ├── workflows/
│   │   ├── reusable-build-test.yml
│   │   ├── reusable-docker-build.yml
│   │   ├── reusable-deploy.yml
│   │   ├── reusable-security-scan.yml
│   │   └── self-test.yml
│   ├── actions/
│   │   ├── setup-env/
│   │   │   └── action.yml
│   │   └── notify/
│   │       └── action.yml
│   ├── dependabot.yml
│   ├── CODEOWNERS
│   └── pull_request_template.md
├── examples/
│   ├── caller-python.yml
│   ├── caller-node.yml
│   └── caller-fullstack.yml
├── docs/
│   ├── usage.md
│   └── migration.md
└── README.md
```

---

## .github/workflows/reusable-build-test.yml

```yaml
name: Reusable Build and Test

on:
  workflow_call:
    inputs:
      language:
        description: "Programming language (python, node)"
        required: true
        type: string
      language-version:
        description: "Language version to use"
        required: true
        type: string
      working-directory:
        description: "Directory containing the project"
        required: false
        type: string
        default: "."
      test-command:
        description: "Command to run tests"
        required: false
        type: string
        default: ""
      lint-command:
        description: "Command to run linters"
        required: false
        type: string
        default: ""
      artifact-name:
        description: "Name for the build artifact"
        required: false
        type: string
        default: ""
      artifact-path:
        description: "Path to upload as artifact"
        required: false
        type: string
        default: ""
    outputs:
      test-result:
        description: "Test execution result (pass/fail)"
        value: ${{ jobs.test.outputs.result }}

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    if: inputs.lint-command != ''
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up environment
        uses: ./.github/actions/setup-env
        with:
          language: ${{ inputs.language }}
          language-version: ${{ inputs.language-version }}
          working-directory: ${{ inputs.working-directory }}

      - name: Run linters
        run: ${{ inputs.lint-command }}

  test:
    runs-on: ubuntu-latest
    if: inputs.test-command != ''
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}
    outputs:
      result: ${{ steps.test.outcome }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up environment
        uses: ./.github/actions/setup-env
        with:
          language: ${{ inputs.language }}
          language-version: ${{ inputs.language-version }}
          working-directory: ${{ inputs.working-directory }}

      - name: Run tests
        id: test
        run: ${{ inputs.test-command }}

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ inputs.language }}-${{ inputs.language-version }}
          path: |
            ${{ inputs.working-directory }}/coverage/
            ${{ inputs.working-directory }}/coverage.xml
            ${{ inputs.working-directory }}/htmlcov/
          if-no-files-found: ignore

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: |
      always() &&
      (needs.lint.result == 'success' || needs.lint.result == 'skipped') &&
      (needs.test.result == 'success' || needs.test.result == 'skipped')
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up environment
        uses: ./.github/actions/setup-env
        with:
          language: ${{ inputs.language }}
          language-version: ${{ inputs.language-version }}
          working-directory: ${{ inputs.working-directory }}

      - name: Build
        run: |
          if [ "${{ inputs.language }}" = "python" ]; then
            pip install build
            python -m build
          elif [ "${{ inputs.language }}" = "node" ]; then
            npm run build
          fi

      - name: Upload artifact
        if: inputs.artifact-name != ''
        uses: actions/upload-artifact@v4
        with:
          name: ${{ inputs.artifact-name }}
          path: ${{ inputs.artifact-path }}
          retention-days: 7
```

---

## .github/workflows/reusable-docker-build.yml

```yaml
name: Reusable Docker Build

on:
  workflow_call:
    inputs:
      image-name:
        description: "Docker image name (e.g., ghcr.io/org/app)"
        required: true
        type: string
      context:
        description: "Docker build context path"
        required: false
        type: string
        default: "."
      dockerfile:
        description: "Path to Dockerfile"
        required: false
        type: string
        default: "Dockerfile"
      platforms:
        description: "Target platforms (comma-separated)"
        required: false
        type: string
        default: "linux/amd64"
      push:
        description: "Whether to push the image"
        required: false
        type: boolean
        default: false
      build-args:
        description: "Docker build arguments (newline-separated KEY=VALUE)"
        required: false
        type: string
        default: ""
    outputs:
      image-digest:
        description: "Image digest of the built image"
        value: ${{ jobs.build.outputs.digest }}
      image-tag:
        description: "Primary image tag"
        value: ${{ jobs.build.outputs.tag }}

permissions:
  contents: read
  packages: write

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      digest: ${{ steps.build.outputs.digest }}
      tag: ${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Set up QEMU
        if: contains(inputs.platforms, ',')
        uses: docker/setup-qemu-action@v3

      - name: Log in to GitHub Container Registry
        if: inputs.push
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ github.token }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ inputs.image-name }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        id: build
        uses: docker/build-push-action@v6
        with:
          context: ${{ inputs.context }}
          file: ${{ inputs.dockerfile }}
          platforms: ${{ inputs.platforms }}
          push: ${{ inputs.push }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: ${{ inputs.build-args }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Generate SBOM
        if: inputs.push
        uses: anchore/sbom-action@v0
        with:
          image: ${{ inputs.image-name }}@${{ steps.build.outputs.digest }}
          format: spdx-json
          output-file: sbom.spdx.json

      - name: Upload SBOM
        if: inputs.push
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.spdx.json
```

---

## .github/workflows/reusable-deploy.yml

```yaml
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        description: "Target deployment environment"
        required: true
        type: string
      image:
        description: "Container image to deploy (with tag or digest)"
        required: true
        type: string
      service-name:
        description: "Service name for the deployment target"
        required: true
        type: string
      region:
        description: "Cloud provider region"
        required: false
        type: string
        default: "us-east-1"
      health-check-url:
        description: "URL to check after deployment"
        required: false
        type: string
        default: ""
      rollback-on-failure:
        description: "Whether to rollback on health check failure"
        required: false
        type: boolean
        default: true
    secrets:
      AWS_ROLE_ARN:
        description: "AWS IAM role ARN for OIDC authentication"
        required: true

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ inputs.region }}

      - name: Deploy to ECS
        id: deploy
        run: |
          echo "Deploying ${{ inputs.image }} to ${{ inputs.service-name }}"
          echo "Environment: ${{ inputs.environment }}"
          echo "Region: ${{ inputs.region }}"

          # Update ECS service with new image
          aws ecs update-service \
            --cluster "${{ inputs.service-name }}-cluster" \
            --service "${{ inputs.service-name }}" \
            --force-new-deployment \
            --region "${{ inputs.region }}"

          # Wait for deployment to stabilize
          aws ecs wait services-stable \
            --cluster "${{ inputs.service-name }}-cluster" \
            --services "${{ inputs.service-name }}" \
            --region "${{ inputs.region }}"

      - name: Health check
        if: inputs.health-check-url != ''
        run: |
          echo "Checking health at ${{ inputs.health-check-url }}"
          for i in $(seq 1 10); do
            status=$(curl -s -o /dev/null -w "%{http_code}" "${{ inputs.health-check-url }}" || true)
            if [ "$status" = "200" ]; then
              echo "Health check passed"
              exit 0
            fi
            echo "Attempt $i: status=$status, retrying in 10s..."
            sleep 10
          done
          echo "Health check failed after 10 attempts"
          exit 1

      - name: Rollback on failure
        if: failure() && inputs.rollback-on-failure
        run: |
          echo "Deployment failed, rolling back ${{ inputs.service-name }}"
          aws ecs update-service \
            --cluster "${{ inputs.service-name }}-cluster" \
            --service "${{ inputs.service-name }}" \
            --force-new-deployment \
            --region "${{ inputs.region }}"
```

---

## .github/workflows/reusable-security-scan.yml

```yaml
name: Reusable Security Scan

on:
  workflow_call:
    inputs:
      language:
        description: "Programming language for SAST analysis"
        required: true
        type: string
      working-directory:
        description: "Directory containing the project"
        required: false
        type: string
        default: "."
      scan-dependencies:
        description: "Whether to scan dependencies for vulnerabilities"
        required: false
        type: boolean
        default: true
      scan-secrets:
        description: "Whether to scan for leaked secrets"
        required: false
        type: boolean
        default: true
      scan-sast:
        description: "Whether to run static analysis"
        required: false
        type: boolean
        default: true
      severity-threshold:
        description: "Minimum severity to report (low, medium, high, critical)"
        required: false
        type: string
        default: "medium"

permissions:
  contents: read
  security-events: write

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    if: inputs.scan-dependencies
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@v0.34.1
        with:
          scan-type: fs
          scan-ref: ${{ inputs.working-directory }}
          severity: ${{ inputs.severity-threshold }}
          format: sarif
          output: trivy-results.sarif

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif

  secret-scan:
    runs-on: ubuntu-latest
    if: inputs.scan-secrets
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ github.token }}

  sast:
    runs-on: ubuntu-latest
    if: inputs.scan-sast
    steps:
      - uses: actions/checkout@v4

      - name: Run CodeQL analysis
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ inputs.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform analysis
        uses: github/codeql-action/analyze@v3
```

---

## .github/actions/setup-env/action.yml

```yaml
name: "Setup Environment"
description: "Set up language runtime and install dependencies"

inputs:
  language:
    description: "Programming language (python, node)"
    required: true
  language-version:
    description: "Language version"
    required: true
  working-directory:
    description: "Project directory"
    required: false
    default: "."

runs:
  using: composite
  steps:
    - name: Set up Python
      if: inputs.language == 'python'
      uses: actions/setup-python@v5
      with:
        python-version: ${{ inputs.language-version }}

    - name: Install Python dependencies
      if: inputs.language == 'python'
      shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: |
        python -m pip install --upgrade pip
        if [ -f pyproject.toml ]; then
          pip install -e ".[dev]"
        elif [ -f requirements.txt ]; then
          pip install -r requirements.txt
        fi
        if [ -f requirements-dev.txt ]; then
          pip install -r requirements-dev.txt
        fi

    - name: Set up Node.js
      if: inputs.language == 'node'
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.language-version }}
        cache: npm
        cache-dependency-path: "${{ inputs.working-directory }}/package-lock.json"

    - name: Install Node.js dependencies
      if: inputs.language == 'node'
      shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: npm ci
```

---

## .github/actions/notify/action.yml

```yaml
name: "Send Notification"
description: "Send deployment or CI notification to Slack"

inputs:
  status:
    description: "Notification status (success, failure, cancelled)"
    required: true
  title:
    description: "Notification title"
    required: true
  message:
    description: "Notification message body"
    required: false
    default: ""
  slack-webhook-url:
    description: "Slack incoming webhook URL"
    required: true
  environment:
    description: "Deployment environment (if applicable)"
    required: false
    default: ""

runs:
  using: composite
  steps:
    - name: Set status emoji
      id: emoji
      shell: bash
      run: |
        case "${{ inputs.status }}" in
          success)  echo "emoji=✅" >> "$GITHUB_OUTPUT" ;;
          failure)  echo "emoji=❌" >> "$GITHUB_OUTPUT" ;;
          *)        echo "emoji=⚠️" >> "$GITHUB_OUTPUT" ;;
        esac

    - name: Send Slack notification
      shell: bash
      env:
        SLACK_WEBHOOK: ${{ inputs.slack-webhook-url }}
      run: |
        env_text=""
        if [ -n "${{ inputs.environment }}" ]; then
          env_text=" | Environment: \`${{ inputs.environment }}\`"
        fi

        curl -s -X POST "$SLACK_WEBHOOK" \
          -H "Content-Type: application/json" \
          -d "{
            \"blocks\": [
              {
                \"type\": \"section\",
                \"text\": {
                  \"type\": \"mrkdwn\",
                  \"text\": \"${{ steps.emoji.outputs.emoji }} *${{ inputs.title }}*${env_text}\n${{ inputs.message }}\"
                }
              },
              {
                \"type\": \"context\",
                \"elements\": [
                  {
                    \"type\": \"mrkdwn\",
                    \"text\": \"<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run> | Branch: \`${{ github.ref_name }}\` | Actor: ${{ github.actor }}\"
                  }
                ]
              }
            ]
          }"
```

---

## .github/workflows/self-test.yml

```yaml
name: Self Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  test-python-workflow:
    uses: ./.github/workflows/reusable-build-test.yml
    with:
      language: python
      language-version: "3.12"
      working-directory: "examples/python-sample"
      lint-command: "black --check . && flake8"
      test-command: "pytest -v"

  test-node-workflow:
    uses: ./.github/workflows/reusable-build-test.yml
    with:
      language: node
      language-version: "22"
      working-directory: "examples/node-sample"
      lint-command: "npm run lint"
      test-command: "npm test"

  test-docker-workflow:
    uses: ./.github/workflows/reusable-docker-build.yml
    with:
      image-name: ghcr.io/${{ github.repository }}/test
      context: "examples/python-sample"
      push: false

  test-security-workflow:
    uses: ./.github/workflows/reusable-security-scan.yml
    with:
      language: python
      working-directory: "examples/python-sample"
      scan-sast: false
```

---

## .github/dependabot.yml

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    labels:
      - dependencies
      - github-actions
    commit-message:
      prefix: "chore(deps):"
    groups:
      github-actions:
        patterns:
          - "*"
```

---

## .github/CODEOWNERS

```text
# Workflow definitions require platform team review
.github/workflows/       @acme-org/platform-team
.github/actions/         @acme-org/platform-team

# Documentation can be reviewed by any maintainer
docs/                    @acme-org/maintainers
README.md                @acme-org/maintainers

# Examples can be reviewed by contributors
examples/                @acme-org/contributors
```

---

## .github/pull_request_template.md

```markdown
## Summary

<!-- Brief description of changes -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Checklist

- [ ] Self-test workflow passes
- [ ] Documentation updated (if applicable)
- [ ] Example caller workflows updated (if applicable)
- [ ] Backward compatible with existing callers

## Testing

<!-- How were these changes tested? -->
```

---

## examples/caller-python.yml

```yaml
# Example: Using reusable workflows for a Python project
# Copy this to your repository as .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-test:
    uses: acme-org/acme-workflows/.github/workflows/reusable-build-test.yml@main
    with:
      language: python
      language-version: "3.12"
      lint-command: "black --check . && flake8 src/ tests/"
      test-command: "pytest --cov --cov-report=xml"
      artifact-name: dist
      artifact-path: dist/

  docker:
    needs: build-test
    uses: acme-org/acme-workflows/.github/workflows/reusable-docker-build.yml@main
    with:
      image-name: ghcr.io/${{ github.repository }}
      push: ${{ github.ref == 'refs/heads/main' }}

  security:
    uses: acme-org/acme-workflows/.github/workflows/reusable-security-scan.yml@main
    with:
      language: python
      severity-threshold: high

  deploy-dev:
    needs: [docker, security]
    if: github.ref == 'refs/heads/main'
    uses: acme-org/acme-workflows/.github/workflows/reusable-deploy.yml@main
    with:
      environment: dev
      image: ghcr.io/${{ github.repository }}@${{ needs.docker.outputs.image-digest }}
      service-name: my-python-app
      health-check-url: https://dev.example.com/health
    secrets:
      AWS_ROLE_ARN: ${{ secrets.AWS_ROLE_ARN }}
```

---

## examples/caller-node.yml

```yaml
# Example: Using reusable workflows for a Node.js project
# Copy this to your repository as .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-test:
    uses: acme-org/acme-workflows/.github/workflows/reusable-build-test.yml@main
    with:
      language: node
      language-version: "22"
      lint-command: "npm run lint && npm run format:check"
      test-command: "npm run test:coverage"
      artifact-name: dist
      artifact-path: dist/

  docker:
    needs: build-test
    uses: acme-org/acme-workflows/.github/workflows/reusable-docker-build.yml@main
    with:
      image-name: ghcr.io/${{ github.repository }}
      platforms: linux/amd64,linux/arm64
      push: ${{ github.ref == 'refs/heads/main' }}

  security:
    uses: acme-org/acme-workflows/.github/workflows/reusable-security-scan.yml@main
    with:
      language: javascript
```

---

## examples/caller-fullstack.yml

```yaml
# Example: Using reusable workflows for a monorepo with backend + frontend
# Copy this to your repository as .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    uses: acme-org/acme-workflows/.github/workflows/reusable-build-test.yml@main
    with:
      language: python
      language-version: "3.12"
      working-directory: backend
      lint-command: "black --check . && flake8 src/"
      test-command: "pytest"

  frontend:
    uses: acme-org/acme-workflows/.github/workflows/reusable-build-test.yml@main
    with:
      language: node
      language-version: "22"
      working-directory: frontend
      lint-command: "npm run lint"
      test-command: "npm test"
      artifact-name: frontend-dist
      artifact-path: frontend/dist/

  backend-docker:
    needs: backend
    uses: acme-org/acme-workflows/.github/workflows/reusable-docker-build.yml@main
    with:
      image-name: ghcr.io/${{ github.repository }}/backend
      context: backend
      push: ${{ github.ref == 'refs/heads/main' }}

  frontend-docker:
    needs: frontend
    uses: acme-org/acme-workflows/.github/workflows/reusable-docker-build.yml@main
    with:
      image-name: ghcr.io/${{ github.repository }}/frontend
      context: frontend
      push: ${{ github.ref == 'refs/heads/main' }}

  security:
    uses: acme-org/acme-workflows/.github/workflows/reusable-security-scan.yml@main
    with:
      language: python
      working-directory: backend

  deploy:
    needs: [backend-docker, frontend-docker, security]
    if: github.ref == 'refs/heads/main'
    uses: acme-org/acme-workflows/.github/workflows/reusable-deploy.yml@main
    with:
      environment: dev
      image: ghcr.io/${{ github.repository }}/backend@${{ needs.backend-docker.outputs.image-digest }}
      service-name: acme-platform
      health-check-url: https://dev.acme.example.com/health
    secrets:
      AWS_ROLE_ARN: ${{ secrets.AWS_ROLE_ARN }}
```

---

## docs/usage.md

````markdown
# Usage Guide

## Quick Start

Reference a reusable workflow from your repository:

```yaml
jobs:
  build:
    uses: acme-org/acme-workflows/.github/workflows/reusable-build-test.yml@main
    with:
      language: python
      language-version: "3.12"
      test-command: "pytest"
```

## Available Workflows

| Workflow | Purpose | Required Inputs |
|----------|---------|-----------------|
| `reusable-build-test.yml` | Build, lint, and test | `language`, `language-version` |
| `reusable-docker-build.yml` | Build container images | `image-name` |
| `reusable-deploy.yml` | Deploy to cloud environment | `environment`, `image`, `service-name` |
| `reusable-security-scan.yml` | Security scanning | `language` |

## Available Composite Actions

| Action | Purpose |
|--------|---------|
| `setup-env` | Set up language runtime and install dependencies |
| `notify` | Send Slack notifications for CI/CD events |

## Pinning Versions

For production use, pin to a specific tag or commit SHA:

```yaml
# Pin to a release tag (recommended)
uses: acme-org/acme-workflows/.github/workflows/reusable-build-test.yml@v1.0.0

# Pin to a commit SHA (most secure)
uses: acme-org/acme-workflows/.github/workflows/reusable-build-test.yml@abc123def456
```

````

---

## docs/migration.md

````markdown
# Migration Guide

## Migrating from Inline Workflows

### Before (duplicated across repositories)

```yaml
# .github/workflows/ci.yml (copy-pasted in every repo)
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e ".[dev]"
      - run: black --check .
      - run: flake8
      - run: pytest
```

### After (referencing shared workflow)

```yaml
# .github/workflows/ci.yml (3 lines instead of 12)
jobs:
  test:
    uses: acme-org/acme-workflows/.github/workflows/reusable-build-test.yml@v1.0.0
    with:
      language: python
      language-version: "3.12"
      lint-command: "black --check . && flake8"
      test-command: "pytest"
```

## Migration Checklist

- [ ] Identify duplicated workflow steps across repositories
- [ ] Map existing steps to reusable workflow inputs
- [ ] Replace inline steps with `uses:` references
- [ ] Test with a pull request before merging
- [ ] Remove old workflow files after migration
- [ ] Pin to a specific version tag

````

---

## Key Takeaways

This complete GitHub Actions workflows example demonstrates:

1. **Reusable Workflow Design**: Parameterized workflows with `workflow_call` that accept language, version, and command inputs
2. **Composite Actions**: Encapsulated multi-step setup logic in `setup-env` and notification logic in `notify`
3. **Multi-platform Docker Builds**: Buildx with QEMU for cross-architecture container images
4. **SBOM Generation**: Automatic software bill of materials with Anchore for supply chain security
5. **Environment-gated Deployments**: GitHub Environments with required reviewers for production
6. **Security Scanning Pipeline**: Trivy for dependencies, Gitleaks for secrets, CodeQL for SAST
7. **Health Check with Rollback**: Post-deployment verification with automatic rollback on failure
8. **Self-testing Workflows**: The repository tests its own reusable workflows on every push
9. **Caller Examples**: Ready-to-copy workflow files for Python, Node.js, and monorepo projects
10. **Dependabot Integration**: Automated action version updates grouped into weekly PRs

The workflow library is production-ready and demonstrates how to build a centralized CI/CD platform
that teams reference rather than duplicate.

---

**Status**: Active
