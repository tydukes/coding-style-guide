---
title: "Comprehensive GitHub Actions CI/CD Guide"
description: "Production-ready GitHub Actions pipelines for building, testing, and deploying
  applications with best practices, security, and optimization"
author: "Tyler Dukes"
date: "2025-11-30"
tags: [github-actions, cicd, deployment, automation, devops, pipelines]
category: "CI/CD"
status: "active"
version: "1.0.0"
---

## Overview

This guide provides comprehensive coverage of GitHub Actions for production CI/CD pipelines,
focusing on real-world implementation patterns, deployment strategies, security best practices,
and performance optimization.

### What This Guide Covers

- ✅ **Complete CI/CD Pipelines**: From build to production deployment
- ✅ **Multi-Environment Deployment**: Dev, staging, production workflows
- ✅ **Security Best Practices**: Secrets management, OIDC, security scanning
- ✅ **Performance Optimization**: Caching, matrix builds, reusable workflows
- ✅ **Advanced Patterns**: Monorepos, microservices, blue-green deployments
- ✅ **Real-World Examples**: Production-ready workflow templates

### Related Documentation

- **Syntax Reference**: See [GitHub Actions Language Guide](../02_language_guides/github_actions.md)
  for YAML syntax and basic concepts
- **Validation Pipeline**: See [AI Validation Pipeline](./ai_validation_pipeline.md) for quality checks

---

## Complete CI/CD Pipeline Example

### Full-Stack Application Pipeline

