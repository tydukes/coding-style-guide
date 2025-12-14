---
title: "Complete Python Package Example"
description: "Full working example of a modern Python package with best practices"
author: "Tyler Dukes"
tags: [python, package, example, best-practices, complete]
category: "Examples"
status: "active"
---

## Overview

This is a complete, working example of a modern Python package called **dataproc** - a data processing library.
It demonstrates all best practices from the Python Package Template, including project structure, type hints,
testing, documentation, and CI/CD integration.

**Package Purpose**: A simple data processing library that validates, transforms, and exports data in various formats.

---

## Project Structure

```text
dataproc/
├── src/
│   └── dataproc/
│       ├── __init__.py
│       ├── __main__.py
│       ├── core.py
│       ├── validators.py
│       ├── transformers.py
│       ├── exporters.py
│       └── py.typed
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_core.py
│   ├── test_validators.py
│   ├── test_transformers.py
│   └── test_exporters.py
├── docs/
│   ├── index.md
│   ├── api.md
│   └── examples.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── pyproject.toml
├── README.md
├── LICENSE
├── CHANGELOG.md
├── .gitignore
├── .pre-commit-config.yaml
└── Makefile
```

---

## pyproject.toml

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "dataproc"
version = "1.0.0"
description = "A modern data processing library with validation and export capabilities"
readme = "README.md"
authors = [
    {name = "Tyler Dukes", email = "tyler@example.com"}
]
license = {text = "MIT"}
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Topic :: Software Development :: Libraries :: Python Modules",
]
keywords = ["data", "processing", "validation", "export"]
requires-python = ">=3.10"
dependencies = [
    "pydantic>=2.5.0",
    "pandas>=2.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "black>=23.12.0",
    "ruff>=0.1.9",
    "mypy>=1.8.0",
    "pre-commit>=3.6.0",
]
docs = [
    "mkdocs>=1.5.0",
    "mkdocs-material>=9.5.0",
]

[project.urls]
Homepage = "https://github.com/tydukes/dataproc"
Documentation = "https://dataproc.readthedocs.io"
Repository = "https://github.com/tydukes/dataproc"
Issues = "https://github.com/tydukes/dataproc/issues"

[project.scripts]
dataproc = "dataproc.__main__:main"

[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]
include = ["dataproc*"]

[tool.setuptools.package-data]
dataproc = ["py.typed"]

[tool.black]
line-length = 100
target-version = ["py310", "py311", "py312"]

[tool.ruff]
line-length = 100
target-version = "py310"
select = ["E", "W", "F", "I", "B", "C4", "UP"]

[tool.ruff.isort]
known-first-party = ["dataproc"]

[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = ["--verbose", "--cov=dataproc", "--cov-report=term-missing", "--cov-report=xml"]

[tool.coverage.run]
source = ["src"]
omit = ["tests/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise NotImplementedError",
    "if TYPE_CHECKING:",
]
```

---

## src/dataproc/**init**.py

```python
"""DataProc - A modern data processing library."""

from dataproc.core import DataProcessor
from dataproc.exporters import CSVExporter, JSONExporter
from dataproc.transformers import clean_text, normalize_numeric
from dataproc.validators import EmailValidator, RangeValidator

__version__ = "1.0.0"
__all__ = [
    "DataProcessor",
    "CSVExporter",
    "JSONExporter",
    "clean_text",
    "normalize_numeric",
    "EmailValidator",
    "RangeValidator",
]
```

---

## src/dataproc/**main**.py

```python
"""CLI entry point for dataproc."""

import argparse
import sys
from pathlib import Path
from typing import Optional

from dataproc import __version__
from dataproc.core import DataProcessor
from dataproc.exporters import CSVExporter, JSONExporter

def parse_args(args: Optional[list[str]] = None) -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        prog="dataproc",
        description="Process and validate data with various export formats",
    )

    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )

    parser.add_argument(
        "input_file",
        type=Path,
        help="Input CSV file to process",
    )

    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output file path",
    )

    parser.add_argument(
        "-f",
        "--format",
        choices=["csv", "json"],
        default="csv",
        help="Output format (default: csv)",
    )

    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose output",
    )

    return parser.parse_args(args)

