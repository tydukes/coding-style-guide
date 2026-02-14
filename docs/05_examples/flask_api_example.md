---
title: "Complete Python Flask API Example"
description: "Full working example of a production-ready Flask REST API with best practices"
author: "Tyler Dukes"
tags: [python, flask, api, rest, example, best-practices, complete]
category: "Examples"
status: "active"
---

<!-- markdownlint-disable MD013 -->

## Overview

This is a complete, working example of a production-ready Flask REST API called **taskflow** - a task
management service. It demonstrates all best practices from the Python Style Guide, including
application factory pattern, typed models, comprehensive testing, Docker Compose services, and CI/CD
integration.

**Project Purpose**: A task management API that supports CRUD operations, user authentication, and
task filtering with PostgreSQL persistence.

---

## Project Structure

```text
taskflow/
├── src/
│   └── taskflow/
│       ├── __init__.py
│       ├── app.py
│       ├── config.py
│       ├── extensions.py
│       ├── models/
│       │   ├── __init__.py
│       │   ├── task.py
│       │   └── user.py
│       ├── routes/
│       │   ├── __init__.py
│       │   ├── health.py
│       │   ├── tasks.py
│       │   └── users.py
│       ├── middleware/
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   └── logging.py
│       └── utils/
│           ├── __init__.py
│           └── responses.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_tasks.py
│   └── test_users.py
├── .github/
│   └── workflows/
│       └── ci.yml
├── .pre-commit-config.yaml
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## pyproject.toml

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "taskflow"
version = "1.0.0"
description = "A production-ready task management REST API"
readme = "README.md"
license = { text = "MIT" }
requires-python = ">=3.11"
authors = [{ name = "Tyler Dukes" }]

dependencies = [
    "flask>=3.1,<4",
    "flask-sqlalchemy>=3.1,<4",
    "flask-migrate>=4.0,<5",
    "psycopg2-binary>=2.9,<3",
    "marshmallow>=3.23,<4",
    "python-dotenv>=1.0,<2",
    "gunicorn>=23.0,<24",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3,<9",
    "pytest-cov>=6.0,<7",
    "pytest-flask>=1.3,<2",
    "black>=24.10,<25",
    "flake8>=7.1,<8",
    "mypy>=1.13,<2",
    "bandit>=1.8,<2",
    "types-flask>=1.1",
]

[tool.black]
line-length = 100
target-version = ["py311"]

[tool.flake8]
max-line-length = 100
extend-ignore = ["E203", "W503"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=src/taskflow --cov-report=term-missing"

[tool.bandit]
exclude_dirs = ["tests"]
```

---

## src/taskflow/\_\_init\_\_.py

```python
"""
@module taskflow
@description Production-ready Flask task management API
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""
```

---

## src/taskflow/config.py

```python
"""Application configuration classes."""

from __future__ import annotations

import os


class Config:
    """Base configuration shared across all environments."""

    SECRET_KEY: str = os.environ.get("SECRET_KEY", "change-me-in-production")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    JSON_SORT_KEYS: bool = False

    # Pagination defaults
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100


class DevelopmentConfig(Config):
    """Development environment configuration."""

    DEBUG: bool = True
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        "DATABASE_URL",
        "postgresql://taskflow:taskflow@localhost:5432/taskflow_dev",
    )


class TestingConfig(Config):
    """Testing environment configuration."""

    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        "DATABASE_URL",
        "sqlite:///:memory:",
    )


class ProductionConfig(Config):
    """Production environment configuration."""

    DEBUG: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.environ.get("DATABASE_URL", "")

    def __init__(self) -> None:
        if not self.SQLALCHEMY_DATABASE_URI:
            raise ValueError("DATABASE_URL environment variable is required in production")
        if self.SECRET_KEY == "change-me-in-production":
            raise ValueError("SECRET_KEY must be set in production")


CONFIGS: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
```

---

## src/taskflow/extensions.py

```python
"""Flask extension instances.

Centralizing extensions avoids circular imports when models
and routes need access to the database or migration engine.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()
```

---

## src/taskflow/app.py

