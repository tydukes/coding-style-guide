---
title: "Tutorial 5: From Manual to Automated"
description: "Take a project from zero automation to fully automated validation in 40 minutes"
author: "Tyler Dukes"
tags: [tutorials, automation, ci-cd, pre-commit, github-actions, quality-gates, linting]
category: "Tutorials"
status: "active"
search_keywords: [tutorial, automation, manual to automated, ci cd, pre-commit, step by step]
---

<!-- markdownlint-disable MD013 -->

## Overview

This tutorial walks you through building a progressive automation pipeline, starting from manual
checks and ending with a fully automated CI/CD validation system. Each step builds on the previous,
so you can adopt automation at whatever pace fits your team.

### What You Will Build

```text
Automation Pipeline Progression
================================

Level 0: Manual           - Run checks by hand, hope for the best
Level 1: EditorConfig     - Consistent formatting across all editors
Level 2: Pre-commit Hooks - Automated local checks before every commit
Level 3: CI/CD Pipeline   - Server-side validation on every push
Level 4: Auto-fixes       - Tools fix problems automatically
Level 5: Quality Gates    - Spell checking, link checking, metrics
Level 6: Monitoring       - Track trends and measure improvement
```

### Time Estimate

```text
Step 1: Manual Validation Baseline ............  5 min
Step 2: Add EditorConfig ......................  3 min
Step 3: Add Pre-commit Hooks ..................  8 min
Step 4: Add CI/CD Pipeline .................... 10 min
Step 5: Enable Auto-fixes .....................  5 min
Step 6: Add Quality Gates .....................  5 min
Step 7: Monitor and Measure ...................  4 min
                                               ------
Total ......................................... 40 min
```

### Prerequisites

```bash
# Verify required tools
python3 --version   # Python 3.10+
git --version       # Git 2.30+
```

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install pre-commit
pip install pre-commit

# Install Node.js tooling (for spell checking and markdown linting)
npm install -g cspell markdownlint-cli
```

```bash
# Create a sample project to work with
mkdir -p ~/automation-tutorial/src ~/automation-tutorial/tests
cd ~/automation-tutorial
git init
```

```bash
# Create a sample Python file with intentional issues
cat > src/app.py << 'PYEOF'
import os
import sys
import json

def get_config(path):
    with open(path) as f:
        data=json.load(f)
    return data

def process_items(items):
    result = []
    for item in items:
        if item["status"]=="active":
            result.append(item["name"])
    return result

class  DataProcessor:
    def __init__(self,name):
        self.name=name
        self.items=[]

    def add_item(self,item):
        self.items.append(item)

    def run(self):
        return process_items(self.items)
