# Integration Examples

This directory contains example configurations for integrating the coding style guide
validator into various development workflows.

## Directory Structure

```text
examples/
├── github-actions/    # GitHub Actions workflow examples
├── gitlab-ci/         # GitLab CI configuration examples
└── local/             # Local development usage examples
```

## GitHub Actions

**File**: `github-actions/ci.yml`

Examples of using the validator in GitHub Actions workflows:

1. **Reusable Action** (recommended)
2. **Direct container usage**
3. **Multiple validation stages**
4. **Auto-formatting workflow**

Copy the relevant sections to your `.github/workflows/ci.yml` file.

## GitLab CI

**File**: `gitlab-ci/.gitlab-ci.yml`

Examples for GitLab CI/CD pipelines:

1. **Basic validation job**
2. **Separate linting and docs validation**
3. **Auto-format job (manual trigger)**
4. **Validation with Docker caching**

Copy the relevant sections to your `.gitlab-ci.yml` file.

## Local Development

### Makefile

**File**: `local/Makefile`

Provides convenient make targets for local validation:

```bash
# Show available targets
make help

# Run full validation
make validate

# Run linters only
make lint

# Auto-format code
make format

# Validate documentation
make docs
```

### Shell Script

**File**: `local/validate.sh`

Simple wrapper script for command-line usage:

```bash
# Make executable
chmod +x validate.sh

# Run validation
./validate.sh validate

# Run linters
./validate.sh lint
```

## Quick Start

### For Your Repository

1. **Choose your platform** (GitHub Actions, GitLab CI, or local)
2. **Copy the example** to your repository
3. **Customize as needed** (paths, branches, triggers)
4. **Test the integration** with a sample commit

### Example: Adding to GitHub Actions

```bash
# In your repository
mkdir -p .github/workflows

# Copy example
curl -o .github/workflows/validate.yml \
  https://raw.githubusercontent.com/tydukes/coding-style-guide/main/examples/github-actions/ci.yml

# Edit as needed
vim .github/workflows/validate.yml

# Commit and push
git add .github/workflows/validate.yml
git commit -m "chore: add coding standards validation"
git push
```

### Example: Adding Local Validation

```bash
# Copy Makefile
curl -o Makefile \
  https://raw.githubusercontent.com/tydukes/coding-style-guide/main/examples/local/Makefile

# Run validation
make validate
```

## Customization

### Container Image

Use a specific version instead of `latest`:

```yaml
# GitHub Actions
- uses: tydukes/coding-style-guide/.github/actions/validate@main
  with:
    image: ghcr.io/tydukes/coding-style-guide:v1.0.0
```

```bash
# Makefile
IMAGE = ghcr.io/tydukes/coding-style-guide:v1.0.0
```

### Validation Modes

Available modes:

- `validate` - Full validation (linting + docs + metadata)
- `lint` - Linters only
- `format` - Auto-format code
- `docs` - Documentation validation only
- `metadata` - Metadata validation only

### Environment Variables

- `STRICT=true` - Fail on warnings
- `DEBUG=true` - Enable debug output

## More Information

- **Full Documentation**: [Container Usage Guide](../docs/06_container/usage.md)
- **GitHub Repository**: <https://github.com/tydukes/coding-style-guide>

## Support

For issues or questions:

- Open an issue: <https://github.com/tydukes/coding-style-guide/issues>
- Check the documentation: <https://tydukes.github.io/coding-style-guide/>