```python
"""Flask application factory."""

from __future__ import annotations

import logging

from flask import Flask

from taskflow.config import CONFIGS
from taskflow.extensions import db, migrate


def create_app(config_name: str = "development") -> Flask:
    """Create and configure the Flask application.

    Args:
        config_name: One of 'development', 'testing', or 'production'.

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__)
    app.config.from_object(CONFIGS[config_name]())

    _init_extensions(app)
    _register_blueprints(app)
    _configure_logging(app)

    return app


def _init_extensions(app: Flask) -> None:
    """Bind extensions to the application instance."""
    db.init_app(app)
    migrate.init_app(app, db)


def _register_blueprints(app: Flask) -> None:
    """Register all route blueprints."""
    from taskflow.routes.health import health_bp
    from taskflow.routes.tasks import tasks_bp
    from taskflow.routes.users import users_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(tasks_bp, url_prefix="/api/v1")
    app.register_blueprint(users_bp, url_prefix="/api/v1")


def _configure_logging(app: Flask) -> None:
    """Set up structured logging."""
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
    )
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
```

---

## src/taskflow/models/task.py

```python
"""Task database model."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from taskflow.extensions import db


class TaskStatus(str, Enum):
    """Valid task status values."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Valid task priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(db.Model):  # type: ignore[name-defined]
    """Task model representing a unit of work.

    Attributes:
        id: Primary key.
        title: Short description of the task.
        description: Detailed task description.
        status: Current task status.
        priority: Task priority level.
        owner_id: Foreign key to the user who owns this task.
        created_at: Timestamp when the task was created.
        updated_at: Timestamp of the last update.
    """

    __tablename__ = "tasks"

    id: int = db.Column(db.Integer, primary_key=True)
    title: str = db.Column(db.String(200), nullable=False)
    description: str = db.Column(db.Text, nullable=True)
    status: str = db.Column(
        db.String(20),
        nullable=False,
        default=TaskStatus.PENDING.value,
    )
    priority: str = db.Column(
        db.String(20),
        nullable=False,
        default=TaskPriority.MEDIUM.value,
    )
    owner_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at: datetime = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner = db.relationship("User", back_populates="tasks")

    def to_dict(self) -> dict:
        """Serialize task to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
```

---

## src/taskflow/models/user.py

```python
"""User database model."""

from __future__ import annotations

from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from taskflow.extensions import db


class User(db.Model):  # type: ignore[name-defined]
    """User model for task ownership and authentication.

    Attributes:
        id: Primary key.
        username: Unique username.
        email: Unique email address.
        password_hash: Bcrypt-hashed password (never stored in plaintext).
        is_active: Whether the account is active.
        created_at: Account creation timestamp.
    """

    __tablename__ = "users"

    id: int = db.Column(db.Integer, primary_key=True)
    username: str = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email: str = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash: str = db.Column(db.String(256), nullable=False)
    is_active: bool = db.Column(db.Boolean, default=True, nullable=False)
    created_at: datetime = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    tasks = db.relationship("Task", back_populates="owner", lazy="dynamic")

    def set_password(self, password: str) -> None:
        """Hash and store the password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        """Serialize user to dictionary (excludes password)."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }
```

---

## src/taskflow/utils/responses.py

```python
"""Standardized API response helpers."""

from __future__ import annotations

from typing import Any

from flask import jsonify


def success_response(
    data: Any,
    status_code: int = 200,
    message: str = "ok",
) -> tuple:
    """Return a standardized success JSON response.

    Args:
        data: The response payload.
        status_code: HTTP status code (default 200).
        message: Human-readable status message.

    Returns:
        Tuple of (response, status_code) for Flask.
    """
    return jsonify({"status": "success", "message": message, "data": data}), status_code


def error_response(
    message: str,
    status_code: int = 400,
    errors: list[str] | None = None,
) -> tuple:
    """Return a standardized error JSON response.

    Args:
        message: Human-readable error description.
        status_code: HTTP status code (default 400).
        errors: Optional list of specific validation errors.

    Returns:
        Tuple of (response, status_code) for Flask.
    """
    payload: dict[str, Any] = {"status": "error", "message": message}
    if errors:
        payload["errors"] = errors
    return jsonify(payload), status_code
```

---

## src/taskflow/middleware/auth.py

```python
"""Authentication middleware."""

from __future__ import annotations

from functools import wraps
from typing import Any, Callable

from flask import request

from taskflow.models.user import User
from taskflow.utils.responses import error_response


def require_auth(fn: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator that enforces API key authentication.

    Expects an ``Authorization: Bearer <api-key>`` header where the key
    corresponds to an active user's username (simplified for this example).
    """

    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return error_response("Missing or invalid Authorization header", 401)

        token = auth_header.removeprefix("Bearer ").strip()
        user = User.query.filter_by(username=token, is_active=True).first()

        if user is None:
            return error_response("Invalid or expired token", 401)

        kwargs["current_user"] = user
        return fn(*args, **kwargs)

    return wrapper
```

---

## src/taskflow/middleware/logging.py

