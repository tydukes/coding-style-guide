---
title: "GitLab CI/CD Style Guide"
description: "GitLab CI/CD pipeline standards for automated testing, building, and deployment"
author: "Tyler Dukes"
tags: [gitlab-ci, gitlab, cicd, pipelines, automation, devops]
category: "Language Guides"
status: "active"
---

## Language Overview

**GitLab CI/CD** is a continuous integration and deployment tool built into GitLab. It uses `.gitlab-ci.yml` files
to define pipelines that automatically build, test, and deploy code. This guide covers GitLab CI/CD best practices
for creating maintainable, efficient pipelines.

### Key Characteristics

- **File Name**: `.gitlab-ci.yml`
- **Format**: YAML
- **Primary Use**: CI/CD pipelines, automated testing, deployment automation
- **Key Concepts**: Pipelines, stages, jobs, runners, artifacts, cache

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **File Naming** | | | |
| Pipeline Config | `.gitlab-ci.yml` | `.gitlab-ci.yml` | At repository root |
| **Pipeline Structure** | | | |
| `stages` | Pipeline stages | `stages: [build, test, deploy]` | Ordered execution phases |
| `image` | Docker image | `image: node:20-alpine` | Default container image |
| `before_script` | Pre-job commands | Setup commands | Runs before each job |
| `after_script` | Post-job commands | Cleanup commands | Runs after each job |
| **Job Definition** | | | |
| Job Name | `job_name:` | `build_app:` | Descriptive job name |
| `stage` | Job stage | `stage: build` | Which stage job belongs to |
| `script` | Commands to run | `script: - npm install` | Required commands |
| `only` / `except` | Branch filters | `only: [main]` | When job runs (legacy) |
| `rules` | Conditional logic | `rules: - if: $CI_COMMIT_BRANCH` | Modern conditional execution |
| **Artifacts** | | | |
| `artifacts` | Save files | `paths: [dist/]` | Persist build outputs |
| `expire_in` | Artifact retention | `expire_in: 1 week` | Auto-cleanup |
| `reports` | Test reports | `reports: junit: report.xml` | Test result integration |
| **Cache** | | | |
| `cache` | Cache dependencies | `paths: [node_modules/]` | Speed up builds |
| `key` | Cache key | `key: $CI_COMMIT_REF_SLUG` | Cache versioning |
| **Variables** | | | |
| Predefined | `$CI_COMMIT_SHA` | GitLab-provided variables | Built-in vars |
| Custom | `variables:` | `NODE_ENV: production` | User-defined vars |
| Protected | Masked variables | Secure secrets | Settings > CI/CD |
| **Best Practices** | | | |
| Stages | Logical grouping | `[build, test, deploy]` | Clear pipeline flow |
| Docker Images | Pin versions | `node:20.10.0-alpine` | Avoid `latest` |
| Rules | Use `rules:` | Replace `only/except` | Modern syntax |
| Cache | Speed up builds | Cache dependencies | Reduce build time |

---

## Basic Pipeline Structure

### Simple Pipeline

```yaml
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"

build_job:
  stage: build
  image: node:18-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 day

test_job:
  stage: test
  image: node:18-alpine
  script:
    - npm ci
    - npm test
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'

deploy_job:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to production"
    - ./deploy.sh
  only:
    - main
```

---

## Stages

### Define Stages

```yaml
## Stages execute in order
stages:
  - build
  - test
  - package
  - deploy
  - cleanup

## Jobs in same stage run in parallel
## Jobs in next stage wait for previous stage to complete
```

---

## Jobs

### Job Configuration

```yaml
job_name:
  stage: build
  image: node:18-alpine
  tags:
    - docker
  before_script:
    - echo "Preparing environment"
  script:
    - npm ci
    - npm run build
  after_script:
    - echo "Cleaning up"
  only:
    - main
    - develop
  except:
    - tags
  when: on_success
  allow_failure: false
  timeout: 1h
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
```

---

## Variables

### Global Variables

```yaml
variables:
  POSTGRES_DB: "testdb"
  POSTGRES_USER: "testuser"
  POSTGRES_PASSWORD: "testpass"
  NODE_ENV: "production"
  DOCKER_DRIVER: overlay2
  GIT_STRATEGY: clone
  GIT_DEPTH: "50"
```

### Job Variables

```yaml
deploy_staging:
  stage: deploy
  variables:
    DEPLOY_ENV: "staging"
    API_URL: "https://staging.example.com"
  script:
    - echo "Deploying to $DEPLOY_ENV"
    - ./deploy.sh
```

### Protected Variables

Set in GitLab UI under Settings > CI/CD > Variables:

```yaml
deploy_production:
  stage: deploy
  script:
    - echo "API Key: $API_KEY"  # From protected variable
    - ./deploy.sh
  only:
    - main
```

---

## Artifacts

### Basic Artifacts

