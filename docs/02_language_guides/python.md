# Python Style Guide

- Strict PEP8 + type hints.
- Use `black`, `isort`, `flake8`, and `mypy` in pre-commit and CI.

## Canonical example
```python
# @module: my_module
def add(a: int, b: int) -> int:
    """Add two integers."""
    return a + b
```