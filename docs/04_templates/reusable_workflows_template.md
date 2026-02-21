---
title: "Reusable GitHub Actions Workflows"
description: "Library of production-ready reusable GitHub Actions workflows for CI/CD automation"
author: "Tyler Dukes"
tags: [github-actions, reusable-workflows, ci-cd, automation, devops]
category: "Templates"
status: "active"
search_keywords: [reusable workflows, github actions, composite actions, ci cd, template]
---
<!-- markdownlint-disable MD013 MD024 -->

## Overview

This document provides a comprehensive library of reusable GitHub Actions workflows designed for
enterprise-grade CI/CD pipelines. These workflows follow the DRY principle and can be called from
any repository workflow.

---

## Build and Test Workflow

### Reusable Build Workflow

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build Workflow

on:
  workflow_call:
    inputs:
      node-version:
        description: 'Node.js version to use'
        required: false
        type: string
        default: '20'
      python-version:
        description: 'Python version to use'
        required: false
        type: string
        default: '3.11'
      language:
        description: 'Primary language (node, python, go, rust)'
        required: true
        type: string
      working-directory:
        description: 'Working directory for commands'
        required: false
        type: string
        default: '.'
      build-command:
        description: 'Build command to run'
        required: false
        type: string
        default: ''
      artifact-name:
        description: 'Name for build artifacts'
        required: false
        type: string
        default: 'build-output'
      artifact-path:
        description: 'Path to artifacts to upload'
        required: false
        type: string
        default: 'dist/'
      cache-dependency-path:
        description: 'Path to dependency lock file for caching'
        required: false
        type: string
        default: ''
    outputs:
      build-version:
        description: 'Version of the build'
        value: ${{ jobs.build.outputs.version }}
      artifact-name:
        description: 'Name of uploaded artifact'
        value: ${{ jobs.build.outputs.artifact }}
    secrets:
      NPM_TOKEN:
        required: false
      PYPI_TOKEN:
        required: false

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
      artifact: ${{ inputs.artifact-name }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        if: inputs.language == 'node'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'
          cache-dependency-path: ${{ inputs.cache-dependency-path || format('{0}/package-lock.json', inputs.working-directory) }}

      - name: Setup Python
        if: inputs.language == 'python'
        uses: actions/setup-python@v5
        with:
          python-version: ${{ inputs.python-version }}
          cache: 'pip'
          cache-dependency-path: ${{ inputs.cache-dependency-path || format('{0}/requirements*.txt', inputs.working-directory) }}

      - name: Setup Go
        if: inputs.language == 'go'
        uses: actions/setup-go@v5
        with:
          go-version-file: '${{ inputs.working-directory }}/go.mod'
          cache-dependency-path: '${{ inputs.working-directory }}/go.sum'

      - name: Setup Rust
        if: inputs.language == 'rust'
        uses: dtolnay/rust-toolchain@stable

      - name: Cache Rust dependencies
        if: inputs.language == 'rust'
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/bin/
            ~/.cargo/registry/index/
            ~/.cargo/registry/cache/
            ~/.cargo/git/db/
            target/
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
          restore-keys: |
            ${{ runner.os }}-cargo-

      - name: Install Node.js dependencies
        if: inputs.language == 'node'
        working-directory: ${{ inputs.working-directory }}
        run: npm ci
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Install Python dependencies
        if: inputs.language == 'python'
        working-directory: ${{ inputs.working-directory }}
        run: |
          python -m pip install --upgrade pip
          pip install build wheel
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          if [ -f requirements-dev.txt ]; then pip install -r requirements-dev.txt; fi
          if [ -f pyproject.toml ]; then pip install -e ".[dev]"; fi

      - name: Install Go dependencies
        if: inputs.language == 'go'
        working-directory: ${{ inputs.working-directory }}
        run: go mod download

      - name: Get version
        id: version
        working-directory: ${{ inputs.working-directory }}
        run: |
          if [ "${{ inputs.language }}" == "node" ]; then
            VERSION=$(node -p "require('./package.json').version")
          elif [ "${{ inputs.language }}" == "python" ]; then
            VERSION=$(python -c "import tomllib; print(tomllib.load(open('pyproject.toml', 'rb'))['project']['version'])" 2>/dev/null || echo "0.0.0")
          elif [ "${{ inputs.language }}" == "go" ]; then
            VERSION=$(git describe --tags --always 2>/dev/null || echo "0.0.0")
          elif [ "${{ inputs.language }}" == "rust" ]; then
            VERSION=$(cargo metadata --format-version 1 --no-deps | jq -r '.packages[0].version')
          else
            VERSION="0.0.0"
          fi
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Build (Node.js)
        if: inputs.language == 'node' && inputs.build-command == ''
        working-directory: ${{ inputs.working-directory }}
        run: npm run build

      - name: Build (Python)
        if: inputs.language == 'python' && inputs.build-command == ''
        working-directory: ${{ inputs.working-directory }}
        run: python -m build

      - name: Build (Go)
        if: inputs.language == 'go' && inputs.build-command == ''
        working-directory: ${{ inputs.working-directory }}
        run: |
          CGO_ENABLED=0 go build -ldflags="-s -w -X main.version=${{ steps.version.outputs.version }}" -o dist/ ./...

      - name: Build (Rust)
        if: inputs.language == 'rust' && inputs.build-command == ''
        working-directory: ${{ inputs.working-directory }}
        run: cargo build --release

      - name: Build (Custom)
        if: inputs.build-command != ''
        working-directory: ${{ inputs.working-directory }}
        run: ${{ inputs.build-command }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ inputs.artifact-name }}
          path: ${{ inputs.working-directory }}/${{ inputs.artifact-path }}
          retention-days: 7
          if-no-files-found: error
