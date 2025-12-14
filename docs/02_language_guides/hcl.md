---
title: "HCL Style Guide"
description: "HashiCorp Configuration Language standards for infrastructure as code configuration"
author: "Tyler Dukes"
tags: [hcl, hashicorp, terraform, packer, nomad, configuration]
category: "Language Guides"
status: "active"
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
## Basic block structure
block_type "label1" "label2" {
  attribute = value

  nested_block {
    attribute = value
  }
}

## Terraform example
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
## Simple attributes
name        = "my-instance"
count       = 3
enabled     = true
price       = 19.99

## Complex attributes
tags = {
  Environment = "production"
  Owner       = "platform-team"
}

## List attributes
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
```

### Comments

```hcl
## Single-line comment

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
## String
name = "my-resource"
description = "A description with spaces"

## Number (integer or float)
count = 5
price = 29.99

## Boolean
enabled = true
disabled = false

## Null
optional_value = null
```

### Complex Types

```hcl
## List (ordered collection)
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
ports = [80, 443, 8080]

## Map (key-value pairs)
tags = {
  Environment = "production"
  Project     = "web-app"
  CostCenter  = "engineering"
}

## Object (typed structure)
server_config = {
  instance_type = "t3.micro"
  ami           = "ami-0c55b159cbfafe1f0"
  disk_size     = 20
}

## Tuple (ordered, typed list)
mixed_tuple = ["string", 42, true]

## Set (unordered, unique values)
unique_zones = toset(["us-east-1a", "us-east-1b", "us-east-1a"])
```

---

## Variables

### Variable Declaration

```hcl
## Basic variable
variable "instance_type" {
  type        = string
  description = "EC2 instance type"
  default     = "t3.micro"
}

## Variable with validation
variable "region" {
  type        = string
  description = "AWS region"

  validation {
    condition     = contains(["us-east-1", "us-west-2"], var.region)
    error_message = "Region must be us-east-1 or us-west-2."
  }
}

## Complex variable
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

## Sensitive variable
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
## Define local values
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

## Use local values
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
## Variable reference
var.instance_type

## Resource attribute reference
aws_instance.web.id
aws_instance.web.private_ip

## Local value reference
local.common_tags

## Module output reference
module.vpc.vpc_id
```

### Operators

```hcl
## Arithmetic
locals {
  total_size = var.base_size + 10
  doubled    = var.count * 2
  divided    = var.total / 2
  remainder  = var.number % 3
}

## Comparison
locals {
  is_production = var.environment == "prod"
  not_dev       = var.environment != "dev"
  is_large      = var.instance_count > 10
  is_valid      = var.port >= 1 && var.port <= 65535
}

## Logical
locals {
  deploy = var.enabled && var.environment == "prod"
  skip   = !var.enabled || var.environment == "test"
}
```

### Conditional Expressions

```hcl
## Ternary operator
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
## Dynamic block for repeated nested blocks
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

## Variable definition
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
## List transformation
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

## Map transformation
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
## String interpolation
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
## Good - Descriptive variable names
variable "web_server_instance_type" {
  type        = string
  description = "EC2 instance type for web servers"
  default     = "t3.micro"
}

## Bad - Cryptic names
variable "wst" {
  type    = string
  default = "t3.micro"
}
```

### Provide Descriptions

```hcl
## Good - Clear descriptions
variable "database_backup_retention_days" {
  type        = number
  description = "Number of days to retain automated database backups"
  default     = 7
}

## Bad - No description
variable "retention" {
  type    = number
  default = 7
}
```

### Use Type Constraints

```hcl
## Good - Explicit types
variable "server_config" {
  type = object({
    instance_type = string
    disk_size     = number
    monitoring    = bool
  })
}

## Bad - No type constraint
variable "server_config" {
  default = {}
}
```

### Group Related Resources

```hcl
## Good - Logical grouping with locals
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

## Testing

### Testing HCL Configuration

Use `terraform validate` and `terraform fmt` for basic testing:

```bash
## Validate syntax and configuration
terraform validate

## Check formatting
terraform fmt -check -recursive

## Format files
terraform fmt -recursive
```

### Testing with Conftest

