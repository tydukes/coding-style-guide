---
title: "Complete Monorepo Full-Stack Example"
description: "Full working monorepo with Python backend, TypeScript frontend, and Terraform infrastructure"
author: "Tyler Dukes"
tags: [monorepo, fullstack, python, typescript, terraform, example, best-practices]
category: "Examples"
status: "active"
---

<!-- markdownlint-disable MD013 -->

## Overview

This is a complete, working example of a production-ready full-stack monorepo called **acme-platform** - a
task management platform with a Python API backend, TypeScript React frontend, and Terraform infrastructure.
It demonstrates cross-technology integration patterns including multi-language CI/CD, shared Docker Compose
environments, and contract-based infrastructure modules.

**Project Purpose**: A unified repository containing all components of a task management platform with
independent validation pipelines and coordinated deployment.

---

## Repository Structure

```text
acme-platform/
├── backend/
│   ├── src/
│   │   └── acme_api/
│   │       ├── __init__.py
│   │       ├── main.py
│   │       ├── config.py
│   │       ├── models.py
│   │       ├── routes/
│   │       │   ├── __init__.py
│   │       │   ├── health.py
│   │       │   └── tasks.py
│   │       └── schemas.py
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_tasks.py
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   └── TaskList.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── index.ts
│   ├── tests/
│   │   └── TaskList.test.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── infra/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── versions.tf
│   ├── environments/
│   │   ├── dev.tfvars
│   │   └── prod.tfvars
│   └── CONTRACT.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .pre-commit-config.yaml
├── .editorconfig
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Makefile

```makefile
.PHONY: help up down test lint backend-test frontend-test infra-validate

help: ## Show available targets
 @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services locally
 docker compose up -d --build

down: ## Stop all services
 docker compose down -v

test: backend-test frontend-test infra-validate ## Run all tests

backend-test: ## Run backend tests
 cd backend && pip install -e ".[dev]" && pytest

frontend-test: ## Run frontend tests
 cd frontend && npm ci && npm test

infra-validate: ## Validate Terraform configuration
 cd infra && terraform init -backend=false && terraform validate && terraform fmt -check

lint: ## Run all linters
 cd backend && black --check . && flake8 src/ tests/
 cd frontend && npm run lint && npm run format:check
 cd infra && terraform fmt -check -recursive

clean: ## Remove build artifacts
 rm -rf backend/dist frontend/dist
 find . -type d -name __pycache__ -exec rm -rf {} +
 find . -type d -name node_modules -exec rm -rf {} +
```

---

## docker-compose.yml

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://acme:acme@db:5432/acme
      - ENVIRONMENT=development
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 10s
      timeout: 5s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      backend:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=acme
      - POSTGRES_PASSWORD=acme
      - POSTGRES_DB=acme
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U acme"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
```

---

## .editorconfig

```ini
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{ts,tsx,js,jsx,json,css,yml,yaml}]
indent_size = 2

[*.{tf,tfvars}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

---

## .pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: [--unsafe]
      - id: check-json
      - id: check-added-large-files
        args: [--maxkb=1000]
      - id: detect-private-key

  # Python (backend)
  - repo: https://github.com/psf/black
    rev: "24.10.0"
    hooks:
      - id: black
        files: ^backend/

  - repo: https://github.com/PyCQA/flake8
    rev: "7.1.1"
    hooks:
      - id: flake8
        files: ^backend/
        args: [--max-line-length=100, --extend-ignore=E203]

  # Terraform (infra)
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.96.3
    hooks:
      - id: terraform_fmt
        files: ^infra/
      - id: terraform_validate
        files: ^infra/
```

---

## backend/pyproject.toml

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "acme-api"
version = "1.0.0"
description = "Backend API for the ACME platform"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115,<1",
    "uvicorn[standard]>=0.34,<1",
    "sqlalchemy>=2.0,<3",
    "psycopg2-binary>=2.9,<3",
    "pydantic>=2.10,<3",
    "alembic>=1.14,<2",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3,<9",
    "pytest-cov>=6.0,<7",
    "httpx>=0.28,<1",
    "black>=24.10,<25",
    "flake8>=7.1,<8",
    "mypy>=1.13,<2",
]