```

### Reusable Test Workflow

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      language:
        description: 'Primary language (node, python, go, rust)'
        required: true
        type: string
      node-version:
        description: 'Node.js version'
        required: false
        type: string
        default: '20'
      python-version:
        description: 'Python version'
        required: false
        type: string
        default: '3.11'
      working-directory:
        description: 'Working directory'
        required: false
        type: string
        default: '.'
      test-command:
        description: 'Custom test command'
        required: false
        type: string
        default: ''
      coverage-threshold:
        description: 'Minimum coverage percentage'
        required: false
        type: number
        default: 80
      upload-coverage:
        description: 'Upload coverage to Codecov'
        required: false
        type: boolean
        default: true
    outputs:
      coverage:
        description: 'Test coverage percentage'
        value: ${{ jobs.test.outputs.coverage }}
      test-result:
        description: 'Test result (success/failure)'
        value: ${{ jobs.test.outputs.result }}
    secrets:
      CODECOV_TOKEN:
        required: false

jobs:
  test:
    runs-on: ubuntu-latest
    outputs:
      coverage: ${{ steps.coverage.outputs.percentage }}
      result: ${{ steps.result.outputs.status }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        if: inputs.language == 'node'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'

      - name: Setup Python
        if: inputs.language == 'python'
        uses: actions/setup-python@v5
        with:
          python-version: ${{ inputs.python-version }}
          cache: 'pip'

      - name: Setup Go
        if: inputs.language == 'go'
        uses: actions/setup-go@v5
        with:
          go-version-file: '${{ inputs.working-directory }}/go.mod'

      - name: Setup Rust
        if: inputs.language == 'rust'
        uses: dtolnay/rust-toolchain@stable
        with:
          components: llvm-tools-preview

      - name: Install dependencies (Node.js)
        if: inputs.language == 'node'
        working-directory: ${{ inputs.working-directory }}
        run: npm ci

      - name: Install dependencies (Python)
        if: inputs.language == 'python'
        working-directory: ${{ inputs.working-directory }}
        run: |
          python -m pip install --upgrade pip
          pip install pytest pytest-cov
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          if [ -f requirements-dev.txt ]; then pip install -r requirements-dev.txt; fi
          if [ -f pyproject.toml ]; then pip install -e ".[dev]"; fi

      - name: Install coverage tools (Rust)
        if: inputs.language == 'rust'
        run: cargo install cargo-llvm-cov

      - name: Run tests (Node.js)
        if: inputs.language == 'node' && inputs.test-command == ''
        working-directory: ${{ inputs.working-directory }}
        run: npm test -- --coverage --coverageReporters=json-summary --coverageReporters=lcov

      - name: Run tests (Python)
        if: inputs.language == 'python' && inputs.test-command == ''
        working-directory: ${{ inputs.working-directory }}
        run: |
          pytest --cov --cov-report=xml --cov-report=json --cov-report=term

      - name: Run tests (Go)
        if: inputs.language == 'go' && inputs.test-command == ''
        working-directory: ${{ inputs.working-directory }}
        run: |
          go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
          go tool cover -func=coverage.out

      - name: Run tests (Rust)
        if: inputs.language == 'rust' && inputs.test-command == ''
        working-directory: ${{ inputs.working-directory }}
        run: cargo llvm-cov --lcov --output-path lcov.info

      - name: Run tests (Custom)
        if: inputs.test-command != ''
        working-directory: ${{ inputs.working-directory }}
        run: ${{ inputs.test-command }}

      - name: Extract coverage
        id: coverage
        working-directory: ${{ inputs.working-directory }}
        run: |
          if [ "${{ inputs.language }}" == "node" ]; then
            COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
          elif [ "${{ inputs.language }}" == "python" ]; then
            COVERAGE=$(jq '.totals.percent_covered' coverage.json 2>/dev/null || echo "0")
          elif [ "${{ inputs.language }}" == "go" ]; then
            COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | tr -d '%')
          elif [ "${{ inputs.language }}" == "rust" ]; then
            COVERAGE=$(cargo llvm-cov report --json | jq '.data[0].totals.lines.percent' 2>/dev/null || echo "0")
          else
            COVERAGE="0"
          fi
          echo "percentage=$COVERAGE" >> $GITHUB_OUTPUT

      - name: Check coverage threshold
        id: result
        run: |
          COVERAGE=${{ steps.coverage.outputs.percentage }}
          THRESHOLD=${{ inputs.coverage-threshold }}
          if (( $(echo "$COVERAGE >= $THRESHOLD" | bc -l) )); then
            echo "status=success" >> $GITHUB_OUTPUT
            echo "Coverage $COVERAGE% meets threshold $THRESHOLD%"
          else
            echo "status=failure" >> $GITHUB_OUTPUT
            echo "::error::Coverage $COVERAGE% is below threshold $THRESHOLD%"
            exit 1
          fi

      - name: Upload coverage to Codecov
        if: inputs.upload-coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false
          verbose: true
```

