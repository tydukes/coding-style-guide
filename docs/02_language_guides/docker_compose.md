---
title: "Docker Compose Style Guide"
description: "Docker Compose standards for multi-container application orchestration and development environments"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [docker-compose, docker, containers, orchestration, devops]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**Docker Compose** is a tool for defining and running multi-container Docker applications. With Compose, you use a
YAML file to configure your application's services, networks, and volumes. This guide covers Docker Compose best
practices for maintainable, production-ready container orchestration.

### Key Characteristics

- **File Name**: `docker-compose.yml` or `docker-compose.yaml`
- **Format**: YAML
- **Primary Use**: Multi-container applications, development environments, testing
- **Version**: Compose file format version 3.8+ (Docker Compose V2)

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **File Naming** | | | |
| Development | `docker-compose.yml` | `docker-compose.yml` | Default compose file |
| Production | `docker-compose.prod.yml` | `docker-compose.prod.yml` | Production overrides |
| Testing | `docker-compose.test.yml` | `docker-compose.test.yml` | Test environment |
| **Top-Level Keys** | | | |
| `version` | Compose file version | `version: "3.8"` | File format version |
| `services` | Container definitions | Service configurations | Required |
| `networks` | Network definitions | Custom networks | Optional |
| `volumes` | Volume definitions | Persistent storage | Optional |
| **Service Configuration** | | | |
| `image` | Container image | `image: node:20-alpine` | Docker image to use |
| `build` | Build configuration | `build: ./app` | Build from Dockerfile |
| `ports` | Port mapping | `ports: ["3000:3000"]` | Host:container |
| `environment` | Environment vars | `NODE_ENV: production` | Container env vars |
| `volumes` | Mount points | `./src:/app/src` | Host:container paths |
| `depends_on` | Service dependencies | `depends_on: [db]` | Start order |
| `networks` | Network assignment | `networks: [frontend]` | Attach to networks |
| **Best Practices** | | | |
| Version Pinning | Pin image versions | `node:20.10.0-alpine` | Avoid `latest` tag |
| `.env` Files | Use env files | `.env` for secrets | Never commit secrets |
| Health Checks | Define health checks | `healthcheck: {...}` | Service readiness |
| Resource Limits | Set limits | `mem_limit`, `cpus` | Prevent resource exhaustion |
| **Common Patterns** | | | |
| Web + DB | Multi-tier apps | `web` + `db` services | Standard pattern |
| Dev Overrides | Use multiple files | `-f compose.yml -f dev.yml` | Layer configurations |
| Secrets | Use secrets (v3.1+) | `secrets:` block | Secure sensitive data |

---

## Basic Structure

### Simple Compose File

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro

  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

---

## Services

### Service with Build

```yaml
services:
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    image: myapp/web:latest
    container_name: web-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_URL=http://api:8080
    depends_on:
      - api
      - database
    restart: unless-stopped
```

### Service Configuration Options

```yaml
services:
  app:
    image: myapp:latest
    container_name: my-app
    hostname: app-server

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # Restart policy
    restart: unless-stopped

    # User
    user: "1000:1000"

    # Working directory
    working_dir: /app

    # Command override
    command: ["npm", "start"]
```

---

## Networks

### Default Network

```yaml
## Services can communicate using service names as hostnames
services:
  web:
    image: nginx

  api:
    image: myapi
    # Can access nginx at http://web
```

### Custom Networks

```yaml
services:
  frontend:
    image: nginx
    networks:
      - frontend_net
      - backend_net

  api:
    image: myapi
    networks:
      - backend_net

  database:
    image: postgres
    networks:
      - backend_net

networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
    internal: true  # No external access
```

### Network Configuration

```yaml
networks:
  custom_network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: br-custom
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1
```

---

## Volumes

### Named Volumes

```yaml
services:
  database:
    image: postgres:15
    volumes:
      - db_data:/var/lib/postgresql/data
      - db_backup:/backup

volumes:
  db_data:
    driver: local
  db_backup:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/backup
```

### Bind Mounts

```yaml
services:
  web:
    image: nginx
    volumes:
      # Bind mount - full path
      - /host/path:/container/path

      # Bind mount - relative path
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro

      # Named volume
      - app_data:/data

      # Anonymous volume
      - /app/node_modules

volumes:
  app_data:
```

---

## Environment Variables

### Direct Environment Variables

```yaml
services:
  app:
    image: myapp
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:pass@db:5432/mydb
      API_KEY: ${API_KEY}  # From host environment
```

### Environment File

```yaml
services:
  app:
    image: myapp
    env_file:
      - .env
      - .env.production
```

Example `.env` file:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db:5432/mydb
REDIS_URL=redis://redis:6379
```

---

## Complete Application Example

### Full-Stack Web Application

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    image: myapp/frontend:latest
    container_name: myapp-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
    networks:
      - frontend_net
    depends_on:
      - api
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 5s
      retries: 3

  # Backend API
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    image: myapp/api:latest
    container_name: myapp-api
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@database:5432/myapp
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    env_file:
      - .env.production
    networks:
      - frontend_net
      - backend_net
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s

  # Database
  database:
    image: postgres:15-alpine
    container_name: myapp-database
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend_net
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - backend_net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: myapp-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - frontend_net
    depends_on:
      - frontend
      - api
    restart: unless-stopped

networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
    internal: true

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

---

## Development vs Production

### Development Compose File

`docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: development
    volumes:
      # Hot reload
      - ./src:/app/src
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=*
    command: npm run dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Debug port
```

### Production Compose File

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    environment:
      - NODE_ENV=production
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Using Multiple Compose Files

```bash
## Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

## Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Extends and Anchors

### Using Anchors (YAML feature)

