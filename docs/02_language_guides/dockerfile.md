---
title: "Dockerfile Style Guide"
description: "Docker container image standards for secure, efficient, and maintainable container builds"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [docker, dockerfile, containers, devops, security]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**Dockerfile** is a text file containing instructions to build Docker container images. This guide covers Dockerfile
best practices for creating secure, efficient, and maintainable container images.

### Key Characteristics

- **File Name**: `Dockerfile` (no extension)
- **Primary Use**: Building Docker container images
- **Key Principles**: Multi-stage builds, layer caching, security, minimal image size

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Instructions** | | | |
| Base Image | `FROM` | `FROM node:20-alpine` | Use specific tags, prefer slim/alpine |
| Working Dir | `WORKDIR` | `WORKDIR /app` | Sets working directory |
| Copy Files | `COPY` | `COPY package.json ./` | Copy from build context |
| Run Command | `RUN` | `RUN npm install` | Execute at build time |
| Environment | `ENV` | `ENV NODE_ENV=production` | Set environment variables |
| Expose Port | `EXPOSE` | `EXPOSE 3000` | Document exposed ports |
| User | `USER` | `USER node` | Run as non-root user |
| Entrypoint | `ENTRYPOINT` | `ENTRYPOINT ["node", "app.js"]` | Main executable |
| Command | `CMD` | `CMD ["serve"]` | Default arguments |
| **Best Practices** | | | |
| Multi-stage | Use stages | `FROM ... AS builder` | Separate build/runtime |
| Layer Order | Least to most changing | Dependencies before source | Optimize caching |
| `.dockerignore` | Always use | `.git`, `node_modules` | Exclude unnecessary files |
| Combine RUN | Chain commands | `RUN apt-get update && \` | Reduce layers |
| Security | Non-root user | `USER node` | Never run as root |
| **File Naming** | | | |
| Standard | `Dockerfile` | `Dockerfile` | No extension |
| Multi-stage | `Dockerfile.{env}` | `Dockerfile.prod` | Environment-specific |
| **Common Patterns** | | | |
| Node.js | Copy package.json first | `COPY package*.json ./` | Cache dependencies |
| Python | Copy requirements first | `COPY requirements.txt ./` | Cache dependencies |
| Go | Multi-stage build | `FROM golang AS builder` | Small final image |

---

## Basic Structure

### Simple Dockerfile

```dockerfile
## Syntax version (optional but recommended)
## syntax=docker/dockerfile:1

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
```

---

## FROM Instruction

### Always Pin Base Image Versions

```dockerfile
## Good - Pinned to specific version
FROM node:18.19-alpine3.19

## Avoid - Using latest or unpinned versions
FROM node:latest
FROM node:18
```

### Multi-Stage Builds

```dockerfile
## Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

## Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## WORKDIR Instruction

Always use `WORKDIR` instead of `RUN cd`:

```dockerfile
## Good - Using WORKDIR
WORKDIR /app
COPY . .

## Bad - Using cd
RUN cd /app
COPY . .
```

---

## COPY vs ADD

### Use COPY for Local Files

```dockerfile
## Good - COPY for local files
COPY package.json ./
COPY src/ ./src/

## Avoid - ADD has implicit extraction behavior
ADD package.json ./
```

### Use ADD Only for URLs or Tar Extraction

```dockerfile
## ADD for remote URLs (but prefer RUN wget/curl for better control)
ADD https://example.com/file.tar.gz /tmp/

## ADD for automatic tar extraction
ADD archive.tar.gz /opt/
```

---

## RUN Instruction

### Combine Commands to Reduce Layers

```dockerfile
## Good - Single layer
RUN apt-get update && \
    apt-get install -y \
      curl \
      git \
      vim && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

## Avoid - Multiple layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get install -y vim
```

### Clean Up in Same Layer

```dockerfile
## Good - Clean up in same RUN instruction
RUN apt-get update && \
    apt-get install -y build-essential && \
    make && \
    apt-get remove -y build-essential && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

## Bad - Clean up in separate layer (doesn't reduce image size)
RUN apt-get update
RUN apt-get install -y build-essential
RUN make
RUN apt-get remove -y build-essential
```

---

## ENV Instruction

```dockerfile
## Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

## Path variables
ENV PATH="/app/node_modules/.bin:${PATH}"
```

---

## EXPOSE Instruction

```dockerfile
## Document exposed ports
EXPOSE 3000
EXPOSE 8080/tcp
EXPOSE 8081/udp
```

---

## USER Instruction

### Always Run as Non-Root User

```dockerfile
## Good - Create and use non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

## Bad - Running as root (default)
## (no USER instruction)
```

---

## Multi-Stage Build Examples

### Node.js Application

```dockerfile
## syntax=docker/dockerfile:1

## Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && \
    npm prune --production

## Production stage
FROM node:18-alpine AS production
WORKDIR /app

## Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

## Copy files with correct ownership
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/index.js"]
```

