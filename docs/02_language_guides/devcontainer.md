---
title: "Dev Container Style Guide"
description: "Comprehensive standards for Dev Containers and GitHub Codespaces configuration"
author: "Tyler Dukes"
tags: [devcontainer, codespaces, docker, vscode, development-environment]
category: "Language Guides"
status: "active"
---

## Language Overview

**Dev Containers** provide consistent, reproducible development environments using container technology.
This guide covers standards for `.devcontainer` configuration files used with VS Code, GitHub Codespaces,
and other compatible IDEs.

### Key Characteristics

- **File Name**: `devcontainer.json` (in `.devcontainer/` directory)
- **Format**: JSON with Comments (JSONC)
- **Primary Use**: Defining containerized development environments
- **Key Principles**: Reproducibility, consistency, zero-setup onboarding, cloud portability

### This Style Guide Covers

- Dev Container configuration structure and naming
- GitHub Codespaces-specific settings
- Feature selection and tool installation
- VS Code extension recommendations
- Port forwarding and networking
- Secret management
- Multi-container development environments
- Lifecycle scripts and commands
- Performance optimization
- Security best practices

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Directory Structure** | | | |
| Standard location | `.devcontainer/` | `.devcontainer/devcontainer.json` | Required directory |
| Multi-config | Named subdirs | `.devcontainer/python/` | For multiple configs |
| Docker Compose | Alongside config | `.devcontainer/docker-compose.yml` | Multi-container |
| **Configuration** | | | |
| Name | Descriptive | `"My Project Dev"` | Shows in UI |
| Image | Pinned version | `mcr.microsoft.com/devcontainers/python:3.11` | Use specific tags |
| Features | Official registry | `ghcr.io/devcontainers/features/...` | Prefer official |
| **Lifecycle** | | | |
| postCreateCommand | Initial setup | `pip install -r requirements.txt` | After container creation |
| postStartCommand | On every start | `echo 'Ready!'` | After container starts |
| postAttachCommand | On attach | `git fetch` | When user attaches |
| **Extensions** | | | |
| Format | Extension ID | `ms-python.python` | Use full ID |
| Required | In array | `["ms-python.python"]` | Always install |
| **Ports** | | | |
| Forward | Port number | `"forwardPorts": [8000]` | Expose to host |
| Attributes | Labels & behavior | `"portsAttributes": {...}` | Configure per port |
| **Codespaces** | | | |
| Host requirements | CPU/memory | `"hostRequirements": {...}` | Machine sizing |
| Secrets | Variable names | `"secrets": {...}` | Environment secrets |
| Prebuild | Boolean | `"codespaces": {"prebuild": true}` | Enable prebuilds |

---

## Basic Structure

### Minimal Configuration

```json
{
  "name": "My Project",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu"
}
```

### Standard Project Configuration

```json
{
  "name": "My Project Dev Environment",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.black-formatter",
        "charliermarsh.ruff"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python"
      }
    }
  },
  "forwardPorts": [8000],
  "postCreateCommand": "pip install -r requirements.txt",
  "remoteUser": "vscode"
}
```

---

## Directory Structure

### Standard Layout

```text
.devcontainer/
├── devcontainer.json          # Main configuration
├── Dockerfile                 # Custom image (optional)
├── docker-compose.yml         # Multi-container (optional)
├── scripts/
│   ├── setup-dev.sh          # Setup script
│   └── post-create.sh        # Post-create hook
└── .env.example              # Environment template
```

### Multiple Configurations

```text
.devcontainer/
├── devcontainer.json              # Default configuration
├── python/
│   └── devcontainer.json         # Python-specific
├── node/
│   └── devcontainer.json         # Node.js-specific
└── full-stack/
    ├── devcontainer.json         # Full stack
    └── docker-compose.yml        # With services
```

---

## Base Images

### Official Microsoft Dev Container Images

```json
{
  "name": "Python Development",
  "image": "mcr.microsoft.com/devcontainers/python:3.11-bookworm"
}
```

```json
{
  "name": "Node.js Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20-bookworm"
}
```

```json
{
  "name": "Go Development",
  "image": "mcr.microsoft.com/devcontainers/go:1.21-bookworm"
}
```

```json
{
  "name": "Universal Development",
  "image": "mcr.microsoft.com/devcontainers/universal:2"
}
```

### Pin Image Versions

```json
{
  "name": "Production-Grade Environment",
  "image": "mcr.microsoft.com/devcontainers/python:1.1.3-3.11-bookworm"
}
```