PYEOF
```

```bash
# Create a sample Bash script with issues
cat > src/deploy.sh << 'SHEOF'
#!/bin/bash
echo "Deploying application..."
if [ $1 == "production" ]; then
    echo "Deploying to production"
    rm -rf /tmp/deploy/*
fi
echo "Done"
SHEOF
chmod +x src/deploy.sh
```

```bash
# Create a sample Terraform file
cat > src/main.tf << 'TFEOF'
resource "aws_instance" "web" {
ami           = "ami-0c55b159cbfafe1f0"
instance_type = "t2.micro"
tags = {
Name = "web-server"
Environment = "production"
}
}
TFEOF
```

```bash
# Create a YAML config with issues
cat > src/config.yaml << 'YAMLEOF'
app:
  name: my-application
  version: 1.0.0
  database:
    host: localhost
    port: 5432
    password: supersecretpassword123
  features:
    - name: feature-a
      enabled: true
    - name: feature-b
      enabled: false
YAMLEOF
```

---

## Step 1: Manual Validation Baseline (5 min)

Before automating anything, understand what manual validation looks like. This is the starting
point most teams live with -- running checks by hand when they remember to.

### The Manual Checklist

```bash
# Manual check 1: Python formatting
echo "=== Checking Python formatting ==="
python3 -m py_compile src/app.py && echo "Syntax OK" || echo "Syntax ERROR"
```

```bash
# Manual check 2: Shell script issues
echo "=== Checking shell scripts ==="
bash -n src/deploy.sh && echo "Syntax OK" || echo "Syntax ERROR"
```

```bash
# Manual check 3: YAML validity
echo "=== Checking YAML files ==="
python3 -c "import yaml; yaml.safe_load(open('src/config.yaml'))" && echo "Valid" || echo "Invalid"
```

```bash
# Manual check 4: Look for secrets
echo "=== Checking for potential secrets ==="
grep -rn "password\|secret\|api_key\|token" src/ || echo "No secrets found"
```

### Automate the Manual Checks into a Script

```bash
cat > scripts/manual_checks.sh << 'EOF'
#!/bin/bash
# manual_checks.sh - Manual validation checklist
# Run this before every commit (if you remember)

set -euo pipefail

PASS=0
FAIL=0
WARN=0

check_pass() { echo "  PASS: $1"; ((PASS++)); }
check_fail() { echo "  FAIL: $1"; ((FAIL++)); }
check_warn() { echo "  WARN: $1"; ((WARN++)); }

echo "============================================"
echo "  Manual Validation Checklist"
echo "============================================"
echo ""

# 1. Python syntax check
echo "[1/6] Python Syntax"
for f in $(find . -name "*.py" -not -path "./.venv/*"); do
    if python3 -m py_compile "$f" 2>/dev/null; then
        check_pass "$f"
    else
        check_fail "$f"
    fi
done
echo ""

# 2. Shell script syntax
echo "[2/6] Shell Script Syntax"
for f in $(find . -name "*.sh" -not -path "./.venv/*"); do
    if bash -n "$f" 2>/dev/null; then
        check_pass "$f"
    else
        check_fail "$f"
    fi
done
echo ""

# 3. YAML validity
echo "[3/6] YAML Validity"
for f in $(find . -name "*.yaml" -o -name "*.yml" | grep -v ".venv"); do
    if python3 -c "import yaml; yaml.safe_load(open('$f'))" 2>/dev/null; then
        check_pass "$f"
    else
        check_fail "$f"
    fi
done
echo ""

# 4. JSON validity
echo "[4/6] JSON Validity"
for f in $(find . -name "*.json" -not -path "./.venv/*" -not -path "./node_modules/*"); do
    if python3 -c "import json; json.load(open('$f'))" 2>/dev/null; then
        check_pass "$f"
    else
        check_fail "$f"
    fi
done
echo ""

# 5. Secret detection
echo "[5/6] Secret Detection"
SECRETS_FOUND=$(grep -rn \
    --include="*.py" --include="*.sh" --include="*.yaml" --include="*.yml" \
    --include="*.json" --include="*.tf" \
    -E "(password|secret|api_key|token)\s*[:=]" . \
    --exclude-dir=".venv" --exclude-dir="node_modules" 2>/dev/null || true)
if [ -n "$SECRETS_FOUND" ]; then
    echo "$SECRETS_FOUND" | while read -r line; do
        check_warn "Potential secret: $line"
    done
else
    check_pass "No hardcoded secrets detected"
fi
echo ""

# 6. Trailing whitespace
echo "[6/6] Trailing Whitespace"
TRAILING=$(grep -rn ' $' \
    --include="*.py" --include="*.sh" --include="*.yaml" --include="*.yml" \
    --include="*.tf" --include="*.md" \
    . --exclude-dir=".venv" --exclude-dir="node_modules" 2>/dev/null || true)
if [ -n "$TRAILING" ]; then
    echo "$TRAILING" | head -5 | while read -r line; do
        check_warn "Trailing whitespace: $line"
    done
else
    check_pass "No trailing whitespace found"
fi
echo ""

# Summary
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
    echo "STATUS: FAILED"
    exit 1
else
    echo "STATUS: PASSED (with $WARN warnings)"
    exit 0
fi
EOF
chmod +x scripts/manual_checks.sh
```

```bash
# Run the manual checks
bash scripts/manual_checks.sh
```

```text
# Expected output:
============================================
  Manual Validation Checklist
============================================

[1/6] Python Syntax
  PASS: ./src/app.py

[2/6] Shell Script Syntax
  PASS: ./src/deploy.sh

[3/6] YAML Validity
  PASS: ./src/config.yaml

[4/6] JSON Validity

[5/6] Secret Detection
  WARN: Potential secret: ./src/config.yaml:7:    password: supersecretpassword123

[6/6] Trailing Whitespace
  PASS: No trailing whitespace found

============================================
  Results: 4 passed, 0 failed, 1 warnings
============================================
STATUS: PASSED (with 1 warnings)
```

### The Problem with Manual Checks

```text
Why manual validation fails in practice:

1. Inconsistency  - Different team members run different checks
2. Forgetfulness   - People skip checks under deadline pressure
3. Incomplete      - Manual scripts miss edge cases
4. Slow feedback   - Issues found in review, not at commit time
5. No enforcement  - Nothing prevents bad code from merging
```

### Checkpoint: Manual Baseline

```bash
# Verify you have the manual checks script
ls -la scripts/manual_checks.sh
# Expected: -rwxr-xr-x ... scripts/manual_checks.sh

# Verify it runs
bash scripts/manual_checks.sh && echo "Manual checks configured"
```

---

## Step 2: Add EditorConfig (3 min)

EditorConfig enforces consistent formatting across all editors and IDEs without any plugins
for most editors. This is the lowest-friction automation you can add.

### Create the EditorConfig File

```bash
cat > .editorconfig << 'EOF'
# EditorConfig: https://EditorConfig.org
root = true

# Default settings for all files
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

# Python files
[*.py]
indent_size = 4
max_line_length = 100

# YAML files
[*.{yaml,yml}]
indent_size = 2
max_line_length = 120

# Terraform and HCL files
[*.{tf,tfvars,hcl}]
indent_size = 2
max_line_length = 120

# Shell scripts
[*.{sh,bash}]
indent_size = 2
max_line_length = 100

# PowerShell scripts
[*.{ps1,psm1,psd1}]
indent_size = 4
max_line_length = 100

# TypeScript and JavaScript
[*.{ts,tsx,js,jsx}]
indent_size = 2
max_line_length = 100

# JSON files
[*.{json,jsonc}]
indent_size = 2

# Markdown files
[*.md]
indent_size = 2
max_line_length = 120
trim_trailing_whitespace = false

# Dockerfiles
[Dockerfile*]
indent_size = 2

# Makefiles (must use tabs)
[Makefile]
indent_style = tab
indent_size = 4

[{Makefile.*,*.mk}]
indent_style = tab
indent_size = 4

# SQL files
[*.sql]
indent_size = 2
max_line_length = 100

# GitHub Actions
[.github/workflows/*.{yml,yaml}]
indent_size = 2

# Groovy / Jenkinsfiles
[*.groovy]
indent_size = 2
max_line_length = 120

[Jenkinsfile*]
indent_size = 2
max_line_length = 120
EOF
```

### Verify EditorConfig Works

```bash
# Install the editorconfig CLI checker
pip install editorconfig-checker

# Run it against your project
editorconfig-checker src/
```

```text
# Expected output (showing formatting issues EditorConfig catches):
src/app.py:8: Wrong amount of trailing whitespace characters
src/main.tf:3: Wrong indent style found (tabs instead of spaces)
```

```bash
# Verify the file is in place
cat .editorconfig | head -20
```

```text
# Expected output:
# EditorConfig: https://EditorConfig.org
root = true

# Default settings for all files
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

# Python files
[*.py]
indent_size = 4
max_line_length = 100
```

### What EditorConfig Catches Automatically

```text
Before EditorConfig:
  - Tab vs spaces arguments on every PR
  - Inconsistent line endings (CRLF vs LF)
  - Missing final newlines
  - Random trailing whitespace
  - Python files with 2-space indent
  - YAML files with 4-space indent

After EditorConfig:
  - All editors use the same settings
  - Zero configuration for new team members
  - Formatting issues caught at edit time
  - Works with VS Code, IntelliJ, Vim, Emacs, and 20+ others
```

### Checkpoint: EditorConfig

```bash
# Verify EditorConfig exists and has correct structure
grep -c '^\[' .editorconfig
# Expected: 14 (or more section headers)

# Verify root = true is set
head -3 .editorconfig | grep "root = true"
# Expected: root = true
```

---

## Step 3: Add Pre-commit Hooks (8 min)

Pre-commit hooks run automatically before every `git commit`, catching issues at the earliest
possible point. We build the configuration progressively in three stages.

### Stage 1: Basic File Checks

```yaml
# .pre-commit-config.yaml - Stage 1: Basic checks
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: ['--unsafe']
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: mixed-line-ending
      - id: detect-private-key
```

```bash
# Install pre-commit hooks
pre-commit install

# Run against all files to see current state
pre-commit run --all-files
```

```text
# Expected output:
Trim Trailing Whitespace.............................Passed
Fix End of Files.....................................Fixed
Check Yaml...........................................Passed
Check JSON...........................................(no files to check)Skipped
Check for added large files..........................Passed
Check for merge conflicts............................Passed
Check for case conflicts.............................Passed
Mixed line ending....................................Passed
Detect Private Key...................................Passed
```

### Stage 2: Add Language Linters

```yaml
# .pre-commit-config.yaml - Stage 2: Add language-specific linters
repos:
  # General file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: ['--unsafe']
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: mixed-line-ending
      - id: detect-private-key

  # Python formatting
  - repo: https://github.com/psf/black
    rev: 26.1.0
    hooks:
      - id: black
        language_version: python3

  # Python linting
  - repo: https://github.com/pycqa/flake8
    rev: 7.3.0
    hooks:
      - id: flake8
        args: ['--max-line-length=100', '--extend-ignore=E203,W503']

  # YAML linting
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.38.0
    hooks:
      - id: yamllint
        args: ['-d', '{extends: default, rules: {line-length: {max: 120}, document-start: disable}}']

  # Shell script linting
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.11.0.1
    hooks:
      - id: shellcheck

  # Markdown linting
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.47.0
    hooks:
      - id: markdownlint
        args: ['--fix']
```

```bash
# Update hooks to install new environments
pre-commit install --install-hooks

# Run all hooks
pre-commit run --all-files
```

```text
# Expected output:
Trim Trailing Whitespace.............................Passed
Fix End of Files.....................................Passed
Check Yaml...........................................Passed
Check JSON...........................................(no files to check)Skipped
Check for added large files..........................Passed
Check for merge conflicts............................Passed
Check for case conflicts.............................Passed
Mixed line ending....................................Passed
Detect Private Key...................................Passed
black................................................Failed
- hook id: black
- files were modified by this hook

reformatted src/app.py

All done!
1 file reformatted.

flake8...............................................Passed
yamllint.............................................Passed
shellcheck...........................................Failed
- hook id: shellcheck
- exit code: 1

In src/deploy.sh line 3:
if [ $1 == "production" ]; then
     ^-- SC2086: Double quote to prevent globbing and word splitting.
        ^-- SC2039: In POSIX sh, == in place of = is undefined.
```

### Stage 3: Add Security Scanning

```yaml
# .pre-commit-config.yaml - Stage 3: Full configuration with security
repos:
  # General file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: ['--unsafe']
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: mixed-line-ending
      - id: detect-private-key

  # Python formatting
  - repo: https://github.com/psf/black
    rev: 26.1.0
    hooks:
      - id: black
        language_version: python3

  # Python linting
  - repo: https://github.com/pycqa/flake8
    rev: 7.3.0
    hooks:
      - id: flake8
        args: ['--max-line-length=100', '--extend-ignore=E203,W503']

  # YAML linting
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.38.0
    hooks:
      - id: yamllint
        args: ['-d', '{extends: default, rules: {line-length: {max: 120}, document-start: disable}}']

  # Shell script linting
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.11.0.1
    hooks:
      - id: shellcheck

  # Markdown linting
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.47.0
    hooks:
      - id: markdownlint
        args: ['--fix']

  # Terraform formatting
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.105.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
        args:
          - '--args=--config=.terraform-docs.yml'

  # Security: detect secrets in code
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  # Security: check for common vulnerabilities
  - repo: https://github.com/PyCQA/bandit
    rev: 1.8.3
    hooks:
      - id: bandit
        args: ['-c', 'pyproject.toml']
        additional_dependencies: ['bandit[toml]']
```

```bash
# Generate initial secrets baseline (marks existing secrets as known)
detect-secrets scan > .secrets.baseline

# Install all hooks
pre-commit install --install-hooks

# Run the full suite
pre-commit run --all-files
```

```text
# Expected output:
Trim Trailing Whitespace.............................Passed
Fix End of Files.....................................Passed
Check Yaml...........................................Passed
Check JSON...........................................(no files to check)Skipped
Check for added large files..........................Passed
Check for merge conflicts............................Passed
Check for case conflicts.............................Passed
Mixed line ending....................................Passed
Detect Private Key...................................Passed
black................................................Passed
flake8...............................................Passed
yamllint.............................................Passed
shellcheck...........................................Failed
markdownlint.........................................Passed
terraform_fmt........................................Passed
Detect secrets.......................................Passed
bandit...............................................Passed
```

### Fix the Shell Script Issues

```bash
# Fix the shellcheck issues in deploy.sh
cat > src/deploy.sh << 'SHEOF'
#!/bin/bash
set -euo pipefail

echo "Deploying application..."

if [ "${1:-}" = "production" ]; then
    echo "Deploying to production"
    rm -rf /tmp/deploy/*
fi

echo "Done"
SHEOF
```

```bash
# Verify all hooks pass now
pre-commit run --all-files
```

```text
# Expected output:
Trim Trailing Whitespace.............................Passed
Fix End of Files.....................................Passed
Check Yaml...........................................Passed
Check JSON...........................................(no files to check)Skipped
Check for added large files..........................Passed
Check for merge conflicts............................Passed
Check for case conflicts.............................Passed
Mixed line ending....................................Passed
Detect Private Key...................................Passed
black................................................Passed
flake8...............................................Passed
yamllint.............................................Passed
shellcheck...........................................Passed
markdownlint.........................................Passed
Detect secrets.......................................Passed
bandit...............................................Passed
```

### Checkpoint: Pre-commit Hooks

```bash
# Verify pre-commit is installed
pre-commit --version
# Expected: pre-commit 4.x.x

# Verify hooks are installed in .git
ls .git/hooks/pre-commit
# Expected: .git/hooks/pre-commit

# Count configured hooks
grep -c "id:" .pre-commit-config.yaml
# Expected: 16+ hooks

# Run all hooks and verify pass
pre-commit run --all-files && echo "All hooks pass"
```

---

## Step 4: Add CI/CD Pipeline (10 min)

Pre-commit catches issues locally, but CI/CD catches everything that slips through. This step
creates a GitHub Actions workflow that validates every push and pull request.

### Start with a Basic Lint Job

```yaml
# .github/workflows/ci.yml - Version 1: Basic linting
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.11'

      - name: Install linters
        run: |
          pip install black flake8 yamllint
          pip install shellcheck-py

      - name: Run Black (check mode)
        run: black --check .

      - name: Run Flake8
        run: flake8 --max-line-length=100 --extend-ignore=E203,W503 .

      - name: Run yamllint
        run: yamllint -d '{extends: default, rules: {line-length: {max: 120}, document-start: disable}}' .

      - name: Run ShellCheck
        run: |
          find . -name "*.sh" -not -path "./.venv/*" | while read -r f; do
            echo "Checking $f"
            shellcheck "$f"
          done
```

### Add Test and Security Jobs

```yaml
# .github/workflows/ci.yml - Version 2: Multi-job pipeline
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install black flake8 yamllint shellcheck-py

      - name: Run Black (check mode)
        run: black --check .

      - name: Run Flake8
        run: flake8 --max-line-length=100 --extend-ignore=E203,W503 .

      - name: Run yamllint
        run: yamllint -d '{extends: default, rules: {line-length: {max: 120}, document-start: disable}}' .

      - name: Run ShellCheck
        run: |
          find . -name "*.sh" -not -path "./.venv/*" -exec shellcheck {} +

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install pytest pytest-cov

      - name: Run tests with coverage
        run: |
          pytest tests/ \
            --cov=src \
            --cov-report=term-missing \
            --cov-fail-under=80

  security:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.11'

      - name: Install security tools
        run: |
          pip install bandit detect-secrets safety

      - name: Run Bandit (Python security)
        run: bandit -r src/ -f json -o bandit-report.json || true

      - name: Run detect-secrets
        run: |
          detect-secrets scan --all-files --exclude-files '\.secrets\.baseline$' \
            | python3 -c "
          import json, sys
          results = json.load(sys.stdin)
          secrets = results.get('results', {})
          total = sum(len(v) for v in secrets.values())
          if total > 0:
              print(f'Found {total} potential secrets:')
              for file, findings in secrets.items():
                  for finding in findings:
                      print(f'  {file}:{finding[\"line_number\"]} - {finding[\"type\"]}')
              sys.exit(1)
          else:
              print('No secrets detected')
          "

      - name: Upload security reports
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: security-reports
          path: |
            bandit-report.json
          retention-days: 7
```

### Add Documentation Build Job

```yaml
# .github/workflows/ci.yml - Version 3: Full pipeline with docs
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.11'

      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Add UV to PATH
        run: echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Cache UV dependencies
        uses: actions/cache@v5
        with:
          path: |
            ~/.cache/uv
            .venv
          key: ${{ runner.os }}-uv-${{ hashFiles('pyproject.toml', 'uv.lock') }}
          restore-keys: |
            ${{ runner.os }}-uv-

      - name: Sync environment
        run: uv sync

      - name: Run Black (check mode)
        run: uv run black --check .

      - name: Run Flake8
        run: uv run flake8 --max-line-length=100 --extend-ignore=E203,W503 .

      - name: Run yamllint
        run: uv run yamllint -d '{extends: default, rules: {line-length: {max: 120}, document-start: disable}}' .

      - name: Run ShellCheck
        run: |
          find . -name "*.sh" -not -path "./.venv/*" -exec shellcheck {} +

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.11'

      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Add UV to PATH
        run: echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Sync environment
        run: uv sync

      - name: Run tests with coverage
        run: |
          uv run pytest tests/ \
            --cov=src \
            --cov-report=term-missing \
            --cov-fail-under=80

  security:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.11'

      - name: Install security tools
        run: pip install bandit detect-secrets

      - name: Run Bandit
        run: bandit -r src/ -ll -ii

      - name: Run detect-secrets
        run: |
          detect-secrets scan --all-files \
            --exclude-files '\.secrets\.baseline$' \
            --exclude-files '\.git/' > /tmp/secrets-scan.json
          python3 -c "
          import json, sys
          results = json.load(open('/tmp/secrets-scan.json'))
          total = sum(len(v) for v in results.get('results', {}).values())
          if total > 0:
              print(f'ERROR: Found {total} potential secrets')
              sys.exit(1)
          print('No secrets detected')
          "

  docs:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.11'

      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Add UV to PATH
        run: echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Sync environment
        run: uv sync

      - name: Validate metadata
        run: uv run python scripts/validate_metadata.py docs/
        continue-on-error: true

      - name: Build documentation
        run: uv run mkdocs build --strict

      - name: Upload docs artifact
        uses: actions/upload-artifact@v6
        with:
          name: documentation
          path: site/
          retention-days: 7
```

### Visualize the Pipeline

```text
CI Pipeline Flow
=================

                    ┌──────────┐
                    │  Push /   │
                    │    PR     │
                    └─────┬────┘
                          │
                    ┌─────▼────┐
                    │   Lint   │  Black, Flake8, yamllint, ShellCheck
                    └─────┬────┘
                          │
             ┌────────────┼────────────┐
             │            │            │
       ┌─────▼────┐ ┌────▼─────┐ ┌────▼────┐
       │   Test   │ │ Security │ │  Docs   │
       │  pytest  │ │  bandit  │ │ mkdocs  │
       │ coverage │ │ secrets  │ │ strict  │
       └──────────┘ └──────────┘ └─────────┘
```

### Checkpoint: CI/CD Pipeline

```bash
# Verify workflow file exists
ls -la .github/workflows/ci.yml
# Expected: -rw-r--r-- ... .github/workflows/ci.yml

# Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('Valid YAML')"
# Expected: Valid YAML

# Count jobs defined
grep -c "runs-on:" .github/workflows/ci.yml
# Expected: 4 (lint, test, security, docs)

# Verify job dependencies
grep "needs:" .github/workflows/ci.yml
# Expected:
#     needs: lint
#     needs: lint
#     needs: lint
```

---

## Step 5: Enable Auto-fixes (5 min)

Instead of just reporting issues, configure tools to fix them automatically. This reduces
developer friction and speeds up the feedback loop.

### Auto-fix vs Check-only Mode

```bash
# Check-only mode (CI): reports problems, exits non-zero
black --check src/app.py
# Output: would reformat src/app.py

# Auto-fix mode (local): fixes problems in place
black src/app.py
# Output: reformatted src/app.py
```

```bash
# Terraform: check-only vs auto-fix
terraform fmt -check src/main.tf    # Check mode (CI)
terraform fmt src/main.tf           # Auto-fix mode (local)
```

```bash
# Markdown: check-only vs auto-fix
markdownlint docs/                  # Check mode (CI)
markdownlint --fix docs/            # Auto-fix mode (local)
```

### Configure Pre-commit Hooks for Auto-fix

```yaml
# .pre-commit-config.yaml - hooks that auto-fix on commit
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      # These hooks AUTO-FIX files:
      - id: trailing-whitespace      # Removes trailing whitespace
      - id: end-of-file-fixer        # Adds missing final newline
      - id: mixed-line-ending        # Normalizes line endings
        args: ['--fix=lf']

  # Black AUTO-FORMATS Python files
  - repo: https://github.com/psf/black
    rev: 26.1.0
    hooks:
      - id: black
        language_version: python3
        # No --check flag = auto-fix mode

  # Markdown linting with AUTO-FIX
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.47.0
    hooks:
      - id: markdownlint
        args: ['--fix']  # Auto-fix mode

  # Terraform AUTO-FORMAT
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.105.0
    hooks:
      - id: terraform_fmt  # Auto-formats .tf files
```

### Create an Auto-fix Script for Manual Use

```bash
cat > scripts/autofix.sh << 'EOF'
#!/bin/bash
# autofix.sh - Run all auto-fix tools
# Use this to bulk-fix formatting issues before committing

set -euo pipefail

echo "============================================"
echo "  Auto-fix: Formatting & Linting"
echo "============================================"

# Python formatting
echo ""
echo "[1/5] Running Black (Python formatter)..."
if command -v black &>/dev/null; then
    black . 2>&1 | tail -1
else
    echo "  Skipped: black not installed"
fi

# Terraform formatting
echo ""
echo "[2/5] Running terraform fmt..."
if command -v terraform &>/dev/null; then
    find . -name "*.tf" -not -path "./.terraform/*" -exec terraform fmt {} \;
    echo "  Done"
else
    echo "  Skipped: terraform not installed"
fi

# Markdown formatting
echo ""
echo "[3/5] Running markdownlint --fix..."
if command -v markdownlint &>/dev/null; then
    markdownlint --fix "**/*.md" 2>&1 || true
    echo "  Done"