Use [Conftest](https://www.conftest.dev/) with Open Policy Agent (OPA) to test HCL:

```bash
## Install conftest
brew install conftest

## Test Terraform configurations
conftest test main.tf

## Test with specific policy
conftest test main.tf -p policy/

## Test all .tf files
conftest test *.tf
```

### Conftest Policy Example

Create policies in Rego:

```rego
## policy/terraform.rego
package main

deny[msg] {
  resource := input.resource.aws_instance[name]
  not resource.instance_type
  msg := sprintf("AWS instance '%s' missing instance_type", [name])
}

deny[msg] {
  resource := input.resource.aws_s3_bucket[name]
  not resource.versioning
  msg := sprintf("S3 bucket '%s' must have versioning enabled", [name])
}

deny[msg] {
  resource := input.resource.aws_security_group[name]
  rule := resource.ingress[_]
  rule.cidr_blocks[_] == "0.0.0.0/0"
  rule.from_port == 22
  msg := sprintf("Security group '%s' allows SSH from anywhere", [name])
}

warn[msg] {
  resource := input.resource.aws_instance[name]
  resource.instance_type == "t2.micro"
  msg := sprintf("Instance '%s' using t2.micro (consider burstable alternatives)", [name])
}
```

### Running Conftest Tests

```bash
## Test with custom namespace
conftest test -p policy/ --namespace terraform main.tf

## Output in different formats
conftest test main.tf -o json
conftest test main.tf -o tap

## Fail on warnings
conftest test main.tf --fail-on-warn
```

### Testing with Terraform Plan

Test planned changes:

```bash
## Generate plan
terraform plan -out=tfplan

## Convert plan to JSON
terraform show -json tfplan > tfplan.json

## Test plan with conftest
conftest test tfplan.json
```

### Policy for Terraform Plans

```rego
## policy/plan.rego
package terraform.analysis

deny[reason] {
  resource_changes := input.resource_changes[_]
  resource_changes.type == "aws_s3_bucket"
  resource_changes.change.actions[_] == "delete"
  reason := sprintf("Attempting to delete S3 bucket: %s", [resource_changes.address])
}

deny[reason] {
  resource_changes := input.resource_changes[_]
  resource_changes.type == "aws_instance"
  instance_type := resource_changes.change.after.instance_type
  not contains(instance_type, "t3")
  not contains(instance_type, "t4g")
  reason := sprintf("Instance %s uses non-approved instance type: %s",
    [resource_changes.address, instance_type])
}

warn[reason] {
  resource_changes := input.resource_changes[_]
  resource_changes.change.actions[_] == "delete"
  reason := sprintf("Resource will be deleted: %s", [resource_changes.address])
}

contains(str, substr) {
  indexof(str, substr) != -1
}
```

### Testing with tflint

Use [tflint](https://github.com/terraform-linters/tflint) for Terraform-specific linting:

```bash
## Install tflint
brew install tflint

## Initialize tflint (downloads plugins)
tflint --init

## Run tflint
tflint

## Run with specific config
tflint --config=.tflint.hcl

## Format output
tflint --format=json
tflint --format=checkstyle
```

### tflint Configuration

```hcl
## .tflint.hcl
config {
  module = true
  force = false
}

plugin "aws" {
  enabled = true
  version = "0.27.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "terraform_deprecated_interpolation" {
  enabled = true
}

rule "terraform_unused_declarations" {
  enabled = true
}

rule "terraform_typed_variables" {
  enabled = true
}

rule "aws_instance_invalid_type" {
  enabled = true
}

rule "aws_s3_bucket_versioning_enabled" {
  enabled = true
}
```

### Integration Testing

Test HCL configurations in CI/CD:

```yaml
## .github/workflows/terraform-test.yml
name: Terraform Tests

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Init
        run: terraform init -backend=false

      - name: Terraform Validate
        run: terraform validate

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup TFLint
        uses: terraform-linters/setup-tflint@v4

      - name: Init TFLint
        run: tflint --init

      - name: Run TFLint
        run: tflint --recursive

  policy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Conftest
        run: |
          wget https://github.com/open-policy-agent/conftest/releases/latest/download/conftest_Linux_x86_64.tar.gz
          tar xzf conftest_Linux_x86_64.tar.gz
          sudo mv conftest /usr/local/bin

      - name: Test Policies
        run: conftest test *.tf -p policy/
```

### Unit Testing HCL Modules

Test individual modules:

```bash
## tests/module_test.sh
#!/bin/bash

set -e

echo "Testing VPC module..."

cd examples/vpc

## Initialize
terraform init

## Validate
terraform validate

## Plan
terraform plan -out=tfplan

## Convert to JSON and test
terraform show -json tfplan > tfplan.json
conftest test tfplan.json -p ../../policy/

echo "VPC module tests passed!"
```

### Compliance Testing

Test for compliance requirements:

```rego
## policy/compliance.rego
package compliance

# Ensure all resources have required tags
deny[msg] {
  resource := input.resource[resource_type][name]
  resource_type != "terraform_data"
  not resource.tags.Environment
  msg := sprintf("%s.%s missing required tag: Environment", [resource_type, name])
}

deny[msg] {
  resource := input.resource[resource_type][name]
  resource_type != "terraform_data"
  not resource.tags.Owner
  msg := sprintf("%s.%s missing required tag: Owner", [resource_type, name])
}

# Ensure encryption at rest
deny[msg] {
  bucket := input.resource.aws_s3_bucket[name]
  not bucket.server_side_encryption_configuration
  msg := sprintf("S3 bucket %s must have encryption enabled", [name])
}

deny[msg] {
  db := input.resource.aws_db_instance[name]
  not db.storage_encrypted
  msg := sprintf("RDS instance %s must have storage encryption enabled", [name])
}

# Ensure resources are in approved regions
approved_regions := ["us-east-1", "us-west-2", "eu-west-1"]

deny[msg] {
  resource := input.resource.aws_instance[name]
  region := resource.provider.aws.region
  not region_approved(region)
  msg := sprintf("Instance %s in unapproved region: %s", [name, region])
}

region_approved(region) {
  approved_regions[_] == region
}
```

### Testing Outputs

Verify module outputs:

```bash
## Test outputs after apply
terraform output -json > outputs.json

## Validate outputs with jq
jq -e '.vpc_id.value != null' outputs.json
jq -e '.subnet_ids.value | length > 0' outputs.json
```

### Documentation Testing

Ensure HCL is properly documented:

```bash
## Install terraform-docs
brew install terraform-docs

## Generate documentation
terraform-docs markdown table . > README.md

## Validate documentation exists
if ! grep -q "## Requirements" README.md; then
  echo "Missing Requirements section in documentation"
  exit 1
fi
```

---

## Security Best Practices

### Never Hardcode Secrets

Avoid storing sensitive data in HCL files:

```hcl
## Bad - Hardcoded secrets in HCL
variable "db_password" {
  default = "MySecretPassword123"  # ❌ Exposed in version control!
}

resource "aws_db_instance" "main" {
  password = "hardcoded_password"  # ❌ Never do this!
}

## Good - Use variables without defaults for secrets
variable "db_password" {
  type      = string
  sensitive = true
  # No default - must be provided at runtime
}

## Good - Use environment variables
# Set via: export TF_VAR_db_password="..."
variable "db_password" {
  type      = string
  sensitive = true
}

## Good - Use secret management systems
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "production/db/password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}

## Good - Use Vault provider
data "vault_generic_secret" "db_creds" {
  path = "secret/database"
}

resource "aws_db_instance" "main" {
  password = data.vault_generic_secret.db_creds.data["password"]
}
```

**Key Points**:

- Never commit secrets to `.tf` files
- Use `sensitive = true` for secret variables
- Read secrets from external systems (Vault, AWS Secrets Manager)
- Use environment variables (`TF_VAR_*`)
- Scan repositories for accidentally committed secrets
- Use `.tfvars` files (gitignored) for local development

### Secure State Management

Protect Terraform state files containing sensitive data:

```hcl
## Good - S3 backend with encryption
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true  # Server-side encryption
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/..."
    dynamodb_table = "terraform-locks"

    # Access control
    acl = "private"
  }
}

## Good - Remote backend with access control
terraform {
  backend "remote" {
    organization = "my-company"

    workspaces {
      name = "production"
    }
  }
}

## Good - Limit state file access
# Set strict IAM policy for S3 state bucket
resource "aws_s3_bucket_policy" "state" {
  bucket = aws_s3_bucket.terraform_state.id

  policy = jsonencode({
    Statement = [{
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = "${aws_s3_bucket.terraform_state.arn}/*"
      Condition = {
        Bool = {
          "aws:SecureTransport" = "false"  # Require HTTPS
        }
      }
    }]
  })
}
```

**Key Points**:

- Always encrypt state files
- Use remote backends (S3, Terraform Cloud)
- Enable state locking (DynamoDB, etc.)
- Restrict state file access
- Never commit state files to version control
- Enable versioning on state storage

### Input Validation

Validate all variable inputs:

```hcl
## Good - Validate variable inputs
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_type" {
  type = string
  validation {
    condition     = can(regex("^t3\\.(micro|small|medium)$", var.instance_type))
    error_message = "Instance type must be t3.micro, t3.small, or t3.medium."
  }
}

variable "cidr_block" {
  type = string
  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "CIDR block must be valid."
  }
}

variable "port" {
  type = number
  validation {
    condition     = var.port >= 1 && var.port <= 65535
    error_message = "Port must be between 1 and 65535."
  }
}
```

**Key Points**:

- Add validation blocks to all variables
- Use allow-lists for enums
- Validate formats (CIDR, email, etc.)
- Validate ranges for numbers
- Fail early on invalid inputs
- Document validation requirements

### Prevent Resource Deletion

Protect critical resources from accidental deletion:

```hcl
## Good - Lifecycle prevent_destroy
resource "aws_db_instance" "production" {
  identifier = "prod-db"
  # ... other configuration ...

  lifecycle {
    prevent_destroy = true  # ✅ Cannot be destroyed via Terraform
  }
}

## Good - Deletion protection at resource level
resource "aws_db_instance" "production" {
  identifier          = "prod-db"
  deletion_protection = true  # ✅ AWS-level protection

  lifecycle {
    prevent_destroy = true
  }
}

## Good - Create before destroy for zero downtime
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true  # ✅ New resource before destroying old
  }
}
```

**Key Points**:

- Use `prevent_destroy` for critical resources
- Enable resource-level deletion protection
- Use `create_before_destroy` for zero downtime
- Require manual intervention for dangerous changes
- Use separate workspaces for different environments
- Implement approval workflows

### Secure Default Values

Avoid insecure defaults:

```hcl
## Bad - Insecure defaults
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
  acl    = "public-read"  # ❌ Publicly accessible!
}

resource "aws_security_group" "web" {
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # ❌ Open to the internet!
  }
}

## Good - Secure defaults
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}

resource "aws_s3_bucket_acl" "data" {
  bucket = aws_s3_bucket.data.id
  acl    = "private"  # ✅ Private by default
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_security_group" "web" {
  name = "web-sg"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]  # ✅ Restricted to private network
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

**Key Points**:

- Default to most restrictive settings
- Explicitly define security configurations
- Block public access by default
- Use least privilege for security groups
- Enable encryption by default
- Audit for overly permissive rules

### Audit and Compliance

Implement audit logging and compliance checks:

```hcl
## Good - Enable CloudTrail for audit logging
resource "aws_cloudtrail" "main" {
  name                          = "main-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }
}

## Good - Tag resources for compliance
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "Platform Team"
    CostCenter  = "Engineering"
    Compliance  = "SOC2"
  }
}

resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t3.micro"

  tags = local.common_tags
}

## Good - Use terraform-compliance for policy checks
# terraform-compliance.yml
# - name: Ensure S3 buckets are encrypted
#   when: resource.aws_s3_bucket
#   then: it must have encryption
```

**Key Points**:

- Enable audit logging (CloudTrail, etc.)
- Tag all resources for tracking
- Use compliance frameworks (CIS, SOC2)
- Implement policy-as-code (Sentinel, OPA)
- Monitor for drift
- Regular security audits

---

## Common Pitfalls

### String Interpolation in Resource Names

**Issue**: Using variables or interpolations in resource names causes Terraform to recreate resources unnecessarily.

**Example**:

```hcl
## Bad - Interpolation in resource name
variable "environment" {
  default = "prod"
}

resource "aws_instance" "web_${var.environment}" {  # ❌ Not allowed!
  ami           = "ami-12345678"
  instance_type = "t3.micro"
}
```

**Solution**: Use static resource names with dynamic tags or Name attributes.

```hcl
## Good - Static resource name, dynamic tags
variable "environment" {
  default = "prod"
}

resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"

  tags = {
    Name        = "web-${var.environment}"  # ✅ Dynamic name in tags
    Environment = var.environment
  }
}
```

**Key Points**:

- Resource names must be static (no interpolation)
- Use tags or labels for dynamic naming
- Resource name is for Terraform reference only
- Use `Name` tag for AWS resource display names

### Count vs For_Each Confusion

**Issue**: Using `count` causes resource recreation when list order changes; `for_each` is more stable.

**Example**:

```hcl
## Bad - count with list (order matters)
variable "users" {
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  count = length(var.users)
  name  = var.users[count.index]  # ❌ Reordering list recreates resources!
}

