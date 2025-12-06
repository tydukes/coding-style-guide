---
title: "HCL Style Guide"
description: "HashiCorp Configuration Language standards for infrastructure as code configuration"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [hcl, hashicorp, terraform, packer, nomad, configuration]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**HashiCorp Configuration Language (HCL)** is a structured configuration language created by HashiCorp for use
in their tools like Terraform, Packer, Nomad, Consul, and Vault. HCL is designed to be human-readable and
machine-friendly, combining declarative resource definitions with imperative programming constructs.

### Key Characteristics

- **Format**: Declarative with imperative elements
- **Primary Use**: Infrastructure as code, configuration management
- **Key Concepts**: Blocks, attributes, expressions, functions
- **Tools**: Terraform, Packer, Nomad, Consul, Vault

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Blocks | `snake_case` | `resource`, `variable`, `output` | Block types lowercase |
| Identifiers | `snake_case` | `aws_instance`, `vpc_config` | Lowercase with underscores |
| Variables | `snake_case` | `vpc_cidr`, `instance_type` | Descriptive names |
| Locals | `snake_case` | `common_tags`, `region_map` | Computed local values |
| **Syntax** | | | |
| Blocks | `type "label" { }` | `resource "aws_vpc" "main" { }` | Type, optional labels, body |
| Attributes | `key = value` | `cidr_block = "10.0.0.0/16"` | Key-value assignment |
| Comments | `#` or `//` or `/* */` | `# Comment`, `// Comment` | Single or multi-line |
| **Data Types** | | | |
| String | `"text"` | `"hello"` | Double-quoted strings |
| Number | Numeric | `42`, `3.14` | Integer or float |
| Bool | `true` / `false` | `enabled = true` | Boolean values |
| List | `[...]` | `["a", "b", "c"]` | Ordered collection |
| Map | `{...}` | `{key = "value"}` | Key-value pairs |
| **Formatting** | | | |
| Indentation | 2 spaces | `attribute = value` | Consistent 2-space indent |
| Line Length | 120 characters | Keep lines reasonable | Readability |
| Blank Lines | Between blocks | `resource {...}\n\nresource {...}` | Separate blocks |
| **Expressions** | | | |
| Interpolation | `${ }` | `"${var.name}"` | Embed expressions (legacy) |
| References | Direct reference | `var.name` | Modern syntax (preferred) |
| Functions | Built-in functions | `file("path")`, `join(",", list)` | Use HCL functions |
| **Best Practices** | | | |
| Terraform Fmt | Use `terraform fmt` | Auto-format files | Consistent formatting |
| No Heredocs | Avoid when possible | Use `file()` function | Better readability |

---

## Basic Syntax

### Blocks

```hcl
# Basic block structure
block_type "label1" "label2" {
  attribute = value

  nested_block {
    attribute = value
  }
}

# Terraform example
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "web-server"
  }
}
```

### Attributes

```hcl
# Simple attributes
name        = "my-instance"
count       = 3
enabled     = true
price       = 19.99

# Complex attributes
tags = {
  Environment = "production"
  Owner       = "platform-team"
}

# List attributes
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
```

### Comments

```hcl
# Single-line comment

// Alternative single-line comment

/*
  Multi-line
  comment
*/

resource "aws_instance" "web" {
  ami = "ami-0c55b159cbfafe1f0"  # Inline comment
}
```

---

## Data Types

### Primitive Types

```hcl
# String
name = "my-resource"
description = "A description with spaces"

# Number (integer or float)
count = 5
price = 29.99

# Boolean
enabled = true
disabled = false

# Null
optional_value = null
```

### Complex Types

```hcl
# List (ordered collection)
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
ports = [80, 443, 8080]

# Map (key-value pairs)
tags = {
  Environment = "production"
  Project     = "web-app"
  CostCenter  = "engineering"
}

# Object (typed structure)
server_config = {
  instance_type = "t3.micro"
  ami           = "ami-0c55b159cbfafe1f0"
  disk_size     = 20
}

# Tuple (ordered, typed list)
mixed_tuple = ["string", 42, true]

# Set (unordered, unique values)
unique_zones = toset(["us-east-1a", "us-east-1b", "us-east-1a"])
```

---

## Variables

### Variable Declaration

```hcl
# Basic variable
variable "instance_type" {
  type        = string
  description = "EC2 instance type"
  default     = "t3.micro"
}

# Variable with validation
variable "region" {
  type        = string
  description = "AWS region"

  validation {
    condition     = contains(["us-east-1", "us-west-2"], var.region)
    error_message = "Region must be us-east-1 or us-west-2."
  }
}

# Complex variable
variable "server_config" {
  type = object({
    instance_type = string
    disk_size     = number
    monitoring    = bool
  })

  default = {
    instance_type = "t3.micro"
    disk_size     = 20
    monitoring    = true
  }
}

# Sensitive variable
variable "db_password" {
  type      = string
  sensitive = true
}
```

