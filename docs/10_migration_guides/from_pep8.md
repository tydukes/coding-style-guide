---
title: "Migrating from PEP 8 to DevOps Engineering Style Guide"
description: "Step-by-step migration guide from standard PEP 8 to the enhanced Dukes Engineering Python style guide"
author: "Tyler Dukes"
tags: [migration, pep8, python, style-guide, upgrade, transition]
category: "Migration Guides"
status: "active"
search_keywords: [migration, pep8, python, style guide, transition, upgrade, differences]
---

## Overview

This guide helps Python developers transition from **PEP 8** (the standard Python style guide) to
the **DevOps Engineering Style Guide**. Our guide builds on PEP 8's foundation while adding modern
DevOps-oriented enhancements for infrastructure automation, type safety, and security.

### What This Guide Covers

- Compatibility assessment: What stays the same vs. what changes
- Enhanced requirements beyond PEP 8
- Tool configuration updates
- Step-by-step migration checklist
- Common migration pitfalls and solutions

### Who Should Use This Guide

- Teams currently following PEP 8 who want enhanced DevOps standards
- Projects transitioning to infrastructure-as-code automation
- Python developers adding type hints and security best practices
- Organizations standardizing on modern Python tooling (Black, mypy)

## Quick Compatibility Summary

```mermaid
graph LR
    PEP8[PEP 8 Standards] --> Same[100% Compatible<br/>Base Conventions]
    PEP8 --> Enhanced[Enhanced Requirements<br/>Type Hints, Docs, Security]
    PEP8 --> Relaxed[Relaxed Constraints<br/>Line Length 88 chars]

    Same --> Migration[Migration Path]
    Enhanced --> Migration
    Relaxed --> Migration

    Migration --> DukesGuide[Dukes Engineering<br/>Style Guide]

    style Same fill:#e8f5e9
    style Enhanced fill:#fff3e0
    style Relaxed fill:#e3f2fd
    style DukesGuide fill:#f3e5f5
```

## What Stays the Same

DevOps Engineering Style Guide maintains **full compatibility** with PEP 8 core conventions.
If your code follows PEP 8, these aspects require **no changes**:

### Naming Conventions ✅

| Element | Convention | PEP 8 | Our Guide |
|---------|-----------|-------|-----------|
| Variables | `snake_case` | ✅ | ✅ Same |
| Functions | `snake_case` | ✅ | ✅ Same |
| Constants | `UPPER_SNAKE_CASE` | ✅ | ✅ Same |
| Classes | `PascalCase` | ✅ | ✅ Same |
| Modules | `snake_case` | ✅ | ✅ Same |
| Private | `_leading_underscore` | ✅ | ✅ Same |

### Code Structure ✅

- **Indentation**: 4 spaces (never tabs)
- **Blank lines**: 2 between top-level definitions, 1 between methods
- **Import order**: Standard library → third-party → local
- **Whitespace**: Consistent spacing around operators
- **Comments**: `#` for inline, `"""` for docstrings

### Formatting ✅

- String quotes (prefer double, use single to avoid escapes)
- Parentheses for line continuation
- Trailing commas in multi-line structures
- No trailing whitespace

**Example - No Changes Needed:**

```python
## This PEP 8 code is already compliant
import os
import sys

import requests

from myapp.utils import helper

MAX_RETRIES = 3

class UserService:
    """Service for user management."""

    def get_user(self, user_id: int):
        """Retrieve user by ID."""
        return database.query(user_id)
```

## What Changes: Enhancements Beyond PEP 8

### 1. Line Length: 79 → 88 Characters

**PEP 8**: Maximum 79 characters
**Our Guide**: Maximum 88 characters (Black default)

**Why**: Modern displays support wider lines, and Black's 88-character limit reduces unnecessary
line breaks while maintaining readability.

**Migration**:

```python
## PEP 8 (79 chars) - line breaks needed
user_data = database.query(User).filter(
    User.is_active == True
).all()

## Our Guide (88 chars) - more natural flow
user_data = database.query(User).filter(User.is_active == True).all()
```

**Action Required**:

- Update editor rulers to 88 characters
- Configure Black formatter with default settings
- Run `black .` to automatically reformat

