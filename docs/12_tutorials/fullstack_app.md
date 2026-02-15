---
title: "Tutorial 3: Full-Stack App with Multiple Languages"
description: "Build a monorepo with Python backend, TypeScript frontend, and Terraform infrastructure following the Dukes Engineering Style Guide"
author: "Tyler Dukes"
tags: [tutorial, fullstack, python, typescript, terraform, monorepo, docker, ci-cd, fastapi, react]
category: "Tutorials"
status: "active"
search_keywords: [tutorial, full stack, multi-language, frontend, backend, integration, step by step]
---

<!-- markdownlint-disable MD013 -->

## Overview

In this tutorial you will build a **task management application** as a monorepo containing three major components, each following the Dukes Engineering Style Guide conventions for its respective language.

```text
What You Will Build
====================
Component          Language       Framework      Style Guide Section
---------------------------------------------------------------------------
Backend API        Python         FastAPI        02_language_guides/python
Frontend SPA       TypeScript     React          02_language_guides/typescript
Infrastructure     HCL            Terraform      02_language_guides/terraform
Containers         Dockerfile     Docker         02_language_guides/docker
CI/CD Pipeline     YAML           GitHub Actions 02_language_guides/github_actions
Build Orchestration Makefile      GNU Make       02_language_guides/makefile
```

```text
Time Breakdown
==============
Step 1: Monorepo Structure ........  5 min
Step 2: Python Backend ............ 15 min
Step 3: TypeScript Frontend ....... 15 min
Step 4: Terraform Infrastructure .. 10 min
Step 5: Docker Configuration ......  5 min
Step 6: Monorepo CI/CD ............  8 min
Step 7: Cross-Language Validation ..  2 min
                                    -------
Total                               60 min
```

### Prerequisites

```bash
# Verify all prerequisites before starting
python3 --version    # Python 3.10+
node --version       # Node.js 20+
npm --version        # npm 9+
terraform --version  # Terraform 1.5+
docker --version     # Docker 20.10+
git --version        # Git 2.30+
```

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install pre-commit
pip install pre-commit

# Verify installations
uv --version
pre-commit --version
```

---

## Step 1: Monorepo Structure (5 min)

### Create the directory layout

```bash
# Create project root
mkdir -p taskflow && cd taskflow
git init

# Create full directory structure
mkdir -p backend/src/models
mkdir -p backend/src/routes
mkdir -p backend/src/services
mkdir -p backend/tests
mkdir -p frontend/src/components
mkdir -p frontend/src/hooks
mkdir -p frontend/src/types
mkdir -p frontend/src/services
mkdir -p frontend/public
mkdir -p infrastructure/modules/ecs
mkdir -p infrastructure/modules/rds
mkdir -p infrastructure/modules/networking
mkdir -p infrastructure/environments/dev
mkdir -p infrastructure/environments/prod
mkdir -p shared/schemas
mkdir -p .github/workflows
mkdir -p scripts
```

```bash
# Verify structure
tree -L 3 --dirsfirst
```

```text
taskflow/
├── .github/
│   └── workflows/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── tests/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── infrastructure/
│   ├── environments/
│   │   ├── dev/
│   │   └── prod/
│   └── modules/
│       ├── ecs/
│       ├── networking/
│       └── rds/
├── scripts/
└── shared/
    └── schemas/
```

### Root .editorconfig

```ini
# .editorconfig - Universal editor configuration
root = true

[*]
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
charset = utf-8

[*.py]
indent_style = space
indent_size = 4
max_line_length = 100

[*.{ts,tsx,js,jsx,json}]
indent_style = space
indent_size = 2

[*.{tf,tfvars}]
indent_style = space
indent_size = 2

[*.{yml,yaml}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab

[Dockerfile]
indent_style = space
indent_size = 4
```

### Root .pre-commit-config.yaml

```yaml
# .pre-commit-config.yaml - Multi-language pre-commit hooks
repos:
  # -- General file checks --
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: ["--unsafe"]
      - id: check-json
      - id: check-added-large-files
        args: ["--maxkb=1000"]
      - id: check-merge-conflict
      - id: detect-private-key
      - id: mixed-line-ending

  # -- Python hooks --
  - repo: https://github.com/psf/black
    rev: "25.1.0"
    hooks:
      - id: black
        args: ["--line-length=100"]
        files: ^backend/

  - repo: https://github.com/pycqa/flake8
    rev: "7.1.2"
    hooks:
      - id: flake8
        args: ["--max-line-length=100", "--extend-ignore=E203,W503"]
        files: ^backend/

  # -- TypeScript/JavaScript hooks --
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v9.20.0
    hooks:
      - id: eslint
        files: ^frontend/.*\.[jt]sx?$
        additional_dependencies:
          - eslint@9.20.0
          - typescript@5.7.3
          - "@typescript-eslint/parser@8.24.0"
          - "@typescript-eslint/eslint-plugin@8.24.0"

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v4.0.0-alpha.8
    hooks:
      - id: prettier
        files: ^frontend/
        types_or: [javascript, jsx, ts, tsx, json, css]

  # -- Terraform hooks --
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.97.4
    hooks:
      - id: terraform_fmt
        files: ^infrastructure/
      - id: terraform_validate
        files: ^infrastructure/
      - id: terraform_docs
        files: ^infrastructure/

  # -- Shell hooks --
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.10.0.1
    hooks:
      - id: shellcheck
        files: ^scripts/

  # -- Markdown hooks --
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.44.0
    hooks:
      - id: markdownlint
        args: ["--fix"]

  # -- YAML hooks --
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.35.1
    hooks:
      - id: yamllint
        args: ["-d", "{extends: default, rules: {line-length: {max: 120}, document-start: disable}}"]
```

### Root Makefile

```makefile
# Makefile - Monorepo build orchestration
#
# @module taskflow_makefile
# @description Root Makefile for multi-language monorepo build and validation
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

.DEFAULT_GOAL := help
SHELL := /bin/bash

# ============================================================================
# Variables
# ============================================================================

BACKEND_DIR     := backend
FRONTEND_DIR    := frontend
INFRA_DIR       := infrastructure
DOCKER_COMPOSE  := docker compose

# ============================================================================
# Help
# ============================================================================

.PHONY: help
help: ## Show this help message
  @echo "TaskFlow Monorepo Commands"
  @echo "========================="
  @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
    awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================================================
# Setup
# ============================================================================

.PHONY: setup
setup: setup-backend setup-frontend setup-hooks ## Set up all components

.PHONY: setup-backend
setup-backend: ## Set up Python backend
  cd $(BACKEND_DIR) && uv sync

.PHONY: setup-frontend
setup-frontend: ## Set up TypeScript frontend
  cd $(FRONTEND_DIR) && npm ci

.PHONY: setup-hooks
setup-hooks: ## Install pre-commit hooks
  pre-commit install --install-hooks

# ============================================================================
# Development
# ============================================================================

.PHONY: dev
dev: ## Start all services in development mode
  $(DOCKER_COMPOSE) up --build

.PHONY: dev-backend
dev-backend: ## Start backend only
  cd $(BACKEND_DIR) && uv run uvicorn src.main:app --reload --port 8000

.PHONY: dev-frontend
dev-frontend: ## Start frontend only
  cd $(FRONTEND_DIR) && npm run dev

# ============================================================================
# Testing
# ============================================================================

.PHONY: test
test: test-backend test-frontend ## Run all tests

.PHONY: test-backend
test-backend: ## Run Python backend tests
  cd $(BACKEND_DIR) && uv run pytest tests/ -v --cov=src --cov-report=term-missing

.PHONY: test-frontend
test-frontend: ## Run TypeScript frontend tests
  cd $(FRONTEND_DIR) && npm test -- --coverage

# ============================================================================
# Linting and Formatting
# ============================================================================

.PHONY: lint
lint: lint-backend lint-frontend lint-infra ## Lint all components

.PHONY: lint-backend
lint-backend: ## Lint Python backend
  cd $(BACKEND_DIR) && uv run black --check src/ tests/
  cd $(BACKEND_DIR) && uv run flake8 src/ tests/

.PHONY: lint-frontend
lint-frontend: ## Lint TypeScript frontend
  cd $(FRONTEND_DIR) && npm run lint
  cd $(FRONTEND_DIR) && npm run format:check

.PHONY: lint-infra
lint-infra: ## Lint Terraform infrastructure
  cd $(INFRA_DIR) && terraform fmt -check -recursive

.PHONY: format
format: format-backend format-frontend format-infra ## Format all components

.PHONY: format-backend
format-backend: ## Format Python backend
  cd $(BACKEND_DIR) && uv run black src/ tests/

.PHONY: format-frontend
format-frontend: ## Format TypeScript frontend
  cd $(FRONTEND_DIR) && npm run format

.PHONY: format-infra
format-infra: ## Format Terraform infrastructure
  cd $(INFRA_DIR) && terraform fmt -recursive

# ============================================================================
# Infrastructure
# ============================================================================

.PHONY: infra-init
infra-init: ## Initialize Terraform
  cd $(INFRA_DIR)/environments/dev && terraform init

.PHONY: infra-plan
infra-plan: ## Plan Terraform changes
  cd $(INFRA_DIR)/environments/dev && terraform plan -out=tfplan

.PHONY: infra-apply
infra-apply: ## Apply Terraform changes
  cd $(INFRA_DIR)/environments/dev && terraform apply tfplan

# ============================================================================
# Docker
# ============================================================================

.PHONY: docker-build
docker-build: ## Build all Docker images
  $(DOCKER_COMPOSE) build

.PHONY: docker-up
docker-up: ## Start all containers
  $(DOCKER_COMPOSE) up -d

.PHONY: docker-down
docker-down: ## Stop all containers
  $(DOCKER_COMPOSE) down

# ============================================================================
# Validation (CI)
# ============================================================================

.PHONY: validate
validate: lint test ## Run full validation suite
  @echo "All validations passed."

.PHONY: pre-commit
pre-commit: ## Run pre-commit on all files
  pre-commit run --all-files

# ============================================================================
# Clean
# ============================================================================

.PHONY: clean
clean: ## Remove build artifacts and caches
  rm -rf $(BACKEND_DIR)/.pytest_cache
  rm -rf $(BACKEND_DIR)/src/__pycache__
  rm -rf $(BACKEND_DIR)/.coverage
  rm -rf $(FRONTEND_DIR)/node_modules
  rm -rf $(FRONTEND_DIR)/build
  $(DOCKER_COMPOSE) down --rmi local --volumes --remove-orphans
```

### Checkpoint: Monorepo structure

```bash
# Verify all root config files exist
ls -la .editorconfig .pre-commit-config.yaml Makefile

# Verify directory structure
test -d backend/src/models && echo "PASS: backend structure"
test -d frontend/src/components && echo "PASS: frontend structure"
test -d infrastructure/modules/ecs && echo "PASS: infrastructure structure"
test -d .github/workflows && echo "PASS: workflows directory"

# Initialize pre-commit
pre-commit install --install-hooks
```

---

## Step 2: Python Backend (15 min)

### backend/pyproject.toml

```toml
[project]
name = "taskflow-backend"
version = "1.0.0"
description = "TaskFlow API - FastAPI backend for task management"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "pydantic>=2.10.0",
    "sqlalchemy>=2.0.0",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "python-dotenv>=1.0.0",
    "httpx>=0.28.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "pytest-cov>=6.0.0",
    "black>=25.1.0",
    "flake8>=7.1.0",
    "mypy>=1.14.0",
    "httpx>=0.28.0",
]

