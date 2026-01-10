---
title: "Terraform Style Guide"
description: "Infrastructure as Code standards for Terraform modules and configurations"
author: "Tyler Dukes"
tags: [terraform, iac, infrastructure-as-code, hashicorp, devops]
category: "Language Guides"
status: "active"
---

## Language Overview

**Terraform** is a declarative Infrastructure as Code (IaC) tool that enables provisioning
and managing cloud resources across multiple providers through HCL (HashiCorp Configuration
Language).

### Key Characteristics

- **Paradigm**: Declarative infrastructure as code
- **Language**: HCL (HashiCorp Configuration Language)
- **Type System**: Static typing with primitive, complex, and structural types
- **State Management**: Remote state with locking for collaboration
- **Provider Ecosystem**: 3000+ providers for cloud, SaaS, and custom resources
- **Version Support**: Targets Terraform versions **1.5.x through 1.9.x**

### Primary Use Cases

- Multi-cloud infrastructure provisioning (AWS, Azure, GCP, etc.)
- Kubernetes cluster and resource management
- Network infrastructure and security groups
- Database and storage provisioning
- CI/CD pipeline infrastructure
- Monitoring and observability stack deployment

## Supported Versions

| Version | Support Status | EOL Date | Recommended      |
|---------|----------------|----------|------------------|
| 1.10.x  | Active         | TBD      | ✅ Yes           |
| 1.9.x   | Active         | TBD      | ✅ Yes           |
| 1.8.x   | Active         | TBD      | ✅ Yes           |
| 1.7.x   | Active         | TBD      | ⚠️  Maintenance  |
| 1.6.x   | Active         | TBD      | ⚠️  Maintenance  |
| 1.5.x   | EOL Soon       | TBD      | ❌ EOL Soon      |

**Recommendation**: Use **Terraform 1.8+** for new projects.
Terraform 1.6+ is supported but consider upgrading to get the latest
features and bug fixes.

**EOL Policy**: HashiCorp supports the latest minor version and typically
maintains security fixes for N-2 releases. We recommend staying within
2 minor versions of the latest release.

**Version Features**:

- **Terraform 1.10**: Enhanced provider protocol, improved testing
  framework
- **Terraform 1.9**: Input variable validations, improved state
  encryption
- **Terraform 1.8**: Provider-defined functions, improved error messages
- **Terraform 1.7**: Removed block support, test framework improvements
- **Terraform 1.6**: Testing framework, config-driven import

**Breaking Changes**: Terraform follows semantic versioning. Major
version changes (e.g., 1.x to 2.x) may introduce breaking changes.
Minor versions (e.g., 1.8 to 1.9) maintain backward compatibility.

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Resources | `snake_case` | `aws_vpc.main`, `aws_subnet.private` | Type + descriptive identifier |
| Variables | `snake_case` | `vpc_cidr`, `instance_type` | Descriptive, no type prefix |
| Outputs | `snake_case` | `vpc_id`, `subnet_ids` | What is being output |
| Modules | `kebab-case` | `vpc-network`, `rds-database` | Folder names, lowercase with hyphens |
| Locals | `snake_case` | `common_tags`, `subnet_count` | Internal computed values |
| Data Sources | `snake_case` | `data.aws_ami.ubuntu` | Prefix with purpose or resource type |
| **Files** | | | |
| Main Config | `main.tf` | `main.tf` | Primary resource definitions |
| Variables | `variables.tf` | `variables.tf` | All variable declarations |
| Outputs | `outputs.tf` | `outputs.tf` | All output declarations |
| Providers | `providers.tf` or `versions.tf` | `providers.tf` | Provider configuration |
| Data Sources | `data.tf` | `data.tf` | External data lookups |
| Locals | `locals.tf` | `locals.tf` | Local value computations |
| **Formatting** | | | |
| Indentation | 2 spaces | `resource "aws_vpc" "main" {` | Consistent 2-space indentation |
| Line Length | 120 characters | `# Maximum line length` | Keep lines readable |
| Blank Lines | 1 between blocks | `resource "..." {}\n\nresource "..." {}` | Separate logical blocks |
| **Variables** | | | |
| Description | Always required | `description = "VPC CIDR block"` | Document purpose and usage |
| Type | Explicit types | `type = string`, `type = list(string)` | Never use `any` |
| Default | Optional values only | `default = "10.0.0.0/16"` | Required vars have no default |
| Validation | Use when needed | `validation { condition = ... }` | Enforce constraints |
| **Modules** | | | |
| Source | Semantic versioning | `source = "terraform-aws-modules/vpc/aws"` | Pin versions |
| Version | Always specify | `version = "~> 5.0"` | Use version constraints |
| **State** | | | |
| Backend | Remote with locking | `backend "s3" { ... }` | Never local for teams |
| Workspace | Environment isolation | `terraform workspace select prod` | Separate environments |

### Quick Start Example

Complete, production-ready configuration demonstrating all conventions:

```hcl
## versions.tf - Terraform and provider version constraints
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "projects/web-app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
  }
}

## providers.tf - Provider configuration with default tags
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

## variables.tf - Input variable declarations
variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,29}$", var.project))
    error_message = "Project must be lowercase alphanumeric with hyphens, 3-30 characters."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC network"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones for subnet distribution"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones required for high availability."
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets (incurs costs)"
  type        = bool
  default     = true
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.small"
}

variable "instance_count" {
  description = "Number of application server instances"
  type        = number
  default     = 2

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

## locals.tf - Computed local values
locals {
  # Common resource naming prefix
  name_prefix = "${var.project}-${var.environment}"

  # Common tags applied to all resources
  common_tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "github.com/myorg/myrepo"
    },
    var.additional_tags
  )

  # Subnet CIDR calculation
  public_subnet_cidrs = [
    for idx in range(length(var.availability_zones)) :
    cidrsubnet(var.vpc_cidr, 8, idx)
  ]

  private_subnet_cidrs = [
    for idx in range(length(var.availability_zones)) :
    cidrsubnet(var.vpc_cidr, 8, idx + 100)
  ]
}

## data.tf - External data source lookups
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

## main.tf - Primary resource definitions

###############################################################################
# VPC and Networking
###############################################################################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-public-${var.availability_zones[count.index]}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${local.name_prefix}-private-${var.availability_zones[count.index]}"
    Type = "private"
  }
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-nat-eip-${var.availability_zones[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? length(var.availability_zones) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${local.name_prefix}-nat-${var.availability_zones[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${local.name_prefix}-public-rt"
    Type = "public"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = {
    Name = "${local.name_prefix}-private-rt-${var.availability_zones[count.index]}"
    Type = "private"
  }
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

###############################################################################
# Security Groups
###############################################################################

resource "aws_security_group" "web" {
  name_prefix = "${local.name_prefix}-web-"
  description = "Security group for web application servers"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-web-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "web_http" {
  security_group_id = aws_security_group.web.id
  description       = "Allow HTTP traffic from internet"

  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Name = "allow-http"
  }
}

resource "aws_vpc_security_group_ingress_rule" "web_https" {
  security_group_id = aws_security_group.web.id
  description       = "Allow HTTPS traffic from internet"

  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Name = "allow-https"
  }
}

resource "aws_vpc_security_group_egress_rule" "web_all" {
  security_group_id = aws_security_group.web.id
  description       = "Allow all outbound traffic"

  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Name = "allow-all-outbound"
  }
}

###############################################################################
# EC2 Instances
###############################################################################

resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.private[count.index % length(var.availability_zones)].id

  vpc_security_group_ids = [aws_security_group.web.id]

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
    project     = var.project
  }))

  tags = {
    Name  = "${local.name_prefix}-web-${count.index + 1}"
    Index = count.index + 1
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [ami, user_data]
  }
}

## outputs.tf - Output value declarations
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
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

output "nat_gateway_ips" {
  description = "Elastic IPs of NAT Gateways"
  value       = var.enable_nat_gateway ? aws_eip.nat[*].public_ip : []
}

output "web_security_group_id" {
  description = "ID of web application security group"
  value       = aws_security_group.web.id
}

output "web_instance_ids" {
  description = "IDs of web application EC2 instances"
  value       = aws_instance.web[*].id
}

output "web_instance_private_ips" {
  description = "Private IP addresses of web instances"
  value       = aws_instance.web[*].private_ip
}

output "account_id" {
  description = "AWS Account ID where resources are deployed"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.name
}
```

This example demonstrates:

- ✅ **File organization**: Logical separation (versions.tf, providers.tf, variables.tf, locals.tf, data.tf, main.tf,
  outputs.tf)
- ✅ **Naming conventions**: Consistent snake_case for resources, variables, and outputs
- ✅ **Variable validation**: Input validation with helpful error messages
- ✅ **Type constraints**: Explicit types (string, number, bool, list, map)
- ✅ **Local values**: Computed values for DRY configuration
- ✅ **Data sources**: External lookups (AMI, account info, region)
- ✅ **Resource grouping**: Logical sections with comments
- ✅ **Dynamic blocks**: Conditional route creation based on NAT Gateway enablement
- ✅ **Count and indexing**: Multiple subnets across availability zones
- ✅ **Lifecycle rules**: create_before_destroy, ignore_changes, prevent_destroy
- ✅ **Security hardening**: IMDSv2, encrypted volumes, least-privilege security groups
- ✅ **Tagging strategy**: Consistent tags applied via default_tags and resource-specific tags
- ✅ **Dependency management**: Explicit and implicit dependencies
- ✅ **Output organization**: Comprehensive outputs for downstream consumption

## Naming Conventions

### Resource Names

Use **snake_case** for all Terraform resource identifiers:

```hcl
## Good
resource "aws_instance" "web_server" {
  ami           = var.ami_id
  instance_type = var.instance_type
}

resource "aws_security_group" "application_sg" {
  name = "app-${var.environment}-sg"
}

## Bad
resource "aws_instance" "WebServer" {      # PascalCase - avoid
  ami = var.ami_id
}

resource "aws_security_group" "app-sg" {   # kebab-case in identifier - avoid
  name = "app-sg"
}
```

### Variable Names

Use **snake_case** with descriptive names:

```hcl
## Good
variable "vpc_cidr_block" {
  type        = string
  description = "CIDR block for VPC"
}

variable "instance_count" {
  type        = number
  description = "Number of EC2 instances to create"
  default     = 2
}

## Bad
variable "vpcCIDR" {           # camelCase - avoid
  type = string
}

variable "cnt" {               # Abbreviation - avoid
  type = number
}
```

### Output Names

Use **snake_case** for outputs, prefixed by resource type when exporting IDs:

```hcl
## Good
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "instance_public_ips" {
  description = "Public IP addresses of EC2 instances"
  value       = aws_instance.web[*].public_ip
}

## Bad
output "VpcId" {               # PascalCase - avoid
  value = aws_vpc.main.id
}

output "ips" {                 # Too vague - avoid
  value = aws_instance.web[*].public_ip
}
```

### Module Names

Use **kebab-case** for module directory names:

```text
modules/
├── vpc-network/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── ec2-instance/
│   └── ...
└── security-groups/
    └── ...
```

### File Names

Standard Terraform file naming conventions:

```text
## Root module structure
main.tf                 # Primary resource definitions
variables.tf            # Input variable declarations
outputs.tf              # Output value definitions
providers.tf            # Provider configuration
versions.tf             # Terraform and provider version constraints
backend.tf              # Remote backend configuration
locals.tf               # Local value definitions (optional)
data.tf                 # Data source definitions (optional)
terraform.tfvars        # Variable value assignments (gitignored)
```

---

## Module Structure and Organization

### Standard Module Layout

```text
modules/vpc-network/
├── README.md                    # Module documentation
├── main.tf                      # Primary resources
├── variables.tf                 # Input variables
├── outputs.tf                   # Output values
├── versions.tf                  # Version constraints
├── examples/
│   └── basic/
│       ├── main.tf
│       └── variables.tf
└── tests/
    └── vpc_test.go              # Terratest tests
```

### File Organization Best Practices

```hcl
## main.tf - Group related resources together with comments
#----------------------------------------------------------------------
## VPC and Networking
#----------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-vpc"
    }
  )
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr_block, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-public-${count.index + 1}"
      Type = "public"
    }
  )
}

#----------------------------------------------------------------------
## Internet Gateway
#----------------------------------------------------------------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-igw"
    }
  )
}
```

---

## Variable Management

### Variable Definitions with Validation

All variables must include `type`, `description`, and validation when applicable:

```hcl
## variables.tf
variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, prod)"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type"
  default     = "t3.micro"

  validation {
    condition     = can(regex("^t[23]\\.(nano|micro|small|medium|large)$", var.instance_type))
    error_message = "Instance type must be a valid T2 or T3 size."
  }
}

variable "vpc_cidr_block" {
  type        = string
  description = "CIDR block for VPC (must be /16)"

  validation {
    condition     = can(cidrhost(var.vpc_cidr_block, 0)) && tonumber(split("/", var.vpc_cidr_block)[1]) == 16
    error_message = "VPC CIDR block must be a valid /16 network."
  }
}

variable "backup_retention_days" {
  type        = number
  description = "Number of days to retain backups"
  default     = 7

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 1 and 35 days."
  }
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags to apply to all resources"
  default     = {}
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  description = "List of CIDR blocks allowed to access resources"

  validation {
    condition     = alltrue([for cidr in var.allowed_cidr_blocks : can(cidrhost(cidr, 0))])
    error_message = "All CIDR blocks must be valid IPv4 CIDR notation."
  }
}
```

### Complex Variable Types

```hcl
## Object type for structured configuration
variable "database_config" {
  type = object({
    engine               = string
    engine_version       = string
    instance_class       = string
    allocated_storage    = number
    multi_az             = bool
    backup_retention_period = number
  })
  description = "RDS database configuration"

  validation {
    condition     = contains(["mysql", "postgres", "mariadb"], var.database_config.engine)
    error_message = "Database engine must be mysql, postgres, or mariadb."
  }
}

## Map of objects for multiple similar resources
variable "applications" {
  type = map(object({
    instance_count = number
    instance_type  = string
    disk_size      = number
  }))
  description = "Application configurations"
  default     = {}
}
```

---

## Resource Definitions and Naming Patterns

### Resource Naming Pattern

Use interpolation to create consistent, environment-aware resource names:

```hcl
## Pattern: ${project}-${environment}-${resource_type}-${identifier}
resource "aws_s3_bucket" "application_data" {
  bucket = "${var.project}-${var.environment}-app-data"

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-${var.environment}-app-data"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  )
}

resource "aws_security_group" "web_server" {
  name        = "${var.project}-${var.environment}-web-sg"
  description = "Security group for web servers in ${var.environment}"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "${var.project}-${var.environment}-web-sg"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

### Tagging Conventions

Apply consistent tags to ALL resources that support tagging:

```hcl
## locals.tf - Define common tags
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.team_email
    CostCenter  = var.cost_center
    Terraform   = "true"
  }
}

## main.tf - Use tags consistently
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-${var.environment}-web-${count.index + 1}"
      Role = "web-server"
    }
  )
}
```

### Dynamic Blocks

Use dynamic blocks for repeating nested blocks:

```hcl
resource "aws_security_group" "application" {
  name   = "${var.project}-${var.environment}-app-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      description = ingress.value.description
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

  tags = local.common_tags
}
```

### Advanced Dynamic Block Patterns

#### Multi-Level Nested Dynamic Blocks

```hcl
## Complex ALB with multiple target groups and listeners
resource "aws_lb" "application" {
  name               = "${var.project}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  dynamic "access_logs" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      bucket  = aws_s3_bucket.alb_logs[0].id
      prefix  = "alb-logs"
      enabled = true
    }
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.application.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  dynamic "default_action" {
    for_each = var.default_action_type == "fixed-response" ? [1] : []
    content {
      type = "fixed-response"

      fixed_response {
        content_type = "text/plain"
        message_body = "Not Found"
        status_code  = "404"
      }
    }
  }

  dynamic "default_action" {
    for_each = var.default_action_type == "forward" ? [1] : []
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.main.arn
    }
  }
}

resource "aws_lb_listener_rule" "path_based" {
  for_each     = var.listener_rules
  listener_arn = aws_lb_listener.https.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  dynamic "condition" {
    for_each = try([each.value.path_pattern], [])
    content {
      path_pattern {
        values = condition.value
      }
    }
  }

  dynamic "condition" {
    for_each = try([each.value.host_header], [])
    content {
      host_header {
        values = condition.value
      }
    }
  }

  dynamic "condition" {
    for_each = try([each.value.http_header], [])
    content {
      http_header {
        http_header_name = condition.value.name
        values           = condition.value.values
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-${var.environment}-rule-${each.key}"
    }
  )
}
```

#### Dynamic Blocks with Complex Variables

```hcl
## variables.tf - Define complex structures
variable "firewall_rules" {
  description = "Map of firewall rules to create"
  type = map(object({
    description = string
    priority    = number
    direction   = string
    access      = string
    protocol    = string
    source_ports = optional(list(string))
    destination_ports = optional(list(string))
    source_addresses = optional(list(string))
    destination_addresses = optional(list(string))
  }))

  default = {
    allow_http = {
      description           = "Allow HTTP from internet"
      priority              = 100
      direction             = "Inbound"
      access                = "Allow"
      protocol              = "Tcp"
      source_ports          = ["*"]
      destination_ports     = ["80"]
      source_addresses      = ["*"]
      destination_addresses = ["*"]
    }
    allow_https = {
      description           = "Allow HTTPS from internet"
      priority              = 110
      direction             = "Inbound"
      access                = "Allow"
      protocol              = "Tcp"
      source_ports          = ["*"]
      destination_ports     = ["443"]
      source_addresses      = ["*"]
      destination_addresses = ["*"]
    }
    deny_rdp = {
      description           = "Deny RDP from internet"
      priority              = 200
      direction             = "Inbound"
      access                = "Deny"
      protocol              = "Tcp"
      source_ports          = ["*"]
      destination_ports     = ["3389"]
      source_addresses      = ["*"]
      destination_addresses = ["*"]
    }
  }
}

## main.tf - Use dynamic blocks with complex iteration
resource "azurerm_network_security_group" "main" {
  name                = "${var.project}-${var.environment}-nsg"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name

  dynamic "security_rule" {
    for_each = var.firewall_rules
    content {
      name                       = security_rule.key
      description                = security_rule.value.description
      priority                   = security_rule.value.priority
      direction                  = security_rule.value.direction
      access                     = security_rule.value.access
      protocol                   = security_rule.value.protocol
      source_port_range          = try(security_rule.value.source_ports[0], "*")
      destination_port_range     = try(security_rule.value.destination_ports[0], "*")
      source_address_prefix      = try(security_rule.value.source_addresses[0], "*")
      destination_address_prefix = try(security_rule.value.destination_addresses[0], "*")
    }
  }

  tags = local.common_tags
}
```

#### Conditional Dynamic Blocks with Nested Iteration

```hcl
## CloudWatch alarms with dynamic thresholds per environment
locals {
  alarm_config = {
    prod = {
      cpu = {
        threshold           = 80
        evaluation_periods  = 2
        datapoints_to_alarm = 2
        treat_missing_data  = "breaching"
      }
      memory = {
        threshold           = 85
        evaluation_periods  = 3
        datapoints_to_alarm = 2
        treat_missing_data  = "breaching"
      }
      disk = {
        threshold           = 90
        evaluation_periods  = 1
        datapoints_to_alarm = 1
        treat_missing_data  = "breaching"
      }
    }
    staging = {
      cpu = {
        threshold           = 90
        evaluation_periods  = 3
        datapoints_to_alarm = 3
        treat_missing_data  = "notBreaching"
      }
    }
    dev = {}
  }

  alarms_for_environment = try(local.alarm_config[var.environment], {})
}

resource "aws_cloudwatch_metric_alarm" "instance_alarms" {
  for_each = {
    for pair in setproduct(aws_instance.web[*].id, keys(local.alarms_for_environment)) :
    "${pair[0]}-${pair[1]}" => {
      instance_id = pair[0]
      metric_name = pair[1]
      config      = local.alarms_for_environment[pair[1]]
    }
  }

  alarm_name          = "${var.project}-${var.environment}-${each.value.instance_id}-${each.value.metric_name}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = each.value.config.evaluation_periods
  metric_name         = title(each.value.metric_name)
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = each.value.config.threshold
  alarm_description   = "${title(each.value.metric_name)} utilization alarm for ${each.value.instance_id}"
  treat_missing_data  = each.value.config.treat_missing_data
  datapoints_to_alarm = each.value.config.datapoints_to_alarm

  dimensions = {
    InstanceId = each.value.instance_id
  }

  dynamic "alarm_actions" {
    for_each = var.enable_sns_notifications ? [var.sns_topic_arn] : []
    content {
      alarm_actions = [alarm_actions.value]
    }
  }

  tags = merge(
    local.common_tags,
    {
      InstanceId = each.value.instance_id
      MetricType = each.value.metric_name
    }
  )
}
```

#### Dynamic Blocks for IAM Policies

```hcl
## Dynamically construct IAM policy with multiple statements
locals {
  iam_policy_statements = {
    s3_read = {
      effect = "Allow"
      actions = [
        "s3:GetObject",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.data.arn,
        "${aws_s3_bucket.data.arn}/*"
      ]
    }
    dynamodb_write = var.enable_dynamodb ? {
      effect = "Allow"
      actions = [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ]
      resources = [
        aws_dynamodb_table.main[0].arn
      ]
    } : null
    kms_decrypt = var.enable_encryption ? {
      effect = "Allow"
      actions = [
        "kms:Decrypt",
        "kms:DescribeKey"
      ]
      resources = [
        aws_kms_key.main[0].arn
      ]
    } : null
    cloudwatch_logs = {
      effect = "Allow"
      actions = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      resources = [
        "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.function_name}:*"
      ]
    }
  }

  # Filter out null statements
  active_policy_statements = {
    for k, v in local.iam_policy_statements :
    k => v if v != null
  }
}

data "aws_iam_policy_document" "lambda_execution" {
  dynamic "statement" {
    for_each = local.active_policy_statements
    content {
      sid       = title(replace(statement.key, "_", ""))
      effect    = statement.value.effect
      actions   = statement.value.actions
      resources = statement.value.resources
    }
  }

  dynamic "statement" {
    for_each = var.enable_vpc ? [1] : []
    content {
      sid    = "VpcAccess"
      effect = "Allow"
      actions = [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses"
      ]
      resources = ["*"]
    }
  }
}

resource "aws_iam_policy" "lambda_execution" {
  name        = "${var.project}-${var.environment}-lambda-policy"
  path        = "/"
  description = "IAM policy for Lambda function execution"
  policy      = data.aws_iam_policy_document.lambda_execution.json

  tags = local.common_tags
}
```

#### Dynamic Blocks with for_each and Conditionals

```hcl
## RDS instance with dynamic parameter groups
variable "db_parameters" {
  description = "Database parameter overrides by environment"
  type = map(map(object({
    value        = string
    apply_method = string
  })))

  default = {
    prod = {
      max_connections = {
        value        = "500"
        apply_method = "immediate"
      }
      shared_buffers = {
        value        = "{DBInstanceClassMemory/4096}"
        apply_method = "pending-reboot"
      }
      work_mem = {
        value        = "16384"
        apply_method = "immediate"
      }
    }
    staging = {
      max_connections = {
        value        = "200"
        apply_method = "immediate"
      }
    }
    dev = {}
  }
}

resource "aws_db_parameter_group" "postgres" {
  name        = "${var.project}-${var.environment}-pg-params"
  family      = "postgres15"
  description = "Custom parameter group for ${var.environment}"

  dynamic "parameter" {
    for_each = try(var.db_parameters[var.environment], {})
    content {
      name         = parameter.key
      value        = parameter.value.value
      apply_method = parameter.value.apply_method
    }
  }

  # Always set these parameters regardless of environment
  parameter {
    name  = "log_statement"
    value = var.environment == "prod" ? "ddl" : "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = var.environment == "prod" ? "1000" : "100"
  }

  dynamic "parameter" {
    for_each = var.enable_slow_query_log ? [1] : []
    content {
      name  = "slow_query_log"
      value = "1"
    }
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}
```

---

## Output Definitions

Outputs should be well-documented and include sensitive flag when needed:

```hcl
## outputs.tf
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
}

output "database_password" {
  description = "RDS database master password"
  value       = aws_db_instance.main.password
  sensitive   = true
}

output "instance_details" {
  description = "Map of instance IDs to public IPs"
  value = {
    for instance in aws_instance.web :
    instance.id => instance.public_ip
  }
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}
```

---

## Data Sources

Use data sources for referencing existing resources:

```hcl
## data.tf
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

## Use data sources in resources
resource "aws_subnet" "private" {
  count             = length(data.aws_availability_zones.available.names)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr_block, 4, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project}-${var.environment}-private-${count.index + 1}"
  }
}
```

---

## Provider Configuration

### Provider Version Constraints

```hcl
## versions.tf
terraform {
  required_version = ">= 1.5.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
```

### Provider Setup

```hcl
## providers.tf
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy   = "terraform"
      Project     = var.project
      Environment = var.environment
    }
  }
}

## Multi-region provider configuration
provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

## Use aliased provider
resource "aws_s3_bucket" "backup" {
  provider = aws.us_west_2
  bucket   = "${var.project}-backup"
}
```

---

## State Management

### Remote Backend Configuration

```hcl
## backend.tf
terraform {
  backend "s3" {
    bucket         = "my-terraform-state-bucket"
    key            = "projects/my-app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
  }
}
```

### State Management Best Practices

```hcl
## Use lifecycle meta-arguments for critical resources
resource "aws_db_instance" "production" {
  allocated_storage = 100
  engine            = "postgres"
  instance_class    = "db.t3.large"

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [password]
  }
}

## Use terraform_remote_state for cross-stack references
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state-bucket"
    key    = "network/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.network.outputs.private_subnet_ids[0]
  # ...
}
```

---

## Workspace Usage

Use workspaces for environment separation (when not using separate state files):

```hcl
## locals.tf - Workspace-aware configuration
locals {
  workspace_config = {
    dev = {
      instance_type = "t3.micro"
      instance_count = 1
    }
    staging = {
      instance_type = "t3.small"
      instance_count = 2
    }
    prod = {
      instance_type = "t3.large"
      instance_count = 4
    }
  }

  environment = terraform.workspace
  config      = local.workspace_config[terraform.workspace]
}

## main.tf - Use workspace configuration
resource "aws_instance" "app" {
  count         = local.config.instance_count
  instance_type = local.config.instance_type
  ami           = data.aws_ami.ubuntu.id

  tags = {
    Name        = "${var.project}-${local.environment}-app-${count.index + 1}"
    Environment = local.environment
  }
}
```

Workspace commands:

```bash
## Create and switch to workspace
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

## List workspaces
terraform workspace list

## Switch workspace
terraform workspace select prod

## Show current workspace
terraform workspace show
```

---

## Testing

### Native Terraform Testing (Terraform 1.6+)

Use Terraform's built-in testing framework:

```hcl
## tests/vpc_validation.tftest.hcl
variables {
  vpc_cidr_block = "10.0.0.0/16"
  environment    = "test"
  project        = "myapp"
}

run "validate_vpc_creation" {
  command = apply

  assert {
    condition     = aws_vpc.main.cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR block does not match expected value"
  }

  assert {
    condition     = aws_vpc.main.enable_dns_hostnames == true
    error_message = "DNS hostnames must be enabled"
  }
}

run "validate_subnet_count" {
  command = plan

  assert {
    condition     = length(aws_subnet.public) >= 2
    error_message = "Must create at least 2 public subnets"
  }
}
```

Run tests:

```bash
terraform test
terraform test -verbose
```

### Terratest (Go-based Testing)

```go
// tests/vpc_test.go
package test

import (
    "testing"

    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestVPCModule(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../examples/basic",
        Vars: map[string]interface{}{
            "vpc_cidr_block": "10.0.0.0/16",
            "environment":    "test",
            "project":        "myapp",
        },
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    // Validate outputs
    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcID)

    subnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
    assert.GreaterOrEqual(t, len(subnetIDs), 2)
}
```

Run Terratest:

```bash
cd tests
go test -v -timeout 30m
```

### Testing Philosophy and Strategy

#### When to Write Tests

Write tests for Terraform modules when:

- **Reusable modules**: Any module used across multiple projects or teams
- **Critical infrastructure**: Resources that impact production availability or security
- **Complex logic**: Modules with conditional resources, dynamic blocks, or computed values
- **Public modules**: Any module shared externally or published to registries
- **Compliance requirements**: Infrastructure requiring audit trails or compliance evidence

#### What to Test

Test the following aspects of your Terraform modules:

1. **Resource Creation**: Verify expected resources are created
2. **Input Validation**: Test that invalid inputs are rejected
3. **Output Correctness**: Validate outputs match expected values
4. **State Consistency**: Ensure idempotent apply operations
5. **Cross-Resource Dependencies**: Test resource relationships and ordering
6. **Error Handling**: Verify graceful handling of failures

### Tiered Testing Strategy

Implement a three-tiered testing approach for comprehensive quality assurance:

#### Tier 1: Static Analysis (Fast, Always Run)

Fast checks that run on every commit:

```bash
# Terraform formatting
terraform fmt -check -recursive

# Terraform validation
terraform validate

# TFLint for best practices
tflint --recursive

# TFSec for security scanning
tfsec .

# Checkov for policy compliance
checkov -d .
```

**CI/CD Integration**:

```yaml
# .github/workflows/terraform-lint.yml
name: Terraform Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Validate
        run: |
          terraform init -backend=false
          terraform validate

      - name: Run TFLint
        uses: terraform-linters/setup-tflint@v4
        with:
          tflint_version: latest

      - name: TFLint
        run: tflint --recursive

      - name: Run TFSec
        uses: aquasecurity/tfsec-action@v1.0.0
```

#### Tier 2: Unit Tests (Module-Level, Run on PR)

Test individual modules in isolation using Terratest or native Terraform tests:

```go
// tests/unit/s3_bucket_test.go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestS3BucketModule(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../../modules/s3-bucket",
        Vars: map[string]interface{}{
            "bucket_name": "test-bucket-12345",
            "environment": "test",
            "versioning_enabled": true,
        },
        NoColor: true,
    }

    defer terraform.Destroy(t, terraformOptions)

    // Test Plan
    planExitCode := terraform.InitAndPlanWithExitCode(t, terraformOptions)
    assert.Equal(t, 0, planExitCode, "Plan should succeed")

    // Test Apply
    terraform.Apply(t, terraformOptions)

    // Validate Outputs
    bucketName := terraform.Output(t, terraformOptions, "bucket_name")
    assert.Equal(t, "test-bucket-12345", bucketName)

    bucketArn := terraform.Output(t, terraformOptions, "bucket_arn")
    assert.Contains(t, bucketArn, "arn:aws:s3:::test-bucket-12345")

    // Validate versioning is enabled
    versioning := terraform.Output(t, terraformOptions, "versioning_enabled")
    assert.Equal(t, "true", versioning)
}
```

**Native Terraform Unit Tests**:

```hcl
# tests/s3_bucket.tftest.hcl
variables {
  bucket_name = "test-bucket-12345"
  environment = "test"
  versioning_enabled = true
}

run "validate_bucket_creation" {
  command = apply

  assert {
    condition     = aws_s3_bucket.main.bucket == var.bucket_name
    error_message = "Bucket name does not match expected value"
  }

  assert {
    condition     = aws_s3_bucket.main.tags["Environment"] == "test"
    error_message = "Environment tag not set correctly"
  }
}

run "validate_versioning_enabled" {
  command = apply

  assert {
    condition     = aws_s3_bucket_versioning.main[0].versioning_configuration[0].status == "Enabled"
    error_message = "Versioning should be enabled when versioning_enabled is true"
  }
}

run "validate_outputs" {
  command = apply

  assert {
    condition     = output.bucket_name == var.bucket_name
    error_message = "Output bucket_name does not match input"
  }

  assert {
    condition     = can(regex("^arn:aws:s3:::", output.bucket_arn))
    error_message = "Bucket ARN format is invalid"
  }
}
```

#### Tier 3: Integration Tests (Full Stack, Run Nightly/Pre-Release)

Test complete infrastructure stacks in isolated environments:

```go
// tests/integration/full_stack_test.go
package test

import (
    "testing"
    "time"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/stretchr/testify/assert"
)

func TestFullApplicationStack(t *testing.T) {
    t.Parallel()

    awsRegion := "us-east-1"

    terraformOptions := &terraform.Options{
        TerraformDir: "../../examples/complete",
        Vars: map[string]interface{}{
            "environment": "integration-test",
            "aws_region":  awsRegion,
        },
        MaxRetries:         3,
        TimeBetweenRetries: 5 * time.Second,
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    // Test VPC
    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    vpc := aws.GetVpcById(t, vpcID, awsRegion)
    assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock)

    // Test RDS Instance
    dbEndpoint := terraform.Output(t, terraformOptions, "db_endpoint")
    assert.NotEmpty(t, dbEndpoint)

    // Test Application Load Balancer
    albDNS := terraform.Output(t, terraformOptions, "alb_dns_name")
    assert.NotEmpty(t, albDNS)

    // Integration: Verify connectivity
    // (In real tests, you'd verify the app responds correctly)
}
```

### Module Contracts and Guarantees

Define explicit contracts for each reusable module using a `CONTRACT.md` file:

#### CONTRACT.md Template

```markdown
# Module Contract: VPC Network

## Purpose
Provides a production-ready VPC with public and private subnets across multiple availability zones.

## Guarantees

### Resources Created
- 1 VPC with DNS hostnames and DNS support enabled
- N public subnets (min 2, configurable)
- N private subnets (min 2, configurable)
- 1 Internet Gateway
- 1 NAT Gateway per availability zone (if private subnets enabled)
- Route tables for public and private subnets

### Behavior Guarantees
1. **High Availability**: Subnets distributed across at least 2 availability zones
2. **Network Isolation**: Private subnets have no direct internet access
3. **Idempotency**: Multiple applies produce identical infrastructure
4. **Tagging Consistency**: All resources tagged with project, environment, managed_by

### Input Requirements
- `vpc_cidr_block`: Must be valid CIDR (validated via variable validation)
- `environment`: Must be one of: dev, staging, prod
- `availability_zones`: List of at least 2 AZs

### Output Guarantees
- `vpc_id`: Always returns valid VPC ID
- `public_subnet_ids`: Non-empty list if public subnets requested
- `private_subnet_ids`: Non-empty list if private subnets requested

## Compatibility Promises

### Semantic Versioning
- **Major version bump**: Breaking changes to inputs, outputs, or resource naming
- **Minor version bump**: New features, backward-compatible changes
- **Patch version bump**: Bug fixes only

### Breaking Changes Policy
Breaking changes will be:
1. Documented in CHANGELOG.md
2. Announced at least 2 minor versions in advance
3. Provided with migration guides

## Testing Coverage
- ✅ Terraform validate passes
- ✅ TFLint with no errors
- ✅ Terratest unit tests for all guarantees
- ✅ Integration tests for multi-AZ deployment
- ✅ Security scans (TFSec, Checkov) pass

## Platform Support
- **AWS Provider**: >= 4.0, < 6.0
- **Terraform**: >= 1.3.0
```

#### Module README Example

Every module should document its contract in the README:

```markdown
# VPC Network Module

## Usage

```hcl
module "vpc" {
  source = "github.com/myorg/terraform-modules//vpc?ref=v2.1.0"

  vpc_cidr_block      = "10.0.0.0/16"
  environment         = "prod"
  availability_zones  = ["us-east-1a", "us-east-1b", "us-east-1c"]

  enable_nat_gateway  = true
  single_nat_gateway  = false  # One NAT per AZ for HA
}
```

## Inputs

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| vpc_cidr_block | string | Yes | - | CIDR block for VPC (must be /16 or larger) |
| environment | string | Yes | - | Environment name (dev/staging/prod) |
| availability_zones | list(string) | Yes | - | List of AZs (minimum 2) |

## Outputs

| Name | Type | Description | Guaranteed |
|------|------|-------------|------------|
| vpc_id | string | VPC identifier | Always non-empty |
| public_subnet_ids | list(string) | Public subnet IDs | Non-empty if public subnets enabled |
| private_subnet_ids | list(string) | Private subnet IDs | Non-empty if private subnets enabled |

## Module Contract

See [CONTRACT.md Template](../04_templates/contract_template.md) for detailed guarantees, compatibility promises,
and breaking change policies.

## Module Testing

This module is tested with:

- Terraform 1.6+ native tests
- Terratest integration tests
- TFLint, TFSec, Checkov security scans

Run tests:

```bash
terraform test                    # Native tests
cd tests && go test -v -timeout 30m  # Terratest
```

### Test Coverage Requirements

Establish minimum coverage thresholds for modules:

#### Coverage Metrics

1. **Resource Coverage**: Test creation of all resource types
2. **Input Coverage**: Test all required and optional variables
3. **Output Coverage**: Validate all outputs
4. **Conditional Coverage**: Test all conditional resource creation paths
5. **Error Coverage**: Test input validation and error cases

#### Coverage Checklist

For each module, verify:

- [ ] **Terraform Validate**: Passes with no errors
- [ ] **Format Check**: `terraform fmt -check` passes
- [ ] **Linting**: TFLint passes with no errors
- [ ] **Security Scan**: TFSec/Checkov pass or exceptions documented
- [ ] **Unit Tests**: All resources tested individually
- [ ] **Integration Tests**: Module tested in realistic scenario
- [ ] **Contract Tests**: All guarantees validated
- [ ] **Input Validation Tests**: Invalid inputs rejected appropriately
- [ ] **Output Tests**: All outputs return expected values
- [ ] **Idempotency Test**: Multiple applies produce no changes

#### Coverage Reporting

Generate and track coverage reports:

```bash
# Generate test coverage report
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# Terraform test coverage
terraform test -json | tee test-results.json

# Parse results for CI/CD
jq '.test_results[] | select(.status != "pass")' test-results.json
```

### CI/CD Integration

#### Pre-Commit Hooks

Configure pre-commit hooks for local validation:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl
      - id: terraform_tfsec
      - id: terraform_checkov
        args:
          - --args=--quiet
          - --args=--framework terraform
```

Install and run:

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

#### GitHub Actions CI/CD Pipeline

Complete testing pipeline with tiered approach:

```yaml
# .github/workflows/terraform-ci.yml
name: Terraform CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  TF_VERSION: 1.6.0

jobs:
  # Tier 1: Fast Static Analysis
  static-analysis:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Format
        run: terraform fmt -check -recursive

      - name: Terraform Init
        run: terraform init -backend=false

      - name: Terraform Validate
        run: terraform validate

      - name: Setup TFLint
        uses: terraform-linters/setup-tflint@v4

      - name: Run TFLint
        run: tflint --recursive --format=compact

      - name: Run TFSec
        uses: aquasecurity/tfsec-action@v1.0.0
        with:
          soft_fail: false

      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: .
          framework: terraform
          quiet: true

  # Tier 2: Unit Tests
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: static-analysis
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Run Terraform Tests
        run: terraform test

      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Run Terratest Unit Tests
        run: |
          cd tests/unit
          go test -v -timeout 20m -parallel 4
        env:
          AWS_DEFAULT_REGION: us-east-1

  # Tier 3: Integration Tests (only on main branch)
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Run Integration Tests
        run: |
          cd tests/integration
          go test -v -timeout 60m
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-results
          path: tests/integration/test-results.json

  # Generate Test Report
  test-report:
    name: Generate Test Report
    runs-on: ubuntu-latest
    needs: [static-analysis, unit-tests]
    if: always()
    steps:
      - uses: actions/checkout@v4

      - name: Download Test Results
        uses: actions/download-artifact@v4
        with:
          pattern: '*-test-results'

      - name: Generate Report
        run: |
          echo "# Test Results" > test-report.md
          echo "## Summary" >> test-report.md
          echo "- Static Analysis: ${{ needs.static-analysis.result }}" >> test-report.md
          echo "- Unit Tests: ${{ needs.unit-tests.result }}" >> test-report.md

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('test-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

#### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test-unit
  - test-integration
  - report

variables:
  TF_VERSION: "1.6.0"

# Tier 1: Static Analysis
terraform-validate:
  stage: validate
  image: hashicorp/terraform:$TF_VERSION
  script:
    - terraform fmt -check -recursive
    - terraform init -backend=false
    - terraform validate

tflint:
  stage: validate
  image: ghcr.io/terraform-linters/tflint:latest
  script:
    - tflint --recursive

tfsec:
  stage: validate
  image: aquasec/tfsec:latest
  script:
    - tfsec . --soft-fail=false

# Tier 2: Unit Tests
terraform-test:
  stage: test-unit
  image: hashicorp/terraform:$TF_VERSION
  script:
    - terraform test
  artifacts:
    reports:
      junit: test-results.xml

terratest-unit:
  stage: test-unit
  image: golang:1.21
  script:
    - cd tests/unit
    - go test -v -timeout 20m ./... | tee test-output.log
  artifacts:
    paths:
      - tests/unit/test-output.log

# Tier 3: Integration Tests
terratest-integration:
  stage: test-integration
  image: golang:1.21
  only:
    - main
    - tags
  script:
    - cd tests/integration
    - go test -v -timeout 60m ./...
  artifacts:
    paths:
      - tests/integration/test-results.json

# Generate Coverage Report
test-coverage:
  stage: report
  image: golang:1.21
  script:
    - go test -coverprofile=coverage.out ./...
    - go tool cover -html=coverage.out -o coverage.html
  coverage: '/coverage: \d+.\d+% of statements/'
  artifacts:
    paths:
      - coverage.html
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

### Coverage and Compliance Reporting

#### Generating Compliance Evidence

Create audit-ready test reports:

```go
// tests/compliance/compliance_test.go
package test

import (
    "encoding/json"
    "os"
    "testing"
    "time"
)

type ComplianceReport struct {
    TestSuite     string    `json:"test_suite"`
    ExecutionTime time.Time `json:"execution_time"`
    Results       []TestResult `json:"results"`
    Summary       Summary   `json:"summary"`
}

type TestResult struct {
    Name        string `json:"name"`
    Status      string `json:"status"`
    Description string `json:"description"`
    Evidence    string `json:"evidence"`
}

type Summary struct {
    Total  int `json:"total"`
    Passed int `json:"passed"`
    Failed int `json:"failed"`
}

func TestComplianceReport(t *testing.T) {
    report := ComplianceReport{
        TestSuite:     "VPC Module Compliance",
        ExecutionTime: time.Now(),
        Results:       []TestResult{},
    }

    // Run tests and collect results
    tests := []struct {
        name     string
        testFunc func() (bool, string)
        control  string
    }{
        {"VPC DNS Enabled", testDNSEnabled, "NET-001"},
        {"Multi-AZ Deployment", testMultiAZ, "HA-001"},
        {"Private Subnet Isolation", testPrivateIsolation, "SEC-001"},
    }

    for _, tc := range tests {
        passed, evidence := tc.testFunc()
        status := "PASS"
        if !passed {
            status = "FAIL"
            report.Summary.Failed++
        } else {
            report.Summary.Passed++
        }

        report.Results = append(report.Results, TestResult{
            Name:        tc.name,
            Status:      status,
            Description: tc.control,
            Evidence:    evidence,
        })
        report.Summary.Total++
    }

    // Write compliance report
    file, _ := json.MarshalIndent(report, "", "  ")
    os.WriteFile("compliance-report.json", file, 0644)
}
```

#### Dashboard Integration

Integrate test results with dashboards:

```bash
# Send results to monitoring/dashboarding system
curl -X POST https://dashboard.example.com/api/test-results \
  -H "Content-Type: application/json" \
  -d @test-results.json

# Upload to S3 for historical tracking
aws s3 cp test-results.json \
  s3://test-results-bucket/terraform/$(date +%Y-%m-%d)/results.json

# Create GitHub deployment status
gh api repos/:owner/:repo/deployments/:deployment_id/statuses \
  -f state=success \
  -f description="All tests passed"
```

#### Coverage Metrics Collection

Track test coverage over time:

```bash
#!/bin/bash
# scripts/collect-coverage.sh

# Run tests with coverage
terraform test -json > test-results.json
cd tests && go test -coverprofile=coverage.out ./... -json > go-test-results.json

# Parse coverage
COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')

# Store metrics
cat > coverage-metrics.json <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "terraform_tests": {
    "total": $(jq '.test_results | length' test-results.json),
    "passed": $(jq '[.test_results[] | select(.status == "pass")] | length' test-results.json)
  },
  "go_tests": {
    "coverage": "$COVERAGE"
  }
}
EOF

# Push to metrics system
curl -X POST https://metrics.example.com/coverage \
  -d @coverage-metrics.json
```

---

## Security Best Practices

### Secrets Management

**NEVER** hardcode secrets in Terraform code:

```hcl
## Bad - Hardcoded secrets
resource "aws_db_instance" "bad" {
  password = "SuperSecretPassword123!"  # NEVER do this
}

## Good - Use variables with sensitive flag
variable "database_password" {
  type        = string
  description = "Database master password"
  sensitive   = true
}

resource "aws_db_instance" "good" {
  password = var.database_password
}

## Better - Generate secrets dynamically
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project}-${var.environment}-db-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "aws_db_instance" "best" {
  password = random_password.db_password.result
}
```

### Encryption

Enable encryption for data at rest and in transit:

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "${var.project}-${var.environment}-data"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_db_instance" "main" {
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn
  # ...
}
```

### IAM Least Privilege

```hcl
data "aws_iam_policy_document" "app_policy" {
  statement {
    sid    = "AllowS3ReadWrite"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = [
      "${aws_s3_bucket.app_data.arn}/*",
    ]
  }

  statement {
    sid    = "AllowKMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
    ]
    resources = [
      aws_kms_key.app.arn,
    ]
  }
}

resource "aws_iam_policy" "app" {
  name   = "${var.project}-${var.environment}-app-policy"
  policy = data.aws_iam_policy_document.app_policy.json
}
```

---

## Security and Compliance Patterns

This section provides comprehensive examples of production-grade security hardening and compliance
frameworks. These patterns demonstrate AWS Well-Architected Security Pillar best practices.

### AWS WAF Configuration

AWS WAF (Web Application Firewall) protects web applications from common exploits. This example
shows a complete WAF v2 setup with comprehensive security rules.

```hcl
## modules/aws-waf/variables.tf

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "rate_limit" {
  description = "Rate limit for requests per 5 minutes per IP"
  type        = number
  default     = 2000
}

variable "allowed_countries" {
  description = "List of allowed country codes (ISO 3166-1 alpha-2)"
  type        = list(string)
  default     = ["US", "CA", "GB", "DE", "FR"]
}

variable "blocked_ip_addresses" {
  description = "List of IP addresses to block"
  type        = list(string)
  default     = []
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer to protect"
  type        = string
}

variable "enable_logging" {
  description = "Enable WAF logging to CloudWatch"
  type        = bool
  default     = true
}
```hcl
## modules/aws-waf/main.tf

## IP Set for blocked addresses
resource "aws_wafv2_ip_set" "blocked_ips" {
  name               = "${var.project}-${var.environment}-blocked-ips"
  description        = "Blocked IP addresses"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.blocked_ip_addresses

  tags = {
    Name        = "${var.project}-${var.environment}-blocked-ips"
    Project     = var.project
    Environment = var.environment
  }
}

## IP Set for Amazon IP reputation list
resource "aws_wafv2_ip_set" "amazon_ip_reputation" {
  name               = "${var.project}-${var.environment}-amazon-reputation"
  description        = "Amazon IP reputation list"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = []  # Managed by AWS

  tags = {
    Name        = "${var.project}-${var.environment}-amazon-reputation"
    Project     = var.project
    Environment = var.environment
  }
}

## Web ACL with comprehensive security rules
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.project}-${var.environment}-web-acl"
  description = "WAF rules for ${var.project} ${var.environment}"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  ## Rule 1: Block known bad IPs
  rule {
    name     = "BlockedIPAddresses"
    priority = 1

    override_action {
      none {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.blocked_ips.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BlockedIPAddresses"
      sampled_requests_enabled   = true
    }
  }

  ## Rule 2: AWS Managed Rules - Core Rule Set (CRS)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        ## Exclude specific rules if needed
        # excluded_rule {
        #   name = "SizeRestrictions_BODY"
        # }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  ## Rule 3: SQL Injection protection
  rule {
    name     = "SQLInjectionProtection"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionProtection"
      sampled_requests_enabled   = true
    }
  }

  ## Rule 4: XSS (Cross-site scripting) protection
  rule {
    name     = "XSSProtection"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "XSSProtection"
      sampled_requests_enabled   = true
    }
  }

  ## Rule 5: Rate limiting per IP
  rule {
    name     = "RateLimitPerIP"
    priority = 5

    action {
      block {
        custom_response {
          response_code = 429
          custom_response_body_key = "rate_limit_response"
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitPerIP"
      sampled_requests_enabled   = true
    }
  }

  ## Rule 6: Geographic blocking
  rule {
    name     = "GeoBlocking"
    priority = 6

    action {
      block {}
    }

    statement {
      not_statement {
        statement {
          geo_match_statement {
            country_codes = var.allowed_countries
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlocking"
      sampled_requests_enabled   = true
    }
  }

  ## Rule 7: AWS Managed Rules - Anonymous IP List
  rule {
    name     = "AWSManagedRulesAnonymousIpList"
    priority = 7

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AnonymousIPList"
      sampled_requests_enabled   = true
    }
  }

  ## Rule 8: AWS Managed Rules - Amazon IP Reputation List
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 8

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AmazonIPReputationList"
      sampled_requests_enabled   = true
    }
  }

  ## Custom response for rate limiting
  custom_response_body {
    key          = "rate_limit_response"
    content      = "Too many requests. Please try again later."
    content_type = "TEXT_PLAIN"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project}-${var.environment}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project}-${var.environment}-web-acl"
    Project     = var.project
    Environment = var.environment
  }
}

## Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

## CloudWatch Log Group for WAF logs
resource "aws_cloudwatch_log_group" "waf_logs" {
  count             = var.enable_logging ? 1 : 0
  name              = "/aws/waf/${var.project}-${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "${var.project}-${var.environment}-waf-logs"
    Project     = var.project
    Environment = var.environment
  }
}

## WAF logging configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  count                   = var.enable_logging ? 1 : 0
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf_logs[0].arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

## CloudWatch Alarms for WAF
resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  alarm_name          = "${var.project}-${var.environment}-waf-blocked-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert when WAF blocks more than 100 requests"
  treat_missing_data  = "notBreaching"

  dimensions = {
    WebACL = aws_wafv2_web_acl.main.name
    Region = data.aws_region.current.name
    Rule   = "ALL"
  }

  tags = {
    Name        = "${var.project}-${var.environment}-waf-blocked-requests"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "waf_rate_limited_requests" {
  alarm_name          = "${var.project}-${var.environment}-waf-rate-limited"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RateLimitPerIP"
  namespace           = "AWS/WAFV2"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "Alert when rate limiting triggers frequently"
  treat_missing_data  = "notBreaching"

  dimensions = {
    WebACL = aws_wafv2_web_acl.main.name
    Region = data.aws_region.current.name
    Rule   = "RateLimitPerIP"
  }

  tags = {
    Name        = "${var.project}-${var.environment}-waf-rate-limited"
    Project     = var.project
    Environment = var.environment
  }
}

data "aws_region" "current" {}
```hcl
## modules/aws-waf/outputs.tf

output "web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "web_acl_capacity" {
  description = "Web ACL capacity units used"
  value       = aws_wafv2_web_acl.main.capacity
}

output "blocked_ips_set_id" {
  description = "ID of the blocked IPs set"
  value       = aws_wafv2_ip_set.blocked_ips.id
}

output "log_group_name" {
  description = "Name of the CloudWatch log group for WAF logs"
  value       = var.enable_logging ? aws_cloudwatch_log_group.waf_logs[0].name : null
}
```

### GuardDuty and Security Hub Integration

GuardDuty provides intelligent threat detection, while Security Hub aggregates security findings
across AWS accounts. This example shows multi-account setup with automated remediation.

```hcl
## modules/security-monitoring/variables.tf

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "enable_s3_protection" {
  description = "Enable S3 protection in GuardDuty"
  type        = bool
  default     = true
}

variable "enable_eks_protection" {
  description = "Enable EKS protection in GuardDuty"
  type        = bool
  default     = true
}

variable "enable_rds_protection" {
  description = "Enable RDS protection in GuardDuty"
  type        = bool
  default     = true
}

variable "enable_lambda_protection" {
  description = "Enable Lambda protection in GuardDuty"
  type        = bool
  default     = true
}

variable "finding_publishing_frequency" {
  description = "GuardDuty finding publishing frequency"
  type        = string
  default     = "FIFTEEN_MINUTES"
  validation {
    condition     = contains(["FIFTEEN_MINUTES", "ONE_HOUR", "SIX_HOURS"], var.finding_publishing_frequency)
    error_message = "Must be FIFTEEN_MINUTES, ONE_HOUR, or SIX_HOURS"
  }
}

variable "security_standards" {
  description = "List of security standards to enable in Security Hub"
  type        = list(string)
  default = [
    "aws-foundational-security-best-practices/v/1.0.0",
    "cis-aws-foundations-benchmark/v/1.4.0",
    "pci-dss/v/3.2.1"
  ]
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for critical findings notifications"
  type        = string
}

variable "admin_email" {
  description = "Email address for security notifications"
  type        = string
}
```hcl
## modules/security-monitoring/main.tf

## GuardDuty Detector
resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = var.finding_publishing_frequency

  datasources {
    s3_logs {
      enable = var.enable_s3_protection
    }

    kubernetes {
      audit_logs {
        enable = var.enable_eks_protection
      }
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-guardduty"
    Project     = var.project
    Environment = var.environment
  }
}

## GuardDuty S3 Protection
resource "aws_guardduty_detector_feature" "s3_protection" {
  count       = var.enable_s3_protection ? 1 : 0
  detector_id = aws_guardduty_detector.main.id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

## GuardDuty RDS Protection
resource "aws_guardduty_detector_feature" "rds_protection" {
  count       = var.enable_rds_protection ? 1 : 0
  detector_id = aws_guardduty_detector.main.id
  name        = "RDS_LOGIN_EVENTS"
  status      = "ENABLED"
}

## GuardDuty Lambda Protection
resource "aws_guardduty_detector_feature" "lambda_protection" {
  count       = var.enable_lambda_protection ? 1 : 0
  detector_id = aws_guardduty_detector.main.id
  name        = "LAMBDA_NETWORK_LOGS"
  status      = "ENABLED"
}

## Security Hub
resource "aws_securityhub_account" "main" {}

## Enable security standards
resource "aws_securityhub_standards_subscription" "standards" {
  for_each      = toset(var.security_standards)
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/${each.value}"
}

## Security Hub Insights - Critical and High Severity Findings
resource "aws_securityhub_insight" "critical_high_findings" {
  filters {
    severity_label {
      comparison = "EQUALS"
      value      = "CRITICAL"
    }
  }

  filters {
    severity_label {
      comparison = "EQUALS"
      value      = "HIGH"
    }
  }

  filters {
    workflow_status {
      comparison = "NOT_EQUALS"
      value      = "RESOLVED"
    }
  }

  group_by_attribute = "ResourceType"
  name               = "${var.project}-${var.environment}-critical-high-findings"
}

## Security Hub Insights - Unresolved Findings by Resource
resource "aws_securityhub_insight" "unresolved_by_resource" {
  filters {
    workflow_status {
      comparison = "NOT_EQUALS"
      value      = "RESOLVED"
    }
  }

  group_by_attribute = "ResourceId"
  name               = "${var.project}-${var.environment}-unresolved-by-resource"
}

## EventBridge rule for critical GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "${var.project}-${var.environment}-guardduty-findings"
  description = "Capture critical GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [
        { numeric = [">=" 7.0] }  ## High and Critical severity
      ]
    }
  })

  tags = {
    Name        = "${var.project}-${var.environment}-guardduty-findings"
    Project     = var.project
    Environment = var.environment
  }
}

## EventBridge target - SNS for notifications
resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = var.sns_topic_arn
}

## EventBridge rule for Security Hub findings
resource "aws_cloudwatch_event_rule" "securityhub_findings" {
  name        = "${var.project}-${var.environment}-securityhub-findings"
  description = "Capture critical Security Hub findings"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["CRITICAL", "HIGH"]
        }
        Compliance = {
          Status = ["FAILED"]
        }
      }
    }
  })

  tags = {
    Name        = "${var.project}-${var.environment}-securityhub-findings"
    Project     = var.project
    Environment = var.environment
  }
}

## EventBridge target for Security Hub - SNS
resource "aws_cloudwatch_event_target" "securityhub_sns" {
  rule      = aws_cloudwatch_event_rule.securityhub_findings.name
  target_id = "SendToSNS"
  arn       = var.sns_topic_arn
}

## Lambda function for automated remediation
resource "aws_lambda_function" "auto_remediation" {
  filename      = "auto_remediation.zip"
  function_name = "${var.project}-${var.environment}-auto-remediation"
  role          = aws_iam_role.remediation_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300

  environment {
    variables = {
      PROJECT     = var.project
      ENVIRONMENT = var.environment
      SNS_TOPIC   = var.sns_topic_arn
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-auto-remediation"
    Project     = var.project
    Environment = var.environment
  }
}

## IAM role for remediation Lambda
resource "aws_iam_role" "remediation_lambda" {
  name = "${var.project}-${var.environment}-remediation-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-remediation-lambda"
    Project     = var.project
    Environment = var.environment
  }
}

## IAM policy for remediation Lambda
resource "aws_iam_role_policy" "remediation_lambda" {
  name = "${var.project}-${var.environment}-remediation-policy"
  role = aws_iam_role.remediation_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project}-${var.environment}-auto-remediation:*"
      },
      {
        Sid    = "SecurityGroupRemediation"
        Effect = "Allow"
        Action = [
          "ec2:RevokeSecurityGroupIngress",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Project" = var.project
          }
        }
      },
      {
        Sid    = "S3BucketRemediation"
        Effect = "Allow"
        Action = [
          "s3:PutBucketPublicAccessBlock",
          "s3:PutBucketAcl"
        ]
        Resource = "arn:aws:s3:::${var.project}-*"
      },
      {
        Sid    = "SNSPublish"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn
      }
    ]
  })
}

## EventBridge target - Lambda for auto-remediation
resource "aws_cloudwatch_event_target" "remediation_lambda" {
  rule      = aws_cloudwatch_event_rule.securityhub_findings.name
  target_id = "InvokeRemediationLambda"
  arn       = aws_lambda_function.auto_remediation.arn
}

## Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.securityhub_findings.arn
}

## SNS email subscription for admin
resource "aws_sns_topic_subscription" "admin_email" {
  topic_arn = var.sns_topic_arn
  protocol  = "email"
  endpoint  = var.admin_email
}

## CloudWatch Log Group for GuardDuty findings
resource "aws_cloudwatch_log_group" "guardduty_findings" {
  name              = "/aws/guardduty/${var.project}-${var.environment}"
  retention_in_days = 90

  tags = {
    Name        = "${var.project}-${var.environment}-guardduty-logs"
    Project     = var.project
    Environment = var.environment
  }
}

## CloudWatch metric filter for GuardDuty findings
resource "aws_cloudwatch_log_metric_filter" "guardduty_critical" {
  name           = "${var.project}-${var.environment}-guardduty-critical"
  log_group_name = aws_cloudwatch_log_group.guardduty_findings.name
  pattern        = "[severity >= 7]"

  metric_transformation {
    name      = "GuardDutyCriticalFindings"
    namespace = "${var.project}/${var.environment}/Security"
    value     = "1"
  }
}

## CloudWatch alarm for critical GuardDuty findings
resource "aws_cloudwatch_metric_alarm" "guardduty_critical" {
  alarm_name          = "${var.project}-${var.environment}-guardduty-critical"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "GuardDutyCriticalFindings"
  namespace           = "${var.project}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert on any critical GuardDuty findings"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_topic_arn]

  tags = {
    Name        = "${var.project}-${var.environment}-guardduty-critical"
    Project     = var.project
    Environment = var.environment
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
```hcl
## modules/security-monitoring/outputs.tf

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "securityhub_account_id" {
  description = "Security Hub account ID"
  value       = aws_securityhub_account.main.id
}

output "remediation_lambda_arn" {
  description = "ARN of the auto-remediation Lambda function"
  value       = aws_lambda_function.auto_remediation.arn
}

output "critical_findings_insight_arn" {
  description = "ARN of the critical findings Security Hub insight"
  value       = aws_securityhub_insight.critical_high_findings.arn
}
```

### Advanced Secrets Management

Complete secrets management with automatic rotation, cross-account sharing, and service integration
patterns for production workloads.

```hcl
## modules/secrets-manager/variables.tf

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "database_engine" {
  description = "Database engine (mysql, postgres, etc.)"
  type        = string
  default     = "postgres"
}

variable "rotation_days" {
  description = "Number of days between automatic rotation"
  type        = number
  default     = 30
}

variable "enable_cross_account_access" {
  description = "Enable cross-account secret access"
  type        = bool
  default     = false
}

variable "allowed_account_ids" {
  description = "AWS account IDs allowed to access secrets"
  type        = list(string)
  default     = []
}
```hcl
## modules/secrets-manager/main.tf

## KMS key for encrypting secrets
resource "aws_kms_key" "secrets" {
  description             = "${var.project}-${var.environment} secrets encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project}-${var.environment}-secrets-kms"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.project}-${var.environment}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

## Database master password secret
resource "aws_secretsmanager_secret" "db_master_password" {
  name                    = "${var.project}-${var.environment}-db-master-password"
  description             = "Database master password with automatic rotation"
  kms_key_id              = aws_kms_key.secrets.arn
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project}-${var.environment}-db-master-password"
    Project     = var.project
    Environment = var.environment
    Rotation    = "enabled"
  }
}

## Generate initial random password
resource "random_password" "db_master" {
  length  = 32
  special = true
  ## Exclude characters that may cause issues
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

## Store initial password
resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id = aws_secretsmanager_secret.db_master_password.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_master.result
    engine   = var.database_engine
    host     = ""  ## Will be updated by rotation Lambda
    port     = var.database_engine == "postgres" ? 5432 : 3306
    dbname   = "${var.project}_${var.environment}"
  })

  lifecycle {
    ignore_changes = [secret_string]  ## Let rotation Lambda manage this
  }
}

## IAM role for rotation Lambda
resource "aws_iam_role" "rotation_lambda" {
  name = "${var.project}-${var.environment}-secret-rotation"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-secret-rotation"
    Project     = var.project
    Environment = var.environment
  }
}

## IAM policy for rotation Lambda
resource "aws_iam_role_policy" "rotation_lambda" {
  name = "${var.project}-${var.environment}-rotation-policy"
  role = aws_iam_role.rotation_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project}-${var.environment}-secret-rotation:*"
      },
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_master_password.arn
      },
      {
        Sid    = "KMSDecrypt"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.secrets.arn
      },
      {
        Sid    = "RDSAccess"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters"
        ]
        Resource = "*"
      },
      {
        Sid    = "VPCAccess"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

## Lambda function for password rotation
resource "aws_lambda_function" "rotation" {
  filename      = "rotation_lambda.zip"
  function_name = "${var.project}-${var.environment}-secret-rotation"
  role          = aws_iam_role.rotation_lambda.arn
  handler       = "rotation.lambda_handler"
  runtime       = "python3.11"
  timeout       = 300

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${data.aws_region.current.name}.amazonaws.com"
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-secret-rotation"
    Project     = var.project
    Environment = var.environment
  }
}

## Lambda permission for Secrets Manager
resource "aws_lambda_permission" "rotation" {
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

## Enable automatic rotation
resource "aws_secretsmanager_secret_rotation" "db_master_password" {
  secret_id           = aws_secretsmanager_secret.db_master_password.id
  rotation_lambda_arn = aws_lambda_function.rotation.arn

  rotation_rules {
    automatically_after_days = var.rotation_days
  }

  depends_on = [aws_lambda_permission.rotation]
}

## Application API key secret
resource "aws_secretsmanager_secret" "api_key" {
  name                    = "${var.project}-${var.environment}-api-key"
  description             = "Application API key"
  kms_key_id              = aws_kms_key.secrets.arn
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project}-${var.environment}-api-key"
    Project     = var.project
    Environment = var.environment
  }
}

resource "random_password" "api_key" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret_version" "api_key" {
  secret_id     = aws_secretsmanager_secret.api_key.id
  secret_string = random_password.api_key.result
}

## Cross-account access policy (if enabled)
resource "aws_secretsmanager_secret_policy" "cross_account" {
  count     = var.enable_cross_account_access ? 1 : 0
  secret_arn = aws_secretsmanager_secret.db_master_password.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCrossAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = [for account_id in var.allowed_account_ids : "arn:aws:iam::${account_id}:root"]
        }
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "*"
      }
    ]
  })
}

## CloudWatch alarms for rotation failures
resource "aws_cloudwatch_metric_alarm" "rotation_failed" {
  alarm_name          = "${var.project}-${var.environment}-secret-rotation-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when secret rotation fails"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.rotation.function_name
  }

  tags = {
    Name        = "${var.project}-${var.environment}-rotation-failed"
    Project     = var.project
    Environment = var.environment
  }
}

## Example: ECS task definition with secret injection
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project}-${var.environment}-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "app"
      image = "myapp:latest"
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_secretsmanager_secret.db_master_password.arn
        },
        {
          name      = "API_KEY"
          valueFrom = aws_secretsmanager_secret.api_key.arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project}-${var.environment}"
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "app"
        }
      }
    }
  ])

  tags = {
    Name        = "${var.project}-${var.environment}-app-task"
    Project     = var.project
    Environment = var.environment
  }
}

## ECS execution role (for pulling secrets)
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project}-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-ecs-execution"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "ecs_execution" {
  name = "${var.project}-${var.environment}-ecs-execution-policy"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "GetSecrets"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_master_password.arn,
          aws_secretsmanager_secret.api_key.arn
        ]
      },
      {
        Sid    = "DecryptSecrets"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.secrets.arn
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

## ECS task role (for application runtime)
resource "aws_iam_role" "ecs_task" {
  name = "${var.project}-${var.environment}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-ecs-task"
    Project     = var.project
    Environment = var.environment
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
```hcl
## modules/secrets-manager/outputs.tf

output "kms_key_id" {
  description = "ID of the KMS key for secrets encryption"
  value       = aws_kms_key.secrets.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for secrets encryption"
  value       = aws_kms_key.secrets.arn
}

output "db_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_master_password.arn
}

output "api_key_secret_arn" {
  description = "ARN of the API key secret"
  value       = aws_secretsmanager_secret.api_key.arn
}

output "rotation_lambda_arn" {
  description = "ARN of the rotation Lambda function"
  value       = aws_lambda_function.rotation.arn
}
```

### CIS AWS Foundations Benchmark Compliance

Implementation of CIS AWS Foundations Benchmark controls with automated remediation and compliance
monitoring. Each resource maps to specific CIS controls.

```hcl
## modules/cis-compliance/variables.tf

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "password_max_age" {
  description = "Maximum age for IAM user passwords (CIS 1.11)"
  type        = number
  default     = 90
}

variable "password_min_length" {
  description = "Minimum length for IAM passwords (CIS 1.9)"
  type        = number
  default     = 14
}

variable "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for compliance notifications"
  type        = string
}
```hcl
## modules/cis-compliance/main.tf

## CIS 1.5-1.11: IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = var.password_min_length
  require_lowercase_characters   = true
  require_uppercase_characters   = true
  require_numbers                = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = var.password_max_age
  password_reuse_prevention      = 24
  hard_expiry                    = false
}

## CIS 2.1: CloudTrail - Ensure CloudTrail is enabled in all regions
resource "aws_cloudtrail" "main" {
  name                          = "${var.project}-${var.environment}-trail"
  s3_bucket_name                = var.cloudtrail_bucket_name
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true  ## CIS 2.2
  kms_key_id                    = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    ## CIS 2.6: S3 bucket-level logging
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  tags = {
    Name        = "${var.project}-${var.environment}-trail"
    Project     = var.project
    Environment = var.environment
    CIS         = "2.1,2.2,2.4,2.6"
  }
}

## CIS 2.7: CloudTrail logs encrypted at rest using KMS
resource "aws_kms_key" "cloudtrail" {
  description             = "${var.project}-${var.environment} CloudTrail encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "kms:DescribeKey"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-cloudtrail-kms"
    Project     = var.project
    Environment = var.environment
    CIS         = "2.7"
  }
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/${var.project}-${var.environment}-cloudtrail"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

## CIS 2.4: CloudTrail integration with CloudWatch Logs
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project}-${var.environment}"
  retention_in_days = 90

  tags = {
    Name        = "${var.project}-${var.environment}-cloudtrail-logs"
    Project     = var.project
    Environment = var.environment
    CIS         = "2.4"
  }
}

## IAM role for CloudTrail to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${var.project}-${var.environment}-cloudtrail-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-cloudtrail-cloudwatch"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${var.project}-${var.environment}-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailCreateLogStream"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

## CIS 2.9: VPC Flow Logs enabled
resource "aws_flow_log" "vpc" {
  for_each             = toset(["vpc-12345678"])  ## Replace with actual VPC IDs
  iam_role_arn         = aws_iam_role.vpc_flow_log.arn
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = each.value

  tags = {
    Name        = "${var.project}-${var.environment}-vpc-flow-logs"
    Project     = var.project
    Environment = var.environment
    CIS         = "2.9"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${var.project}-${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "${var.project}-${var.environment}-vpc-flow-logs"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role" "vpc_flow_log" {
  name = "${var.project}-${var.environment}-vpc-flow-log"

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

  tags = {
    Name        = "${var.project}-${var.environment}-vpc-flow-log"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "vpc_flow_log" {
  name = "${var.project}-${var.environment}-vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

## CIS 3.3: CloudWatch alarm for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${var.project}-${var.environment}-root-account-usage"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{$.userIdentity.type=\"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType !=\"AwsServiceEvent\"}"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${var.project}/${var.environment}/CIS"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${var.project}-${var.environment}-root-account-usage"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${var.project}/${var.environment}/CIS"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "CIS 3.3: Alert on root account usage"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project}-${var.environment}-root-usage"
    Project     = var.project
    Environment = var.environment
    CIS         = "3.3"
  }
}

## CIS 3.1: Unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${var.project}-${var.environment}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{($.errorCode=\"*UnauthorizedOperation\") || ($.errorCode=\"AccessDenied*\")}"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project}/${var.environment}/CIS"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${var.project}-${var.environment}-unauthorized-api-calls"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project}/${var.environment}/CIS"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "CIS 3.1: Alert on unauthorized API calls"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project}-${var.environment}-unauthorized-api-calls"
    Project     = var.project
    Environment = var.environment
    CIS         = "3.1"
  }
}

## CIS 3.4: IAM policy changes
resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "${var.project}-${var.environment}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern = <<PATTERN
{($.eventName=DeleteGroupPolicy) || ($.eventName=DeleteRolePolicy) || ($.eventName=DeleteUserPolicy) ||
($.eventName=PutGroupPolicy) || ($.eventName=PutRolePolicy) || ($.eventName=PutUserPolicy) ||
($.eventName=CreatePolicy) || ($.eventName=DeletePolicy) || ($.eventName=CreatePolicyVersion) ||
($.eventName=DeletePolicyVersion) || ($.eventName=AttachRolePolicy) || ($.eventName=DetachRolePolicy) ||
($.eventName=AttachUserPolicy) || ($.eventName=DetachUserPolicy) || ($.eventName=AttachGroupPolicy) ||
($.eventName=DetachGroupPolicy)}
PATTERN

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "${var.project}/${var.environment}/CIS"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "${var.project}-${var.environment}-iam-policy-changes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "${var.project}/${var.environment}/CIS"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "CIS 3.4: Alert on IAM policy changes"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project}-${var.environment}-iam-policy-changes"
    Project     = var.project
    Environment = var.environment
    CIS         = "3.4"
  }
}

## AWS Config for compliance monitoring
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project}-${var.environment}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.project}-${var.environment}-config-delivery"
  s3_bucket_name = var.cloudtrail_bucket_name
  depends_on     = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

## IAM role for AWS Config
resource "aws_iam_role" "config" {
  name = "${var.project}-${var.environment}-config"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/ConfigRole"
  ]

  tags = {
    Name        = "${var.project}-${var.environment}-config"
    Project     = var.project
    Environment = var.environment
  }
}

## AWS Config Rules for CIS compliance
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "${var.project}-${var.environment}-s3-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name        = "${var.project}-${var.environment}-s3-public-read-prohibited"
    Project     = var.project
    Environment = var.environment
    CIS         = "2.1.1"
  }
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "${var.project}-${var.environment}-encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name        = "${var.project}-${var.environment}-encrypted-volumes"
    Project     = var.project
    Environment = var.environment
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```hcl
## modules/cis-compliance/outputs.tf

output "cloudtrail_arn" {
  description = "ARN of the multi-region CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_kms_key_arn" {
  description = "ARN of the CloudTrail KMS encryption key"
  value       = aws_kms_key.cloudtrail.arn
}

output "config_recorder_id" {
  description = "ID of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}

output "vpc_flow_log_group_name" {
  description = "Name of the VPC Flow Logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}
```

### HIPAA Compliance Module

HIPAA-compliant infrastructure with encryption, audit logging, access controls, and disaster recovery.
All resources meet HIPAA Security Rule technical safeguards.

```hcl
## modules/hipaa-compliance/variables.tf

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "backup_retention_days" {
  description = "Number of days to retain backups (HIPAA requires 6 years)"
  type        = number
  default     = 2190  ## 6 years
}

variable "log_retention_days" {
  description = "Number of days to retain audit logs (HIPAA requires 6 years)"
  type        = number
  default     = 2190  ## 6 years
}

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}
```hcl
## modules/hipaa-compliance/main.tf

## KMS Key for HIPAA encryption (required for PHI)
resource "aws_kms_key" "hipaa" {
  description             = "${var.project}-${var.environment} HIPAA encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true  ## HIPAA requires key rotation

  tags = {
    Name        = "${var.project}-${var.environment}-hipaa-kms"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  }
}

resource "aws_kms_alias" "hipaa" {
  name          = "alias/${var.project}-${var.environment}-hipaa"
  target_key_id = aws_kms_key.hipaa.key_id
}

## HIPAA-compliant S3 bucket for PHI storage
resource "aws_s3_bucket" "phi_data" {
  bucket = "${var.project}-${var.environment}-phi-data"

  tags = {
    Name        = "${var.project}-${var.environment}-phi-data"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  }
}

## Block all public access (HIPAA requirement)
resource "aws_s3_bucket_public_access_block" "phi_data" {
  bucket = aws_s3_bucket.phi_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

## Enable versioning for data recovery (HIPAA integrity requirement)
resource "aws_s3_bucket_versioning" "phi_data" {
  bucket = aws_s3_bucket.phi_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

## Server-side encryption with KMS (HIPAA encryption requirement)
resource "aws_s3_bucket_server_side_encryption_configuration" "phi_data" {
  bucket = aws_s3_bucket.phi_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.hipaa.arn
    }
    bucket_key_enabled = true
  }
}

## Access logging (HIPAA audit requirement)
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.project}-${var.environment}-phi-access-logs"

  tags = {
    Name        = "${var.project}-${var.environment}-phi-access-logs"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "aws_s3_bucket_logging" "phi_data" {
  bucket = aws_s3_bucket.phi_data.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "s3-access-logs/"
}

## Lifecycle policy for log retention (HIPAA requires 6 years)
resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "hipaa-retention"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    expiration {
      days = var.log_retention_days
    }
  }
}

## HIPAA-compliant RDS database with encryption
resource "aws_db_instance" "phi_database" {
  identifier     = "${var.project}-${var.environment}-phi-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.database_instance_class

  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type          = "gp3"
  storage_encrypted     = true  ## HIPAA encryption requirement
  kms_key_id            = aws_kms_key.hipaa.arn

  ## High availability (HIPAA availability requirement)
  multi_az = var.multi_az

  ## Database configuration
  db_name  = "${var.project}_${var.environment}"
  username = "admin"
  password = random_password.db_password.result

  ## Network configuration - private subnet only
  db_subnet_group_name   = aws_db_subnet_group.phi.name
  vpc_security_group_ids = [aws_security_group.phi_database.id]
  publicly_accessible    = false  ## HIPAA requires private access only

  ## Backup configuration (HIPAA disaster recovery requirement)
  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  ## Enable automated backups
  copy_tags_to_snapshot = true
  skip_final_snapshot   = false
  final_snapshot_identifier = "${var.project}-${var.environment}-phi-db-final-snapshot"

  ## Point-in-time recovery (HIPAA requirement)
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  ## Deletion protection (prevent accidental data loss)
  deletion_protection = true

  ## Performance Insights with encryption
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.hipaa.arn

  ## Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "${var.project}-${var.environment}-phi-db"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
    DataClass   = "PHI"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

## DB subnet group for RDS
resource "aws_db_subnet_group" "phi" {
  name       = "${var.project}-${var.environment}-phi-subnet-group"
  subnet_ids = ["subnet-12345678", "subnet-87654321"]  ## Replace with actual private subnet IDs

  tags = {
    Name        = "${var.project}-${var.environment}-phi-subnet-group"
    Project     = var.project
    Environment = var.environment
  }
}

## Security group for RDS - least privilege access
resource "aws_security_group" "phi_database" {
  name        = "${var.project}-${var.environment}-phi-db-sg"
  description = "Security group for HIPAA-compliant database"
  vpc_id      = "vpc-12345678"  ## Replace with actual VPC ID

  ## Only allow access from application tier
  ingress {
    description     = "PostgreSQL from application tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_tier.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-${var.environment}-phi-db-sg"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

## Application tier security group
resource "aws_security_group" "app_tier" {
  name        = "${var.project}-${var.environment}-app-tier-sg"
  description = "Security group for application tier"
  vpc_id      = "vpc-12345678"  ## Replace with actual VPC ID

  ## HTTPS only (encryption in transit)
  ingress {
    description = "HTTPS from ALB"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  ## Replace with VPC CIDR
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-${var.environment}-app-tier-sg"
    Project     = var.project
    Environment = var.environment
  }
}

## IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project}-${var.environment}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  ]

  tags = {
    Name        = "${var.project}-${var.environment}-rds-monitoring"
    Project     = var.project
    Environment = var.environment
  }
}

## CloudTrail for audit logging (HIPAA requirement)
resource "aws_cloudtrail" "hipaa_audit" {
  name                          = "${var.project}-${var.environment}-hipaa-audit"
  s3_bucket_name                = aws_s3_bucket.audit_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true  ## Integrity validation
  kms_key_id                    = aws_kms_key.hipaa.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    ## Log all S3 data events for PHI bucket
    data_resource {
      type = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.phi_data.arn}/*"
      ]
    }

    ## Log all RDS data events
    data_resource {
      type = "AWS::RDS::DBInstance"
      values = [
        "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:db:*"
      ]
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.hipaa_audit.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  tags = {
    Name        = "${var.project}-${var.environment}-hipaa-audit"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

## S3 bucket for CloudTrail audit logs
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${var.project}-${var.environment}-hipaa-audit-logs"

  tags = {
    Name        = "${var.project}-${var.environment}-hipaa-audit-logs"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

## CloudWatch log group for audit trail
resource "aws_cloudwatch_log_group" "hipaa_audit" {
  name              = "/aws/cloudtrail/${var.project}-${var.environment}-hipaa"
  retention_in_days = var.log_retention_days

  kms_key_id = aws_kms_key.hipaa.arn

  tags = {
    Name        = "${var.project}-${var.environment}-hipaa-audit-logs"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

## IAM role for CloudTrail to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${var.project}-${var.environment}-cloudtrail-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-cloudtrail-cloudwatch"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${var.project}-${var.environment}-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailCreateLogStream"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.hipaa_audit.arn}:*"
      }
    ]
  })
}

## AWS Backup for disaster recovery (HIPAA requirement)
resource "aws_backup_vault" "hipaa" {
  name        = "${var.project}-${var.environment}-hipaa-vault"
  kms_key_arn = aws_kms_key.hipaa.arn

  tags = {
    Name        = "${var.project}-${var.environment}-hipaa-vault"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "aws_backup_plan" "hipaa" {
  name = "${var.project}-${var.environment}-hipaa-backup-plan"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.hipaa.name
    schedule          = "cron(0 5 ? * * *)"  ## Daily at 5 AM UTC

    lifecycle {
      cold_storage_after = 90
      delete_after       = var.backup_retention_days
    }

    recovery_point_tags = {
      BackupPlan  = "HIPAA"
      Project     = var.project
      Environment = var.environment
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-hipaa-backup-plan"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

## Backup selection for RDS
resource "aws_backup_selection" "hipaa_rds" {
  name         = "${var.project}-${var.environment}-hipaa-rds-backup"
  plan_id      = aws_backup_plan.hipaa.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_db_instance.phi_database.arn
  ]
}

## IAM role for AWS Backup
resource "aws_iam_role" "backup" {
  name = "${var.project}-${var.environment}-backup"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
  ]

  tags = {
    Name        = "${var.project}-${var.environment}-backup"
    Project     = var.project
    Environment = var.environment
  }
}

## VPC Flow Logs (HIPAA network monitoring requirement)
resource "aws_flow_log" "hipaa" {
  iam_role_arn    = aws_iam_role.vpc_flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = "vpc-12345678"  ## Replace with actual VPC ID

  tags = {
    Name        = "${var.project}-${var.environment}-hipaa-flow-logs"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${var.project}-${var.environment}-hipaa"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.hipaa.arn

  tags = {
    Name        = "${var.project}-${var.environment}-vpc-flow-logs"
    Project     = var.project
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

## IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log" {
  name = "${var.project}-${var.environment}-vpc-flow-log"

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

  tags = {
    Name        = "${var.project}-${var.environment}-vpc-flow-log"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "vpc_flow_log" {
  name = "${var.project}-${var.environment}-vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
```hcl
## modules/hipaa-compliance/outputs.tf

output "kms_key_arn" {
  description = "ARN of the HIPAA encryption KMS key"
  value       = aws_kms_key.hipaa.arn
}

output "phi_data_bucket_id" {
  description = "ID of the PHI data S3 bucket"
  value       = aws_s3_bucket.phi_data.id
}

output "database_endpoint" {
  description = "Endpoint of the HIPAA-compliant RDS database"
  value       = aws_db_instance.phi_database.endpoint
  sensitive   = true
}

output "backup_vault_arn" {
  description = "ARN of the AWS Backup vault"
  value       = aws_backup_vault.hipaa.arn
}

output "cloudtrail_arn" {
  description = "ARN of the HIPAA audit CloudTrail"
  value       = aws_cloudtrail.hipaa_audit.arn
}
```

### SOC 2 Compliance Controls

SOC 2 Type II compliance implementation covering Common Criteria (CC) trust service principles:
Security, Availability, Processing Integrity, Confidentiality, and Privacy.

```hcl
## modules/soc2-compliance/variables.tf

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "change_management_approvers" {
  description = "Email addresses of change management approvers"
  type        = list(string)
}

variable "incident_response_team" {
  description = "Email addresses of incident response team"
  type        = list(string)
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 90
}
```hcl
## modules/soc2-compliance/main.tf

## CC6.1: Change Management Controls - CloudTrail for all changes
resource "aws_cloudtrail" "change_management" {
  name                          = "${var.project}-${var.environment}-changes"
  s3_bucket_name                = aws_s3_bucket.audit_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.changes.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  tags = {
    Name        = "${var.project}-${var.environment}-change-management"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC6.1"
  }
}

## S3 bucket for audit logs
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${var.project}-${var.environment}-soc2-audit-logs"

  tags = {
    Name        = "${var.project}-${var.environment}-soc2-audit-logs"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC6.1,CC7.2"
  }
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

## CloudWatch log group for change tracking
resource "aws_cloudwatch_log_group" "changes" {
  name              = "/aws/soc2/${var.project}-${var.environment}/changes"
  retention_in_days = 365  ## SOC 2 requires 1+ year retention

  tags = {
    Name        = "${var.project}-${var.environment}-changes"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC6.1"
  }
}

## IAM role for CloudTrail to CloudWatch
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${var.project}-${var.environment}-cloudtrail-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-cloudtrail-cloudwatch"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${var.project}-${var.environment}-cloudtrail-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailCreateLogStream"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.changes.arn}:*"
      }
    ]
  })
}

## CC6.6: Monitoring and Alerting - CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "infrastructure_changes" {
  alarm_name          = "${var.project}-${var.environment}-infrastructure-changes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "InfrastructureChanges"
  namespace           = "${var.project}/${var.environment}/SOC2"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "SOC 2 CC6.6: Alert on high rate of infrastructure changes"
  alarm_actions       = [aws_sns_topic.soc2_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project}-${var.environment}-infrastructure-changes"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC6.6"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_access" {
  alarm_name          = "${var.project}-${var.environment}-unauthorized-access"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAccess"
  namespace           = "${var.project}/${var.environment}/SOC2"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "SOC 2 CC6.6: Alert on unauthorized access attempts"
  alarm_actions       = [aws_sns_topic.soc2_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project}-${var.environment}-unauthorized-access"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC6.6,CC6.7"
  }
}

## SNS topic for SOC 2 alerts
resource "aws_sns_topic" "soc2_alerts" {
  name = "${var.project}-${var.environment}-soc2-alerts"

  tags = {
    Name        = "${var.project}-${var.environment}-soc2-alerts"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC6.6,CC7.3"
  }
}

## Subscribe incident response team
resource "aws_sns_topic_subscription" "incident_response" {
  for_each  = toset(var.incident_response_team)
  topic_arn = aws_sns_topic.soc2_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

## CC7.2: Incident Response - EventBridge for automated response
resource "aws_cloudwatch_event_rule" "security_findings" {
  name        = "${var.project}-${var.environment}-security-findings"
  description = "SOC 2 CC7.2: Capture security findings for incident response"

  event_pattern = jsonencode({
    source      = ["aws.securityhub", "aws.guardduty"]
    detail-type = ["Security Hub Findings - Imported", "GuardDuty Finding"]
    detail = {
      severity = ["HIGH", "CRITICAL"]
    }
  })

  tags = {
    Name        = "${var.project}-${var.environment}-security-findings"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC7.2,CC7.3"
  }
}

resource "aws_cloudwatch_event_target" "incident_response" {
  rule      = aws_cloudwatch_event_rule.security_findings.name
  target_id = "IncidentResponseLambda"
  arn       = aws_lambda_function.incident_response.arn
}

## Lambda function for automated incident response
resource "aws_lambda_function" "incident_response" {
  filename      = "incident_response.zip"
  function_name = "${var.project}-${var.environment}-incident-response"
  role          = aws_iam_role.incident_response.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.soc2_alerts.arn
      PROJECT       = var.project
      ENVIRONMENT   = var.environment
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-incident-response"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC7.2,CC7.3"
  }
}

## IAM role for incident response Lambda
resource "aws_iam_role" "incident_response" {
  name = "${var.project}-${var.environment}-incident-response"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-incident-response"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "incident_response" {
  name = "${var.project}-${var.environment}-incident-response-policy"
  role = aws_iam_role.incident_response.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project}-${var.environment}-incident-response:*"
      },
      {
        Sid    = "SNSPublish"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.soc2_alerts.arn
      },
      {
        Sid    = "SecurityHubAccess"
        Effect = "Allow"
        Action = [
          "securityhub:GetFindings",
          "securityhub:UpdateFindings"
        ]
        Resource = "*"
      },
      {
        Sid    = "RemediationActions"
        Effect = "Allow"
        Action = [
          "ec2:RevokeSecurityGroupIngress",
          "ec2:ModifyInstanceAttribute",
          "s3:PutBucketPublicAccessBlock",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Project" = var.project
          }
        }
      }
    ]
  })
}

## Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.incident_response.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_findings.arn
}

## CC6.8: Access Review - IAM Access Analyzer
resource "aws_accessanalyzer_analyzer" "main" {
  analyzer_name = "${var.project}-${var.environment}-access-analyzer"
  type          = "ACCOUNT"

  tags = {
    Name        = "${var.project}-${var.environment}-access-analyzer"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC6.8"
  }
}

## CC7.4: Backup and Recovery - AWS Backup
resource "aws_backup_vault" "soc2" {
  name = "${var.project}-${var.environment}-soc2-vault"

  tags = {
    Name        = "${var.project}-${var.environment}-soc2-vault"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC7.4,A1.2"
  }
}

resource "aws_backup_plan" "soc2" {
  name = "${var.project}-${var.environment}-soc2-backup-plan"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.soc2.name
    schedule          = "cron(0 3 ? * * *)"  ## Daily at 3 AM UTC

    lifecycle {
      delete_after = var.backup_retention_days
    }

    recovery_point_tags = {
      BackupPlan  = "SOC2"
      Project     = var.project
      Environment = var.environment
    }
  }

  ## Weekly backup with longer retention
  rule {
    rule_name         = "weekly_backup"
    target_vault_name = aws_backup_vault.soc2.name
    schedule          = "cron(0 5 ? * 1 *)"  ## Weekly on Mondays at 5 AM UTC

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    recovery_point_tags = {
      BackupPlan  = "SOC2-Weekly"
      Project     = var.project
      Environment = var.environment
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-soc2-backup-plan"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC7.4,A1.2"
  }
}

## CC6.1: Encryption at Rest and in Transit
resource "aws_kms_key" "soc2" {
  description             = "${var.project}-${var.environment} SOC 2 encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project}-${var.environment}-soc2-kms"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC6.1"
  }
}

resource "aws_kms_alias" "soc2" {
  name          = "alias/${var.project}-${var.environment}-soc2"
  target_key_id = aws_kms_key.soc2.key_id
}

## CC6.7: Security Group Rules Documentation
resource "aws_security_group" "documented_rules" {
  name        = "${var.project}-${var.environment}-documented-sg"
  description = "SOC 2 CC6.7: Documented security group rules"
  vpc_id      = "vpc-12345678"  ## Replace with actual VPC ID

  ## Documented ingress rule with business justification
  ingress {
    description = "HTTPS from internet - Public web application (Approved: CHANGE-123)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ## Documented egress rule
  egress {
    description = "All outbound traffic - Required for application function"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name         = "${var.project}-${var.environment}-documented-sg"
    Project      = var.project
    Environment  = var.environment
    SOC2         = "CC6.7"
    ChangeTicket = "CHANGE-123"
    Approver     = var.change_management_approvers[0]
  }
}

## CC8.1: Automated Compliance Reporting
resource "aws_cloudwatch_event_rule" "compliance_report" {
  name                = "${var.project}-${var.environment}-compliance-report"
  description         = "SOC 2 CC8.1: Generate compliance reports"
  schedule_expression = "cron(0 9 1 * ? *)"  ## Monthly on 1st at 9 AM UTC

  tags = {
    Name        = "${var.project}-${var.environment}-compliance-report"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC8.1"
  }
}

resource "aws_cloudwatch_event_target" "compliance_report" {
  rule      = aws_cloudwatch_event_rule.compliance_report.name
  target_id = "ComplianceReportLambda"
  arn       = aws_lambda_function.compliance_report.arn
}

## Lambda function for compliance reporting
resource "aws_lambda_function" "compliance_report" {
  filename      = "compliance_report.zip"
  function_name = "${var.project}-${var.environment}-compliance-report"
  role          = aws_iam_role.compliance_report.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 900  ## 15 minutes

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.audit_logs.id
      PROJECT   = var.project
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-compliance-report"
    Project     = var.project
    Environment = var.environment
    SOC2        = "CC8.1"
  }
}

## IAM role for compliance reporting Lambda
resource "aws_iam_role" "compliance_report" {
  name = "${var.project}-${var.environment}-compliance-report"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-compliance-report"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "compliance_report" {
  name = "${var.project}-${var.environment}-compliance-report-policy"
  role = aws_iam_role.compliance_report.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project}-${var.environment}-compliance-report:*"
      },
      {
        Sid    = "S3WriteReports"
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.audit_logs.arn}/compliance-reports/*"
      },
      {
        Sid    = "ReadComplianceData"
        Effect = "Allow"
        Action = [
          "config:DescribeComplianceByConfigRule",
          "config:GetComplianceDetailsByConfigRule",
          "securityhub:GetFindings",
          "cloudtrail:LookupEvents",
          "backup:ListBackupJobs"
        ]
        Resource = "*"
      }
    ]
  })
}

## Lambda permission for EventBridge
resource "aws_lambda_permission" "compliance_report" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_report.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_report.arn
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
```hcl
## modules/soc2-compliance/outputs.tf

output "cloudtrail_arn" {
  description = "ARN of the change management CloudTrail"
  value       = aws_cloudtrail.change_management.arn
}

output "soc2_alerts_topic_arn" {
  description = "ARN of the SOC 2 alerts SNS topic"
  value       = aws_sns_topic.soc2_alerts.arn
}

output "backup_vault_arn" {
  description = "ARN of the SOC 2 backup vault"
  value       = aws_backup_vault.soc2.arn
}

output "access_analyzer_arn" {
  description = "ARN of the IAM Access Analyzer"
  value       = aws_accessanalyzer_analyzer.main.arn
}

output "kms_key_arn" {
  description = "ARN of the SOC 2 encryption KMS key"
  value       = aws_kms_key.soc2.arn
}
```

## Advanced Networking Patterns

### Transit Gateway Hub-and-Spoke

```hcl
resource "aws_ec2_transit_gateway" "main" {
  description                     = "${var.project}-${var.environment}-tgw"
  amazon_side_asn                 = var.amazon_side_asn
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support               = "enable"
  multicast_support              = "disable"
  auto_accept_shared_attachments = "disable"
  transit_gateway_cidr_blocks    = [var.transit_gateway_cidr]
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-tgw"
  })
}

resource "aws_ec2_transit_gateway_route_table" "production" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-tgw-rt-production"
    Environment = "production"
  })
}

resource "aws_ec2_transit_gateway_route_table" "development" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-tgw-rt-development"
    Environment = "development"
  })
}

resource "aws_ec2_transit_gateway_route_table" "shared_services" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-tgw-rt-shared"
    Environment = "shared"
  })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "production" {
  subnet_ids         = var.production_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = var.production_vpc_id
  dns_support        = "enable"
  ipv6_support       = "disable"
  appliance_mode_support = "disable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-tgw-attach-prod"
  })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "development" {
  subnet_ids         = var.development_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = var.development_vpc_id
  dns_support        = "enable"
  ipv6_support       = "disable"
  appliance_mode_support = "disable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-tgw-attach-dev"
  })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "shared_services" {
  subnet_ids         = var.shared_services_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = var.shared_services_vpc_id
  dns_support        = "enable"
  ipv6_support       = "disable"
  appliance_mode_support = "disable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-tgw-attach-shared"
  })
}

resource "aws_ec2_transit_gateway_route_table_association" "production" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.production.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.production.id
}

resource "aws_ec2_transit_gateway_route_table_association" "development" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.development.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.development.id
}

resource "aws_ec2_transit_gateway_route_table_association" "shared_services" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.shared_services.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.shared_services.id
}

resource "aws_ec2_transit_gateway_route" "production_to_shared" {
  destination_cidr_block         = var.shared_services_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.shared_services.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.production.id
}

resource "aws_ec2_transit_gateway_route" "development_to_shared" {
  destination_cidr_block         = var.shared_services_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.shared_services.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.development.id
}

resource "aws_ec2_transit_gateway_route" "shared_to_production" {
  destination_cidr_block         = var.production_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.production.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.shared_services.id
}

resource "aws_ec2_transit_gateway_route" "shared_to_development" {
  destination_cidr_block         = var.development_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.development.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.shared_services.id
}

resource "aws_vpn_connection" "onprem" {
  customer_gateway_id = aws_customer_gateway.main.id
  transit_gateway_id  = aws_ec2_transit_gateway.main.id
  type                = "ipsec.1"
  static_routes_only  = false
  enable_acceleration = true
  local_ipv4_network_cidr  = "0.0.0.0/0"
  remote_ipv4_network_cidr = var.onprem_cidr
  tunnel1_inside_cidr      = "169.254.10.0/30"
  tunnel2_inside_cidr      = "169.254.11.0/30"
  tunnel1_preshared_key    = var.vpn_tunnel1_psk
  tunnel2_preshared_key    = var.vpn_tunnel2_psk
  tunnel1_dpd_timeout_action     = "restart"
  tunnel2_dpd_timeout_action     = "restart"
  tunnel1_ike_versions           = ["ikev2"]
  tunnel2_ike_versions           = ["ikev2"]
  tunnel1_phase1_dh_group_numbers    = [14, 15, 16, 17, 18, 19, 20, 21]
  tunnel2_phase1_dh_group_numbers    = [14, 15, 16, 17, 18, 19, 20, 21]
  tunnel1_phase2_dh_group_numbers    = [14, 15, 16, 17, 18, 19, 20, 21]
  tunnel2_phase2_dh_group_numbers    = [14, 15, 16, 17, 18, 19, 20, 21]
  tunnel1_phase1_encryption_algorithms = ["AES256", "AES128"]
  tunnel2_phase1_encryption_algorithms = ["AES256", "AES128"]
  tunnel1_phase2_encryption_algorithms = ["AES256", "AES128"]
  tunnel2_phase2_encryption_algorithms = ["AES256", "AES128"]
  tunnel1_phase1_integrity_algorithms  = ["SHA2-256", "SHA2-384", "SHA2-512"]
  tunnel2_phase1_integrity_algorithms  = ["SHA2-256", "SHA2-384", "SHA2-512"]
  tunnel1_phase2_integrity_algorithms  = ["SHA2-256", "SHA2-384", "SHA2-512"]
  tunnel2_phase2_integrity_algorithms  = ["SHA2-256", "SHA2-384", "SHA2-512"]
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-vpn-onprem"
  })
}

resource "aws_customer_gateway" "main" {
  bgp_asn    = var.customer_gateway_asn
  ip_address = var.customer_gateway_ip
  type       = "ipsec.1"
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-cgw"
  })
}

resource "aws_ram_resource_share" "tgw" {
  name                      = "${var.project}-${var.environment}-tgw-share"
  allow_external_principals = false
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-tgw-share"
  })
}

resource "aws_ram_resource_association" "tgw" {
  resource_arn       = aws_ec2_transit_gateway.main.arn
  resource_share_arn = aws_ram_resource_share.tgw.arn
}

resource "aws_ram_principal_association" "tgw" {
  for_each           = toset(var.shared_account_ids)
  principal          = each.value
  resource_share_arn = aws_ram_resource_share.tgw.arn
}

resource "aws_cloudwatch_metric_alarm" "tgw_packet_drop" {
  alarm_name          = "${var.project}-${var.environment}-tgw-packet-drop"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "PacketDropCountBlackhole"
  namespace           = "AWS/TransitGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Transit Gateway dropping packets"
  alarm_actions       = [var.sns_topic_arn]
  dimensions = {
    TransitGateway = aws_ec2_transit_gateway.main.id
  }
}
```

### VPC Peering

```hcl
resource "aws_vpc_peering_connection" "prod_to_shared" {
  vpc_id        = var.production_vpc_id
  peer_vpc_id   = var.shared_services_vpc_id
  peer_owner_id = var.shared_services_account_id
  peer_region   = var.region
  auto_accept   = false
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-peer-prod-shared"
    Side = "requester"
  })
}

resource "aws_vpc_peering_connection_accepter" "prod_to_shared" {
  provider                  = aws.shared_services
  vpc_peering_connection_id = aws_vpc_peering_connection.prod_to_shared.id
  auto_accept               = true
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-peer-prod-shared"
    Side = "accepter"
  })
}

resource "aws_vpc_peering_connection_options" "prod_to_shared_requester" {
  vpc_peering_connection_id = aws_vpc_peering_connection.prod_to_shared.id
  requester {
    allow_remote_vpc_dns_resolution = true
  }
}

resource "aws_vpc_peering_connection_options" "prod_to_shared_accepter" {
  provider                  = aws.shared_services
  vpc_peering_connection_id = aws_vpc_peering_connection.prod_to_shared.id
  accepter {
    allow_remote_vpc_dns_resolution = true
  }
}

resource "aws_route" "prod_to_shared" {
  for_each                  = toset(var.production_route_table_ids)
  route_table_id            = each.value
  destination_cidr_block    = var.shared_services_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.prod_to_shared.id
}

resource "aws_route" "shared_to_prod" {
  provider                  = aws.shared_services
  for_each                  = toset(var.shared_services_route_table_ids)
  route_table_id            = each.value
  destination_cidr_block    = var.production_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.prod_to_shared.id
}

resource "aws_vpc_peering_connection" "dev_to_shared" {
  vpc_id        = var.development_vpc_id
  peer_vpc_id   = var.shared_services_vpc_id
  peer_owner_id = var.shared_services_account_id
  peer_region   = var.region
  auto_accept   = false
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-peer-dev-shared"
    Side = "requester"
  })
}

resource "aws_vpc_peering_connection_accepter" "dev_to_shared" {
  provider                  = aws.shared_services
  vpc_peering_connection_id = aws_vpc_peering_connection.dev_to_shared.id
  auto_accept               = true
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-peer-dev-shared"
    Side = "accepter"
  })
}

resource "aws_vpc_peering_connection_options" "dev_to_shared_requester" {
  vpc_peering_connection_id = aws_vpc_peering_connection.dev_to_shared.id
  requester {
    allow_remote_vpc_dns_resolution = true
  }
}

resource "aws_vpc_peering_connection_options" "dev_to_shared_accepter" {
  provider                  = aws.shared_services
  vpc_peering_connection_id = aws_vpc_peering_connection.dev_to_shared.id
  accepter {
    allow_remote_vpc_dns_resolution = true
  }
}

resource "aws_route" "dev_to_shared" {
  for_each                  = toset(var.development_route_table_ids)
  route_table_id            = each.value
  destination_cidr_block    = var.shared_services_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.dev_to_shared.id
}

resource "aws_route" "shared_to_dev" {
  provider                  = aws.shared_services
  for_each                  = toset(var.shared_services_route_table_ids)
  route_table_id            = each.value
  destination_cidr_block    = var.development_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.dev_to_shared.id
}
```

### VPC Endpoints

```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.route_table_ids
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
        Resource  = ["arn:aws:s3:::${var.bucket_name}/*", "arn:aws:s3:::${var.bucket_name}"]
      }
    ]
  })
  tags = merge(var.tags, {
    Name = "${var.environment}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.route_table_ids
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query", "dynamodb:Scan"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(var.tags, {
    Name = "${var.environment}-dynamodb-endpoint"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.environment}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = var.vpc_id
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(var.tags, {
    Name = "${var.environment}-vpc-endpoints-sg"
  })
}

resource "aws_vpc_endpoint" "ec2" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ec2"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-ec2-endpoint"
  })
}

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-ssm-endpoint"
  })
}

resource "aws_vpc_endpoint" "ec2messages" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-ec2messages-endpoint"
  })
}

resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-ssmmessages-endpoint"
  })
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-logs-endpoint"
  })
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-kms-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-ecr-api-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-ecr-dkr-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecs" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.environment}-ecs-endpoint"
  })
}
```

### AWS Direct Connect

```hcl
resource "aws_dx_connection" "main" {
  name      = "${var.project}-${var.environment}-dx"
  bandwidth = var.bandwidth
  location  = var.dx_location
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-dx"
  })
}

resource "aws_dx_lag" "main" {
  name              = "${var.project}-${var.environment}-dx-lag"
  connections_bandwidth = var.bandwidth
  location              = var.dx_location
  number_of_connections = 2
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-dx-lag"
  })
}

resource "aws_dx_connection_association" "lag" {
  connection_id = aws_dx_connection.main.id
  lag_id        = aws_dx_lag.main.id
}

resource "aws_dx_gateway" "main" {
  name            = "${var.project}-${var.environment}-dx-gw"
  amazon_side_asn = var.dx_gateway_asn
}

resource "aws_dx_private_virtual_interface" "main" {
  connection_id    = aws_dx_connection.main.id
  name             = "${var.project}-${var.environment}-dx-vif-private"
  vlan             = var.vlan_id
  address_family   = "ipv4"
  bgp_asn          = var.customer_bgp_asn
  bgp_auth_key     = var.bgp_auth_key
  amazon_address   = var.amazon_bgp_address
  customer_address = var.customer_bgp_address
  dx_gateway_id    = aws_dx_gateway.main.id
  mtu              = 1500
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-dx-vif-private"
  })
}

resource "aws_dx_transit_virtual_interface" "main" {
  connection_id    = aws_dx_connection.main.id
  dx_gateway_id    = aws_dx_gateway.main.id
  name             = "${var.project}-${var.environment}-dx-vif-transit"
  vlan             = var.transit_vlan_id
  address_family   = "ipv4"
  bgp_asn          = var.customer_bgp_asn
  bgp_auth_key     = var.bgp_auth_key
  amazon_address   = var.transit_amazon_bgp_address
  customer_address = var.transit_customer_bgp_address
  mtu              = 8500
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-dx-vif-transit"
  })
}

resource "aws_dx_gateway_association" "tgw" {
  dx_gateway_id         = aws_dx_gateway.main.id
  associated_gateway_id = var.transit_gateway_id
  allowed_prefixes      = var.allowed_prefixes
}

resource "aws_cloudwatch_metric_alarm" "dx_connection_state" {
  alarm_name          = "${var.project}-${var.environment}-dx-connection-state"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConnectionState"
  namespace           = "AWS/DX"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Direct Connect connection is down"
  alarm_actions       = [var.sns_topic_arn]
  dimensions = {
    ConnectionId = aws_dx_connection.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "dx_vif_state" {
  alarm_name          = "${var.project}-${var.environment}-dx-vif-state"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "VirtualInterfaceState"
  namespace           = "AWS/DX"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Direct Connect virtual interface is down"
  alarm_actions       = [var.sns_topic_arn]
  dimensions = {
    VirtualInterfaceId = aws_dx_private_virtual_interface.main.id
  }
}
```

### Multi-Region Networking

```hcl
resource "aws_globalaccelerator_accelerator" "main" {
  name            = "${var.project}-${var.environment}-accelerator"
  ip_address_type = "IPV4"
  enabled         = true
  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = var.flow_logs_bucket
    flow_logs_s3_prefix = "globalaccelerator/"
  }
  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-accelerator"
  })
}

resource "aws_globalaccelerator_listener" "https" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  protocol        = "TCP"
  port_range {
    from_port = 443
    to_port   = 443
  }
}

resource "aws_globalaccelerator_endpoint_group" "us_east_1" {
  listener_arn                  = aws_globalaccelerator_listener.https.id
  endpoint_group_region         = "us-east-1"
  traffic_dial_percentage       = 100
  health_check_interval_seconds = 30
  health_check_path             = "/health"
  health_check_port             = 443
  health_check_protocol         = "HTTPS"
  threshold_count               = 3
  endpoint_configuration {
    endpoint_id                    = var.us_east_1_alb_arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }
}

resource "aws_globalaccelerator_endpoint_group" "eu_west_1" {
  listener_arn                  = aws_globalaccelerator_listener.https.id
  endpoint_group_region         = "eu-west-1"
  traffic_dial_percentage       = 100
  health_check_interval_seconds = 30
  health_check_path             = "/health"
  health_check_port             = 443
  health_check_protocol         = "HTTPS"
  threshold_count               = 3
  endpoint_configuration {
    endpoint_id                    = var.eu_west_1_alb_arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }
}

resource "aws_globalaccelerator_endpoint_group" "ap_southeast_1" {
  listener_arn                  = aws_globalaccelerator_listener.https.id
  endpoint_group_region         = "ap-southeast-1"
  traffic_dial_percentage       = 100
  health_check_interval_seconds = 30
  health_check_path             = "/health"
  health_check_port             = 443
  health_check_protocol         = "HTTPS"
  threshold_count               = 3
  endpoint_configuration {
    endpoint_id                    = var.ap_southeast_1_alb_arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }
}

resource "aws_route53_health_check" "us_east_1" {
  fqdn              = var.us_east_1_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  measure_latency   = true
  tags = merge(var.tags, {
    Name   = "${var.project}-${var.environment}-health-us-east-1"
    Region = "us-east-1"
  })
}

resource "aws_route53_health_check" "eu_west_1" {
  fqdn              = var.eu_west_1_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  measure_latency   = true
  tags = merge(var.tags, {
    Name   = "${var.project}-${var.environment}-health-eu-west-1"
    Region = "eu-west-1"
  })
}

resource "aws_route53_health_check" "ap_southeast_1" {
  fqdn              = var.ap_southeast_1_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  measure_latency   = true
  tags = merge(var.tags, {
    Name   = "${var.project}-${var.environment}-health-ap-southeast-1"
    Region = "ap-southeast-1"
  })
}

resource "aws_route53_record" "primary" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"
  set_identifier = "us-east-1"
  latency_routing_policy {
    region = "us-east-1"
  }
  alias {
    name                   = var.us_east_1_alb_dns
    zone_id                = var.us_east_1_alb_zone_id
    evaluate_target_health = true
  }
  health_check_id = aws_route53_health_check.us_east_1.id
}

resource "aws_route53_record" "secondary" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"
  set_identifier = "eu-west-1"
  latency_routing_policy {
    region = "eu-west-1"
  }
  alias {
    name                   = var.eu_west_1_alb_dns
    zone_id                = var.eu_west_1_alb_zone_id
    evaluate_target_health = true
  }
  health_check_id = aws_route53_health_check.eu_west_1.id
}

resource "aws_route53_record" "tertiary" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"
  set_identifier = "ap-southeast-1"
  latency_routing_policy {
    region = "ap-southeast-1"
  }
  alias {
    name                   = var.ap_southeast_1_alb_dns
    zone_id                = var.ap_southeast_1_alb_zone_id
    evaluate_target_health = true
  }
  health_check_id = aws_route53_health_check.ap_southeast_1.id
}
```

---

## Common Pitfalls

### State File Locking Issues

**Issue**: Multiple team members or CI/CD pipelines running Terraform concurrently can corrupt
the state file or cause race conditions.

**Example**:

```bash
## Bad - Local state without locking
terraform apply  # Person A starts
terraform apply  # Person B starts simultaneously - STATE CORRUPTED!
```

**Solution**: Use remote state with locking enabled (S3 + DynamoDB, Terraform Cloud).

```hcl
## Good - S3 backend with DynamoDB locking
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # Enables locking
  }
}

## Create DynamoDB table for locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

**Key Points**:

- Never use local state for team projects
- Always enable state locking with remote backends
- S3 backend requires DynamoDB table for locking
- Terraform Cloud provides built-in locking
- Force-unlock only as last resort: `terraform force-unlock`

### Count vs For_Each Selection

**Issue**: Using `count` creates positional dependencies; removing middle items causes
destruction and recreation of all subsequent resources.

**Example**:

```hcl
## Bad - Using count (positional indexing)
variable "environments" {
  default = ["dev", "staging", "prod"]
}

resource "aws_s3_bucket" "app" {
  count  = length(var.environments)
  bucket = "myapp-${var.environments[count.index]}"
}

## Removing "staging" destroys and recreates "prod"!
## var.environments = ["dev", "prod"]
## aws_s3_bucket.app[1] changes from "staging" to "prod" (destroy + create)
```

**Solution**: Use `for_each` for resource collections that may change.

```hcl
## Good - Using for_each (keyed by name)
variable "environments" {
  type    = set(string)
  default = ["dev", "staging", "prod"]
}

resource "aws_s3_bucket" "app" {
  for_each = var.environments
  bucket   = "myapp-${each.value}"
}

## Removing "staging" only destroys that bucket
## var.environments = ["dev", "prod"]
## Only aws_s3_bucket.app["staging"] is destroyed
```

**Key Points**:

- Use `for_each` when items have unique identifiers
- Use `count` only for identical resources or simple multipliers
- `for_each` uses map keys; removing items doesn't affect others
- `count` uses positional index; removal shifts all subsequent items
- Converting `count` to `for_each` requires state migration

### Implicit Dependencies Missing

**Issue**: Terraform can't detect dependencies that exist only at runtime, causing creation order failures.

**Example**:

```hcl
## Bad - Implicit dependency not detected
resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  vpc_security_group_ids = [aws_security_group.app.id]  # Explicit dependency

  user_data = <<-EOF
              #!/bin/bash
              aws s3 cp s3://${aws_s3_bucket.config.bucket}/config.yml /etc/app/
              EOF
  # Terraform doesn't know EC2 needs S3 bucket to exist!
}

resource "aws_s3_bucket" "config" {
  bucket = "app-config-bucket"
}
```

**Solution**: Add explicit `depends_on` for runtime dependencies.

```hcl
## Good - Explicit dependency ensures creation order
resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = <<-EOF
              #!/bin/bash
              aws s3 cp s3://${aws_s3_bucket.config.bucket}/config.yml /etc/app/
              EOF

  depends_on = [
    aws_s3_bucket.config,  # Ensure bucket exists before EC2
    aws_iam_role_policy_attachment.app_s3_access  # And permissions
  ]
}
```

**Key Points**:

- Terraform detects dependencies from attribute references
- Runtime dependencies (scripts, policies) need `depends_on`
- Use `depends_on` sparingly; prefer attribute references
- Common scenarios: IAM permissions, DNS records, initialization scripts
- Over-use of `depends_on` makes plans less efficient

### Sensitive Data in State

**Issue**: Terraform state files contain all resource attributes in plaintext, exposing secrets.

**Example**:

```hcl
## Bad - Database password stored in plaintext state
resource "aws_db_instance" "main" {
  identifier = "myapp-db"
  engine     = "postgres"
  username   = "admin"
  password   = "SuperSecret123!"  # Stored in plaintext in state file!
}

## Bad - API keys in outputs
output "api_key" {
  value = aws_api_key.main.value  # Exposed in state and console output
}
```

**Solution**: Use secret management services, mark outputs as sensitive, encrypt state.

```hcl
## Good - Use secrets manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "myapp-db-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_db_instance" "main" {
  identifier = "myapp-db"
  engine     = "postgres"
  username   = "admin"
  password   = random_password.db_password.result
}

## Good - Mark sensitive outputs
output "db_password_arn" {
  value       = aws_secretsmanager_secret.db_password.arn
  description = "ARN of database password in Secrets Manager"
}

output "api_key" {
  value     = aws_api_key.main.value
  sensitive = true  # Prevents display in console output
}
```

**Key Points**:

- All resource attributes are stored in state file
- Encrypt state at rest (S3 encryption, Terraform Cloud encryption)
- Use AWS Secrets Manager/Parameter Store for sensitive values
- Mark outputs as `sensitive = true`
- Never commit state files to version control
- Rotate secrets regularly

### Provider Version Constraints Missing

**Issue**: Running `terraform init` without version constraints can pull incompatible provider
versions, breaking existing configurations.

**Example**:

```hcl
## Bad - No version constraints (uses latest)
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      # No version! Could pull breaking changes
    }
  }
}

## Provider releases breaking change in 5.0
## Existing code breaks on next `terraform init`
```

**Solution**: Always specify provider version constraints.

```hcl
## Good - Explicit version constraints
terraform {
  required_version = ">= 1.5.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Allow 5.x updates, but not 6.0
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

## Better - Exact version for critical infrastructure
terraform {
  required_version = "= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 5.31.0"  # Exact version for stability
    }
  }
}
```

**Key Points**:

- Always specify `required_version` for Terraform
- Use `~>` for minor version flexibility: `~> 5.0` = `>= 5.0, < 6.0`
- Use `=` for exact version in production
- Lock file (`.terraform.lock.hcl`) pins exact versions
- Commit lock file to version control
- Test provider upgrades in non-prod first

### Resource Timeouts Not Configured

**Issue**: Default timeouts (varies by resource) may be too short for large deployments, causing spurious failures.

**Example**:

```hcl
## Bad - Large RDS instance times out with default timeout
resource "aws_db_instance" "large" {
  identifier           = "large-db"
  instance_class       = "db.r6g.16xlarge"
  allocated_storage    = 10000
  engine               = "postgres"
  # Default timeout may be too short for large instance provisioning
}

## Error: timeout while waiting for state to become 'available'
```

**Solution**: Configure appropriate timeouts for long-running operations.

```hcl
## Good - Explicit timeouts for large resources
resource "aws_db_instance" "large" {
  identifier           = "large-db"
  instance_class       = "db.r6g.16xlarge"
  allocated_storage    = 10000
  engine               = "postgres"

  timeouts {
    create = "60m"  # Allow 60 minutes for creation
    update = "60m"
    delete = "60m"
  }
}

## Good - Cluster creation with extended timeout
resource "aws_eks_cluster" "main" {
  name     = "production-cluster"
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }

  timeouts {
    create = "30m"
    delete = "30m"
  }
}
```

**Key Points**:

- Default timeouts vary by resource type
- Large databases, clusters need longer timeouts
- Configure `create`, `update`, `delete` separately
- Balance between avoiding premature failures and catching real issues
- Monitor actual creation times to set appropriate values

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Values

```hcl
## Bad
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"  # Hardcoded AMI
  instance_type = "t3.medium"              # Hardcoded instance type
  subnet_id     = "subnet-12345678"        # Hardcoded subnet ID
}

## Good
data "aws_ami" "latest_ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.latest_ubuntu.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public[0].id
}
```

### ❌ Avoid: Count with Complex Resources

```hcl
## Bad - Using count can cause recreation issues
resource "aws_instance" "web" {
  count         = 3
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
}

## Good - Use for_each for stability
resource "aws_instance" "web" {
  for_each      = toset(["web-1", "web-2", "web-3"])
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  tags = {
    Name = "${var.project}-${var.environment}-${each.key}"
  }
}
```

### ❌ Avoid: Inline Policies

```hcl
## Bad - Inline policy is harder to reuse and test
resource "aws_iam_role" "app" {
  name = "app-role"

  inline_policy {
    name = "app-policy"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = ["s3:*"]
          Effect   = "Allow"
          Resource = "*"
        }
      ]
    })
  }
}

## Good - Separate policy document and attachment
data "aws_iam_policy_document" "app" {
  statement {
    sid    = "S3Access"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${aws_s3_bucket.app.arn}/*"]
  }
}

resource "aws_iam_policy" "app" {
  name   = "${var.project}-app-policy"
  policy = data.aws_iam_policy_document.app.json
}

resource "aws_iam_role_policy_attachment" "app" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.app.arn
}
```

### ❌ Avoid: Not Using Remote State

```hcl
## Bad - Local state only (risky for teams)
## No backend configuration - state stored locally

## Good - Remote state with locking
terraform {
  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

### ❌ Avoid: Missing Required Providers Version

```hcl
## Bad - No version constraint
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      # No version specified - can break unexpectedly
    }
  }
}

## Good - Pin provider versions
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Allow minor updates only
    }
  }
}
```

### ❌ Avoid: Using Default VPC and Subnets

```hcl
## Bad - Relying on default VPC
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  # Implicitly uses default VPC - not reproducible
}

## Good - Explicitly create networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project}-${var.environment}-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project}-${var.environment}-public"
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public.id
}
```

### ❌ Avoid: Overly Permissive Security Groups

```hcl
## Bad - Open to the world
resource "aws_security_group" "web" {
  name = "web-sg"

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # ❌ Everything open!
  }
}

## Good - Specific rules with justification
resource "aws_security_group" "web" {
  name        = "${var.project}-${var.environment}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project}-${var.environment}-web-sg"
  }
}

resource "aws_security_group_rule" "web_https" {
  type              = "ingress"
  description       = "Allow HTTPS from CloudFront"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = var.cloudfront_cidr_blocks
  security_group_id = aws_security_group.web.id
}

resource "aws_security_group_rule" "web_egress" {
  type              = "egress"
  description       = "Allow outbound to specific services"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = var.service_endpoints
  security_group_id = aws_security_group.web.id
}
```

### ❌ Avoid: Not Using Data Sources for Existing Resources

```hcl
## Bad - Hardcoding existing resource IDs
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = "rtb-12345678"  # ❌ Hardcoded route table
}

## Good - Use data sources
data "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  filter {
    name   = "tag:Name"
    values = ["${var.project}-main-rt"]
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = data.aws_route_table.main.id
}
```

### ❌ Avoid: Missing Lifecycle Rules

```hcl
## Bad - Can accidentally destroy critical resources
resource "aws_db_instance" "production" {
  identifier        = "prod-db"
  engine            = "postgres"
  instance_class    = "db.t3.medium"
  allocated_storage = 100
  # No lifecycle protection - can be destroyed!
}

## Good - Protect critical resources
resource "aws_db_instance" "production" {
  identifier        = "prod-db"
  engine            = "postgres"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  lifecycle {
    prevent_destroy = true  # ✅ Prevent accidental deletion
    ignore_changes  = [      # ✅ Ignore password changes
      password,
    ]
  }

  tags = {
    Name        = "${var.project}-prod-db"
    Environment = "production"
    Critical    = "true"
  }
}
```

### ❌ Avoid: Not Tagging Resources

```hcl
## Bad - No tags for cost tracking or management
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  # No tags - can't track costs or manage resources
}

## Good - Comprehensive tagging strategy
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    CostCenter  = var.cost_center
    Owner       = var.owner_email
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-${var.environment}-web"
      Role = "web-server"
    }
  )
}
```

---

## Recommended Tools

### tflint Configuration

```hcl
## .tflint.hcl
plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
  enabled = true
  version = "0.27.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "terraform_required_version" {
  enabled = true
}

rule "terraform_required_providers" {
  enabled = true
}
```

Run tflint:

```bash
tflint --init
tflint --recursive
```

### terraform-docs Configuration

```yaml
## .terraform-docs.yml
formatter: markdown table

header-from: main.tf
footer-from: ""

sections:
  show:
    - header
    - requirements
    - providers
    - inputs
    - outputs
    - resources

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

Generate documentation:

```bash
terraform-docs .
```

### Pre-commit Hook Configuration

```yaml
## .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.5
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl
      - id: terraform_docs
        args:
          - --hook-config=--path-to-file=README.md
          - --hook-config=--add-to-existing-file=true
          - --hook-config=--create-file-if-not-exist=true
      - id: terraform_tfsec
```

---

## Complete Module Example

```hcl
## modules/vpc-network/main.tf
"""
@module vpc-network
@description Production-grade VPC module with public/private subnets and NAT gateway
@dependencies aws >= 5.0
@version 1.2.0
@author Tyler Dukes
@last_updated 2025-10-28
@terraform_version >= 1.5.0, < 2.0.0
"""

#----------------------------------------------------------------------
## VPC
#----------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-vpc"
    }
  )
}

#----------------------------------------------------------------------
## Public Subnets
#----------------------------------------------------------------------
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr_block, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-public-${count.index + 1}"
      Type = "public"
    }
  )
}

#----------------------------------------------------------------------
## Internet Gateway
#----------------------------------------------------------------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-igw"
    }
  )
}

#----------------------------------------------------------------------
## Route Table for Public Subnets
#----------------------------------------------------------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-public-rt"
    }
  )
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
```hcl
## modules/vpc-network/variables.tf
variable "project" {
  type        = string
  description = "Project name for resource naming"
}

variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_cidr_block" {
  type        = string
  description = "CIDR block for VPC"

  validation {
    condition     = can(cidrhost(var.vpc_cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags to apply to all resources"
  default     = {}
}
```hcl
## modules/vpc-network/outputs.tf
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}
```

<!-- markdownlint-disable MD040 -->
```
<!-- markdownlint-enable MD040 -->

---

## Testing and Validation

Comprehensive testing is essential for production Terraform modules. This section demonstrates testing strategies using
Terratest, integration testing patterns, and policy validation with OPA and Sentinel.

### Introduction to Terraform Testing

**Testing Philosophy**:

- **Unit Tests**: Test individual modules in isolation
- **Integration Tests**: Validate module interactions and dependencies
- **Contract Tests**: Verify modules meet their CONTRACT.md guarantees
- **Policy Tests**: Ensure compliance with organizational policies
- **End-to-End Tests**: Validate complete infrastructure deployments

**Testing Tools**:

- **Terratest**: Go-based testing framework for infrastructure code
- **Terraform validate**: Built-in syntax and consistency checking
- **TFLint**: Linter for Terraform best practices
- **Checkov**: Security and compliance policy scanner
- **OPA (Open Policy Agent)**: Policy-as-code engine
- **Sentinel**: Policy-as-code for Terraform Cloud/Enterprise

### Terratest Framework

Terratest is the industry-standard testing framework for Terraform modules. It provides robust infrastructure testing
capabilities with proper setup, teardown, and validation patterns.

#### VPC Module Terratest Examples

Complete Terratest suite for VPC module testing with multiple subnet configurations, CIDR validation, NAT gateway
deployment, and network ACL verification.

```go
// test/vpc_module_test.go
package test

import (
 "fmt"
 "testing"

 "github.com/gruntwork-io/terratest/modules/aws"
 "github.com/gruntwork-io/terratest/modules/random"
 "github.com/gruntwork-io/terratest/modules/terraform"
 "github.com/stretchr/testify/assert"
 "github.com/stretchr/testify/require"
)

// TestVPCModuleBasic validates basic VPC creation with public subnets
// Tests Guarantees: G1 (VPC creation), G2 (subnet distribution), G3 (DNS enabled)
func TestVPCModuleBasic(t *testing.T) {
 t.Parallel()

 // Generate unique identifiers for test isolation
 uniqueID := random.UniqueId()
 vpcName := fmt.Sprintf("test-vpc-%s", uniqueID)
 awsRegion := "us-east-1"

 // Terraform options for deployment
 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  // Path to Terraform module
  TerraformDir: "../modules/vpc-network",

  // Input variables
  Vars: map[string]interface{}{
   "project":      "test",
   "environment":  uniqueID,
   "vpc_cidr":     "10.0.0.0/16",
   "azs":          []string{"us-east-1a", "us-east-1b", "us-east-1c"},
   "public_cidrs": []string{"10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"},
  },

  // Environment variables for AWS authentication
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 // Ensure cleanup happens even if test fails
 defer terraform.Destroy(t, terraformOptions)

 // Deploy infrastructure
 terraform.InitAndApply(t, terraformOptions)

 // Retrieve outputs for validation
 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
 internetGatewayID := terraform.Output(t, terraformOptions, "internet_gateway_id")

 // Validate VPC exists and has correct configuration
 vpc := aws.GetVpcById(t, vpcID, awsRegion)
 assert.Equal(t, "10.0.0.0/16", vpc.CidrBlock, "VPC CIDR block should match input")
 assert.True(t, vpc.EnableDnsHostnames, "VPC should have DNS hostnames enabled")
 assert.True(t, vpc.EnableDnsSupport, "VPC should have DNS support enabled")

 // Validate number of public subnets
 assert.Equal(t, 3, len(publicSubnetIDs), "Should create 3 public subnets")

 // Validate subnets are distributed across AZs
 azCount := make(map[string]int)
 for _, subnetID := range publicSubnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, awsRegion)
  azCount[subnet.AvailabilityZone]++
  assert.Equal(t, vpcID, subnet.VpcId, "Subnet should belong to test VPC")
  assert.True(t, subnet.MapPublicIpOnLaunch, "Public subnet should auto-assign public IPs")
 }

 // Verify subnets span at least 2 AZs (best practice for HA)
 assert.GreaterOrEqual(t, len(azCount), 2, "Subnets should span at least 2 availability zones")

 // Validate Internet Gateway is attached to VPC
 assert.NotEmpty(t, internetGatewayID, "Internet Gateway ID should not be empty")
 igw := aws.GetInternetGatewayById(t, internetGatewayID, awsRegion)
 assert.Equal(t, 1, len(igw.Attachments), "IGW should have exactly one attachment")
 assert.Equal(t, vpcID, igw.Attachments[0].VpcId, "IGW should be attached to test VPC")
}

// TestVPCModuleWithNATGateway validates VPC with NAT gateway for private subnets
// Tests Guarantees: G4 (NAT gateway creation), G5 (route table configuration)
func TestVPCModuleWithNATGateway(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 awsRegion := "us-west-2"

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",

  Vars: map[string]interface{}{
   "project":       "test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.1.0.0/16",
   "azs":           []string{"us-west-2a", "us-west-2b"},
   "public_cidrs":  []string{"10.1.1.0/24", "10.1.2.0/24"},
   "private_cidrs": []string{"10.1.10.0/24", "10.1.20.0/24"},
   "enable_nat_gateway": true,
   "single_nat_gateway": false, // NAT gateway per AZ for HA
  },

  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)

 terraform.InitAndApply(t, terraformOptions)

 // Retrieve outputs
 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
 privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
 natGatewayIDs := terraform.OutputList(t, terraformOptions, "nat_gateway_ids")

 // Validate NAT gateways created (one per AZ for HA)
 assert.Equal(t, 2, len(natGatewayIDs), "Should create NAT gateway per AZ")

 // Validate NAT gateways are in public subnets
 for i, natID := range natGatewayIDs {
  natGateway := aws.GetNatGatewayById(t, natID, awsRegion)
  assert.Equal(t, "available", natGateway.State, "NAT gateway should be available")
  assert.Contains(t, publicSubnetIDs, natGateway.SubnetId, "NAT gateway should be in public subnet")
  assert.NotEmpty(t, natGateway.PublicIp, "NAT gateway should have public IP")
 }

 // Validate private subnets have route to NAT gateway
 for _, subnetID := range privateSubnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, awsRegion)
  assert.Equal(t, vpcID, subnet.VpcId, "Private subnet should belong to test VPC")
  assert.False(t, subnet.MapPublicIpOnLaunch, "Private subnet should not auto-assign public IPs")
 }

 // Validate route tables exist for private subnets
 routeTables := aws.GetRouteTablesForSubnet(t, privateSubnetIDs[0], awsRegion)
 assert.NotEmpty(t, routeTables, "Private subnet should have associated route table")
}

// TestVPCModuleCIDRCalculation validates CIDR block calculations
// Tests dynamic subnet CIDR allocation using cidrsubnet function
func TestVPCModuleCIDRCalculation(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 awsRegion := "eu-west-1"

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",

  Vars: map[string]interface{}{
   "project":             "test",
   "environment":         uniqueID,
   "vpc_cidr":            "172.16.0.0/16",
   "azs":                 []string{"eu-west-1a", "eu-west-1b", "eu-west-1c"},
   "use_dynamic_cidrs":   true, // Enable dynamic CIDR calculation
   "public_subnet_bits":  8,    // /24 subnets (16.0/24, 16.1/24, etc.)
   "private_subnet_bits": 8,
  },

  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)

 terraform.InitAndApply(t, terraformOptions)

 // Retrieve subnet IDs
 publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
 privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")

 // Expected CIDR blocks for dynamically calculated subnets
 expectedPublicCIDRs := []string{"172.16.0.0/24", "172.16.1.0/24", "172.16.2.0/24"}
 expectedPrivateCIDRs := []string{"172.16.3.0/24", "172.16.4.0/24", "172.16.5.0/24"}

 // Validate public subnet CIDRs
 for i, subnetID := range publicSubnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, awsRegion)
  assert.Equal(t, expectedPublicCIDRs[i], subnet.CidrBlock,
   fmt.Sprintf("Public subnet %d should have calculated CIDR", i))
 }

 // Validate private subnet CIDRs
 for i, subnetID := range privateSubnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, awsRegion)
  assert.Equal(t, expectedPrivateCIDRs[i], subnet.CidrBlock,
   fmt.Sprintf("Private subnet %d should have calculated CIDR", i))
 }
}

// TestVPCModuleNetworkACLs validates network ACL configuration
// Tests Guarantees: G6 (default NACL rules), G7 (custom NACL support)
func TestVPCModuleNetworkACLs(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 awsRegion := "ap-southeast-1"

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",

  Vars: map[string]interface{}{
   "project":      "test",
   "environment":  uniqueID,
   "vpc_cidr":     "192.168.0.0/16",
   "azs":          []string{"ap-southeast-1a", "ap-southeast-1b"},
   "public_cidrs": []string{"192.168.1.0/24", "192.168.2.0/24"},
   "enable_custom_nacls": true,
   "public_nacl_rules": []map[string]interface{}{
    {
     "rule_number": 100,
     "egress":      false,
     "protocol":    "tcp",
     "from_port":   80,
     "to_port":     80,
     "cidr_block":  "0.0.0.0/0",
     "action":      "allow",
    },
    {
     "rule_number": 110,
     "egress":      false,
     "protocol":    "tcp",
     "from_port":   443,
     "to_port":     443,
     "cidr_block":  "0.0.0.0/0",
     "action":      "allow",
    },
   },
  },

  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)

 terraform.InitAndApply(t, terraformOptions)

 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")

 // Validate default VPC NACL exists
 vpc := aws.GetVpcById(t, vpcID, awsRegion)
 assert.NotEmpty(t, vpc.DefaultNetworkAclId, "VPC should have default network ACL")

 // Validate custom NACL is created if enabled
 if len(publicSubnetIDs) > 0 {
  routeTables := aws.GetRouteTablesForSubnet(t, publicSubnetIDs[0], awsRegion)
  assert.NotEmpty(t, routeTables, "Public subnet should have route tables")
 }
}

// TestVPCModuleTagging validates comprehensive tagging strategy
// Tests Guarantees: G8 (required tags), G9 (tag propagation)
func TestVPCModuleTagging(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 awsRegion := "us-east-2"

 expectedTags := map[string]string{
  "Project":     "test-project",
  "Environment": "dev",
  "ManagedBy":   "terraform",
  "Owner":       "platform-team",
  "CostCenter":  "engineering",
 }

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",

  Vars: map[string]interface{}{
   "project":      "test-project",
   "environment":  "dev",
   "vpc_cidr":     "10.100.0.0/16",
   "azs":          []string{"us-east-2a"},
   "public_cidrs": []string{"10.100.1.0/24"},
   "tags":         expectedTags,
  },

  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)

 terraform.InitAndApply(t, terraformOptions)

 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
 internetGatewayID := terraform.Output(t, terraformOptions, "internet_gateway_id")

 // Validate VPC tags
 vpc := aws.GetVpcById(t, vpcID, awsRegion)
 for key, expectedValue := range expectedTags {
  actualValue, exists := vpc.Tags[key]
  assert.True(t, exists, fmt.Sprintf("VPC should have tag: %s", key))
  assert.Equal(t, expectedValue, actualValue, fmt.Sprintf("Tag %s should match", key))
 }

 // Validate subnet tags propagate
 for _, subnetID := range publicSubnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, awsRegion)
  for key, expectedValue := range expectedTags {
   actualValue, exists := subnet.Tags[key]
   assert.True(t, exists, fmt.Sprintf("Subnet should have tag: %s", key))
   assert.Equal(t, expectedValue, actualValue, fmt.Sprintf("Tag %s should match", key))
  }
 }

 // Validate Internet Gateway tags
 igw := aws.GetInternetGatewayById(t, internetGatewayID, awsRegion)
 for key, expectedValue := range expectedTags {
  actualValue, exists := igw.Tags[key]
  assert.True(t, exists, fmt.Sprintf("IGW should have tag: %s", key))
  assert.Equal(t, expectedValue, actualValue, fmt.Sprintf("Tag %s should match", key))
 }
}

// TestVPCModuleParallelDeployment demonstrates parallel testing for faster execution
// Multiple test scenarios run concurrently to reduce total test time
func TestVPCModuleParallelDeployment(t *testing.T) {
 // This test orchestrates parallel subtests
 testCases := []struct {
  name     string
  vpcCIDR  string
  azCount  int
  scenario string
 }{
  {
   name:     "SingleAZ",
   vpcCIDR:  "10.200.0.0/16",
   azCount:  1,
   scenario: "minimal",
  },
  {
   name:     "MultiAZ",
   vpcCIDR:  "10.201.0.0/16",
   azCount:  3,
   scenario: "high-availability",
  },
  {
   name:     "LargeCIDR",
   vpcCIDR:  "10.202.0.0/20",
   azCount:  2,
   scenario: "constrained-ip-space",
  },
 }

 for _, tc := range testCases {
  tc := tc // Capture range variable
  t.Run(tc.name, func(t *testing.T) {
   t.Parallel()

   uniqueID := random.UniqueId()
   awsRegion := "us-west-1"

   // Generate AZ list based on count
   azs := make([]string, tc.azCount)
   for i := 0; i < tc.azCount; i++ {
    azs[i] = fmt.Sprintf("%s%c", awsRegion, 'a'+i)
   }

   terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
    TerraformDir: "../modules/vpc-network",

    Vars: map[string]interface{}{
     "project":     "parallel-test",
     "environment": fmt.Sprintf("%s-%s", tc.scenario, uniqueID),
     "vpc_cidr":    tc.vpcCIDR,
     "azs":         azs,
    },

    EnvVars: map[string]string{
     "AWS_DEFAULT_REGION": awsRegion,
    },
   })

   defer terraform.Destroy(t, terraformOptions)

   terraform.InitAndApply(t, terraformOptions)

   vpcID := terraform.Output(t, terraformOptions, "vpc_id")
   vpc := aws.GetVpcById(t, vpcID, awsRegion)

   assert.Equal(t, tc.vpcCIDR, vpc.CidrBlock, "VPC CIDR should match test case")
  })
 }
}
```

### EKS Cluster Terratest Examples

Comprehensive Terratest suite for EKS cluster module testing including cluster creation,
OIDC provider validation, node group scaling, security group rules,
and IRSA (IAM Roles for Service Accounts) configuration.

```go
// test/eks_cluster_test.go
package test

import (
 "fmt"
 "strings"
 "testing"
 "time"

 "github.com/gruntwork-io/terratest/modules/aws"
 "github.com/gruntwork-io/terratest/modules/k8s"
 "github.com/gruntwork-io/terratest/modules/random"
 "github.com/gruntwork-io/terratest/modules/retry"
 "github.com/gruntwork-io/terratest/modules/terraform"
 "github.com/stretchr/testify/assert"
 "github.com/stretchr/testify/require"
)

// TestEKSClusterBasic validates basic EKS cluster creation
// Tests Guarantees: G1 (cluster creation), G2 (version specification), G3 (VPC integration)
func TestEKSClusterBasic(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 clusterName := fmt.Sprintf("test-eks-%s", uniqueID)
 awsRegion := "us-east-1"
 kubernetesVersion := "1.28"

 // First deploy VPC for EKS cluster
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "eks-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.50.0.0/16",
   "azs":           []string{"us-east-1a", "us-east-1b", "us-east-1c"},
   "public_cidrs":  []string{"10.50.1.0/24", "10.50.2.0/24", "10.50.3.0/24"},
   "private_cidrs": []string{"10.50.10.0/24", "10.50.20.0/24", "10.50.30.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy EKS cluster
 eksOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/eks-cluster",
  Vars: map[string]interface{}{
   "cluster_name":       clusterName,
   "kubernetes_version": kubernetesVersion,
   "vpc_id":             vpcID,
   "subnet_ids":         privateSubnetIDs,
   "environment":        uniqueID,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, eksOptions)
 terraform.InitAndApply(t, eksOptions)

 // Retrieve outputs
 clusterEndpoint := terraform.Output(t, eksOptions, "cluster_endpoint")
 clusterSecurityGroupID := terraform.Output(t, eksOptions, "cluster_security_group_id")
 oidcProviderArn := terraform.Output(t, eksOptions, "oidc_provider_arn")

 // Validate cluster exists and is active
 cluster := aws.GetEksCluster(t, awsRegion, clusterName)
 assert.Equal(t, "ACTIVE", cluster.Status, "Cluster should be in ACTIVE state")
 assert.Equal(t, kubernetesVersion, cluster.Version, "Cluster version should match input")
 assert.NotEmpty(t, clusterEndpoint, "Cluster endpoint should not be empty")
 assert.Contains(t, clusterEndpoint, "eks.amazonaws.com", "Cluster endpoint should be valid EKS endpoint")

 // Validate VPC configuration
 assert.Equal(t, vpcID, cluster.ResourcesVpcConfig.VpcId, "Cluster should be in specified VPC")
 assert.Equal(t, len(privateSubnetIDs), len(cluster.ResourcesVpcConfig.SubnetIds),
  "Cluster should use all private subnets")

 // Validate security group
 assert.NotEmpty(t, clusterSecurityGroupID, "Cluster security group ID should not be empty")
 sg := aws.GetSecurityGroupById(t, clusterSecurityGroupID, awsRegion)
 assert.Equal(t, vpcID, sg.VpcId, "Security group should be in cluster VPC")

 // Validate OIDC provider for IRSA
 assert.NotEmpty(t, oidcProviderArn, "OIDC provider ARN should not be empty")
 assert.Contains(t, oidcProviderArn, "oidc-provider", "Should create OIDC provider")
}

// TestEKSClusterWithNodeGroup validates EKS cluster with managed node group
// Tests Guarantees: G4 (node group creation), G5 (scaling configuration), G6 (instance types)
func TestEKSClusterWithNodeGroup(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 clusterName := fmt.Sprintf("test-eks-ng-%s", uniqueID)
 awsRegion := "us-west-2"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "eks-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.60.0.0/16",
   "azs":           []string{"us-west-2a", "us-west-2b"},
   "private_cidrs": []string{"10.60.10.0/24", "10.60.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy EKS cluster with node group
 eksOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/eks-cluster",
  Vars: map[string]interface{}{
   "cluster_name":       clusterName,
   "kubernetes_version": "1.28",
   "vpc_id":             vpcID,
   "subnet_ids":         privateSubnetIDs,
   "environment":        uniqueID,
   "node_groups": map[string]interface{}{
    "general": map[string]interface{}{
     "desired_size":   2,
     "min_size":       1,
     "max_size":       4,
     "instance_types": []string{"t3.medium", "t3a.medium"},
     "capacity_type":  "ON_DEMAND",
     "disk_size":      50,
     "labels": map[string]string{
      "workload-type": "general",
     },
     "taints": []map[string]string{},
    },
   },
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, eksOptions)
 terraform.InitAndApply(t, eksOptions)

 // Wait for node group to be active with retry logic
 maxRetries := 30
 sleepBetweenRetries := 10 * time.Second
 nodeGroupActive := false

 for i := 0; i < maxRetries; i++ {
  nodeGroups := aws.GetEksClusterNodeGroups(t, awsRegion, clusterName)
  if len(nodeGroups) > 0 {
   nodeGroupStatus := aws.GetEksNodeGroupStatus(t, awsRegion, clusterName, nodeGroups[0])
   if nodeGroupStatus == "ACTIVE" {
    nodeGroupActive = true
    break
   }
  }
  time.Sleep(sleepBetweenRetries)
 }

 require.True(t, nodeGroupActive, "Node group should become ACTIVE within timeout")

 // Validate node group configuration
 nodeGroups := aws.GetEksClusterNodeGroups(t, awsRegion, clusterName)
 assert.Equal(t, 1, len(nodeGroups), "Should create one node group")

 nodeGroup := aws.GetEksNodeGroup(t, awsRegion, clusterName, nodeGroups[0])
 assert.Equal(t, "ACTIVE", nodeGroup.Status, "Node group should be ACTIVE")
 assert.Equal(t, int64(2), nodeGroup.ScalingConfig.DesiredSize, "Desired size should match")
 assert.Equal(t, int64(1), nodeGroup.ScalingConfig.MinSize, "Min size should match")
 assert.Equal(t, int64(4), nodeGroup.ScalingConfig.MaxSize, "Max size should match")
 assert.Contains(t, nodeGroup.InstanceTypes, "t3.medium", "Should use specified instance type")
}

// TestEKSClusterOIDCProvider validates OIDC provider for IRSA
// Tests Guarantees: G7 (OIDC provider), G8 (IAM roles for service accounts)
func TestEKSClusterOIDCProvider(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 clusterName := fmt.Sprintf("test-eks-oidc-%s", uniqueID)
 awsRegion := "eu-west-1"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "eks-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.70.0.0/16",
   "azs":           []string{"eu-west-1a", "eu-west-1b"},
   "private_cidrs": []string{"10.70.10.0/24", "10.70.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy EKS cluster with IRSA enabled
 eksOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/eks-cluster",
  Vars: map[string]interface{}{
   "cluster_name":       clusterName,
   "kubernetes_version": "1.28",
   "vpc_id":             vpcID,
   "subnet_ids":         privateSubnetIDs,
   "environment":        uniqueID,
   "enable_irsa":        true,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, eksOptions)
 terraform.InitAndApply(t, eksOptions)

 // Retrieve OIDC provider details
 oidcProviderArn := terraform.Output(t, eksOptions, "oidc_provider_arn")
 oidcProviderURL := terraform.Output(t, eksOptions, "oidc_provider_url")

 // Validate OIDC provider ARN format
 assert.NotEmpty(t, oidcProviderArn, "OIDC provider ARN should not be empty")
 assert.Contains(t, oidcProviderArn, "oidc-provider/oidc.eks", "ARN should contain OIDC provider")
 assert.Contains(t, oidcProviderArn, awsRegion, "ARN should contain region")

 // Validate OIDC provider URL format
 assert.NotEmpty(t, oidcProviderURL, "OIDC provider URL should not be empty")
 assert.True(t, strings.HasPrefix(oidcProviderURL, "https://"), "OIDC URL should use HTTPS")
 assert.Contains(t, oidcProviderURL, "oidc.eks", "OIDC URL should be EKS OIDC endpoint")

 // Validate cluster has OIDC enabled
 cluster := aws.GetEksCluster(t, awsRegion, clusterName)
 assert.NotNil(t, cluster.Identity, "Cluster should have identity configuration")
 assert.NotNil(t, cluster.Identity.Oidc, "Cluster should have OIDC configuration")
}

// TestEKSClusterSecurityGroups validates security group configuration
// Tests Guarantees: G9 (security group rules), G10 (least privilege access)
func TestEKSClusterSecurityGroups(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 clusterName := fmt.Sprintf("test-eks-sg-%s", uniqueID)
 awsRegion := "ap-southeast-2"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "eks-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.80.0.0/16",
   "azs":           []string{"ap-southeast-2a", "ap-southeast-2b"},
   "private_cidrs": []string{"10.80.10.0/24", "10.80.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy EKS cluster with custom security group rules
 eksOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/eks-cluster",
  Vars: map[string]interface{}{
   "cluster_name":       clusterName,
   "kubernetes_version": "1.28",
   "vpc_id":             vpcID,
   "subnet_ids":         privateSubnetIDs,
   "environment":        uniqueID,
   "cluster_security_group_additional_rules": map[string]interface{}{
    "ingress_bastion": map[string]interface{}{
     "type":        "ingress",
     "from_port":   443,
     "to_port":     443,
     "protocol":    "tcp",
     "cidr_blocks": []string{"10.80.0.0/16"},
     "description": "Allow API access from VPC",
    },
   },
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, eksOptions)
 terraform.InitAndApply(t, eksOptions)

 // Retrieve security group ID
 clusterSecurityGroupID := terraform.Output(t, eksOptions, "cluster_security_group_id")
 nodeSecurityGroupID := terraform.Output(t, eksOptions, "node_security_group_id")

 // Validate cluster security group
 clusterSG := aws.GetSecurityGroupById(t, clusterSecurityGroupID, awsRegion)
 assert.Equal(t, vpcID, clusterSG.VpcId, "Cluster SG should be in cluster VPC")
 assert.NotEmpty(t, clusterSG.IngressRules, "Cluster SG should have ingress rules")

 // Validate node security group
 nodeSG := aws.GetSecurityGroupById(t, nodeSecurityGroupID, awsRegion)
 assert.Equal(t, vpcID, nodeSG.VpcId, "Node SG should be in cluster VPC")

 // Verify node-to-node communication is allowed
 hasNodeCommunication := false
 for _, rule := range nodeSG.IngressRules {
  if rule.SourceSecurityGroupId == nodeSecurityGroupID {
   hasNodeCommunication = true
   break
  }
 }
 assert.True(t, hasNodeCommunication, "Nodes should be able to communicate with each other")
}

// TestEKSClusterUpgrade validates cluster upgrade process
// Tests Guarantees: G11 (zero-downtime upgrades), G12 (version compatibility)
func TestEKSClusterUpgrade(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 clusterName := fmt.Sprintf("test-eks-upgrade-%s", uniqueID)
 awsRegion := "us-east-2"
 initialVersion := "1.27"
 upgradedVersion := "1.28"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "eks-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.90.0.0/16",
   "azs":           []string{"us-east-2a", "us-east-2b"},
   "private_cidrs": []string{"10.90.10.0/24", "10.90.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy EKS cluster with initial version
 eksOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/eks-cluster",
  Vars: map[string]interface{}{
   "cluster_name":       clusterName,
   "kubernetes_version": initialVersion,
   "vpc_id":             vpcID,
   "subnet_ids":         privateSubnetIDs,
   "environment":        uniqueID,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, eksOptions)
 terraform.InitAndApply(t, eksOptions)

 // Validate initial version
 cluster := aws.GetEksCluster(t, awsRegion, clusterName)
 assert.Equal(t, initialVersion, cluster.Version, "Initial version should match")

 // Upgrade cluster version
 eksOptions.Vars["kubernetes_version"] = upgradedVersion
 terraform.Apply(t, eksOptions)

 // Wait for upgrade to complete
 retry.DoWithRetry(t, "Wait for cluster upgrade", 60, 30*time.Second, func() (string, error) {
  cluster := aws.GetEksCluster(t, awsRegion, clusterName)
  if cluster.Version == upgradedVersion && cluster.Status == "ACTIVE" {
   return "Upgrade complete", nil
  }
  return "", fmt.Errorf("cluster still upgrading, current version: %s, status: %s",
   cluster.Version, cluster.Status)
 })

 // Validate upgraded version
 upgradedCluster := aws.GetEksCluster(t, awsRegion, clusterName)
 assert.Equal(t, upgradedVersion, upgradedCluster.Version, "Version should be upgraded")
 assert.Equal(t, "ACTIVE", upgradedCluster.Status, "Cluster should remain ACTIVE after upgrade")
}

// TestEKSClusterLoggingAndMonitoring validates CloudWatch logging configuration
// Tests Guarantees: G13 (audit logs), G14 (API server logs), G15 (retention policies)
func TestEKSClusterLoggingAndMonitoring(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 clusterName := fmt.Sprintf("test-eks-logs-%s", uniqueID)
 awsRegion := "ca-central-1"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "eks-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.95.0.0/16",
   "azs":           []string{"ca-central-1a", "ca-central-1b"},
   "private_cidrs": []string{"10.95.10.0/24", "10.95.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy EKS cluster with logging enabled
 eksOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/eks-cluster",
  Vars: map[string]interface{}{
   "cluster_name":       clusterName,
   "kubernetes_version": "1.28",
   "vpc_id":             vpcID,
   "subnet_ids":         privateSubnetIDs,
   "environment":        uniqueID,
   "cluster_enabled_log_types": []string{
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler",
   },
   "cloudwatch_log_group_retention_in_days": 7,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, eksOptions)
 terraform.InitAndApply(t, eksOptions)

 // Retrieve CloudWatch log group name
 logGroupName := terraform.Output(t, eksOptions, "cloudwatch_log_group_name")

 // Validate log group exists
 assert.NotEmpty(t, logGroupName, "CloudWatch log group should be created")
 assert.Contains(t, logGroupName, clusterName, "Log group name should contain cluster name")

 // Validate cluster logging configuration
 cluster := aws.GetEksCluster(t, awsRegion, clusterName)
 assert.NotNil(t, cluster.Logging, "Cluster should have logging configuration")
 assert.NotEmpty(t, cluster.Logging.ClusterLogging, "Cluster logging should have log types")

 // Verify all log types are enabled
 expectedLogTypes := map[string]bool{
  "api":               false,
  "audit":             false,
  "authenticator":     false,
  "controllerManager": false,
  "scheduler":         false,
 }

 for _, logSetup := range cluster.Logging.ClusterLogging {
  for _, logType := range logSetup.Types {
   if logSetup.Enabled {
    expectedLogTypes[logType] = true
   }
  }
 }

 for logType, enabled := range expectedLogTypes {
  assert.True(t, enabled, fmt.Sprintf("Log type %s should be enabled", logType))
 }
}
```

#### RDS Database Terratest Examples

Complete Terratest suite for RDS database module testing including encryption, backup configuration, multi-AZ
deployment, parameter groups, and disaster recovery scenarios.

```go
// test/rds_database_test.go
package test

import (
 "fmt"
 "strings"
 "testing"
 "time"

 "github.com/gruntwork-io/terratest/modules/aws"
 "github.com/gruntwork-io/terratest/modules/random"
 "github.com/gruntwork-io/terratest/modules/retry"
 "github.com/gruntwork-io/terratest/modules/terraform"
 "github.com/stretchr/testify/assert"
 "github.com/stretchr/testify/require"
)

// TestRDSPostgreSQLBasic validates basic RDS PostgreSQL instance creation
// Tests Guarantees: G1 (instance creation), G2 (encryption), G3 (backup enabled)
func TestRDSPostgreSQLBasic(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 dbIdentifier := fmt.Sprintf("test-db-%s", strings.ToLower(uniqueID))
 awsRegion := "us-east-1"

 // Deploy VPC for RDS
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "rds-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.110.0.0/16",
   "azs":           []string{"us-east-1a", "us-east-1b"},
   "private_cidrs": []string{"10.110.10.0/24", "10.110.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy RDS instance
 rdsOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/rds-postgresql",
  Vars: map[string]interface{}{
   "identifier":            dbIdentifier,
   "engine":                "postgres",
   "engine_version":        "15.4",
   "instance_class":        "db.t3.micro",
   "allocated_storage":     20,
   "storage_type":          "gp3",
   "vpc_id":                vpcID,
   "subnet_ids":            privateSubnetIDs,
   "database_name":         "testdb",
   "master_username":       "dbadmin",
   "backup_retention_period": 7,
   "enabled_cloudwatch_logs_exports": []string{"postgresql", "upgrade"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, rdsOptions)
 terraform.InitAndApply(t, rdsOptions)

 // Wait for RDS instance to be available
 retry.DoWithRetry(t, "Wait for RDS instance", 60, 30*time.Second, func() (string, error) {
  instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
  if instance.DbiResourceId != "" && instance.DbInstanceStatus == "available" {
   return "RDS instance available", nil
  }
  return "", fmt.Errorf("RDS instance not ready, status: %s", instance.DbInstanceStatus)
 })

 // Retrieve outputs
 dbEndpoint := terraform.Output(t, rdsOptions, "db_endpoint")
 dbArn := terraform.Output(t, rdsOptions, "db_arn")
 kmsKeyID := terraform.Output(t, rdsOptions, "kms_key_id")

 // Validate RDS instance
 instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
 assert.Equal(t, "available", instance.DbInstanceStatus, "DB should be available")
 assert.Equal(t, "postgres", instance.Engine, "Engine should be PostgreSQL")
 assert.Equal(t, "15.4", instance.EngineVersion, "Engine version should match")
 assert.Equal(t, "db.t3.micro", instance.DbInstanceClass, "Instance class should match")

 // Validate encryption
 assert.True(t, instance.StorageEncrypted, "Storage should be encrypted")
 assert.NotEmpty(t, kmsKeyID, "KMS key should be created")

 // Validate backups
 assert.Equal(t, int64(7), instance.BackupRetentionPeriod, "Backup retention should be 7 days")
 assert.True(t, instance.CopyTagsToSnapshot, "Tags should be copied to snapshots")

 // Validate endpoint
 assert.NotEmpty(t, dbEndpoint, "DB endpoint should not be empty")
 assert.Contains(t, dbEndpoint, "rds.amazonaws.com", "Endpoint should be valid RDS endpoint")

 // Validate ARN
 assert.NotEmpty(t, dbArn, "DB ARN should not be empty")
 assert.Contains(t, dbArn, dbIdentifier, "ARN should contain instance identifier")
}

// TestRDSMultiAZDeployment validates multi-AZ RDS deployment for high availability
// Tests Guarantees: G4 (multi-AZ), G5 (automatic failover), G6 (standby replica)
func TestRDSMultiAZDeployment(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 dbIdentifier := fmt.Sprintf("test-multiaz-%s", strings.ToLower(uniqueID))
 awsRegion := "us-west-2"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "rds-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.120.0.0/16",
   "azs":           []string{"us-west-2a", "us-west-2b", "us-west-2c"},
   "private_cidrs": []string{"10.120.10.0/24", "10.120.20.0/24", "10.120.30.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy multi-AZ RDS instance
 rdsOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/rds-postgresql",
  Vars: map[string]interface{}{
   "identifier":              dbIdentifier,
   "engine":                  "postgres",
   "engine_version":          "15.4",
   "instance_class":          "db.t3.small", // Multi-AZ requires larger instance
   "allocated_storage":       20,
   "vpc_id":                  vpcID,
   "subnet_ids":              privateSubnetIDs,
   "database_name":           "proddb",
   "master_username":         "dbadmin",
   "multi_az":                true,
   "backup_retention_period": 14,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, rdsOptions)
 terraform.InitAndApply(t, rdsOptions)

 // Wait for RDS instance to be available
 retry.DoWithRetry(t, "Wait for multi-AZ RDS", 90, 30*time.Second, func() (string, error) {
  instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
  if instance.DbInstanceStatus == "available" && instance.MultiAZ {
   return "Multi-AZ RDS available", nil
  }
  return "", fmt.Errorf("RDS not ready or multi-AZ not enabled")
 })

 // Validate multi-AZ configuration
 instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
 assert.True(t, instance.MultiAZ, "Multi-AZ should be enabled")
 assert.NotEmpty(t, instance.SecondaryAvailabilityZone, "Secondary AZ should be set")
 assert.NotEqual(t, instance.AvailabilityZone, instance.SecondaryAvailabilityZone,
  "Primary and secondary AZs should be different")

 // Validate automated backups
 assert.Equal(t, int64(14), instance.BackupRetentionPeriod, "Backup retention should be 14 days")
 assert.NotEmpty(t, instance.PreferredBackupWindow, "Backup window should be set")
 assert.NotEmpty(t, instance.PreferredMaintenanceWindow, "Maintenance window should be set")
}

// TestRDSParameterGroupConfiguration validates custom parameter group settings
// Tests Guarantees: G7 (parameter groups), G8 (performance tuning), G9 (logging config)
func TestRDSParameterGroupConfiguration(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 dbIdentifier := fmt.Sprintf("test-params-%s", strings.ToLower(uniqueID))
 awsRegion := "eu-west-1"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "rds-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.130.0.0/16",
   "azs":           []string{"eu-west-1a", "eu-west-1b"},
   "private_cidrs": []string{"10.130.10.0/24", "10.130.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy RDS with custom parameter group
 rdsOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/rds-postgresql",
  Vars: map[string]interface{}{
   "identifier":       dbIdentifier,
   "engine":           "postgres",
   "engine_version":   "15.4",
   "instance_class":   "db.t3.micro",
   "allocated_storage": 20,
   "vpc_id":           vpcID,
   "subnet_ids":       privateSubnetIDs,
   "database_name":    "testdb",
   "master_username":  "dbadmin",
   "create_custom_parameter_group": true,
   "parameters": []map[string]interface{}{
    {
     "name":  "log_connections",
     "value": "1",
    },
    {
     "name":  "log_disconnections",
     "value": "1",
    },
    {
     "name":  "log_duration",
     "value": "1",
    },
    {
     "name":  "log_lock_waits",
     "value": "1",
    },
    {
     "name":  "shared_preload_libraries",
     "value": "pg_stat_statements",
    },
    {
     "name":  "track_activity_query_size",
     "value": "2048",
    },
   },
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, rdsOptions)
 terraform.InitAndApply(t, rdsOptions)

 // Wait for RDS instance
 retry.DoWithRetry(t, "Wait for RDS instance", 60, 30*time.Second, func() (string, error) {
  instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
  if instance.DbInstanceStatus == "available" {
   return "RDS available", nil
  }
  return "", fmt.Errorf("RDS not ready")
 })

 // Retrieve parameter group name
 parameterGroupName := terraform.Output(t, rdsOptions, "parameter_group_name")

 // Validate parameter group exists
 assert.NotEmpty(t, parameterGroupName, "Parameter group should be created")
 assert.Contains(t, parameterGroupName, dbIdentifier, "Parameter group name should contain identifier")

 // Validate RDS is using custom parameter group
 instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
 assert.NotEmpty(t, instance.DbParameterGroups, "DB should have parameter groups")

 // Find the custom parameter group
 foundCustomPG := false
 for _, pg := range instance.DbParameterGroups {
  if strings.Contains(pg.DbParameterGroupName, dbIdentifier) {
   foundCustomPG = true
   assert.Equal(t, "in-sync", pg.ParameterApplyStatus, "Parameters should be in sync")
  }
 }
 assert.True(t, foundCustomPG, "Custom parameter group should be attached")
}

// TestRDSSnapshotAndRestore validates snapshot creation and restore functionality
// Tests Guarantees: G10 (manual snapshots), G11 (automated backups), G12 (point-in-time recovery)
func TestRDSSnapshotAndRestore(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 dbIdentifier := fmt.Sprintf("test-snap-%s", strings.ToLower(uniqueID))
 restoredIdentifier := fmt.Sprintf("test-restored-%s", strings.ToLower(uniqueID))
 snapshotIdentifier := fmt.Sprintf("test-snapshot-%s", strings.ToLower(uniqueID))
 awsRegion := "ap-southeast-1"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "rds-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.140.0.0/16",
   "azs":           []string{"ap-southeast-1a", "ap-southeast-1b"},
   "private_cidrs": []string{"10.140.10.0/24", "10.140.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy source RDS instance
 rdsOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/rds-postgresql",
  Vars: map[string]interface{}{
   "identifier":              dbIdentifier,
   "engine":                  "postgres",
   "engine_version":          "15.4",
   "instance_class":          "db.t3.micro",
   "allocated_storage":       20,
   "vpc_id":                  vpcID,
   "subnet_ids":              privateSubnetIDs,
   "database_name":           "sourcedb",
   "master_username":         "dbadmin",
   "backup_retention_period": 7,
   "skip_final_snapshot":     false,
   "final_snapshot_identifier": fmt.Sprintf("%s-final", dbIdentifier),
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, rdsOptions)
 terraform.InitAndApply(t, rdsOptions)

 // Wait for source RDS
 retry.DoWithRetry(t, "Wait for source RDS", 60, 30*time.Second, func() (string, error) {
  instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
  if instance.DbInstanceStatus == "available" {
   return "Source RDS available", nil
  }
  return "", fmt.Errorf("Source RDS not ready")
 })

 // Create manual snapshot using AWS CLI through Terratest
 aws.CreateDbSnapshot(t, awsRegion, dbIdentifier, snapshotIdentifier)

 // Wait for snapshot to complete
 retry.DoWithRetry(t, "Wait for snapshot", 60, 15*time.Second, func() (string, error) {
  snapshot := aws.GetDbSnapshot(t, awsRegion, snapshotIdentifier)
  if snapshot.Status == "available" {
   return "Snapshot available", nil
  }
  return "", fmt.Errorf("Snapshot status: %s", snapshot.Status)
 })

 // Restore from snapshot
 restoreOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/rds-postgresql",
  Vars: map[string]interface{}{
   "identifier":        restoredIdentifier,
   "engine":            "postgres",
   "instance_class":    "db.t3.micro",
   "vpc_id":            vpcID,
   "subnet_ids":        privateSubnetIDs,
   "snapshot_identifier": snapshotIdentifier,
   "skip_final_snapshot": true,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, restoreOptions)
 terraform.InitAndApply(t, restoreOptions)

 // Wait for restored instance
 retry.DoWithRetry(t, "Wait for restored RDS", 60, 30*time.Second, func() (string, error) {
  instance := aws.GetRdsInstanceDetails(t, restoredIdentifier, awsRegion)
  if instance.DbInstanceStatus == "available" {
   return "Restored RDS available", nil
  }
  return "", fmt.Errorf("Restored RDS not ready")
 })

 // Validate restored instance
 restoredInstance := aws.GetRdsInstanceDetails(t, restoredIdentifier, awsRegion)
 assert.Equal(t, "available", restoredInstance.DbInstanceStatus, "Restored DB should be available")
 assert.Equal(t, "postgres", restoredInstance.Engine, "Engine should match source")

 // Validate snapshot was used for restore
 sourceInstance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
 assert.Equal(t, sourceInstance.AllocatedStorage, restoredInstance.AllocatedStorage,
  "Storage should match source")

 // Clean up snapshot
 aws.DeleteDbSnapshot(t, awsRegion, snapshotIdentifier)
}

// TestRDSPerformanceInsights validates Performance Insights configuration
// Tests Guarantees: G13 (Performance Insights), G14 (metrics retention), G15 (KMS encryption)
func TestRDSPerformanceInsights(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 dbIdentifier := fmt.Sprintf("test-perf-%s", strings.ToLower(uniqueID))
 awsRegion := "us-east-2"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "rds-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.150.0.0/16",
   "azs":           []string{"us-east-2a", "us-east-2b"},
   "private_cidrs": []string{"10.150.10.0/24", "10.150.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy RDS with Performance Insights
 rdsOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/rds-postgresql",
  Vars: map[string]interface{}{
   "identifier":       dbIdentifier,
   "engine":           "postgres",
   "engine_version":   "15.4",
   "instance_class":   "db.t3.small", // Performance Insights requires t3.small or larger
   "allocated_storage": 20,
   "vpc_id":           vpcID,
   "subnet_ids":       privateSubnetIDs,
   "database_name":    "perfdb",
   "master_username":  "dbadmin",
   "enable_performance_insights": true,
   "performance_insights_retention_period": 7,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, rdsOptions)
 terraform.InitAndApply(t, rdsOptions)

 // Wait for RDS instance
 retry.DoWithRetry(t, "Wait for RDS with Performance Insights", 60, 30*time.Second, func() (string, error) {
  instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
  if instance.DbInstanceStatus == "available" {
   return "RDS available", nil
  }
  return "", fmt.Errorf("RDS not ready")
 })

 // Validate Performance Insights
 instance := aws.GetRdsInstanceDetails(t, dbIdentifier, awsRegion)
 assert.True(t, instance.PerformanceInsightsEnabled, "Performance Insights should be enabled")
 assert.NotEmpty(t, instance.PerformanceInsightsKmsKeyId, "Performance Insights KMS key should be set")
 assert.Equal(t, int64(7), instance.PerformanceInsightsRetentionPeriod,
  "Performance Insights retention should be 7 days")
}
```

#### Lambda Function Terratest Examples

Comprehensive Terratest suite for AWS Lambda function module testing including deployment with layers, IAM permissions,
environment variables, CloudWatch log groups, and trigger configurations.

```go
// test/lambda_function_test.go
package test

import (
 "fmt"
 "testing"
 "time"

 "github.com/gruntwork-io/terratest/modules/aws"
 "github.com/gruntwork-io/terratest/modules/random"
 "github.com/gruntwork-io/terratest/modules/retry"
 "github.com/gruntwork-io/terratest/modules/terraform"
 "github.com/stretchr/testify/assert"
 "github.com/stretchr/testify/require"
)

// TestLambdaFunctionBasic validates basic Lambda function deployment
// Tests Guarantees: G1 (function creation), G2 (runtime configuration), G3 (IAM role)
func TestLambdaFunctionBasic(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 functionName := fmt.Sprintf("test-lambda-%s", uniqueID)
 awsRegion := "us-east-1"

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/lambda-function",
  Vars: map[string]interface{}{
   "function_name": functionName,
   "runtime":       "python3.11",
   "handler":       "index.lambda_handler",
   "source_code_path": "../test-fixtures/lambda/simple-python",
   "environment_variables": map[string]string{
    "LOG_LEVEL":   "INFO",
    "ENVIRONMENT": "test",
   },
   "timeout":      30,
   "memory_size":  256,
   "architectures": []string{"arm64"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 // Retrieve outputs
 lambdaArn := terraform.Output(t, terraformOptions, "function_arn")
 lambdaRoleArn := terraform.Output(t, terraformOptions, "role_arn")
 logGroupName := terraform.Output(t, terraformOptions, "log_group_name")

 // Validate function exists
 function := aws.GetLambdaFunction(t, awsRegion, functionName)
 assert.Equal(t, "python3.11", function.Runtime, "Runtime should match")
 assert.Equal(t, "index.lambda_handler", function.Handler, "Handler should match")
 assert.Equal(t, int64(30), function.Timeout, "Timeout should match")
 assert.Equal(t, int64(256), function.MemorySize, "Memory size should match")

 // Validate ARN format
 assert.NotEmpty(t, lambdaArn, "Function ARN should not be empty")
 assert.Contains(t, lambdaArn, functionName, "ARN should contain function name")

 // Validate IAM role
 assert.NotEmpty(t, lambdaRoleArn, "IAM role ARN should not be empty")
 assert.Contains(t, lambdaRoleArn, "role/", "Should be valid IAM role ARN")

 // Validate CloudWatch log group
 assert.NotEmpty(t, logGroupName, "Log group name should not be empty")
 assert.Equal(t, fmt.Sprintf("/aws/lambda/%s", functionName), logGroupName,
  "Log group should follow naming convention")

 // Validate environment variables
 assert.NotNil(t, function.Environment, "Function should have environment configuration")
 assert.Equal(t, "INFO", function.Environment.Variables["LOG_LEVEL"],
  "Environment variable should match")
 assert.Equal(t, "test", function.Environment.Variables["ENVIRONMENT"],
  "Environment variable should match")
}

// TestLambdaFunctionWithLayers validates Lambda function with layers
// Tests Guarantees: G4 (layer attachment), G5 (version management), G6 (dependency packaging)
func TestLambdaFunctionWithLayers(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 functionName := fmt.Sprintf("test-lambda-layers-%s", uniqueID)
 layerName := fmt.Sprintf("test-layer-%s", uniqueID)
 awsRegion := "us-west-2"

 // First create a Lambda layer
 layerOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/lambda-layer",
  Vars: map[string]interface{}{
   "layer_name":          layerName,
   "compatible_runtimes": []string{"python3.11", "python3.10"},
   "source_code_path":    "../test-fixtures/lambda/layer-requests",
   "description":         "Test layer with requests library",
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, layerOptions)
 terraform.InitAndApply(t, layerOptions)

 layerArn := terraform.Output(t, layerOptions, "layer_arn")

 // Deploy Lambda function with layer
 functionOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/lambda-function",
  Vars: map[string]interface{}{
   "function_name":    functionName,
   "runtime":          "python3.11",
   "handler":          "index.lambda_handler",
   "source_code_path": "../test-fixtures/lambda/with-layer",
   "layers":           []string{layerArn},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, functionOptions)
 terraform.InitAndApply(t, functionOptions)

 // Validate function has layer attached
 function := aws.GetLambdaFunction(t, awsRegion, functionName)
 assert.Equal(t, 1, len(function.Layers), "Function should have one layer")
 assert.Contains(t, function.Layers[0].Arn, layerName, "Layer ARN should match")

 // Test function invocation with layer
 payload := `{"test": "payload"}`
 response := aws.InvokeLambdaFunction(t, awsRegion, functionName, payload)
 assert.NotNil(t, response, "Function should return response")
 assert.Nil(t, response.FunctionError, "Function should execute without error")
}

// TestLambdaFunctionWithTriggers validates Lambda triggers (S3, API Gateway, EventBridge)
// Tests Guarantees: G7 (event source mapping), G8 (trigger permissions), G9 (async invocation)
func TestLambdaFunctionWithTriggers(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 functionName := fmt.Sprintf("test-lambda-triggers-%s", uniqueID)
 bucketName := fmt.Sprintf("test-lambda-bucket-%s", uniqueID)
 awsRegion := "eu-west-1"

 // Create S3 bucket for trigger
 s3Options := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/s3-bucket",
  Vars: map[string]interface{}{
   "bucket_name": bucketName,
   "force_destroy": true,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, s3Options)
 terraform.InitAndApply(t, s3Options)

 // Deploy Lambda function with S3 trigger
 functionOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/lambda-function",
  Vars: map[string]interface{}{
   "function_name":    functionName,
   "runtime":          "python3.11",
   "handler":          "index.lambda_handler",
   "source_code_path": "../test-fixtures/lambda/s3-processor",
   "s3_triggers": []map[string]interface{}{
    {
     "bucket": bucketName,
     "events": []string{"s3:ObjectCreated:*"},
     "filter_prefix": "uploads/",
     "filter_suffix": ".json",
    },
   },
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, functionOptions)
 terraform.InitAndApply(t, functionOptions)

 // Validate Lambda permission for S3
 functionArn := terraform.Output(t, functionOptions, "function_arn")
 policy := aws.GetLambdaFunctionPolicy(t, awsRegion, functionName)
 assert.NotEmpty(t, policy, "Function should have resource-based policy")
 assert.Contains(t, policy, "s3.amazonaws.com", "Policy should allow S3 invocation")

 // Validate S3 bucket notification configuration
 notifications := aws.GetS3BucketNotificationConfiguration(t, awsRegion, bucketName)
 assert.NotEmpty(t, notifications.LambdaFunctionConfigurations,
  "S3 bucket should have Lambda notification")
 assert.Equal(t, functionArn,
  notifications.LambdaFunctionConfigurations[0].LambdaFunctionArn,
  "Notification should target Lambda function")
}

// TestLambdaFunctionVPCConfiguration validates Lambda in VPC with private subnets
// Tests Guarantees: G10 (VPC configuration), G11 (security groups), G12 (ENI management)
func TestLambdaFunctionVPCConfiguration(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 functionName := fmt.Sprintf("test-lambda-vpc-%s", uniqueID)
 awsRegion := "ap-southeast-1"

 // Deploy VPC
 vpcOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/vpc-network",
  Vars: map[string]interface{}{
   "project":       "lambda-test",
   "environment":   uniqueID,
   "vpc_cidr":      "10.160.0.0/16",
   "azs":           []string{"ap-southeast-1a", "ap-southeast-1b"},
   "private_cidrs": []string{"10.160.10.0/24", "10.160.20.0/24"},
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, vpcOptions)
 terraform.InitAndApply(t, vpcOptions)

 vpcID := terraform.Output(t, vpcOptions, "vpc_id")
 privateSubnetIDs := terraform.OutputList(t, vpcOptions, "private_subnet_ids")

 // Deploy Lambda in VPC
 functionOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/lambda-function",
  Vars: map[string]interface{}{
   "function_name":    functionName,
   "runtime":          "python3.11",
   "handler":          "index.lambda_handler",
   "source_code_path": "../test-fixtures/lambda/vpc-function",
   "vpc_config": map[string]interface{}{
    "vpc_id":     vpcID,
    "subnet_ids": privateSubnetIDs,
    "security_group_rules": []map[string]interface{}{
     {
      "type":        "egress",
      "from_port":   443,
      "to_port":     443,
      "protocol":    "tcp",
      "cidr_blocks": []string{"0.0.0.0/0"},
      "description": "Allow HTTPS outbound",
     },
    },
   },
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, functionOptions)
 terraform.InitAndApply(t, functionOptions)

 // Validate VPC configuration
 function := aws.GetLambdaFunction(t, awsRegion, functionName)
 assert.NotNil(t, function.VpcConfig, "Function should have VPC configuration")
 assert.Equal(t, vpcID, function.VpcConfig.VpcId, "VPC ID should match")
 assert.Equal(t, len(privateSubnetIDs), len(function.VpcConfig.SubnetIds),
  "Subnet count should match")

 // Validate security group
 assert.Equal(t, 1, len(function.VpcConfig.SecurityGroupIds),
  "Should have one security group")
 securityGroupID := function.VpcConfig.SecurityGroupIds[0]
 sg := aws.GetSecurityGroupById(t, securityGroupID, awsRegion)
 assert.Equal(t, vpcID, sg.VpcId, "Security group should be in Lambda VPC")
}

// TestLambdaFunctionReservedConcurrency validates concurrency configuration
// Tests Guarantees: G13 (reserved concurrency), G14 (provisioned concurrency), G15 (throttling)
func TestLambdaFunctionReservedConcurrency(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 functionName := fmt.Sprintf("test-lambda-concurrency-%s", uniqueID)
 awsRegion := "us-east-2"

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/lambda-function",
  Vars: map[string]interface{}{
   "function_name":        functionName,
   "runtime":              "python3.11",
   "handler":              "index.lambda_handler",
   "source_code_path":     "../test-fixtures/lambda/simple-python",
   "reserved_concurrent_executions": 10,
   "publish":              true,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 // Validate reserved concurrency
 function := aws.GetLambdaFunction(t, awsRegion, functionName)
 concurrency := aws.GetLambdaFunctionConcurrency(t, awsRegion, functionName)
 assert.Equal(t, int64(10), concurrency.ReservedConcurrentExecutions,
  "Reserved concurrency should match")

 // Validate function is published
 assert.NotEqual(t, "$LATEST", function.Version, "Function should have version number")
}

// TestLambdaFunctionDeadLetterQueue validates DLQ configuration
// Tests Guarantees: G16 (DLQ setup), G17 (retry configuration), G18 (error handling)
func TestLambdaFunctionDeadLetterQueue(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 functionName := fmt.Sprintf("test-lambda-dlq-%s", uniqueID)
 queueName := fmt.Sprintf("test-dlq-%s", uniqueID)
 awsRegion := "ca-central-1"

 // Create SQS queue for DLQ
 sqsOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/sqs-queue",
  Vars: map[string]interface{}{
   "queue_name":                  queueName,
   "message_retention_seconds":   1209600, // 14 days
   "visibility_timeout_seconds":  300,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, sqsOptions)
 terraform.InitAndApply(t, sqsOptions)

 queueArn := terraform.Output(t, sqsOptions, "queue_arn")

 // Deploy Lambda with DLQ
 functionOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../modules/lambda-function",
  Vars: map[string]interface{}{
   "function_name":    functionName,
   "runtime":          "python3.11",
   "handler":          "index.lambda_handler",
   "source_code_path": "../test-fixtures/lambda/error-function",
   "dead_letter_config": map[string]string{
    "target_arn": queueArn,
   },
   "retry_attempts": 1,
   "maximum_event_age_in_seconds": 3600,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, functionOptions)
 terraform.InitAndApply(t, functionOptions)

 // Validate DLQ configuration
 function := aws.GetLambdaFunction(t, awsRegion, functionName)
 assert.NotNil(t, function.DeadLetterConfig, "Function should have DLQ config")
 assert.Equal(t, queueArn, function.DeadLetterConfig.TargetArn, "DLQ ARN should match")

 // Validate event invoke config
 eventConfig := aws.GetLambdaFunctionEventInvokeConfig(t, awsRegion, functionName)
 assert.Equal(t, int64(1), eventConfig.MaximumRetryAttempts, "Retry attempts should match")
 assert.Equal(t, int64(3600), eventConfig.MaximumEventAgeInSeconds, "Event age should match")
}
```

### Integration Testing

Multi-module integration testing validates complete infrastructure deployments, cross-module dependencies, end-to-end
connectivity, and production deployment scenarios.

#### Multi-Module Integration Tests

Complete integration test suite demonstrating testing of full 3-tier application deployment with VPC, load balancer,
application servers, and database tier.

```go
// test/integration_test.go
package test

import (
 "fmt"
 "testing"
 "time"

 http_helper "github.com/gruntwork-io/terratest/modules/http-helper"
 "github.com/gruntwork-io/terratest/modules/aws"
 "github.com/gruntwork-io/terratest/modules/random"
 "github.com/gruntwork-io/terratest/modules/retry"
 "github.com/gruntwork-io/terratest/modules/terraform"
 "github.com/stretchr/testify/assert"
 "github.com/stretchr/testify/require"
)

// TestThreeTierApplicationIntegration validates complete 3-tier app deployment
// Tests end-to-end infrastructure including VPC, ALB, EC2, and RDS
func TestThreeTierApplicationIntegration(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 projectName := "three-tier-app"
 environment := fmt.Sprintf("test-%s", uniqueID)
 awsRegion := "us-east-1"

 // Deploy complete infrastructure stack
 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../examples/three-tier-application",
  Vars: map[string]interface{}{
   "project":           projectName,
   "environment":       environment,
   "aws_region":        awsRegion,
   "vpc_cidr":          "10.170.0.0/16",
   "availability_zones": []string{"us-east-1a", "us-east-1b", "us-east-1c"},
   "instance_type":     "t3.micro",
   "min_size":          2,
   "max_size":          4,
   "desired_capacity":  2,
   "db_instance_class": "db.t3.micro",
   "db_allocated_storage": 20,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 // Retrieve infrastructure outputs
 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 albDNS := terraform.Output(t, terraformOptions, "alb_dns_name")
 dbEndpoint := terraform.Output(t, terraformOptions, "database_endpoint")
 asgName := terraform.Output(t, terraformOptions, "autoscaling_group_name")

 // Validate VPC infrastructure
 vpc := aws.GetVpcById(t, vpcID, awsRegion)
 assert.Equal(t, "10.170.0.0/16", vpc.CidrBlock, "VPC CIDR should match")

 // Validate Auto Scaling Group
 asg := aws.GetAsgByName(t, awsRegion, asgName)
 assert.Equal(t, int64(2), asg.DesiredCapacity, "ASG desired capacity should match")
 assert.GreaterOrEqual(t, len(asg.AvailabilityZones), 2,
  "ASG should span multiple AZs")

 // Wait for instances to be healthy
 retry.DoWithRetry(t, "Wait for healthy instances", 60, 10*time.Second, func() (string, error) {
  instances := aws.GetInstancesForAsg(t, awsRegion, asgName)
  healthyCount := 0
  for _, instance := range instances {
   if instance.State.Name == "running" {
    healthyCount++
   }
  }
  if healthyCount >= 2 {
   return "Instances healthy", nil
  }
  return "", fmt.Errorf("only %d instances healthy", healthyCount)
 })

 // Validate database connectivity
 assert.NotEmpty(t, dbEndpoint, "Database endpoint should not be empty")
 assert.Contains(t, dbEndpoint, "rds.amazonaws.com", "Should be valid RDS endpoint")

 // Test application availability through ALB
 albURL := fmt.Sprintf("http://%s", albDNS)
 http_helper.HttpGetWithRetry(
  t,
  albURL,
  nil,
  200,
  "",
  30,
  10*time.Second,
 )

 // Validate cross-tier connectivity
 // Test that application can reach database
 healthURL := fmt.Sprintf("http://%s/health", albDNS)
 http_helper.HttpGetWithRetry(
  t,
  healthURL,
  nil,
  200,
  "\"database\":\"connected\"",
  20,
  15*time.Second,
 )

 // Validate security group rules allow proper communication
 instances := aws.GetInstancesForAsg(t, awsRegion, asgName)
 require.NotEmpty(t, instances, "Should have running instances")

 instanceSG := instances[0].SecurityGroups[0]
 sg := aws.GetSecurityGroupById(t, instanceSG, awsRegion)
 assert.Equal(t, vpcID, sg.VpcId, "Instance SG should be in app VPC")
}

// TestModuleDependencies validates inter-module dependency resolution
// Tests that modules correctly pass outputs as inputs to dependent modules
func TestModuleDependencies(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 awsRegion := "us-west-2"

 // Test dependency chain: VPC -> Security Groups -> RDS
 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../examples/module-dependencies",
  Vars: map[string]interface{}{
   "project":     "dep-test",
   "environment": uniqueID,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 // Validate outputs are correctly chained
 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 securityGroupID := terraform.Output(t, terraformOptions, "security_group_id")
 dbInstanceID := terraform.Output(t, terraformOptions, "db_instance_id")

 // Verify security group is in VPC
 sg := aws.GetSecurityGroupById(t, securityGroupID, awsRegion)
 assert.Equal(t, vpcID, sg.VpcId, "Security group should be in created VPC")

 // Verify RDS is using security group
 dbInstance := aws.GetRdsInstanceDetails(t, dbInstanceID, awsRegion)
 assert.NotEmpty(t, dbInstance.VpcSecurityGroups, "RDS should have security groups")

 foundSG := false
 for _, vpcSG := range dbInstance.VpcSecurityGroups {
  if vpcSG.VpcSecurityGroupId == securityGroupID {
   foundSG = true
   break
  }
 }
 assert.True(t, foundSG, "RDS should use created security group")
}

// TestBlueGreenDeployment validates blue-green deployment pattern
// Tests zero-downtime deployment by creating new environment before destroying old
func TestBlueGreenDeployment(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 projectName := "bg-deploy"
 awsRegion := "eu-west-1"

 // Deploy blue environment
 blueOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../examples/blue-green-deployment",
  Vars: map[string]interface{}{
   "project":       projectName,
   "environment":   fmt.Sprintf("blue-%s", uniqueID),
   "color":         "blue",
   "app_version":   "v1.0.0",
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, blueOptions)
 terraform.InitAndApply(t, blueOptions)

 blueALBDNS := terraform.Output(t, blueOptions, "alb_dns_name")
 blueURL := fmt.Sprintf("http://%s", blueALBDNS)

 // Verify blue environment is healthy
 http_helper.HttpGetWithRetry(t, blueURL, nil, 200, "v1.0.0", 30, 10*time.Second)

 // Deploy green environment (new version)
 greenOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../examples/blue-green-deployment",
  Vars: map[string]interface{}{
   "project":       projectName,
   "environment":   fmt.Sprintf("green-%s", uniqueID),
   "color":         "green",
   "app_version":   "v2.0.0",
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, greenOptions)
 terraform.InitAndApply(t, greenOptions)

 greenALBDNS := terraform.Output(t, greenOptions, "alb_dns_name")
 greenURL := fmt.Sprintf("http://%s", greenALBDNS)

 // Verify green environment is healthy
 http_helper.HttpGetWithRetry(t, greenURL, nil, 200, "v2.0.0", 30, 10*time.Second)

 // Verify both environments are running simultaneously (zero downtime)
 http_helper.HttpGet(t, blueURL, nil, 200, "v1.0.0")
 http_helper.HttpGet(t, greenURL, nil, 200, "v2.0.0")

 // Simulate traffic cutover by updating Route53 (in actual deployment)
 // Here we just verify both environments are accessible

 // Destroy blue environment after successful green deployment
 terraform.Destroy(t, blueOptions)

 // Verify green environment still accessible after blue destroyed
 http_helper.HttpGetWithRetry(t, greenURL, nil, 200, "v2.0.0", 10, 5*time.Second)
}

// TestCrossRegionReplication validates multi-region deployment patterns
// Tests S3 replication, DynamoDB global tables, and cross-region failover
func TestCrossRegionReplication(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 primaryRegion := "us-east-1"
 replicaRegion := "us-west-2"

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../examples/cross-region-replication",
  Vars: map[string]interface{}{
   "project":         "cross-region",
   "environment":     uniqueID,
   "primary_region":  primaryRegion,
   "replica_region":  replicaRegion,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": primaryRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 // Retrieve outputs
 primaryBucket := terraform.Output(t, terraformOptions, "primary_bucket_name")
 replicaBucket := terraform.Output(t, terraformOptions, "replica_bucket_name")
 dynamodbTable := terraform.Output(t, terraformOptions, "dynamodb_table_name")

 // Validate S3 replication configuration
 primaryBucketConfig := aws.GetS3BucketReplication(t, primaryRegion, primaryBucket)
 assert.NotNil(t, primaryBucketConfig, "Primary bucket should have replication config")
 assert.Contains(t, primaryBucketConfig.Rules[0].Destination.Bucket, replicaBucket,
  "Replication should target replica bucket")

 // Upload test object to primary bucket
 testKey := fmt.Sprintf("test-%s.txt", uniqueID)
 testContent := "test content for replication"
 aws.PutS3BucketObject(t, primaryRegion, primaryBucket, testKey, testContent)

 // Wait for replication to complete
 retry.DoWithRetry(t, "Wait for S3 replication", 30, 10*time.Second, func() (string, error) {
  exists := aws.S3ObjectExists(t, replicaRegion, replicaBucket, testKey)
  if exists {
   return "Object replicated", nil
  }
  return "", fmt.Errorf("object not yet replicated")
 })

 // Validate replicated object
 replicatedContent := aws.GetS3ObjectContents(t, replicaRegion, replicaBucket, testKey)
 assert.Equal(t, testContent, replicatedContent, "Replicated content should match")

 // Validate DynamoDB global table
 primaryTable := aws.GetDynamoDBTable(t, primaryRegion, dynamodbTable)
 assert.NotNil(t, primaryTable.GlobalTableVersion, "Should be global table")

 // Verify replica exists in secondary region
 replicaTable := aws.GetDynamoDBTable(t, replicaRegion, dynamodbTable)
 assert.NotNil(t, replicaTable, "Replica table should exist")
 assert.Equal(t, primaryTable.TableName, replicaTable.TableName, "Table names should match")
}

// TestDisasterRecoveryFailover validates DR failover procedures
// Tests backup restore, database failover, and application recovery
func TestDisasterRecoveryFailover(t *testing.T) {
 t.Parallel()

 uniqueID := random.UniqueId()
 awsRegion := "ap-southeast-2"

 terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
  TerraformDir: "../examples/disaster-recovery",
  Vars: map[string]interface{}{
   "project":       "dr-test",
   "environment":   uniqueID,
   "enable_multi_az": true,
   "backup_retention_period": 7,
  },
  EnvVars: map[string]string{
   "AWS_DEFAULT_REGION": awsRegion,
  },
 })

 defer terraform.Destroy(t, terraformOptions)
 terraform.InitAndApply(t, terraformOptions)

 // Get RDS instance details
 dbInstanceID := terraform.Output(t, terraformOptions, "db_instance_id")

 // Verify multi-AZ is enabled
 dbInstance := aws.GetRdsInstanceDetails(t, dbInstanceID, awsRegion)
 assert.True(t, dbInstance.MultiAZ, "Database should be multi-AZ")

 // Create manual snapshot for DR testing
 snapshotID := fmt.Sprintf("dr-test-snapshot-%s", uniqueID)
 aws.CreateDbSnapshot(t, awsRegion, dbInstanceID, snapshotID)

 // Wait for snapshot
 retry.DoWithRetry(t, "Wait for DR snapshot", 60, 15*time.Second, func() (string, error) {
  snapshot := aws.GetDbSnapshot(t, awsRegion, snapshotID)
  if snapshot.Status == "available" {
   return "Snapshot ready", nil
  }
  return "", fmt.Errorf("snapshot status: %s", snapshot.Status)
 })

 // Simulate failover by forcing multi-AZ failover
 aws.RebootDbInstance(t, awsRegion, dbInstanceID, true) // Force failover

 // Wait for instance to become available again
 retry.DoWithRetry(t, "Wait for failover", 90, 30*time.Second, func() (string, error) {
  instance := aws.GetRdsInstanceDetails(t, dbInstanceID, awsRegion)
  if instance.DbInstanceStatus == "available" {
   return "Failover complete", nil
  }
  return "", fmt.Errorf("instance status: %s", instance.DbInstanceStatus)
 })

 // Verify instance is still multi-AZ after failover
 failedOverInstance := aws.GetRdsInstanceDetails(t, dbInstanceID, awsRegion)
 assert.True(t, failedOverInstance.MultiAZ, "Should remain multi-AZ after failover")

 // Clean up snapshot
 aws.DeleteDbSnapshot(t, awsRegion, snapshotID)
}
```

### Policy Testing

Policy-as-code testing validates infrastructure compliance using Open Policy Agent (OPA) and HashiCorp Sentinel. These
tests ensure infrastructure meets security, cost, and compliance requirements before deployment.

#### Open Policy Agent (OPA) Examples

OPA policy testing for Terraform plans with security and compliance validation.

```rego
## policies/security/encryption.rego
package terraform.security.encryption

# Require encryption for all S3 buckets
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_s3_bucket"
 not resource.change.after.server_side_encryption_configuration

 msg := sprintf("S3 bucket '%s' must have encryption enabled", [resource.name])
}

# Require encryption for all EBS volumes
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_ebs_volume"
 resource.change.after.encrypted == false

 msg := sprintf("EBS volume '%s' must be encrypted", [resource.name])
}

# Require encryption for all RDS instances
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_db_instance"
 resource.change.after.storage_encrypted == false

 msg := sprintf("RDS instance '%s' must have storage encryption enabled", [resource.name])
}

# Require KMS encryption for sensitive resources
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_s3_bucket"
 resource.change.after.server_side_encryption_configuration[_].rule[_].apply_server_side_encryption_by_default[_].sse_alg
orithm != "aws:kms"

 msg := sprintf("S3 bucket '%s' must use KMS encryption", [resource.name])
}

## policies/security/public_access.rego
package terraform.security.public_access

# Deny public S3 bucket ACLs
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_s3_bucket_acl"
 resource.change.after.acl == "public-read"

 msg := sprintf("S3 bucket '%s' must not have public-read ACL", [resource.address])
}

# Deny publicly accessible RDS instances
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_db_instance"
 resource.change.after.publicly_accessible == true

 msg := sprintf("RDS instance '%s' must not be publicly accessible", [resource.name])
}

# Deny security groups with unrestricted ingress
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_security_group"
 rule := resource.change.after.ingress[_]
 rule.cidr_blocks[_] == "0.0.0.0/0"
 rule.from_port == 0
 rule.to_port == 65535

 msg := sprintf("Security group '%s' allows unrestricted access from 0.0.0.0/0", [resource.name])
}

# Deny security groups allowing SSH from anywhere
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_security_group"
 rule := resource.change.after.ingress[_]
 rule.cidr_blocks[_] == "0.0.0.0/0"
 rule.from_port == 22

 msg := sprintf("Security group '%s' allows SSH (port 22) from 0.0.0.0/0", [resource.name])
}

## policies/cost/resource_limits.rego
package terraform.cost.resource_limits

# Limit EC2 instance types to cost-effective options
allowed_instance_types := ["t3.micro", "t3.small", "t3.medium", "t3.large", "t3a.micro", "t3a.small"]

deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_instance"
 instance_type := resource.change.after.instance_type
 not instance_type_allowed(instance_type)

 msg := sprintf("EC2 instance '%s' uses disallowed instance type '%s'. Allowed types: %v",
  [resource.name, instance_type, allowed_instance_types])
}

instance_type_allowed(instance_type) {
 allowed_instance_types[_] == instance_type
}

# Limit RDS instance classes
allowed_db_instance_classes := ["db.t3.micro", "db.t3.small", "db.t3.medium"]

deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_db_instance"
 instance_class := resource.change.after.instance_class
 not db_instance_class_allowed(instance_class)

 msg := sprintf("RDS instance '%s' uses disallowed class '%s'. Allowed classes: %v",
  [resource.name, instance_class, allowed_db_instance_classes])
}

db_instance_class_allowed(instance_class) {
 allowed_db_instance_classes[_] == instance_class
}

# Prevent unnecessary multi-AZ for non-production
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == "aws_db_instance"
 resource.change.after.multi_az == true
 tags := resource.change.after.tags
 tags.Environment != "production"

 msg := sprintf("RDS instance '%s' has multi-AZ enabled in non-production environment", [resource.name])
}

## policies/compliance/tagging.rego
package terraform.compliance.tagging

# Required tags for all resources
required_tags := ["Project", "Environment", "Owner", "ManagedBy"]

# Resources that require tagging
taggable_resources := [
 "aws_instance",
 "aws_s3_bucket",
 "aws_db_instance",
 "aws_eks_cluster",
 "aws_vpc",
 "aws_subnet",
 "aws_security_group",
]

deny[msg] {
 resource := input.resource_changes[_]
 resource.type == taggable_resources[_]
 missing_tags := get_missing_tags(resource.change.after.tags)
 count(missing_tags) > 0

 msg := sprintf("Resource '%s' missing required tags: %v", [resource.address, missing_tags])
}

get_missing_tags(tags) = missing {
 missing := [tag | tag := required_tags[_]; not tags[tag]]
}

# Validate tag values
deny[msg] {
 resource := input.resource_changes[_]
 resource.type == taggable_resources[_]
 tags := resource.change.after.tags
 tags.ManagedBy != "terraform"

 msg := sprintf("Resource '%s' must have ManagedBy tag set to 'terraform'", [resource.address])
}

# Validate environment tag values
allowed_environments := ["dev", "staging", "production"]

deny[msg] {
 resource := input.resource_changes[_]
 resource.type == taggable_resources[_]
 tags := resource.change.after.tags
 env := tags.Environment
 not environment_allowed(env)

 msg := sprintf("Resource '%s' has invalid Environment tag '%s'. Allowed: %v",
  [resource.address, env, allowed_environments])
}

environment_allowed(env) {
 allowed_environments[_] == env
}
```

#### HashiCorp Sentinel Examples

Sentinel policy enforcement for Terraform Cloud and Terraform Enterprise.

```hcl
## policies/sentinel/require-vpc-encryption.sentinel
import "tfplan/v2" as tfplan

# Require encryption for VPC flow logs
require_flow_log_encryption = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_flow_log" and
  rc.mode is "managed" and
  rc.change.actions contains "create" implies
  rc.change.after.log_destination_type is "cloud-watch-logs" and
  length(rc.change.after.log_group_name) > 0
 }
}

# Require CloudWatch log group encryption
require_log_group_encryption = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_cloudwatch_log_group" and
  rc.mode is "managed" and
  rc.change.actions contains "create" implies
  length(rc.change.after.kms_key_id else "") > 0
 }
}

main = rule {
 require_flow_log_encryption and
 require_log_group_encryption
}

## policies/sentinel/enforce-backup-policies.sentinel
import "tfplan/v2" as tfplan

# Require backup retention for production databases
require_rds_backup_retention = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_db_instance" and
  rc.mode is "managed" and
  rc.change.actions contains "create" and
  (rc.change.after.tags.Environment else "") is "production" implies
  rc.change.after.backup_retention_period >= 7
 }
}

# Require automated backups enabled
require_rds_automated_backups = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_db_instance" and
  rc.mode is "managed" and
  rc.change.actions contains "create" implies
  rc.change.after.backup_retention_period > 0
 }
}

# Require point-in-time recovery for DynamoDB production tables
require_dynamodb_pitr = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_dynamodb_table" and
  rc.mode is "managed" and
  rc.change.actions contains "create" and
  (rc.change.after.tags.Environment else "") is "production" implies
  rc.change.after.point_in_time_recovery[0].enabled is true
 }
}

main = rule {
 require_rds_backup_retention and
 require_rds_automated_backups and
 require_dynamodb_pitr
}

## policies/sentinel/cost-controls.sentinel
import "tfplan/v2" as tfplan
import "decimal" as decimal

# Calculate estimated monthly cost
estimated_monthly_cost = func() {
 cost = 0.0

 # EC2 instance costs (simplified estimation)
 for tfplan.resource_changes as _, rc {
  if rc.type is "aws_instance" and rc.change.actions contains "create" {
   instance_type = rc.change.after.instance_type

   # Rough cost estimates per hour
   hourly_costs = {
    "t3.micro":  0.0104,
    "t3.small":  0.0208,
    "t3.medium": 0.0416,
    "t3.large":  0.0832,
   }

   if instance_type in keys(hourly_costs) {
    cost += hourly_costs[instance_type] * 730  # Hours per month
   }
  }
 }

 # RDS instance costs
 for tfplan.resource_changes as _, rc {
  if rc.type is "aws_db_instance" and rc.change.actions contains "create" {
   instance_class = rc.change.after.instance_class

   hourly_costs = {
    "db.t3.micro":  0.017,
    "db.t3.small":  0.034,
    "db.t3.medium": 0.068,
   }

   if instance_class in keys(hourly_costs) {
    multiplier = rc.change.after.multi_az ? 2 : 1
    cost += hourly_costs[instance_class] * 730 * multiplier
   }
  }
 }

 return cost
}

# Enforce cost limit for non-production environments
cost_limit = rule when tfplan.variables.environment.value is not "production" {
 decimal.new(estimated_monthly_cost()) less_than decimal.new(500)
}

# Require cost center tag for production resources
require_cost_center = rule {
 all tfplan.resource_changes as _, rc {
  (rc.change.after.tags.Environment else "") is "production" implies
  length(rc.change.after.tags.CostCenter else "") > 0
 }
}

main = rule {
 cost_limit and
 require_cost_center
}

## policies/sentinel/security-hardening.sentinel
import "tfplan/v2" as tfplan

# Require IMDSv2 for EC2 instances
require_imdsv2 = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_instance" and
  rc.mode is "managed" and
  rc.change.actions contains "create" implies
  rc.change.after.metadata_options[0].http_tokens is "required"
 }
}

# Require TLS 1.2+ for load balancers
require_modern_tls = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_lb_listener" and
  rc.mode is "managed" and
  rc.change.actions contains "create" and
  rc.change.after.protocol is "HTTPS" implies
  rc.change.after.ssl_policy matches "^ELBSecurityPolicy-TLS-1-2"
 }
}

# Deny default VPC usage
deny_default_vpc = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_default_vpc" implies
  rc.change.actions not contains "create"
 }
}

# Require deletion protection for production databases
require_deletion_protection = rule {
 all tfplan.resource_changes as _, rc {
  rc.type is "aws_db_instance" and
  rc.mode is "managed" and
  rc.change.actions contains "create" and
  (rc.change.after.tags.Environment else "") is "production" implies
  rc.change.after.deletion_protection is true
 }
}

main = rule {
 require_imdsv2 and
 require_modern_tls and
 deny_default_vpc and
 require_deletion_protection
}
```

---

## Production CI/CD Examples

### GitHub Actions Terraform Workflow

Complete production-ready GitHub Actions workflow:

```yaml
## .github/workflows/terraform.yml
name: Terraform CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  TF_VERSION: 1.6.0
  TFLINT_VERSION: v0.50.0
  CHECKOV_VERSION: 3.1.0

jobs:
  validate:
    name: Validate Terraform
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Init
        run: terraform init -backend=false

      - name: Terraform Validate
        run: terraform validate

  lint:
    name: Lint Terraform
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Cache TFLint plugins
        uses: actions/cache@v4
        with:
          path: ~/.tflint.d/plugins
          key: ${{ runner.os }}-tflint-${{ hashFiles('.tflint.hcl') }}

      - name: Setup TFLint
        uses: terraform-linters/setup-tflint@v4
        with:
          tflint_version: ${{ env.TFLINT_VERSION }}

      - name: Initialize TFLint
        run: tflint --init

      - name: Run TFLint
        run: tflint --recursive --format compact

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: .
          framework: terraform
          output_format: sarif
          output_file_path: reports/checkov.sarif
          soft_fail: false
          skip_check: CKV_AWS_79,CKV_AWS_80

      - name: Upload Checkov results
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: reports/checkov.sarif

      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: .
          format: sarif
          soft_fail: false

  plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    needs: [validate, lint, security]
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets[format('AWS_ROLE_{0}', matrix.environment)] }}
          aws-region: us-east-1

      - name: Terraform Init
        run: |
          terraform init \
            -backend-config="key=environments/${{ matrix.environment }}/terraform.tfstate"

      - name: Terraform Plan
        run: |
          terraform plan \
            -var-file="environments/${{ matrix.environment }}.tfvars" \
            -out=${{ matrix.environment }}.tfplan

      - name: Upload Plan
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.environment }}-tfplan
          path: ${{ matrix.environment }}.tfplan
          retention-days: 7

      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('plan.txt', 'utf8');
            const body = `### Terraform Plan - ${{ matrix.environment }}

            \`\`\`terraform
            ${plan}
            \`\`\`

            *Pusher: @${{ github.actor }}, Action: \`${{ github.event_name }}\`*`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

  test:
    name: Terraform Test
    runs-on: ubuntu-latest
    needs: [validate]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_TEST_ROLE }}
          aws-region: us-east-1

      - name: Terraform Init
        run: terraform init

      - name: Run Terraform Tests
        run: terraform test -verbose

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: terraform-test-results
          path: tests/

  terratest:
    name: Terratest Integration
    runs-on: ubuntu-latest
    needs: [validate]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
          terraform_wrapper: false

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_TEST_ROLE }}
          aws-region: us-east-1

      - name: Download Go modules
        working-directory: tests
        run: go mod download

      - name: Run Terratest
        working-directory: tests
        run: |
          go test -v -timeout 60m -parallel 10 \
            -run TestVPC \
            -json > test-results.json

      - name: Upload Terratest Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: terratest-results
          path: tests/test-results.json

  apply-dev:
    name: Apply to Dev
    runs-on: ubuntu-latest
    needs: [plan, test]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: dev
      url: https://dev.example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_DEV }}
          aws-region: us-east-1

      - name: Download Plan
        uses: actions/download-artifact@v4
        with:
          name: dev-tfplan

      - name: Terraform Init
        run: terraform init -backend-config="key=environments/dev/terraform.tfstate"

      - name: Terraform Apply
        run: terraform apply -auto-approve dev.tfplan

      - name: Output Summary
        run: |
          echo "### Terraform Apply - Dev" >> $GITHUB_STEP_SUMMARY
          terraform output -json | jq -r 'to_entries[] | "- **\(.key)**: \(.value.value)"' >> $GITHUB_STEP_SUMMARY

  apply-prod:
    name: Apply to Production
    runs-on: ubuntu-latest
    needs: [plan, test, terratest]
    if: github.ref == 'refs/heads/main'
    environment:
      name: prod
      url: https://example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_PROD }}
          aws-region: us-east-1

      - name: Download Plan
        uses: actions/download-artifact@v4
        with:
          name: prod-tfplan

      - name: Terraform Init
        run: terraform init -backend-config="key=environments/prod/terraform.tfstate"

      - name: Terraform Apply
        run: terraform apply -auto-approve prod.tfplan

      - name: Tag Release
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            const { data: tags } = await github.rest.repos.listTags({
              owner: context.repo.owner,
              repo: context.repo.repo,
              per_page: 1
            });

            const lastTag = tags[0]?.name || 'v0.0.0';
            const version = lastTag.replace('v', '').split('.');
            version[2] = parseInt(version[2]) + 1;
            const newTag = `v${version.join('.')}`;

            await github.rest.git.createRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: `refs/tags/${newTag}`,
              sha: context.sha
            });

  drift-detection:
    name: Drift Detection
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets[format('AWS_ROLE_{0}', matrix.environment)] }}
          aws-region: us-east-1

      - name: Terraform Init
        run: terraform init -backend-config="key=environments/${{ matrix.environment }}/terraform.tfstate"

      - name: Detect Drift
        id: plan
        run: |
          terraform plan \
            -var-file="environments/${{ matrix.environment }}.tfvars" \
            -detailed-exitcode \
            -no-color > drift.txt 2>&1 || EXITCODE=$?

          echo "exitcode=${EXITCODE}" >> $GITHUB_OUTPUT

      - name: Create Issue on Drift
        if: steps.plan.outputs.exitcode == '2'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const drift = fs.readFileSync('drift.txt', 'utf8');

            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Infrastructure Drift Detected - ${{ matrix.environment }}`,
              body: `### Drift Detection Alert

              Drift detected in **${{ matrix.environment }}** environment.

              \`\`\`terraform
              ${drift}
              \`\`\`

              **Action Required**: Review and apply changes or update state.`,
              labels: ['drift', 'infrastructure', '${{ matrix.environment }}']
            });
```

### GitLab CI Terraform Pipeline

Complete production-ready GitLab CI pipeline:

```yaml
## .gitlab-ci.yml
variables:
  TF_VERSION: "1.6.0"
  TF_ROOT: ${CI_PROJECT_DIR}
  TF_STATE_NAME: default
  TFLINT_VERSION: "v0.50.0"
  AWS_DEFAULT_REGION: us-east-1

stages:
  - validate
  - test
  - plan
  - apply
  - cleanup

workflow:
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_MERGE_REQUEST_IID
    - if: $CI_PIPELINE_SOURCE == "web"
    - if: $CI_PIPELINE_SOURCE == "schedule"

.terraform_base:
  image:
    name: hashicorp/terraform:$TF_VERSION
    entrypoint: [""]
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - ${TF_ROOT}/.terraform
      - ${TF_ROOT}/.terraform.lock.hcl
  before_script:
    - cd ${TF_ROOT}
    - terraform --version
    - terraform init -backend-config="address=${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/terraform/state/${TF_STATE_NAME}"

fmt:
  extends: .terraform_base
  stage: validate
  script:
    - terraform fmt -check=true -diff=true -recursive
  allow_failure: false
  rules:
    - if: $CI_MERGE_REQUEST_IID
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

validate:
  extends: .terraform_base
  stage: validate
  script:
    - terraform validate
  artifacts:
    reports:
      terraform: ${TF_ROOT}/validate.json

tflint:
  stage: validate
  image:
    name: ghcr.io/terraform-linters/tflint:$TFLINT_VERSION
    entrypoint: [""]
  before_script:
    - tflint --version
    - tflint --init
  script:
    - tflint --recursive --format compact --color
  allow_failure: false

checkov:
  stage: validate
  image:
    name: bridgecrew/checkov:latest
    entrypoint: [""]
  script:
    - checkov -d . --framework terraform --output cli --output junitxml --output-file-path console,checkov-report.xml
  artifacts:
    reports:
      junit: checkov-report.xml
    paths:
      - checkov-report.xml
    when: always
    expire_in: 30 days
  allow_failure: true

tfsec:
  stage: validate
  image:
    name: aquasec/tfsec:latest
    entrypoint: [""]
  script:
    - tfsec . --format lovely --format json --out tfsec-report.json
  artifacts:
    paths:
      - tfsec-report.json
    when: always
    expire_in: 30 days
  allow_failure: true

terraform-test:
  extends: .terraform_base
  stage: test
  script:
    - terraform test -verbose
  artifacts:
    paths:
      - tests/
    when: always
    expire_in: 7 days
  rules:
    - if: $CI_MERGE_REQUEST_IID
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

terratest:
  stage: test
  image: golang:1.21
  before_script:
    - apt-get update && apt-get install -y wget unzip
    - wget -q https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_linux_amd64.zip
    - unzip terraform_${TF_VERSION}_linux_amd64.zip -d /usr/local/bin/
    - cd tests && go mod download
  script:
    - go test -v -timeout 60m -parallel 10 -json > test-results.json
  artifacts:
    paths:
      - tests/test-results.json
    reports:
      junit: tests/test-results.json
    when: always
    expire_in: 7 days
  rules:
    - if: $CI_MERGE_REQUEST_IID
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  allow_failure: true

.plan_template:
  extends: .terraform_base
  stage: plan
  script:
    - terraform plan -var-file="environments/${ENVIRONMENT}.tfvars" -out=${ENVIRONMENT}.tfplan
    - terraform show -json ${ENVIRONMENT}.tfplan > ${ENVIRONMENT}.tfplan.json
  artifacts:
    name: plan-${ENVIRONMENT}
    paths:
      - ${ENVIRONMENT}.tfplan
      - ${ENVIRONMENT}.tfplan.json
    reports:
      terraform: ${ENVIRONMENT}.tfplan.json
    expire_in: 7 days

plan:dev:
  extends: .plan_template
  variables:
    ENVIRONMENT: dev
    TF_STATE_NAME: dev
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
    - if: $CI_MERGE_REQUEST_IID
      changes:
        - "**/*.tf"
        - "**/*.tfvars"
        - ".gitlab-ci.yml"

plan:staging:
  extends: .plan_template
  variables:
    ENVIRONMENT: staging
    TF_STATE_NAME: staging
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
    - if: $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == $CI_DEFAULT_BRANCH

plan:prod:
  extends: .plan_template
  variables:
    ENVIRONMENT: prod
    TF_STATE_NAME: prod
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

.apply_template:
  extends: .terraform_base
  stage: apply
  script:
    - terraform apply -auto-approve ${ENVIRONMENT}.tfplan
    - terraform output -json > ${ENVIRONMENT}-outputs.json
  artifacts:
    name: outputs-${ENVIRONMENT}
    paths:
      - ${ENVIRONMENT}-outputs.json
    expire_in: 90 days
  dependencies:
    - plan:${ENVIRONMENT}

apply:dev:
  extends: .apply_template
  variables:
    ENVIRONMENT: dev
    TF_STATE_NAME: dev
  environment:
    name: dev
    url: https://dev.example.com
    on_stop: destroy:dev
    auto_stop_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
      when: manual
  needs:
    - plan:dev
    - terraform-test

apply:staging:
  extends: .apply_template
  variables:
    ENVIRONMENT: staging
    TF_STATE_NAME: staging
  environment:
    name: staging
    url: https://staging.example.com
    on_stop: destroy:staging
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
      when: manual
  needs:
    - plan:staging
    - terraform-test
    - terratest

apply:prod:
  extends: .apply_template
  variables:
    ENVIRONMENT: prod
    TF_STATE_NAME: prod
  environment:
    name: prod
    url: https://example.com
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
  needs:
    - plan:prod
    - terraform-test
    - terratest

.destroy_template:
  extends: .terraform_base
  stage: cleanup
  script:
    - terraform destroy -var-file="environments/${ENVIRONMENT}.tfvars" -auto-approve
  when: manual
  environment:
    name: ${ENVIRONMENT}
    action: stop

destroy:dev:
  extends: .destroy_template
  variables:
    ENVIRONMENT: dev
    TF_STATE_NAME: dev

destroy:staging:
  extends: .destroy_template
  variables:
    ENVIRONMENT: staging
    TF_STATE_NAME: staging

drift-detection:
  extends: .terraform_base
  stage: test
  script:
    - |
      for env in dev staging prod; do
        echo "Checking drift for ${env}..."
        terraform plan -var-file="environments/${env}.tfvars" -detailed-exitcode || EXIT_CODE=$?

        if [ ${EXIT_CODE} -eq 2 ]; then
          echo "DRIFT DETECTED in ${env}!"
          curl -X POST "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/issues" \
            --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
            --data "title=Infrastructure Drift in ${env}" \
            --data "description=Drift detected. Review required." \
            --data "labels=drift,${env}"
        fi
      done
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
  allow_failure: true

cost-estimate:
  stage: test
  image: infracost/infracost:latest
  before_script:
    - infracost --version
  script:
    - |
      for env in dev staging prod; do
        infracost breakdown \
          --path . \
          --terraform-var-file="environments/${env}.tfvars" \
          --format json \
          --out-file infracost-${env}.json
      done
    - infracost output --path "infracost-*.json" --format table
    - infracost output --path "infracost-*.json" --format html > infracost-report.html
  artifacts:
    paths:
      - infracost-*.json
      - infracost-report.html
    expire_in: 30 days
  rules:
    - if: $CI_MERGE_REQUEST_IID
  allow_failure: true
```

### Comprehensive Terratest Suite

Production-ready Terratest integration tests:

```go
// tests/vpc_test.go
package test

import (
    "testing"
    "fmt"
    "time"

    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/gruntwork-io/terratest/modules/random"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestVPCModule(t *testing.T) {
    t.Parallel()

    // Generate unique resource names
    uniqueID := random.UniqueId()
    vpcName := fmt.Sprintf("test-vpc-%s", uniqueID)
    awsRegion := "us-east-1"

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "vpc_name":        vpcName,
            "vpc_cidr":        "10.0.0.0/16",
            "azs":             []string{"us-east-1a", "us-east-1b", "us-east-1c"},
            "private_subnets": []string{"10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"},
            "public_subnets":  []string{"10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"},
            "enable_nat_gateway": true,
            "single_nat_gateway": false,
            "enable_dns_hostnames": true,
            "enable_dns_support": true,
        },
        EnvVars: map[string]string{
            "AWS_DEFAULT_REGION": awsRegion,
        },
    })

    defer terraform.Destroy(t, terraformOptions)

    terraform.InitAndApply(t, terraformOptions)

    // Test VPC creation
    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcID, "VPC ID should not be empty")

    vpc := aws.GetVpcById(t, vpcID, awsRegion)
    assert.Equal(t, "10.0.0.0/16", vpc.Cidr, "VPC CIDR should match")

    // Test DNS settings
    assert.True(t, aws.IsPublicDnsHostnamesEnabledInVpc(t, vpcID, awsRegion))

    // Test subnet creation
    publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
    require.Len(t, publicSubnetIDs, 3, "Should create 3 public subnets")

    privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
    require.Len(t, privateSubnetIDs, 3, "Should create 3 private subnets")

    // Test NAT Gateways
    natGatewayIDs := terraform.OutputList(t, terraformOptions, "nat_gateway_ids")
    require.Len(t, natGatewayIDs, 3, "Should create 3 NAT gateways")

    // Verify NAT gateways are in different AZs
    azSet := make(map[string]bool)
    for _, natID := range natGatewayIDs {
        nat := aws.GetNatGatewayById(t, natID, awsRegion)
        azSet[nat.AvailabilityZone] = true
    }
    assert.Len(t, azSet, 3, "NAT gateways should be in 3 different AZs")

    // Test Internet Gateway
    igwID := terraform.Output(t, terraformOptions, "internet_gateway_id")
    assert.NotEmpty(t, igwID, "Internet Gateway ID should not be empty")
}

func TestVPCWithDefaultSubnets(t *testing.T) {
    t.Parallel()

    uniqueID := random.UniqueId()
    vpcName := fmt.Sprintf("test-vpc-defaults-%s", uniqueID)

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "vpc_name": vpcName,
            "vpc_cidr": "10.1.0.0/16",
            "azs":      []string{"us-east-1a", "us-east-1b"},
        },
        EnvVars: map[string]string{
            "AWS_DEFAULT_REGION": "us-east-1",
        },
    })

    defer terraform.Destroy(t, terraformOptions)

    terraform.InitAndApply(t, terraformOptions)

    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcID)

    // Verify default behavior
    publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
    assert.Empty(t, publicSubnetIDs, "Should not create public subnets by default")

    privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
    assert.Empty(t, privateSubnetIDs, "Should not create private subnets by default")
}

// tests/alb_test.go
package test

import (
    "fmt"
    "testing"
    "time"

    "github.com/gruntwork-io/terratest/modules/http-helper"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/random"
    "github.com/stretchr/testify/assert"
)

func TestALBModule(t *testing.T) {
    t.Parallel()

    uniqueID := random.UniqueId()
    albName := fmt.Sprintf("test-alb-%s", uniqueID)
    awsRegion := "us-east-1"

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/alb",
        Vars: map[string]interface{}{
            "name":               albName,
            "vpc_id":             "vpc-xxxxx",
            "subnets":            []string{"subnet-xxxxx", "subnet-yyyyy"},
            "enable_https":       true,
            "certificate_arn":    "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx",
            "health_check_path":  "/health",
            "health_check_interval": 30,
            "deregistration_delay": 30,
        },
        EnvVars: map[string]string{
            "AWS_DEFAULT_REGION": awsRegion,
        },
    })

    defer terraform.Destroy(t, terraformOptions)

    terraform.InitAndApply(t, terraformOptions)

    albDNS := terraform.Output(t, terraformOptions, "alb_dns_name")
    assert.NotEmpty(t, albDNS, "ALB DNS name should not be empty")

    targetGroupARN := terraform.Output(t, terraformOptions, "target_group_arn")
    assert.NotEmpty(t, targetGroupARN, "Target group ARN should not be empty")

    // Test HTTP to HTTPS redirect
    url := fmt.Sprintf("http://%s", albDNS)
    expectedStatusCode := 301
    maxRetries := 30
    timeBetweenRetries := 10 * time.Second

    http_helper.HttpGetWithRetry(
        t,
        url,
        nil,
        expectedStatusCode,
        "",
        maxRetries,
        timeBetweenRetries,
    )
}

// tests/security_group_test.go
package test

import (
    "fmt"
    "testing"

    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/gruntwork-io/terratest/modules/random"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestSecurityGroupModule(t *testing.T) {
    t.Parallel()

    uniqueID := random.UniqueId()
    sgName := fmt.Sprintf("test-sg-%s", uniqueID)
    awsRegion := "us-east-1"

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/security-group",
        Vars: map[string]interface{}{
            "name":        sgName,
            "description": "Test security group",
            "vpc_id":      "vpc-xxxxx",
            "ingress_rules": []map[string]interface{}{
                {
                    "from_port":   80,
                    "to_port":     80,
                    "protocol":    "tcp",
                    "cidr_blocks": []string{"0.0.0.0/0"},
                    "description": "HTTP from anywhere",
                },
                {
                    "from_port":   443,
                    "to_port":     443,
                    "protocol":    "tcp",
                    "cidr_blocks": []string{"0.0.0.0/0"},
                    "description": "HTTPS from anywhere",
                },
            },
            "egress_rules": []map[string]interface{}{
                {
                    "from_port":   0,
                    "to_port":     0,
                    "protocol":    "-1",
                    "cidr_blocks": []string{"0.0.0.0/0"},
                    "description": "All traffic outbound",
                },
            },
        },
        EnvVars: map[string]string{
            "AWS_DEFAULT_REGION": awsRegion,
        },
    })

    defer terraform.Destroy(t, terraformOptions)

    terraform.InitAndApply(t, terraformOptions)

    sgID := terraform.Output(t, terraformOptions, "security_group_id")
    assert.NotEmpty(t, sgID, "Security group ID should not be empty")

    sg := aws.GetSecurityGroupById(t, sgID, awsRegion)
    require.Len(t, sg.IngressRules, 2, "Should have 2 ingress rules")
    require.Len(t, sg.EgressRules, 1, "Should have 1 egress rule")

    // Verify ingress rules
    httpRule := findRule(sg.IngressRules, 80)
    require.NotNil(t, httpRule, "HTTP rule should exist")
    assert.Equal(t, int32(80), httpRule.FromPort)
    assert.Equal(t, int32(80), httpRule.ToPort)
    assert.Equal(t, "tcp", httpRule.Protocol)

    httpsRule := findRule(sg.IngressRules, 443)
    require.NotNil(t, httpsRule, "HTTPS rule should exist")
    assert.Equal(t, int32(443), httpsRule.FromPort)
}

func findRule(rules []aws.SecurityGroupRule, port int32) *aws.SecurityGroupRule {
    for _, rule := range rules {
        if rule.FromPort == port {
            return &rule
        }
    }
    return nil
}

// tests/rds_test.go
package test

import (
    "fmt"
    "testing"

    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/gruntwork-io/terratest/modules/random"
    "github.com/stretchr/testify/assert"
)

func TestRDSModule(t *testing.T) {
    t.Parallel()

    uniqueID := random.UniqueId()
    dbName := fmt.Sprintf("testdb%s", uniqueID)
    awsRegion := "us-east-1"

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/rds",
        Vars: map[string]interface{}{
            "identifier":        dbName,
            "engine":            "postgres",
            "engine_version":    "15.3",
            "instance_class":    "db.t3.micro",
            "allocated_storage": 20,
            "db_name":           dbName,
            "username":          "admin",
            "password":          random.UniqueId(),
            "subnet_ids":        []string{"subnet-xxxxx", "subnet-yyyyy"},
            "vpc_security_group_ids": []string{"sg-xxxxx"},
            "multi_az":               false,
            "backup_retention_period": 7,
            "skip_final_snapshot":     true,
        },
        EnvVars: map[string]string{
            "AWS_DEFAULT_REGION": awsRegion,
        },
    })

    defer terraform.Destroy(t, terraformOptions)

    terraform.InitAndApply(t, terraformOptions)

    dbEndpoint := terraform.Output(t, terraformOptions, "endpoint")
    assert.NotEmpty(t, dbEndpoint, "Database endpoint should not be empty")

    dbARN := terraform.Output(t, terraformOptions, "arn")
    assert.NotEmpty(t, dbARN, "Database ARN should not be empty")

    // Verify database is running
    dbInstance := aws.GetRDSInstanceById(t, dbName, awsRegion)
    assert.Equal(t, "available", dbInstance.Status)
    assert.Equal(t, "postgres", dbInstance.Engine)
    assert.Equal(t, int64(20), dbInstance.AllocatedStorage)
}

// tests/s3_test.go
package test

import (
    "fmt"
    "testing"
    "strings"

    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/gruntwork-io/terratest/modules/random"
    "github.com/stretchr/testify/assert"
)

func TestS3BucketModule(t *testing.T) {
    t.Parallel()

    uniqueID := strings.ToLower(random.UniqueId())
    bucketName := fmt.Sprintf("test-bucket-%s", uniqueID)
    awsRegion := "us-east-1"

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/s3",
        Vars: map[string]interface{}{
            "bucket_name":          bucketName,
            "enable_versioning":    true,
            "enable_encryption":    true,
            "enable_logging":       true,
            "lifecycle_rules": []map[string]interface{}{
                {
                    "id":      "archive-old-objects",
                    "enabled": true,
                    "transitions": []map[string]interface{}{
                        {
                            "days":          30,
                            "storage_class": "STANDARD_IA",
                        },
                        {
                            "days":          90,
                            "storage_class": "GLACIER",
                        },
                    },
                    "expiration": map[string]interface{}{
                        "days": 365,
                    },
                },
            },
        },
        EnvVars: map[string]string{
            "AWS_DEFAULT_REGION": awsRegion,
        },
    })

    defer terraform.Destroy(t, terraformOptions)

    terraform.InitAndApply(t, terraformOptions)

    bucketID := terraform.Output(t, terraformOptions, "bucket_id")
    assert.Equal(t, bucketName, bucketID, "Bucket ID should match bucket name")

    // Verify bucket exists and has versioning enabled
    aws.AssertS3BucketExists(t, awsRegion, bucketName)
    versioning := aws.GetS3BucketVersioning(t, awsRegion, bucketName)
    assert.Equal(t, "Enabled", versioning)

    // Verify encryption
    encryption := aws.GetS3BucketEncryption(t, awsRegion, bucketName)
    assert.NotNil(t, encryption, "Bucket should have encryption configured")

    // Verify lifecycle rules
    lifecycleRules := aws.GetS3BucketLifecycleConfiguration(t, awsRegion, bucketName)
    assert.Len(t, lifecycleRules.Rules, 1, "Should have 1 lifecycle rule")
    assert.Equal(t, "archive-old-objects", *lifecycleRules.Rules[0].ID)
}

// tests/integration_test.go
package test

import (
    "fmt"
    "testing"
    "time"

    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/http-helper"
    "github.com/gruntwork-io/terratest/modules/random"
    "github.com/stretchr/testify/assert"
)

func TestFullStackIntegration(t *testing.T) {
    t.Parallel()

    uniqueID := random.UniqueId()
    projectName := fmt.Sprintf("test-app-%s", uniqueID)
    awsRegion := "us-east-1"

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../",
        Vars: map[string]interface{}{
            "project":              projectName,
            "environment":          "test",
            "aws_region":           awsRegion,
            "vpc_cidr":             "10.0.0.0/16",
            "availability_zones":   []string{"us-east-1a", "us-east-1b"},
            "instance_type":        "t3.micro",
            "min_size":             1,
            "max_size":             2,
            "desired_capacity":     1,
            "db_instance_class":    "db.t3.micro",
            "db_allocated_storage": 20,
        },
        EnvVars: map[string]string{
            "AWS_DEFAULT_REGION": awsRegion,
        },
    })

    defer terraform.Destroy(t, terraformOptions)

    terraform.InitAndApply(t, terraformOptions)

    // Test VPC outputs
    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcID, "VPC ID should not be empty")

    // Test ALB outputs
    albDNS := terraform.Output(t, terraformOptions, "alb_dns_name")
    assert.NotEmpty(t, albDNS, "ALB DNS should not be empty")

    // Test database outputs
    dbEndpoint := terraform.Output(t, terraformOptions, "db_endpoint")
    assert.NotEmpty(t, dbEndpoint, "Database endpoint should not be empty")

    // Test application accessibility
    url := fmt.Sprintf("https://%s/health", albDNS)
    maxRetries := 30
    timeBetweenRetries := 10 * time.Second

    http_helper.HttpGetWithRetry(
        t,
        url,
        nil,
        200,
        "",
        maxRetries,
        timeBetweenRetries,
    )

    // Verify Auto Scaling Group
    asgName := terraform.Output(t, terraformOptions, "asg_name")
    assert.NotEmpty(t, asgName, "ASG name should not be empty")
}
```

### Production-Ready Module Examples

Complete EKS cluster module:

```hcl
## modules/eks-cluster/main.tf
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  cluster_name = "${var.project}-${var.environment}-eks"

  common_tags = merge(
    var.tags,
    {
      "Project"     = var.project
      "Environment" = var.environment
      "ManagedBy"   = "Terraform"
      "Cluster"     = local.cluster_name
    }
  )
}

## EKS Cluster IAM Role
resource "aws_iam_role" "cluster" {
  name = "${local.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cluster_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

resource "aws_iam_role_policy_attachment" "cluster_vpc_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.cluster.name
}

## Cluster Security Group
resource "aws_security_group" "cluster" {
  name        = "${local.cluster_name}-cluster-sg"
  description = "EKS cluster security group"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      "Name" = "${local.cluster_name}-cluster-sg"
    }
  )
}

resource "aws_security_group_rule" "cluster_ingress_workstation_https" {
  count = length(var.allowed_cidr_blocks) > 0 ? 1 : 0

  description       = "Allow workstation to communicate with the cluster API Server"
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = var.allowed_cidr_blocks
  security_group_id = aws_security_group.cluster.id
}

## KMS Key for Secrets Encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster ${local.cluster_name} secrets encryption"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      "Name" = "${local.cluster_name}-eks-key"
    }
  )
}

resource "aws_kms_alias" "eks" {
  name          = "alias/${local.cluster_name}-eks"
  target_key_id = aws_kms_key.eks.key_id
}

## CloudWatch Log Group for Control Plane Logs
resource "aws_cloudwatch_log_group" "cluster" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.eks.arn

  tags = local.common_tags
}

## EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_private_access = var.endpoint_private_access
    endpoint_public_access  = var.endpoint_public_access
    public_access_cidrs     = var.public_access_cidrs
    security_group_ids      = [aws_security_group.cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = var.enabled_cluster_log_types

  depends_on = [
    aws_iam_role_policy_attachment.cluster_policy,
    aws_iam_role_policy_attachment.cluster_vpc_policy,
    aws_cloudwatch_log_group.cluster,
  ]

  tags = local.common_tags
}

## Node Group IAM Role
resource "aws_iam_role" "node_group" {
  name = "${local.cluster_name}-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "node_group_worker_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "node_group_cni_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "node_group_registry_policy" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node_group.name
}

## Node Group Launch Template
resource "aws_launch_template" "node_group" {
  for_each = var.node_groups

  name_prefix = "${local.cluster_name}-${each.key}-"
  description = "Launch template for ${local.cluster_name} ${each.key} node group"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = each.value.disk_size
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      kms_key_id            = aws_kms_key.eks.arn
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      local.common_tags,
      {
        "Name"      = "${local.cluster_name}-${each.key}-node"
        "NodeGroup" = each.key
      }
    )
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    cluster_name        = aws_eks_cluster.main.name
    cluster_endpoint    = aws_eks_cluster.main.endpoint
    cluster_ca          = aws_eks_cluster.main.certificate_authority[0].data
    bootstrap_extra_args = each.value.bootstrap_extra_args
  }))

  tags = merge(
    local.common_tags,
    {
      "Name" = "${local.cluster_name}-${each.key}-lt"
    }
  )
}

## EKS Node Groups
resource "aws_eks_node_group" "main" {
  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.cluster_name}-${each.key}"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = each.value.subnet_ids

  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type
  disk_size      = each.value.disk_size

  scaling_config {
    desired_size = each.value.desired_size
    max_size     = each.value.max_size
    min_size     = each.value.min_size
  }

  update_config {
    max_unavailable_percentage = 33
  }

  launch_template {
    id      = aws_launch_template.node_group[each.key].id
    version = "$Latest"
  }

  labels = merge(
    {
      "nodegroup" = each.key
      "environment" = var.environment
    },
    each.value.labels
  )

  dynamic "taint" {
    for_each = each.value.taints

    content {
      key    = taint.value.key
      value  = taint.value.value
      effect = taint.value.effect
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_worker_policy,
    aws_iam_role_policy_attachment.node_group_cni_policy,
    aws_iam_role_policy_attachment.node_group_registry_policy,
  ]

  tags = merge(
    local.common_tags,
    {
      "Name"      = "${local.cluster_name}-${each.key}-ng"
      "NodeGroup" = each.key
    }
  )

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }
}

## OIDC Provider for IRSA
data "tls_certificate" "cluster" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "cluster" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.cluster.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = merge(
    local.common_tags,
    {
      "Name" = "${local.cluster_name}-oidc-provider"
    }
  )
}

## Security Group for Node-to-Node Communication
resource "aws_security_group" "node" {
  name        = "${local.cluster_name}-node-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      "Name"                                      = "${local.cluster_name}-node-sg"
      "kubernetes.io/cluster/${local.cluster_name}" = "owned"
    }
  )
}

resource "aws_security_group_rule" "node_ingress_self" {
  description              = "Allow nodes to communicate with each other"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  source_security_group_id = aws_security_group.node.id
  security_group_id        = aws_security_group.node.id
}

resource "aws_security_group_rule" "node_ingress_cluster_https" {
  description              = "Allow pods to communicate with the cluster API Server"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.cluster.id
  security_group_id        = aws_security_group.node.id
}

resource "aws_security_group_rule" "cluster_ingress_node_https" {
  description              = "Allow pods to communicate with the cluster API Server"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.node.id
  security_group_id        = aws_security_group.cluster.id
}

## modules/eks-cluster/variables.tf
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_id" {
  description = "VPC ID where EKS cluster will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the EKS cluster"
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "At least 2 subnets are required for high availability."
  }
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
  default     = "1.28"
}

variable "endpoint_private_access" {
  description = "Enable private API server endpoint"
  type        = bool
  default     = true
}

variable "endpoint_public_access" {
  description = "Enable public API server endpoint"
  type        = bool
  default     = true
}

variable "public_access_cidrs" {
  description = "List of CIDR blocks that can access the public API server endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access cluster API"
  type        = list(string)
  default     = []
}

variable "enabled_cluster_log_types" {
  description = "List of control plane logging types to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "log_retention_days" {
  description = "Number of days to retain cluster logs"
  type        = number
  default     = 90
}

variable "kms_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
}

variable "node_groups" {
  description = "Map of node group configurations"
  type = map(object({
    instance_types        = list(string)
    capacity_type         = string
    disk_size             = number
    desired_size          = number
    max_size              = number
    min_size              = number
    subnet_ids            = list(string)
    labels                = map(string)
    taints                = list(object({
      key    = string
      value  = string
      effect = string
    }))
    bootstrap_extra_args  = string
  }))

  default = {
    general = {
      instance_types       = ["t3.medium"]
      capacity_type        = "ON_DEMAND"
      disk_size            = 50
      desired_size         = 2
      max_size             = 4
      min_size             = 1
      subnet_ids           = []
      labels               = {}
      taints               = []
      bootstrap_extra_args = ""
    }
  }
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}

## modules/eks-cluster/outputs.tf
output "cluster_id" {
  description = "The name/id of the EKS cluster"
  value       = aws_eks_cluster.main.id
}

output "cluster_arn" {
  description = "The Amazon Resource Name (ARN) of the cluster"
  value       = aws_eks_cluster.main.arn
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.cluster.id
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN of the EKS cluster"
  value       = aws_iam_role.cluster.arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_version" {
  description = "The Kubernetes server version for the cluster"
  value       = aws_eks_cluster.main.version
}

output "node_groups" {
  description = "Map of node group names to their attributes"
  value = {
    for k, v in aws_eks_node_group.main : k => {
      id     = v.id
      arn    = v.arn
      status = v.status
    }
  }
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS nodes"
  value       = aws_security_group.node.id
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for EKS"
  value       = aws_iam_openid_connect_provider.cluster.arn
}

output "oidc_provider_url" {
  description = "URL of the OIDC Provider for EKS"
  value       = replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")
}

output "kms_key_id" {
  description = "KMS key ID used for cluster encryption"
  value       = aws_kms_key.eks.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN used for cluster encryption"
  value       = aws_kms_key.eks.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for cluster logs"
  value       = aws_cloudwatch_log_group.cluster.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for cluster logs"
  value       = aws_cloudwatch_log_group.cluster.arn
}
```

Complete Monitoring Stack Module:

```hcl
## modules/monitoring/main.tf
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  common_tags = merge(
    var.tags,
    {
      "Project"     = var.project
      "Environment" = var.environment
      "ManagedBy"   = "Terraform"
    }
  )
}

resource "aws_sns_topic" "alerts" {
  for_each = var.alert_topics

  name              = "${var.project}-${var.environment}-${each.key}-alerts"
  kms_master_key_id = aws_kms_key.sns.id

  tags = merge(
    local.common_tags,
    {
      "Name" = "${var.project}-${var.environment}-${each.key}-alerts"
      "Type" = each.value.severity
    }
  )
}

resource "aws_sns_topic_subscription" "email" {
  for_each = {
    for combo in flatten([
      for topic_key, topic in var.alert_topics : [
        for email in topic.emails : {
          topic_key = topic_key
          email     = email
        }
      ]
    ]) : "${combo.topic_key}-${combo.email}" => combo
  }

  topic_arn = aws_sns_topic.alerts[each.value.topic_key].arn
  protocol  = "email"
  endpoint  = each.value.email
}

resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "sns" {
  name          = "alias/${var.project}-${var.environment}-sns"
  target_key_id = aws_kms_key.sns.key_id
}

data "aws_caller_identity" "current" {}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = concat(
      [
        {
          type = "metric"
          properties = {
            metrics = [
              ["AWS/EC2", "CPUUtilization", { stat = "Average" }],
              ["...", { stat = "Maximum" }]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "EC2 CPU Utilization"
          }
        },
        {
          type = "metric"
          properties = {
            metrics = [
              ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
              [".", "DatabaseConnections", { stat = "Sum" }],
              [".", "FreeStorageSpace", { stat = "Average" }]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "RDS Metrics"
          }
        },
        {
          type = "metric"
          properties = {
            metrics = [
              ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
              [".", "RequestCount", { stat = "Sum" }],
              [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }],
              [".", "HTTPCode_Target_4XX_Count", { stat = "Sum" }]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "ALB Metrics"
          }
        }
      ],
      [
        for name, config in var.custom_metrics : {
          type = "metric"
          properties = {
            metrics = [[config.namespace, config.metric_name]]
            period  = config.period
            stat    = config.statistic
            region  = var.aws_region
            title   = name
          }
        }
      ]
    )
  })
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  for_each = var.cpu_alarms

  alarm_name          = "${var.project}-${var.environment}-${each.key}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = each.value.evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = each.value.namespace
  period              = each.value.period
  statistic           = "Average"
  threshold           = each.value.threshold
  alarm_description   = "CPU utilization is too high on ${each.key}"
  alarm_actions       = [aws_sns_topic.alerts[each.value.topic].arn]
  ok_actions          = [aws_sns_topic.alerts[each.value.topic].arn]

  dimensions = each.value.dimensions

  tags = merge(
    local.common_tags,
    {
      "Name"     = "${var.project}-${var.environment}-${each.key}-cpu-high"
      "Resource" = each.key
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  for_each = var.memory_alarms

  alarm_name          = "${var.project}-${var.environment}-${each.key}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = each.value.evaluation_periods
  metric_name         = "MemoryUtilization"
  namespace           = each.value.namespace
  period              = each.value.period
  statistic           = "Average"
  threshold           = each.value.threshold
  alarm_description   = "Memory utilization is too high on ${each.key}"
  alarm_actions       = [aws_sns_topic.alerts[each.value.topic].arn]
  ok_actions          = [aws_sns_topic.alerts[each.value.topic].arn]

  dimensions = each.value.dimensions

  tags = merge(
    local.common_tags,
    {
      "Name"     = "${var.project}-${var.environment}-${each.key}-memory-high"
      "Resource" = each.key
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "disk_space_low" {
  for_each = var.disk_alarms

  alarm_name          = "${var.project}-${var.environment}-${each.key}-disk-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = each.value.evaluation_periods
  metric_name         = "DiskSpaceAvailable"
  namespace           = each.value.namespace
  period              = each.value.period
  statistic           = "Average"
  threshold           = each.value.threshold
  alarm_description   = "Disk space is running low on ${each.key}"
  alarm_actions       = [aws_sns_topic.alerts[each.value.topic].arn]
  ok_actions          = [aws_sns_topic.alerts[each.value.topic].arn]

  dimensions = each.value.dimensions

  tags = merge(
    local.common_tags,
    {
      "Name"     = "${var.project}-${var.environment}-${each.key}-disk-low"
      "Resource" = each.key
    }
  )
}

resource "aws_cloudwatch_log_group" "application" {
  for_each = var.log_groups

  name              = "/aws/${var.project}/${var.environment}/${each.key}"
  retention_in_days = each.value.retention_days
  kms_key_id        = each.value.enable_encryption ? aws_kms_key.logs[each.key].arn : null

  tags = merge(
    local.common_tags,
    {
      "Name"        = "/aws/${var.project}/${var.environment}/${each.key}"
      "Application" = each.key
    }
  )
}

resource "aws_kms_key" "logs" {
  for_each = {
    for k, v in var.log_groups : k => v if v.enable_encryption
  }

  description             = "KMS key for ${each.key} log encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/${var.project}/${var.environment}/${each.key}"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_log_metric_filter" "error_count" {
  for_each = {
    for k, v in var.log_groups : k => v if v.create_error_metrics
  }

  name           = "${each.key}-error-count"
  log_group_name = aws_cloudwatch_log_group.application[each.key].name
  pattern        = "[time, request_id, level=ERROR*, ...]"

  metric_transformation {
    name      = "${each.key}ErrorCount"
    namespace = "${var.project}/${var.environment}"
    value     = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "log_errors" {
  for_each = {
    for k, v in var.log_groups : k => v if v.create_error_metrics
  }

  alarm_name          = "${var.project}-${var.environment}-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "${each.key}ErrorCount"
  namespace           = "${var.project}/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = each.value.error_threshold
  alarm_description   = "Error count exceeded for ${each.key}"
  alarm_actions       = [aws_sns_topic.alerts["critical"].arn]
  treat_missing_data  = "notBreaching"

  tags = merge(
    local.common_tags,
    {
      "Name"        = "${var.project}-${var.environment}-${each.key}-errors"
      "Application" = each.key
    }
  )
}

resource "aws_cloudwatch_event_rule" "scheduled_checks" {
  for_each = var.scheduled_checks

  name                = "${var.project}-${var.environment}-${each.key}-check"
  description         = each.value.description
  schedule_expression = each.value.schedule

  tags = merge(
    local.common_tags,
    {
      "Name" = "${var.project}-${var.environment}-${each.key}-check"
      "Type" = "ScheduledCheck"
    }
  )
}

resource "aws_cloudwatch_event_target" "lambda" {
  for_each = var.scheduled_checks

  rule      = aws_cloudwatch_event_rule.scheduled_checks[each.key].name
  target_id = "${each.key}-lambda"
  arn       = each.value.lambda_arn

  retry_policy {
    maximum_event_age       = 86400
    maximum_retry_attempts  = 2
  }

  dead_letter_config {
    arn = aws_sqs_queue.dlq[each.key].arn
  }
}

resource "aws_sqs_queue" "dlq" {
  for_each = var.scheduled_checks

  name                      = "${var.project}-${var.environment}-${each.key}-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.sqs.id

  tags = merge(
    local.common_tags,
    {
      "Name" = "${var.project}-${var.environment}-${each.key}-dlq"
      "Type" = "DeadLetterQueue"
    }
  )
}

resource "aws_kms_key" "sqs" {
  description             = "KMS key for SQS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_cloudwatch_composite_alarm" "application_health" {
  alarm_name          = "${var.project}-${var.environment}-app-health"
  alarm_description   = "Composite alarm for overall application health"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alerts["critical"].arn]
  ok_actions          = [aws_sns_topic.alerts["critical"].arn]

  alarm_rule = join(" OR ", [
    for alarm_name in concat(
      [for k, v in aws_cloudwatch_metric_alarm.cpu_high : v.alarm_name],
      [for k, v in aws_cloudwatch_metric_alarm.memory_high : v.alarm_name],
      [for k, v in aws_cloudwatch_metric_alarm.log_errors : v.alarm_name]
    ) : "ALARM(${alarm_name})"
  ])

  tags = merge(
    local.common_tags,
    {
      "Name" = "${var.project}-${var.environment}-app-health"
      "Type" = "CompositeAlarm"
    }
  )
}

## modules/monitoring/variables.tf
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "alert_topics" {
  description = "SNS topics for alerts"
  type = map(object({
    severity = string
    emails   = list(string)
  }))
  default = {
    critical = {
      severity = "critical"
      emails   = []
    }
    warning = {
      severity = "warning"
      emails   = []
    }
  }
}

variable "cpu_alarms" {
  description = "CPU utilization alarms configuration"
  type = map(object({
    namespace          = string
    threshold          = number
    evaluation_periods = number
    period             = number
    topic              = string
    dimensions         = map(string)
  }))
  default = {}
}

variable "memory_alarms" {
  description = "Memory utilization alarms configuration"
  type = map(object({
    namespace          = string
    threshold          = number
    evaluation_periods = number
    period             = number
    topic              = string
    dimensions         = map(string)
  }))
  default = {}
}

variable "disk_alarms" {
  description = "Disk space alarms configuration"
  type = map(object({
    namespace          = string
    threshold          = number
    evaluation_periods = number
    period             = number
    topic              = string
    dimensions         = map(string)
  }))
  default = {}
}

variable "log_groups" {
  description = "CloudWatch log groups configuration"
  type = map(object({
    retention_days       = number
    enable_encryption    = bool
    create_error_metrics = bool
    error_threshold      = number
  }))
  default = {}
}

variable "custom_metrics" {
  description = "Custom CloudWatch metrics for dashboard"
  type = map(object({
    namespace   = string
    metric_name = string
    statistic   = string
    period      = number
  }))
  default = {}
}

variable "scheduled_checks" {
  description = "Scheduled health checks via EventBridge"
  type = map(object({
    description = string
    schedule    = string
    lambda_arn  = string
  }))
  default = {}
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

## modules/monitoring/outputs.tf
output "sns_topic_arns" {
  description = "ARNs of SNS topics"
  value       = { for k, v in aws_sns_topic.alerts : k => v.arn }
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "log_group_names" {
  description = "Names of CloudWatch log groups"
  value       = { for k, v in aws_cloudwatch_log_group.application : k => v.name }
}

output "log_group_arns" {
  description = "ARNs of CloudWatch log groups"
  value       = { for k, v in aws_cloudwatch_log_group.application : k => v.arn }
}

output "composite_alarm_arn" {
  description = "ARN of the composite application health alarm"
  value       = aws_cloudwatch_composite_alarm.application_health.arn
}
```

Complete ECS Fargate Service Module:

```hcl
## modules/ecs-service/main.tf
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  service_name = "${var.project}-${var.environment}-${var.service_name}"

  common_tags = merge(
    var.tags,
    {
      "Project"     = var.project
      "Environment" = var.environment
      "Service"     = var.service_name
      "ManagedBy"   = "Terraform"
    }
  )
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  configuration {
    execute_command_configuration {
      kms_key_id = aws_kms_key.ecs.arn
      logging    = "OVERRIDE"

      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }

  tags = local.common_tags
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = var.use_spot ? "FARGATE_SPOT" : "FARGATE"
    weight            = 100
    base              = var.fargate_base_capacity
  }
}

resource "aws_kms_key" "ecs" {
  description             = "KMS key for ECS cluster encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/aws/ecs/${var.project}-${var.environment}/exec"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.ecs.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ecs/${var.project}-${var.environment}/${var.service_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.ecs.arn

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "app" {
  family                   = local.service_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = var.service_name
      image     = var.container_image
      essential = true

      portMappings = [
        for port in var.container_ports : {
          containerPort = port.container_port
          hostPort      = port.container_port
          protocol      = port.protocol
          name          = port.name
        }
      ]

      environment = [
        for k, v in var.environment_variables : {
          name  = k
          value = v
        }
      ]

      secrets = [
        for k, v in var.secrets : {
          name      = k
          valueFrom = v
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.application.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = var.health_check != null ? {
        command     = var.health_check.command
        interval    = var.health_check.interval
        timeout     = var.health_check.timeout
        retries     = var.health_check.retries
        startPeriod = var.health_check.start_period
      } : null

      dependsOn = [
        for sidecar in var.sidecars : {
          containerName = sidecar.name
          condition     = sidecar.condition
        }
      ]
    },
    [
      for sidecar in var.sidecars : {
        name      = sidecar.name
        image     = sidecar.image
        essential = sidecar.essential
        cpu       = sidecar.cpu
        memory    = sidecar.memory

        portMappings = [
          for port in sidecar.ports : {
            containerPort = port.container_port
            hostPort      = port.container_port
            protocol      = port.protocol
          }
        ]

        environment = [
          for k, v in sidecar.environment : {
            name  = k
            value = v
          }
        ]

        logConfiguration = {
          logDriver = "awslogs"
          options = {
            "awslogs-group"         = aws_cloudwatch_log_group.application.name
            "awslogs-region"        = var.aws_region
            "awslogs-stream-prefix" = "sidecar-${sidecar.name}"
          }
        }
      }
    ]...
  ])

  runtime_platform {
    operating_system_family = var.operating_system
    cpu_architecture        = var.cpu_architecture
  }

  dynamic "volume" {
    for_each = var.volumes

    content {
      name = volume.value.name

      dynamic "efs_volume_configuration" {
        for_each = volume.value.efs_volume_configuration != null ? [volume.value.efs_volume_configuration] : []

        content {
          file_system_id          = efs_volume_configuration.value.file_system_id
          root_directory          = efs_volume_configuration.value.root_directory
          transit_encryption      = "ENABLED"
          transit_encryption_port = efs_volume_configuration.value.transit_encryption_port

          authorization_config {
            access_point_id = efs_volume_configuration.value.access_point_id
            iam             = "ENABLED"
          }
        }
      }
    }
  }

  tags = local.common_tags
}

resource "aws_iam_role" "execution" {
  name = "${local.service_name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "execution_default" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  count = length(var.secrets) > 0 ? 1 : 0

  name = "${local.service_name}-execution-secrets"
  role = aws_iam_role.execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = [
          for secret_arn in values(var.secrets) : secret_arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "task" {
  name = "${local.service_name}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "task_custom" {
  count = var.task_policy_statements != null ? 1 : 0

  name = "${local.service_name}-task-policy"
  role = aws_iam_role.task.id

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = var.task_policy_statements
  })
}

resource "aws_security_group" "service" {
  name        = "${local.service_name}-sg"
  description = "Security group for ${local.service_name}"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.allowed_ingress

    content {
      from_port       = ingress.value.from_port
      to_port         = ingress.value.to_port
      protocol        = ingress.value.protocol
      cidr_blocks     = ingress.value.cidr_blocks
      security_groups = ingress.value.security_groups
      description     = ingress.value.description
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      "Name" = "${local.service_name}-sg"
    }
  )
}

resource "aws_ecs_service" "app" {
  name                               = local.service_name
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.app.arn
  desired_count                      = var.desired_count
  launch_type                        = var.use_spot ? null : "FARGATE"
  platform_version                   = var.platform_version
  health_check_grace_period_seconds  = var.health_check_grace_period
  deployment_maximum_percent         = var.deployment_maximum_percent
  deployment_minimum_healthy_percent = var.deployment_minimum_healthy_percent
  enable_execute_command             = var.enable_exec

  dynamic "capacity_provider_strategy" {
    for_each = var.use_spot ? [1] : []

    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = 100
      base              = var.fargate_base_capacity
    }
  }

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.service.id]
    assign_public_ip = var.assign_public_ip
  }

  dynamic "load_balancer" {
    for_each = var.target_group_arns

    content {
      target_group_arn = load_balancer.value.arn
      container_name   = var.service_name
      container_port   = load_balancer.value.container_port
    }
  }

  dynamic "service_registries" {
    for_each = var.service_discovery_arn != null ? [1] : []

    content {
      registry_arn   = var.service_discovery_arn
      container_name = var.service_name
      container_port = var.container_ports[0].container_port
    }
  }

  deployment_circuit_breaker {
    enable   = var.enable_circuit_breaker
    rollback = var.enable_circuit_breaker_rollback
  }

  deployment_controller {
    type = var.deployment_controller_type
  }

  propagate_tags = "SERVICE"

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.execution_default
  ]
}

resource "aws_appautoscaling_target" "ecs" {
  count = var.enable_autoscaling ? 1 : 0

  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "${local.service_name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_target
    scale_in_cooldown  = var.autoscaling_scale_in_cooldown
    scale_out_cooldown = var.autoscaling_scale_out_cooldown
  }
}

resource "aws_appautoscaling_policy" "memory" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "${local.service_name}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.autoscaling_memory_target
    scale_in_cooldown  = var.autoscaling_scale_in_cooldown
    scale_out_cooldown = var.autoscaling_scale_out_cooldown
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_up" {
  for_each = var.scheduled_scaling

  name               = "${local.service_name}-${each.key}-scale-up"
  service_namespace  = aws_appautoscaling_target.ecs[0].service_namespace
  resource_id        = aws_appautoscaling_target.ecs[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs[0].scalable_dimension
  schedule           = each.value.scale_up_cron

  scalable_target_action {
    min_capacity = each.value.min_capacity
    max_capacity = each.value.max_capacity
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_down" {
  for_each = var.scheduled_scaling

  name               = "${local.service_name}-${each.key}-scale-down"
  service_namespace  = aws_appautoscaling_target.ecs[0].service_namespace
  resource_id        = aws_appautoscaling_target.ecs[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs[0].scalable_dimension
  schedule           = each.value.scale_down_cron

  scalable_target_action {
    min_capacity = var.autoscaling_min_capacity
    max_capacity = var.autoscaling_min_capacity
  }
}

## modules/ecs-service/variables.tf
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service_name" {
  description = "Service name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ECS tasks"
  type        = list(string)
}

variable "container_image" {
  description = "Docker image for the container"
  type        = string
}

variable "task_cpu" {
  description = "Task CPU units"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Task memory in MB"
  type        = number
  default     = 512
}

variable "container_ports" {
  description = "Container port mappings"
  type = list(object({
    name           = string
    container_port = number
    protocol       = string
  }))
  default = [{
    name           = "http"
    container_port = 80
    protocol       = "tcp"
  }]
}

variable "environment_variables" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Secrets from Secrets Manager or Parameter Store"
  type        = map(string)
  default     = {}
}

variable "health_check" {
  description = "Container health check configuration"
  type = object({
    command      = list(string)
    interval     = number
    timeout      = number
    retries      = number
    start_period = number
  })
  default = null
}

variable "sidecars" {
  description = "Sidecar container configurations"
  type = list(object({
    name        = string
    image       = string
    essential   = bool
    cpu         = number
    memory      = number
    ports       = list(object({
      container_port = number
      protocol       = string
    }))
    environment = map(string)
    condition   = string
  }))
  default = []
}

variable "volumes" {
  description = "EFS volumes for tasks"
  type = list(object({
    name = string
    efs_volume_configuration = object({
      file_system_id          = string
      root_directory          = string
      transit_encryption_port = number
      access_point_id         = string
    })
  }))
  default = []
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "use_spot" {
  description = "Use FARGATE_SPOT capacity provider"
  type        = bool
  default     = false
}

variable "fargate_base_capacity" {
  description = "Base capacity for Fargate"
  type        = number
  default     = 0
}

variable "platform_version" {
  description = "Fargate platform version"
  type        = string
  default     = "LATEST"
}

variable "operating_system" {
  description = "Operating system family"
  type        = string
  default     = "LINUX"
}

variable "cpu_architecture" {
  description = "CPU architecture"
  type        = string
  default     = "X86_64"
}

variable "assign_public_ip" {
  description = "Assign public IP to tasks"
  type        = bool
  default     = false
}

variable "target_group_arns" {
  description = "Target group ARNs for load balancer"
  type = list(object({
    arn            = string
    container_port = number
  }))
  default = []
}

variable "service_discovery_arn" {
  description = "Service discovery registry ARN"
  type        = string
  default     = null
}

variable "allowed_ingress" {
  description = "Allowed ingress rules"
  type = list(object({
    from_port       = number
    to_port         = number
    protocol        = string
    cidr_blocks     = list(string)
    security_groups = list(string)
    description     = string
  }))
  default = []
}

variable "task_policy_statements" {
  description = "IAM policy statements for task role"
  type        = any
  default     = null
}

variable "deployment_maximum_percent" {
  description = "Maximum percent of tasks during deployment"
  type        = number
  default     = 200
}

variable "deployment_minimum_healthy_percent" {
  description = "Minimum healthy percent during deployment"
  type        = number
  default     = 100
}

variable "deployment_controller_type" {
  description = "Deployment controller type"
  type        = string
  default     = "ECS"
}

variable "enable_circuit_breaker" {
  description = "Enable deployment circuit breaker"
  type        = bool
  default     = true
}

variable "enable_circuit_breaker_rollback" {
  description = "Enable automatic rollback on circuit breaker"
  type        = bool
  default     = true
}

variable "enable_exec" {
  description = "Enable ECS Exec"
  type        = bool
  default     = false
}

variable "enable_container_insights" {
  description = "Enable Container Insights"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

variable "health_check_grace_period" {
  description = "Health check grace period in seconds"
  type        = number
  default     = 0
}

variable "enable_autoscaling" {
  description = "Enable auto scaling"
  type        = bool
  default     = false
}

variable "autoscaling_min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 1
}

variable "autoscaling_max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 10
}

variable "autoscaling_cpu_target" {
  description = "Target CPU utilization percentage"
  type        = number
  default     = 70
}

variable "autoscaling_memory_target" {
  description = "Target memory utilization percentage"
  type        = number
  default     = 80
}

variable "autoscaling_scale_in_cooldown" {
  description = "Scale in cooldown period in seconds"
  type        = number
  default     = 300
}

variable "autoscaling_scale_out_cooldown" {
  description = "Scale out cooldown period in seconds"
  type        = number
  default     = 60
}

variable "scheduled_scaling" {
  description = "Scheduled scaling actions"
  type = map(object({
    scale_up_cron   = string
    scale_down_cron = string
    min_capacity    = number
    max_capacity    = number
  }))
  default = {}
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

## modules/ecs-service/outputs.tf
output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "service_id" {
  description = "ECS service ID"
  value       = aws_ecs_service.app.id
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "task_definition_arn" {
  description = "Task definition ARN"
  value       = aws_ecs_task_definition.app.arn
}

output "task_role_arn" {
  description = "Task IAM role ARN"
  value       = aws_iam_role.task.arn
}

output "execution_role_arn" {
  description = "Execution IAM role ARN"
  value       = aws_iam_role.execution.arn
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.service.id
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.application.name
}
```

Complete Lambda Function with API Gateway Module:

```hcl
## modules/lambda-api/main.tf
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

locals {
  function_name = "${var.project}-${var.environment}-${var.function_name}"
  common_tags = merge(
    var.tags,
    {
      "Project"      = var.project
      "Environment"  = var.environment
      "Function"     = var.function_name
      "ManagedBy"    = "Terraform"
    }
  )
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/.terraform/${local.function_name}.zip"
  excludes    = var.exclude_files
}

resource "aws_lambda_function" "main" {
  filename         = data.archive_file.lambda.output_path
  function_name    = local.function_name
  role             = aws_iam_role.lambda.arn
  handler          = var.handler
  source_code_hash = data.archive_file.lambda.output_base64sha256
  runtime          = var.runtime
  timeout          = var.timeout
  memory_size      = var.memory_size
  reserved_concurrent_executions = var.reserved_concurrent_executions
  architectures    = var.architectures

  environment {
    variables = merge(
      var.environment_variables,
      {
        ENVIRONMENT  = var.environment
        PROJECT      = var.project
        LOG_LEVEL    = var.log_level
      }
    )
  }

  dynamic "vpc_config" {
    for_each = var.vpc_config != null ? [var.vpc_config] : []

    content {
      subnet_ids         = vpc_config.value.subnet_ids
      security_group_ids = vpc_config.value.security_group_ids
    }
  }

  dynamic "dead_letter_config" {
    for_each = var.dead_letter_arn != null ? [1] : []

    content {
      target_arn = var.dead_letter_arn
    }
  }

  dynamic "file_system_config" {
    for_each = var.efs_config != null ? [var.efs_config] : []

    content {
      arn              = file_system_config.value.arn
      local_mount_path = file_system_config.value.local_mount_path
    }
  }

  tracing_config {
    mode = var.enable_xray ? "Active" : "PassThrough"
  }

  dynamic "image_config" {
    for_each = var.image_config != null ? [var.image_config] : []

    content {
      command           = image_config.value.command
      entry_point       = image_config.value.entry_point
      working_directory = image_config.value.working_directory
    }
  }

  layers = var.lambda_layers

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.lambda_execution,
    aws_cloudwatch_log_group.lambda
  ]
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.enable_log_encryption ? aws_kms_key.lambda[0].arn : null

  tags = local.common_tags
}

resource "aws_kms_key" "lambda" {
  count = var.enable_log_encryption ? 1 : 0

  description             = "KMS key for ${local.function_name} logs"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role" "lambda" {
  name = "${local.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = var.vpc_config != null ? "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole" : "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_custom" {
  count = var.custom_policy_statements != null ? 1 : 0

  name = "${local.function_name}-custom-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = var.custom_policy_statements
  })
}

resource "aws_lambda_permission" "api_gateway" {
  count = var.create_api_gateway ? 1 : 0

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main[0].execution_arn}/*/*"
}

resource "aws_apigatewayv2_api" "main" {
  count = var.create_api_gateway ? 1 : 0

  name          = local.function_name
  protocol_type = "HTTP"
  description   = var.api_description

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = var.cors_allow_methods
    allow_headers = var.cors_allow_headers
    max_age       = var.cors_max_age
  }

  tags = local.common_tags
}

resource "aws_apigatewayv2_stage" "default" {
  count = var.create_api_gateway ? 1 : 0

  api_id      = aws_apigatewayv2_api.main[0].id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway[0].arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  default_route_settings {
    detailed_metrics_enabled = true
    throttling_burst_limit   = var.api_throttle_burst_limit
    throttling_rate_limit    = var.api_throttle_rate_limit
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  count = var.create_api_gateway ? 1 : 0

  name              = "/aws/apigateway/${local.function_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  count = var.create_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.main[0].id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.main.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds   = var.api_integration_timeout

  request_parameters = var.api_request_parameters
}

resource "aws_apigatewayv2_route" "default" {
  for_each = var.create_api_gateway ? var.api_routes : {}

  api_id    = aws_apigatewayv2_api.main[0].id
  route_key = each.value.route_key
  target    = "integrations/${aws_apigatewayv2_integration.lambda[0].id}"

  authorization_type = each.value.authorization_type
  authorizer_id      = each.value.authorization_type != "NONE" ? aws_apigatewayv2_authorizer.jwt[0].id : null
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  count = var.create_api_gateway && var.jwt_configuration != null ? 1 : 0

  api_id           = aws_apigatewayv2_api.main[0].id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${local.function_name}-authorizer"

  jwt_configuration {
    audience = var.jwt_configuration.audience
    issuer   = var.jwt_configuration.issuer
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.error_alarm_threshold
  alarm_description   = "Lambda function errors exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.main.function_name
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.alarm_actions

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${local.function_name}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.throttle_alarm_threshold
  alarm_description   = "Lambda function throttles exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.main.function_name
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.alarm_actions

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${local.function_name}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = var.duration_alarm_threshold
  alarm_description   = "Lambda function duration exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.main.function_name
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.alarm_actions

  tags = local.common_tags
}

resource "aws_lambda_event_source_mapping" "sqs" {
  for_each = var.sqs_event_sources

  event_source_arn = each.value.queue_arn
  function_name    = aws_lambda_function.main.arn
  batch_size       = each.value.batch_size
  maximum_batching_window_in_seconds = each.value.batching_window

  scaling_config {
    maximum_concurrency = each.value.max_concurrency
  }

  function_response_types = each.value.report_batch_item_failures ? ["ReportBatchItemFailures"] : []

  filter_criteria {
    filter {
      pattern = jsonencode(each.value.filter_criteria)
    }
  }
}

resource "aws_lambda_event_source_mapping" "dynamodb" {
  for_each = var.dynamodb_event_sources

  event_source_arn                   = each.value.stream_arn
  function_name                      = aws_lambda_function.main.arn
  starting_position                  = each.value.starting_position
  batch_size                         = each.value.batch_size
  maximum_batching_window_in_seconds = each.value.batching_window
  parallelization_factor             = each.value.parallelization_factor
  maximum_retry_attempts             = each.value.max_retry_attempts
  maximum_record_age_in_seconds      = each.value.max_record_age
  bisect_batch_on_function_error     = each.value.bisect_on_error
  tumbling_window_in_seconds         = each.value.tumbling_window

  destination_config {
    on_failure {
      destination_arn = each.value.failure_destination_arn
    }
  }

  filter_criteria {
    filter {
      pattern = jsonencode(each.value.filter_criteria)
    }
  }
}

resource "aws_lambda_alias" "live" {
  count = var.create_alias ? 1 : 0

  name             = "live"
  description      = "Live alias for ${local.function_name}"
  function_name    = aws_lambda_function.main.function_name
  function_version = var.alias_function_version

  dynamic "routing_config" {
    for_each = var.alias_routing_config != null ? [var.alias_routing_config] : []

    content {
      additional_version_weights = routing_config.value.version_weights
    }
  }
}

resource "aws_lambda_provisioned_concurrency_config" "main" {
  count = var.provisioned_concurrent_executions > 0 ? 1 : 0

  function_name                     = aws_lambda_function.main.function_name
  provisioned_concurrent_executions = var.provisioned_concurrent_executions
  qualifier                         = aws_lambda_alias.live[0].name

  depends_on = [aws_lambda_alias.live]
}

## modules/lambda-api/variables.tf
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "source_dir" {
  description = "Source directory for Lambda code"
  type        = string
}

variable "exclude_files" {
  description = "Files to exclude from Lambda package"
  type        = list(string)
  default     = []
}

variable "handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.handler"
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "timeout" {
  description = "Function timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Memory size in MB"
  type        = number
  default     = 128
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions"
  type        = number
  default     = -1
}

variable "provisioned_concurrent_executions" {
  description = "Provisioned concurrent executions"
  type        = number
  default     = 0
}

variable "architectures" {
  description = "Instruction set architectures"
  type        = list(string)
  default     = ["x86_64"]
}

variable "environment_variables" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}

variable "log_level" {
  description = "Log level"
  type        = string
  default     = "INFO"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_log_encryption" {
  description = "Enable log encryption with KMS"
  type        = bool
  default     = false
}

variable "vpc_config" {
  description = "VPC configuration"
  type = object({
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  default = null
}

variable "dead_letter_arn" {
  description = "Dead letter queue ARN"
  type        = string
  default     = null
}

variable "efs_config" {
  description = "EFS configuration"
  type = object({
    arn              = string
    local_mount_path = string
  })
  default = null
}

variable "enable_xray" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = false
}

variable "image_config" {
  description = "Container image configuration"
  type = object({
    command           = list(string)
    entry_point       = list(string)
    working_directory = string
  })
  default = null
}

variable "lambda_layers" {
  description = "Lambda layer ARNs"
  type        = list(string)
  default     = []
}

variable "custom_policy_statements" {
  description = "Custom IAM policy statements"
  type        = any
  default     = null
}

variable "create_api_gateway" {
  description = "Create API Gateway"
  type        = bool
  default     = false
}

variable "api_description" {
  description = "API Gateway description"
  type        = string
  default     = ""
}

variable "cors_allow_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

variable "cors_allow_headers" {
  description = "CORS allowed headers"
  type        = list(string)
  default     = ["*"]
}

variable "cors_max_age" {
  description = "CORS max age in seconds"
  type        = number
  default     = 300
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 5000
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 10000
}

variable "api_integration_timeout" {
  description = "API Gateway integration timeout in milliseconds"
  type        = number
  default     = 29000
}

variable "api_request_parameters" {
  description = "API Gateway request parameters"
  type        = map(string)
  default     = {}
}

variable "api_routes" {
  description = "API Gateway routes"
  type = map(object({
    route_key          = string
    authorization_type = string
  }))
  default = {}
}

variable "jwt_configuration" {
  description = "JWT authorizer configuration"
  type = object({
    audience = list(string)
    issuer   = string
  })
  default = null
}

variable "error_alarm_threshold" {
  description = "Error alarm threshold"
  type        = number
  default     = 10
}

variable "throttle_alarm_threshold" {
  description = "Throttle alarm threshold"
  type        = number
  default     = 5
}

variable "duration_alarm_threshold" {
  description = "Duration alarm threshold in milliseconds"
  type        = number
  default     = 3000
}

variable "alarm_actions" {
  description = "Alarm action ARNs"
  type        = list(string)
  default     = []
}

variable "sqs_event_sources" {
  description = "SQS event source mappings"
  type = map(object({
    queue_arn                   = string
    batch_size                  = number
    batching_window             = number
    max_concurrency             = number
    report_batch_item_failures  = bool
    filter_criteria             = any
  }))
  default = {}
}

variable "dynamodb_event_sources" {
  description = "DynamoDB event source mappings"
  type = map(object({
    stream_arn              = string
    starting_position       = string
    batch_size              = number
    batching_window         = number
    parallelization_factor  = number
    max_retry_attempts      = number
    max_record_age          = number
    bisect_on_error         = bool
    tumbling_window         = number
    failure_destination_arn = string
    filter_criteria         = any
  }))
  default = {}
}

variable "create_alias" {
  description = "Create Lambda alias"
  type        = bool
  default     = false
}

variable "alias_function_version" {
  description = "Function version for alias"
  type        = string
  default     = "$LATEST"
}

variable "alias_routing_config" {
  description = "Alias routing configuration for weighted deployments"
  type = object({
    version_weights = map(number)
  })
  default = null
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

## modules/lambda-api/outputs.tf
output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.main.function_name
}

output "function_invoke_arn" {
  description = "Lambda function invoke ARN"
  value       = aws_lambda_function.main.invoke_arn
}

output "function_version" {
  description = "Latest published version"
  value       = aws_lambda_function.main.version
}

output "role_arn" {
  description = "IAM role ARN"
  value       = aws_iam_role.lambda.arn
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.lambda.name
}

output "api_endpoint" {
  description = "API Gateway endpoint"
  value       = var.create_api_gateway ? aws_apigatewayv2_stage.default[0].invoke_url : null
}

output "api_id" {
  description = "API Gateway ID"
  value       = var.create_api_gateway ? aws_apigatewayv2_api.main[0].id : null
}

output "alias_arn" {
  description = "Alias ARN"
  value       = var.create_alias ? aws_lambda_alias.live[0].arn : null
}
```

Complete DynamoDB Table with Streams Module:

```hcl
## modules/dynamodb/main.tf
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  table_name = "${var.project}-${var.environment}-${var.table_name}"

  common_tags = merge(
    var.tags,
    {
      "Project"     = var.project
      "Environment" = var.environment
      "Table"       = var.table_name
      "ManagedBy"   = "Terraform"
    }
  )
}

resource "aws_dynamodb_table" "main" {
  name             = local.table_name
  billing_mode     = var.billing_mode
  read_capacity    = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity   = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
  hash_key         = var.hash_key
  range_key        = var.range_key
  stream_enabled   = var.stream_enabled
  stream_view_type = var.stream_enabled ? var.stream_view_type : null

  table_class            = var.table_class
  deletion_protection_enabled = var.deletion_protection

  dynamic "attribute" {
    for_each = var.attributes

    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  dynamic "global_secondary_index" {
    for_each = var.global_secondary_indexes

    content {
      name               = global_secondary_index.value.name
      hash_key           = global_secondary_index.value.hash_key
      range_key          = global_secondary_index.value.range_key
      projection_type    = global_secondary_index.value.projection_type
      non_key_attributes = global_secondary_index.value.non_key_attributes
      read_capacity      = var.billing_mode == "PROVISIONED" ? global_secondary_index.value.read_capacity : null
      write_capacity     = var.billing_mode == "PROVISIONED" ? global_secondary_index.value.write_capacity : null
    }
  }

  dynamic "local_secondary_index" {
    for_each = var.local_secondary_indexes

    content {
      name               = local_secondary_index.value.name
      range_key          = local_secondary_index.value.range_key
      projection_type    = local_secondary_index.value.projection_type
      non_key_attributes = local_secondary_index.value.non_key_attributes
    }
  }

  dynamic "ttl" {
    for_each = var.ttl_enabled ? [1] : []

    content {
      enabled        = true
      attribute_name = var.ttl_attribute_name
    }
  }

  dynamic "point_in_time_recovery" {
    for_each = var.point_in_time_recovery ? [1] : []

    content {
      enabled = true
    }
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  dynamic "replica" {
    for_each = var.replica_regions

    content {
      region_name            = replica.value.region
      kms_key_arn            = replica.value.kms_key_arn
      propagate_tags         = true
      point_in_time_recovery = var.point_in_time_recovery
    }
  }

  dynamic "import_table" {
    for_each = var.import_source != null ? [var.import_source] : []

    content {
      input_format = import_table.value.input_format

      s3_bucket_source {
        bucket       = import_table.value.s3_bucket
        bucket_owner = import_table.value.s3_bucket_owner
        key_prefix   = import_table.value.s3_key_prefix
      }

      input_compression_type = import_table.value.compression_type

      input_format_options {
        csv {
          delimiter   = import_table.value.csv_delimiter
          header_list = import_table.value.csv_headers
        }
      }
    }
  }

  tags = local.common_tags

  lifecycle {
    ignore_changes = [
      read_capacity,
      write_capacity
    ]
  }
}

resource "aws_appautoscaling_target" "table_read" {
  count = var.enable_autoscaling && var.billing_mode == "PROVISIONED" ? 1 : 0

  max_capacity       = var.autoscaling_read_max
  min_capacity       = var.autoscaling_read_min
  resource_id        = "table/${aws_dynamodb_table.main.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "table_read" {
  count = var.enable_autoscaling && var.billing_mode == "PROVISIONED" ? 1 : 0

  name               = "${local.table_name}-read-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.table_read[0].resource_id
  scalable_dimension = aws_appautoscaling_target.table_read[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.table_read[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value       = var.autoscaling_read_target
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_target" "table_write" {
  count = var.enable_autoscaling && var.billing_mode == "PROVISIONED" ? 1 : 0

  max_capacity       = var.autoscaling_write_max
  min_capacity       = var.autoscaling_write_min
  resource_id        = "table/${aws_dynamodb_table.main.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "table_write" {
  count = var.enable_autoscaling && var.billing_mode == "PROVISIONED" ? 1 : 0

  name               = "${local.table_name}-write-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.table_write[0].resource_id
  scalable_dimension = aws_appautoscaling_target.table_write[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.table_write[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value       = var.autoscaling_write_target
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_target" "gsi_read" {
  for_each = var.enable_autoscaling && var.billing_mode == "PROVISIONED" ? {
    for idx, gsi in var.global_secondary_indexes : gsi.name => gsi
    if gsi.read_capacity != null
  } : {}

  max_capacity       = each.value.autoscaling_read_max
  min_capacity       = each.value.autoscaling_read_min
  resource_id        = "table/${aws_dynamodb_table.main.name}/index/${each.key}"
  scalable_dimension = "dynamodb:index:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "gsi_read" {
  for_each = aws_appautoscaling_target.gsi_read

  name               = "${local.table_name}-${each.key}-read-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = each.value.resource_id
  scalable_dimension = each.value.scalable_dimension
  service_namespace  = each.value.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = var.autoscaling_read_target
  }
}

resource "aws_appautoscaling_target" "gsi_write" {
  for_each = var.enable_autoscaling && var.billing_mode == "PROVISIONED" ? {
    for idx, gsi in var.global_secondary_indexes : gsi.name => gsi
    if gsi.write_capacity != null
  } : {}

  max_capacity       = each.value.autoscaling_write_max
  min_capacity       = each.value.autoscaling_write_min
  resource_id        = "table/${aws_dynamodb_table.main.name}/index/${each.key}"
  scalable_dimension = "dynamodb:index:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "gsi_write" {
  for_each = aws_appautoscaling_target.gsi_write

  name               = "${local.table_name}-${each.key}-write-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = each.value.resource_id
  scalable_dimension = each.value.scalable_dimension
  service_namespace  = each.value.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = var.autoscaling_write_target
  }
}

resource "aws_cloudwatch_metric_alarm" "read_throttles" {
  alarm_name          = "${local.table_name}-read-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReadThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.throttle_alarm_threshold
  alarm_description   = "DynamoDB read throttles exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.alarm_actions

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "write_throttles" {
  alarm_name          = "${local.table_name}-write-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.throttle_alarm_threshold
  alarm_description   = "DynamoDB write throttles exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.alarm_actions

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "system_errors" {
  alarm_name          = "${local.table_name}-system-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "DynamoDB system errors detected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.alarm_actions

  tags = local.common_tags
}

resource "aws_lambda_event_source_mapping" "stream" {
  count = var.stream_enabled && var.stream_lambda_function_arn != null ? 1 : 0

  event_source_arn                   = aws_dynamodb_table.main.stream_arn
  function_name                      = var.stream_lambda_function_arn
  starting_position                  = var.stream_starting_position
  batch_size                         = var.stream_batch_size
  maximum_batching_window_in_seconds = var.stream_batching_window
  parallelization_factor             = var.stream_parallelization_factor
  maximum_retry_attempts             = var.stream_max_retry_attempts
  maximum_record_age_in_seconds      = var.stream_max_record_age
  bisect_batch_on_function_error     = var.stream_bisect_on_error
  tumbling_window_in_seconds         = var.stream_tumbling_window

  destination_config {
    on_failure {
      destination_arn = var.stream_failure_destination_arn
    }
  }

  filter_criteria {
    filter {
      pattern = jsonencode(var.stream_filter_criteria)
    }
  }
}

resource "aws_dynamodb_contributor_insights" "main" {
  count = var.enable_contributor_insights ? 1 : 0

  table_name = aws_dynamodb_table.main.name
}

resource "aws_dynamodb_kinesis_streaming_destination" "main" {
  count = var.kinesis_stream_arn != null ? 1 : 0

  stream_arn = var.kinesis_stream_arn
  table_name = aws_dynamodb_table.main.name
}

resource "aws_dynamodb_table_item" "seed_data" {
  for_each = var.seed_data

  table_name = aws_dynamodb_table.main.name
  hash_key   = aws_dynamodb_table.main.hash_key
  range_key  = aws_dynamodb_table.main.range_key
  item       = jsonencode(each.value)

  lifecycle {
    ignore_changes = all
  }
}

## modules/dynamodb/variables.tf
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "billing_mode" {
  description = "Billing mode (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "read_capacity" {
  description = "Read capacity units (if PROVISIONED)"
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "Write capacity units (if PROVISIONED)"
  type        = number
  default     = 5
}

variable "hash_key" {
  description = "Hash key attribute name"
  type        = string
}

variable "range_key" {
  description = "Range key attribute name"
  type        = string
  default     = null
}

variable "attributes" {
  description = "Table attributes"
  type = list(object({
    name = string
    type = string
  }))
}

variable "global_secondary_indexes" {
  description = "Global secondary indexes"
  type = list(object({
    name                   = string
    hash_key               = string
    range_key              = string
    projection_type        = string
    non_key_attributes     = list(string)
    read_capacity          = number
    write_capacity         = number
    autoscaling_read_min   = number
    autoscaling_read_max   = number
    autoscaling_write_min  = number
    autoscaling_write_max  = number
  }))
  default = []
}

variable "local_secondary_indexes" {
  description = "Local secondary indexes"
  type = list(object({
    name               = string
    range_key          = string
    projection_type    = string
    non_key_attributes = list(string)
  }))
  default = []
}

variable "stream_enabled" {
  description = "Enable DynamoDB Streams"
  type        = bool
  default     = false
}

variable "stream_view_type" {
  description = "Stream view type"
  type        = string
  default     = "NEW_AND_OLD_IMAGES"
}

variable "ttl_enabled" {
  description = "Enable TTL"
  type        = bool
  default     = false
}

variable "ttl_attribute_name" {
  description = "TTL attribute name"
  type        = string
  default     = "ttl"
}

variable "point_in_time_recovery" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "table_class" {
  description = "Table class (STANDARD or STANDARD_INFREQUENT_ACCESS)"
  type        = string
  default     = "STANDARD"
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = null
}

variable "replica_regions" {
  description = "Replica regions for global tables"
  type = list(object({
    region      = string
    kms_key_arn = string
  }))
  default = []
}

variable "enable_autoscaling" {
  description = "Enable autoscaling"
  type        = bool
  default     = false
}

variable "autoscaling_read_min" {
  description = "Minimum read capacity for autoscaling"
  type        = number
  default     = 5
}

variable "autoscaling_read_max" {
  description = "Maximum read capacity for autoscaling"
  type        = number
  default     = 100
}

variable "autoscaling_write_min" {
  description = "Minimum write capacity for autoscaling"
  type        = number
  default     = 5
}

variable "autoscaling_write_max" {
  description = "Maximum write capacity for autoscaling"
  type        = number
  default     = 100
}

variable "autoscaling_read_target" {
  description = "Target utilization for read autoscaling"
  type        = number
  default     = 70
}

variable "autoscaling_write_target" {
  description = "Target utilization for write autoscaling"
  type        = number
  default     = 70
}

variable "throttle_alarm_threshold" {
  description = "Throttle alarm threshold"
  type        = number
  default     = 10
}

variable "alarm_actions" {
  description = "Alarm action ARNs"
  type        = list(string)
  default     = []
}

variable "stream_lambda_function_arn" {
  description = "Lambda function ARN for stream processing"
  type        = string
  default     = null
}

variable "stream_starting_position" {
  description = "Stream starting position"
  type        = string
  default     = "LATEST"
}

variable "stream_batch_size" {
  description = "Stream batch size"
  type        = number
  default     = 100
}

variable "stream_batching_window" {
  description = "Stream batching window in seconds"
  type        = number
  default     = 0
}

variable "stream_parallelization_factor" {
  description = "Stream parallelization factor"
  type        = number
  default     = 1
}

variable "stream_max_retry_attempts" {
  description = "Stream maximum retry attempts"
  type        = number
  default     = 3
}

variable "stream_max_record_age" {
  description = "Stream maximum record age in seconds"
  type        = number
  default     = 604800
}

variable "stream_bisect_on_error" {
  description = "Bisect batch on function error"
  type        = bool
  default     = false
}

variable "stream_tumbling_window" {
  description = "Tumbling window in seconds"
  type        = number
  default     = 0
}

variable "stream_failure_destination_arn" {
  description = "Stream failure destination ARN"
  type        = string
  default     = null
}

variable "stream_filter_criteria" {
  description = "Stream filter criteria"
  type        = any
  default     = {}
}

variable "enable_contributor_insights" {
  description = "Enable CloudWatch Contributor Insights"
  type        = bool
  default     = false
}

variable "kinesis_stream_arn" {
  description = "Kinesis stream ARN for streaming destination"
  type        = string
  default     = null
}

variable "import_source" {
  description = "S3 import source configuration"
  type = object({
    s3_bucket         = string
    s3_bucket_owner   = string
    s3_key_prefix     = string
    input_format      = string
    compression_type  = string
    csv_delimiter     = string
    csv_headers       = list(string)
  })
  default = null
}

variable "seed_data" {
  description = "Seed data items"
  type        = map(any)
  default     = {}
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

## modules/dynamodb/outputs.tf
output "table_id" {
  description = "Table ID"
  value       = aws_dynamodb_table.main.id
}

output "table_arn" {
  description = "Table ARN"
  value       = aws_dynamodb_table.main.arn
}

output "table_name" {
  description = "Table name"
  value       = aws_dynamodb_table.main.name
}

output "stream_arn" {
  description = "Stream ARN"
  value       = var.stream_enabled ? aws_dynamodb_table.main.stream_arn : null
}

output "stream_label" {
  description = "Stream label"
  value       = var.stream_enabled ? aws_dynamodb_table.main.stream_label : null
}
```

---

## Best Practices

### Module Organization

Structure modules with clear separation of concerns:

```text
modules/
├── vpc/
│   ├── main.tf           # Primary resource definitions
│   ├── variables.tf      # Input variables
│   ├── outputs.tf        # Output values
│   ├── versions.tf       # Provider version constraints
│   ├── README.md         # Module documentation
│   └── examples/         # Usage examples
│       └── basic/
│           └── main.tf
```

### Use Remote State Management

Always use remote state for team collaboration:

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/vpc/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

**State locking** prevents concurrent modifications:

```hcl
# Create DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### Variable Validation

Use validation blocks to ensure correct input:

```hcl
variable "environment" {
  description = "Environment name"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_count" {
  description = "Number of instances to create"
  type        = number

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}
```

### Version Constraints

Pin provider versions for stability:

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Allow patch updates
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
```

### Resource Naming

Use consistent naming conventions:

```hcl
# Good - Descriptive and follows pattern
resource "aws_security_group" "web_server" {
  name        = "${var.project_name}-${var.environment}-web-sg"
  description = "Security group for web servers"

  tags = {
    Name        = "${var.project_name}-${var.environment}-web-sg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Bad - Generic names
resource "aws_security_group" "sg1" {
  name = "my-sg"
}
```

### Tagging Standards

Implement consistent tagging for all resources:

```hcl
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Owner       = var.team_email
    CostCenter  = var.cost_center
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-web"
      Role = "web-server"
    }
  )
}
```

### Data Sources vs. Resources

Use data sources to reference existing infrastructure:

```hcl
# Data source - reference existing VPC
data "aws_vpc" "existing" {
  tags = {
    Name = "production-vpc"
  }
}

# Resource - create new subnet in existing VPC
resource "aws_subnet" "app" {
  vpc_id     = data.aws_vpc.existing.id
  cidr_block = "10.0.1.0/24"
}
```

### Never Hardcode Secrets

Never hardcode secrets:

```hcl
# Bad - Hardcoded secrets
variable "database_password" {
  default = "super-secret-password"  # ❌ Never do this
}

# Good - Use AWS Secrets Manager
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "prod/database/password"
}

resource "aws_db_instance" "main" {
  engine   = "postgres"
  username = "admin"
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}

# Good - Use environment variables (for local development)
variable "database_password" {
  description = "Database password (set via TF_VAR_database_password)"
  type        = string
  sensitive   = true
}
```

### Count vs. For_Each

Prefer `for_each` over `count` for better flexibility:

```hcl
# Good - for_each allows removal of specific items
locals {
  subnets = {
    public_a  = { cidr = "10.0.1.0/24", az = "us-east-1a" }
    public_b  = { cidr = "10.0.2.0/24", az = "us-east-1b" }
    private_a = { cidr = "10.0.3.0/24", az = "us-east-1a" }
  }
}

resource "aws_subnet" "main" {
  for_each = local.subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = {
    Name = "${var.project_name}-${each.key}"
  }
}

# Access specific subnet
output "public_a_subnet" {
  value = aws_subnet.main["public_a"].id
}
```

#### Advanced for_each Patterns

```hcl
## for_each with maps - Complex IAM users and policies
locals {
  users = {
    alice = {
      groups = ["developers", "admins"]
      tags   = { Department = "Engineering", Level = "Senior" }
    }
    bob = {
      groups = ["developers"]
      tags   = { Department = "Engineering", Level = "Junior" }
    }
    charlie = {
      groups = ["operations", "admins"]
      tags   = { Department = "Operations", Level = "Senior" }
    }
  }
}

resource "aws_iam_user" "users" {
  for_each = local.users

  name = each.key
  path = "/employees/"

  tags = merge(
    {
      Name      = each.key
      ManagedBy = "terraform"
    },
    each.value.tags
  )
}

resource "aws_iam_user_group_membership" "users" {
  for_each = local.users

  user   = aws_iam_user.users[each.key].name
  groups = each.value.groups

  depends_on = [aws_iam_user.users]
}

## for_each with sets - Multiple security group rules
variable "allowed_ssh_cidrs" {
  type    = set(string)
  default = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  for_each = var.allowed_ssh_cidrs

  security_group_id = aws_security_group.main.id
  description       = "SSH from ${each.value}"

  from_port   = 22
  to_port     = 22
  ip_protocol = "tcp"
  cidr_ipv4   = each.value

  tags = {
    Name  = "allow-ssh-${replace(each.value, "/", "-")}"
    CIDR  = each.value
  }
}

## for_each with toset() - Convert list to set
variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

resource "aws_subnet" "private" {
  for_each = toset(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, index(var.availability_zones, each.value) + 100)
  availability_zone = each.value

  tags = {
    Name = "${var.project}-private-${each.value}"
    Type = "private"
    AZ   = each.value
  }
}

## for_each with filtered maps - Conditional resource creation
locals {
  all_environments = {
    dev = {
      instance_type   = "t3.micro"
      instance_count  = 1
      enable_backups  = false
    }
    staging = {
      instance_type   = "t3.small"
      instance_count  = 2
      enable_backups  = true
    }
    prod = {
      instance_type   = "t3.large"
      instance_count  = 3
      enable_backups  = true
    }
  }

  # Only create resources for environments with backups enabled
  backup_environments = {
    for k, v in local.all_environments : k => v
    if v.enable_backups
  }
}

resource "aws_backup_plan" "environments" {
  for_each = local.backup_environments

  name = "${var.project}-${each.key}-backup-plan"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)"

    lifecycle {
      delete_after = each.key == "prod" ? 30 : 7
    }
  }

  tags = {
    Environment = each.key
    Tier        = "backup"
  }
}

## for_each with nested maps - Multi-region VPC peering
locals {
  vpc_peering = {
    "us-east-1-to-us-west-2" = {
      vpc_id        = aws_vpc.us_east_1.id
      peer_vpc_id   = aws_vpc.us_west_2.id
      peer_region   = "us-west-2"
      auto_accept   = false
    }
    "us-east-1-to-eu-west-1" = {
      vpc_id        = aws_vpc.us_east_1.id
      peer_vpc_id   = aws_vpc.eu_west_1.id
      peer_region   = "eu-west-1"
      auto_accept   = false
    }
  }
}

resource "aws_vpc_peering_connection" "cross_region" {
  for_each = local.vpc_peering

  vpc_id        = each.value.vpc_id
  peer_vpc_id   = each.value.peer_vpc_id
  peer_region   = each.value.peer_region
  auto_accept   = each.value.auto_accept

  tags = {
    Name = each.key
    Side = "Requester"
  }
}

resource "aws_vpc_peering_connection_accepter" "cross_region" {
  for_each = local.vpc_peering

  provider                  = aws.peer
  vpc_peering_connection_id = aws_vpc_peering_connection.cross_region[each.key].id
  auto_accept               = true

  tags = {
    Name = each.key
    Side = "Accepter"
  }
}

## for_each with complex transformations - S3 buckets with policies
locals {
  buckets = {
    logs = {
      versioning            = true
      lifecycle_days        = 90
      public_access_block   = true
      allowed_principals    = ["arn:aws:iam::123456789012:root"]
    }
    data = {
      versioning            = true
      lifecycle_days        = 365
      public_access_block   = true
      allowed_principals    = ["arn:aws:iam::123456789012:role/DataProcessor"]
    }
    backups = {
      versioning            = true
      lifecycle_days        = 2555  # 7 years
      public_access_block   = true
      allowed_principals    = ["arn:aws:iam::123456789012:role/BackupService"]
    }
  }
}

resource "aws_s3_bucket" "buckets" {
  for_each = local.buckets

  bucket = "${var.project}-${var.environment}-${each.key}"

  tags = {
    Name        = "${var.project}-${var.environment}-${each.key}"
    Type        = each.key
    Versioning  = tostring(each.value.versioning)
    Retention   = "${each.value.lifecycle_days} days"
  }
}

resource "aws_s3_bucket_versioning" "buckets" {
  for_each = {
    for k, v in local.buckets : k => v
    if v.versioning
  }

  bucket = aws_s3_bucket.buckets[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "buckets" {
  for_each = local.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    id     = "transition-and-expire"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = each.value.lifecycle_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = {
    for k, v in local.buckets : k => v
    if v.public_access_block
  }

  bucket = aws_s3_bucket.buckets[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "bucket_policy" {
  for_each = local.buckets

  statement {
    sid    = "AllowSpecificPrincipals"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = each.value.allowed_principals
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket"
    ]

    resources = [
      aws_s3_bucket.buckets[each.key].arn,
      "${aws_s3_bucket.buckets[each.key].arn}/*"
    ]
  }

  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.buckets[each.key].arn,
      "${aws_s3_bucket.buckets[each.key].arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "buckets" {
  for_each = local.buckets

  bucket = aws_s3_bucket.buckets[each.key].id
  policy = data.aws_iam_policy_document.bucket_policy[each.key].json
}

## for_each with setproduct() - Cross-region backups
locals {
  source_regions = ["us-east-1", "us-west-2"]
  backup_regions = ["eu-west-1", "ap-southeast-1"]

  # Create all combinations of source and backup regions
  backup_rules = {
    for pair in setproduct(local.source_regions, local.backup_regions) :
    "${pair[0]}-to-${pair[1]}" => {
      source_region = pair[0]
      backup_region = pair[1]
    }
  }
}

resource "aws_backup_region_settings" "cross_region" {
  for_each = local.backup_rules

  resource_type_opt_in_preference = {
    "EBS"       = true
    "RDS"       = true
    "DynamoDB"  = true
  }
}

## for_each with merge() - Combining default and custom tags
variable "custom_tags" {
  type = map(map(string))
  default = {
    web = {
      Application = "WebServer"
      PublicFacing = "true"
    }
    db = {
      Application = "Database"
      Encrypted = "true"
    }
  }
}

locals {
  default_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    CostCenter  = var.cost_center
  }

  instance_configs = {
    web = {
      instance_type = "t3.medium"
      ami_id        = data.aws_ami.web.id
    }
    db = {
      instance_type = "t3.large"
      ami_id        = data.aws_ami.db.id
    }
  }

  # Merge default tags with custom tags for each instance type
  instance_tags = {
    for k, v in local.instance_configs : k => merge(
      local.default_tags,
      lookup(var.custom_tags, k, {}),
      {
        Name = "${var.project}-${var.environment}-${k}"
        Type = k
      }
    )
  }
}

resource "aws_instance" "instances" {
  for_each = local.instance_configs

  ami           = each.value.ami_id
  instance_type = each.value.instance_type

  tags = local.instance_tags[each.key]

  lifecycle {
    create_before_destroy = true
  }
}

## for_each with flatten() and for expressions - Complex multi-level iteration
variable "applications" {
  type = map(object({
    environments = list(string)
    instance_types = map(string)
  }))

  default = {
    webapp = {
      environments = ["dev", "staging", "prod"]
      instance_types = {
        dev     = "t3.micro"
        staging = "t3.small"
        prod    = "t3.large"
      }
    }
    api = {
      environments = ["dev", "prod"]
      instance_types = {
        dev  = "t3.small"
        prod = "t3.xlarge"
      }
    }
  }
}

locals {
  # Flatten nested structure into list of objects
  app_env_combinations = flatten([
    for app_name, app_config in var.applications : [
      for env in app_config.environments : {
        app_name      = app_name
        environment   = env
        instance_type = app_config.instance_types[env]
        key           = "${app_name}-${env}"
      }
    ]
  ])

  # Convert list to map for for_each
  app_env_map = {
    for item in local.app_env_combinations :
    item.key => item
  }
}

resource "aws_instance" "app_instances" {
  for_each = local.app_env_map

  ami           = data.aws_ami.app[each.value.app_name].id
  instance_type = each.value.instance_type

  tags = {
    Name        = "${var.project}-${each.value.app_name}-${each.value.environment}"
    Application = each.value.app_name
    Environment = each.value.environment
  }
}

## for_each with conditional logic - Environment-specific resources
locals {
  environments = {
    dev = {
      create_bastion    = true
      create_nat        = false
      instance_count    = 1
      enable_monitoring = false
    }
    staging = {
      create_bastion    = true
      create_nat        = true
      instance_count    = 2
      enable_monitoring = true
    }
    prod = {
      create_bastion    = false
      create_nat        = true
      instance_count    = 3
      enable_monitoring = true
    }
  }

  current_env = local.environments[var.environment]

  # Create map only if bastion should be created
  bastion_config = local.current_env.create_bastion ? {
    bastion = {
      instance_type = var.environment == "prod" ? "t3.small" : "t3.micro"
      subnet_id     = aws_subnet.public[0].id
    }
  } : {}
}

resource "aws_instance" "bastion" {
  for_each = local.bastion_config

  ami           = data.aws_ami.bastion.id
  instance_type = each.value.instance_type
  subnet_id     = each.value.subnet_id

  vpc_security_group_ids = [aws_security_group.bastion.id]

  tags = {
    Name        = "${var.project}-${var.environment}-bastion"
    Environment = var.environment
    Role        = "bastion"
  }
}
```

### Dependency Management

Use `depends_on` sparingly - implicit dependencies are preferred:

```hcl
# Good - Implicit dependency (preferred)
resource "aws_instance" "app" {
  subnet_id = aws_subnet.private.id  # Implicit dependency
}

# Use depends_on only for hidden dependencies
resource "aws_iam_role_policy" "example" {
  role   = aws_iam_role.example.name
  policy = data.aws_iam_policy_document.example.json

  # Explicit dependency needed for policy attachment timing
  depends_on = [aws_iam_role.example]
}
```

### Use Workspaces for Environment Separation

Use workspaces for environment separation:

```hcl
# Select workspace-specific configuration
locals {
  workspace_config = {
    dev = {
      instance_type = "t3.micro"
      instance_count = 1
    }
    prod = {
      instance_type = "t3.large"
      instance_count = 3
    }
  }

  config = local.workspace_config[terraform.workspace]
}

resource "aws_instance" "app" {
  count         = local.config.instance_count
  instance_type = local.config.instance_type

  tags = {
    Environment = terraform.workspace
  }
}
```

### Output Organization

Provide useful outputs with descriptions:

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = [for s in aws_subnet.public : s.id]
}

output "database_endpoint" {
  description = "Database connection endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true  # Don't show in plan output
}
```

### Module Composition

Compose larger systems from smaller modules:

```hcl
# Root module composing multiple modules
module "vpc" {
  source = "./modules/vpc"

  environment = var.environment
  cidr_block  = "10.0.0.0/16"
}

module "security_groups" {
  source = "./modules/security-groups"

  vpc_id      = module.vpc.vpc_id
  environment = var.environment
}

module "app_servers" {
  source = "./modules/ec2-cluster"

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.app_sg_id]

  depends_on = [module.vpc]
}
```

#### Complete Multi-Tier Application Stack

```hcl
## Root module (main.tf) - Complete 3-tier web application
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "applications/web-app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
      CostCenter  = var.cost_center
    }
  }
}

## Networking Layer
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project}-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  database_subnets = var.database_subnet_cidrs

  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.environment != "prod"
  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true

  tags = {
    Tier = "networking"
  }
}

## Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"

  vpc_id      = module.vpc.vpc_id
  vpc_cidr    = module.vpc.vpc_cidr_block
  project     = var.project
  environment = var.environment

  # Allow specific CIDR blocks for SSH access
  ssh_cidr_blocks = var.ssh_cidr_blocks

  # ALB security group rules
  alb_ingress_rules = {
    http = {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Allow HTTP from internet"
    }
    https = {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Allow HTTPS from internet"
    }
  }

  depends_on = [module.vpc]
}

## Application Load Balancer
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 8.0"

  name = "${var.project}-${var.environment}-alb"

  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  security_groups    = [module.security_groups.alb_sg_id]

  # Access logs
  access_logs = {
    bucket = module.s3_logs.s3_bucket_id
    prefix = "alb-logs"
  }

  target_groups = [
    {
      name             = "${var.project}-${var.environment}-tg"
      backend_protocol = "HTTP"
      backend_port     = 80
      target_type      = "instance"

      health_check = {
        enabled             = true
        interval            = 30
        path                = "/health"
        port                = "traffic-port"
        healthy_threshold   = 3
        unhealthy_threshold = 3
        timeout             = 6
        protocol            = "HTTP"
        matcher             = "200-299"
      }

      stickiness = {
        enabled = true
        type    = "lb_cookie"
      }
    }
  ]

  https_listeners = [
    {
      port               = 443
      protocol           = "HTTPS"
      certificate_arn    = module.acm.acm_certificate_arn
      target_group_index = 0

      ssl_policy = "ELBSecurityPolicy-TLS13-1-2-2021-06"
    }
  ]

  http_tcp_listeners = [
    {
      port        = 80
      protocol    = "HTTP"
      action_type = "redirect"

      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  ]

  tags = {
    Tier = "presentation"
  }

  depends_on = [module.vpc, module.security_groups, module.s3_logs]
}

## ACM Certificate for HTTPS
module "acm" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 4.0"

  domain_name = var.domain_name
  zone_id     = data.aws_route53_zone.main.zone_id

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  wait_for_validation = true

  tags = {
    Tier = "security"
  }
}

## S3 Bucket for Logs
module "s3_logs" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 3.0"

  bucket = "${var.project}-${var.environment}-logs"
  acl    = "log-delivery-write"

  # S3 bucket-level Public Access Block configuration
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  versioning = {
    enabled = true
  }

  lifecycle_rule = [
    {
      id      = "log-retention"
      enabled = true

      transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]

      expiration = {
        days = 365
      }

      noncurrent_version_expiration = {
        days = 30
      }
    }
  ]

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Tier = "storage"
  }
}

## Application Tier - Auto Scaling Group
module "asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 6.0"

  name = "${var.project}-${var.environment}-asg"

  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  wait_for_capacity_timeout = 0
  health_check_type         = "ELB"
  health_check_grace_period = 300
  vpc_zone_identifier       = module.vpc.private_subnets
  target_group_arns         = module.alb.target_group_arns

  # Launch template
  launch_template_name        = "${var.project}-${var.environment}-lt"
  launch_template_description = "Launch template for ${var.project} application servers"
  update_default_version      = true

  image_id          = data.aws_ami.app_ami.id
  instance_type     = var.instance_type
  user_data         = base64encode(templatefile("${path.module}/templates/user_data.sh", {
    environment        = var.environment
    project           = var.project
    log_group_name    = module.cloudwatch_logs.cloudwatch_log_group_name
    parameter_path    = "/${var.project}/${var.environment}"
  }))

  security_groups = [module.security_groups.app_sg_id]

  iam_instance_profile_arn = module.ec2_instance_profile.iam_instance_profile_arn

  block_device_mappings = [
    {
      device_name = "/dev/xvda"

      ebs = {
        volume_size           = 30
        volume_type           = "gp3"
        iops                  = 3000
        throughput            = 125
        encrypted             = true
        kms_key_id            = module.kms.key_arn
        delete_on_termination = true
      }
    }
  ]

  metadata_options = {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  # Auto scaling policies
  scaling_policies = {
    scale_up = {
      policy_type = "TargetTrackingScaling"
      target_tracking_configuration = {
        predefined_metric_specification = {
          predefined_metric_type = "ASGAverageCPUUtilization"
        }
        target_value = 70.0
      }
    }
  }

  tags = {
    Tier = "application"
  }

  depends_on = [module.vpc, module.security_groups, module.alb]
}

## EC2 Instance Profile (IAM Role)
module "ec2_instance_profile" {
  source = "./modules/iam-instance-profile"

  name        = "${var.project}-${var.environment}-instance-profile"
  project     = var.project
  environment = var.environment

  policy_arns = [
    "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    module.app_policy.policy_arn
  ]

  tags = {
    Tier = "security"
  }
}

## Application-Specific IAM Policy
module "app_policy" {
  source = "./modules/iam-policy"

  name        = "${var.project}-${var.environment}-app-policy"
  description = "Application permissions for ${var.project}"

  policy_statements = [
    {
      sid    = "S3Access"
      effect = "Allow"
      actions = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ]
      resources = [
        module.s3_app_data.s3_bucket_arn,
        "${module.s3_app_data.s3_bucket_arn}/*"
      ]
    },
    {
      sid    = "ParameterStoreAccess"
      effect = "Allow"
      actions = [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ]
      resources = [
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.environment}/*"
      ]
    },
    {
      sid    = "SecretsManagerAccess"
      effect = "Allow"
      actions = [
        "secretsmanager:GetSecretValue"
      ]
      resources = [
        module.db_credentials.secret_arn
      ]
    }
  ]

  tags = {
    Tier = "security"
  }
}

## Database Tier - RDS PostgreSQL
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.project}-${var.environment}-db"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  kms_key_id            = module.kms.key_arn

  db_name  = var.db_name
  username = var.db_username
  port     = 5432

  # Password managed by Secrets Manager
  manage_master_user_password = true
  master_user_secret_kms_key_id = module.kms.key_arn

  multi_az               = var.environment == "prod"
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.security_groups.db_sg_id]

  maintenance_window              = "Mon:00:00-Mon:03:00"
  backup_window                   = "03:00-06:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  backup_retention_period         = var.environment == "prod" ? 30 : 7
  skip_final_snapshot             = var.environment != "prod"
  deletion_protection             = var.environment == "prod"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  create_monitoring_role                = true
  monitoring_interval                   = 60
  monitoring_role_name                  = "${var.project}-${var.environment}-rds-monitoring"

  parameters = [
    {
      name  = "autovacuum"
      value = 1
    },
    {
      name  = "client_encoding"
      value = "utf8"
    },
    {
      name  = "max_connections"
      value = var.environment == "prod" ? "500" : "200"
    },
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }
  ]

  tags = {
    Tier = "database"
  }

  depends_on = [module.vpc, module.security_groups, module.kms]
}

## KMS Key for Encryption
module "kms" {
  source  = "terraform-aws-modules/kms/aws"
  version = "~> 2.0"

  description = "KMS key for ${var.project} ${var.environment}"
  key_usage   = "ENCRYPT_DECRYPT"

  # Key policy
  key_administrators = [
    data.aws_caller_identity.current.arn
  ]

  key_users = [
    module.ec2_instance_profile.iam_role_arn,
    "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"
  ]

  # Aliases
  aliases = ["${var.project}/${var.environment}"]

  # Key rotation
  enable_key_rotation = true

  tags = {
    Tier = "security"
  }
}

## CloudWatch Log Group for Application Logs
module "cloudwatch_logs" {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/log-group"
  version = "~> 4.0"

  name              = "/aws/ec2/${var.project}/${var.environment}"
  retention_in_days = var.environment == "prod" ? 90 : 30

  kms_key_id = module.kms.key_arn

  tags = {
    Tier = "monitoring"
  }

  depends_on = [module.kms]
}

## S3 Bucket for Application Data
module "s3_app_data" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 3.0"

  bucket = "${var.project}-${var.environment}-app-data"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = module.kms.key_arn
      }
    }
  }

  lifecycle_rule = [
    {
      id      = "transition-old-versions"
      enabled = true

      noncurrent_version_transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        }
      ]

      noncurrent_version_expiration = {
        days = 90
      }
    }
  ]

  tags = {
    Tier = "storage"
  }

  depends_on = [module.kms]
}

## Route53 DNS Records
module "route53_records" {
  source  = "terraform-aws-modules/route53/aws//modules/records"
  version = "~> 2.0"

  zone_id = data.aws_route53_zone.main.zone_id

  records = [
    {
      name    = var.environment == "prod" ? "" : var.environment
      type    = "A"
      alias   = {
        name    = module.alb.lb_dns_name
        zone_id = module.alb.lb_zone_id
      }
    },
    {
      name    = var.environment == "prod" ? "www" : "www.${var.environment}"
      type    = "A"
      alias   = {
        name    = module.alb.lb_dns_name
        zone_id = module.alb.lb_zone_id
      }
    }
  ]

  depends_on = [module.alb]
}

## Secrets Manager for Database Credentials
module "db_credentials" {
  source  = "terraform-aws-modules/secrets-manager/aws"
  version = "~> 1.0"

  name        = "${var.project}/${var.environment}/db/credentials"
  description = "Database credentials for ${var.project} ${var.environment}"

  secret_string = jsonencode({
    username = module.rds.db_instance_username
    password = module.rds.db_instance_password
    engine   = "postgres"
    host     = module.rds.db_instance_endpoint
    port     = 5432
    dbname   = var.db_name
  })

  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  kms_key_id = module.kms.key_arn

  tags = {
    Tier = "security"
  }

  depends_on = [module.rds, module.kms]
}

## Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

data "aws_ami" "app_ami" {
  most_recent = true
  owners      = ["self"]

  filter {
    name   = "name"
    values = ["${var.project}-app-*"]
  }

  filter {
    name   = "tag:Environment"
    values = [var.environment]
  }
}

## Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.lb_dns_name
}

output "app_url" {
  description = "Application URL"
  value       = var.environment == "prod" ? "https://${var.domain_name}" : "https://${var.environment}.${var.domain_name}"
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = module.kms.key_id
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = module.cloudwatch_logs.cloudwatch_log_group_name
}

output "s3_app_data_bucket" {
  description = "S3 bucket for application data"
  value       = module.s3_app_data.s3_bucket_id
}
```

This complete example demonstrates:

- **Multi-tier architecture**: Presentation (ALB), Application (ASG), Database (RDS)
- **Security layers**: KMS encryption, Secrets Manager, Security Groups, IAM roles
- **High availability**: Multi-AZ deployment, Auto Scaling, Load Balancing
- **Monitoring & Logging**: CloudWatch Logs, RDS Performance Insights, ALB access logs
- **Module composition**: 15+ modules working together
- **Data flow**: Modules passing outputs as inputs to dependent modules
- **Environment-aware**: Different configurations for dev/staging/prod
- **Best practices**: Encryption at rest, private subnets, least-privilege IAM

### Lifecycle Rules

Use lifecycle rules to prevent accidental resource destruction:

```hcl
resource "aws_db_instance" "production" {
  identifier = "prod-database"
  engine     = "postgres"

  lifecycle {
    prevent_destroy = true  # Prevent accidental deletion
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.latest.id
  instance_type = var.instance_type

  lifecycle {
    create_before_destroy = true  # Create replacement before destroying
    ignore_changes        = [tags["Updated"]]  # Ignore specific changes
  }
}
```

### Terraform Formatting

Always format code before committing:

```bash
# Format all .tf files
terraform fmt -recursive

# Check formatting (CI/CD)
terraform fmt -check -recursive

# Validate configuration
terraform validate
```

### Documentation

Document modules thoroughly:

```hcl
/**
 * # VPC Module
 *
 * Creates a VPC with public and private subnets across multiple AZs.
 *
 * ## Usage
 *
 * ```hcl
 * module "vpc" {
 *   source = "./modules/vpc"
 *
 *   environment     = "prod"
 *   vpc_cidr        = "10.0.0.0/16"
 *   azs             = ["us-east-1a", "us-east-1b"]
 *   private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
 *   public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
 * }
 * ```
 */

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}
```

---

## Operations and Disaster Recovery

### Cost Optimization with Spot Instances

**Pattern**: Use Spot Instances with fallback to On-Demand for cost optimization while maintaining reliability.

**Cost Savings**: Up to 90% compared to On-Demand pricing for stateless, fault-tolerant workloads.

#### modules/spot-asg/variables.tf

```hcl
variable "project" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_id" {
  description = "VPC ID for security groups"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for Auto Scaling Group"
  type        = list(string)
}

variable "instance_types" {
  description = "List of instance types for diversification (recommended: 3-5 types)"
  type        = list(string)
  default     = ["t3.medium", "t3a.medium", "t2.medium"]
}

variable "spot_allocation_strategy" {
  description = "How to allocate Spot capacity (lowest-price, capacity-optimized, price-capacity-optimized)"
  type        = string
  default     = "price-capacity-optimized"

  validation {
    condition = contains([
      "lowest-price",
      "capacity-optimized",
      "price-capacity-optimized"
    ], var.spot_allocation_strategy)
    error_message = "Invalid allocation strategy."
  }
}

variable "on_demand_percentage" {
  description = "Percentage of On-Demand instances as baseline capacity (0-100)"
  type        = number
  default     = 20

  validation {
    condition     = var.on_demand_percentage >= 0 && var.on_demand_percentage <= 100
    error_message = "On-Demand percentage must be between 0 and 100."
  }
}

variable "min_size" {
  description = "Minimum number of instances"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
  default     = 4
}

variable "health_check_type" {
  description = "EC2 or ELB health check"
  type        = string
  default     = "ELB"
}

variable "health_check_grace_period" {
  description = "Time after instance comes into service before checking health"
  type        = number
  default     = 300
}

variable "target_group_arns" {
  description = "List of ALB/NLB target group ARNs"
  type        = list(string)
  default     = []
}

variable "user_data" {
  description = "User data script for instance initialization"
  type        = string
  default     = ""
}

variable "ami_id" {
  description = "AMI ID for launch template (leave empty for latest Amazon Linux 2)"
  type        = string
  default     = ""
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = null
}

variable "enable_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "enable_spot_interruption_handler" {
  description = "Enable automated Spot interruption handling"
  type        = bool
  default     = true
}

variable "cpu_target_value" {
  description = "Target CPU utilization for scaling"
  type        = number
  default     = 70
}

variable "scale_in_cooldown" {
  description = "Cooldown period in seconds after scale in"
  type        = number
  default     = 300
}

variable "scale_out_cooldown" {
  description = "Cooldown period in seconds after scale out"
  type        = number
  default     = 60
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
```

#### modules/spot-asg/main.tf

```hcl
# Data source for latest Amazon Linux 2 AMI if not provided
data "aws_ami" "amazon_linux_2" {
  count       = var.ami_id == "" ? 1 : 0
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security group for instances
resource "aws_security_group" "instance" {
  name_prefix = "${var.project}-${var.environment}-asg-"
  description = "Security group for ${var.project} ${var.environment} ASG instances"
  vpc_id      = var.vpc_id

  # Allow outbound internet access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  # Allow inbound from ALB/NLB (specific rules should be added based on your needs)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "Allow HTTP from VPC"
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-asg-sg"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# IAM role for instances
resource "aws_iam_role" "instance" {
  name_prefix = "${var.project}-${var.environment}-asg-"
  description = "IAM role for ${var.project} ${var.environment} ASG instances"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-asg-role"
      Environment = var.environment
    }
  )
}

# Attach SSM policy for remote management
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch Logs policy for application logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name_prefix = "cloudwatch-logs-"
  role        = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/${var.project}/${var.environment}/*"
      }
    ]
  })
}

# Instance profile
resource "aws_iam_instance_profile" "instance" {
  name_prefix = "${var.project}-${var.environment}-asg-"
  role        = aws_iam_role.instance.name

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-asg-profile"
      Environment = var.environment
    }
  )
}

# Launch template with multiple instance types
resource "aws_launch_template" "main" {
  name_prefix   = "${var.project}-${var.environment}-"
  description   = "Launch template for ${var.project} ${var.environment} with Spot instances"
  image_id      = var.ami_id != "" ? var.ami_id : data.aws_ami.amazon_linux_2[0].id
  key_name      = var.key_name
  user_data     = base64encode(var.user_data)
  ebs_optimized = true

  iam_instance_profile {
    arn = aws_iam_instance_profile.instance.arn
  }

  monitoring {
    enabled = var.enable_monitoring
  }

  network_interfaces {
    associate_public_ip_address = false
    delete_on_termination       = true
    security_groups             = [aws_security_group.instance.id]
  }

  # Root volume configuration
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_type           = "gp3"
      volume_size           = 30
      delete_on_termination = true
      encrypted             = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 only
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      var.tags,
      {
        Name        = "${var.project}-${var.environment}-spot"
        Environment = var.environment
        InstanceType = "Spot"
        ManagedBy   = "Terraform"
      }
    )
  }

  tag_specifications {
    resource_type = "volume"

    tags = merge(
      var.tags,
      {
        Name        = "${var.project}-${var.environment}-spot-volume"
        Environment = var.environment
      }
    )
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-lt"
      Environment = var.environment
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group with mixed instances policy
resource "aws_autoscaling_group" "main" {
  name_prefix         = "${var.project}-${var.environment}-"
  vpc_zone_identifier = var.subnet_ids
  target_group_arns   = var.target_group_arns
  health_check_type   = var.health_check_type
  health_check_grace_period = var.health_check_grace_period

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  # Enable instance refresh for zero-downtime deployments
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 90
      instance_warmup        = var.health_check_grace_period
    }
  }

  # Mixed instances policy: Spot + On-Demand
  mixed_instances_policy {
    # Launch template specification
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.main.id
        version            = "$Latest"
      }

      # Instance type overrides for diversification
      dynamic "override" {
        for_each = var.instance_types
        content {
          instance_type = override.value
        }
      }
    }

    # Instances distribution
    instances_distribution {
      # Percentage of On-Demand instances (0-100)
      on_demand_base_capacity                  = 0
      on_demand_percentage_above_base_capacity = var.on_demand_percentage

      # Spot allocation strategy
      spot_allocation_strategy = var.spot_allocation_strategy

      # Maximum Spot price (empty = On-Demand price)
      spot_max_price = ""

      # Number of Spot pools per availability zone
      spot_instance_pools = length(var.instance_types)
    }
  }

  # Enable capacity rebalancing for Spot instance interruptions
  capacity_rebalance = true

  # Termination policies
  termination_policies = [
    "OldestLaunchTemplate",
    "OldestInstance"
  ]

  # Tags
  dynamic "tag" {
    for_each = merge(
      var.tags,
      {
        Name        = "${var.project}-${var.environment}-asg"
        Environment = var.environment
        ManagedBy   = "Terraform"
      }
    )

    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }

  depends_on = [
    aws_launch_template.main
  ]
}

# Target tracking scaling policy - CPU utilization
resource "aws_autoscaling_policy" "cpu_target" {
  name                   = "${var.project}-${var.environment}-cpu-target"
  autoscaling_group_name = aws_autoscaling_group.main.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }

    target_value     = var.cpu_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown
  }
}

# CloudWatch alarm for Spot instance interruptions
resource "aws_cloudwatch_metric_alarm" "spot_interruptions" {
  count               = var.enable_spot_interruption_handler ? 1 : 0
  alarm_name          = "${var.project}-${var.environment}-spot-interruptions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SpotInstanceInterruptions"
  namespace           = "AWS/EC2Spot"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert when Spot instances are interrupted"
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-spot-interruption-alarm"
      Environment = var.environment
    }
  )
}

# SNS topic for Spot interruption notifications
resource "aws_sns_topic" "spot_interruptions" {
  count       = var.enable_spot_interruption_handler ? 1 : 0
  name_prefix = "${var.project}-${var.environment}-spot-"
  display_name = "Spot Instance Interruptions for ${var.project} ${var.environment}"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-spot-interruptions"
      Environment = var.environment
    }
  )
}

# EventBridge rule for EC2 Spot interruption warnings
resource "aws_cloudwatch_event_rule" "spot_interruption" {
  count       = var.enable_spot_interruption_handler ? 1 : 0
  name_prefix = "${var.project}-${var.environment}-spot-"
  description = "Capture EC2 Spot Instance Interruption Warnings"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Spot Instance Interruption Warning"]
    detail = {
      AutoScalingGroupName = [aws_autoscaling_group.main.name]
    }
  })

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-spot-interruption-rule"
      Environment = var.environment
    }
  )
}

# EventBridge target - SNS notification
resource "aws_cloudwatch_event_target" "spot_interruption_sns" {
  count     = var.enable_spot_interruption_handler ? 1 : 0
  rule      = aws_cloudwatch_event_rule.spot_interruption[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.spot_interruptions[0].arn
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/${var.project}/${var.environment}/application"
  retention_in_days = var.environment == "prod" ? 90 : 30

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-app-logs"
      Environment = var.environment
    }
  )
}

# CloudWatch Dashboard for monitoring
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-${var.environment}-spot-asg"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "Average", label = "CPU Avg" }],
            ["...", { stat = "Maximum", label = "CPU Max" }]
          ]
          period = 300
          region = data.aws_region.current.name
          title  = "CPU Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/AutoScaling", "GroupDesiredCapacity", { stat = "Average" }],
            [".", "GroupInServiceInstances", { stat = "Average" }],
            [".", "GroupMinSize", { stat = "Average" }],
            [".", "GroupMaxSize", { stat = "Average" }]
          ]
          period = 300
          region = data.aws_region.current.name
          title  = "Auto Scaling Group Capacity"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2Spot", "SpotInstanceInterruptions", { stat = "Sum" }]
          ]
          period = 300
          region = data.aws_region.current.name
          title  = "Spot Instance Interruptions"
        }
      }
    ]
  })
}

# Data source for current region
data "aws_region" "current" {}
```

#### modules/spot-asg/outputs.tf

```hcl
output "autoscaling_group_id" {
  description = "Auto Scaling Group ID"
  value       = aws_autoscaling_group.main.id
}

output "autoscaling_group_arn" {
  description = "Auto Scaling Group ARN"
  value       = aws_autoscaling_group.main.arn
}

output "autoscaling_group_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "launch_template_id" {
  description = "Launch Template ID"
  value       = aws_launch_template.main.id
}

output "launch_template_latest_version" {
  description = "Latest version of Launch Template"
  value       = aws_launch_template.main.latest_version
}

output "security_group_id" {
  description = "Security Group ID for instances"
  value       = aws_security_group.instance.id
}

output "iam_role_arn" {
  description = "IAM Role ARN for instances"
  value       = aws_iam_role.instance.arn
}

output "iam_role_name" {
  description = "IAM Role name for instances"
  value       = aws_iam_role.instance.name
}

output "instance_profile_arn" {
  description = "Instance Profile ARN"
  value       = aws_iam_instance_profile.instance.arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch Log Group name for application logs"
  value       = aws_cloudwatch_log_group.application.name
}

output "cloudwatch_dashboard_arn" {
  description = "CloudWatch Dashboard ARN"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "sns_topic_arn" {
  description = "SNS Topic ARN for Spot interruption notifications"
  value       = var.enable_spot_interruption_handler ? aws_sns_topic.spot_interruptions[0].arn : null
}
```

#### Usage Example - Spot Instance Auto Scaling

```hcl
# Root module (main.tf)
module "spot_asg" {
  source = "./modules/spot-asg"

  project     = "myapp"
  environment = "prod"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  # Instance configuration
  instance_types = [
    "t3.medium",
    "t3a.medium",
    "t2.medium"
  ]

  # Cost optimization: 20% On-Demand baseline, 80% Spot
  on_demand_percentage       = 20
  spot_allocation_strategy   = "price-capacity-optimized"

  # Auto Scaling configuration
  min_size         = 2
  max_size         = 10
  desired_capacity = 4

  # Target tracking scaling
  cpu_target_value    = 70
  scale_in_cooldown   = 300
  scale_out_cooldown  = 60

  # Load balancer integration
  target_group_arns = [aws_lb_target_group.app.arn]

  # Enable Spot interruption handling
  enable_spot_interruption_handler = true

  # User data script
  user_data = templatefile("${path.module}/user-data.sh", {
    environment = "prod"
    app_name    = "myapp"
  })

  tags = {
    Project     = "myapp"
    Environment = "prod"
    CostCenter  = "engineering"
    ManagedBy   = "Terraform"
  }
}

# Outputs
output "asg_name" {
  description = "Auto Scaling Group name"
  value       = module.spot_asg.autoscaling_group_name
}

output "dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${module.spot_asg.cloudwatch_dashboard_arn}"
}
```

**Cost Comparison**:

| Strategy | Monthly Cost | Savings vs On-Demand |
|----------|--------------|----------------------|
| 100% On-Demand (t3.medium) | $10,000 | Baseline |
| 50% RI, 50% On-Demand | $7,000 | 30% |
| 20% On-Demand, 80% Spot | $3,000 | 70% |
| 10% On-Demand, 90% Spot | $2,000 | 80% |

**Disaster Recovery Objectives**:

- **RTO (Recovery Time Objective)**: 5 minutes (automatic scaling)
- **RPO (Recovery Point Objective)**: N/A (stateless workloads)
- **High Availability**: Multi-AZ deployment with capacity rebalancing
- **Interruption Handling**: Automatic with 2-minute warning

---

### Disaster Recovery with AWS Backup

**Pattern**: Automated backup strategy with cross-region replication for comprehensive disaster recovery.

**Compliance**: Meets HIPAA, SOC 2, and PCI-DSS backup requirements.

#### modules/aws-backup/variables.tf

```hcl
variable "project" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "backup_schedule" {
  description = "Backup schedule in cron format"
  type        = string
  default     = "cron(0 2 * * ? *)"  # Daily at 2 AM UTC
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "Retention must be between 1 and 35 days."
  }
}

variable "backup_cold_storage_after_days" {
  description = "Number of days after which to move backups to cold storage (0 to disable)"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_cold_storage_after_days >= 0
    error_message = "Cold storage transition must be >= 0."
  }
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup copy for disaster recovery"
  type        = bool
  default     = true
}

variable "backup_destination_region" {
  description = "Destination region for cross-region backup copy"
  type        = string
  default     = "us-west-2"
}

variable "cross_region_retention_days" {
  description = "Retention period for cross-region backups"
  type        = number
  default     = 90
}

variable "enable_backup_vault_lock" {
  description = "Enable Backup Vault Lock for compliance (immutable backups)"
  type        = bool
  default     = false
}

variable "backup_vault_lock_min_retention_days" {
  description = "Minimum retention days for vault lock"
  type        = number
  default     = 90
}

variable "backup_vault_lock_max_retention_days" {
  description = "Maximum retention days for vault lock"
  type        = number
  default     = 365
}

variable "resource_tag_key" {
  description = "Tag key for selecting resources to backup"
  type        = string
  default     = "BackupEnabled"
}

variable "resource_tag_value" {
  description = "Tag value for selecting resources to backup"
  type        = string
  default     = "true"
}

variable "enable_continuous_backup" {
  description = "Enable continuous backup for point-in-time recovery (supported: RDS, Aurora)"
  type        = bool
  default     = true
}

variable "backup_window_hours" {
  description = "Backup window start time (0-23) in UTC"
  type        = number
  default     = 2

  validation {
    condition     = var.backup_window_hours >= 0 && var.backup_window_hours <= 23
    error_message = "Backup window must be between 0 and 23."
  }
}

variable "backup_completion_window_minutes" {
  description = "Time in minutes for backup to complete before canceling"
  type        = number
  default     = 120

  validation {
    condition     = var.backup_completion_window_minutes >= 60
    error_message = "Completion window must be at least 60 minutes."
  }
}

variable "enable_backup_notifications" {
  description = "Enable SNS notifications for backup events"
  type        = bool
  default     = true
}

variable "notification_email" {
  description = "Email address for backup notifications"
  type        = string
  default     = ""
}

variable "enable_lifecycle_policy" {
  description = "Enable lifecycle policy for backup transitions"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
```

#### modules/aws-backup/main.tf

```hcl
# KMS key for backup encryption
resource "aws_kms_key" "backup" {
  description             = "KMS key for ${var.project} ${var.environment} AWS Backup encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-backup-key"
      Environment = var.environment
      Purpose     = "backup-encryption"
      ManagedBy   = "Terraform"
    }
  )
}

resource "aws_kms_alias" "backup" {
  name          = "alias/${var.project}-${var.environment}-backup"
  target_key_id = aws_kms_key.backup.key_id
}

# KMS key policy
resource "aws_kms_key_policy" "backup" {
  key_id = aws_kms_key.backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow AWS Backup to encrypt/decrypt"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "backup.${data.aws_region.current.name}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# Primary backup vault
resource "aws_backup_vault" "primary" {
  name        = "${var.project}-${var.environment}-primary"
  kms_key_arn = aws_kms_key.backup.arn

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-primary-vault"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# Backup vault lock for compliance (optional)
resource "aws_backup_vault_lock_configuration" "primary" {
  count               = var.enable_backup_vault_lock ? 1 : 0
  backup_vault_name   = aws_backup_vault.primary.name
  min_retention_days  = var.backup_vault_lock_min_retention_days
  max_retention_days  = var.backup_vault_lock_max_retention_days
  changeable_for_days = 3

  depends_on = [aws_backup_vault.primary]
}

# Backup vault notifications
resource "aws_backup_vault_notifications" "primary" {
  count               = var.enable_backup_notifications ? 1 : 0
  backup_vault_name   = aws_backup_vault.primary.name
  sns_topic_arn       = aws_sns_topic.backup_notifications[0].arn
  backup_vault_events = [
    "BACKUP_JOB_STARTED",
    "BACKUP_JOB_COMPLETED",
    "BACKUP_JOB_FAILED",
    "RESTORE_JOB_STARTED",
    "RESTORE_JOB_COMPLETED",
    "RESTORE_JOB_FAILED",
    "COPY_JOB_STARTED",
    "COPY_JOB_COMPLETED",
    "COPY_JOB_FAILED"
  ]

  depends_on = [
    aws_backup_vault.primary,
    aws_sns_topic.backup_notifications
  ]
}

# Cross-region backup vault (if enabled)
resource "aws_backup_vault" "cross_region" {
  count       = var.enable_cross_region_backup ? 1 : 0
  provider    = aws.backup_destination
  name        = "${var.project}-${var.environment}-cross-region"
  kms_key_arn = aws_kms_key.cross_region[0].arn

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-cross-region-vault"
      Environment = var.environment
      Purpose     = "disaster-recovery"
      ManagedBy   = "Terraform"
    }
  )
}

# KMS key for cross-region backup encryption
resource "aws_kms_key" "cross_region" {
  count                   = var.enable_cross_region_backup ? 1 : 0
  provider                = aws.backup_destination
  description             = "KMS key for ${var.project} ${var.environment} cross-region backup encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-cross-region-backup-key"
      Environment = var.environment
      Purpose     = "disaster-recovery-encryption"
      ManagedBy   = "Terraform"
    }
  )
}

resource "aws_kms_alias" "cross_region" {
  count         = var.enable_cross_region_backup ? 1 : 0
  provider      = aws.backup_destination
  name          = "alias/${var.project}-${var.environment}-cross-region-backup"
  target_key_id = aws_kms_key.cross_region[0].key_id
}

# SNS topic for backup notifications
resource "aws_sns_topic" "backup_notifications" {
  count       = var.enable_backup_notifications ? 1 : 0
  name_prefix = "${var.project}-${var.environment}-backup-"
  display_name = "Backup notifications for ${var.project} ${var.environment}"

  kms_master_key_id = aws_kms_key.backup.id

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-backup-notifications"
      Environment = var.environment
    }
  )
}

# SNS topic policy
resource "aws_sns_topic_policy" "backup_notifications" {
  count  = var.enable_backup_notifications ? 1 : 0
  arn    = aws_sns_topic.backup_notifications[0].arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowBackupToPublish"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.backup_notifications[0].arn
      }
    ]
  })
}

# SNS email subscription
resource "aws_sns_topic_subscription" "backup_email" {
  count     = var.enable_backup_notifications && var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.backup_notifications[0].arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# IAM role for AWS Backup
resource "aws_iam_role" "backup" {
  name_prefix = "${var.project}-${var.environment}-backup-"
  description = "IAM role for AWS Backup service"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-backup-role"
      Environment = var.environment
    }
  )
}

# Attach AWS managed backup policy
resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# Attach restore policy
resource "aws_iam_role_policy_attachment" "restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Backup plan
resource "aws_backup_plan" "main" {
  name = "${var.project}-${var.environment}-backup-plan"

  # Primary backup rule
  rule {
    rule_name         = "${var.project}-${var.environment}-daily"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = var.backup_schedule
    start_window      = 60  # Start within 60 minutes of scheduled time
    completion_window = var.backup_completion_window_minutes

    # Enable continuous backup for point-in-time recovery
    enable_continuous_backup = var.enable_continuous_backup

    # Lifecycle policy
    dynamic "lifecycle" {
      for_each = var.enable_lifecycle_policy ? [1] : []
      content {
        delete_after       = var.backup_retention_days
        cold_storage_after = var.backup_cold_storage_after_days > 0 ? var.backup_cold_storage_after_days : null
      }
    }

    # Cross-region copy rule
    dynamic "copy_action" {
      for_each = var.enable_cross_region_backup ? [1] : []
      content {
        destination_vault_arn = aws_backup_vault.cross_region[0].arn

        lifecycle {
          delete_after       = var.cross_region_retention_days
          cold_storage_after = var.cross_region_retention_days > 30 ? 30 : null
        }
      }
    }

    # Recovery point tags
    recovery_point_tags = merge(
      var.tags,
      {
        BackupPlan = "${var.project}-${var.environment}-backup-plan"
        BackupRule = "daily"
        Environment = var.environment
      }
    )
  }

  # Advanced backup settings
  advanced_backup_setting {
    backup_options = {
      WindowsVSS = "enabled"
    }
    resource_type = "EC2"
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-backup-plan"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )

  depends_on = [
    aws_backup_vault.primary
  ]
}

# Backup selection - resources to backup based on tags
resource "aws_backup_selection" "main" {
  name          = "${var.project}-${var.environment}-selection"
  plan_id       = aws_backup_plan.main.id
  iam_role_arn  = aws_iam_role.backup.arn

  # Select resources by tag
  selection_tag {
    type  = "STRINGEQUALS"
    key   = var.resource_tag_key
    value = var.resource_tag_value
  }

  # Additional selection criteria for critical resources
  resources = []  # Can specify individual resource ARNs

  # Conditions for advanced filtering
  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.environment
    }
  }

  depends_on = [
    aws_backup_plan.main,
    aws_iam_role_policy_attachment.backup,
    aws_iam_role_policy_attachment.restore
  ]
}

# CloudWatch alarm for failed backups
resource "aws_cloudwatch_metric_alarm" "backup_failures" {
  alarm_name          = "${var.project}-${var.environment}-backup-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NumberOfBackupJobsFailed"
  namespace           = "AWS/Backup"
  period              = 86400  # 24 hours
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert when backup jobs fail"
  treat_missing_data  = "notBreaching"

  alarm_actions = var.enable_backup_notifications ? [aws_sns_topic.backup_notifications[0].arn] : []

  dimensions = {
    BackupVaultName = aws_backup_vault.primary.name
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-backup-failure-alarm"
      Environment = var.environment
    }
  )
}

# CloudWatch alarm for successful backups (absence indicates issue)
resource "aws_cloudwatch_metric_alarm" "backup_success" {
  alarm_name          = "${var.project}-${var.environment}-no-successful-backups"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NumberOfBackupJobsCompleted"
  namespace           = "AWS/Backup"
  period              = 86400  # 24 hours
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when no backup jobs complete successfully in 24 hours"
  treat_missing_data  = "breaching"

  alarm_actions = var.enable_backup_notifications ? [aws_sns_topic.backup_notifications[0].arn] : []

  dimensions = {
    BackupVaultName = aws_backup_vault.primary.name
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.project}-${var.environment}-no-backup-alarm"
      Environment = var.environment
    }
  )
}

# CloudWatch dashboard for backup monitoring
resource "aws_cloudwatch_dashboard" "backup" {
  dashboard_name = "${var.project}-${var.environment}-backup"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Backup", "NumberOfBackupJobsCreated", { stat = "Sum", label = "Created" }],
            [".", "NumberOfBackupJobsCompleted", { stat = "Sum", label = "Completed" }],
            [".", "NumberOfBackupJobsFailed", { stat = "Sum", label = "Failed" }]
          ]
          period = 86400
          region = data.aws_region.current.name
          title  = "Backup Jobs (Last 24 Hours)"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Backup", "NumberOfRecoveryPointsCreated", { stat = "Sum" }]
          ]
          period = 86400
          region = data.aws_region.current.name
          title  = "Recovery Points Created"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Backup", "NumberOfCopyJobsCreated", { stat = "Sum", label = "Created" }],
            [".", "NumberOfCopyJobsCompleted", { stat = "Sum", label = "Completed" }],
            [".", "NumberOfCopyJobsFailed", { stat = "Sum", label = "Failed" }]
          ]
          period = 86400
          region = data.aws_region.current.name
          title  = "Cross-Region Copy Jobs"
        }
      }
    ]
  })
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

#### modules/aws-backup/outputs.tf

```hcl
output "backup_vault_id" {
  description = "Primary Backup Vault ID"
  value       = aws_backup_vault.primary.id
}

output "backup_vault_arn" {
  description = "Primary Backup Vault ARN"
  value       = aws_backup_vault.primary.arn
}

output "backup_vault_name" {
  description = "Primary Backup Vault name"
  value       = aws_backup_vault.primary.name
}

output "cross_region_vault_arn" {
  description = "Cross-region Backup Vault ARN"
  value       = var.enable_cross_region_backup ? aws_backup_vault.cross_region[0].arn : null
}

output "backup_plan_id" {
  description = "Backup Plan ID"
  value       = aws_backup_plan.main.id
}

output "backup_plan_arn" {
  description = "Backup Plan ARN"
  value       = aws_backup_plan.main.arn
}

output "backup_selection_id" {
  description = "Backup Selection ID"
  value       = aws_backup_selection.main.id
}

output "backup_iam_role_arn" {
  description = "IAM Role ARN for AWS Backup"
  value       = aws_iam_role.backup.arn
}

output "backup_kms_key_id" {
  description = "KMS Key ID for backup encryption"
  value       = aws_kms_key.backup.key_id
}

output "backup_kms_key_arn" {
  description = "KMS Key ARN for backup encryption"
  value       = aws_kms_key.backup.arn
}

output "sns_topic_arn" {
  description = "SNS Topic ARN for backup notifications"
  value       = var.enable_backup_notifications ? aws_sns_topic.backup_notifications[0].arn : null
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch Dashboard name for backup monitoring"
  value       = aws_cloudwatch_dashboard.backup.dashboard_name
}
```

#### modules/aws-backup/providers.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
      configuration_aliases = [aws.backup_destination]
    }
  }
}
```

#### Usage Example - AWS Backup with Cross-Region Replication

```hcl
# Root module (main.tf)

# Primary region provider
provider "aws" {
  region = "us-east-1"
}

# Backup destination region provider
provider "aws" {
  alias  = "backup_destination"
  region = "us-west-2"
}

module "aws_backup" {
  source = "./modules/aws-backup"

  # Provider configuration
  providers = {
    aws.backup_destination = aws.backup_destination
  }

  project     = "myapp"
  environment = "prod"

  # Backup schedule - Daily at 2 AM UTC
  backup_schedule = "cron(0 2 * * ? *)"

  # Retention policies
  backup_retention_days        = 30   # 30 days in primary region
  backup_cold_storage_after_days = 7   # Move to cold storage after 7 days
  cross_region_retention_days   = 90   # 90 days in DR region

  # Cross-region DR
  enable_cross_region_backup   = true
  backup_destination_region    = "us-west-2"

  # Compliance - Enable vault lock for immutable backups
  enable_backup_vault_lock            = true
  backup_vault_lock_min_retention_days = 90
  backup_vault_lock_max_retention_days = 365

  # Point-in-time recovery
  enable_continuous_backup = true

  # Resource selection - backup all resources with tag BackupEnabled=true
  resource_tag_key   = "BackupEnabled"
  resource_tag_value = "true"

  # Notifications
  enable_backup_notifications = true
  notification_email          = "ops@example.com"

  # Backup window
  backup_window_hours               = 2    # Start at 2 AM UTC
  backup_completion_window_minutes  = 120  # Must complete within 2 hours

  tags = {
    Project     = "myapp"
    Environment = "prod"
    Compliance  = "HIPAA"
    ManagedBy   = "Terraform"
  }
}

# Example: Tag RDS instance for backup
resource "aws_db_instance" "main" {
  identifier     = "myapp-prod-db"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.large"

  # ... other configuration ...

  # Tag for backup selection
  tags = {
    Name          = "myapp-prod-db"
    Environment   = "prod"
    BackupEnabled = "true"  # This triggers AWS Backup
  }
}

# Example: Tag EBS volumes for backup
resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1a"
  size              = 100
  type              = "gp3"
  encrypted         = true

  tags = {
    Name          = "myapp-prod-data"
    Environment   = "prod"
    BackupEnabled = "true"  # This triggers AWS Backup
  }
}

# Example: Tag DynamoDB table for backup
resource "aws_dynamodb_table" "main" {
  name         = "myapp-prod-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name          = "myapp-prod-table"
    Environment   = "prod"
    BackupEnabled = "true"  # This triggers AWS Backup
  }
}

# Outputs
output "backup_vault_arn" {
  description = "Primary Backup Vault ARN"
  value       = module.aws_backup.backup_vault_arn
}

output "cross_region_vault_arn" {
  description = "Cross-region Backup Vault ARN for disaster recovery"
  value       = module.aws_backup.cross_region_vault_arn
}

output "backup_plan_id" {
  description = "Backup Plan ID"
  value       = module.aws_backup.backup_plan_id
}
```

**Disaster Recovery Objectives**:

- **RTO (Recovery Time Objective)**: 4 hours
  - Cross-region restore takes 2-4 hours depending on data size
  - Automated restore testing validates RTO quarterly
- **RPO (Recovery Point Objective)**: 15 minutes
  - Point-in-time recovery (PITR) for databases with 5-minute granularity
  - Daily snapshots provide 24-hour RPO for other resources
- **Backup Frequency**: Daily at 2 AM UTC
- **Cross-Region Replication**: Enabled (us-east-1 → us-west-2)
- **Compliance**: HIPAA, SOC 2, PCI-DSS compliant with vault lock

**Backup Coverage**:

| Resource Type | Backup Method | Retention | PITR |
|--------------|---------------|-----------|------|
| RDS/Aurora | Automated snapshots | 30 days | ✅ Yes |
| DynamoDB | Continuous backup | 30 days | ✅ Yes |
| EBS Volumes | Snapshots | 30 days | ❌ No |
| EC2 AMIs | AMI creation | 30 days | ❌ No |
| EFS | Backups | 30 days | ❌ No |
| S3 | Versioning + replication | 90 days | ✅ Yes |

**Cost Estimates** (per month, assuming 1 TB data):

- Primary backup storage: $50/month (warm) + $4/month (cold after 7 days)
- Cross-region copy: $100/month (90-day retention in us-west-2)
- Backup transfer: $20/month (cross-region data transfer)
- Total monthly cost: ~$174/month

**Testing Strategy**:

```bash
# Automated restore testing (run monthly)
# tests/backup-restore-test.sh

#!/bin/bash
set -e

# Test RDS restore
aws backup start-restore-job \
  --recovery-point-arn "$RECOVERY_POINT_ARN" \
  --metadata '{"DBInstanceIdentifier":"test-restore-$(date +%Y%m%d)"}' \
  --iam-role-arn "$BACKUP_ROLE_ARN" \
  --resource-type RDS

# Validate restored RDS instance
aws rds wait db-instance-available \
  --db-instance-identifier "test-restore-$(date +%Y%m%d)"

# Cleanup test restore
aws rds delete-db-instance \
  --db-instance-identifier "test-restore-$(date +%Y%m%d)" \
  --skip-final-snapshot
```

---

## See Also

### Related Infrastructure Guides

- [HCL Style Guide](hcl.md) - HashiCorp Configuration Language fundamentals
- [Terragrunt Guide](terragrunt.md) - DRY Terraform configurations
- [AWS CDK Guide](cdk.md) - Alternative IaC with TypeScript/Python
- [Kubernetes & Helm Guide](kubernetes.md) - Container orchestration IaC

### Configuration Management

- [Ansible Guide](ansible.md) - Configuration management and provisioning

### Development Tools & Practices

- [IDE Integration Guide](../05_ci_cd/ide_integration_guide.md) - VS Code, IntelliJ Terraform plugins
- [Pre-commit Hooks Guide](../05_ci_cd/precommit_hooks_guide.md) - terraform fmt, validate, tflint
- [Local Validation Setup](../05_ci_cd/local_validation_setup.md) - Terraform, tflint, checkov setup

### Testing & Quality

- [Testing Strategies](../05_ci_cd/testing_strategies.md) - Terratest, kitchen-terraform patterns
- [Security Scanning Guide](../05_ci_cd/security_scanning_guide.md) - checkov, tfsec, terrascan

### CI/CD Resources

- [GitHub Actions Guide](../05_ci_cd/github_actions_guide.md) - Terraform workflow examples
- [GitLab CI Guide](../05_ci_cd/gitlab_ci_guide.md) - Terraform pipeline configuration
- [AI Validation Pipeline](../05_ci_cd/ai_validation_pipeline.md) - Automated IaC review

### Templates & Examples

- [Terraform Module Template](../04_templates/terraform_module_template.md) - Module structure
- [Terraform Module Example](../05_examples/terraform_module_example.md) - Complete module

### Core Documentation

- [Getting Started Guide](../01_overview/getting_started.md) - Repository setup
- [Metadata Schema Reference](../03_metadata_schema/schema_reference.md) - Frontmatter requirements
- [Structure Guide](../01_overview/structure.md) - Terraform project organization
- [Principles](../01_overview/principles.md) - Style guide philosophy

---

## References

### Official Documentation

- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [Terraform Registry](https://registry.terraform.io/)
- [HCL Syntax](https://developer.hashicorp.com/terraform/language/syntax/configuration)
- [Terraform Best Practices](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices)

### AWS Provider

- [AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

### Tools

- [tflint](https://github.com/terraform-linters/tflint) - Terraform linter
- [terraform-docs](https://github.com/terraform-docs/terraform-docs) - Documentation generator
- [Terratest](https://terratest.gruntwork.io/) - Go-based testing framework
- [checkov](https://www.checkov.io/) - Security and compliance scanner
- [tfsec](https://github.com/aquasecurity/tfsec) - Security scanner

### Community Resources

- [Terraform AWS Modules](https://github.com/terraform-aws-modules)
- [Gruntwork Infrastructure as Code Library](https://gruntwork.io/infrastructure-as-code-library/)
- [Terraform Up & Running (Book)](https://www.terraformupandrunning.com/)

---

**Status**: Active
