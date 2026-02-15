---
title: "Task Runners Style Guide"
description: "Standards for local development scripts using Task (Taskfile.yml) and Just command runners"
author: "Tyler Dukes"
tags: [task, just, taskfile, command-runner, automation, devops]
category: "Language Guides"
status: "active"
search_keywords: [task, just, task runners, build automation, taskfile, justfile, make alternative]
---

## Language Overview

**Task runners** are tools for automating common development tasks like building, testing, linting, and deploying
applications. This guide covers **Task** (Taskfile.yml) and **Just** as modern alternatives to Make, with emphasis
on cross-platform compatibility and developer experience.

### Key Characteristics

| Tool | Configuration File | Language | Cross-Platform | Key Features |
|------|-------------------|----------|----------------|--------------|
| **Task** | `Taskfile.yml` | YAML | Yes (Go binary) | Dependencies, variables, includes |
| **Just** | `justfile` | Custom DSL | Yes (Rust binary) | Recipes, arguments, shell selection |
| **Make** | `Makefile` | Custom DSL | Partial | Widely available, dependencies |

### When to Use Each Tool

```text
Use Task when:
├── Cross-platform compatibility is critical
├── Team prefers YAML configuration
├── Need complex variable interpolation
└── Want built-in task watching/live reload

Use Just when:
├── Need simple, readable command definitions
├── Want shell flexibility (bash, sh, powershell)
├── Prefer minimal syntax over YAML
└── Need command-line argument passing

Use Make when:
├── Project already uses Makefiles
├── Need file-based dependency tracking
├── Working in Unix-heavy environments
└── Team is familiar with Make syntax
```

---

## Quick Reference

| **Category** | **Task** | **Just** | **Make** |
|-------------|----------|----------|----------|
| **File** | `Taskfile.yml` | `justfile` | `Makefile` |
| **Install** | `brew install go-task` | `brew install just` | Built-in |
| **Run** | `task <name>` | `just <name>` | `make <name>` |
| **List** | `task --list` | `just --list` | `make help` |
| **Dependencies** | `deps: [task1, task2]` | Recipe ordering | Prerequisites |
| **Variables** | `vars:` block | `variable := value` | `VAR = value` |
| **Comments** | `# comment` | `# comment` | `# comment` |
| **Silence** | `silent: true` | `@command` | `@command` |

---

## Task (Taskfile.yml)

### Installation

```bash
## macOS
brew install go-task

## Linux (script)
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin

## Windows (scoop)
scoop install task

## Windows (chocolatey)
choco install go-task

## Go install
go install github.com/go-task/task/v3/cmd/task@latest

## Verify installation
task --version
```

### Basic Structure

```yaml
## Taskfile.yml
version: '3'

vars:
  BINARY_NAME: myapp
  BUILD_DIR: ./build

tasks:
  default:
    desc: Show available tasks
    cmds:
      - task --list

  build:
    desc: Build the application
    cmds:
      - go build -o {{.BUILD_DIR}}/{{.BINARY_NAME}} .

  test:
    desc: Run test suite
    cmds:
      - go test -v ./...

  clean:
    desc: Clean build artifacts
    cmds:
      - rm -rf {{.BUILD_DIR}}
```

### Task Dependencies

```yaml
## Taskfile.yml
version: '3'

tasks:
  deps:
    desc: Install dependencies
    cmds:
      - go mod download

  build:
    desc: Build application
    deps: [deps]  # Run deps first
    cmds:
      - go build -o bin/app .

  test:
    desc: Run tests
    deps: [build]  # Run build first
    cmds:
      - go test ./...

  all:
    desc: Build and test
    deps:
      - build
      - test

  ## Parallel execution
  lint-all:
    desc: Run all linters in parallel
    deps:
      - task: lint-go
      - task: lint-yaml
      - task: lint-markdown

  lint-go:
    cmds:
      - golangci-lint run

  lint-yaml:
    cmds:
      - yamllint .

  lint-markdown:
    cmds:
      - markdownlint "**/*.md"
```

### Variables and Environment

```yaml
## Taskfile.yml
version: '3'

## Global variables
vars:
  VERSION:
    sh: git describe --tags --always
  BUILD_TIME:
    sh: date -u +"%Y-%m-%dT%H:%M:%SZ"
  GOOS: linux
  GOARCH: amd64

## Environment variables
env:
  CGO_ENABLED: "0"
  GO111MODULE: "on"

## Dynamic variables from commands
dotenv: ['.env', '.env.local']

tasks:
  build:
    desc: Build with version info
    vars:
      LDFLAGS: >-
        -X main.Version={{.VERSION}}
        -X main.BuildTime={{.BUILD_TIME}}
    cmds:
      - go build -ldflags "{{.LDFLAGS}}" -o bin/app .

  print-vars:
    desc: Print all variables
    cmds:
      - echo "Version: {{.VERSION}}"
      - echo "Build Time: {{.BUILD_TIME}}"
      - echo "OS/Arch: {{.GOOS}}/{{.GOARCH}}"

  ## Task-specific variables
  deploy:
    desc: Deploy to environment
    vars:
      DEPLOY_ENV: '{{.DEPLOY_ENV | default "staging"}}'
    cmds:
      - echo "Deploying to {{.DEPLOY_ENV}}"
      - ./deploy.sh {{.DEPLOY_ENV}}
```