[tool.black]
line-length = 100
target-version = ["py311"]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "-v --tb=short"

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true

[tool.coverage.run]
source = ["src"]
omit = ["tests/*"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

### backend/src/\_\_init\_\_.py

```python
"""
@module taskflow_backend
@description FastAPI backend for TaskFlow task management application
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""
```

### backend/src/models/task.py

```python
"""
@module task_models
@description Pydantic models for task CRUD operations with full type safety
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator


class TaskStatus(str, Enum):
    """Valid task status values."""

    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    ARCHIVED = "archived"


class TaskPriority(str, Enum):
    """Valid task priority values."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskBase(BaseModel):
    """Shared fields for task creation and updates."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Task title",
        examples=["Implement user authentication"],
    )
    description: Optional[str] = Field(
        None,
        max_length=2000,
        description="Detailed task description",
    )
    status: TaskStatus = Field(
        default=TaskStatus.TODO,
        description="Current task status",
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        description="Task priority level",
    )
    assignee: Optional[str] = Field(
        None,
        max_length=100,
        description="Assigned team member",
    )

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, v: str) -> str:
        """Validate that title is not whitespace-only."""
        if not v.strip():
            raise ValueError("Title must contain non-whitespace characters")
        return v.strip()


class TaskCreate(TaskBase):
    """Request model for creating a new task."""

    pass


class TaskUpdate(BaseModel):
    """Request model for partial task updates."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee: Optional[str] = Field(None, max_length=100)


class TaskResponse(TaskBase):
    """Response model returned to API clients."""

    id: UUID = Field(default_factory=uuid4, description="Unique task identifier")
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of creation",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of last update",
    )

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Paginated list response for tasks."""

    tasks: list[TaskResponse]
    total: int = Field(description="Total number of tasks matching query")
    page: int = Field(ge=1, description="Current page number")
    per_page: int = Field(ge=1, le=100, description="Items per page")

    @property
    def total_pages(self) -> int:
        """Calculate total number of pages."""
        return (self.total + self.per_page - 1) // self.per_page
```

### backend/src/main.py

```python
"""
@module taskflow_api
@description FastAPI application entry point with health check and CORS configuration
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""

from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes.tasks import router as tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup and shutdown events."""
    # -- Startup --
    print("TaskFlow API starting up...")
    yield
    # -- Shutdown --
    print("TaskFlow API shutting down...")


app = FastAPI(
    title="TaskFlow API",
    description="Task management API built with the Dukes Engineering Style Guide",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# -- CORS Configuration --
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Router Registration --
app.include_router(tasks_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint for load balancer and container orchestration probes.

    Returns:
        dict: Health status with service name and timestamp.
    """
    return {
        "status": "healthy",
        "service": "taskflow-api",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/ready", tags=["health"])
async def readiness_check() -> dict[str, str]:
    """Readiness check endpoint for Kubernetes and ECS readiness probes.

    Returns:
        dict: Readiness status.
    """
    # In production, check database connectivity here
    return {
        "status": "ready",
        "service": "taskflow-api",
    }
```

### backend/src/routes/\_\_init\_\_.py

```python
"""
@module taskflow_routes
@description API route modules for TaskFlow backend
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""
```

### backend/src/routes/tasks.py

```python
"""
@module task_routes
@description CRUD API routes for task management with proper error handling
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query

from src.models.task import (
    TaskCreate,
    TaskListResponse,
    TaskPriority,
    TaskResponse,
    TaskStatus,
    TaskUpdate,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])

# -- In-memory store (replace with database in production) --
_task_store: dict[UUID, TaskResponse] = {}


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=201,
    summary="Create a new task",
)
async def create_task(task: TaskCreate) -> TaskResponse:
    """Create a new task with the provided details.

    Args:
        task: Task creation payload with title, description, status, and priority.

    Returns:
        TaskResponse: The newly created task with generated ID and timestamps.
    """
    now = datetime.utcnow()
    task_response = TaskResponse(
        id=uuid4(),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        assignee=task.assignee,
        created_at=now,
        updated_at=now,
    )
    _task_store[task_response.id] = task_response
    return task_response


@router.get(
    "/",
    response_model=TaskListResponse,
    summary="List tasks with pagination and filtering",
)
async def list_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    assignee: Optional[str] = Query(None, description="Filter by assignee"),
) -> TaskListResponse:
    """List all tasks with optional filtering and pagination.

    Args:
        page: Page number (1-indexed).
        per_page: Number of items per page (max 100).
        status: Optional status filter.
        priority: Optional priority filter.
        assignee: Optional assignee filter.

    Returns:
        TaskListResponse: Paginated list of tasks matching filters.
    """
    tasks = list(_task_store.values())

    # -- Apply filters --
    if status is not None:
        tasks = [t for t in tasks if t.status == status]
    if priority is not None:
        tasks = [t for t in tasks if t.priority == priority]
    if assignee is not None:
        tasks = [t for t in tasks if t.assignee == assignee]

    # -- Apply pagination --
    total = len(tasks)
    start = (page - 1) * per_page
    end = start + per_page
    paginated_tasks = tasks[start:end]

    return TaskListResponse(
        tasks=paginated_tasks,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get a task by ID",
)
async def get_task(task_id: UUID) -> TaskResponse:
    """Retrieve a single task by its UUID.

    Args:
        task_id: The unique identifier of the task.

    Returns:
        TaskResponse: The requested task.

    Raises:
        HTTPException: 404 if task not found.
    """
    task = _task_store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task",
)
async def update_task(task_id: UUID, task_update: TaskUpdate) -> TaskResponse:
    """Update an existing task with partial data.

    Args:
        task_id: The unique identifier of the task to update.
        task_update: Partial update payload (only provided fields are changed).

    Returns:
        TaskResponse: The updated task.

    Raises:
        HTTPException: 404 if task not found.
    """
    existing = _task_store.get(task_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    update_data = task_update.model_dump(exclude_unset=True)
    updated_task = existing.model_copy(
        update={
            **update_data,
            "updated_at": datetime.utcnow(),
        }
    )
    _task_store[task_id] = updated_task
    return updated_task


@router.delete(
    "/{task_id}",
    status_code=204,
    summary="Delete a task",
)
async def delete_task(task_id: UUID) -> None:
    """Delete a task by its UUID.

    Args:
        task_id: The unique identifier of the task to delete.

    Raises:
        HTTPException: 404 if task not found.
    """
    if task_id not in _task_store:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    del _task_store[task_id]
```

### backend/src/models/\_\_init\_\_.py

```python
"""
@module taskflow_models
@description Data models for TaskFlow backend
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""
```

### backend/src/services/\_\_init\_\_.py

```python
"""
@module taskflow_services
@description Business logic services for TaskFlow backend
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""
```

### backend/tests/conftest.py

```python
"""
@module test_conftest
@description Shared test fixtures for TaskFlow backend tests
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.routes.tasks import _task_store


@pytest.fixture
def client() -> TestClient:
    """Provide a synchronous test client for the FastAPI application."""
    _task_store.clear()
    return TestClient(app)


@pytest.fixture
async def async_client() -> AsyncClient:
    """Provide an asynchronous test client for the FastAPI application."""
    _task_store.clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_task_payload() -> dict:
    """Provide a valid task creation payload for testing."""
    return {
        "title": "Implement user authentication",
        "description": "Add JWT-based auth with refresh tokens",
        "status": "todo",
        "priority": "high",
        "assignee": "tdukes",
    }


@pytest.fixture
def sample_tasks_batch() -> list[dict]:
    """Provide a batch of task creation payloads for pagination tests."""
    return [
        {
            "title": f"Task {i}",
            "description": f"Description for task {i}",
            "status": "todo",
            "priority": "medium",
        }
        for i in range(25)
    ]
```

### backend/tests/test_health.py

```python
"""
@module test_health
@description Tests for health and readiness endpoints
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""

from fastapi.testclient import TestClient


def test_health_check_returns_healthy(client: TestClient) -> None:
    """Health endpoint should return 200 with healthy status."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "taskflow-api"
    assert "timestamp" in data


def test_readiness_check_returns_ready(client: TestClient) -> None:
    """Readiness endpoint should return 200 with ready status."""
    response = client.get("/ready")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ready"
    assert data["service"] == "taskflow-api"
```

### backend/tests/test_tasks.py

```python
"""
@module test_tasks
@description Tests for task CRUD API routes
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""

from fastapi.testclient import TestClient


def test_create_task(client: TestClient, sample_task_payload: dict) -> None:
    """POST /api/v1/tasks should create a task and return 201."""
    response = client.post("/api/v1/tasks/", json=sample_task_payload)
    assert response.status_code == 201

    data = response.json()
    assert data["title"] == sample_task_payload["title"]
    assert data["status"] == "todo"
    assert data["priority"] == "high"
    assert "id" in data
    assert "created_at" in data


def test_create_task_validates_blank_title(client: TestClient) -> None:
    """POST /api/v1/tasks should reject blank titles with 422."""
    response = client.post("/api/v1/tasks/", json={"title": "   "})
    assert response.status_code == 422


def test_list_tasks_empty(client: TestClient) -> None:
    """GET /api/v1/tasks should return empty list when no tasks exist."""
    response = client.get("/api/v1/tasks/")
    assert response.status_code == 200

    data = response.json()
    assert data["tasks"] == []
    assert data["total"] == 0


def test_list_tasks_with_pagination(
    client: TestClient, sample_tasks_batch: list[dict]
) -> None:
    """GET /api/v1/tasks should paginate results correctly."""
    for payload in sample_tasks_batch:
        client.post("/api/v1/tasks/", json=payload)

    response = client.get("/api/v1/tasks/?page=1&per_page=10")
    assert response.status_code == 200

    data = response.json()
    assert len(data["tasks"]) == 10
    assert data["total"] == 25
    assert data["page"] == 1
    assert data["per_page"] == 10


def test_list_tasks_filter_by_status(
    client: TestClient, sample_task_payload: dict
) -> None:
    """GET /api/v1/tasks should filter by status parameter."""
    client.post("/api/v1/tasks/", json=sample_task_payload)
    client.post(
        "/api/v1/tasks/",
        json={**sample_task_payload, "title": "Done task", "status": "done"},
    )

    response = client.get("/api/v1/tasks/?status=done")
    data = response.json()
    assert data["total"] == 1
    assert data["tasks"][0]["status"] == "done"


def test_get_task_by_id(client: TestClient, sample_task_payload: dict) -> None:
    """GET /api/v1/tasks/{id} should return the specified task."""
    create_response = client.post("/api/v1/tasks/", json=sample_task_payload)
    task_id = create_response.json()["id"]

    response = client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["id"] == task_id


def test_get_task_not_found(client: TestClient) -> None:
    """GET /api/v1/tasks/{id} should return 404 for missing tasks."""
    response = client.get("/api/v1/tasks/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_update_task(client: TestClient, sample_task_payload: dict) -> None:
    """PATCH /api/v1/tasks/{id} should partially update a task."""
    create_response = client.post("/api/v1/tasks/", json=sample_task_payload)
    task_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "in_progress", "priority": "critical"},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "in_progress"
    assert data["priority"] == "critical"
    assert data["title"] == sample_task_payload["title"]


def test_delete_task(client: TestClient, sample_task_payload: dict) -> None:
    """DELETE /api/v1/tasks/{id} should remove the task and return 204."""
    create_response = client.post("/api/v1/tasks/", json=sample_task_payload)
    task_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/tasks/{task_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/tasks/{task_id}")
    assert get_response.status_code == 404


def test_delete_task_not_found(client: TestClient) -> None:
    """DELETE /api/v1/tasks/{id} should return 404 for missing tasks."""
    response = client.delete("/api/v1/tasks/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
```

### Checkpoint: Backend validation

```bash
# Navigate to backend and install
cd backend
uv sync

# Run linters
uv run black --check src/ tests/
uv run flake8 src/ tests/

# Run type checker
uv run mypy src/

# Run tests
uv run pytest tests/ -v --cov=src --cov-report=term-missing

# Expected output:
# tests/test_health.py::test_health_check_returns_healthy PASSED
# tests/test_health.py::test_readiness_check_returns_ready PASSED
# tests/test_tasks.py::test_create_task PASSED
# tests/test_tasks.py::test_create_task_validates_blank_title PASSED
# tests/test_tasks.py::test_list_tasks_empty PASSED
# tests/test_tasks.py::test_list_tasks_with_pagination PASSED
# tests/test_tasks.py::test_list_tasks_filter_by_status PASSED
# tests/test_tasks.py::test_get_task_by_id PASSED
# tests/test_tasks.py::test_get_task_not_found PASSED
# tests/test_tasks.py::test_update_task PASSED
# tests/test_tasks.py::test_delete_task PASSED
# tests/test_tasks.py::test_delete_task_not_found PASSED
#
# ---------- coverage: 80%+ ----------
```

---

## Step 3: TypeScript Frontend (15 min)

### frontend/package.json

```json
{
  "name": "taskflow-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint 'src/**/*.{ts,tsx}'",
    "format": "prettier --write 'src/**/*.{ts,tsx,css,json}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx,css,json}'",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.2.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^8.24.0",
    "@typescript-eslint/parser": "^8.24.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^9.20.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "jsdom": "^26.0.0",
    "prettier": "^3.5.0",
    "typescript": "^5.7.0",
    "vite": "^6.1.0",
    "vitest": "^3.0.0"
  }
}
```

### frontend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### frontend/.prettierrc

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### frontend/src/types/task.ts

```typescript
/**
 * @module task_types
 * @description TypeScript type definitions for the TaskFlow API
 * @version 1.0.0
 * @author Tyler Dukes
 * @last_updated 2025-01-15
 * @status stable
 */

/** Valid task status values matching the backend enum. */
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';

/** Valid task priority values matching the backend enum. */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/** Task entity returned from the API. */
export interface Task {
  readonly id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/** Payload for creating a new task. */
export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}

/** Payload for updating an existing task (all fields optional). */
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}

/** Paginated task list response from the API. */
export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  per_page: number;
}

/** Query parameters for listing tasks. */
export interface TaskListParams {
  page?: number;
  per_page?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}

/** Map of priority values to display labels. */
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/** Map of status values to display labels. */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  archived: 'Archived',
};
```

### frontend/src/services/api.ts

```typescript
/**
 * @module api_client
 * @description Typed HTTP client for TaskFlow API with error handling
 * @version 1.0.0
 * @author Tyler Dukes
 * @last_updated 2025-01-15
 * @status stable
 */

import type {
  CreateTaskPayload,
  Task,
  TaskListParams,
  TaskListResponse,
  UpdateTaskPayload,
} from '../types/task';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

/** Custom error class for API responses. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with typed response and error handling.
 *
 * @param path - API path relative to base URL
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws ApiError on non-2xx responses
 */
async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(
      `API request failed: ${response.status}`,
      response.status,
      errorBody?.detail ?? response.statusText,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** TaskFlow API client with typed methods for all CRUD operations. */
export const taskApi = {
  /**
   * List tasks with optional filtering and pagination.
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of tasks
   */
  async list(params: TaskListParams = {}): Promise<TaskListResponse> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.per_page !== undefined) searchParams.set('per_page', String(params.per_page));
    if (params.status !== undefined) searchParams.set('status', params.status);
    if (params.priority !== undefined) searchParams.set('priority', params.priority);
    if (params.assignee !== undefined) searchParams.set('assignee', params.assignee);

    const query = searchParams.toString();
    return fetchApi<TaskListResponse>(`/tasks/${query ? `?${query}` : ''}`);
  },

  /**
   * Get a single task by ID.
   *
   * @param id - Task UUID
   * @returns The requested task
   */
  async get(id: string): Promise<Task> {
    return fetchApi<Task>(`/tasks/${id}`);
  },

  /**
   * Create a new task.
   *
   * @param payload - Task creation data
   * @returns The newly created task
   */
  async create(payload: CreateTaskPayload): Promise<Task> {
    return fetchApi<Task>('/tasks/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update an existing task.
   *
   * @param id - Task UUID
   * @param payload - Partial update data
   * @returns The updated task
   */
  async update(id: string, payload: UpdateTaskPayload): Promise<Task> {
    return fetchApi<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a task by ID.
   *
   * @param id - Task UUID
   */
  async delete(id: string): Promise<void> {
    await fetchApi<void>(`/tasks/${id}`, { method: 'DELETE' });
  },
};
```

### frontend/src/hooks/useTasks.ts

```typescript
/**
 * @module use_tasks_hook
 * @description React hook for task CRUD operations with loading and error state
 * @version 1.0.0
 * @author Tyler Dukes
 * @last_updated 2025-01-15
 * @status stable
 */

import { useCallback, useEffect, useState } from 'react';

import { ApiError, taskApi } from '../services/api';
import type { CreateTaskPayload, Task, TaskListParams, UpdateTaskPayload } from '../types/task';

interface UseTasksState {
  tasks: Task[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseTasksReturn extends UseTasksState {
  refresh: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<Task | null>;
  updateTask: (id: string, payload: UpdateTaskPayload) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
}

/**
 * Custom hook for managing task state and API operations.
 *
 * @param params - Optional query parameters for task list
 * @returns Task state and CRUD operation functions
 */
export function useTasks(params: TaskListParams = {}): UseTasksReturn {
  const [state, setState] = useState<UseTasksState>({
    tasks: [],
    total: 0,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await taskApi.list(params);
      setState({
        tasks: response.tasks,
        total: response.total,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.detail ?? err.message : 'Failed to load tasks';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [params.page, params.per_page, params.status, params.priority, params.assignee]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createTask = useCallback(
    async (payload: CreateTaskPayload): Promise<Task | null> => {
      try {
        const task = await taskApi.create(payload);
        await refresh();
        return task;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.detail ?? err.message : 'Failed to create task';
        setState((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [refresh],
  );

  const updateTask = useCallback(
    async (id: string, payload: UpdateTaskPayload): Promise<Task | null> => {
      try {
        const task = await taskApi.update(id, payload);
        await refresh();
        return task;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.detail ?? err.message : 'Failed to update task';
        setState((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [refresh],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await taskApi.delete(id);
        await refresh();
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.detail ?? err.message : 'Failed to delete task';
        setState((prev) => ({ ...prev, error: message }));
        return false;
      }
    },
    [refresh],
  );

  return {
    ...state,
    refresh,
    createTask,
    updateTask,
    deleteTask,
  };
}
```

### frontend/src/components/TaskList.tsx

```typescript
/**
 * @module task_list_component
 * @description Task list component with filtering and status management
 * @version 1.0.0
 * @author Tyler Dukes
 * @last_updated 2025-01-15
 * @status stable
 */

import type { Task, TaskStatus } from '../types/task';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types/task';

interface TaskListProps {
  readonly tasks: Task[];
  readonly onStatusChange: (id: string, status: TaskStatus) => void;
  readonly onDelete: (id: string) => void;
}

/** Priority badge color mapping for visual distinction. */
const PRIORITY_COLORS: Record<string, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0',
};

export function TaskList({ tasks, onStatusChange, onDelete }: TaskListProps): JSX.Element {
  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <p>No tasks found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id} className="task-card" data-priority={task.priority}>
          <div className="task-header">
            <h3 className="task-title">{task.title}</h3>
            <span
              className="priority-badge"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>

          {task.description && <p className="task-description">{task.description}</p>}

          <div className="task-meta">
            {task.assignee && <span className="task-assignee">@{task.assignee}</span>}
            <span className="task-date">
              {new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="task-actions">
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="status-select"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="delete-button"
              aria-label={`Delete task: ${task.title}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### frontend/src/components/TaskForm.tsx

```typescript
/**
 * @module task_form_component
 * @description Form component for creating new tasks with validation
 * @version 1.0.0
 * @author Tyler Dukes
 * @last_updated 2025-01-15
 * @status stable
 */

import { useState } from 'react';

import type { CreateTaskPayload, TaskPriority } from '../types/task';
import { PRIORITY_LABELS } from '../types/task';

interface TaskFormProps {
  readonly onSubmit: (payload: CreateTaskPayload) => Promise<void>;
  readonly disabled?: boolean;
}

export function TaskForm({ onSubmit, disabled = false }: TaskFormProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });
      // Reset form on success
      setTitle('');
      setDescription('');
      setPriority('medium');
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = disabled || submitting;

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-group">
        <label htmlFor="task-title">Title *</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          maxLength={200}
          required
          disabled={isDisabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          maxLength={2000}
          rows={3}
          disabled={isDisabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor="task-priority">Priority</label>
        <select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          disabled={isDisabled}
        >
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={isDisabled || !title.trim()} className="submit-button">
        {submitting ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
}
```

### frontend/src/App.tsx

```typescript
/**
 * @module taskflow_app
 * @description Root application component for TaskFlow frontend
 * @version 1.0.0
 * @author Tyler Dukes
 * @last_updated 2025-01-15
 * @status stable
 */

import { useState } from 'react';

import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { useTasks } from './hooks/useTasks';
import type { CreateTaskPayload, TaskStatus } from './types/task';

export default function App(): JSX.Element {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);

  const { tasks, total, loading, error, createTask, updateTask, deleteTask } = useTasks({
    status: statusFilter,
    per_page: 50,
  });

  const handleCreate = async (payload: CreateTaskPayload): Promise<void> => {
    await createTask(payload);
  };

  const handleStatusChange = async (id: string, status: TaskStatus): Promise<void> => {
    await updateTask(id, { status });
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deleteTask(id);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TaskFlow</h1>
        <p className="app-subtitle">Task Management - Dukes Style Guide Demo</p>
      </header>

      <main className="app-main">
        <section className="create-section">
          <h2>New Task</h2>
          <TaskForm onSubmit={handleCreate} disabled={loading} />
        </section>

        <section className="list-section">
          <div className="list-header">
            <h2>Tasks ({total})</h2>
            <select
              value={statusFilter ?? ''}
              onChange={(e) =>
                setStatusFilter((e.target.value || undefined) as TaskStatus | undefined)
              }
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {error && <div className="error-banner" role="alert">{error}</div>}
          {loading && <div className="loading-spinner">Loading...</div>}

          {!loading && (
            <TaskList
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          )}
        </section>
      </main>
    </div>
  );
}
```

### frontend/src/main.tsx

```typescript
/**
 * @module taskflow_entry
 * @description Application entry point that mounts React to the DOM
 * @version 1.0.0
 * @author Tyler Dukes
 * @last_updated 2025-01-15
 * @status stable
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html contains <div id="root"></div>.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### Checkpoint: Frontend validation

```bash
# Navigate to frontend and install
cd frontend
npm ci

# Run type checking
npx tsc --noEmit

# Run linter
npm run lint

# Run format check
npm run format:check

# Run tests
npm test

# Build production bundle
npm run build

# Expected: All commands exit 0
```

---

## Step 4: Terraform Infrastructure (10 min)

### infrastructure/modules/ecs/CONTRACT.md

```markdown
# Module Contract: taskflow-ecs

> **Version**: 1.0.0
> **Last Updated**: 2025-01-15
> **Maintained by**: Platform Team
> **Status**: Active

## 1. Purpose

Provisions an ECS Fargate service with an Application Load Balancer for
running the TaskFlow application containers. Handles task definitions,
service discovery, and health check configuration.

## 2. Guarantees

### Resource Guarantees

- **G1**: Creates exactly 1 ECS cluster with Container Insights enabled
- **G2**: Creates 1 Fargate service with configurable desired count (default: 2)
- **G3**: Creates 1 ALB with HTTPS listener and health check
- **G4**: All containers run on Fargate (no EC2 instances)
- **G5**: Task definition includes CloudWatch log group with 30-day retention

### Security Guarantees

- **G6**: IAM task role follows least-privilege (only specified permissions)
- **G7**: Security groups restrict inbound to ALB port only
- **G8**: Container runs as non-root user

### Operational Guarantees

- **G9**: Health check path is configurable (default: /health)
- **G10**: Rolling deployment with minimum 50% healthy tasks

## 3. Test Mapping

| Guarantee | Test File                    | Test Function              |
|-----------|------------------------------|----------------------------|
| G1        | tests/ecs_cluster_test.go    | TestEcsClusterCreation     |
| G2        | tests/ecs_service_test.go    | TestFargateServiceCount    |
| G3        | tests/alb_test.go            | TestAlbHealthCheck         |
| G6        | tests/iam_test.go            | TestTaskRoleLeastPrivilege |
| G7        | tests/security_test.go       | TestSecurityGroupRules     |
```

### infrastructure/modules/ecs/variables.tf

```hcl
# @module taskflow_ecs_variables
# @description Input variables for the TaskFlow ECS Fargate module
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,28}[a-z0-9]$", var.project_name))
    error_message = "Project name must be 4-30 lowercase alphanumeric characters or hyphens."
  }
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "vpc_id" {
  description = "VPC ID where ECS resources will be deployed"
  type        = string

  validation {
    condition     = can(regex("^vpc-[a-f0-9]{8,17}$", var.vpc_id))
    error_message = "VPC ID must be a valid AWS VPC identifier."
  }
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for Fargate tasks"
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "At least 2 private subnets required for high availability."
  }
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  type        = list(string)

  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "At least 2 public subnets required for ALB."
  }
}

