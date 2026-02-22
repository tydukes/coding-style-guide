---
title: "Glossary"
description: "Comprehensive glossary of terms used in the DevOps Engineering Style Guide"
author: "Tyler Dukes"
tags: [glossary, terms, definitions, reference, dictionary]
category: "Reference"
status: "active"
search_keywords: [glossary, definitions, terms, acronyms, abbreviations, reference, dictionary]
---

This glossary defines terms used throughout the DevOps Engineering Style Guide, including technical concepts, tool names,
metadata tags, and industry terminology.

!!! tip "Quick Navigation"
    Use your browser's search (Ctrl+F / Cmd+F) or the site search bar to find
    specific terms. See also the [Topic Index](topic_index.md) for browsing by
    subject area and the [FAQ](faq.md) for common questions.

## A

### AI Assistant

A software tool that uses artificial intelligence to help with code writing, review, and understanding. Examples include
Claude, GitHub Copilot, and ChatGPT. The style guide optimizes code metadata for better AI comprehension.

### Ansible

An open-source automation tool for configuration management, application deployment, and task automation. Uses YAML
playbooks to define infrastructure as code. See the [Ansible Style Guide](02_language_guides/ansible.md).

### ArgoCD

A declarative GitOps continuous delivery tool for Kubernetes. Monitors Git repositories and automatically syncs
application state to match declared configuration. See [GitOps Guide](02_language_guides/gitops.md).

### API (Application Programming Interface)

A set of rules and protocols that allows different software applications to communicate with each other. Commonly refers
to RESTful HTTP APIs in web services.

### API Endpoint

A specific URL path and HTTP method combination that provides access to a resource or function in an API. Example:
`POST /auth/login`.

### Automation

The use of tools and scripts to perform tasks automatically without manual intervention. Core principle of the style
guide for enforcing standards.

## B

### AWS CDK (Cloud Development Kit)

A framework for defining cloud infrastructure using familiar programming languages (TypeScript, Python, Go, Java)
instead of YAML/JSON templates. See the [AWS CDK Style Guide](02_language_guides/cdk.md).

### Bash

Unix shell and command language used for scripting and automation. Commonly used for deployment scripts, CI/CD
pipelines, and system administration tasks. See the [Bash Style Guide](02_language_guides/bash.md).

### Bicep

A domain-specific language for deploying Azure resources declaratively. Compiles to ARM templates with cleaner syntax.
See the [Bicep Style Guide](02_language_guides/bicep.md).

### Black

An opinionated Python code formatter that automatically formats code to a consistent style. Eliminates debates about
formatting by providing one standard style.

### Block Comment

A multi-line comment enclosed in special syntax. Example in Terraform: `/* comment */`, in Python:
`"""docstring"""`.

### Boolean

A data type with two possible values: `true` or `false`. Often used for configuration flags and conditional logic.

### Branch

A parallel version of a repository in version control. Allows development of features in isolation from the main
codebase.

### Breaking Change

A modification to code or API that is not backward-compatible and requires users to update their code. Triggers a
MAJOR version increment in semantic versioning.

## C

### camelCase

A naming convention where the first word is lowercase and subsequent words are capitalized. Example:
`getUserDetails`. Common in JavaScript and TypeScript.

### Chaos Engineering

The practice of intentionally introducing failures into a system to test its resilience and identify weaknesses before
they cause real outages. See the [Chaos Engineering Guide](05_ci_cd/chaos_engineering_guide.md).

### CI/CD (Continuous Integration / Continuous Deployment)

Practices that automate the building, testing, and deployment of code. CI runs automated tests on every commit; CD
automatically deploys passing code to production. See [CI/CD guides](05_ci_cd/github_actions_guide.md).

### CloudFormation

AWS service for provisioning infrastructure using JSON or YAML templates. Manages resources as stacks with
rollback support. See the [CloudFormation Style Guide](02_language_guides/cloudformation.md).

### Code-to-Text Ratio

A quality metric specific to this style guide requiring at least 3 lines of code examples for every 1 line of
explanatory text in language guides. Enforces "show, don't tell" documentation philosophy.

### Conventional Commits

