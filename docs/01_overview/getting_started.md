---
title: "Getting Started"
description: "Quick start guide for adopting the Dukes Engineering Style Guide in your projects"
author: "Tyler Dukes"
tags: [getting-started, quickstart, installation, setup, tutorial]
category: "Overview"
status: "active"
---

Welcome to the Dukes Engineering Style Guide! This guide will help you quickly adopt consistent coding standards,
automated validation, and AI-friendly metadata across your projects.

## What is This Style Guide?

The Dukes Engineering Style Guide is a comprehensive, multi-language coding standard that:

- **Enforces consistency** through automated tooling (linters, formatters, validators)
- **Optimizes for AI** with structured metadata that helps AI assistants understand your code
- **Supports multiple languages** (Python, Terraform, Bash, TypeScript, SQL, and more)
- **Provides validation** through pre-commit hooks, CI/CD pipelines, and containerized workflows
- **Documents automatically** using metadata tags for auto-generated documentation

## Who Should Use This?

This style guide is ideal for:

- **DevOps Engineers** working with infrastructure as code (Terraform, Ansible, Kubernetes)
- **Software Engineers** building APIs, services, and applications
- **Teams** looking for consistent coding standards across languages
- **Projects** that want to leverage AI assistants more effectively
- **Organizations** needing automated code quality enforcement

## Quick Start (5 Minutes)

### 1. Add Metadata to a File

Add metadata tags to your code files using language-appropriate comment syntax:

**Python Example**:

```python
"""
@module user_authentication
@description Handles user login, session management, and JWT token generation
@version 1.0.0
@author Your Name
@last_updated 2025-10-28
@dependencies fastapi, pyjwt
@status stable
"""

import jwt
from fastapi import APIRouter

## Your code here...
```

**Terraform Example**:

```hcl
/**
 * @module vpc_networking
 * @description Creates AWS VPC with public/private subnets and NAT gateways
 * @version 2.0.0
 * @author Your Name
 * @last_updated 2025-10-28
 * @dependencies aws_vpc, aws_subnet, aws_nat_gateway
 * @status stable
 */

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  # Your configuration...
}
```

### 2. Validate Metadata

Use the validator to check your metadata:

```bash
## Clone the repository
git clone https://github.com/tydukes/coding-style-guide.git
cd coding-style-guide

## Validate your files
python3 scripts/validate_metadata.py /path/to/your/project

## Or validate specific language files
python3 scripts/validate_metadata.py --language python /path/to/your/src
```

### 3. Set Up Pre-commit Hooks

Add automated validation to your repository:

```bash
## Install pre-commit
pip install pre-commit

## Add .pre-commit-config.yaml to your repo
cat > .pre-commit-config.yaml <<EOF
repos:
  - repo: https://github.com/psf/black
    rev: 24.10.0
    hooks:
      - id: black
  - repo: https://github.com/pycqa/flake8
    rev: 7.1.1
    hooks:
      - id: flake8
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.96.1
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
  - repo: local
    hooks:
      - id: validate-metadata
        name: Validate Metadata
        entry: python3 scripts/validate_metadata.py
        language: python
        files: \.(py|tf|hcl|js|ts|sh|sql)$
EOF

## Install hooks
pre-commit install
```

That's it! Now your code will be validated automatically before every commit.

## Installation Options

### Option 1: Local Installation

**Prerequisites**:

- Python 3.8 or higher
- Git

**Steps**:

1. Clone the repository:

   ```bash
   git clone https://github.com/tydukes/coding-style-guide.git
   cd coding-style-guide
   ```

2. Install Python dependencies:

   ```bash
   # Using uv (recommended)
   pip install uv
   uv sync

   # Or using pip
   pip install -r requirements.txt
   ```

3. Run the documentation server locally:

   ```bash
   uv run mkdocs serve
   # Access at http://127.0.0.1:8000
   ```

### Option 2: Container-Based

**Prerequisites**:

- Docker

**Steps**:

1. Pull the pre-built container:

   ```bash
   docker pull ghcr.io/tydukes/coding-style-guide:latest
   ```

2. Run validation on your project:

   ```bash
   docker run --rm -v $(pwd):/workspace \
     ghcr.io/tydukes/coding-style-guide:latest \
     validate /workspace
   ```

3. See available modes:

   ```bash
   docker run --rm ghcr.io/tydukes/coding-style-guide:latest --help
   ```

   **Available Modes**:
   - `validate` - Full validation (metadata + linting)
   - `lint` - Linting only
   - `format` - Auto-format files
   - `docs` - Build documentation
   - `metadata` - Metadata validation only

