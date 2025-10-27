# CLAUDE.md - AI Assistant Guide

This document provides context for AI assistants (like Claude Code) working with this repository.

## Project Overview

**The Dukes Engineering Style Guide** is a comprehensive, multi-language coding
style guide that defines consistent, secure, and AI-optimized standards for
DevOps and software engineering practices.

- **Author**: Tyler Dukes
- **Repository**: <https://github.com/tydukes/coding-style-guide>
- **Documentation Site**: <https://tydukes.github.io/coding-style-guide/>
- **License**: MIT

## Project Structure

```text
coding-style-guide/
├── docs/                           # MkDocs documentation source
│   ├── 01_overview/               # General principles and governance
│   ├── 02_language_guides/        # Language-specific style guides
│   ├── 03_metadata_schema/        # Schema documentation
│   ├── 04_templates/              # Document templates
│   ├── 05_ci_cd/                  # CI/CD and validation pipelines
│   ├── 06_container/              # Container usage documentation
│   ├── 07_integration/            # Integration guides
│   ├── changelog.md               # Project changelog
│   └── index.md                   # Documentation home page
├── .github/                        # GitHub workflows and actions
│   ├── workflows/                 # CI/CD workflows
│   └── actions/                   # Custom GitHub actions
├── Dockerfile                      # Container definition
├── docker-compose.yml             # Local development container setup
├── docker-entrypoint.sh           # Container entry point script
├── mkdocs.yml                     # MkDocs configuration
├── pyproject.toml                 # Python project configuration
└── uv.lock                        # Dependency lock file
```

## Languages Covered

The style guide provides standards for:

- **Infrastructure as Code**: Terraform, Terragrunt, Ansible, Kubernetes/Helm
- **Programming Languages**: Python, TypeScript, Bash, PowerShell, SQL
- **CI/CD**: Jenkins/Groovy, GitHub Actions
- **Configuration**: YAML, JSON, Dockerfile

## Development Setup

### Prerequisites

- Python 3.10 or higher
- [uv](https://docs.astral.sh/uv/) package manager

### Local Development

1. Install dependencies:

   ```bash
   uv sync
   ```

2. Run the documentation server:

   ```bash
   mkdocs serve
   ```

   Access at: <http://127.0.0.1:8000>

### Docker Development

```bash
docker-compose up
```

## Key Features

### 1. Metadata Schema

The project includes a comprehensive metadata schema for documentation
frontmatter. When working with documentation files in `docs/`, be aware of:

- Required metadata fields in YAML frontmatter
- Validation rules (see `03_metadata_schema/`)

### 2. AI Validation Pipeline

The project includes an AI-powered validation pipeline
(`05_ci_cd/ai_validation_pipeline.md`) for automated code review and style
checking.

### 3. Container Support

A containerized version is available for easy integration into CI/CD pipelines
(`06_container/usage.md`).

### 4. Pre-commit Hooks

The project uses pre-commit hooks for code quality. Configured in `pyproject.toml`.

## Working with Documentation

### Adding New Style Guide Content

1. Create a new markdown file in the appropriate `docs/` subdirectory
2. Add proper YAML frontmatter (see existing files for examples)
3. Update `mkdocs.yml` navigation if adding a new page
4. Run `mkdocs serve` to preview changes locally

### Modifying Existing Guides

1. Always read the full file before making changes
2. Maintain consistent formatting with existing content
3. Preserve the existing structure and metadata
4. Test locally with `mkdocs serve`

## GitHub Workflows

The repository includes several CI/CD workflows:

- **ci.yml**: Continuous integration checks
- **deploy.yml**: Documentation deployment to GitHub Pages
- **sync.yml**: Repository synchronization tasks
- **container.yml**: Container build and validation

When modifying workflows, ensure they remain compatible with the project's validation requirements.

## Common Tasks

### Adding a New Language Guide

1. Create a new file: `docs/02_language_guides/{language}.md`
2. Follow the structure of existing language guides
3. Add metadata frontmatter
4. Update `mkdocs.yml` navigation under "Language Guides"
5. Test locally

### Updating Dependencies

```bash
uv sync --upgrade
```

### Running Tests

```bash
uv run pytest
```

### Code Formatting

```bash
uv run black .
uv run flake8
```

## Integration with Other Projects

The style guide is designed to be referenced and integrated into other projects.
See `07_integration/integration_prompt.md` for guidance on how to integrate
these standards into your workflow.

## Important Notes for AI Assistants

1. **Preserve Metadata**: When editing documentation files, always preserve YAML frontmatter
2. **Follow Style Guide**: Apply the standards documented here when working on code
3. **Test Changes**: Always test documentation changes with `mkdocs serve`
4. **Respect Structure**: Maintain the existing directory structure
5. **CI/CD Awareness**: Be mindful of GitHub Actions that validate changes
6. **Container First**: The project supports containerized workflows

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

## Security

See [SECURITY.md](SECURITY.md) for security policies and vulnerability reporting.

## Questions?

For questions about the project structure or contributing, please:

1. Review the documentation at <https://tydukes.github.io/coding-style-guide/>
2. Check existing GitHub issues
3. Open a new issue if needed

---

*This file is specifically designed to help AI assistants understand and work effectively with this repository.*