### 2. Type Hints: Optional → Required

**PEP 8**: Type hints are optional (PEP 484 compliance)
**Our Guide**: Type hints required for all function signatures

**Why**: Type hints enable static analysis, improve IDE support, prevent runtime errors, and serve
as inline documentation for DevOps automation code.

**Migration**:

```python
## PEP 8 - acceptable without type hints
def get_user(user_id):
    """Retrieve user by ID."""
    return database.query(User).filter(User.id == user_id).first()

## Our Guide - type hints required
from typing import Optional

def get_user(user_id: int) -> Optional[User]:
    """Retrieve user by ID."""
    return database.query(User).filter(User.id == user_id).first()
```

**Action Required**:

- Add type hints to all function signatures
- Import typing module: `from typing import List, Dict, Optional, Union`
- Run `mypy` to validate type correctness
- Update docstrings to remove redundant type info (now in hints)

### 3. Documentation: Basic → Enhanced Metadata

**PEP 8**: Docstrings required for public modules, classes, functions
**Our Guide**: Enhanced module docstrings with structured metadata

**Why**: Structured metadata enables automated documentation generation, dependency tracking, and AI-assisted code understanding.

**Migration**:

```python
## PEP 8 - basic module docstring
"""User authentication module."""

import jwt
from fastapi import HTTPException

## Our Guide - enhanced metadata
"""
@module user_authentication
@description Handles user authentication, session management, and JWT token generation
@dependencies fastapi, pyjwt, passlib, python-dotenv
@version 1.2.0
@author Tyler Dukes
@last_updated 2025-12-07
@status stable
@security_classification internal
@python_version >= 3.9
"""

import jwt
from fastapi import HTTPException
```

**Action Required**:

- Add metadata tags to module docstrings
- Document dependencies explicitly
- Add version and status information
- Specify minimum Python version requirements

### 4. Docstrings: PEP 257 → Google/NumPy Style with Examples

**PEP 8/257**: Basic docstring format
**Our Guide**: Structured docstrings with Args, Returns, Raises, Examples

**Why**: Consistent structured docstrings improve API documentation, enable automated doc generation,
and provide usage examples.

**Migration**:

```python
## PEP 8/257 - basic docstring
def authenticate_user(username, password):
    """Authenticate user and return user object or None."""
    pass

## Our Guide - structured with examples
def authenticate_user(username: str, password: str) -> Optional[User]:
    """
    Authenticate user credentials and return user object if valid.

    Args:
        username: User's username or email address
        password: Plain text password to verify

    Returns:
        User object if authentication succeeds, None otherwise

    Raises:
        DatabaseError: If database connection fails
        ValidationError: If username format is invalid

    Example:
        >>> user = authenticate_user("john@example.com", "secret123")
        >>> if user:
        ...     print(f"Welcome {user.name}")
    """
    pass
```

**Action Required**:

- Restructure docstrings with Args/Returns/Raises sections
- Add usage examples to complex functions
- Document all exceptions that may be raised
- Use consistent formatting (Google or NumPy style)

### 5. Testing: Recommended → Required Coverage

**PEP 8**: No specific testing requirements
**Our Guide**: 80%+ unit test coverage required, structured test naming

**Why**: High test coverage ensures reliability for infrastructure automation where failures have production impact.

**Migration**:

```python
## No PEP 8 equivalent - testing not mandated

## Our Guide - required test structure
import pytest
from app.services.user_service import UserService

def test_should_return_user_when_valid_id_provided():
    """Test get_user_by_id returns user for valid ID."""
    # Arrange
    user_id = 123

    # Act
    user = get_user_by_id(user_id)

    # Assert
    assert user.id == user_id
    assert user is not None

def test_should_raise_error_when_user_not_found():
    """Test get_user_by_id raises NotFoundError for invalid ID."""
    with pytest.raises(NotFoundError):
        get_user_by_id(999999)
```

**Action Required**:

- Create `tests/` directory mirroring `src/` structure
- Write tests for all business logic (target 80%+ coverage)
- Use naming convention: `test_should_<behavior>_when_<condition>`
- Set up pytest with coverage reporting
- Add pytest configuration to `pyproject.toml`

