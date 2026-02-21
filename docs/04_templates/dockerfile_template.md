---
title: "Dockerfile Template"
description: "Comprehensive multi-stage Dockerfile templates for containerized applications"
author: "Tyler Dukes"
tags: [docker, dockerfile, containers, multi-stage, security]
category: "Templates"
status: "active"
search_keywords: [dockerfile, template, container, docker, multi-stage, best practices]
---
<!-- markdownlint-disable MD024 -->

## Overview

This document provides comprehensive multi-stage Dockerfile templates for building optimized, secure container images
across all languages and frameworks. Multi-stage builds reduce image size, improve security, and enable better layer caching.

---

## Python Application

```dockerfile
## Multi-stage build for Python application
FROM python:3.12-slim AS builder

## Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

## Set working directory
WORKDIR /app

## Copy dependency files
COPY requirements.txt requirements-prod.txt ./

## Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements-prod.txt

## Production stage
FROM python:3.12-slim AS production

## Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

## Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

## Set working directory
WORKDIR /app

## Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

## Copy application code
COPY --chown=appuser:appuser . .

## Switch to non-root user
USER appuser

## Expose application port
EXPOSE 8000

## Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

## Run application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Node.js / TypeScript Application

```dockerfile
## Multi-stage build for Node.js/TypeScript application
FROM node:20-alpine AS builder

## Set working directory
WORKDIR /app

## Copy package files
COPY package*.json ./

## Install all dependencies (including dev dependencies)
RUN npm ci

## Copy source code
COPY . .

## Build TypeScript application
RUN npm run build

## Prune dev dependencies
RUN npm prune --production

## Production stage
FROM node:20-alpine AS production

## Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

## Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

## Set working directory
WORKDIR /app

## Copy built application and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

## Switch to non-root user
USER nodejs

## Expose application port
EXPOSE 3000

## Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

## Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

## Run application
CMD ["node", "dist/index.js"]
```

---

## Go Application

```dockerfile
## Multi-stage build for Go application
FROM golang:1.24-alpine AS builder

## Install build dependencies
RUN apk add --no-cache git ca-certificates

## Set working directory
WORKDIR /app

## Copy go mod files
COPY go.mod go.sum ./

## Download dependencies
RUN go mod download

## Copy source code
COPY . .

## Build application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a \
    -o /app/server \
    ./cmd/server

## Production stage - minimal image
FROM scratch AS production

## Copy CA certificates from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

## Copy binary from builder
COPY --from=builder /app/server /server

## Expose application port
EXPOSE 8080

## Health check (note: scratch doesn't have shell, so limited options)
## For health checks, consider using a sidecar or external monitoring

## Run application
ENTRYPOINT ["/server"]
```

---

## React / Next.js Application

```dockerfile
## Multi-stage build for React/Next.js application
FROM node:20-alpine AS dependencies

## Set working directory
WORKDIR /app

## Copy package files
COPY package*.json ./

## Install dependencies
RUN npm ci

## Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

## Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

## Copy application code
COPY . .

## Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

## Production stage
FROM node:20-alpine AS production

## Install dumb-init
RUN apk add --no-cache dumb-init

## Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

WORKDIR /app

## Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

## Set ownership
RUN chown -R nextjs:nodejs /app

## Switch to non-root user
USER nextjs

## Expose port
EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

## Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

## Run application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

---

## Django Application

```dockerfile
## Multi-stage build for Django application
FROM python:3.12-slim AS builder

## Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

## Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

## Copy dependency files
COPY requirements.txt ./

## Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

## Production stage
FROM python:3.12-slim AS production

## Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

## Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

## Create non-root user
RUN groupadd -r django && useradd -r -g django django

WORKDIR /app

## Copy installed packages
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

## Copy application code
COPY --chown=django:django . .

## Collect static files
RUN python manage.py collectstatic --noinput

## Switch to non-root user
USER django

## Expose port
EXPOSE 8000

## Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')"

## Run application with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "config.wsgi:application"]
```

---

## Nginx Static Site

```dockerfile
## Multi-stage build for static site
FROM node:20-alpine AS builder

WORKDIR /app

## Copy package files
COPY package*.json ./

## Install dependencies
RUN npm ci

## Copy source
COPY . .

## Build static site
RUN npm run build

## Production stage with nginx
FROM nginx:1.25-alpine AS production

## Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

## Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

## Create non-root user
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

## Set ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

## Make nginx run as non-root
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

## Switch to non-root user
USER nginx

## Expose port
EXPOSE 8080

## Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

## Run nginx
CMD ["nginx", "-g", "daemon off;"]
```