## If you change to ["alice", "charlie", "bob"], bob will be recreated
```

**Solution**: Use `for_each` with sets or maps for stable addressing.

```hcl
## Good - for_each with set (order independent)
variable "users" {
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  for_each = toset(var.users)
  name     = each.value  # ✅ Referenced by name, not index
}

## Good - for_each with map for complex resources
variable "instances" {
  default = {
    web = {
      instance_type = "t3.small"
      subnet_id     = "subnet-abc"
    }
    api = {
      instance_type = "t3.medium"
      subnet_id     = "subnet-def"
    }
  }
}

resource "aws_instance" "servers" {
  for_each = var.instances

  ami           = "ami-12345678"
  instance_type = each.value.instance_type
  subnet_id     = each.value.subnet_id

  tags = {
    Name = each.key
  }
}
```

**Key Points**:

- Use `for_each` when resource identity matters
- `count` is fine for identical resources (e.g., 3 identical workers)
- `for_each` prevents recreation on list reordering
- Reference with `resource_type.name[key]`

### Depends_On Overuse

**Issue**: Explicit `depends_on` overrides Terraform's dependency graph, slowing applies and hiding issues.

**Example**:

```hcl
## Bad - Unnecessary depends_on
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  depends_on = [aws_vpc.main]  # ❌ Redundant! Already depends via vpc_id
}
```

**Solution**: Let Terraform infer dependencies from resource references.

```hcl
## Good - Implicit dependency through reference
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id  # ✅ Implicit dependency
  cidr_block = "10.0.1.0/24"
}