variable "container_image" {
  description = "Docker image URI for the backend container"
  type        = string
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8000

  validation {
    condition     = var.container_port > 0 && var.container_port <= 65535
    error_message = "Container port must be between 1 and 65535."
  }
}

variable "desired_count" {
  description = "Desired number of Fargate tasks (G2)"
  type        = number
  default     = 2

  validation {
    condition     = var.desired_count >= 1 && var.desired_count <= 10
    error_message = "Desired count must be between 1 and 10."
  }
}

variable "cpu" {
  description = "CPU units for the Fargate task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.cpu)
    error_message = "CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "memory" {
  description = "Memory in MiB for the Fargate task"
  type        = number
  default     = 512

  validation {
    condition     = var.memory >= 512 && var.memory <= 30720
    error_message = "Memory must be between 512 and 30720 MiB."
  }
}

variable "health_check_path" {
  description = "Health check endpoint path (G9)"
  type        = string
  default     = "/health"
}

variable "tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default     = {}
}
```

### infrastructure/modules/ecs/main.tf

```hcl
# @module taskflow_ecs
# @description ECS Fargate service with ALB for TaskFlow application
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "taskflow-ecs"
  })
}

# ============================================================================
# ECS Cluster (G1)
# ============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

# ============================================================================
# CloudWatch Log Group (G5)
# ============================================================================

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.name_prefix}"
  retention_in_days = 30

  tags = local.common_tags
}