```yaml
build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
      - build/
    expire_in: 1 week
```

### Artifact with Reports

```yaml
test:
  stage: test
  script:
    - npm test
  artifacts:
    when: always
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 30 days
```

### Download Artifacts from Another Job

```yaml
deploy:
  stage: deploy
  dependencies:
    - build
  script:
    - ls dist/  # Artifacts from build job
    - ./deploy.sh
```

---

## Cache

### NPM Cache

```yaml
.node_cache: &node_cache
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/

test:
  <<: *node_cache
  stage: test
  script:
    - npm ci --cache .npm
    - npm test
```

### Global Cache

```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/
  policy: pull-push

build:
  stage: build
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
    policy: pull
  script:
    - npm ci
    - npm run build
```

---

## Docker-in-Docker (DinD)

### Building Docker Images

```yaml
build_image:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main
```

---

## Conditional Execution

### Only/Except

```yaml
## Run only on specific branches
deploy_production:
  stage: deploy
  script:
    - ./deploy-prod.sh
  only:
    - main

## Run except on tags
test:
  stage: test
  script:
    - npm test
  except:
    - tags

## Run only on merge requests
mr_check:
  stage: test
  script:
    - npm run lint
  only:
    - merge_requests
```

### Rules (Preferred)

```yaml
deploy:
  stage: deploy
  script:
    - ./deploy.sh
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: always
    - if: $CI_COMMIT_BRANCH == "develop"
      when: manual
    - when: never

test:
  stage: test
  script:
    - npm test
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "develop"
```

---

## Templates and Includes

### Include External Files

```yaml
include:
  - local: '.gitlab/ci/build.yml'
  - local: '.gitlab/ci/test.yml'
  - local: '.gitlab/ci/deploy.yml'
  - template: Security/SAST.gitlab-ci.yml
  - remote: 'https://example.com/ci-templates/docker.yml'
```

### Anchor and Aliases (YAML)

```yaml
.job_template: &job_definition
  image: node:18-alpine
  before_script:
    - npm ci
  retry:
    max: 2

test:
  <<: *job_definition
  stage: test
  script:
    - npm test

build:
  <<: *job_definition
  stage: build
  script:
    - npm run build
```

### Extends

```yaml
.base_job:
  image: node:18-alpine
  before_script:
    - npm ci
  retry:
    max: 2

test:
  extends: .base_job
  stage: test
  script:
    - npm test

build:
  extends: .base_job
  stage: build
  script:
    - npm run build
```

---

## Parallel Jobs

### Matrix Jobs

```yaml
test:
  stage: test
  parallel:
    matrix:
      - NODE_VERSION: ["16", "18", "20"]
        OS: ["ubuntu-latest", "alpine"]
  image: node:${NODE_VERSION}-${OS}
  script:
    - npm ci
    - npm test
```

### Simple Parallel

```yaml
test:
  stage: test
  parallel: 3
  script:
    - npm test -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

---

## Services

### PostgreSQL Service

```yaml
test:
  stage: test
  image: node:18-alpine
  services:
    - postgres:15-alpine
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: testuser
    POSTGRES_PASSWORD: testpass
    DATABASE_URL: "postgresql://testuser:testpass@postgres:5432/testdb"
  script:
    - npm ci
    - npm run test:db
```

### Multiple Services

```yaml
integration_test:
  stage: test
  services:
    - postgres:15-alpine
    - redis:7-alpine
  variables:
    POSTGRES_DB: testdb
    POSTGRES_PASSWORD: testpass
    REDIS_URL: redis://redis:6379
  script:
    - npm run test:integration
```

---

## Multi-Project Pipelines

### Trigger Downstream Pipeline

```yaml
trigger_deploy:
  stage: deploy
  trigger:
    project: mygroup/deployment-project
    branch: main
    strategy: depend
  only:
    - main
```

### Parent-Child Pipelines

```yaml
generate_child:
  stage: build
  script:
    - echo "Generating child pipeline config"
    - ./generate-pipeline.sh > child-pipeline.yml
  artifacts:
    paths:
      - child-pipeline.yml

trigger_child:
  stage: deploy
  trigger:
    include:
      - artifact: child-pipeline.yml
        job: generate_child