else
    echo "  Skipped: markdownlint not installed"
fi

# Trailing whitespace
echo ""
echo "[4/5] Removing trailing whitespace..."
find . -type f \( -name "*.py" -o -name "*.sh" -o -name "*.yaml" -o -name "*.yml" \
    -o -name "*.tf" -o -name "*.json" -o -name "*.ts" -o -name "*.js" \) \
    -not -path "./.venv/*" -not -path "./node_modules/*" -not -path "./.git/*" \
    -exec sed -i.bak 's/[[:space:]]*$//' {} \;
find . -name "*.bak" -delete 2>/dev/null || true
echo "  Done"

# Fix line endings
echo ""
echo "[5/5] Normalizing line endings to LF..."
find . -type f \( -name "*.py" -o -name "*.sh" -o -name "*.yaml" -o -name "*.yml" \
    -o -name "*.tf" -o -name "*.json" -o -name "*.ts" -o -name "*.js" -o -name "*.md" \) \
    -not -path "./.venv/*" -not -path "./node_modules/*" -not -path "./.git/*" \
    -exec sed -i.bak 's/\r$//' {} \;
find . -name "*.bak" -delete 2>/dev/null || true
echo "  Done"

echo ""
echo "============================================"
echo "  Auto-fix complete. Review changes with:"
echo "    git diff"
echo "============================================"
EOF
chmod +x scripts/autofix.sh
```

```bash
# Run auto-fix
bash scripts/autofix.sh
```

```text
# Expected output:
============================================
  Auto-fix: Formatting & Linting