### Calling Build and Test Workflows

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      language: node
      node-version: '20'
      artifact-name: app-build
      artifact-path: dist/
    secrets: inherit

  test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      language: node
      node-version: '20'
      coverage-threshold: 80
    secrets: inherit

  deploy:
    needs: [build, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: app-build
          path: dist/

      - name: Deploy
        run: ./deploy.sh
```

---

## Docker Build and Push Workflow

### Reusable Docker Workflow

```yaml
# .github/workflows/reusable-docker.yml
name: Reusable Docker Build and Push

on:
  workflow_call:
    inputs:
      image-name:
        description: 'Docker image name'
        required: true
        type: string
      dockerfile:
        description: 'Path to Dockerfile'
        required: false
        type: string
        default: 'Dockerfile'
      context:
        description: 'Docker build context'
        required: false
        type: string
        default: '.'
      platforms:
        description: 'Target platforms (comma-separated)'
        required: false
        type: string
        default: 'linux/amd64,linux/arm64'
      push:
        description: 'Push image to registry'
        required: false
        type: boolean
        default: true
      registry:
        description: 'Container registry'
        required: false
        type: string
        default: 'ghcr.io'
      build-args:
        description: 'Build arguments (multiline KEY=VALUE)'
        required: false
        type: string
        default: ''
      cache-from:
        description: 'Cache source'
        required: false
        type: string
        default: 'type=gha'
      cache-to:
        description: 'Cache destination'
        required: false
        type: string
        default: 'type=gha,mode=max'
      scan-image:
        description: 'Run security scan on image'
        required: false
        type: boolean
        default: true
      sbom:
        description: 'Generate SBOM'
        required: false
        type: boolean
        default: true
    outputs:
      image-digest:
        description: 'Image digest'
        value: ${{ jobs.build.outputs.digest }}
      image-tags:
        description: 'Image tags'
        value: ${{ jobs.build.outputs.tags }}
    secrets:
      REGISTRY_USERNAME:
        required: false
      REGISTRY_PASSWORD:
        required: false

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      security-events: write
    outputs:
      digest: ${{ steps.build-push.outputs.digest }}
      tags: ${{ steps.meta.outputs.tags }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        if: inputs.push && inputs.registry == 'ghcr.io'
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Log in to Docker Hub
        if: inputs.push && inputs.registry == 'docker.io'
        uses: docker/login-action@v3
        with:
          registry: docker.io
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Log in to AWS ECR
        if: inputs.push && contains(inputs.registry, 'amazonaws.com')
        uses: docker/login-action@v3
        with:
          registry: ${{ inputs.registry }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ inputs.registry }}/${{ inputs.image-name }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == format('refs/heads/{0}', 'main') }}

      - name: Build and push
        id: build-push
        uses: docker/build-push-action@v6
        with:
          context: ${{ inputs.context }}
          file: ${{ inputs.dockerfile }}
          platforms: ${{ inputs.platforms }}
          push: ${{ inputs.push }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: ${{ inputs.build-args }}
          cache-from: ${{ inputs.cache-from }}
          cache-to: ${{ inputs.cache-to }}
          sbom: ${{ inputs.sbom }}
          provenance: mode=max

      - name: Run Trivy vulnerability scanner
        if: inputs.scan-image
        uses: aquasecurity/trivy-action@v0.34.1
        with:
          image-ref: ${{ inputs.registry }}/${{ inputs.image-name }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        if: inputs.scan-image
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Generate build summary
        run: |
          echo "## Docker Build Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Image:** \`${{ inputs.registry }}/${{ inputs.image-name }}\`" >> $GITHUB_STEP_SUMMARY
          echo "**Digest:** \`${{ steps.build-push.outputs.digest }}\`" >> $GITHUB_STEP_SUMMARY
          echo "**Platforms:** ${{ inputs.platforms }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Tags" >> $GITHUB_STEP_SUMMARY
          echo "${{ steps.meta.outputs.tags }}" | tr ',' '\n' | sed 's/^/- /' >> $GITHUB_STEP_SUMMARY
```

### Multi-Stage Docker Workflow with Scanning

```yaml
# .github/workflows/reusable-docker-complete.yml
name: Complete Docker CI/CD

on:
  workflow_call:
    inputs:
      image-name:
        required: true
        type: string
      environments:
        description: 'Deployment environments (JSON array)'
        required: false
        type: string
        default: '["staging"]'
    secrets:
      REGISTRY_TOKEN:
        required: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile
          failure-threshold: warning

  build:
    needs: lint
    uses: ./.github/workflows/reusable-docker.yml
    with:
      image-name: ${{ inputs.image-name }}
      push: ${{ github.event_name != 'pull_request' }}
      scan-image: true
    secrets: inherit

  deploy:
    needs: build
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: ${{ fromJson(inputs.environments) }}

    environment:
      name: ${{ matrix.environment }}
      url: https://${{ matrix.environment }}.example.com

    steps:
      - name: Deploy to ${{ matrix.environment }}
        run: |
          echo "Deploying ${{ needs.build.outputs.image-digest }} to ${{ matrix.environment }}"
```

---

## Terraform Workflow

### Reusable Terraform Workflow

```yaml
# .github/workflows/reusable-terraform.yml
name: Reusable Terraform Workflow

on:
  workflow_call:
    inputs:
      working-directory:
        description: 'Terraform working directory'
        required: false
        type: string
        default: '.'
      terraform-version:
        description: 'Terraform version'
        required: false
        type: string
        default: '1.7.0'
      environment:
        description: 'Deployment environment'
        required: true
        type: string
      backend-config:
        description: 'Backend configuration file'
        required: false
        type: string
        default: ''
      var-file:
        description: 'Variable file to use'
        required: false
        type: string
        default: ''
      apply:
        description: 'Apply changes (true/false)'
        required: false
        type: boolean
        default: false
      destroy:
        description: 'Destroy infrastructure'
        required: false
        type: boolean
        default: false
      plan-artifact-name:
        description: 'Name for plan artifact'
        required: false
        type: string
        default: 'tfplan'
    outputs:
      plan-exit-code:
        description: 'Terraform plan exit code'
        value: ${{ jobs.terraform.outputs.plan-exit-code }}
      has-changes:
        description: 'Whether plan has changes'
        value: ${{ jobs.terraform.outputs.has-changes }}
    secrets:
      AWS_ACCESS_KEY_ID:
        required: false
      AWS_SECRET_ACCESS_KEY:
        required: false
      AZURE_CREDENTIALS:
        required: false
      GOOGLE_CREDENTIALS:
        required: false
      TF_API_TOKEN:
        required: false

jobs:
  terraform:
    runs-on: ubuntu-latest
    outputs:
      plan-exit-code: ${{ steps.plan.outputs.exitcode }}
      has-changes: ${{ steps.plan.outputs.has-changes }}

    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}

    environment:
      name: ${{ inputs.environment }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ inputs.terraform-version }}
          cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}

      - name: Configure AWS credentials
        if: secrets.AWS_ACCESS_KEY_ID != ''
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Configure Azure credentials
        if: secrets.AZURE_CREDENTIALS != ''
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Configure GCP credentials
        if: secrets.GOOGLE_CREDENTIALS != ''
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GOOGLE_CREDENTIALS }}

      - name: Terraform Format Check
        id: fmt
        run: terraform fmt -check -recursive
        continue-on-error: true

      - name: Terraform Init
        id: init
        run: |
          if [ -n "${{ inputs.backend-config }}" ]; then
            terraform init -backend-config="${{ inputs.backend-config }}"
          else
            terraform init
          fi

      - name: Terraform Validate
        id: validate
        run: terraform validate -no-color

      - name: Setup TFLint
        uses: terraform-linters/setup-tflint@v4
        with:
          tflint_version: latest

      - name: Run TFLint
        run: |
          tflint --init
          tflint --recursive --format=compact

      - name: Terraform Plan
        id: plan
        run: |
          set +e
          VAR_FILE_ARG=""
          if [ -n "${{ inputs.var-file }}" ]; then
            VAR_FILE_ARG="-var-file=${{ inputs.var-file }}"
          fi

          if [ "${{ inputs.destroy }}" == "true" ]; then
            terraform plan -destroy -detailed-exitcode -no-color -out=tfplan $VAR_FILE_ARG
          else
            terraform plan -detailed-exitcode -no-color -out=tfplan $VAR_FILE_ARG
          fi

          EXIT_CODE=$?
          echo "exitcode=$EXIT_CODE" >> $GITHUB_OUTPUT

          if [ $EXIT_CODE -eq 2 ]; then
            echo "has-changes=true" >> $GITHUB_OUTPUT
          else
            echo "has-changes=false" >> $GITHUB_OUTPUT
          fi

          exit 0

      - name: Upload plan artifact
        if: steps.plan.outputs.has-changes == 'true'
        uses: actions/upload-artifact@v4
        with:
          name: ${{ inputs.plan-artifact-name }}-${{ inputs.environment }}
          path: ${{ inputs.working-directory }}/tfplan
          retention-days: 7

      - name: Terraform Plan Summary
        run: |
          echo "## Terraform Plan Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Environment:** ${{ inputs.environment }}" >> $GITHUB_STEP_SUMMARY
          echo "**Working Directory:** ${{ inputs.working-directory }}" >> $GITHUB_STEP_SUMMARY
          echo "**Has Changes:** ${{ steps.plan.outputs.has-changes }}" >> $GITHUB_STEP_SUMMARY

      - name: Terraform Apply
        if: inputs.apply && steps.plan.outputs.has-changes == 'true'
        run: terraform apply -auto-approve tfplan

      - name: Terraform Output
        if: inputs.apply && steps.plan.outputs.has-changes == 'true'
        run: terraform output -json > outputs.json

      - name: Upload outputs
        if: inputs.apply && steps.plan.outputs.has-changes == 'true'
        uses: actions/upload-artifact@v4
        with:
          name: terraform-outputs-${{ inputs.environment }}
          path: ${{ inputs.working-directory }}/outputs.json
          retention-days: 30
