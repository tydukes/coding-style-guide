---
title: "Docker Compose Style Guide"
description: "Docker Compose standards for multi-container application orchestration and development environments"
author: "Tyler Dukes"
tags: [docker-compose, docker, containers, orchestration, devops]
category: "Language Guides"
status: "active"
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

## Security Best Practices

### Never Hardcode Secrets

Avoid storing sensitive data in docker-compose.yml:

```yaml
## Bad - Hardcoded secrets
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: MySecretPassword123  # ❌ Exposed in version control!
      API_KEY: sk-1234567890abcdef  # ❌ Hardcoded!

## Good - Use environment files
services:
  db:
    image: postgres:15
    env_file:
      - .env  # ✅ Gitignored file with secrets

## Good - Use Docker secrets (Swarm mode)
services:
  db:
    image: postgres:15
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt

## Good - Use external secret references
services:
  app:
    image: myapp:latest
    environment:
      DB_PASSWORD: ${DB_PASSWORD}  # ✅ From environment
```

**Key Points**:

- Never commit secrets to docker-compose.yml
- Use `.env` files (add to `.gitignore`)
- Use Docker secrets for Swarm mode
- Use environment variables for 12-factor apps
- Reference external secret managers (Vault, AWS Secrets Manager)
- Rotate secrets regularly

### Use Minimal, Trusted Images

Only use official, verified, and minimal base images:

```yaml
## Bad - Unknown or outdated images
services:
  app:
    image: randomuser/myapp:latest  # ❌ Untrusted source!
    # Using 'latest' tag - unpredictable

## Good - Official, version-pinned, minimal images
services:
  app:
    image: node:20.10.0-alpine  # ✅ Official, specific version, minimal
    # alpine variant is smaller and has fewer vulnerabilities

  db:
    image: postgres:15.5-alpine  # ✅ Official PostgreSQL with specific version

## Good - Use digest pinning for immutability
services:
  app:
    image: node@sha256:abcd1234...  # ✅ Immutable digest
```

**Key Points**:

- Use official images from Docker Hub
- Pin specific versions (never use `latest`)
- Use minimal variants (`alpine`, `distroless`)
- Verify image signatures
- Use digest pinning for critical services
- Regularly update base images

### Run as Non-Root User

Never run containers as root:

```yaml
## Bad - Running as root (default)
services:
  app:
    image: node:20-alpine
    # No user specified - runs as root ❌

## Good - Run as non-root user
services:
  app:
    image: node:20-alpine
    user: "1000:1000"  # ✅ Non-root user
    # Or use 'node' user built into Node image
    # user: node

## Good - Define non-root user in Dockerfile
# Dockerfile
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

**Key Points**:

- Always specify a non-root user
- Use UID:GID format for clarity
- Create users in Dockerfile
- Never use UID 0 (root)
- Test that application works as non-root
- Use `read_only` filesystems where possible

### Limit Resources

Prevent resource exhaustion:

```yaml
## Bad - No resource limits
services:
  app:
    image: myapp:latest
    # No limits - can consume all host resources ❌

## Good - Set resource limits
services:
  app:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    # Prevent fork bombs
    pids_limit: 100

  db:
    image: postgres:15-alpine
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
```

**Key Points**:

- Set CPU and memory limits
- Set PID limits to prevent fork bombs
- Use reservations for guaranteed resources
- Monitor resource usage
- Adjust limits based on actual usage
- Prevent denial of service

### Network Segmentation

Isolate services with network boundaries:

```yaml
## Bad - All services on default bridge
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
  app:
    image: myapp:latest
  db:
    image: postgres:15
    # All on same network - no isolation ❌

## Good - Separate networks for isolation
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - frontend  # Only frontend network

  app:
    image: myapp:latest
    networks:
      - frontend  # Connect to both
      - backend

  db:
    image: postgres:15
    networks:
      - backend  # Only backend network - isolated from web

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # ✅ No external access
```

**Key Points**:

- Create separate networks for tiers
- Use `internal: true` for backend networks
- Limit exposed ports
- Use service names for internal DNS
- Implement zero-trust networking
- Monitor network traffic

### Read-Only Filesystems

Use read-only root filesystems:

```yaml
## Good - Read-only filesystem
services:
  app:
    image: myapp:latest
    read_only: true  # ✅ Immutable root filesystem
    tmpfs:
      - /tmp  # Writable tmpfs for temporary files
      - /var/run

  nginx:
    image: nginx:alpine
    read_only: true
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro  # ✅ Read-only config
      - nginx-cache:/var/cache/nginx  # Writable volume for cache
      - nginx-run:/var/run

volumes:
  nginx-cache:
  nginx-run:
```

**Key Points**:

- Use `read_only: true` for immutable containers
- Mount tmpfs for temporary writable space
- Mount configs as read-only (`:ro`)
- Use volumes for persistent writable data
- Prevents malware persistence
- Enhances security posture

### Security Options

Enable security features:

```yaml
## Good - Security options enabled
services:
  app:
    image: myapp:latest
    security_opt:
      - no-new-privileges:true  # ✅ Prevent privilege escalation
      - apparmor=docker-default  # Enable AppArmor
      # - seccomp=seccomp-profile.json  # Custom seccomp profile

    cap_drop:
      - ALL  # ✅ Drop all capabilities
    cap_add:
      - NET_BIND_SERVICE  # Only add required capabilities

    privileged: false  # ✅ Never use privileged mode
