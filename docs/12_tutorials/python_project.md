---
title: "Tutorial 1: Zero to Validated Python Project"
description: "Build a production-ready Flask API from scratch with full validation, testing, and CI/CD in 30 minutes"
author: "Tyler Dukes"
tags: [tutorial, python, flask, testing, ci-cd, validation, beginner, uv, pre-commit]
category: "Tutorials"
status: "active"
search_keywords: [tutorial, python project, setup, validation, testing, beginner, step by step]
---

<!-- markdownlint-disable MD013 -->

## Overview

### What You Will Build

A production-ready Flask REST API for task management with:

- Application factory pattern
- Typed data models
- CRUD endpoints with error handling
- Health check endpoint
- Full test suite
- Pre-commit validation hooks
- GitHub Actions CI/CD pipeline
- Dukes-compliant metadata on all source files

```text
my-flask-api/
├── pyproject.toml
├── .editorconfig
├── .pre-commit-config.yaml
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   └── my_flask_api/
│       ├── __init__.py
│       ├── app.py
│       ├── config.py
│       ├── models.py
│       └── routes.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    └── test_routes.py
```

### Estimated Time

30 minutes.

### Prerequisites

```bash
# Verify prerequisites
python3 --version   # Python 3.11+
git --version       # Git 2.30+
uv --version        # uv 0.4+
```

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## Step 1: Project Setup (5 min)

### Create the Project Directory

```bash
# Create project and navigate into it
mkdir my-flask-api && cd my-flask-api

# Initialize git repository
git init

# Create the source and test directories
mkdir -p src/my_flask_api tests .github/workflows
```

### Initialize with pyproject.toml

```toml
# pyproject.toml
[project]
name = "my-flask-api"
version = "0.1.0"
description = "A production-ready Flask REST API following DevOps Engineering Style Guide"
requires-python = ">=3.11"
license = { text = "MIT" }
authors = [
    { name = "Your Name", email = "you@example.com" },
]
dependencies = [
    "flask>=3.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-cov>=6.0.0",
    "black>=24.10.0",
    "flake8>=7.1.0",
    "pre-commit>=4.0.0",
]

[tool.black]
line-length = 100
target-version = ["py311"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short --strict-markers"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/my_flask_api"]
```

### Install Dependencies

```bash
# Create virtual environment and install all dependencies
uv sync --all-extras

# Verify installation
uv run python -c "import flask; print(f'Flask {flask.__version__}')"
uv run pytest --version
uv run black --version
```

```text
# Expected output (versions may vary)
Flask 3.1.0
pytest 8.3.4
black, 24.10.0 (compiled: yes)
```

### Checkpoint: Project Setup

```bash
# Verify project structure
ls pyproject.toml src/my_flask_api tests .github/workflows
```

```text
# Expected output
pyproject.toml

src/my_flask_api:

tests:

.github/workflows:
```

---

## Step 2: Create Flask API (10 min)

### Configuration Module

```python
# src/my_flask_api/config.py
"""
@module config
@description Application configuration for Flask API with environment-based settings
@version 0.1.0
@author Your Name
@last_updated 2026-02-14
@status stable
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    """Base configuration."""

    TESTING: bool = False
    DEBUG: bool = False
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "change-me-in-production")


@dataclass(frozen=True)
class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG: bool = True


@dataclass(frozen=True)
class TestingConfig(Config):
    """Testing configuration."""

    TESTING: bool = True
    DEBUG: bool = True


@dataclass(frozen=True)
class ProductionConfig(Config):
    """Production configuration."""

    SECRET_KEY: str = os.environ.get("SECRET_KEY", "")

    def __post_init__(self) -> None:
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be set in production")


CONFIG_MAP: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(env: str | None = None) -> Config:
    """Return configuration for the given environment.

    Args:
        env: Environment name. Defaults to FLASK_ENV or 'development'.

    Returns:
        Configuration instance for the specified environment.
    """
    env = env or os.environ.get("FLASK_ENV", "development")
    config_class = CONFIG_MAP.get(env, DevelopmentConfig)
    return config_class()
```

