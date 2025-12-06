---
title: "Terraform Refactoring Examples"
description: "Real-world Terraform code refactoring examples with before/after comparisons"
author: "Tyler Dukes"
date: "2025-12-06"
tags: [terraform, refactoring, best-practices, examples, iac]
category: "Refactoring"
status: "active"
version: "1.0.0"
---

Real-world examples of refactoring Terraform code to improve maintainability, reusability, and adherence to best practices.

## Extract Reusable Module

### Problem: Repeated resource definitions across environments

**Before** (separate files for each environment, lots of duplication):

```hcl
# environments/dev/main.tf
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "dev-vpc"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "dev-private-${count.index + 1}"
    Environment = "dev"
    Type        = "private"
  }
}

resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "dev-public-${count.index + 1}"
    Environment = "dev"
    Type        = "public"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "dev-igw"
    Environment = "dev"
  }
}

# ... 100+ more lines of route tables, NAT gateways, etc.
# Same code repeated in staging/main.tf and production/main.tf
```

**After** (reusable module):

```hcl
# modules/vpc/main.tf
locals {
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-vpc"
    }
  )
}

resource "aws_subnet" "private" {
  for_each = var.private_subnet_cidrs

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = each.key

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-private-${each.key}"
      Type = "private"
    }
  )
}

resource "aws_subnet" "public" {
  for_each = var.public_subnet_cidrs

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = var.map_public_ip_on_launch

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-public-${each.key}"
      Type = "public"
    }
  )
}

# modules/vpc/variables.tf
variable "name" {
  description = "Name prefix for VPC resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "private_subnet_cidrs" {
  description = "Map of AZ to CIDR for private subnets"
  type        = map(string)
}

variable "public_subnet_cidrs" {
  description = "Map of AZ to CIDR for public subnets"
  type        = map(string)
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

variable "map_public_ip_on_launch" {
  description = "Map public IP on launch for public subnets"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

# environments/dev/main.tf (now much simpler)
module "vpc" {
  source = "../../modules/vpc"

  name        = "dev"
  environment = "dev"
  vpc_cidr    = "10.0.0.0/16"

  private_subnet_cidrs = {
    "us-east-1a" = "10.0.1.0/24"
    "us-east-1b" = "10.0.2.0/24"
    "us-east-1c" = "10.0.3.0/24"
  }

  public_subnet_cidrs = {
    "us-east-1a" = "10.0.10.0/24"
    "us-east-1b" = "10.0.11.0/24"
    "us-east-1c" = "10.0.12.0/24"
  }

  tags = {
    Project = "my-project"
  }
}
```

**Improvements**:

- ✅ DRY: VPC code defined once, reused across environments
- ✅ Maintainability: Bug fixes and updates in one place
- ✅ Consistency: All environments use same battle-tested module
- ✅ Reduced lines: ~400 lines → ~50 lines per environment
- ✅ Testable: Module can be tested independently

---

## Use for_each Instead of count

### Problem: Using count for dynamic resources causes recreation on reordering

**Before** (using count):

```hcl
variable "users" {
  description = "List of IAM users to create"
  type        = list(string)
  default     = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  count = length(var.users)
  name  = var.users[count.index]

  tags = {
    Environment = "production"
  }
}

resource "aws_iam_access_key" "users" {
  count = length(var.users)
  user  = aws_iam_user.users[count.index].name
}

# Problem: If you remove "bob" from the list:
# variable "users" {
#   default = ["alice", "charlie"]  # bob removed
# }
# Terraform will:
# 1. Destroy users[1] (bob) - GOOD
# 2. Destroy users[2] (charlie) - BAD!
# 3. Recreate users[1] (charlie) - BAD!
# Charlie's access keys get destroyed and recreated!
```

**After** (using for_each):