```json
{
  "name": "Avoid Unpinned Versions",
  "image": "mcr.microsoft.com/devcontainers/python:latest"
}
```

---

## Features

### Installing Dev Container Features

```json
{
  "name": "Feature-Rich Environment",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {
      "version": "latest",
      "moby": true
    },
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {
      "kubectl": "latest",
      "helm": "latest",
      "minikube": "none"
    },
    "ghcr.io/devcontainers/features/terraform:1": {
      "version": "latest",
      "tflint": "latest",
      "terragrunt": "latest"
    },
    "ghcr.io/devcontainers/features/aws-cli:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  }
}
```

### Common Feature Combinations

```json
{
  "name": "Python Data Science",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": true,
      "configureZshAsDefaultShell": true
    },
    "ghcr.io/devcontainers/features/git:1": {
      "ppa": true
    },
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.11"
    },
    "ghcr.io/rocker-org/devcontainer-features/quarto-cli:1": {}
  }
}
```

```json
{
  "name": "Full Stack JavaScript",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers-contrib/features/pnpm:2": {},
    "ghcr.io/devcontainers/features/azure-cli:1": {}
  }
}
```

```json
{
  "name": "DevOps/Platform Engineering",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {},
    "ghcr.io/devcontainers/features/terraform:1": {},
    "ghcr.io/devcontainers/features/aws-cli:1": {},
    "ghcr.io/devcontainers/features/azure-cli:1": {},
    "ghcr.io/devcontainers/features/python:1": {},
    "ghcr.io/devcontainers/features/go:1": {}
  }
}
```

---

## VS Code Customizations

### Extensions Configuration

```json
{
  "name": "Python Project",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "ms-python.black-formatter",
        "charliermarsh.ruff",
        "ms-python.debugpy",
        "ms-toolsai.jupyter",
        "tamasfe.even-better-toml",
        "redhat.vscode-yaml",
        "eamodio.gitlens",
        "streetsidesoftware.code-spell-checker"
      ]
    }
  }
}
```

### Settings Configuration

```json
{
  "name": "Python with Full Settings",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.black-formatter",
        "charliermarsh.ruff"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.analysis.typeCheckingMode": "standard",
        "python.analysis.autoImportCompletions": true,
        "[python]": {
          "editor.defaultFormatter": "ms-python.black-formatter",
          "editor.formatOnSave": true,
          "editor.codeActionsOnSave": {
            "source.organizeImports": "explicit"
          }
        },
        "editor.rulers": [88, 100],
        "files.trimTrailingWhitespace": true,
        "files.insertFinalNewline": true
      }
    }
  }
}
```

### TypeScript/Node.js Extensions

```json
{
  "name": "TypeScript Project",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "prisma.prisma",
        "orta.vscode-jest",
        "yoavbls.pretty-ts-errors",
        "christian-kohler.path-intellisense",
        "streetsidesoftware.code-spell-checker"
      ],
      "settings": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit",
          "source.organizeImports": "explicit"
        },
        "typescript.preferences.importModuleSpecifier": "relative",
        "typescript.updateImportsOnFileMove.enabled": "always"
      }
    }
  }
}
```

### Terraform/IaC Extensions

```json
{
  "name": "Infrastructure as Code",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/terraform:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "hashicorp.terraform",
        "hashicorp.hcl",
        "redhat.vscode-yaml",
        "timonwong.shellcheck",
        "foxundermoon.shell-format",
        "ms-azuretools.vscode-docker",
        "ms-kubernetes-tools.vscode-kubernetes-tools"
      ],
      "settings": {
        "terraform.languageServer.enable": true,
        "terraform.experimentalFeatures.validateOnSave": true,
        "[terraform]": {
          "editor.defaultFormatter": "hashicorp.terraform",
          "editor.formatOnSave": true
        },
        "[terraform-vars]": {
          "editor.defaultFormatter": "hashicorp.terraform",
          "editor.formatOnSave": true
        }
      }
    }
  }
}
```

---

## Port Forwarding

### Basic Port Configuration

```json
{
  "name": "Web Application",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "forwardPorts": [3000, 5000, 8000, 5432],
  "portsAttributes": {
    "3000": {
      "label": "Frontend",
      "onAutoForward": "notify"
    },
    "5000": {
      "label": "API Server",
      "onAutoForward": "openBrowser"
    },
    "8000": {
      "label": "Django",
      "onAutoForward": "silent"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "ignore"
    }
  }
}
```