```

---

## Complete Pipeline Example

### Full-Stack Application Pipeline

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "develop"

stages:
  - build
  - test
  - security
  - package
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  POSTGRES_DB: testdb
  POSTGRES_USER: testuser
  POSTGRES_PASSWORD: testpass

## Reusable templates
.node_base:
  image: node:18-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/
  before_script:
    - npm ci --cache .npm

## Build stage
build_frontend:
  extends: .node_base
  stage: build
  script:
    - cd frontend
    - npm run build
  artifacts:
    paths:
      - frontend/dist/
    expire_in: 1 day

build_backend:
  extends: .node_base
  stage: build
  script:
    - cd backend
    - npm run build
  artifacts:
    paths:
      - backend/dist/
    expire_in: 1 day

## Test stage
test_frontend:
  extends: .node_base
  stage: test
  script:
    - cd frontend
    - npm test -- --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: frontend/coverage/cobertura-coverage.xml
    paths:
      - frontend/coverage/
    expire_in: 30 days

test_backend:
  extends: .node_base
  stage: test
  services:
    - postgres:15-alpine
  variables:
    DATABASE_URL: "postgresql://testuser:testpass@postgres:5432/testdb"
  script:
    - cd backend
    - npm test -- --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: backend/coverage/cobertura-coverage.xml

lint:
  extends: .node_base
  stage: test
  script:
    - npm run lint

## Security stage
sast:
  stage: security
  allow_failure: true

dependency_scanning:
  stage: security
  allow_failure: true

## Package stage
build_docker_images:
  stage: package
  image: docker:latest
  services:
    - docker:dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHA frontend/
    - docker build -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA backend/
    - docker push $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA
  only:
    - main
    - develop

## Deploy stage
deploy_staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - echo "Deploying to staging"
    - ./deploy-staging.sh
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"

deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - echo "Deploying to production"
    - ./deploy-production.sh
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main

include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
```

---

## Testing

### Testing Pipelines Locally

Use GitLab Runner to test pipelines locally before committing:

```bash
## Install GitLab Runner
# macOS
brew install gitlab-runner

# Linux
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner

## Test pipeline locally
gitlab-runner exec docker test

## Test specific job
gitlab-runner exec docker build

## Test with specific Docker image
gitlab-runner exec docker --docker-image node:18-alpine test
```

### Validating CI Configuration

Validate `.gitlab-ci.yml` syntax:

```bash
## Using GitLab CI Lint API
curl --header "PRIVATE-TOKEN: <your_access_token>" \
     --header "Content-Type: application/json" \
     --data @.gitlab-ci.yml \
     "https://gitlab.com/api/v4/projects/<project_id>/ci/lint"

## Using gitlab-ci-lint tool
npm install -g gitlab-ci-lint
gitlab-ci-lint .gitlab-ci.yml
```

### Pipeline Testing Job

Add pipeline validation as a job:

```yaml
## .gitlab-ci.yml
stages:
  - validate
  - test
  - build
  - deploy

validate:pipeline:
  stage: validate
  image: alpine:latest
  before_script:
    - apk add --no-cache yamllint
  script:
    - yamllint .gitlab-ci.yml
    - echo "Pipeline configuration is valid"
  only:
    changes:
      - .gitlab-ci.yml

validate:dockerfile:
  stage: validate
  image: hadolint/hadolint:latest-alpine
  script:
    - hadolint Dockerfile
  only:
    changes:
      - Dockerfile
```

### Unit Testing in CI

```yaml
test:unit:
  stage: test
  image: node:18-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run test:unit
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    when: always
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 30 days
  only:
    - merge_requests
    - main
```

### Integration Testing

```yaml
test:integration:
  stage: test
  image: node:18-alpine
  services:
    - name: postgres:15-alpine
      alias: postgres
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_pass
    DATABASE_URL: postgresql://test_user:test_pass@postgres:5432/test_db
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run test:integration
  artifacts:
    when: always
    reports:
      junit: integration-test-results.xml
    expire_in: 7 days
```

### End-to-End Testing

```yaml
test:e2e:
  stage: test
  image: mcr.microsoft.com/playwright:latest
  services:
    - name: selenium/standalone-chrome:latest
      alias: chrome
  variables:
    SELENIUM_HOST: chrome
    SELENIUM_PORT: 4444
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - playwright/.cache
  before_script:
    - npm ci
    - npx playwright install
  script:
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
      - playwright-report/
    expire_in: 7 days
  only:
    - merge_requests
    - main
```

### Security Testing

```yaml
## SAST (Static Application Security Testing)
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml

## Container Scanning
container_scanning:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  variables:
    DOCKER_DRIVER: overlay2
    CI_APPLICATION_REPOSITORY: $CI_REGISTRY_IMAGE
    CI_APPLICATION_TAG: $CI_COMMIT_SHA
  script:
    - docker build -t $CI_APPLICATION_REPOSITORY:$CI_APPLICATION_TAG .
    - |
      docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        aquasec/trivy:latest \
        image --exit-code 1 --severity HIGH,CRITICAL \
        $CI_APPLICATION_REPOSITORY:$CI_APPLICATION_TAG
  only:
    - merge_requests
    - main
```

### Performance Testing

```yaml
test:performance:
  stage: test
  image: grafana/k6:latest
  script:
    - k6 run --vus 10 --duration 30s tests/load-test.js
  artifacts:
    reports:
      load_performance: k6-results.json
    paths:
      - k6-results.json
    expire_in: 7 days
  only:
    - schedules
```

