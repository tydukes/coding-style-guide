---
title: "Python Style Guide"
description: "Python coding standards for DevOps and infrastructure automation"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [python, programming, devops, automation, testing]
category: "Language Guides"
status: "needs-expansion"
version: "0.1.0"
---


- Strict PEP8 + type hints.
- Use `black`, `isort`, `flake8`, and `mypy` in pre-commit and CI.

## Canonical example

```python
# @module: my_module
def add(a: int, b: int) -> int:
    """Add two integers."""
    return a + b
```