# ============================================================================
# IAM Roles (G6)
# ============================================================================

data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "${local.name_prefix}-task-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task_role" {
  name               = "${local.name_prefix}-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = local.common_tags
}

# ============================================================================
# Security Groups (G7)
# ============================================================================

resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = var.vpc_id
  description = "Security group for TaskFlow ALB"

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP redirect"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${local.name_prefix}-ecs-"
  vpc_id      = var.vpc_id
  description = "Security group for TaskFlow ECS tasks"

  ingress {
    description     = "Allow traffic from ALB only"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# Application Load Balancer (G3)
# ============================================================================

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = local.common_tags
}

resource "aws_lb_target_group" "main" {
  name        = "${local.name_prefix}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path
    port                = "traffic-port"
    matcher             = "200"
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = local.common_tags
}

# ============================================================================
# ECS Task Definition (G4, G5, G8)
# ============================================================================

resource "aws_ecs_task_definition" "main" {
  family                   = "${local.name_prefix}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = "taskflow-api"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      # G8: Run as non-root
      user = "1000:1000"

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}${var.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]
    }
  ])

  tags = local.common_tags
}

data "aws_region" "current" {}

# ============================================================================
# ECS Service (G2, G10)
# ============================================================================

resource "aws_ecs_service" "main" {
  name            = "${local.name_prefix}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "taskflow-api"
    container_port   = var.container_port
  }

  tags = local.common_tags

  depends_on = [aws_lb_listener.http]
}
```

### infrastructure/modules/ecs/outputs.tf

```hcl
# @module taskflow_ecs_outputs
# @description Output values for the TaskFlow ECS module
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Route53 zone ID of the ALB for DNS alias records"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.main.arn
}