### Parallel Testing

Speed up tests with parallel execution:

```yaml
test:unit:parallel:
  stage: test
  image: node:18-alpine
  parallel: 4
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run test:unit -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
  artifacts:
    when: always
    reports:
      junit: junit-shard-${CI_NODE_INDEX}.xml
    expire_in: 7 days
```

### Test Coverage Reporting

```yaml
test:coverage:
  stage: test
  image: node:18-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 30 days

## Enforce coverage threshold
check:coverage:
  stage: test
  image: node:18-alpine
  needs: [test:coverage]
  script:
    - |
      COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
      echo "Coverage: $COVERAGE%"
      if (( $(echo "$COVERAGE < 80" | bc -l) )); then
        echo "Coverage below 80% threshold"
        exit 1
      fi
```

### Review Apps Testing

Test in ephemeral environments:

```yaml
review:deploy:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying review app..."
    - echo "Review app URL: https://review-$CI_COMMIT_REF_SLUG.example.com"
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://review-$CI_COMMIT_REF_SLUG.example.com
    on_stop: review:stop
  only:
    - merge_requests

review:test:
  stage: test
  needs: [review:deploy]
  image: curlimages/curl:latest
  script:
    - curl -f https://review-$CI_COMMIT_REF_SLUG.example.com/health
    - echo "Review app health check passed"
  only:
    - merge_requests

review:stop:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Destroying review app..."
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual
  only:
    - merge_requests
```

### Testing with Child Pipelines

Organize tests using child pipelines:

```yaml
## .gitlab-ci.yml
trigger:tests:
  stage: test
  trigger:
    include: .gitlab/ci/tests.yml
    strategy: depend

## .gitlab/ci/tests.yml
stages:
  - unit
  - integration
  - e2e

unit:tests:
  stage: unit
  image: node:18-alpine
  script:
    - npm ci
    - npm run test:unit

integration:tests:
  stage: integration
  image: node:18-alpine
  services:
    - postgres:15-alpine
  script:
    - npm ci
    - npm run test:integration

e2e:tests:
  stage: e2e
  image: mcr.microsoft.com/playwright:latest
  script:
    - npm ci
    - npx playwright install
    - npm run test:e2e
```

### Conditional Testing

Run tests based on changes:

```yaml
test:backend:
  stage: test
  image: python:3.11-slim
  script:
    - pip install -r requirements.txt
    - pytest
  only:
    changes:
      - backend/**/*
      - requirements.txt

test:frontend:
  stage: test
  image: node:18-alpine
  script:
    - npm ci
    - npm test
  only:
    changes:
      - frontend/**/*
      - package.json
      - package-lock.json

test:infrastructure:
  stage: test
  image: hashicorp/terraform:latest
  script:
    - terraform init
    - terraform validate
    - terraform plan
  only:
    changes:
      - terraform/**/*
```

### CI/CD Pipeline Test Metrics

Monitor pipeline performance:

```yaml
metrics:pipeline:
  stage: .post
  image: alpine:latest
  script:
    - |
      echo "Pipeline Duration: $CI_PIPELINE_DURATION seconds"
      echo "Pipeline Status: $CI_PIPELINE_STATUS"
      echo "Failed Jobs:"
      # Log failed jobs for analysis
  when: always
  only:
    - main
```

---

## Common Pitfalls

### Cache Key Collisions Across Branches

**Issue**: Using `${CI_COMMIT_REF_SLUG}` as cache key causes cache misses when switching branches even for identical dependencies.

**Example**:

```yaml
## Bad - Branch-specific cache keys
cache:
  key: ${CI_COMMIT_REF_SLUG}  # Different key for each branch
  paths:
    - node_modules/

build:
  script:
    - npm ci  # Reinstalls on every branch switch
    - npm run build
```

**Solution**: Use lock file hash as cache key.

```yaml
## Good - Content-based cache keys
cache:
  key:
    files:
      - package-lock.json  # ✅ Changes only when dependencies change
  paths:
    - node_modules/
    - .npm/

build:
  script:
    - npm ci --cache .npm
    - npm run build
```

**Key Points**:

- Use lock file hashes for dependency caches
- Include package manager cache directory (.npm, .yarn)
- Consider `${CI_COMMIT_REF_SLUG}-${checksum}` for branch isolation
- Use `policy: pull` in most jobs, `pull-push` only in one job

### Missing Dependencies Specification

**Issue**: Jobs fail because `dependencies` or `needs` is not specified, causing artifacts from previous jobs to be unavailable.

**Example**:

```yaml
## Bad - Implicit dependencies
build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - ls dist/  # ❌ dist/ not available!
    - ./deploy.sh
```

**Solution**: Explicitly declare job dependencies.