### Conditional Execution

```yaml
## Taskfile.yml
version: '3'

tasks:
  build:
    desc: Build application
    sources:
      - "**/*.go"
      - go.mod
      - go.sum
    generates:
      - bin/app
    cmds:
      - go build -o bin/app .

  ## Only run if sources changed
  test:
    desc: Run tests if code changed
    sources:
      - "**/*.go"
    cmds:
      - go test ./...

  ## Platform-specific tasks
  install-deps:
    desc: Install system dependencies
    cmds:
      - task: install-deps-{{OS}}

  install-deps-darwin:
    internal: true
    cmds:
      - brew install golangci-lint

  install-deps-linux:
    internal: true
    cmds:
      - curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh

  install-deps-windows:
    internal: true
    cmds:
      - choco install golangci-lint

  ## Conditional based on variable
  deploy:
    desc: Deploy application
    preconditions:
      - sh: test -f bin/app
        msg: "Binary not found. Run 'task build' first."
      - sh: test -n "$DEPLOY_TOKEN"
        msg: "DEPLOY_TOKEN environment variable required."
    cmds:
      - ./deploy.sh
```

### Including Other Taskfiles

```yaml
## Taskfile.yml
version: '3'

includes:
  docker: ./taskfiles/Docker.yml
  k8s: ./taskfiles/Kubernetes.yml
  ci:
    taskfile: ./taskfiles/CI.yml
    dir: ./ci
    optional: true

tasks:
  all:
    desc: Run all tasks
    cmds:
      - task: docker:build
      - task: k8s:deploy
```

```yaml
## taskfiles/Docker.yml
version: '3'

vars:
  IMAGE_NAME: myapp
  IMAGE_TAG: latest

tasks:
  build:
    desc: Build Docker image
    cmds:
      - docker build -t {{.IMAGE_NAME}}:{{.IMAGE_TAG}} .

  push:
    desc: Push Docker image
    deps: [build]
    cmds:
      - docker push {{.IMAGE_NAME}}:{{.IMAGE_TAG}}

  run:
    desc: Run Docker container
    cmds:
      - docker run -p 8080:8080 {{.IMAGE_NAME}}:{{.IMAGE_TAG}}
```

### Interactive and Watch Mode

```yaml
## Taskfile.yml
version: '3'

tasks:
  ## Interactive prompts
  release:
    desc: Create a release
    prompt: Are you sure you want to release?
    cmds:
      - goreleaser release --clean

  ## Watch mode for development
  dev:
    desc: Run in development mode with hot reload
    watch: true
    sources:
      - "**/*.go"
    cmds:
      - go run .

  ## Run command in specific directory
  frontend:
    desc: Build frontend
    dir: ./frontend
    cmds:
      - npm ci
      - npm run build

  ## Silent output
  version:
    desc: Print version
    silent: true
    cmds:
      - echo "v1.0.0"
```

### Complete Python Project Example

```yaml
## Taskfile.yml
version: '3'

vars:
  PYTHON: python3
  VENV: .venv
  VENV_BIN: "{{.VENV}}/bin"
  SRC_DIR: src
  TEST_DIR: tests

env:
  PYTHONPATH: "{{.SRC_DIR}}"

tasks:
  default:
    desc: Show available tasks
    cmds:
      - task --list

  ## Environment setup
  venv:
    desc: Create virtual environment
    status:
      - test -d {{.VENV}}
    cmds:
      - "{{.PYTHON}} -m venv {{.VENV}}"

  install:
    desc: Install dependencies
    deps: [venv]
    sources:
      - requirements.txt
      - requirements-dev.txt
    cmds:
      - "{{.VENV_BIN}}/pip install -r requirements.txt"
      - "{{.VENV_BIN}}/pip install -r requirements-dev.txt"

  ## Code quality
  format:
    desc: Format code
    deps: [install]
    cmds:
      - "{{.VENV_BIN}}/black {{.SRC_DIR}} {{.TEST_DIR}}"
      - "{{.VENV_BIN}}/isort {{.SRC_DIR}} {{.TEST_DIR}}"

  lint:
    desc: Run linters
    deps: [install]
    cmds:
      - "{{.VENV_BIN}}/flake8 {{.SRC_DIR}} {{.TEST_DIR}}"
      - "{{.VENV_BIN}}/mypy {{.SRC_DIR}}"
      - "{{.VENV_BIN}}/bandit -r {{.SRC_DIR}}"

  ## Testing
  test:
    desc: Run tests
    deps: [install]
    cmds:
      - "{{.VENV_BIN}}/pytest {{.TEST_DIR}} -v"

  test-cov:
    desc: Run tests with coverage
    deps: [install]
    cmds:
      - "{{.VENV_BIN}}/pytest {{.TEST_DIR}} --cov={{.SRC_DIR}} --cov-report=html"

  ## Build and release
  build:
    desc: Build package
    deps: [install]
    cmds:
      - "{{.VENV_BIN}}/python -m build"

  publish:
    desc: Publish to PyPI
    deps: [build]
    preconditions:
      - sh: test -n "$PYPI_TOKEN"
        msg: "PYPI_TOKEN environment variable required"
    cmds:
      - "{{.VENV_BIN}}/twine upload dist/* -u __token__ -p $PYPI_TOKEN"

  ## Cleanup
  clean:
    desc: Clean build artifacts
    cmds:
      - rm -rf {{.VENV}} dist build *.egg-info
      - find . -type d -name __pycache__ -exec rm -rf {} +
      - find . -type f -name "*.pyc" -delete

  ## Development
  dev:
    desc: Run development server
    deps: [install]
    cmds:
      - "{{.VENV_BIN}}/uvicorn src.main:app --reload"

  ## All checks
  check:
    desc: Run all checks
    cmds:
      - task: format
      - task: lint
      - task: test
```

