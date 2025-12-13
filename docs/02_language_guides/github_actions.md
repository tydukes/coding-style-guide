---
title: "GitHub Actions Style Guide"
description: "GitHub Actions workflow standards for CI/CD automation and repository workflows"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [github-actions, cicd, automation, workflows, devops]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**GitHub Actions** is a CI/CD platform that allows you to automate build, test, and deployment workflows directly in
your GitHub repository. This guide covers GitHub Actions best practices for creating maintainable, efficient, and
secure workflows.

### Key Characteristics

- **File Location**: `.github/workflows/*.yml` or `.github/workflows/*.yaml`
- **File Format**: YAML
- **Primary Use**: CI/CD pipelines, automation, repository management
- **Key Concepts**: Workflows, jobs, steps, actions, runners

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **File Naming** | | | |
| Workflows | `kebab-case.yml` | `ci.yml`, `deploy-prod.yml` | Descriptive workflow names |
| Location | `.github/workflows/` | Required directory | Workflow files location |
| **Workflow Structure** | | | |
| `name` | Workflow name | `name: CI Pipeline` | Descriptive workflow name |
| `on` | Trigger events | `on: [push, pull_request]` | When workflow runs |
| `jobs` | Job definitions | `jobs:` | Container for jobs |
| `runs-on` | Runner OS | `runs-on: ubuntu-latest` | Execution environment |
| `steps` | Job steps | `steps:` | Sequential actions |
| **Triggers** | | | |
| Push | `on: push` | Branch pushes | Code push events |
| Pull Request | `on: pull_request` | PR events | PR open/update |
| Schedule | `on: schedule` | `cron: '0 0 * * *'` | Scheduled runs |
| Workflow Dispatch | `on: workflow_dispatch` | Manual triggers | Manual workflow run |
| **Steps** | | | |
| Checkout | `actions/checkout@v4` | Clone repository | Get code |
| Run Command | `run: npm install` | Execute shell command | Run scripts |
| Use Action | `uses: actions/setup-node@v4` | Use marketplace action | Reusable actions |
| Set Environment | `env:` | `NODE_ENV: production` | Environment variables |
| **Secrets** | | | |
| Access Secrets | `${{ secrets.SECRET_NAME }}` | `${{ secrets.API_KEY }}` | Secure credentials |
| Environment | `environment: production` | Deployment environment | Environment protection |
| **Best Practices** | | | |
| Pin Versions | Use specific versions | `actions/checkout@v4` | Not `@main` or `@master` |
| Matrix Builds | Test multiple versions | `strategy: matrix:` | Test compatibility |
| Caching | Cache dependencies | `actions/cache@v4` | Speed up workflows |
| Concurrency | Control concurrent runs | `concurrency:` | Prevent conflicts |

---

## Basic Workflow Structure

### Simple CI Workflow

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

---

## Workflow Triggers

### Push Events

```yaml
on:
  push:
    branches:
      - main
      - develop
      - 'release/**'
    paths:
      - 'src/**'
      - 'package.json'
    tags:
      - 'v*'
```

### Pull Request Events

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

### Schedule (Cron)

```yaml
on:
  schedule:
    # Run at 2 AM UTC every day
    - cron: '0 2 * * *'
```

### Manual Trigger

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
          - development
          - staging
          - production
      debug_enabled:
        description: 'Enable debug logging'
        required: false
        type: boolean
        default: false
```

### Multiple Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

---

## Jobs and Steps

### Sequential Jobs

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build

  test:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test

  deploy:
    runs-on: ubuntu-latest
    needs: [build, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - run: echo "Deploying to production"
```

### Parallel Jobs

```yaml
jobs:
  test-node:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pytest

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint
```

---

## Matrix Strategy

### Basic Matrix

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [16, 18, 20]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm ci
      - run: npm test
```

### Matrix with Include/Exclude

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node-version: [16, 18, 20]
        include:
          - os: ubuntu-latest
            node-version: 18
            experimental: true
        exclude:
          - os: macos-latest
            node-version: 16

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

---

## Environment Variables and Secrets

### Environment Variables

```yaml
env:
  NODE_ENV: production
  API_URL: https://api.example.com

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      BUILD_NUMBER: ${{ github.run_number }}

    steps:
      - name: Build with environment
        run: npm run build
        env:
          FEATURE_FLAG: enabled
