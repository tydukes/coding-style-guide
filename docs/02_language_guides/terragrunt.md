---
title: "Terragrunt Style Guide"
description: "Terragrunt wrapper standards for DRY Terraform configurations and multi-environment management"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [terragrunt, terraform, iac, dry, devops, infrastructure]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**Terragrunt** is a thin wrapper for Terraform that provides extra tools for keeping your Terraform configurations DRY
(Don't Repeat Yourself), working with multiple Terraform modules, and managing remote state. This guide covers
Terragrunt best practices for multi-environment infrastructure.

### Key Characteristics

- **Purpose**: DRY Terraform configurations, remote state management, multi-environment orchestration
- **File Extension**: `.hcl` (HCL syntax)
- **Primary Use**: Managing Terraform across multiple environments, regions, and accounts
- **Version**: Terragrunt 0.45.x+ (compatible with Terraform 1.5.x+)

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Files** | | | |
| Root Config | `terragrunt.hcl` | `terragrunt.hcl` | Root configuration file |
| Environment Config | `{env}/terragrunt.hcl` | `prod/terragrunt.hcl` | Per-environment config |
| Module Config | `{module}/terragrunt.hcl` | `vpc/terragrunt.hcl` | Per-module config |
| **Structure** | | | |
| Directory Layout | Environment-based | `{env}/{region}/{module}` | Hierarchical structure |
| Root HCL | Shared config | DRY backend, provider config | Reusable configuration |
| **Key Blocks** | | | |
| `terraform` | Terraform settings | `source = "../modules/vpc"` | Module source |
| `include` | Include parent config | `include { path = find_in_parent_folders() }` | Inherit settings |
| `inputs` | Module variables | `inputs = { vpc_cidr = "10.0.0.0/16" }` | Pass variables |
| `remote_state` | State configuration | Backend settings | S3, GCS, etc. |
| `dependency` | Module dependencies | `dependency "vpc" { }` | Inter-module deps |
| **Functions** | | | |
| `find_in_parent_folders()` | Find parent config | Auto-locate root HCL | Traverse up directories |
| `get_terragrunt_dir()` | Current directory | Working directory path | Current module path |
| `path_relative_to_include()` | Relative path | Generate unique names | Path-based naming |
| **Best Practices** | | | |
| DRY Principle | Use root HCL | Shared backend, provider | Avoid repetition |
| Dependencies | Explicit deps | Use `dependency` blocks | Clear relationships |
| State Isolation | Per-module state | Separate state files | Blast radius reduction |
| Run All | Use with caution | `terragrunt run-all` | Test in non-prod first |

---

## Directory Structure

### Standard Layout

Use the `live/<account>/<region>/<environment>/<stack>` pattern:

```text
infrastructure/
├── modules/                           # Reusable Terraform modules
│   ├── vpc/
│   ├── eks/
│   └── rds/
├── live/                              # Live infrastructure
│   ├── terragrunt.hcl                # Root configuration
│   ├── prod/
│   │   ├── us-east-1/
│   │   │   ├── vpc/
│   │   │   │   └── terragrunt.hcl
│   │   │   ├── eks/
│   │   │   │   └── terragrunt.hcl
│   │   │   └── rds/
│   │   │       └── terragrunt.hcl
│   │   └── us-west-2/
│   │       └── vpc/
│   │           └── terragrunt.hcl
│   ├── staging/
│   │   └── us-east-1/
│   │       ├── vpc/
│   │       │   └── terragrunt.hcl
│   │       └── eks/
│   │           └── terragrunt.hcl
│   └── dev/
│       └── us-east-1/
│           └── vpc/
│               └── terragrunt.hcl
└── README.md
```

---

## Root terragrunt.hcl

### Centralized Configuration

```hcl
## @module root_terragrunt
## @description Root Terragrunt configuration for remote state and provider settings
## @version 1.0.0
## @author Tyler Dukes
## @last_updated 2025-10-28

## Generate backend configuration for all child modules
remote_state {
  backend = "s3"

  config = {
    bucket         = "my-terraform-state-${local.account_id}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.aws_region
    encrypt        = true
    dynamodb_table = "terraform-locks"

    s3_bucket_tags = {
      Name        = "Terraform State"
      Environment = local.environment
    }

    dynamodb_table_tags = {
      Name        = "Terraform Locks"
      Environment = local.environment
    }
  }

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

## Generate provider configuration
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"

  contents = <<-EOF
    provider "aws" {
      region = "${local.aws_region}"

      default_tags {
        tags = {
          Environment = "${local.environment}"
          ManagedBy   = "Terragrunt"
          Region      = "${local.aws_region}"
        }
      }
    }
  EOF
}

## Local variables available to all child configurations
locals {
  # Parse environment and region from path
  # Expected path: live/<environment>/<region>/<stack>/terragrunt.hcl
  path_parts  = split("/", path_relative_to_include())
  environment = length(local.path_parts) > 0 ? local.path_parts[0] : "dev"
  aws_region  = length(local.path_parts) > 1 ? local.path_parts[1] : "us-east-1"

  # Account ID mapping
  account_ids = {
    prod    = "111111111111"
    staging = "222222222222"
    dev     = "333333333333"
  }

  account_id = lookup(local.account_ids, local.environment, "333333333333")

  # Common tags
  common_tags = {
    Environment = local.environment
    ManagedBy   = "Terragrunt"
    Region      = local.aws_region
    AccountId   = local.account_id
  }
}

## Terraform version constraints
terraform {
  extra_arguments "common_vars" {
    commands = get_terraform_commands_that_need_vars()

    env_vars = {
      TF_INPUT = "false"
    }
  }
}
```

---

## Child terragrunt.hcl Files

### Basic Child Configuration

```hcl
## @module vpc_live
## @description VPC configuration for production us-east-1
## @version 1.0.0
## @author Tyler Dukes
## @last_updated 2025-10-28

## Include root configuration
include "root" {
  path = find_in_parent_folders()
}

## Reference Terraform module
terraform {
  source = "${get_repo_root()}/modules//vpc"

  # Or use Git repository
  # source = "git::ssh://git@github.com/myorg/terraform-modules.git//vpc?ref=v1.2.0"
}

## Module inputs
inputs = {
  vpc_name            = "prod-vpc-us-east-1"
  cidr_block          = "10.0.0.0/16"
  availability_zones  = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnets      = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  enable_nat_gateway  = true
  enable_vpn_gateway  = false

  tags = {
    Project = "MyApp"
    Owner   = "Platform Team"
  }
}
```

### Configuration with Dependencies

```hcl
## @module eks_live
## @description EKS cluster depending on VPC
## @version 1.0.0
## @author Tyler Dukes
## @last_updated 2025-10-28

include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "${get_repo_root()}/modules//eks"
}

## Dependency on VPC module
dependency "vpc" {
  config_path = "../vpc"

  # Mock outputs for faster plan/validate without applying VPC first
  mock_outputs = {
    vpc_id              = "vpc-mock-id"
    private_subnet_ids  = ["subnet-mock-1", "subnet-mock-2"]
  }

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  cluster_name    = "prod-eks-us-east-1"
  cluster_version = "1.28"

  # Use VPC outputs as inputs
  vpc_id             = dependency.vpc.outputs.vpc_id
  subnet_ids         = dependency.vpc.outputs.private_subnet_ids

  node_groups = {
    general = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 1
      instance_types   = ["t3.large"]
    }
  }
}
```

### Configuration with Multiple Dependencies

```hcl
## @module rds_live
## @description RDS database depending on VPC and security groups
## @version 1.0.0
## @author Tyler Dukes
## @last_updated 2025-10-28

include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "${get_repo_root()}/modules//rds"
}

dependency "vpc" {
  config_path = "../vpc"

  mock_outputs = {
    vpc_id              = "vpc-mock-id"
    private_subnet_ids  = ["subnet-mock-1", "subnet-mock-2"]
  }

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "security_groups" {
  config_path = "../security-groups"

  mock_outputs = {
    database_security_group_id = "sg-mock-id"
  }

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  identifier          = "prod-postgres"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.large"
  allocated_storage   = 100

  vpc_id             = dependency.vpc.outputs.vpc_id
  subnet_ids         = dependency.vpc.outputs.private_subnet_ids
  security_group_ids = [dependency.security_groups.outputs.database_security_group_id]

  backup_retention_period = 7
  multi_az               = true
}
```

---

## Generate Blocks

### Generating Files

```hcl
## Generate versions.tf
generate "versions" {
  path      = "versions.tf"
  if_exists = "overwrite"

  contents = <<-EOF
    terraform {
      required_version = ">= 1.5.0"

      required_providers {
        aws = {
          source  = "hashicorp/aws"
          version = "~> 5.0"
        }
      }
    }
  EOF
}

## Generate data sources
generate "common_data" {
  path      = "data.tf"
  if_exists = "overwrite"

  contents = <<-EOF
    data "aws_caller_identity" "current" {}
    data "aws_region" "current" {}
  EOF
}
```

---

## Hooks

### Before and After Hooks

```hcl
terraform {
  source = "${get_repo_root()}/modules//vpc"

  # Format code before plan/apply
  before_hook "terraform_fmt" {
    commands = ["plan", "apply"]
    execute  = ["terraform", "fmt"]
  }

  # Validate before plan
  before_hook "terraform_validate" {
    commands = ["plan"]
    execute  = ["terraform", "validate"]
  }

  # Run custom script after apply
  after_hook "notify_deployment" {
    commands     = ["apply"]
    execute      = ["bash", "${get_repo_root()}/scripts/notify-deployment.sh"]
    run_on_error = false
  }
}
```

---

## Running Terragrunt

### Common Commands

```bash
## Initialize and apply single module
cd live/prod/us-east-1/vpc
terragrunt init
terragrunt plan
terragrunt apply

## Run plan for all modules in current directory and subdirectories
terragrunt run-all plan

## Apply all modules in dependency order
terragrunt run-all apply

## Destroy specific module
terragrunt destroy

## Destroy all modules in reverse dependency order
terragrunt run-all destroy

## Validate all configurations
terragrunt run-all validate

## Format all HCL files
terragrunt hclfmt

## Show outputs
terragrunt output

## Show dependency graph
terragrunt graph-dependencies
```

---

## Dependency Management

### Explicit Dependencies

```hcl
## Define dependencies to ensure correct apply order
dependencies {
  paths = [
    "../vpc",
    "../security-groups"
  ]
}
```

### Skip Dependencies

```hcl
## Skip dependency for faster iteration during development
dependency "vpc" {
  config_path = "../vpc"

  skip_outputs = true

  mock_outputs = {
    vpc_id = "vpc-mock-id"
  }
}
```

---

## Best Practices

### Use Mock Outputs

```hcl
## Always provide mock outputs for faster plan/validate
dependency "vpc" {
  config_path = "../vpc"

  mock_outputs = {
    vpc_id             = "vpc-00000000"
    public_subnet_ids  = ["subnet-00000001", "subnet-00000002"]
    private_subnet_ids = ["subnet-00000003", "subnet-00000004"]
  }

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs_merge_strategy_with_state  = "shallow"
}
```

### Use get_repo_root()

```hcl
## Good - Portable across different directory depths
terraform {
  source = "${get_repo_root()}/modules//vpc"
}

## Avoid - Brittle with multiple ../
terraform {
  source = "../../../modules//vpc"
}
```

### Keep Inputs DRY with Locals

```hcl
locals {
  # Define common inputs in locals
  common_tags = {
    Environment = "production"
    ManagedBy   = "Terragrunt"
    Project     = "MyApp"
  }

  vpc_config = {
    cidr_block = "10.0.0.0/16"
    azs        = ["us-east-1a", "us-east-1b", "us-east-1c"]
  }
}

inputs = merge(
  local.vpc_config,
  {
    vpc_name = "prod-vpc"
    tags     = local.common_tags
  }
)
```

---

## Testing

### Validate Terragrunt Configuration

```bash
## Validate configuration syntax
terragrunt validate-all

## Check formatting
terragrunt hclfmt --terragrunt-check

## Format files
terragrunt hclfmt

## Validate specific module
cd envs/production
terragrunt validate
```

### Testing with terragrunt plan

```bash
## Plan all modules
terragrunt run-all plan

## Plan specific module
cd envs/production/vpc
terragrunt plan

## Save plan for testing
terragrunt plan -out=tfplan
terraform show -json tfplan > tfplan.json
```

### Policy Testing with conftest

Test Terragrunt-generated plans:

```bash
## Test plan with policies
terragrunt plan -out=tfplan
terraform show -json tfplan | conftest test -p policy/ -

## Test all modules
terragrunt run-all plan -out=tfplan
for dir in envs/*/*; do
  cd "$dir"
  terraform show -json tfplan | conftest test -p ../../../policy/ -
  cd -
done
```

Example policy:

```rego
## policy/terragrunt.rego
package terragrunt

deny[msg] {
  resource := input.planned_values.root_module.resources[_]
  resource.type == "aws_s3_bucket"
  not resource.values.versioning[_].enabled
  msg := sprintf("S3 bucket %s must have versioning enabled", [resource.address])
}

deny[msg] {
  resource := input.planned_values.root_module.resources[_]
  resource.type == "aws_instance"
  not startswith(resource.values.instance_type, "t3")
  msg := sprintf("Instance %s must use t3 instance type", [resource.address])
}
```

### Testing Dependencies

Verify module dependencies resolve correctly:

```bash
## Test dependency graph
terragrunt graph-dependencies | dot -Tpng > dependencies.png

## Validate dependencies exist
terragrunt run-all validate

## Test dependency order
terragrunt run-all plan --terragrunt-log-level debug
```

### Integration Testing

Test full infrastructure deployment:

```bash
## tests/integration-test.sh
#!/bin/bash
set -e

echo "Testing Terragrunt configuration..."

## Validate all configurations
terragrunt run-all validate

## Plan all changes
terragrunt run-all plan

## Apply in test environment
cd envs/test
terragrunt run-all apply -auto-approve

## Run smoke tests
./tests/smoke-test.sh

## Destroy test resources
terragrunt run-all destroy -auto-approve

echo "Integration tests passed!"
```

### Testing with Terratest

```go
## tests/terragrunt_test.go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestTerragruntVPC(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../envs/test/vpc",
        TerraformBinary: "terragrunt",
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcID)
}
```

### CI/CD Testing

```yaml
## .github/workflows/terragrunt-test.yml
name: Terragrunt Tests

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Setup Terragrunt
        run: |
          wget https://github.com/gruntwork-io/terragrunt/releases/latest/download/terragrunt_linux_amd64
          chmod +x terragrunt_linux_amd64
          sudo mv terragrunt_linux_amd64 /usr/local/bin/terragrunt

      - name: Validate format
        run: terragrunt hclfmt --terragrunt-check

      - name: Validate all
        run: terragrunt run-all validate

      - name: Plan all
        run: terragrunt run-all plan
```

### Testing State Management

```bash
## Verify remote state configuration
terragrunt run-all init -backend=false

## Test state isolation
cd envs/production
terragrunt state list

cd ../staging
terragrunt state list

## Verify no shared state
```

### Mock Testing

Test without actually deploying:

```bash
## Use -lock=false for testing
terragrunt plan -lock=false

## Test with mock data
export TF_VAR_environment=test
export TF_VAR_region=us-east-1
terragrunt plan
```

### Performance Testing

```bash
## Measure plan time
time terragrunt run-all plan

## Test with parallelism
terragrunt run-all plan --terragrunt-parallelism 10

## Measure per-module performance
for dir in envs/production/*; do
  cd "$dir"
  echo "Testing $dir"
  time terragrunt plan
  cd -
done
```

---

## Common Pitfalls

### Dependency Path Typos

**Issue**: Incorrect dependency paths cause Terragrunt to fail silently or create resources in wrong order.

**Example**:

```hcl
## Bad - Typo in dependency path
dependency "network" {
  config_path = "../networking"  # ❌ Typo! Should be ../network
}

inputs = {
  vpc_id = dependency.network.outputs.vpc_id  # Fails at runtime
}
```

**Solution**: Verify dependency paths and test with `terragrunt run-all plan`.

```hcl
## Good - Correct dependency path
dependency "network" {
  config_path = "../network"  # ✅ Correct path
}

inputs = {
  vpc_id = dependency.network.outputs.vpc_id
}

## Good - Use relative paths from terragrunt.hcl location
dependency "database" {
  config_path = "${get_terragrunt_dir()}/../rds"  # ✅ Explicit relative path
}
```

**Key Points**:

- Dependency paths are relative to `terragrunt.hcl` location
- Use `terragrunt graph-dependencies` to visualize dependencies
- Test with `terragrunt run-all plan` before apply
- Check for circular dependencies with dependency graph

### Missing Mock Outputs in Dependencies

**Issue**: Dependencies without `mock_outputs` cause failures during initial `plan` before dependencies exist.

**Example**:

```hcl
## Bad - No mock outputs
dependency "vpc" {
  config_path = "../vpc"
  # ❌ No mock_outputs! Fails on first plan
}

inputs = {
  vpc_id = dependency.vpc.outputs.vpc_id  # Error: vpc module not yet applied
}
```

**Solution**: Always provide mock outputs for dependencies.

```hcl
## Good - Mock outputs for planning
dependency "vpc" {
  config_path = "../vpc"

  mock_outputs = {
    vpc_id = "vpc-mock-12345"  # ✅ Used during initial plan
    subnet_ids = ["subnet-mock-1", "subnet-mock-2"]
  }

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  vpc_id = dependency.vpc.outputs.vpc_id
  subnet_ids = dependency.vpc.outputs.subnet_ids
}
```

**Key Points**:

- Mock outputs allow planning before dependencies exist
- Mock values should match expected output types
- Use `mock_outputs_allowed_terraform_commands` to control when mocks apply
- Real outputs override mocks when dependencies are applied

### Include Block Order Matters

**Issue**: Include blocks are processed in order; later includes can't reference earlier ones.

**Example**:

```hcl
## Bad - Trying to reference included locals
include "root" {
  path = find_in_parent_folders()
}

include "region" {
  path = find_in_parent_folders("region.hcl")
}

## ❌ Can't reference locals from included files here
inputs = {
  tags = merge(local.common_tags, local.region_tags)  # Error: locals not defined
}
```

**Solution**: Define locals after includes or use input variables.

```hcl
## Good - Locals defined after includes
include "root" {
  path = find_in_parent_folders()
}

include "region" {
  path = find_in_parent_folders("region.hcl")
}

locals {
  common_tags = {
    ManagedBy = "Terragrunt"
    Environment = "production"
  }
}

inputs = merge(
  include.root.locals.tags,
  include.region.locals.regional_tags,
  local.common_tags
)
```

**Key Points**:

- Includes are processed top-to-bottom
- Reference included locals with `include.<name>.locals.<var>`
- Define module-specific locals after includes
- Use `merge()` to combine configurations from multiple includes

### Remote State Backend Configuration Duplication

**Issue**: Repeating remote state configuration in every `terragrunt.hcl` file causes maintenance burden.

**Example**:

```hcl
## Bad - Repeated in every module
remote_state {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"  # ❌ Duplicated everywhere
    key    = "${path_relative_to_include()}/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "terraform-locks"
  }
}
```

**Solution**: Define remote state in root `terragrunt.hcl` and include it.

```hcl
## Good - Root terragrunt.hcl
## _root/terragrunt.hcl
remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket = "my-terraform-state-${get_aws_account_id()}"
    key    = "${path_relative_to_include()}/terraform.tfstate"
    region = local.aws_region
    encrypt = true
    dynamodb_table = "terraform-locks-${get_aws_account_id()}"
  }
}

## Good - Child module references root
## modules/vpc/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()  # ✅ Inherits remote_state config
}
```

**Key Points**:

- Define remote state once in root `terragrunt.hcl`
- Use `include` to inherit configuration
- Use `get_aws_account_id()` for multi-account setups
- `path_relative_to_include()` ensures unique state keys

### Path Functions Confusion

**Issue**: Mixing up `get_terragrunt_dir()`, `get_parent_terragrunt_dir()`, and `path_relative_to_include()`.

**Example**:

```hcl
## Bad - Wrong path function
locals {
  environment = basename(get_terragrunt_dir())  # ❌ Returns module name, not environment
}

## Bad - Incorrect relative path
dependency "vpc" {
  config_path = get_parent_terragrunt_dir()  # ❌ Points to parent dir, not sibling module
}
```

**Solution**: Use correct path functions for each use case.

```hcl
## Good - Correct path functions
locals {
  # Get environment from parent directory structure
  # /envs/production/vpc/terragrunt.hcl -> "production"
  environment = basename(dirname(get_terragrunt_dir()))

  # Get module name
  # /envs/production/vpc/terragrunt.hcl -> "vpc"
  module_name = basename(get_terragrunt_dir())

  # Get path relative to root
  # /envs/production/vpc/terragrunt.hcl -> "envs/production/vpc"
  relative_path = path_relative_to_include()
}

## Good - Sibling module dependency
dependency "vpc" {
  config_path = "../vpc"  # ✅ Relative to current module
}

## Good - Find root terragrunt.hcl
include "root" {
  path = find_in_parent_folders()  # ✅ Searches up directory tree
}
```

**Key Points**:

- `get_terragrunt_dir()`: Absolute path to current module directory
- `get_parent_terragrunt_dir()`: Absolute path to parent with terragrunt.hcl
- `path_relative_to_include()`: Relative path from root to current module
- `find_in_parent_folders()`: Searches up tree for file

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Values Everywhere

```hcl
## Bad - Hardcoded values in each child
inputs = {
  environment = "prod"
  region      = "us-east-1"
}

## Good - Parse from path in root terragrunt.hcl
locals {
  path_parts  = split("/", path_relative_to_include())
  environment = local.path_parts[0]
  region      = local.path_parts[1]
}
```

### ❌ Avoid: Not Using Dependencies

```hcl
## Bad - Manually passing outputs
inputs = {
  vpc_id = "vpc-1234567890abcdef"  # Hardcoded!
}

## Good - Use dependency block
dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  vpc_id = dependency.vpc.outputs.vpc_id
}
```

### ❌ Avoid: Inconsistent Directory Structure

```hcl
## Bad - Inconsistent paths
live/
├── prod-vpc/
├── staging/vpc/
└── dev_us_east_1/vpc/

## Good - Consistent structure
live/
├── prod/us-east-1/vpc/
├── staging/us-east-1/vpc/
└── dev/us-east-1/vpc/
```

### ❌ Avoid: Not Using generate Blocks

```hcl
## Bad - Provider configuration duplicated in every module
## Repeated in every terragrunt.hcl

## Good - Generate provider in root
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "${local.region}"
  assume_role {
    role_arn = "arn:aws:iam::${local.account_id}:role/TerraformRole"
  }
}
EOF
}
```

### ❌ Avoid: Not Using remote_state

```hcl
## Bad - Each module configures backend separately

## Good - Configure remote state in root
remote_state {
  backend = "s3"
  config = {
    bucket         = "my-terraform-state-${local.account_id}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

### ❌ Avoid: Not Using run_cmd for Dynamic Values

```hcl
## Bad - Static values that should be dynamic
locals {
  account_id = "123456789012"  # ❌ Hardcoded
}

## Good - Get dynamically
locals {
  account_id = run_cmd("aws", "sts", "get-caller-identity", "--query", "Account", "--output", "text")
}
```

### ❌ Avoid: Deep Module Paths Without include

```hcl
## Bad - Duplicating terraform source in each child
terraform {
  source = "git::https://github.com/org/modules.git//vpc?ref=v1.0.0"
}

## Good - Define in root, reference in children
## Root terragrunt.hcl
terraform {
  source = "${get_parent_terragrunt_dir()}/modules//vpc"
}

## Child just includes
include "root" {
  path = find_in_parent_folders()
}
```

---

## Security Best Practices

### Secure State Backend Configuration

Always use encrypted remote state backends with proper access controls.

```hcl
## Bad - Local state (not secure for teams)
## terragrunt.hcl
terraform {
  source = "git::https://github.com/org/modules//vpc"
}
## State stored locally - no encryption, no locking!

## Good - S3 backend with encryption
remote_state {
  backend = "s3"
  config = {
    bucket         = "mycompany-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true  # Server-side encryption
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
    dynamodb_table = "terraform-locks"  # State locking

    ## Restrict access
    acl            = "private"

    ## Enable versioning for recovery
    versioning     = true
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}
```

### Secrets Management

Never commit secrets to terragrunt.hcl files.

```hcl
## Bad - Hardcoded secrets
## terragrunt.hcl
inputs = {
  database_password = "SuperSecret123"  # NEVER!
  api_key          = "sk_live_abc123"   # Exposed in version control!
}

## Good - Use environment variables
inputs = {
  database_password = get_env("TF_VAR_database_password", "")
  api_key          = get_env("TF_VAR_api_key", "")
}

## Better - Use AWS Secrets Manager/Parameter Store
locals {
  secrets = yamldecode(sops_decrypt_file("${get_terragrunt_dir()}/secrets.enc.yaml"))
}

inputs = {
  database_password = local.secrets.database_password
  api_key          = local.secrets.api_key
}

## Best - Use SOPS for encrypted files
## Encrypt secrets file
## sops --encrypt secrets.yaml > secrets.enc.yaml
```

### Input Validation

Validate inputs to prevent misconfigurations.

```hcl
## Good - Validate environment names
locals {
  environment = get_env("ENVIRONMENT", "dev")

  ## Validate environment
  valid_environments = ["dev", "staging", "prod"]
  is_valid_env      = contains(local.valid_environments, local.environment)
}

inputs = {
  environment = local.is_valid_env ? local.environment : run_cmd(
    "--terragrunt-quiet", "echo",
    "Error: Invalid environment ${local.environment}", "&&", "exit", "1"
  )

  ## Validate CIDR blocks
  vpc_cidr = get_env("VPC_CIDR")

  ## Validation in module will check format
}

## Good - Validate AWS region
locals {
  aws_region = get_env("AWS_REGION", "us-east-1")

  valid_regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-central-1", "ap-southeast-1"
  ]
}

inputs = {
  aws_region = contains(local.valid_regions, local.aws_region) ? local.aws_region : "us-east-1"
}
```

### Dependency Security

Trust but verify module sources and dependencies.

```hcl
## Bad - Unverified module source
terraform {
  source = "github.com/random-user/terraform-modules//vpc"  # Untrusted!
}

## Bad - Using latest/master (no version pinning)
terraform {
  source = "git::https://github.com/org/modules.git//vpc?ref=master"  # Unpredictable!
}

## Good - Pin to specific verified version
terraform {
  source = "git::https://github.com/your-org/terraform-modules.git//vpc?ref=v1.2.3"
}

## Good - Use release tags with verification
terraform {
  source = "git::ssh://git@github.com/your-org/modules.git//vpc?ref=v1.2.3"
}

dependency "vpc" {
  config_path = "../vpc"

  ## Skip outputs if VPC doesn't exist (safe default)
  skip_outputs = true

  ## Mock outputs for plan operations
  mock_outputs = {
    vpc_id     = "vpc-mock-id"
    subnet_ids = ["subnet-mock-1", "subnet-mock-2"]
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}
```

### IAM Role Security

Use assume_role with proper constraints.

```hcl
## Bad - Over-privileged role
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "${local.aws_region}"

  assume_role {
    role_arn = "arn:aws:iam::123456789012:role/TerraformAdmin"  # Too broad!
  }
}
EOF
}