### Complete Node.js Project Example

```yaml
## Taskfile.yml
version: '3'

vars:
  NODE_ENV: development
  NPM: npm

tasks:
  default:
    desc: Show available tasks
    cmds:
      - task --list

  ## Setup
  install:
    desc: Install dependencies
    sources:
      - package.json
      - package-lock.json
    generates:
      - node_modules/.package-lock.json
    cmds:
      - "{{.NPM}} ci"

  ## Development
  dev:
    desc: Start development server
    deps: [install]
    cmds:
      - "{{.NPM}} run dev"

  ## Code quality
  format:
    desc: Format code
    deps: [install]
    cmds:
      - "{{.NPM}} run format"

  lint:
    desc: Run linters
    deps: [install]
    cmds:
      - "{{.NPM}} run lint"

  lint-fix:
    desc: Fix linting errors
    deps: [install]
    cmds:
      - "{{.NPM}} run lint -- --fix"

  typecheck:
    desc: Run type checker
    deps: [install]
    cmds:
      - "{{.NPM}} run typecheck"

  ## Testing
  test:
    desc: Run tests
    deps: [install]
    cmds:
      - "{{.NPM}} test"

  test-watch:
    desc: Run tests in watch mode
    deps: [install]
    cmds:
      - "{{.NPM}} test -- --watch"

  test-cov:
    desc: Run tests with coverage
    deps: [install]
    cmds:
      - "{{.NPM}} test -- --coverage"

  ## Build
  build:
    desc: Build application
    deps: [install]
    env:
      NODE_ENV: production
    cmds:
      - "{{.NPM}} run build"

  ## Docker
  docker-build:
    desc: Build Docker image
    cmds:
      - docker build -t myapp:latest .

  docker-run:
    desc: Run Docker container
    cmds:
      - docker run -p 3000:3000 myapp:latest

  ## Cleanup
  clean:
    desc: Clean build artifacts
    cmds:
      - rm -rf node_modules dist coverage .next

  ## All checks
  check:
    desc: Run all checks
    cmds:
      - task: lint
      - task: typecheck
      - task: test
```

---

## Just Command Runner

### Just Installation

```bash
## macOS
brew install just

## Linux (prebuilt binary)
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/.local/bin

## Arch Linux
pacman -S just

## Windows (scoop)
scoop install just

## Windows (chocolatey)
choco install just

## Cargo (Rust)
cargo install just

## Verify installation
just --version
```

### Just Basic Structure

```just
## justfile

## Set shell for all recipes
set shell := ["bash", "-euo", "pipefail", "-c"]

## Variables
binary_name := "myapp"
build_dir := "./build"

## Default recipe (runs when just is called without arguments)
default:
    @just --list

## Build the application
build:
    go build -o {{build_dir}}/{{binary_name}} .

## Run tests
test:
    go test -v ./...

## Clean build artifacts
clean:
    rm -rf {{build_dir}}
```

### Recipe Dependencies

```just
## justfile

## Recipe with dependencies
all: build test

## Dependencies run first
build: deps
    go build -o bin/app .

## Install dependencies
deps:
    go mod download

## Run tests after build
test: build
    go test ./...

## Parallel execution (dependencies run in parallel by default)
lint-all: lint-go lint-yaml lint-markdown

lint-go:
    golangci-lint run

lint-yaml:
    yamllint .

lint-markdown:
    markdownlint "**/*.md"
```

### Variables and Arguments

```just
## justfile

## Define variables
version := `git describe --tags --always`
build_time := `date -u +"%Y-%m-%dT%H:%M:%SZ"`
goos := "linux"
goarch := "amd64"

## Recipe with positional arguments
deploy env:
    @echo "Deploying to {{env}}"
    ./deploy.sh {{env}}

## Recipe with default argument
greet name="World":
    @echo "Hello, {{name}}!"

## Recipe with variadic arguments
run *args:
    go run . {{args}}

## Recipe with optional argument
build target="":
    #!/usr/bin/env bash
    if [ -z "{{target}}" ]; then
        go build -o bin/app .
    else
        go build -o bin/{{target}} ./cmd/{{target}}
    fi

## Using environment variables
push:
    @if [ -z "$DOCKER_REGISTRY" ]; then \
        echo "DOCKER_REGISTRY not set"; \
        exit 1; \
    fi
    docker push $DOCKER_REGISTRY/myapp:latest

## Export variables to environment
export CGO_ENABLED := "0"
export GO111MODULE := "on"

build-static:
    go build -ldflags="-s -w" -o bin/app .
```

