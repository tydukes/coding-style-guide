---
title: "Tutorial 4: Team Onboarding"
description: "Get your entire team up and running with the Dukes Engineering Style Guide in 20 minutes"
author: "Tyler Dukes"
tags: [tutorial, onboarding, team, getting-started, setup, pre-commit, editor]
category: "Tutorials"
status: "active"
---

<!-- markdownlint-disable MD013 -->

## Overview

This tutorial gets your team from zero to fully configured in 20 minutes. By the end, every developer on your team will have consistent formatting, automated linting, and shared editor settings -- no manual style debates required.

```text
Time Estimate
=============
Step 1: Install Core Tools ........... 5 min
Step 2: Configure Your Editor ........ 5 min
Step 3: Set Up Pre-commit Hooks ...... 3 min
Step 4: Learn the Key Patterns ....... 5 min
Step 5: Validate Your First Change ... 2 min
                                      ------
Total ................................ 20 min
```

### Prerequisites

```bash
# All you need to start
git --version    # Git 2.30+
code --version   # VS Code (or IntelliJ IDEA)
```

```text
No Python experience required.
No Terraform experience required.
No infrastructure knowledge required.
Just git and an editor.
```

---

## Step 1: Install Core Tools (5 min)

### Install uv (Python Package Manager)

```bash
# macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify installation
uv --version
```

```bash
# Expected output
# uv 0.6.x (or newer)
```

### Install pre-commit

```bash
# Using uv (recommended)
uv tool install pre-commit

# Or using pip
pip install pre-commit

# Verify installation
pre-commit --version
```

```bash
# Expected output
# pre-commit 4.x.x (or newer)
```

### Install Language-Specific Linters

```bash
# macOS - install all recommended linters
brew install shellcheck          # Shell script linting
brew install terraform           # Terraform formatting
brew install yamllint            # YAML linting
brew install markdownlint-cli    # Markdown linting
npm install -g cspell            # Spell checking
```

```bash
# Linux (Debian/Ubuntu) - install all recommended linters
sudo apt-get update && sudo apt-get install -y shellcheck

# Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install -y terraform

# yamllint
pip install yamllint

# markdownlint
npm install -g markdownlint-cli

# Spell checking
npm install -g cspell
```

### Checkpoint 1

```bash
# Verify all tools are installed
echo "=== Tool Verification ==="
uv --version        && echo "uv: OK"
pre-commit --version && echo "pre-commit: OK"
shellcheck --version | head -1 && echo "shellcheck: OK"
terraform --version  | head -1 && echo "terraform: OK"
yamllint --version   && echo "yamllint: OK"
```

```text
Expected output (versions may vary):
=== Tool Verification ===
uv 0.6.x
uv: OK
pre-commit 4.x.x
pre-commit: OK
ShellCheck, version 0.10.x
shellcheck: OK
Terraform v1.x.x
terraform: OK
yamllint 1.x.x
yamllint: OK
```

---

## Step 2: Configure Your Editor (5 min)

### Option A: VS Code (Recommended)

```bash
# Clone the style guide repo (if you have not already)
git clone https://github.com/tydukes/coding-style-guide.git
cd coding-style-guide

# Copy editor settings to your project
cp -r .vscode/ /path/to/your-project/.vscode/
cp .editorconfig /path/to/your-project/.editorconfig
```

```bash
# Install all recommended extensions in one command
cat .vscode/extensions.json | \
  python3 -c "import sys,json; [print(e) for e in json.load(sys.stdin)['recommendations']]" | \
  xargs -I {} code --install-extension {}
```

```bash
# Or install the critical extensions individually
code --install-extension ms-python.python
code --install-extension ms-python.black-formatter
code --install-extension ms-python.flake8
code --install-extension redhat.vscode-yaml
code --install-extension DavidAnson.vscode-markdownlint
code --install-extension timonwong.shellcheck
code --install-extension hashicorp.terraform
code --install-extension EditorConfig.EditorConfig
code --install-extension streetsidesoftware.code-spell-checker
code --install-extension esbenp.prettier-vscode
```

Key settings that ship with `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.rulers": [100],
  "python.formatting.provider": "black",
  "python.linting.flake8Enabled": true,
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.tabSize": 4
  },
  "[yaml]": {
    "editor.tabSize": 2
  },
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.tabSize": 2
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2
  },
  "[markdown]": {
    "editor.tabSize": 2,
    "files.trimTrailingWhitespace": false
  }
}
```

### Option B: IntelliJ IDEA / PyCharm