## Good - Environment-specific roles with external ID
locals {
  account_id  = get_env("AWS_ACCOUNT_ID")
  environment = get_env("ENVIRONMENT")
  external_id = get_env("TERRAFORM_EXTERNAL_ID")  # Additional security
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "${local.aws_region}"

  assume_role {
    role_arn    = "arn:aws:iam::${local.account_id}:role/Terraform-${local.environment}"
    external_id = "${local.external_id}"
    session_name = "terragrunt-${local.environment}-$${USER}"
  }

  default_tags {
    tags = {
      ManagedBy   = "Terragrunt"
      Environment = "${local.environment}"
      Owner       = "$${USER}"
    }
  }
}
EOF
}
```

### Sensitive Output Protection

Mark sensitive outputs appropriately.

```hcl
## Bad - Exposing sensitive data
dependency "rds" {
  config_path = "../rds"
}

inputs = {
  db_host     = dependency.rds.outputs.endpoint
  db_password = dependency.rds.outputs.password  # Logged in plan output!
}

## Good - Use sensitive flag in module outputs
## In RDS module outputs.tf:
output "password" {
  value     = random_password.db_password.result
  sensitive = true  # Prevents logging in Terraform output
}

## In terragrunt.hcl - outputs remain sensitive
dependency "rds" {
  config_path = "../rds"
}