```yaml
## Good - Explicit dependencies
build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  dependencies:
    - build  # ✅ Download artifacts from build job
  script:
    - ls dist/  # Now available
    - ./deploy.sh
```

**Key Points**:

- Use `dependencies: [job1, job2]` to download specific artifacts
- Use `dependencies: []` to download no artifacts
- `needs` creates both dependency and downloads artifacts
- Missing `dependencies` downloads all artifacts from previous stages

### Services Hostname Confusion

**Issue**: Trying to connect to services using `localhost` instead of service name causes connection failures.

**Example**:

```yaml
## Bad - Using localhost for services
test:
  services:
    - postgres:15
  variables:
    DATABASE_URL: postgresql://user:pass@localhost:5432/db  # ❌ Wrong!
  script:
    - npm test  # Cannot connect to database
```

**Solution**: Use service name as hostname.

```yaml
## Good - Use service name as hostname
test:
  services:
    - name: postgres:15
      alias: database  # Optional custom alias
  variables:
    DATABASE_URL: postgresql://user:pass@database:5432/db  # ✅ Service alias
  script:
    - npm test
```

**Key Points**:

- Services are accessible by image name (postgres, redis, mongo)
- Use `alias` to customize service hostname
- Service port is the container's internal port (not mapped)
- Wait for service readiness before running tests

### Rule Precedence Gotchas

**Issue**: Multiple `rules` entries create unexpected behavior due to first-match-wins semantics.

**Example**:

```yaml
## Bad - First rule always matches
deploy:
  rules:
    - if: $CI_COMMIT_BRANCH  # ❌ Matches any branch!
      when: always
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
  script:
    - ./deploy.sh  # Runs automatically on all branches, not just main
```

**Solution**: Order rules from most specific to least specific.

```yaml
## Good - Specific rules first
deploy:
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual  # ✅ Manual deploy on main
    - if: $CI_COMMIT_BRANCH == "develop"
      when: always  # Auto deploy on develop
    - when: never  # Don't run on other branches
  script:
    - ./deploy.sh
```

**Key Points**:

- Rules are evaluated top-to-bottom, first match wins
- Always end with a default rule (`when: never` or `when: on_success`)
- Use `&&` for multiple conditions in one rule
- Test rule logic with `--dry-run`

### Variable Expansion in Non-String Contexts

**Issue**: Variables not expanding in certain YAML contexts like `only`, `except`, or numeric values.

**Example**:

```yaml
## Bad - Variables don't expand in only/except
deploy:
  only:
    - $CI_DEFAULT_BRANCH  # ❌ Treated as literal string!
  script:
    - ./deploy.sh

## Bad - Variables in numeric contexts
test:
  parallel: $PARALLEL_COUNT  # ❌ Not expanded
  script:
    - npm test
```

**Solution**: Use `rules` for conditional execution and `.env` syntax for expansion.

```yaml
## Good - Use rules for branch matching
deploy:
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH  # ✅ Expands correctly
  script:
    - ./deploy.sh

## Good - Expand variables in script
test:
  script:
    - export COUNT=${PARALLEL_COUNT:-4}
    - echo "Running $COUNT parallel tests"
    - npm test -- --shard=$CI_NODE_INDEX/$COUNT
```

**Key Points**:

- Use `rules` instead of `only/except` for variable-based conditions
- Variables expand in scripts, not in YAML structure
- Use `${VAR:-default}` for default values
- Numeric YAML keys don't support variable expansion

---

## Anti-Patterns

### ❌ Avoid: No Cache

```yaml
## Bad - Reinstalling dependencies every time
test:
  script:
    - npm install
    - npm test

## Good - Using cache
test:
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  script:
    - npm ci
    - npm test
```

### ❌ Avoid: Hardcoded Secrets

```yaml
## Bad - Hardcoded credentials
deploy:
  script:
    - ssh user@server "password123"

## Good - Use CI/CD variables
deploy:
  script:
    - ssh $DEPLOY_USER@$DEPLOY_SERVER
```

### ❌ Avoid: No Artifact Expiration

```yaml
## Bad - Artifacts kept forever
build:
  artifacts:
    paths:
      - dist/

## Good - Set expiration
build:
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
```

### ❌ Avoid: Not Using Rules Instead of only/except

```yaml
## Bad - Using deprecated only/except
deploy:
  only:
    - main
  except:
    - schedules
  script:
    - ./deploy.sh

## Good - Use rules
deploy:
  rules:
    - if: $CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE != "schedule"
  script:
    - ./deploy.sh
```

### ❌ Avoid: Running All Jobs on All Branches

```yaml
## Bad - Expensive jobs run on every branch
build-docker:
  script:
    - docker build -t myapp .
    - docker push myapp  # ❌ Pushes on every branch!

deploy-prod:
  script:
    - ./deploy-production.sh  # ❌ Deploys from any branch!

## Good - Restrict jobs to appropriate branches
build-docker:
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_TAG
  script:
    - docker build -t myapp:$CI_COMMIT_SHORT_SHA .
    - docker push myapp:$CI_COMMIT_SHORT_SHA

deploy-prod:
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
  script:
    - ./deploy-production.sh
  environment:
    name: production
```