```

### Terraform Multi-Environment Workflow

```yaml
# .github/workflows/terraform-multi-env.yml
name: Terraform Multi-Environment

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
  pull_request:
    branches: [main]
    paths:
      - 'terraform/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - dev
          - staging
          - production
      action:
        description: 'Action to perform'
        required: true
        type: choice
        options:
          - plan
          - apply
          - destroy

jobs:
  plan-dev:
    if: github.event_name == 'pull_request' || (github.event_name == 'workflow_dispatch' && inputs.environment == 'dev')
    uses: ./.github/workflows/reusable-terraform.yml
    with:
      working-directory: terraform/environments/dev
      environment: development
      var-file: dev.tfvars
      apply: false
    secrets: inherit

  plan-staging:
    if: github.event_name == 'pull_request' || (github.event_name == 'workflow_dispatch' && inputs.environment == 'staging')
    uses: ./.github/workflows/reusable-terraform.yml
    with:
      working-directory: terraform/environments/staging
      environment: staging
      var-file: staging.tfvars
      apply: false
    secrets: inherit

  apply-dev:
    if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && inputs.action == 'apply' && inputs.environment == 'dev')
    uses: ./.github/workflows/reusable-terraform.yml
    with:
      working-directory: terraform/environments/dev
      environment: development
      var-file: dev.tfvars
      apply: true
    secrets: inherit

  apply-staging:
    needs: apply-dev
    if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && inputs.action == 'apply' && inputs.environment == 'staging')
    uses: ./.github/workflows/reusable-terraform.yml
    with:
      working-directory: terraform/environments/staging
      environment: staging
      var-file: staging.tfvars
      apply: true
    secrets: inherit

  apply-production:
    needs: apply-staging
    if: github.event_name == 'workflow_dispatch' && inputs.action == 'apply' && inputs.environment == 'production'
    uses: ./.github/workflows/reusable-terraform.yml
    with:
      working-directory: terraform/environments/production
      environment: production
      var-file: production.tfvars
      apply: true
    secrets: inherit
```

---

## Security Scanning Workflow

### Comprehensive Security Scanning

```yaml
# .github/workflows/reusable-security.yml
name: Reusable Security Scanning

on:
  workflow_call:
    inputs:
      languages:
        description: 'Languages to scan (JSON array)'
        required: false
        type: string
        default: '["python", "javascript"]'
      scan-dependencies:
        description: 'Scan dependencies for vulnerabilities'
        required: false
        type: boolean
        default: true
      scan-secrets:
        description: 'Scan for secrets'
        required: false
        type: boolean
        default: true
      scan-sast:
        description: 'Run SAST scanning'
        required: false
        type: boolean
        default: true
      scan-containers:
        description: 'Scan container images'
        required: false
        type: boolean
        default: false
      container-image:
        description: 'Container image to scan'
        required: false
        type: string
        default: ''
      fail-on-severity:
        description: 'Fail on vulnerability severity (CRITICAL, HIGH, MEDIUM, LOW)'
        required: false
        type: string
        default: 'CRITICAL,HIGH'
    outputs:
      vulnerabilities-found:
        description: 'Whether vulnerabilities were found'
        value: ${{ jobs.summary.outputs.vulnerabilities }}
      secrets-found:
        description: 'Whether secrets were found'
        value: ${{ jobs.summary.outputs.secrets }}

