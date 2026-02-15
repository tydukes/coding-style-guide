---
title: "Dockerfile Style Guide"
description: "Docker container image standards for secure, efficient, and maintainable container builds"
author: "Tyler Dukes"
tags: [docker, dockerfile, containers, devops, security]
category: "Language Guides"
status: "active"
search_keywords: [dockerfile, docker, containers, images, multi-stage, layers, build, best practices]
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

## Common Pitfalls

### Layer Caching Invalidation

**Issue**: Placing frequently changing files (source code) before rarely changing files
(dependencies) invalidates cache on every build, dramatically increasing build times.

**Example**:

```dockerfile
## Bad - Source code copied before dependencies
FROM node:20-alpine
WORKDIR /app
COPY . .  # Invalidates cache every time code changes!
RUN npm install  # Re-downloads all dependencies every build
```

**Solution**: Copy dependency files first, install, then copy source code.

```dockerfile
## Good - Dependencies cached separately from source
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./  # Copy dependency manifest first
RUN npm ci --only=production  # Install dependencies (cached)
COPY . .  # Copy source code last
```

**Key Points**:

- Order instructions from least to most frequently changing
- Dependencies (package.json) change less than source code
- Each changed layer invalidates all subsequent layers
- Use `.dockerignore` to exclude unnecessary files

### Multi-Stage Build ARG Scope

**Issue**: ARG variables don't persist across build stages unless redeclared, causing build failures.

**Example**:

```dockerfile
## Bad - ARG not available in second stage
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS builder
RUN node --version

FROM node:${NODE_VERSION}-alpine  # Error: NODE_VERSION undefined!
```

**Solution**: Redeclare ARG in each stage that needs it.

```dockerfile
## Good - ARG redeclared per stage
ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS builder
RUN node --version

FROM node:${NODE_VERSION}-alpine  # Works! ARG redeclared above
ARG NODE_VERSION  # Can reuse without value (uses global)
RUN node --version
```

**Key Points**:

- ARG scope is per-stage in multi-stage builds
- Redeclare ARG in each stage that needs it
- Global ARGs (before first FROM) can be referenced without value
- ENV persists across stages, ARG does not

### COPY vs ADD Confusion

**Issue**: Using ADD when COPY is sufficient adds unnecessary magic behavior and security risks.

**Example**:

```dockerfile
## Bad - ADD auto-extracts, can fetch URLs
ADD https://example.com/file.tar.gz /app/  # Security risk: executes remote code!
ADD local-archive.tar.gz /app/  # Auto-extracts (implicit behavior)
```

**Solution**: Use COPY for local files, explicit RUN for extraction/downloads.

```dockerfile
## Good - Explicit and secure
COPY local-archive.tar.gz /tmp/
RUN tar -xzf /tmp/local-archive.tar.gz -C /app/ && rm /tmp/local-archive.tar.gz

## Good - Explicit download with verification
RUN curl -fsSL https://example.com/file.tar.gz -o /tmp/file.tar.gz \
 && echo "expected-sha256  /tmp/file.tar.gz" | sha256sum -c - \
 && tar -xzf /tmp/file.tar.gz -C /app/ \
 && rm /tmp/file.tar.gz
```

**Key Points**:

- Use COPY for all local files
- ADD auto-extracts tar/gz files (implicit behavior)
- ADD can fetch remote URLs (security risk)
- Only use ADD when auto-extraction is explicitly desired

### Health Check Missing

**Issue**: Containers report as "running" even when application is crashed or hung, causing failed requests.

**Example**:

```dockerfile
## Bad - No health check
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "server.js"]
# Container shows "Up" even if server crashes!
```

**Solution**: Add HEALTHCHECK to verify application is responding.

```dockerfile
## Good - Health check validates application
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "server.js"]
```

```javascript
// healthcheck.js
const http = require('http');
const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 };
const req = http.request(options, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', () => process.exit(1));
req.end();
```

**Key Points**:

- HEALTHCHECK verifies application is responding
- Container status reflects health, not just process existence
- Configure appropriate interval, timeout, retries
- Kubernetes uses liveness/readiness probes instead
- Health endpoint should check dependencies (database, cache)

### Build-Time Secrets Leakage