============================================

[1/5] Running Black (Python formatter)...
All done! 1 file reformatted.

[2/5] Running terraform fmt...
  Done

[3/5] Running markdownlint --fix...
  Done

[4/5] Removing trailing whitespace...
  Done

[5/5] Normalizing line endings to LF...
  Done

============================================
  Auto-fix complete. Review changes with:
    git diff
============================================
```

### Checkpoint: Auto-fixes

```bash
# Verify autofix script exists and is executable
ls -la scripts/autofix.sh
# Expected: -rwxr-xr-x ... scripts/autofix.sh

# Run auto-fix and verify no remaining issues
bash scripts/autofix.sh
pre-commit run --all-files && echo "All checks pass after auto-fix"
```

---

## Step 6: Add Quality Gates (5 min)

Quality gates go beyond formatting to check documentation quality, spelling, links, and metrics.
Some gates block merges; others provide advisory warnings.

### Spell Checking (Blocking)

```json
{
  "version": "0.2",
  "language": "en",
  "words": [
    "autofix",
    "bandit",
    "cspell",
    "devops",
    "editorconfig",
    "flake8",
    "markdownlint",
    "mkdocs",
    "mypy",
    "pycqa",
    "pytest",
    "shellcheck",
    "terraform",
    "terragrunt",
    "yamllint"
  ],
  "ignorePaths": [
    "node_modules/**",
    ".venv/**",
    "*.lock",
    ".git/**",
    "site/**"
  ]
}
```

```bash
# Save the config
mkdir -p .github
# (copy the JSON above to .github/cspell.json)