```

### Using Secrets

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws s3 sync ./build s3://my-bucket
```

---

## Caching

### NPM Cache

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '18'
      cache: 'npm'

  - run: npm ci
```

### Manual Cache

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Cache dependencies
    uses: actions/cache@v4
    with:
      path: |
        ~/.npm
        ~/.cache
      key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-deps-

  - run: npm ci
```

---

## Artifacts

### Upload Artifacts

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7
```

### Download Artifacts

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/

      - name: Deploy
        run: ./deploy.sh
```

---

## Conditional Execution

### If Conditions

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - run: echo "Deploying to production"

  notify:
    runs-on: ubuntu-latest
    if: failure()
    steps:
      - name: Send failure notification
        run: echo "Build failed"
```

### Step Conditions

```yaml
steps:
  - name: Run only on main branch
    if: github.ref == 'refs/heads/main'
    run: echo "Main branch"

  - name: Run only on pull requests
    if: github.event_name == 'pull_request'
    run: echo "Pull request"

  - name: Run only on tags
    if: startsWith(github.ref, 'refs/tags/')
    run: echo "Tag build"
```

---

## Docker in GitHub Actions

### Building Docker Images

```yaml
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            myapp:latest
            myapp:${{ github.sha }}
          cache-from: type=registry,ref=myapp:buildcache
          cache-to: type=registry,ref=myapp:buildcache,mode=max
```

---

## Reusable Workflows

### Calling a Reusable Workflow

```yaml
## .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  call-test-workflow:
    uses: ./.github/workflows/test.yml
    with:
      node-version: '18'
    secrets: inherit
```

### Reusable Workflow Definition

```yaml
## .github/workflows/test.yml
name: Test

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ inputs.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}

      - run: npm ci
      - run: npm test
```

---

## Composite Actions

### Creating a Composite Action

```yaml
## .github/actions/setup-app/action.yml
name: 'Setup Application'
description: 'Install dependencies and build'

inputs:
  node-version:
    description: 'Node.js version'
    required: true
    default: '18'

runs:
  using: 'composite'
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci
      shell: bash

    - name: Build
      run: npm run build
      shell: bash
```

### Using Composite Action

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-app
        with:
          node-version: '18'
```

---

## Testing

### Testing Workflows Locally with act