### 6. Security: Implicit → Explicit Best Practices

**PEP 8**: No security-specific requirements
**Our Guide**: Mandatory security practices for DevOps code

**Why**: Infrastructure automation code handles sensitive data, credentials, and production systems. Security must be explicit.

**Migration - Input Validation**:

```python
## PEP 8 - basic validation
def get_user_by_email(email):
    query = f"SELECT * FROM users WHERE email = '{email}'"
    return db.execute(query)

## Our Guide - security-first with validation
from pydantic import BaseModel, EmailStr, validator

class UserQuery(BaseModel):
    """Validated user query request."""
    email: EmailStr

def get_user_by_email(email: str) -> Optional[User]:
    """Get user by email using parameterized query."""
    # Input validation with Pydantic
    user_query = UserQuery(email=email)

    # Parameterized query prevents SQL injection
    query = text("SELECT * FROM users WHERE email = :email")
    result = db.execute(query, {"email": user_query.email})
    return result.first()
```

**Migration - Secret Management**:

```python
## PEP 8 - no specific requirements
DATABASE_URL = "postgresql://user:pass@localhost/db"
API_KEY = "sk_live_abc123"

## Our Guide - environment-based secrets
import os
from functools import lru_cache

@lru_cache()
def get_settings():
    """Get application settings from environment."""
    return {
        "database_url": os.getenv("DATABASE_URL"),
        "api_key": os.getenv("API_KEY"),
        "secret_key": os.getenv("SECRET_KEY")
    }
```

**Action Required**:

- Add input validation with Pydantic or custom validators
- Replace string concatenation with parameterized queries
- Move all secrets to environment variables
- Add `.env` to `.gitignore`
- Use validation libraries (Pydantic, Cerberus)
- Run security scanners (Bandit, Safety)

### 7. Error Handling: General → Specific Exceptions

**PEP 8**: No specific error handling patterns
**Our Guide**: Fail-fast with specific custom exceptions

**Migration**:

```python
## PEP 8 - generic exception handling
def fetch_data(url):
    try:
        response = requests.get(url)
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

## Our Guide - specific exceptions and proper cleanup
class APIError(Exception):
    """Base exception for API-related errors."""
    pass

class APITimeoutError(APIError):
    """Raised when API request times out."""
    pass

def fetch_data(url: str) -> Dict:
    """Fetch data from remote API with retry logic."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.Timeout:
        logger.error(f"Timeout fetching data from {url}")
        raise APITimeoutError(f"Request to {url} timed out")
    except requests.HTTPError as e:
        logger.error(f"HTTP error {e.response.status_code}: {url}")
        raise APIError(f"Failed to fetch data: {e}")
    except ValueError:
        logger.error(f"Invalid JSON response from {url}")
        raise DataFormatError("Response is not valid JSON")
```

**Action Required**:

- Create custom exception hierarchies for your domain
- Replace generic `except Exception` with specific exceptions
- Add proper logging before raising exceptions
- Use context managers for resource cleanup
- Never silently catch exceptions (`except: pass`)

## Tool Configuration Changes

### Black Formatter (New Requirement)

Black is required for consistent code formatting. PEP 8 doesn't mandate a specific formatter.

**Installation**:

```bash
pip install black
```

**Configuration** (`pyproject.toml`):

```toml
[tool.black]
line-length = 88
target-version = ['py39', 'py310', 'py311']
include = '\.pyi?$'
```

**Usage**:

```bash
## Format entire project
black .

## Check without modifying
black --check .

## Format specific file
black src/mymodule.py
```

### mypy Type Checker (New Requirement)

Static type checking is required. Configure mypy for your project.

**Installation**:

```bash
pip install mypy
```

**Configuration** (`mypy.ini` or `pyproject.toml`):

```toml
[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_any_unimported = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
check_untyped_defs = true
strict_equality = true
```

**Usage**:

```bash
## Type check entire project
mypy src/

## Type check specific module
mypy src/mymodule.py
```

### isort Import Organizer (Enhanced)

Configure isort to work with Black.

**Configuration** (`pyproject.toml`):