### Option 3: GitHub Actions Integration

Add to your `.github/workflows/ci.yml`:

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate Code Standards
        uses: tydukes/coding-style-guide/.github/actions/validate@latest
        with:
          mode: validate  # validate, lint, format, docs, metadata
          path: .
          language: python  # Optional: python, terraform, bash, etc.
```

## Basic Workflow

### 1. Understanding the Metadata Schema

All files should include metadata tags in their headers. The three **required** tags are:

- `@module` - Unique identifier (lowercase with underscores or hyphens)
- `@description` - Brief explanation of what the module does
- `@version` - Semantic version (MAJOR.MINOR.PATCH)

**Recommended tags**:

- `@author` - Module creator
- `@last_updated` - Date of last update (YYYY-MM-DD)
- `@dependencies` - External dependencies

**Optional tags**:

- `@status` - Development status (draft, stable, deprecated, etc.)
- `@security_classification` - Security level (public, internal, confidential)
- `@api_endpoints` - API routes exposed
- `@env` - Target environments (prod, staging, dev)

See the [Metadata Schema Reference](../03_metadata_schema/schema_reference.md) for complete documentation.

### 2. Adding Metadata to Existing Code

**Step 1**: Identify files without metadata

```bash
cd coding-style-guide
python3 scripts/validate_metadata.py /path/to/your/project --output results.json
```

**Step 2**: Add minimal metadata

Start with the three required tags:

```python
"""
@module [infer_from_filename]
@description [TODO: Add description]
@version 0.1.0
"""
```

**Step 3**: Progressively enhance

Add more tags as you go:

```python
"""
@module user_service
@description Handles user account creation, authentication, and profile management
@version 1.0.0
@author Your Name
@last_updated 2025-10-28
@dependencies fastapi, sqlalchemy, pydantic
@status stable
"""
```

### 3. Running Validation

**Validate all files**:

```bash
python3 scripts/validate_metadata.py /path/to/project
```

**Validate specific language**:

```bash
python3 scripts/validate_metadata.py --language python src/
python3 scripts/validate_metadata.py --language terraform infrastructure/
```

**Strict mode** (warnings treated as errors):

```bash
python3 scripts/validate_metadata.py --strict /path/to/project
```

**Export results to JSON**:

```bash
python3 scripts/validate_metadata.py --output validation_results.json /path/to/project
```

### 4. Setting Up Language-Specific Tools

#### Python

```bash
## Install tools
pip install black flake8 mypy

## Add to .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.10.0
    hooks:
      - id: black
  - repo: https://github.com/pycqa/flake8
    rev: 7.1.1
    hooks:
      - id: flake8
```

#### Terraform

```bash
## Install terraform and tflint
brew install terraform tflint

## Add to .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.96.1
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
```

#### Bash

```bash
## Install shellcheck
brew install shellcheck

## Add to .pre-commit-config.yaml
repos:
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.10.0.1
    hooks:
      - id: shellcheck
```

#### TypeScript

```bash
## Install tools
npm install --save-dev prettier eslint @typescript-eslint/parser

## Add to .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v4.0.0-alpha.8
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx]
```

## Common Use Cases

### Use Case 1: New Project Setup

**Goal**: Start a new project with the style guide from day one.

**Steps**:

1. Initialize your repository:

   ```bash
   mkdir my-new-project
   cd my-new-project
   git init
   ```

2. Copy the style guide configuration:

   ```bash
   # Copy pre-commit config
   curl -o .pre-commit-config.yaml \
     https://raw.githubusercontent.com/tydukes/coding-style-guide/main/.pre-commit-config.yaml

   # Install pre-commit
   pip install pre-commit
   pre-commit install
   ```

3. Add metadata to your first file:

   ```python
   """
   @module main
   @description Application entry point
   @version 0.1.0
   @author Your Name
   @last_updated 2025-10-28
   """

   def main():
       print("Hello, World!")

   if __name__ == "__main__":
       main()
   ```

4. Commit and validate:

   ```bash
   git add .
   git commit -m "feat: initial project setup with style guide"
   ```

### Use Case 2: Migrating Existing Project

**Goal**: Add the style guide to an existing codebase.

**Steps**:

1. Run validation to see current state:

   ```bash
   python3 /path/to/coding-style-guide/scripts/validate_metadata.py . --output baseline.json
   ```

2. Create a migration plan:

   ```bash
   # Count files needing metadata
   jq '.errors | length' baseline.json

   # Identify most critical files (entry points, APIs, core modules)
   ```

3. Add metadata incrementally:

   - Start with core modules (entry points, main services)
   - Move to API endpoints and business logic
   - Finally, utilities and helpers

4. Set up pre-commit hooks:

   ```bash
   pip install pre-commit
   # Copy .pre-commit-config.yaml from style guide
   pre-commit install
   ```

5. Track progress:

   ```bash
   # Re-run validation periodically
   python3 scripts/validate_metadata.py . --output progress.json

   # Compare error counts
   diff baseline.json progress.json
   ```

### Use Case 3: CI/CD Integration

**Goal**: Enforce standards in your CI/CD pipeline.

**GitHub Actions**:

```yaml
## .github/workflows/ci.yml
name: Code Quality

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install black flake8 mypy
          pip install pre-commit

      - name: Run pre-commit
        run: pre-commit run --all-files

      - name: Validate metadata
        run: |
          git clone https://github.com/tydukes/coding-style-guide.git
          python3 coding-style-guide/scripts/validate_metadata.py . --strict