output "task_execution_role_arn" {
  description = "ARN of the ECS task execution IAM role"
  value       = aws_iam_role.task_execution.arn
}

output "task_role_arn" {
  description = "ARN of the ECS task IAM role"
  value       = aws_iam_role.task_role.arn
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}

output "log_group_name" {
  description = "CloudWatch log group name for ECS tasks"
  value       = aws_cloudwatch_log_group.ecs.name
}
```

### infrastructure/environments/dev/main.tf

```hcl
# @module taskflow_dev
# @description Development environment configuration for TaskFlow
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "taskflow-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "taskflow"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

# -- Data Sources --
data "aws_vpc" "main" {
  tags = { Name = "taskflow-dev-vpc" }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  tags = { Tier = "private" }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  tags = { Tier = "public" }
}

# -- ECS Module --
module "ecs" {
  source = "../../modules/ecs"

  project_name       = "taskflow"
  environment        = "dev"
  vpc_id             = data.aws_vpc.main.id
  private_subnet_ids = data.aws_subnets.private.ids
  public_subnet_ids  = data.aws_subnets.public.ids
  container_image    = "123456789012.dkr.ecr.us-east-1.amazonaws.com/taskflow:dev"
  container_port     = 8000
  desired_count      = 1
  cpu                = 256
  memory             = 512
  health_check_path  = "/health"

