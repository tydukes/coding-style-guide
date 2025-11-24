---
title: "Python Package Template"
description: "Complete template structure for creating modern Python packages with pyproject.toml"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [python, package, template, pyproject]
category: "Templates"
status: "active"
version: "1.0.0"
---

## Overview

This template provides a complete structure for creating modern Python packages using `pyproject.toml` and the
src layout. Follows PEP 517, PEP 518, and modern Python packaging best practices.

---

## Package Structure

```text
my-package/
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── __main__.py
│       ├── core.py
│       ├── utils.py
│       └── py.typed
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_core.py
│   └── test_utils.py
├── docs/
│   ├── conf.py
│   ├── index.md
│   └── api.md
├── examples/
│   └── basic_usage.py
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── pyproject.toml
├── README.md
├── LICENSE
├── CHANGELOG.md
├── .gitignore
├── .pre-commit-config.yaml
└── Makefile
```

---

## pyproject.toml Template

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
version = "0.1.0"
description = "A short description of the package"
readme = "README.md"
authors = [
    {name = "Your Name", email = "your.email@example.com"}
]
license = {text = "MIT"}
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
keywords = ["example", "package", "template"]
requires-python = ">=3.10"
dependencies = [
    "requests>=2.31.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.7.0",
    "ruff>=0.0.280",
    "mypy>=1.4.0",
    "pre-commit>=3.3.0",
]
docs = [
    "mkdocs>=1.5.0",
    "mkdocs-material>=9.1.0",
    "mkdocstrings[python]>=0.22.0",
]

[project.urls]
Homepage = "https://github.com/yourusername/my-package"
Documentation = "https://my-package.readthedocs.io"
Repository = "https://github.com/yourusername/my-package"
Issues = "https://github.com/yourusername/my-package/issues"

[project.scripts]
my-package = "my_package.__main__:main"

[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]
include = ["my_package*"]

[tool.setuptools.package-data]
my_package = ["py.typed"]

# Black configuration
[tool.black]
line-length = 100
target-version = ["py310", "py311", "py312"]
include = '\.pyi?$'

# Ruff configuration
[tool.ruff]
line-length = 100
target-version = "py310"
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = []

[tool.ruff.isort]
known-first-party = ["my_package"]