```

**GitLab CI**:

```yaml
## .gitlab-ci.yml
validate:
  image: ghcr.io/tydukes/coding-style-guide:latest
  script:
    - validate /builds/$CI_PROJECT_PATH
  only:
    - merge_requests
    - main
```

### Use Case 4: Team Onboarding

**Goal**: Help new team members adopt the style guide.

**Onboarding Checklist**:

```markdown
## Style Guide Onboarding

- [ ] Read [Core Principles](principles.md)
- [ ] Install pre-commit hooks: `pre-commit install`
- [ ] Review language-specific guide for your primary language
- [ ] Add metadata to at least one file
- [ ] Run validation: `python3 scripts/validate_metadata.py /path/to/your/file`
- [ ] Make a commit and verify pre-commit hooks run
- [ ] Review [Metadata Schema Reference](../03_metadata_schema/schema_reference.md)
```

**Team Training Session Outline**:

1. **Introduction (10 min)**: Why we use a style guide
2. **Core Concepts (15 min)**: Metadata schema, automation, AI optimization
3. **Hands-on Practice (20 min)**: Add metadata to real code files
4. **Validation (10 min)**: Run validators and fix issues
5. **Q&A (5 min)**: Common questions and troubleshooting

## Troubleshooting

### Issue: Pre-commit Hooks Failing

**Symptom**: Commit blocked with "black" or "flake8" errors

**Solution**:

```bash
## Run black to auto-format
black .

## Check flake8 errors
flake8 .

## Fix errors and try again
git add .
git commit -m "fix: address linting issues"
```

### Issue: Metadata Validation Failing

**Symptom**: `validate_metadata.py` reports missing or invalid tags

**Solution**:

```bash
## Check which files are failing
python3 scripts/validate_metadata.py . --output errors.json
cat errors.json | jq '.errors'

## Add missing tags
## Fix version format (use MAJOR.MINOR.PATCH)
## Fix date format (use YYYY-MM-DD)
```

### Issue: Duplicate Module Names

**Symptom**: Validator reports "Duplicate module name"

**Solution**:

```bash
## Find duplicates
grep -r "@module your_module_name" .

## Rename one of the modules to be unique
## Module names should describe the specific purpose
```

### Issue: Container Permission Denied

**Symptom**: Docker container can't write to mounted volume

**Solution**:

```bash
## Run with user permissions
docker run --rm -v $(pwd):/workspace \
  --user $(id -u):$(id -g) \
  ghcr.io/tydukes/coding-style-guide:latest \
  validate /workspace
