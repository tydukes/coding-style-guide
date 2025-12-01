---
title: "Comprehensive GitLab CI/CD Guide"
description: "Production-ready GitLab CI/CD pipelines for building, testing, and deploying
  applications with best practices, security, and optimization"
author: "Tyler Dukes"
date: "2025-11-30"
tags: [gitlab-ci, cicd, deployment, automation, devops, pipelines]
category: "CI/CD"
status: "active"
version: "1.0.0"
---

## Overview

This guide provides comprehensive coverage of GitLab CI/CD for production pipelines, focusing on
real-world implementation patterns, deployment strategies, security best practices, and performance
optimization.

### What This Guide Covers

- ✅ **Complete CI/CD Pipelines**: From build to production deployment
- ✅ **Multi-Environment Deployment**: Dev, staging, production workflows
- ✅ **Security Best Practices**: SAST, DAST, secrets management, container scanning
- ✅ **Performance Optimization**: Caching, parallel jobs, DAG pipelines
- ✅ **Advanced Patterns**: Mono repos, microservices, review apps, feature flags
- ✅ **Real-World Examples**: Production-ready pipeline templates

### Related Documentation

- **Syntax Reference**: See [GitLab CI/CD Language Guide](../02_language_guides/gitlab_ci.md)
  for YAML syntax and basic concepts
- **Validation Pipeline**: See [AI Validation Pipeline](./ai_validation_pipeline.md) for quality
  checks

---

## Complete CI/CD Pipeline Example

### Full-Stack Application Pipeline

