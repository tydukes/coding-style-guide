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