jobs:
  codeql:
    if: inputs.scan-sast
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read

    strategy:
      fail-fast: false
      matrix:
        language: ${{ fromJson(inputs.languages) }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-extended,security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"

  dependency-review:
    if: github.event_name == 'pull_request' && inputs.scan-dependencies
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: ${{ inputs.fail-on-severity }}
          deny-licenses: GPL-3.0, AGPL-3.0

  secret-scanning:
    if: inputs.scan-secrets
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@v3.93.4
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified

      - name: Gitleaks Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

  semgrep:
    if: inputs.scan-sast
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/default
            p/owasp-top-ten
            p/security-audit
          generateSarif: true

      - name: Upload Semgrep results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep.sarif

  container-scan:
    if: inputs.scan-containers && inputs.container-image != ''
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@v0.34.1
        with:
          image-ref: ${{ inputs.container-image }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: ${{ inputs.fail-on-severity }}

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Grype scanner
        uses: anchore/scan-action@v4
        with:
          image: ${{ inputs.container-image }}
          fail-build: true
          severity-cutoff: high

  sbom:
    if: inputs.scan-dependencies
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          format: spdx-json
          output-file: sbom.spdx.json

      - name: Upload SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.spdx.json
          retention-days: 30

  summary:
    needs: [codeql, dependency-review, secret-scanning, semgrep, container-scan, sbom]
    if: always()
    runs-on: ubuntu-latest
    outputs:
      vulnerabilities: ${{ steps.check.outputs.vulnerabilities }}
      secrets: ${{ steps.check.outputs.secrets }}

    steps:
      - name: Check results
        id: check
        run: |
          echo "vulnerabilities=${{ contains(needs.*.result, 'failure') }}" >> $GITHUB_OUTPUT
          echo "secrets=${{ needs.secret-scanning.result == 'failure' }}" >> $GITHUB_OUTPUT

      - name: Generate security summary
        run: |
          echo "## Security Scan Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Scan | Status |" >> $GITHUB_STEP_SUMMARY
          echo "|------|--------|" >> $GITHUB_STEP_SUMMARY
          echo "| CodeQL | ${{ needs.codeql.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Dependency Review | ${{ needs.dependency-review.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Secret Scanning | ${{ needs.secret-scanning.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Semgrep | ${{ needs.semgrep.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Container Scan | ${{ needs.container-scan.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| SBOM Generation | ${{ needs.sbom.result }} |" >> $GITHUB_STEP_SUMMARY
```

---

## Cloud Deployment Workflows

### AWS Deployment Workflow

```yaml
# .github/workflows/reusable-deploy-aws.yml
name: Reusable AWS Deployment

on:
  workflow_call:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: string
      aws-region:
        description: 'AWS region'
        required: false
        type: string
        default: 'us-east-1'
      deployment-type:
        description: 'Deployment type (ecs, lambda, s3, eks)'
        required: true
        type: string
      service-name:
        description: 'Service/function name'
        required: true
        type: string
      cluster-name:
        description: 'ECS/EKS cluster name'
        required: false
        type: string
        default: ''
      image-uri:
        description: 'Container image URI'
        required: false
        type: string
        default: ''
      s3-bucket:
        description: 'S3 bucket for deployment'
        required: false
        type: string
        default: ''
      artifact-path:
        description: 'Path to deployment artifacts'
        required: false
        type: string
        default: 'dist/'
      health-check-url:
        description: 'URL for health check'
        required: false
        type: string
        default: ''
      rollback-on-failure:
        description: 'Rollback on deployment failure'
        required: false
        type: boolean
        default: true
    outputs:
      deployment-id:
        description: 'Deployment identifier'
        value: ${{ jobs.deploy.outputs.deployment-id }}
      deployment-url:
        description: 'Deployment URL'
        value: ${{ jobs.deploy.outputs.url }}
    secrets:
      AWS_ACCESS_KEY_ID:
        required: true
      AWS_SECRET_ACCESS_KEY:
        required: true
      AWS_ROLE_ARN:
        required: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    outputs:
      deployment-id: ${{ steps.deploy.outputs.id }}
      url: ${{ steps.deploy.outputs.url }}

    environment:
      name: ${{ inputs.environment }}
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ inputs.aws-region }}
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}

      - name: Download build artifacts
        if: inputs.deployment-type == 's3' || inputs.deployment-type == 'lambda'
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: ${{ inputs.artifact-path }}

      - name: Deploy to ECS
        id: deploy-ecs
        if: inputs.deployment-type == 'ecs'
        run: |
          aws ecs update-service \
            --cluster ${{ inputs.cluster-name }} \
            --service ${{ inputs.service-name }} \
            --force-new-deployment

          aws ecs wait services-stable \
            --cluster ${{ inputs.cluster-name }} \
            --services ${{ inputs.service-name }}

          SERVICE_URL=$(aws ecs describe-services \
            --cluster ${{ inputs.cluster-name }} \
            --services ${{ inputs.service-name }} \
            --query 'services[0].loadBalancers[0].targetGroupArn' \
            --output text)

          echo "id=${{ github.run_id }}" >> $GITHUB_OUTPUT
          echo "url=https://${{ inputs.service-name }}.${{ inputs.environment }}.example.com" >> $GITHUB_OUTPUT

      - name: Deploy to Lambda
        id: deploy-lambda
        if: inputs.deployment-type == 'lambda'
        run: |
          cd ${{ inputs.artifact-path }}
          zip -r function.zip .

          aws lambda update-function-code \
            --function-name ${{ inputs.service-name }} \
            --zip-file fileb://function.zip

          aws lambda wait function-updated \
            --function-name ${{ inputs.service-name }}

          FUNCTION_URL=$(aws lambda get-function-url-config \
            --function-name ${{ inputs.service-name }} \
            --query 'FunctionUrl' \
            --output text 2>/dev/null || echo "")

          echo "id=${{ github.run_id }}" >> $GITHUB_OUTPUT
          echo "url=$FUNCTION_URL" >> $GITHUB_OUTPUT

      - name: Deploy to S3
        id: deploy-s3
        if: inputs.deployment-type == 's3'
        run: |
          aws s3 sync ${{ inputs.artifact-path }} s3://${{ inputs.s3-bucket }}/ \
            --delete \
            --cache-control "max-age=31536000"

          aws s3 cp ${{ inputs.artifact-path }}/index.html s3://${{ inputs.s3-bucket }}/index.html \
            --cache-control "no-cache, no-store, must-revalidate"

          if [ -n "${{ inputs.health-check-url }}" ]; then
            aws cloudfront create-invalidation \
              --distribution-id $(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='${{ inputs.s3-bucket }}.s3.amazonaws.com'].Id" --output text) \
              --paths "/*"
          fi

          echo "id=${{ github.run_id }}" >> $GITHUB_OUTPUT
          echo "url=https://${{ inputs.s3-bucket }}.s3-website-${{ inputs.aws-region }}.amazonaws.com" >> $GITHUB_OUTPUT

      - name: Deploy to EKS
        id: deploy-eks
        if: inputs.deployment-type == 'eks'
        run: |
          aws eks update-kubeconfig --name ${{ inputs.cluster-name }} --region ${{ inputs.aws-region }}

          kubectl set image deployment/${{ inputs.service-name }} \
            ${{ inputs.service-name }}=${{ inputs.image-uri }} \
            --record

          kubectl rollout status deployment/${{ inputs.service-name }} --timeout=5m

          SERVICE_URL=$(kubectl get svc ${{ inputs.service-name }} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

          echo "id=${{ github.run_id }}" >> $GITHUB_OUTPUT
          echo "url=https://$SERVICE_URL" >> $GITHUB_OUTPUT

      - name: Set deployment output
        id: deploy
        run: |
          if [ "${{ inputs.deployment-type }}" == "ecs" ]; then
            echo "id=${{ steps.deploy-ecs.outputs.id }}" >> $GITHUB_OUTPUT
            echo "url=${{ steps.deploy-ecs.outputs.url }}" >> $GITHUB_OUTPUT
          elif [ "${{ inputs.deployment-type }}" == "lambda" ]; then
            echo "id=${{ steps.deploy-lambda.outputs.id }}" >> $GITHUB_OUTPUT
            echo "url=${{ steps.deploy-lambda.outputs.url }}" >> $GITHUB_OUTPUT
          elif [ "${{ inputs.deployment-type }}" == "s3" ]; then
            echo "id=${{ steps.deploy-s3.outputs.id }}" >> $GITHUB_OUTPUT
            echo "url=${{ steps.deploy-s3.outputs.url }}" >> $GITHUB_OUTPUT
          elif [ "${{ inputs.deployment-type }}" == "eks" ]; then
            echo "id=${{ steps.deploy-eks.outputs.id }}" >> $GITHUB_OUTPUT
            echo "url=${{ steps.deploy-eks.outputs.url }}" >> $GITHUB_OUTPUT
          fi

      - name: Health check
        if: inputs.health-check-url != ''
        run: |
          for i in {1..30}; do
            if curl -sf "${{ inputs.health-check-url }}" > /dev/null; then
              echo "Health check passed"
              exit 0
            fi
            echo "Attempt $i: Health check failed, retrying..."
            sleep 10
          done
          echo "Health check failed after 30 attempts"
          exit 1

      - name: Rollback on failure
        if: failure() && inputs.rollback-on-failure && inputs.deployment-type == 'eks'
        run: |
          kubectl rollout undo deployment/${{ inputs.service-name }}
          kubectl rollout status deployment/${{ inputs.service-name }} --timeout=5m
```

### Azure Deployment Workflow

```yaml
# .github/workflows/reusable-deploy-azure.yml
name: Reusable Azure Deployment

on:
  workflow_call:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: string
      resource-group:
        description: 'Azure resource group'
        required: true
        type: string
      deployment-type:
        description: 'Deployment type (webapp, function, aks, storage)'
        required: true
        type: string
      app-name:
        description: 'App/Function name'
        required: true
        type: string
      cluster-name:
        description: 'AKS cluster name'
        required: false
        type: string
        default: ''
      image-uri:
        description: 'Container image URI'
        required: false
        type: string
        default: ''
      artifact-path:
        description: 'Path to deployment artifacts'
        required: false
        type: string
        default: 'dist/'
      storage-account:
        description: 'Storage account name'
        required: false
        type: string
        default: ''
    outputs:
      deployment-url:
        description: 'Deployment URL'
        value: ${{ jobs.deploy.outputs.url }}
    secrets:
      AZURE_CREDENTIALS:
        required: true
      AZURE_SUBSCRIPTION_ID:
        required: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.deploy.outputs.url }}

    environment:
      name: ${{ inputs.environment }}
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Download build artifacts
        if: inputs.deployment-type == 'webapp' || inputs.deployment-type == 'function' || inputs.deployment-type == 'storage'
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: ${{ inputs.artifact-path }}

      - name: Deploy to Web App
        id: deploy-webapp
        if: inputs.deployment-type == 'webapp'
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ inputs.app-name }}
          package: ${{ inputs.artifact-path }}

      - name: Deploy to Azure Functions
        id: deploy-function
        if: inputs.deployment-type == 'function'
        uses: azure/functions-action@v1
        with:
          app-name: ${{ inputs.app-name }}
          package: ${{ inputs.artifact-path }}

      - name: Deploy to AKS
        id: deploy-aks
        if: inputs.deployment-type == 'aks'
        run: |
          az aks get-credentials --resource-group ${{ inputs.resource-group }} --name ${{ inputs.cluster-name }}

          kubectl set image deployment/${{ inputs.app-name }} \
            ${{ inputs.app-name }}=${{ inputs.image-uri }}

          kubectl rollout status deployment/${{ inputs.app-name }} --timeout=5m

      - name: Deploy to Azure Storage (Static Website)
        id: deploy-storage
        if: inputs.deployment-type == 'storage'
        run: |
          az storage blob upload-batch \
            --account-name ${{ inputs.storage-account }} \
            --destination '$web' \
            --source ${{ inputs.artifact-path }} \
            --overwrite

      - name: Set deployment output
        id: deploy
        run: |
          if [ "${{ inputs.deployment-type }}" == "webapp" ]; then
            URL="https://${{ inputs.app-name }}.azurewebsites.net"
          elif [ "${{ inputs.deployment-type }}" == "function" ]; then
            URL="https://${{ inputs.app-name }}.azurewebsites.net"
          elif [ "${{ inputs.deployment-type }}" == "aks" ]; then
            URL=$(kubectl get svc ${{ inputs.app-name }} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
            URL="http://$URL"
          elif [ "${{ inputs.deployment-type }}" == "storage" ]; then
            URL=$(az storage account show --name ${{ inputs.storage-account }} --query "primaryEndpoints.web" --output tsv)
          fi
          echo "url=$URL" >> $GITHUB_OUTPUT
```

### GCP Deployment Workflow

```yaml
# .github/workflows/reusable-deploy-gcp.yml
name: Reusable GCP Deployment

on:
  workflow_call:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: string
      project-id:
        description: 'GCP project ID'
        required: true
        type: string
      region:
        description: 'GCP region'
        required: false
        type: string
        default: 'us-central1'
      deployment-type:
        description: 'Deployment type (cloudrun, appengine, gke, cloudfunctions, storage)'
        required: true
        type: string
      service-name:
        description: 'Service/function name'
        required: true
        type: string
      image-uri:
        description: 'Container image URI'
        required: false
        type: string
        default: ''
      cluster-name:
        description: 'GKE cluster name'
        required: false
        type: string
        default: ''
      bucket-name:
        description: 'GCS bucket for deployment'
        required: false
        type: string
        default: ''
      artifact-path:
        description: 'Path to deployment artifacts'
        required: false
        type: string
        default: 'dist/'
      min-instances:
        description: 'Minimum instances'
        required: false
        type: number
        default: 0
      max-instances:
        description: 'Maximum instances'
        required: false
        type: number
        default: 100
    outputs:
      deployment-url:
        description: 'Deployment URL'
        value: ${{ jobs.deploy.outputs.url }}
    secrets:
      GCP_CREDENTIALS:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.deploy.outputs.url }}

    environment:
      name: ${{ inputs.environment }}
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_CREDENTIALS }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ inputs.project-id }}

      - name: Download build artifacts
        if: inputs.deployment-type == 'appengine' || inputs.deployment-type == 'cloudfunctions' || inputs.deployment-type == 'storage'
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: ${{ inputs.artifact-path }}

      - name: Deploy to Cloud Run
        id: deploy-cloudrun
        if: inputs.deployment-type == 'cloudrun'
        run: |
          gcloud run deploy ${{ inputs.service-name }} \
            --image ${{ inputs.image-uri }} \
            --region ${{ inputs.region }} \
            --platform managed \
            --allow-unauthenticated \
            --min-instances ${{ inputs.min-instances }} \
            --max-instances ${{ inputs.max-instances }}

          URL=$(gcloud run services describe ${{ inputs.service-name }} \
            --region ${{ inputs.region }} \
            --format 'value(status.url)')
          echo "url=$URL" >> $GITHUB_OUTPUT

      - name: Deploy to App Engine
        id: deploy-appengine
        if: inputs.deployment-type == 'appengine'
        working-directory: ${{ inputs.artifact-path }}
        run: |
          gcloud app deploy --quiet --promote

          URL="https://${{ inputs.project-id }}.appspot.com"
          echo "url=$URL" >> $GITHUB_OUTPUT

      - name: Deploy to GKE
        id: deploy-gke
        if: inputs.deployment-type == 'gke'
        run: |
          gcloud container clusters get-credentials ${{ inputs.cluster-name }} \
            --region ${{ inputs.region }} \
            --project ${{ inputs.project-id }}

          kubectl set image deployment/${{ inputs.service-name }} \
            ${{ inputs.service-name }}=${{ inputs.image-uri }}

          kubectl rollout status deployment/${{ inputs.service-name }} --timeout=5m

          SERVICE_IP=$(kubectl get svc ${{ inputs.service-name }} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
          echo "url=http://$SERVICE_IP" >> $GITHUB_OUTPUT

      - name: Deploy Cloud Function
        id: deploy-function
        if: inputs.deployment-type == 'cloudfunctions'
        working-directory: ${{ inputs.artifact-path }}
        run: |
          gcloud functions deploy ${{ inputs.service-name }} \
            --gen2 \
            --runtime nodejs20 \
            --region ${{ inputs.region }} \
            --trigger-http \
            --allow-unauthenticated \
            --min-instances ${{ inputs.min-instances }} \
            --max-instances ${{ inputs.max-instances }}

          URL=$(gcloud functions describe ${{ inputs.service-name }} \
            --region ${{ inputs.region }} \
            --gen2 \
            --format 'value(serviceConfig.uri)')
          echo "url=$URL" >> $GITHUB_OUTPUT

      - name: Deploy to Cloud Storage
        id: deploy-storage
        if: inputs.deployment-type == 'storage'
        run: |
          gsutil -m rsync -r -d ${{ inputs.artifact-path }} gs://${{ inputs.bucket-name }}

          gsutil web set -m index.html -e 404.html gs://${{ inputs.bucket-name }}

          echo "url=https://storage.googleapis.com/${{ inputs.bucket-name }}/index.html" >> $GITHUB_OUTPUT

      - name: Set deployment output
        id: deploy
        run: |
          if [ "${{ inputs.deployment-type }}" == "cloudrun" ]; then
            echo "url=${{ steps.deploy-cloudrun.outputs.url }}" >> $GITHUB_OUTPUT
          elif [ "${{ inputs.deployment-type }}" == "appengine" ]; then
            echo "url=${{ steps.deploy-appengine.outputs.url }}" >> $GITHUB_OUTPUT
          elif [ "${{ inputs.deployment-type }}" == "gke" ]; then
            echo "url=${{ steps.deploy-gke.outputs.url }}" >> $GITHUB_OUTPUT
          elif [ "${{ inputs.deployment-type }}" == "cloudfunctions" ]; then
            echo "url=${{ steps.deploy-function.outputs.url }}" >> $GITHUB_OUTPUT
          elif [ "${{ inputs.deployment-type }}" == "storage" ]; then
            echo "url=${{ steps.deploy-storage.outputs.url }}" >> $GITHUB_OUTPUT
          fi
```

---

## Notification Workflow

### Reusable Notification Workflow

```yaml
# .github/workflows/reusable-notify.yml
name: Reusable Notification Workflow

on:
  workflow_call:
    inputs:
      status:
        description: 'Deployment/build status'
        required: true
        type: string
      environment:
        description: 'Environment name'
        required: false
        type: string
        default: ''
      deployment-url:
        description: 'Deployment URL'
        required: false
        type: string
        default: ''
      message:
        description: 'Custom message'
        required: false
        type: string
        default: ''
      notify-slack:
        description: 'Send Slack notification'
        required: false
        type: boolean
        default: true
      notify-teams:
        description: 'Send Teams notification'
        required: false
        type: boolean
        default: false
      notify-discord:
        description: 'Send Discord notification'
        required: false
        type: boolean
        default: false
    secrets:
      SLACK_WEBHOOK_URL:
        required: false
      TEAMS_WEBHOOK_URL:
        required: false
      DISCORD_WEBHOOK_URL:
        required: false

jobs:
  notify:
    runs-on: ubuntu-latest

    steps:
      - name: Set status emoji
        id: emoji
        run: |
          if [ "${{ inputs.status }}" == "success" ]; then
            echo "emoji=:white_check_mark:" >> $GITHUB_OUTPUT
            echo "color=good" >> $GITHUB_OUTPUT
            echo "teams_color=00FF00" >> $GITHUB_OUTPUT
          elif [ "${{ inputs.status }}" == "failure" ]; then
            echo "emoji=:x:" >> $GITHUB_OUTPUT
            echo "color=danger" >> $GITHUB_OUTPUT
            echo "teams_color=FF0000" >> $GITHUB_OUTPUT
          else
            echo "emoji=:warning:" >> $GITHUB_OUTPUT
            echo "color=warning" >> $GITHUB_OUTPUT
            echo "teams_color=FFFF00" >> $GITHUB_OUTPUT
          fi

      - name: Send Slack notification
        if: inputs.notify-slack && secrets.SLACK_WEBHOOK_URL != ''
        uses: slackapi/slack-github-action@v1.26.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "attachments": [
                {
                  "color": "${{ steps.emoji.outputs.color }}",
                  "blocks": [
                    {
                      "type": "header",
                      "text": {
                        "type": "plain_text",
                        "text": "${{ steps.emoji.outputs.emoji }} ${{ github.repository }} - ${{ inputs.status }}"
                      }
                    },
                    {
                      "type": "section",
                      "fields": [
                        {
                          "type": "mrkdwn",
                          "text": "*Workflow:*\n${{ github.workflow }}"
                        },
                        {
                          "type": "mrkdwn",
                          "text": "*Branch:*\n${{ github.ref_name }}"
                        },
                        {
                          "type": "mrkdwn",
                          "text": "*Environment:*\n${{ inputs.environment || 'N/A' }}"
                        },
                        {
                          "type": "mrkdwn",
                          "text": "*Triggered by:*\n${{ github.actor }}"
                        }
                      ]
                    },
                    {
                      "type": "section",
                      "text": {
                        "type": "mrkdwn",
                        "text": "${{ inputs.message || format('Commit: {0}', github.event.head_commit.message) }}"
                      }
                    },
                    {
                      "type": "actions",
                      "elements": [
                        {
                          "type": "button",
                          "text": {
                            "type": "plain_text",
                            "text": "View Run"
                          },
                          "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                        },
                        {
                          "type": "button",
                          "text": {
                            "type": "plain_text",
                            "text": "View Deployment"
                          },
                          "url": "${{ inputs.deployment-url }}"
                        }
                      ]
                    }
                  ]
                }
              ]
            }

      - name: Send Teams notification
        if: inputs.notify-teams && secrets.TEAMS_WEBHOOK_URL != ''
        run: |
          curl -H 'Content-Type: application/json' \
            -d '{
              "@type": "MessageCard",
              "@context": "http://schema.org/extensions",
              "themeColor": "${{ steps.emoji.outputs.teams_color }}",
              "summary": "${{ github.repository }} - ${{ inputs.status }}",
              "sections": [{
                "activityTitle": "${{ github.repository }} - ${{ inputs.status }}",
                "facts": [
                  {"name": "Workflow", "value": "${{ github.workflow }}"},
                  {"name": "Branch", "value": "${{ github.ref_name }}"},
                  {"name": "Environment", "value": "${{ inputs.environment || 'N/A' }}"},
                  {"name": "Triggered by", "value": "${{ github.actor }}"}
                ],
                "text": "${{ inputs.message || github.event.head_commit.message }}"
              }],
              "potentialAction": [
                {
                  "@type": "OpenUri",
                  "name": "View Run",
                  "targets": [{"os": "default", "uri": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"}]
                }
              ]
            }' \
            ${{ secrets.TEAMS_WEBHOOK_URL }}

      - name: Send Discord notification
        if: inputs.notify-discord && secrets.DISCORD_WEBHOOK_URL != ''
        run: |
          curl -H "Content-Type: application/json" \
            -d '{
              "embeds": [{
                "title": "${{ github.repository }} - ${{ inputs.status }}",
                "color": ${{ inputs.status == 'success' && '65280' || inputs.status == 'failure' && '16711680' || '16776960' }},
                "fields": [
                  {"name": "Workflow", "value": "${{ github.workflow }}", "inline": true},
                  {"name": "Branch", "value": "${{ github.ref_name }}", "inline": true},
                  {"name": "Environment", "value": "${{ inputs.environment || 'N/A' }}", "inline": true},
                  {"name": "Triggered by", "value": "${{ github.actor }}", "inline": true}
                ],
                "description": "${{ inputs.message || github.event.head_commit.message }}",
                "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
              }]
            }' \
            ${{ secrets.DISCORD_WEBHOOK_URL }}
```

---

## Complete CI/CD Pipeline Example

### Full Pipeline Using Reusable Workflows

```yaml
# .github/workflows/complete-pipeline.yml
name: Complete CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy to environment'
        required: true
        type: choice
        options:
          - staging
          - production

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  # Stage 1: Build and Test
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      language: node
      node-version: '20'
      artifact-name: app-build
    secrets: inherit

  test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      language: node
      node-version: '20'
      coverage-threshold: 80
    secrets: inherit

  # Stage 2: Security Scanning
  security:
    needs: [build, test]
    uses: ./.github/workflows/reusable-security.yml
    with:
      languages: '["javascript", "typescript"]'
      scan-dependencies: true
      scan-secrets: true
      scan-sast: true
    secrets: inherit

  # Stage 3: Docker Build
  docker:
    needs: [build, test, security]
    if: github.event_name != 'pull_request'
    uses: ./.github/workflows/reusable-docker.yml
    with:
      image-name: ${{ github.repository }}
      push: true
      scan-image: true
    secrets: inherit

  # Stage 4: Deploy to Staging
  deploy-staging:
    needs: docker
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    uses: ./.github/workflows/reusable-deploy-aws.yml
    with:
      environment: staging
      deployment-type: ecs
      service-name: myapp
      cluster-name: staging-cluster
      image-uri: ghcr.io/${{ github.repository }}:${{ github.sha }}
      health-check-url: https://staging.example.com/health
    secrets: inherit

  # Stage 5: Integration Tests
  integration-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run integration tests
        run: |
          npm ci
          npm run test:integration
        env:
          TEST_URL: https://staging.example.com

  # Stage 6: Deploy to Production
  deploy-production:
    needs: [integration-tests]
    if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || inputs.environment == 'production')
    uses: ./.github/workflows/reusable-deploy-aws.yml
    with:
      environment: production
      deployment-type: ecs
      service-name: myapp
      cluster-name: production-cluster
      image-uri: ghcr.io/${{ github.repository }}:${{ github.sha }}
      health-check-url: https://example.com/health
      rollback-on-failure: true
    secrets: inherit

  # Stage 7: Notifications
  notify-success:
    needs: [deploy-staging, deploy-production]
    if: success()
    uses: ./.github/workflows/reusable-notify.yml
    with:
      status: success
      environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
      deployment-url: ${{ github.ref == 'refs/heads/main' && 'https://example.com' || 'https://staging.example.com' }}
      notify-slack: true
    secrets: inherit

  notify-failure:
    needs: [build, test, security, docker, deploy-staging, deploy-production]
    if: failure()
    uses: ./.github/workflows/reusable-notify.yml
    with:
      status: failure
      message: 'Pipeline failed - please investigate'
      notify-slack: true
    secrets: inherit
```

---

## Best Practices

### Workflow Organization

```text
.github/
  workflows/
    # Reusable workflows (called by others)
    reusable-build.yml
    reusable-test.yml
    reusable-docker.yml
    reusable-terraform.yml
    reusable-security.yml
    reusable-deploy-aws.yml
    reusable-deploy-azure.yml
    reusable-deploy-gcp.yml
    reusable-notify.yml

    # Main workflows (entry points)
    ci.yml                    # Pull request CI
    cd.yml                    # Continuous deployment
    release.yml               # Release workflow
    scheduled-security.yml    # Scheduled security scans
```

### Input/Output Design

```yaml
# Good - Typed inputs with defaults
inputs:
  language:
    description: 'Programming language'
    required: true
    type: string
  version:
    description: 'Language version'
    required: false
    type: string
    default: 'latest'
  coverage-threshold:
    description: 'Minimum coverage'
    required: false
    type: number
    default: 80

# Good - Clear outputs
outputs:
  artifact-name:
    description: 'Name of the uploaded artifact'
    value: ${{ jobs.build.outputs.artifact }}
  version:
    description: 'Built version'
    value: ${{ jobs.build.outputs.version }}
```

### Secret Inheritance

```yaml
# Caller workflow
jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    secrets: inherit  # Pass all secrets

# Or explicit secrets
jobs:
  deploy:
    uses: ./.github/workflows/reusable-deploy.yml
    secrets:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## References

- [GitHub Reusable Workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

**Status**: Active