```hcl
variable "users" {
  description = "Set of IAM users to create"
  type        = set(string)
  default     = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  for_each = var.users

  name = each.key

  tags = {
    Environment = "production"
  }
}

resource "aws_iam_access_key" "users" {
  for_each = var.users

  user = aws_iam_user.users[each.key].name
}

# Now if you remove "bob" from the set:
# variable "users" {
#   default = ["alice", "charlie"]  # bob removed
# }
# Terraform will:
# 1. Destroy users["bob"] - GOOD
# Charlie is untouched because he's keyed by name, not index!
```

**Even Better** (using map for additional attributes):

```hcl
variable "users" {
  description = "Map of IAM users with their attributes"
  type = map(object({
    path   = string
    groups = list(string)
  }))
  default = {
    alice = {
      path   = "/developers/"
      groups = ["developers", "admins"]
    }
    bob = {
      path   = "/contractors/"
      groups = ["developers"]
    }
    charlie = {
      path   = "/developers/"
      groups = ["developers"]
    }
  }
}

resource "aws_iam_user" "users" {
  for_each = var.users

  name = each.key
  path = each.value.path

  tags = {
    Environment = "production"
    UserType    = split("/", each.value.path)[1]
  }
}

resource "aws_iam_user_group_membership" "users" {
  for_each = var.users

  user   = aws_iam_user.users[each.key].name
  groups = each.value.groups
}
```

**Improvements**:

- ✅ Stable resource addresses (keyed by name, not index)
- ✅ No unnecessary resource recreation
- ✅ Safer operations when adding/removing items
- ✅ More readable state (users["alice"] vs users[0])
- ✅ Can associate additional attributes per item

---

## Apply Locals for DRY

### Problem: Repeated expressions and hard-coded values

**Before**:

```hcl
resource "aws_instance" "web" {
  count         = 3
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"

  tags = {
    Name        = "web-server-${count.index + 1}"
    Environment = "production"
    Project     = "my-project"
    CostCenter  = "engineering"
    ManagedBy   = "Terraform"
    Owner       = "platform-team@example.com"
  }
}

resource "aws_instance" "api" {
  count         = 2
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.large"

  tags = {
    Name        = "api-server-${count.index + 1}"
    Environment = "production"
    Project     = "my-project"
    CostCenter  = "engineering"
    ManagedBy   = "Terraform"
    Owner       = "platform-team@example.com"
  }
}

resource "aws_db_instance" "main" {
  identifier        = "production-my-project-db"
  engine            = "postgres"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  tags = {
    Name        = "main-database"
    Environment = "production"
    Project     = "my-project"
    CostCenter  = "engineering"
    ManagedBy   = "Terraform"
    Owner       = "platform-team@example.com"
  }
}
```

**After**:

```hcl
locals {
  # Environment configuration
  environment = "production"
  project     = "my-project"

  # Common naming prefix
  name_prefix = "${local.environment}-${local.project}"

  # AMI selection based on environment
  amis = {
    production = "ami-0c55b159cbfafe1f0"
    staging    = "ami-0abcdef123456789"
    dev        = "ami-0fedcba987654321"
  }

  selected_ami = local.amis[local.environment]

  # Common tags applied to all resources
  common_tags = {
    Environment = local.environment
    Project     = local.project
    CostCenter  = "engineering"
    ManagedBy   = "Terraform"
    Owner       = "platform-team@example.com"
  }

  # Instance type selection based on environment
  instance_types = {
    production = {
      web = "t3.medium"
      api = "t3.large"
    }
    staging = {
      web = "t3.small"
      api = "t3.medium"
    }
    dev = {
      web = "t3.micro"
      api = "t3.small"
    }
  }
}

resource "aws_instance" "web" {
  count = 3

  ami           = local.selected_ami
  instance_type = local.instance_types[local.environment].web

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-web-${count.index + 1}"
      Role = "web-server"
    }
  )
}

resource "aws_instance" "api" {
  count = 2

  ami           = local.selected_ami
  instance_type = local.instance_types[local.environment].api

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-api-${count.index + 1}"
      Role = "api-server"
    }
  )
}

resource "aws_db_instance" "main" {
  identifier        = "${local.name_prefix}-db"
  engine            = "postgres"
  instance_class    = "db.${local.instance_types[local.environment].api}"
  allocated_storage = 100

  tags = merge(
    local.common_tags,
    {
      Name = "main-database"
      Role = "database"
    }
  )
}
```