```python
"""Request logging middleware."""

from __future__ import annotations

import time

from flask import Flask, g, request


def register_request_logging(app: Flask) -> None:
    """Attach before/after hooks that log every request."""

    @app.before_request
    def start_timer() -> None:
        g.start_time = time.monotonic()

    @app.after_request
    def log_request(response):
        duration_ms = (time.monotonic() - g.start_time) * 1000
        app.logger.info(
            "%s %s %s %.1fms",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )
        return response
```

---

## src/taskflow/routes/health.py

```python
"""Health check endpoints."""

from flask import Blueprint

from taskflow.extensions import db
from taskflow.utils.responses import error_response, success_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health")
def health_check():
    """Shallow health check — confirms the process is running."""
    return success_response({"status": "healthy"})


@health_bp.route("/health/ready")
def readiness_check():
    """Deep health check — verifies database connectivity."""
    try:
        db.session.execute(db.text("SELECT 1"))
        return success_response({"status": "ready", "database": "connected"})
    except Exception as exc:
        return error_response(
            f"Database unavailable: {exc}",
            status_code=503,
        )
```

---

## src/taskflow/routes/tasks.py

```python
"""Task CRUD endpoints."""

from __future__ import annotations

from flask import Blueprint, request as req

from taskflow.extensions import db
from taskflow.middleware.auth import require_auth
from taskflow.models.task import Task, TaskPriority, TaskStatus
from taskflow.utils.responses import error_response, success_response

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/tasks", methods=["GET"])
@require_auth
def list_tasks(current_user):
    """List tasks owned by the authenticated user.

    Query parameters:
        status: Filter by task status.
        priority: Filter by priority.
        page: Page number (default 1).
        per_page: Items per page (default 20, max 100).
    """
    query = Task.query.filter_by(owner_id=current_user.id)

    status = req.args.get("status")
    if status and status in TaskStatus.__members__.values():
        query = query.filter_by(status=status)

    priority = req.args.get("priority")
    if priority and priority in TaskPriority.__members__.values():
        query = query.filter_by(priority=priority)

    page = req.args.get("page", 1, type=int)
    per_page = min(req.args.get("per_page", 20, type=int), 100)

    pagination = query.order_by(Task.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return success_response({
        "tasks": [t.to_dict() for t in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@tasks_bp.route("/tasks", methods=["POST"])
@require_auth
def create_task(current_user):
    """Create a new task."""
    data = req.get_json(silent=True)
    if not data or "title" not in data:
        return error_response("Request body must include 'title'")

    task = Task(
        title=data["title"],
        description=data.get("description", ""),
        priority=data.get("priority", TaskPriority.MEDIUM.value),
        owner_id=current_user.id,
    )

    if task.priority not in [p.value for p in TaskPriority]:
        return error_response(f"Invalid priority: {task.priority}")

    db.session.add(task)
    db.session.commit()

    return success_response(task.to_dict(), status_code=201, message="Task created")


@tasks_bp.route("/tasks/<int:task_id>", methods=["GET"])
@require_auth
def get_task(task_id: int, current_user):
    """Retrieve a single task by ID."""
    task = Task.query.filter_by(id=task_id, owner_id=current_user.id).first()
    if task is None:
        return error_response("Task not found", 404)
    return success_response(task.to_dict())


@tasks_bp.route("/tasks/<int:task_id>", methods=["PATCH"])
@require_auth
def update_task(task_id: int, current_user):
    """Partially update a task."""
    task = Task.query.filter_by(id=task_id, owner_id=current_user.id).first()
    if task is None:
        return error_response("Task not found", 404)

    data = req.get_json(silent=True) or {}
    allowed_fields = {"title", "description", "status", "priority"}

    for field in allowed_fields & data.keys():
        setattr(task, field, data[field])

    db.session.commit()
    return success_response(task.to_dict(), message="Task updated")


@tasks_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@require_auth
def delete_task(task_id: int, current_user):
    """Delete a task."""
    task = Task.query.filter_by(id=task_id, owner_id=current_user.id).first()
    if task is None:
        return error_response("Task not found", 404)

    db.session.delete(task)
    db.session.commit()
    return success_response(None, message="Task deleted")
```

---

## src/taskflow/routes/users.py

```python
"""User management endpoints."""

from __future__ import annotations

from flask import Blueprint, request as req

from taskflow.extensions import db
from taskflow.models.user import User
from taskflow.utils.responses import error_response, success_response

users_bp = Blueprint("users", __name__)


@users_bp.route("/users", methods=["POST"])
def register_user():
    """Register a new user account."""
    data = req.get_json(silent=True)
    if not data:
        return error_response("Request body is required")

    required = {"username", "email", "password"}
    missing = required - data.keys()
    if missing:
        return error_response(f"Missing required fields: {', '.join(sorted(missing))}")

    if User.query.filter_by(username=data["username"]).first():
        return error_response("Username already exists", 409)

    if User.query.filter_by(email=data["email"]).first():
        return error_response("Email already registered", 409)

    user = User(username=data["username"], email=data["email"])
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return success_response(user.to_dict(), status_code=201, message="User created")
```