```

**Key Points**:

- Always set `no-new-privileges:true`
- Drop all capabilities, add only required ones
- Never use `privileged: true`
- Enable AppArmor or SELinux
- Use custom seccomp profiles
- Minimize attack surface

### Container Health and Availability Checks

Implement health checks for availability and security:

```yaml
## Good - Health checks configured
services:
  app:
    image: myapp:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Key Points**:

- Define health checks for all services
- Use appropriate intervals and timeouts
- Monitor health check status
- Restart unhealthy containers
- Use health checks for rolling updates
- Prevent zombie containers

---

## Common Pitfalls

### Port Conflict with Host

**Issue**: Mapping container ports to already-used host ports causes container startup failure.

**Example**:

```yaml
## Bad - Port 80 likely in use on host
services:
  web:
    image: nginx
    ports:
      - "80:80"  # ❌ Conflicts if host already has service on port 80

  api:
    image: myapi
    ports:
      - "80:8080"  # ❌ Also tries to bind host port 80!
```

**Solution**: Use unique host ports or let Docker assign random ports.

```yaml
## Good - Unique host ports
services:
  web:
    image: nginx
    ports:
      - "8080:80"  # ✅ Web on host port 8080

  api:
    image: myapi
    ports:
      - "8081:8080"  # ✅ API on host port 8081

## Good - Random host ports
services:
  web:
    image: nginx
    ports:
      - "80"  # ✅ Docker assigns random host port
```

**Key Points**:

- Check for port conflicts with `docker ps` and `netstat`
- Use high ports (>1024) to avoid conflicts
- Omit host port to let Docker assign random port
- Use `docker-compose port` to find assigned ports

### Missing Depends_On for Service Dependencies

**Issue**: Services starting before dependencies are ready causes connection failures.

**Example**:

```yaml
## Bad - No dependency specification
services:
  api:
    image: myapi
    environment:
      - DB_HOST=db
    # ❌ May start before database is ready!

  db:
    image: postgres:15
```

**Solution**: Use `depends_on` with health checks.

```yaml
## Good - Explicit dependencies with health checks
services:
  api:
    image: myapi
    depends_on:
      db:
        condition: service_healthy  # ✅ Wait for healthy state
    environment:
      - DB_HOST=db

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
```

**Key Points**:

- `depends_on` controls startup order
- Use `condition: service_healthy` with healthchecks
- Healthchecks ensure service is actually ready
- Without healthcheck, `depends_on` only waits for container start

### Volume Mount Path Typos

**Issue**: Typos in volume mount paths cause data to be written to wrong locations or errors.

**Example**:

```yaml
## Bad - Typo in container path
services:
  app:
    image: myapp
    volumes:
      - ./data:/app/data
      - ./config:/app/cofig  # ❌ Typo! Should be /app/config
```

**Solution**: Double-check all paths and test volume mounts.

```yaml
## Good - Correct paths
services:
  app:
    image: myapp
    volumes:
      - ./data:/app/data     # ✅ Correct
      - ./config:/app/config # ✅ Correct
      - ./logs:/app/logs:rw  # Specify read-write explicitly

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data  # ✅ Named volume

volumes:
  postgres_data:
```

**Key Points**:

- Verify container paths match application expectations
- Use absolute paths or `./` for relative paths
- Named volumes persist independently of containers
- Use `:ro` for read-only, `:rw` for read-write

### Network Name Collision

**Issue**: Not specifying network names causes Docker to generate unpredictable names.

**Example**:

```yaml
## Bad - Auto-generated network names
services:
  web:
    image: nginx
    networks:
      - frontend  # ❌ Network name will be prefixed with directory name

networks:
  frontend:  # Becomes "myproject_frontend" (unpredictable)
```

**Solution**: Use explicit network names or accept generated names consistently.

```yaml
## Good - Explicit network names
services:
  web:
    image: nginx
    networks:
      - frontend

networks:
  frontend:
    name: app_frontend  # ✅ Explicit name
    driver: bridge

## Good - Accept generated names but document
# Networks will be prefixed with project name
# Project name from directory or -p flag
services:
  web:
    networks:
      - frontend  # ✅ Consistent within project

networks:
  frontend:  # Will be ${PROJECT}_frontend
```

**Key Points**:

- Docker Compose prefixes network names with project name
- Set project name with `-p` flag or `name` in compose file
- Use `name:` in network definition for explicit naming
- External networks use `external: true`

### Environment File Path Errors

**Issue**: Wrong paths to `.env` files cause variables to not load.

**Example**:

```yaml
## Bad - Incorrect env_file path
services:
  api:
    image: myapi
    env_file:
      - .env  # ❌ Relative to current directory, not compose file location!
      - ../config.env  # ❌ May not exist
```

**Solution**: Use correct relative paths from compose file location.

```yaml
## Good - Correct paths
services:
  api:
    image: myapi
    env_file:
      - ./.env           # ✅ Same directory as compose file
      - ./config/.env    # ✅ Subdirectory
    environment:
      - NODE_ENV=production  # Explicit override

## Good - Check file existence
## Before running: test -f .env || cp .env.example .env
```

**Key Points**:

- `env_file` paths are relative to compose file location
- Use `environment:` for explicit values
- `environment:` overrides `env_file` values
- Commit `.env.example`, not `.env`

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
**Status**: Active
