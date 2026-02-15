---
title: "Getting Started"
description: "Comprehensive step-by-step tutorial for adopting the Dukes Engineering Style Guide in your projects"
author: "Tyler Dukes"
tags: [getting-started, quickstart, installation, setup, tutorial, integration]
category: "Overview"
status: "active"
search_keywords: [getting started, setup, installation, quickstart, onboarding, first steps]
---

Welcome to the Dukes Engineering Style Guide! This comprehensive tutorial will walk you through integrating
consistent coding standards, automated validation, and AI-friendly metadata into your projects.

## Prerequisites

### What You'll Need

Before starting, ensure you have one of the following setups:

**Option 1: Docker (Recommended for Quick Start)**:

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- 5 minutes of time

**Option 2: Local Python Setup**:

- Python 3.10 or higher
- [uv package manager](https://docs.astral.sh/uv/) OR pip
- Git
- 10-15 minutes of time

**For Your Project**:

- A Git repository to validate
- Code in one or more supported languages (Python, Terraform, TypeScript, Bash, etc.)

## Quick Start (30 Seconds)

The absolute fastest way to validate your project:

```bash
# Navigate to your project
cd /path/to/your/project

# Run validation with Docker (no installation needed!)
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

That's it! You'll immediately see:

- Linting errors across all languages
- Missing metadata tags
- Formatting issues
- Specific files and line numbers to fix

**Want to auto-fix what's fixable?**

```bash
# Auto-format your code
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format

# Run validation again
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate
```

**Prefer local setup?**

```bash
# Clone and serve documentation locally
git clone https://github.com/tydukes/coding-style-guide.git
cd coding-style-guide
pip install uv
uv sync
mkdocs serve
# Browse to http://127.0.0.1:8000
```

## Scenario-Based Tutorials

Choose the scenario that matches your project:

- [Scenario 1: Python Project](#scenario-1-python-project-flask-api) - Flask API with pytest tests
- [Scenario 2: Terraform Module](#scenario-2-terraform-module-aws-vpc) - AWS VPC Terraform module
- [Scenario 3: Multi-Language Repository](#scenario-3-multi-language-repository) - Monorepo with Python + TypeScript + Terraform
- [Scenario 4: Documentation Site](#scenario-4-documentation-site-mkdocs) - MkDocs documentation project

---

### Scenario 1: Python Project (Flask API)

**Your Project**: A Flask REST API with pytest tests and SQLAlchemy models.

**Goal**: Add comprehensive linting, formatting, and metadata validation.

**Time**: 15 minutes

#### Step 1: Run Initial Validation (2 min)

```bash
# Navigate to your Flask project
cd /path/to/your/flask-api

# Run validation to see current state
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate

# Example output:
# ❌ src/api/users.py:1: Missing @module metadata tag
# ❌ src/models/user.py:45: E501 line too long (120 > 100 characters)
# ❌ tests/test_users.py: Missing @module metadata tag
# ✅ src/utils/helpers.py: All checks passed
```

#### Step 2: Auto-Fix Formatting Issues (2 min)

```bash
# Auto-format all Python files with Black
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format

# This will:
# - Format code to 100-character line length
# - Fix indentation and spacing
# - Organize imports (if isort is configured)
```

#### Step 3: Add Metadata to Core Files (5 min)

Add metadata tags to your main application files:

**src/api/users.py** (API endpoints):

```python
"""
@module users_api
@description RESTful API endpoints for user management, registration, and authentication
@version 1.2.0
@author Your Name
@last_updated 2025-12-27
@dependencies flask, sqlalchemy, pydantic, jwt
@status stable
@api_endpoints /api/users, /api/users/<id>, /api/users/login
"""

from flask import Blueprint, request, jsonify
from src.models.user import User
from src.utils.auth import require_auth

users_bp = Blueprint('users', __name__)

@users_bp.route('/api/users', methods=['GET'])
@require_auth
def list_users():
    """List all users with pagination support."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    users = User.query.paginate(page=page, per_page=per_page)
    return jsonify({
        'users': [user.to_dict() for user in users.items],
        'total': users.total,
        'pages': users.pages
    })

@users_bp.route('/api/users/<int:user_id>', methods=['GET'])
@require_auth
def get_user(user_id):
    """Get a specific user by ID."""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())
```

**src/models/user.py** (Database models):

```python
"""
@module user_model
@description SQLAlchemy User model with password hashing and validation
@version 1.0.0
@author Your Name
@last_updated 2025-12-27
@dependencies sqlalchemy, werkzeug
@status stable
"""

from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from src.database import db

class User(db.Model):
    """User account model with authentication support."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def set_password(self, password):
        """Hash and store password securely."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify password against stored hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Convert user object to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
```

**tests/test_users.py** (Test suite):

```python
"""
@module test_users
@description Unit and integration tests for user API endpoints
@version 1.0.0
@author Your Name
@last_updated 2025-12-27
@dependencies pytest, flask-testing
@status stable
"""

import pytest
from src.app import create_app
from src.database import db
from src.models.user import User

@pytest.fixture
def app():
    """Create application instance for testing."""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

def test_list_users_requires_auth(client):
    """Test that listing users requires authentication."""
    response = client.get('/api/users')
    assert response.status_code == 401
    assert 'error' in response.json

def test_create_user(client, app):
    """Test user creation endpoint."""
    with app.app_context():
        user_data = {
            'email': 'test@example.com',
            'password': 'securepassword123'
        }
        response = client.post('/api/users', json=user_data)
        assert response.status_code == 201
        assert 'id' in response.json

        # Verify user was created in database
        user = User.query.filter_by(email='test@example.com').first()
        assert user is not None
        assert user.check_password('securepassword123')
```

#### Step 4: Add Pre-commit Hooks (3 min)

Create `.pre-commit-config.yaml` in your project root:

```yaml
repos:
  # Python formatting
  - repo: https://github.com/psf/black
    rev: 24.10.0
    hooks:
      - id: black
        args: [--line-length=100]

  # Python linting
  - repo: https://github.com/pycqa/flake8
    rev: 7.1.1
    hooks:
      - id: flake8
        args: [--max-line-length=100, --extend-ignore=E203,W503]

  # Import sorting
  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: [--profile=black, --line-length=100]

  # General file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: [--maxkb=1000]
      - id: detect-private-key

  # Metadata validation (using local validator)
  - repo: local
    hooks:
      - id: validate-metadata
        name: Validate Python Metadata
        entry: docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest metadata
        language: system
        pass_filenames: false
```

Install and run pre-commit hooks:

```bash
# Install pre-commit
pip install pre-commit

# Install the git hook scripts
pre-commit install

# (Optional) Run against all files to test
pre-commit run --all-files
```

#### Step 5: Set Up GitHub Actions (3 min)

Create `.github/workflows/validate.yml`:

```yaml
name: Code Quality Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run linting
        run: |
          docker run --rm -v $(pwd):/workspace \
            ghcr.io/tydukes/coding-style-guide:latest lint

      - name: Run tests
        run: |
          pytest --cov=src --cov-report=xml --cov-report=term

      - name: Validate metadata
        run: |
          docker run --rm -v $(pwd):/workspace \
            ghcr.io/tydukes/coding-style-guide:latest metadata

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml
          fail_ci_if_error: false
```

#### Final Verification

```bash
# Run full validation
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate

# All checks should pass!
# ✅ src/api/users.py: All checks passed
# ✅ src/models/user.py: All checks passed
# ✅ tests/test_users.py: All checks passed
```

**Success!** Your Flask project now has:

- ✅ Automated formatting with Black
- ✅ Linting with Flake8
- ✅ Metadata tags on all modules
- ✅ Pre-commit hooks preventing bad commits
- ✅ CI/CD validation in GitHub Actions

---

### Scenario 2: Terraform Module (AWS VPC)

**Your Project**: A reusable Terraform module for creating AWS VPCs with public/private subnets.

**Goal**: Add IaC validation, documentation, testing, and contract-based development.

**Time**: 20 minutes

#### Step 1: Validate Terraform Formatting (2 min)

```bash
# Navigate to your Terraform module
cd /path/to/terraform-aws-vpc

# Check current formatting and validation status
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate

# Example output:
# ❌ main.tf: Not formatted correctly
# ❌ variables.tf: Missing metadata comment
# ❌ No README.md found
# ❌ No CONTRACT.md found
```

Auto-fix formatting:

```bash
# Format all Terraform files
terraform fmt -recursive .

# Or use the container
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format
```

#### Step 2: Add Metadata to Terraform Files (3 min)

**main.tf**:

```hcl
/**
 * @module aws_vpc_module
 * @description Creates AWS VPC with public/private subnets, NAT gateways, and route tables
 * @version 2.1.0
 * @author Your Name
 * @last_updated 2025-12-27
 * @dependencies aws_vpc, aws_subnet, aws_nat_gateway, aws_internet_gateway
 * @status stable
 * @platform AWS
 */

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(
    var.tags,
    {
      Name = var.vpc_name
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${var.vpc_name}-igw"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name = "${var.vpc_name}-public-${count.index + 1}"
      Type = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.vpc_name}-private-${count.index + 1}"
      Type = "private"
    }
  )
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.public_subnet_cidrs)) : 0

  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "${var.vpc_name}-eip-${count.index + 1}"
    }
  )
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.public_subnet_cidrs)) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.tags,
    {
      Name = "${var.vpc_name}-nat-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}
```

**variables.tf**:

```hcl
/**
 * @module vpc_variables
 * @description Input variables for AWS VPC module with validation rules
 * @version 2.1.0
 * @author Your Name
 * @last_updated 2025-12-27
 */

variable "vpc_name" {
  description = "Name of the VPC"
  type        = string

  validation {
    condition     = length(var.vpc_name) > 0 && length(var.vpc_name) <= 64
    error_message = "VPC name must be between 1 and 64 characters"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block"
  }
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) >= 2
    error_message = "At least 2 public subnets required for HA"
  }
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) >= 2
    error_message = "At least 2 private subnets required for HA"
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones required for HA"
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT gateway for all private subnets (cost optimization)"
  type        = bool
  default     = false
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

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

**outputs.tf**:

```hcl
/**
 * @module vpc_outputs
 * @description Output values from AWS VPC module
 * @version 2.1.0
 * @author Your Name
 * @last_updated 2025-12-27
 */

output "vpc_id" {
  description = "ID of the VPC"
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

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}
```

#### Step 3: Add terraform-docs (2 min)

Install terraform-docs to auto-generate documentation:

```bash
# macOS
brew install terraform-docs

# Linux
curl -Lo ./terraform-docs.tar.gz https://github.com/terraform-docs/terraform-docs/releases/download/v0.17.0/terraform-docs-v0.17.0-linux-amd64.tar.gz
tar -xzf terraform-docs.tar.gz
chmod +x terraform-docs
sudo mv terraform-docs /usr/local/bin/
```

Create `.terraform-docs.yml`:

```yaml
formatter: "markdown table"
version: ""
header-from: "main.tf"
footer-from: ""
sections:
  show:
    - header
    - requirements
    - providers
    - inputs
    - outputs
    - resources
  hide: []
output:
  file: "README.md"
  mode: inject
  template: |-
    <!-- BEGIN_TF_DOCS -->
    {{ .Content }}
    <!-- END_TF_DOCS -->
settings:
  anchor: true
  color: true
  default: true
  description: true
  escape: true
  hide-empty: false
  html: true
  indent: 2
  lockfile: true
  read-comments: true
  required: true
  sensitive: true
  type: true
```

Generate README:

```bash
# Generate documentation
terraform-docs markdown table . > README.md

# Or use with injection
terraform-docs .
```

#### Step 4: Create CONTRACT.md (5 min)

Use the CONTRACT.md template for contract-based development:

```bash
# Download template
curl -o CONTRACT.md \
  https://raw.githubusercontent.com/tydukes/coding-style-guide/main/docs/04_templates/contract_template.md
```

Edit CONTRACT.md with your module's guarantees:

```text
# AWS VPC Module Contract

## Purpose

Creates production-ready AWS VPC with high availability across multiple availability zones,
including public/private subnets, NAT gateways, and internet gateway.

## Guarantees

- **G1**: Creates exactly 1 VPC with DNS hostnames and DNS support enabled
- **G2**: Creates N public subnets distributed across at least 2 availability zones
- **G3**: Creates N private subnets distributed across at least 2 availability zones
- **G4**: All public subnets have internet access via Internet Gateway
- **G5**: All private subnets have internet access via NAT Gateway (when enabled)
- **G6**: Subnets in different AZs for high availability
- **G7**: CIDR blocks do not overlap within the VPC
- **G8**: All resources are properly tagged with module name and user-provided tags

## Inputs

### Required

| Name | Type | Description | Validation |
|------|------|-------------|------------|
| `vpc_name` | string | Name of the VPC | 1-64 characters |
| `availability_zones` | list(string) | List of AZs | >= 2 zones |

### Optional

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `vpc_cidr` | string | `10.0.0.0/16` | VPC CIDR block |
| `public_subnet_cidrs` | list(string) | `["10.0.1.0/24", "10.0.2.0/24"]` | Public subnet CIDRs |
| `private_subnet_cidrs` | list(string) | `["10.0.101.0/24", "10.0.102.0/24"]` | Private subnet CIDRs |
| `enable_nat_gateway` | bool | `true` | Enable NAT gateway |
| `single_nat_gateway` | bool | `false` | Use single NAT for all private subnets |
| `tags` | map(string) | `{}` | Additional tags |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| `vpc_id` | string | VPC ID |
| `vpc_cidr` | string | VPC CIDR block |
| `public_subnet_ids` | list(string) | Public subnet IDs |
| `private_subnet_ids` | list(string) | Private subnet IDs |
| `nat_gateway_ids` | list(string) | NAT Gateway IDs |

## Platform Requirements

- **AWS Provider**: >= 5.0
- **Terraform**: >= 1.5
- **Regions**: All AWS regions
- **AWS Services**: VPC, EC2 (for subnets, NAT, IGW)

## IAM Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpc",
        "ec2:DeleteVpc",
        "ec2:DescribeVpcs",
        "ec2:ModifyVpcAttribute",
        "ec2:CreateSubnet",
        "ec2:DeleteSubnet",
        "ec2:DescribeSubnets",
        "ec2:CreateInternetGateway",
        "ec2:AttachInternetGateway",
        "ec2:DeleteInternetGateway",
        "ec2:DescribeInternetGateways",
        "ec2:CreateNatGateway",
        "ec2:DeleteNatGateway",
        "ec2:DescribeNatGateways",
        "ec2:AllocateAddress",
        "ec2:ReleaseAddress",
        "ec2:DescribeAddresses",
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:DescribeTags"
      ],
      "Resource": "*"
    }
  ]
}
```

## Cost Implications

### Estimated Monthly Costs (us-east-1)

- **VPC**: Free
- **Subnets**: Free
- **Internet Gateway**: Free
- **NAT Gateway** (per AZ): ~$32.40/month + data transfer costs
  - Single NAT (cost optimization): ~$32.40/month
  - Multi-AZ NAT (HA): ~$32.40/month × number of AZs
- **Elastic IPs**: $0.005/hour when not associated

### Cost Optimization

- Set `single_nat_gateway = true` for non-production (saves ~$32.40/month per AZ)
- Set `enable_nat_gateway = false` if private subnets don't need internet access

## Testing Requirements

All guarantees must be validated by automated tests:

**Terratest (test/vpc_test.go)**:

```go
// Tests G1, G2, G3
func TestVPCCreation(t *testing.T)
// Tests G4
func TestPublicSubnetInternetAccess(t *testing.T)
// Tests G5
func TestPrivateSubnetNATAccess(t *testing.T)
// Tests G6
func TestHighAvailability(t *testing.T)
// Tests G7
func TestNonOverlappingCIDRs(t *testing.T)
// Tests G8
func TestResourceTags(t *testing.T)
```

## Known Limitations

1. Maximum 200 subnets per VPC (AWS limit)
2. Cannot modify VPC CIDR block after creation (requires recreation)
3. NAT Gateway quota is 5 per AZ (can be increased via AWS support)
4. Single NAT gateway configuration is not highly available

## Version History

- **2.1.0** (2025-12-27): Added validation rules, improved tagging
- **2.0.0** (2025-11-01): Breaking change - Required AZ parameter
- **1.0.0** (2025-08-15): Initial stable release

## Support

- **Maintainer**: Your Name (<your.email@example.com>)
- **Issues**: <https://github.com/your-org/terraform-aws-vpc/issues>
- **Updates**: Monthly or on critical bugs

```text

#### Step 5: Set Up Terratest (5 min)

Create test structure:

```bash
mkdir -p test
cd test
go mod init github.com/yourorg/terraform-aws-vpc/test
go get github.com/gruntwork-io/terratest/modules/terraform
go get github.com/stretchr/testify/assert
```

**test/vpc_test.go**:

```go
package test

import (
    "testing"

    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

// Tests G1, G2, G3: VPC and subnet creation
func TestVPCCreation(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../",
        Vars: map[string]interface{}{
            "vpc_name":           "test-vpc",
            "availability_zones": []string{"us-east-1a", "us-east-1b"},
        },
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    // Test G1: Exactly 1 VPC created
    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcID)

    // Test G2: Public subnets created
    publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
    assert.Len(t, publicSubnetIDs, 2)

    // Test G3: Private subnets created
    privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
    assert.Len(t, privateSubnetIDs, 2)
}

// Tests G6: High availability across AZs
func TestHighAvailability(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../",
        Vars: map[string]interface{}{
            "vpc_name":           "test-ha-vpc",
            "availability_zones": []string{"us-east-1a", "us-east-1b", "us-east-1c"},
        },
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
    assert.Len(t, publicSubnetIDs, 3, "Should have 3 public subnets across 3 AZs")

    privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
    assert.Len(t, privateSubnetIDs, 3, "Should have 3 private subnets across 3 AZs")
}
```

Run tests:

```bash
cd test
go test -v -timeout 30m
```

### Step 6: CI/CD Integration (3 min)

Create `.github/workflows/terraform.yml`:

```yaml
name: Terraform Validation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Init
        run: terraform init

      - name: Terraform Validate
        run: terraform validate

      - name: Run Style Guide Validation
        run: |
          docker run --rm -v $(pwd):/workspace \
            ghcr.io/tydukes/coding-style-guide:latest validate

      - name: Generate Documentation
        run: |
          docker run --rm -v $(pwd):/workspace \
            quay.io/terraform-docs/terraform-docs:latest \
            markdown table --output-file README.md .

      - name: Check Documentation Updated
        run: |
          git diff --exit-code README.md || \
            (echo "Documentation out of date. Run 'terraform-docs .'" && exit 1)

  test:
    runs-on: ubuntu-latest
    needs: validate

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Run Terratest
        run: |
          cd test
          go test -v -timeout 30m
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

**Success!** Your Terraform module now has:

- ✅ Formatted and validated HCL
- ✅ Metadata tags on all files
- ✅ Auto-generated documentation
- ✅ CONTRACT.md with explicit guarantees
- ✅ Automated tests with Terratest
- ✅ CI/CD validation pipeline

---

### Scenario 3: Multi-Language Repository

**Your Project**: A monorepo with Python backend + TypeScript frontend + Terraform infrastructure.

**Goal**: Set up comprehensive validation across all languages with optimized CI/CD.

**Time**: 25 minutes

#### Project Structure

```text
my-monorepo/
├── backend/                 # Python Flask API
│   ├── src/
│   ├── tests/
│   └── requirements.txt
├── frontend/                # React TypeScript SPA
│   ├── src/
│   ├── tests/
│   └── package.json
├── infrastructure/          # Terraform AWS resources
│   ├── modules/
│   └── environments/
├── docker-compose.yml
└── .github/workflows/
```

#### Step 1: Configure Validation for Each Language (5 min)

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  # Validate Python backend
  validate-backend:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - ./backend:/workspace
    command: validate
    working_dir: /workspace

  # Validate TypeScript frontend
  validate-frontend:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - ./frontend:/workspace
    command: validate
    working_dir: /workspace

  # Validate Terraform infrastructure
  validate-infrastructure:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - ./infrastructure:/workspace
    command: validate
    working_dir: /workspace

  # Format all code
  format-all:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: format
    working_dir: /workspace

  # Run full validation suite
  validate-all:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: validate
    working_dir: /workspace
```

#### Step 2: Add Language-Specific Pre-commit Hooks (5 min)

Create comprehensive `.pre-commit-config.yaml`:

```yaml
repos:
  # General file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: [--maxkb=1000]
      - id: check-merge-conflict
      - id: detect-private-key

  # Python (backend)
  - repo: https://github.com/psf/black
    rev: 24.10.0
    hooks:
      - id: black
        args: [--line-length=100]
        files: ^backend/

  - repo: https://github.com/pycqa/flake8
    rev: 7.1.1
    hooks:
      - id: flake8
        args: [--max-line-length=100, --extend-ignore=E203,W503]
        files: ^backend/

  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: [--profile=black]
        files: ^backend/

  # TypeScript/JavaScript (frontend)
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v4.0.0-alpha.8
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx, json, css, scss]
        files: ^frontend/

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v9.0.0
    hooks:
      - id: eslint
        files: ^frontend/.*\.[jt]sx?$
        types: [file]
        additional_dependencies:
          - eslint@8.56.0
          - eslint-config-airbnb@19.0.4
          - '@typescript-eslint/eslint-plugin@6.21.0'
          - '@typescript-eslint/parser@6.21.0'

  # Terraform (infrastructure)
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.96.1
    hooks:
      - id: terraform_fmt
        files: ^infrastructure/
      - id: terraform_validate
        files: ^infrastructure/
      - id: terraform_docs
        files: ^infrastructure/

  # Markdown
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.41.0
    hooks:
      - id: markdownlint
        args: [--fix]

  # YAML
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.35.1
    hooks:
      - id: yamllint
        args: [-c=.yamllint.yml]

  # Metadata validation (all languages)
  - repo: local
    hooks:
      - id: validate-metadata
        name: Validate Metadata Tags
        entry: docker-compose run --rm validate-all
        language: system
        pass_filenames: false
```

Install pre-commit:

```bash
pip install pre-commit
pre-commit install
```

#### Step 3: Add Metadata to Each Component (10 min)

**Backend (Python)** - `backend/src/api/app.py`:

```python
"""
@module backend_api
@description Main Flask application with API routes, authentication, and database connections
@version 2.0.0
@author Your Name
@last_updated 2025-12-27
@dependencies flask, sqlalchemy, redis, celery
@status stable
@api_endpoints /api/v1/users, /api/v1/products, /api/v1/orders
@env production, staging, development
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from redis import Redis
import os

db = SQLAlchemy()
redis_client = Redis()

def create_app(config_name='production'):
    """Create and configure Flask application instance."""
    app = Flask(__name__)
    app.config.from_object(f'config.{config_name.capitalize()}Config')

    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=os.getenv('CORS_ORIGINS', '*'))

    # Register blueprints
    from src.api.routes.users import users_bp
    from src.api.routes.products import products_bp
    from src.api.routes.orders import orders_bp

    app.register_blueprint(users_bp, url_prefix='/api/v1/users')
    app.register_blueprint(products_bp, url_prefix='/api/v1/products')
    app.register_blueprint(orders_bp, url_prefix='/api/v1/orders')

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'version': '2.0.0',
            'database': check_database_connection(),
            'redis': check_redis_connection()
        })

    return app