---

## Development vs Production

### Development Dockerfile

```dockerfile
## Development Dockerfile with hot reload
FROM node:20-alpine

WORKDIR /app

## Install dependencies
COPY package*.json ./
RUN npm install

## Copy source (will be overridden by volume mount)
COPY . .

## Expose port for development server
EXPOSE 3000

## Enable hot reload
CMD ["npm", "run", "dev"]
```

### Production Dockerfile

```dockerfile
## Production Dockerfile (optimized)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

USER nodejs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

---

## Best Practices

### Security

```dockerfile
## 1. Use specific version tags
FROM node:20.10.0-alpine  # Not :latest

## 2. Run as non-root user
RUN addgroup -g 1001 appgroup && adduser -S appuser -u 1001 -G appgroup
USER appuser

## 3. Scan for vulnerabilities
## Use tools like Trivy, Snyk, or Clair

## 4. Use minimal base images
FROM alpine:3.19  # Or scratch for Go apps

## 5. Don't include secrets
## Use build args or secret mounts instead
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install
```

### Optimization

```dockerfile
## 1. Leverage layer caching - copy dependencies first
COPY package*.json ./
RUN npm ci
COPY . .  # This changes more frequently

## 2. Use .dockerignore
## Create .dockerignore with:
## node_modules
## .git
## *.md

## 3. Multi-stage builds to reduce image size
FROM builder AS production  # Only copy what's needed

## 4. Combine RUN commands to reduce layers
RUN apt-get update && \
    apt-get install -y pkg1 pkg2 && \
    rm -rf /var/lib/apt/lists/*

## 5. Use --no-cache-dir for pip
RUN pip install --no-cache-dir -r requirements.txt
```

### Health Checks

```dockerfile
## HTTP health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

## Python health check (no curl)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

## Node.js health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

---

## Common Patterns

### Using Build Arguments

```dockerfile
ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim

ARG BUILD_DATE
ARG VERSION
ARG REVISION

LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}"
```

### Using Secrets During Build

```dockerfile
## Mount secrets without storing in layers
RUN --mount=type=secret,id=pip_config \
    pip config set global.index-url $(cat /run/secrets/pip_config) && \
    pip install -r requirements.txt
```

### Conditional Stages

```dockerfile
## Base stage
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

## Development stage
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

## Production stage
FROM base AS production
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]

## Build with: docker build --target production -t myapp:prod .
```

---

## .dockerignore Template

```dockerignore
## Version control
.git
.gitignore
.gitattributes

## CI/CD
.github
.gitlab-ci.yml
.travis.yml

## Dependencies
node_modules
venv
.venv

## Build artifacts
dist
build
target
*.pyc
__pycache__

## IDE
.vscode
.idea
*.swp
*.swo

## OS
.DS_Store
Thumbs.db

## Logs
*.log
logs

## Documentation
*.md
docs

## Tests
tests
__tests__
*.test.js
*.spec.js

## Environment files
.env
.env.local
.env.*.local

## Docker
Dockerfile*
docker-compose*.yml
.dockerignore
```

---

## Advanced Patterns

### Multi-Architecture Build

```dockerfile
## Build for multiple architectures
FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -o /app/server ./cmd/server

FROM alpine:3.19

COPY --from=builder /app/server /server

ENTRYPOINT ["/server"]

## Build with: docker buildx build --platform linux/amd64,linux/arm64 -t myapp .
```

### Using Cache Mounts

```dockerfile
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

## Use cache mount for go modules
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

## Use cache mount for build cache
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -o /app/server ./cmd/server
```

---

## References

### Official Documentation

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

### Security

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Snyk Docker Security](https://snyk.io/learn/docker-security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

### Tools

- [Hadolint](https://github.com/hadolint/hadolint) - Dockerfile linter
- [Dive](https://github.com/wagoodman/dive) - Image layer analysis
- [Trivy](https://github.com/aquasecurity/trivy) - Vulnerability scanner
- [Docker Slim](https://github.com/docker-slim/docker-slim) - Image optimizer

---

**Status**: Active