### Advanced Port Attributes

```json
{
  "name": "Full Stack Application",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "forwardPorts": [3000, 3001, 5432, 6379, 9000],
  "portsAttributes": {
    "3000": {
      "label": "Next.js Frontend",
      "onAutoForward": "openBrowser",
      "protocol": "http",
      "requireLocalPort": false
    },
    "3001": {
      "label": "API Server",
      "onAutoForward": "notify",
      "protocol": "http"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "ignore",
      "requireLocalPort": true
    },
    "6379": {
      "label": "Redis",
      "onAutoForward": "ignore"
    },
    "9000": {
      "label": "MinIO S3",
      "onAutoForward": "silent",
      "protocol": "http"
    }
  },
  "otherPortsAttributes": {
    "onAutoForward": "notify"
  }
}
```

---

## Lifecycle Scripts

### Post-Create Command

```json
{
  "name": "Python Project",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "postCreateCommand": "pip install -r requirements.txt && pre-commit install"
}
```

### Multiple Lifecycle Commands

```json
{
  "name": "Full Lifecycle Configuration",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "initializeCommand": "echo 'Initializing on host machine...'",
  "onCreateCommand": "echo 'Container created for first time'",
  "updateContentCommand": "pip install -e .[dev]",
  "postCreateCommand": {
    "install-deps": "pip install -r requirements.txt",
    "setup-pre-commit": "pre-commit install",
    "setup-db": "python manage.py migrate"
  },
  "postStartCommand": "echo 'Container started - ready for development!'",
  "postAttachCommand": "git fetch --all"
}
```

### External Script Reference

```json
{
  "name": "Script-Based Setup",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "postCreateCommand": "bash .devcontainer/scripts/setup-dev.sh",
  "postStartCommand": "bash .devcontainer/scripts/on-start.sh"
}
```

```bash
#!/bin/bash
# .devcontainer/scripts/setup-dev.sh
set -e

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt

echo "Setting up pre-commit hooks..."
pre-commit install
pre-commit install --hook-type commit-msg

echo "Initializing database..."
python manage.py migrate
python manage.py loaddata fixtures/dev_data.json

echo "Development environment ready!"
```

```bash
#!/bin/bash
# .devcontainer/scripts/on-start.sh
set -e

echo "Pulling latest changes..."
git fetch --all --prune

echo "Checking for dependency updates..."
pip check || echo "Warning: Some dependencies have issues"

echo "Container started at $(date)"
```

---

## Custom Dockerfile

### Using a Custom Dockerfile

```json
{
  "name": "Custom Image Project",
  "build": {
    "dockerfile": "Dockerfile",
    "context": "..",
    "args": {
      "PYTHON_VERSION": "3.11",
      "NODE_VERSION": "20"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": ["ms-python.python"]
    }
  }
}
```

```dockerfile
# .devcontainer/Dockerfile
ARG PYTHON_VERSION=3.11
FROM mcr.microsoft.com/devcontainers/python:${PYTHON_VERSION}

ARG NODE_VERSION=20
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Install additional tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages globally
COPY requirements-dev.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements-dev.txt

# Create workspace directory
WORKDIR /workspace

# Set up shell customizations
COPY .devcontainer/shell-config.sh /home/vscode/.shell-config.sh
RUN echo 'source ~/.shell-config.sh' >> /home/vscode/.bashrc

USER vscode
```

### Multi-Stage Dev Container Build

```dockerfile
# .devcontainer/Dockerfile
# Build stage for compiled dependencies
FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# Development stage
FROM mcr.microsoft.com/devcontainers/python:3.11

# Copy pre-built wheels
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Install development tools
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    black \
    ruff \
    mypy \
    pre-commit

USER vscode
WORKDIR /workspace
```

---

## Multi-Container Environments

### Docker Compose Configuration

```json
{
  "name": "Full Stack with Services",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  "shutdownAction": "stopCompose",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-azuretools.vscode-docker"
      ]
    }
  },
  "forwardPorts": [8000, 5432, 6379]
}
```

```yaml
# .devcontainer/docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ../..:/workspace:cached
      - ~/.ssh:/home/vscode/.ssh:ro
      - ~/.gitconfig:/home/vscode/.gitconfig:ro
    command: sleep infinity
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/devdb
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: devdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "8025:8025"

volumes:
  postgres-data:
  redis-data:
```