def check_database_connection():
    """Verify database connectivity."""
    try:
        db.session.execute('SELECT 1')
        return 'connected'
    except Exception:
        return 'disconnected'

def check_redis_connection():
    """Verify Redis connectivity."""
    try:
        redis_client.ping()
        return 'connected'
    except Exception:
        return 'disconnected'
```

**Frontend (TypeScript)** - `frontend/src/App.tsx`:

```typescript
/**
 * @module frontend_app
 * @description Main React application component with routing and global state management
 * @version 2.0.0
 * @author Your Name
 * @last_updated 2025-12-27
 * @dependencies react, react-router-dom, axios, zustand
 * @status stable
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Page components
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout components
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
            </Route>

            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
```

**Infrastructure (Terraform)** - `infrastructure/main.tf`:

```hcl
/**
 * @module infrastructure_main
 * @description Root Terraform configuration orchestrating VPC, ECS, RDS, and CloudFront
 * @version 1.5.0
 * @author Your Name
 * @last_updated 2025-12-27
 * @dependencies aws_vpc_module, aws_ecs_module, aws_rds_module
 * @status stable
 * @platform AWS
 * @env production
 */

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "My Monorepo"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "github.com/yourorg/my-monorepo"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  vpc_name             = "${var.project_name}-${var.environment}"
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "production"

  tags = var.tags
}