```toml
[tool.isort]
profile = "black"
line_length = 88
multi_line_output = 3
include_trailing_comma = true
force_grid_wrap = 0
use_parentheses = true
ensure_newline_before_comments = true
```

### pytest with Coverage (New Requirement)

**Installation**:

```bash
pip install pytest pytest-cov pytest-mock
```

**Configuration** (`pyproject.toml`):

```toml
[tool.pytest.ini_options]
minversion = "7.0"
addopts = "-ra -q --strict-markers --cov=src --cov-report=term-missing --cov-fail-under=80"
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
```

**Usage**:

```bash
## Run tests with coverage
pytest --cov=src tests/

## Generate HTML coverage report
pytest --cov=src --cov-report=html tests/
```

### Pre-commit Hooks (New Requirement)

Automate code quality checks before commits.

**Installation**:

```bash
pip install pre-commit
```

**Configuration** (`.pre-commit-config.yaml`):

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.10.0
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: ["--profile", "black"]

  - repo: https://github.com/pycqa/flake8
    rev: 7.1.1
    hooks:
      - id: flake8
        args: ["--max-line-length=88", "--extend-ignore=E203"]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.11.2
    hooks:
      - id: mypy
        additional_dependencies: [types-requests]

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.9
    hooks:
      - id: bandit
        args: ["-c", "pyproject.toml"]
```

**Setup**:

```bash
## Install hooks
pre-commit install

## Run manually on all files
pre-commit run --all-files
```

## Migration Checklist

Use this checklist to systematically migrate your Python project from PEP 8 to the DevOps Engineering Style Guide.

### Phase 1: Setup and Configuration

- [ ] **Install required tools**

  ```bash
  pip install black isort mypy pytest pytest-cov pre-commit bandit safety
  ```

- [ ] **Create `pyproject.toml` configuration**
  - Add Black configuration (88 char line length)
  - Add isort configuration (Black-compatible)
  - Add mypy strict configuration
  - Add pytest configuration (80% coverage minimum)

- [ ] **Create `.pre-commit-config.yaml`**
  - Add Black hook
  - Add isort hook
  - Add Flake8 hook (with 88 char limit)
  - Add mypy hook
  - Add Bandit security scanner
  - Run `pre-commit install`

- [ ] **Update `.gitignore`**

  ```gitignore
  # Python
  __pycache__/
  *.py[cod]
  *$py.class
  .mypy_cache/
  .pytest_cache/
  htmlcov/
  .coverage

  # Environment
  .env
  .env.local
  venv/
  ```

### Phase 2: Code Formatting

- [ ] **Run Black on entire codebase**

  ```bash
  black .
  ```

  - Review changes (line length adjustments)
  - Commit formatted code

- [ ] **Run isort on imports**

  ```bash
  isort .
  ```

  - Verify import grouping
  - Commit organized imports

- [ ] **Fix Flake8 issues**

  ```bash
  flake8 . --max-line-length=88 --extend-ignore=E203
  ```

  - Address remaining style violations
  - Commit fixes

### Phase 3: Add Type Hints

- [ ] **Add type hints to function signatures**
  - Start with public APIs and exported functions
  - Use `from typing import List, Dict, Optional, Union, Tuple`
  - Work module by module

- [ ] **Run mypy incrementally**

  ```bash
  mypy src/module_name.py
  ```

  - Fix type errors as you add hints
  - Use `# type: ignore` sparingly for complex cases

- [ ] **Add return type annotations**
  - Ensure all functions have `-> ReturnType`
  - Use `-> None` for functions without return
  - Use `Optional[Type]` for nullable returns

- [ ] **Validate with mypy**

  ```bash
  mypy src/
  ```

  - Achieve zero mypy errors
  - Commit type-hinted code

### Phase 4: Enhance Documentation

- [ ] **Update module docstrings with metadata**
  - Add `@module`, `@description`, `@dependencies` tags
  - Add `@version`, `@author`, `@status` tags
  - Document security classification if applicable

- [ ] **Restructure function docstrings**
  - Convert to Google/NumPy style with sections
  - Add `Args:`, `Returns:`, `Raises:` sections
  - Add usage examples for complex functions
  - Remove redundant type info (now in type hints)