```sql
-- .devcontainer/init-db.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test user
CREATE USER testuser WITH PASSWORD 'testpass';
GRANT ALL PRIVILEGES ON DATABASE devdb TO testuser;
```

### Full Stack Application Example

```json
{
  "name": "Next.js + FastAPI Full Stack",
  "dockerComposeFile": "docker-compose.yml",
  "service": "workspace",
  "workspaceFolder": "/workspace",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "prisma.prisma",
        "ms-azuretools.vscode-docker"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/workspace/backend/.venv/bin/python"
      }
    }
  },
  "forwardPorts": [3000, 8000, 5432, 6379, 9000],
  "portsAttributes": {
    "3000": {"label": "Next.js Frontend"},
    "8000": {"label": "FastAPI Backend"},
    "5432": {"label": "PostgreSQL", "onAutoForward": "ignore"},
    "6379": {"label": "Redis", "onAutoForward": "ignore"},
    "9000": {"label": "MinIO S3", "onAutoForward": "silent"}
  },
  "postCreateCommand": "bash .devcontainer/scripts/setup-workspace.sh"
}
```

```yaml
# .devcontainer/docker-compose.yml
version: '3.8'

services:
  workspace:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ../..:/workspace:cached
      - node-modules:/workspace/frontend/node_modules
      - venv:/workspace/backend/.venv
    command: sleep infinity
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/app
      REDIS_URL: redis://redis:6379/0
      S3_ENDPOINT: http://minio:9000
      S3_ACCESS_KEY: minioadmin
      S3_SECRET_KEY: minioadmin
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    volumes:
      - minio-data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

volumes:
  postgres-data:
  redis-data:
  minio-data:
  node-modules:
  venv:
```

---

## GitHub Codespaces

### Basic Codespaces Configuration

```json
{
  "name": "GitHub Codespaces Environment",
  "image": "mcr.microsoft.com/devcontainers/universal:2",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb",
    "storage": "32gb"
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "github.copilot",
        "github.copilot-chat",
        "github.vscode-pull-request-github"
      ]
    },
    "codespaces": {
      "openFiles": [
        "README.md"
      ]
    }
  }
}
```

### Codespaces with Secrets

```json
{
  "name": "Codespaces with AWS Access",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/aws-cli:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "secrets": {
    "AWS_ACCESS_KEY_ID": {
      "description": "AWS Access Key for development"
    },
    "AWS_SECRET_ACCESS_KEY": {
      "description": "AWS Secret Key for development"
    },
    "AWS_DEFAULT_REGION": {
      "description": "AWS Region (e.g., us-east-1)"
    },
    "DATABASE_URL": {
      "description": "Database connection string"
    }
  },
  "containerEnv": {
    "AWS_DEFAULT_REGION": "${localEnv:AWS_DEFAULT_REGION:us-east-1}"
  }
}
```

### Prebuild Configuration

```json
{
  "name": "Codespaces with Prebuild",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb"
  },
  "waitFor": "onCreateCommand",
  "updateContentCommand": "pip install -e .[dev] && npm install",
  "postCreateCommand": "pre-commit install && npm run build",
  "postStartCommand": "npm run dev",
  "customizations": {
    "codespaces": {
      "prebuild": {
        "enabled": true
      },
      "repositories": {
        "my-org/shared-config": {
          "permissions": "read"
        }
      }
    }
  }
}
```

### Machine Type Recommendations

```json
{
  "name": "Small Project (2-core)",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "hostRequirements": {
    "cpus": 2,
    "memory": "4gb",
    "storage": "32gb"
  }
}
```

```json
{
  "name": "Standard Project (4-core)",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb",
    "storage": "32gb"
  }
}
```

```json
{
  "name": "Large Project (8-core)",
  "image": "mcr.microsoft.com/devcontainers/universal:2",
  "hostRequirements": {
    "cpus": 8,
    "memory": "16gb",
    "storage": "64gb"
  }
}
```

```json
{
  "name": "ML/Data Science (GPU)",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "hostRequirements": {
    "cpus": 8,
    "memory": "32gb",
    "storage": "64gb",
    "gpu": true
  }
}
```

---

## Environment Variables

### Container Environment

```json
{
  "name": "Environment Configuration",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "containerEnv": {
    "ENVIRONMENT": "development",
    "DEBUG": "true",
    "LOG_LEVEL": "debug",
    "DATABASE_URL": "postgresql://postgres:postgres@db:5432/devdb",
    "REDIS_URL": "redis://redis:6379/0"
  },
  "remoteEnv": {
    "LOCAL_WORKSPACE_FOLDER": "${localWorkspaceFolder}",
    "CONTAINER_WORKSPACE_FOLDER": "${containerWorkspaceFolder}"
  }
}
```