# ECS Cluster for Backend API
module "ecs" {
  source = "./modules/ecs"

  cluster_name           = "${var.project_name}-${var.environment}"
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  public_subnet_ids      = module.vpc.public_subnet_ids
  backend_image          = var.backend_docker_image
  backend_cpu            = var.backend_cpu
  backend_memory         = var.backend_memory
  backend_desired_count  = var.backend_desired_count
  database_url           = module.rds.database_url
  redis_endpoint         = module.redis.primary_endpoint

  tags = var.tags
}

# RDS PostgreSQL Database
module "rds" {
  source = "./modules/rds"

  identifier             = "${var.project_name}-${var.environment}-db"
  engine_version         = "15.4"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ecs.backend_security_group_id]
  backup_retention_period = var.environment == "production" ? 30 : 7
  multi_az               = var.environment == "production"

  tags = var.tags
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"

  cluster_id              = "${var.project_name}-${var.environment}-redis"
  node_type              = var.redis_node_type
  num_cache_nodes        = var.environment == "production" ? 2 : 1
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = module.vpc.private_subnet_cidrs
  allowed_security_groups = [module.ecs.backend_security_group_id]

  tags = var.tags
}

# S3 + CloudFront for Frontend
module "frontend" {
  source = "./modules/cloudfront"

