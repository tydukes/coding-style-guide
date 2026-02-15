---
title: "Tutorial 2: Migrating Existing Terraform Module (45 min)"
description: "Step-by-step tutorial for migrating a legacy Terraform VPC module to full Dukes Engineering Style Guide compliance"
author: "Tyler Dukes"
tags: [tutorial, terraform, migration, iac, contract, terratest, vpc, compliance]
category: "Tutorials"
status: "active"
search_keywords: [tutorial, terraform, migration, module, existing project, step by step]
---

<!-- markdownlint-disable MD013 -->

## Overview

This tutorial walks through taking a real-world, messy Terraform VPC module and bringing it to full compliance with the Dukes Engineering Style Guide. You will fix formatting, add validation, write a CONTRACT.md, add metadata, create Terratest tests, and set up CI/CD.

### What You Will Build

```text
Before                              After
======                              =====
vpc-module/                         terraform-aws-vpc/
  main.tf (600 lines, messy)          main.tf
  vars.tf (no descriptions)           variables.tf
                                      outputs.tf
                                      versions.tf
                                      locals.tf
                                      CONTRACT.md
                                      README.md
                                      test/
                                        vpc_test.go
                                        fixtures/
                                          main.tf
                                      .github/
                                        workflows/
                                          ci.yml
```

### Estimated Time

```text
Step 1: Assess the Legacy Module       5 min
Step 2: Apply Formatting Standards      5 min
Step 3: Add Variable Validation         5 min
Step 4: Write CONTRACT.md              10 min
Step 5: Add Metadata                    3 min
Step 6: Write Terratest Tests          10 min
Step 7: Set Up CI/CD                    5 min
Step 8: Publish to Registry             2 min
─────────────────────────────────────────────
Total                                  45 min
```

### Prerequisites

```bash
# Verify required tools
terraform version   # Terraform 1.6+
go version          # Go 1.21+
git version         # Git 2.30+
aws --version       # AWS CLI 2.x (for plan/apply)
```

```bash
# Install terratest (Go module)
go install github.com/gruntwork-io/terratest@latest

# Install terraform-docs
brew install terraform-docs    # macOS
# or
go install github.com/terraform-docs/terraform-docs@latest
```

---

## Step 1: Assess the Legacy Module (5 min)

Below is the legacy module you are migrating. This is a typical "grown organically" module with common problems: everything in one file, no descriptions, hardcoded values, inconsistent naming, and no documentation.

### The "Before" State

```hcl
# vpc-module/main.tf - THE ENTIRE MODULE IN ONE FILE
# Created by: someone on the team, a while ago
# TODO: clean this up

terraform {
required_version = ">= 1.0"
required_providers {
aws = {
  source = "hashicorp/aws"
  version = "~> 4.0"
}
}
}

variable "cidr" {}
variable "Name" {}
variable "env" {
  default = "dev"
}
variable "AZs" {
  type = list(string)
  default = ["us-east-1a","us-east-1b"]
}
variable "publicSubnets" {
  default = ["10.0.1.0/24","10.0.2.0/24"]
}
variable "private_subnets" {
  default = ["10.0.10.0/24","10.0.11.0/24"]
}
variable "enable_nat" {
  default = true
}
variable "tags" {
  default = {}
}

resource "aws_vpc" "vpc" {
cidr_block = var.cidr
enable_dns_hostnames = true
enable_dns_support = true
tags = merge(var.tags, {
Name = var.Name
Environment = var.env
})
}

resource "aws_internet_gateway" "igw" {
vpc_id = aws_vpc.vpc.id
tags = {
Name = "${var.Name}-igw"
}
}

resource "aws_subnet" "public" {
count = length(var.publicSubnets)
vpc_id = aws_vpc.vpc.id
cidr_block = var.publicSubnets[count.index]
availability_zone = var.AZs[count.index]
map_public_ip_on_launch = true
tags = {
"Name" = "${var.Name}-public-${count.index}"
}
}

resource "aws_subnet" "private" {
count = length(var.private_subnets)
vpc_id = aws_vpc.vpc.id
cidr_block = var.private_subnets[count.index]
availability_zone = var.AZs[count.index]
tags = {
"Name" = "${var.Name}-private-${count.index}"
}
}

resource "aws_eip" "nat" {
count = var.enable_nat ? 1 : 0
vpc = true
}

resource "aws_nat_gateway" "nat" {
count = var.enable_nat ? 1 : 0
allocation_id = aws_eip.nat[0].id
subnet_id = aws_subnet.public[0].id
tags = {
Name = "${var.Name}-nat"
}
}

resource "aws_route_table" "public" {
vpc_id = aws_vpc.vpc.id
route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.igw.id
}
tags = {
Name = "${var.Name}-public-rt"
}
}

resource "aws_route_table" "private" {
count = var.enable_nat ? 1 : 0
vpc_id = aws_vpc.vpc.id
route {
cidr_block = "0.0.0.0/0"
nat_gateway_id = aws_nat_gateway.nat[0].id
}
tags = {
Name = "${var.Name}-private-rt"
}
}

resource "aws_route_table_association" "public" {
count = length(var.publicSubnets)
subnet_id = aws_subnet.public[count.index].id
route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
count = var.enable_nat ? length(var.private_subnets) : 0
subnet_id = aws_subnet.private[count.index].id
route_table_id = aws_route_table.private[0].id
}

output "vpc_id" {
value = aws_vpc.vpc.id
}
output "public_subnets" {
value = aws_subnet.public[*].id
}
output "private_subnets" {
value = aws_subnet.private[*].id
}
```

### Identify the Problems

