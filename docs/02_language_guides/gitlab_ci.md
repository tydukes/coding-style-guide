---
title: "GitLab CI/CD Style Guide"
description: "GitLab CI/CD pipeline standards for automated testing, building, and deployment"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [gitlab-ci, gitlab, cicd, pipelines, automation, devops]
category: "Language Guides"
status: "active"
version: "1.0.0"
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
**Last Updated**: 2025-10-28
**Status**: Active