### Python Application

```dockerfile
## syntax=docker/dockerfile:1

## Build stage
FROM python:3.11-slim AS builder
WORKDIR /app

## Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev && \
    rm -rf /var/lib/apt/lists/*

## Install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

## Production stage
FROM python:3.11-slim AS production
WORKDIR /app

## Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libpq5 && \
    rm -rf /var/lib/apt/lists/*

## Create non-root user
RUN useradd -m -u 1001 appuser

## Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

## Copy application code
COPY --chown=appuser:appuser . .

USER appuser

ENV PATH="/home/appuser/.local/bin:${PATH}" \
    PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD python healthcheck.py

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Go Application

```dockerfile
## syntax=docker/dockerfile:1

## Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app

## Install build dependencies
RUN apk add --no-cache git

## Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

## Copy source code
COPY . .

## Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

## Production stage
FROM alpine:3.19 AS production
WORKDIR /app

## Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

## Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

## Copy binary from builder
COPY --from=builder --chown=appuser:appuser /app/main .

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./main"]
```

---

## .dockerignore

Always create a `.dockerignore` file:

```dockerignore
## Git
.git
.gitignore

## Node.js
node_modules
npm-debug.log

## Python
__pycache__
*.py[cod]
*$py.class
.Python
venv/
.env

## Build artifacts
dist
build
*.o
*.so

## IDE
.vscode
.idea
*.swp
*.swo

## Documentation
*.md
docs/

## Tests
tests/
*.test.js

## CI/CD
.github
.gitlab-ci.yml
Jenkinsfile

## Docker
Dockerfile*
docker-compose*.yml
```

---

## Testing

### Testing with Container Structure Test

Use [Container Structure Test](https://github.com/GoogleContainerTools/container-structure-test) to validate Docker images:

```bash
## Install Container Structure Test
curl -LO https://storage.googleapis.com/container-structure-test/latest/container-structure-test-linux-amd64
chmod +x container-structure-test-linux-amd64
sudo mv container-structure-test-linux-amd64 /usr/local/bin/container-structure-test
```

### Test Configuration

Create `container-structure-test.yaml`:

```yaml
schemaVersion: 2.0.0

## Command tests - verify installed packages
commandTests:
  - name: "node version"
    command: "node"
    args: ["--version"]
    expectedOutput: ["v18.*"]

  - name: "npm is installed"
    command: "which"
    args: ["npm"]
    exitCode: 0

  - name: "application exists"
    command: "test"
    args: ["-f", "/app/dist/index.js"]
    exitCode: 0

## File existence tests
fileExistenceTests:
  - name: "application directory"
    path: "/app"
    shouldExist: true
    permissions: "drwxr-xr-x"

  - name: "package.json exists"
    path: "/app/package.json"
    shouldExist: true

  - name: "no secrets in image"
    path: "/app/.env"
    shouldExist: false

## File content tests
fileContentTests:
  - name: "package.json has correct version"
    path: "/app/package.json"
    expectedContents: ['"version": "1.0.0"']

## Metadata tests
metadataTest:
  env:
    - key: "NODE_ENV"
      value: "production"
    - key: "PORT"
      value: "3000"

  exposedPorts: ["3000"]

  workdir: "/app"

  ## Verify non-root user
  user: "nodejs"

  labels:
    - key: "org.opencontainers.image.title"
      value: "My Application"
```

### Running Structure Tests

```bash
## Test a locally built image
container-structure-test test \
  --image myapp:latest \
  --config container-structure-test.yaml

## Test with verbose output
container-structure-test test \
  --image myapp:latest \
  --config container-structure-test.yaml \
  --verbosity debug

## Test multiple config files
container-structure-test test \
  --image myapp:latest \
  --config test-base.yaml \
  --config test-security.yaml
```

### Testing with Trivy

Test for vulnerabilities and misconfigurations:

```bash
## Scan for vulnerabilities
trivy image myapp:latest

## Scan with specific severity
trivy image --severity HIGH,CRITICAL myapp:latest

## Scan Dockerfile for misconfigurations
trivy config Dockerfile

## Generate JSON report
trivy image --format json --output results.json myapp:latest

## Fail build on high/critical vulnerabilities
trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest
```

### Testing with hadolint

Lint Dockerfiles for best practices:

```bash
## Basic linting
hadolint Dockerfile

## Lint with specific format
hadolint --format json Dockerfile

## Lint in CI/CD
hadolint Dockerfile || exit 1
```

### Integration Testing with Docker Compose

Test multi-container applications:

```yaml
## docker-compose.test.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@db:5432/test
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 3s
      retries: 5

  test:
    build:
      context: .
      target: builder
    command: npm test
    environment:
      - DATABASE_URL=postgresql://test:test@db:5432/test
    depends_on:
      db:
        condition: service_healthy