```

## Next Steps

### 1. Explore Language Guides

Pick the language guide relevant to your work:

- [Python Style Guide](../02_language_guides/python.md)
- [Terraform Style Guide](../02_language_guides/terraform.md)
- [Bash Style Guide](../02_language_guides/bash.md)
- [TypeScript Style Guide](../02_language_guides/typescript.md)

### 2. Review Advanced Topics

- [Metadata Schema Reference](../03_metadata_schema/schema_reference.md) - Complete tag documentation
- [Governance Model](governance.md) - Branching, PRs, and release processes
- [Repository Structure](structure.md) - Monorepo vs multi-repo patterns
- [CI/CD Patterns](../05_ci_cd/ai_validation_pipeline.md) - Advanced pipeline integration

### 3. Integrate with Your Workflow

- Add GitHub Actions or GitLab CI validation
- Set up automated documentation generation
- Configure IDE extensions for real-time validation
- Create team-specific customizations

### 4. Contribute Back

Found something missing or incorrect?

1. Open an issue: [GitHub Issues](https://github.com/tydukes/coding-style-guide/issues)
2. Submit a pull request: [Contributing Guide](https://github.com/tydukes/coding-style-guide/blob/main/CONTRIBUTING.md)

## See Also

### Core Documentation

- [Principles](principles.md) - Style guide philosophy and core values
- [Governance](governance.md) - Decision-making and contribution process
- [Structure](structure.md) - Repository organization patterns
- [Metadata Schema](../03_metadata_schema/schema_reference.md) - Frontmatter requirements

### Popular Language Guides

- [Python Style Guide](../02_language_guides/python.md) - Python development standards
- [TypeScript Style Guide](../02_language_guides/typescript.md) - TypeScript development standards
- [Terraform Style Guide](../02_language_guides/terraform.md) - Infrastructure as Code standards
- [Bash Style Guide](../02_language_guides/bash.md) - Shell scripting standards

### Development Setup

- [IDE Integration Guide](../05_ci_cd/ide_integration_guide.md) - Editor setup for validation
- [Pre-commit Hooks Guide](../05_ci_cd/precommit_hooks_guide.md) - Local validation hooks
- [Local Validation Setup](../05_ci_cd/local_validation_setup.md) - Development environment

### CI/CD Integration

- [GitHub Actions Guide](../05_ci_cd/github_actions_guide.md) - GitHub workflow examples
- [GitLab CI Guide](../05_ci_cd/gitlab_ci_guide.md) - GitLab pipeline examples
- [Jenkins Pipeline Guide](../05_ci_cd/jenkins_pipeline_guide.md) - Jenkins configuration
- [AI Validation Pipeline](../05_ci_cd/ai_validation_pipeline.md) - Automated code review

### Templates & Examples

- [README Template](../04_templates/README_template.md) - Project documentation
- [Python Package Template](../04_templates/python_package_template.md) - Python project structure
- [Terraform Module Template](../04_templates/terraform_module_template.md) - Terraform module structure

### Container Usage

- [Container Usage Guide](../06_container/usage.md) - Docker-based validation
- [Integration Guide](../07_integration/integration_prompt.md) - Integrate into your projects

## Resources

### Documentation

- [Full Documentation Site](https://tydukes.github.io/coding-style-guide/)
- [GitHub Repository](https://github.com/tydukes/coding-style-guide)
- [Changelog](../changelog.md)

### Tools

- [Metadata Validator](https://github.com/tydukes/coding-style-guide/blob/main/scripts/validate_metadata.py)
- [GitHub Action](https://github.com/tydukes/coding-style-guide/tree/main/.github/actions/validate)

### Community

- [Code of Conduct](https://github.com/tydukes/coding-style-guide/blob/main/CODE_OF_CONDUCT.md)
- [Contributing Guidelines](https://github.com/tydukes/coding-style-guide/blob/main/CONTRIBUTING.md)
- [Security Policy](https://github.com/tydukes/coding-style-guide/blob/main/SECURITY.md)

## Frequently Asked Questions

### Q: Do I need to add metadata to every file?

**A**: Yes, all code modules should have metadata. However, you can migrate incrementally - start with core modules
and expand over time.

### Q: Can I customize the metadata schema?

**A**: Yes! The schema is extensible. You can add custom tags for your organization's needs. Just document them
and update your validation scripts.

### Q: What if my language isn't supported?

**A**: The metadata schema is language-agnostic. Use the appropriate comment syntax for your language and follow
the same tag format. You can also contribute a new language guide!

### Q: Do I need to use all the tools (Black, Flake8, etc.)?

**A**: No, pick the tools that make sense for your project. At minimum, we recommend using the metadata validator
and formatters for your primary languages.

### Q: How do I handle legacy code?

**A**: Add metadata as you touch files. Use the `@status deprecated` tag for code that's being phased out.
Consider creating a migration plan to add metadata incrementally.

### Q: Can I use this with monorepos?

**A**: Absolutely! The style guide works great with monorepos. See the [Repository Structure guide](structure.md)
for monorepo-specific patterns.

---

**Ready to get started?** Choose your path:

- **New Project**: Follow [Use Case 1: New Project Setup](#use-case-1-new-project-setup)
- **Existing Project**: Follow [Use Case 2: Migrating Existing Project](#use-case-2-migrating-existing-project)
- **CI/CD Integration**: Follow [Use Case 3: CI/CD Integration](#use-case-3-cicd-integration)
- **Team Adoption**: Follow [Use Case 4: Team Onboarding](#use-case-4-team-onboarding)

For questions or support, please open an issue on [GitHub](https://github.com/tydukes/coding-style-guide/issues).