```yaml
version: '3.8'

x-common-variables: &common-variables
  NODE_ENV: production
  LOG_LEVEL: info

x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

services:
  web:
    image: myapp/web
    environment:
      <<: *common-variables
      PORT: 3000
    logging: *default-logging

  api:
    image: myapp/api
    environment:
      <<: *common-variables
      PORT: 8080
    logging: *default-logging
```

---

## Docker Compose Commands

### Common Commands

```bash
## Start services
docker-compose up

## Start in detached mode
docker-compose up -d

## Build images
docker-compose build

## Build with no cache
docker-compose build --no-cache

## Stop services
docker-compose stop

## Stop and remove containers
docker-compose down

## Stop and remove containers, volumes, and images
docker-compose down -v --rmi all

## View logs
docker-compose logs

## Follow logs
docker-compose logs -f

## Logs for specific service
docker-compose logs -f api

## Execute command in running container
docker-compose exec api sh

## Run one-off command
docker-compose run api npm test

## List containers
docker-compose ps

## View running processes
docker-compose top
```

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Secrets

```yaml
## Bad - Hardcoded password
services:
  database:
    environment:
      POSTGRES_PASSWORD: mysecretpassword

## Good - Use environment variables
services:
  database:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

### ❌ Avoid: latest Tag

```yaml
## Bad - Unpredictable
services:
  app:
    image: myapp:latest

## Good - Specific version
services:
  app:
    image: myapp:1.2.3
```

### ❌ Avoid: Not Using Volumes for Data

```yaml
## Bad - Data lost when container stops
services:
  database:
    image: postgres

## Good - Persistent volume
services:
  database:
    image: postgres
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

### ❌ Avoid: Not Using Health Checks

```yaml
## Bad - No health checks
services:
  api:
    image: myapi:1.0
    ports:
      - "8080:8080"

## Good - With health check
services:
  api:
    image: myapi:1.0
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
```

### ❌ Avoid: Running as Root

```yaml
## Bad - Default root user
services:
  app:
    image: node:18
    command: npm start

## Good - Specify non-root user
services:
  app:
    image: node:18
    user: "node"
    command: npm start
```

### ❌ Avoid: Not Setting Resource Limits

```yaml
## Bad - No resource limits (can exhaust host)
services:
  app:
    image: myapp:1.0

## Good - Set limits
services:
  app:
    image: myapp:1.0
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### ❌ Avoid: Not Using Depends On

```yaml
## Bad - Services start in parallel (race condition)
services:
  api:
    image: myapi:1.0
  database:
    image: postgres:14

## Good - Explicit dependencies
services:
  api:
    image: myapi:1.0
    depends_on:
      database:
        condition: service_healthy
  database:
    image: postgres:14
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
```

---

## Best Practices

### Use .dockerignore

```dockerignore
node_modules
npm-debug.log
.git
.env
.DS_Store
```

### Health Checks

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Dependency Management

```yaml
services:
  api:
    depends_on:
      database:
        condition: service_healthy
```

---

## Tool Configuration

### docker-compose.yml Validation

```bash
## Validate compose file syntax
docker compose config

## Validate and show final configuration
docker compose config --no-interpolate

## Validate specific file
docker compose -f docker-compose.prod.yml config
```

### .dockerignore

```text
## Version control
.git
.gitignore
.gitattributes

## CI/CD
.github
.gitlab-ci.yml
.travis.yml

## Documentation
*.md
docs/
LICENSE

## Dependencies
node_modules/
vendor/
__pycache__/
*.pyc

## Build artifacts
dist/
build/
*.egg-info/

## IDE
.vscode/
.idea/
*.swp
*.swo

## Environment
.env.local
.env.*.local
*.log

## Testing
coverage/
.nyc_output/
```

### EditorConfig

```ini
## .editorconfig
[docker-compose*.{yml,yaml}]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### VS Code Settings

```json
{
  "[dockercompose]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.formatOnSave": true
  },
  "yaml.schemas": {
    "https://raw.githubusercontent.com/compose-spec/compose-spec/master/schema/compose-spec.json": [
      "docker-compose*.yml",
      "docker-compose*.yaml"
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
        args: ['--allow-multiple-documents']
      - id: check-added-large-files

  - repo: https://github.com/adrienverge/yamllint
    rev: v1.35.1
    hooks:
      - id: yamllint
        args: ['-d', '{extends: default, rules: {line-length: {max: 120}}}']
        files: docker-compose.*\.ya?ml$
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
    allowed-values: ['true', 'false', 'yes', 'no']
```

### Makefile

```makefile
## Makefile
.PHONY: up down build logs ps validate

up:
 docker compose up -d

down:
 docker compose down

build:
 docker compose build

rebuild:
 docker compose build --no-cache

logs:
 docker compose logs -f

ps:
 docker compose ps

validate:
 docker compose config --quiet
 @echo "✓ docker-compose.yml is valid"

validate-prod:
 docker compose -f docker-compose.prod.yml config --quiet
 @echo "✓ docker-compose.prod.yml is valid"

clean:
 docker compose down -v
 docker system prune -f

exec-web:
 docker compose exec web sh

exec-db:
 docker compose exec db psql -U postgres
```

### docker-compose.override.yml

Used for local development overrides:

```yaml
## docker-compose.override.yml
## This file is automatically merged with docker-compose.yml
## Use for local development settings

services:
  web:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./src:/app/src:delegated
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debug port
    command: npm run dev

  db:
    ports:
      - "5432:5432"  # Expose PostgreSQL locally
```

---

## References

### Official Documentation

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Compose CLI Reference](https://docs.docker.com/compose/reference/)

### Additional Resources

- [Production Best Practices](https://docs.docker.com/compose/production/)
- [Compose in Production](https://docs.docker.com/compose/production/)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