  tags = {
    CostCenter = "engineering"
  }
}

# -- Outputs --
output "alb_dns_name" {
  description = "ALB DNS name for the dev environment"
  value       = module.ecs.alb_dns_name
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}
```

### Checkpoint: Infrastructure validation

```bash
# Navigate to infrastructure directory
cd infrastructure

# Format all Terraform files
terraform fmt -recursive

# Initialize modules for validation
cd modules/ecs && terraform init -backend=false
terraform validate

# Expected output:
# Success! The configuration is valid.

cd ../../environments/dev && terraform init -backend=false
terraform validate

# Verify CONTRACT.md exists
cat modules/ecs/CONTRACT.md | head -5
# Expected: "# Module Contract: taskflow-ecs"
```

---

## Step 5: Docker Configuration (5 min)

### backend/Dockerfile

```dockerfile
# @module taskflow_backend_dockerfile
# @description Multi-stage Docker build for FastAPI backend
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

# ============================================================================
# Stage 1: Build dependencies
# ============================================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first for layer caching
COPY pyproject.toml ./

# Install production dependencies only
RUN uv sync --no-dev --frozen

# ============================================================================
# Stage 2: Production image
# ============================================================================
FROM python:3.11-slim AS production

# Security: Run as non-root user (G8)
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid 1000 --create-home appuser

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /build/.venv /app/.venv

# Copy application source
COPY src/ ./src/

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### frontend/Dockerfile

```dockerfile
# @module taskflow_frontend_dockerfile
# @description Multi-stage Docker build for React frontend
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

# ============================================================================
# Stage 1: Install dependencies
# ============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy dependency manifests for layer caching
COPY package.json package-lock.json ./

# Install production + dev dependencies (needed for build)
RUN npm ci

# ============================================================================
# Stage 2: Build application
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Build production bundle
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ============================================================================
# Stage 3: Production image with nginx
# ============================================================================
FROM nginx:1.27-alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: Run as non-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### frontend/nginx.conf

```text
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing: serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### docker-compose.yml (root)

```yaml
# docker-compose.yml - Local development environment with hot reload
#
# @module taskflow_docker_compose
# @description Docker Compose configuration for local development
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

services:
  # -- Backend API --
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://taskflow:taskflow@db:5432/taskflow
      - ENVIRONMENT=development
    volumes:
      - ./backend/src:/app/src:ro
    command: >
      uvicorn src.main:app
      --host 0.0.0.0
      --port 8000
      --reload
      --reload-dir /app/src
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # -- Frontend SPA --
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: deps
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
    volumes:
      - ./frontend/src:/app/src:ro
      - ./frontend/public:/app/public:ro
    command: npx vite --host 0.0.0.0 --port 3000
    depends_on:
      - backend

  # -- PostgreSQL Database --
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow
      POSTGRES_DB: taskflow
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
    driver: local
```

### Checkpoint: Docker validation

```bash
# Build all images
docker compose build

# Start services
docker compose up -d

# Verify all containers are healthy
docker compose ps

# Expected output:
# NAME                 STATUS
# taskflow-backend-1   Up (healthy)
# taskflow-frontend-1  Up
# taskflow-db-1        Up (healthy)

# Test backend health
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"taskflow-api","timestamp":"..."}

# Test frontend
curl -s http://localhost:3000 | head -5
# Expected: HTML content with <div id="root">

# Tear down
docker compose down
```

---

## Step 6: Monorepo CI/CD (8 min)

### .github/workflows/ci.yml