[tool.black]
line-length = 100
target-version = ["py311"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=src/acme_api --cov-report=term-missing"
```

---

## backend/src/acme_api/\_\_init\_\_.py

```python
"""
@module acme_api
@description Backend API for the ACME task management platform
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""
```

---

## backend/src/acme_api/config.py

```python
"""Application configuration using Pydantic settings."""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    environment: str = "development"
    database_url: str = "postgresql://acme:acme@localhost:5432/acme"
    allowed_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()
```

---

## backend/src/acme_api/models.py

```python
"""SQLAlchemy database models."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from acme_api.config import settings


class Base(DeclarativeBase):
    """Base class for all models."""


class Task(Base):
    """Task entity."""

    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        Enum("pending", "in_progress", "completed", "cancelled", name="task_status"),
        nullable=False,
        default="pending",
    )
    priority = Column(
        Enum("low", "medium", "high", "critical", name="task_priority"),
        nullable=False,
        default="medium",
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)


def get_db() -> Session:
    """Yield a database session, closing it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## backend/src/acme_api/schemas.py

```python
"""Pydantic request and response schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    """Valid task statuses."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Valid task priorities."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskCreate(BaseModel):
    """Schema for creating a task."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM


class TaskUpdate(BaseModel):
    """Schema for updating a task."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class TaskResponse(BaseModel):
    """Schema for task API responses."""

    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedTasks(BaseModel):
    """Paginated list of tasks."""

    tasks: list[TaskResponse]
    total: int
    page: int
    pages: int
```

---

## backend/src/acme_api/routes/health.py

```python
"""Health check endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """Shallow health check."""
    return {"status": "healthy", "service": "acme-api"}
```

---

## backend/src/acme_api/routes/tasks.py

```python
"""Task CRUD endpoints."""

from __future__ import annotations

from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from acme_api.models import Task, get_db
from acme_api.schemas import (
    PaginatedTasks,
    TaskCreate,
    TaskResponse,
    TaskStatus,
    TaskUpdate,
)

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("", response_model=PaginatedTasks)
async def list_tasks(
    status: TaskStatus | None = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> PaginatedTasks:
    """List tasks with optional status filter and pagination."""
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status.value)

    total = query.count()
    tasks = query.order_by(Task.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedTasks(
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
        page=page,
        pages=ceil(total / per_page) if total > 0 else 0,
    )


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(payload: TaskCreate, db: Session = Depends(get_db)) -> TaskResponse:
    """Create a new task."""
    task = Task(
        title=payload.title,
        description=payload.description,
        priority=payload.priority.value,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: Session = Depends(get_db)) -> TaskResponse:
    """Retrieve a task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)
) -> TaskResponse:
    """Partially update a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value.value if hasattr(value, "value") else value)

    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: int, db: Session = Depends(get_db)) -> None:
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
```

---

## backend/src/acme_api/main.py

```python
"""FastAPI application entrypoint."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from acme_api.config import settings
from acme_api.routes import health, tasks


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="ACME Platform API",
        version="1.0.0",
        docs_url="/docs" if settings.environment != "production" else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(tasks.router)

    return app


app = create_app()
```

---

## backend/tests/conftest.py

```python
"""Shared pytest fixtures for backend tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from acme_api.main import create_app
from acme_api.models import Base, get_db


