---
title: "Frequently Asked Questions"
description: "Common questions about using the Dukes Engineering Style Guide"
author: "Tyler Dukes"
tags: [faq, help, questions, troubleshooting, getting-started]
category: "Reference"
status: "active"
search_keywords: [faq, frequently asked questions, help, how to, common questions, troubleshooting]
---

Quick answers to common questions about adopting and using the Dukes Engineering
Style Guide.

---

## Getting Started

### How do I get started with this style guide?

Start with the [Getting Started](01_overview/getting_started.md) guide, which
walks through setup, prerequisites, and first steps. If you prefer a hands-on
approach, try the [Zero to Validated Python Project](12_tutorials/python_project.md)
tutorial.

### Which languages does this style guide cover?

The guide covers 19+ languages and tools across infrastructure, programming,
CI/CD, and configuration:

- **Infrastructure as Code**: Terraform, Terragrunt, HCL, AWS CDK,
  CloudFormation, Bicep, Pulumi, Kubernetes/Helm, Crossplane, GitOps
- **Configuration Management**: Ansible
- **Programming**: Python, Go, TypeScript, Bash, PowerShell, SQL
- **CI/CD**: GitHub Actions, GitLab CI, Jenkins/Groovy
- **Data Formats**: YAML, JSON, JSON Schema, TOML/INI
- **Containers**: Dockerfile, Docker Compose, Dev Containers
- **Build Tools**: Makefile, Task, Just

See the full [Language Comparison Matrix](02_language_guides/comparison_matrix.md)
for feature-by-feature comparisons.

### How do I choose the right tool for my project?

Use the [Decision Trees](01_overview/decision_trees.md) to walk through
common scenarios and get tool recommendations based on your requirements.

### How do I adopt this guide incrementally?

The [Maturity Model](01_overview/maturity_model.md) defines five levels of
adoption, from basic formatting to full AI-optimized compliance. Start at
Level 1 and progress as your team matures.

---

## Validation and Linting

### How do I validate my code against this style guide?

There are three approaches, from simplest to most comprehensive:

**1. Pre-commit hooks** (recommended for all projects):

```bash
# Install pre-commit hooks
pre-commit install

# Run all hooks manually
pre-commit run --all-files
```

**2. Container-based validation** (no local dependencies needed):

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

**3. Local scripts** (for this repository):

```bash
uv run python scripts/validate_metadata.py docs/
uv run python scripts/analyze_code_ratio.py
bash scripts/pre_commit_linter.sh
```

See the [Local Validation Setup](05_ci_cd/local_validation_setup.md) guide
for detailed instructions.

### How do I set up pre-commit hooks?

Follow the [Pre-commit Hooks Guide](05_ci_cd/precommit_hooks_guide.md) or
use the [Pre-commit Config Template](04_templates/precommit_config_template.md)
as a starting point for your project.

### How do I integrate validation into my CI/CD pipeline?

- **GitHub Actions**: See the [GitHub Actions Guide](05_ci_cd/github_actions_guide.md)
  and [Workflow Templates](04_templates/github_actions_workflow_templates.md)
- **GitLab CI**: See the [GitLab CI Guide](05_ci_cd/gitlab_ci_guide.md)
- **Jenkins**: See the [Jenkins Pipeline Guide](05_ci_cd/jenkins_pipeline_guide.md)

### Why does the spell checker fail on my new technical terms?

The spell checker uses a whitelist of allowed terms in `.github/cspell.json`.
Add new technical terms to the `words` array in that file. Run locally first
to verify:

```bash
npx cspell "docs/**/*.md"
```

---

## Language-Specific Questions

### How do I validate Python code?

Python validation uses Black (formatting) and Flake8 (linting):

```bash
# Format with Black
uv run black .

# Lint with Flake8
uv run flake8

# Type checking with mypy
uv run mypy .
```

See the [Python Style Guide](02_language_guides/python.md) for complete
standards.

### What's the difference between Terraform and Terragrunt?

**Terraform** is the IaC tool that defines infrastructure resources using HCL.
**Terragrunt** is a thin wrapper around Terraform that helps keep configurations
DRY, manages remote state, and orchestrates dependencies between modules.

- Use **Terraform** for module definitions: [Terraform Guide](02_language_guides/terraform.md)
- Use **Terragrunt** for live infrastructure orchestration: [Terragrunt Guide](02_language_guides/terragrunt.md)
- See also the [HCL Guide](02_language_guides/hcl.md) for the underlying
  configuration language

### How should I format my Bash scripts?

Follow the [Bash Style Guide](02_language_guides/bash.md). Key requirements:

- Always use `#!/usr/bin/env bash` shebang
- Run ShellCheck on all scripts
- Use `set -euo pipefail` for error handling
- Quote all variables: `"${var}"`

### Which CI/CD platform should I use?

That depends on your ecosystem:

- **GitHub-hosted repos**: [GitHub Actions](02_language_guides/github_actions.md)
  is the natural choice
- **GitLab-hosted repos**: [GitLab CI](02_language_guides/gitlab_ci.md) is
  tightly integrated
- **Enterprise/complex pipelines**: [Jenkins](02_language_guides/jenkins_groovy.md)
  offers maximum flexibility

See the [Decision Trees](01_overview/decision_trees.md) for a guided
recommendation.

### How do I write Dockerfiles that follow this guide?

