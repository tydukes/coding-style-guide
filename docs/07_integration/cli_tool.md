---
title: "CLI Tool"
description: "Standalone CLI tool for style guide checking and enforcement"
author: "Tyler Dukes"
tags: [cli, tool, validation, automation]
category: "Integration"
status: "active"
---

The Dukes Style Guide provides a standalone CLI tool (`dukes-style`) for
checking and enforcing style standards across your codebase.

## Overview

The CLI wraps multiple linters and formatters into a single, consistent interface with:

- Multi-language support (Python, TypeScript, Bash, YAML, Terraform, and more)
- Automatic configuration discovery
- Auto-fix capabilities
- CI/CD-friendly output formats (JSON, SARIF)
- Custom plugin support

## Installation

```bash
# Install globally via npm
npm install -g @dukes/style-guide-cli

# Or use with npx (no installation)
npx @dukes/style-guide-cli check

# Or use via Docker
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest validate
```

## Quick Start

```bash
# Initialize configuration
dukes-style init

# Check all files
dukes-style check

# Auto-fix issues
dukes-style fix

# Check specific files
dukes-style check "src/**/*.py"
```

## Commands

### Check Command

Validates files against style guide standards.

```bash
# Check all files
dukes-style check

# Check specific patterns
dukes-style check "src/**/*.ts" "lib/**/*.py"

# Filter by language
dukes-style check --language python

# Output as JSON for tooling
dukes-style check --format json

# Output as SARIF for GitHub Code Scanning
dukes-style check --format sarif > results.sarif

# Strict mode (warnings become errors)
dukes-style check --strict

# Quiet mode (errors only)
dukes-style check --quiet

# Check and fix in one command
dukes-style check --fix
```

### Fix Command

Auto-fixes style violations where possible.

```bash
# Fix all files
dukes-style fix

# Preview changes without modifying files
dukes-style fix --dry-run

# Fix specific language
dukes-style fix --language typescript

# Output fix results as JSON
dukes-style fix --format json
```

### Init Command

Creates a configuration file in your project.

```bash
# Standard configuration
dukes-style init

# Minimal configuration
dukes-style init --template minimal

# Strict configuration (all linters enabled)
dukes-style init --template strict

# Overwrite existing
dukes-style init --force
```

### List Command

Shows available linters and their status.

```bash
# List all linters
dukes-style list

# Filter by language
dukes-style list --language python

# JSON output
dukes-style list --format json
```

## Configuration

### Configuration File Locations

The CLI searches for configuration in this order:

1. `.dukestylerc`
2. `.dukestylerc.json`
3. `.dukestylerc.yaml`
4. `.dukestylerc.yml`
5. `dukestyle.config.js`
6. `.dukes-style.json`
7. `.dukes-style.yaml`
8. `package.json` (`dukestyle` key)

### Configuration Schema

```yaml
# .dukestyle.yaml

# Extends another configuration (optional)
extends:
  - "@dukes/style-guide-cli/config/strict"

# Language configurations
languages:
  python:
    enabled: true
    extensions:
      - .py
      - .pyi
    linters:
      black:
        enabled: true
        configFile: pyproject.toml
      flake8:
        enabled: true
        configFile: .flake8
    formatters:
      - black

  typescript:
    enabled: true
    extensions:
      - .ts
      - .tsx
      - .js
      - .jsx
    linters:
      eslint:
        enabled: true
        configFile: .eslintrc.js
      prettier:
        enabled: true
    formatters:
      - prettier

  bash:
    enabled: true
    extensions:
      - .sh
      - .bash
    linters:
      shellcheck:
        enabled: true

  yaml:
    enabled: true
    extensions:
      - .yml
      - .yaml
    linters:
      yamllint:
        enabled: true
        configFile: .yamllint.yaml

  markdown:
    enabled: true
    extensions:
      - .md
    linters:
      markdownlint:
        enabled: true
        configFile: .markdownlint.json

  terraform:
    enabled: true
    extensions:
      - .tf
      - .tfvars
    linters:
      terraform-fmt:
        enabled: true
      terraform-validate:
        enabled: true
      tflint:
        enabled: false

  dockerfile:
    enabled: true
    extensions:
      - Dockerfile
    linters:
      hadolint:
        enabled: true

# Files to ignore
ignore:
  - "**/node_modules/**"
  - "**/dist/**"
  - "**/.git/**"
  - "**/__pycache__/**"
  - "**/.venv/**"
  - "**/.terraform/**"

# Caching
cache: true
cacheLocation: .dukestyle-cache

# Custom plugins
plugins:
  - name: my-custom-plugin
    path: ./plugins/my-plugin.js
```

## Supported Languages