# Run spell check
cspell --config .github/cspell.json "docs/**/*.md" "*.md"
```

```text
# Expected output (clean):
CSpell: Files checked: 15, Issues found: 0
```

### Spell Check Workflow (Blocking Gate)

```yaml
# .github/workflows/spell-checker.yml
name: Spell Checker

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  spell-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '20'

      - name: Install cSpell
        run: npm install -g cspell

      - name: Run spell check
        run: |
          cspell --config .github/cspell.json "docs/**/*.md" "*.md"
```

### Link Checking (Advisory)

```yaml
# .github/workflows/link-checker.yml
name: Link Checker

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Mondays

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Check links
        uses: lycheeverse/lychee-action@v2
        with:
          args: --verbose --no-progress 'docs/**/*.md'
          fail: false  # Advisory only, does not block merge
```

### Metadata Validation (Advisory)

```bash
# Validate @module metadata tags in documentation
python scripts/validate_metadata.py docs/
```

```text
# Expected output:
Validating metadata in docs/...
  docs/02_language_guides/python.md: OK (6 tags found)
  docs/02_language_guides/terraform.md: OK (6 tags found)
  ...
Summary: 45 files checked, 42 passed, 3 warnings
```

### Code-to-Text Ratio (Advisory)

```bash
# Check that language guides maintain 3:1 code-to-text ratio
python scripts/analyze_code_ratio.py
```

```text
# Expected output:
Code-to-Text Ratio Analysis
================================================================================
Language Guide                   Code Lines   Text Lines      Ratio     Status
--------------------------------------------------------------------------------
python                                 1012          318       3.18     PASS
terraform                              2124         6285       0.34     FAIL
ansible                                2258          330       6.84     PASS
...
================================================================================
Achievement: 18/19 guides pass (target: 3:1 ratio)
```

### Quality Gate Summary

```text
Quality Gate Configuration
===========================