**Issue**: ARG and ENV values are baked into image layers, exposing secrets in image history.

**Example**:

```dockerfile
## Bad - Secret stored in image layer!
FROM node:20-alpine
ARG NPM_TOKEN  # Secret visible in docker history!
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc \
 && npm install \
 && rm .npmrc  # Too late! Token already in image layer
```

**Solution**: Use build secrets with BuildKit (--secret flag).

```dockerfile
## Good - Secret not stored in image
## syntax=docker/dockerfile:1
FROM node:20-alpine
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install --only=production
# Secret mounted at build time, not stored in layer
```

```bash
## Build with secret
docker buildx build --secret id=npmrc,src=.npmrc -t myapp .
```

**Key Points**:

- ARG and ENV values are stored in image layers
- Removing secrets in same/later RUN doesn't remove from history
- Use BuildKit `--mount=type=secret` for build-time secrets
- Multi-stage builds: copy artifacts, not secrets
- Never commit secrets to Dockerfile or repository

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

## Best Practices

### Use Multi-Stage Builds

Separate build and runtime dependencies to minimize final image size:

```dockerfile
# Build stage with all development tools
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run test

# Production stage with only runtime dependencies
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
RUN npm ci --only=production
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Optimize Layer Caching

Order instructions from least to most frequently changing:

```dockerfile
# Good - Dependencies cached separately
FROM python:3.11-slim
WORKDIR /app

# 1. Copy dependency files first (change infrequently)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy source code last (changes frequently)
COPY . .

# Bad - Invalidates cache on every code change
# COPY . .
# RUN pip install -r requirements.txt
```

### Always Use .dockerignore

Exclude unnecessary files from build context:

```dockerignore
# Version control
.git
.gitignore
.gitattributes

# Dependencies
node_modules
__pycache__
*.pyc
venv/

# Build artifacts
dist
build
*.o
*.so

# IDE and editor files
.vscode
.idea
*.swp
*.swo
.DS_Store

# Documentation
*.md
docs/
LICENSE

# Tests
tests/
*.test.js
coverage/

# CI/CD
.github
.gitlab-ci.yml
Jenkinsfile

# Environment files
.env
.env.*
*.local

# Docker files
Dockerfile*
docker-compose*.yml
.dockerignore
```

### Choose Minimal Base Images

Use slim or distroless images to reduce attack surface:

```dockerfile
# Good - Alpine (minimal)
FROM node:20-alpine

# Good - Distroless (no shell, smallest attack surface)
FROM gcr.io/distroless/nodejs20-debian12

# Good - Slim (smaller than default)
FROM python:3.11-slim

# Avoid - Full images (large, unnecessary packages)
FROM node:20
FROM python:3.11
FROM ubuntu:22.04
```

### Pin Specific Versions

Always pin base image versions for reproducible builds:

```dockerfile
# Good - Fully pinned
FROM node:20.11.1-alpine3.19
FROM python:3.11.8-slim-bookworm

# Acceptable - Major.minor pinned
FROM node:20-alpine
FROM python:3.11-slim