```bash
# Copy IntelliJ settings to your project
cp -r .idea/ /path/to/your-project/.idea/
cp .editorconfig /path/to/your-project/.editorconfig
```

```text
IntelliJ settings include:
- Code style settings matching pre-commit hooks
- Inspection profiles for all languages
- Auto-format on save configuration
- EditorConfig support enabled
```

```xml
<!-- .idea/codeStyles/Project.xml key settings -->
<code_scheme name="Project" version="173">
  <option name="RIGHT_MARGIN" value="100" />
  <PythonCodeStyleSettings>
    <option name="SPACE_AFTER_NUMBER_SIGN" value="true" />
  </PythonCodeStyleSettings>
  <codeStyleSettings language="Python">
    <option name="RIGHT_MARGIN" value="100" />
    <indentOptions>
      <option name="INDENT_SIZE" value="4" />
    </indentOptions>
  </codeStyleSettings>
  <codeStyleSettings language="YAML">
    <indentOptions>
      <option name="INDENT_SIZE" value="2" />
    </indentOptions>
  </codeStyleSettings>
</code_scheme>
```

### Verify EditorConfig Is Working

```bash
# Create a test file in your project
cat > /tmp/editorconfig-test.py << 'PYEOF'
def hello():
    print("EditorConfig is working")
PYEOF
```

```text
Open the file in your editor. You should see:
- Python files: 4-space indentation
- YAML files: 2-space indentation
- Line endings: LF (not CRLF)
- Final newline: automatically inserted on save
- Trailing whitespace: automatically removed on save
```

### Checkpoint 2

```bash
# Verify .editorconfig exists in your project
ls -la /path/to/your-project/.editorconfig

# Verify .vscode settings exist
ls -la /path/to/your-project/.vscode/settings.json
ls -la /path/to/your-project/.vscode/extensions.json

# Verify EditorConfig extension is installed
code --list-extensions | grep -i editorconfig
```

```text
Expected output:
-rw-r--r--  1 user  staff  .editorconfig
-rw-r--r--  1 user  staff  .vscode/settings.json
-rw-r--r--  1 user  staff  .vscode/extensions.json
EditorConfig.EditorConfig
```

---

## Step 3: Set Up Pre-commit Hooks (3 min)

### Install Hooks in Your Existing Repo

```bash
# Navigate to your project
cd /path/to/your-project

# Copy the pre-commit config from the style guide
cp /path/to/coding-style-guide/.pre-commit-config.yaml .
```

```yaml
# .pre-commit-config.yaml - what you just copied
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

  # Python formatting and linting
  - repo: https://github.com/psf/black
    rev: 26.1.0
    hooks:
      - id: black
        language_version: python3

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

### Install and Run

```bash
# Install the hooks (downloads hook environments)
pre-commit install --install-hooks

# Run against ALL existing files (first-time baseline)
pre-commit run --all-files
```

```text
Expected first-run output:
Trim Trailing Whitespace...............................Passed
Fix End of Files.......................................Passed
Check Yaml.............................................Passed
Check JSON.............................................Passed
Check for added large files............................Passed
Check for merge conflicts..............................Passed
Check for case conflicts...............................Passed
Mixed line ending......................................Passed
Detect Private Key.....................................Passed
black..................................................Failed
- hook id: black
- files were reformatted
flake8.................................................Failed
- hook id: flake8
yamllint...............................................Passed
shellcheck.............................................Passed
markdownlint...........................................Failed
- hook id: markdownlint
```

### Fix Initial Issues

```bash
# Black auto-fixes formatting -- just re-add and commit
git add -A
pre-commit run --all-files

# If flake8 still fails, check specific errors
pre-commit run flake8 --all-files 2>&1 | head -20
```

```bash
# Common flake8 fixes
# E501: line too long (break long lines)
# E302: expected 2 blank lines (add blank lines between top-level definitions)
# F401: imported but unused (remove unused imports)
# W291: trailing whitespace (black usually fixes this)
```

```bash
# Markdownlint common fixes
# MD013: Line length > 120 characters (add line breaks)
# MD033: Inline HTML (use markdown syntax instead)
# MD041: First line should be a top-level heading
```

### Checkpoint 3

```bash
# All hooks should pass now
pre-commit run --all-files

