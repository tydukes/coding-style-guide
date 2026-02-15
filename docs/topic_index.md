---
title: "Topic Index"
description: "Alphabetical index of all topics with cross-references for quick discovery"
author: "Tyler Dukes"
tags: [index, topics, cross-reference, navigation, discovery, search]
category: "Reference"
status: "active"
search_keywords: [topic index, alphabetical, cross-reference, find, navigate, search, sitemap]
---

Find content by topic. Each entry links to the most relevant page and includes
cross-references to related content.

---

## A

### Ansible

- **Style Guide**: [Ansible](02_language_guides/ansible.md)
- **Refactoring Examples**: [Ansible Refactoring](09_refactoring/ansible_refactoring.md)
- **Example Role**: [Ansible Role Example](05_examples/ansible_role_example.md)
- **Template**: [CONTRACT.md Template](04_templates/contract_template.md) (includes Ansible contracts)
- See also: [YAML](#yaml), [Infrastructure as Code](#infrastructure-as-code), [Configuration Management](#configuration-management)

### Anti-Patterns

- **Overview**: [Common Anti-Patterns](08_anti_patterns/index.md)
- **Code Smell Catalog**: [Code Smell Catalog](08_anti_patterns/code_smell_catalog.md)
- **Azure-Specific**: [Azure Anti-Patterns](08_anti_patterns/azure.md)
- See also: [Refactoring](#refactoring), [Code Quality](#code-quality)

### Architecture Decision Records (ADR)

- **Template**: [ADR Template](04_templates/adr_template.md)
- See also: [Governance](#governance), [Templates](#templates)

### Automation

- **Pre-commit Hooks**: [Pre-commit Hooks Guide](05_ci_cd/precommit_hooks_guide.md)
- **CI/CD Pipelines**: [GitHub Actions Guide](05_ci_cd/github_actions_guide.md)
- **Changelog Automation**: [Changelog Automation](05_ci_cd/changelog_automation_guide.md)
- **Dependabot**: [Dependabot Auto-Merge](05_ci_cd/dependabot_auto_merge.md)
- **Manual to Automated Tutorial**: [From Manual to Automated](12_tutorials/manual_to_automated.md)
- See also: [CI/CD](#cicd), [Pre-commit Hooks](#pre-commit-hooks), [Build Tools](#build-tools)

### Azure

- **Cloud Provider Guide**: [Microsoft Azure](11_cloud_providers/azure.md)
- **Azure Bicep**: [Bicep Style Guide](02_language_guides/bicep.md)
- **Anti-Patterns**: [Azure Anti-Patterns](08_anti_patterns/azure.md)
- See also: [Cloud Providers](#cloud-providers), [Infrastructure as Code](#infrastructure-as-code)

### AWS

- **CloudFormation**: [CloudFormation Style Guide](02_language_guides/cloudformation.md)
- **AWS CDK**: [CDK Style Guide](02_language_guides/cdk.md)
- **Terraform Examples**: [Terraform Module Example](05_examples/terraform_module_example.md)
- See also: [Cloud Providers](#cloud-providers), [Infrastructure as Code](#infrastructure-as-code)

---

## B

### Bash

- **Style Guide**: [Bash](02_language_guides/bash.md)
- **Refactoring Examples**: [Bash Refactoring](09_refactoring/bash_refactoring.md)
- **Shell Aliases**: [Shell Aliases & Functions](02_language_guides/shell_aliases.md)
- **REPL Usage**: [REPL & Interactive Shells](02_language_guides/repl.md)
- See also: [ShellCheck](#shellcheck), [Scripting](#scripting)

### Build Tools

- **Makefile**: [Makefile Style Guide](02_language_guides/makefile.md)
- **Task & Just**: [Task Runners](02_language_guides/task_runners.md)
- See also: [Automation](#automation)

---

## C

### CI/CD

- **GitHub Actions Guide**: [GitHub Actions Guide](05_ci_cd/github_actions_guide.md)
- **GitHub Actions Style**: [GitHub Actions Style Guide](02_language_guides/github_actions.md)
- **GitLab CI Guide**: [GitLab CI Guide](05_ci_cd/gitlab_ci_guide.md)
- **GitLab CI Style**: [GitLab CI Style Guide](02_language_guides/gitlab_ci.md)
- **Jenkins Guide**: [Jenkins Pipeline Guide](05_ci_cd/jenkins_pipeline_guide.md)
- **Jenkins Style**: [Jenkins / Groovy](02_language_guides/jenkins_groovy.md)
- **Performance**: [CI/CD Performance Optimization](05_ci_cd/performance_optimization.md)
- **Workflow Templates**: [GitHub Actions Workflow Templates](04_templates/github_actions_workflow_templates.md)
- **Reusable Workflows**: [Reusable Workflows Template](04_templates/reusable_workflows_template.md)
- **Workflow Example**: [GitHub Actions Example](05_examples/github_actions_example.md)
- See also: [Testing](#testing), [Automation](#automation), [Pre-commit Hooks](#pre-commit-hooks)

### Cloud Providers

- **Azure**: [Microsoft Azure](11_cloud_providers/azure.md)
- **GCP**: [Google Cloud Platform](11_cloud_providers/gcp.md)
- See also: [AWS](#aws), [Infrastructure as Code](#infrastructure-as-code)

### Code Quality

- **Anti-Patterns**: [Common Anti-Patterns](08_anti_patterns/index.md)
- **Code Smells**: [Code Smell Catalog](08_anti_patterns/code_smell_catalog.md)
- **Refactoring**: [Refactoring Overview](09_refactoring/index.md)
- **AI Code Review**: [AI Code Review](07_integration/ai_code_review.md)
- See also: [Linting](#linting), [Testing](#testing)

### Code Signing

- **Guide**: [Code Signing Guide](05_ci_cd/code_signing_guide.md)
- See also: [Security](#security), [CI/CD](#cicd)

### Compliance

- **Compliance as Code**: [InSpec, OPA & Sentinel](02_language_guides/compliance_as_code.md)
- **IaC Testing**: [IaC Testing Standards](05_ci_cd/iac_testing_standards.md)
- See also: [Security](#security), [Testing](#testing)

### Configuration Management

- **Ansible**: [Ansible Style Guide](02_language_guides/ansible.md)
- **Environment Config**: [Environment Configuration](05_ci_cd/environment_configuration.md)
- See also: [Infrastructure as Code](#infrastructure-as-code), [YAML](#yaml)

### Containers

- **Dockerfile**: [Dockerfile Style Guide](02_language_guides/dockerfile.md)
- **Docker Compose**: [Docker Compose Style Guide](02_language_guides/docker_compose.md)
- **Dev Containers**: [Dev Containers](02_language_guides/devcontainer.md)
- **Dockerfile Template**: [Dockerfile Template](04_templates/dockerfile_template.md)
- **Docker Compose Template**: [Docker Compose Template](04_templates/docker_compose_template.md)
- **Container Usage**: [Container Usage Guide](06_container/usage.md)
- See also: [Kubernetes](#kubernetes)

### Crossplane

- **Style Guide**: [Crossplane](02_language_guides/crossplane.md)
- See also: [Kubernetes](#kubernetes), [Infrastructure as Code](#infrastructure-as-code)

---

## D

### Data Formats

- **YAML**: [YAML Style Guide](02_language_guides/yaml.md)
- **JSON**: [JSON Style Guide](02_language_guides/json.md)
- **JSON Schema**: [JSON Schema Style Guide](02_language_guides/json_schema.md)
- **TOML & INI**: [TOML & INI Style Guide](02_language_guides/toml_ini.md)
- See also: [Configuration Management](#configuration-management)

### Decision Trees

- **Guide**: [Decision Trees](01_overview/decision_trees.md)
- See also: [Getting Started](#getting-started)

### Dependencies

- **Update Policies**: [Dependency Update Policies](05_ci_cd/dependency_update_policies.md)
- **Dependabot**: [Dependabot Auto-Merge](05_ci_cd/dependabot_auto_merge.md)
- See also: [CI/CD](#cicd), [Security](#security)

### Deployment

- **Environment Config**: [Environment Configuration](05_ci_cd/environment_configuration.md)
- **Smoke Tests**: [Smoke Test Standards](05_ci_cd/smoke_test_standards.md)
- **GitOps**: [GitOps (ArgoCD & Flux)](02_language_guides/gitops.md)
- See also: [CI/CD](#cicd), [Containers](#containers)

### Diagrams

- **Diagram as Code**: [Diagram as Code](02_language_guides/diagram_as_code.md)
- See also: [Documentation](#documentation)

### Documentation

- **MkDocs Site Example**: [MkDocs Site Example](05_examples/mkdocs_site_example.md)
- **Versioning**: [Documentation Versioning](05_ci_cd/documentation_versioning.md)
- **Heading Structure**: [Heading Structure](00_standards/heading_structure.md)
- **Code Block Tags**: [Code Block Language Tags](00_standards/code_block_language_tags.md)
- **README Template**: [README Template](04_templates/README_template.md)
- See also: [Metadata](#metadata), [Templates](#templates)

---

## E

### Environment Configuration

- **Guide**: [Environment Configuration](05_ci_cd/environment_configuration.md)
- **Seed Data**: [Seed Data Management](05_ci_cd/seed_data_management.md)
- See also: [Deployment](#deployment), [Security](#security)

---

## F

### Formatting

- **Python (Black)**: [Python Style Guide](02_language_guides/python.md)
- **JavaScript/TypeScript (Prettier)**: [TypeScript Style Guide](02_language_guides/typescript.md)
- **Terraform (terraform fmt)**: [Terraform Style Guide](02_language_guides/terraform.md)
- **IDE Settings**: [IDE Settings Template](04_templates/ide_settings_template.md)
- See also: [Linting](#linting), [Pre-commit Hooks](#pre-commit-hooks)

---

## G

### Getting Started

- **Quickstart**: [Getting Started](01_overview/getting_started.md)
- **Tutorials**: [Tutorial Overview](12_tutorials/index.md)
- **Python Project Tutorial**: [Zero to Validated Python Project](12_tutorials/python_project.md)
- **Team Onboarding**: [Team Onboarding Tutorial](12_tutorials/team_onboarding.md)
- See also: [Decision Trees](#decision-trees), [Maturity Model](#maturity-model)

### Git Hooks

- **Git Hooks Library**: [Git Hooks Library](05_ci_cd/git_hooks_library.md)
- **Pre-commit Guide**: [Pre-commit Hooks Guide](05_ci_cd/precommit_hooks_guide.md)
- **Pre-commit Template**: [Pre-commit Config Template](04_templates/precommit_config_template.md)
- See also: [Pre-commit Hooks](#pre-commit-hooks), [CI/CD](#cicd)

### GitOps

- **Style Guide**: [GitOps (ArgoCD & Flux)](02_language_guides/gitops.md)
- See also: [Kubernetes](#kubernetes), [CI/CD](#cicd)

### Go

- **Style Guide**: [Go](02_language_guides/go.md)
- See also: [Testing](#testing), [Formatting](#formatting)

### Governance

- **Guide**: [Governance](01_overview/governance.md)
- **Principles**: [Principles](01_overview/principles.md)
- See also: [Getting Started](#getting-started)

### Groovy

- **Jenkins/Groovy**: [Jenkins / Groovy](02_language_guides/jenkins_groovy.md)
- **Shared Libraries**: [Jenkins Shared Libraries](02_language_guides/jenkins_shared_libraries.md)
- See also: [CI/CD](#cicd)

---

## H

### HCL

- **Style Guide**: [HCL](02_language_guides/hcl.md)
- See also: [Terraform](#terraform), [Terragrunt](#terragrunt)

### Helm

- **Style Guide**: [Kubernetes & Helm](02_language_guides/kubernetes.md)
- **Chart Template**: [Helm Chart Template](04_templates/helm_chart_template.md)
- See also: [Kubernetes](#kubernetes), [Containers](#containers)

---

## I

### IDE Integration

- **IDE Integration Guide**: [IDE Integration Guide](05_ci_cd/ide_integration_guide.md)
- **IDE Settings Template**: [IDE Settings Template](04_templates/ide_settings_template.md)
- **Debug Configurations**: [Debug Configuration Template](04_templates/debug_config_template.md)
- See also: [Formatting](#formatting), [Linting](#linting)

### Infrastructure as Code

- **Terraform**: [Terraform & Terragrunt](02_language_guides/terraform.md)
- **Terragrunt**: [Terragrunt (live)](02_language_guides/terragrunt.md)
- **CloudFormation**: [AWS CloudFormation](02_language_guides/cloudformation.md)
- **Bicep**: [Azure Bicep](02_language_guides/bicep.md)
- **AWS CDK**: [AWS CDK](02_language_guides/cdk.md)
- **Pulumi**: [Pulumi](02_language_guides/pulumi.md)
- **Crossplane**: [Crossplane](02_language_guides/crossplane.md)
- **IaC Testing**: [IaC Testing Standards](05_ci_cd/iac_testing_standards.md)
- **Contract Template**: [CONTRACT.md Template](04_templates/contract_template.md)
- **Comparison**: [Language Comparison Matrix](02_language_guides/comparison_matrix.md)
- See also: [Terraform](#terraform), [Configuration Management](#configuration-management)

### Interoperability

- **Cross-Language Guide**: [Language Interoperability](02_language_guides/interoperability.md)
- See also: [Data Formats](#data-formats)

---

## J

### Jenkins

- **Pipeline Guide**: [Jenkins Pipeline Guide](05_ci_cd/jenkins_pipeline_guide.md)
- **Groovy Style**: [Jenkins / Groovy](02_language_guides/jenkins_groovy.md)
- **Shared Libraries**: [Jenkins Shared Libraries](02_language_guides/jenkins_shared_libraries.md)
- See also: [CI/CD](#cicd), [Groovy](#groovy)

### JSON

- **Style Guide**: [JSON](02_language_guides/json.md)
- **JSON Schema**: [JSON Schema](02_language_guides/json_schema.md)
- See also: [Data Formats](#data-formats), [YAML](#yaml)

---

## K

### Kubernetes

- **Style Guide**: [Kubernetes & Helm](02_language_guides/kubernetes.md)
- **Helm Chart Template**: [Helm Chart Template](04_templates/helm_chart_template.md)
- **GitOps**: [GitOps (ArgoCD & Flux)](02_language_guides/gitops.md)
- **Crossplane**: [Crossplane](02_language_guides/crossplane.md)
- See also: [Containers](#containers), [Infrastructure as Code](#infrastructure-as-code)

---

## L

### Linting

- **Pre-commit Hooks**: [Pre-commit Hooks Guide](05_ci_cd/precommit_hooks_guide.md)
- **Local Setup**: [Local Validation Setup](05_ci_cd/local_validation_setup.md)
- **IDE Integration**: [IDE Integration Guide](05_ci_cd/ide_integration_guide.md)
- See also: [Formatting](#formatting), [Code Quality](#code-quality)

---

## M

### Makefile

- **Style Guide**: [Makefile](02_language_guides/makefile.md)
- See also: [Build Tools](#build-tools), [Automation](#automation)

### Maturity Model

- **Guide**: [Maturity Model](01_overview/maturity_model.md)
- See also: [Getting Started](#getting-started), [Governance](#governance)

### Metadata

- **Schema Reference**: [Metadata Schema Reference](03_metadata_schema/schema_reference.md)
- **Glossary (Metadata Tags)**: [Glossary](glossary.md#metadata-tags-reference)
- See also: [Documentation](#documentation)

### Migration Guides

- **From PEP 8**: [Migrating from PEP 8](10_migration_guides/from_pep8.md)
- **From Google Style**: [Migrating from Google Style Guide](10_migration_guides/from_google.md)
- **From Airbnb Style**: [Migrating from Airbnb Style Guide](10_migration_guides/from_airbnb.md)
- **Terraform Tutorial**: [Migrating Existing Terraform Module](12_tutorials/terraform_migration.md)
- See also: [Getting Started](#getting-started)

### Monitoring

- **Observability Guide**: [Observability Guide](05_ci_cd/observability_guide.md)
- See also: [Deployment](#deployment), [Testing](#testing)

---

## N

### Naming Conventions

- **Comparison Matrix**: [Language Comparison Matrix](02_language_guides/comparison_matrix.md)
- **Glossary**: [Glossary](glossary.md) (camelCase, snake_case, kebab-case, PascalCase)
- See also: [Formatting](#formatting)

---

## O

### Observability

- **Guide**: [Observability Guide](05_ci_cd/observability_guide.md)
- See also: [Deployment](#deployment), [Monitoring](#monitoring)

### Operations

- **Operational Templates**: [Operational Templates](04_templates/operational_templates.md)
- **Chaos Engineering**: [Chaos Engineering Guide](05_ci_cd/chaos_engineering_guide.md)
- See also: [Deployment](#deployment), [Monitoring](#monitoring)

---

## P

### Performance

- **CI/CD Optimization**: [Performance Optimization](05_ci_cd/performance_optimization.md)
- **Performance Testing**: [Performance Testing Standards](05_ci_cd/performance_testing_standards.md)
- See also: [Testing](#testing), [CI/CD](#cicd)

### PowerShell

- **Style Guide**: [PowerShell](02_language_guides/powershell.md)
- See also: [Scripting](#scripting), [Bash](#bash)

### Pre-commit Hooks

- **Guide**: [Pre-commit Hooks Guide](05_ci_cd/precommit_hooks_guide.md)
- **Config Template**: [Pre-commit Config Template](04_templates/precommit_config_template.md)
- **Git Hooks Library**: [Git Hooks Library](05_ci_cd/git_hooks_library.md)
- **Local Setup**: [Local Validation Setup](05_ci_cd/local_validation_setup.md)
- See also: [Linting](#linting), [Git Hooks](#git-hooks)

### Pulumi

- **Style Guide**: [Pulumi](02_language_guides/pulumi.md)
- See also: [Infrastructure as Code](#infrastructure-as-code)

### Python

- **Style Guide**: [Python](02_language_guides/python.md)
- **Refactoring Examples**: [Python Refactoring](09_refactoring/python_refactoring.md)
- **Package Template**: [Python Package Template](04_templates/python_package_template.md)
- **Package Example**: [Python Package Example](05_examples/python_package_example.md)
- **Flask API Example**: [Flask API Example](05_examples/flask_api_example.md)
- **Tutorial**: [Zero to Validated Python Project](12_tutorials/python_project.md)
- **Migration from PEP 8**: [From PEP 8](10_migration_guides/from_pep8.md)
- See also: [Testing](#testing), [Formatting](#formatting)

---

## R

### Refactoring

- **Overview**: [Refactoring Overview](09_refactoring/index.md)
- **Python**: [Python Refactoring](09_refactoring/python_refactoring.md)
- **TypeScript**: [TypeScript Refactoring](09_refactoring/typescript_refactoring.md)
- **Terraform**: [Terraform Refactoring](09_refactoring/terraform_refactoring.md)
- **Ansible**: [Ansible Refactoring](09_refactoring/ansible_refactoring.md)
- **Bash**: [Bash Refactoring](09_refactoring/bash_refactoring.md)
- See also: [Anti-Patterns](#anti-patterns), [Code Quality](#code-quality)

### REPL

- **Guide**: [REPL & Interactive Shells](02_language_guides/repl.md)
- See also: [Bash](#bash), [Python](#python)

---

## S

### Scripting

- **Bash**: [Bash Style Guide](02_language_guides/bash.md)
- **PowerShell**: [PowerShell Style Guide](02_language_guides/powershell.md)
- **Shell Aliases**: [Shell Aliases & Functions](02_language_guides/shell_aliases.md)
- See also: [Automation](#automation)

### Security

- **Security Scanning**: [Security Scanning Guide](05_ci_cd/security_scanning_guide.md)
- **Code Signing**: [Code Signing Guide](05_ci_cd/code_signing_guide.md)
- **Compliance as Code**: [InSpec, OPA & Sentinel](02_language_guides/compliance_as_code.md)
- **Dependency Updates**: [Dependency Update Policies](05_ci_cd/dependency_update_policies.md)
- See also: [Compliance](#compliance), [CI/CD](#cicd)

### ShellCheck

- **Bash Style Guide**: [Bash](02_language_guides/bash.md)
- **Pre-commit Hooks**: [Pre-commit Hooks Guide](05_ci_cd/precommit_hooks_guide.md)
- See also: [Linting](#linting), [Scripting](#scripting)

### SQL

- **Style Guide**: [SQL](02_language_guides/sql.md)
- See also: [Data Formats](#data-formats)

---

## T

### Task Runners

- **Task & Just**: [Task Runners](02_language_guides/task_runners.md)
- **Makefile**: [Makefile](02_language_guides/makefile.md)
- See also: [Build Tools](#build-tools)

### Templates

- **README**: [README Template](04_templates/README_template.md)
- **Terraform Module**: [Terraform Module Template](04_templates/terraform_module_template.md)
- **Python Package**: [Python Package Template](04_templates/python_package_template.md)
- **Dockerfile**: [Dockerfile Template](04_templates/dockerfile_template.md)
- **Docker Compose**: [Docker Compose Template](04_templates/docker_compose_template.md)
- **Helm Chart**: [Helm Chart Template](04_templates/helm_chart_template.md)
- **GitHub Actions**: [GitHub Actions Workflow Templates](04_templates/github_actions_workflow_templates.md)
- **CONTRACT.md**: [Contract Template](04_templates/contract_template.md)
- **Testing Docs**: [Testing Documentation Template](04_templates/testing_docs_template.md)
- **IDE Settings**: [IDE Settings Template](04_templates/ide_settings_template.md)
- **ADR**: [ADR Template](04_templates/adr_template.md)
- **Operational**: [Operational Templates](04_templates/operational_templates.md)
- **Code Generators**: [Code Generators Template](04_templates/code_generators_template.md)
- See also: [Documentation](#documentation)

### Terraform

- **Style Guide**: [Terraform & Terragrunt](02_language_guides/terraform.md)
- **Refactoring Examples**: [Terraform Refactoring](09_refactoring/terraform_refactoring.md)
- **Module Template**: [Terraform Module Template](04_templates/terraform_module_template.md)
- **Module Example**: [Terraform Module Example](05_examples/terraform_module_example.md)
- **Migration Tutorial**: [Migrating Existing Terraform Module](12_tutorials/terraform_migration.md)
- **IaC Testing**: [IaC Testing Standards](05_ci_cd/iac_testing_standards.md)
- **Contract Template**: [CONTRACT.md Template](04_templates/contract_template.md)
- See also: [Terragrunt](#terragrunt), [HCL](#hcl), [Infrastructure as Code](#infrastructure-as-code)

### Terragrunt

- **Style Guide**: [Terragrunt (live)](02_language_guides/terragrunt.md)
- See also: [Terraform](#terraform), [HCL](#hcl)

### Testing

- **Testing Strategies**: [Testing Strategies](05_ci_cd/testing_strategies.md)
- **Smoke Tests**: [Smoke Test Standards](05_ci_cd/smoke_test_standards.md)
- **Performance Testing**: [Performance Testing Standards](05_ci_cd/performance_testing_standards.md)
- **Chaos Engineering**: [Chaos Engineering Guide](05_ci_cd/chaos_engineering_guide.md)
- **IaC Testing**: [IaC Testing Standards](05_ci_cd/iac_testing_standards.md)
- **Seed Data**: [Seed Data Management](05_ci_cd/seed_data_management.md)
- **Testing Docs Template**: [Testing Documentation Template](04_templates/testing_docs_template.md)
- See also: [CI/CD](#cicd), [Code Quality](#code-quality)

### Tutorials

- **Overview**: [Tutorial Overview](12_tutorials/index.md)
- **Python Project**: [Zero to Validated Python Project](12_tutorials/python_project.md)
- **Terraform Migration**: [Migrating Existing Terraform Module](12_tutorials/terraform_migration.md)
- **Full-Stack App**: [Full-Stack App with Multiple Languages](12_tutorials/fullstack_app.md)
- **Team Onboarding**: [Team Onboarding](12_tutorials/team_onboarding.md)
- **Manual to Automated**: [From Manual to Automated](12_tutorials/manual_to_automated.md)
- See also: [Getting Started](#getting-started)

### TypeScript

- **Style Guide**: [TypeScript](02_language_guides/typescript.md)
- **Refactoring Examples**: [TypeScript Refactoring](09_refactoring/typescript_refactoring.md)
- **Library Example**: [TypeScript Library Example](05_examples/typescript_library_example.md)
- **React App Example**: [React App Example](05_examples/react_app_example.md)
- **Migration from Airbnb**: [From Airbnb Style Guide](10_migration_guides/from_airbnb.md)
- See also: [JSON](#json), [Formatting](#formatting)

---

## V

### Validation

- **Local Setup**: [Local Validation Setup](05_ci_cd/local_validation_setup.md)
- **AI Validation Pipeline**: [AI Validation Pipeline](05_ci_cd/ai_validation_pipeline.md)
- **Container Validation**: [Container Usage](06_container/usage.md)
- See also: [Linting](#linting), [CI/CD](#cicd)

---

## Y

### YAML

- **Style Guide**: [YAML](02_language_guides/yaml.md)
- See also: [Data Formats](#data-formats), [Ansible](#ansible), [Kubernetes](#kubernetes)