### Using .env Files

```json
{
  "name": "Environment File Project",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "runArgs": ["--env-file", ".devcontainer/.env"],
  "postCreateCommand": "cp .env.example .env"
}
```

```bash
# .devcontainer/.env
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug
SECRET_KEY=dev-secret-key-not-for-production
```

```bash
# .env.example (committed to repository)
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug
SECRET_KEY=change-me-in-local-env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379/0
```

---

## Volume Mounts

### Standard Mounts

```json
{
  "name": "Project with Mounts",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "mounts": [
    "source=${localWorkspaceFolder}/.aws,target=/home/vscode/.aws,type=bind,readonly",
    "source=${localWorkspaceFolder}/.ssh,target=/home/vscode/.ssh,type=bind,readonly",
    "source=${localEnv:HOME}/.gitconfig,target=/home/vscode/.gitconfig,type=bind,readonly"
  ]
}
```

### Named Volumes for Performance

```json
{
  "name": "Project with Named Volumes",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "mounts": [
    "source=project-node-modules,target=${containerWorkspaceFolder}/node_modules,type=volume",
    "source=project-pnpm-store,target=/home/vscode/.local/share/pnpm,type=volume"
  ],
  "postCreateCommand": "pnpm install"
}
```

### Docker Socket Mount

```json
{
  "name": "Docker-in-Docker Alternative",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "mounts": [
    "source=/var/run/docker.sock,target=/var/run/docker.sock,type=bind"
  ],
  "postCreateCommand": "sudo chmod 666 /var/run/docker.sock"
}
```

---

## Run Arguments

### Common Run Arguments

```json
{
  "name": "Project with Run Args",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "runArgs": [
    "--name", "my-dev-container",
    "--hostname", "dev-machine",
    "--privileged",
    "--cap-add=SYS_PTRACE",
    "--security-opt", "seccomp=unconfined"
  ]
}
```

### Network Configuration

```json
{
  "name": "Custom Network",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "runArgs": [
    "--network", "host"
  ]
}
```

```json
{
  "name": "Bridge Network with DNS",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "runArgs": [
    "--dns", "8.8.8.8",
    "--dns", "8.8.4.4"
  ]
}
```

---

## Language-Specific Configurations

### Python Data Science

```json
{
  "name": "Python Data Science",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": true,
      "configureZshAsDefaultShell": true
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "ms-toolsai.jupyter",
        "ms-toolsai.jupyter-keymap",
        "ms-toolsai.jupyter-renderers",
        "ms-toolsai.vscode-jupyter-cell-tags",
        "mechatroner.rainbow-csv",
        "GrapeCity.gc-excelviewer"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.analysis.typeCheckingMode": "basic",
        "jupyter.askForKernelRestart": false,
        "notebook.cellToolbarLocation": {
          "default": "right",
          "jupyter-notebook": "left"
        }
      }
    }
  },
  "postCreateCommand": "pip install --upgrade pip && pip install -r requirements.txt",
  "forwardPorts": [8888],
  "portsAttributes": {
    "8888": {
      "label": "Jupyter Lab",
      "onAutoForward": "openBrowser"
    }
  }
}
```

### Go Microservices

```json
{
  "name": "Go Microservices",
  "image": "mcr.microsoft.com/devcontainers/go:1.21",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "golang.go",
        "zxh404.vscode-proto3",
        "ms-azuretools.vscode-docker",
        "ms-kubernetes-tools.vscode-kubernetes-tools",
        "redhat.vscode-yaml"
      ],
      "settings": {
        "go.toolsManagement.autoUpdate": true,
        "go.useLanguageServer": true,
        "go.lintTool": "golangci-lint",
        "go.lintFlags": ["--fast"],
        "[go]": {
          "editor.formatOnSave": true,
          "editor.codeActionsOnSave": {
            "source.organizeImports": "explicit"
          }
        },
        "gopls": {
          "usePlaceholders": true,
          "staticcheck": true
        }
      }
    }
  },
  "postCreateCommand": "go mod download && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest",
  "forwardPorts": [8080, 9090],
  "portsAttributes": {
    "8080": {"label": "HTTP API"},
    "9090": {"label": "gRPC"}
  }
}
```

### Rust Development