```yaml
# .github/workflows/ci.yml - Monorepo CI pipeline with path-based triggers
#
# @module taskflow_ci
# @description GitHub Actions CI pipeline for multi-language monorepo
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# Cancel in-progress runs for the same branch
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ========================================================================
  # Detect changed paths
  # ========================================================================
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
      infrastructure: ${{ steps.filter.outputs.infrastructure }}
      docker: ${{ steps.filter.outputs.docker }}
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
              - 'shared/**'
            frontend:
              - 'frontend/**'
              - 'shared/**'
            infrastructure:
              - 'infrastructure/**'
            docker:
              - 'docker-compose.yml'
              - 'backend/Dockerfile'
              - 'frontend/Dockerfile'

  # ========================================================================
  # Pre-commit (runs on all changes)
  # ========================================================================
  pre-commit:
    name: Pre-commit Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - uses: pre-commit/action@v3.0.1

  # ========================================================================
  # Backend CI
  # ========================================================================
  backend:
    name: Backend (Python)
    runs-on: ubuntu-latest
    needs: [changes]
    if: needs.changes.outputs.backend == 'true'
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install uv
        uses: astral-sh/setup-uv@v5

      - name: Install dependencies
        run: uv sync

      - name: Lint with black
        run: uv run black --check src/ tests/

      - name: Lint with flake8
        run: uv run flake8 src/ tests/

      - name: Type check with mypy
        run: uv run mypy src/

      - name: Run tests with coverage
        run: uv run pytest tests/ -v --cov=src --cov-report=xml --cov-report=term-missing

      - name: Upload coverage
        if: github.event_name == 'pull_request'
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage.xml

  # ========================================================================
  # Frontend CI
  # ========================================================================
  frontend:
    name: Frontend (TypeScript)
    runs-on: ubuntu-latest
    needs: [changes]
    if: needs.changes.outputs.frontend == 'true'
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Run tests
        run: npm test -- --coverage

      - name: Build production bundle
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist
          retention-days: 7

  # ========================================================================
  # Infrastructure CI
  # ========================================================================
  infrastructure:
    name: Infrastructure (Terraform)
    runs-on: ubuntu-latest
    needs: [changes]
    if: needs.changes.outputs.infrastructure == 'true'
    defaults:
      run:
        working-directory: infrastructure
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.0"

      - name: Terraform format check
        run: terraform fmt -check -recursive

      - name: Validate ECS module
        run: |
          cd modules/ecs
          terraform init -backend=false
          terraform validate

      - name: Validate dev environment
        run: |
          cd environments/dev
          terraform init -backend=false
          terraform validate

  # ========================================================================
  # Docker Build Validation
  # ========================================================================
  docker:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: [changes]
    if: needs.changes.outputs.docker == 'true'
    steps:
      - uses: actions/checkout@v4

      - name: Build backend image
        run: docker build -t taskflow-backend:test ./backend

      - name: Build frontend image
        run: docker build -t taskflow-frontend:test ./frontend

      - name: Verify backend health
        run: |
          docker run -d --name backend-test -p 8000:8000 taskflow-backend:test
          sleep 5
          curl -f http://localhost:8000/health
          docker stop backend-test

  # ========================================================================
  # CI Status Gate
  # ========================================================================
  ci-status:
    name: CI Status
    runs-on: ubuntu-latest
    needs: [pre-commit, backend, frontend, infrastructure, docker]
    if: always()
    steps:
      - name: Check job results
        run: |
          echo "Pre-commit: ${{ needs.pre-commit.result }}"
          echo "Backend:    ${{ needs.backend.result }}"
          echo "Frontend:   ${{ needs.frontend.result }}"
          echo "Infra:      ${{ needs.infrastructure.result }}"
          echo "Docker:     ${{ needs.docker.result }}"

          # Fail if any required job failed (skipped is ok)
          if [[ "${{ needs.pre-commit.result }}" == "failure" ]]; then
            echo "::error::Pre-commit checks failed"
            exit 1
          fi
          if [[ "${{ needs.backend.result }}" == "failure" ]]; then
            echo "::error::Backend CI failed"
            exit 1
          fi
          if [[ "${{ needs.frontend.result }}" == "failure" ]]; then
            echo "::error::Frontend CI failed"
            exit 1
          fi
          if [[ "${{ needs.infrastructure.result }}" == "failure" ]]; then
            echo "::error::Infrastructure CI failed"
            exit 1
          fi
          if [[ "${{ needs.docker.result }}" == "failure" ]]; then
            echo "::error::Docker build failed"
            exit 1
          fi

          echo "All CI checks passed!"
```

### .github/workflows/deploy.yml

```yaml
# .github/workflows/deploy.yml - Deployment pipeline for staging and production
#
# @module taskflow_deploy
# @description Deployment workflow triggered after CI passes on main
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

name: Deploy

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Login to ECR
        id: ecr-login
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push backend image
        env:
          ECR_REGISTRY: ${{ steps.ecr-login.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/taskflow-backend:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/taskflow-backend:$IMAGE_TAG

      - name: Build and push frontend image
        env:
          ECR_REGISTRY: ${{ steps.ecr-login.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build \
            --build-arg VITE_API_URL=https://api.staging.taskflow.example.com/api/v1 \
            -t $ECR_REGISTRY/taskflow-frontend:$IMAGE_TAG \
            ./frontend
          docker push $ECR_REGISTRY/taskflow-frontend:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster taskflow-staging-cluster \
            --service taskflow-staging-service \
            --force-new-deployment \
            --region us-east-1
```

### Checkpoint: CI/CD validation

```bash
# Validate workflow syntax
# Install actionlint: https://github.com/rhysd/actionlint
actionlint .github/workflows/ci.yml
actionlint .github/workflows/deploy.yml

# Verify YAML syntax
yamllint .github/workflows/ci.yml
yamllint .github/workflows/deploy.yml

# Expected: No errors
```

---

## Step 7: Cross-Language Validation (2 min)