A specification for adding human and machine-readable meaning to commit messages. Format: `type(scope): subject`.
Required for all commits in this project. Types include: feat, fix, docs, style, refactor, test, chore.

### Crossplane

A Kubernetes-native infrastructure as code tool that enables provisioning cloud resources using Kubernetes-style
manifests. See the [Crossplane Style Guide](02_language_guides/crossplane.md).

### cSpell

A spell checker for code and documentation. Used in CI to block merges with spelling errors. Custom dictionary at
`.github/cspell.json`.

### CLI (Command-Line Interface)

A text-based interface for interacting with software through commands typed into a terminal. Example: `git commit -m
"message"`.

### Code Review

The process of examining code changes before they are merged, typically through pull requests. Focuses on logic,
architecture, and design rather than formatting.

### Container

A lightweight, standalone package of software that includes everything needed to run an application: code, runtime,
libraries, and dependencies. Docker is the most common container platform.

### Convention

An agreed-upon standard or pattern used consistently across a codebase. Examples include naming conventions and
code structure patterns.

## D

### DAST (Dynamic Application Security Testing)

Security testing that analyzes a running application for vulnerabilities. Contrast with SAST which analyzes source
code. See [Security Scanning Guide](05_ci_cd/security_scanning_guide.md).

### Dependency

An external library, package, or module that code relies on to function. Should be documented in metadata tags.
See [Dependency Update Policies](05_ci_cd/dependency_update_policies.md).

### Dependabot

A GitHub tool that automatically creates pull requests to update outdated dependencies. See
[Dependabot Auto-Merge](05_ci_cd/dependabot_auto_merge.md).

### Dev Container

A Docker-based development environment defined by a `devcontainer.json` file. Ensures consistent tooling across team
members. See the [Dev Container Guide](02_language_guides/devcontainer.md).

### Deployment

The process of releasing software to a target environment (production, staging, or development).

### Deprecation

Marking a feature, function, or module as obsolete and scheduled for removal. Uses `@status deprecated` metadata
tag.

### Development Environment

The local or remote system where developers write and test code, typically with debugging tools and test data.

### DevOps

A set of practices that combines software development (Dev) and IT operations (Ops) to shorten development cycles and
deliver high-quality software.

### Docker

A platform for developing, shipping, and running applications in containers. Ensures consistency across development,
testing, and production environments. See [Dockerfile Guide](02_language_guides/dockerfile.md) and
[Docker Compose Guide](02_language_guides/docker_compose.md).

### Documentation

Written explanations of how code works, including inline comments, README files, and generated API docs.
Auto-generated from metadata in this style guide.

### Dry Run

Executing a command in simulation mode without making actual changes. Useful for testing potentially destructive
operations.

## E

### EditorConfig

A file format and collection of editor plugins for maintaining consistent coding styles across different editors and
IDEs.

### Environment Variable

A dynamic value that can affect how processes behave on a computer. Often used to configure applications without
hardcoding values. Example: `API_KEY=abc123`.

### EOF (End of File)

A marker indicating the end of a file. Files should end with exactly one blank line per style guide convention.

### ESLint

A static analysis tool for identifying problematic patterns in JavaScript/TypeScript code. Enforces code quality and
style rules.

### Flux

A GitOps tool for keeping Kubernetes clusters in sync with configuration sources (Git repositories). Alternative to
ArgoCD. See [GitOps Guide](02_language_guides/gitops.md).

## F

### Feature Branch

A git branch created to develop a specific feature in isolation. Named with `feature/` prefix. Example:
`feature/add-user-auth`.

### Flake8

A Python linting tool that checks code for style violations, programming errors, and complexity. Combines pycodestyle,
pyflakes, and McCabe.

### Formatter

A tool that automatically reformats code to match style guidelines. Examples include Black (Python), Prettier
(JavaScript/TypeScript), and terraform fmt.

### Function

A reusable block of code that performs a specific task. Should be named with verb-noun format: `get_user()`,
`calculate_total()`.

## G

### Git

A distributed version control system for tracking changes in source code during software development.

### GitHub Actions

A CI/CD platform that automates workflows directly in GitHub repositories. Used for testing, building, and deploying
code. See the [GitHub Actions Style Guide](02_language_guides/github_actions.md) and
[GitHub Actions Guide](05_ci_cd/github_actions_guide.md).

