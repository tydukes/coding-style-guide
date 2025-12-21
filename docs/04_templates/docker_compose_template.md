---
title: "Docker Compose Template"
description: "Comprehensive Docker Compose templates for multi-container applications"
author: "Tyler Dukes"
tags: [docker-compose, containers, orchestration, microservices]
category: "Templates"
status: "active"
---
<!-- markdownlint-disable MD024 -->

## Overview

This document provides comprehensive Docker Compose templates for orchestrating multi-container applications.
Docker Compose simplifies the management of multi-container environments for development, testing, and production.

---

## Full-Stack Web Application

```yaml
version: '3.8'

services:
  # Frontend service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_URL=http://backend:8000
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  # Backend service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@database:5432/appdb
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./backend/logs:/app/logs
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

  # PostgreSQL database
  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=appdb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d:ro
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx reverse proxy
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

---

## Development Environment

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DEBUG=*
    volumes:
      # Mount source code for hot reload
      - ./src:/app/src
      - ./public:/app/public
      # Use named volume for node_modules
      - node_modules:/app/node_modules
    command: npm run dev
    networks:
      - dev-network
    stdin_open: true
    tty: true

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=devdb
      - POSTGRES_USER=devuser
      - POSTGRES_PASSWORD=devpass
    ports:
      # Expose database port for local tools
      - "5432:5432"
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
    networks:
      - dev-network

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - dev-network

networks:
  dev-network:

volumes:
  node_modules:
  postgres-dev-data:
```

---

## Microservices Architecture

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8080:8080"
    environment:
      - SERVICE_AUTH_URL=http://auth-service:8001
      - SERVICE_USER_URL=http://user-service:8002
      - SERVICE_ORDER_URL=http://order-service:8003
    depends_on:
      - auth-service
      - user-service
      - order-service
    networks:
      - frontend-network
      - backend-network
    restart: unless-stopped

  # Authentication service
  auth-service:
    build: ./services/auth
    environment:
      - DB_HOST=auth-db
      - REDIS_HOST=redis
    depends_on:
      auth-db:
        condition: service_healthy
    networks:
      - backend-network
      - auth-network
    restart: unless-stopped

  auth-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=authdb
      - POSTGRES_PASSWORD=${AUTH_DB_PASSWORD}
    volumes:
      - auth-db-data:/var/lib/postgresql/data
    networks:
      - auth-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s

  # User service
  user-service:
    build: ./services/user
    environment:
      - DB_HOST=user-db
    depends_on:
      user-db:
        condition: service_healthy
    networks:
      - backend-network
      - user-network
    restart: unless-stopped

  user-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=userdb
      - POSTGRES_PASSWORD=${USER_DB_PASSWORD}
    volumes:
      - user-db-data:/var/lib/postgresql/data
    networks:
      - user-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s

  # Order service
  order-service:
    build: ./services/order
    environment:
      - DB_HOST=order-db
      - RABBITMQ_HOST=rabbitmq
    depends_on:
      order-db:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - backend-network
      - order-network
    restart: unless-stopped

  order-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=orderdb
      - POSTGRES_PASSWORD=${ORDER_DB_PASSWORD}
    volumes:
      - order-db-data:/var/lib/postgresql/data
    networks:
      - order-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s

  # Message queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD}
    ports:
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - backend-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Shared Redis cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - backend-network
    restart: unless-stopped

networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
  auth-network:
    driver: bridge
  user-network:
    driver: bridge
  order-network:
    driver: bridge

volumes:
  auth-db-data:
  user-db-data:
  order-db-data:
  rabbitmq-data:
  redis-data:
```

---

## Production Configuration

```yaml
version: '3.8'

services:
  app:
    image: myapp:${VERSION:-latest}
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        max_attempts: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    secrets:
      - db_password
      - api_key
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - prod-network

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    volumes:
      - type: volume
        source: postgres-data
        target: /var/lib/postgresql/data
        volume:
          nocopy: true
    secrets:
      - db_password
    deploy:
      placement:
        constraints:
          - node.role == manager
    networks:
      - prod-network

secrets:
  db_password:
    external: true
  api_key:
    external: true

networks:
  prod-network:
    driver: overlay
    attachable: true

volumes:
  postgres-data:
    driver: local
```

---

## Development with Override

### docker-compose.yml (Base)

```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@database/appdb
    networks:
      - app-network

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=appdb
      - POSTGRES_PASSWORD=postgres
    networks:
      - app-network

networks:
  app-network:
```

### docker-compose.override.yml (Development)

```yaml
version: '3.8'