```yaml
name: Full-Stack CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ====================
  # VALIDATION STAGE
  # ====================
  lint-frontend:
    name: Lint Frontend
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run ESLint
        working-directory: frontend
        run: npm run lint

      - name: Run Prettier
        working-directory: frontend
        run: npm run format:check

      - name: Type check
        working-directory: frontend
        run: npm run type-check

  lint-backend:
    name: Lint Backend
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
          cache-dependency-path: backend/requirements*.txt

      - name: Install dependencies
        working-directory: backend
        run: |
          pip install black flake8 mypy pylint
          pip install -r requirements.txt

      - name: Run Black
        working-directory: backend
        run: black --check .

      - name: Run Flake8
        working-directory: backend
        run: flake8 .

      - name: Run MyPy
        working-directory: backend
        run: mypy . --ignore-missing-imports

  # ====================
  # SECURITY STAGE
  # ====================
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      security-events: write

    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # ====================
  # TEST STAGE
  # ====================
  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    needs: [lint-frontend]
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run unit tests
        working-directory: frontend
        run: npm run test:unit -- --coverage

      - name: Run integration tests
        working-directory: frontend
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend
          token: ${{ secrets.CODECOV_TOKEN }}

  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest
    needs: [lint-backend]
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
          cache-dependency-path: backend/requirements*.txt

      - name: Install dependencies
        working-directory: backend
        run: |
          pip install pytest pytest-cov pytest-asyncio
          pip install -r requirements.txt

      - name: Run unit tests
        working-directory: backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379/0
        run: pytest tests/unit -v --cov --cov-report=xml

      - name: Run integration tests
        working-directory: backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379/0
        run: pytest tests/integration -v

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./backend/coverage.xml
          flags: backend
          token: ${{ secrets.CODECOV_TOKEN }}

  # ====================
  # BUILD STAGE
  # ====================
  build-frontend:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: [test-frontend, security-scan]
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build application
        working-directory: frontend
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist
          retention-days: 7

  build-backend-image:
    name: Build Backend Docker Image
    runs-on: ubuntu-latest
    needs: [test-backend, security-scan]
    timeout-minutes: 20
    permissions:
      contents: read
      packages: write

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.meta.outputs.tags }}
          format: 'sarif'
          output: 'trivy-image-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-image-results.sarif'

  # ====================
  # DEPLOY TO STAGING
  # ====================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build-frontend, build-backend-image]
    if: github.ref == 'refs/heads/develop' || github.event_name == 'pull_request'
    timeout-minutes: 15
    environment:
      name: staging
      url: https://staging.example.com

    steps:
      - uses: actions/checkout@v4

      - name: Download frontend artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_STAGING }}
          aws-region: us-east-1

      - name: Deploy frontend to S3
        run: |
          aws s3 sync frontend/dist s3://${{ secrets.S3_BUCKET_STAGING }} \
            --delete \
            --cache-control "public, max-age=31536000"

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID_STAGING }} \
            --paths "/*"

      - name: Deploy backend to ECS
        run: |
          aws ecs update-service \
            --cluster staging-cluster \
            --service backend-service \
            --force-new-deployment \
            --wait

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster staging-cluster \
            --services backend-service

  # ====================
  # SMOKE TESTS
  # ====================
  smoke-tests:
    name: Smoke Tests
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm install -g newman

      - name: Run API smoke tests
        run: |
          newman run tests/postman/smoke-tests.json \
            --env-var "baseUrl=https://staging.example.com/api" \
            --bail

      - name: Check frontend health
        run: |
          curl -f https://staging.example.com/health || exit 1

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://staging.example.com
          uploadArtifacts: true

  # ====================
  # DEPLOY TO PRODUCTION
  # ====================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [smoke-tests]
    if: github.ref == 'refs/heads/main'
    timeout-minutes: 30
    environment:
      name: production
      url: https://example.com
    concurrency:
      group: production-deployment
      cancel-in-progress: false

    steps:
      - uses: actions/checkout@v4

      - name: Download frontend artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_PRODUCTION }}
          aws-region: us-east-1

      - name: Deploy frontend to S3
        run: |
          aws s3 sync frontend/dist s3://${{ secrets.S3_BUCKET_PRODUCTION }} \
            --delete \
            --cache-control "public, max-age=31536000"

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID_PRODUCTION }} \
            --paths "/*"

      - name: Blue-Green Deploy backend to ECS
        run: |
          # Deploy to green environment
          aws ecs update-service \
            --cluster production-cluster \
            --service backend-service-green \
            --force-new-deployment \
            --wait

          # Wait for green to be healthy
          aws ecs wait services-stable \
            --cluster production-cluster \
            --services backend-service-green

          # Switch traffic to green
          aws elbv2 modify-target-group \
            --target-group-arn ${{ secrets.TARGET_GROUP_ARN }} \
            --targets Id=backend-service-green

          # Wait for blue to drain
          sleep 60

          # Update blue to new version
          aws ecs update-service \
            --cluster production-cluster \
            --service backend-service-blue \
            --force-new-deployment

      - name: Create deployment marker
        run: |
          curl -X POST https://api.datadoghq.com/api/v1/events \
            -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "title": "Production Deployment",
              "text": "Deployed ${{ github.sha }} to production",
              "tags": ["env:production", "service:backend"]
            }'

  # ====================
  # POST-DEPLOYMENT
  # ====================
  production-smoke-tests:
    name: Production Smoke Tests
    runs-on: ubuntu-latest
    needs: [deploy-production]
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Run production smoke tests
        run: |
          newman run tests/postman/smoke-tests.json \
            --env-var "baseUrl=https://example.com/api" \
            --bail

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          text: 'Production smoke tests failed! Immediate attention required.'

  notify-deployment:
    name: Notify Deployment
    runs-on: ubuntu-latest
    needs: [production-smoke-tests]
    if: always()

    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          text: |
            Deployment Result: ${{ job.status }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
            Ref: ${{ github.ref }}
```

---

## Deployment Strategies

### Blue-Green Deployment

```yaml
name: Blue-Green Deployment

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to green environment
        run: |
          kubectl apply -f k8s/green/

      - name: Wait for green to be ready
        run: |
          kubectl wait --for=condition=ready pod \
            -l app=myapp,slot=green \
            --timeout=5m

      - name: Run smoke tests on green
        run: |
          curl -f https://green.example.com/health || exit 1

      - name: Switch traffic to green
        run: |
          kubectl patch service myapp-service \
            -p '{"spec":{"selector":{"slot":"green"}}}'

      - name: Monitor for 5 minutes
        run: |
          sleep 300

      - name: Update blue environment
        run: |
          kubectl apply -f k8s/blue/

      - name: Rollback on failure
        if: failure()
        run: |
          kubectl patch service myapp-service \
            -p '{"spec":{"selector":{"slot":"blue"}}}'
```