### GitOps

An operational framework that applies DevOps best practices for infrastructure automation using Git as the single
source of truth. See [GitOps Guide](02_language_guides/gitops.md).

### GitFlow

A branching model for Git that uses specific branch types (main, develop, feature, release, hotfix) with strict merge
rules.

### GitLab CI

GitLab's integrated CI/CD platform. Uses `.gitlab-ci.yml` configuration files to define pipelines. See the
[GitLab CI Style Guide](02_language_guides/gitlab_ci.md) and [GitLab CI Guide](05_ci_cd/gitlab_ci_guide.md).

### Go

A statically typed, compiled programming language designed for simplicity and performance. Popular for CLI tools,
microservices, and infrastructure tooling. See the [Go Style Guide](02_language_guides/go.md).

### Glob Pattern

A pattern-matching syntax using wildcards. Example: `**/*.py` matches all Python files in all subdirectories.

### Groovy

A dynamic programming language for the Java platform. Used for Jenkins pipeline scripts and Gradle build files. See
the [Jenkins/Groovy Style Guide](02_language_guides/jenkins_groovy.md).

## H

### Hash Comment

A single-line comment starting with `#`. Used in Python, Bash, YAML, Terraform, and other languages.

### HCL (HashiCorp Configuration Language)

The configuration language used by Terraform and other HashiCorp tools. Declarative syntax for defining infrastructure.
See the [HCL Style Guide](02_language_guides/hcl.md).

### Helm

A package manager for Kubernetes that uses charts to define, install, and upgrade Kubernetes applications. See
[Kubernetes & Helm Style Guide](02_language_guides/kubernetes.md) and
[Helm Chart Template](04_templates/helm_chart_template.md).

### Hook

A script or command that runs automatically in response to specific events. Examples include pre-commit hooks and
CI/CD hooks.

### Hotfix Branch

A git branch created from main to fix critical production bugs. Named with `hotfix/` prefix. Must be merged to both
main and develop.

## I

### IAC (Infrastructure as Code)

Managing and provisioning infrastructure through machine-readable definition files rather than manual configuration.
Examples: Terraform, Ansible.

### IDE (Integrated Development Environment)

Software application providing comprehensive facilities for software development. Examples: VSCode, PyCharm, IntelliJ
IDEA.

### Idempotent

An operation that produces the same result no matter how many times it's executed. Important for automation and
infrastructure code.

### Import

Including code from external modules or libraries. Should be organized by type: standard library, third-party, local
modules.

### Inline Comment

A comment on the same line as code or immediately above it. Should explain why, not what.

### ISO 8601

International standard for date and time formats. Used for `@last_updated` metadata tag. Example: `2025-10-28`.

## J

### InSpec

A compliance automation framework for testing infrastructure against security and policy requirements. See
[Compliance as Code Guide](02_language_guides/compliance_as_code.md).

### Integration Testing

Testing that verifies the interaction between multiple components or modules. Falls between unit tests and end-to-end
tests in the test pyramid. See [Testing Strategies](05_ci_cd/testing_strategies.md).

### Jenkins

An open-source automation server for building, testing, and deploying software. Uses Groovy for pipeline
definitions. See the [Jenkins Pipeline Guide](05_ci_cd/jenkins_pipeline_guide.md).

### JSDoc

A markup language for annotating JavaScript and TypeScript code with documentation comments. Uses `/** ... */`
syntax.

### JSON (JavaScript Object Notation)

A lightweight data interchange format. Human-readable text to store and transmit data objects. Common for
configuration files. See [JSON Style Guide](02_language_guides/json.md) and
[JSON Schema Guide](02_language_guides/json_schema.md).

### JWT (JSON Web Token)

A compact, URL-safe means of representing claims between two parties. Commonly used for authentication in web
applications.

## K

### kebab-case

A naming convention where words are lowercase and separated by hyphens. Example: `user-authentication`. Common for
file names and URLs.

### Kubernetes

An open-source container orchestration platform for automating deployment, scaling, and management of containerized
applications. See the [Kubernetes & Helm Style Guide](02_language_guides/kubernetes.md).

## L