Gate                    | Type     | Blocks Merge? | Frequency
------------------------+----------+---------------+------------------
Spell Check (cSpell)    | Blocking | Yes           | Every push/PR
Link Check (lychee)     | Advisory | No            | Weekly + push
Metadata Validation     | Advisory | No            | Every push/PR
Code-to-Text Ratio      | Advisory | No            | Every push/PR
Black Formatting        | Blocking | Yes           | Every push/PR
Flake8 Linting          | Blocking | Yes           | Every push/PR
ShellCheck              | Blocking | Yes           | Every push/PR
Secret Detection        | Blocking | Yes           | Every push/PR
```

### Checkpoint: Quality Gates

```bash
# Verify spell check config exists
ls -la .github/cspell.json
# Expected: -rw-r--r-- ... .github/cspell.json

# Run spell check locally
cspell --config .github/cspell.json "docs/**/*.md" && echo "Spelling OK"

# Verify workflow files exist
ls .github/workflows/spell-checker.yml
ls .github/workflows/link-checker.yml
# Both should exist
```

---

## Step 7: Monitor and Measure (4 min)

You cannot improve what you do not measure. Track key automation metrics to demonstrate
value and identify bottlenecks.

### Key Metrics to Track

```text
Automation Health Metrics
==========================

1. Lint Pass Rate       - % of commits that pass all linters on first try
2. CI Duration          - Time from push to green/red status
3. Time-to-Merge        - PR open to merge duration
4. Pre-commit Skip Rate - How often developers run --no-verify
5. Security Findings    - Secrets or vulnerabilities caught per month
6. Auto-fix Rate        - % of issues fixed automatically vs manually
```

### Dashboard Script

```python
#!/usr/bin/env python3
"""
automation_dashboard.py - Track automation metrics from CI data.

Usage:
    python scripts/automation_dashboard.py
"""
import json
import subprocess
import sys
from datetime import datetime, timedelta