**Improvements**:

- ✅ Single source of truth for repeated values
- ✅ Consistent naming across resources
- ✅ Easy to change environment-specific values
- ✅ Centralized tag management
- ✅ Reduced risk of typos and inconsistencies

---

## Simplify Variable Structures

### Problem: Complex, nested variable structures that are hard to use

**Before**:

```hcl
variable "config" {
  description = "Application configuration"
  type = object({
    app = object({
      name    = string
      version = string
      env = object({
        vars = list(object({
          key   = string
          value = string
        }))
      })
    })
    infra = object({
      vpc = object({
        cidr = string
        azs  = list(string)
      })
      compute = object({
        instance_type = string
        count         = number
      })
    })
  })
}

# Usage (very verbose and error-prone)
resource "aws_instance" "app" {
  count         = var.config.infra.compute.count
  instance_type = var.config.infra.compute.instance_type

  # Hard to work with nested env vars
  user_data = templatefile("${path.module}/user-data.sh", {
    app_name = var.config.app.name
    env_vars = {
      for env in var.config.app.env.vars :
      env.key => env.value
    }
  })

  tags = {
    Name    = "${var.config.app.name}-${count.index}"
    Version = var.config.app.version
  }
}
```

**After**:

```hcl
# Flatten and simplify variable structure
variable "app_name" {
  description = "Application name"
  type        = string
}

variable "app_version" {
  description = "Application version"
  type        = string
}

variable "environment_variables" {
  description = "Application environment variables"
  type        = map(string)
  default     = {}
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "instance_count" {
  description = "Number of instances to create"
  type        = number
  default     = 1

  validation {
    condition     = var.instance_count > 0 && var.instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}

# Usage (much simpler and clearer)
resource "aws_instance" "app" {
  count         = var.instance_count
  instance_type = var.instance_type

  user_data = templatefile("${path.module}/user-data.sh", {
    app_name = var.app_name
    env_vars = var.environment_variables
  })

  tags = {
    Name    = "${var.app_name}-${count.index}"
    Version = var.app_version
  }
}

# terraform.tfvars (easier to read and write)
app_name    = "my-application"
app_version = "1.2.3"

environment_variables = {
  LOG_LEVEL    = "info"
  DATABASE_URL = "postgres://..."
  API_KEY      = "secret-key"
}

vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

instance_type  = "t3.large"
instance_count = 3
```

**Improvements**:

- ✅ Flattened structure is easier to understand
- ✅ Each variable has a clear, single purpose
- ✅ Better IDE autocomplete support
- ✅ Easier to document with clear descriptions
- ✅ Validation rules can be applied per variable
- ✅ Simpler to override specific values

---

## Improve Resource Naming

### Problem: Inconsistent and unclear resource naming

**Before**:

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_vpc" "vpc2" {
  cidr_block = "172.16.0.0/16"
}

resource "aws_subnet" "subnet1" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_subnet" "pub_sub" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.10.0/24"
}

resource "aws_instance" "server" {
  ami           = "ami-12345"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.subnet1.id
}

resource "aws_instance" "web_server" {
  ami           = "ami-12345"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.pub_sub.id
}

resource "aws_security_group" "sg" {
  vpc_id = aws_vpc.main.id
}

# References are unclear:
# - What is "main" vs "vpc2"?
# - What's the difference between "subnet1" and "pub_sub"?
# - What does "server" do vs "web_server"?
```

**After**:

```hcl
# Use descriptive, consistent naming patterns