### Data Models

```python
# src/my_flask_api/models.py
"""
@module models
@description Typed data models for the task management API
@version 0.1.0
@author Your Name
@last_updated 2026-02-14
@status stable
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum


class TaskStatus(str, Enum):
    """Valid task statuses."""

    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


@dataclass
class Task:
    """Represents a single task in the system."""

    title: str
    description: str = ""
    status: TaskStatus = TaskStatus.TODO
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        """Serialize task to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> Task:
        """Deserialize task from dictionary.

        Args:
            data: Dictionary with task fields.

        Returns:
            A Task instance.

        Raises:
            ValueError: If required fields are missing or status is invalid.
        """
        if "title" not in data:
            raise ValueError("Field 'title' is required")

        status_value = data.get("status", TaskStatus.TODO.value)
        try:
            status = TaskStatus(status_value)
        except ValueError:
            valid = ", ".join(s.value for s in TaskStatus)
            raise ValueError(f"Invalid status '{status_value}'. Must be one of: {valid}")

        return cls(
            title=data["title"],
            description=data.get("description", ""),
            status=status,
            id=data.get("id", str(uuid.uuid4())),
        )


class TaskStore:
    """In-memory task storage."""

    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}

    def list_all(self) -> list[dict]:
        """Return all tasks as dictionaries."""
        return [task.to_dict() for task in self._tasks.values()]

    def get(self, task_id: str) -> Task | None:
        """Return a task by ID, or None if not found."""
        return self._tasks.get(task_id)

    def create(self, task: Task) -> Task:
        """Store a new task and return it."""
        self._tasks[task.id] = task
        return task

    def update(self, task_id: str, data: dict) -> Task | None:
        """Update an existing task. Returns None if not found."""
        task = self._tasks.get(task_id)
        if task is None:
            return None

        if "title" in data:
            task.title = data["title"]
        if "description" in data:
            task.description = data["description"]
        if "status" in data:
            try:
                task.status = TaskStatus(data["status"])
            except ValueError:
                valid = ", ".join(s.value for s in TaskStatus)
                raise ValueError(f"Invalid status. Must be one of: {valid}")

        task.updated_at = datetime.now(timezone.utc).isoformat()
        return task

    def delete(self, task_id: str) -> bool:
        """Delete a task by ID. Returns True if deleted, False if not found."""
        if task_id in self._tasks:
            del self._tasks[task_id]
            return True
        return False
```

### Route Handlers

```python
# src/my_flask_api/routes.py
"""
@module routes
@description Flask route handlers for the task management API
@version 0.1.0
@author Your Name
@last_updated 2026-02-14
@status stable
"""

from flask import Blueprint, jsonify, request

from my_flask_api.models import Task, TaskStore

api = Blueprint("api", __name__, url_prefix="/api")

# In-memory store (replace with database in production)
store = TaskStore()


@api.route("/health", methods=["GET"])
def health_check():
    """Return service health status."""
    return jsonify({"status": "healthy", "service": "my-flask-api", "version": "0.1.0"})


@api.route("/tasks", methods=["GET"])
def list_tasks():
    """Return all tasks."""
    tasks = store.list_all()
    return jsonify({"tasks": tasks, "count": len(tasks)})


@api.route("/tasks", methods=["POST"])
def create_task():
    """Create a new task from JSON body."""
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    try:
        task = Task.from_dict(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    store.create(task)
    return jsonify(task.to_dict()), 201


@api.route("/tasks/<task_id>", methods=["GET"])
def get_task(task_id: str):
    """Return a single task by ID."""
    task = store.get(task_id)
    if task is None:
        return jsonify({"error": f"Task '{task_id}' not found"}), 404
    return jsonify(task.to_dict())


@api.route("/tasks/<task_id>", methods=["PUT"])
def update_task(task_id: str):
    """Update an existing task."""
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    try:
        task = store.update(task_id, data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if task is None:
        return jsonify({"error": f"Task '{task_id}' not found"}), 404
    return jsonify(task.to_dict())


@api.route("/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id: str):
    """Delete a task by ID."""
    deleted = store.delete(task_id)
    if not deleted:
        return jsonify({"error": f"Task '{task_id}' not found"}), 404
    return jsonify({"message": f"Task '{task_id}' deleted"}), 200
```

