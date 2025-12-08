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