```json
{
  "name": "Rust Development",
  "image": "mcr.microsoft.com/devcontainers/rust:1",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "rust-lang.rust-analyzer",
        "tamasfe.even-better-toml",
        "serayuzgur.crates",
        "vadimcn.vscode-lldb",
        "fill-labs.dependi"
      ],
      "settings": {
        "rust-analyzer.checkOnSave.command": "clippy",
        "rust-analyzer.cargo.features": "all",
        "[rust]": {
          "editor.formatOnSave": true,
          "editor.defaultFormatter": "rust-lang.rust-analyzer"
        }
      }
    }
  },
  "postCreateCommand": "rustup component add clippy rustfmt && cargo fetch",
  "forwardPorts": [8080]
}
```

### Java/Spring Boot

```json
{
  "name": "Java Spring Boot",
  "image": "mcr.microsoft.com/devcontainers/java:17",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/java:1": {
      "version": "17",
      "installMaven": true,
      "installGradle": true
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "vscjava.vscode-java-pack",
        "vmware.vscode-boot-dev-pack",
        "vscjava.vscode-gradle",
        "redhat.vscode-xml",
        "ms-azuretools.vscode-docker"
      ],
      "settings": {
        "java.server.launchMode": "Standard",
        "java.configuration.updateBuildConfiguration": "automatic",
        "spring-boot.ls.java.home": "/usr/local/sdkman/candidates/java/current"
      }
    }
  },
  "postCreateCommand": "./mvnw dependency:go-offline",
  "forwardPorts": [8080, 5005],
  "portsAttributes": {
    "8080": {"label": "Spring Boot App"},
    "5005": {"label": "Debug Port", "onAutoForward": "ignore"}
  }
}
```

---

## Testing Dev Containers

### Container Structure Tests

```yaml
# tests/devcontainer-test.yaml
schemaVersion: 2.0.0

commandTests:
  - name: "Python is installed"
    command: "python"
    args: ["--version"]
    expectedOutput: ["Python 3.11"]

  - name: "pip is available"
    command: "pip"
    args: ["--version"]
    exitCode: 0

  - name: "Git is installed"
    command: "git"
    args: ["--version"]
    exitCode: 0

  - name: "Required packages installed"
    command: "pip"
    args: ["list"]
    expectedOutput: ["pytest", "black", "ruff"]

fileExistenceTests:
  - name: "Workspace directory exists"
    path: "/workspace"
    shouldExist: true

  - name: "VS Code extensions directory"
    path: "/home/vscode/.vscode-server"
    shouldExist: true

metadataTest:
  user: "vscode"
  workdir: "/workspace"
```

### Automated Testing Script

```bash
#!/bin/bash
# .devcontainer/test-container.sh
set -e

echo "Testing Dev Container configuration..."

# Test Python installation
echo "Checking Python..."
python --version
pip --version

# Test required packages
echo "Checking required packages..."
python -c "import pytest; print(f'pytest {pytest.__version__}')"
python -c "import black; print(f'black installed')"

# Test VS Code extensions (if applicable)
echo "Checking VS Code extensions..."
if command -v code &> /dev/null; then
    code --list-extensions | grep -E "ms-python|charliermarsh"
fi

# Test database connectivity
echo "Checking database connectivity..."
if [ -n "$DATABASE_URL" ]; then
    python -c "
import psycopg2
from urllib.parse import urlparse
url = urlparse('$DATABASE_URL')
conn = psycopg2.connect(
    host=url.hostname,
    port=url.port,
    user=url.username,
    password=url.password,
    database=url.path[1:]
)
print('Database connection successful')
conn.close()
"
fi

echo "All tests passed!"
```

### CI/CD Integration

```yaml
# .github/workflows/devcontainer-test.yml
name: Dev Container CI

on:
  push:
    paths:
      - '.devcontainer/**'
  pull_request:
    paths:
      - '.devcontainer/**'

jobs:
  test-devcontainer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Install Dev Container CLI
        run: npm install -g @devcontainers/cli

      - name: Build Dev Container
        run: devcontainer build --workspace-folder .

      - name: Test Dev Container
        run: |
          devcontainer up --workspace-folder .
          devcontainer exec --workspace-folder . python --version
          devcontainer exec --workspace-folder . pip list
          devcontainer exec --workspace-folder . bash .devcontainer/test-container.sh

      - name: Validate devcontainer.json
        run: |
          devcontainer read-configuration --workspace-folder . \
            --include-features-configuration \
            --output json
```

