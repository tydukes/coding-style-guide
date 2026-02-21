# DevOps Engineering Style Guide

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-mkdocs-blue.svg)](https://tydukes.github.io/coding-style-guide/)
[![Build Status](https://github.com/tydukes/coding-style-guide/actions/workflows/deploy.yml/badge.svg)](https://github.com/tydukes/coding-style-guide/actions/workflows/deploy.yml)
[![CI Status](https://github.com/tydukes/coding-style-guide/actions/workflows/ci.yml/badge.svg)](https://github.com/tydukes/coding-style-guide/actions/workflows/ci.yml)
[![Container](https://github.com/tydukes/coding-style-guide/actions/workflows/container.yml/badge.svg)](https://github.com/tydukes/coding-style-guide/actions/workflows/container.yml)
[![Dependencies](https://github.com/tydukes/coding-style-guide/actions/workflows/dependencies.yml/badge.svg)](https://github.com/tydukes/coding-style-guide/actions/workflows/dependencies.yml)
[![Link Checker](https://github.com/tydukes/coding-style-guide/actions/workflows/link-checker.yml/badge.svg)](https://github.com/tydukes/coding-style-guide/actions/workflows/link-checker.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Code-to-Text Ratio](https://img.shields.io/badge/code--to--text%20ratio-2.38:1-yellow.svg)](https://tydukes.github.io/coding-style-guide/project_status/)
[![Guides Passing](https://img.shields.io/badge/guides%20passing-18%2F19-success.svg)](https://tydukes.github.io/coding-style-guide/project_status/)
[![Documentation Pages](https://img.shields.io/badge/docs%20pages-73-blue.svg)](https://tydukes.github.io/coding-style-guide/)
[![Version](https://img.shields.io/github/v/release/tydukes/coding-style-guide)](https://github.com/tydukes/coding-style-guide/releases)
[![Last Commit](https://img.shields.io/github/last-commit/tydukes/coding-style-guide)](https://github.com/tydukes/coding-style-guide/commits/main)
[![Contributors](https://img.shields.io/github/contributors/tydukes/coding-style-guide)](https://github.com/tydukes/coding-style-guide/graphs/contributors)
[![Issues](https://img.shields.io/github/issues/tydukes/coding-style-guide)](https://github.com/tydukes/coding-style-guide/issues)
[![PRs](https://img.shields.io/github/issues-pr/tydukes/coding-style-guide)](https://github.com/tydukes/coding-style-guide/pulls)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

> **A comprehensive, multi-language coding style guide with automated validation tools**

---

## What Is This?

The DevOps Engineering Style Guide is a production-ready coding standards framework designed for
**DevOps engineers, platform teams, and software development organizations** who need consistent,
secure, and AI-optimized code across multiple languages and tools.

### Key Benefits

- **Multi-Language Coverage**: 19 language-specific guides (Terraform, Python, Ansible, TypeScript, Bash, and more)
- **Automated Validation**: Containerized tools for linting, formatting, and metadata validation
- **Zero Local Setup**: Run validation via Docker without installing dependencies
- **CI/CD Ready**: GitHub Actions, GitLab CI, and Jenkins integration examples
- **AI-Optimized Standards**: "Show, don't tell" philosophy with 3:1 code-to-text ratio
- **Production-Tested**: Used in enterprise DevOps environments

### Who Should Use This?

- **DevOps Teams**: Standardize Infrastructure as Code (Terraform, Ansible, Kubernetes)
- **Development Teams**: Enforce consistent Python, TypeScript, and Bash standards
- **Platform Engineers**: Validate multi-repo projects with a single container
- **Open Source Maintainers**: Integrate comprehensive validation in CI/CD pipelines

---

## Quick Start

### Try It Now

Validate any project in seconds:

```bash
# Run full validation on current directory
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

### Common Scenarios

#### Python Project

```bash
# Validate Python code with Black and Flake8
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest lint

# Auto-format Python code
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format
```

#### Terraform Module

```bash
# Validate Terraform with fmt and validate
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate

# Validate metadata tags in IaC modules
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest metadata
```

#### Multi-Language Repository

```bash
# Run all validation checks (linters, formatters, metadata)
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

#### Documentation Site

```bash
# Build MkDocs documentation with strict validation
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest docs
```

---

## Using This Guide

### Container Modes

The containerized validator provides 5 specialized modes:

#### `validate` - Full Validation Suite

Runs all checks: metadata validation, linters, and documentation build (if `mkdocs.yml` present).

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

**What it checks:**

- Metadata tags (`@module`, `@version`, `@description`)
- Python (Black formatting, Flake8 linting)
- YAML (yamllint)
- Shell scripts (shellcheck)
- Markdown (markdownlint)
- Terraform (fmt, validate)
- MkDocs site build (if applicable)

#### `lint` - Linters Only

Faster validation without documentation build - ideal for CI pipelines.

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest lint
```

#### `format` - Auto-Format Code

Automatically formats code in-place (Python with Black, Terraform with fmt).

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format
```

#### `docs` - Build Documentation

Builds and validates MkDocs documentation with strict mode enabled.

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest docs
```

#### `metadata` - Validate Metadata Tags

Validates universal `@module` metadata tags across all languages.

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest metadata
```

### Using with Docker Compose

Create `docker-compose.yml` in your project:

```yaml
version: '3.8'

services:
  validate:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: validate

  lint:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: lint

  format:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: format
```

Then run:

```bash
# Full validation
docker-compose run --rm validate

# Linters only
docker-compose run --rm lint

# Auto-format code
docker-compose run --rm format
```

---

## What's Included

### 19 Language Guides

**Infrastructure as Code:**

- Terraform
- Terragrunt
- AWS CDK (TypeScript)
- Kubernetes/Helm (YAML)
- Ansible
- Docker (Dockerfile)
- Docker Compose (YAML)

**Programming Languages:**

- Python
- TypeScript
- Bash
- PowerShell
- SQL
- Groovy (Jenkins)

**Configuration & Data:**

- YAML
- JSON

**CI/CD:**

- GitHub Actions (YAML)
- GitLab CI/CD (YAML)

**Build Tools:**

- Makefile

### Validation Tools Included

- **Python**: Black (formatter), Flake8 (linter)
- **YAML**: yamllint
- **Shell**: shellcheck
- **Markdown**: markdownlint
- **Terraform**: fmt, validate, docs
- **Pre-commit**: Full hook suite
- **Metadata**: Universal @module tag validator

### Templates & Examples

- **CONTRACT.md**: Contract-based IaC module development
- **TESTING.md**: Comprehensive testing standards
- **IDE Settings**: VS Code, IntelliJ, EditorConfig templates
- **CI/CD Examples**: GitHub Actions, GitLab CI, Jenkins patterns

---

## Integration Examples

### GitHub Actions

Use the reusable action in `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  validate-coding-standards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate coding standards
        uses: tydukes/coding-style-guide/.github/actions/validate@main
        with:
          mode: validate
          path: .
```

Or use the container directly:

```yaml
name: CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate coding standards
        run: |
          docker run --rm -v $PWD:/workspace \
            ghcr.io/tydukes/coding-style-guide:latest validate
```

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
validate-coding-standards:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker run --rm -v $CI_PROJECT_DIR:/workspace
        ghcr.io/tydukes/coding-style-guide:latest validate
  only:
    - merge_requests
    - main
```

### Pre-commit Hooks

Add to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: coding-style-validator
        name: Validate Coding Standards
        entry: docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest
        args: [lint]
        language: system
        pass_filenames: false
        always_run: true
```

### Jenkins

Add to `Jenkinsfile`:

```groovy
pipeline {
    agent any

    stages {
        stage('Validate Coding Standards') {
            steps {
                script {
                    docker.image('ghcr.io/tydukes/coding-style-guide:latest').inside {
                        sh 'validate'
                    }
                }
            }
        }
    }
}
```

---

## IDE Setup

This repository includes **pre-configured IDE settings** that automatically enforce the style guide
standards. Copy these files to your project for instant compliance.

### VS Code

```bash
# Copy VS Code settings
cp -r .vscode your-project/

# Install recommended extensions (prompted automatically when opening the project)
```

The `.vscode/settings.json` file includes:

- Black formatter for Python (100 char line)
- Flake8 linting (ignores E203, W503)
- yamllint integration (120 char line)
- markdownlint with custom rules
- shellcheck integration
- Terraform language server with auto-format
- Format on save for all languages

### IntelliJ/PyCharm

```bash
# Copy IntelliJ settings
cp -r .idea your-project/
```

Includes:

- Code style settings for all languages
- Inspection profiles matching linting standards
- Auto-format on save configuration

### EditorConfig (Universal)

```bash
# Copy EditorConfig (works with all editors)
cp .editorconfig your-project/
```

EditorConfig provides language-specific indentation and line endings that work across all editors
(VS Code, IntelliJ, Vim, Emacs, etc.).

**Supported languages:** Python, Terraform, YAML, Bash, TypeScript, Markdown, SQL, PowerShell,
Groovy, and more.

For detailed setup instructions, see the
[IDE Settings Template](https://tydukes.github.io/coding-style-guide/04_templates/ide_settings_template/).

---

## Local Development

### Prerequisites

- Python 3.10+
- [uv package manager](https://docs.astral.sh/uv/)

### Building & Serving Documentation

```bash
# Install dependencies using uv
uv sync

# Start the development server
mkdocs serve
```

Visit <http://127.0.0.1:8000> to view the documentation.

### Validation & Testing

```bash
# Validate @module metadata tags in all documentation
uv run python scripts/validate_metadata.py docs/

# Analyze code-to-text ratio in language guides (target: 3:1)
uv run python scripts/analyze_code_ratio.py

# Run pre-commit linters
bash scripts/pre_commit_linter.sh

# Run all pre-commit hooks
pre-commit run --all-files
```

---

## Learn More

### Full Documentation

Comprehensive documentation is available at:

**[https://tydukes.github.io/coding-style-guide/](https://tydukes.github.io/coding-style-guide/)**

### Key Documentation Sections

- **[Language Guides](https://tydukes.github.io/coding-style-guide/02_language_guides/)**:
  In-depth guides for all 19 languages
- **[Container Usage](https://tydukes.github.io/coding-style-guide/06_container/usage/)**:
  Advanced container integration patterns
- **[CI/CD Integration](https://tydukes.github.io/coding-style-guide/05_ci_cd/)**:
  Testing standards and pipeline examples
- **[Templates](https://tydukes.github.io/coding-style-guide/04_templates/)**:
  CONTRACT.md, TESTING.md, and more
- **[Examples](https://tydukes.github.io/coding-style-guide/05_examples/)**:
  Full reference implementations

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## Security

See our [Security Policy](SECURITY.md) for reporting vulnerabilities.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

Tyler Dukes

- GitHub: [@tydukes](https://github.com/tydukes)
- LinkedIn: [tydukes](https://linkedin.com/in/tydukes)

---

**Ready to get started?** Run your first validation:

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```
