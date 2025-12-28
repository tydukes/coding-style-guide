# Contributing to Coding Style Guide

Thank you for your interest in contributing to the Coding Style Guide! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Issue and PR Labels](#issue-and-pr-labels)
- [Development Setup](#development-setup)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to
uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/coding-style-guide.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`

## How to Contribute

### Reporting Bugs

- Use the GitHub issue tracker
- Check if the issue has already been reported
- Include detailed steps to reproduce the bug
- Provide your environment details (OS, Python version, etc.)

### Suggesting Enhancements

- Use the GitHub issue tracker with the "enhancement" label
- Clearly describe the feature and its benefits
- Provide examples of how it would work

### Adding or Updating Style Guidelines

- Ensure your changes are well-documented
- Include examples of good and bad practices
- Provide rationale for the guideline
- Update relevant tests if applicable

## Issue and PR Labels

We use a structured labeling system to organize work and make it easier to find relevant issues and PRs.

### When Creating Issues

Please add appropriate labels to your issues:

- **Type** (required): What kind of issue is this?
  - `type:feature` - New feature or request
  - `type:bug` - Something isn't working
  - `type:docs` - Documentation improvements
  - `type:maintenance` - Routine maintenance
  - `type:security` - Security-related fixes

- **Scope** (optional): Which part of the project does this affect?
  - `scope:dependencies` - Dependency updates
  - `scope:language-guide` - Language-specific guides
  - `scope:ide-settings` - IDE configurations
  - `scope:automation` - CI/CD and scripts
  - `scope:container` - Docker-related changes

- **Priority** (optional): How urgent is this?
  - `priority:critical` - Immediate action required
  - `priority:high` - Important but not urgent
  - `priority:medium` - Normal importance
  - `priority:low` - Nice to have

- **Language** (if applicable): Which language guide is affected?
  - Use language labels like `terraform`, `python`, `bash`, `typescript`, etc.

### When Working on Issues

Add status labels to track progress:

- `status:in-progress` - When you start working on an issue
- `status:blocked` - If you're waiting on something or someone
- `status:needs-review` - When you're ready for review

### Full Label Taxonomy

For the complete label taxonomy and usage guidelines, see the [Label Taxonomy section in CLAUDE.md](CLAUDE.md#label-taxonomy).

## Development Setup

### Prerequisites

- Python 3.8 or higher
- [uv](https://docs.astral.sh/uv/) package manager

### Local Development

1. Install dependencies using uv:

   ```bash
   uv sync
   ```

2. Run the local development server:

   ```bash
   mkdocs serve
   ```

3. Access the documentation at `http://127.0.0.1:8000`

### Using Docker

Alternatively, you can use Docker for development:

```bash
docker-compose up
```

## Submitting Changes

1. Ensure your code follows the project's style guidelines
2. Run any existing tests
3. Update documentation as needed
4. Commit your changes with clear, descriptive commit messages
5. Push to your fork
6. Submit a pull request

### Pull Request Guidelines

- Fill in the pull request template
- Reference any related issues
- Keep changes focused and atomic
- Ensure CI checks pass
- Respond to review feedback promptly

### Commit Message Format

Use clear and descriptive commit messages:

```text
type: brief description

Longer explanation if necessary

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Style Guidelines

### Documentation

- Use clear, concise language
- Provide code examples where applicable
- Follow Markdown best practices
- Use proper headings hierarchy

### Code

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Questions?

Feel free to open an issue for any questions or concerns. We're here to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