---

## tests/conftest.py

```python
"""Shared pytest fixtures for the taskflow test suite."""

from __future__ import annotations

import pytest

from taskflow.app import create_app
from taskflow.extensions import db as _db
from taskflow.models.user import User


@pytest.fixture()
def app():
    """Create an application instance configured for testing."""
    app = create_app("testing")

    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    """Provide a Flask test client."""
    return app.test_client()


@pytest.fixture()
def sample_user(app):
    """Create and persist a sample user, returning the model instance."""
    with app.app_context():
        user = User(username="testuser", email="test@example.com")
        user.set_password("secure-password")
        _db.session.add(user)
        _db.session.commit()
        _db.session.refresh(user)
        return user


@pytest.fixture()
def auth_headers(sample_user):
    """Return authorization headers for the sample user."""
    return {"Authorization": f"Bearer {sample_user.username}"}
```

---

## tests/test_health.py

```python
"""Tests for health check endpoints."""


def test_health_returns_200(client):
    """GET /health responds with 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "healthy"


def test_readiness_returns_200(client):
    """GET /health/ready confirms database connectivity."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["status"] == "ready"
    assert data["database"] == "connected"
```

---

## tests/test_tasks.py

```python
"""Tests for task CRUD endpoints."""

import json


def _post_json(client, url, data, headers):
    """Helper to POST JSON data."""
    return client.post(url, data=json.dumps(data), content_type="application/json", headers=headers)


def _patch_json(client, url, data, headers):
    """Helper to PATCH JSON data."""
    return client.patch(url, data=json.dumps(data), content_type="application/json", headers=headers)


class TestCreateTask:
    """POST /api/v1/tasks"""

    def test_create_task_success(self, client, auth_headers):
        response = _post_json(client, "/api/v1/tasks", {"title": "Write tests"}, auth_headers)
        assert response.status_code == 201
        data = response.get_json()["data"]
        assert data["title"] == "Write tests"
        assert data["status"] == "pending"
        assert data["priority"] == "medium"

    def test_create_task_missing_title(self, client, auth_headers):
        response = _post_json(client, "/api/v1/tasks", {"description": "no title"}, auth_headers)
        assert response.status_code == 400

    def test_create_task_unauthorized(self, client):
        response = _post_json(client, "/api/v1/tasks", {"title": "Fail"}, {})
        assert response.status_code == 401


class TestListTasks:
    """GET /api/v1/tasks"""

    def test_list_empty(self, client, auth_headers):
        response = client.get("/api/v1/tasks", headers=auth_headers)
        assert response.status_code == 200
        assert response.get_json()["data"]["tasks"] == []
        assert response.get_json()["data"]["total"] == 0

    def test_list_returns_owned_tasks(self, client, auth_headers):
        _post_json(client, "/api/v1/tasks", {"title": "Task A"}, auth_headers)
        _post_json(client, "/api/v1/tasks", {"title": "Task B"}, auth_headers)
        response = client.get("/api/v1/tasks", headers=auth_headers)
        assert response.get_json()["data"]["total"] == 2


class TestGetTask:
    """GET /api/v1/tasks/<id>"""

    def test_get_existing_task(self, client, auth_headers):
        create = _post_json(client, "/api/v1/tasks", {"title": "Fetch me"}, auth_headers)
        task_id = create.get_json()["data"]["id"]
        response = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.get_json()["data"]["title"] == "Fetch me"

    def test_get_nonexistent_task(self, client, auth_headers):
        response = client.get("/api/v1/tasks/9999", headers=auth_headers)
        assert response.status_code == 404


class TestUpdateTask:
    """PATCH /api/v1/tasks/<id>"""

    def test_update_status(self, client, auth_headers):
        create = _post_json(client, "/api/v1/tasks", {"title": "Update me"}, auth_headers)
        task_id = create.get_json()["data"]["id"]
        response = _patch_json(
            client, f"/api/v1/tasks/{task_id}", {"status": "completed"}, auth_headers
        )
        assert response.status_code == 200
        assert response.get_json()["data"]["status"] == "completed"


class TestDeleteTask:
    """DELETE /api/v1/tasks/<id>"""

    def test_delete_task(self, client, auth_headers):
        create = _post_json(client, "/api/v1/tasks", {"title": "Delete me"}, auth_headers)
        task_id = create.get_json()["data"]["id"]
        response = client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 200
        get_response = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert get_response.status_code == 404
```