### Variable Usage

```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = {
    Name = "${var.environment}-web-server"
  }
}
```

---

## Locals

```hcl
# Define local values
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Computed local
  instance_name = "${var.environment}-${var.application}-instance"

  # Conditional local
  use_spot = var.environment == "dev" ? true : false
}

# Use local values
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = merge(
    local.common_tags,
    {
      Name = local.instance_name
    }
  )
}
```

---

## Expressions

### References

```hcl
# Variable reference
var.instance_type

# Resource attribute reference
aws_instance.web.id
aws_instance.web.private_ip

# Local value reference
local.common_tags

# Module output reference
module.vpc.vpc_id
```

### Operators

```hcl
# Arithmetic
locals {
  total_size = var.base_size + 10
  doubled    = var.count * 2
  divided    = var.total / 2
  remainder  = var.number % 3
}

# Comparison
locals {
  is_production = var.environment == "prod"
  not_dev       = var.environment != "dev"
  is_large      = var.instance_count > 10
  is_valid      = var.port >= 1 && var.port <= 65535
}

# Logical
locals {
  deploy = var.enabled && var.environment == "prod"
  skip   = !var.enabled || var.environment == "test"
}
```

### Conditional Expressions

```hcl
# Ternary operator
locals {
  instance_type = var.environment == "prod" ? "t3.large" : "t3.micro"

  enable_backup = var.environment == "prod" ? true : false

  # Nested conditional
  tier = (
    var.environment == "prod" ? "production" :
    var.environment == "staging" ? "staging" :
    "development"
  )
}

resource "aws_instance" "web" {
  count = var.enabled ? 1 : 0

  ami           = var.ami_id
  instance_type = local.instance_type
}
```

---

## Functions

### String Functions

```hcl
locals {
  # Convert to uppercase
  upper_env = upper(var.environment)

  # Convert to lowercase
  lower_name = lower(var.name)

  # String formatting
  bucket_name = format("%s-%s-bucket", var.project, var.environment)

  # String joining
  fqdn = join(".", [var.hostname, var.domain])

  # String splitting
  name_parts = split("-", var.resource_name)

  # String replacement
  sanitized = replace(var.name, "_", "-")
}
```

### Collection Functions

```hcl
locals {
  # List functions
  first_zone = element(var.availability_zones, 0)
  zone_count = length(var.availability_zones)
  unique_items = distinct(var.list_with_duplicates)
  sorted_list = sort(var.unsorted_list)

  # Map functions
  tag_keys = keys(var.tags)
  tag_values = values(var.tags)
  merged_tags = merge(local.common_tags, var.custom_tags)

  # Lookup with default
  instance_type = lookup(var.instance_types, var.environment, "t3.micro")
}
```

### Type Conversion Functions

```hcl
locals {
  # Convert to string
  port_string = tostring(var.port)

  # Convert to number
  count_number = tonumber(var.count_string)

  # Convert to list
  zone_list = tolist(var.zone_set)

  # Convert to set
  unique_zones = toset(var.zone_list)

  # Convert to map
  tag_map = tomap({
    Environment = var.environment
    Name        = var.name
  })
}
```

### Encoding Functions

```hcl
locals {
  # JSON encoding
  config_json = jsonencode({
    environment = var.environment
    region      = var.region
  })

  # JSON decoding
  config_object = jsondecode(var.config_json)

  # Base64 encoding
  user_data = base64encode(file("${path.module}/user-data.sh"))

  # Base64 decoding
  decoded_data = base64decode(var.encoded_data)
}
```

---

## Dynamic Blocks

```hcl
# Dynamic block for repeated nested blocks
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Security group for web servers"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }
}

# Variable definition
variable "ingress_rules" {
  type = list(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))

  default = [
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTP"
    },
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTPS"
    }
  ]
}
```

---

## For Expressions

```hcl
# List transformation
locals {
  # Transform list
  uppercase_names = [for name in var.names : upper(name)]

  # Filter list
  prod_instances = [
    for instance in var.instances :
    instance if instance.environment == "prod"
  ]

  # Map to list
  instance_ids = [for k, v in var.instances : v.id]
}

# Map transformation
locals {
  # Transform map
  uppercase_tags = {
    for key, value in var.tags :
    key => upper(value)
  }

  # Filter map
  prod_tags = {
    for key, value in var.tags :
    key => value if value != ""
  }

  # Create map from list
  instance_map = {
    for instance in var.instances :
    instance.id => instance.name
  }
}
```

---

## String Templates

```hcl
# String interpolation
locals {
  greeting = "Hello, ${var.name}!"

  # Multi-line string
  user_data = <<-EOF
    #!/bin/bash
    echo "Environment: ${var.environment}"
    echo "Region: ${var.region}"
  EOF

  # String directive
  config = <<-EOT
    %{ for instance in var.instances ~}
    server ${instance.name} {
      address = ${instance.ip}
    }
    %{ endfor ~}
  EOT
}
```

