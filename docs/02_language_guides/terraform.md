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
```

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
```

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

**Version**: 1.0.0
**Status**: Active