### Conditional Logic

```just
## justfile

## Platform detection
os := os()
arch := arch()

## Platform-specific installation
install-deps:
    #!/usr/bin/env bash
    set -euo pipefail
    case "{{os}}" in
        macos)
            brew install golangci-lint
            ;;
        linux)
            curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh
            ;;
        windows)
            choco install golangci-lint
            ;;
        *)
            echo "Unsupported OS: {{os}}"
            exit 1
            ;;
    esac

## Conditional recipe selection
build-all: (_build os)

_build target:
    @echo "Building for {{target}}"

## Check preconditions
deploy: _check-deploy
    ./deploy.sh

_check-deploy:
    @test -f bin/app || (echo "Binary not found. Run 'just build' first." && exit 1)
    @test -n "$DEPLOY_TOKEN" || (echo "DEPLOY_TOKEN required" && exit 1)
```

### Multi-line Scripts

```just
## justfile

## Multi-line bash script
setup:
    #!/usr/bin/env bash
    set -euo pipefail

    echo "Setting up development environment..."

    # Create directories
    mkdir -p bin logs tmp

    # Install dependencies
    go mod download

    # Setup git hooks
    if [ -d .git ]; then
        cp scripts/pre-commit .git/hooks/
        chmod +x .git/hooks/pre-commit
    fi

    echo "Setup complete!"

## Python script
analyze:
    #!/usr/bin/env python3
    import json
    import sys

    with open('coverage.json') as f:
        data = json.load(f)

    coverage = data.get('total', 0)
    if coverage < 80:
        print(f"Coverage {coverage}% is below 80%")
        sys.exit(1)
    print(f"Coverage {coverage}% meets threshold")

## PowerShell script (Windows)
[windows]
setup-windows:
    #!powershell
    Write-Host "Setting up Windows environment..."
    New-Item -ItemType Directory -Force -Path bin, logs, tmp
    go mod download
    Write-Host "Setup complete!"
```

### Just Python Project Example

```just
## justfile

## Shell configuration
set shell := ["bash", "-euo", "pipefail", "-c"]
set dotenv-load

## Variables
python := "python3"
venv := ".venv"
venv_bin := venv / "bin"
src_dir := "src"
test_dir := "tests"

## Export Python path
export PYTHONPATH := src_dir

## Default recipe
default:
    @just --list

## Create virtual environment
venv:
    {{python}} -m venv {{venv}}

## Install dependencies
install: venv
    {{venv_bin}}/pip install -r requirements.txt
    {{venv_bin}}/pip install -r requirements-dev.txt

## Format code
format: install
    {{venv_bin}}/black {{src_dir}} {{test_dir}}
    {{venv_bin}}/isort {{src_dir}} {{test_dir}}

## Run linters
lint: install
    {{venv_bin}}/flake8 {{src_dir}} {{test_dir}}
    {{venv_bin}}/mypy {{src_dir}}
    {{venv_bin}}/bandit -r {{src_dir}}

## Run tests
test: install
    {{venv_bin}}/pytest {{test_dir}} -v

## Run tests with coverage
test-cov: install
    {{venv_bin}}/pytest {{test_dir}} --cov={{src_dir}} --cov-report=html

## Build package
build: install
    {{venv_bin}}/python -m build

## Publish to PyPI
publish token: build
    {{venv_bin}}/twine upload dist/* -u __token__ -p {{token}}

## Run development server
dev: install
    {{venv_bin}}/uvicorn src.main:app --reload

## Clean build artifacts
clean:
    rm -rf {{venv}} dist build *.egg-info
    find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete

## Run all checks
check: format lint test
```

### Just Node.js Project Example

```just
## justfile

## Shell configuration
set shell := ["bash", "-euo", "pipefail", "-c"]

## Variables
npm := "npm"
node_env := "development"

## Default recipe
default:
    @just --list

## Install dependencies
install:
    {{npm}} ci

## Start development server
dev: install
    {{npm}} run dev

## Format code
format: install
    {{npm}} run format

## Run linters
lint: install
    {{npm}} run lint

## Fix linting errors
lint-fix: install
    {{npm}} run lint -- --fix

## Run type checker
typecheck: install
    {{npm}} run typecheck

## Run tests
test: install
    {{npm}} test

## Run tests in watch mode
test-watch: install
    {{npm}} test -- --watch

## Run tests with coverage
test-cov: install
    {{npm}} test -- --coverage

## Build for production
build: install
    NODE_ENV=production {{npm}} run build

## Build Docker image
docker-build:
    docker build -t myapp:latest .

## Run Docker container
docker-run:
    docker run -p 3000:3000 myapp:latest

## Clean build artifacts
clean:
    rm -rf node_modules dist coverage .next

## Run all checks
check: lint typecheck test

## Start fresh
reset: clean install
```

### Complete Go Project Example

