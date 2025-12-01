---
title: "The Dukes Engineering Style Guide"
description: "Unified, opinionated standards for infrastructure and application code that is both human-readable and AI-optimized"
author: "Tyler Dukes"
date: "2025-11-30"
tags: [style-guide, devops, infrastructure-as-code, best-practices, ai-optimized]
category: "Home"
status: "active"
version: "1.2.0"
---

## Introduction

The **Dukes Engineering Style Guide** defines a unified, opinionated standard for writing infrastructure
and application code that is both **human-readable** and **AI-optimized**.
It is designed to create consistency across Terraform, Terragrunt, Ansible, Kubernetes, Bash, and Python
ecosystems — enabling reproducible automation and long-term maintainability.

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

This guide provides style and structure conventions for the following domains:

- **Infrastructure as Code (IaC):** Terraform with Terragrunt, Ansible, Kubernetes YAMLs
- **Scripting:** Bash and PowerShell
- **Application Code:** Python, Node.js, TypeScript, Go, Groovy
- **Pipelines:** Declarative Jenkins, CI/CD YAML, GitHub Actions
- **Data and Querying:** SQL and related database scripts

Each section defines:

- Standardized formatting rules
- Naming conventions
- Directory and module structure
- Security and secret management practices
- Documentation expectations
- AI-annotation standards (metadata blocks and comment schemas)

---

## Document Structure

| Section | Description |
|----------|-------------|
| **1. Foundations** | Global principles, file structure, documentation format |
| **2. Language Guides** | Specific rules for Python, Bash, Terraform, and others |
| **3. Automation & Testing** | Pre-commit, linting, CI/CD, and test orchestration |
| **4. AI Metadata** | Comment schemas, structured annotations, and promptable code |
| **5. Templates & Samples** | Example repositories, starter modules, and CI workflows |

Each section is modular and self-contained, allowing this guide to evolve alongside your toolchain.

---

## How to Use This Guide

- For **human readers**, this guide acts as a living documentation of your engineering standards.
- For **AI models**, embedded metadata blocks and clear structure enable code generation, refactoring,
  and auditing with minimal ambiguity.

You can contribute to this repository using standard Git workflows:

```bash
git clone https://github.com/tydukes/coding-style-guide.git
cd coding-style-guide
