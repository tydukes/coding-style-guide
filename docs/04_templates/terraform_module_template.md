---
title: "Terraform Module Template"
description: "Complete template structure for creating reusable Terraform modules"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [terraform, module, template, infrastructure]
category: "Templates"
status: "active"
version: "1.0.0"
---

## Overview

This template provides a complete structure for creating reusable, well-documented Terraform modules following
industry best practices. Use this as a starting point for building modules that are maintainable, testable, and
easy to consume.

---

## Module Structure

```text
terraform-<provider>-<name>/
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── examples/
│   ├── simple/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   └── complete/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── README.md
├── test/
│   └── module_test.go
└── .gitignore
```

---

## README.md Template

```markdown
## Terraform [Provider] [Resource Name] Module

Terraform module for creating and managing [resource description].

## Usage

### Simple Example

\```hcl
module "example" {
  source = "github.com/your-org/terraform-aws-example"

  name        = "my-resource"
  environment = "production"

  tags = {
    Project = "my-project"
  }
}
\```

### Complete Example

\```hcl
module "example" {
  source = "github.com/your-org/terraform-aws-example"

  name        = "my-resource"
  environment = "production"

  # Advanced configuration
  enable_monitoring = true
  retention_days    = 30

  tags = {
    Project   = "my-project"
    ManagedBy = "Terraform"
  }
}
\```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| aws | >= 5.0 |

## Providers

| Name | Version |
|------|---------|
| aws | >= 5.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_example_resource.this][aws_example_resource] | resource |

[aws_example_resource]: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/example_resource

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| name | Name of the resource | `string` | n/a | yes |
| environment | Environment name | `string` | n/a | yes |
| tags | Tags to apply to resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| id | The ID of the resource |
| arn | The ARN of the resource |

## Examples

See the [examples](./examples) directory for working examples.

## Testing

This module uses [Terratest](https://terratest.gruntwork.io/) for automated testing.

\```bash
cd test
go test -v -timeout 30m
\```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

Apache 2.0 Licensed. See LICENSE for full details.
```

---

## main.tf Template

```hcl
## Main resource definitions
resource "aws_example_resource" "this" {
  name = var.name

  # Configuration
  enabled = var.enabled
  size    = var.size

  # Metadata
  tags = merge(
    var.tags,
    {
      Name        = var.name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

## Supporting resources
resource "aws_example_policy" "this" {
  count = var.enable_policy ? 1 : 0

  name        = "${var.name}-policy"
  description = "Policy for ${var.name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = var.tags
}
```

---

## variables.tf Template

```hcl
## Required variables
variable "name" {
  description = "Name of the resource. Used for resource naming and tagging."
  type        = string

  validation {
    condition     = length(var.name) > 0 && length(var.name) <= 64
    error_message = "Name must be between 1 and 64 characters."
  }
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

## Optional variables with defaults
variable "enabled" {
  description = "Whether the resource is enabled."
  type        = bool
  default     = true
}

variable "size" {
  description = "Size of the resource."
  type        = string
  default     = "small"

  validation {
    condition     = contains(["small", "medium", "large"], var.size)
    error_message = "Size must be small, medium, or large."
  }
}

variable "enable_policy" {
  description = "Whether to create an IAM policy."
  type        = bool
  default     = false
}

variable "retention_days" {
  description = "Number of days to retain logs."
  type        = number
  default     = 7

  validation {
    condition     = var.retention_days > 0
    error_message = "Retention days must be positive."
  }
}

## Complex variables
variable "network_config" {
  description = "Network configuration for the resource."
  type = object({
    vpc_id             = string
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  default = null
}

## Tags
variable "tags" {
  description = "A map of tags to add to all resources."
  type        = map(string)
  default     = {}
}
```

---

## outputs.tf Template

```hcl
## Primary outputs
output "id" {
  description = "The ID of the resource."
  value       = aws_example_resource.this.id
}

output "arn" {
  description = "The ARN of the resource."
  value       = aws_example_resource.this.arn
}

output "name" {
  description = "The name of the resource."
  value       = aws_example_resource.this.name
}

## Conditional outputs
output "policy_arn" {
  description = "The ARN of the IAM policy (if enabled)."
  value       = var.enable_policy ? aws_example_policy.this[0].arn : null
}

## Complex outputs
output "endpoint" {
  description = "Endpoint information for the resource."
  value = {
    url  = aws_example_resource.this.endpoint
    port = aws_example_resource.this.port
  }
}

## Sensitive outputs
output "credentials" {
  description = "Credentials for accessing the resource."
  value = {
    username = aws_example_resource.this.username
    password = aws_example_resource.this.password
  }
  sensitive = true
}
```

---

## versions.tf Template

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}
```

---

## examples/simple/main.tf Template

```hcl
provider "aws" {
  region = "us-east-1"
}

module "example" {
  source = "../../"

  name        = "simple-example"
  environment = "dev"

  tags = {
    Example = "simple"
    Purpose = "testing"
  }
}

output "resource_id" {
  description = "The ID of the created resource."
  value       = module.example.id
}
```

---

## examples/simple/variables.tf Template

```hcl
variable "aws_region" {
  description = "AWS region to deploy resources."
  type        = string
  default     = "us-east-1"
}
```

---

## examples/complete/main.tf Template

```hcl
provider "aws" {
  region = var.aws_region
}