```just
## justfile

## Shell configuration
set shell := ["bash", "-euo", "pipefail", "-c"]

## Variables
binary := "myapp"
build_dir := "bin"
version := `git describe --tags --always 2>/dev/null || echo "dev"`
commit := `git rev-parse --short HEAD 2>/dev/null || echo "unknown"`
build_time := `date -u +"%Y-%m-%dT%H:%M:%SZ"`

## Build flags
ldflags := "-s -w -X main.Version=" + version + " -X main.Commit=" + commit + " -X main.BuildTime=" + build_time

## Export for static builds
export CGO_ENABLED := "0"

## Default recipe
default:
    @just --list

## Install dependencies
deps:
    go mod download
    go mod verify

## Generate code
generate:
    go generate ./...

## Build application
build: deps generate
    go build -ldflags "{{ldflags}}" -o {{build_dir}}/{{binary}} .

## Build for all platforms
build-all: deps generate
    GOOS=linux GOARCH=amd64 go build -ldflags "{{ldflags}}" -o {{build_dir}}/{{binary}}-linux-amd64 .
    GOOS=darwin GOARCH=amd64 go build -ldflags "{{ldflags}}" -o {{build_dir}}/{{binary}}-darwin-amd64 .
    GOOS=darwin GOARCH=arm64 go build -ldflags "{{ldflags}}" -o {{build_dir}}/{{binary}}-darwin-arm64 .
    GOOS=windows GOARCH=amd64 go build -ldflags "{{ldflags}}" -o {{build_dir}}/{{binary}}-windows-amd64.exe .

## Run tests
test:
    go test -v -race ./...

## Run tests with coverage
test-cov:
    go test -v -race -coverprofile=coverage.out ./...
    go tool cover -html=coverage.out -o coverage.html

## Run benchmarks
bench:
    go test -bench=. -benchmem ./...

## Run linters
lint:
    golangci-lint run

## Format code
format:
    gofmt -s -w .
    goimports -w .

## Run application
run *args: build
    ./{{build_dir}}/{{binary}} {{args}}

## Clean build artifacts
clean:
    rm -rf {{build_dir}} coverage.out coverage.html

## Install binary
install: build
    cp {{build_dir}}/{{binary}} $(go env GOPATH)/bin/

## Run all checks
check: format lint test

## Docker build
docker-build:
    docker build -t {{binary}}:{{version}} .

## Docker run
docker-run:
    docker run -p 8080:8080 {{binary}}:{{version}}
```

---

## Tool Comparison

### Feature Comparison Matrix

```text
┌─────────────────────────┬─────────────┬─────────────┬─────────────┐
│ Feature                 │    Make     │    Task     │    Just     │
├─────────────────────────┼─────────────┼─────────────┼─────────────┤
│ Cross-platform          │ Partial     │ Yes         │ Yes         │
│ File dependencies       │ Yes         │ Yes         │ No          │
│ Task dependencies       │ Yes         │ Yes         │ Yes         │
│ Parallel execution      │ Yes (-j)    │ Yes         │ Yes         │
│ Variables               │ Yes         │ Yes (YAML)  │ Yes         │
│ Arguments               │ Limited     │ Yes         │ Yes         │
│ Watch mode              │ No          │ Yes         │ No          │
│ Include files           │ Yes         │ Yes         │ Yes         │
│ Shell selection         │ Limited     │ Yes         │ Yes         │
│ Checksum-based rebuild  │ Timestamp   │ Checksum    │ No          │
│ Interactive prompts     │ No          │ Yes         │ No          │
│ Tab required            │ Yes         │ No          │ No          │
│ Syntax highlighting     │ Good        │ Good (YAML) │ Limited     │
│ IDE support             │ Good        │ Good        │ Growing     │
│ Installation required   │ No          │ Yes         │ Yes         │
└─────────────────────────┴─────────────┴─────────────┴─────────────┘
```

### Syntax Comparison

```makefile
## Makefile - Build target
.PHONY: build
build:
 go build -o bin/app .
```

```yaml
## Taskfile.yml - Build task
version: '3'

tasks:
  build:
    desc: Build the application
    cmds:
      - go build -o bin/app .
```

```just
## justfile - Build recipe
build:
    go build -o bin/app .
```

### Argument Handling Comparison

```makefile
## Makefile - Arguments via environment
deploy:
 ./deploy.sh $(ENV)

## Usage: make deploy ENV=production
```

```yaml
## Taskfile.yml - Arguments via variables
version: '3'

tasks:
  deploy:
    desc: Deploy to environment
    vars:
      ENV: '{{.CLI_ARGS | default "staging"}}'
    cmds:
      - ./deploy.sh {{.ENV}}

## Usage: task deploy -- production
```

```just
## justfile - Native argument support
deploy env="staging":
    ./deploy.sh {{env}}

## Usage: just deploy production
```

### Conditional Execution Comparison

```makefile
## Makefile - OS detection
UNAME_S := $(shell uname -s)

install-deps:
ifeq ($(UNAME_S),Linux)
 apt-get install -y build-essential
endif
ifeq ($(UNAME_S),Darwin)
 brew install coreutils
endif
```

```yaml
## Taskfile.yml - OS detection
version: '3'

tasks:
  install-deps:
    cmds:
      - task: install-deps-{{OS}}

  install-deps-linux:
    internal: true
    cmds:
      - apt-get install -y build-essential

  install-deps-darwin:
    internal: true
    cmds:
      - brew install coreutils
```