```yaml
# .gitlab-ci.yml
variables:
  NODE_VERSION: "20"
  PYTHON_VERSION: "3.11"
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  FF_USE_FASTZIP: "true"
  ARTIFACT_COMPRESSION_LEVEL: "fast"
  CACHE_COMPRESSION_LEVEL: "fast"

stages:
  - validate
  - test
  - build
  - security
  - deploy-staging
  - smoke-test
  - deploy-production
  - monitor

# ====================
# VALIDATION STAGE
# ====================
lint:frontend:
  stage: validate
  image: node:${NODE_VERSION}-alpine
  cache:
    key:
      files:
        - frontend/package-lock.json
    paths:
      - frontend/node_modules/
  script:
    - cd frontend
    - npm ci
    - npm run lint
    - npm run format:check
    - npm run type-check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - frontend/**/*
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

lint:backend:
  stage: validate
  image: python:${PYTHON_VERSION}-slim
  cache:
    key:
      files:
        - backend/requirements.txt
    paths:
      - .cache/pip/
  before_script:
    - pip install --cache-dir .cache/pip black flake8 mypy pylint
    - cd backend
    - pip install --cache-dir ../.cache/pip -r requirements.txt
  script:
    - black --check .
    - flake8 .
    - mypy . --ignore-missing-imports
    - pylint **/*.py
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - backend/**/*
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# ====================
# TEST STAGE
# ====================
test:frontend:
  stage: test
  image: node:${NODE_VERSION}-alpine
  needs: ["lint:frontend"]
  cache:
    key:
      files:
        - frontend/package-lock.json
    paths:
      - frontend/node_modules/
  script:
    - cd frontend
    - npm ci
    - npm run test:unit -- --coverage
    - npm run test:integration
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: frontend/coverage/cobertura-coverage.xml
    paths:
      - frontend/coverage/
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - frontend/**/*
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

test:backend:
  stage: test
  image: python:${PYTHON_VERSION}-slim
  needs: ["lint:backend"]
  services:
    - postgres:15-alpine
    - redis:7-alpine
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_HOST_AUTH_METHOD: trust
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/testdb
    REDIS_URL: redis://redis:6379/0
  cache:
    key:
      files:
        - backend/requirements.txt
    paths:
      - .cache/pip/
  before_script:
    - pip install --cache-dir .cache/pip pytest pytest-cov pytest-asyncio
    - cd backend
    - pip install --cache-dir ../.cache/pip -r requirements.txt
  script:
    - pytest tests/unit -v --cov --cov-report=xml --cov-report=term
    - pytest tests/integration -v
  coverage: '/(?i)total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: backend/coverage.xml
    paths:
      - backend/htmlcov/
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - backend/**/*
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# ====================
# BUILD STAGE
# ====================
build:frontend:
  stage: build
  image: node:${NODE_VERSION}-alpine
  needs: ["test:frontend"]
  cache:
    key:
      files:
        - frontend/package-lock.json
    paths:
      - frontend/node_modules/
  script:
    - cd frontend
    - npm ci
    - npm run build
  artifacts:
    paths:
      - frontend/dist/
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - frontend/**/*
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

build:backend:image:
  stage: build
  image: docker:24-dind
  needs: ["test:backend"]
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin $CI_REGISTRY
  script:
    - cd backend
    - docker build
        --build-arg BUILDKIT_INLINE_CACHE=1
        --cache-from $CI_REGISTRY_IMAGE/backend:latest
        --tag $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA
        --tag $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_REF_SLUG
        --tag $CI_REGISTRY_IMAGE/backend:latest
        .
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_REF_SLUG
    - docker push $CI_REGISTRY_IMAGE/backend:latest
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - backend/**/*
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# ====================
# SECURITY STAGE
# ====================
sast:
  stage: security
  needs: []
  allow_failure: true

dependency_scanning:
  stage: security
  needs: []
  allow_failure: true

container_scanning:
  stage: security
  needs: ["build:backend:image"]
  allow_failure: true
  variables:
    CI_APPLICATION_REPOSITORY: $CI_REGISTRY_IMAGE/backend
    CI_APPLICATION_TAG: $CI_COMMIT_SHA

secret_detection:
  stage: security
  needs: []
  allow_failure: true

# ====================
# DEPLOY TO STAGING
# ====================
deploy:staging:frontend:
  stage: deploy-staging
  image: registry.gitlab.com/gitlab-org/cloud-deploy/aws-base:latest
  needs: ["build:frontend"]
  environment:
    name: staging
    url: https://staging.example.com
    on_stop: stop:staging
  before_script:
    - aws --version
  script:
    - aws s3 sync frontend/dist s3://$S3_BUCKET_STAGING --delete --cache-control "public, max-age=31536000"
    - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID_STAGING --paths "/*"
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

deploy:staging:backend:
  stage: deploy-staging
  image: registry.gitlab.com/gitlab-org/cloud-deploy/aws-base:latest
  needs: ["build:backend:image", "container_scanning"]
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - aws ecs update-service
        --cluster staging-cluster
        --service backend-service
        --force-new-deployment
        --task-definition backend-task:$CI_COMMIT_SHA
    - aws ecs wait services-stable
        --cluster staging-cluster
        --services backend-service
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# ====================
# SMOKE TESTS
# ====================
smoke-test:staging:
  stage: smoke-test
  image: postman/newman:alpine
  needs: ["deploy:staging:frontend", "deploy:staging:backend"]
  script:
    - newman run tests/postman/smoke-tests.json
        --env-var "baseUrl=https://staging.example.com/api"
        --bail
        --reporters cli,json
        --reporter-json-export newman-results.json
  artifacts:
    when: always
    reports:
      junit: newman-results.json
    expire_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# ====================
# DEPLOY TO PRODUCTION
# ====================
deploy:production:frontend:
  stage: deploy-production
  image: registry.gitlab.com/gitlab-org/cloud-deploy/aws-base:latest
  needs: ["smoke-test:staging"]
  environment:
    name: production
    url: https://example.com
    on_stop: rollback:production
  before_script:
    - aws --version
  script:
    - aws s3 sync frontend/dist s3://$S3_BUCKET_PRODUCTION --delete --cache-control "public, max-age=31536000"
    - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID_PRODUCTION --paths "/*"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
  resource_group: production

deploy:production:backend:
  stage: deploy-production
  image: registry.gitlab.com/gitlab-org/cloud-deploy/aws-base:latest
  needs: ["smoke-test:staging"]
  environment:
    name: production
    url: https://example.com
  script:
    # Blue-green deployment
    - |
      # Deploy to green environment
      aws ecs update-service \
        --cluster production-cluster \
        --service backend-service-green \
        --task-definition backend-task:$CI_COMMIT_SHA \
        --force-new-deployment

      # Wait for green to be stable
      aws ecs wait services-stable \
        --cluster production-cluster \
        --services backend-service-green

      # Health check green environment
      curl -f https://green.example.com/health || exit 1

      # Switch traffic to green
      aws elbv2 modify-listener \
        --listener-arn $LISTENER_ARN \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_GREEN_ARN

      # Wait for blue to drain
      sleep 60

      # Update blue to new version (for next deployment)
      aws ecs update-service \
        --cluster production-cluster \
        --service backend-service-blue \
        --task-definition backend-task:$CI_COMMIT_SHA \
        --force-new-deployment
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
  resource_group: production

# ====================
# MONITORING
# ====================
performance-test:production:
  stage: monitor
  image: grafana/k6:latest
  needs: ["deploy:production:backend"]
  script:
    - k6 run --out json=results.json tests/performance/load.js
  artifacts:
    paths:
      - results.json
    expire_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
  allow_failure: true

# ====================
# ROLLBACK
# ====================
rollback:production:
  stage: deploy-production
  image: registry.gitlab.com/gitlab-org/cloud-deploy/aws-base:latest
  environment:
    name: production
    action: stop
  script:
    - |
      # Switch traffic back to blue
      aws elbv2 modify-listener \
        --listener-arn $LISTENER_ARN \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_BLUE_ARN

      echo "Rolled back to previous production version"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual

stop:staging:
  stage: deploy-staging
  image: registry.gitlab.com/gitlab-org/cloud-deploy/aws-base:latest
  environment:
    name: staging
    action: stop
  script:
    - echo "Stopping staging environment"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual

# ====================
# TEMPLATES
# ====================
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
```