def main(args: Optional[list[str]] = None) -> int:
    """Main CLI entry point."""
    parsed_args = parse_args(args)

    if not parsed_args.input_file.exists():
        print(f"Error: Input file not found: {parsed_args.input_file}", file=sys.stderr)
        return 1

    try:
        # Initialize processor
        processor = DataProcessor()

        # Load and process data
        if parsed_args.verbose:
            print(f"Loading data from {parsed_args.input_file}")

        data = processor.load_csv(parsed_args.input_file)

        if parsed_args.verbose:
            print(f"Loaded {len(data)} records")

        # Validate data
        validation_result = processor.validate(data)
        if not validation_result.is_valid:
            print(f"Validation failed: {validation_result.errors}", file=sys.stderr)
            return 1

        # Export data
        output_path = parsed_args.output or parsed_args.input_file.with_suffix(
            f".processed.{parsed_args.format}"
        )

        if parsed_args.format == "csv":
            exporter = CSVExporter()
        else:
            exporter = JSONExporter()

        exporter.export(data, output_path)

        if parsed_args.verbose:
            print(f"Data exported to {output_path}")

        return 0

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

---

## src/dataproc/core.py

```python
"""Core data processing functionality."""

from pathlib import Path
from typing import Any

import pandas as pd
from pydantic import BaseModel, Field

class ValidationResult(BaseModel):
    """Result of data validation."""

    is_valid: bool = Field(description="Whether validation passed")
    errors: list[str] = Field(default_factory=list, description="List of validation errors")
    warnings: list[str] = Field(default_factory=list, description="List of warnings")

class DataProcessor:
    """Main data processor class.

    Handles loading, validation, transformation, and export of data.
    """

    def __init__(self) -> None:
        """Initialize DataProcessor."""
        self.data: pd.DataFrame | None = None

    def load_csv(self, file_path: Path) -> pd.DataFrame:
        """Load data from CSV file.

        Args:
            file_path: Path to CSV file

        Returns:
            Loaded DataFrame

        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file is invalid
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            self.data = pd.read_csv(file_path)
            return self.data
        except Exception as e:
            raise ValueError(f"Failed to load CSV: {e}")

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        """Validate data.

        Args:
            data: DataFrame to validate

        Returns:
            ValidationResult with validation status and errors
        """
        errors = []
        warnings = []

        # Check for empty data
        if data.empty:
            errors.append("Data is empty")

        # Check for missing values
        missing_counts = data.isnull().sum()
        for column, count in missing_counts.items():
            if count > 0:
                warnings.append(f"Column '{column}' has {count} missing values")

        # Check for duplicate rows
        duplicates = data.duplicated().sum()
        if duplicates > 0:
            warnings.append(f"Found {duplicates} duplicate rows")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )

    def transform(self, data: pd.DataFrame, operations: list[str]) -> pd.DataFrame:
        """Transform data with specified operations.

        Args:
            data: DataFrame to transform
            operations: List of transformation operations

        Returns:
            Transformed DataFrame
        """
        result = data.copy()

        for operation in operations:
            if operation == "drop_duplicates":
                result = result.drop_duplicates()
            elif operation == "drop_na":
                result = result.dropna()
            elif operation == "reset_index":
                result = result.reset_index(drop=True)

        return result
```

---

## src/dataproc/validators.py