```just
## justfile - OS detection
install-deps:
    #!/usr/bin/env bash
    case "{{os()}}" in
        linux) apt-get install -y build-essential ;;
        macos) brew install coreutils ;;
    esac
```

---

## Cross-Platform Compatibility

### Task Cross-Platform Configuration

```yaml
## Taskfile.yml
version: '3'

vars:
  ## Cross-platform path separator
  SEP: '{{if eq OS "windows"}}\{{else}}/{{end}}'

  ## Executable extension
  EXE: '{{if eq OS "windows"}}.exe{{else}}{{end}}'

  ## Null device
  NULL: '{{if eq OS "windows"}}NUL{{else}}/dev/null{{end}}'

tasks:
  build:
    desc: Cross-platform build
    cmds:
      - go build -o bin{{.SEP}}app{{.EXE}} .

  clean:
    desc: Cross-platform clean
    cmds:
      - cmd: rm -rf bin
        platforms: [linux, darwin]
      - cmd: rmdir /s /q bin
        platforms: [windows]

  ## Platform-specific tasks
  install:
    desc: Install dependencies
    cmds:
      - task: '{{if eq OS "windows"}}install-windows{{else}}install-unix{{end}}'

  install-unix:
    internal: true
    cmds:
      - chmod +x scripts/*.sh
      - ./scripts/install.sh

  install-windows:
    internal: true
    cmds:
      - powershell -ExecutionPolicy Bypass -File scripts/install.ps1
```

### Just Cross-Platform Configuration

```just
## justfile

## Platform detection
os := os()
arch := arch()

## Platform-specific variables
exe_ext := if os == "windows" { ".exe" } else { "" }
path_sep := if os == "windows" { "\\" } else { "/" }

## Cross-platform build
build:
    go build -o bin{{path_sep}}app{{exe_ext}} .

## Platform-specific clean
clean:
    #!/usr/bin/env bash
    if [[ "{{os}}" == "windows" ]]; then
        rmdir /s /q bin 2>/dev/null || true
    else
        rm -rf bin
    fi

## Platform-specific scripts
[linux]
[macos]
install-unix:
    chmod +x scripts/*.sh
    ./scripts/install.sh

[windows]
install-windows:
    #!powershell
    powershell -ExecutionPolicy Bypass -File scripts/install.ps1

## Dispatch to platform-specific recipe
install: (if os == "windows" { "install-windows" } else { "install-unix" })
```

### Portable Script Pattern

```yaml
## Taskfile.yml
version: '3'

tasks:
  ## Use interpreter directive for portability
  setup:
    desc: Portable setup script
    cmds:
      - |
        #!/usr/bin/env bash
        set -euo pipefail

        # Works on macOS, Linux, and Windows (Git Bash, WSL)
        echo "Setting up environment..."

        # Create directories
        mkdir -p bin logs

        # Install dependencies
        go mod download

        echo "Setup complete!"

  ## Python for complex cross-platform logic
  analyze:
    desc: Cross-platform analysis
    cmds:
      - |
        #!/usr/bin/env python3
        import os
        import platform

        system = platform.system().lower()
        print(f"Running on {system}")

        # Cross-platform path handling
        bin_dir = os.path.join(".", "bin")
        os.makedirs(bin_dir, exist_ok=True)
```

---

## Common Development Tasks

### Standard Task Interface

```yaml
## Taskfile.yml - Standard development tasks
version: '3'

tasks:
  ## Environment setup
  setup:
    desc: Set up development environment
    cmds:
      - task: deps
      - task: install

  deps:
    desc: Install system dependencies
    cmds:
      - echo "Installing system dependencies..."

  install:
    desc: Install project dependencies
    cmds:
      - echo "Installing project dependencies..."

  ## Code quality
  format:
    desc: Format code
    cmds:
      - echo "Formatting code..."

  lint:
    desc: Run linters
    cmds:
      - echo "Running linters..."

  typecheck:
    desc: Run type checker
    cmds:
      - echo "Type checking..."

  ## Testing
  test:
    desc: Run tests
    cmds:
      - echo "Running tests..."

  test-unit:
    desc: Run unit tests
    cmds:
      - echo "Running unit tests..."

  test-integration:
    desc: Run integration tests
    cmds:
      - echo "Running integration tests..."

  test-e2e:
    desc: Run end-to-end tests
    cmds:
      - echo "Running e2e tests..."

  test-cov:
    desc: Run tests with coverage
    cmds:
      - echo "Running tests with coverage..."

  ## Build
  build:
    desc: Build application
    cmds:
      - echo "Building application..."

  build-dev:
    desc: Build for development
    cmds:
      - echo "Building for development..."

  build-prod:
    desc: Build for production
    cmds:
      - echo "Building for production..."

  ## Run
  run:
    desc: Run application
    cmds:
      - echo "Running application..."

  dev:
    desc: Start development server
    cmds:
      - echo "Starting dev server..."

  ## Deployment
  deploy:
    desc: Deploy application
    cmds:
      - echo "Deploying application..."

  deploy-staging:
    desc: Deploy to staging
    cmds:
      - echo "Deploying to staging..."

  deploy-prod:
    desc: Deploy to production
    cmds:
      - echo "Deploying to production..."

  ## Docker
  docker-build:
    desc: Build Docker image
    cmds:
      - echo "Building Docker image..."

  docker-push:
    desc: Push Docker image
    cmds:
      - echo "Pushing Docker image..."

  docker-run:
    desc: Run Docker container
    cmds:
      - echo "Running Docker container..."

  ## Cleanup
  clean:
    desc: Clean build artifacts
    cmds:
      - echo "Cleaning..."

  reset:
    desc: Reset to clean state
    cmds:
      - task: clean
      - task: install

  ## CI/CD
  ci:
    desc: Run CI pipeline locally
    cmds:
      - task: lint
      - task: typecheck
      - task: test
      - task: build

  check:
    desc: Run all checks
    cmds:
      - task: format
      - task: lint
      - task: typecheck
      - task: test
```