### Language Server Protocol (LSP)

A protocol between editors and language servers that provides IDE features like autocomplete, go-to-definition, and
refactoring.

### Linter

A static code analysis tool that checks for programming errors, bugs, stylistic errors, and suspicious constructs.
Examples: Flake8, ESLint, ShellCheck.

### Logging

The process of recording events, errors, and information during program execution. Essential for debugging and
monitoring.

## M

### MAJOR Version

The first number in semantic versioning (MAJOR.MINOR.PATCH). Incremented for incompatible API changes or breaking
changes.

### Main Branch

The primary branch in a Git repository containing production-ready code. Protected from direct commits.

### Makefile

A file containing commands and dependencies for build automation using the `make` command. Organizes common
development tasks. See the [Makefile Style Guide](02_language_guides/makefile.md).

### markdownlint

A linter for Markdown files that enforces consistent formatting, heading structure, and code block language tags.
See [Code Block Language Tags](00_standards/code_block_language_tags.md).

### Metadata

Data that provides information about other data. In this style guide, structured tags in code comments describing
modules, versions, dependencies, etc.

### MINOR Version

The second number in semantic versioning (MAJOR.MINOR.PATCH). Incremented for new backward-compatible functionality.

### Mocking

Creating fake objects or responses for testing purposes. Allows testing code in isolation without external
dependencies.

### Module

A self-contained unit of code with a specific purpose. Should include `@module` metadata tag with unique identifier.

### Monorepo

A single repository containing multiple projects or services. Contrast with multi-repo where each project has its own
repository.

### Mermaid

A JavaScript-based diagramming and charting tool that renders Markdown-inspired text into diagrams. Supported in
MkDocs with `pymdownx.superfences`. See [Diagram as Code](02_language_guides/diagram_as_code.md).

### MkDocs

A static site generator for building project documentation from Markdown files. Used for this style guide's
documentation site. See [MkDocs Site Example](05_examples/mkdocs_site_example.md).

### Multi-repo

Repository organization pattern where each project or service has its own separate repository. Contrast with
monorepo.

### Mypy

A static type checker for Python that uses type hints to catch type-related errors before runtime.

## N

### Naming Convention

Rules for naming variables, functions, classes, and files. Varies by language but should be consistent within a
codebase.

### NAT Gateway

Network Address Translation gateway in AWS VPC that allows instances in private subnets to access the internet.

### Node.js

JavaScript runtime built on Chrome's V8 engine. Allows running JavaScript on the server side.

### npm (Node Package Manager)

Package manager for JavaScript. Used to install, manage, and publish Node.js packages.

### OPA (Open Policy Agent)

A general-purpose policy engine for enforcing policies across the stack. Used for Terraform plan validation,
Kubernetes admission control, and API authorization. See
[Compliance as Code](02_language_guides/compliance_as_code.md).

## O

### OAuth

Open standard for access delegation, commonly used for token-based authentication. Allows third-party services to
exchange information without sharing passwords.

### OOP (Object-Oriented Programming)

Programming paradigm based on the concept of objects containing data and code. Languages: Python, Java, TypeScript.

## P

### PascalCase

A naming convention where every word starts with an uppercase letter. Example: `UserAuthentication`. Used for class
names.

### PATCH Version

The third number in semantic versioning (MAJOR.MINOR.PATCH). Incremented for backward-compatible bug fixes.

### Pipeline

A sequence of automated processes in CI/CD. Each stage performs specific tasks like building, testing, and deploying.

### PowerShell

A task automation framework from Microsoft consisting of a command-line shell and scripting language. Used for Windows
system administration. See the [PowerShell Style Guide](02_language_guides/powershell.md).

### Pulumi

An infrastructure as code tool that uses general-purpose programming languages (TypeScript, Python, Go, Java)
instead of domain-specific languages. See the [Pulumi Style Guide](02_language_guides/pulumi.md).

### Pre-commit Hook

A script that runs automatically before a commit is created. Used to enforce code quality standards before code
enters version control.

### Prettier

An opinionated code formatter for JavaScript, TypeScript, JSON, YAML, and other languages. Ensures consistent
formatting across projects.

### Pull Request (PR)

A method of submitting contributions to a project. Allows code review and discussion before merging changes into the
main branch.