  domain_name        = var.frontend_domain
  acm_certificate_arn = var.acm_certificate_arn
  s3_bucket_name     = "${var.project_name}-${var.environment}-frontend"
  backend_api_url    = module.ecs.api_endpoint

  tags = var.tags
}
```

#### Step 4: Set Up Docker Compose Workflow (2 min)

Add convenience scripts to `package.json` (project root):

```json
{
  "name": "my-monorepo",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "validate": "docker-compose run --rm validate-all",
    "validate:backend": "docker-compose run --rm validate-backend",
    "validate:frontend": "docker-compose run --rm validate-frontend",
    "validate:infra": "docker-compose run --rm validate-infrastructure",
    "format": "docker-compose run --rm format-all",
    "precommit": "pre-commit run --all-files"
  },
  "workspaces": [
    "backend",
    "frontend"
  ]
}
```

Usage:

```bash
# Validate all components
npm run validate

# Validate specific component
npm run validate:backend
npm run validate:frontend
npm run validate:infra

# Auto-format all code
npm run format

# Run pre-commit checks
npm run precommit
```

#### Step 5: Optimize CI/CD Pipeline (3 min)

Create `.github/workflows/monorepo-ci.yml` with parallel jobs:

```yaml
name: Monorepo CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Detect changed components
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
      infrastructure: ${{ steps.filter.outputs.infrastructure }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
            frontend:
              - 'frontend/**'
            infrastructure:
              - 'infrastructure/**'

  # Validate Backend (Python)
  validate-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate Backend
        run: |
          docker run --rm -v $(pwd)/backend:/workspace \
            ghcr.io/tydukes/coding-style-guide:latest validate

      - name: Run Backend Tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=src --cov-report=xml

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./backend/coverage.xml
          flags: backend

  # Validate Frontend (TypeScript)
  validate-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        run: |
          cd frontend
          npm ci

      - name: Validate Frontend
        run: |
          docker run --rm -v $(pwd)/frontend:/workspace \
            ghcr.io/tydukes/coding-style-guide:latest validate

      - name: Run Frontend Tests
        run: |
          cd frontend
          npm run test -- --coverage --watchAll=false

      - name: Build Frontend
        run: |
          cd frontend
          npm run build

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend

  # Validate Infrastructure (Terraform)
  validate-infrastructure:
    needs: detect-changes
    if: needs.detect-changes.outputs.infrastructure == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0

      - name: Validate Infrastructure
        run: |
          docker run --rm -v $(pwd)/infrastructure:/workspace \
            ghcr.io/tydukes/coding-style-guide:latest validate

      - name: Terraform Format Check
        run: |
          cd infrastructure
          terraform fmt -check -recursive

      - name: Terraform Init and Validate
        run: |
          cd infrastructure
          terraform init -backend=false
          terraform validate

      - name: Run Terratest
        run: |
          cd infrastructure/test
          go test -v -timeout 30m
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  # Security Scanning
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # Integration Tests
  integration-tests:
    needs: [validate-backend, validate-frontend, validate-infrastructure]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start Services
        run: docker-compose up -d

      - name: Wait for Services
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:5000/health; do sleep 2; done'

      - name: Run Integration Tests
        run: |
          npm run test:integration

      - name: Shutdown Services
        run: docker-compose down
```

**Success!** Your monorepo now has:

- ✅ Language-specific validation for Python, TypeScript, and Terraform
- ✅ Docker Compose workflow for local development
- ✅ Comprehensive pre-commit hooks
- ✅ Optimized CI/CD with change detection
- ✅ Parallel validation jobs
- ✅ Integration testing
- ✅ Security scanning

---

### Scenario 4: Documentation Site (MkDocs)

**Your Project**: An MkDocs documentation site for your API or product.

**Goal**: Build, validate, and deploy documentation with link checking and spell checking.

**Time**: 12 minutes

#### Step 1: Validate Markdown (2 min)

```bash
# Navigate to your docs project
cd /path/to/your/docs-site

# Run validation
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate

# Example output:
# ❌ docs/api/users.md:12: MD041 First line should be h1
# ❌ docs/guides/setup.md:45: MD034 Bare URL without angle brackets
# ✅ docs/index.md: All checks passed
```

#### Step 2: Add YAML Frontmatter to Docs (3 min)

All documentation files should have frontmatter:

**docs/index.md**:

```text
---
title: "Welcome to Our API Documentation"
description: "Comprehensive guide to using the ExampleAPI for building amazing applications"
author: "Your Name"
tags: [documentation, api, getting-started]
category: "Overview"
status: "active"
---

# Welcome to ExampleAPI

ExampleAPI is a powerful REST API that enables developers to build scalable applications
with authentication, data management, and real-time features.

## Quick Links

- Getting Started
- API Reference
- Code Examples
- Authentication Guide

## Features

- **RESTful Design**: Clean, intuitive API endpoints
- **Authentication**: OAuth 2.0 and JWT support
- **Real-time**: WebSocket support for live updates
- **SDKs**: Official libraries for Python, JavaScript, and Go
- **Documentation**: Interactive API explorer with try-it-now functionality

## Getting Started

```python
import exampleapi

# Initialize the client
client = exampleapi.Client(api_key='your-api-key')

# Create a resource
user = client.users.create(
    email='user@example.com',
    name='John Doe'
)

# Fetch resources
users = client.users.list(limit=10)

# Update a resource
user.update(name='Jane Doe')

# Delete a resource
user.delete()
```

```javascript
const ExampleAPI = require('exampleapi-node');

// Initialize the client
const client = new ExampleAPI('your-api-key');

// Create a resource
const user = await client.users.create({
  email: 'user@example.com',
  name: 'John Doe'
});

// Fetch resources
const users = await client.users.list({ limit: 10 });

// Update a resource
await client.users.update(user.id, { name: 'Jane Doe' });

// Delete a resource
await client.users.delete(user.id);
```

## Getting Started Steps

1. Set up authentication
2. Explore API endpoints
3. View code examples
4. Read best practices

```text

**docs/api/reference.md**:

```text
---
title: "API Reference"
description: "Complete REST API endpoint documentation with request/response examples"
author: "Your Name"
tags: [api, reference, endpoints]
category: "API Reference"
status: "active"
---

# API Reference

Complete reference for all ExampleAPI endpoints.

## Base URL

```text
https://api.example.com/v1
```

## Authentication

All API requests require authentication using an API key:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.example.com/v1/users
```

## Users

### List Users

Retrieve a paginated list of users.

**Endpoint**: `GET /users`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Number of results (default: 20, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |
| `sort` | string | No | Sort field (default: created_at) |
| `order` | string | No | Sort order: asc or desc (default: desc) |

**Example Request**:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_API_KEY" \
  "https://api.example.com/v1/users?limit=10&sort=email"
```

**Example Response** (200 OK):

```json
{
  "data": [
    {
      "id": "usr_1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-12-27T10:00:00Z",
      "updated_at": "2025-12-27T10:00:00Z",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

### Create User

Create a new user account.

**Endpoint**: `POST /users`

**Request Body**:

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123",
  "metadata": {
    "company": "Acme Corp",
    "role": "developer"
  }
}
```

**Example Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John Doe","password":"securepassword123"}' \
  https://api.example.com/v1/users
```

**Example Response** (201 Created):

```json
{
  "id": "usr_1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-12-27T10:00:00Z",
  "updated_at": "2025-12-27T10:00:00Z",
  "status": "active"
}
```

### Get User

Retrieve a specific user by ID.

**Endpoint**: `GET /users/{user_id}`

**Example Request**:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.example.com/v1/users/usr_1234567890
```

**Example Response** (200 OK):

```json
{
  "id": "usr_1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-12-27T10:00:00Z",
  "updated_at": "2025-12-27T10:00:00Z",
  "status": "active",
  "metadata": {
    "company": "Acme Corp",
    "role": "developer"
  }
}
```

## Error Handling

All error responses follow this structure:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The email field is required",
    "details": {
      "field": "email",
      "reason": "missing_field"
    }
  }
}
```

**Error Codes**:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_request` | 400 | Malformed request or missing parameters |
| `unauthorized` | 401 | Invalid or missing API key |
| `forbidden` | 403 | API key lacks required permissions |
| `not_found` | 404 | Resource does not exist |
| `rate_limit_exceeded` | 429 | Too many requests |
| `internal_error` | 500 | Server error |