```text
Issue                           Severity    Style Guide Violation
──────────────────────────────────────────────────────────────────
No indentation / bad formatting HIGH        Terraform Style Guide: Formatting
Mixed naming (camelCase + snake) HIGH       Terraform Style Guide: Naming
No variable descriptions        HIGH        Terraform Style Guide: Variables
No variable validation          MEDIUM      Terraform Style Guide: Validation
Everything in one file          HIGH        Terraform Style Guide: File Layout
No type constraints on vars     MEDIUM      Terraform Style Guide: Variables
No output descriptions          MEDIUM      Terraform Style Guide: Outputs
No CONTRACT.md                  HIGH        CONTRACT.md Template
No metadata tags                MEDIUM      Metadata Schema
No tests                        HIGH        IaC Testing Standards
No CI/CD pipeline               MEDIUM      CI/CD Standards
Deprecated `vpc = true` on EIP  HIGH        Provider deprecation (use domain)
Hardcoded provider version ~>4  MEDIUM      Should use latest major
No versions.tf file             MEDIUM      Terraform Style Guide: File Layout
```

### Checkpoint 1

```bash
# Clone or create the legacy module to work with
mkdir -p terraform-aws-vpc
cd terraform-aws-vpc
git init

# Create the legacy main.tf (copy the code above)
# Verify the starting state
terraform fmt -check -diff .
# Expected: formatting differences reported (non-zero exit code)
echo $?
# Expected output: 3
```

---

## Step 2: Apply Formatting Standards (5 min)

### 2.1 Run terraform fmt

```bash
# Auto-format all .tf files
terraform fmt -recursive .

# Verify formatting is clean
terraform fmt -check -diff .
echo $?
# Expected output: 0
```

### 2.2 Split Into Standard File Layout