See the [Dockerfile Style Guide](02_language_guides/dockerfile.md) and the
[Dockerfile Template](04_templates/dockerfile_template.md) for a ready-to-use
starting point. Key principles: multi-stage builds, minimal base images, and
non-root users.

---

## Templates and Examples

### Where do I find project templates?

All templates are in the [Templates](04_templates/README_template.md) section:

| Template | Use Case |
|----------|----------|
| [README](04_templates/README_template.md) | Project documentation |
| [Terraform Module](04_templates/terraform_module_template.md) | IaC modules |
| [Python Package](04_templates/python_package_template.md) | Python libraries |
| [Dockerfile](04_templates/dockerfile_template.md) | Container images |
| [GitHub Actions](04_templates/github_actions_workflow_templates.md) | CI/CD workflows |
| [Helm Chart](04_templates/helm_chart_template.md) | Kubernetes deployments |
| [CONTRACT.md](04_templates/contract_template.md) | Module contracts |

### Are there complete example projects?

Yes, see the [Examples](05_examples/python_package_example.md) section for
full, production-ready implementations:

- [Python Package](05_examples/python_package_example.md)
- [Flask API](05_examples/flask_api_example.md)
- [Terraform Module](05_examples/terraform_module_example.md)
- [Ansible Role](05_examples/ansible_role_example.md)
- [TypeScript Library](05_examples/typescript_library_example.md)
- [React App](05_examples/react_app_example.md)
- [Monorepo Full-Stack](05_examples/monorepo_fullstack_example.md)
- [GitHub Actions Workflows](05_examples/github_actions_example.md)

---

## Metadata and Documentation

### What metadata tags should I include in my code?

At minimum, include `@module`, `@description`, and `@version`. The full schema
is documented in the [Metadata Schema Reference](03_metadata_schema/schema_reference.md).

```python
"""
@module my_module
@description Handles user authentication and session management
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
@status stable
"""
```

### What's the 3:1 code-to-text ratio?

Language guides must maintain at least 3 lines of code examples for every 1
line of explanatory text. This "show, don't tell" philosophy ensures guides
are example-rich and practical. Verify with:

```bash
uv run python scripts/analyze_code_ratio.py
```

### How do I add YAML frontmatter to documentation files?

Every documentation file needs this frontmatter:

```yaml
---
title: "Document Title"
description: "Brief purpose description"
author: "Tyler Dukes"
tags: [tag1, tag2, tag3]
category: "Category Name"
status: "active"
---
```

---

## Security

### How do I set up security scanning?

See the [Security Scanning Guide](05_ci_cd/security_scanning_guide.md) for
SAST, DAST, dependency scanning, and container scanning setup.

### How do I handle secrets in my code?

Never commit secrets to version control. Use environment variables or secret
management tools. The pre-commit hooks include `detect-private-key` to catch
accidental commits. See the
[Environment Configuration](05_ci_cd/environment_configuration.md) guide for
secret management patterns.

### How should I handle dependency updates?

Follow the [Dependency Update Policies](05_ci_cd/dependency_update_policies.md)
guide. Use Dependabot or Renovate for automated dependency updates, and
configure [auto-merge](05_ci_cd/dependabot_auto_merge.md) for trusted sources.

---

## Testing

### What testing strategy should I follow?

The [Testing Strategies](05_ci_cd/testing_strategies.md) guide covers the test
pyramid, coverage targets, and when to use each test type. For IaC-specific
testing, see [IaC Testing Standards](05_ci_cd/iac_testing_standards.md).

### How do I test infrastructure code?

Use the [IaC Testing Standards](05_ci_cd/iac_testing_standards.md) which covers
Terratest, Kitchen, InSpec, and OPA. The
[CONTRACT.md Template](04_templates/contract_template.md) provides a framework
for defining testable guarantees.

### How do I set up performance testing?

See the [Performance Testing Standards](05_ci_cd/performance_testing_standards.md)
for load testing, benchmarking, and performance budgets.

---

## Migration

### How do I migrate from PEP 8 to this style guide?

See the [PEP 8 Migration Guide](10_migration_guides/from_pep8.md). The main
differences are Black formatting (100-char line length vs PEP 8's 79) and
metadata tag requirements.

### How do I migrate from the Google Style Guide?

See the [Google Style Guide Migration](10_migration_guides/from_google.md)
for a detailed comparison and step-by-step transition plan.

### How do I migrate from the Airbnb Style Guide?

See the [Airbnb Style Guide Migration](10_migration_guides/from_airbnb.md)
for JavaScript/TypeScript-specific migration steps.

---

## Contributing

### How do I contribute to this style guide?

See [CONTRIBUTING.md](https://github.com/tydukes/coding-style-guide/blob/main/CONTRIBUTING.md)
for guidelines. All commits must follow the
[conventional commit](https://www.conventionalcommits.org/) format.

### How do I add a new language guide?

Follow the [Language Guide Template](04_templates/language_guide_template.md)
structure. Key requirements:

1. Create the file in `docs/02_language_guides/`
2. Include YAML frontmatter with all required fields
3. Maintain a 3:1 code-to-text ratio
4. Update `mkdocs.yml` navigation
5. Add search keywords for discoverability

---

*Can't find what you're looking for? Check the [Topic Index](topic_index.md),
[Glossary](glossary.md), or use the search bar above. You can also
[open an issue](https://github.com/tydukes/coding-style-guide/issues) for
additional help.*