```python
"""Data validation utilities."""

import re
from abc import ABC, abstractmethod
from typing import Any

class Validator(ABC):
    """Base validator class."""

    @abstractmethod
    def validate(self, value: Any) -> bool:
        """Validate a value.

        Args:
            value: Value to validate

        Returns:
            True if valid, False otherwise
        """
        pass

class EmailValidator(Validator):
    """Validate email addresses."""

    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

    def validate(self, value: Any) -> bool:
        """Validate email address.

        Args:
            value: Email to validate

        Returns:
            True if valid email, False otherwise
        """
        if not isinstance(value, str):
            return False

        return bool(self.EMAIL_REGEX.match(value))

class RangeValidator(Validator):
    """Validate numeric values within range."""

    def __init__(self, min_value: float, max_value: float) -> None:
        """Initialize RangeValidator.

        Args:
            min_value: Minimum allowed value
            max_value: Maximum allowed value
        """
        self.min_value = min_value
        self.max_value = max_value

    def validate(self, value: Any) -> bool:
        """Validate value is within range.

        Args:
            value: Value to validate

        Returns:
            True if within range, False otherwise
        """
        try:
            numeric_value = float(value)
            return self.min_value <= numeric_value <= self.max_value
        except (TypeError, ValueError):
            return False
```

---

## src/dataproc/transformers.py

```python
"""Data transformation utilities."""

import re

def clean_text(text: str) -> str:
    """Clean text by removing extra whitespace and special characters.

    Args:
        text: Text to clean

    Returns:
        Cleaned text
    """
    # Remove extra whitespace
    text = " ".join(text.split())

    # Remove special characters except basic punctuation
    text = re.sub(r"[^\w\s.,!?-]", "", text)

    return text.strip()

def normalize_numeric(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Normalize numeric value to specified range.

    Args:
        value: Value to normalize
        min_val: Minimum value of range
        max_val: Maximum value of range

    Returns:
        Normalized value
    """
    if min_val >= max_val:
        raise ValueError("min_val must be less than max_val")

    normalized = (value - min_val) / (max_val - min_val)
    return max(0.0, min(1.0, normalized))
```

---

## src/dataproc/exporters.py

```python
"""Data export utilities."""

import json
from abc import ABC, abstractmethod
from pathlib import Path

import pandas as pd

class Exporter(ABC):
    """Base exporter class."""

    @abstractmethod
    def export(self, data: pd.DataFrame, output_path: Path) -> None:
        """Export data to file.

        Args:
            data: DataFrame to export
            output_path: Path to output file
        """
        pass

class CSVExporter(Exporter):
    """Export data to CSV format."""

    def __init__(self, delimiter: str = ",") -> None:
        """Initialize CSVExporter.

        Args:
            delimiter: CSV delimiter character
        """
        self.delimiter = delimiter

    def export(self, data: pd.DataFrame, output_path: Path) -> None:
        """Export data to CSV file.

        Args:
            data: DataFrame to export
            output_path: Path to output CSV file
        """
        data.to_csv(output_path, sep=self.delimiter, index=False)

class JSONExporter(Exporter):
    """Export data to JSON format."""

    def __init__(self, indent: int = 2) -> None:
        """Initialize JSONExporter.

        Args:
            indent: JSON indentation spaces
        """
        self.indent = indent

    def export(self, data: pd.DataFrame, output_path: Path) -> None:
        """Export data to JSON file.

        Args:
            data: DataFrame to export
            output_path: Path to output JSON file
        """
        data.to_json(output_path, orient="records", indent=self.indent)
```

---

## tests/conftest.py

```python
"""Pytest configuration and fixtures."""

from pathlib import Path

import pandas as pd
import pytest

@pytest.fixture
def sample_csv(tmp_path: Path) -> Path:
    """Create sample CSV file.

    Args:
        tmp_path: Pytest temporary directory

    Returns:
        Path to sample CSV file
    """
    csv_path = tmp_path / "sample.csv"
    data = pd.DataFrame({
        "name": ["Alice", "Bob", "Charlie"],
        "age": [25, 30, 35],
        "email": ["alice@example.com", "bob@example.com", "charlie@example.com"],
    })
    data.to_csv(csv_path, index=False)
    return csv_path

@pytest.fixture
def sample_dataframe() -> pd.DataFrame:
    """Create sample DataFrame.

    Returns:
        Sample DataFrame
    """
    return pd.DataFrame({
        "name": ["Alice", "Bob", "Charlie"],
        "age": [25, 30, 35],
        "score": [85.5, 92.0, 78.5],
    })
```