### Python

A high-level, interpreted programming language known for readability and versatility. Used for web development, data
analysis, automation, and more. See the [Python Style Guide](02_language_guides/python.md).

## Q

### Quality Gate

A set of conditions that code must meet before being merged or deployed. May include test coverage, code quality
metrics, and security scans.

## R

### README

A text file containing information about a project. Typically the first file users see when visiting a repository. Should
include setup instructions and usage examples.

### Refactoring

Restructuring existing code without changing its external behavior. Improves code readability, maintainability, or
performance.

### Regex (Regular Expression)

A sequence of characters defining a search pattern. Used for text searching, validation, and parsing.

### Release Branch

A git branch created from develop to prepare a new production release. Named with `release/` prefix. Example:
`release/v1.3.0`.

### Repository

A storage location for code managed by version control. Contains all project files, history, and branches.

### REST (Representational State Transfer)

An architectural style for web services that uses HTTP methods (GET, POST, PUT, DELETE) to interact with resources.

### Rollback

Reverting to a previous version of code or infrastructure after a problematic deployment.

### SAST (Static Application Security Testing)

Security testing that analyzes source code for vulnerabilities without executing it. See
[Security Scanning Guide](05_ci_cd/security_scanning_guide.md).

### SBOM (Software Bill of Materials)

A formal record of all components and dependencies in a software application. Used for supply chain security and
license compliance.

## S

### Script

A program written in a scripting language (Bash, Python, PowerShell) to automate tasks.

### Semantic Versioning

A versioning scheme using three numbers (MAJOR.MINOR.PATCH) with defined rules for incrementing each. Used
throughout this style guide.

### ShellCheck

A static analysis tool for shell scripts. Identifies common errors and provides suggestions for improvement.

### Slack Integration

Connecting a service to Slack for notifications and automation. Common in CI/CD pipelines for build status updates.

### snake_case

A naming convention where words are lowercase and separated by underscores. Example: `user_authentication`. Common in
Python and database fields.

### SonarQube

A platform for continuous inspection of code quality. Performs automatic reviews with static analysis to detect bugs
and code smells.

### Sentinel

A policy as code framework by HashiCorp for enforcing governance policies on Terraform runs. See
[Compliance as Code](02_language_guides/compliance_as_code.md).

### Smoke Test

A quick, minimal test to verify that the most critical functions of a system work after a deployment. See
[Smoke Test Standards](05_ci_cd/smoke_test_standards.md).

### SQL (Structured Query Language)

A domain-specific language for managing data in relational databases. Used for querying, updating, and managing
databases. See the [SQL Style Guide](02_language_guides/sql.md).

### Staging Environment

A replica of the production environment used for final testing before deployment. Should match production
configuration closely.

### Static Analysis

Examining code without executing it to find potential errors, security vulnerabilities, and style violations.

### Status

The current state of a module or feature. Valid values: draft, in-progress, review, stable, deprecated, archived.
Documented with `@status` metadata tag.

### Strict Mode

A configuration option that treats warnings as errors and enforces stricter validation rules. Example: `mkdocs build
--strict`.

### Stub

A minimal implementation of a function or module used during testing. Provides predetermined responses without real
logic.

## T

### Tag

A named reference to a specific commit in Git. Used for marking releases. Example: `v1.0.0`.

### Terraform

An infrastructure as code tool that allows defining cloud and on-premises resources in declarative configuration
files. See the [Terraform Style Guide](02_language_guides/terraform.md).

### Terratest

A Go library for writing automated tests for infrastructure code (Terraform, Packer, Kubernetes). See
[IaC Testing Standards](05_ci_cd/iac_testing_standards.md).

### Terragrunt

A thin wrapper for Terraform that provides extra tools for keeping configurations DRY, managing remote state, and
working with multiple modules. See the [Terragrunt Style Guide](02_language_guides/terragrunt.md).

### TOML (Tom's Obvious, Minimal Language)

A configuration file format designed to be easy to read. Used by `pyproject.toml` and Rust's `Cargo.toml`. See
[TOML & INI Guide](02_language_guides/toml_ini.md).

### Test Coverage

