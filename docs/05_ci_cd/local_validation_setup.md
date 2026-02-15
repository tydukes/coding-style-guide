---
title: "Local Validation Setup Guide"
description: "Complete guide to setting up a local development environment with all validation tools, linters, formatters, and testing frameworks for consistent code quality"
author: "Tyler Dukes"
tags: [local-development, validation, setup, tooling, linters, formatters, testing]
category: "CI/CD"
status: "active"
search_keywords: [local validation, setup, development environment, linting, testing, pre-commit]
---

## Introduction

This guide provides step-by-step instructions for setting up a complete local development environment with
all validation tools, linters, formatters, and testing frameworks. By configuring these tools locally,
you can catch issues before committing code and maintain consistency with CI/CD pipelines.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Package Managers](#package-managers)
3. [Python Development](#python-development)
4. [JavaScript/TypeScript Development](#javascripttypescript-development)
5. [Infrastructure as Code](#infrastructure-as-code)
6. [Shell Script Development](#shell-script-development)
7. [Container Development](#container-development)
8. [Database Development](#database-development)
9. [Editor Integration](#editor-integration)
10. [Validation Scripts](#validation-scripts)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Operating System Setup

**macOS**:

```bash
## Install Xcode Command Line Tools
xcode-select --install

## Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Ubuntu/Debian**:

```bash
## Update package list
sudo apt update

## Install build essentials
sudo apt install -y build-essential curl git wget

## Install common utilities
sudo apt install -y ca-certificates gnupg lsb-release
```

**Fedora/RHEL**:

```bash
## Install development tools
sudo dnf groupinstall "Development Tools"

## Install utilities
sudo dnf install -y curl git wget
```

### Git Configuration

```bash
## Set user information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

## Set default branch name
git config --global init.defaultBranch main

## Enable credential caching
git config --global credential.helper cache

## Set line ending handling
git config --global core.autocrlf input  # macOS/Linux
## git config --global core.autocrlf true  # Windows

## Enable color output
git config --global color.ui auto
```

---

## Package Managers

### Python Package Management

**Install uv (recommended)**:

```bash
## macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

## Verify installation
uv --version
```

**Alternative: pipx**:

```bash
## macOS
brew install pipx
pipx ensurepath

## Ubuntu/Debian
sudo apt install pipx
pipx ensurepath

## Verify
pipx --version
```

### Node.js Package Management

**Install Node.js via nvm**:

```bash
## Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

## Reload shell
source ~/.bashrc  # or ~/.zshrc

## Install LTS version
nvm install --lts

## Set as default
nvm use --lts
nvm alias default node

## Verify
node --version
npm --version
```

**Enable pnpm (optional, faster alternative)**:

```bash
## Enable with corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

## Verify
pnpm --version
```

### Ruby (for some tools)

**Install rbenv**:

```bash
## macOS
brew install rbenv ruby-build

## Ubuntu/Debian
sudo apt install rbenv

## Initialize
rbenv init
echo 'eval "$(rbenv init -)"' >> ~/.bashrc

## Install Ruby
rbenv install 3.2.2
rbenv global 3.2.2

## Verify
ruby --version
```

---

## Python Development

### Core Python Tools

**Install Python 3.11+ and tools**:

```bash
## macOS
brew install python@3.11

## Ubuntu/Debian (Python 3.11)
sudo apt install -y python3.11 python3.11-venv python3.11-dev

## Set as default (if needed)
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
```

**Create virtual environment**:

```bash
## Using venv
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
## .venv\Scripts\activate  # Windows

## Using uv (faster)
uv venv
source .venv/bin/activate
```

### Python Linting and Formatting

**Install tools globally with pipx**:

```bash
## Black (formatter)
pipx install black

## isort (import sorter)
pipx install isort

## flake8 (linter)
pipx install flake8
pipx inject flake8 flake8-docstrings
pipx inject flake8 flake8-bugbear
pipx inject flake8 flake8-comprehensions

## mypy (type checker)
pipx install mypy

## bandit (security checker)
pipx install bandit

## pylint (comprehensive linter)
pipx install pylint
```

**Or install in project**:

```bash
## Using uv
uv pip install black isort flake8 mypy bandit pylint

## Using pip
pip install black isort flake8 mypy bandit pylint
```

### Python Configuration Files

**pyproject.toml**:

```toml
[project]
name = "my-project"
version = "0.1.0"
description = "Project description"
requires-python = ">=3.11"
dependencies = []

[project.optional-dependencies]
dev = [
    "black>=23.12.1",
    "isort>=5.13.2",
    "flake8>=7.0.0",
    "mypy>=1.8.0",
    "bandit>=1.7.6",
    "pytest>=7.4.3",
    "pytest-cov>=4.1.0",
]

[tool.black]
line-length = 120
target-version = ['py311']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.venv
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
line_length = 120
skip_gitignore = true
known_first_party = ["myproject"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
ignore_missing_imports = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
addopts = "-v --cov=src --cov-report=html --cov-report=term"

[tool.coverage.run]
source = ["src"]
omit = ["*/tests/*", "*/__pycache__/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]
```

**.flake8**:

```ini
[flake8]
max-line-length = 120
extend-ignore = E203, W503
max-complexity = 10
docstring-convention = google
exclude =
    .git,
    __pycache__,
    .venv,
    build,
    dist
per-file-ignores =
    __init__.py:F401
    tests/*:D100,D101,D102,D103
```

### Python Testing

**Install pytest and plugins**:

```bash
pipx install pytest
pipx inject pytest pytest-cov
pipx inject pytest pytest-mock
pipx inject pytest pytest-asyncio
pipx inject pytest pytest-xdist  # parallel testing
```

**Run tests**:

```bash
## Run all tests
pytest

## Run with coverage
pytest --cov=src --cov-report=html

## Run specific test file
pytest tests/test_example.py

## Run with parallel execution
pytest -n auto
```

---

## JavaScript/TypeScript Development

### Node.js Tooling

**Install core tools**:

```bash
## Using npm (globally)
npm install -g typescript
npm install -g ts-node
npm install -g prettier
npm install -g eslint

## Or using pnpm
pnpm add -g typescript ts-node prettier eslint
```

**Project setup**:

```bash
## Initialize package.json
npm init -y

## Install dev dependencies
npm install --save-dev \
  typescript \
  @types/node \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier \
  eslint-config-prettier \
  eslint-plugin-import
```

### TypeScript Configuration

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**package.json scripts**:

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### ESLint Configuration

**.eslintrc.json**:

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "import"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc"
        }
      }
    ]
  }
}
```

### Prettier Configuration

**.prettierrc.json**:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### JavaScript/TypeScript Testing

**Install Jest**:

```bash
npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/jest-dom
```

**jest.config.js**:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## Infrastructure as Code

### Terraform/Terragrunt

**Install Terraform**:

```bash
## macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

## Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | \
  sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

## Verify
terraform --version
```

**Install Terragrunt**:

```bash
## macOS
brew install terragrunt

## Linux (direct download)
TERRAGRUNT_VERSION="0.54.8"
wget https://github.com/gruntwork-io/terragrunt/releases/download/v${TERRAGRUNT_VERSION}/terragrunt_linux_amd64
sudo mv terragrunt_linux_amd64 /usr/local/bin/terragrunt
sudo chmod +x /usr/local/bin/terragrunt

## Verify
terragrunt --version
```

**Install TFLint**:

```bash
## macOS
brew install tflint

## Ubuntu/Debian
curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash

## Verify
tflint --version
```

**Install terraform-docs**:

```bash
## macOS
brew install terraform-docs

## Linux
curl -sSLo ./terraform-docs.tar.gz https://terraform-docs.io/dl/latest/terraform-docs-linux-amd64.tar.gz
tar -xzf terraform-docs.tar.gz
sudo mv terraform-docs /usr/local/bin/
rm terraform-docs.tar.gz

## Verify
terraform-docs --version
```

**Install Checkov**:

```bash
## Using pipx
pipx install checkov

## Verify
checkov --version
```

**.tflint.hcl**:

```hcl
plugin "aws" {
  enabled = true
  version = "0.29.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "terraform_documented_variables" {
  enabled = true
}

rule "terraform_module_pinned_source" {
  enabled = true
}

rule "terraform_unused_declarations" {
  enabled = true
}

rule "terraform_required_version" {
  enabled = true
}
```

### Ansible

**Install Ansible**:

```bash
## macOS
brew install ansible

## Ubuntu/Debian
sudo apt update
sudo apt install ansible

## Using pipx (recommended)
pipx install ansible-core
pipx inject ansible-core ansible

## Verify
ansible --version
```

**Install ansible-lint**:

```bash
## Using pipx
pipx install ansible-lint

## Verify
ansible-lint --version
```

**.ansible-lint**:

```yaml
profile: production

exclude_paths:
  - .cache/
  - .github/
  - test/
  - molecule/

skip_list:
  - yaml[line-length]

enable_list:
  - args
  - empty-string-compare
  - no-log-password
  - no-same-owner
```

### Kubernetes/Helm

**Install kubectl**:

```bash
## macOS
brew install kubectl

## Ubuntu/Debian
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

## Verify
kubectl version --client
```

**Install Helm**:

```bash
## macOS
brew install helm

## Ubuntu/Debian
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | \
  sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] \
  https://baltocdn.com/helm/stable/debian/ all main" | \
  sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt update
sudo apt install helm

## Verify
helm version
```

**Install kubeval**:

```bash
## macOS
brew install kubeval

## Linux
wget https://github.com/instrumenta/kubeval/releases/latest/download/kubeval-linux-amd64.tar.gz
tar xf kubeval-linux-amd64.tar.gz
sudo mv kubeval /usr/local/bin
```

**Install yamllint**:

```bash
## Using pipx
pipx install yamllint

## Verify
yamllint --version
```

**.yamllint**:

```yaml
extends: default

rules:
  line-length:
    max: 120
  indentation:
    spaces: 2
  comments:
    min-spaces-from-content: 1
```

---

## Shell Script Development

### ShellCheck

**Install ShellCheck**:

```bash
## macOS
brew install shellcheck

## Ubuntu/Debian
sudo apt install shellcheck

## Fedora
sudo dnf install ShellCheck

## Verify
shellcheck --version
```

**.shellcheckrc**:

```bash
## Disable specific checks
disable=SC1091  # Can't follow sourced files
disable=SC2034  # Unused variables

## Set shell dialect
shell=bash
```

### shfmt

**Install shfmt**:

```bash
## macOS
brew install shfmt

## Using Go
go install mvdan.cc/sh/v3/cmd/shfmt@latest

## Verify
shfmt --version
```

**.editorconfig** (for shfmt):

```ini
[*.sh]
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

---

## Container Development

### Docker

**Install Docker**:

```bash
## macOS
brew install --cask docker

## Ubuntu/Debian
sudo apt install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

## Verify
docker --version
docker compose version
```

### Hadolint

**Install hadolint**:

```bash
## macOS
brew install hadolint

## Linux
wget -O /usr/local/bin/hadolint https://github.com/hadolint/hadolint/releases/latest/download/hadolint-Linux-x86_64
chmod +x /usr/local/bin/hadolint

## Verify
hadolint --version
```

**.hadolint.yaml**:

```yaml
ignored:
  - DL3008  # Pin versions in apt-get install
  - DL3009  # Delete apt-get lists after installing

trustedRegistries:
  - docker.io
  - gcr.io
  - ghcr.io

failure-threshold: warning
```

### Trivy

**Install Trivy**:

```bash
## macOS
brew install aquasecurity/trivy/trivy

## Ubuntu/Debian
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy

## Verify
trivy --version
```

---

## Database Development

### PostgreSQL Tools

**Install psql client**:

```bash
## macOS
brew install postgresql

## Ubuntu/Debian
sudo apt install postgresql-client

## Verify
psql --version
```

### SQLFluff

**Install SQLFluff**:

```bash
## Using pipx
pipx install sqlfluff

## Verify
sqlfluff --version
```

**.sqlfluff**:

```ini
[sqlfluff]
dialect = postgres
templater = jinja
exclude_rules = L034, L036
max_line_length = 120

[sqlfluff:indentation]
indent_unit = space
tab_space_size = 2

[sqlfluff:rules]
capitalisation_policy = upper
single_table_references = consistent
unquoted_identifiers_policy = all
```

---

## Editor Integration

### VS Code

**Install extensions**:

```bash
## Install VS Code command line
## macOS: Cmd+Shift+P > "Shell Command: Install 'code' command in PATH"

## Install extensions
code --install-extension ms-python.python
code --install-extension ms-python.black-formatter
code --install-extension ms-python.isort
code --install-extension ms-python.flake8
code --install-extension ms-python.mypy-type-checker
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension hashicorp.terraform
code --install-extension timonwong.shellcheck
code --install-extension foxundermoon.shell-format
code --install-extension exiasr.hadolint
code --install-extension redhat.ansible
code --install-extension ms-azuretools.vscode-docker
```

**settings.json**:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },

  // Python
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  },
  "black-formatter.args": ["--line-length", "120"],
  "isort.args": ["--profile", "black"],
  "flake8.args": ["--max-line-length=120"],

  // TypeScript/JavaScript
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],

  // Terraform
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true
  },
  "terraform.languageServer.enable": true,

  // Shell
  "[shellscript]": {
    "editor.defaultFormatter": "foxundermoon.shell-format"
  },
  "shellformat.flag": "-i 2 -ci",

  // YAML
  "[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml"
  },

  // Files
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "files.exclude": {
    "**/__pycache__": true,
    "**/.pytest_cache": true,
    "**/.mypy_cache": true,
    "**/node_modules": true,
    "**/.terraform": true
  }
}
```

### JetBrains IDEs (PyCharm, WebStorm, IntelliJ)

**Configure Python tools**:

1. Settings > Tools > Black
   - Enable: ✓
   - Arguments: `--line-length 120`
   - On code reformat: ✓

2. Settings > Tools > External Tools
   - Add flake8, mypy, bandit

**Configure JavaScript/TypeScript**:

1. Settings > Languages & Frameworks > JavaScript > Prettier
   - Prettier package: `./node_modules/prettier`
   - Run on save: ✓

2. Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint
   - Automatic ESLint configuration: ✓
   - Run eslint --fix on save: ✓

---

## Validation Scripts

### All-in-One Validation Script

**scripts/validate.sh**:

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "=== Running Full Validation ==="

## Python validation
if [ -d "src" ] && [ -f "pyproject.toml" ]; then
  echo "--- Python Validation ---"
  black --check src/
  isort --check-only src/
  flake8 src/
  mypy src/
  bandit -r src/
  pytest tests/ -v --cov=src --cov-report=term
fi

## JavaScript/TypeScript validation
if [ -f "package.json" ]; then
  echo "--- JavaScript/TypeScript Validation ---"
  npm run lint
  npm run format:check
  npm run type-check
  npm test
fi

## Terraform validation
if [ -d "terraform" ] || [ -f "*.tf" ]; then
  echo "--- Terraform Validation ---"
  terraform fmt -check -recursive
  terraform validate
  tflint
fi

## Shell script validation
if find . -name "*.sh" -not -path "./node_modules/*" -not -path "./.venv/*" | grep -q .; then
  echo "--- Shell Script Validation ---"
  find . -name "*.sh" -not -path "./node_modules/*" -not -path "./.venv/*" -exec shellcheck {} +
fi

## Docker validation
if [ -f "Dockerfile" ]; then
  echo "--- Docker Validation ---"
  hadolint Dockerfile
fi

echo "=== All Validations Passed ==="
```

**Make executable**:

```bash
chmod +x scripts/validate.sh
```

### Language-Specific Scripts

**scripts/validate-python.sh**:

```bash
#!/bin/bash
set -euo pipefail

echo "=== Python Validation ==="

## Activate virtual environment
source .venv/bin/activate

## Format check
echo "Checking formatting..."
black --check src/ tests/

## Import sort check
echo "Checking import order..."
isort --check-only src/ tests/

## Linting
echo "Running flake8..."
flake8 src/ tests/

## Type checking
echo "Running mypy..."
mypy src/

## Security
echo "Running bandit..."
bandit -r src/ -ll

## Tests
echo "Running tests..."
pytest tests/ -v --cov=src --cov-report=html --cov-report=term

echo "=== Python Validation Complete ==="
```

**scripts/validate-typescript.sh**:

```bash
#!/bin/bash
set -euo pipefail

echo "=== TypeScript Validation ==="

## Linting
echo "Running ESLint..."
npm run lint

## Format check
echo "Checking formatting..."
npm run format:check

## Type checking
echo "Running type check..."
npm run type-check

## Build
echo "Building..."
npm run build

## Tests
echo "Running tests..."
npm test

echo "=== TypeScript Validation Complete ==="
```

---

## Troubleshooting

### Common Issues

**Python: "ModuleNotFoundError"**:

```bash
## Ensure virtual environment is activated
source .venv/bin/activate

## Reinstall dependencies
pip install -e .
## or
uv pip install -e .
```

**Node.js: "command not found"**:

```bash
## Ensure Node.js is in PATH
nvm use --lts

## Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Terraform: "command not found"**:

```bash
## Verify installation
which terraform

## Reinstall if needed (macOS)
brew reinstall terraform
```

**Pre-commit hooks not running**:

```bash
## Reinstall hooks
pre-commit uninstall
pre-commit install

## Clear cache
pre-commit clean

## Run manually
pre-commit run --all-files
```

### Performance Optimization

**Python: Use faster tools**:

```bash
## Use uv instead of pip
uv pip install -r requirements.txt

## Use ruff instead of flake8 (much faster)
pipx install ruff
```

**Node.js: Use pnpm instead of npm**:

```bash
## Enable pnpm
corepack enable
corepack prepare pnpm@latest --activate

## Install dependencies
pnpm install
```

**Parallel execution**:

```bash
## Run pytest in parallel
pytest -n auto

## Run multiple validation commands
black src/ & isort src/ & flake8 src/ & wait
```

---

## Complete Setup Checklist

- [ ] Install operating system prerequisites
- [ ] Configure Git
- [ ] Install package managers (uv, nvm, rbenv)
- [ ] Install Python tools (black, isort, flake8, mypy, bandit)
- [ ] Install Node.js tools (eslint, prettier, typescript)
- [ ] Install Terraform tools (terraform, terragrunt, tflint, terraform-docs)
- [ ] Install Ansible tools (ansible, ansible-lint)
- [ ] Install shell script tools (shellcheck, shfmt)
- [ ] Install container tools (docker, hadolint, trivy)
- [ ] Install database tools (psql, sqlfluff)
- [ ] Configure editor (VS Code or JetBrains)
- [ ] Install pre-commit hooks
- [ ] Create validation scripts
- [ ] Run full validation

---

## Resources

- [uv Documentation](https://docs.astral.sh/uv/)
- [nvm Documentation](https://github.com/nvm-sh/nvm)
- [Pre-commit Documentation](https://pre-commit.com/)
- [VS Code Python Setup](https://code.visualstudio.com/docs/python/python-tutorial)
- [VS Code TypeScript Setup](https://code.visualstudio.com/docs/typescript/typescript-tutorial)

---

**Next Steps:**

- Review the [Pre-commit Hooks Guide](precommit_hooks_guide.md) for automated validation
- Check [AI Validation Pipeline](ai_validation_pipeline.md) for CI/CD integration
- See [GitHub Actions Guide](github_actions_guide.md) for GitHub CI/CD setup
