---
title: "TESTING.md Template"
description: "Standardized template for documenting testing procedures"
author: "Tyler Dukes"
tags: [template, testing, iac, terraform, ansible, ci-cd]
category: "Templates"
status: "active"
---

This template provides a standardized format for documenting the testing approach, coverage,
and procedures for Infrastructure as Code projects.

## Purpose

A TESTING.md file helps developers understand:

- How to run tests locally before committing
- What tests exist and what they validate
- Test coverage and requirements
- Troubleshooting common test failures
- CI/CD integration and pipeline stages

## When to Use This Template

Create a TESTING.md file for:

- **Terraform modules**: Modules with Terratest or native Terraform tests
- **Ansible roles**: Roles tested with Molecule and InSpec
- **IaC projects**: Any infrastructure code with automated tests
- **Reusable components**: Shared modules/roles used across teams

## How to Use This Template

1. Copy the template below to your project root as `TESTING.md`
2. Fill in all applicable sections
3. Remove sections marked `[Optional]` if not relevant
4. Include actual commands developers can copy/paste
5. Keep synchronized with CONTRACT.md guarantees
6. Update when testing approach changes

---

## Template Content

````markdown
# Testing

This document describes how to test this [module/role/project], including local testing,
CI/CD integration, and troubleshooting guidance.

## Overview

**Testing Philosophy**: [Brief description of testing approach for this project]

**Tools Used**:

- [Tool 1]: [Purpose]
- [Tool 2]: [Purpose]
- [Tool 3]: [Purpose]

**Example**:

- **terraform validate**: Syntax and configuration validation
- **tflint**: Terraform linting and best practices
- **Terratest**: Go-based integration testing
- **tfsec**: Security scanning

**Or for Ansible**:

- **ansible-lint**: Role linting and best practices
- **yamllint**: YAML syntax validation
- **Molecule**: Role testing framework
- **InSpec**: Compliance and security verification

## Quick Start

```bash
# Run all pre-commit checks (< 30 seconds)
make lint

# Run unit tests (< 10 minutes)
make test-unit

# Run integration tests (provisions resources, < 60 minutes)
make test-integration

# Run compliance tests
make test-compliance

# Run everything
make test-all
```

**Or without Make**:

```bash
# Terraform
terraform fmt -check -recursive
terraform validate
cd tests && go test -v ./...

# Ansible
ansible-lint
yamllint .
molecule test
```

## Prerequisites

### Required Tools

| Tool | Minimum Version | Recommended | Installation |
|------|----------------|-------------|--------------|
| [Tool Name] | [X.Y.Z] | [A.B.C] | [Installation command or link] |

**Example (Terraform)**:

| Tool | Minimum Version | Recommended | Installation |
|------|----------------|-------------|--------------|
| Terraform | 1.3.0 | 1.6.0 | `brew install terraform` |
| Go | 1.19 | 1.21 | `brew install go` |
| TFLint | 0.44.0 | 0.50.0 | `brew install tflint` |
| TFSec | 1.28.0 | Latest | `brew install tfsec` |

**Example (Ansible)**:

| Tool | Minimum Version | Recommended | Installation |
|------|----------------|-------------|--------------|
| Ansible | 2.14 | 2.16 | `pip install ansible` |
| Molecule | 5.0 | 6.0 | `pip install molecule[docker]` |
| Docker | 20.10 | Latest | `brew install docker` |
| InSpec | 5.0 | Latest | `brew install chef/chef/inspec` |

### Environment Setup

**Step-by-step setup for local testing**:

```bash
# 1. Install dependencies
pip install -r requirements-test.txt
# or
go mod download

# 2. Configure credentials [if needed]
export AWS_PROFILE=testing
# or
export MOLECULE_DOCKER_COMMAND=/usr/local/bin/docker

# 3. Initialize tools
terraform init -backend=false
# or
molecule init

# 4. Verify setup
make verify-setup
```

### Credentials and Access [Optional]

**Required access**:

- AWS account with permissions to create VPCs, subnets, etc.
- Docker installed and running (for Molecule)
- Access to private container registry (if applicable)

**Setting up credentials**:

```bash
# AWS
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"

# Or use AWS profile
export AWS_PROFILE="terraform-testing"
```

### Test Infrastructure Requirements [Optional]

[If tests require pre-existing infrastructure]

**Required resources**:

- S3 bucket for Terraform remote state (optional for testing)
- VPC with specific CIDR (if testing integration)
- Test AWS account with isolated environment

## Running Tests Locally

### Lint and Format Checks (Tier 1: < 30 seconds)

Fast validation that runs before commit:

```bash
# Terraform
terraform fmt -check -recursive
terraform validate
tflint --recursive
tfsec .

# Ansible
yamllint .
ansible-lint --strict
```

**What gets tested**:

- Code formatting consistency
- Syntax validation
- Configuration correctness
- Security best practices
- Secret detection

### Unit Tests (Tier 2: < 10 minutes)

Module/role-level testing without provisioning real infrastructure:

```bash
# Terraform (Terratest)
cd tests/unit
go test -v -timeout 10m ./...

# Terraform (native tests)
terraform test

# Ansible (Molecule)
molecule test -s default
```

**What gets tested**:

- Module inputs and outputs
- Resource configuration
- Conditional logic
- Error handling
- Idempotency (for Ansible)

**Expected duration**: 5-10 minutes

### Integration Tests (Tier 3: < 60 minutes)

Full environment testing with real resource provisioning:

```bash
# Terraform
cd tests/integration
go test -v -timeout 60m ./...

# Ansible
molecule test -s integration
```

**What gets tested**:

- End-to-end resource creation
- Multi-component interactions
- Network connectivity
- Service availability
- Resource cleanup

**Expected duration**: 30-60 minutes

**⚠️ Cost Warning**: Integration tests provision real infrastructure and may incur costs.
Estimated cost: $[X] per test run.

**Cleanup**:

```bash
# Terraform
terraform destroy -auto-approve

# Ansible
molecule destroy

# Or use cleanup script
./scripts/cleanup-test-resources.sh
```

### Compliance Tests (Tier 3: < 15 minutes) [Optional]

Security and compliance validation:

```bash
# InSpec
inspec exec tests/compliance/ --reporter cli json:compliance-results.json

# Molecule with InSpec
molecule test -s compliance

# Or via Make
make test-compliance
```

**What gets tested**:

- CIS benchmarks
- Security baselines
- Regulatory compliance (SOC2, PCI-DSS, HIPAA)
- Policy enforcement

**Expected duration**: 10-15 minutes

## Test Organization

### Directory Structure

```
[project-root]/
├── tests/
│   ├── unit/                    # Fast, isolated unit tests
│   │   ├── vpc_test.go
│   │   └── subnets_test.go
│   ├── integration/             # Full environment tests
│   │   ├── full_stack_test.go
│   │   └── network_test.go
│   ├── compliance/              # InSpec/policy tests
│   │   ├── security_baseline.rb
│   │   └── cis_benchmark.rb
│   ├── fixtures/                # Test data and configurations
│   │   ├── test_vpc.tfvars
│   │   └── test_config.yml
│   └── mocks/                   # Mock data for unit tests
│       └── aws_responses.json
├── Makefile                     # Test execution targets
├── TESTING.md                   # This file
└── CONTRACT.md                  # Guarantees being tested
```

**Or for Ansible**:

```
[project-root]/
├── molecule/
│   ├── default/                 # Default test scenario
│   │   ├── molecule.yml
│   │   ├── converge.yml
│   │   └── verify.yml
│   ├── compliance/              # Compliance scenario
│   │   ├── molecule.yml
│   │   └── tests/
│   │       └── test_security.rb
│   └── multi-platform/          # Multi-OS testing
│       └── molecule.yml
├── tests/
│   └── fixtures/
├── TESTING.md
└── CONTRACT.md
```

### Test Naming Conventions

**Files**:

- Unit tests: `*_test.go`, `test_*.py`, `*_spec.rb`
- Integration tests: `*_integration_test.go`
- Compliance tests: `security_baseline.rb`, `cis_benchmark.rb`

**Test Functions**:

- Use descriptive names: `TestVPCCreatesCorrectSubnets` (not `TestVPC`)
- Follow pattern: `Test[Module][Behavior]`
- Example: `TestWebserverInstallsNginxPackage`

**Fixtures**:

- Name by scenario: `fixtures/basic_vpc.tfvars`, `fixtures/multi_az.tfvars`
- Use YAML for Ansible: `fixtures/default_config.yml`

## Test Coverage

### Current Coverage

**Guarantee Coverage**: [X]% of guarantees tested

**Platform Coverage**:

| Platform | Unit Tests | Integration | Compliance | Notes |
|----------|------------|-------------|------------|-------|
| Ubuntu 22.04 | ✅ | ✅ | ✅ | Primary platform |
| Ubuntu 20.04 | ✅ | ✅ | ✅ | Supported |
| RHEL 9 | ✅ | ⚠️ | ❌ | Integration pending |
| Windows 2022 | ⚠️ | ❌ | ❌ | Planned Q2 2024 |

**Legend**:

- ✅ Tested and passing
- ⚠️ Experimental or limited testing
- ❌ Not yet supported

**Test-to-Guarantee Mapping**:

[Show which tests verify which guarantees from CONTRACT.md]

- `test_vpc_creation.go`: Tests G1, G2 (VPC creation and DNS)
- `test_subnets.go`: Tests G3, G4 (Subnet creation and distribution)
- `test_nat_gateways.go`: Tests G5 (NAT Gateway creation)
- `test_idempotency.go`: Tests G6 (Idempotent behavior)