def run_cmd(cmd: str) -> str:
    """Run a shell command and return stdout."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()


def get_commit_count(days: int = 30) -> int:
    """Count commits in the last N days."""
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    output = run_cmd(f'git log --since="{since}" --oneline')
    return len(output.splitlines()) if output else 0


def get_hook_skip_count(days: int = 30) -> int:
    """Count commits that skipped pre-commit hooks."""
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    output = run_cmd(
        f'git log --since="{since}" --oneline --grep="no-verify" --grep="skip-hooks"'
    )
    return len(output.splitlines()) if output else 0


def get_precommit_hook_count() -> int:
    """Count configured pre-commit hooks."""
    output = run_cmd("grep -c 'id:' .pre-commit-config.yaml 2>/dev/null")
    return int(output) if output.isdigit() else 0


def get_ci_workflow_count() -> int:
    """Count CI workflow files."""
    output = run_cmd("ls .github/workflows/*.yml 2>/dev/null | wc -l")
    return int(output.strip()) if output.strip().isdigit() else 0


def get_autofix_hooks() -> list[str]:
    """List hooks that auto-fix files."""
    autofix_hooks = [
        "trailing-whitespace",
        "end-of-file-fixer",
        "mixed-line-ending",
        "black",
        "markdownlint --fix",
        "terraform_fmt",
    ]
    configured = []
    try:
        with open(".pre-commit-config.yaml") as f:
            content = f.read()
        for hook in autofix_hooks:
            hook_id = hook.split()[0]
            if hook_id in content:
                configured.append(hook)
    except FileNotFoundError:
        pass
    return configured


def print_dashboard() -> None:
    """Print the automation dashboard."""
    print("=" * 60)
    print("  AUTOMATION DASHBOARD")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()

    # Commit activity
    commits_30d = get_commit_count(30)
    commits_7d = get_commit_count(7)
    print(f"  Commits (last 30 days):  {commits_30d}")
    print(f"  Commits (last 7 days):   {commits_7d}")
    print()

    # Hook metrics
    hook_count = get_precommit_hook_count()
    skip_count = get_hook_skip_count(30)
    skip_rate = (skip_count / commits_30d * 100) if commits_30d > 0 else 0
    print(f"  Pre-commit hooks:        {hook_count}")
    print(f"  Hook skips (30 days):    {skip_count}")
    print(f"  Skip rate:               {skip_rate:.1f}%")
    print()

    # Auto-fix hooks
    autofix = get_autofix_hooks()
    print(f"  Auto-fix hooks:          {len(autofix)}")
    for hook in autofix:
        print(f"    - {hook}")
    print()

    # CI workflows
    workflow_count = get_ci_workflow_count()
    print(f"  CI workflows:            {workflow_count}")
    print()

    # Automation maturity score
    score = 0
    if hook_count > 0:
        score += 20
    if hook_count >= 10:
        score += 10
    if workflow_count > 0:
        score += 20
    if workflow_count >= 3:
        score += 10
    if len(autofix) >= 3:
        score += 15
    if skip_rate < 5:
        score += 15
    if skip_rate == 0:
        score += 10

    print(f"  Automation Score:        {score}/100")
    print()
    print("=" * 60)


if __name__ == "__main__":
    print_dashboard()
```

```bash
# Save the script and run it
python scripts/automation_dashboard.py
```

```text
# Expected output:
============================================================
  AUTOMATION DASHBOARD
  Generated: 2026-02-14 10:30:00
============================================================

  Commits (last 30 days):  47
  Commits (last 7 days):   12

  Pre-commit hooks:        16
  Hook skips (30 days):    0
  Skip rate:               0.0%

  Auto-fix hooks:          6
    - trailing-whitespace
    - end-of-file-fixer
    - mixed-line-ending
    - black
    - markdownlint --fix
    - terraform_fmt

  CI workflows:            4

  Automation Score:        100/100

============================================================
```

### CI Duration Tracking with GitHub CLI

```bash
# Get recent workflow run durations
gh run list --workflow=ci.yml --limit=10 \
    --json conclusion,updatedAt,createdAt \
    --jq '.[] | "\(.conclusion)\t\(.createdAt)\t\(.updatedAt)"'
```

```text
# Expected output:
success   2026-02-14T09:00:00Z   2026-02-14T09:03:42Z
success   2026-02-13T15:22:00Z   2026-02-13T15:25:18Z
failure   2026-02-13T14:10:00Z   2026-02-13T14:12:55Z
```

```bash
# Calculate average CI duration (in seconds) for last 10 runs
gh run list --workflow=ci.yml --limit=10 \
    --json createdAt,updatedAt \
    --jq '[.[] | ((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601))] | add / length | round'
```

### Checkpoint: Monitoring

```bash
# Verify dashboard script exists
ls -la scripts/automation_dashboard.py
# Expected: -rw-r--r-- ... scripts/automation_dashboard.py

# Run the dashboard
python scripts/automation_dashboard.py && echo "Dashboard works"
```

---

## Automation Maturity Model

Use this model to assess where your project stands and what to adopt next.

```text
Automation Maturity Model
==========================

Level | Name           | Tools & Practices                    | Time to Adopt
------+----------------+--------------------------------------+---------------
  0   | Manual         | Manual checklist, code review only    | 0 min
  1   | Editor-Aware   | EditorConfig, IDE settings            | 5 min
  2   | Pre-commit     | Pre-commit hooks, local linting       | 15 min
  3   | CI/CD          | GitHub Actions, multi-job pipeline    | 30 min
  4   | Auto-fix       | Auto-formatting, auto-remediation     | 10 min
  5   | Quality Gates  | Spell check, link check, metrics      | 15 min
```

| Level | Characteristic | What Gets Caught | What Slips Through |
|-------|---------------|------------------|-------------------|
| 0 - Manual | Nothing automated | Whatever you remember | Everything else |
| 1 - Editor-Aware | Formatting on save | Indentation, line endings, whitespace | Logic errors, security, naming |
| 2 - Pre-commit | Checks before commit | Formatting, syntax, basic security | Complex logic, integration issues |
| 3 - CI/CD | Checks on every push | Everything local + cross-platform | Quality metrics, documentation |
| 4 - Auto-fix | Tools fix issues | Formatting auto-fixed, less friction | Non-fixable issues still require review |
| 5 - Quality Gates | Full quality pipeline | Spelling, links, code ratios, metrics | Novel issues, architectural problems |

### Mapping Tools to Maturity Levels

```text
Level 0 (Manual):
  - scripts/manual_checks.sh
  - Code review checklists

Level 1 (Editor-Aware):
  - .editorconfig
  - .vscode/settings.json
  - .idea/codeStyles/

Level 2 (Pre-commit):
  - .pre-commit-config.yaml
  - trailing-whitespace, end-of-file-fixer
  - black, flake8, shellcheck
  - detect-private-key

Level 3 (CI/CD):
  - .github/workflows/ci.yml
  - Lint, test, security, docs jobs
  - Artifact uploads, caching

Level 4 (Auto-fix):
  - black (no --check flag)
  - markdownlint --fix
  - terraform fmt
  - scripts/autofix.sh

Level 5 (Quality Gates):
  - .github/workflows/spell-checker.yml
  - .github/workflows/link-checker.yml
  - scripts/analyze_code_ratio.py
  - scripts/validate_metadata.py
  - scripts/automation_dashboard.py
```

---

## Checkpoint: Final Verification

Run through this complete checklist to verify your automation pipeline.

```bash
# 1. EditorConfig exists and has sections for all languages
test -f .editorconfig && echo "PASS: .editorconfig exists" || echo "FAIL"

# 2. Pre-commit hooks are installed
test -f .git/hooks/pre-commit && echo "PASS: hooks installed" || echo "FAIL"

# 3. Pre-commit config has 10+ hooks
HOOK_COUNT=$(grep -c "id:" .pre-commit-config.yaml)
[ "$HOOK_COUNT" -ge 10 ] && echo "PASS: $HOOK_COUNT hooks configured" || echo "FAIL: only $HOOK_COUNT hooks"

# 4. CI workflow exists and is valid YAML
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" 2>/dev/null \
    && echo "PASS: CI workflow valid" || echo "FAIL: CI workflow invalid"

# 5. CI workflow has multiple jobs
JOB_COUNT=$(grep -c "runs-on:" .github/workflows/ci.yml)
[ "$JOB_COUNT" -ge 3 ] && echo "PASS: $JOB_COUNT CI jobs" || echo "FAIL: only $JOB_COUNT CI jobs"

# 6. Spell check config exists
test -f .github/cspell.json && echo "PASS: spell check configured" || echo "FAIL"

# 7. Auto-fix script exists
test -x scripts/autofix.sh && echo "PASS: autofix script executable" || echo "FAIL"

# 8. Dashboard script exists
test -f scripts/automation_dashboard.py && echo "PASS: dashboard exists" || echo "FAIL"

# 9. All pre-commit hooks pass
pre-commit run --all-files && echo "PASS: all hooks pass" || echo "FAIL: hooks failing"

# 10. Git is clean (all fixes committed)
[ -z "$(git status --porcelain)" ] && echo "PASS: working tree clean" || echo "WARN: uncommitted changes"
```

```text
# Expected output:
PASS: .editorconfig exists
PASS: hooks installed
PASS: 16 hooks configured
PASS: CI workflow valid
PASS: 4 CI jobs
PASS: spell check configured
PASS: autofix script executable
PASS: dashboard exists
PASS: all hooks pass
PASS: working tree clean
```

---

## Common Troubleshooting

### Problem: Pre-commit hooks fail on first run

```text
Symptom:
  An error occurred during hook execution.
  The hook 'black' failed with exit code 1.

Cause:
  Hook environments are not installed yet.

Solution:
  pre-commit install --install-hooks
  pre-commit run --all-files
```

### Problem: Black and Flake8 disagree on formatting

```text
Symptom:
  Black formats code one way, Flake8 complains about it.

Cause:
  Flake8's E203 (whitespace before ':') and W503 (line break before binary operator)
  conflict with Black's formatting.

Solution:
  Configure Flake8 to ignore these rules:
    flake8 --extend-ignore=E203,W503

  In .pre-commit-config.yaml:
    - id: flake8
      args: ['--max-line-length=100', '--extend-ignore=E203,W503']
```

### Problem: ShellCheck reports SC2086 (unquoted variables)

```bash
# Symptom:
# In src/deploy.sh line 3:
# if [ $1 == "production" ]; then
#      ^-- SC2086: Double quote to prevent globbing and word splitting.

# Solution: Quote variables and use = instead of ==
# Before:
if [ $1 == "production" ]; then
    echo "deploying"
fi

# After:
if [ "${1:-}" = "production" ]; then
    echo "deploying"
fi
```

### Problem: detect-secrets flags known safe values

```bash
# Symptom:
# detect-secrets reports false positives on test fixtures or example configs

# Solution: Update the baseline file to mark known values as safe
detect-secrets scan --update .secrets.baseline

# Then audit and mark false positives
detect-secrets audit .secrets.baseline
# Answer 'n' (not a real secret) for each false positive
```

### Problem: CI is too slow (over 10 minutes)

```text
Symptom:
  CI pipeline takes 15+ minutes to complete.

Causes and Solutions:

1. No dependency caching
   Fix: Add actions/cache for pip, uv, npm

2. Sequential jobs that could run in parallel
   Fix: Remove unnecessary 'needs:' dependencies

3. Installing tools from scratch every run
   Fix: Use setup-* actions with caching

4. Running all checks even when only docs changed
   Fix: Add path filters to workflow triggers
```

```yaml
# Example: Path-filtered triggers to speed up CI
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'tests/**'
      - 'pyproject.toml'
      - '.github/workflows/ci.yml'
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - 'tests/**'
      - 'pyproject.toml'
      - '.github/workflows/ci.yml'
```

### Problem: Pre-commit hooks modified files but commit still failed

```text
Symptom:
  Pre-commit says "files were modified by this hook" and the commit fails.

Cause:
  Auto-fix hooks (black, trailing-whitespace, end-of-file-fixer) modified files.
  Git needs the modified files to be re-staged.

Solution:
  1. Review the changes: git diff
  2. Stage the auto-fixed files: git add -u
  3. Commit again: git commit -m "your message"

  The second commit will pass because files are already formatted.
```

### Problem: yamllint complains about line length

```text
Symptom:
  yamllint reports "line too long (150 > 120 characters)"

Solution:
  Option 1: Break the line using YAML multiline syntax

  Before:
    description: "This is a very long description that exceeds the line length limit and causes yamllint to fail"

  After:
    description: >-
      This is a very long description that exceeds the line length
      limit and causes yamllint to fail

  Option 2: Adjust the yamllint max line length in .pre-commit-config.yaml:
    args: ['-d', '{extends: default, rules: {line-length: {max: 150}}}']
```

---

## Next Steps

After completing this tutorial, explore these resources to deepen your automation:

```text
Recommended Next Steps
=======================

1. Tutorial 1: Zero to Validated Python Project
   - Apply automation to a real Python project
   - See: docs/12_tutorials/python_project.md

2. Tutorial 3: Full-Stack App with Multiple Languages
   - Scale automation across Python, TypeScript, and Terraform
   - See: docs/12_tutorials/fullstack_app.md

3. CI/CD Performance Optimization Guide
   - Advanced caching, parallelization, and pipeline tuning
   - See: docs/05_ci_cd/ci_cd_performance.md

4. Progressive Enhancement Roadmap
   - Long-term automation adoption strategy
   - See: docs/07_integration/progressive_enhancement.md

5. Anti-Patterns Documentation
   - Common automation mistakes and how to avoid them
   - See: docs/08_anti_patterns/
```

```text
Summary of What You Built
==========================

File                              Purpose
---------------------------------+----------------------------------------
.editorconfig                     Editor-level formatting consistency
.pre-commit-config.yaml           Local pre-commit validation hooks
.github/workflows/ci.yml          Server-side CI/CD pipeline
.github/workflows/spell-checker.yml  Spelling quality gate (blocking)
.github/workflows/link-checker.yml   Link validation (advisory)
.github/cspell.json               Spell check configuration
scripts/manual_checks.sh          Manual validation baseline
scripts/autofix.sh                Bulk auto-fix formatting
scripts/automation_dashboard.py   Automation metrics dashboard
```