@pytest.fixture()
def db_session():
    """Create an in-memory SQLite session for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session):
    """Provide a FastAPI test client with overridden DB dependency."""
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)
```

---

## backend/tests/test_tasks.py

```python
"""Tests for task API endpoints."""


class TestCreateTask:
    """POST /api/v1/tasks"""

    def test_create_task(self, client):
        response = client.post("/api/v1/tasks", json={"title": "Write tests"})
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Write tests"
        assert data["status"] == "pending"
        assert data["priority"] == "medium"

    def test_create_task_with_priority(self, client):
        response = client.post(
            "/api/v1/tasks",
            json={"title": "Deploy", "priority": "critical"},
        )
        assert response.status_code == 201
        assert response.json()["priority"] == "critical"

    def test_create_task_missing_title(self, client):
        response = client.post("/api/v1/tasks", json={"description": "no title"})
        assert response.status_code == 422


class TestListTasks:
    """GET /api/v1/tasks"""

    def test_list_empty(self, client):
        response = client.get("/api/v1/tasks")
        assert response.status_code == 200
        assert response.json()["tasks"] == []

    def test_list_with_tasks(self, client):
        client.post("/api/v1/tasks", json={"title": "A"})
        client.post("/api/v1/tasks", json={"title": "B"})
        response = client.get("/api/v1/tasks")
        assert response.json()["total"] == 2


class TestGetTask:
    """GET /api/v1/tasks/<id>"""

    def test_get_existing(self, client):
        create = client.post("/api/v1/tasks", json={"title": "Fetch me"})
        task_id = create.json()["id"]
        response = client.get(f"/api/v1/tasks/{task_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Fetch me"

    def test_get_not_found(self, client):
        response = client.get("/api/v1/tasks/9999")
        assert response.status_code == 404


class TestUpdateTask:
    """PATCH /api/v1/tasks/<id>"""

    def test_update_status(self, client):
        create = client.post("/api/v1/tasks", json={"title": "Update me"})
        task_id = create.json()["id"]
        response = client.patch(
            f"/api/v1/tasks/{task_id}", json={"status": "completed"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "completed"


class TestDeleteTask:
    """DELETE /api/v1/tasks/<id>"""

    def test_delete_task(self, client):
        create = client.post("/api/v1/tasks", json={"title": "Delete me"})
        task_id = create.json()["id"]
        response = client.delete(f"/api/v1/tasks/{task_id}")
        assert response.status_code == 204
```

---

## backend/Dockerfile

```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /build
COPY pyproject.toml .
RUN pip install --no-cache-dir .

FROM python:3.12-slim AS runtime

RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY src/ ./src/

USER app
EXPOSE 8000

CMD ["uvicorn", "acme_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## frontend/package.json

```json
{
  "name": "acme-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "lint": "eslint src/ tests/",
    "format:check": "prettier --check 'src/**/*.{ts,tsx}'"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^9.17.0",
    "jsdom": "^25.0.0",
    "prettier": "^3.4.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.18.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

---

## frontend/tsconfig.json

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
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## frontend/vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/health": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
```

---

## frontend/src/types/index.ts

```typescript
export interface Task {
  readonly id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  pages: number;
}
```

---

## frontend/src/services/api.ts

```typescript
import type { PaginatedTasks, Task } from "../types";

const BASE = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const fetchTasks = (): Promise<PaginatedTasks> => request("/tasks");

export const createTask = (title: string): Promise<Task> =>
  request("/tasks", { method: "POST", body: JSON.stringify({ title }) });

export const deleteTask = (id: number): Promise<void> =>
  request(`/tasks/${id}`, { method: "DELETE" });
```

---

## frontend/src/App.tsx

```typescript
import { TaskList } from "./components/TaskList";

export function App(): React.JSX.Element {
  return (
    <main>
      <h1>ACME Platform</h1>
      <TaskList />
    </main>
  );
}
```

---

## frontend/src/components/TaskList.tsx

```typescript
import { useCallback, useEffect, useState } from "react";

import type { Task } from "../types";
import * as api from "../services/api";

export function TaskList(): React.JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await api.fetchTasks();
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleAdd = async (): Promise<void> => {
    if (!title.trim()) return;
    await api.createTask(title.trim());
    setTitle("");
    await refresh();
  };

  const handleDelete = async (id: number): Promise<void> => {
    await api.deleteTask(id);
    await refresh();
  };

  if (error) return <p role="alert">Error: {error}</p>;

  return (
    <section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleAdd();
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" />
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              {task.title} ({task.status})
              <button onClick={() => void handleDelete(task.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

---

## frontend/tests/TaskList.test.tsx

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskList } from "../src/components/TaskList";
import * as api from "../src/services/api";

vi.mock("../src/services/api");
const mockedApi = vi.mocked(api);

describe("TaskList", () => {
  it("shows loading state", () => {
    mockedApi.fetchTasks.mockReturnValue(new Promise(() => {}));
    render(<TaskList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders tasks after loading", async () => {
    mockedApi.fetchTasks.mockResolvedValue({
      tasks: [
        {
          id: 1,
          title: "Task A",
          description: null,
          status: "pending",
          priority: "medium",
          created_at: "2025-01-15T00:00:00Z",
          updated_at: "2025-01-15T00:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      pages: 1,
    });
    render(<TaskList />);
    await waitFor(() => expect(screen.getByText(/task a/i)).toBeInTheDocument());
  });
});
```

---

## frontend/Dockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / { try_files $uri /index.html; }\n  location /api { proxy_pass http://backend:8000; }\n  location /health { proxy_pass http://backend:8000; }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## infra/versions.tf

```hcl
terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

---

## infra/variables.tf

```hcl
variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "acme-platform"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "container_port" {
  description = "Port the backend container listens on"
  type        = number
  default     = 8000
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
```

---

## infra/main.tf

```hcl
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = merge(
      {
        Project     = var.project_name
        Environment = var.environment
        ManagedBy   = "terraform"
      },
      var.tags
    )
  }
}

# --- Networking ---

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project_name}-${var.environment}-vpc" }
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-${var.environment}-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "${var.project_name}-${var.environment}-private-${count.index}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-${var.environment}-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-${var.environment}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# --- Database ---

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${var.project_name}-${var.environment}-db-subnet" }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_encrypted = true

  db_name  = "acme"
  username = "acme_admin"
  password = "CHANGE_ME_USE_SECRETS_MANAGER"

  db_subnet_group_name = aws_db_subnet_group.main.name
  multi_az             = var.environment == "prod" ? true : false
  skip_final_snapshot  = var.environment != "prod"

  tags = { Name = "${var.project_name}-${var.environment}-db" }
}

# --- ECS Cluster ---

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.project_name}-${var.environment}-cluster" }
}
```

---

## infra/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}
```

---

## infra/environments/dev.tfvars

```hcl
environment        = "dev"
vpc_cidr           = "10.0.0.0/16"
db_instance_class  = "db.t3.micro"
db_allocated_storage = 20

tags = {
  CostCenter = "engineering"
}
```

---

## infra/environments/prod.tfvars

```hcl
environment        = "prod"
vpc_cidr           = "10.1.0.0/16"
db_instance_class  = "db.r6g.large"
db_allocated_storage = 100

tags = {
  CostCenter  = "production"
  Compliance  = "soc2"
}
```

---

## infra/CONTRACT.md

```markdown
# Infrastructure Contract: acme-platform

## Purpose

Provisions the core infrastructure for the ACME task management platform including
networking, database, and container orchestration resources on AWS.

## Guarantees

- **G1**: Creates exactly 1 VPC with DNS hostnames and DNS support enabled
- **G2**: Creates 2 public subnets distributed across 2 availability zones
- **G3**: Creates 2 private subnets in separate availability zones for database isolation
- **G4**: RDS instance uses encrypted storage by default
- **G5**: Production RDS is deployed in Multi-AZ configuration
- **G6**: ECS cluster has Container Insights enabled for observability
- **G7**: All resources are tagged with Project, Environment, and ManagedBy
- **G8**: Non-production environments skip final DB snapshot for faster teardown

## Inputs

| Variable              | Type        | Required | Default         | Validation               |
|-----------------------|-------------|----------|-----------------|--------------------------|
| environment           | string      | yes      | -               | dev, staging, prod       |
| project_name          | string      | no       | acme-platform   | -                        |
| vpc_cidr              | string      | no       | 10.0.0.0/16     | Valid IPv4 CIDR          |
| db_instance_class     | string      | no       | db.t3.micro     | -                        |
| db_allocated_storage  | number      | no       | 20              | -                        |
| container_port        | number      | no       | 8000            | -                        |
| tags                  | map(string) | no       | {}              | -                        |

## Outputs

| Output             | Description                |
|--------------------|----------------------------|
| vpc_id             | ID of the VPC              |
| public_subnet_ids  | IDs of public subnets      |
| private_subnet_ids | IDs of private subnets     |
| db_endpoint        | RDS instance endpoint      |
| ecs_cluster_arn    | ARN of the ECS cluster     |

## Platform Requirements

| Requirement        | Value            |
|--------------------|------------------|
| Terraform          | >= 1.9           |
| AWS Provider       | ~> 5.0           |
| AWS Region         | us-east-1        |

## Breaking Changes Policy

- Major version bumps may rename outputs or change resource types
- Minor versions add resources; existing outputs are preserved
- Patch versions fix bugs without structural changes
- 30-day deprecation notice before removing any output

## Test Mapping

| Test                    | Guarantees Covered |
|-------------------------|-------------------|
| test_vpc_creation       | G1, G2, G3        |
| test_rds_encryption     | G4, G5            |
| test_ecs_cluster        | G6                |
| test_resource_tagging   | G7                |
| test_non_prod_snapshot  | G8                |
```

---

## .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    strategy:
      matrix:
        python-version: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: pip install -e ".[dev]"

      - name: Lint
        run: |
          black --check .
          flake8 src/ tests/

      - name: Type check
        run: mypy src/

      - name: Test
        run: pytest

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build

  infrastructure:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infra
    steps:
      - uses: actions/checkout@v4

      - name: Set up Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Format check
        run: terraform fmt -check -recursive

      - name: Initialize
        run: terraform init -backend=false

      - name: Validate
        run: terraform validate
```

---

## .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment"
        required: true
        type: choice
        options:
          - dev
          - prod

permissions:
  contents: read
  id-token: write

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Build and push backend image
        run: |
          echo "Building backend image for ${{ inputs.environment }}"
          echo "docker build -t acme-api:${{ github.sha }} backend/"

      - name: Deploy to ECS
        run: |
          echo "Deploying backend to ${{ inputs.environment }}"
          echo "aws ecs update-service --cluster acme-platform-${{ inputs.environment }}"

  deploy-frontend:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v4

      - name: Build frontend
        working-directory: frontend
        run: |
          npm ci
          npm run build

      - name: Deploy to S3/CloudFront
        run: |
          echo "Deploying frontend to ${{ inputs.environment }}"
          echo "aws s3 sync frontend/dist/ s3://acme-platform-${{ inputs.environment }}/"

  deploy-infrastructure:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Plan
        working-directory: infra
        run: |
          terraform init
          terraform plan -var-file=environments/${{ inputs.environment }}.tfvars -out=plan.tfplan

      - name: Apply
        if: inputs.environment == 'dev'
        working-directory: infra
        run: terraform apply plan.tfplan
```

---

## Key Takeaways

This complete monorepo full-stack example demonstrates:

1. **Root Orchestration**: `Makefile` provides unified targets for testing, linting, and running all services
2. **Docker Compose Integration**: Single `docker-compose.yml` runs the entire stack with health checks and dependencies
3. **Multi-language Pre-commit**: Single `.pre-commit-config.yaml` runs Python linters on `backend/` and Terraform formatters on `infra/`
4. **Parallel CI Jobs**: Backend, frontend, and infrastructure validate independently in parallel
5. **FastAPI + React**: Modern Python backend with Pydantic schemas paired with TypeScript React frontend
6. **Shared Types**: API contract enforced by matching Pydantic models and TypeScript interfaces
7. **Contract-Based Infrastructure**: `CONTRACT.md` with numbered guarantees (G1-G8) mapped to specific tests
8. **Environment-Specific Configuration**: Terraform `.tfvars` files for dev and prod with appropriate sizing
9. **Staged Deployment**: Deploy workflow targets individual environments with manual approval gates
10. **EditorConfig**: Consistent formatting across Python (4 spaces), TypeScript (2 spaces), and Terraform (2 spaces)

The monorepo is production-ready and demonstrates how multiple technologies can coexist with
independent validation pipelines and coordinated deployment.

---

**Status**: Active
