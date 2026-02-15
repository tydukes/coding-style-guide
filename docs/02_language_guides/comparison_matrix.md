---
title: "Language Guide Comparison Matrix"
description: "Cross-language comparison of patterns, conventions, and best practices across all 19 language guides"
author: "Tyler Dukes"
tags: [comparison, cross-reference, multi-language, patterns, best-practices]
category: "Language Guides"
status: "active"
search_keywords: [comparison, matrix, language comparison, feature comparison, tool selection, overview]
---

<!--
@module comparison_matrix
@description Cross-language comparison of patterns, conventions, and best practices across all 19 language guides
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-12-27
@status stable
-->

## Overview

This comprehensive matrix provides side-by-side comparisons of common patterns, conventions, and best practices
across all 19 language guides. Use this to understand similarities and differences when working with multiple
languages or transitioning between them.

## Quick Navigation

- [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)
- [Testing Frameworks](#testing-frameworks)
- [Security Best Practices](#security-best-practices)
- [Code Organization](#code-organization)
- [Line Length & Formatting](#line-length--formatting)
- [Documentation Standards](#documentation-standards)
- [Dependency Management](#dependency-management)
- [Common Anti-Patterns](#common-anti-patterns)
- [CI/CD Integration](#cicd-integration)
- [Linting & Validation](#linting--validation)

## Naming Conventions

### Naming: Programming Languages

| Language | Variables | Functions | Classes | Constants | Files |
|----------|-----------|-----------|---------|-----------|-------|
| Python | `snake_case` | `snake_case` | `PascalCase` | `UPPER_SNAKE` | `snake_case.py` |
| TypeScript | `camelCase` | `camelCase` | `PascalCase` | `UPPER_SNAKE` | `kebab-case.ts` |
| Bash | `snake_case` | `snake_case` | N/A | `UPPER_SNAKE` | `kebab-case.sh` |
| PowerShell | `PascalCase` | `Verb-Noun` | `PascalCase` | `PascalCase` | `PascalCase.ps1` |
| SQL | `snake_case` | `snake_case` | N/A | `UPPER_SNAKE` | `snake_case.sql` |
| Groovy (Jenkins) | `camelCase` | `camelCase` | `PascalCase` | `UPPER_SNAKE` | `Jenkinsfile` |

### Naming: Infrastructure as Code

| Language | Resources | Variables | Modules | Files |
|----------|-----------|-----------|---------|-------|
| Terraform | `snake_case` | `snake_case` | `snake_case` | `snake_case.tf` |
| Terragrunt | `snake_case` | `snake_case` | `snake_case` | `terragrunt.hcl` |
| HCL | `snake_case` | `snake_case` | N/A | `snake_case.hcl` |
| AWS CDK | `camelCase` | `camelCase` | `PascalCase` | `kebab-case.ts` |
| Ansible | `snake_case` | N/A | N/A | `kebab-case.yml` |
| Kubernetes | `kebab-case` | N/A | N/A | `kebab-case.yaml` |

### Configuration & Build

| Language | Keys | Files | Special Notes |
|----------|------|-------|---------------|
| YAML | `snake_case` or `kebab-case` | `kebab-case.yaml` | Consistent within project |
| JSON | `camelCase` | `kebab-case.json` | Follow API conventions |
| Makefile | `UPPER_SNAKE` (targets) | `Makefile` | Targets lowercase |
| Dockerfile | `UPPER_SNAKE` (args) | `Dockerfile` | Commands UPPERCASE |
| Docker Compose | `snake_case` | `docker-compose.yml` | Service names kebab-case |

## Error Handling

### Error Handling: Programming Languages

| Language | Pattern | Example |
|----------|---------|---------|
| Python | `try/except` with specific exceptions | ```python<br>try:<br>    process_data()<br>except ValueError as e:<br>    logger.error(f"Invalid data: {e}")<br>    raise<br>``` |
| TypeScript | `try/catch` with typed errors | ```typescript<br>try {<br>  await processData();<br>} catch (e) {<br>  if (e instanceof ValidationError) {<br>    logger.error(e.message);<br>  }<br>  throw e;<br>}<br>``` |
| Bash | `set -e`, `trap`, exit codes | ```bash<br>set -euo pipefail<br>trap cleanup EXIT ERR<br>command \|\| { echo "Failed"; exit 1; }<br>``` |
| PowerShell | `try/catch/finally` with `-ErrorAction` | ```powershell<br>try {<br>    Get-Item $path -ErrorAction Stop<br>} catch {<br>    Write-Error $_.Exception.Message<br>    throw<br>}<br>``` |
| SQL | Transaction rollback | ```sql<br>BEGIN TRANSACTION;<br>-- operations<br>IF @@ERROR <> 0<br>    ROLLBACK;<br>ELSE<br>    COMMIT;<br>``` |
| Groovy | `try/catch` in pipeline | ```groovy<br>try {<br>    sh 'risky-command'<br>} catch (Exception e) {<br>    currentBuild.result = 'FAILURE'<br>    throw e<br>}<br>``` |

### Error Handling: Infrastructure as Code

| Language | Pattern | Example |
|----------|---------|---------|
| Terraform | Validation blocks | ```hcl<br>variable "instance_count" {<br>  validation {<br>    condition     = var.instance_count > 0<br>    error_message = "Must be positive"<br>  }<br>}<br>``` |
| Terragrunt | `terragrunt.hcl` error handling | ```hcl<br>terraform {<br>  before_hook "validate" {<br>    commands = ["apply", "plan"]<br>    execute  = ["terraform", "validate"]<br>  }<br>}<br>``` |
| Ansible | `failed_when`, `ignore_errors` | ```yaml<br>- command: risky_command<br>  register: result<br>  failed_when: result.rc not in [0, 2]<br>``` |
| AWS CDK | Exception handling in constructs | ```typescript<br>if (!props.vpcId) {<br>  throw new Error('vpcId required');<br>}<br>``` |
| Kubernetes | `livenessProbe`, `readinessProbe` | ```yaml<br>livenessProbe:<br>  httpGet:<br>    path: /health<br>  failureThreshold: 3<br>``` |

### CI/CD & Configuration

| Language | Pattern | Example |
|----------|---------|---------|
| GitHub Actions | `continue-on-error`, `if: failure()` | ```yaml<br>- name: Test<br>  run: pytest<br>  continue-on-error: true<br>``` |
| GitLab CI | `allow_failure`, `retry` | ```yaml<br>test:<br>  script: pytest<br>  retry: 2<br>  allow_failure: false<br>``` |

## Testing Frameworks

### Unit Testing

| Language | Framework | Example |
|----------|-----------|---------|
| Python | pytest | ```python<br>def test_user_creation():<br>    user = User("alice")<br>    assert user.name == "alice"<br>``` |
| TypeScript | Jest | ```typescript<br>test('user creation', () => {<br>  const user = new User('alice');<br>  expect(user.name).toBe('alice');<br>});<br>``` |
| Bash | bats-core | ```bash<br>@test "user creation" {<br>  run create_user "alice"<br>  [ "$status" -eq 0 ]<br>}<br>``` |
| PowerShell | Pester | ```powershell<br>Describe "User" {<br>  It "Creates user" {<br>    $user = New-User "alice"<br>    $user.Name \| Should -Be "alice"<br>  }<br>}<br>``` |
| SQL | pgTAP, utPLSQL | ```sql<br>SELECT plan(1);<br>SELECT has_table('users');<br>SELECT * FROM finish();<br>``` |

### Integration Testing

| Language | Framework | Notes |
|----------|-----------|-------|
| Python | pytest + fixtures | Use `pytest-docker`, `pytest-postgresql` |
| TypeScript | Jest + supertest | For API testing |
| Terraform | Terratest (Go) | End-to-end infrastructure tests |
| Terragrunt | Terratest | Same as Terraform |
| Ansible | Molecule | Uses Docker/Vagrant for test environments |
| AWS CDK | CDK assertions | `@aws-cdk/assertions` library |
| Kubernetes | Kind + kubectl | Local cluster testing |

### E2E Testing

| Language | Framework | Use Case |
|----------|-----------|----------|
| Python | pytest + Selenium/Playwright | Browser automation |
| TypeScript | Playwright, Cypress | Full application testing |
| Bash | shellspec | Complex script testing |
| Terraform | Terratest | Real cloud resource testing |
| Ansible | Molecule + Testinfra | Full role validation |

## Security Best Practices

### Secrets Management

| Language | Pattern | Tools |
|----------|---------|-------|
| Python | Environment variables, vault clients | `python-dotenv`, `boto3` (Secrets Manager) |
| TypeScript | Environment variables, vault | `dotenv`, `@aws-sdk/client-secrets-manager` |
| Bash | Secure file sources, AWS CLI | `aws secretsmanager get-secret-value` |
| PowerShell | SecureString, vault | `ConvertTo-SecureString`, Azure Key Vault |
| Terraform | AWS Secrets Manager, Vault | `aws_secretsmanager_secret` data source |
| Terragrunt | Inherit from Terraform | Use `sops` for encrypted files |
| Ansible | `ansible-vault` | `ansible-vault encrypt_string` |
| GitHub Actions | Secrets context | `${{ secrets.SECRET_NAME }}` |
| GitLab CI | CI/CD variables (masked) | Project/group variables |

### Input Validation

| Language | Pattern | Library |
|----------|---------|---------|
| Python | Pydantic models | `pydantic`, `marshmallow` |
| TypeScript | Zod schemas | `zod`, `joi`, `io-ts` |
| Bash | Parameter expansion, regex | Built-in `[[ ]]` tests |
| PowerShell | Parameter validation | `[ValidatePattern()]`, `[ValidateSet()]` |
| Terraform | Variable validation | `validation` block |
| Ansible | `assert` module | `- assert: that: var is defined` |
| SQL | Parameterized queries | Never string concatenation |

### Dependency Scanning

| Language | Tool | Command |
|----------|------|---------|
| Python | `bandit`, `safety`, `pip-audit` | `bandit -r .`, `safety check` |
| TypeScript | `npm audit`, `snyk` | `npm audit fix` |
| Bash | `shellcheck` | `shellcheck *.sh` |
| Terraform | `tfsec`, `checkov`, `terrascan` | `tfsec .` |
| Ansible | `ansible-lint` | `ansible-lint playbook.yml` |
| Docker | `trivy`, `grype` | `trivy image myimage:latest` |
| Kubernetes | `kube-bench`, `kubesec` | `kubesec scan pod.yaml` |

## Code Organization

### Project Structure

| Language | Standard Layout | Config Files |
|----------|----------------|--------------|
| Python | `src/`, `tests/`, `docs/` | `pyproject.toml`, `setup.py` |
| TypeScript | `src/`, `tests/`, `dist/` | `package.json`, `tsconfig.json` |
| Terraform | `modules/`, `environments/` | `versions.tf`, `terraform.tfvars` |
| Terragrunt | `modules/`, `live/` | `terragrunt.hcl`, `common.hcl` |
| Ansible | `roles/`, `playbooks/`, `inventory/` | `ansible.cfg`, `requirements.yml` |
| AWS CDK | `lib/`, `bin/`, `test/` | `cdk.json`, `package.json` |
| Kubernetes | `base/`, `overlays/` | `kustomization.yaml` |

### Module/Package Systems

| Language | Pattern | Example |
|----------|---------|---------|
| Python | Packages with `__init__.py` | ```python<br># mypackage/__init__.py<br>from .module import MyClass<br>``` |
| TypeScript | ES modules | ```typescript<br>export { MyClass } from './module';<br>``` |
| Bash | Source files | ```bash<br>source "$(dirname "$0")/lib/utils.sh"<br>``` |
| PowerShell | Modules | ```powershell<br>Import-Module ./MyModule.psm1<br>``` |
| Terraform | Module blocks | ```hcl<br>module "vpc" {<br>  source = "./modules/vpc"<br>}<br>``` |
| Ansible | Roles | ```yaml<br>roles:<br>  - role: common<br>    vars:<br>      foo: bar<br>``` |

## Line Length & Formatting

| Language | Max Line Length | Formatter | Config |
|----------|----------------|-----------|--------|
| Python | 100 chars | `black` | `pyproject.toml`: `line-length = 100` |
| TypeScript | 100 chars | `prettier` | `.prettierrc`: `printWidth: 100` |
| Bash | 100 chars | `shfmt` | `shfmt -i 2 -ci -bn` |
| PowerShell | 115 chars | `PSScriptAnalyzer` | Custom rules |
| SQL | 100 chars | `sqlfluff` | `.sqlfluff`: `max_line_length = 100` |
| Terraform | 100 chars | `terraform fmt` | Built-in |
| Terragrunt | 100 chars | `terragrunt hclfmt` | Built-in |
| YAML | 120 chars | `yamllint` | `.yamllint`: `line-length: max: 120` |
| JSON | 100 chars | `jq` | Format with `jq .` |
| Markdown | 100 chars | `markdownlint` | `.markdownlint.json` |

### Indentation Standards

| Language | Style | Size | Notes |
|----------|-------|------|-------|
| Python | Spaces | 4 | PEP 8 |
| TypeScript | Spaces | 2 | Airbnb style |
| Bash | Spaces | 2 | Google style |
| PowerShell | Spaces | 4 | Microsoft style |
| SQL | Spaces | 2 or 4 | Consistent within project |
| Terraform | Spaces | 2 | HCL style |
| YAML | Spaces | 2 | **Never tabs** |
| JSON | Spaces | 2 | For readability |
| Makefile | **Tabs** | 1 | **Required by Make** |

## Documentation Standards

### Inline Comments

| Language | Style | Example |
|----------|-------|---------|
| Python | Docstrings (PEP 257) | ```python<br>def func(x: int) -> int:<br>    """Calculate square.<br>    <br>    Args:<br>        x: Input value<br>    <br>    Returns:<br>        Square of x<br>    """<br>    return x * x<br>``` |
| TypeScript | JSDoc | ```typescript<br>/**<br> * Calculate square<br> * @param x - Input value<br> * @returns Square of x<br> */<br>function square(x: number): number {<br>  return x * x;<br>}<br>``` |
| Bash | Hash comments | ```bash<br># Calculate square of input<br># Arguments:<br>#   $1 - Input value<br># Returns:<br>#   Square of input<br>square() {<br>  echo $(( $1 * $1 ))<br>}<br>``` |
| PowerShell | Comment-based help | ```powershell<br><#<br>.SYNOPSIS<br>Calculate square<br>.PARAMETER X<br>Input value<br>#><br>function Get-Square {<br>  param([int]$X)<br>  $X * $X<br>}<br>``` |
| Terraform | Hash comments above blocks | ```hcl<br># VPC for production environment<br># Creates public and private subnets<br>resource "aws_vpc" "main" {<br>  cidr_block = var.vpc_cidr<br>}<br>``` |

### README Requirements

| Language/Context | Sections Required |
|------------------|-------------------|
| Python | Purpose, Installation, Usage, API docs, Contributing |
| TypeScript | Purpose, Installation, Quick Start, API, Examples |
| Terraform Module | Purpose, Usage, Inputs, Outputs, Requirements |
| Ansible Role | Role Variables, Dependencies, Example Playbook |
| Docker | Image description, Tags, Usage, Environment vars |

## Dependency Management

| Language | Tool | Lock File | Command |
|----------|------|-----------|---------|
| Python | `pip`, `uv`, `poetry` | `requirements.txt`, `uv.lock` | `uv sync` |
| TypeScript | `npm`, `yarn`, `pnpm` | `package-lock.json` | `npm install` |
| Bash | Package manager (apt, yum) | N/A | `apt-get install` |
| PowerShell | `PowerShellGet` | N/A | `Install-Module` |
| Terraform | `terraform init` | `.terraform.lock.hcl` | `terraform init` |
| Terragrunt | Inherits Terraform | `.terraform.lock.hcl` | `terragrunt init` |
| Ansible | `ansible-galaxy` | `requirements.yml` | `ansible-galaxy install -r requirements.yml` |
| AWS CDK | `npm` | `package-lock.json` | `npm install` |
| Docker | Base images | N/A | `FROM` directive |

### Version Pinning

| Language | Pattern | Example |
|----------|---------|---------|
| Python | Exact or compatible | `requests==2.31.0` or `requests>=2.31,<3` |
| TypeScript | Exact or caret | `"lodash": "4.17.21"` or `"^4.17.21"` |
| Terraform | Pessimistic constraint | `version = "~> 5.0"` |
| Ansible | Version in requirements | `version: "1.2.3"` |
| Docker | Digest pinning | `FROM alpine@sha256:abc123...` |

## Common Anti-Patterns

### Cross-Language Anti-Patterns

| Anti-Pattern | Languages | Better Approach |
|--------------|-----------|-----------------|
| Hardcoded credentials | **All** | Use secrets management |
| No error handling | Python, TypeScript, Bash | Always handle expected failures |
| Global state | Python, TypeScript, PowerShell | Dependency injection |
| Magic numbers | **All** | Named constants |
| Deep nesting | **All** | Early returns, extract functions |
| Missing documentation | **All** | Docstrings, README |
| No input validation | **All** | Validate at boundaries |
| Implicit dependencies | **All** | Explicit imports/requires |

### Language-Specific Anti-Patterns

| Language | Anti-Pattern | Fix |
|----------|--------------|-----|
| Python | `except Exception` without reraising | Catch specific exceptions |
| TypeScript | `any` type everywhere | Use proper types |
| Bash | `$@` without quotes | Always `"$@"` |
| PowerShell | No `-ErrorAction` | Specify error handling |
| SQL | String concatenation for queries | Parameterized queries |
| Terraform | No remote state | Always use remote state |
| Terragrunt | Duplicated configuration | Use `include` blocks |
| Ansible | `command` instead of modules | Use idempotent modules |
| Dockerfile | `apt-get update` in separate layer | Combine with install |

## CI/CD Integration

### GitHub Actions

| Language | Typical Workflow Steps |
|----------|----------------------|
| Python | Checkout → Setup Python → Install deps → Lint → Test → Coverage |
| TypeScript | Checkout → Setup Node → Install → Lint → Test → Build |
| Terraform | Checkout → Setup Terraform → Format → Init → Validate → Plan |
| Ansible | Checkout → Install Ansible → Lint → Syntax check → Test |
| Docker | Checkout → Setup buildx → Build → Scan → Push |

### GitLab CI

| Language | Stages | Cache |
|----------|--------|-------|
| Python | test, lint, deploy | `.cache/pip` |
| TypeScript | test, build, deploy | `node_modules/` |
| Terraform | validate, plan, apply | `.terraform/` |

## Linting & Validation

### Linters by Language

| Language | Linter | Auto-fix | Config File |
|----------|--------|----------|-------------|
| Python | `flake8`, `pylint`, `ruff` | `black` (format) | `.flake8`, `pyproject.toml` |
| TypeScript | `eslint` | Yes (`--fix`) | `.eslintrc.js` |
| Bash | `shellcheck` | `shfmt` (format) | `.shellcheckrc` |
| PowerShell | `PSScriptAnalyzer` | Partial | `PSScriptAnalyzerSettings.psd1` |
| SQL | `sqlfluff` | Yes | `.sqlfluff` |
| Terraform | `terraform validate` | `terraform fmt` | N/A |
| Terragrunt | `terragrunt hclfmt` | Yes | N/A |
| Ansible | `ansible-lint` | Partial | `.ansible-lint` |
| YAML | `yamllint` | `prettier` | `.yamllint` |
| JSON | `jsonlint` | `jq`, `prettier` | N/A |
| Markdown | `markdownlint` | Yes (`--fix`) | `.markdownlint.json` |
| Dockerfile | `hadolint` | No | `.hadolint.yaml` |

### Pre-commit Hook Support

| Language | Hooks Available | Repository |
|----------|----------------|------------|
| Python | black, flake8, mypy | `pre-commit/mirrors-*` |
| Bash | shellcheck, shfmt | `jumanjihouse/pre-commit-hooks` |
| Terraform | fmt, validate, docs | `antonbabenko/pre-commit-terraform` |
| Ansible | ansible-lint | `ansible/ansible-lint` |
| YAML | yamllint | `adrienverge/yamllint` |
| Markdown | markdownlint | `igorshubovych/markdownlint-cli` |

## Quick Reference: When to Use Each Language

### Infrastructure Provisioning

| Use Case | Recommended Language | Alternative |
|----------|---------------------|-------------|
| AWS infrastructure | Terraform, AWS CDK | CloudFormation |
| Multi-cloud | Terraform | Pulumi |
| AWS-only, TypeScript team | AWS CDK | Terraform |
| Configuration management | Ansible | Chef, Puppet |
| Kubernetes manifests | YAML + Helm | Kustomize |

### Scripting & Automation

| Use Case | Recommended Language | Alternative |
|----------|---------------------|-------------|
| Linux automation | Bash | Python |
| Windows automation | PowerShell | Batch |
| Cross-platform CLI | Python | TypeScript (Node) |
| CI/CD pipelines | YAML (GitHub/GitLab) | Groovy (Jenkins) |
| Complex orchestration | Python | Bash |

### Application Development

| Use Case | Recommended Language | Alternative |
|----------|---------------------|-------------|
| Backend API | Python, TypeScript | Go, Java |
| Frontend | TypeScript | JavaScript |
| Data processing | Python | SQL |
| Microservices | Python, TypeScript | Go |

### Data & Database

| Use Case | Recommended Language | Notes |
|----------|---------------------|-------|
| ETL pipelines | Python + SQL | Use pandas, SQLAlchemy |
| Data analysis | Python | Jupyter notebooks |
| Database migrations | SQL | Alembic, Flyway |
| Data validation | SQL | dbt tests |

## Usage Patterns

### Multi-Language Projects

Typical combinations found in production:

```text
Modern Web Application:
├── infrastructure/          (Terraform)
│   ├── modules/
│   └── environments/
├── backend/                 (Python/TypeScript)
│   ├── src/
│   └── tests/
├── frontend/                (TypeScript)
│   ├── src/
│   └── tests/
├── scripts/                 (Bash)
│   ├── deploy.sh
│   └── setup.sh
├── .github/workflows/       (YAML)
│   ├── ci.yml
│   └── deploy.yml
└── docker/                  (Dockerfile)
    ├── backend/
    └── frontend/
```

### Migration Paths

Common transitions between languages:

| From | To | Reason |
|------|----|----|
| Bash → Python | Complex logic | Better error handling, testing |
| JavaScript → TypeScript | Type safety | Catch errors early |
| CloudFormation → Terraform | Multi-cloud | Provider agnostic |
| Ansible → Terraform | Infrastructure | Declarative state management |
| Groovy → YAML | CI/CD | Simplicity, GitHub Actions |

## Consistency Guidelines

When working across multiple languages in the same project:

1. **Naming**: Use each language's convention, but be consistent within files
2. **Error Handling**: Always handle errors explicitly in all languages
3. **Logging**: Use structured logging (JSON) for cross-language consistency
4. **Secrets**: Single secrets management solution (AWS Secrets Manager, Vault)
5. **Testing**: Minimum 80% coverage regardless of language
6. **Documentation**: README.md per component, regardless of language
7. **CI/CD**: Single pipeline orchestrating all languages
8. **Linting**: Pre-commit hooks for all languages in the project
9. **Version Control**: Same branching strategy for all components
10. **Security**: Same scanning tools across all languages where possible

## Further Reading

For detailed, language-specific guidance:

- [Python Style Guide](python.md)
- [TypeScript Style Guide](typescript.md)
- [Terraform Style Guide](terraform.md)
- [Terragrunt Style Guide](terragrunt.md)
- [Ansible Style Guide](ansible.md)
- [Bash Style Guide](bash.md)
- [PowerShell Style Guide](powershell.md)
- [SQL Style Guide](sql.md)
- [AWS CDK Style Guide](cdk.md)
- [HCL Style Guide](hcl.md)
- [Kubernetes Style Guide](kubernetes.md)
- [Docker Style Guide](dockerfile.md)
- [Docker Compose Style Guide](docker_compose.md)
- [GitHub Actions Style Guide](github_actions.md)
- [GitLab CI Style Guide](gitlab_ci.md)
- [Jenkins Groovy Style Guide](jenkins_groovy.md)
- [YAML Style Guide](yaml.md)
- [JSON Style Guide](json.md)
- [Makefile Style Guide](makefile.md)

---

**Related Documentation:**

- [Anti-Patterns Guide](../08_anti_patterns/index.md)
- [Testing Standards](../05_ci_cd/iac_testing_standards.md)
- [Metadata Schema](../03_metadata_schema/schema_reference.md)