## Good - depends_on only when no resource reference exists
resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.role.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_instance" "app" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"
  iam_instance_profile = aws_iam_role.role.name

  depends_on = [
    aws_iam_role_policy_attachment.attach  # ✅ Ensures policy attached before instance starts
  ]
}
```

**Key Points**:

- Terraform infers dependencies from resource references
- Only use `depends_on` for hidden dependencies
- Overuse serializes operations, slowing applies
- Check terraform graph to understand dependencies

### Lifecycle Ignore_Changes Abuse

**Issue**: Overusing `ignore_changes` masks configuration drift and makes state inconsistent.

**Example**:

```hcl
## Bad - Ignoring too many changes
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"

  lifecycle {
    ignore_changes = [
      ami,
      instance_type,  # ❌ Why ignore? Should be in Terraform
      tags,
      user_data
    ]
  }
}
```

**Solution**: Only ignore changes for values managed outside Terraform.

```hcl
## Good - Specific ignore for autoscaling
resource "aws_autoscaling_group" "web" {
  min_size = 1
  max_size = 10
  desired_capacity = 3

  lifecycle {
    ignore_changes = [
      desired_capacity  # ✅ Changed by autoscaling, ignore drift
    ]
  }
}

## Good - Ignore tags added by external systems
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"

  tags = {
    ManagedBy = "Terraform"
  }

  lifecycle {
    ignore_changes = [
      tags["CostCenter"],  # ✅ Added by cost tracking system
      tags["Owner"]        # Added by ownership tracker
    ]
  }
}
```

**Key Points**:

- Only ignore changes managed by external systems
- Document why each field is ignored
- Prefer managing all configuration in Terraform
- Use `ignore_changes = all` very rarely

### Terraform vs Provider Version Lock Missing

**Issue**: Not specifying version constraints causes unexpected behavior when providers update.

**Example**:

```hcl
## Bad - No version constraints
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"  # ❌ No version! Will use latest
    }
  }
}

