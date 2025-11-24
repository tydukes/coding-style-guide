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
# Stages execute in order
stages:
  - build
  - test
  - package
  - deploy
  - cleanup

# Jobs in same stage run in parallel
# Jobs in next stage wait for previous stage to complete
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
# Run only on specific branches
deploy_production:
  stage: deploy
  script:
    - ./deploy-prod.sh
  only:
    - main

# Run except on tags
test:
  stage: test
  script:
    - npm test
  except:
    - tags

# Run only on merge requests
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

# Reusable templates
.node_base:
  image: node:18-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/
  before_script:
    - npm ci --cache .npm

# Build stage
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

# Test stage
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

# Security stage
sast:
  stage: security
  allow_failure: true

dependency_scanning:
  stage: security
  allow_failure: true

# Package stage
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

# Deploy stage
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
# Bad - Reinstalling dependencies every time
test:
  script:
    - npm install
    - npm test

# Good - Using cache
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
# Bad - Hardcoded credentials
deploy:
  script:
    - ssh user@server "password123"

# Good - Use CI/CD variables
deploy:
  script:
    - ssh $DEPLOY_USER@$DEPLOY_SERVER
```

### ❌ Avoid: No Artifact Expiration

```yaml
# Bad - Artifacts kept forever
build:
  artifacts:
    paths:
      - dist/

# Good - Set expiration
build:
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
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