```

Run integration tests:

```bash
## Run tests with docker-compose
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

## Clean up after tests
docker-compose -f docker-compose.test.yml down -v
```

### Runtime Testing with BATS

Test container behavior at runtime:

```bash
## tests/docker-runtime.bats
#!/usr/bin/env bats

setup() {
  # Start container for testing
  docker run -d --name test-app -p 3000:3000 myapp:latest
  sleep 5  # Wait for startup
}

teardown() {
  # Clean up
  docker stop test-app
  docker rm test-app
}

@test "container starts successfully" {
  run docker ps --filter "name=test-app" --format "{{.Status}}"
  [[ "$output" =~ "Up" ]]
}

@test "application responds to HTTP requests" {
  run curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health
  [ "$output" = "200" ]
}

@test "container runs as non-root user" {
  run docker exec test-app whoami
  [ "$output" = "nodejs" ]
}

@test "container has minimal attack surface" {
  # Verify no shell in distroless images
  run docker exec test-app sh -c "exit 0"
  [ "$status" -ne 0 ]
}

@test "application logs are accessible" {
  run docker logs test-app
  [[ "$output" =~ "Server started on port 3000" ]]
}
```

### CI/CD Integration

```yaml
## .github/workflows/docker-test.yml
name: Docker Build and Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile

      - name: Build image
        run: docker build -t myapp:test .

      - name: Run Trivy vulnerability scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:test
          format: sarif
          output: trivy-results.sarif

      - name: Install Container Structure Test
        run: |
          curl -LO https://storage.googleapis.com/container-structure-test/latest/container-structure-test-linux-amd64
          chmod +x container-structure-test-linux-amd64
          sudo mv container-structure-test-linux-amd64 /usr/local/bin/container-structure-test

      - name: Run structure tests
        run: |
          container-structure-test test \
            --image myapp:test \
            --config container-structure-test.yaml

      - name: Test image size
        run: |
          size=$(docker image inspect myapp:test --format='{{.Size}}')
          max_size=$((500 * 1024 * 1024))  # 500MB
          if [ "$size" -gt "$max_size" ]; then
            echo "Image too large: $(($size / 1024 / 1024))MB"
            exit 1
          fi

      - name: Test container startup
        run: |
          docker run -d --name test-container -p 3000:3000 myapp:test
          sleep 5
          curl -f http://localhost:3000/health || exit 1
          docker stop test-container
```

### Security Testing

Test for security best practices:

```yaml
## tests/security-tests.yaml
schemaVersion: 2.0.0

commandTests:
  - name: "runs as non-root"
    command: "whoami"
    expectedOutput: ["nodejs|appuser|node"]
    excludedOutput: ["root"]

  - name: "no write permissions on system directories"
    command: "test"
    args: ["-w", "/usr"]
    exitCode: 1

  - name: "no unnecessary tools installed"
    command: "which"
    args: ["wget"]
    exitCode: 1

fileExistenceTests:
  - name: "no .git directory"
    path: "/app/.git"
    shouldExist: false

  - name: "no environment files"
    path: "/app/.env"
    shouldExist: false

  - name: "no node_modules in final image"
    path: "/app/node_modules"
    shouldExist: false  # For compiled apps

metadataTest:
  ## Ensure running as non-root
  user: "nodejs"

  ## No hardcoded secrets in env
  envVars:
    - key: "API_KEY"
      isSet: false
    - key: "DB_PASSWORD"
      isSet: false
```

### Image Layer Analysis

Use Dive to analyze image layers:

```bash
## Install dive
wget https://github.com/wagoodman/dive/releases/download/v0.11.0/dive_0.11.0_linux_amd64.deb
sudo apt install ./dive_0.11.0_linux_amd64.deb

## Analyze image layers
dive myapp:latest

## CI mode with efficiency threshold
dive myapp:latest --ci --lowestEfficiency=0.95
```

### Performance Testing

Test build and runtime performance:

```bash
## tests/performance.sh
#!/bin/bash

## Build time test
start_time=$(date +%s)
docker build -t myapp:test .
end_time=$(date +%s)
build_time=$((end_time - start_time))

echo "Build time: ${build_time}s"
if [ "$build_time" -gt 300 ]; then
  echo "Build taking too long (>5 minutes)"
  exit 1
fi

## Image size test
size=$(docker image inspect myapp:test --format='{{.Size}}' | numfmt --to=iec)
echo "Image size: $size"

## Startup time test
start_time=$(date +%s)
docker run -d --name perf-test myapp:test
while ! docker exec perf-test curl -s http://localhost:3000/health > /dev/null 2>&1; do
  sleep 1
done
end_time=$(date +%s)
startup_time=$((end_time - start_time))

echo "Startup time: ${startup_time}s"