---

## Best Practices

### Use Descriptive Names

```hcl
# Good - Descriptive variable names
variable "web_server_instance_type" {
  type        = string
  description = "EC2 instance type for web servers"
  default     = "t3.micro"
}

# Bad - Cryptic names
variable "wst" {
  type    = string
  default = "t3.micro"
}
```

### Provide Descriptions

```hcl
# Good - Clear descriptions
variable "database_backup_retention_days" {
  type        = number
  description = "Number of days to retain automated database backups"
  default     = 7
}

# Bad - No description
variable "retention" {
  type    = number
  default = 7
}
```

### Use Type Constraints

```hcl
# Good - Explicit types
variable "server_config" {
  type = object({
    instance_type = string
    disk_size     = number
    monitoring    = bool
  })
}

# Bad - No type constraint
variable "server_config" {
  default = {}
}
```

### Group Related Resources

```hcl
# Good - Logical grouping with locals
locals {
  network_config = {
    vpc_cidr           = "10.0.0.0/16"
    public_subnet_cidr = "10.0.1.0/24"
    private_subnet_cidr = "10.0.2.0/24"
  }

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}
```

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Values

```hcl
# Bad - Hardcoded values
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "production-web-server"
  }
}

# Good - Use variables
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = {
    Name = "${var.environment}-web-server"
  }
}
```

### ❌ Avoid: Missing Type Constraints

```hcl
# Bad - No type constraint
variable "config" {
  default = {}
}

# Good - Explicit type
variable "config" {
  type = object({
    name    = string
    enabled = bool
  })
}
```

### ❌ Avoid: Complex Inline Logic

```hcl
# Bad - Complex inline logic
resource "aws_instance" "web" {
  count = var.environment == "prod" ? (var.high_availability ? 3 : 1) : (var.environment == "staging" ? 2 : 1)
}

# Good - Use locals for clarity
locals {
  instance_count = (
    var.environment == "prod" && var.high_availability ? 3 :
    var.environment == "prod" ? 1 :
    var.environment == "staging" ? 2 :
    1
  )
}

resource "aws_instance" "web" {
  count = local.instance_count
}
```

---

## Tool Configuration

### Terraform fmt

Terraform includes a built-in formatter that follows HCL style conventions:

```bash
# Format all HCL files in current directory
terraform fmt

# Format specific directory
terraform fmt modules/networking

# Check formatting without making changes
terraform fmt -check

# Recursive formatting
terraform fmt -recursive
```

### terraform.rc Configuration

Configure Terraform CLI behavior:

```hcl
# ~/.terraformrc or terraform.rc
plugin_cache_dir   = "$HOME/.terraform.d/plugin-cache"
disable_checkpoint = true

credentials "app.terraform.io" {
  token = "xxxxxx.atlasv1.zzzzzzzzzzzzz"
}
```

### tflint Configuration

```hcl
# .tflint.hcl
config {
  module = true
  force = false
}

plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
  enabled = true
  version = "0.31.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "terraform_typed_variables" {
  enabled = true
}

rule "terraform_required_version" {
  enabled = true
}

rule "terraform_required_providers" {
  enabled = true
}
```

### EditorConfig for HCL

```ini
# .editorconfig
[*.{tf,hcl}]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.88.4
    hooks:
      - id: terraform_fmt
        args:
          - --args=-diff
          - --args=-write=true

      - id: terraform_validate
        args:
          - --hook-config=--retry-once-with-cleanup=true

      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl

      - id: terraform_docs
        args:
          - --hook-config=--path-to-file=README.md
          - --hook-config=--add-to-existing-file=true
          - --hook-config=--create-file-if-not-exist=true
```

### VS Code Settings

```json
{
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true,
    "editor.formatOnSaveMode": "file"
  },
  "[terraform-vars]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true
  },
  "terraform.languageServer.enable": true,
  "terraform.validation.enableEnhancedValidation": true
}
```

### Makefile Integration

```makefile
# Makefile
.PHONY: fmt validate lint

fmt:
 terraform fmt -recursive

validate:
 terraform init -backend=false
 terraform validate

lint:
 tflint --init
 tflint --recursive

check: fmt validate lint
 @echo "All checks passed!"
```

---

## Resources

### Official Documentation

- [HCL Syntax Documentation](https://github.com/hashicorp/hcl/blob/main/hclsyntax/spec.md)
- [Terraform Language Documentation](https://www.terraform.io/language)
- [HCL GitHub Repository](https://github.com/hashicorp/hcl)

### Style Guides

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [HCL Style Guide](https://www.terraform.io/docs/language/syntax/style.html)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