---

## Deployment Strategies

### Blue-Green Deployment

```yaml
.deploy_template: &deploy_template
  image: registry.gitlab.com/gitlab-org/cloud-deploy/aws-base:latest
  before_script:
    - aws --version

deploy:blue:
  <<: *deploy_template
  stage: deploy
  environment:
    name: production-blue
  script:
    - kubectl apply -f k8s/blue/
    - kubectl wait --for=condition=ready pod -l app=myapp,slot=blue --timeout=5m
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

deploy:green:
  <<: *deploy_template
  stage: deploy
  environment:
    name: production-green
  script:
    - kubectl apply -f k8s/green/
    - kubectl wait --for=condition=ready pod -l app=myapp,slot=green --timeout=5m
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

switch:traffic:
  <<: *deploy_template
  stage: deploy
  needs: ["deploy:green"]
  environment:
    name: production
  script:
    - |
      # Run smoke tests on green
      curl -f https://green.example.com/health || exit 1

      # Switch service to green
      kubectl patch service myapp-service -p '{"spec":{"selector":{"slot":"green"}}}'

      # Monitor for 5 minutes
      sleep 300

      # Check error rates
      ERROR_RATE=$(curl -s "https://monitoring.example.com/api/error-rate")
      if [ "$ERROR_RATE" -gt "1" ]; then
        echo "High error rate detected, rolling back"
        kubectl patch service myapp-service -p '{"spec":{"selector":{"slot":"blue"}}}'
        exit 1
      fi

      echo "Deployment successful"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
```

### Canary Deployment

```yaml
deploy:canary:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production-canary
  script:
    - kubectl apply -f k8s/canary/
    - |
      # Start with 10% traffic
      for weight in 10 25 50 75 100; do
        echo "Setting canary weight to $weight%"
        kubectl patch virtualservice myapp -p "{\"spec\":{\"http\":[{\"weight\":$weight,\"route\":[{\"destination\":\"canary\"}]},{\"weight\":$((100-weight)),\"route\":[{\"destination\":\"stable\"}]}]}}"

        # Monitor for 5 minutes
        sleep 300

        # Check metrics
        ERROR_RATE=$(curl -s "https://monitoring.example.com/api/error-rate")
        LATENCY_P99=$(curl -s "https://monitoring.example.com/api/latency-p99")

        if [ "$ERROR_RATE" -gt "1" ] || [ "$LATENCY_P99" -gt "1000" ]; then
          echo "Metrics exceeded thresholds, rolling back"
          kubectl delete -f k8s/canary/
          kubectl patch virtualservice myapp -p '{"spec":{"http":[{"weight":100,"route":[{"destination":"stable"}]}]}}'
          exit 1
        fi
      done

      # Promote canary to stable
      kubectl apply -f k8s/stable/ --force
      kubectl delete -f k8s/canary/
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
```

### Rolling Deployment with Progressive Rollout