---

## Security Best Practices

### Secure Configuration

```json
{
  "name": "Security-Hardened Environment",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "remoteUser": "vscode",
  "containerUser": "vscode",
  "updateRemoteUserUID": true,
  "runArgs": [
    "--security-opt", "no-new-privileges:true",
    "--cap-drop", "ALL",
    "--cap-add", "NET_BIND_SERVICE"
  ],
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "postCreateCommand": "git config --global init.defaultBranch main"
}
```

### Secret Management

```json
{
  "name": "Secrets Best Practices",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "secrets": {
    "API_KEY": {
      "description": "API key for external service"
    },
    "DATABASE_PASSWORD": {
      "description": "Database password"
    }
  },
  "mounts": [
    "source=${localEnv:HOME}/.aws,target=/home/vscode/.aws,type=bind,readonly"
  ],
  "containerEnv": {
    "ENVIRONMENT": "development"
  }
}
```

```json
{
  "name": "No Hardcoded Secrets",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "containerEnv": {
    "API_KEY": "sk_live_abc123xyz"
  }
}
```

### Non-Root User Configuration

```json
{
  "name": "Non-Root Development",
  "build": {
    "dockerfile": "Dockerfile",
    "args": {
      "USER_UID": "1000",
      "USER_GID": "1000"
    }
  },
  "remoteUser": "vscode",
  "containerUser": "vscode",
  "updateRemoteUserUID": true
}
```

```dockerfile
# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/python:3.11

ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Update vscode user UID/GID if needed
RUN if [ "$USER_GID" != "1000" ]; then \
      groupmod --gid $USER_GID vscode; \
    fi && \
    if [ "$USER_UID" != "1000" ]; then \
      usermod --uid $USER_UID --gid $USER_GID vscode; \
    fi

USER vscode
WORKDIR /workspace
```

---

## Performance Optimization

### Caching Dependencies

```json
{
  "name": "Optimized Caching",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "mounts": [
    "source=project-node-modules,target=${containerWorkspaceFolder}/node_modules,type=volume",
    "source=pnpm-store,target=/home/vscode/.local/share/pnpm,type=volume",
    "source=pip-cache,target=/home/vscode/.cache/pip,type=volume"
  ],
  "postCreateCommand": "pnpm install --frozen-lockfile"
}
```

### Prebuild Scripts

```json
{
  "name": "Prebuild Optimized",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "waitFor": "onCreateCommand",
  "onCreateCommand": "pip install --no-cache-dir -r requirements.txt",
  "updateContentCommand": "pip install --no-cache-dir -r requirements.txt",
  "postCreateCommand": "pip install -e .[dev]",
  "postStartCommand": "echo 'Ready for development'"
}
```

### Minimal Feature Installation

```json
{
  "name": "Minimal Features",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  }
}
```

```json
{
  "name": "Heavy Features",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {},
    "ghcr.io/devcontainers/features/terraform:1": {},
    "ghcr.io/devcontainers/features/aws-cli:1": {},
    "ghcr.io/devcontainers/features/azure-cli:1": {},
    "ghcr.io/devcontainers/features/gcloud:1": {},
    "ghcr.io/devcontainers/features/python:1": {},
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers/features/go:1": {},
    "ghcr.io/devcontainers/features/rust:1": {}
  }
}
```

---

## Common Pitfalls

### Missing Workspace Folder Configuration

**Issue**: Container starts but VS Code opens an empty or wrong directory.

```json
{
  "name": "Missing workspaceFolder",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app"
}
```

```json
{
  "name": "Correct workspaceFolder",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace"
}
```

### Incorrect Volume Mounts

**Issue**: Changes not persisting or wrong permissions.

```json
{
  "name": "Wrong Volume Mount",
  "mounts": [
    "source=./local-dir,target=/container-dir,type=bind"
  ]
}
```

```json
{
  "name": "Correct Volume Mount",
  "mounts": [
    "source=${localWorkspaceFolder}/local-dir,target=/container-dir,type=bind"
  ]
}
```

### Feature Ordering Issues

**Issue**: Features failing due to dependencies.

```json
{
  "name": "Wrong Feature Order",
  "features": {
    "ghcr.io/devcontainers/features/python:1": {},
    "ghcr.io/devcontainers/features/common-utils:2": {}
  }
}
```

```json
{
  "name": "Correct Feature Order",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {},
    "ghcr.io/devcontainers/features/python:1": {}
  }
}
```