# VPCs: describe purpose
resource "aws_vpc" "application" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "application-vpc"
  }
}

resource "aws_vpc" "management" {
  cidr_block = "172.16.0.0/16"

  tags = {
    Name = "management-vpc"
  }
}

# Subnets: include type and purpose
resource "aws_subnet" "application_private" {
  for_each = toset(["us-east-1a", "us-east-1b", "us-east-1c"])

  vpc_id = aws_vpc.application.id
  cidr_block = cidrsubnet(
    aws_vpc.application.cidr_block,
    8,
    index(["us-east-1a", "us-east-1b", "us-east-1c"], each.key)
  )
  availability_zone = each.key

  tags = {
    Name = "application-private-${each.key}"
    Type = "private"
  }
}

resource "aws_subnet" "application_public" {
  for_each = toset(["us-east-1a", "us-east-1b", "us-east-1c"])

  vpc_id = aws_vpc.application.id
  cidr_block = cidrsubnet(
    aws_vpc.application.cidr_block,
    8,
    index(["us-east-1a", "us-east-1b", "us-east-1c"], each.key) + 10
  )
  availability_zone = each.key
  map_public_ip_on_launch = true

  tags = {
    Name = "application-public-${each.key}"
    Type = "public"
  }
}

# Instances: describe role and tier
resource "aws_instance" "api_backend" {
  count = 2

  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.application_private["us-east-1a"].id

  vpc_security_group_ids = [
    aws_security_group.api_backend.id
  ]

  tags = {
    Name = "api-backend-${count.index + 1}"
    Role = "backend"
    Tier = "api"
  }
}

resource "aws_instance" "web_frontend" {
  count = 3

  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.application_public["us-east-1a"].id

  vpc_security_group_ids = [
    aws_security_group.web_frontend.id
  ]

  tags = {
    Name = "web-frontend-${count.index + 1}"
    Role = "frontend"
    Tier = "web"
  }
}

# Security groups: describe what they protect
resource "aws_security_group" "api_backend" {
  name_prefix = "api-backend-"
  description = "Security group for API backend instances"
  vpc_id      = aws_vpc.application.id

  tags = {
    Name = "api-backend-sg"
  }
}

resource "aws_security_group" "web_frontend" {
  name_prefix = "web-frontend-"
  description = "Security group for web frontend instances"
  vpc_id      = aws_vpc.application.id

  tags = {
    Name = "web-frontend-sg"
  }
}

# Now references are clear:
# - aws_vpc.application vs aws_vpc.management (purpose-based)
# - aws_subnet.application_private vs application_public (type-based)
# - aws_instance.api_backend vs web_frontend (role-based)
# - aws_security_group.api_backend (matches protected resource)
```

**Naming Conventions Applied**:

1. **VPCs**: Use purpose (application, management, data)
2. **Subnets**: Include type and purpose (application_private, application_public)
3. **Instances**: Describe tier and role (api_backend, web_frontend, database_primary)
4. **Security Groups**: Match the resource they protect
5. **Load Balancers**: Include tier (application_alb, internal_nlb)
6. **Use this as resource name**: Prefer when there's only one of a resource type

**Improvements**:

- ✅ Self-documenting infrastructure
- ✅ Easy to understand resource relationships
- ✅ Consistent naming patterns across the codebase
- ✅ Clear intent of each resource
- ✅ Easier to search and find resources
- ✅ Better for team collaboration

---

## Resources

### Tools

- **terraform fmt**: Format Terraform files
- **tflint**: Terraform linter
- **terraform-docs**: Generate documentation
- **terrascan**: Security scanning
- **checkov**: Policy as code scanning

### Related Documentation

- [Terraform Style Guide](../02_language_guides/terraform.md)
- [Terraform Module Template](../04_templates/terraform_module_template.md)
- [Testing Strategies](../05_ci_cd/testing_strategies.md)

---

**Version**: 1.0.0
**Last Updated**: 2025-12-06