### Canary Deployment

```yaml
name: Canary Deployment

jobs:
  deploy-canary:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy canary (10% traffic)
        run: |
          kubectl apply -f k8s/canary/
          kubectl patch virtualservice myapp \
            -p '{"spec":{"http":[{"weight":10,"route":[{"destination":"canary"}]},{"weight":90,"route":[{"destination":"stable"}]}]}}'

      - name: Monitor metrics for 10 minutes
        run: |
          sleep 600

      - name: Check error rate
        id: metrics
        run: |
          ERROR_RATE=$(curl -s "https://monitoring.example.com/api/error-rate")
          if [ "$ERROR_RATE" -gt "1" ]; then
            echo "rollback=true" >> $GITHUB_OUTPUT
          fi

      - name: Rollback if error rate high
        if: steps.metrics.outputs.rollback == 'true'
        run: |
          kubectl delete -f k8s/canary/
          kubectl patch virtualservice myapp \
            -p '{"spec":{"http":[{"weight":100,"route":[{"destination":"stable"}]}]}}'
          exit 1

      - name: Gradually increase traffic
        if: success()
        run: |
          for weight in 25 50 75 100; do
            kubectl patch virtualservice myapp \
              -p "{\"spec\":{\"http\":[{\"weight\":$weight,\"route\":[{\"destination\":\"canary\"}]},{\"weight\":$((100-weight)),\"route\":[{\"destination\":\"stable\"}]}]}}"
            sleep 300
          done

      - name: Promote canary to stable
        run: |
          kubectl apply -f k8s/stable/
          kubectl delete -f k8s/canary/
```

### Rolling Deployment

```yaml
name: Rolling Deployment

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Update deployment with rolling strategy
        run: |
          kubectl set image deployment/myapp \
            myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            --record

      - name: Watch rollout status
        run: |
          kubectl rollout status deployment/myapp --timeout=10m

      - name: Verify deployment
        run: |
          kubectl get deployment myapp -o jsonpath='{.status.conditions[?(@.type=="Available")].status}'

      - name: Rollback on failure
        if: failure()
        run: |
          kubectl rollout undo deployment/myapp
          kubectl rollout status deployment/myapp --timeout=10m
```

---

## Security Best Practices

### OpenID Connect (OIDC) for AWS

```yaml
name: OIDC AWS Deployment

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials with OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          role-session-name: github-actions-deploy
          aws-region: us-east-1

      - name: Deploy to S3
        run: aws s3 sync ./dist s3://my-bucket
```

### OIDC AWS IAM Role Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:myorg/myrepo:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

### Secrets Management

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Use GitHub Secrets
      - name: Deploy with secrets
        env:
          API_KEY: ${{ secrets.API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: ./deploy.sh

      # Use HashiCorp Vault
      - name: Import secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: https://vault.example.com
          method: jwt
          role: github-actions
          secrets: |
            secret/data/myapp api_key | API_KEY ;
            secret/data/myapp db_url | DATABASE_URL

      # Use AWS Secrets Manager
      - name: Get secrets from AWS
        uses: aws-actions/aws-secretsmanager-get-secrets@v1
        with:
          secret-ids: |
            myapp/api-key
            myapp/database-url
          parse-json-secrets: true
```

### Container Signing and Verification

```yaml
jobs:
  build-and-sign:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Build image
        uses: docker/build-push-action@v5
        id: build
        with:
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

      - name: Sign image with Cosign
        run: |
          cosign sign --yes ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}
          format: spdx-json
          output-file: sbom.spdx.json

      - name: Attach SBOM to image
        run: |
          cosign attach sbom --sbom sbom.spdx.json \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}
