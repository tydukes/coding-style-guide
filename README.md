# Coding Style Guide (Portal)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-mkdocs-blue.svg)](https://tydukes.github.io/coding-style-guide/)
[![Build Status](https://github.com/tydukes/coding-style-guide/actions/workflows/deploy.yml/badge.svg)](https://github.com/tydukes/coding-style-guide/actions/workflows/deploy.yml)
[![CI Status](https://github.com/tydukes/coding-style-guide/actions/workflows/ci.yml/badge.svg)](https://github.com/tydukes/coding-style-guide/actions/workflows/ci.yml)
[![Container](https://github.com/tydukes/coding-style-guide/actions/workflows/container.yml/badge.svg)](https://github.com/tydukes/coding-style-guide/actions/workflows/container.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

**The Dukes Engineering Style Guide** is a comprehensive, multi-language coding
style guide that defines consistent, secure, and AI-optimized standards for
DevOps and software engineering practices.

---

## Features

- Multi-language style guides (Terraform, Ansible, Python, TypeScript, Bash, and more)
- AI validation pipeline integration
- Containerized validation tools
- Comprehensive metadata schema
- GitHub Actions workflows for automated validation
- MkDocs-based documentation with Material theme

## Quick Start

### Local Development

Run `mkdocs serve` locally to preview.

```bash
# Install dependencies using uv
uv sync

# Start the development server
mkdocs serve
```

Visit <http://127.0.0.1:8000> to view the documentation.

### Using Docker

```bash
docker-compose up
```

### IDE Setup

This repository includes pre-configured IDE settings that automatically enforce
the style guide standards. Copy these files to your project for automatic
formatting and linting.

#### VS Code

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

#### IntelliJ/PyCharm

```bash
# Copy IntelliJ settings
cp -r .idea your-project/
```

Includes:

- Code style settings for all languages
- Inspection profiles matching linting standards
- Auto-format on save configuration

#### EditorConfig (Universal)

```bash
# Copy EditorConfig (works with all editors)
cp .editorconfig your-project/
```

EditorConfig provides language-specific indentation and line endings that work
across all editors (VS Code, IntelliJ, Vim, Emacs, etc.).

**Supported languages:** Python, Terraform, YAML, Bash, TypeScript, Markdown,
SQL, PowerShell, Groovy, and more.

For detailed setup instructions, see the
[IDE Settings Template](https://tydukes.github.io/coding-style-guide/04_templates/ide_settings_template/).

## Documentation

Full documentation is available at: <https://tydukes.github.io/coding-style-guide/>

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Code of Conduct

This project adheres to the
[Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating,
you are expected to uphold this code.

## Security

See our [Security Policy](SECURITY.md) for reporting vulnerabilities.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Tyler Dukes

- GitHub: [@tydukes](https://github.com/tydukes)
- LinkedIn: [tydukes](https://linkedin.com/in/tydukes)