```yaml
deploy:progressive:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
  script:
    - |
      # Configure progressive rollout
      kubectl set image deployment/myapp \
        myapp=$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA \
        --record

      # Watch rollout with progressive strategy
      kubectl rollout status deployment/myapp --timeout=15m

      # Verify new pods are healthy
      kubectl wait --for=condition=ready pod \
        -l app=myapp,version=$CI_COMMIT_SHA \
        --timeout=5m

      # Run post-deployment health checks
      for i in {1..10}; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://example.com/health)
        if [ "$STATUS" != "200" ]; then
          echo "Health check failed with status $STATUS"
          kubectl rollout undo deployment/myapp
          kubectl rollout status deployment/myapp --timeout=10m
          exit 1
        fi
        sleep 3
      done

      echo "Progressive deployment successful"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

---

## Review Apps (Dynamic Environments)

### Automatic Review App Creation

```yaml
review:start:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.review.example.com
    on_stop: review:stop
    auto_stop_in: 1 week
  script:
    - |
      # Create namespace for review app
      kubectl create namespace review-$CI_COMMIT_REF_SLUG --dry-run=client -o yaml | kubectl apply -f -

      # Deploy review app
      helm upgrade --install review-$CI_COMMIT_REF_SLUG ./helm-chart \
        --namespace review-$CI_COMMIT_REF_SLUG \
        --set image.tag=$CI_COMMIT_SHA \
        --set ingress.host=$CI_COMMIT_REF_SLUG.review.example.com \
        --wait --timeout 5m

      # Wait for pods to be ready
      kubectl wait --for=condition=ready pod \
        -l app=review-app \
        -n review-$CI_COMMIT_REF_SLUG \
        --timeout=5m

      echo "Review app available at https://$CI_COMMIT_REF_SLUG.review.example.com"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  resource_group: review/$CI_COMMIT_REF_SLUG

review:stop:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  script:
    - helm uninstall review-$CI_COMMIT_REF_SLUG --namespace review-$CI_COMMIT_REF_SLUG
    - kubectl delete namespace review-$CI_COMMIT_REF_SLUG
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual
  resource_group: review/$CI_COMMIT_REF_SLUG
```

---

## Security Best Practices

### SAST, DAST, and Dependency Scanning

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - template: Security/DAST.gitlab-ci.yml

# Customize SAST
sast:
  variables:
    SAST_EXCLUDED_PATHS: spec, test, tests, tmp, node_modules

# Customize Dependency Scanning
dependency_scanning:
  variables:
    DS_EXCLUDED_PATHS: spec, test, tests, tmp, node_modules
    DS_DEFAULT_ANALYZERS: "gemnasium, gemnasium-python, retire.js"

# Customize Container Scanning
container_scanning:
  variables:
    CS_SEVERITY_THRESHOLD: "HIGH"
    CI_APPLICATION_REPOSITORY: $CI_REGISTRY_IMAGE/backend
    CI_APPLICATION_TAG: $CI_COMMIT_SHA

# Customize DAST
dast:
  variables:
    DAST_WEBSITE: https://staging.example.com
    DAST_FULL_SCAN_ENABLED: "true"
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
      when: always
```

### Secrets Management with HashiCorp Vault

```yaml
.vault_template: &vault_template
  image: vault:latest
  before_script:
    - export VAULT_ADDR=$VAULT_ADDR
    - export VAULT_TOKEN=$CI_JOB_JWT
    - vault login -method=jwt role=gitlab-ci token=$CI_JOB_JWT

deploy:with:vault:
  <<: *vault_template
  stage: deploy
  script:
    - |
      # Fetch secrets from Vault
      export DB_PASSWORD=$(vault kv get -field=password secret/myapp/database)
      export API_KEY=$(vault kv get -field=api_key secret/myapp/external-api)

      # Use secrets in deployment
      kubectl create secret generic myapp-secrets \
        --from-literal=DB_PASSWORD=$DB_PASSWORD \
        --from-literal=API_KEY=$API_KEY \
        --dry-run=client -o yaml | kubectl apply -f -

      # Deploy application
      kubectl apply -f k8s/
```

### OIDC with AWS

```yaml
deploy:aws:oidc:
  stage: deploy
  image: registry.gitlab.com/gitlab-org/cloud-deploy/aws-base:latest
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  script:
    - |
      # Assume role using OIDC
      STS_RESPONSE=$(aws sts assume-role-with-web-identity \
        --role-arn $AWS_ROLE_ARN \
        --role-session-name gitlab-ci-$CI_PIPELINE_ID \
        --web-identity-token $GITLAB_OIDC_TOKEN \
        --duration-seconds 3600)

      # Export AWS credentials
      export AWS_ACCESS_KEY_ID=$(echo $STS_RESPONSE | jq -r '.Credentials.AccessKeyId')
      export AWS_SECRET_ACCESS_KEY=$(echo $STS_RESPONSE | jq -r '.Credentials.SecretAccessKey')
      export AWS_SESSION_TOKEN=$(echo $STS_RESPONSE | jq -r '.Credentials.SessionToken')

      # Deploy to AWS
      aws s3 sync ./dist s3://$S3_BUCKET_PRODUCTION
```