```

---

## Performance Optimization

### Matrix Builds

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    timeout-minutes: 20

    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20, 21]
        include:
          - os: ubuntu-latest
            node-version: 20
            coverage: true
        exclude:
          - os: macos-latest
            node-version: 18

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Run tests
        run: npm test

      - name: Upload coverage
        if: matrix.coverage
        uses: codecov/codecov-action@v4
```

### Advanced Caching

```yaml
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # Cache npm dependencies
      - name: Cache node modules
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      # Cache build output
      - name: Cache build
        uses: actions/cache@v3
        with:
          path: |
            dist
            .next/cache
          key: ${{ runner.os }}-build-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-build-

      # Cache Docker layers
      - name: Cache Docker layers
        uses: actions/cache@v3
        with:
          path: /tmp/.buildx-cache
          key: ${{ runner.os }}-buildx-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-buildx-

      - name: Build with layer caching
        uses: docker/build-push-action@v5
        with:
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new,mode=max

      # Cleanup old cache
      - name: Move cache
        run: |
          rm -rf /tmp/.buildx-cache
          mv /tmp/.buildx-cache-new /tmp/.buildx-cache
```

### Conditional Job Execution

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      infrastructure: ${{ steps.filter.outputs.infrastructure }}

    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            frontend:
              - 'frontend/**'
            backend:
              - 'backend/**'
            infrastructure:
              - 'infrastructure/**'

  test-frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing frontend"

  test-backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing backend"

  deploy-infrastructure:
    needs: changes
    if: needs.changes.outputs.infrastructure == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying infrastructure"
```

---

## Reusable Workflows

### Caller Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Application

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
      aws-region: us-east-1
    secrets:
      aws-role-arn: ${{ secrets.AWS_ROLE_ARN_STAGING }}

  deploy-production:
    needs: deploy-staging
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: production
      aws-region: us-east-1
      require-approval: true
    secrets:
      aws-role-arn: ${{ secrets.AWS_ROLE_ARN_PRODUCTION }}
```

### Reusable Workflow

```yaml
# .github/workflows/reusable-deploy.yml
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      aws-region:
        required: true
        type: string
      require-approval:
        required: false
        type: boolean
        default: false
    secrets:
      aws-role-arn:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ inputs.environment }}
      url: https://${{ inputs.environment }}.example.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.aws-role-arn }}
          aws-region: ${{ inputs.aws-region }}

      - name: Deploy application
        run: |
          echo "Deploying to ${{ inputs.environment }}"
          ./deploy.sh
```

---

## Monorepo Patterns

### Turborepo with Selective Builds

```yaml
name: Monorepo CI

on:
  pull_request:
    branches: [main]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.changes }}

    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            web: packages/web/**
            api: packages/api/**
            shared: packages/shared/**

  build:
    needs: changes
    if: ${{ needs.changes.outputs.packages != '[]' }}
    runs-on: ubuntu-latest

    strategy:
      matrix:
        package: ${{ fromJSON(needs.changes.outputs.packages) }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Turborepo
        run: npm install -g turbo

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: turbo run build --filter=@myorg/${{ matrix.package }}

      - name: Test package
        run: turbo run test --filter=@myorg/${{ matrix.package }}
```

### Nx Monorepo

```yaml
name: Nx Monorepo

on:
  pull_request:
    branches: [main]

jobs:
  affected:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Derive appropriate SHAs for base and head
        uses: nrwl/nx-set-shas@v3

      - name: Lint affected projects
        run: npx nx affected --target=lint --parallel=3

      - name: Test affected projects
        run: npx nx affected --target=test --parallel=3 --code-coverage

      - name: Build affected projects
        run: npx nx affected --target=build --parallel=3
```

---

## Advanced Patterns

### Dynamic Matrix from API

```yaml
jobs:
  get-environments:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}

    steps:
      - name: Fetch environments from API
        id: set-matrix
        run: |
          ENVS=$(curl -s https://api.example.com/environments | jq -c '.')
          echo "matrix=$ENVS" >> $GITHUB_OUTPUT

  deploy:
    needs: get-environments
    runs-on: ubuntu-latest

    strategy:
      matrix: ${{ fromJSON(needs.get-environments.outputs.matrix) }}

    steps:
      - name: Deploy to ${{ matrix.environment }}
        run: ./deploy.sh ${{ matrix.environment }} ${{ matrix.region }}
```