# Verify hooks are installed for future commits
ls .git/hooks/pre-commit
```

```text
Expected output:
Trim Trailing Whitespace...............................Passed
Fix End of Files.......................................Passed
Check Yaml.............................................Passed
Check JSON.............................................Passed
Check for added large files............................Passed
Check for merge conflicts..............................Passed
Check for case conflicts...............................Passed
Mixed line ending......................................Passed
Detect Private Key.....................................Passed
black..................................................Passed
flake8.................................................Passed
yamllint...............................................Passed
shellcheck.............................................Passed
markdownlint...........................................Passed
```

---

## Step 4: Learn the Key Patterns (5 min)

### Naming Conventions Per Language

```text
Language        Files                  Variables            Functions/Methods
----------      -------------------    -----------------    ---------------------
Python          snake_case.py          snake_case           snake_case
TypeScript      kebab-case.ts          camelCase            camelCase
Terraform       kebab-case.tf          snake_case           N/A (use locals)
Bash            kebab-case.sh          UPPER_SNAKE_CASE     snake_case
YAML            kebab-case.yaml        kebab-case keys      N/A
Kubernetes      kebab-case.yaml        kebab-case labels    N/A
Dockerfile      Dockerfile             UPPER_SNAKE_CASE     N/A
Makefile        Makefile               UPPER_SNAKE_CASE     snake_case (targets)
```

### Indentation Rules

```text
Language        Style      Size    Max Line Length
---------       ------     ----    ---------------
Python          spaces     4       100
TypeScript      spaces     2       100
Terraform       spaces     2       120
Bash            spaces     2       100
YAML            spaces     2       120
JSON            spaces     2       N/A
Makefile        tabs       4       100
Go              tabs       4       100
```

### Metadata Tags

Every source file should include metadata in a comment block:

```python
"""
@module user_service
@description Handles user authentication and profile management
@version 1.2.0
@author Tyler Dukes
@last_updated 2025-06-15
@status stable
"""

import logging

logger = logging.getLogger(__name__)
```

```hcl
# @module vpc_network
# @description Creates a VPC with public and private subnets
# @version 2.0.0
# @author Tyler Dukes
# @last_updated 2025-06-15
# @status stable

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
}
```

```bash
#!/usr/bin/env bash
# @module deploy_script
# @description Deploys application to staging environment
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-06-15
# @status stable

set -euo pipefail
```

```yaml
# @module ci_pipeline
# @description Main CI/CD pipeline configuration
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-06-15
# @status stable

name: CI Pipeline
on:
  push:
    branches: [main]
```

```typescript
/**
 * @module api_router
 * @description Express router for REST API endpoints
 * @version 1.1.0
 * @author Tyler Dukes
 * @last_updated 2025-06-15
 * @status stable
 */

import express from "express";

const router = express.Router();
```

### Code Block Language Tags

Always use language tags in markdown code blocks. This is enforced by markdownlint.

```markdown
<!-- CORRECT: language tag specified -->

    ```python
    def hello():
        print("world")
    ```

    ```bash
    echo "hello world"
    ```

    ```yaml
    name: CI Pipeline
    on: push
    ```

    ```hcl
    resource "aws_s3_bucket" "main" {
      bucket = "my-bucket"
    }
    ```

<!-- INCORRECT: bare code block (will fail linting) -->

    ```
    def hello():
        print("world")
    ```
```

### Before and After: Python

```python
# BEFORE: Non-compliant
import os, sys
from datetime import datetime,timedelta

def getData(userID):
  data = {"name":"John","age":30,"email":"john@example.com","address":"123 Main St","city":"Springfield","state":"IL"}
  if data["name"]=="John":
    return data
  else:
    return None

class user_manager:
  def __init__(self):
    self.users=[]
  def AddUser(self,user):
    self.users.append(user)
```

```python
# AFTER: Compliant with Dukes Style Guide
"""
@module user_data
@description User data retrieval and management
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-06-15
@status stable
"""

import os
import sys
from datetime import datetime, timedelta


def get_data(user_id: str) -> dict | None:
    """Retrieve user data by ID."""
    data = {
        "name": "John",
        "age": 30,
        "email": "john@example.com",
        "address": "123 Main St",
        "city": "Springfield",
        "state": "IL",
    }
    if data["name"] == "John":
        return data
    return None


class UserManager:
    """Manages user lifecycle operations."""

    def __init__(self) -> None:
        self.users: list[dict] = []

    def add_user(self, user: dict) -> None:
        """Add a user to the managed collection."""
        self.users.append(user)
```

### Before and After: Terraform

```hcl
# BEFORE: Non-compliant
resource "aws_s3_bucket" "MyBucket" {
bucket = "my-app-bucket"
tags = {
Name = "my-app"
Environment = "prod"
}
}