Use [act](https://github.com/nektos/act) to test GitHub Actions workflows locally:

```bash
## Install act
brew install act  # macOS
# Or download from https://github.com/nektos/act/releases

## Run all workflows
act

## Run specific event
act push
act pull_request
act workflow_dispatch

## Run specific job
act -j test

## Run with specific runner
act -P ubuntu-latest=catthehacker/ubuntu:act-latest

## Dry run to see what would execute
act -n

## Run with secrets
act -s GITHUB_TOKEN=ghp_xxx

## Use secrets file
act --secret-file .secrets
```

### Workflow Testing Best Practices

```yaml
## .github/workflows/test-workflow.yml
name: Test Workflow

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Enable manual testing

jobs:
  validate:
    name: Validate Workflow Syntax
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate workflow files
        run: |
          for file in .github/workflows/*.yml; do
            echo "Validating $file"
            yamllint "$file"
          done

  test-action:
    name: Test Custom Action
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test action
        uses: ./.github/actions/custom-action
        with:
          test-mode: true

      - name: Verify action output
        run: |
          if [ -z "${{ steps.test-action.outputs.result }}" ]; then
            echo "Action failed to produce output"
            exit 1
          fi

  matrix-test:
    name: Test Matrix Strategy
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Run tests
        run: npm test
```

### Testing Custom Actions

Create tests for custom actions:

```yaml
## .github/actions/custom-action/action.yml
name: Custom Action
description: Example custom action with testing

inputs:
  input-value:
    description: Test input
    required: true

outputs:
  result:
    description: Action result
    value: ${{ steps.process.outputs.result }}

runs:
  using: composite
  steps:
    - name: Validate input
      shell: bash
      run: |
        if [ -z "${{ inputs.input-value }}" ]; then
          echo "Error: input-value is required"
          exit 1
        fi

    - name: Process input
      id: process
      shell: bash
      run: |
        result="Processed: ${{ inputs.input-value }}"
        echo "result=$result" >> $GITHUB_OUTPUT
```

Test file for custom action:

```yaml
## .github/workflows/test-custom-action.yml
name: Test Custom Action

on:
  pull_request:
    paths:
      - '.github/actions/**'
  workflow_dispatch:

jobs:
  test-valid-input:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test with valid input
        id: valid
        uses: ./.github/actions/custom-action
        with:
          input-value: "test-value"

      - name: Verify output
        run: |
          expected="Processed: test-value"
          actual="${{ steps.valid.outputs.result }}"
          if [ "$actual" != "$expected" ]; then
            echo "Expected: $expected"
            echo "Got: $actual"
            exit 1
          fi

  test-missing-input:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test with missing input (should fail)
        id: invalid
        continue-on-error: true
        uses: ./.github/actions/custom-action
        with:
          input-value: ""

      - name: Verify failure
        run: |
          if [ "${{ steps.invalid.outcome }}" != "failure" ]; then
            echo "Action should have failed with empty input"
            exit 1
          fi
```

### Integration Testing

Test workflow integration with external services:

```yaml
## .github/workflows/integration-test.yml
name: Integration Tests

on:
  schedule:
    - cron: '0 0 * * *'  # Daily
  workflow_dispatch:

jobs:
  test-docker-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t test-app:${{ github.sha }} .

      - name: Test container
        run: |
          docker run -d --name test-container test-app:${{ github.sha }}
          sleep 5
          docker exec test-container curl -f http://localhost:3000/health

      - name: Cleanup
        if: always()
        run: |
          docker stop test-container || true
          docker rm test-container || true

  test-deployment:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          echo "Deploying to staging..."

      - name: Run smoke tests
        run: |
          # Verify deployment
          curl -f https://staging.example.com/health

      - name: Rollback on failure
        if: failure()
        run: |
          # Rollback deployment
          echo "Rolling back deployment..."
```

### Performance Testing

Test workflow performance and efficiency:

```yaml
## .github/workflows/performance-test.yml
name: Workflow Performance

on:
  pull_request:
    paths:
      - '.github/workflows/**'
  workflow_dispatch:

jobs:
  measure-performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Measure cache effectiveness
        uses: actions/cache@v4
        with:
          path: |
            ~/.npm
            node_modules
          key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}

      - name: Install dependencies (with timing)
        run: |
          start_time=$(date +%s)
          npm ci
          end_time=$(date +%s)
          duration=$((end_time - start_time))
          echo "Install took ${duration}s"

          if [ "$duration" -gt 120 ]; then
            echo "::warning::Install taking longer than expected (${duration}s > 120s)"
          fi

      - name: Check workflow file size
        run: |
          for file in .github/workflows/*.yml; do
            size=$(wc -l < "$file")
            echo "$file: $size lines"
            if [ "$size" -gt 300 ]; then
              echo "::warning::$file is large ($size lines), consider splitting"
            fi
          done
```

### Reusable Workflow Testing

Test reusable workflows:

```yaml
## .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      test-suite:
        required: false
        type: string
        default: 'all'
    outputs:
      test-result:
        description: Test execution result
        value: ${{ jobs.test.outputs.result }}

jobs:
  test:
    runs-on: ubuntu-latest
    outputs:
      result: ${{ steps.run-tests.outputs.result }}
    steps:
      - uses: actions/checkout@v4

      - name: Run tests
        id: run-tests
        run: |
          echo "Testing environment: ${{ inputs.environment }}"
          echo "Test suite: ${{ inputs.test-suite }}"

          # Run tests
          npm test

          echo "result=success" >> $GITHUB_OUTPUT
```

Call and test reusable workflow:

```yaml
## .github/workflows/test-reusable.yml
name: Test Reusable Workflow

on:
  pull_request:
  workflow_dispatch:

jobs:
  call-reusable:
    uses: ./.github/workflows/reusable-test.yml
    with:
      environment: staging
      test-suite: integration

  verify-output:
    needs: call-reusable
    runs-on: ubuntu-latest
    steps:
      - name: Check test result
        run: |
          result="${{ needs.call-reusable.outputs.test-result }}"
          if [ "$result" != "success" ]; then
            echo "Tests failed"
            exit 1
          fi
```

### CI/CD Pipeline Testing

Complete pipeline test:

```yaml
## .github/workflows/ci-cd-test.yml
name: CI/CD Pipeline Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lint workflows
        run: |
          yamllint .github/workflows/

  unit-test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Run unit tests
        run: npm test

  integration-test:
    runs-on: ubuntu-latest
    needs: unit-test
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@postgres:5432/test
        run: npm run test:integration

  e2e-test:
    runs-on: ubuntu-latest
    needs: integration-test
    steps:
      - uses: actions/checkout@v4

      - name: Run E2E tests
        run: npm run test:e2e

  build:
    runs-on: ubuntu-latest
    needs: e2e-test
    steps:
      - uses: actions/checkout@v4

      - name: Build application
        run: npm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # Deployment commands

      - name: Smoke test
        run: |
          curl -f https://staging.example.com/health
```

### Testing with Secrets and Environment Variables

```yaml
## .github/workflows/test-secrets.yml
name: Test Secrets Handling

on:
  workflow_dispatch:

jobs:
  test-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Verify required secrets exist
        env:
          API_KEY: ${{ secrets.API_KEY }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: |
          if [ -z "$API_KEY" ]; then
            echo "Error: API_KEY secret not set"
            exit 1
          fi

          if [ -z "$DB_PASSWORD" ]; then
            echo "Error: DB_PASSWORD secret not set"
            exit 1
          fi

          echo "All required secrets are configured"

      - name: Test secret masking
        run: |
          # Secrets should be masked in logs
          echo "Testing secret handling..."
          # Never echo secrets directly!
```

### Workflow Validation in CI

Add workflow validation to your CI:

```yaml
## .github/workflows/validate-workflows.yml
name: Validate Workflows

on:
  pull_request:
    paths:
      - '.github/workflows/**'
      - '.github/actions/**'

jobs:
  actionlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install actionlint
        run: |
          bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)

      - name: Run actionlint
        run: |
          ./actionlint -color

  yamllint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lint YAML files
        run: |
          yamllint .github/workflows/
          yamllint .github/actions/

  test-with-act:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup act
        run: |
          curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

      - name: Dry run workflows
        run: |
          act -n pull_request
```

---

## Security Best Practices

### Pin Action Versions

```yaml
## Good - Pinned to commit SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1

## Acceptable - Pinned to major version
- uses: actions/checkout@v4

## Avoid - Using mutable tags
- uses: actions/checkout@main
```

### Minimal Permissions

```yaml
name: CI

on: [push]

permissions:
  contents: read
  pull-requests: write

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Secrets

```yaml
## Bad - Hardcoded secret
- run: echo "API_KEY=abc123" >> .env

## Good - Use GitHub Secrets
- run: echo "API_KEY=${{ secrets.API_KEY }}" >> .env
```

### ❌ Avoid: Running Untrusted Code

```yaml
## Bad - Executing PR code without review
on:
  pull_request_target:
    types: [opened]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - run: npm install
      - run: npm test  # Dangerous!

## Good - Use pull_request for external PRs
on:
  pull_request:
    types: [opened]
```

### ❌ Avoid: No Caching

```yaml
## Bad - No caching
- run: npm ci

## Good - With caching
- uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
- run: npm ci
```

### ❌ Avoid: Using Mutable Action Tags

```yaml
## Bad - Using mutable tags (can change unexpectedly)
- uses: actions/checkout@main  # ❌ Can change anytime
- uses: actions/setup-node@v4  # ❌ Major version can get updates

## Good - Pin to specific SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
- uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8  # v4.0.2

## Or use tags with SHA comment for clarity
- uses: actions/checkout@v4.1.1  # SHA: b4ffde65f46336ab88eb53be808477a3936bae11
```

### ❌ Avoid: Overly Permissive Permissions

```yaml
## Bad - Default permissions (read/write to everything)
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    # No permissions specified - gets all permissions!

## Good - Minimal permissions
name: CI
on: [push]
permissions:
  contents: read  # ✅ Only read access

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  release:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write  # ✅ Write only where needed
      packages: write
    steps:
      - uses: actions/checkout@v4
      - run: npm publish
```

### ❌ Avoid: Not Using Concurrency Controls

```yaml
## Bad - Multiple workflow runs can conflict
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh  # ❌ Multiple deploys can run simultaneously!

## Good - Prevent concurrent runs
on:
  push:
    branches: [main]

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false  # ✅ Wait for current to finish

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh
```

### ❌ Avoid: Not Setting Timeout Limits

```yaml
## Bad - No timeout (can run forever)
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test  # ❌ Could hang indefinitely

## Good - Set reasonable timeouts
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10  # ✅ Fail after 10 minutes
    steps:
      - run: npm test
        timeout-minutes: 5  # ✅ Per-step timeout too
```

---

## Tool Configuration

### act - Local GitHub Actions Testing

Install and configure act for local workflow testing:

```bash
## Install act (macOS)
brew install act

## Install act (Linux)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

## Run default event (push)
act

## Run specific event
act pull_request

## Run specific job
act -j build

## Run with secrets file
act --secret-file .secrets

## List workflows
act -l

## Dry run
act -n
```

### .actrc Configuration

```ini
## .actrc
-P ubuntu-latest=catthehacker/ubuntu:act-latest
-P ubuntu-22.04=catthehacker/ubuntu:act-22.04
-P ubuntu-20.04=catthehacker/ubuntu:act-20.04
--container-architecture linux/amd64
```

### actionlint - Workflow Linter

```bash
## Install actionlint
brew install actionlint

## Lint all workflows
actionlint

## Lint specific workflow
actionlint .github/workflows/ci.yml

## Show available checks
actionlint -list

## Output as JSON
actionlint -format '{{json .}}'
```

### .github/actionlint.yml

```yaml
## .github/actionlint.yml
self-hosted-runner:
  labels:
    - self-hosted
    - linux
    - x64

config-variables:
  # Define repository variables
  - DEPLOY_ENV
  - API_ENDPOINT

shellcheck:
  enable: true
  shell-options: -e

pyflakes:
  enable: true
  python-version: '3.11'
```

### VS Code Settings

```json
{
  "files.associations": {
    "*.yml": "yaml",
    ".github/workflows/*.yml": "github-actions-workflow"
  },
  "[github-actions-workflow]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.formatOnSave": true
  },
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": [
      ".github/workflows/*.yml",
      ".github/workflows/*.yaml"
    ]
  },
  "yaml.customTags": [
    "!reference sequence"
  ]
}
```

### Pre-commit Hooks

```yaml
## .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        files: \.github/workflows/.*\.ya?ml$
      - id: check-added-large-files

  - repo: https://github.com/adrienverge/yamllint
    rev: v1.35.1
    hooks:
      - id: yamllint
        files: \.github/workflows/.*\.ya?ml$

  - repo: https://github.com/rhysd/actionlint
    rev: v1.6.27
    hooks:
      - id: actionlint