---

## Performance Optimization

### Parallel Jobs with DAG

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

build:frontend:
  stage: build
  needs: ["test:frontend"]
  script:
    - npm run build

build:backend:
  stage: build
  needs: ["test:backend"]
  script:
    - docker build -t backend .

deploy:cdn:
  stage: deploy
  needs: ["build:frontend"]
  script:
    - aws s3 sync dist s3://bucket

deploy:api:
  stage: deploy
  needs: ["build:backend"]
  script:
    - kubectl apply -f k8s/
```

### Advanced Caching

```yaml
.node_cache: &node_cache
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
      - .npm/
    policy: pull-push

.node_cache_readonly: &node_cache_readonly
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
      - .npm/
    policy: pull

build:
  <<: *node_cache
  script:
    - npm ci --cache .npm
    - npm run build

test:
  <<: *node_cache_readonly
  script:
    - npm test
```

### Docker Layer Caching

```yaml
build:image:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  variables:
    DOCKER_BUILDKIT: 1
  script:
    - docker build
        --build-arg BUILDKIT_INLINE_CACHE=1
        --cache-from $CI_REGISTRY_IMAGE:latest
        --tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
        --tag $CI_REGISTRY_IMAGE:latest
        .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
```

### Conditional Pipeline Rules

```yaml
.frontend_changes: &frontend_changes
  changes:
    - frontend/**/*
    - package.json
    - package-lock.json

.backend_changes: &backend_changes
  changes:
    - backend/**/*
    - requirements.txt
    - Dockerfile

test:frontend:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      <<: *frontend_changes
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

test:backend:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      <<: *backend_changes
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

---

## Monorepo Patterns

### Selective Pipeline Execution

```yaml
variables:
  FRONTEND_CHANGES: "false"
  BACKEND_CHANGES: "false"
  SHARED_CHANGES: "false"

detect:changes:
  stage: .pre
  image: alpine/git
  script:
    - |
      git diff --name-only $CI_MERGE_REQUEST_DIFF_BASE_SHA $CI_COMMIT_SHA > changes.txt

      if grep -q "^frontend/" changes.txt; then
        echo "FRONTEND_CHANGES=true" >> build.env
      fi

      if grep -q "^backend/" changes.txt; then
        echo "BACKEND_CHANGES=true" >> build.env
      fi

      if grep -q "^shared/" changes.txt; then
        echo "FRONTEND_CHANGES=true" >> build.env
        echo "BACKEND_CHANGES=true" >> build.env
        echo "SHARED_CHANGES=true" >> build.env
      fi
  artifacts:
    reports:
      dotenv: build.env
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

test:frontend:
  needs: ["detect:changes"]
  rules:
    - if: $FRONTEND_CHANGES == "true"
  script:
    - cd frontend && npm test

test:backend:
  needs: ["detect:changes"]
  rules:
    - if: $BACKEND_CHANGES == "true"
  script:
    - cd backend && pytest
```

### Child Pipelines for Microservices

```yaml
# Parent pipeline
trigger:service-a:
  stage: trigger
  trigger:
    include: services/service-a/.gitlab-ci.yml
    strategy: depend
  rules:
    - changes:
        - services/service-a/**/*

trigger:service-b:
  stage: trigger
  trigger:
    include: services/service-b/.gitlab-ci.yml
    strategy: depend
  rules:
    - changes:
        - services/service-b/**/*

# services/service-a/.gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm test

build:
  stage: build
  script:
    - docker build -t service-a .

deploy:
  stage: deploy
  script:
    - kubectl apply -f k8s/
```

---

## Advanced Patterns

### Feature Flags with LaunchDarkly

```yaml
deploy:with:feature:flags:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl jq
  script:
    - |
      # Create deployment event in LaunchDarkly
      curl -X POST https://app.launchdarkly.com/api/v2/flags/production/my-feature/on \
        -H "Authorization: $LAUNCHDARKLY_API_KEY" \
        -H "Content-Type: application/json"

      # Deploy application
      kubectl apply -f k8s/

      # Gradually enable feature flag
      for percentage in 10 25 50 75 100; do
        echo "Enabling feature for $percentage% of users"
        curl -X PATCH https://app.launchdarkly.com/api/v2/flags/production/my-feature \
          -H "Authorization: $LAUNCHDARKLY_API_KEY" \
          -H "Content-Type: application/json" \
          -d "{\"rollout\":{\"variations\":[{\"variation\":0,\"weight\":$((100-percentage))},{\"variation\":1,\"weight\":$percentage}]}}"

        sleep 300  # Monitor for 5 minutes
      done
```