variable "bucketName" {
  default = "my-app-bucket"
}
```

```hcl
# AFTER: Compliant with Dukes Style Guide
# @module s3_storage
# @description S3 bucket for application assets
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-06-15
# @status stable

resource "aws_s3_bucket" "my_bucket" {
  bucket = var.bucket_name

  tags = {
    Name        = "my-app"
    Environment = "prod"
    ManagedBy   = "terraform"
  }
}

variable "bucket_name" {
  description = "Name of the S3 bucket for application assets"
  type        = string
  default     = "my-app-bucket"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]*[a-z0-9]$", var.bucket_name))
    error_message = "Bucket name must be lowercase alphanumeric with hyphens or dots."
  }
}
```

### Before and After: Bash

```bash
# BEFORE: Non-compliant
#!/bin/bash
echo "deploying..."
cd /app
rm -rf node_modules
npm install
npm run build
cp -r dist/* /var/www/html
echo "done"
```

```bash
# AFTER: Compliant with Dukes Style Guide
#!/usr/bin/env bash
# @module deploy_app
# @description Build and deploy frontend application
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-06-15
# @status stable

set -euo pipefail

readonly APP_DIR="/app"
readonly BUILD_DIR="${APP_DIR}/dist"
readonly DEPLOY_DIR="/var/www/html"

main() {
  echo "INFO: Starting deployment..."

  if [[ ! -d "${APP_DIR}" ]]; then
    echo "ERROR: Application directory not found: ${APP_DIR}" >&2
    exit 1
  fi

  cd "${APP_DIR}"
  rm -rf node_modules
  npm ci --production
  npm run build

  if [[ ! -d "${BUILD_DIR}" ]]; then
    echo "ERROR: Build output not found: ${BUILD_DIR}" >&2
    exit 1
  fi

  cp -r "${BUILD_DIR}"/* "${DEPLOY_DIR}"/
  echo "INFO: Deployment complete."
}

main "$@"
```

### Checkpoint 4

```text
Quick self-check -- can you answer these?

1. Python file names use _________ case.       (snake_case)
2. Python indentation is ___ spaces.            (4)
3. YAML indentation is ___ spaces.              (2)
4. Every code block in markdown needs a ______. (language tag)
5. Required metadata tags: @module, @_________, @_________
                           (description, version)
```

---

## Step 5: Validate Your First Change (2 min)

### Make a Small Change

```bash
# Create a test Python file in your project
cat > test_style.py << 'EOF'
"""
@module test_style
@description Validates style guide compliance
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-06-15
@status stable
"""


def greet(name: str) -> str:
    """Return a greeting message."""
    return f"Hello, {name}!"


if __name__ == "__main__":
    print(greet("Team"))
EOF
```

### Commit and See Hooks Run

```bash
# Stage the file
git add test_style.py

# Commit -- pre-commit hooks run automatically
git commit -m "feat: add style compliance test file"
```

```text
Expected output:
Trim Trailing Whitespace...............................Passed
Fix End of Files.......................................Passed
Check Yaml..........................................(no files to check)Skipped
Check JSON..........................................(no files to check)Skipped
Check for added large files............................Passed
Check for merge conflicts..............................Passed
Check for case conflicts...............................Passed
Mixed line ending......................................Passed
Detect Private Key.....................................Passed
black..................................................Passed
flake8.................................................Passed
[main abc1234] feat: add style compliance test file
 1 file changed, 17 insertions(+)
 create mode 100644 test_style.py
```

### Clean Up

```bash
# Remove the test file
git rm test_style.py
git commit -m "chore: remove style compliance test file"
```

### Checkpoint 5

```bash
# Verify hooks ran successfully on your commit
git log --oneline -2
```

```text
Expected output:
abc1234 chore: remove style compliance test file
def5678 feat: add style compliance test file
```

---

## Quick Reference Card

```text
==========================================================================
  DUKES ENGINEERING STYLE GUIDE -- QUICK REFERENCE
==========================================================================

  PYTHON
  ------
  Formatter:   black (100 char line)
  Linter:      flake8 (ignore E203, W503)
  Indent:      4 spaces
  Naming:      snake_case (files, vars, funcs), PascalCase (classes)
  Imports:     One per line, stdlib -> third-party -> local

  TERRAFORM
  ---------
  Formatter:   terraform fmt
  Indent:      2 spaces
  Naming:      snake_case (resources, vars), kebab-case (files)
  Structure:   main.tf, variables.tf, outputs.tf, versions.tf
  Tags:        Always include Name, Environment, ManagedBy

  TYPESCRIPT
  ----------
  Formatter:   prettier
  Linter:      eslint
  Indent:      2 spaces
  Naming:      camelCase (vars, funcs), PascalCase (classes, interfaces)
  Files:       kebab-case.ts

  BASH
  ----
  Linter:      shellcheck
  Indent:      2 spaces
  Shebang:     #!/usr/bin/env bash
  Safety:      set -euo pipefail (always)
  Naming:      UPPER_SNAKE_CASE (vars), snake_case (functions)
  Structure:   main() pattern, functions before calls

  YAML
  ----
  Linter:      yamllint (120 char line)
  Indent:      2 spaces
  Naming:      kebab-case (keys)
  Booleans:    true/false (not yes/no, on/off)
  Strings:     Quote when ambiguous

  ALL LANGUAGES
  -------------
  Line endings:       LF (not CRLF)
  Final newline:      Always
  Trailing spaces:    Never (except markdown)
  Code blocks:        Always use language tags
  Metadata:           @module, @description, @version (minimum)
  Commits:            Conventional format: type(scope): subject

==========================================================================
```

```text
==========================================================================
  CONVENTIONAL COMMIT TYPES
==========================================================================

  feat:      New feature
  fix:       Bug fix
  docs:      Documentation only
  style:     Formatting (no code change)
  refactor:  Code restructuring (no feature/fix)
  test:      Adding or updating tests
  chore:     Maintenance tasks
  ci:        CI/CD configuration changes
  perf:      Performance improvements
  build:     Build system or dependency changes
  revert:    Reverting a previous commit

  Format:    type(scope): short description
  Example:   feat(auth): add JWT token refresh endpoint
  Breaking:  feat(api)!: remove deprecated v1 endpoints

==========================================================================
```

---

## Common Troubleshooting

### Problem 1: pre-commit install fails with "command not found"

```bash
# Symptom
$ pre-commit install
zsh: command not found: pre-commit

# Cause: pre-commit is not on your PATH

# Fix (option 1): Install with uv
uv tool install pre-commit
# uv puts tools in ~/.local/bin -- make sure it is on PATH
export PATH="$HOME/.local/bin:$PATH"

# Fix (option 2): Install with pip
pip install pre-commit

# Fix (option 3): Use pipx
pipx install pre-commit

# Verify
pre-commit --version
```

### Problem 2: Black reformats files but commit still fails

```bash
# Symptom: black reformats files, but commit is rejected

# Cause: Black modifies files in-place during the hook.
# The modified files are not staged, so the commit has stale content.

# Fix: Re-add the reformatted files and commit again
git add -u
git commit -m "style: apply black formatting"
```

```bash
# Prevention: Use this alias to auto-stage after hooks
git config --local alias.cc '!git add -u && git commit'

# Then use:
git cc -m "feat: my new feature"
```

### Problem 3: Flake8 reports "E501 line too long" but Black did not fix it

```bash
# Symptom
test.py:42:101: E501 line too long (145 > 100 characters)

# Cause: Black formats to 88 chars by default, but our config uses 100.
# However, some lines (like URLs or long strings) cannot be split by Black.

# Fix: Break the long line manually
# Before:
result = some_function(very_long_argument_name, another_long_argument, yet_another_parameter, final_param="value")

# After:
result = some_function(
    very_long_argument_name,
    another_long_argument,
    yet_another_parameter,
    final_param="value",
)
```

```bash
# For URLs or strings that cannot be broken, use noqa:
DOCS_URL = "https://example.com/very/long/path/to/documentation/page"  # noqa: E501
```

### Problem 4: yamllint fails with "wrong indentation"

```yaml
# Symptom
# config.yaml:5:3 [error] wrong indentation: expected 2 but found 4

# Cause: Mixed indentation in YAML file

# WRONG (4-space indent):
services:
    web:
        image: nginx

# CORRECT (2-space indent):
services:
  web:
    image: nginx
```

```bash
# Fix: Let your editor handle it
# With EditorConfig installed, YAML files auto-indent at 2 spaces.
# Re-indent the file in VS Code:
# 1. Open the file
# 2. Cmd+Shift+P (or Ctrl+Shift+P)
# 3. Type "Reindent Lines"
# 4. Save
```

### Problem 5: shellcheck reports SC2086 "double quote to prevent globbing"

```bash
# Symptom
# deploy.sh:10:3 SC2086: Double quote to prevent globbing and word splitting.

# WRONG:
FILE_PATH=$1
cat $FILE_PATH

# CORRECT:
FILE_PATH="$1"
cat "${FILE_PATH}"
```

```bash
# Common shellcheck fixes:
# SC2086: Always double-quote variables
echo "${MY_VAR}"              # not: echo $MY_VAR

# SC2034: Variable appears unused (if exported or used later)
export MY_VAR="value"         # Add export, or use in script

# SC2155: Declare and assign separately
local exit_code               # Declare first
exit_code="$(command)"        # Then assign

# SC2164: Use || exit after cd
cd "${DIR}" || exit 1         # not: cd $DIR
```

### Problem 6: markdownlint fails with MD033 "Inline HTML"

```markdown
<!-- Symptom -->
<!-- MD033/no-inline-html: Inline HTML [Element: br] -->

<!-- WRONG: -->
Line one<br>Line two

<!-- CORRECT: -->
Line one

Line two
```

```markdown
<!-- If you need HTML for a specific reason, disable the rule inline: -->
<!-- markdownlint-disable MD033 -->
<details>
<summary>Click to expand</summary>

Content here.

</details>
<!-- markdownlint-enable MD033 -->
```

### Problem 7: EditorConfig not applying settings

```bash
# Symptom: Files save with wrong indentation or line endings

# Check 1: Is the EditorConfig extension installed?
code --list-extensions | grep -i editorconfig
# Should show: EditorConfig.EditorConfig

# Check 2: Is .editorconfig in the project root?
ls -la .editorconfig

# Check 3: Does .editorconfig have root = true?
head -3 .editorconfig
# Should show:
# root = true
```

```bash
# Fix: Install the extension and reload VS Code
code --install-extension EditorConfig.EditorConfig

# Then reload VS Code:
# Cmd+Shift+P -> "Developer: Reload Window"
```

---

## Next Steps

```text
Recommended next tutorials:

For Python developers:
  Tutorial 1: Zero to Validated Python Project (30 min)
  -> docs/12_tutorials/python_project.md

For Infrastructure engineers:
  Tutorial 2: Migrating Existing Terraform Module (45 min)
  -> docs/12_tutorials/terraform_migration.md

For Team leads:
  Tutorial 5: From Manual to Automated (40 min)
  -> docs/12_tutorials/manual_to_automated.md
```

```text
Recommended reading:

Language-specific guides:
  Python:      docs/02_language_guides/python.md
  Terraform:   docs/02_language_guides/terraform.md
  TypeScript:  docs/02_language_guides/typescript.md
  Bash:        docs/02_language_guides/bash.md
  YAML:        docs/02_language_guides/yaml.md

Templates:
  CONTRACT.md:           docs/04_templates/contract_template.md
  Language guide:         docs/04_templates/language_guide_template.md
  IDE settings:           docs/04_templates/ide_settings_template.md

Standards:
  Documentation:          docs/00_standards/
  Metadata schema:        docs/03_metadata_schema/
  Anti-patterns:          docs/08_anti_patterns/
```

### Share With Your Team

```bash
# Create a team setup script that new members can run
cat > setup-style-guide.sh << 'BASH'
#!/usr/bin/env bash
# @module setup_style_guide
# @description One-command team onboarding for Dukes Engineering Style Guide
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-06-15
# @status stable

set -euo pipefail

echo "=== Dukes Engineering Style Guide Setup ==="

# Install pre-commit
if ! command -v pre-commit &> /dev/null; then
  echo "Installing pre-commit..."
  pip install pre-commit
fi

# Install hooks
echo "Installing pre-commit hooks..."
pre-commit install --install-hooks

# Install VS Code extensions (if VS Code is available)
if command -v code &> /dev/null; then
  echo "Installing VS Code extensions..."
  code --install-extension EditorConfig.EditorConfig
  code --install-extension ms-python.black-formatter
  code --install-extension ms-python.flake8
  code --install-extension redhat.vscode-yaml
  code --install-extension DavidAnson.vscode-markdownlint
  code --install-extension timonwong.shellcheck
  code --install-extension hashicorp.terraform
  code --install-extension streetsidesoftware.code-spell-checker
fi

# Run initial validation
echo "Running initial validation..."
pre-commit run --all-files || true

echo ""
echo "=== Setup Complete ==="
echo "Pre-commit hooks are installed and will run on every commit."
echo "See: https://tydukes.github.io/coding-style-guide/"
BASH

chmod +x setup-style-guide.sh
```

```bash
# New team members just run:
./setup-style-guide.sh
```