services:
  app:
    build:
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
    command: npm run dev

  database:
    ports:
      - "5432:5432"
```

### docker-compose.prod.yml (Production)

```yaml
version: '3.8'

services:
  app:
    build:
      target: production
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"

  database:
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

---

## Common Patterns

### Using YAML Anchors

```yaml
version: '3.8'

x-logging: &default-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

x-healthcheck: &default-healthcheck
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s

services:
  frontend:
    build: ./frontend
    logging: *default-logging
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "wget", "--spider", "http://localhost:3000"]

  backend:
    build: ./backend
    logging: *default-logging
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
```

### Environment-Specific Variables

```yaml
version: '3.8'

services:
  app:
    image: myapp:${TAG:-latest}
    environment:
      - ENV=${ENVIRONMENT:-development}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - MAX_CONNECTIONS=${MAX_CONNECTIONS:-100}
    ports:
      - "${APP_PORT:-3000}:3000"
```

### Build Arguments

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - BUILD_DATE=${BUILD_DATE}
        - VERSION=${VERSION}
        - NODE_VERSION=20
      cache_from:
        - myapp:latest
      labels:
        - "com.example.version=${VERSION}"
        - "com.example.build-date=${BUILD_DATE}"
```

---

## Best Practices

### Health Checks

```yaml
services:
  # HTTP health check
  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  # Database health check
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis health check
  redis:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
          pids: 100
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Logging Configuration

```yaml
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
        labels: "app,environment"
        env: "APP_NAME,ENVIRONMENT"

  # Syslog driver
  syslog-app:
    logging:
      driver: syslog
      options:
        syslog-address: "tcp://192.168.0.42:123"
        tag: "{{.Name}}/{{.ID}}"

  # Fluentd driver
  fluentd-app:
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: docker.{{.Name}}
```

### Secrets Management

```yaml
version: '3.8'

services:
  app:
    secrets:
      - source: db_password
        target: /run/secrets/db_password
        mode: 0400
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt

  # For production with Docker Swarm
  api_key:
    external: true
```

---

## Anti-Patterns

### ❌ Avoid: Exposing All Ports

```yaml
## Bad - Exposes database to host
services:
  database:
    ports:
      - "5432:5432"  # Don't expose in production

## Good - Use networks for internal communication
services:
  database:
    expose:
      - 5432
    networks:
      - backend
```

### ❌ Avoid: Using :latest Tag

```yaml
## Bad - Unpredictable versions
services:
  app:
    image: myapp:latest

## Good - Pin specific versions
services:
  app:
    image: myapp:1.2.3
```

### ❌ Avoid: Hardcoded Secrets

```yaml
## Bad - Secrets in plain text
environment:
  - DB_PASSWORD=supersecret123

## Good - Use environment variables or secrets
environment:
  - DB_PASSWORD=${DB_PASSWORD}
secrets:
  - db_password
```

### ❌ Avoid: Missing Restart Policies

```yaml
## Bad - Service won't restart on failure
services:
  app:
    build: .

## Good - Define restart policy
services:
  app:
    build: .
    restart: unless-stopped
```

---

## Useful Commands

```bash
## Start services
docker-compose up -d

## Start with specific file
docker-compose -f docker-compose.prod.yml up -d

## View logs
docker-compose logs -f app

## Execute command in running container
docker-compose exec app bash

## Scale services
docker-compose up -d --scale worker=3

## Rebuild and start
docker-compose up -d --build

## Stop and remove containers
docker-compose down

## Stop and remove with volumes
docker-compose down -v

## Validate compose file
docker-compose config

## Check service status
docker-compose ps

## View resource usage
docker-compose top
```

---

## .env Template

```bash
## Application
APP_NAME=myapp
ENVIRONMENT=production
VERSION=1.0.0

## Database
DB_PASSWORD=changeme
DB_NAME=appdb
DB_USER=postgres

## Redis
REDIS_PASSWORD=changeme

## Secrets
SECRET_KEY=changeme
API_KEY=changeme

## Ports
APP_PORT=3000
DB_PORT=5432

## Resource Limits
CPU_LIMIT=2.0
MEMORY_LIMIT=2G
```

---

## References

### Official Documentation

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Compose CLI Reference](https://docs.docker.com/compose/reference/)

### Best Practices

- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [Docker Compose for Production](https://docs.docker.com/compose/production/)

### Tools

- [docker-compose-viz](https://github.com/pmsipilot/docker-compose-viz) - Visualize compose files
- [composerize](https://www.composerize.com/) - Convert docker run to compose

---

**Status**: Active