### Coverage Requirements

**Minimum Requirements**:

- **Guarantee Coverage**: 100% of guarantees in CONTRACT.md
- **Resource Coverage**: 80% of resource types
- **Platform Coverage**: At least 2 platforms tested
- **Compliance Coverage**: All HIGH/CRITICAL security findings addressed

**Current Status**: [Meeting/Not Meeting] requirements

**Coverage Gaps**: [List any missing coverage]

## CI/CD Integration

### Pipeline Stages

Tests run automatically in CI/CD:

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Tier 1:     │ → │ Tier 2:     │ → │ Tier 3:     │ → │ Deploy      │
│ Lint        │   │ Unit Tests  │   │ Integration │   │ (if passed) │
│ (< 2 min)   │   │ (< 10 min)  │   │ (< 60 min)  │   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
     ↓                  ↓                  ↓
  Every commit     Every PR         Main/Nightly
```

**Stage Details**:

1. **Lint Stage**: Runs on every commit
2. **Unit Test Stage**: Runs on every pull request
3. **Integration Stage**: Runs on main branch commits or nightly
4. **Compliance Stage**: Runs weekly or on release tags

### Pipeline Configuration

See CI/CD configuration:

- GitHub Actions: `.github/workflows/test.yml`
- GitLab CI: `.gitlab-ci.yml`
- Jenkins: `Jenkinsfile`

### Running Specific Tests

**Run specific test file**:

```bash
# Terratest
go test -v ./tests/unit/vpc_test.go

# Molecule specific scenario
molecule test -s compliance

# InSpec specific control
inspec exec tests/compliance/security_baseline.rb --controls cis-1.1
```

**Run tests for specific platform**:

```bash
# Set platform for Molecule
MOLECULE_DISTRO=ubuntu2204 molecule test

# Or use matrix in CI
make test-platform PLATFORM=rhel-9
```

**Change-based testing** [Optional]:

```bash
# Only test changed modules
./scripts/test-changed-modules.sh

# Or use git diff
git diff --name-only main...HEAD | grep '\.tf$' | xargs -I {} dirname {} | sort -u
```

## Troubleshooting

### Common Issues

#### Authentication Failures

**Problem**: `Error: UnauthorizedOperation when calling CreateVpc`

**Solution**:

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:user/test-user \
  --action-names ec2:CreateVpc
```

#### Resource Quota Limits

**Problem**: `Error: VpcLimitExceeded - The maximum number of VPCs has been reached`

**Solution**:

```bash
# List and clean up test VPCs
aws ec2 describe-vpcs --filters "Name=tag:Environment,Values=test" \
  | jq -r '.Vpcs[].VpcId' \
  | xargs -I {} aws ec2 delete-vpc --vpc-id {}
```

#### Network Connectivity

**Problem**: `Error: timeout waiting for service to be ready`

**Solution**:

- Check security group rules allow required ports
- Verify subnets have route to internet (for outbound)
- Check network ACLs aren't blocking traffic

#### Docker Issues (Molecule)

**Problem**: `Error: Cannot connect to Docker daemon`

**Solution**:

```bash
# Start Docker
sudo systemctl start docker

# Or on macOS
open -a Docker

# Verify Docker is running
docker ps
```

#### Platform-Specific Issues

**RHEL/CentOS**:

- Ensure EPEL repository is enabled
- SELinux may block certain operations (use `--security-opt label=disable` for tests)

**Windows**:

- WinRM must be configured and accessible
- Requires different Molecule driver (`molecule-vagrant` or `molecule-azure`)

### Debug Mode

**Enable verbose output**:

```bash
# Terraform
TF_LOG=DEBUG terraform apply

# Terratest
go test -v -timeout 30m ./... -args -test.v

# Molecule
molecule --debug test

# InSpec
inspec exec tests/ --log-level debug
```

**Log Locations**:

- Terraform: `crash.log` (if Terraform crashes)
- Molecule: `molecule/default/.molecule/` directory
- CI/CD: Check pipeline logs in UI

**State Inspection**:

```bash
# Terraform
terraform show
terraform state list

# Ansible
molecule login  # SSH into test instance
```

## Test Data & Fixtures

### Test Data Management

**Location**: `tests/fixtures/`

**Contents**:

- `.tfvars` files for Terraform variables
- `.yml` files for Ansible variables
- Mock API responses
- Test certificates (self-signed)

**Example Fixture** (Terraform):

```hcl
# tests/fixtures/basic_vpc.tfvars
vpc_cidr           = "10.0.0.0/16"
environment        = "test"
availability_zones = ["us-east-1a", "us-east-1b"]
enable_nat_gateway = true
```

**Example Fixture** (Ansible):

