# DevOps Engineering Style Guide CLI

A standalone CLI tool for enforcing
[DevOps Engineering Style Guide](https://tydukes.github.io/coding-style-guide/)
standards across your codebase.

## Features

- **Multi-language support** - Python, TypeScript, Bash, YAML, JSON, Markdown, Terraform, Dockerfile
- **Configuration discovery** - Automatic detection of project configuration files
- **Auto-fix capabilities** - Fix formatting and style issues automatically
- **CI/CD integration** - JSON and SARIF output formats for tooling integration
- **Custom plugins** - Extend with your own linters and rules

## Installation

```bash
# Install globally
npm install -g devops-engineering-style-guide

# Or use with npx
npx devops-engineering-style-guide check
```

## Quick Start

```bash
# Initialize configuration in your project
devops-style init

# Check all files
devops-style check

# Auto-fix issues
devops-style fix

# Check specific files
devops-style check "src/**/*.py"

# Output as JSON (for CI/CD)
devops-style check --format json

# Check only specific language
devops-style check --language python
```

## Commands

### `devops-style check [files...]`

Check files for style violations.

```bash
# Check all files
devops-style check

# Check specific glob patterns
devops-style check "src/**/*.ts" "lib/**/*.js"

# Check with specific language filter
devops-style check --language python

# Output as JSON
devops-style check --format json

# Output as SARIF (for GitHub Code Scanning)
devops-style check --format sarif > results.sarif

# Treat warnings as errors
devops-style check --strict

# Show only errors (no warnings)
devops-style check --quiet

# Also fix issues
devops-style check --fix
```

### `devops-style fix [files...]`

Auto-fix style violations where possible.

```bash
# Fix all files
devops-style fix

# Preview what would be changed
devops-style fix --dry-run

# Fix specific language
devops-style fix --language typescript
```

### `devops-style init`

Initialize configuration in the current project.

```bash
# Create standard configuration
devops-style init

# Use minimal configuration
devops-style init --template minimal

# Use strict configuration
devops-style init --template strict

# Overwrite existing configuration
devops-style init --force
```

### `devops-style list`

List available linters and their installation status.

```bash
# List all linters
devops-style list

# List linters for specific language
devops-style list --language python

# Output as JSON
devops-style list --format json
```

## Configuration

The CLI looks for configuration in the following locations (in order):

1. `.dukestylerc`
2. `.dukestylerc.json`
3. `.dukestylerc.yaml`
4. `.dukestylerc.yml`
5. `dukestyle.config.js`
6. `.devops-style.json`
7. `.devops-style.yaml`
8. `package.json` (`dukestyle` key)

### Example Configuration

```yaml
# .dukestyle.yaml
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

  typescript:
    enabled: true
    extensions:
      - .ts
      - .tsx
    linters:
      eslint:
        enabled: true
      prettier:
        enabled: true

ignore:
  - "**/node_modules/**"
  - "**/dist/**"
  - "**/.git/**"

cache: true
cacheLocation: .dukestyle-cache
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `languages` | object | See defaults | Language-specific configuration |
| `ignore` | string[] | Common patterns | Glob patterns to ignore |
| `cache` | boolean | `true` | Enable result caching |
| `cacheLocation` | string | `.dukestyle-cache` | Cache directory |
| `plugins` | array | `[]` | Custom plugin configurations |

### Language Configuration

Each language can have the following options:

| Option | Type | Description |
|--------|------|-------------|
| `enabled` | boolean | Enable/disable language checking |
| `extensions` | string[] | File extensions to match |
| `linters` | object | Linter configurations |
| `formatters` | string[] | Formatters to use for fixing |

### Linter Configuration

Each linter can have:

| Option | Type | Description |
|--------|------|-------------|
| `enabled` | boolean | Enable/disable this linter |
| `command` | string | Custom command path |
| `args` | string[] | Additional command arguments |
| `configFile` | string | Path to linter config file |

## Supported Languages & Linters

| Language | Linters | Can Fix |
|----------|---------|---------|
| Python | black, flake8 | Yes (black) |
| TypeScript/JavaScript | eslint, prettier | Yes |
| Bash | shellcheck | No |
| YAML | yamllint | No |
| JSON | prettier | Yes |
| Markdown | markdownlint | Yes |
| Terraform | terraform fmt, terraform validate, tflint | Yes (fmt) |
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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install CLI
        run: npm install -g devops-engineering-style-guide

      - name: Check style
        run: devops-style check --format sarif > results.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

### GitLab CI

```yaml
style-check:
  image: node:20
  script:
    - npm install -g devops-engineering-style-guide
    - devops-style check --format json > style-report.json
  artifacts:
    reports:
      codequality: style-report.json
```

## Custom Plugins

Create custom plugins to add your own linters and rules.

### Plugin Structure

```javascript
// my-plugin.js
export default {
  name: 'my-plugin',
  version: '1.0.0',

  linters: [
    {
      name: 'my-custom-linter',
      language: 'python',

      async check(files, config) {
        // Implement check logic
        return files.map(file => ({
          file,
          language: 'python',
          issues: [],
          fixable: 0,
        }));
      },

      async fix(files, config) {
        // Implement fix logic
        return files.map(file => ({
          file,
          language: 'python',
          issues: [],
          fixable: 0,
          fixed: 0,
        }));
      },
    },
  ],
};
```

### Using Plugins

```yaml
# .dukestyle.yaml
plugins:
  - name: my-plugin
    path: ./plugins/my-plugin.js
    options:
      customOption: value
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (no errors) |
| 1 | Style violations found |
| 2 | Configuration error |

## Related

- [DevOps Engineering Style Guide](https://tydukes.github.io/coding-style-guide/)
- [Docker Container](https://github.com/tydukes/coding-style-guide/pkgs/container/coding-style-guide)

## License

MIT