## VPC for the example
resource "aws_vpc" "example" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "example-vpc"
    Example = "complete"
  }
}

resource "aws_subnet" "example" {
  vpc_id            = aws_vpc.example.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name    = "example-subnet"
    Example = "complete"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

## Complete module usage
module "example" {
  source = "../../"

  name        = "complete-example"
  environment = "production"

  # Enable all features
  enabled       = true
  size          = "large"
  enable_policy = true

  # Network configuration
  network_config = {
    vpc_id             = aws_vpc.example.id
    subnet_ids         = [aws_subnet.example.id]
    security_group_ids = []
  }

  # Advanced settings
  retention_days = 30

  tags = {
    Example   = "complete"
    Purpose   = "testing"
    ManagedBy = "Terraform"
  }
}

## Outputs
output "resource_id" {
  description = "The ID of the created resource."
  value       = module.example.id
}

output "resource_arn" {
  description = "The ARN of the created resource."
  value       = module.example.arn
}

output "endpoint" {
  description = "The endpoint of the resource."
  value       = module.example.endpoint
}
```

---

## examples/complete/variables.tf Template

```hcl
variable "aws_region" {
  description = "AWS region to deploy resources."
  type        = string
  default     = "us-east-1"
}
```

---

## test/module_test.go Template

```go
package test

import (
 "testing"

 "github.com/gruntwork-io/terratest/modules/terraform"
 "github.com/stretchr/testify/assert"
)

func TestTerraformModule(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  // Path to the Terraform code
  TerraformDir: "../examples/simple",

  // Variables to pass to the Terraform code
  Vars: map[string]interface{}{
   "aws_region": "us-east-1",
  },

  // Environment variables
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": "us-east-1",
  },
 })

 // Clean up resources at the end of the test
 defer terraform.Destroy(t, terraformOptions)

 // Deploy the infrastructure
 terraform.InitAndApply(t, terraformOptions)

 // Validate outputs
 resourceID := terraform.Output(t, terraformOptions, "resource_id")
 assert.NotEmpty(t, resourceID)
}

func TestTerraformModuleComplete(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../examples/complete",

  Vars: map[string]interface{}{
   "aws_region": "us-east-1",
  },

  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": "us-east-1",
  },
 })

 defer terraform.Destroy(t, terraformOptions)

 terraform.InitAndApply(t, terraformOptions)

 // Test outputs
 resourceID := terraform.Output(t, terraformOptions, "resource_id")
 resourceARN := terraform.Output(t, terraformOptions, "resource_arn")

 assert.NotEmpty(t, resourceID)
 assert.NotEmpty(t, resourceARN)
 assert.Contains(t, resourceARN, "arn:aws:")
}
```

---

## .gitignore Template

```gitignore
## Local .terraform directories
**/.terraform/*

## .tfstate files
*.tfstate
*.tfstate.*

## Crash log files
crash.log
crash.*.log

## Exclude all .tfvars files
*.tfvars
*.tfvars.json

## Ignore override files
override.tf
override.tf.json
*_override.tf
*_override.tf.json

## Ignore CLI configuration files
.terraformrc
terraform.rc

## Ignore lock files (commit for modules)
## .terraform.lock.hcl

## Test artifacts
test/.test-data
test/terraform.tfstate*
test/.terraform/*

## IDE
.idea
.vscode
*.swp
*.swo
*.bak
*~

## OS
.DS_Store
Thumbs.db
```

---

## Best Practices

### Module Naming

```text
terraform-<PROVIDER>-<NAME>

Examples:
- terraform-aws-vpc
- terraform-aws-ec2-instance
- terraform-azure-storage-account
- terraform-google-gke-cluster
```

### Variable Ordering

1. **Required variables** (no defaults)
2. **Optional variables** (with defaults)
3. **Complex variables** (objects, maps)
4. **Tags** (always last)

### Output Naming

Use descriptive, consistent output names:

- `id` - Resource identifier
- `arn` - Amazon Resource Name
- `name` - Resource name
- `endpoint` - Connection endpoint
- `url` - Full URL

### Documentation

- Always include a comprehensive README
- Use `terraform-docs` to auto-generate documentation
- Provide working examples for common use cases
- Include validation rules in variable descriptions

### Testing

- Test with Terratest or similar framework
- Include simple and complete examples
- Test in a separate AWS account
- Clean up resources after testing

---

## References

### Official Documentation

- [Terraform Module Structure](https://developer.hashicorp.com/terraform/language/modules/develop/structure)
- [Terraform Registry Publishing](https://developer.hashicorp.com/terraform/registry/modules/publish)
- [Standard Module Structure](https://developer.hashicorp.com/terraform/language/modules/develop/structure)

### Tools

- [terraform-docs](https://terraform-docs.io/) - Generate documentation
- [Terratest](https://terratest.gruntwork.io/) - Automated testing
- [tflint](https://github.com/terraform-linters/tflint) - Linting
- [checkov](https://www.checkov.io/) - Security scanning

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