```text

### Step 3: Check Links (2 min)

Create `.github/markdown-link-check-config.json`:

```json
{
  "ignorePatterns": [
    {
      "pattern": "^http://localhost"
    }
  ],
  "replacementPatterns": [
    {
      "pattern": "^/",
      "replacement": "{{BASEURL}}/"
    }
  ],
  "httpHeaders": [
    {
      "urls": ["https://api.example.com"],
      "headers": {
        "Authorization": "Bearer fake-token-for-docs"
      }
    }
  ],
  "timeout": "20s",
  "retryOn429": true,
  "retryCount": 2,
  "fallbackRetryDelay": "30s",
  "aliveStatusCodes": [200, 206]
}
```

Check links locally:

```bash
# Install markdown-link-check
npm install -g markdown-link-check

# Check all markdown files
find docs -name "*.md" -exec markdown-link-check {} \;
```

### Step 4: Build with MkDocs (2 min)

Create `mkdocs.yml`:

```yaml
site_name: ExampleAPI Documentation
site_description: Comprehensive API documentation and guides
site_author: Your Name
site_url: https://docs.example.com

repo_name: yourorg/exampleapi
repo_url: https://github.com/yourorg/exampleapi

theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  features:
    - navigation.instant
    - navigation.tracking
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.suggest
    - search.highlight
    - content.code.copy
    - content.code.annotate