provider "aws" {
  region = "us-east-1"
}
```

**Solution**: Always pin provider and Terraform versions.

```hcl
## Good - Version constraints
terraform {
  required_version = ">= 1.5.0, < 2.0.0"  # ✅ Terraform version range

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # ✅ Allow 5.x updates, not 6.0
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5.0"  # Minimum version
    }
  }
}

provider "aws" {
  region = "us-east-1"
}
```

**Key Points**:

- Always specify `required_version` for Terraform
- Use `~>` for "compatible with" (e.g., `~> 5.0` allows 5.1, 5.2, not 6.0)
- Lock exact versions in production with lock file
- Test provider upgrades in non-production first

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Values

```hcl
## Bad - Hardcoded values
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "production-web-server"
  }
}

## Good - Use variables
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
## Bad - No type constraint
variable "config" {
  default = {}
}

## Good - Explicit type
variable "config" {
  type = object({
    name    = string
    enabled = bool
  })
}
```

### ❌ Avoid: Complex Inline Logic

```hcl
## Bad - Complex inline logic
resource "aws_instance" "web" {
  count = var.environment == "prod" ? (var.high_availability ? 3 : 1) : (var.environment == "staging" ? 2 : 1)
}

## Good - Use locals for clarity
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

### ❌ Avoid: Not Using for_each for Maps

```hcl
## Bad - Using count with maps (fragile to reordering)
variable "users" {
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  count = length(var.users)
  name  = var.users[count.index]
}

## Good - Use for_each
variable "users" {
  type = set(string)
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  for_each = var.users
  name     = each.value
}
```

### ❌ Avoid: Mixing Resource Types in One File

```hcl
## Bad - All resources in main.tf
## main.tf with VPC, EC2, S3, IAM, etc. (1000+ lines)

## Good - Separate by resource type
## network.tf - VPC, subnets, route tables
## compute.tf - EC2 instances, auto-scaling
## storage.tf - S3 buckets, EBS volumes
## security.tf - IAM roles, security groups
```

### ❌ Avoid: Not Using Dynamic Blocks

```hcl
## Bad - Repetitive inline blocks
resource "aws_security_group" "web" {
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

## Good - Dynamic block
locals {
  ingress_rules = [
    { port = 80, protocol = "tcp" },
    { port = 443, protocol = "tcp" }
  ]
}

resource "aws_security_group" "web" {
  dynamic "ingress" {
    for_each = local.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

### ❌ Avoid: Not Validating Variables

```hcl
## Bad - No validation
variable "environment" {
  type = string
}

## Good - With validation
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

---

## Tool Configuration

### Terraform fmt

Terraform includes a built-in formatter that follows HCL style conventions:

```bash
## Format all HCL files in current directory
terraform fmt

## Format specific directory
terraform fmt modules/networking

## Check formatting without making changes
terraform fmt -check

## Recursive formatting
terraform fmt -recursive
```

### terraform.rc Configuration

Configure Terraform CLI behavior:

```hcl
## ~/.terraformrc or terraform.rc
plugin_cache_dir   = "$HOME/.terraform.d/plugin-cache"
disable_checkpoint = true

credentials "app.terraform.io" {
  token = "xxxxxx.atlasv1.zzzzzzzzzzzzz"
}
```

### Project tflint Configuration

```hcl
## .tflint.hcl
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
## .editorconfig
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
## .pre-commit-config.yaml
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
## Makefile
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
- [HCL Style Guide](https://developer.hashicorp.com/terraform/language/syntax/style)

---

**Version**: 1.0.0
**Status**: Active
