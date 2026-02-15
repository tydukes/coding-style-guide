---
title: "Decision Trees and Flowcharts"
description: "Interactive decision trees to help you quickly find the right guide, tool, or pattern for your specific situation"
author: "Tyler Dukes"
tags: [decision-trees, flowcharts, navigation, guides]
category: "Overview"
status: "active"
search_keywords: [decision tree, tool selection, choosing, comparison, which tool, flowchart]
---

Need help finding the right guide or making a decision? Use these interactive
flowcharts to quickly navigate to the documentation you need.

## Quick Navigation

- [Which Language Guide Should I Use?](#which-language-guide-should-i-use)
- [Terraform vs Terragrunt: Which Should I Use?](#terraform-vs-terragrunt-which-should-i-use)
- [What Testing Strategy Should I Use?](#what-testing-strategy-should-i-use)
- [How Should I Handle Secrets?](#how-should-i-handle-secrets)
- [CI/CD Pipeline Design Decision](#cicd-pipeline-design-decision)
- [Project Setup Decision Tree](#project-setup-decision-tree)

---

## Which Language Guide Should I Use?

Use this flowchart to determine which language guide applies to your current work.

```mermaid
flowchart TD
    Start[What are you working with?] --> Type{What type of code?}

    Type -->|Infrastructure| IaC{Which IaC tool?}
    Type -->|Programming| Lang{Which language?}
    Type -->|Configuration| Config{What format?}
    Type -->|CI/CD| CICD{Which platform?}
    Type -->|Containers| Container{Docker?}

    IaC -->|Terraform modules| TF[Terraform Guide]
    IaC -->|Terragrunt live| TG[Terragrunt Guide]
    IaC -->|Kubernetes manifests| K8s[Kubernetes Guide]
    IaC -->|Ansible playbooks| Ansible[Ansible Guide]
    IaC -->|AWS CDK| CDK[AWS CDK Guide]

    Lang -->|Python| PY[Python Guide]
    Lang -->|TypeScript/JavaScript| TS[TypeScript Guide]
    Lang -->|Bash scripts| Bash[Bash Guide]
    Lang -->|PowerShell| PS[PowerShell Guide]
    Lang -->|SQL queries| SQL[SQL Guide]

    Config -->|YAML files| YAML[YAML Guide]
    Config -->|JSON files| JSON[JSON Guide]

    CICD -->|GitHub Actions| GHA[GitHub Actions Guide]
    CICD -->|GitLab CI| GL[GitLab CI Guide]
    CICD -->|Jenkins| Jenkins[Jenkins/Groovy Guide]

    Container -->|Dockerfile| DF[Dockerfile Guide]
    Container -->|docker-compose.yml| DC[Docker Compose Guide]
```

### Language Guide Resources

- [Terraform Style Guide](../02_language_guides/terraform.md)
- [Terragrunt Style Guide](../02_language_guides/terragrunt.md)
- [Python Style Guide](../02_language_guides/python.md)
- [TypeScript Style Guide](../02_language_guides/typescript.md)
- [Bash Style Guide](../02_language_guides/bash.md)
- [Comparison Matrix](../02_language_guides/comparison_matrix.md)

---

## Terraform vs Terragrunt: Which Should I Use?

Confused about when to use Terraform vs Terragrunt? This flowchart helps you
decide based on your project requirements.

```mermaid
flowchart TD
    Start[Terraform Project Decision] --> Modules{Writing reusable<br/>modules?}

    Modules -->|Yes| TF[Use Terraform]
    Modules -->|No| Env{Multiple<br/>environments?}

    Env -->|No, single env| TF
    Env -->|Yes| DRY{Need to stay DRY<br/>across environments?}

    DRY -->|No| TF2[Use Terraform<br/>with workspaces]
    DRY -->|Yes| Backend{Backend config<br/>duplicated?}

    Backend -->|Yes, it's painful| TG[Use Terragrunt]
    Backend -->|No| Deps{Need dependency<br/>orchestration?}

    Deps -->|Yes| TG
    Deps -->|No| TF2

    TF --> TFGuide[Read: Terraform Guide]
    TG --> TGGuide[Read: Terragrunt Guide]
    TF2 --> TFGuide
```

### Key Principles

**Use Terraform when:**

- Writing reusable modules for shared infrastructure components
- Managing a single environment or simple multi-environment setup
- Backend configuration is minimal and not duplicated

**Use Terragrunt when:**

- Managing multiple environments (dev, staging, prod) with similar infrastructure
- Backend configuration is duplicated across environments
- You need dependency orchestration between infrastructure components
- DRY (Don't Repeat Yourself) is a priority

### IaC Resources

- [Terraform Style Guide](../02_language_guides/terraform.md)
- [Terragrunt Style Guide](../02_language_guides/terragrunt.md)
- [IaC Testing Standards](../05_ci_cd/iac_testing_standards.md)

---

## What Testing Strategy Should I Use?

Choose the right testing approach based on your language and testing requirements.

```mermaid
flowchart TD
    Start[What are you testing?] --> Type{Code type?}

    Type -->|Python| PyTest{Testing needs?}
    Type -->|Terraform| TFTest{Testing needs?}
    Type -->|Ansible| AnsibleTest{Testing needs?}
    Type -->|TypeScript| TSTest{Testing needs?}

    PyTest -->|Unit tests| Pytest[pytest + fixtures]
    PyTest -->|Integration tests| PyInt[pytest with test DB]
    PyTest -->|API tests| PyAPI[pytest + requests]

    TFTest -->|Module validation| TFValidate[terraform validate]
    TFTest -->|Integration tests| Terratest[Terratest in Go]
    TFTest -->|Compliance| Checkov[Checkov/tfsec]

    AnsibleTest -->|Syntax check| AnsibleLint[ansible-lint]
    AnsibleTest -->|Role testing| Molecule[Molecule with Docker]
    AnsibleTest -->|Infrastructure tests| Testinfra[Testinfra]

    TSTest -->|Unit tests| Jest[Jest]
    TSTest -->|Component tests| RTL[React Testing Library]
    TSTest -->|E2E tests| Playwright[Playwright]
```

### Testing Best Practices

**Python:**

- Use `pytest` for all Python testing
- Structure tests with fixtures for reusability
- Use `pytest-cov` for coverage reporting
- Mock external dependencies with `pytest-mock`

**Terraform:**

- Always run `terraform validate` in CI/CD
- Use Terratest for integration testing real infrastructure
- Use Checkov or tfsec for security and compliance scanning
- Test modules in isolation before using in live environments

**Ansible:**

- Use `ansible-lint` for syntax and best practice checks
- Use Molecule for role testing with Docker containers
- Use Testinfra for infrastructure validation after deployment
- Test playbooks in a non-production environment first

**TypeScript:**

- Use Jest for unit and integration tests
- Use React Testing Library for component testing
- Use Playwright for E2E tests
- Maintain >80% code coverage for critical paths

### Testing Resources

- [IaC Testing Standards](../05_ci_cd/iac_testing_standards.md)
- [Testing Documentation Template](../04_templates/testing_docs_template.md)
- [Testing Strategies](../05_ci_cd/testing_strategies.md)

---

## How Should I Handle Secrets?

Determine the appropriate secrets management solution based on your environment.

```mermaid
flowchart TD
    Start[Where are secrets used?] --> Where{Environment?}

    Where -->|Local development| Local{How many devs?}
    Where -->|CI/CD pipeline| CICD{Which platform?}
    Where -->|Production| Prod{Cloud provider?}

    Local -->|Just me| DotEnv[.env file<br/>+ .gitignore]
    Local -->|Team| Vault[Team secrets manager<br/>1Password/Vault]

    CICD -->|GitHub Actions| GHSecrets[GitHub Secrets]
    CICD -->|GitLab CI| GLVars[GitLab CI Variables]
    CICD -->|Jenkins| JenkinsCred[Jenkins Credentials]

    Prod -->|AWS| SSM[AWS Secrets Manager<br/>or SSM Parameter Store]
    Prod -->|Azure| AKV[Azure Key Vault]
    Prod -->|GCP| GSecret[Google Secret Manager]
    Prod -->|Multi-cloud| HashiVault[HashiCorp Vault]

    DotEnv --> Guides[Read: Security Best Practices]
    Vault --> Guides
    GHSecrets --> Guides
    GLVars --> Guides
    JenkinsCred --> Guides
    SSM --> Guides
    AKV --> Guides
    GSecret --> Guides
    HashiVault --> Guides
```

### Secrets Management Best Practices

**Local Development:**

- **Individual developers:** Use `.env` files with `.gitignore` to prevent committing secrets
- **Team environments:** Use a shared secrets manager like 1Password, HashiCorp Vault, or AWS Secrets Manager

**CI/CD Pipelines:**

- **GitHub Actions:** Use GitHub Secrets (encrypted environment variables)
- **GitLab CI:** Use GitLab CI/CD Variables with masking enabled
- **Jenkins:** Use Jenkins Credentials Plugin with appropriate credential types

**Production:**

- **AWS:** AWS Secrets Manager for automatic rotation, SSM Parameter Store for simpler use cases
- **Azure:** Azure Key Vault with managed identities
- **GCP:** Google Secret Manager with service accounts
- **Multi-cloud:** HashiCorp Vault for centralized secrets management

### Never Do This

- Hardcode secrets in source code
- Commit `.env` files to version control
- Store secrets in CI/CD logs
- Use the same secrets across environments
- Share secrets via email or chat

### Security Resources

- [Security Best Practices](../01_overview/principles.md)
- [GitHub Actions Guide](../02_language_guides/github_actions.md)
- [Terraform Secrets Management](../02_language_guides/terraform.md)

---

## CI/CD Pipeline Design Decision

Optimize your CI/CD pipeline based on your primary constraint.

```mermaid
flowchart TD
    Start[Designing CI/CD Pipeline] --> Speed{Optimize for?}

    Speed -->|Speed| Fast{How fast?}
    Speed -->|Thoroughness| Thorough[Full validation suite]
    Speed -->|Cost| Cheap{Free tier?}

    Fast -->|<2 min| Parallel[Parallel jobs<br/>+ caching]
    Fast -->|<5 min| Staged[Staged pipeline:<br/>lint → test → build]

    Cheap -->|Yes| Minutes[Minimize build minutes]
    Cheap -->|No| Performance[Optimize performance]

    Parallel --> Strategy[Read: Performance<br/>Optimization Guide]
    Staged --> Strategy
    Thorough --> Strategy
    Minutes --> Strategy
    Performance --> Strategy
```

### Pipeline Optimization Strategies

**Speed Optimization (<2 minutes):**

- Run jobs in parallel (linting, testing, building)
- Use aggressive caching (dependencies, build artifacts)
- Only run affected tests (monorepo tools)
- Use matrix builds for multi-platform testing

**Speed Optimization (<5 minutes):**

- Use staged pipeline with fail-fast
- Stage 1: Lint and format checks
- Stage 2: Unit tests
- Stage 3: Integration tests and build

**Thoroughness:**

- Run full test suite on every commit
- Include security scanning, compliance checks
- Run E2E tests before deployment
- Generate comprehensive reports

**Cost Optimization (Free Tier):**

- Minimize build minutes (skip redundant builds)
- Use self-hosted runners for heavy workloads
- Cache aggressively
- Only run full suite on main branch

### CI/CD Resources

- [GitHub Actions Guide](../05_ci_cd/github_actions_guide.md)
- [GitLab CI Guide](../05_ci_cd/gitlab_ci_guide.md)
- [Jenkins Pipeline Guide](../05_ci_cd/jenkins_pipeline_guide.md)

---

## Project Setup Decision Tree

Determine the best approach for setting up validation in your project.

```mermaid
flowchart TD
    Start[New Project Setup] --> Existing{Existing project<br/>or new?}

    Existing -->|Existing| Assess{Current state?}
    Existing -->|New| Template[Use project template]

    Assess -->|No validation| AddVal[Add validation<br/>incrementally]
    Assess -->|Some validation| Enhance[Enhance existing<br/>validation]
    Assess -->|Well validated| Maintain[Maintain standards]

    AddVal --> Step1[Step 1: Add pre-commit hooks]
    Step1 --> Step2[Step 2: Add CI/CD validation]
    Step2 --> Step3[Step 3: Fix existing issues]
    Step3 --> Step4[Step 4: Enforce on new code]

    Enhance --> Review[Review gaps]
    Review --> Improve[Add missing checks]

    Maintain --> Monitor[Monitor metrics]
    Monitor --> Dashboard[Use health dashboard]

    Template --> Choose{Project type?}
    Choose -->|Python| PyTemplate[Python template]
    Choose -->|Terraform| TFTemplate[Terraform template]
    Choose -->|Full-stack| MonoTemplate[Monorepo template]
```

### Incremental Validation Strategy

**For Existing Projects with No Validation:**

1. **Add pre-commit hooks** - Start with formatting and basic linting
2. **Add CI/CD validation** - Run checks in pipeline (non-blocking initially)
3. **Fix existing issues** - Gradually address technical debt
4. **Enforce on new code** - Make checks blocking for new changes only

**For Projects with Some Validation:**

1. **Review current gaps** - Identify missing checks (security, testing, etc.)
2. **Add missing checks** - Incrementally add new validation
3. **Improve coverage** - Increase test coverage over time

**For Well-Validated Projects:**

1. **Monitor metrics** - Track code quality, coverage, build times
2. **Use health dashboard** - Visualize project health
3. **Continuous improvement** - Regularly review and update standards

### New Project Templates

**Python Project:**

- Pre-configured: pytest, black, flake8, mypy
- CI/CD with GitHub Actions
- Pre-commit hooks

**Terraform Project:**

- Module structure with examples
- Terratest for integration testing
- Validation and formatting in CI/CD

**Full-Stack Monorepo:**

- Turborepo or Nx for build orchestration
- Shared linting and formatting config
- Coordinated CI/CD across packages

### Project Setup Resources

- [IDE Settings Template](../04_templates/ide_settings_template.md)
- [Integration Guide](../07_integration/integration_prompt.md)
- [Pre-commit Hooks Guide](../05_ci_cd/precommit_hooks_guide.md)

---

## Additional Resources

### Quick Links

- [Comparison Matrix](../02_language_guides/comparison_matrix.md)
- [Terraform Module Template](../04_templates/terraform_module_template.md)
- [Python Package Example](../05_examples/python_package_example.md)
- [Principles and Governance](principles.md)

### Need More Help?

- [Getting Started Guide](getting_started.md)
- [Repository Structure](structure.md)
- [Glossary](../glossary.md)
- [Changelog](../changelog.md)

---

**Last Updated:** 2025-12-27