### Matrix Jobs (Parallel Execution)

```yaml
.test_template: &test_template
  stage: test
  script:
    - python -m pytest tests/

test:python:3.10:
  <<: *test_template
  image: python:3.10-slim

test:python:3.11:
  <<: *test_template
  image: python:3.11-slim

test:python:3.12:
  <<: *test_template
  image: python:3.12-slim

# Or using parallel directive
test:parallel:
  stage: test
  image: python:${PYTHON_VERSION}-slim
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.10", "3.11", "3.12"]
  script:
    - python -m pytest tests/
```

### Auto DevOps Customization

```yaml
include:
  - template: Auto-DevOps.gitlab-ci.yml

variables:
  AUTO_DEVOPS_PLATFORM_TARGET: "ECS"
  POSTGRES_ENABLED: "true"
  POSTGRES_VERSION: 15
  REDIS_ENABLED: "true"

production:
  extends: .auto-deploy
  before_script:
    - echo "Custom pre-deployment tasks"
  after_script:
    - echo "Custom post-deployment tasks"
```

---

## Troubleshooting

### Debug Logging

```yaml
debug:pipeline:
  stage: .pre
  script:
    - echo "CI_COMMIT_REF_NAME=$CI_COMMIT_REF_NAME"
    - echo "CI_COMMIT_SHA=$CI_COMMIT_SHA"
    - echo "CI_PIPELINE_SOURCE=$CI_PIPELINE_SOURCE"
    - echo "CI_MERGE_REQUEST_ID=$CI_MERGE_REQUEST_ID"
    - env | sort
  rules:
    - if: $CI_COMMIT_MESSAGE =~ /\[debug\]/
```

### Retry Failed Jobs

```yaml
test:flaky:
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
      - script_failure
  script:
    - npm test
```

### Job Artifacts for Debugging

```yaml
test:with:artifacts:
  script:
    - npm test || true
  artifacts:
    when: always
    paths:
      - logs/
      - screenshots/
      - test-results/
    reports:
      junit: test-results/junit.xml
    expire_in: 1 week
```

---

## Best Practices

### Pipeline Organization

1. **Use Stages Wisely**: Group related jobs into logical stages
2. **Set Timeouts**: Use `timeout` to prevent hung jobs
3. **Resource Groups**: Prevent concurrent deployments with `resource_group`
4. **Environment Protection**: Use protected environments for production

### Performance

1. **Cache Strategically**: Use `cache` for dependencies, `artifacts` for build outputs
2. **Parallel Jobs**: Use `parallel` or DAG with `needs` for concurrent execution
3. **Conditional Rules**: Skip unnecessary jobs with `rules`
4. **Docker Layer Caching**: Use BuildKit and cache-from for faster builds

### Security Guidelines

1. **Use Protected Variables**: Store secrets as protected variables
2. **Enable Security Scanning**: Use SAST, DAST, dependency scanning
3. **OIDC for Cloud**: Prefer OIDC over long-lived credentials
4. **Minimal Permissions**: Use job tokens with minimal scopes
5. **Scan Containers**: Always scan Docker images before deployment

### Reliability

1. **Add Retries**: Use `retry` for flaky operations
2. **Health Checks**: Verify deployments before promoting
3. **Rollback Capability**: Include rollback jobs for production
4. **Monitor Deployments**: Integrate with monitoring tools

---

## References

### Official Documentation

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [.gitlab-ci.yml Reference](https://docs.gitlab.com/ee/ci/yaml/)
- [GitLab CI/CD Examples](https://docs.gitlab.com/ee/ci/examples/)

### Security

- [Security Scanning](https://docs.gitlab.com/ee/user/application_security/)
- [OIDC Documentation](https://docs.gitlab.com/ee/ci/cloud_services/)
- [Protected Variables](https://docs.gitlab.com/ee/ci/variables/#protect-a-cicd-variable)

### Advanced Topics

- [Review Apps](https://docs.gitlab.com/ee/ci/review_apps/)
- [Child Pipelines](https://docs.gitlab.com/ee/ci/pipelines/parent_child_pipelines.html)
- [Auto DevOps](https://docs.gitlab.com/ee/topics/autodevops/)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Status**: Active