### ❌ Avoid: Not Using extends for Shared Configuration

```yaml
## Bad - Duplicated configuration
test-unit:
  image: node:18
  before_script:
    - npm ci
  script:
    - npm run test:unit

test-integration:
  image: node:18
  before_script:
    - npm ci
  script:
    - npm run test:integration

## Good - Use extends
.node-base:
  image: node:18
  before_script:
    - npm ci

test-unit:
  extends: .node-base
  script:
    - npm run test:unit

test-integration:
  extends: .node-base
  script:
    - npm run test:integration
```

### ❌ Avoid: Not Using Retry for Flaky Jobs

```yaml
## Bad - Flaky job fails pipeline
integration-tests:
  script:
    - npm run test:integration  # ❌ No retry on failure

## Good - Retry flaky jobs
integration-tests:
  script:
    - npm run test:integration
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
```

---

## Security Best Practices

### Secrets Management

Protect sensitive data in CI/CD pipelines:

```yaml
## Bad - Hardcoded secrets in pipeline
deploy:
  script:
    - echo "API_KEY=sk-1234567890abcdef" >> .env
    - aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE  # ❌ Exposed!

## Good - Use protected CI/CD variables
deploy:
  script:
    - echo "API_KEY=$API_KEY" >> .env  # API_KEY from protected variable
    - aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"  # ✅ From variables
  only:
    - main  # Protected branch only

## Good - Use masked variables
variables:
  DATABASE_URL: ${DB_URL}  # Masked in GitLab UI and logs

## Good - Use file-type variables for certificates
deploy:
  before_script:
    - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
```

**Key Points**:

- Store secrets in GitLab CI/CD Variables (Settings > CI/CD > Variables)
- Enable "Masked" to hide values in job logs
- Enable "Protected" to restrict to protected branches only
- Use "File" type for certificates and large secrets
- Never commit secrets to `.gitlab-ci.yml`
- Rotate secrets regularly

### Protected Branches and Runners

Restrict pipeline execution to authorized users and branches:

```yaml
## Good - Protected branch deployment
deploy_production:
  stage: deploy
  script:
    - ./deploy-prod.sh
  environment:
    name: production
  only:
    - main  # Protected branch
  when: manual  # Require manual approval

## Good - Use protected runners for sensitive jobs
deploy_production:
  stage: deploy
  tags:
    - protected-runner  # Runner tagged as protected in GitLab
  script:
    - ./deploy-prod.sh
  only:
    - main
```

**Key Points**:

- Configure protected branches (Settings > Repository > Protected branches)
- Restrict who can merge to protected branches
- Use protected runners for production deployments
- Require manual approval for critical deployments
- Implement approval rules for merge requests

### Docker Image Security

Use secure, trusted container images:

```yaml
## Bad - Using latest tag
test:
  image: node:latest  # ❌ Unpredictable, potential security issues
  script:
    - npm test

## Good - Pin specific versions
test:
  image: node:20.10.0-alpine  # ✅ Specific, minimal image
  script:
    - npm test

## Good - Use internal registry with scanned images
test:
  image: registry.gitlab.com/myorg/secure-node:20.10.0-alpine
  script:
    - npm test

## Good - Scan images for vulnerabilities
build_image:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker scan $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA  # Scan for vulnerabilities
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

**Key Points**:

- Always pin specific image versions (avoid `latest`)
- Use minimal base images (alpine, distroless)
- Scan images for vulnerabilities (Trivy, Clair, Snyk)
- Use trusted registries only
- Regularly update base images
- Verify image signatures

### Code Injection Prevention

Prevent command injection in pipeline scripts:

```yaml
## Bad - Unvalidated user input
deploy:
  script:
    - ssh user@$DEPLOY_SERVER "$CI_COMMIT_MESSAGE"  # ❌ Injection risk!
    - eval $USER_COMMAND  # ❌ Never use eval!

## Good - Validate and sanitize inputs
deploy:
  script:
    - |
      if [[ ! "$DEPLOY_ENV" =~ ^(dev|staging|prod)$ ]]; then
        echo "Invalid environment"
        exit 1
      fi
    - ./deploy.sh "$DEPLOY_ENV"  # Quoted, validated variable

## Good - Use predefined commands
deploy:
  variables:
    ALLOWED_COMMANDS: "deploy.sh status.sh rollback.sh"
  script:
    - |
      if [[ " $ALLOWED_COMMANDS " =~ " $COMMAND " ]]; then
        ./"$COMMAND"
      else
        echo "Unauthorized command"
        exit 1
      fi