nav:
  - Home: index.md
  - Getting Started: getting-started.md
  - API Reference:
      - Overview: api/reference.md
      - Users: api/users.md
      - Authentication: api/authentication.md
  - Guides:
      - Authentication: guides/authentication.md
      - Rate Limiting: guides/rate-limiting.md
      - Webhooks: guides/webhooks.md
      - Best Practices: guides/best-practices.md
  - Examples:
      - Python: examples/python.md
      - JavaScript: examples/javascript.md
      - Go: examples/go.md

markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
      line_spans: __span
      pygments_lang_class: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - pymdownx.superfences
  - admonition
  - pymdownx.details
  - pymdownx.tabbed:
      alternate_style: true
  - tables
  - footnotes
  - attr_list
  - md_in_html

plugins:
  - search
  - minify:
      minify_html: true
```

Build documentation:

```bash
# Install MkDocs and theme
pip install mkdocs mkdocs-material

# Build site
mkdocs build

# Serve locally
mkdocs serve
# Browse to http://127.0.0.1:8000
```

#### Step 5: Set Up GitHub Pages Deployment (3 min)

Create `.github/workflows/docs.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: write

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate Markdown
        run: |
          docker run --rm -v $(pwd):/workspace \
            ghcr.io/tydukes/coding-style-guide:latest validate

      - name: Check Markdown Links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          config-file: '.github/markdown-link-check-config.json'

      - name: Spell Check
        uses: streetsidesoftware/cspell-action@v6
        with:
          files: 'docs/**/*.md'
          config: '.github/cspell.json'

  build:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install mkdocs mkdocs-material

      - name: Build documentation
        run: mkdocs build --strict

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: documentation
          path: site/

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install mkdocs mkdocs-material

      - name: Deploy to GitHub Pages
        run: mkdocs gh-deploy --force
