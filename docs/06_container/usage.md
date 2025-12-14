---
title: "Container Usage Guide"
description: "Containerized validation tools and integration patterns"
author: "Tyler Dukes"
tags: [docker, containers, validation, cicd, integration]
category: "Container"
status: "active"
---

The Coding Style Guide Validator is available as a containerized tool, making it easy to
integrate validation into any repository without installing dependencies locally.

## Quick Start

### Basic Usage

```bash
## Run full validation on current directory
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate

## Run linters only
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest lint

## Format code in-place
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format
```

## Available Commands

### `validate` (default)

Runs all validation checks:

- Metadata validation
- Linters (Python, YAML, Shell, etc.)
- Documentation build (if `mkdocs.yml` present)

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

### `lint`

Runs linters only without building documentation:

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest lint
```

### `format`

Auto-formats code (Python with Black, Terraform):

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format
```

### `docs`

Builds and validates MkDocs documentation:

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest docs
```

### `metadata`

Validates `@module` metadata tags:

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest metadata
```

## Using with Docker Compose

Create a `docker-compose.yml` in your repository:

```yaml
version: '3.8'

services:
  validate:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: validate
```

Then run:

```bash
## Full validation
docker-compose run --rm validate

## Or specify command
docker-compose run --rm validate lint
```

## GitHub Actions Integration

### Using the Reusable Action

Add to your `.github/workflows/ci.yml`:

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

### Action Inputs

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `mode` | Validation mode: validate, lint, format, docs, metadata | `validate` | No |
| `path` | Path to validate | `.` | No |
| `image` | Container image to use | `ghcr.io/tydukes/coding-style-guide:latest` | No |
| `strict` | Enable strict mode | `false` | No |
| `continue-on-error` | Continue even if validation fails | `false` | No |

### Using Container Directly

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

## CLI Wrapper Script

For easier local usage, use the wrapper script:

```bash
## Download wrapper script
curl -sSL https://raw.githubusercontent.com/tydukes/coding-style-guide/main/scripts/validate-container.sh \
  -o validate-style.sh && chmod +x validate-style.sh

## Run validation
./validate-style.sh validate

## Run with custom workspace
./validate-style.sh lint --workspace /path/to/repo

## Use local image
./validate-style.sh validate --image coding-style-guide:local
```

### Wrapper Options

```bash
./validate-style.sh [COMMAND] [OPTIONS]

Commands:
  validate    Run all validation checks (default)
  lint        Run linters only
  format      Auto-format code
  docs        Build and validate documentation
  metadata    Validate @module metadata tags

Options:
  --workspace DIR     Directory to validate (default: current directory)
  --image IMAGE       Container image to use
  --strict            Fail on warnings
  --debug             Enable debug output
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRICT` | Fail on warnings | `false` |
| `DEBUG` | Enable debug output | `false` |
| `VALIDATOR_IMAGE` | Override container image | `ghcr.io/tydukes/coding-style-guide:latest` |
| `VALIDATOR_WORKSPACE` | Override workspace path | Current directory |

## Pre-commit Hook Integration

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

## GitLab CI Integration

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

## Jenkins Integration

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

## Building Locally

To build and test locally:

```bash
## Build image
docker build -t coding-style-guide:local .

## Test with docker-compose
docker-compose run --rm validator

## Or run directly
docker run --rm -v $(pwd):/workspace coding-style-guide:local validate
```

## Troubleshooting

### Permission Issues

If you encounter permission issues with mounted volumes:

```bash
## Run as current user
docker run --rm -v $(pwd):/workspace \
  --user $(id -u):$(id -g) \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

### Missing Files

Ensure your repository is properly mounted:

```bash
## Verify mount
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest ls -la /workspace
```

### Debug Mode

Enable debug output:

```bash
docker run --rm -v $(pwd):/workspace \
  -e DEBUG=true \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

## Image Tags

- `latest` - Latest stable release from main branch
- `v1.0.0` - Specific version tags
- `v1.0` - Major.minor tags
- `v1` - Major version tags
- `main` - Latest commit on main branch

## Support

For issues or questions:

- GitHub Issues: <https://github.com/tydukes/coding-style-guide/issues>
- Documentation: <https://tydukes.github.io/coding-style-guide/>