- [ ] **Document exceptions**
  - List all exceptions in `Raises:` section
  - Create custom exception classes
  - Add docstrings to exception classes

### Phase 5: Add Tests

- [ ] **Create test directory structure**

  ```bash
  mkdir -p tests/
  # Mirror src/ structure in tests/
  ```

- [ ] **Write unit tests**
  - Aim for 80%+ coverage
  - Use naming: `test_should_<behavior>_when_<condition>`
  - Follow Arrange-Act-Assert pattern

- [ ] **Configure pytest**
  - Add pytest configuration to `pyproject.toml`
  - Set up coverage reporting
  - Configure test discovery patterns

- [ ] **Run tests and verify coverage**

  ```bash
  pytest --cov=src --cov-report=term-missing tests/
  ```

  - Achieve 80%+ coverage target
  - Add tests for uncovered code

### Phase 6: Security Enhancements

- [ ] **Move secrets to environment variables**
  - Create `.env.example` template
  - Update code to use `os.getenv()`
  - Add `.env` to `.gitignore`
  - Document required environment variables

- [ ] **Add input validation**
  - Use Pydantic models for request validation
  - Add custom validators for business rules
  - Validate all external inputs

- [ ] **Replace SQL string concatenation**
  - Use parameterized queries
  - Use ORM query builders (SQLAlchemy)
  - Never use f-strings for SQL

- [ ] **Run security scanners**

  ```bash
  bandit -r src/
  safety check
  ```

  - Fix identified vulnerabilities
  - Document any accepted risks

### Phase 7: CI/CD Integration

- [ ] **Create GitHub Actions workflow** (if using GitHub)

  ```yaml
  # .github/workflows/python-ci.yml
  name: Python CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-python@v4
          with:
            python-version: '3.11'
        - run: pip install -r requirements.txt
        - run: black --check .
        - run: isort --check .
        - run: flake8 .
        - run: mypy src/
        - run: pytest --cov=src tests/
  ```

- [ ] **Add CI/CD badges to README**
  - Test status badge
  - Coverage badge
  - Code quality badge

- [ ] **Configure branch protection**
  - Require CI checks to pass
  - Require code review
  - Enforce pre-commit hooks

### Phase 8: Documentation and Training

- [ ] **Update README with tool requirements**
  - List Black, mypy, pytest as requirements
  - Add setup instructions
  - Document development workflow

- [ ] **Create CONTRIBUTING guide**
  - Reference DevOps Engineering Style Guide
  - Explain pre-commit hook usage
  - Provide testing guidelines

- [ ] **Team training**
  - Share this migration guide with team
  - Conduct style guide review session
  - Set up IDE/editor configurations

## Common Migration Pitfalls

### 1. Type Hint Complexity Overload

**Problem**: Trying to add perfect type hints to complex legacy code all at once.

**Solution**: Migrate incrementally, module by module. Use `# type: ignore` temporarily for complex cases, then refactor.

```python
## During migration - acceptable temporarily
result = complex_function()  # type: ignore

## Target state after refactoring
result: Dict[str, List[User]] = complex_function()
```

### 2. Over-Reliance on `Any` Type

**Problem**: Using `typing.Any` to satisfy mypy without actual type safety.

**Solution**: Use specific types or `Union` types. Reserve `Any` for truly dynamic cases.

```python
## Avoid - defeats purpose of type hints
def process(data: Any) -> Any:
    pass

## Better - specific types
def process(data: Union[str, int, List[str]]) -> Dict[str, int]:
    pass
```

### 3. Docstring Duplication

**Problem**: Repeating type information in both type hints and docstrings.

**Solution**: Remove type information from docstrings when type hints are present.

```python
## Redundant - types in both places
def get_user(user_id: int) -> Optional[User]:
    """
    Get user by ID.

    Args:
        user_id (int): The user ID

    Returns:
        Optional[User]: User object or None
    """
    pass

## Better - types in hints, descriptions in docstrings
def get_user(user_id: int) -> Optional[User]:
    """
    Retrieve user from database by ID.

    Args:
        user_id: Unique identifier for the user

    Returns:
        User object if found, None otherwise
    """
    pass
```