```yaml
# tests/fixtures/webserver_config.yml
nginx_version: "1.24"
nginx_port: 8080
enable_ssl: false
```

### Sensitive Data Handling

**⚠️ NEVER commit real credentials or secrets to test fixtures**

Use fake/placeholder values:

```yaml
# GOOD - Fake credentials for testing
aws_account_id: "123456789012"  # Clearly fake
database_password: "test-password-not-real"

# BAD - Real credentials
aws_access_key: "AKIAIOSFODNN7EXAMPLE"  # Never do this!
```

For tests requiring real credentials, use environment variables:

```bash
export TEST_AWS_ACCESS_KEY_ID="from-vault"
export TEST_DATABASE_PASSWORD="from-vault"
```

### Mock vs Real Resources

**Use Mocks For**:

- Unit tests (fast, no cost)
- External API calls
- Expensive resources
- Non-critical path testing

**Use Real Resources For**:

- Integration tests (verify actual behavior)
- Compliance tests (real infrastructure validation)
- Production-like scenarios

**Cost Considerations**:

- Mock testing: $0
- Integration testing: ~$[X]/hour (estimate based on resources)
- Keep integration test duration short to minimize cost

## Platform-Specific Testing

### Supported Platforms

This [module/role] is tested on:

- **Ubuntu**: 20.04 LTS, 22.04 LTS
- **RHEL/Rocky Linux**: 8, 9
- **Windows Server** [if applicable]: 2019, 2022
- **Cloud Providers** [if applicable]: AWS, Azure, GCP

### Platform Testing Commands

**Ubuntu**:

```bash
MOLECULE_DISTRO=ubuntu2204 molecule test
# or
make test-ubuntu
```

**RHEL/Rocky**:

```bash
MOLECULE_DISTRO=rockylinux9 molecule test
# or
make test-rhel
```

**Windows** [Optional]:

```bash
molecule test -s windows
```

### Parallel Platform Testing

Run tests across all platforms simultaneously:

```bash
# Using GNU parallel
parallel molecule test -s {} ::: ubuntu2204 debian11 rockylinux9

# Or via Makefile
make test-all-platforms

# In CI (GitLab CI example)
test:multi-platform:
  parallel:
    matrix:
      - PLATFORM: [ubuntu2204, debian11, rockylinux9]
  script:
    - molecule test -s $PLATFORM
```

## Maintenance

### Updating Tests

**When to Update**:

- When adding new features (add tests for new guarantees)
- When fixing bugs (add regression tests)
- When CONTRACT.md changes (update test coverage)
- When platform support changes (add/remove platform tests)

**Test Review Process**:

1. Review tests during code review
2. Verify tests match CONTRACT.md guarantees
3. Check test coverage hasn't decreased
4. Ensure new features have tests

**CONTRACT.md Synchronization**:

Keep TESTING.md in sync with CONTRACT.md:

- Every guarantee in CONTRACT.md should have corresponding tests
- Every test should reference which guarantees it validates
- Update both documents when behavior changes

### Test Dependencies

**Updating Tool Versions**:

```bash
# Terraform providers
terraform init -upgrade

# Go modules
go get -u all
go mod tidy

# Python packages
pip install --upgrade -r requirements-test.txt

# Or via Makefile
make update-deps
```

**Compatibility Testing**:

After updating dependencies, run full test suite:

```bash
make test-all
```

**Version Pinning**:

Pin versions for reproducibility:

```hcl
# Terraform
terraform {
  required_version = ">= 1.3.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

```yaml
# requirements-test.txt
molecule[docker]==6.0.0
ansible-lint==6.20.0
yamllint==1.32.0
```

---

## Additional Resources

- [CONTRACT.md](CONTRACT.md) - Module/role guarantees being tested
- [CI/CD Pipeline](.github/workflows/test.yml) - Automated test configuration
- [Contributing Guide](CONTRIBUTING.md) - How to add new tests
- [IaC Testing Standards](https://docs.example.com/testing) - Organization testing standards

---


*Test Framework Version: [X.Y.Z]*
````

---

## Examples

### Example 1: Terraform Module Testing Documentation

See the [Terraform guide Testing section](../02_language_guides/terraform.md#testing) for complete
testing examples including Terratest and native Terraform tests.

### Example 2: Ansible Role Testing Documentation

See the [Ansible guide Testing section](../02_language_guides/ansible.md#testing-with-molecule) for complete
Molecule and InSpec testing examples.

## Additional Resources

- [IaC Testing Standards](../05_ci_cd/iac_testing_standards.md) - Organization-wide testing philosophy
- [CONTRACT.md Template](contract_template.md) - Module/role contract template
- [Terraform Testing Guide](../02_language_guides/terraform.md#testing) - Terraform-specific testing
- [Ansible Testing Guide](../02_language_guides/ansible.md#testing-with-molecule) - Ansible-specific testing

---
