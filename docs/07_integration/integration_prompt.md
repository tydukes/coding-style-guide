---
title: "Integration Guide"
description: "Guide for integrating style standards with AI assistants and development workflows"
author: "Tyler Dukes"
tags: [integration, ai, claude, workflow, automation]
category: "Integration"
status: "active"
search_keywords: [integration, ai, prompt, code review, style guide, automation]
---

Use this prompt to quickly integrate the coding style guide validator into any codebase.

---

## Copy-Paste Prompt for Claude Code

```markdown
I need to integrate the coding style guide validator into this repository. The validator is
available as a containerized tool that can be used via GitHub Actions, locally with Docker,
or through a Makefile.

Please implement the following:

## 1. GitHub Actions Integration (Recommended)

Create \`.github/workflows/validate-coding-standards.yml\` with:

\`\`\`yaml
name: Validate Coding Standards

"on":
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate coding standards
        uses: tydukes/coding-style-guide/.github/actions/validate@latest
        with:
          mode: validate
          path: .
\`\`\`

## 2. Local Development Support

### Option A: Create a Makefile

Add these targets to the repository \`Makefile\` (or create one):

\`\`\`makefile
## Coding style validation targets
.PHONY: validate lint format validate-docs

IMAGE ?= ghcr.io/tydukes/coding-style-guide:latest

validate: ## Run full coding standards validation
 @docker run --rm -v $$(pwd):/workspace $(IMAGE) validate

lint: ## Run linters only
 @docker run --rm -v $$(pwd):/workspace $(IMAGE) lint

format: ## Auto-format code
 @docker run --rm -v $$(pwd):/workspace $(IMAGE) format

validate-docs: ## Validate documentation (if mkdocs.yml exists)
 @docker run --rm -v $$(pwd):/workspace $(IMAGE) docs
\`\`\`

### Option B: Create a Shell Script

Create \`scripts/validate.sh\`:

\`\`\`bash
#!/usr/bin/env bash
## Validate coding standards using containerized validator

set -euo pipefail

IMAGE="${VALIDATOR_IMAGE:-ghcr.io/tydukes/coding-style-guide:latest}"
COMMAND="${1:-validate}"

docker run --rm -v "$(pwd):/workspace" "${IMAGE}" "${COMMAND}"
\`\`\`

Make it executable: \`chmod +x scripts/validate.sh\`

## 3. Pre-commit Hook (Optional)

If the repository uses pre-commit, add to \`.pre-commit-config.yaml\`:

\`\`\`yaml
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
\`\`\`

## 4. Documentation

Update the repository README.md with a "Code Quality" section:

\`\`\`markdown
## Code Quality

This repository uses the [Coding Style Guide](https://github.com/tydukes/coding-style-guide)
validator to ensure consistent code quality.

### Running Validation Locally

Using Docker:
\`\`\`bash
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest validate
\`\`\`

Using Makefile:
\`\`\`bash
make validate  # Full validation
make lint      # Linters only
make format    # Auto-format
\`\`\`

Using shell script:
\`\`\`bash
./scripts/validate.sh validate
\`\`\`

### Available Commands

- \`validate\` - Run all checks (linting, docs, metadata)
- \`lint\` - Run linters only
- \`format\` - Auto-format code
- \`docs\` - Validate documentation (if mkdocs.yml present)
- \`metadata\` - Check @module metadata tags
\`\`\`

## 5. GitLab CI (If Applicable)

If this is a GitLab repository, create/update \`.gitlab-ci.yml\`:

\`\`\`yaml
stages:
  - validate

validate-coding-standards:
  stage: validate
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker run --rm -v $CI_PROJECT_DIR:/workspace
        ghcr.io/tydukes/coding-style-guide:latest validate
  only:
    - merge_requests
    - main
    - develop
\`\`\`

## Requirements

- Ensure Docker is available for local development
- For GitHub Actions, no additional setup needed
- For GitLab CI, Docker-in-Docker (dind) service required

## Implementation Instructions

1. Create the GitHub Actions workflow file
2. Choose ONE of the local development options (Makefile OR shell script)
3. Update the README with code quality section
4. (Optional) Add pre-commit hook if the repo uses pre-commit
5. Test locally: \`make validate\` or \`./scripts/validate.sh\`
6. Commit and push to trigger CI validation

Please implement all applicable options based on the repository structure and platform.
\`\`\`

---

## Alternative: Minimal Integration Prompt

If you only want GitHub Actions integration:

```markdown
Add coding style validation to this repository using the containerized validator.

Create \`.github/workflows/validate-coding-standards.yml\`:

\`\`\`yaml
name: Validate Coding Standards

"on":
  push:
    branches: [main, develop]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: tydukes/coding-style-guide/.github/actions/validate@latest
        with:
          mode: validate
\`\`\`

Add a Makefile with validation targets:

\`\`\`makefile
.PHONY: validate lint format

IMAGE ?= ghcr.io/tydukes/coding-style-guide:latest

validate:
 @docker run --rm -v $$(pwd):/workspace $(IMAGE) validate

lint:
 @docker run --rm -v $$(pwd):/workspace $(IMAGE) lint

format:
 @docker run --rm -v $$(pwd):/workspace $(IMAGE) format
\`\`\`

Update README.md to document the validation process.

Test locally with: \`make validate\`
\`\`\`

---

## Platform-Specific Prompts

### For GitHub Repositories

```markdown
Integrate the coding style guide validator into this GitHub repository:

1. Add GitHub Actions workflow at \`.github/workflows/validate-coding-standards.yml\`
   - Use the reusable action: \`tydukes/coding-style-guide/.github/actions/validate@latest\`
   - Trigger on push to main/develop and all pull requests
   - Use validation mode: \`validate\`

2. Add Makefile targets for local validation:
   - \`make validate\` - full validation
   - \`make lint\` - linters only
   - \`make format\` - auto-format code

3. Update README.md with instructions on running validation locally

4. Ensure the workflow is configured to run as a required status check (mention this in PR)

Use container: \`ghcr.io/tydukes/coding-style-guide:latest\`
\`\`\`

### For GitLab Repositories

```markdown
Integrate the coding style guide validator into this GitLab repository:

1. Add validation job to \`.gitlab-ci.yml\`:
   - Stage: validate
   - Use Docker-in-Docker
   - Run: \`docker run --rm -v $CI_PROJECT_DIR:/workspace ghcr.io/tydukes/coding-style-guide:latest validate\`
   - Trigger on: merge_requests, main, develop

2. Create local validation script at \`scripts/validate.sh\`
   - Make it executable
   - Use container: \`ghcr.io/tydukes/coding-style-guide:latest\`

3. Update README.md with validation instructions

4. Add Makefile with validation targets (optional)
\`\`\`

### For Local/Team Development

```markdown
Set up coding style validation for local development:

1. Create \`Makefile\` with these targets:
   - validate, lint, format, validate-docs
   - Use container: \`ghcr.io/tydukes/coding-style-guide:latest\`

2. Create \`scripts/validate.sh\` wrapper script
   - Accept command as first argument (validate, lint, format)
   - Use docker volume mount to current directory

3. Add pre-commit hook configuration (if .pre-commit-config.yaml exists)

4. Create \`CONTRIBUTING.md\` with instructions:
   - How to run validation before committing
   - Available validation commands
   - How to auto-format code

5. Update main README.md with "Code Quality" section
\`\`\`

---

## Customization Options

You can customize the integration by modifying the prompt:

### Different Validation Modes

Replace \`mode: validate\` with:

- \`mode: lint\` - Only run linters (faster, no docs build)
- \`mode: format\` - Auto-format code
- \`mode: docs\` - Only validate documentation
- \`mode: metadata\` - Only check metadata tags

### Specific Container Version

Replace \`v1.0.0\` with:

- \`latest\` - Always use latest version (may break)
- \`v1.0.0\` - Pin to specific version (recommended)
- \`main\` - Use latest main branch build

### Additional Configuration

Add to the GitHub Action:

```yaml
- uses: tydukes/coding-style-guide/.github/actions/validate@latest
  with:
    mode: validate
    path: .
    strict: true              # Fail on warnings
    continue-on-error: false  # Don't continue if validation fails
```

---

## Complete Example Integration

Here's a complete prompt for full integration:

```markdown
Integrate the tydukes/coding-style-guide validator into this repository with the following:

## GitHub Actions
Create \`.github/workflows/validate-coding-standards.yml\` that:
- Triggers on push to main/develop and all PRs
- Uses the reusable action: \`tydukes/coding-style-guide/.github/actions/validate@latest\`
- Runs in validation mode
- Should be a required check for PRs

## Local Development
Add a \`Makefile\` with these targets:
- \`make validate\` - Full validation
- \`make lint\` - Linters only
- \`make format\` - Auto-format code
- \`make help\` - Show available targets

All targets should use: \`ghcr.io/tydukes/coding-style-guide:latest\`

## Documentation
Update \`README.md\` with a new "Code Quality" section that explains:
- How to run validation locally
- Available make commands
- Link to the coding style guide documentation: https://tydukes.github.io/coding-style-guide/

## Optional Enhancements
If this repo has:
- \`.pre-commit-config.yaml\` - Add validator hook
- \`.gitlab-ci.yml\` - Add validation job
- \`CONTRIBUTING.md\` - Add validation instructions

Container: \`ghcr.io/tydukes/coding-style-guide:latest\`
Documentation: https://tydukes.github.io/coding-style-guide/

Please implement all applicable options based on the repository structure.
\`\`\`

---

## Quick Reference

**Container Image**: `ghcr.io/tydukes/coding-style-guide:latest`

**GitHub Action**: `tydukes/coding-style-guide/.github/actions/validate@latest`

**Documentation**: <https://tydukes.github.io/coding-style-guide/>

**Commands**: `validate`, `lint`, `format`, `docs`, `metadata`

**Repository**: <https://github.com/tydukes/coding-style-guide>
