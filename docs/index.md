---
title: "DevOps Engineering Style Guide"
description: "Unified, opinionated standards for infrastructure and application code that is both human-readable and AI-optimized"
author: "Tyler Dukes"
tags: [style-guide, devops, infrastructure-as-code, best-practices, ai-optimized]
category: "Home"
status: "active"
search_keywords: [style guide, devops, coding standards, best practices, getting started, overview]
---

## Introduction

The **DevOps Engineering Style Guide** defines a unified, opinionated standard for writing infrastructure
and application code that is both **human-readable** and **AI-optimized**.
It creates consistency across 35+ languages and tools — enabling reproducible automation and long-term
maintainability across teams and projects.

This guide reflects practical standards derived from real-world DevOps, SRE, and automation practices.
Its intent is to strike the right balance between flexibility and rigor — allowing engineers to focus on
*building systems* instead of debating style.

---

## Core Principles

1. **Clarity First:**
   Code must communicate intent before it executes logic.
   Readability and maintainability take precedence over brevity.

2. **Automation by Default:**
   Everything that can be automated — linting, formatting, testing, and deployment — *is* automated.

3. **Security and Stability:**
   Secrets are always managed securely, dependencies are pinned, and environments are deterministic.

4. **Reproducibility:**
   Builds, tests, and deployments must produce consistent outcomes across local, CI, and production environments.

5. **Human + AI Collaboration:**
   Every standard is designed for dual readability — equally interpretable by developers and AI assistants.

---

## Scope

This guide covers 35+ languages and tooling categories:

**Infrastructure as Code**:
Terraform, Terragrunt, HCL, AWS CloudFormation, Azure Bicep, AWS CDK, Pulumi,
Kubernetes & Helm, GitOps (ArgoCD & Flux), Crossplane

**Configuration Management**: Ansible

**Programming Languages**: Python, Go, TypeScript, Bash, PowerShell, SQL, Groovy (Jenkins)

**CI/CD & Automation**: GitHub Actions, GitLab CI/CD, Jenkins, Jenkins Shared Libraries

**Compliance as Code**: InSpec, OPA, Sentinel

**Data Formats**: YAML, JSON, JSON Schema, TOML & INI

**Containerization**: Dockerfile, Docker Compose, Dev Containers

**Build Tools**: Makefile, Task & Just

**Developer Experience**: REPL & Interactive Shells, Shell Aliases & Functions, Diagram as Code

Each guide defines standardized formatting, naming conventions, directory structure, security practices,
documentation expectations, and AI-annotation standards.

---

## Documentation Sections

| Section | What You'll Find |
|---------|-----------------|
| **Overview** | Principles, governance, structure, decision trees, maturity model, project status |
| **Standards** | Code block requirements, heading structure conventions |
| **Language Guides** | 35+ language-specific style guides organized by category |
| **Metadata Schema** | Universal `@module` annotation schema for all languages |
| **Templates** | Ready-to-use templates: README, Terraform, Python, Helm, Dockerfile, ADR, and more |
| **Examples** | Full reference implementations: Python package, Flask API, Terraform module, React app, monorepo |
| **Refactoring** | Before/after examples for Python, TypeScript, Terraform, Ansible, Bash |
| **Anti-Patterns** | Common code smells, Azure anti-patterns, and what to avoid |
| **Migration Guides** | Moving from PEP 8, Google Style Guide, or Airbnb Style Guide |
| **Cloud Providers** | Microsoft Azure and Google Cloud Platform specific guidance |
| **CI / CD** | Pipeline setup, testing strategies, security scanning, observability, DevEx tooling |
| **Container Usage** | Using the published validation container in your projects |
| **Integration** | AI code review integration, CLI tool, integration prompts |
| **Tutorials** | Hands-on walkthroughs: Python project, Terraform migration, full-stack app, team onboarding |
| **FAQ** | Frequently asked questions and quick answers |
| **Topic Index** | Comprehensive index of all topics across the guide |
| **Glossary** | Terminology and definitions |

---

## Where to Start

| Your Role | Start Here |
|-----------|-----------|
| **New to this guide** | [Getting Started](01_overview/getting_started.md) → [Maturity Model](01_overview/maturity_model.md) |
| **Python developer** | [Python Guide](02_language_guides/python.md) → [Tutorial 1](12_tutorials/python_project.md) |
| **Infrastructure / IaC** | [Terraform Guide](02_language_guides/terraform.md) → [Tutorial 2](12_tutorials/terraform_migration.md) |
| **DevOps / CI/CD focus** | [GitHub Actions](02_language_guides/github_actions.md) → [CI/CD Guides](05_ci_cd/github_actions_guide.md) |
| **Team lead / onboarding** | [Tutorial 4: Team Onboarding](12_tutorials/team_onboarding.md) → [Governance](01_overview/governance.md) |
| **Building multi-language apps** | [Interoperability](02_language_guides/interoperability.md) → [Tutorial 3](12_tutorials/fullstack_app.md) |
| **Adopting from another style guide** | [Migration Guides](10_migration_guides/from_pep8.md) |

---

## How to Use This Guide

- For **human readers**, this guide acts as a living documentation of your engineering standards.
- For **AI models**, embedded metadata blocks and clear structure enable code generation, refactoring,
  and auditing with minimal ambiguity.
- For **teams adopting this guide**, use the [Maturity Model](01_overview/maturity_model.md) to plan
  a progressive rollout across your projects.

You can contribute to this repository using standard Git workflows:

```bash
git clone https://github.com/tydukes/coding-style-guide.git
cd coding-style-guide
uv sync
mkdocs serve
# Browse to http://127.0.0.1:8000
```

Or validate your own project immediately using the published container:

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```