---

## tests/test_users.py

```python
"""Tests for user registration endpoints."""

import json


def _post_json(client, url, data):
    return client.post(url, data=json.dumps(data), content_type="application/json")


class TestRegisterUser:
    """POST /api/v1/users"""

    def test_register_success(self, client):
        response = _post_json(
            client,
            "/api/v1/users",
            {"username": "newuser", "email": "new@example.com", "password": "secret"},
        )
        assert response.status_code == 201
        data = response.get_json()["data"]
        assert data["username"] == "newuser"
        assert "password" not in data

    def test_register_missing_fields(self, client):
        response = _post_json(client, "/api/v1/users", {"username": "incomplete"})
        assert response.status_code == 400

    def test_register_duplicate_username(self, client, sample_user):
        response = _post_json(
            client,
            "/api/v1/users",
            {"username": "testuser", "email": "other@example.com", "password": "secret"},
        )
        assert response.status_code == 409
```

---

## Dockerfile

```dockerfile
# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

WORKDIR /build
COPY pyproject.toml .
RUN pip install --no-cache-dir build && \
    pip install --no-cache-dir .

# Stage 2: Production image
FROM python:3.12-slim AS runtime

RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin/gunicorn /usr/local/bin/gunicorn
COPY src/ ./src/

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "taskflow.app:create_app()"]
```

---

## docker-compose.yml

```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://taskflow:taskflow@db:5432/taskflow
      - SECRET_KEY=local-dev-only
      - FLASK_ENV=development
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=taskflow
      - POSTGRES_PASSWORD=taskflow
      - POSTGRES_DB=taskflow
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
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
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install ".[dev]"

      - name: Black formatting check
        run: black --check .

      - name: Flake8 lint
        run: flake8 src/ tests/

      - name: Mypy type check
        run: mypy src/

      - name: Bandit security scan
        run: bandit -r src/ -c pyproject.toml

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12", "3.13"]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: pip install ".[dev]"

      - name: Run tests
        run: pytest --cov-report=xml

      - name: Upload coverage
        if: matrix.python-version == '3.12'
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage.xml
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
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: "24.10.0"
    hooks:
      - id: black

  - repo: https://github.com/PyCQA/flake8
    rev: "7.1.1"
    hooks:
      - id: flake8
        args: [--max-line-length=100, --extend-ignore=E203]

  - repo: https://github.com/PyCQA/bandit
    rev: "1.8.3"
    hooks:
      - id: bandit
        args: [-r, src/, -c, pyproject.toml]
```

---

## Makefile

```makefile
.PHONY: help install lint test run clean docker-up docker-down

help: ## Show this help message
 @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
 pip install -e ".[dev]"

lint: ## Run all linters
 black --check .
 flake8 src/ tests/
 mypy src/
 bandit -r src/ -c pyproject.toml

test: ## Run test suite
 pytest

run: ## Start development server
 flask --app "taskflow.app:create_app()" run --debug --port 8000

docker-up: ## Start services with Docker Compose
 docker compose up -d --build

docker-down: ## Stop Docker Compose services
 docker compose down -v

clean: ## Remove build artifacts
 rm -rf build/ dist/ *.egg-info .pytest_cache .mypy_cache htmlcov/
 find . -type d -name __pycache__ -exec rm -rf {} +
```

---

## Key Takeaways

This complete Flask API example demonstrates:

1. **Application Factory Pattern**: `create_app()` enables per-environment configuration and clean testing
2. **Blueprint Organization**: Routes separated into health, tasks, and users for maintainability
3. **Centralized Extensions**: `extensions.py` prevents circular imports between models and routes
4. **Typed Models with Enums**: `TaskStatus` and `TaskPriority` enums enforce valid values at the model layer
5. **Authentication Middleware**: Decorator-based auth keeps route handlers focused on business logic
6. **Standardized Responses**: `success_response()` and `error_response()` ensure consistent API output
7. **Multi-stage Dockerfile**: Builder stage keeps the production image small and secure
8. **Health Check Endpoints**: Shallow `/health` and deep `/health/ready` support Kubernetes probes
9. **Comprehensive Testing**: Fixtures provide test client, sample data, and auth headers
10. **Security Scanning**: Bandit integrated into both pre-commit and CI pipeline

The application is production-ready and follows Flask best practices for structure, security, and
testability.

---

**Status**: Active