### Composite Actions

```yaml
# .github/actions/setup-app/action.yml
name: 'Setup Application'
description: 'Setup Node.js and install dependencies'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'
  cache-key:
    description: 'Cache key suffix'
    required: false
    default: 'default'

runs:
  using: 'composite'
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'

    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-npm-${{ inputs.cache-key }}-${{ hashFiles('**/package-lock.json') }}

    - name: Install dependencies
      shell: bash
      run: npm ci

# Usage in workflow
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup-app
        with:
          node-version: '20'
          cache-key: 'build'
```

### Self-Hosted Runners with Labels

```yaml
jobs:
  build-on-custom-hardware:
    runs-on: [self-hosted, linux, x64, gpu]
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - name: Build with GPU acceleration
        run: ./build-with-gpu.sh

  build-on-cloud:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Standard build
        run: ./build.sh
```

---

## Troubleshooting

### Debug Logging

```yaml
jobs:
  debug:
    runs-on: ubuntu-latest

    steps:
      - name: Enable debug logging
        run: echo "ACTIONS_STEP_DEBUG=true" >> $GITHUB_ENV

      - name: Dump context
        run: |
          echo "github context:"
          echo "${{ toJSON(github) }}"
          echo "runner context:"
          echo "${{ toJSON(runner) }}"
          echo "job context:"
          echo "${{ toJSON(job) }}"

      - name: Debug with tmate
        uses: mxschmitt/action-tmate@v3
        if: failure()
```

### Retry Failed Jobs

```yaml
jobs:
  flaky-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run flaky test with retry
        uses: nick-invision/retry@v2
        with:
          timeout_minutes: 10
          max_attempts: 3
          retry_wait_seconds: 30
          command: npm test

      - name: Retry on failure only
        uses: nick-invision/retry@v2
        with:
          timeout_minutes: 5
          max_attempts: 3
          retry_on: error
          command: ./flaky-script.sh
```

### Handle Rate Limits

```yaml
jobs:
  api-call:
    runs-on: ubuntu-latest

    steps:
      - name: Call external API with backoff
        uses: nick-invision/retry@v2
        with:
          timeout_minutes: 10
          max_attempts: 5
          retry_wait_seconds: 60
          exponential_backoff: true
          command: curl -f https://api.example.com/data
```

---

## Best Practices

### Workflow Organization

1. **Use Job Dependencies**: Chain jobs with `needs` to create clear pipelines
2. **Set Timeouts**: Always set `timeout-minutes` to prevent hung jobs
3. **Use Concurrency Groups**: Prevent multiple deployments to same environment
4. **Fail Fast**: Use `fail-fast: false` in matrices when you want all combinations to run

### Performance

1. **Cache Aggressively**: Cache dependencies, build outputs, Docker layers
2. **Use Matrix Builds**: Test multiple versions in parallel
3. **Conditional Execution**: Skip unnecessary jobs with path filters
4. **Reusable Workflows**: Extract common patterns into reusable workflows

### Security Guidelines

1. **Use OIDC**: Prefer OIDC over long-lived credentials
2. **Minimal Permissions**: Use `permissions` to grant least privilege
3. **Pin Action Versions**: Use SHA instead of tags for third-party actions
4. **Scan Dependencies**: Use Dependabot and security scanning
5. **Never Log Secrets**: Use `::add-mask::` or secret scanning

### Reliability

1. **Add Retries**: Use retry actions for flaky operations
2. **Health Checks**: Verify deployments before promoting
3. **Rollback Plans**: Include rollback steps in deployment jobs
4. **Monitor Deployments**: Send notifications and create deployment markers

---

## References

### Official Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)

### Security Resources

- [OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

### Advanced Topics

- [Reusable Workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [Composite Actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Status**: Active
