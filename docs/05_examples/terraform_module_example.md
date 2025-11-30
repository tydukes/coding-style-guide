---
title: "Complete Terraform Module Example"
description: "Full working example of a production-ready Terraform module with best practices"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [terraform, module, example, aws, vpc, best-practices]
category: "Examples"
status: "active"
version: "1.0.0"
---

## Overview

This is a complete, production-ready Terraform module called **terraform-aws-vpc** that creates a VPC
with public and private subnets, NAT gateways, and all necessary networking components. It demonstrates
all best practices from the Terraform Module Template.

**Module Purpose**: Creates a highly available AWS VPC with configurable public and private subnets across
multiple availability zones.

---

## Module Structure

```text
terraform-aws-vpc/
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── examples/
│   ├── simple/
│   │   ├── main.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   └── complete/
│       ├── main.tf
│       ├── outputs.tf
│       └── README.md
├── test/
│   └── vpc_test.go
└── .gitignore
```

---

## README.md

```markdown
# AWS VPC Terraform Module

Terraform module for creating a highly available AWS VPC with public and private subnets.

## Features

- ✅ VPC with configurable CIDR block
- ✅ Public and private subnets across multiple AZs
- ✅ NAT Gateways for private subnet internet access
- ✅ Internet Gateway for public subnets
- ✅ Route tables with proper routing
- ✅ VPC Flow Logs (optional)
- ✅ DNS support enabled
- ✅ Configurable tags

## Usage

### Simple Example

\```hcl
module "vpc" {
  source = "github.com/myorg/terraform-aws-vpc"

  name               = "my-vpc"
  cidr_block         = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]

  tags = {
    Environment = "production"
  }
}
\```

### Complete Example

\```hcl
module "vpc" {
  source = "github.com/myorg/terraform-aws-vpc"

  name               = "production-vpc"
  cidr_block         = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  # Public subnets
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

  # Private subnets
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

  # NAT Gateway configuration
  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true

  # VPC Flow Logs
  enable_flow_logs           = true
  flow_logs_retention_days   = 30

  tags = {
    Environment = "production"
    Project     = "my-project"
    ManagedBy   = "Terraform"
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

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| name | Name prefix for VPC resources | `string` | n/a | yes |
| cidr_block | CIDR block for VPC | `string` | n/a | yes |
| availability_zones | List of availability zones | `list(string)` | n/a | yes |
| public_subnet_cidrs | CIDR blocks for public subnets | `list(string)` | `[]` | no |
| private_subnet_cidrs | CIDR blocks for private subnets | `list(string)` | `[]` | no |
| enable_nat_gateway | Enable NAT Gateway for private subnets | `bool` | `true` | no |
| single_nat_gateway | Use single NAT Gateway for all AZs | `bool` | `false` | no |
| enable_flow_logs | Enable VPC Flow Logs | `bool` | `false` | no |
| tags | Tags to apply to resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| vpc_id | The ID of the VPC |
| vpc_cidr | The CIDR block of the VPC |
| public_subnet_ids | List of public subnet IDs |
| private_subnet_ids | List of private subnet IDs |
| nat_gateway_ids | List of NAT Gateway IDs |

## Examples

- [Simple](./examples/simple) - Basic VPC with defaults
- [Complete](./examples/complete) - Production VPC with all features

## Testing

\```bash
cd test
go test -v -timeout 30m
\```

## License

Apache 2.0
```

---

## main.tf

```hcl
# VPC
resource "aws_vpc" "this" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "this" {
  count = length(var.public_subnet_cidrs) > 0 ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-igw"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index % length(var.availability_zones)]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-public-${var.availability_zones[count.index % length(var.availability_zones)]}"
      Type = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index % length(var.availability_zones)]

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-private-${var.availability_zones[count.index % length(var.availability_zones)]}"
      Type = "private"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : (var.one_nat_gateway_per_az ? length(var.availability_zones) : length(var.private_subnet_cidrs))) : 0

  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-nat-eip-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.this]
}

# NAT Gateways
resource "aws_nat_gateway" "this" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : (var.one_nat_gateway_per_az ? length(var.availability_zones) : length(var.private_subnet_cidrs))) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index % length(aws_subnet.public)].id

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-nat-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.this]
}

# Public Route Table
resource "aws_route_table" "public" {
  count = length(var.public_subnet_cidrs) > 0 ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-public-rt"
    }
  )
}

# Public Route
resource "aws_route" "public_internet_gateway" {
  count = length(var.public_subnet_cidrs) > 0 ? 1 : 0

  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this[0].id
}

# Public Subnet Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : (var.one_nat_gateway_per_az ? length(var.availability_zones) : length(var.private_subnet_cidrs))) : length(var.private_subnet_cidrs) > 0 ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-private-rt-${count.index + 1}"
    }
  )
}

# Private Routes to NAT Gateway
resource "aws_route" "private_nat_gateway" {
  count = var.enable_nat_gateway ? length(aws_route_table.private) : 0

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[count.index].id
}

# Private Subnet Route Table Associations
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.single_nat_gateway ? 0 : (var.one_nat_gateway_per_az ? count.index % length(var.availability_zones) : count.index)].id
}

# VPC Flow Logs
resource "aws_flow_log" "this" {
  count = var.enable_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.this.id

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-flow-logs"
    }
  )
}

# CloudWatch Log Group for Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name              = "/aws/vpc/${var.name}"
  retention_in_days = var.flow_logs_retention_days

  tags = var.tags
}

# IAM Role for Flow Logs
resource "aws_iam_role" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.name}-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy for Flow Logs
resource "aws_iam_role_policy" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.name}-flow-logs-policy"
  role = aws_iam_role.flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}
```