### Shared JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TaskFlow Task",
  "description": "Shared schema for task validation across backend and frontend",
  "type": "object",
  "required": ["title"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique task identifier"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "description": "Task title"
    },
    "description": {
      "type": ["string", "null"],
      "maxLength": 2000,
      "description": "Task description"
    },
    "status": {
      "type": "string",
      "enum": ["todo", "in_progress", "done", "archived"],
      "default": "todo"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "default": "medium"
    },
    "assignee": {
      "type": ["string", "null"],
      "maxLength": 100
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

The shared schema in `shared/schemas/task.schema.json` ensures that both the Python backend (Pydantic models) and the TypeScript frontend (type definitions) stay in sync.

### Root validation script

```bash
#!/usr/bin/env bash
# scripts/validate-all.sh - Cross-language validation orchestrator
#
# @module validate_all
# @description Runs validation for all monorepo components
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

log_pass() { echo -e "${GREEN}PASS${NC}: $1"; }
log_fail() { echo -e "${RED}FAIL${NC}: $1"; FAILED=1; }
log_info() { echo -e "${YELLOW}INFO${NC}: $1"; }

echo "============================================="
echo "TaskFlow Monorepo Validation"
echo "============================================="
echo ""

# -- Backend --
log_info "Validating Python backend..."
cd "$ROOT_DIR/backend"
if uv run black --check src/ tests/ 2>/dev/null; then
    log_pass "Backend formatting (black)"
else
    log_fail "Backend formatting (black)"
fi

if uv run flake8 src/ tests/ 2>/dev/null; then
    log_pass "Backend linting (flake8)"
else
    log_fail "Backend linting (flake8)"
fi

if uv run pytest tests/ -q 2>/dev/null; then
    log_pass "Backend tests (pytest)"
else
    log_fail "Backend tests (pytest)"
fi

# -- Frontend --
log_info "Validating TypeScript frontend..."
cd "$ROOT_DIR/frontend"
if npx tsc --noEmit 2>/dev/null; then
    log_pass "Frontend type checking (tsc)"
else
    log_fail "Frontend type checking (tsc)"
fi

if npm run lint 2>/dev/null; then
    log_pass "Frontend linting (eslint)"
else
    log_fail "Frontend linting (eslint)"
fi

if npm test 2>/dev/null; then
    log_pass "Frontend tests (vitest)"
else
    log_fail "Frontend tests (vitest)"
fi

# -- Infrastructure --
log_info "Validating Terraform infrastructure..."
cd "$ROOT_DIR/infrastructure"
if terraform fmt -check -recursive 2>/dev/null; then
    log_pass "Terraform formatting (fmt)"
else
    log_fail "Terraform formatting (fmt)"
fi

# -- Pre-commit --
log_info "Running pre-commit hooks..."
cd "$ROOT_DIR"
if pre-commit run --all-files 2>/dev/null; then
    log_pass "Pre-commit hooks"
else
    log_fail "Pre-commit hooks"
fi

echo ""
echo "============================================="
if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}All validations passed!${NC}"
    exit 0
else
    echo -e "${RED}Some validations failed.${NC}"
    exit 1
fi
```

### Run full validation

```bash
# Using Make
make validate

# Or using the validation script directly
bash scripts/validate-all.sh

# Expected output:
# =============================================
# TaskFlow Monorepo Validation
# =============================================
#
# INFO: Validating Python backend...
# PASS: Backend formatting (black)
# PASS: Backend linting (flake8)
# PASS: Backend tests (pytest)
# INFO: Validating TypeScript frontend...
# PASS: Frontend type checking (tsc)
# PASS: Frontend linting (eslint)
# PASS: Frontend tests (vitest)
# INFO: Validating Terraform infrastructure...
# PASS: Terraform formatting (fmt)
# INFO: Running pre-commit hooks...
# PASS: Pre-commit hooks
#
# =============================================
# All validations passed!
```

---

## Checkpoint: Final Verification

Run through this checklist to confirm everything is correctly set up.

```text
Final Verification Checklist
=============================
[ ] Root .editorconfig exists with language-specific settings
[ ] Root .pre-commit-config.yaml covers Python, TypeScript, Terraform, Shell, YAML, Markdown
[ ] Root Makefile has targets: setup, dev, test, lint, format, validate, clean
[ ] Root docker-compose.yml starts backend, frontend, and database

Backend (Python):
[ ] pyproject.toml has project metadata, dependencies, and tool config
[ ] src/main.py has FastAPI app with /health and /ready endpoints
[ ] src/models/task.py has Pydantic models with field validation
[ ] src/routes/tasks.py has full CRUD (POST, GET, PATCH, DELETE)
[ ] All .py files have @module metadata tags
[ ] Tests pass: uv run pytest tests/ -v
[ ] Linting passes: uv run black --check src/ tests/ && uv run flake8 src/ tests/

Frontend (TypeScript):
[ ] tsconfig.json has strict: true
[ ] package.json has lint, format, format:check, test, build scripts
[ ] src/types/task.ts has typed interfaces matching backend models
[ ] src/services/api.ts has typed API client with error handling
[ ] src/hooks/useTasks.ts has custom hook with CRUD operations
[ ] src/components/TaskList.tsx and TaskForm.tsx are fully typed
[ ] src/App.tsx composes all components
[ ] All .ts/.tsx files have @module JSDoc metadata

Infrastructure (Terraform):
[ ] modules/ecs/CONTRACT.md has numbered guarantees (G1-G10)
[ ] modules/ecs/variables.tf has validation blocks on all inputs
[ ] modules/ecs/main.tf references guarantee numbers in comments
[ ] modules/ecs/outputs.tf exports all required values
[ ] environments/dev/main.tf uses the ECS module
[ ] terraform fmt -check -recursive passes
[ ] terraform validate passes for all modules

Docker:
[ ] backend/Dockerfile is multi-stage with non-root user
[ ] frontend/Dockerfile is multi-stage with nginx serving
[ ] docker-compose.yml has health checks on backend and database
[ ] docker compose build succeeds

CI/CD:
[ ] .github/workflows/ci.yml uses path-based triggers
[ ] CI runs backend/frontend/infra jobs in parallel
[ ] CI has a status gate job that aggregates results
[ ] .github/workflows/deploy.yml triggers after CI passes
```

```bash
# Quick automated check
echo "--- Checking file existence ---"
for f in \
  .editorconfig \
  .pre-commit-config.yaml \
  Makefile \
  docker-compose.yml \
  backend/pyproject.toml \
  backend/src/main.py \
  backend/src/models/task.py \
  backend/src/routes/tasks.py \
  backend/tests/test_tasks.py \
  frontend/package.json \
  frontend/tsconfig.json \
  frontend/src/App.tsx \
  frontend/src/types/task.ts \
  frontend/src/services/api.ts \
  infrastructure/modules/ecs/CONTRACT.md \
  infrastructure/modules/ecs/main.tf \
  infrastructure/modules/ecs/variables.tf \
  infrastructure/modules/ecs/outputs.tf \
  infrastructure/environments/dev/main.tf \
  .github/workflows/ci.yml \
  .github/workflows/deploy.yml; do
  if [ -f "$f" ]; then
    echo "  FOUND: $f"
  else
    echo "  MISSING: $f"
  fi
done
```

---

## Common Troubleshooting

### Problem: Pre-commit hooks fail on TypeScript files

```text
Symptom: ESLint errors about missing parser or plugin
```

```bash
# Solution: Install ESLint dependencies in the frontend directory
cd frontend && npm install

# Then retry pre-commit
pre-commit run --all-files
```

### Problem: Docker Compose backend fails to connect to database

```text
Symptom: asyncpg.exceptions.ConnectionDoesNotExistError
```

```bash
# Solution: Ensure the database is healthy before starting the backend
docker compose up db -d
docker compose exec db pg_isready -U taskflow

# Once healthy, start the backend
docker compose up backend -d
```

### Problem: Terraform validate fails with provider errors

```text
Symptom: "Failed to query available provider packages"
```

```bash
# Solution: Initialize with -backend=false for local validation
cd infrastructure/modules/ecs
terraform init -backend=false
terraform validate
```

### Problem: Frontend build fails with type errors after backend model changes

```text
Symptom: TypeScript errors in api.ts or types/task.ts
```

```bash
# Solution: Regenerate types from the shared schema
# Compare shared/schemas/task.schema.json with frontend types
diff <(jq '.properties | keys' shared/schemas/task.schema.json) \
     <(grep -oP 'readonly \K\w+|^\s+\K\w+(?=[\?:])'  frontend/src/types/task.ts | sort -u)

# Update frontend/src/types/task.ts to match any new fields
```

### Problem: CI workflow skips all jobs

```text
Symptom: All backend/frontend/infra jobs show as "skipped"
```

```yaml
# Cause: The paths-filter detects no changes in the relevant directories.
# This is expected behavior when changes only affect files outside
# backend/, frontend/, and infrastructure/.
#
# The pre-commit job always runs regardless of path changes.
# The ci-status gate treats "skipped" as passing.
```

### Problem: Makefile targets fail with "command not found"

```text
Symptom: make: uv: command not found
```

```bash
# Solution: Ensure uv is installed and in PATH
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Add to your shell profile
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
uv --version
make setup-backend
```

### Problem: Port conflicts when running locally

```text
Symptom: "address already in use" errors on ports 8000, 3000, or 5432
```

```bash
# Find and kill processes using the ports
lsof -i :8000 -i :3000 -i :5432

# Or use different ports in docker-compose override
# Create docker-compose.override.yml:
cat > docker-compose.override.yml << 'OVERRIDE'
services:
  backend:
    ports:
      - "8001:8000"
  frontend:
    ports:
      - "3001:3000"
  db:
    ports:
      - "5433:5432"
OVERRIDE
```

---

## Next Steps

After completing this tutorial, consider these follow-up activities.

```text
Recommended Next Steps
======================
1. Add database migrations with Alembic (backend/alembic/)
2. Add end-to-end tests with Playwright (e2e/)
3. Add Terraform modules for RDS and networking
4. Set up staging environment in infrastructure/environments/staging/
5. Add monitoring with CloudWatch dashboards
6. Implement JWT authentication in the backend
7. Add the Dukes metadata validation script to the CI pipeline
```

### Related Style Guide References

```text
Reference                                    Section
-----------------------------------------------------
Python conventions                           02_language_guides/python
TypeScript conventions                       02_language_guides/typescript
Terraform conventions                        02_language_guides/terraform
Docker conventions                           02_language_guides/docker
GitHub Actions conventions                   02_language_guides/github_actions
Makefile conventions                         02_language_guides/makefile
CONTRACT.md template                         04_templates/contract_template
IaC testing standards                        05_ci_cd/iac_testing
```