### 4. Test Naming Confusion

**Problem**: Inconsistent test naming makes test intent unclear.

**Solution**: Follow the pattern `test_should_<behavior>_when_<condition>` consistently.

```python
## Inconsistent
def test_user_creation():
    pass

def test_invalid_email():
    pass

## Consistent and clear
def test_should_create_user_when_valid_data_provided():
    pass

def test_should_raise_error_when_invalid_email_provided():
    pass
```

### 5. Ignoring Pre-commit Hook Failures

**Problem**: Committing code that fails pre-commit checks using `--no-verify`.

**Solution**: Fix the issues, don't bypass the checks. Pre-commit hooks catch real problems.

```bash
## Wrong - bypassing checks
git commit --no-verify -m "quick fix"

## Right - fix issues first
black .
isort .
mypy src/
pytest
git commit -m "feat: add user validation"
```

## Gradual Adoption Strategy

If immediate full migration is not feasible, adopt incrementally:

### Week 1-2: Tooling Setup

- Install Black, mypy, pytest, pre-commit
- Configure `pyproject.toml`
- Run Black to reformat entire codebase
- Set up CI/CD with formatting checks

### Week 3-4: Type Hints for New Code

- Require type hints for all new functions
- Add type hints to recently modified modules
- Start mypy checking on new modules only

### Week 5-8: Documentation Enhancement

- Add structured metadata to module docstrings
- Improve docstrings for public APIs
- Add usage examples to key functions

### Week 9-12: Testing and Coverage

- Add pytest configuration
- Write tests for new features (require 80% coverage)
- Incrementally add tests to existing critical modules

### Month 4+: Complete Migration

- Systematically add type hints to remaining modules
- Achieve 80%+ test coverage across codebase
- Enable strict mypy checking project-wide
- Full security audit with Bandit/Safety

## Success Metrics

Track these metrics to measure migration progress:

- **Type Hint Coverage**: % of functions with complete type hints (Target: 100%)
- **mypy Pass Rate**: % of modules passing strict mypy checks (Target: 100%)
- **Test Coverage**: % of code covered by tests (Target: 80%+)
- **Security Scan**: Bandit/Safety issues count (Target: 0 high/critical)
- **Pre-commit Pass**: % of commits passing all hooks (Target: 100%)
- **Docstring Completeness**: % of functions with structured docstrings (Target: 100%)

## Support and Resources

### Documentation References

- [Python Style Guide](../02_language_guides/python.md) - Full Dukes Engineering Python standards
- [Testing Strategies](../05_ci_cd/testing_strategies.md) - pytest patterns and best practices
- [Security Scanning Guide](../05_ci_cd/security_scanning_guide.md) - Bandit, Safety integration
- [GitHub Actions Guide](../05_ci_cd/github_actions_guide.md) - Python CI/CD workflows
- [IDE Integration Guide](../05_ci_cd/ide_integration_guide.md) - VS Code, PyCharm setup

### Tool Documentation

- [Black](https://black.readthedocs.io/) - Code formatter
- [mypy](https://mypy.readthedocs.io/) - Static type checker
- [pytest](https://docs.pytest.org/) - Testing framework
- [Bandit](https://bandit.readthedocs.io/) - Security linter

### Community Support

- GitHub Issues: Report migration challenges
- Team Discussions: Share migration experiences
- Office Hours: Schedule style guide review sessions

## Conclusion

Migrating from PEP 8 to the DevOps Engineering Style Guide enhances your Python codebase with:

✅ **Type Safety** - Catch errors before runtime with mypy
✅ **Consistency** - Automated formatting with Black
✅ **Quality** - 80%+ test coverage requirement
✅ **Security** - Built-in security best practices
✅ **Documentation** - Structured, AI-parseable metadata
✅ **Automation** - Pre-commit hooks and CI/CD integration

The migration builds on PEP 8's solid foundation while adding modern DevOps-oriented practices
essential for infrastructure automation and production reliability.

**Questions or need help?** Open an issue or consult the [Getting Started Guide](../01_overview/getting_started.md).