# Bad - Unpredictable
FROM node:latest
FROM python:3
```

### Combine RUN Commands

Reduce layers and image size by chaining commands:

```dockerfile
# Good - Single layer with cleanup
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get purge -y --auto-remove build-essential && \
    rm -rf /var/lib/apt/lists/*

# Bad - Multiple layers, no cleanup
RUN apt-get update
RUN apt-get install -y build-essential libpq-dev
RUN pip install -r requirements.txt
RUN apt-get remove -y build-essential
```

### Run Containers as Non-Root User

Create and use a non-root user for security:

```dockerfile
# Node.js - use built-in node user
FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "index.js"]

# Python - create custom user
FROM python:3.11-slim
WORKDIR /app
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app
COPY --chown=appuser:appuser . .
USER appuser
CMD ["python", "app.py"]

# Alpine - create user with adduser
FROM alpine:3.19
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser
```

### Use BuildKit Secrets

Never store secrets in image layers:

```dockerfile
# syntax=docker/dockerfile:1

# Good - Secrets mounted at build time, not stored
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci --only=production

# Build with: docker buildx build --secret id=npmrc,src=.npmrc -t myapp .
```

```dockerfile
# Bad - Secret stored in image layer
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && \
    npm install && \
    rm .npmrc  # Too late! Token already in layer
```

### Add Health Checks

Include health checks to monitor container status:

```dockerfile
# HTTP health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# TCP health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD nc -z localhost 3000 || exit 1

# Custom health check script
COPY healthcheck.sh /usr/local/bin/
HEALTHCHECK --interval=30s --timeout=3s \
  CMD /usr/local/bin/healthcheck.sh
```

### Use Metadata Labels

Add OCI-compliant labels for documentation:

```dockerfile
LABEL org.opencontainers.image.title="My Application" \
      org.opencontainers.image.description="Production-ready web service" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="team@example.com" \
      org.opencontainers.image.url="https://example.com" \
      org.opencontainers.image.source="https://github.com/org/repo" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"
```

### Leverage Build Cache Mounts

Use cache mounts for package managers:

```dockerfile
# syntax=docker/dockerfile:1

# Python - cache pip packages
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Node.js - cache npm packages
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Go - cache modules
FROM golang:1.21-alpine
WORKDIR /app
COPY go.* ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
```

### Minimize Image Size

Use techniques to keep images small:

```dockerfile
# 1. Use minimal base images
FROM python:3.11-slim  # Not python:3.11

# 2. Clean up package manager cache
RUN apt-get update && \
    apt-get install -y --no-install-recommends pkg && \
    rm -rf /var/lib/apt/lists/*

# 3. Remove build dependencies after use
RUN apk add --no-cache --virtual .build-deps gcc musl-dev && \
    pip install package && \
    apk del .build-deps

# 4. Use --no-cache for package installations
RUN pip install --no-cache-dir package
RUN npm ci --only=production

# 5. Copy only necessary files
COPY --from=builder /app/dist ./dist  # Not COPY --from=builder /app ./
```

### Use COPY Instead of ADD

Prefer COPY for transparency:

```dockerfile
# Good - COPY for local files
COPY package.json ./
COPY src/ ./src/

# Bad - ADD has implicit behavior
ADD package.json ./  # Could auto-extract if it were a tar
ADD https://example.com/file.tar.gz /tmp/  # Fetches URL

# Only use ADD for explicit tar extraction
ADD archive.tar.gz /opt/  # Explicitly want auto-extraction
```

### Set Working Directory

Always use WORKDIR instead of cd:

```dockerfile
# Good - WORKDIR is persistent
WORKDIR /app
COPY . .
RUN npm install

# Bad - cd only affects single RUN
RUN cd /app  # Doesn't persist to next instruction
COPY . .  # Copies to wrong location!
```

### Avoid Installing Unnecessary Packages

Install only required dependencies:

```dockerfile
# Good - Minimal installation
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Bad - Installing unnecessary packages
RUN apt-get update && \
    apt-get install -y \
        ca-certificates \
        libpq5 \
        vim \
        curl \
        wget \
        git  # Not needed in production!
```

### Use Explicit Ports

Document exposed ports with EXPOSE:

```dockerfile
# Good - Document all exposed ports
EXPOSE 3000/tcp
EXPOSE 9090/tcp  # Metrics
EXPOSE 8080/udp  # Custom protocol

# Note: EXPOSE is documentation only
# Actual port publishing happens at runtime:
# docker run -p 3000:3000 myapp
```

### Regularly Scan Images for Vulnerabilities

Regularly scan images for security issues:

```bash
# Scan with Trivy
trivy image myapp:latest

# Scan with Grype
grype myapp:latest

# Fail CI on critical vulnerabilities
trivy image --exit-code 1 --severity CRITICAL myapp:latest
```

### Use Specific ENTRYPOINT and CMD

Use exec form for proper signal handling:

```dockerfile
# Good - Exec form (JSON array)
ENTRYPOINT ["python", "-m", "uvicorn"]
CMD ["main:app", "--host", "0.0.0.0", "--port", "8000"]

# Bad - Shell form (creates unnecessary shell process)
ENTRYPOINT python -m uvicorn
CMD main:app --host 0.0.0.0 --port 8000

# Combined usage allows runtime argument override
# docker run myapp main:app --reload  # Overrides CMD, keeps ENTRYPOINT
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

**Status**: Active