### Standard Just Interface

```just
## justfile - Standard development tasks

## Environment setup
setup: deps install

deps:
    @echo "Installing system dependencies..."

install:
    @echo "Installing project dependencies..."

## Code quality
format:
    @echo "Formatting code..."

lint:
    @echo "Running linters..."

typecheck:
    @echo "Type checking..."

## Testing
test:
    @echo "Running tests..."

test-unit:
    @echo "Running unit tests..."

test-integration:
    @echo "Running integration tests..."

test-e2e:
    @echo "Running e2e tests..."

test-cov:
    @echo "Running tests with coverage..."

## Build
build:
    @echo "Building application..."

build-dev:
    @echo "Building for development..."

build-prod:
    @echo "Building for production..."

## Run
run:
    @echo "Running application..."

dev:
    @echo "Starting dev server..."

## Deployment
deploy env="staging":
    @echo "Deploying to {{env}}..."

## Docker
docker-build:
    @echo "Building Docker image..."

docker-push:
    @echo "Pushing Docker image..."

docker-run:
    @echo "Running Docker container..."

## Cleanup
clean:
    @echo "Cleaning..."

reset: clean install

## CI/CD
ci: lint typecheck test build

check: format lint typecheck test
```

---

## Testing Task Runners

### Testing Task Configuration

```yaml
## Taskfile.yml
version: '3'

tasks:
  ## Test task execution
  test-tasks:
    desc: Test all tasks work
    cmds:
      - task --dry build
      - task --dry test
      - task --dry lint

  ## Validate Taskfile syntax
  validate:
    desc: Validate Taskfile
    cmds:
      - task --list > /dev/null
```

```bash
#!/bin/bash
## tests/test_taskfile.sh

set -euo pipefail

echo "Testing Taskfile configuration..."

## Test task list works
if ! task --list > /dev/null 2>&1; then
  echo "FAIL: task --list failed"
  exit 1
fi
echo "PASS: task --list works"

## Test build task exists
if ! task --list | grep -q "build"; then
  echo "FAIL: build task not found"
  exit 1
fi
echo "PASS: build task exists"

## Test dry run
if ! task --dry build > /dev/null 2>&1; then
  echo "FAIL: build task dry run failed"
  exit 1
fi
echo "PASS: build task dry run works"

echo "All Taskfile tests passed!"
```

### Testing Just Configuration

```just
## justfile

## Test all recipes work
test-recipes:
    @just --dry-run build
    @just --dry-run test
    @just --dry-run lint

## Validate justfile syntax
validate:
    @just --list > /dev/null && echo "Justfile is valid"
```

```bash
#!/bin/bash
## tests/test_justfile.sh

set -euo pipefail

echo "Testing justfile configuration..."

## Test recipe list works
if ! just --list > /dev/null 2>&1; then
  echo "FAIL: just --list failed"
  exit 1
fi
echo "PASS: just --list works"

## Test build recipe exists
if ! just --list | grep -q "build"; then
  echo "FAIL: build recipe not found"
  exit 1
fi
echo "PASS: build recipe exists"

## Test dry run
if ! just --dry-run build > /dev/null 2>&1; then
  echo "FAIL: build recipe dry run failed"
  exit 1
fi
echo "PASS: build recipe dry run works"

echo "All justfile tests passed!"
```

### CI Integration

```yaml
## .github/workflows/task-runner-test.yml
name: Test Task Runners

on: [push, pull_request]

jobs:
  test-taskfile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Task
        uses: arduino/setup-task@v2
        with:
          version: 3.x

      - name: Validate Taskfile
        run: task --list

      - name: Test dry run
        run: task --dry build

      - name: Run tests
        run: task test

  test-justfile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Just
        uses: extractions/setup-just@v2

      - name: Validate justfile
        run: just --list

      - name: Test dry run
        run: just --dry-run build

      - name: Run tests
        run: just test
```

---

## Security Best Practices

### Secure Variable Handling

```yaml
## Taskfile.yml
version: '3'

## Load environment from .env (gitignored)
dotenv: ['.env']

tasks:
  deploy:
    desc: Secure deployment
    preconditions:
      - sh: test -n "$DEPLOY_TOKEN"
        msg: "DEPLOY_TOKEN required"
      - sh: test -n "$AWS_ACCESS_KEY_ID"
        msg: "AWS credentials required"
    cmds:
      ## Don't echo sensitive commands
      - cmd: echo "Deploying..."
        silent: true
      - cmd: ./deploy.sh
        silent: true

  ## Never log secrets
  secure-cmd:
    desc: Run without logging
    silent: true
    cmds:
      - curl -H "Authorization: Bearer $API_TOKEN" https://api.example.com
```