### Lifecycle Command Errors

**Issue**: Commands failing silently or blocking container startup.

```json
{
  "name": "Blocking Command",
  "postCreateCommand": "npm run dev"
}
```

```json
{
  "name": "Non-blocking Commands",
  "postCreateCommand": "npm install",
  "postStartCommand": "npm run dev &"
}
```

---

## Anti-Patterns

### Using Latest Tags

```json
{
  "name": "Unpredictable Image",
  "image": "mcr.microsoft.com/devcontainers/python:latest"
}
```

```json
{
  "name": "Pinned Image",
  "image": "mcr.microsoft.com/devcontainers/python:1.1.3-3.11-bookworm"
}
```

### Hardcoded Secrets

```json
{
  "name": "Exposed Secrets",
  "containerEnv": {
    "DATABASE_PASSWORD": "super-secret-password",
    "API_KEY": "sk_live_12345"
  }
}
```

```json
{
  "name": "Secure Secrets",
  "secrets": {
    "DATABASE_PASSWORD": {
      "description": "Database password"
    },
    "API_KEY": {
      "description": "API key"
    }
  }
}
```

### Monolithic Configurations

```json
{
  "name": "Everything Installed",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/python:1": {},
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers/features/go:1": {},
    "ghcr.io/devcontainers/features/rust:1": {},
    "ghcr.io/devcontainers/features/java:1": {},
    "ghcr.io/devcontainers/features/dotnet:1": {},
    "ghcr.io/devcontainers/features/ruby:1": {},
    "ghcr.io/devcontainers/features/php:1": {}
  }
}
```

```json
{
  "name": "Python Project Only",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  }
}
```

### Missing Remote User

```json
{
  "name": "Running as Root",
  "image": "mcr.microsoft.com/devcontainers/python:3.11"
}
```

```json
{
  "name": "Non-Root User",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "remoteUser": "vscode"
}
```

### Over-Permissive Run Arguments

```json
{
  "name": "Too Permissive",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "runArgs": [
    "--privileged",
    "--cap-add=ALL"
  ]
}
```

```json
{
  "name": "Minimal Permissions",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "runArgs": [
    "--cap-add=SYS_PTRACE"
  ]
}
```

---

## IDE Integration

### JetBrains Gateway

```json
{
  "name": "JetBrains Compatible",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "customizations": {
    "jetbrains": {
      "plugins": [
        "com.intellij.plugins.vscodekeymap"
      ]
    },
    "vscode": {
      "extensions": [
        "ms-python.python"
      ]
    }
  },
  "forwardPorts": [8000],
  "remoteUser": "vscode"
}
```

### Multi-IDE Support

```json
{
  "name": "Multi-IDE Development",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.black-formatter"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python"
      }
    },
    "jetbrains": {
      "backend": "PyCharm"
    },
    "codespaces": {
      "openFiles": ["README.md", "src/main.py"]
    }
  }
}
```

---

## Template Repository Configuration

### Organization Default

```json
{
  "name": "${localWorkspaceFolderBasename}",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.black-formatter",
        "charliermarsh.ruff",
        "eamodio.gitlens",
        "streetsidesoftware.code-spell-checker"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "[python]": {
          "editor.defaultFormatter": "ms-python.black-formatter",
          "editor.formatOnSave": true
        }
      }
    }
  },
  "postCreateCommand": "pip install -r requirements.txt 2>/dev/null || true",
  "remoteUser": "vscode"
}
```

### Starter Template

```json
{
  "$schema": "https://raw.githubusercontent.com/devcontainers/spec/main/schemas/devContainer.schema.json",
  "name": "Project Template",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {},
  "customizations": {
    "vscode": {
      "extensions": [],
      "settings": {}
    }
  },
  "forwardPorts": [],
  "postCreateCommand": "",
  "remoteUser": "vscode"
}
```

---

## References

### Official Documentation

- [Dev Containers Specification](https://containers.dev/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Codespaces](https://docs.github.com/en/codespaces)
- [Dev Container Features](https://containers.dev/features)

### Tools

- [Dev Container CLI](https://github.com/devcontainers/cli)
- [Dev Container Templates](https://github.com/devcontainers/templates)
- [Dev Container Features](https://github.com/devcontainers/features)

### Related Guides

- [Dockerfile Style Guide](dockerfile.md)
- [Docker Compose Style Guide](docker_compose.md)
- [IDE Settings Template](../04_templates/ide_settings_template.md)

---

**Status**: Active