docker stop perf-test
docker rm perf-test

if [ "$startup_time" -gt 30 ]; then
  echo "Startup too slow (>30 seconds)"
  exit 1
fi
```

---

## Security Best Practices

### Scan for Vulnerabilities

```bash
## Scan image with Trivy
trivy image myapp:latest

## Scan image with Grype
grype myapp:latest

## Scan with Docker Scout
docker scout cves myapp:latest
```

### Use Minimal Base Images

```dockerfile
## Good - Minimal alpine image
FROM node:18-alpine

## Good - Distroless image (even smaller, no shell)
FROM gcr.io/distroless/nodejs18-debian11

## Avoid - Full Debian/Ubuntu images
FROM node:18
FROM ubuntu:22.04
```

### Don't Store Secrets in Images

```dockerfile
## Bad - Secret in ENV
ENV DB_PASSWORD=supersecret

## Bad - Secret in file
COPY .env .

## Good - Use runtime secrets
## Pass via environment variables at runtime
## docker run -e DB_PASSWORD=$DB_PASSWORD myapp
```

---

## HEALTHCHECK

```dockerfile
## HTTP health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

## TCP health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD nc -z localhost 3000 || exit 1

## Custom script
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js
```

---

## Labels

```dockerfile
LABEL org.opencontainers.image.title="My Application" \
      org.opencontainers.image.description="A sample application" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="Tyler Dukes <tyler@example.com>" \
      org.opencontainers.image.url="https://example.com" \
      org.opencontainers.image.source="https://github.com/myorg/myapp" \
      org.opencontainers.image.licenses="MIT"
```

---

## Anti-Patterns

### ❌ Avoid: Running as Root

```dockerfile
## Bad - Running as root
FROM node:18-alpine
COPY . /app
CMD ["node", "index.js"]

## Good - Non-root user
FROM node:18-alpine
RUN adduser -D appuser
USER appuser
COPY . /app
CMD ["node", "index.js"]
```

### ❌ Avoid: Using latest Tag

```dockerfile
## Bad - Unpredictable builds
FROM node:latest

## Good - Pinned version
FROM node:18.19-alpine3.19
```

### ❌ Avoid: Installing Unnecessary Packages

```dockerfile
## Bad - Installing unnecessary packages
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    curl \
    vim \
    nano

## Good - Only install what's needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && \
    rm -rf /var/lib/apt/lists/*
```

### ❌ Avoid: Multiple RUN Commands for Package Install

```dockerfile
## Bad - Creates multiple layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get clean

## Good - Single layer with cleanup
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

### ❌ Avoid: Copying Entire Context

```dockerfile
## Bad - Copies everything including .git, node_modules, etc.
FROM node:18-alpine
COPY . /app

## Good - Use .dockerignore and copy selectively
## .dockerignore:
## node_modules
## .git
## .env
## *.md

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY public/ ./public/
```

### ❌ Avoid: Not Using Multi-Stage Builds

```dockerfile
## Bad - Build tools remain in final image
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install  # Includes dev dependencies
COPY . .
RUN npm run build
CMD ["npm", "start"]

## Good - Multi-stage build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
USER node
CMD ["node", "dist/index.js"]
```

### ❌ Avoid: Exposing Secrets in Build

```dockerfile
## Bad - Secrets in image layers
FROM node:18-alpine
WORKDIR /app
COPY .env .env  # ❌ Secret file in image!
RUN echo "API_KEY=secret123" > config.txt  # ❌ In layer history!

## Good - Use build secrets (Docker BuildKit)
## syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /app
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install private-package

## Or use build args (for non-sensitive config)
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
```

---

## Building and Tagging

```bash
## Build with tag
docker build -t myapp:1.0.0 .

## Build with multiple tags
docker build -t myapp:1.0.0 -t myapp:latest .

## Build with build args
docker build --build-arg NODE_ENV=production -t myapp:1.0.0 .

## Build with target stage
docker build --target production -t myapp:1.0.0 .

## Build with platform
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:1.0.0 .
```

---

## Tool Configurations

### hadolint Configuration

`.hadolint.yaml`:

```yaml
ignored:
  - DL3008  # Pin versions in apt-get install
  - DL3013  # Pin versions in pip

trustedRegistries:
  - docker.io
  - gcr.io

```

### Running hadolint

```bash
## Lint Dockerfile
hadolint Dockerfile

## Lint with custom config
hadolint --config .hadolint.yaml Dockerfile

## Output as JSON
hadolint --format json Dockerfile
```

---

## References

### Official Documentation

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)

### Security

- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

### Tools

- [hadolint](https://github.com/hadolint/hadolint) - Dockerfile linter
- [Trivy](https://trivy.dev/) - Vulnerability scanner
- [Dive](https://github.com/wagoodman/dive) - Image layer analyzer

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