---

## tests/test_core.py

```python
"""Tests for core functionality."""

from pathlib import Path

import pandas as pd
import pytest

from dataproc.core import DataProcessor, ValidationResult

class TestDataProcessor:
    """Tests for DataProcessor class."""

    def test_load_csv_success(self, sample_csv: Path) -> None:
        """Test successful CSV loading."""
        processor = DataProcessor()
        data = processor.load_csv(sample_csv)

        assert isinstance(data, pd.DataFrame)
        assert len(data) == 3
        assert "name" in data.columns

    def test_load_csv_file_not_found(self) -> None:
        """Test CSV loading with nonexistent file."""
        processor = DataProcessor()

        with pytest.raises(FileNotFoundError):
            processor.load_csv(Path("nonexistent.csv"))

    def test_validate_empty_data(self) -> None:
        """Test validation of empty DataFrame."""
        processor = DataProcessor()
        empty_df = pd.DataFrame()

        result = processor.validate(empty_df)

        assert not result.is_valid
        assert "empty" in result.errors[0].lower()

    def test_validate_with_missing_values(self, sample_dataframe: pd.DataFrame) -> None:
        """Test validation with missing values."""
        processor = DataProcessor()
        df_with_na = sample_dataframe.copy()
        df_with_na.loc[0, "age"] = None

        result = processor.validate(df_with_na)

        assert result.is_valid  # Warnings don't fail validation
        assert len(result.warnings) > 0
        assert "missing" in result.warnings[0].lower()

    def test_transform_drop_duplicates(self, sample_dataframe: pd.DataFrame) -> None:
        """Test drop duplicates transformation."""
        processor = DataProcessor()
        df_with_dupes = pd.concat([sample_dataframe, sample_dataframe.iloc[[0]]])

        result = processor.transform(df_with_dupes, ["drop_duplicates"])

        assert len(result) == len(sample_dataframe)
```

---

## tests/test_validators.py

```python
"""Tests for validators."""

import pytest

from dataproc.validators import EmailValidator, RangeValidator

class TestEmailValidator:
    """Tests for EmailValidator."""

    def test_valid_email(self) -> None:
        """Test validation of valid email."""
        validator = EmailValidator()

        assert validator.validate("user@example.com")
        assert validator.validate("test.user@company.co.uk")

    def test_invalid_email(self) -> None:
        """Test validation of invalid email."""
        validator = EmailValidator()

        assert not validator.validate("invalid")
        assert not validator.validate("@example.com")
        assert not validator.validate("user@")
        assert not validator.validate(123)

class TestRangeValidator:
    """Tests for RangeValidator."""

    def test_value_in_range(self) -> None:
        """Test validation of value within range."""
        validator = RangeValidator(0.0, 100.0)

        assert validator.validate(50.0)
        assert validator.validate(0.0)
        assert validator.validate(100.0)

    def test_value_out_of_range(self) -> None:
        """Test validation of value outside range."""
        validator = RangeValidator(0.0, 100.0)

        assert not validator.validate(-1.0)
        assert not validator.validate(101.0)

    def test_invalid_value_type(self) -> None:
        """Test validation of invalid value type."""
        validator = RangeValidator(0.0, 100.0)

        assert not validator.validate("not a number")
        assert not validator.validate(None)
```

---

## tests/test_transformers.py