```just
## justfile

## Set for quiet mode
set quiet

## Secure deployment
deploy:
    #!/usr/bin/env bash
    set -euo pipefail

    # Validate required secrets
    : "${DEPLOY_TOKEN:?DEPLOY_TOKEN is required}"
    : "${AWS_ACCESS_KEY_ID:?AWS credentials required}"

    # Deploy without echoing commands
    set +x
    ./deploy.sh
```

### Input Validation

```yaml
## Taskfile.yml
version: '3'

tasks:
  deploy:
    desc: Deploy to environment
    vars:
      ENV: '{{.CLI_ARGS}}'
      VALID_ENVS: "dev staging production"
    preconditions:
      - sh: echo "{{.VALID_ENVS}}" | grep -wq "{{.ENV}}"
        msg: "Invalid environment '{{.ENV}}'. Must be one of: {{.VALID_ENVS}}"
    cmds:
      - ./deploy.sh {{.ENV}}
```

```just
## justfile

## Validate environment argument
deploy env:
    #!/usr/bin/env bash
    set -euo pipefail

    valid_envs="dev staging production"
    if ! echo "$valid_envs" | grep -wq "{{env}}"; then
        echo "Invalid environment '{{env}}'. Must be one of: $valid_envs"
        exit 1
    fi

    ./deploy.sh {{env}}
```

---

## Tool Configuration

### EditorConfig

```ini
## .editorconfig

[Taskfile.yml]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[justfile]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### VS Code Settings

```json
{
  "files.associations": {
    "Taskfile.yml": "yaml",
    "Taskfile.yaml": "yaml",
    "justfile": "just",
    "Justfile": "just"
  },
  "yaml.schemas": {
    "https://taskfile.dev/schema.json": ["Taskfile.yml", "Taskfile.yaml"]
  },
  "[yaml]": {
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  }
}
```

### Pre-commit Hooks

```yaml
## .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml

  - repo: local
    hooks:
      - id: validate-taskfile
        name: Validate Taskfile
        entry: task --list
        language: system
        files: Taskfile\.ya?ml$
        pass_filenames: false

      - id: validate-justfile
        name: Validate justfile
        entry: just --list
        language: system
        files: justfile$
        pass_filenames: false
```

---

## Anti-Patterns

### Task Anti-Patterns

```yaml
## Bad - No descriptions
version: '3'
tasks:
  build:
    cmds:
      - go build .

## Good - Always add descriptions
version: '3'
tasks:
  build:
    desc: Build the application binary
    cmds:
      - go build -o bin/app .
```

```yaml
## Bad - Hardcoded paths
version: '3'
tasks:
  deploy:
    cmds:
      - scp bin/app user@192.168.1.100:/opt/app/

## Good - Use variables
version: '3'
vars:
  DEPLOY_HOST: '{{.DEPLOY_HOST | default "localhost"}}'
  DEPLOY_PATH: /opt/app
tasks:
  deploy:
    desc: Deploy to remote server
    cmds:
      - scp bin/app {{.DEPLOY_HOST}}:{{.DEPLOY_PATH}}/
```

```yaml
## Bad - Missing preconditions
version: '3'
tasks:
  publish:
    cmds:
      - npm publish

## Good - Validate before running
version: '3'
tasks:
  publish:
    desc: Publish to npm
    preconditions:
      - sh: test -f package.json
        msg: "package.json not found"
      - sh: test -n "$NPM_TOKEN"
        msg: "NPM_TOKEN required"
    cmds:
      - npm publish
```

### Just Anti-Patterns

```just
## Bad - No default recipe
build:
    go build .

## Good - Always have a default
default:
    @just --list

build:
    go build -o bin/app .
```

```just
## Bad - No argument validation
deploy env:
    ./deploy.sh {{env}}

## Good - Validate arguments
deploy env:
    #!/usr/bin/env bash
    set -euo pipefail
    case "{{env}}" in
        dev|staging|production) ;;
        *) echo "Invalid env: {{env}}" && exit 1 ;;
    esac
    ./deploy.sh {{env}}
```

```just
## Bad - Secrets in justfile
deploy:
    curl -H "Authorization: Bearer sk_live_abc123" https://api.example.com

## Good - Use environment variables
deploy:
    #!/usr/bin/env bash
    : "${API_TOKEN:?API_TOKEN required}"
    curl -H "Authorization: Bearer $API_TOKEN" https://api.example.com
```

---

## References

### Task Resources

- [Task Official Documentation](https://taskfile.dev/)
- [Task GitHub Repository](https://github.com/go-task/task)
- [Taskfile Schema](https://taskfile.dev/schema.json)

### Just Resources

- [Just Official Documentation](https://just.systems/man/en/)
- [Just GitHub Repository](https://github.com/casey/just)
- [Just Language Reference](https://just.systems/man/en/chapter_1.html)

### Related Guides

- [Makefile Style Guide](makefile.md)
- [Bash Style Guide](bash.md)
- [GitHub Actions Guide](github_actions.md)

---

**Status**: Active