```

**Success!** Your documentation site now has:

- ✅ YAML frontmatter on all pages
- ✅ Validated markdown with markdownlint
- ✅ Link checking for broken links
- ✅ Spell checking
- ✅ MkDocs build with Material theme
- ✅ Automated deployment to GitHub Pages

---

## Integration Patterns

### GitHub Actions (Recommended)

For maximum flexibility, use the validation container in GitHub Actions:

```yaml
name: Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Full Validation
        run: |
          docker run --rm -v $(pwd):/workspace \
            ghcr.io/tydukes/coding-style-guide:latest validate
```

**Fast validation for CI** (lint only, skips docs build):

```yaml
- name: Run Linting Only
  run: |
    docker run --rm -v $(pwd):/workspace \
      ghcr.io/tydukes/coding-style-guide:latest lint
```

**Language-specific validation**:

```yaml
- name: Validate Python Only
  run: |
    docker run --rm -v $(pwd):/workspace \
      -e VALIDATE_LANGUAGE=python \
      ghcr.io/tydukes/coding-style-guide:latest validate
```

### Pre-commit Hooks (Local Development)

Prevent bad commits before they reach the remote:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: coding-style-validator
        name: Validate Coding Standards
        entry: docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest
        args: [lint]
        language: system
        pass_filenames: false
        stages: [commit]
```

Install hooks:

```bash
pip install pre-commit
pre-commit install
```

### Docker Compose (Team Development)

Perfect for team environments with multiple languages:

```yaml
# docker-compose.yml
version: '3.8'

services:
  validate:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: validate

  lint:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: lint

  format:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: format

  docs:
    image: ghcr.io/tydukes/coding-style-guide:latest
    volumes:
      - .:/workspace
    command: docs
    ports:
      - "8000:8000"
```

Usage:

```bash
# Run full validation
docker-compose run --rm validate

# Auto-format code
docker-compose run --rm format

# Build and serve docs
docker-compose up docs
```

### Makefile Integration

Simplify commands with a Makefile:

```makefile
.PHONY: help validate lint format docs test

help:
 @echo "Available commands:"
 @echo "  make validate  - Run full validation"
 @echo "  make lint      - Run linting only"
 @echo "  make format    - Auto-format code"
 @echo "  make docs      - Build documentation"
 @echo "  make test      - Run tests"

validate:
 docker run --rm -v $(PWD):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate

lint:
 docker run --rm -v $(PWD):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest lint

format:
 docker run --rm -v $(PWD):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format

docs:
 docker run --rm -v $(PWD):/workspace -p 8000:8000 \
  ghcr.io/tydukes/coding-style-guide:latest docs

test:
 pytest --cov=src --cov-report=term
```

## Common Issues and Solutions

### Problem: "Permission denied" in Docker

**Symptom**: Docker container can't write to mounted volume or fails with permission errors.

**Cause**: File ownership mismatch between host and container user.

**Solution**:

```bash
# Run container as current user
docker run --rm -v $(pwd):/workspace \
  --user $(id -u):$(id -g) \
  ghcr.io/tydukes/coding-style-guide:latest validate

# Fix file permissions after running
sudo chown -R $(whoami):$(whoami) .
```

### Problem: "Too many validation errors"

**Symptom**: Hundreds of linting/formatting errors make output unreadable.

**Cause**: Project hasn't been formatted according to style guide standards.

**Solution**:

```bash
# Step 1: Auto-fix what's fixable
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest format

# Step 2: Run validation again to see remaining issues
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest validate

# Step 3: Fix remaining issues manually (usually logic/design issues)
```

### Problem: "CI/CD pipeline is too slow"

**Symptom**: Validation takes 10+ minutes in CI, slowing down development.

**Cause**: Running full validation suite including docs build and all linters.

**Solutions**:

**Option 1: Use lint mode instead of validate** (faster):

```yaml
# .github/workflows/ci.yml
- name: Fast Linting
  run: |
    docker run --rm -v $(pwd):/workspace \
      ghcr.io/tydukes/coding-style-guide:latest lint
```

**Option 2: Only validate changed files**:

```yaml
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v41

- name: Validate changed files only
  run: |
    for file in ${{ steps.changed-files.outputs.all_changed_files }}; do
      docker run --rm -v $(pwd):/workspace \
        ghcr.io/tydukes/coding-style-guide:latest lint --file $file
    done
```

**Option 3: Parallel validation** (for monorepos):

```yaml
jobs:
  validate-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker run --rm -v $(pwd)/backend:/workspace ghcr.io/tydukes/coding-style-guide:latest lint

  validate-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker run --rm -v $(pwd)/frontend:/workspace ghcr.io/tydukes/coding-style-guide:latest lint
```

### Problem: "Metadata validation fails on legacy code"

**Symptom**: Hundreds of files missing `@module`, `@description`, `@version` tags.

**Cause**: Adding style guide to existing codebase without metadata.

**Solution** (Incremental adoption):

```bash
# Step 1: Run metadata validation to generate report
docker run --rm -v $(pwd):/workspace \
  ghcr.io/tydukes/coding-style-guide:latest metadata > metadata-report.txt

# Step 2: Prioritize files (add metadata to most important files first)
# - Entry points (main.py, app.py, index.ts)
# - API endpoints
# - Core business logic
# - Library interfaces

# Step 3: Add metadata incrementally
# Use find to locate files without metadata
grep -r "@module" src/ | cut -d: -f1 | sort -u > files_with_metadata.txt
find src/ -type f \( -name "*.py" -o -name "*.ts" \) | sort > all_files.txt
comm -23 all_files.txt files_with_metadata.txt > files_needing_metadata.txt

# Step 4: Set up non-blocking validation in CI
# Allow warnings but don't fail the build until adoption is complete
```

### Problem: "Pre-commit hooks are slow"

**Symptom**: Commits take 30+ seconds due to pre-commit validation.

**Cause**: Running full validation suite on every commit.

**Solution**:

```yaml
# .pre-commit-config.yaml
repos:
  # Only run fast checks on commit
  - repo: https://github.com/psf/black
    rev: 24.10.0
    hooks:
      - id: black
        stages: [commit]

  # Run expensive checks only on push
  - repo: local
    hooks:
      - id: full-validation
        name: Full Validation
        entry: docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest
        args: [validate]
        language: system
        pass_filenames: false
        stages: [push]  # Only runs on 'git push'
```