### Application Factory

```python
# src/my_flask_api/app.py
"""
@module app
@description Flask application factory for the task management API
@version 0.1.0
@author Your Name
@last_updated 2026-02-14
@status stable
"""

from flask import Flask

from my_flask_api.config import get_config
from my_flask_api.routes import api


def create_app(env: str | None = None) -> Flask:
    """Create and configure the Flask application.

    Args:
        env: Environment name ('development', 'testing', 'production').
             Defaults to FLASK_ENV or 'development'.

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__)
    config = get_config(env)

    app.config.from_mapping(
        TESTING=config.TESTING,
        DEBUG=config.DEBUG,
        SECRET_KEY=config.SECRET_KEY,
    )

    app.register_blueprint(api)

    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Resource not found"}, 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return {"error": "Method not allowed"}, 405

    @app.errorhandler(500)
    def internal_error(error):
        return {"error": "Internal server error"}, 500

    return app
```

### Package Init

```python
# src/my_flask_api/__init__.py
"""
@module my_flask_api
@description Task management REST API built with Flask
@version 0.1.0
@author Your Name
@last_updated 2026-02-14
@status stable
"""

from my_flask_api.app import create_app

__all__ = ["create_app"]
```

### Checkpoint: Flask API

```bash
# Start the development server
uv run flask --app my_flask_api.app:create_app run --port 5000 &

# Wait for server to start
sleep 2

# Test health endpoint
curl -s http://localhost:5000/api/health | python3 -m json.tool
```

```json
{
    "service": "my-flask-api",
    "status": "healthy",
    "version": "0.1.0"
}
```

```bash
# Test creating a task
curl -s -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Write tests", "description": "Add pytest test suite"}' \
  | python3 -m json.tool
```

```json
{
    "id": "a1b2c3d4-...",
    "title": "Write tests",
    "description": "Add pytest test suite",
    "status": "todo",
    "created_at": "2026-02-14T12:00:00+00:00",
    "updated_at": "2026-02-14T12:00:00+00:00"
}
```

```bash
# Test listing tasks
curl -s http://localhost:5000/api/tasks | python3 -m json.tool
```

```json
{
    "tasks": [
        {
            "id": "a1b2c3d4-...",
            "title": "Write tests",
            "description": "Add pytest test suite",
            "status": "todo",
            "created_at": "2026-02-14T12:00:00+00:00",
            "updated_at": "2026-02-14T12:00:00+00:00"
        }
    ],
    "count": 1
}
```

```bash
# Test error handling (missing title)
curl -s -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"description": "no title"}' \
  | python3 -m json.tool
```

```json
{
    "error": "Field 'title' is required"
}
```

```bash
# Stop the development server
kill %1
```

---

## Step 3: Add Metadata (3 min)

Every source file already includes the `@module` metadata block in its docstring. This is the standard format required by the DevOps Engineering Style Guide.

### Metadata Format Reference

```python
# Required tags for all source files
"""
@module module_name              # lowercase, underscores/hyphens only
@description Brief purpose       # one-line description
@version 0.1.0                   # semantic versioning (MAJOR.MINOR.PATCH)
@author Your Name                # author name
@last_updated 2026-02-14         # ISO 8601 date
@status stable                   # draft | in-progress | review | stable | deprecated | archived
"""
```