A measure of how much code is executed during testing. Expressed as a percentage. Minimum 80% recommended for
business logic.

### tflint

A linter for Terraform that finds possible errors, warns about deprecated syntax, and enforces best practices.

### Type Checker

A tool that verifies type correctness in code. Examples: mypy (Python), tsc (TypeScript).

### TypeScript

A strongly typed superset of JavaScript that compiles to plain JavaScript. Adds static type definitions to JavaScript.
See the [TypeScript Style Guide](02_language_guides/typescript.md).

## U

### Unit Test

A test that verifies a small, isolated piece of code (typically a single function or method) works correctly.

### UpperCamelCase

See PascalCase. A naming convention where every word starts with an uppercase letter.

### UPPER_SNAKE_CASE

A naming convention where words are uppercase and separated by underscores. Example: `API_KEY`. Used for constants.

### uv

A fast Python package installer and resolver. Modern alternative to pip with improved performance and better dependency
resolution.

## V

### Validation

The process of checking that data, code, or configurations meet specified requirements and constraints.

### Variable

A named storage location in a program that holds a value that can be changed during execution.

### Version Control

A system for tracking changes to files over time. Allows reverting to previous versions and collaborating with multiple
developers. Git is the most common version control system.

### VPC (Virtual Private Cloud)

An isolated virtual network within a cloud provider (like AWS). Provides security and control over network
configuration.

## W

### Webhook

An HTTP callback that sends real-time data from one application to another when a specific event occurs. Common in
CI/CD pipelines.

### Whitespace

Characters that represent horizontal or vertical space in text: spaces, tabs, and newlines. Proper whitespace improves
code readability.

### Workflow

A sequence of steps to accomplish a task, often automated in CI/CD systems.

## Y

### YAML (YAML Ain't Markup Language)

A human-readable data serialization language. Common for configuration files in Ansible, Kubernetes, GitHub Actions,
and more.

### yamllint

A linter for YAML files that checks syntax and enforces style rules.

---

## Metadata Tags Reference

### @api_endpoints

Documents HTTP API routes exposed by a module. Format: comma-separated list of `METHOD /path` pairs.

### @author

The original creator or primary maintainer of a module. Helps with accountability and knowledge transfer.

### @dependencies

External libraries, packages, or modules required for the code to function. Can include version constraints.

### @depends_on

Internal module or file dependencies using relative paths. Shows relationships between code modules.

### @description

A clear, concise explanation of what the module does. Should start with a verb and avoid implementation details.

### @env

Target deployment environments for the module. Common values: prod, staging, dev, test.

### @last_updated

Date of the last significant update to the module. Format: YYYY-MM-DD (ISO 8601).

### @license

The software license governing the code. Examples: MIT, Apache-2.0, GPL-3.0.

### @module

Unique identifier for a code module or file. Should be descriptive and use lowercase with underscores or hyphens.

### @python_version

Minimum Python version required. Format: `>= 3.9`. Used for Python modules.

### @security_classification

Data sensitivity level. Values: public, internal, confidential, restricted.

### @status

Current development or deployment status. Values: draft, in-progress, review, stable, deprecated, archived.

### @terraform_version

Minimum Terraform version required. Format: `>= 1.0`. Used for Terraform modules.

### @version

Semantic version of the module (MAJOR.MINOR.PATCH). Updated according to the type of changes made.

---

## Cross-Language Naming Conventions

Different languages use different conventions for the same concepts. This table maps equivalent patterns:

| Concept | Python | TypeScript | Go | Terraform | Bash |
|---------|--------|------------|-----|-----------|------|
| Variable | `snake_case` | `camelCase` | `camelCase` | `snake_case` | `UPPER_SNAKE` or `lower_snake` |
| Function | `snake_case` | `camelCase` | `PascalCase` (exported) | N/A | `snake_case` |
| Class/Type | `PascalCase` | `PascalCase` | `PascalCase` | N/A | N/A |
| Constant | `UPPER_SNAKE` | `UPPER_SNAKE` | `PascalCase` | `snake_case` | `UPPER_SNAKE` |
| File name | `snake_case.py` | `kebab-case.ts` | `snake_case.go` | `snake_case.tf` | `kebab-case.sh` |
| Module/Package | `snake_case` | `kebab-case` | `lowercase` | `snake_case` | N/A |
| Boolean | `is_active` | `isActive` | `isActive` | `enable_feature` | N/A |