# MyPy configuration
[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

# Pytest configuration
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
addopts = [
    "--verbose",
    "--cov=my_package",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-report=xml",
]

# Coverage configuration
[tool.coverage.run]
source = ["src"]
omit = ["tests/*", "**/__main__.py"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
]
```

---

## README.md Template

```markdown
# My Package

[![PyPI version](https://badge.fury.io/py/my-package.svg)](https://badge.fury.io/py/my-package)
[![Python versions](https://img.shields.io/pypi/pyversions/my-package.svg)](https://pypi.org/project/my-package/)
[![CI](https://github.com/yourusername/my-package/workflows/CI/badge.svg)](https://github.com/yourusername/my-package/actions)
[![codecov](https://codecov.io/gh/yourusername/my-package/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/my-package)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A short, compelling description of your package.

## Features

- ✨ Feature 1: Brief description
- 🚀 Feature 2: Brief description
- 🛡️ Feature 3: Brief description
- 📦 Feature 4: Brief description

## Installation

\```bash
pip install my-package
\```

For development:

\```bash
pip install my-package[dev]
\```

## Quick Start

\```python
from my_package import MyClass

# Basic usage
obj = MyClass()
result = obj.do_something()
print(result)
\```

## Usage Examples

### Example 1: Basic Usage

\```python
from my_package import core

# Use the main functionality
result = core.process_data(input_data)
\```

### Example 2: Advanced Usage

\```python
from my_package import core, utils

# Advanced configuration
config = utils.load_config("config.yaml")
processor = core.DataProcessor(config)
result = processor.run()
\```

## CLI Usage

\```bash
# Run the CLI
my-package --help

# Basic command
my-package process input.txt

# With options
my-package process input.txt --output output.txt --verbose
\```

## Documentation

Full documentation is available at [https://my-package.readthedocs.io](https://my-package.readthedocs.io)

## Development

### Setup

\```bash
# Clone the repository
git clone https://github.com/yourusername/my-package.git
cd my-package

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
\```

### Running Tests

\```bash
# Run tests
pytest

# With coverage
pytest --cov

# Run specific test
pytest tests/test_core.py::test_specific_function
\```

### Code Quality

\```bash
# Format code
black src tests

# Lint code
ruff check src tests

# Type checking
mypy src
\```

### Documentation

\```bash
# Build documentation
cd docs
mkdocs build

# Serve documentation locally
mkdocs serve
\```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## Authors

- Your Name - [@yourhandle](https://github.com/yourusername)

## Acknowledgments

- Inspiration or libraries used
- Contributors
```

---

## src/my_package/__init__.py Template

```python
"""My Package - A description of the package."""

from my_package.core import MyClass, process_data
from my_package.utils import load_config, setup_logging

__version__ = "0.1.0"
__all__ = [
    "MyClass",
    "process_data",
    "load_config",
    "setup_logging",
]
```

---

## src/my_package/__main__.py Template

```python
"""CLI entry point for my-package."""

import argparse
import sys
from pathlib import Path
from typing import Optional

from my_package import __version__
from my_package.core import process_data
from my_package.utils import setup_logging


def parse_args(args: Optional[list[str]] = None) -> argparse.Namespace:
    """Parse command line arguments.

    Args:
        args: Command line arguments (defaults to sys.argv[1:])

    Returns:
        Parsed arguments
    """
    parser = argparse.ArgumentParser(
        prog="my-package",
        description="A description of the CLI tool",
    )

    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )

    parser.add_argument(
        "input_file",
        type=Path,
        help="Input file to process",
    )

    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output file (default: stdout)",
    )

    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose output",
    )

    return parser.parse_args(args)


def main(args: Optional[list[str]] = None) -> int:
    """Main CLI entry point.

    Args:
        args: Command line arguments

    Returns:
        Exit code (0 for success, non-zero for failure)
    """
    parsed_args = parse_args(args)

    # Setup logging
    log_level = "DEBUG" if parsed_args.verbose else "INFO"
    setup_logging(log_level)

    try:
        # Process input
        result = process_data(parsed_args.input_file)

        # Write output
        if parsed_args.output:
            parsed_args.output.write_text(result)
        else:
            print(result)

        return 0

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
```

---

## src/my_package/core.py Template

```python
"""Core functionality for my-package."""

from pathlib import Path
from typing import Any


class MyClass:
    """Main class for the package.

    Args:
        config: Configuration dictionary

    Attributes:
        config: Configuration dictionary
    """

    def __init__(self, config: dict[str, Any] | None = None) -> None:
        """Initialize MyClass."""
        self.config = config or {}

    def do_something(self) -> str:
        """Perform the main action.

        Returns:
            Result string

        Raises:
            ValueError: If configuration is invalid
        """
        if not self.config:
            raise ValueError("Configuration is required")

        return "Result of doing something"


def process_data(input_file: Path) -> str:
    """Process input data from a file.

    Args:
        input_file: Path to input file

    Returns:
        Processed data as string

    Raises:
        FileNotFoundError: If input file doesn't exist
        ValueError: If input file is invalid
    """
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    content = input_file.read_text()

    if not content:
        raise ValueError("Input file is empty")

    # Process the content
    result = content.upper()

    return result
```

---

## src/my_package/utils.py Template

```python
"""Utility functions for my-package."""

import logging
from pathlib import Path
from typing import Any

import yaml


def setup_logging(level: str = "INFO") -> None:
    """Setup logging configuration.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def load_config(config_file: Path) -> dict[str, Any]:
    """Load configuration from YAML file.

    Args:
        config_file: Path to YAML configuration file

    Returns:
        Configuration dictionary

    Raises:
        FileNotFoundError: If config file doesn't exist
        ValueError: If config file is invalid YAML
    """
    if not config_file.exists():
        raise FileNotFoundError(f"Config file not found: {config_file}")

    try:
        with config_file.open() as f:
            config = yaml.safe_load(f)
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML in config file: {e}")

    return config or {}


def validate_input(data: Any) -> bool:
    """Validate input data.

    Args:
        data: Data to validate

    Returns:
        True if valid, False otherwise
    """
    if data is None:
        return False

    if isinstance(data, str) and not data.strip():
        return False

    return True
```

---

## tests/conftest.py Template

```python
"""Pytest configuration and fixtures."""

from pathlib import Path
from typing import Generator

import pytest


@pytest.fixture
def sample_data() -> dict[str, str]:
    """Provide sample data for tests.

    Returns:
        Sample data dictionary
    """
    return {
        "key1": "value1",
        "key2": "value2",
    }


@pytest.fixture
def temp_file(tmp_path: Path) -> Generator[Path, None, None]:
    """Create a temporary file for testing.

    Args:
        tmp_path: Pytest temporary directory fixture

    Yields:
        Path to temporary file
    """
    file_path = tmp_path / "test_file.txt"
    file_path.write_text("test content")

    yield file_path

    # Cleanup handled by tmp_path
```

---

## tests/test_core.py Template

```python
"""Tests for core functionality."""

from pathlib import Path

import pytest

from my_package.core import MyClass, process_data


class TestMyClass:
    """Tests for MyClass."""

    def test_init_with_config(self, sample_data: dict[str, str]) -> None:
        """Test initialization with configuration."""
        obj = MyClass(config=sample_data)
        assert obj.config == sample_data

    def test_init_without_config(self) -> None:
        """Test initialization without configuration."""
        obj = MyClass()
        assert obj.config == {}

    def test_do_something_with_config(self, sample_data: dict[str, str]) -> None:
        """Test do_something with valid configuration."""
        obj = MyClass(config=sample_data)
        result = obj.do_something()
        assert isinstance(result, str)

    def test_do_something_without_config(self) -> None:
        """Test do_something raises ValueError without config."""
        obj = MyClass()
        with pytest.raises(ValueError, match="Configuration is required"):
            obj.do_something()


class TestProcessData:
    """Tests for process_data function."""

    def test_process_data_valid_file(self, temp_file: Path) -> None:
        """Test processing a valid file."""
        result = process_data(temp_file)
        assert result == "TEST CONTENT"

    def test_process_data_missing_file(self) -> None:
        """Test processing raises FileNotFoundError for missing file."""
        with pytest.raises(FileNotFoundError):
            process_data(Path("nonexistent.txt"))

    def test_process_data_empty_file(self, tmp_path: Path) -> None:
        """Test processing raises ValueError for empty file."""
        empty_file = tmp_path / "empty.txt"
        empty_file.write_text("")

        with pytest.raises(ValueError, match="Input file is empty"):
            process_data(empty_file)
```

---

## .gitignore Template

```gitignore
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
pip-wheel-metadata/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/

# Translations
*.mo
*.pot

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask
instance/
.webassets-cache

# Scrapy
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
.python-version

# pipenv
Pipfile.lock

# PEP 582
__pypackages__/

# Celery
celerybeat-schedule
celerybeat.pid

# SageMath
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder
.spyderproject
.spyproject

# Rope
.ropeproject

# mkdocs
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre
.pyre/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

---

## .pre-commit-config.yaml Template

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-toml
      - id: check-merge-conflict
      - id: debug-statements

  - repo: https://github.com/psf/black
    rev: 23.7.0
    hooks:
      - id: black
        language_version: python3.10

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.0.280
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.4.1
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
        args: [--strict]
```

---

## Makefile Template

```makefile
.PHONY: help install dev test lint format clean build publish

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install package
	pip install -e .

dev: ## Install package with development dependencies
	pip install -e ".[dev,docs]"

test: ## Run tests
	pytest

test-cov: ## Run tests with coverage report
	pytest --cov --cov-report=html --cov-report=term

lint: ## Run linters
	ruff check src tests
	mypy src

format: ## Format code
	black src tests
	ruff check --fix src tests

clean: ## Clean build artifacts
	rm -rf build dist *.egg-info
	rm -rf .pytest_cache .coverage htmlcov
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build: clean ## Build distribution
	python -m build

publish: build ## Publish to PyPI
	python -m twine upload dist/*

docs-serve: ## Serve documentation locally
	mkdocs serve

docs-build: ## Build documentation
	mkdocs build
```

---

## Best Practices

### Package Naming

- Use lowercase with hyphens for PyPI: `my-package`
- Use underscores for Python imports: `my_package`
- Choose descriptive, unique names

### Version Management

- Follow [Semantic Versioning](https://semver.org/)
- Use `__version__` in `__init__.py`
- Keep version in sync with git tags

### Type Hints

- Use type hints for all public APIs
- Include `py.typed` marker for type checking
- Configure mypy in `pyproject.toml`

### Testing

- Aim for >90% code coverage
- Use fixtures for common test data
- Test edge cases and error conditions

### Documentation

- Write clear docstrings (Google style)
- Include usage examples in README
- Use mkdocs for comprehensive docs

---

## References

### Official Documentation

- [Python Packaging Guide](https://packaging.python.org/)
- [PEP 517 - Build System](https://peps.python.org/pep-0517/)
- [PEP 518 - pyproject.toml](https://peps.python.org/pep-0518/)
- [setuptools Documentation](https://setuptools.pypa.io/)

### Tools

- [pytest](https://pytest.org/) - Testing framework
- [black](https://black.readthedocs.io/) - Code formatter
- [ruff](https://docs.astral.sh/ruff/) - Fast Python linter
- [mypy](https://mypy.readthedocs.io/) - Static type checker
- [pre-commit](https://pre-commit.com/) - Git hooks

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