| Language | Linters | Auto-Fix |
|----------|---------|----------|
| Python | black, flake8 | Yes (black) |
| TypeScript | eslint, prettier | Yes |
| JavaScript | eslint, prettier | Yes |
| Bash | shellcheck | No |
| YAML | yamllint | No |
| JSON | prettier | Yes |
| Markdown | markdownlint | Partial |
| Terraform | terraform fmt, tflint | Yes (fmt) |
| Dockerfile | hadolint | No |

## CI/CD Integration

### GitHub Actions

```yaml
name: Style Check

on: [push, pull_request]

jobs:
  style:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install CLI
        run: npm install -g @dukes/style-guide-cli

      - name: Run style check
        run: dukes-style check --format sarif > style-results.sarif

      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: style-results.sarif
```

### GitLab CI/CD

```yaml
style-check:
  image: node:20-alpine
  stage: test
  script:
    - npm install -g @dukes/style-guide-cli
    - dukes-style check --format json > gl-code-quality-report.json
  artifacts:
    reports:
      codequality: gl-code-quality-report.json
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: dukes-style
        name: Dukes Style Check
        entry: dukes-style check
        language: system
        pass_filenames: false
```

## Custom Plugins

Extend the CLI with custom linters and rules.

### Plugin Structure

```javascript
// plugins/my-plugin.js
export default {
  name: 'my-plugin',
  version: '1.0.0',

  // Custom linters
  linters: [
    {
      name: 'my-linter',
      language: 'python',

      async check(files, config) {
        const results = [];
        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          const issues = analyzeFile(content);
          results.push({
            file,
            language: 'python',
            issues,
            fixable: issues.filter(i => i.fixable).length,
          });
        }
        return results;
      },

      async fix(files, config) {
        // Implement fix logic
      },
    },
  ],

  // Custom rules
  rules: [
    {
      name: 'my-plugin/no-print',
      description: 'Disallow print statements',
      language: 'python',

      check(content, file) {
        const issues = [];
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.match(/\bprint\s*\(/)) {
            issues.push({
              line: index + 1,
              column: line.indexOf('print') + 1,
              message: 'Avoid using print() in production code',
              rule: 'my-plugin/no-print',
              severity: 'warning',
              fixable: false,
            });
          }
        });
        return issues;
      },
    },
  ],
};
```

### Plugin Configuration

```yaml
# .dukestyle.yaml
plugins:
  - name: my-plugin
    path: ./plugins/my-plugin.js
    options:
      severity: error
      exclude:
        - "**/tests/**"
```

## Output Formats

### Text (Default)

Human-readable format for terminal output.

```text
src/main.py
  10:5  warning  Line too long (120 > 100)  (E501)
  25:1  error    Undefined name 'foo'  (F821) [fixable]

src/utils.py
  5:1   warning  File would be reformatted  (black/format) [fixable]

✖ 3 files checked, 1 error, 2 warnings, 2 fixable with --fix (150ms)
```

### JSON

Machine-readable format for CI/CD integration.

```json
{
  "results": [
    {
      "file": "src/main.py",
      "language": "python",
      "issues": [
        {
          "line": 10,
          "column": 5,
          "message": "Line too long (120 > 100)",
          "rule": "E501",
          "severity": "warning",
          "fixable": false
        }
      ],
      "fixable": 0
    }
  ],
  "summary": {
    "files": 3,
    "errors": 1,
    "warnings": 2,
    "fixable": 2,
    "duration": 150
  }
}
```

### SARIF

GitHub Code Scanning compatible format.

```bash
dukes-style check --format sarif > results.sarif
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No errors found |
| 1 | Style violations found |
| 2 | Configuration or runtime error |

## Comparison with Docker Container

| Feature | CLI Tool | Docker Container |
|---------|----------|------------------|
| Installation | `npm install -g` | `docker pull` |
| Speed | Faster (no container overhead) | Slower startup |
| Dependencies | Must install linters | All included |
| Customization | Full plugin support | Limited |
| CI/CD | Native | Volume mounts |

Use the CLI for:

- Local development
- Custom plugins
- Fast feedback loops
- CI/CD with existing linter installations

Use Docker for:

- Consistent environments
- No local dependencies
- One-time validation
- Isolation requirements

## Troubleshooting

### Linter Not Found

```bash
# Check linter availability
dukes-style list

# Install missing linters
pip install black flake8
npm install -g eslint prettier
```

### Configuration Not Loading

```bash
# Debug configuration discovery
dukes-style check --debug
```

### Slow Performance

```bash
# Enable caching
dukes-style check  # Cache enabled by default

# Clear cache if needed
rm -rf .dukestyle-cache
```

## Related Documentation

- [Container Usage](../06_container/usage.md)
- [GitHub Actions Guide](../05_ci_cd/github_actions_guide.md)
- [Pre-commit Hooks Guide](../05_ci_cd/precommit_hooks_guide.md)