Install both hooks:

```bash
pre-commit install --hook-type commit
pre-commit install --hook-type push
```

### Problem: "Container fails to pull in CI"

**Symptom**: `Error: manifest for ghcr.io/tydukes/coding-style-guide:latest not found`

**Cause**: Network issues or GitHub Container Registry authentication required.

**Solutions**:

**Option 1: Use specific version tag** (more reliable):

```yaml
# Instead of :latest
docker pull ghcr.io/tydukes/coding-style-guide:v1.7.0

# Or use SHA digest for immutability
docker pull ghcr.io/tydukes/coding-style-guide@sha256:abc123...
```

**Option 2: Build container locally** (for private forks):

```yaml
# .github/workflows/ci.yml
- name: Build validation container
  run: |
    git clone https://github.com/tydukes/coding-style-guide.git
    cd coding-style-guide
    docker build -t local-validator .

- name: Run validation
  run: |
    docker run --rm -v $(pwd):/workspace local-validator validate
```

**Option 3: Authenticate to GHCR**:

```yaml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Pull container
  run: docker pull ghcr.io/tydukes/coding-style-guide:latest
```

## Next Steps

After completing your scenario, here's your roadmap:

### Immediate Actions

- [ ] Read language-specific guides for your stack
  - [Python Style Guide](../02_language_guides/python.md)
  - [TypeScript Style Guide](../02_language_guides/typescript.md)
  - [Terraform Style Guide](../02_language_guides/terraform.md)
  - [Bash Style Guide](../02_language_guides/bash.md)

- [ ] Review anti-patterns documentation to avoid common mistakes
  - [Anti-Patterns Guide](../08_anti_patterns/index.md)

- [ ] Set up automated validation in CI/CD
  - Already done if you followed scenarios above!

- [ ] Configure IDE settings for real-time validation
  - [IDE Settings Template](../04_templates/ide_settings_template.md)
  - Copy `.vscode/` and `.idea/` from this repo

### Advanced Features

- [ ] Explore metadata validation for documentation generation
  - [Metadata Schema Reference](../03_metadata_schema/schema_reference.md)

- [ ] Learn about contract-based development for IaC
  - [CONTRACT.md Template](../04_templates/contract_template.md)

- [ ] Implement 3:1 code-to-text ratio in documentation
  - Run `analyze_code_ratio.py` on your docs

- [ ] Set up security scanning and SBOM generation
  - [Container Usage Guide](../06_container/usage.md)

### Team Adoption

- [ ] Share this guide with team members
- [ ] Schedule team training session (use scenario walkthroughs)
- [ ] Create team-specific customizations if needed
- [ ] Add style guide validation to PR checklist
- [ ] Celebrate when all team members are onboarded!

## Resources

### Official Links

- **Documentation Site**: [https://tydukes.github.io/coding-style-guide/](https://tydukes.github.io/coding-style-guide/)
- **GitHub Repository**: [https://github.com/tydukes/coding-style-guide](https://github.com/tydukes/coding-style-guide)
- **Container Registry**: `ghcr.io/tydukes/coding-style-guide`
- **Issues**: [GitHub Issues](https://github.com/tydukes/coding-style-guide/issues)

### Quick Reference

- [Changelog](../changelog.md) - Version history and updates
- [Glossary](../glossary.md) - Common terminology
- [Contributing Guide](https://github.com/tydukes/coding-style-guide/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/tydukes/coding-style-guide/blob/main/CODE_OF_CONDUCT.md)

### Container Commands Cheat Sheet

```bash
# Validate entire project
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest validate

# Lint only (faster)
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest lint

# Auto-format code
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest format

# Build documentation
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest docs

# Validate metadata only
docker run --rm -v $(pwd):/workspace ghcr.io/tydukes/coding-style-guide:latest metadata

# Show help
docker run --rm ghcr.io/tydukes/coding-style-guide:latest help
```

## Frequently Asked Questions

### Q: Do I need to use Docker?

**A**: No, but it's recommended for ease of use. You can also:

- Clone the repo and run scripts directly with Python
- Use individual tools (Black, Flake8, terraform-docs, etc.) separately
- Build your own validation container based on our Dockerfile

### Q: Can I customize the style guide for my organization?

**A**: Absolutely! Fork the repository and:

- Modify validation scripts for custom rules
- Add organization-specific metadata tags
- Update linter configurations (`.flake8`, `.yamllint.yml`, etc.)
- Create custom templates
- Add additional language support

### Q: What if my language isn't supported?

**A**: The metadata schema works with any language that supports comments. You can:

- Use the same `@module`, `@description`, `@version` tags
- Adapt comment syntax (e.g., `//` for C++, `#` for Ruby)
- Add language support to `validate_metadata.py`
- Contribute back to the project!

### Q: How do I handle monorepos?

**A**: See [Scenario 3: Multi-Language Repository](#scenario-3-multi-language-repository) above. Key strategies:

- Use Docker Compose for component-specific validation
- Set up change detection in CI to only validate affected components
- Use parallel jobs in CI/CD pipelines
- Configure language-specific pre-commit hooks

### Q: Is metadata validation required?

**A**: It's recommended but not mandatory. Benefits of metadata:

- Better IDE autocomplete and navigation
- Auto-generated documentation
- Easier AI assistant integration
- Better codebase understanding for new team members

You can start without metadata and add it incrementally.

### Q: How often should I update the style guide?

**A**: The container and scripts are updated regularly. We recommend:

- Pin to specific version tags in production (e.g., `:v1.7.0`)
- Use `:latest` in development
- Review [Changelog](../changelog.md) monthly for updates
- Update when new language guides are released

### Q: Can I use this in air-gapped environments?

**A**: Yes! You can:

- Download the container image: `docker save/load`
- Clone the repository and vendor dependencies
- Build the container locally
- Run validation scripts directly without Docker

---

**Congratulations!** You now have everything you need to adopt the Dukes Engineering Style Guide.

Choose your scenario above, follow the step-by-step instructions, and you'll have automated validation,
consistent code style, and AI-friendly metadata in minutes.

**Questions?** Open an issue on [GitHub](https://github.com/tydukes/coding-style-guide/issues).

**Found this helpful?** Star the repo and share with your team!