```hcl
# versions.tf - Provider and Terraform version constraints
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

```hcl
# variables.tf - All input variables with descriptions, types, and defaults
variable "vpc_name" {
  description = "Name prefix for all VPC resources"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC (e.g., 10.0.0.0/16)"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "availability_zones" {
  description = "List of availability zones for subnet distribution"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "enable_nat_gateway" {
  description = "Whether to create a NAT gateway for private subnet internet access"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

```hcl
# locals.tf - Computed values and common tags
locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "terraform-aws-vpc"
  })
}
```

```hcl
# main.tf - Resource definitions
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.vpc_name}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.vpc_name}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.vpc_name}-public-${var.availability_zones[count.index]}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.vpc_name}-private-${var.availability_zones[count.index]}"
    Tier = "private"
  })
}

resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? 1 : 0

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.vpc_name}-nat-eip"
  })
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? 1 : 0

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, {
    Name = "${var.vpc_name}-nat"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.vpc_name}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = var.enable_nat_gateway ? 1 : 0

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.vpc_name}-private-rt"
  })
}

resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = var.enable_nat_gateway ? length(var.private_subnet_cidrs) : 0

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}
```

```hcl
# outputs.tf - All outputs with descriptions
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_id" {
  description = "The ID of the NAT Gateway (null if disabled)"
  value       = var.enable_nat_gateway ? aws_nat_gateway.main[0].id : null
}

output "public_route_table_id" {
  description = "The ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "The ID of the private route table (null if NAT disabled)"
  value       = var.enable_nat_gateway ? aws_route_table.private[0].id : null
}

output "nat_gateway_public_ip" {
  description = "The public IP address of the NAT Gateway"
  value       = var.enable_nat_gateway ? aws_eip.nat[0].public_ip : null
}
```

### 2.3 Naming Changes Summary

```text
Before (inconsistent)        After (snake_case)
─────────────────────────────────────────────────
variable "cidr"              variable "vpc_cidr"
variable "Name"              variable "vpc_name"
variable "env"               variable "environment"
variable "AZs"               variable "availability_zones"
variable "publicSubnets"     variable "public_subnet_cidrs"
variable "private_subnets"   variable "private_subnet_cidrs"
variable "enable_nat"        variable "enable_nat_gateway"
resource "aws_vpc" "vpc"     resource "aws_vpc" "main"
resource "aws_igw" "igw"     resource "aws_internet_gateway" "main"
output "public_subnets"      output "public_subnet_ids"
output "private_subnets"     output "private_subnet_ids"
```

### Checkpoint 2

```bash
# Verify file structure
ls -1 *.tf
# Expected output:
# locals.tf
# main.tf
# outputs.tf
# variables.tf
# versions.tf

# Verify formatting
terraform fmt -check .
echo $?
# Expected output: 0

# Verify syntax validity
terraform validate
# Expected: Success! The configuration is valid.
```

---

## Step 3: Add Variable Validation (5 min)

Add validation blocks to `variables.tf` to catch misconfigurations before plan/apply.

### 3.1 CIDR Validation

```hcl
variable "vpc_cidr" {
  description = "CIDR block for the VPC (e.g., 10.0.0.0/16)"
  type        = string

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "The vpc_cidr must be a valid CIDR block (e.g., 10.0.0.0/16)."
  }

  validation {
    condition     = tonumber(split("/", var.vpc_cidr)[1]) >= 16 && tonumber(split("/", var.vpc_cidr)[1]) <= 24
    error_message = "The vpc_cidr prefix length must be between /16 and /24."
  }
}
```

### 3.2 Environment Validation

```hcl
variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production", "sandbox"], var.environment)
    error_message = "The environment must be one of: dev, staging, production, sandbox."
  }
}
```

### 3.3 Subnet and AZ Consistency Validation

```hcl
variable "availability_zones" {
  description = "List of availability zones for subnet distribution"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones are required for high availability."
  }

  validation {
    condition     = length(var.availability_zones) == length(distinct(var.availability_zones))
    error_message = "Availability zones must be unique (no duplicates)."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) >= 1
    error_message = "At least one public subnet CIDR is required."
  }

  validation {
    condition     = alltrue([for cidr in var.public_subnet_cidrs : can(cidrhost(cidr, 0))])
    error_message = "All public_subnet_cidrs must be valid CIDR blocks."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) >= 1
    error_message = "At least one private subnet CIDR is required."
  }

  validation {
    condition     = alltrue([for cidr in var.private_subnet_cidrs : can(cidrhost(cidr, 0))])
    error_message = "All private_subnet_cidrs must be valid CIDR blocks."
  }
}
```

### 3.4 Name Validation

```hcl
variable "vpc_name" {
  description = "Name prefix for all VPC resources"
  type        = string

  validation {
    condition     = length(var.vpc_name) >= 3 && length(var.vpc_name) <= 28
    error_message = "The vpc_name must be between 3 and 28 characters."
  }

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.vpc_name))
    error_message = "The vpc_name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens."
  }
}
```

### 3.5 Tags Validation

```hcl
variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}

  validation {
    condition     = alltrue([for k, v in var.tags : length(k) <= 128 && length(v) <= 256])
    error_message = "Tag keys must be <= 128 characters and values <= 256 characters (AWS limits)."
  }
}
```

### Checkpoint 3

```bash
# Test that invalid inputs are caught
cat > /tmp/test_invalid.tfvars <<'EOF'
vpc_cidr    = "not-a-cidr"
vpc_name    = "my-vpc"
environment = "dev"
EOF

terraform plan -var-file=/tmp/test_invalid.tfvars 2>&1 | head -5
# Expected: Error - The vpc_cidr must be a valid CIDR block

cat > /tmp/test_valid.tfvars <<'EOF'
vpc_cidr    = "10.0.0.0/16"
vpc_name    = "my-vpc"
environment = "dev"
EOF

terraform validate
# Expected: Success! The configuration is valid.
```

---

## Step 4: Write CONTRACT.md (10 min)

Create a `CONTRACT.md` at the module root with numbered guarantees that map directly to tests.

```markdown
# Module Contract: terraform-aws-vpc

> **Version**: 1.0.0
> **Last Updated**: 2026-02-14
> **Maintained by**: Platform Engineering Team
> **Status**: Active

## 1. Purpose

This module creates a production-ready AWS VPC with public and private subnets,
internet gateway, optional NAT gateway, and associated route tables. It provides
network isolation and internet connectivity for application workloads running
in AWS.

## 2. Guarantees

### Resource Guarantees

- **G1**: Creates exactly 1 VPC with DNS hostnames and DNS support enabled
- **G2**: Creates N public subnets distributed across at least 2 availability zones
- **G3**: Creates N private subnets distributed across at least 2 availability zones
- **G4**: Creates exactly 1 internet gateway attached to the VPC
- **G5**: When `enable_nat_gateway = true`, creates exactly 1 NAT gateway in the first public subnet
- **G6**: When `enable_nat_gateway = false`, creates no NAT gateway or EIP resources

### Behavior Guarantees

- **G7**: All resources are tagged with the common tag set (Environment, ManagedBy, Module)
- **G8**: Public subnets have `map_public_ip_on_launch = true`
- **G9**: Private subnets do NOT have `map_public_ip_on_launch` enabled
- **G10**: Public route table routes 0.0.0.0/0 through the internet gateway
- **G11**: Private route table (when NAT enabled) routes 0.0.0.0/0 through the NAT gateway
- **G12**: Module is idempotent - running apply twice produces no changes on second run

### Security Guarantees

- **G13**: No security groups with 0.0.0.0/0 ingress are created by this module
- **G14**: VPC flow logs are NOT enabled by default (consumer responsibility)

## 3. Inputs

| Variable               | Type         | Required | Default              | Validation                          |
|------------------------|--------------|----------|----------------------|-------------------------------------|
| `vpc_name`             | `string`     | Yes      | -                    | 3-28 chars, lowercase + hyphens     |
| `vpc_cidr`             | `string`     | Yes      | -                    | Valid CIDR, /16 to /24              |
| `environment`          | `string`     | No       | `"dev"`              | dev, staging, production, sandbox   |
| `availability_zones`   | `list(string)` | No    | `["us-east-1a","us-east-1b"]` | Min 2, unique                |
| `public_subnet_cidrs`  | `list(string)` | No    | `["10.0.1.0/24","10.0.2.0/24"]` | Valid CIDRs, min 1          |
| `private_subnet_cidrs` | `list(string)` | No    | `["10.0.10.0/24","10.0.11.0/24"]` | Valid CIDRs, min 1        |
| `enable_nat_gateway`   | `bool`       | No       | `true`               | -                                   |
| `tags`                 | `map(string)` | No      | `{}`                 | Key <= 128, value <= 256 chars      |

## 4. Outputs

| Output                   | Type         | Description                                    |
|--------------------------|--------------|------------------------------------------------|
| `vpc_id`                 | `string`     | The ID of the created VPC                      |
| `vpc_cidr_block`         | `string`     | The CIDR block of the VPC                      |
| `public_subnet_ids`      | `list(string)` | List of public subnet IDs                   |
| `private_subnet_ids`     | `list(string)` | List of private subnet IDs                  |
| `internet_gateway_id`    | `string`     | The ID of the internet gateway                 |
| `nat_gateway_id`         | `string`     | The NAT gateway ID (null if disabled)          |
| `public_route_table_id`  | `string`     | The public route table ID                      |
| `private_route_table_id` | `string`     | The private route table ID (null if disabled)  |
| `nat_gateway_public_ip`  | `string`     | The public IP of the NAT gateway               |

## 5. Platform Requirements

| Requirement        | Version      | Notes                               |
|--------------------|-------------|--------------------------------------|
| Terraform          | >= 1.6      | Required for validation blocks       |
| AWS Provider       | ~> 5.0      | Required for `domain` on EIP         |
| AWS Account        | Any         | Must have VPC creation permissions   |
| AWS Region         | Any         | Specified AZs must exist in region   |

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpc", "ec2:DeleteVpc", "ec2:DescribeVpcs", "ec2:ModifyVpcAttribute",
        "ec2:CreateSubnet", "ec2:DeleteSubnet", "ec2:DescribeSubnets",
        "ec2:CreateInternetGateway", "ec2:DeleteInternetGateway",
        "ec2:AttachInternetGateway", "ec2:DetachInternetGateway",
        "ec2:DescribeInternetGateways",
        "ec2:AllocateAddress", "ec2:ReleaseAddress", "ec2:DescribeAddresses",
        "ec2:CreateNatGateway", "ec2:DeleteNatGateway", "ec2:DescribeNatGateways",
        "ec2:CreateRouteTable", "ec2:DeleteRouteTable", "ec2:DescribeRouteTables",
        "ec2:CreateRoute", "ec2:DeleteRoute",
        "ec2:AssociateRouteTable", "ec2:DisassociateRouteTable",
        "ec2:CreateTags", "ec2:DeleteTags", "ec2:DescribeTags",
        "ec2:DescribeAvailabilityZones",
        "ec2:ModifySubnetAttribute"
      ],
      "Resource": "*"
    }
  ]
}
```

## 6. Side Effects and Cost Implications

### Side Effects

- Creates VPC, which counts against the regional VPC limit (default: 5)
- Allocates Elastic IP when NAT gateway is enabled
- Creates route table entries that affect network routing for all resources in the VPC

### Cost Implications

| Resource            | Estimated Cost (us-east-1)   | Condition              |
|---------------------|------------------------------|------------------------|
| VPC                 | Free                         | Always                 |
| Subnets             | Free                         | Always                 |
| Internet Gateway    | Free (data transfer charges) | Always                 |
| NAT Gateway         | ~$32/month + data transfer   | `enable_nat_gateway`   |
| Elastic IP          | Free (when attached to NAT)  | `enable_nat_gateway`   |

**Warning**: NAT Gateway costs approximately $32/month. Set `enable_nat_gateway = false` for
development environments where private subnet internet access is not required.

## 7. Idempotency Contract

- First `terraform apply`: Creates all resources
- Second `terraform apply`: No changes (0 added, 0 changed, 0 destroyed)
- `terraform destroy`: Removes all resources cleanly with no orphans

## 8. Testing Requirements

All guarantees must have corresponding test coverage:

| Test File          | Guarantees Tested       | Type        |
|--------------------|-------------------------|-------------|
| `vpc_test.go`      | G1, G2, G3, G4, G7, G8 | Integration |
| `vpc_test.go`      | G5, G6, G10, G11        | Integration |
| `vpc_test.go`      | G12                     | Idempotency |

## 9. Breaking Changes Policy

- Minor versions (1.x.0): New variables with defaults, new outputs
- Patch versions (1.0.x): Bug fixes, documentation updates
- Major versions (x.0.0): Renamed variables, removed outputs, changed defaults
- Deprecation notice: Minimum 1 minor version before removal

## 10. Known Limitations

- Single NAT gateway (not HA across AZs) - use `terraform-aws-vpc-ha` for multi-NAT
- No IPv6 support
- No VPC flow log configuration (consumer must add separately)
- No VPC endpoints included
- Subnet count must match AZ count

## 11. Support

- **Repository**: `github.com/your-org/terraform-aws-vpc`
- **Issues**: GitHub Issues
- **Slack**: `#platform-engineering`

## 12. Usage Examples

### Minimal

```hcl
module "vpc" {
  source   = "github.com/your-org/terraform-aws-vpc?ref=v1.0.0"
  vpc_name = "my-app"
  vpc_cidr = "10.0.0.0/16"
}
```

### Production

```hcl
module "vpc" {
  source   = "github.com/your-org/terraform-aws-vpc?ref=v1.0.0"
  vpc_name = "prod-platform"
  vpc_cidr = "10.100.0.0/16"

  environment        = "production"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  public_subnet_cidrs  = ["10.100.1.0/24", "10.100.2.0/24", "10.100.3.0/24"]
  private_subnet_cidrs = ["10.100.10.0/24", "10.100.11.0/24", "10.100.12.0/24"]

  enable_nat_gateway = true

  tags = {
    Team        = "platform-engineering"
    CostCenter  = "infrastructure"
    Compliance  = "soc2"
  }
}
```

### Development (No NAT, Cost Savings)

```hcl
module "vpc" {
  source   = "github.com/your-org/terraform-aws-vpc?ref=v1.0.0"
  vpc_name = "dev-sandbox"
  vpc_cidr = "10.200.0.0/16"

  environment        = "dev"
  enable_nat_gateway = false

  tags = {
    Team = "development"
  }
}
```

## 13. Test Mapping

| Guarantee | Test Function                          | Test File      |
|-----------|----------------------------------------|----------------|
| G1        | `TestVpcCreation`                      | `vpc_test.go`  |
| G2        | `TestPublicSubnetsAcrossAZs`          | `vpc_test.go`  |
| G3        | `TestPrivateSubnetsAcrossAZs`         | `vpc_test.go`  |
| G4        | `TestInternetGatewayAttached`         | `vpc_test.go`  |
| G5        | `TestNatGatewayCreatedWhenEnabled`    | `vpc_test.go`  |
| G6        | `TestNatGatewaySkippedWhenDisabled`   | `vpc_test.go`  |
| G7        | `TestCommonTagsApplied`              | `vpc_test.go`  |
| G8        | `TestPublicSubnetsAutoAssignIP`      | `vpc_test.go`  |
| G9        | `TestPrivateSubnetsNoAutoAssignIP`   | `vpc_test.go`  |
| G10       | `TestPublicRouteTableDefaultRoute`   | `vpc_test.go`  |
| G11       | `TestPrivateRouteTableNatRoute`      | `vpc_test.go`  |
| G12       | `TestIdempotency`                    | `vpc_test.go`  |
| G13       | (Verified by code review)            | N/A            |
| G14       | (Verified by code review)            | N/A            |

### Checkpoint 4

```bash
# Verify CONTRACT.md exists and has all sections
grep -c "^## " CONTRACT.md
# Expected output: 13

# Verify all guarantees are numbered
grep -c "^\- \*\*G[0-9]" CONTRACT.md
# Expected output: 14

# Verify test mapping table is complete
grep -c "G[0-9]" CONTRACT.md | head -1
# Expected: multiple references per guarantee
```

---

## Step 5: Add Metadata (3 min)

Add `@module` metadata comments to each `.tf` file following the Dukes Engineering Style Guide metadata schema.

### 5.1 Metadata for main.tf

```hcl
# @module terraform_aws_vpc
# @description Production-ready AWS VPC module with public/private subnets,
#   internet gateway, optional NAT gateway, and route tables
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2026-02-14
# @status stable

resource "aws_vpc" "main" {
  # ... (existing resource definitions follow)
```

### 5.2 Metadata for variables.tf

```hcl
# @module terraform_aws_vpc_variables
# @description Input variable definitions for the AWS VPC module
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2026-02-14
# @status stable

variable "vpc_name" {
  # ... (existing variable definitions follow)
```

### 5.3 Metadata for outputs.tf

```hcl
# @module terraform_aws_vpc_outputs
# @description Output definitions for the AWS VPC module
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2026-02-14
# @status stable

output "vpc_id" {
  # ... (existing output definitions follow)
```

### 5.4 Metadata for versions.tf

```hcl
# @module terraform_aws_vpc_versions
# @description Provider and Terraform version constraints for the AWS VPC module
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2026-02-14
# @status stable

terraform {
  # ... (existing version constraints follow)
```

### 5.5 Metadata for locals.tf

```hcl
# @module terraform_aws_vpc_locals
# @description Local values and computed tags for the AWS VPC module
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2026-02-14
# @status stable

locals {
  # ... (existing locals follow)
```

### Checkpoint 5

```bash
# Validate metadata across all .tf files
python scripts/validate_metadata.py .

# Expected output:
# Validating metadata in .
# ✅ main.tf: Valid metadata found
# ✅ variables.tf: Valid metadata found
# ✅ outputs.tf: Valid metadata found
# ✅ versions.tf: Valid metadata found
# ✅ locals.tf: Valid metadata found
# Summary: 5 files validated, 0 errors
```

---

## Step 6: Write Terratest Tests (10 min)

Create a Go test file that validates each guarantee from the CONTRACT.md.

### 6.1 Test Fixture

```hcl
# test/fixtures/main.tf - Test fixture that invokes the module
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source = "../../"

  vpc_name    = "test-vpc"
  vpc_cidr    = "10.0.0.0/16"
  environment = "dev"

  availability_zones   = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

  enable_nat_gateway = true

  tags = {
    TestRun = "terratest"
  }
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  value = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "internet_gateway_id" {
  value = module.vpc.internet_gateway_id
}

output "nat_gateway_id" {
  value = module.vpc.nat_gateway_id
}

output "public_route_table_id" {
  value = module.vpc.public_route_table_id
}

output "private_route_table_id" {
  value = module.vpc.private_route_table_id
}

output "nat_gateway_public_ip" {
  value = module.vpc.nat_gateway_public_ip
}
```

### 6.2 Test Fixture Without NAT

```hcl
# test/fixtures-no-nat/main.tf - Test fixture with NAT disabled
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source = "../../"

  vpc_name    = "test-no-nat"
  vpc_cidr    = "10.1.0.0/16"
  environment = "dev"

  availability_zones   = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]

  enable_nat_gateway = false

  tags = {
    TestRun = "terratest"
  }
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "nat_gateway_id" {
  value = module.vpc.nat_gateway_id
}

output "private_route_table_id" {
  value = module.vpc.private_route_table_id
}
```

### 6.3 Go Module Setup

```bash
# Initialize Go module for tests
cd test
go mod init github.com/your-org/terraform-aws-vpc/test

# Add terratest dependency
go get github.com/gruntwork-io/terratest/modules/terraform
go get github.com/gruntwork-io/terratest/modules/aws
go get github.com/stretchr/testify/assert
go get github.com/stretchr/testify/require
```

```json
// test/go.mod (generated, shown for reference)
{
  "module": "github.com/your-org/terraform-aws-vpc/test",
  "go": "1.21",
  "require": {
    "github.com/gruntwork-io/terratest": "v0.47.2",
    "github.com/stretchr/testify": "v1.9.0"
  }
}
```

### 6.4 Complete Test File

```go
// test/vpc_test.go
package test

import (
 "fmt"
 "testing"

 "github.com/gruntwork-io/terratest/modules/aws"
 "github.com/gruntwork-io/terratest/modules/terraform"
 "github.com/stretchr/testify/assert"
 "github.com/stretchr/testify/require"
)

// ============================================================================
// Test: G1 - Creates exactly 1 VPC with DNS hostnames and DNS support enabled
// ============================================================================

func TestVpcCreation(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures",
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 require.NotEmpty(t, vpcID, "G1: VPC ID must not be empty")

 vpc := aws.GetVpcById(t, vpcID, "us-east-1")
 assert.True(t, vpc.EnableDnsHostnames, "G1: DNS hostnames must be enabled")
 assert.True(t, vpc.EnableDnsSupport, "G1: DNS support must be enabled")

 cidr := terraform.Output(t, terraformOptions, "vpc_cidr_block")
 assert.Equal(t, "10.0.0.0/16", cidr, "G1: VPC CIDR must match input")
}

// ============================================================================
// Test: G2 - Creates N public subnets across at least 2 AZs
// ============================================================================

func TestPublicSubnetsAcrossAZs(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures",
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
 assert.Equal(t, 2, len(publicSubnetIDs), "G2: Must create 2 public subnets")

 // Verify subnets are in different AZs
 azSet := make(map[string]bool)
 for _, subnetID := range publicSubnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, "us-east-1")
  azSet[subnet.AvailabilityZone] = true
 }
 assert.GreaterOrEqual(t, len(azSet), 2, "G2: Public subnets must span at least 2 AZs")
}

// ============================================================================
// Test: G3 - Creates N private subnets across at least 2 AZs
// ============================================================================

func TestPrivateSubnetsAcrossAZs(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures",
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
 assert.Equal(t, 2, len(privateSubnetIDs), "G3: Must create 2 private subnets")

 azSet := make(map[string]bool)
 for _, subnetID := range privateSubnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, "us-east-1")
  azSet[subnet.AvailabilityZone] = true
 }
 assert.GreaterOrEqual(t, len(azSet), 2, "G3: Private subnets must span at least 2 AZs")
}

// ============================================================================
// Test: G4 - Creates exactly 1 internet gateway attached to the VPC
// ============================================================================

func TestInternetGatewayAttached(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures",
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 igwID := terraform.Output(t, terraformOptions, "internet_gateway_id")
 require.NotEmpty(t, igwID, "G4: Internet gateway ID must not be empty")

 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 igws := aws.GetInternetGatewayById(t, igwID, "us-east-1")
 assert.Equal(t, vpcID, igws.VpcId, "G4: Internet gateway must be attached to the VPC")
}

// ============================================================================
// Test: G5 - NAT gateway created when enable_nat_gateway = true
// ============================================================================

func TestNatGatewayCreatedWhenEnabled(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures",
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 natGatewayID := terraform.Output(t, terraformOptions, "nat_gateway_id")
 require.NotEmpty(t, natGatewayID, "G5: NAT gateway ID must not be empty when enabled")

 publicIP := terraform.Output(t, terraformOptions, "nat_gateway_public_ip")
 assert.NotEmpty(t, publicIP, "G5: NAT gateway must have a public IP")
}

// ============================================================================
// Test: G6 - No NAT gateway when enable_nat_gateway = false
// ============================================================================

func TestNatGatewaySkippedWhenDisabled(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures-no-nat",
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 natGatewayID := terraform.Output(t, terraformOptions, "nat_gateway_id")
 assert.Empty(t, natGatewayID, "G6: NAT gateway must not be created when disabled")

 privateRTID := terraform.Output(t, terraformOptions, "private_route_table_id")
 assert.Empty(t, privateRTID, "G6: Private route table must not be created when NAT disabled")
}

// ============================================================================
// Test: G7 - All resources tagged with common tag set
// ============================================================================

func TestCommonTagsApplied(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures",
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 vpc := aws.GetVpcById(t, vpcID, "us-east-1")

 assert.Equal(t, "dev", vpc.Tags["Environment"], "G7: Environment tag must be set")
 assert.Equal(t, "terraform", vpc.Tags["ManagedBy"], "G7: ManagedBy tag must be set")
 assert.Equal(t, "terraform-aws-vpc", vpc.Tags["Module"], "G7: Module tag must be set")
 assert.Equal(t, "terratest", vpc.Tags["TestRun"], "G7: Custom tags must be merged")
}

// ============================================================================
// Test: G8 - Public subnets auto-assign public IPs
// ============================================================================

func TestPublicSubnetsAutoAssignIP(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures",
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
 for _, subnetID := range publicSubnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, "us-east-1")
  assert.True(t, subnet.MapPublicIpOnLaunch,
   fmt.Sprintf("G8: Public subnet %s must auto-assign public IPs", subnetID))
 }
}

// ============================================================================
// Test: G12 - Idempotency - second apply produces no changes
// ============================================================================

func TestIdempotency(t *testing.T) {
 t.Parallel()

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "./fixtures",
 })

 defer terraform.Destroy(t, terraformOptions)

 // First apply
 terraform.InitAndApply(t, terraformOptions)

 // Second apply - should produce no changes
 planOutput := terraform.Plan(t, terraformOptions)
 assert.Contains(t, planOutput, "No changes",
  "G12: Second apply must produce no changes (idempotency)")
}
```

### 6.5 Test Helper for Parallel Test Suites

```go
// test/helpers_test.go
package test

import (
 "fmt"
 "math/rand"
 "strings"
 "time"
)

// uniqueID generates a unique suffix for test resource names to avoid conflicts
// when running tests in parallel
func uniqueID() string {
 r := rand.New(rand.NewSource(time.Now().UnixNano()))
 return fmt.Sprintf("%06d", r.Intn(999999))
}

// formatTestName creates a descriptive test name with guarantee reference
func formatTestName(guarantee string, description string) string {
 return fmt.Sprintf("[%s] %s", guarantee, description)
}

// assertTagsContain verifies that a tag map contains all expected key-value pairs
func assertTagsContain(tags map[string]string, expected map[string]string) []string {
 var missing []string
 for k, v := range expected {
  actual, ok := tags[k]
  if !ok {
   missing = append(missing, fmt.Sprintf("missing tag key: %s", k))
  } else if actual != v {
   missing = append(missing, fmt.Sprintf("tag %s: expected %q, got %q", k, v, actual))
  }
 }
 return missing
}

// containsSubstring checks if any string in a slice contains the given substring
func containsSubstring(slice []string, substr string) bool {
 for _, s := range slice {
  if strings.Contains(s, substr) {
   return true
  }
 }
 return false
}
```

### Checkpoint 6

```bash
# Verify test file structure
tree test/
# Expected output:
# test/
# ├── fixtures/
# │   └── main.tf
# ├── fixtures-no-nat/
# │   └── main.tf
# ├── go.mod
# ├── go.sum
# ├── helpers_test.go
# └── vpc_test.go

# Verify Go compilation (does not run tests)
cd test && go vet ./...
# Expected: no errors

# Run the tests (requires AWS credentials)
cd test && go test -v -timeout 30m -run TestVpcCreation
# Expected: PASS
```

---

## Step 7: Set Up CI/CD (5 min)

Create a GitHub Actions workflow that runs formatting checks, validation, planning, and tests on every pull request.

### 7.1 CI Workflow

```yaml
# .github/workflows/ci.yml
name: Terraform Module CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

env:
  TF_VERSION: "1.9.0"
  GO_VERSION: "1.21"

jobs:
  # ──────────────────────────────────────────────────────────────
  # Stage 1: Format and Validate
  # ──────────────────────────────────────────────────────────────
  format-and-validate:
    name: Format & Validate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Format Check
        run: terraform fmt -check -recursive -diff

      - name: Terraform Init
        run: terraform init -backend=false

      - name: Terraform Validate
        run: terraform validate

  # ──────────────────────────────────────────────────────────────
  # Stage 2: Security Scanning
  # ──────────────────────────────────────────────────────────────
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: .
          soft_fail: false

      - name: Run checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: .
          framework: terraform
          quiet: true

  # ──────────────────────────────────────────────────────────────
  # Stage 3: Terraform Plan
  # ──────────────────────────────────────────────────────────────
  plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    needs: [format-and-validate]
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Terraform Init
        run: |
          cd test/fixtures
          terraform init

      - name: Terraform Plan
        run: |
          cd test/fixtures
          terraform plan -no-color -input=false
        continue-on-error: true

  # ──────────────────────────────────────────────────────────────
  # Stage 4: Integration Tests
  # ──────────────────────────────────────────────────────────────
  test:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [format-and-validate, security]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
          terraform_wrapper: false

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache-dependency-path: test/go.sum

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Run Terratest
        working-directory: test
        run: |
          go mod download
          go test -v -timeout 30m -count=1 ./...
        env:
          AWS_DEFAULT_REGION: us-east-1

  # ──────────────────────────────────────────────────────────────
  # Stage 5: Documentation
  # ──────────────────────────────────────────────────────────────
  docs:
    name: Generate Docs
    runs-on: ubuntu-latest
    needs: [format-and-validate]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}

      - name: Generate terraform-docs
        uses: terraform-docs/gh-actions@v1
        with:
          working-dir: .
          output-file: README.md
          output-method: inject
          git-push: "true"
```

### 7.2 Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-tf
    rev: v1.96.1
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
        args:
          - --args=--config=.terraform-docs.yml
      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
      - id: detect-private-key
```

### 7.3 terraform-docs Configuration

```yaml
# .terraform-docs.yml
formatter: markdown table

header-from: doc-header.md

sections:
  show:
    - header
    - requirements
    - providers
    - inputs
    - outputs
    - resources

content: ""

output:
  file: README.md
  mode: inject
  template: |-
    <!-- BEGIN_TF_DOCS -->
    {{ .Content }}
    <!-- END_TF_DOCS -->

sort:
  enabled: true
  by: required
```

### Checkpoint 7

```bash
# Verify workflow file is valid YAML
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "Valid YAML"
# Expected: Valid YAML

# Verify pre-commit config
pre-commit validate-config
# Expected: no errors

# Run pre-commit hooks locally
pre-commit run --all-files
# Expected: all checks pass

# Dry-run the CI pipeline stages locally
terraform fmt -check -recursive -diff
terraform init -backend=false
terraform validate
# Expected: all pass
```

---

## Step 8: Publish to Registry (2 min)

### 8.1 Tag and Release

```bash
# Ensure you are on main with all changes committed
git checkout main
git pull origin main

# Create a semantic version tag
git tag -a v1.0.0 -m "feat: initial release of terraform-aws-vpc module

Compliant with Dukes Engineering Style Guide:
- Full CONTRACT.md with 14 guarantees
- Terratest coverage for G1-G12
- Variable validation for all inputs
- Metadata tags on all .tf files
- CI/CD pipeline with format, validate, security, and test stages"

# Push the tag
git push origin v1.0.0
```

### 8.2 Module Source References

```hcl
# Reference by Git tag (recommended)
module "vpc" {
  source = "git::https://github.com/your-org/terraform-aws-vpc.git?ref=v1.0.0"

  vpc_name = "my-app"
  vpc_cidr = "10.0.0.0/16"
}
```

```hcl
# Reference from Terraform Registry (if published)
module "vpc" {
  source  = "your-org/vpc/aws"
  version = "1.0.0"

  vpc_name = "my-app"
  vpc_cidr = "10.0.0.0/16"
}
```

### 8.3 Registry Naming Convention

```text
Terraform Registry Module Naming Convention
════════════════════════════════════════════
Repository name:   terraform-{provider}-{name}
Example:           terraform-aws-vpc

Required files:
  ├── main.tf          (required)
  ├── variables.tf     (required)
  ├── outputs.tf       (required)
  ├── versions.tf      (recommended)
  ├── README.md        (required - auto-generated by terraform-docs)
  ├── CONTRACT.md      (required by Dukes Style Guide)
  ├── LICENSE           (required)
  └── examples/
      └── complete/
          └── main.tf  (recommended)
```

---

## Checkpoint: Final Verification

Run through this checklist to confirm full compliance.

```bash
# 1. File structure
echo "=== File Structure ==="
find . -name "*.tf" -o -name "*.go" -o -name "*.md" -o -name "*.yml" | \
  grep -v ".terraform" | sort

# Expected:
# ./.github/workflows/ci.yml
# ./.pre-commit-config.yaml
# ./.terraform-docs.yml
# ./CONTRACT.md
# ./locals.tf
# ./main.tf
# ./outputs.tf
# ./test/fixtures-no-nat/main.tf
# ./test/fixtures/main.tf
# ./test/helpers_test.go
# ./test/vpc_test.go
# ./variables.tf
# ./versions.tf
```

```bash
# 2. Formatting
echo "=== Formatting ==="
terraform fmt -check -recursive .
echo "Format check exit code: $?"
# Expected: 0
```

```bash
# 3. Validation
echo "=== Validation ==="
terraform init -backend=false
terraform validate
# Expected: Success! The configuration is valid.
```

```bash
# 4. Metadata
echo "=== Metadata ==="
for f in main.tf variables.tf outputs.tf versions.tf locals.tf; do
  if grep -q "@module" "$f"; then
    echo "✅ $f has metadata"
  else
    echo "❌ $f missing metadata"
  fi
done
# Expected: all ✅
```

```bash
# 5. CONTRACT.md guarantees
echo "=== CONTRACT.md ==="
echo "Guarantees defined: $(grep -c '^\- \*\*G[0-9]' CONTRACT.md)"
echo "Sections: $(grep -c '^## ' CONTRACT.md)"
# Expected: 14 guarantees, 13 sections
```

```bash
# 6. Test coverage
echo "=== Test Coverage ==="
grep -c "^func Test" test/vpc_test.go
# Expected: 8 test functions

echo "Guarantees covered by tests:"
grep -oP 'G\d+' test/vpc_test.go | sort -u
# Expected: G1, G2, G3, G4, G5, G6, G7, G8, G12
```

```bash
# 7. Variable validation
echo "=== Variable Validation ==="
grep -c "validation {" variables.tf
# Expected: 10 validation blocks
```

```text
Final Compliance Checklist
══════════════════════════
[x] terraform fmt passes with no changes
[x] All files follow standard layout (main.tf, variables.tf, outputs.tf, versions.tf, locals.tf)
[x] All variables have descriptions and types
[x] All variables have validation blocks where applicable
[x] All outputs have descriptions
[x] All resources use snake_case naming
[x] All resources tagged with common tags via locals
[x] CONTRACT.md exists with numbered guarantees
[x] @module metadata on all .tf files
[x] Terratest tests cover all testable guarantees
[x] CI/CD workflow covers format, validate, security, test, and docs
[x] Pre-commit hooks configured
[x] Semantic version tag created
[x] No hardcoded values (uses variables with validation)
[x] Deprecated resource arguments updated (vpc = true -> domain = "vpc")
```

---

## Common Troubleshooting

### Problem: terraform fmt reports changes after manual editing

```bash
# Symptom
terraform fmt -check .
# Exit code 3, shows diff

# Cause: Editor inserted tabs instead of spaces, or misaligned = signs

# Solution: Run terraform fmt to auto-fix
terraform fmt -recursive .

# Prevention: Configure your editor
# VS Code: settings.json
# "editor.formatOnSave": true,
# "[terraform]": { "editor.defaultFormatter": "hashicorp.terraform" }
```

### Problem: terraform validate fails with provider errors

```bash
# Symptom
terraform validate
# Error: Missing required provider

# Cause: Running validate without init, or wrong provider version

# Solution: Initialize without backend first
terraform init -backend=false
terraform validate

# If provider version conflict:
rm -rf .terraform .terraform.lock.hcl
terraform init -backend=false
```

### Problem: Terratest times out during apply

```bash
# Symptom
go test -v -timeout 10m ./...
# panic: test timed out after 10m

# Cause: NAT gateway creation takes 2-5 minutes, total test > 10 min

# Solution: Increase timeout
go test -v -timeout 30m ./...

# For CI, set in workflow:
# run: go test -v -timeout 30m -count=1 ./...
```

### Problem: Validation blocks reject valid input

```hcl
# Symptom
# Error: The vpc_cidr prefix length must be between /16 and /24.
# Input: "10.0.0.0/8"

# Cause: Validation rule restricts to /16-/24 range for safety

# Solution: If /8 is intentional, update the validation rule in variables.tf
variable "vpc_cidr" {
  # ...
  validation {
    condition     = tonumber(split("/", var.vpc_cidr)[1]) >= 8 && tonumber(split("/", var.vpc_cidr)[1]) <= 24
    error_message = "The vpc_cidr prefix length must be between /8 and /24."
  }
}
```

### Problem: Tests fail with "no default VPC" or credential errors

```bash
# Symptom
TestVpcCreation 2026/02/14 10:00:00 retry.go:91:
# error: NoCredentialProviders

# Cause: AWS credentials not configured for test environment

# Solution: Set AWS credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-east-1"

# Or use AWS SSO
aws sso login --profile your-profile
export AWS_PROFILE="your-profile"

# Verify credentials
aws sts get-caller-identity
```

### Problem: Pre-commit terraform_docs hook fails

```bash
# Symptom
terraform_docs..........................................................Failed
# Error: Could not find .terraform-docs.yml

# Cause: Missing terraform-docs config file

# Solution: Create .terraform-docs.yml at repository root
# (See Step 7.3 for the configuration)

# Verify
terraform-docs markdown table --config .terraform-docs.yml .
```

### Problem: CONTRACT.md guarantee numbers are not sequential

```bash
# Symptom: G1, G2, G4, G5 (missing G3)

# Cause: Guarantee was removed without renumbering

# Solution: Always renumber sequentially, and update test mapping
# Use grep to find all references:
grep -rn "G3" . --include="*.go" --include="*.md"
# Update all references to maintain sequential numbering
```

---

## Next Steps

After completing this tutorial, you have a fully compliant Terraform module. Here are recommended next steps:

```text
Recommended Path
════════════════
1. Add VPC Flow Logs           → Extend the module with optional flow log support
2. Multi-NAT HA                → Create a high-availability variant with per-AZ NAT gateways
3. VPC Endpoints               → Add optional S3 and DynamoDB gateway endpoints
4. Tutorial 3: Full-Stack App  → Build on this VPC module in a complete application stack
5. Team Onboarding             → Use Tutorial 4 to onboard your team to the style guide
```

```text
Related Style Guide References
══════════════════════════════
- Terraform Style Guide        → docs/02_language_guides/terraform.md
- CONTRACT.md Template         → docs/04_templates/contract_template.md
- IaC Testing Standards        → docs/05_ci_cd/iac_testing.md
- Metadata Schema              → docs/03_metadata_schema/
- CI/CD Standards              → docs/05_ci_cd/
```