```

**Key Points**:

- Never use `eval` with user-controlled input
- Validate all variables before use
- Use allow-lists for dynamic values
- Quote all variables in scripts
- Sanitize commit messages and user inputs
- Use parameterized commands

### Dependency Security

Secure third-party dependencies:

```yaml
## Good - Pin dependency versions
build:
  image: node:20.10.0-alpine
  script:
    - npm ci  # Use package-lock.json (deterministic installs)
    - npm audit  # Check for vulnerabilities

## Good - Verify checksums
build:
  script:
    - wget https://example.com/tool.tar.gz
    - echo "$EXPECTED_CHECKSUM  tool.tar.gz" | sha256sum -c  # Verify checksum
    - tar -xzf tool.tar.gz

## Good - Use dependency scanning
include:
  - template: Security/Dependency-Scanning.gitlab-ci.yml

dependency_scan:
  stage: test
  allow_failure: false  # Fail on vulnerabilities
```

**Key Points**:

- Pin all dependency versions (`package-lock.json`, `Gemfile.lock`, etc.)
- Use `npm ci` instead of `npm install`
- Run dependency audits (`npm audit`, `bundle audit`, etc.)
- Verify package checksums
- Use GitLab Dependency Scanning
- Monitor for supply chain attacks

### Access Control and Least Privilege

Implement least privilege for pipeline execution:

```yaml
## Good - Use service accounts with minimal permissions
deploy_aws:
  script:
    - aws s3 sync ./dist s3://my-bucket --delete
  variables:
    AWS_ACCESS_KEY_ID: $AWS_DEPLOY_KEY_ID  # Service account with S3-only access
    AWS_SECRET_ACCESS_KEY: $AWS_DEPLOY_SECRET

## Good - Restrict runner access
deploy_production:
  tags:
    - production-runner  # Dedicated runner with limited network access
  only:
    - main
  script:
    - ./deploy.sh
```

**Key Points**:

- Use service accounts with minimum required permissions
- Separate runners by environment (dev, staging, prod)
- Restrict runner network access
- Use RBAC for pipeline access control
- Audit who can trigger pipelines
- Limit access to protected variables

### Artifact Security

Secure build artifacts:

```yaml
## Good - Set appropriate artifact expiration
build:
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week  # Auto-cleanup
    reports:
      coverage: coverage/cobertura-coverage.xml

## Good - Protect sensitive artifacts
deploy:
  dependencies:
    - build
  script:
    - |
      # Encrypt sensitive artifacts before storage
      tar -czf dist.tar.gz dist/
      openssl enc -aes-256-cbc -salt -in dist.tar.gz -out dist.tar.gz.enc -k "$ENCRYPTION_KEY"
    - ./deploy.sh dist.tar.gz.enc
```

**Key Points**:

- Set appropriate artifact expiration times
- Don't store secrets in artifacts
- Encrypt sensitive artifacts
- Use access controls for artifact download
- Validate artifact integrity (checksums)
- Clean up old artifacts regularly

### Audit Logging and Monitoring

Monitor pipeline activity:

```yaml
## Good - Log security events
deploy:
  before_script:
    - echo "Deployment initiated by $GITLAB_USER_LOGIN at $(date)"
    - echo "Target environment: $CI_ENVIRONMENT_NAME"
  script:
    - ./deploy.sh
  after_script:
    - |
      if [ $CI_JOB_STATUS == "success" ]; then
        ./send-audit-log.sh "Deployment successful"
      else
        ./send-alert.sh "Deployment failed - investigation required"
      fi
```

**Key Points**:

- Enable audit logging for all environments
- Monitor failed pipeline runs
- Track who triggered deployments
- Alert on security policy violations
- Review access logs regularly
- Maintain pipeline execution history

### Network Security

Secure pipeline network access:

```yaml
## Good - Use VPN or private networks for sensitive operations
deploy_database:
  before_script:
    - openvpn --config production-vpn.conf  # Connect to private network
  script:
    - psql -h $DB_HOST -U $DB_USER -d $DB_NAME < migration.sql
  after_script:
    - killall openvpn  # Disconnect VPN

## Good - Restrict outbound connections
test:
  script:
    - npm test
  variables:
    HTTP_PROXY: "http://proxy.internal:8080"  # Route through approved proxy
    HTTPS_PROXY: "http://proxy.internal:8080"
```

**Key Points**:

- Use VPNs or private networks for database access
- Restrict outbound internet access from runners
- Use approved proxies for external connections
- Implement network segmentation
- Monitor network traffic from runners
- Use firewall rules to limit access

---

## Tool Configuration

### gitlab-ci-local - Local Pipeline Testing

Install and configure gitlab-ci-local for testing pipelines locally:

```bash
## Install gitlab-ci-local (npm)
npm install -g gitlab-ci-local

## Install gitlab-ci-local (brew)
brew install gitlab-ci-local