inputs = {
  db_host     = dependency.rds.outputs.endpoint
  db_password = dependency.rds.outputs.password  # Still sensitive
}
```

### Lock File Integrity

Use and verify lock files.

```hcl
## Bad - Ignoring lock files
## .gitignore
.terraform.lock.hcl  # DON'T IGNORE!

## Good - Commit lock files
## .gitignore should NOT include:
## .terraform.lock.hcl (commit this!)

## In CI/CD pipeline
## terraform.yml
steps:
  - name: Verify lock file
    run: |
      if ! git diff --exit-code .terraform.lock.hcl; then
        echo "Error: Lock file has uncommitted changes"
        exit 1
      fi

  - name: Run terragrunt
    run: |
      terragrunt run-all plan
```

### Prevent Accidental Destruction

Use prevent_destroy and require confirmations.

```hcl
## Good - Require confirmation for prod
locals {
  environment = get_env("ENVIRONMENT")
}

## Prevent accidental destroy in production
terraform {
  before_hook "prevent_destroy" {
    commands = ["destroy"]
    execute  = local.environment == "prod" ? [
      "bash", "-c",
      "echo 'ERROR: Cannot destroy production environment!' && exit 1"
    ] : ["echo", "Destroy allowed in ${local.environment}"]
  }
}

