---
title: "TOML and INI Style Guide"
description: "Configuration file standards for TOML and INI formats covering naming, structure, and best practices"
author: "Tyler Dukes"
tags: [toml, ini, configuration, config, settings]
category: "Language Guides"
status: "active"
search_keywords: [toml, ini, configuration, settings, pyproject.toml, config files]
---

## Language Overview

**TOML** (Tom's Obvious, Minimal Language) and **INI** (Initialization) are human-readable configuration file
formats widely used in modern applications. This guide covers standards for consistent and maintainable
configuration files.

### Key Characteristics

| Feature | TOML | INI |
|---------|------|-----|
| **File Extension** | `.toml` | `.ini`, `.cfg`, `.conf` |
| **Data Types** | Strings, integers, floats, booleans, dates, arrays, tables | Strings only (parsing required) |
| **Nesting** | Deeply nested tables supported | Single-level sections |
| **Specification** | [TOML v1.0.0](https://toml.io/en/v1.0.0) | No formal specification |
| **Primary Use** | Python (pyproject.toml), Rust (Cargo.toml), config files | Windows apps, simple configs |
| **Comments** | `#` | `;` or `#` |

---

## Quick Reference

| **Category** | **TOML** | **INI** | **Notes** |
|-------------|----------|---------|-----------|
| **Syntax** | | | |
| Comments | `# comment` | `; comment` or `# comment` | Hash preferred for both |
| Key-Value | `key = "value"` | `key = value` | TOML requires quotes for strings |
| Sections | `[section]` | `[section]` | Same syntax |
| Nested | `[section.subsection]` | Not supported | TOML only |
| **Data Types** | | | |
| String | `name = "John"` | `name = John` | INI values are always strings |
| Integer | `count = 42` | `count = 42` | INI requires parsing |
| Boolean | `enabled = true` | `enabled = true` | INI requires parsing |
| Array | `colors = ["red", "blue"]` | Not supported | TOML only |
| Date | `date = 2024-01-15` | Not supported | TOML only |
| **Key Naming** | | | |
| Style | `snake_case` or `kebab-case` | `snake_case` or `PascalCase` | Be consistent |
| Case | Case-sensitive | Often case-insensitive | Check parser docs |

---

## TOML Standards

### Basic Syntax

```toml
# Configuration file header comment
# This is the main application configuration

# Simple key-value pairs
title = "My Application"
version = "1.0.0"
debug = false

# Numbers
port = 8080
timeout_seconds = 30
pi = 3.14159

# Dates and times (RFC 3339)
created_at = 2024-01-15T10:30:00Z
release_date = 2024-01-15
```

### String Types

```toml
# Basic strings (double quotes)
name = "John Doe"
message = "Hello, World!"

# Literal strings (single quotes - no escaping)
path = 'C:\Users\Admin\Documents'
regex = '^\d{3}-\d{4}$'

# Multi-line basic strings
description = """
This is a multi-line string.
It can span multiple lines.
Leading whitespace is preserved."""

# Multi-line literal strings
script = '''
#!/bin/bash
echo "Hello"
exit 0
'''

# String with escape sequences
escaped = "Line 1\nLine 2\tTabbed"
unicode = "Unicode: \u0041"
```

### Numbers

```toml
# Integers
count = 42
negative = -17
large = 1_000_000

# Different bases
hex = 0xDEADBEEF
octal = 0o755
binary = 0b11010110

# Floats
pi = 3.14159
scientific = 6.022e23
negative_exp = 1e-10

# Special floats
infinity = inf
neg_infinity = -inf
not_a_number = nan
```

### Booleans

```toml
# Boolean values (lowercase only)
enabled = true
disabled = false
debug_mode = false
feature_flag = true
```

### Dates and Times

```toml
# Offset date-time (RFC 3339)
created_at = 2024-01-15T10:30:00Z
updated_at = 2024-01-15T10:30:00-05:00

# Local date-time (no timezone)
scheduled = 2024-01-15T10:30:00

# Local date
release_date = 2024-01-15

# Local time
daily_backup = 03:00:00
```

### Arrays

```toml
# Inline arrays
colors = ["red", "green", "blue"]
ports = [80, 443, 8080]
mixed = ["string", 42, true]

# Multi-line arrays
dependencies = [
    "requests",
    "flask",
    "sqlalchemy",
]

# Nested arrays
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]
```

### Tables (Sections)

```toml
# Standard table
[server]
host = "localhost"
port = 8080

# Nested tables using dotted keys
[database]
host = "localhost"
port = 5432

[database.connection]
pool_size = 10
timeout = 30

# Alternative: inline table
point = { x = 1, y = 2 }

# Deeply nested
[application.settings.logging]
level = "info"
format = "json"
```

### Array of Tables

```toml
# Multiple servers
[[servers]]
name = "alpha"
ip = "10.0.0.1"
role = "frontend"

[[servers]]
name = "beta"
ip = "10.0.0.2"
role = "backend"

[[servers]]
name = "gamma"
ip = "10.0.0.3"
role = "database"

# Nested array of tables
[[products]]
name = "Widget"
sku = "WGT-001"

[[products.variants]]
color = "red"
price = 9.99

[[products.variants]]
color = "blue"
price = 10.99

[[products]]
name = "Gadget"
sku = "GDT-001"

[[products.variants]]
color = "silver"
price = 19.99
```

### Inline Tables

```toml
# Simple inline tables
point = { x = 1, y = 2 }
person = { name = "John", age = 30 }

# Inline tables in arrays
coordinates = [
    { x = 0, y = 0 },
    { x = 1, y = 1 },
    { x = 2, y = 4 },
]

# When to use inline tables
# Good - small, simple structures
dimensions = { width = 100, height = 200 }

# Bad - complex structures (use standard tables instead)
# user = { name = "John", address = { street = "123 Main", city = "NYC", zip = "10001" } }
```

---

## INI Standards

### INI Basic Syntax

```ini
; Configuration file header comment
; This is the main application configuration

[application]
name = My Application
version = 1.0.0
debug = false

[server]
host = localhost
port = 8080
timeout = 30
```

### Comment Styles

```ini
; Semicolon comments (traditional)
; This is a section for server configuration

# Hash comments (also widely supported)
# Modern parsers support both styles

[server]
host = localhost  ; Inline comment with semicolon
port = 8080       # Inline comment with hash
```

### Key-Value Formatting

```ini
; Standard key-value pairs
[database]
host = localhost
port = 5432
name = mydb

; With spaces around equals (preferred for readability)
[logging]
level = info
format = json
output = stdout

; Without spaces (also valid but less readable)
[cache]
enabled=true
ttl=3600
```

### Section Naming

```ini
; Good - Clear, descriptive section names
[database]
host = localhost

[database.primary]
host = primary.example.com

[database.replica]
host = replica.example.com

; Good - Hierarchical naming with dots
[logging.console]
enabled = true
level = debug

[logging.file]
enabled = true
path = /var/log/app.log
```

### Boolean Representation

```ini
; Common boolean representations
[features]
; Recommended: lowercase true/false
enabled = true
disabled = false

; Also common: yes/no
use_cache = yes
debug_mode = no

; Also seen: 1/0
feature_flag = 1
legacy_mode = 0

; Also seen: on/off
ssl = on
compression = off
```

### Multi-line Values

```ini
; Method 1: Continuation with indentation
[messages]
welcome = Hello and welcome to our application.
    This message spans multiple lines.
    Each continuation line is indented.

; Method 2: Line continuation with backslash
[paths]
include = /usr/local/include:\
          /usr/include:\
          /opt/include

; Method 3: Numbered keys for lists
[allowed_hosts]
host1 = localhost
host2 = example.com
host3 = api.example.com
```

### Escaping Special Characters

```ini
; Escaping in INI files varies by parser
[paths]
; Backslashes in paths
windows_path = C:\\Users\\Admin\\Documents
unix_path = /home/user/documents

; Quotes for strings with special characters
message = "Hello, World!"
query = "SELECT * FROM users WHERE name = 'John'"

; Semicolons in values (must be quoted or escaped)
connection_string = "host=localhost;port=5432;database=mydb"
```

---

## Common Use Cases

### Python pyproject.toml

```toml
[project]
name = "my-package"
version = "1.0.0"
description = "A sample Python package"
readme = "README.md"
license = { text = "MIT" }
requires-python = ">=3.9"
authors = [
    { name = "John Doe", email = "john@example.com" },
]
keywords = ["sample", "package"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
]
dependencies = [
    "requests>=2.28.0",
    "click>=8.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "black>=23.0.0",
    "mypy>=1.0.0",
]
docs = [
    "mkdocs>=1.5.0",
    "mkdocs-material>=9.0.0",
]

[project.scripts]
my-cli = "my_package.cli:main"

[project.urls]
Homepage = "https://github.com/example/my-package"
Documentation = "https://my-package.readthedocs.io"
Repository = "https://github.com/example/my-package"

[build-system]
requires = ["hatchling>=1.18.0"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/my_package"]

[tool.black]
line-length = 100
target-version = ["py39", "py310", "py311"]
include = '\.pyi?$'

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=my_package"

[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W"]
ignore = ["E501"]
```

### Rust Cargo.toml

```toml
[package]
name = "my-crate"
version = "0.1.0"
edition = "2021"
authors = ["John Doe <john@example.com>"]
description = "A sample Rust crate"
documentation = "https://docs.rs/my-crate"
homepage = "https://github.com/example/my-crate"
repository = "https://github.com/example/my-crate"
license = "MIT OR Apache-2.0"
keywords = ["sample", "crate"]
categories = ["development-tools"]
readme = "README.md"

[lib]
name = "my_crate"
path = "src/lib.rs"

[[bin]]
name = "my-cli"
path = "src/main.rs"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
anyhow = "1.0"
clap = { version = "4.0", features = ["derive"] }

[dev-dependencies]
criterion = "0.5"
mockall = "0.12"
tempfile = "3.0"

[build-dependencies]
cc = "1.0"

[features]
default = ["std"]
std = []
async = ["tokio"]

[profile.release]
lto = true
codegen-units = 1
panic = "abort"

[profile.dev]
opt-level = 0
debug = true

[workspace]
members = ["crates/*"]
resolver = "2"
```

### Application Configuration

```toml
# config.toml - Application configuration

[app]
name = "MyApplication"
version = "2.1.0"
environment = "production"
debug = false

[server]
host = "0.0.0.0"
port = 8080
workers = 4
timeout_seconds = 30
max_connections = 1000

[server.ssl]
enabled = true
cert_file = "/etc/ssl/certs/app.crt"
key_file = "/etc/ssl/private/app.key"

[database]
driver = "postgresql"
host = "db.example.com"
port = 5432
name = "production_db"
pool_min = 5
pool_max = 20

[database.options]
ssl_mode = "require"
connect_timeout = 10
statement_timeout = 30000

[cache]
enabled = true
driver = "redis"
host = "cache.example.com"
port = 6379
ttl_seconds = 3600

[logging]
level = "info"
format = "json"
output = "stdout"

[logging.file]
enabled = true
path = "/var/log/app/application.log"
max_size_mb = 100
max_backups = 5

[[features]]
name = "dark_mode"
enabled = true
rollout_percentage = 100

[[features]]
name = "new_dashboard"
enabled = true
rollout_percentage = 50

[[features]]
name = "beta_api"
enabled = false
rollout_percentage = 0
```

### Git Configuration (.gitconfig)

```ini
[user]
    name = John Doe
    email = john@example.com
    signingkey = ABCD1234

[core]
    editor = vim
    autocrlf = input
    whitespace = fix
    excludesfile = ~/.gitignore_global

[init]
    defaultBranch = main

[pull]
    rebase = true

[push]
    default = current
    autoSetupRemote = true

[fetch]
    prune = true

[merge]
    ff = only
    conflictstyle = diff3

[rebase]
    autoStash = true
    autoSquash = true

[diff]
    colorMoved = zebra
    algorithm = histogram

[commit]
    gpgsign = true

[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph --decorate
    unstage = reset HEAD --
    last = log -1 HEAD

[color]
    ui = auto

[color "branch"]
    current = yellow reverse
    local = yellow
    remote = green

[color "diff"]
    meta = yellow bold
    frag = magenta bold
    old = red bold
    new = green bold

[color "status"]
    added = green
    changed = yellow
    untracked = red

[url "git@github.com:"]
    insteadOf = https://github.com/
```

### PHP Configuration (php.ini style)

```ini
; PHP Configuration
; Production settings

[PHP]
; Language options
engine = On
short_open_tag = Off
precision = 14
output_buffering = 4096
zlib.output_compression = Off

; Error handling
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
display_errors = Off
display_startup_errors = Off
log_errors = On
error_log = /var/log/php/error.log

; Resource limits
max_execution_time = 30
max_input_time = 60
memory_limit = 256M

; File uploads
file_uploads = On
upload_max_filesize = 64M
max_file_uploads = 20

[Date]
date.timezone = UTC

[Session]
session.save_handler = redis
session.save_path = "tcp://redis:6379"
session.use_strict_mode = 1
session.use_cookies = 1
session.use_only_cookies = 1
session.cookie_httponly = 1
session.cookie_secure = 1
session.cookie_samesite = Strict
session.gc_maxlifetime = 1440

[opcache]
opcache.enable = 1
opcache.memory_consumption = 256
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.validate_timestamps = 0
opcache.save_comments = 1

[MySQLi]
mysqli.max_persistent = -1
mysqli.allow_persistent = On
mysqli.max_links = -1
mysqli.default_port = 3306
mysqli.reconnect = Off
```

### EditorConfig (.editorconfig)

```ini
# EditorConfig helps maintain consistent coding styles
# https://editorconfig.org

root = true

# Default settings for all files
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

# Python files
[*.py]
indent_size = 4
max_line_length = 100

# JavaScript/TypeScript
[*.{js,jsx,ts,tsx}]
indent_size = 2

# YAML files
[*.{yaml,yml}]
indent_size = 2

# JSON files
[*.json]
indent_size = 2

# Markdown files
[*.md]
trim_trailing_whitespace = false
max_line_length = off

# Makefiles require tabs
[Makefile]
indent_style = tab

# Shell scripts
[*.sh]
indent_size = 2

# Go files
[*.go]
indent_style = tab

# Configuration files
[*.{toml,ini,cfg,conf}]
indent_size = 2
```

---

## Testing and Validation

### TOML Validation

```bash
# Install tomlkit (Python)
pip install tomlkit

# Validate TOML file with Python
python -c "import tomlkit; tomlkit.parse(open('config.toml').read())"

# Install taplo (Rust-based TOML toolkit)
cargo install taplo-cli

# Validate TOML
taplo check config.toml

# Format TOML
taplo format config.toml

# Lint TOML
taplo lint config.toml
```

### INI Validation

```bash
# Validate INI with Python
python -c "import configparser; c = configparser.ConfigParser(); c.read('config.ini')"

# Install crudini (command-line INI parser)
# On Ubuntu/Debian
apt-get install crudini

# Validate INI structure
crudini --get config.ini

# Get specific value
crudini --get config.ini section key
```

### Python Testing

```python
# tests/test_config.py
import tomlkit
import configparser
import pytest
from pathlib import Path


class TestTomlConfig:
    """Test TOML configuration files."""

    def test_toml_syntax_valid(self):
        """Verify TOML file parses without errors."""
        config_path = Path("config.toml")
        content = config_path.read_text()

        # Should not raise an exception
        config = tomlkit.parse(content)
        assert config is not None

    def test_required_sections_exist(self):
        """Verify all required sections are present."""
        config = tomlkit.parse(Path("config.toml").read_text())

        required_sections = ["app", "server", "database"]
        for section in required_sections:
            assert section in config, f"Missing required section: {section}"

    def test_server_port_valid(self):
        """Verify server port is in valid range."""
        config = tomlkit.parse(Path("config.toml").read_text())

        port = config["server"]["port"]
        assert 1 <= port <= 65535, f"Invalid port: {port}"

    def test_database_pool_size(self):
        """Verify database pool configuration is reasonable."""
        config = tomlkit.parse(Path("config.toml").read_text())

        pool_min = config["database"]["pool_min"]
        pool_max = config["database"]["pool_max"]

        assert pool_min >= 1, "Pool min must be at least 1"
        assert pool_max >= pool_min, "Pool max must be >= pool min"
        assert pool_max <= 100, "Pool max should not exceed 100"


class TestIniConfig:
    """Test INI configuration files."""

    def test_ini_syntax_valid(self):
        """Verify INI file parses without errors."""
        config = configparser.ConfigParser()
        config.read("settings.ini")

        assert len(config.sections()) > 0

    def test_required_sections_exist(self):
        """Verify all required sections are present."""
        config = configparser.ConfigParser()
        config.read("settings.ini")

        required_sections = ["database", "logging"]
        for section in required_sections:
            assert section in config.sections(), f"Missing section: {section}"

    def test_boolean_values_parse_correctly(self):
        """Verify boolean values are correctly interpreted."""
        config = configparser.ConfigParser()
        config.read("settings.ini")

        # getboolean handles various formats: true/false, yes/no, 1/0, on/off
        debug = config.getboolean("app", "debug", fallback=False)
        assert isinstance(debug, bool)

    def test_integer_values_valid(self):
        """Verify integer values parse correctly."""
        config = configparser.ConfigParser()
        config.read("settings.ini")

        port = config.getint("server", "port")
        assert 1 <= port <= 65535


@pytest.fixture
def sample_toml():
    """Provide sample TOML for testing."""
    return """
[server]
host = "localhost"
port = 8080

[database]
pool_min = 5
pool_max = 20
"""


def test_toml_parsing_fixture(sample_toml):
    """Test TOML parsing with fixture."""
    config = tomlkit.parse(sample_toml)

    assert config["server"]["host"] == "localhost"
    assert config["server"]["port"] == 8080
    assert config["database"]["pool_min"] == 5
```

### Schema Validation

```python
# schema_validator.py
import tomlkit
from typing import Any
from dataclasses import dataclass


@dataclass
class ValidationError:
    """Represents a validation error."""

    path: str
    message: str
    value: Any


def validate_toml_schema(config: dict, schema: dict) -> list[ValidationError]:
    """Validate TOML config against schema definition."""
    errors = []

    def validate_field(path: str, value: Any, field_schema: dict):
        """Validate a single field against its schema."""
        expected_type = field_schema.get("type")

        # Type checking
        type_map = {
            "string": str,
            "integer": int,
            "float": (int, float),
            "boolean": bool,
            "array": list,
            "table": dict,
        }

        if expected_type and not isinstance(value, type_map.get(expected_type, object)):
            errors.append(
                ValidationError(
                    path=path,
                    message=f"Expected {expected_type}, got {type(value).__name__}",
                    value=value,
                )
            )
            return

        # Range validation for numbers
        if isinstance(value, (int, float)):
            if "minimum" in field_schema and value < field_schema["minimum"]:
                errors.append(
                    ValidationError(
                        path=path,
                        message=f"Value {value} below minimum {field_schema['minimum']}",
                        value=value,
                    )
                )
            if "maximum" in field_schema and value > field_schema["maximum"]:
                errors.append(
                    ValidationError(
                        path=path,
                        message=f"Value {value} above maximum {field_schema['maximum']}",
                        value=value,
                    )
                )

        # Enum validation
        if "enum" in field_schema and value not in field_schema["enum"]:
            errors.append(
                ValidationError(
                    path=path,
                    message=f"Value must be one of {field_schema['enum']}",
                    value=value,
                )
            )

    def validate_section(path: str, section: dict, section_schema: dict):
        """Recursively validate a section."""
        # Check required fields
        for required in section_schema.get("required", []):
            if required not in section:
                errors.append(
                    ValidationError(
                        path=f"{path}.{required}" if path else required,
                        message="Required field missing",
                        value=None,
                    )
                )

        # Validate each field
        properties = section_schema.get("properties", {})
        for key, value in section.items():
            field_path = f"{path}.{key}" if path else key
            if key in properties:
                if isinstance(value, dict):
                    validate_section(field_path, value, properties[key])
                else:
                    validate_field(field_path, value, properties[key])

    validate_section("", config, schema)
    return errors


# Example usage
if __name__ == "__main__":
    schema = {
        "required": ["server", "database"],
        "properties": {
            "server": {
                "type": "table",
                "required": ["host", "port"],
                "properties": {
                    "host": {"type": "string"},
                    "port": {"type": "integer", "minimum": 1, "maximum": 65535},
                },
            },
            "database": {
                "type": "table",
                "required": ["host"],
                "properties": {
                    "host": {"type": "string"},
                    "pool_size": {"type": "integer", "minimum": 1, "maximum": 100},
                },
            },
        },
    }

    config = tomlkit.parse(open("config.toml").read())
    errors = validate_toml_schema(dict(config), schema)

    for error in errors:
        print(f"Error at {error.path}: {error.message}")
```

### CI/CD Integration

```yaml
# .github/workflows/config-validation.yml
name: Configuration Validation

on:
  push:
    paths:
      - "*.toml"
      - "*.ini"
      - "config/**"
  pull_request:
    paths:
      - "*.toml"
      - "*.ini"
      - "config/**"

jobs:
  validate-toml:
    name: Validate TOML Files
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install taplo
        run: |
          curl -fsSL https://github.com/tamasfe/taplo/releases/latest/download/taplo-linux-x86_64.gz | gunzip > taplo
          chmod +x taplo
          sudo mv taplo /usr/local/bin/

      - name: Check TOML syntax
        run: taplo check **/*.toml

      - name: Check TOML formatting
        run: taplo format --check **/*.toml

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install tomlkit pytest

      - name: Run TOML tests
        run: pytest tests/test_config.py -v

  validate-ini:
    name: Validate INI Files
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Validate INI syntax
        run: |
          python -c "
          import configparser
          import sys
          from pathlib import Path

          errors = []
          for ini_file in Path('.').rglob('*.ini'):
              try:
                  config = configparser.ConfigParser()
                  config.read(ini_file)
                  print(f'OK: {ini_file}')
              except Exception as e:
                  errors.append(f'{ini_file}: {e}')
                  print(f'FAIL: {ini_file}')

          if errors:
              for error in errors:
                  print(f'::error::{error}')
              sys.exit(1)
          "
```

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/tamasfe/taplo
    rev: 0.9.0
    hooks:
      - id: taplo-format
        name: Format TOML files
        entry: taplo format
        language: rust
        types: [toml]

      - id: taplo-lint
        name: Lint TOML files
        entry: taplo lint
        language: rust
        types: [toml]

  - repo: local
    hooks:
      - id: validate-ini
        name: Validate INI files
        entry: python -c "import configparser; import sys; c = configparser.ConfigParser(); c.read(sys.argv[1])"
        language: python
        types: [ini]
```

---

## Security Best Practices

### Never Store Secrets in Config Files

```toml
# Bad - Secrets in plain text
[database]
host = "db.example.com"
password = "SuperSecretPassword123"  # Never do this!
api_key = "sk-live-abc123xyz"         # Exposed in version control!

# Good - Environment variable references
[database]
host = "db.example.com"
password = "${DB_PASSWORD}"           # Reference environment variable
api_key = "${API_KEY}"

# Good - Separate secrets file (not committed)
# secrets.toml (in .gitignore)
[database]
password = "actual-password"

# config.toml (committed)
[database]
host = "db.example.com"
# Password loaded from secrets.toml or environment
```

```ini
; Bad - Secrets in INI file
[database]
password = MySecretPassword123

; Good - Reference to environment or external source
[database]
password = ${DB_PASSWORD}
; Or use a secrets manager reference
password_ref = aws:secretsmanager:prod/db/password
```

### File Permissions

```bash
# Restrict access to configuration files
chmod 600 config.toml       # Owner read/write only
chmod 640 settings.ini      # Owner read/write, group read
chown app:app config.toml   # Appropriate ownership

# For sensitive configs in production
chmod 400 secrets.toml      # Owner read-only
```

### Validate Before Use

```python
# Always validate configuration before use
import tomlkit
from pathlib import Path


def load_config(path: str) -> dict:
    """Load and validate configuration file."""
    config_path = Path(path)

    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")

    # Check file permissions
    mode = config_path.stat().st_mode
    if mode & 0o077:  # Check if group/other have any permissions
        raise PermissionError(f"Config file has insecure permissions: {oct(mode)}")

    content = config_path.read_text()
    config = tomlkit.parse(content)

    # Validate required fields
    required_fields = ["app", "server", "database"]
    for field in required_fields:
        if field not in config:
            raise ValueError(f"Missing required config section: {field}")

    return dict(config)
```

### Prevent Injection

```python
# Sanitize values that will be used in commands or queries
import shlex
import re


def sanitize_config_value(value: str, allow_pattern: str = r'^[\w\-\.]+$') -> str:
    """Sanitize a configuration value."""
    if not re.match(allow_pattern, value):
        raise ValueError(f"Invalid config value: {value}")
    return value


def use_config_in_command(config: dict):
    """Safely use config values in shell commands."""
    host = sanitize_config_value(config["database"]["host"])

    # Use shlex.quote for shell commands
    cmd = f"psql -h {shlex.quote(host)}"
    return cmd
```

---

## Anti-Patterns

### TOML Anti-Patterns

```toml
# Bad - Deeply nested inline tables
user = { name = "John", address = { street = "123 Main", city = { name = "NYC", state = "NY" } } }

# Good - Use standard tables for complex structures
[user]
name = "John"

[user.address]
street = "123 Main"

[user.address.city]
name = "NYC"
state = "NY"
```

```toml
# Bad - Mixing dotted keys and tables inconsistently
[server]
host = "localhost"

[server.ssl]
enabled = true

server.ssl.cert = "/path/to/cert"  # Error: can't add to already-defined table

# Good - Consistent table definitions
[server]
host = "localhost"

[server.ssl]
enabled = true
cert = "/path/to/cert"
```

```toml
# Bad - Using wrong data types
port = "8080"     # String instead of integer
enabled = "true"  # String instead of boolean
timeout = "30"    # String instead of integer

# Good - Correct data types
port = 8080       # Integer
enabled = true    # Boolean
timeout = 30      # Integer
```

### INI Anti-Patterns

```ini
; Bad - Inconsistent formatting
[database]
host=localhost
port = 5432
  name=mydb

; Good - Consistent spacing
[database]
host = localhost
port = 5432
name = mydb
```

```ini
; Bad - Duplicate sections (behavior is parser-dependent)
[server]
host = localhost

[server]
port = 8080

; Good - Single section with all keys
[server]
host = localhost
port = 8080
```

```ini
; Bad - Complex nested data (INI is not designed for this)
[user]
name = John
address.street = 123 Main St
address.city = NYC
address.state = NY

; Good - Use separate sections or switch to TOML/YAML
[user]
name = John

[user.address]
street = 123 Main St
city = NYC
state = NY
```

---

## Recommended Tools

### TOML Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **taplo** | Format, lint, validate TOML | `cargo install taplo-cli` |
| **tomlkit** | Python TOML library (preserves formatting) | `pip install tomlkit` |
| **toml** | Simple Python TOML parser | `pip install toml` |
| **tomllib** | Python stdlib (3.11+, read-only) | Built-in |
| **toml-rs** | Rust TOML library | Cargo dependency |

### INI Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **configparser** | Python stdlib INI parser | Built-in |
| **crudini** | Command-line INI editor | `apt install crudini` |
| **ini** | Node.js INI parser | `npm install ini` |

### IDE Extensions

| IDE | Extension | Features |
|-----|-----------|----------|
| **VS Code** | Even Better TOML | Syntax highlighting, validation, formatting |
| **VS Code** | EditorConfig | INI-style .editorconfig support |
| **IntelliJ** | TOML | Native TOML support |
| **Vim** | vim-toml | TOML syntax highlighting |

### VS Code Settings

```json
{
  "[toml]": {
    "editor.defaultFormatter": "tamasfe.even-better-toml",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "[ini]": {
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  },
  "evenBetterToml.formatter.alignComments": true,
  "evenBetterToml.formatter.alignEntries": false,
  "evenBetterToml.formatter.arrayAutoCollapse": true,
  "evenBetterToml.formatter.arrayAutoExpand": true,
  "evenBetterToml.formatter.arrayTrailingComma": true,
  "evenBetterToml.formatter.columnWidth": 100
}
```

---

## References

### Official Documentation

- [TOML Specification v1.0.0](https://toml.io/en/v1.0.0)
- [TOML GitHub Repository](https://github.com/toml-lang/toml)

### Specification Guides

- [INI File Format (Wikipedia)](https://en.wikipedia.org/wiki/INI_file)
- [Python configparser Documentation](https://docs.python.org/3/library/configparser.html)

### Tools

- [taplo](https://taplo.tamasfe.dev/) - TOML toolkit (formatting, validation, schema)
- [tomlkit](https://github.com/sdispater/tomlkit) - Style-preserving TOML library
- [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml) - VS Code extension

### Related Guides

- [YAML Style Guide](yaml.md)
- [JSON Style Guide](json.md)

---

**Status**: Active