## Run entire pipeline
gitlab-ci-local

## Run specific job
gitlab-ci-local build

## List all jobs
gitlab-ci-local --list

## Run with specific file
gitlab-ci-local --file .gitlab-ci.custom.yml

## Dry run
gitlab-ci-local --preview

## Use specific variables
gitlab-ci-local --variable CI_COMMIT_REF_NAME=main
```

### .gitlab-ci-local-variables.yml

```yaml
## .gitlab-ci-local-variables.yml
## Local development variables
CI_PROJECT_NAME: my-project
CI_COMMIT_BRANCH: main
CI_COMMIT_REF_NAME: main
DOCKER_REGISTRY: localhost:5000
DEPLOY_ENV: development
```

### gitlab-ci-lint - Pipeline Validation

```bash
## Validate .gitlab-ci.yml syntax (requires GitLab instance)
gitlab-ci-lint .gitlab-ci.yml

## Using GitLab API
curl --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/${PROJECT_ID}/ci/lint" \
  --form "content@.gitlab-ci.yml"

## Using glab CLI
glab ci lint
```

### VS Code Settings

```json
{
  "files.associations": {
    ".gitlab-ci*.yml": "yaml"
  },
  "[yaml]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.formatOnSave": true
  },
  "yaml.schemas": {
    "https://gitlab.com/gitlab-org/gitlab/-/raw/master/app/assets/javascripts/editor/schema/ci.json": [
      ".gitlab-ci.yml",
      ".gitlab-ci.*.yml"
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
        files: \.gitlab-ci.*\.ya?ml$
      - id: check-added-large-files

  - repo: https://github.com/adrienverge/yamllint
    rev: v1.35.1
    hooks:
      - id: yamllint
        files: \.gitlab-ci.*\.ya?ml$
        args: ['-d', '{extends: default, rules: {line-length: {max: 120}}}']

  # Optional: gitlab-ci-local validation
  - repo: local
    hooks:
      - id: gitlab-ci-local-lint
        name: GitLab CI Local Lint
        entry: gitlab-ci-local --preview
        language: system
        files: \.gitlab-ci\.yml$
        pass_filenames: false
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
    allowed-values: ['true', 'false']
  key-duplicates: enable
```

### EditorConfig

```ini
## .editorconfig
[.gitlab-ci*.{yml,yaml}]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### Makefile

```makefile
## Makefile
.PHONY: ci-local ci-list ci-validate

ci-local:
 gitlab-ci-local

ci-list:
 gitlab-ci-local --list

ci-validate:
 gitlab-ci-local --preview
 yamllint .gitlab-ci.yml
 @echo "✓ GitLab CI configuration is valid"

ci-job:
 gitlab-ci-local $(JOB)

## Example: make ci-job JOB=build

ci-debug:
 gitlab-ci-local --shell-isolation=false $(JOB)
```

### .gitlab-ci-include-local.yml

Template for reusable CI configurations:

```yaml
## .gitlab-ci/templates/docker.yml
.docker_build:
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  variables:
    DOCKER_DRIVER: overlay2
    DOCKER_TLS_CERTDIR: "/certs"

.docker_push:
  extends: .docker_build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
```

### GitLab CI Workflow Validation Job

Add to your `.gitlab-ci.yml`:

```yaml
validate:ci:
  stage: .pre
  image: python:3.11-slim
  before_script:
    - pip install yamllint
  script:
    - yamllint .gitlab-ci.yml
    - echo "✓ Pipeline configuration is valid"
  rules:
    - changes:
        - .gitlab-ci.yml
        - .gitlab-ci/**/*
```

### glab CLI Configuration

```yaml
## ~/.config/glab-cli/config.yml
hosts:
  gitlab.com:
    user: your-username
    token: glpat-xxxxxxxxxxxxx
    git_protocol: ssh
    api_protocol: https

pager:
  ci: false
  mr: less

editor: vim

browser: firefox
```

### Docker Compose for Local GitLab Runner

```yaml
## docker-compose.gitlab-runner.yml
version: '3.8'

services:
  gitlab-runner:
    image: gitlab/gitlab-runner:latest
    container_name: gitlab-runner-local
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./gitlab-runner-config:/etc/gitlab-runner
    restart: unless-stopped
```

---

## References

### Official Documentation

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [.gitlab-ci.yml Reference](https://docs.gitlab.com/ee/ci/yaml/)
- [GitLab CI/CD Examples](https://docs.gitlab.com/ee/ci/examples/)

### Best Practices

- [GitLab CI/CD Best Practices](https://docs.gitlab.com/ee/ci/pipelines/pipeline_efficiency.html)
- [Pipeline Efficiency](https://docs.gitlab.com/ee/ci/pipelines/pipeline_efficiency.html)

---

**Version**: 1.0.0
**Status**: Active