See the [Language Comparison Matrix](02_language_guides/comparison_matrix.md) for a complete feature comparison.

---

## Common Abbreviations

- **API**: Application Programming Interface
- **AWS**: Amazon Web Services
- **CI**: Continuous Integration
- **CD**: Continuous Deployment/Delivery
- **CDK**: Cloud Development Kit
- **CLI**: Command-Line Interface
- **DAST**: Dynamic Application Security Testing
- **DRY**: Don't Repeat Yourself
- **EOF**: End of File
- **HCL**: HashiCorp Configuration Language
- **HTTP**: Hypertext Transfer Protocol
- **IAC**: Infrastructure as Code
- **IDE**: Integrated Development Environment
- **JSON**: JavaScript Object Notation
- **JWT**: JSON Web Token
- **K8s**: Kubernetes (8 characters between K and s)
- **LSP**: Language Server Protocol
- **NAT**: Network Address Translation
- **OAuth**: Open Authorization
- **OOP**: Object-Oriented Programming
- **OPA**: Open Policy Agent
- **OS**: Operating System
- **PR**: Pull Request
- **REST**: Representational State Transfer
- **SAST**: Static Application Security Testing
- **SBOM**: Software Bill of Materials
- **SEMVER**: Semantic Versioning
- **SRE**: Site Reliability Engineering
- **SQL**: Structured Query Language
- **SSH**: Secure Shell
- **SSL**: Secure Sockets Layer
- **TLS**: Transport Layer Security
- **URL**: Uniform Resource Locator
- **UUID**: Universally Unique Identifier
- **VCS**: Version Control System
- **VPC**: Virtual Private Cloud
- **TOML**: Tom's Obvious, Minimal Language
- **XRD**: Composite Resource Definition (Crossplane)
- **YAML**: YAML Ain't Markup Language

---

## Tool Names Quick Reference

### Formatters

- **Black**: Python code formatter
- **Prettier**: Multi-language code formatter (JS/TS/JSON/YAML)
- **terraform fmt**: Terraform configuration formatter
- **shfmt**: Shell script formatter

### Linters

- **Flake8**: Python linter (style + errors)
- **Pylint**: Comprehensive Python linter
- **ESLint**: JavaScript/TypeScript linter
- **ShellCheck**: Bash/shell script linter
- **tflint**: Terraform linter
- **yamllint**: YAML linter
- **markdownlint**: Markdown linter

### Type Checkers

- **mypy**: Python static type checker
- **tsc**: TypeScript compiler and type checker

### Testing Frameworks

- **pytest**: Python testing framework
- **Jest**: JavaScript/TypeScript testing framework
- **Mocha**: JavaScript test framework
- **RSpec**: Ruby testing framework

### Build Tools

- **Make**: Build automation tool
- **Gradle**: Build automation for Java/Kotlin
- **Maven**: Build automation and dependency management for Java
- **npm**: Node.js package manager and build tool
- **uv**: Fast Python package installer

### CI/CD Platforms

- **GitHub Actions**: CI/CD integrated with GitHub
- **GitLab CI**: CI/CD integrated with GitLab
- **Jenkins**: Open-source automation server
- **CircleCI**: Cloud-based CI/CD platform
- **Travis CI**: CI service for GitHub projects

### IaC Testing Tools

- **Terratest**: Go-based testing framework for Terraform
- **Kitchen-Terraform**: Test Kitchen plugin for Terraform
- **InSpec**: Compliance automation framework
- **OPA/Conftest**: Policy testing for structured data
- **Checkov**: Static analysis for IaC security

### Security Scanning Tools

- **Trivy**: Container and IaC vulnerability scanner
- **Snyk**: Developer security platform
- **Bandit**: Python security linter
- **Semgrep**: Lightweight static analysis for many languages
- **OWASP ZAP**: Dynamic application security testing

---

**Total Terms**: 200+

For additional terms or clarifications, please refer to the specific language guides or open an issue on the
[GitHub repository](https://github.com/tydukes/coding-style-guide/issues).