## Require manual approval
terraform {
  before_hook "require_approval" {
    commands = ["apply"]
    execute  = local.environment == "prod" ? [
      "bash", "-c",
      "read -p 'Apply to PRODUCTION? (yes/no): ' confirm && " +
      "[ \"$confirm\" = \"yes\" ] || exit 1"
    ] : ["echo", "Proceeding with apply"]
  }
}
```

### Secure Hooks

Validate hook scripts and limit execution.

```hcl
## Bad - Arbitrary command execution
terraform {
  after_hook "notify" {
    commands = ["apply"]
    execute  = ["sh", "-c", get_env("NOTIFY_COMMAND")]  # Dangerous!
  }
}

## Good - Controlled hook execution
terraform {
  after_hook "notify_success" {
    commands     = ["apply"]
    execute      = ["bash", "${get_terragrunt_dir()}/scripts/notify.sh", "success", "${path_relative_to_include()}"]
    run_on_error = false
  }

  after_hook "notify_failure" {
    commands     = ["apply"]
    execute      = ["bash", "${get_terragrunt_dir()}/scripts/notify.sh", "failure", "${path_relative_to_include()}"]
    run_on_error = true
  }
}

## Ensure hook scripts have proper permissions
## chmod 755 scripts/notify.sh
## Never chmod 777!
```

### Audit and Compliance Logging

Enable comprehensive logging for audit trails.

```hcl
## Good - Log all Terragrunt operations
terraform {
  extra_arguments "common_vars" {
    commands = get_terraform_commands_that_need_vars()

    env_vars = {
      TF_LOG       = "INFO"
      TF_LOG_PATH  = "${get_terragrunt_dir()}/terraform.log"
    }
  }

  before_hook "log_start" {
    commands = ["apply", "destroy"]
    execute  = [
      "bash", "-c",
      "echo \"[$(date -u +%Y-%m-%dT%H:%M:%SZ)] User: $USER, " +
      "Action: ${command}, Path: ${path_relative_to_include()}\" >> " +
      "/var/log/terragrunt-audit.log"
    ]
  }
}
```

---

## Tool Configurations

### .terragrunt-cache

Add to `.gitignore`:

```gitignore
## Terragrunt cache
.terragrunt-cache/
**/.terragrunt-cache/

## Terraform files
*.tfstate
*.tfstate.backup
.terraform/
```

### VSCode Extensions

- **Terraform**: Syntax highlighting for HCL
- **HashiCorp Terraform**: Official HashiCorp extension

---

## References

### Official Documentation

- [Terragrunt Documentation](https://terragrunt.gruntwork.io/)
- [Terragrunt Quick Start](https://terragrunt.gruntwork.io/docs/getting-started/quick-start/)
- [Terragrunt Configuration Reference](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/)

### Gruntwork Resources

- [Gruntwork Infrastructure as Code Library](https://gruntwork.io/infrastructure-as-code-library/)
- [How to Use Terragrunt](https://blog.gruntwork.io/terragrunt-how-to-keep-your-terraform-code-dry-and-maintainable-f61ae06959d8)

### Best Practice Guides

- [Terragrunt Overview & Best Practices](https://terragrunt.gruntwork.io/docs/getting-started/overview/)
- [Keep Your Terraform Code DRY](https://blog.gruntwork.io/terragrunt-how-to-keep-your-terraform-code-dry-and-maintainable-f61ae06959d8)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