### Validate Metadata

```bash
# If you have the DevOps style guide tools available:
# python scripts/validate_metadata.py src/

# Quick manual check - ensure all files have @module tags
grep -r "@module" src/my_flask_api/
```

```text
# Expected output
src/my_flask_api/__init__.py:@module my_flask_api
src/my_flask_api/app.py:@module app
src/my_flask_api/config.py:@module config
src/my_flask_api/models.py:@module models
src/my_flask_api/routes.py:@module routes
```

---

## Step 4: Configure Validation Tools (5 min)

### EditorConfig

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

[*.{yml,yaml}]
indent_size = 2

[*.{json,toml}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
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
      - id: check-merge-conflict
      - id: detect-private-key

  - repo: https://github.com/psf/black
    rev: "24.10.0"
    hooks:
      - id: black
        args: [--line-length=100]

  - repo: https://github.com/PyCQA/flake8
    rev: "7.1.1"
    hooks:
      - id: flake8
        args: [--max-line-length=100, --extend-ignore=E203,W503]
```

### Install and Verify Pre-commit Hooks

```bash
# Install pre-commit hooks into the git repository
uv run pre-commit install

# Run all hooks against all files
uv run pre-commit run --all-files
```

```text
# Expected output
Trim Trailing Whitespace.................................................Passed
Fix End of Files.........................................................Passed
Check Yaml...............................................................Passed
Check JSON...........................................(no files to check)Skipped
Check for added large files..............................................Passed
Check for merge conflicts................................................Passed
Detect Private Key.......................................................Passed
black....................................................................Passed
flake8...................................................................Passed
```

### Flake8 Configuration

```toml
# Add to pyproject.toml (append to existing file)
[tool.flake8]
max-line-length = 100
extend-ignore = ["E203", "W503"]
exclude = [".git", "__pycache__", ".venv", "build", "dist"]
```

> **Note**: Flake8 does not natively read `pyproject.toml`. The pre-commit hook above passes the arguments directly. For local usage, create a `.flake8` file:

```ini
# .flake8
[flake8]
max-line-length = 100
extend-ignore = E203,W503
exclude = .git,__pycache__,.venv,build,dist
```

### Checkpoint: Validation Tools

```bash
# Format all code with black
uv run black src/ tests/

# Lint all code with flake8
uv run flake8 src/ tests/

# Run pre-commit on all files
uv run pre-commit run --all-files
```

```text
# All three commands should complete with no errors
```

---

## Step 5: Write Tests (5 min)

### Test Init

```python
# tests/__init__.py
```

### Test Fixtures

```python
# tests/conftest.py
"""
@module conftest
@description Shared pytest fixtures for the task management API test suite
@version 0.1.0
@author Your Name
@last_updated 2026-02-14
@status stable
"""

import pytest

from my_flask_api.app import create_app


@pytest.fixture()
def app():
    """Create application instance configured for testing."""
    app = create_app(env="testing")
    yield app


@pytest.fixture()
def client(app):
    """Create a test client for the Flask application."""
    return app.test_client()


@pytest.fixture()
def sample_task_data():
    """Return sample task data for creating test tasks."""
    return {
        "title": "Implement authentication",
        "description": "Add JWT-based authentication to the API",
        "status": "todo",
    }
```

### Route Tests

```python
# tests/test_routes.py
"""
@module test_routes
@description Tests for all API route handlers including health, CRUD, and error cases
@version 0.1.0
@author Your Name
@last_updated 2026-02-14
@status stable
"""

import json


class TestHealthEndpoint:
    """Tests for the /api/health endpoint."""

    def test_health_returns_200(self, client):
        """Health endpoint returns 200 with status healthy."""
        response = client.get("/api/health")
        assert response.status_code == 200

        data = response.get_json()
        assert data["status"] == "healthy"
        assert data["service"] == "my-flask-api"
        assert data["version"] == "0.1.0"


class TestCreateTask:
    """Tests for POST /api/tasks."""

    def test_create_task_success(self, client, sample_task_data):
        """Creating a valid task returns 201 with task data."""
        response = client.post(
            "/api/tasks",
            data=json.dumps(sample_task_data),
            content_type="application/json",
        )
        assert response.status_code == 201

        data = response.get_json()
        assert data["title"] == sample_task_data["title"]
        assert data["description"] == sample_task_data["description"]
        assert data["status"] == "todo"
        assert "id" in data
        assert "created_at" in data

    def test_create_task_missing_title(self, client):
        """Creating a task without a title returns 400."""
        response = client.post(
            "/api/tasks",
            data=json.dumps({"description": "no title provided"}),
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "title" in response.get_json()["error"].lower()

    def test_create_task_invalid_json(self, client):
        """Sending invalid JSON returns 400."""
        response = client.post(
            "/api/tasks",
            data="not json",
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_create_task_invalid_status(self, client):
        """Creating a task with an invalid status returns 400."""
        response = client.post(
            "/api/tasks",
            data=json.dumps({"title": "Test", "status": "invalid"}),
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "status" in response.get_json()["error"].lower()


class TestListTasks:
    """Tests for GET /api/tasks."""

    def test_list_tasks_empty(self, client):
        """Listing tasks when none exist returns empty list."""
        response = client.get("/api/tasks")
        assert response.status_code == 200

        data = response.get_json()
        assert data["tasks"] == []
        assert data["count"] == 0

    def test_list_tasks_after_create(self, client, sample_task_data):
        """Listing tasks after creating one returns the task."""
        client.post(
            "/api/tasks",
            data=json.dumps(sample_task_data),
            content_type="application/json",
        )

        response = client.get("/api/tasks")
        data = response.get_json()
        assert data["count"] == 1
        assert data["tasks"][0]["title"] == sample_task_data["title"]


class TestGetTask:
    """Tests for GET /api/tasks/<task_id>."""

    def test_get_task_success(self, client, sample_task_data):
        """Getting a task by valid ID returns the task."""
        create_resp = client.post(
            "/api/tasks",
            data=json.dumps(sample_task_data),
            content_type="application/json",
        )
        task_id = create_resp.get_json()["id"]

        response = client.get(f"/api/tasks/{task_id}")
        assert response.status_code == 200
        assert response.get_json()["id"] == task_id

    def test_get_task_not_found(self, client):
        """Getting a nonexistent task returns 404."""
        response = client.get("/api/tasks/nonexistent-id")
        assert response.status_code == 404


class TestUpdateTask:
    """Tests for PUT /api/tasks/<task_id>."""

    def test_update_task_success(self, client, sample_task_data):
        """Updating a task changes its fields and returns 200."""
        create_resp = client.post(
            "/api/tasks",
            data=json.dumps(sample_task_data),
            content_type="application/json",
        )
        task_id = create_resp.get_json()["id"]

        response = client.put(
            f"/api/tasks/{task_id}",
            data=json.dumps({"title": "Updated title", "status": "in_progress"}),
            content_type="application/json",
        )
        assert response.status_code == 200

        data = response.get_json()
        assert data["title"] == "Updated title"
        assert data["status"] == "in_progress"

    def test_update_task_not_found(self, client):
        """Updating a nonexistent task returns 404."""
        response = client.put(
            "/api/tasks/nonexistent-id",
            data=json.dumps({"title": "Nope"}),
            content_type="application/json",
        )
        assert response.status_code == 404

    def test_update_task_invalid_status(self, client, sample_task_data):
        """Updating a task with an invalid status returns 400."""
        create_resp = client.post(
            "/api/tasks",
            data=json.dumps(sample_task_data),
            content_type="application/json",
        )
        task_id = create_resp.get_json()["id"]

        response = client.put(
            f"/api/tasks/{task_id}",
            data=json.dumps({"status": "bogus"}),
            content_type="application/json",
        )
        assert response.status_code == 400


class TestDeleteTask:
    """Tests for DELETE /api/tasks/<task_id>."""

    def test_delete_task_success(self, client, sample_task_data):
        """Deleting an existing task returns 200 and removes it."""
        create_resp = client.post(
            "/api/tasks",
            data=json.dumps(sample_task_data),
            content_type="application/json",
        )
        task_id = create_resp.get_json()["id"]

        response = client.delete(f"/api/tasks/{task_id}")
        assert response.status_code == 200

        # Verify the task is gone
        get_resp = client.get(f"/api/tasks/{task_id}")
        assert get_resp.status_code == 404

    def test_delete_task_not_found(self, client):
        """Deleting a nonexistent task returns 404."""
        response = client.delete("/api/tasks/nonexistent-id")
        assert response.status_code == 404
```

### Run Tests

```bash
# Run the full test suite with verbose output
uv run pytest tests/ -v
```

```text
# Expected output
tests/test_routes.py::TestHealthEndpoint::test_health_returns_200 PASSED
tests/test_routes.py::TestCreateTask::test_create_task_success PASSED
tests/test_routes.py::TestCreateTask::test_create_task_missing_title PASSED
tests/test_routes.py::TestCreateTask::test_create_task_invalid_json PASSED
tests/test_routes.py::TestCreateTask::test_create_task_invalid_status PASSED
tests/test_routes.py::TestListTasks::test_list_tasks_empty PASSED
tests/test_routes.py::TestListTasks::test_list_tasks_after_create PASSED
tests/test_routes.py::TestGetTask::test_get_task_success PASSED
tests/test_routes.py::TestGetTask::test_get_task_not_found PASSED
tests/test_routes.py::TestUpdateTask::test_update_task_success PASSED
tests/test_routes.py::TestUpdateTask::test_update_task_not_found PASSED
tests/test_routes.py::TestUpdateTask::test_update_task_invalid_status PASSED
tests/test_routes.py::TestDeleteTask::test_delete_task_success PASSED
tests/test_routes.py::TestDeleteTask::test_delete_task_not_found PASSED

14 passed in 0.25s
```

```bash
# Run with coverage report
uv run pytest tests/ --cov=my_flask_api --cov-report=term-missing
```

```text
# Expected output
Name                          Stmts   Miss  Cover   Missing
------------------------------------------------------------
src/my_flask_api/__init__.py      2      0   100%
src/my_flask_api/app.py          18      3    83%   34-39
src/my_flask_api/config.py       24      2    92%   37-38
src/my_flask_api/models.py       52      0   100%
src/my_flask_api/routes.py       38      0   100%
------------------------------------------------------------
TOTAL                           134      5    96%
```

### Checkpoint: Tests

```bash
# All 14 tests should pass
uv run pytest tests/ -v --tb=short
```

---

## Step 6: Set Up CI/CD (5 min)

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true

      - name: Set up Python
        run: uv python install 3.11

      - name: Install dependencies
        run: uv sync --all-extras

      - name: Check formatting with black
        run: uv run black --check --diff src/ tests/

      - name: Lint with flake8
        run: uv run flake8 src/ tests/

  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12", "3.13"]
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true

      - name: Set up Python ${{ matrix.python-version }}
        run: uv python install ${{ matrix.python-version }}

      - name: Install dependencies
        run: uv sync --all-extras

      - name: Run tests with coverage
        run: uv run pytest tests/ -v --cov=my_flask_api --cov-report=term-missing

  validate:
    name: Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true

      - name: Set up Python
        run: uv python install 3.11

      - name: Install dependencies
        run: uv sync --all-extras

      - name: Verify metadata tags
        run: |
          grep -r "@module" src/my_flask_api/ | wc -l | xargs -I{} test {} -ge 5
          echo "All source files contain @module metadata"

      - name: Run pre-commit hooks
        run: |
          uv run pre-commit install
          uv run pre-commit run --all-files
```

### Checkpoint: CI Configuration

```bash
# Validate the workflow YAML syntax
python3 -c "
import yaml
with open('.github/workflows/ci.yml') as f:
    config = yaml.safe_load(f)
print(f'Jobs defined: {list(config[\"jobs\"].keys())}')
print('Workflow YAML is valid')
"
```

```text
# Expected output
Jobs defined: ['lint', 'test', 'validate']
Workflow YAML is valid
```

---

## Step 7: Verify Everything Works (2 min)

### Run the Full Validation Suite

```bash
# 1. Format code
uv run black src/ tests/

# 2. Lint code
uv run flake8 src/ tests/

# 3. Run all tests
uv run pytest tests/ -v

# 4. Run pre-commit hooks
uv run pre-commit run --all-files

# 5. Verify metadata is present in all source files
grep -r "@module" src/my_flask_api/
```

```text
# Expected: All commands exit with code 0, all tests pass, all hooks pass
```

### Make Your First Commit

```bash
# Stage all files
git add .

# Commit following conventional commit format
git commit -m "feat: initial Flask API with full validation

- Application factory pattern with environment-based config
- Task CRUD endpoints with typed models and error handling
- Health check endpoint
- 14 pytest tests with 96% coverage
- Pre-commit hooks (black, flake8, trailing whitespace)
- GitHub Actions CI with lint, test (3.11-3.13), and validate jobs
- Dukes-compliant @module metadata on all source files"
```

```text
# Expected: pre-commit hooks run and pass, commit succeeds
Trim Trailing Whitespace.................................................Passed
Fix End of Files.........................................................Passed
Check Yaml...............................................................Passed
Check for added large files..............................................Passed
Check for merge conflicts................................................Passed
Detect Private Key.......................................................Passed
black....................................................................Passed
flake8...................................................................Passed
[main (root-commit) abc1234] feat: initial Flask API with full validation
 12 files changed, 450 insertions(+)
```

---

## Checkpoint: Final Verification

Use this checklist to confirm everything is working:

```text
Final Verification Checklist
============================
[ ] pyproject.toml has project metadata and tool configuration
[ ] .editorconfig enforces consistent formatting
[ ] .pre-commit-config.yaml has hooks for formatting, linting, and file checks
[ ] .flake8 has line length and ignore rules matching black
[ ] .github/workflows/ci.yml has lint, test, and validate jobs

[ ] src/my_flask_api/__init__.py exports create_app
[ ] src/my_flask_api/app.py has application factory with error handlers
[ ] src/my_flask_api/config.py has environment-based dataclass configs
[ ] src/my_flask_api/models.py has Task, TaskStatus, and TaskStore
[ ] src/my_flask_api/routes.py has health + full CRUD endpoints

[ ] All 5 source files have @module metadata comments
[ ] All @module tags include: module, description, version, author, last_updated, status

[ ] tests/conftest.py has app, client, and sample_task_data fixtures
[ ] tests/test_routes.py has 14 tests covering all endpoints and error cases
[ ] uv run pytest tests/ -v shows 14 passed

[ ] uv run black --check src/ tests/ passes with no changes
[ ] uv run flake8 src/ tests/ passes with no errors
[ ] uv run pre-commit run --all-files shows all hooks passed

[ ] git log shows at least one conventional commit
```

```bash
# Quick automated check
echo "=== Tests ===" && uv run pytest tests/ -q \
  && echo "=== Black ===" && uv run black --check src/ tests/ \
  && echo "=== Flake8 ===" && uv run flake8 src/ tests/ \
  && echo "=== Metadata ===" && grep -rc "@module" src/my_flask_api/*.py \
  && echo "=== ALL CHECKS PASSED ==="
```

```text
# Expected output
=== Tests ===
14 passed in 0.25s
=== Black ===
All done! 6 files would be left unchanged.
=== Flake8 ===
=== Metadata ===
src/my_flask_api/__init__.py:1
src/my_flask_api/app.py:1
src/my_flask_api/config.py:1
src/my_flask_api/models.py:1
src/my_flask_api/routes.py:1
=== ALL CHECKS PASSED ===
```

---

## Common Troubleshooting

### Problem: `ModuleNotFoundError: No module named 'my_flask_api'`

```bash
# Cause: The package is not installed in the virtual environment
# Solution: Ensure pyproject.toml has the correct build configuration and reinstall
uv sync --all-extras

# Verify the package is installed
uv run pip list | grep my-flask-api
```

```text
# Expected output
my-flask-api    0.1.0
```

### Problem: Black and flake8 disagree on formatting

```bash
# Cause: Line length or ignore rules are mismatched
# Solution: Ensure both tools use the same line length and flake8 ignores E203, W503

# In pyproject.toml:
# [tool.black]
# line-length = 100

# In .flake8:
# max-line-length = 100
# extend-ignore = E203,W503

# Reformat and re-lint
uv run black src/ tests/ && uv run flake8 src/ tests/
```

### Problem: Pre-commit hooks fail on first run

```bash
# Cause: Hook environments haven't been installed yet
# Solution: Install hooks explicitly
uv run pre-commit install --install-hooks

# Retry running hooks
uv run pre-commit run --all-files
```

### Problem: Tests fail with `fixture 'client' not found`

```bash
# Cause: conftest.py is not in the tests directory or has a syntax error
# Solution: Verify the file exists and is valid Python
python3 -c "import ast; ast.parse(open('tests/conftest.py').read()); print('conftest.py is valid')"

# Verify pytest discovers the fixtures
uv run pytest tests/ --fixtures | grep -A2 "client"
```

```text
# Expected output
client -- tests/conftest.py:19
    Create a test client for the Flask application.
```

### Problem: Flask app fails to start with `ImportError`

```bash
# Cause: Running flask directly instead of through the installed package
# Solution: Always use uv run to ensure the correct environment

# Wrong
flask run

# Correct
uv run flask --app my_flask_api.app:create_app run
```

### Problem: CI workflow fails with `uv: command not found`

```yaml
# Cause: uv is not installed in the CI environment
# Solution: Add the astral-sh/setup-uv action before any uv commands

# In .github/workflows/ci.yml, ensure this step comes first:
steps:
  - uses: actions/checkout@v4

  - name: Install uv
    uses: astral-sh/setup-uv@v5
    with:
      enable-cache: true
```

### Problem: Git commit rejected by pre-commit hooks

```bash
# Cause: Code has formatting or linting issues
# Solution: Let the tools fix what they can, then review remaining issues

# Auto-fix formatting
uv run black src/ tests/

# Check for remaining lint errors
uv run flake8 src/ tests/

# Re-stage files that were modified by black
git add -u

# Retry the commit
git commit -m "feat: your commit message"
```

---

## Next Steps

After completing this tutorial, continue your learning path:

- **[Tutorial 2: Migrating Existing Terraform Module](terraform_migration.md)** -- Apply the DevOps style to infrastructure code with CONTRACT.md and automated testing.
- **[Tutorial 3: Full-Stack App with Multiple Languages](fullstack_app.md)** -- Combine Python, TypeScript, and Terraform in a single validated project.
- **[Python Style Guide](../02_language_guides/python.md)** -- Deep dive into all Python standards including type hints, docstrings, and advanced patterns.
- **[CONTRACT.md Template](../04_templates/contract_template.md)** -- Learn contract-based development for reusable modules.
- **[IaC Testing Standards](../05_ci_cd/iac_testing_standards.md)** -- Full CI/CD pipeline standards and testing strategies.