---

## variables.tf

```hcl
variable "name" {
  description = "Name prefix for VPC resources"
  type        = string

  validation {
    condition     = length(var.name) > 0 && length(var.name) <= 32
    error_message = "Name must be between 1 and 32 characters"
  }
}

variable "cidr_block" {
  description = "CIDR block for VPC"
  type        = string

  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "Must be a valid CIDR block"
  }
}

variable "availability_zones" {
  description = "List of availability zones for subnets"
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones required for high availability"
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = []
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = []
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway for all private subnets (cost savings but not HA)"
  type        = bool
  default     = false
}

variable "one_nat_gateway_per_az" {
  description = "Create one NAT Gateway per availability zone (recommended for HA)"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs to CloudWatch"
  type        = bool
  default     = false
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain VPC Flow Logs"
  type        = number
  default     = 30

  validation {
    condition     = contains([0, 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.flow_logs_retention_days)
    error_message = "Must be a valid CloudWatch Logs retention period"
  }
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

---

## outputs.tf

```hcl
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.this.id
}

output "vpc_arn" {
  description = "The ARN of the VPC"
  value       = aws_vpc.this.arn
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  value       = aws_subnet.private[*].cidr_block
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = length(aws_internet_gateway.this) > 0 ? aws_internet_gateway.this[0].id : null
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.this[*].id
}

output "nat_gateway_public_ips" {
  description = "List of NAT Gateway public IPs"
  value       = aws_eip.nat[*].public_ip
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = length(aws_route_table.public) > 0 ? aws_route_table.public[0].id : null
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}
```

---

## versions.tf

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

## examples/simple/main.tf

```hcl
provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source = "../../"

  name               = "simple-vpc"
  cidr_block         = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]

  tags = {
    Environment = "dev"
    Example     = "simple"
  }
}
```

---

## examples/simple/outputs.tf

```hcl
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}
```

---

## examples/complete/main.tf

```hcl
provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "../../"

  name               = "production-vpc"
  cidr_block         = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  # Public subnets for load balancers, bastion hosts
  public_subnet_cidrs = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24",
  ]

  # Private subnets for application servers
  private_subnet_cidrs = [
    "10.0.11.0/24",
    "10.0.12.0/24",
    "10.0.13.0/24",
  ]

  # High availability NAT Gateway configuration
  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true

  # Enable DNS
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Enable VPC Flow Logs for security monitoring
  enable_flow_logs         = true
  flow_logs_retention_days = 90

  tags = {
    Environment = "production"
    Project     = "infrastructure"
    ManagedBy   = "Terraform"
    CostCenter  = "engineering"
  }
}
```

---

## examples/complete/outputs.tf

```hcl
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "nat_gateway_public_ips" {
  description = "Public IPs of NAT Gateways"
  value       = module.vpc.nat_gateway_public_ips
}
```

---

## test/vpc_test.go

```go
package test

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestVPCModule(t *testing.T) {
	t.Parallel()

	expectedName := "test-vpc"
	expectedCIDR := "10.0.0.0/16"
	awsRegion := "us-east-1"

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../examples/simple",

		Vars: map[string]interface{}{
			"name":       expectedName,
			"cidr_block": expectedCIDR,
		},

		EnvVars: map[string]string{
			"AWS_DEFAULT_REGION": awsRegion,
		},
	})

	defer terraform.Destroy(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate VPC
	vpcID := terraform.Output(t, terraformOptions, "vpc_id")
	assert.NotEmpty(t, vpcID)

	vpc := aws.GetVpcById(t, vpcID, awsRegion)
	assert.Equal(t, expectedCIDR, vpc.Cidr)

	// Validate subnets
	publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
	assert.Equal(t, 2, len(publicSubnetIDs))

	privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
	assert.Equal(t, 2, len(privateSubnetIDs))
}

func TestVPCModuleWithNATGateway(t *testing.T) {
	t.Parallel()

	awsRegion := "us-east-1"

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../examples/complete",

		EnvVars: map[string]string{
			"AWS_DEFAULT_REGION": awsRegion,
		},
	})

	defer terraform.Destroy(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate NAT Gateways
	natGatewayIPs := terraform.OutputList(t, terraformOptions, "nat_gateway_public_ips")
	assert.Equal(t, 3, len(natGatewayIPs), "Should have 3 NAT Gateways (one per AZ)")

	for _, ip := range natGatewayIPs {
		assert.NotEmpty(t, ip)
	}
}
```

---

## Key Features Demonstrated

This complete Terraform module example demonstrates:

1. **Proper Module Structure**: All standard files in correct locations
2. **Variable Validation**: Input validation with custom error messages
3. **Conditional Resources**: NAT Gateways, Flow Logs based on variables
4. **Count vs For_Each**: Proper use of count for dynamic resources
5. **Tagging Strategy**: Merged tags with defaults
6. **High Availability**: Multi-AZ subnets and NAT Gateways
7. **Security**: VPC Flow Logs with IAM roles
8. **Examples**: Both simple and complete usage patterns
9. **Testing**: Terratest integration for automated testing
10. **Documentation**: Comprehensive README with tables

The module is production-ready and follows AWS Well-Architected Framework principles for networking.

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