```python
"""Tests for transformers."""

import pytest

from dataproc.transformers import clean_text, normalize_numeric

def test_clean_text() -> None:
    """Test text cleaning."""
    assert clean_text("  Hello   World  ") == "Hello World"
    assert clean_text("Test@#$%Text") == "TestText"
    assert clean_text("Keep, this! and? that-") == "Keep, this! and? that-"

def test_normalize_numeric() -> None:
    """Test numeric normalization."""
    assert normalize_numeric(50.0, 0.0, 100.0) == 0.5
    assert normalize_numeric(0.0, 0.0, 100.0) == 0.0
    assert normalize_numeric(100.0, 0.0, 100.0) == 1.0

def test_normalize_numeric_invalid_range() -> None:
    """Test normalization with invalid range."""
    with pytest.raises(ValueError):
        normalize_numeric(50.0, 100.0, 0.0)
```

---

## tests/test_exporters.py

```python
"""Tests for exporters."""

import json
from pathlib import Path

import pandas as pd
import pytest

from dataproc.exporters import CSVExporter, JSONExporter

def test_csv_exporter(sample_dataframe: pd.DataFrame, tmp_path: Path) -> None:
    """Test CSV export."""
    exporter = CSVExporter()
    output_path = tmp_path / "output.csv"

    exporter.export(sample_dataframe, output_path)

    assert output_path.exists()
    loaded = pd.read_csv(output_path)
    assert len(loaded) == len(sample_dataframe)

def test_json_exporter(sample_dataframe: pd.DataFrame, tmp_path: Path) -> None:
    """Test JSON export."""
    exporter = JSONExporter()
    output_path = tmp_path / "output.json"

    exporter.export(sample_dataframe, output_path)

    assert output_path.exists()
    with output_path.open() as f:
        data = json.load(f)
    assert len(data) == len(sample_dataframe)
```

---

## README.md

```markdown
## DataProc

[![CI](https://github.com/tydukes/dataproc/workflows/CI/badge.svg)](https://github.com/tydukes/dataproc/actions)
[![codecov](https://codecov.io/gh/tydukes/dataproc/branch/main/graph/badge.svg)](https://codecov.io/gh/tydukes/dataproc)
[![PyPI version](https://badge.fury.io/py/dataproc.svg)](https://badge.fury.io/py/dataproc)
[![Python versions](https://img.shields.io/pypi/pyversions/dataproc.svg)](https://pypi.org/project/dataproc/)

A modern Python library for data processing, validation, and export.

## Features

- ✨ Simple and intuitive API
- 🔍 Built-in data validation
- 📊 Multiple export formats (CSV, JSON)
- 🛡️ Type-safe with comprehensive type hints
- ✅ Fully tested (>95% coverage)
- 📦 Zero-config CLI tool

## Installation

```bash
pip install dataproc
```

## Quick Start

```python
from dataproc import DataProcessor, EmailValidator

## Initialize processor
processor = DataProcessor()

## Load data
data = processor.load_csv("data.csv")

## Validate
result = processor.validate(data)
if result.is_valid:
    print("Data is valid!")

## Transform
cleaned = processor.transform(data, ["drop_duplicates", "drop_na"])

## Export
from dataproc import JSONExporter
exporter = JSONExporter()
exporter.export(cleaned, "output.json")
```

## CLI Usage

```bash
## Process CSV file
dataproc input.csv -o output.json -f json

## With verbose output
dataproc input.csv --verbose
```

## Development

```bash
## Clone repository
git clone https://github.com/tydukes/dataproc.git
cd dataproc

## Install with dev dependencies
pip install -e ".[dev]"

## Run tests
pytest

## Run linters
black src tests
ruff check src tests
mypy src
```text

## License

MIT License - see LICENSE file for details.

```

---

## Key Takeaways

This complete example demonstrates:

1. **Modern project structure** with `src` layout
2. **Type hints throughout** for better IDE support and type checking
3. **Comprehensive testing** with pytest fixtures and parametrization
4. **CLI integration** with argparse
5. **Proper abstractions** using ABC for validators and exporters
6. **Documentation** with docstrings following Google style
7. **Configuration** with pyproject.toml for all tools
8. **Best practices** for error handling, validation, and user feedback

The package is fully functional and can be installed, tested, and used as a real-world example of Python packaging best practices.

---

**Version**: 1.0.0
**Status**: Active