```

### GitHub Actions Workflow for Validation

```yaml
name: Workflow Validation

on:
  pull_request:
    paths:
      - '.github/workflows/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run actionlint
        uses: raven-actions/actionlint@v1
        with:
          fail-on-error: true

      - name: Validate workflow syntax
        run: |
          for workflow in .github/workflows/*.yml; do
            echo "Validating $workflow"
            yamllint "$workflow"
          done
```

### Makefile

```makefile
## Makefile
.PHONY: act-list act-push act-pr lint-workflows

act-list:
 act -l

act-push:
 act push

act-pr:
 act pull_request

act-dry:
 act -n

lint-workflows:
 actionlint

validate-workflows:
 yamllint .github/workflows/*.yml
 actionlint

test-workflow:
 act -j $(JOB)

## Example: make test-workflow JOB=build
```

### .secrets File (for act)

```bash
## .secrets
## DO NOT commit this file - add to .gitignore
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
NPM_TOKEN=npm_xxxxxxxxxxxxx
```

### EditorConfig

```ini
## .editorconfig
[.github/workflows/*.{yml,yaml}]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### yamllint Configuration

```yaml
## .yamllint
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
    allowed-values: ['true', 'false', 'on', 'off']

ignore: |
  node_modules/
  .venv/
```

---

## References

### Official Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)

### Security

- [Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Using Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
