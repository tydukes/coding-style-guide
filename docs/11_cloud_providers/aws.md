---
title: "Amazon Web Services Best Practices Guide"
description: "Comprehensive AWS cloud provider best practices for infrastructure as code, security, networking, and cost optimization"
author: "Tyler Dukes"
tags: [aws, amazon, cloud, terraform, iac, security, networking, eks, iam]
category: "Cloud Providers"
status: "active"
search_keywords: [aws, amazon, cloud provider, infrastructure, terraform, security, organizations, landing zone]
---

## Overview

**Amazon Web Services (AWS)** is the world's most broadly adopted cloud platform, offering 200+
fully-featured services across compute, storage, networking, databases, AI/ML, and more. This guide
covers AWS-specific patterns, security standards, and infrastructure best practices optimized for
Terraform and Terragrunt deployments.

### Key Characteristics

- **Global Footprint**: 33+ regions, 105+ availability zones, 600+ edge locations
- **Breadth of Services**: Largest service catalog of any cloud provider
- **Security Depth**: Shared responsibility model, native compliance tooling (GuardDuty, Security Hub, Config)
- **IaC Ecosystem**: First-class Terraform provider, CDK, CloudFormation, and SAM support
- **Compliance**: 143+ security standards and compliance certifications

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|---|---|---|---|
| **Resource Naming** | | | |
| Format | `{workload}-{env}-{region}-{resource}` | `payments-prod-use1-eks` | Lowercase, hyphens |
| S3 Buckets | `{org}-{workload}-{purpose}-{env}-{region}` | `acme-payments-logs-prod-use1` | Globally unique |
| IAM Roles | `{workload}-{env}-{role}` | `payments-prod-eks-node` | No region (global) |
| VPCs | `{workload}-{env}-{region}-vpc` | `payments-prod-use1-vpc` | One per account/region |
| Security Groups | `{workload}-{env}-{role}-sg` | `payments-prod-app-sg` | Descriptive role |
| EKS Clusters | `{workload}-{env}-{region}-eks` | `payments-prod-use1-eks` | Include region |
| **Tagging** | | | |
| Required Tags | `Environment`, `Owner`, `CostCenter`, `Project`, `ManagedBy` | See examples below | Enforce via Config + SCP |
| **Terraform** | | | |
| Provider Version | `~> 5.0` | `version = "~> 5.0"` | Pin major version |
| State Backend | S3 + DynamoDB | `s3` backend | Versioning + locking |
| **Security** | | | |
| Authentication | IAM Roles + OIDC | IRSA, GitHub Actions OIDC | No long-lived credentials |
| Secrets | Secrets Manager | `aws_secretsmanager_secret` | Never in code or state |
| Network | Security Groups + VPC Endpoints | Defense in depth | No public endpoints |

---

## AWS Account Hierarchy

### Organization Structure

```hcl
# management/organizations.tf
# Root AWS Organizations configuration with OU structure

resource "aws_organizations_organization" "root" {
  aws_service_access_principals = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "guardduty.amazonaws.com",
    "securityhub.amazonaws.com",
    "sso.amazonaws.com",
    "ram.amazonaws.com",
    "billing.amazonaws.com",
    "cost-optimization-hub.bcm.amazonaws.com",
  ]

  feature_set          = "ALL"
  enabled_policy_types = ["SERVICE_CONTROL_POLICY", "TAG_POLICY", "BACKUP_POLICY"]
}

# Root OU: Infrastructure
resource "aws_organizations_organizational_unit" "infrastructure" {
  name      = "Infrastructure"
  parent_id = aws_organizations_organization.root.roots[0].id
}

# Root OU: Workloads
resource "aws_organizations_organizational_unit" "workloads" {
  name      = "Workloads"
  parent_id = aws_organizations_organization.root.roots[0].id
}

# Root OU: Sandbox
resource "aws_organizations_organizational_unit" "sandbox" {
  name      = "Sandbox"
  parent_id = aws_organizations_organization.root.roots[0].id
}

# Workloads: Production
resource "aws_organizations_organizational_unit" "production" {
  name      = "Production"
  parent_id = aws_organizations_organizational_unit.workloads.id
}

# Workloads: Non-Production
resource "aws_organizations_organizational_unit" "non_production" {
  name      = "NonProduction"
  parent_id = aws_organizations_organizational_unit.workloads.id
}
```

### Landing Zone Account Structure

```hcl
# management/accounts.tf
# Core platform accounts — one per function

resource "aws_organizations_account" "log_archive" {
  name              = "log-archive"
  email             = "aws-log-archive@example.com"
  parent_id         = aws_organizations_organizational_unit.infrastructure.id
  role_name         = "OrganizationAccountAccessRole"
  close_on_deletion = false

  tags = {
    Environment = "prod"
    Purpose     = "centralized-logging"
    ManagedBy   = "terraform"
  }
}

resource "aws_organizations_account" "audit" {
  name              = "audit"
  email             = "aws-audit@example.com"
  parent_id         = aws_organizations_organizational_unit.infrastructure.id
  role_name         = "OrganizationAccountAccessRole"
  close_on_deletion = false

  tags = {
    Environment = "prod"
    Purpose     = "security-tooling"
    ManagedBy   = "terraform"
  }
}

resource "aws_organizations_account" "network" {
  name              = "network"
  email             = "aws-network@example.com"
  parent_id         = aws_organizations_organizational_unit.infrastructure.id
  role_name         = "OrganizationAccountAccessRole"
  close_on_deletion = false

  tags = {
    Environment = "prod"
    Purpose     = "shared-networking"
    ManagedBy   = "terraform"
  }
}

resource "aws_organizations_account" "workload_prod" {
  name              = "payments-prod"
  email             = "aws-payments-prod@example.com"
  parent_id         = aws_organizations_organizational_unit.production.id
  role_name         = "OrganizationAccountAccessRole"
  close_on_deletion = false

  tags = {
    Environment = "prod"
    Project     = "payments"
    ManagedBy   = "terraform"
  }
}
```

### Service Control Policies

```hcl
# management/scps.tf
# Preventative guardrails applied at the OU level

# Deny actions that would compromise the security baseline
resource "aws_organizations_policy" "deny_root_user" {
  name        = "DenyRootUserActions"
  description = "Prevents root user actions across all member accounts"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyRootUser"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:PrincipalArn" = "arn:aws:iam::*:root"
          }
        }
      }
    ]
  })
}

resource "aws_organizations_policy" "deny_leave_org" {
  name        = "DenyLeaveOrganization"
  description = "Prevents accounts from leaving the organization"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyLeaveOrg"
        Effect   = "Deny"
        Action   = "organizations:LeaveOrganization"
        Resource = "*"
      }
    ]
  })
}

resource "aws_organizations_policy" "deny_disable_security" {
  name        = "DenyDisableSecurityServices"
  description = "Prevents disabling of GuardDuty, Security Hub, Config, and CloudTrail"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyDisableGuardDuty"
        Effect = "Deny"
        Action = [
          "guardduty:DeleteDetector",
          "guardduty:DisassociateFromMasterAccount",
          "guardduty:StopMonitoringMembers",
          "guardduty:UpdateDetector",
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyDisableSecurityHub"
        Effect = "Deny"
        Action = [
          "securityhub:DeleteHub",
          "securityhub:DisableSecurityHub",
          "securityhub:DisassociateFromMasterAccount",
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyDisableConfig"
        Effect = "Deny"
        Action = [
          "config:DeleteConfigRule",
          "config:DeleteConfigurationRecorder",
          "config:DeleteDeliveryChannel",
          "config:StopConfigurationRecorder",
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyDisableCloudTrail"
        Effect = "Deny"
        Action = [
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging",
          "cloudtrail:UpdateTrail",
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach SCPs to OUs
resource "aws_organizations_policy_attachment" "deny_root_workloads" {
  policy_id = aws_organizations_policy.deny_root_user.id
  target_id = aws_organizations_organizational_unit.workloads.id
}

resource "aws_organizations_policy_attachment" "deny_leave_all" {
  policy_id = aws_organizations_policy.deny_leave_org.id
  target_id = aws_organizations_organization.root.roots[0].id
}

resource "aws_organizations_policy_attachment" "deny_disable_security_workloads" {
  policy_id = aws_organizations_policy.deny_disable_security.id
  target_id = aws_organizations_organizational_unit.workloads.id
}
```

### Cross-Account Role Assumption

```hcl
# modules/cross-account/main.tf
# Standard pattern for cross-account access from a central CI/CD account

data "aws_iam_policy_document" "assume_role_cicd" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.cicd_account_id}:role/github-actions-deployer"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.external_id]
    }
  }
}

resource "aws_iam_role" "cross_account_deploy" {
  name               = "${var.workload}-${var.environment}-cross-account-deploy"
  assume_role_policy = data.aws_iam_policy_document.assume_role_cicd.json
  max_session_duration = 3600

  tags = local.common_tags
}
```

---

## Resource Naming Conventions

### Naming Locals Module

```hcl
# modules/naming/main.tf
# Centralized AWS naming convention module

variable "workload" {
  description = "Workload or application name"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,19}$", var.workload))
    error_message = "Workload must be lowercase alphanumeric with hyphens, 3-20 characters."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod", "sandbox"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod, sandbox."
  }
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "org" {
  description = "Organization short name for globally unique resources"
  type        = string
}

locals {
  # AWS region short codes for compact names
  region_short = {
    "us-east-1"      = "use1"
    "us-east-2"      = "use2"
    "us-west-1"      = "usw1"
    "us-west-2"      = "usw2"
    "eu-west-1"      = "euw1"
    "eu-west-2"      = "euw2"
    "eu-central-1"   = "euc1"
    "ap-southeast-1" = "apse1"
    "ap-southeast-2" = "apse2"
    "ap-northeast-1" = "apne1"
    "ca-central-1"   = "cac1"
  }

  region_code = lookup(local.region_short, var.region, replace(var.region, "-", ""))

  # Base naming pattern: {workload}-{env}-{region}
  base = "${var.workload}-${var.environment}-${local.region_code}"

  names = {
    # VPC
    vpc             = "${local.base}-vpc"
    # Subnets
    subnet_public   = "${local.base}-public"
    subnet_private  = "${local.base}-private"
    subnet_intra    = "${local.base}-intra"
    # EKS
    eks_cluster     = "${local.base}-eks"
    eks_node_group  = "${local.base}-ng"
    # ECS
    ecs_cluster     = "${local.base}-ecs"
    # Lambda (no region constraint — add function suffix per call)
    lambda_prefix   = "${var.workload}-${var.environment}"
    # RDS
    rds_instance    = "${local.base}-rds"
    rds_cluster     = "${local.base}-aurora"
    # ElastiCache
    elasticache     = "${local.base}-redis"
    # Security Groups (no region — descriptive role suffix)
    sg_prefix       = "${var.workload}-${var.environment}"
    # IAM Roles (global — no region)
    iam_role_prefix = "${var.workload}-${var.environment}"
    # S3 (globally unique — include org prefix)
    s3_prefix       = "${var.org}-${var.workload}"
    # ECR (no region in name — registry is regional)
    ecr_prefix      = "${var.workload}"
    # CloudWatch Log Groups
    log_group       = "/aws/${var.workload}/${var.environment}"
    # KMS
    kms_alias       = "alias/${var.workload}/${var.environment}"
    # Secrets Manager
    secret_prefix   = "${var.workload}/${var.environment}"
  }
}

output "names" {
  description = "Map of standardized resource names"
  value       = local.names
}

output "base" {
  description = "Base name for custom resource naming"
  value       = local.base
}

output "region_code" {
  description = "Short region code used in names"
  value       = local.region_code
}
```

### Using the Naming Module

```hcl
# main.tf
# Consume the naming module for consistent resource names

module "naming" {
  source = "./modules/naming"

  org         = "acme"
  workload    = "payments"
  environment = "prod"
  region      = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = module.naming.names.vpc
  })
}

resource "aws_eks_cluster" "main" {
  name     = module.naming.names.eks_cluster
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.31"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = false
  }

  tags = local.common_tags
}

resource "aws_s3_bucket" "artifacts" {
  bucket = "${module.naming.names.s3_prefix}-artifacts-prod-use1"

  tags = local.common_tags
}
```

### S3 Bucket Naming Rules

```hcl
# s3-naming.tf
# S3 has strict global uniqueness requirements

locals {
  # S3 bucket names: {org}-{workload}-{purpose}-{env}-{region}
  # Must be 3-63 chars, globally unique, DNS-compliant, no uppercase
  buckets = {
    artifacts  = "${var.org}-${var.workload}-artifacts-${var.environment}-${local.region_code}"
    logs       = "${var.org}-${var.workload}-logs-${var.environment}-${local.region_code}"
    tf_state   = "${var.org}-terraform-state-${local.region_code}"
    backups    = "${var.org}-${var.workload}-backups-${var.environment}-${local.region_code}"
    data       = "${var.org}-${var.workload}-data-${var.environment}-${local.region_code}"
  }
}

# Validate bucket names do not exceed 63 characters
resource "null_resource" "validate_bucket_names" {
  for_each = local.buckets

  lifecycle {
    precondition {
      condition     = length(each.value) <= 63
      error_message = "S3 bucket name '${each.value}' exceeds 63 characters."
    }
    precondition {
      condition     = can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", each.value))
      error_message = "S3 bucket name '${each.value}' contains invalid characters."
    }
  }
}
```

### IAM Resource Naming

```hcl
# iam-naming.tf
# IAM resources are global — no region in the name

locals {
  # IAM roles: {workload}-{env}-{component}-role
  iam_roles = {
    eks_cluster   = "${var.workload}-${var.environment}-eks-cluster-role"
    eks_node      = "${var.workload}-${var.environment}-eks-node-role"
    eks_pod       = "${var.workload}-${var.environment}-eks-pod-role"
    lambda        = "${var.workload}-${var.environment}-lambda-role"
    ecs_task      = "${var.workload}-${var.environment}-ecs-task-role"
    ecs_execution = "${var.workload}-${var.environment}-ecs-execution-role"
    github_oidc   = "${var.workload}-${var.environment}-github-oidc-role"
    rds_enhanced  = "${var.workload}-${var.environment}-rds-monitoring-role"
  }

  # IAM policies: {workload}-{env}-{purpose}-policy
  iam_policies = {
    s3_read     = "${var.workload}-${var.environment}-s3-read-policy"
    s3_write    = "${var.workload}-${var.environment}-s3-write-policy"
    secrets     = "${var.workload}-${var.environment}-secrets-read-policy"
    ssm         = "${var.workload}-${var.environment}-ssm-read-policy"
  }

  # Instance profiles: {workload}-{env}-{component}-profile
  instance_profiles = {
    eks_node = "${var.workload}-${var.environment}-eks-node-profile"
    ec2_app  = "${var.workload}-${var.environment}-ec2-app-profile"
  }
}
```

---

## Tagging Standards

### Required Tags and Provider Default Tags

```hcl
# providers.tf
# Use default_tags to apply required tags to every resource automatically

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.environment
      Owner       = var.owner
      CostCenter  = var.cost_center
      Project     = var.project
      ManagedBy   = "terraform"
      Application = var.workload
      Repository  = var.repository
    }
  }
}

# Validate required variables are non-empty
variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod", "sandbox"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod, sandbox."
  }
}

variable "owner" {
  description = "Team or individual responsible for the resource"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+@[a-z0-9-]+\\.[a-z]{2,}$", var.owner))
    error_message = "Owner must be a valid email address."
  }
}

variable "cost_center" {
  description = "Cost center code for billing allocation"
  type        = string

  validation {
    condition     = can(regex("^CC-[0-9]{4,6}$", var.cost_center))
    error_message = "CostCenter must follow the format CC-XXXX (e.g., CC-1234)."
  }
}

variable "project" {
  description = "Project or product name"
  type        = string
}

variable "repository" {
  description = "Source code repository URL"
  type        = string
  default     = ""
}
```

### Tag Enforcement via AWS Config

```hcl
# compliance/config-tag-rules.tf
# AWS Config rules that detect and alert on missing required tags

resource "aws_config_config_rule" "required_tags" {
  name        = "${var.workload}-required-tags"
  description = "Checks that required tags are present on all supported resources"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key   = "Environment"
    tag2Key   = "Owner"
    tag3Key   = "CostCenter"
    tag4Key   = "Project"
    tag5Key   = "ManagedBy"
    tag6Key   = "Application"
  })

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::EC2::Volume",
      "AWS::EC2::VPC",
      "AWS::EC2::Subnet",
      "AWS::RDS::DBInstance",
      "AWS::RDS::DBCluster",
      "AWS::S3::Bucket",
      "AWS::Lambda::Function",
      "AWS::EKS::Cluster",
      "AWS::ECS::Cluster",
      "AWS::ECS::Service",
      "AWS::ElastiCache::ReplicationGroup",
    ]
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = local.common_tags
}
```

### Tag Enforcement via SCP

```hcl
# management/scps-tags.tf
# Deny creation of resources that are missing required tags

resource "aws_organizations_policy" "require_tags_on_create" {
  name        = "RequireTagsOnCreate"
  description = "Denies creation of EC2, RDS, and S3 resources without required tags"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyEC2WithoutTags"
        Effect = "Deny"
        Action = [
          "ec2:RunInstances",
          "ec2:CreateVolume",
          "ec2:CreateVpc",
          "ec2:CreateSubnet",
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:RequestTag/Environment" = "true"
            "aws:RequestTag/Owner"       = "true"
            "aws:RequestTag/Project"     = "true"
          }
        }
      },
      {
        Sid    = "DenyS3WithoutTags"
        Effect = "Deny"
        Action = "s3:CreateBucket"
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:RequestTag/Environment" = "true"
            "aws:RequestTag/Owner"       = "true"
          }
        }
      },
      {
        Sid    = "DenyRDSWithoutTags"
        Effect = "Deny"
        Action = [
          "rds:CreateDBInstance",
          "rds:CreateDBCluster",
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:RequestTag/Environment" = "true"
            "aws:RequestTag/Owner"       = "true"
            "aws:RequestTag/CostCenter"  = "true"
          }
        }
      }
    ]
  })
}

resource "aws_organizations_policy_attachment" "require_tags_workloads" {
  policy_id = aws_organizations_policy.require_tags_on_create.id
  target_id = aws_organizations_organizational_unit.workloads.id
}
```

### AWS Tag Policies

```hcl
# management/tag-policies.tf
# Tag policies enforce tag value standardization across the organization

resource "aws_organizations_policy" "tag_policy_environment" {
  name        = "TagPolicyEnvironment"
  description = "Enforces allowed values for the Environment tag"
  type        = "TAG_POLICY"

  content = jsonencode({
    tags = {
      Environment = {
        tag_key = {
          "@@assign" = "Environment"
        }
        tag_value = {
          "@@assign" = ["dev", "staging", "prod", "sandbox"]
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "rds:db",
            "rds:cluster",
            "s3:bucket",
            "lambda:function",
            "eks:cluster",
          ]
        }
      }
    }
  })
}

resource "aws_organizations_policy" "tag_policy_managed_by" {
  name        = "TagPolicyManagedBy"
  description = "Enforces allowed values for the ManagedBy tag"
  type        = "TAG_POLICY"

  content = jsonencode({
    tags = {
      ManagedBy = {
        tag_key = {
          "@@assign" = "ManagedBy"
        }
        tag_value = {
          "@@assign" = ["terraform", "cdk", "cloudformation", "manual"]
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "s3:bucket",
            "rds:db",
          ]
        }
      }
    }
  })
}

resource "aws_organizations_policy_attachment" "tag_policy_environment" {
  policy_id = aws_organizations_policy.tag_policy_environment.id
  target_id = aws_organizations_organization.root.roots[0].id
}

resource "aws_organizations_policy_attachment" "tag_policy_managed_by" {
  policy_id = aws_organizations_policy.tag_policy_managed_by.id
  target_id = aws_organizations_organization.root.roots[0].id
}
```

### Common Tags Local

```hcl
# locals.tf
# Standard locals block consumed by every Terraform root module

locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
    Project     = var.project
    ManagedBy   = "terraform"
    Application = var.workload
    Repository  = var.repository
  }
}

# Usage — merge with resource-specific tags:
# tags = merge(local.common_tags, { Name = "my-resource" })
```

---

## Identity and Access Management

### IAM Roles with Least Privilege

```hcl
# iam/roles.tf
# Never attach policies directly to users — always use roles

data "aws_iam_policy_document" "assume_lambda" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.workload}-${var.environment}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json
  description        = "Execution role for ${var.workload} Lambda functions"

  tags = local.common_tags
}

# Scope permissions to the minimum required — no wildcards on actions
data "aws_iam_policy_document" "lambda_s3" {
  statement {
    sid    = "ReadInputBucket"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.input.arn,
      "${aws_s3_bucket.input.arn}/*",
    ]
  }

  statement {
    sid    = "WriteOutputBucket"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
    ]
    resources = ["${aws_s3_bucket.output.arn}/*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.workload}-${var.environment}-*"]
  }
}

resource "aws_iam_policy" "lambda_s3" {
  name        = "${var.workload}-${var.environment}-lambda-s3-policy"
  description = "S3 and CloudWatch access for ${var.workload} Lambda"
  policy      = data.aws_iam_policy_document.lambda_s3.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_s3.arn
}

# Attach AWS-managed policy for VPC networking only when needed
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  count      = var.lambda_in_vpc ? 1 : 0
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
```

### Permission Boundaries

```hcl
# iam/permission-boundary.tf
# Permission boundaries cap the maximum permissions any role in a workload account can have

data "aws_iam_policy_document" "workload_boundary" {
  # Allow only the services this workload uses
  statement {
    sid    = "AllowWorkloadServices"
    effect = "Allow"
    actions = [
      "s3:*",
      "dynamodb:*",
      "lambda:*",
      "logs:*",
      "cloudwatch:*",
      "xray:*",
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "sqs:*",
      "sns:Publish",
    ]
    resources = ["*"]
  }

  # Explicitly deny IAM privilege escalation
  statement {
    sid    = "DenyIAMEscalation"
    effect = "Deny"
    actions = [
      "iam:CreateUser",
      "iam:AttachUserPolicy",
      "iam:PutUserPolicy",
      "iam:CreateAccessKey",
      "iam:CreateLoginProfile",
      "iam:DeleteRolePermissionsBoundary",
    ]
    resources = ["*"]
  }

  # Deny modifying the boundary itself
  statement {
    sid    = "DenyBoundaryModification"
    effect = "Deny"
    actions = [
      "iam:PutRolePermissionsBoundary",
      "iam:DeleteRolePermissionsBoundary",
    ]
    resources = ["*"]
    condition {
      test     = "StringNotEquals"
      variable = "iam:PermissionsBoundary"
      values   = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/workload-permission-boundary"]
    }
  }
}

resource "aws_iam_policy" "workload_boundary" {
  name        = "workload-permission-boundary"
  description = "Permission boundary for all workload roles — caps maximum permissions"
  policy      = data.aws_iam_policy_document.workload_boundary.json

  tags = local.common_tags
}

# Apply boundary to every role created by Terraform
resource "aws_iam_role" "app" {
  name                 = "${var.workload}-${var.environment}-app-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_ecs_task.json
  permissions_boundary = aws_iam_policy.workload_boundary.arn

  tags = local.common_tags
}
```

### OIDC Federation for GitHub Actions

```hcl
# iam/github-oidc.tf
# Replace long-lived AWS credentials with short-lived OIDC tokens

data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]

  tags = local.common_tags
}

data "aws_iam_policy_document" "assume_github_actions" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    # Scope to a specific repo and environment — never use "*"
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:environment:${var.environment}"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${var.workload}-${var.environment}-github-oidc-role"
  assume_role_policy = data.aws_iam_policy_document.assume_github_actions.json
  max_session_duration = 3600

  tags = local.common_tags
}

data "aws_iam_policy_document" "github_actions_deploy" {
  statement {
    sid    = "EKSDeploy"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster",
      "eks:ListClusters",
    ]
    resources = [aws_eks_cluster.main.arn]
  }

  statement {
    sid    = "ECRPush"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [aws_ecr_repository.app.arn]
  }

  statement {
    sid    = "ECRAuth"
    effect = "Allow"
    actions = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name   = "deploy-policy"
  role   = aws_iam_role.github_actions_deploy.name
  policy = data.aws_iam_policy_document.github_actions_deploy.json
}
```

```yaml
# .github/workflows/deploy.yml
# Authenticate to AWS using OIDC — no secrets stored in GitHub

name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write  # Required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: prod

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/payments-prod-github-oidc-role
          aws-region: us-east-1

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $REGISTRY/payments:$IMAGE_TAG .
          docker push $REGISTRY/payments:$IMAGE_TAG
```

### IAM Roles for Service Accounts (IRSA)

```hcl
# iam/irsa.tf
# Pod-level IAM permissions for EKS — replaces kube2iam and node-level permissions

data "aws_iam_policy_document" "assume_irsa" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:${var.k8s_namespace}:${var.k8s_service_account}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_openid_connect_provider" "eks" {
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]

  tags = local.common_tags
}

resource "aws_iam_role" "app_pod" {
  name               = "${var.workload}-${var.environment}-eks-pod-role"
  assume_role_policy = data.aws_iam_policy_document.assume_irsa.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "app_pod" {
  statement {
    sid    = "SecretsAccess"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [
      "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:${var.workload}/${var.environment}/*",
    ]
  }

  statement {
    sid    = "KMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]
    resources = [aws_kms_key.app.arn]
  }
}

resource "aws_iam_role_policy" "app_pod" {
  name   = "app-pod-policy"
  role   = aws_iam_role.app_pod.name
  policy = data.aws_iam_policy_document.app_pod.json
}
```

```yaml
# kubernetes/service-account.yaml
# Annotate the ServiceAccount to link it to the IAM role

apiVersion: v1
kind: ServiceAccount
metadata:
  name: payments-app
  namespace: payments
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/payments-prod-eks-pod-role
    eks.amazonaws.com/token-expiration: "3600"
```

### AWS IAM Identity Center

```hcl
# iam/sso.tf
# Centralized human access via IAM Identity Center — no IAM users in member accounts

resource "aws_ssoadmin_permission_set" "platform_engineer" {
  name             = "PlatformEngineer"
  description      = "Read/write access to platform infrastructure"
  instance_arn     = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  session_duration = "PT8H"

  tags = local.common_tags
}

resource "aws_ssoadmin_managed_policy_attachment" "platform_engineer_readonly" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  managed_policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
  permission_set_arn = aws_ssoadmin_permission_set.platform_engineer.arn
}

data "aws_iam_policy_document" "platform_engineer_inline" {
  statement {
    sid    = "AllowEKSAccess"
    effect = "Allow"
    actions = [
      "eks:AccessKubernetesApi",
      "eks:DescribeCluster",
      "eks:ListClusters",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowSSMSessionManager"
    effect = "Allow"
    actions = [
      "ssm:StartSession",
      "ssm:TerminateSession",
      "ssm:ResumeSession",
      "ssm:DescribeSessions",
      "ssm:GetConnectionStatus",
    ]
    resources = ["*"]
  }
}

resource "aws_ssoadmin_permission_set_inline_policy" "platform_engineer" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  inline_policy      = data.aws_iam_policy_document.platform_engineer_inline.json
  permission_set_arn = aws_ssoadmin_permission_set.platform_engineer.arn
}

# Assign permission set to a group in the identity store
resource "aws_ssoadmin_account_assignment" "platform_engineers" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  permission_set_arn = aws_ssoadmin_permission_set.platform_engineer.arn
  principal_id       = var.platform_engineers_group_id
  principal_type     = "GROUP"
  target_id          = var.workload_account_id
  target_type        = "AWS_ACCOUNT"
}
```

---

## Security and Compliance

### AWS KMS Customer-Managed Keys

```hcl
# security/kms.tf
# Customer-managed keys with automatic rotation and least-privilege key policies

data "aws_iam_policy_document" "kms_app" {
  # Key administrators — full key management
  statement {
    sid    = "KeyAdministration"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.workload}-${var.environment}-terraform-role"]
    }
    actions = [
      "kms:Create*",
      "kms:Describe*",
      "kms:Enable*",
      "kms:List*",
      "kms:Put*",
      "kms:Update*",
      "kms:Revoke*",
      "kms:Disable*",
      "kms:Get*",
      "kms:Delete*",
      "kms:ScheduleKeyDeletion",
      "kms:CancelKeyDeletion",
    ]
    resources = ["*"]
  }

  # Application roles — encrypt/decrypt only
  statement {
    sid    = "KeyUsage"
    effect = "Allow"
    principals {
      type = "AWS"
      identifiers = [
        aws_iam_role.app_pod.arn,
        aws_iam_role.lambda.arn,
      ]
    }
    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:DescribeKey",
    ]
    resources = ["*"]
  }

  # Allow CloudWatch to use the key for log encryption
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["logs.${var.region}.amazonaws.com"]
    }
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
    ]
    resources = ["*"]
    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = ["arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"]
    }
  }
}

resource "aws_kms_key" "app" {
  description             = "CMK for ${var.workload} ${var.environment} workload"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  rotation_period_in_days = 365
  multi_region            = false
  policy                  = data.aws_iam_policy_document.kms_app.json

  tags = local.common_tags
}

resource "aws_kms_alias" "app" {
  name          = "alias/${var.workload}/${var.environment}"
  target_key_id = aws_kms_key.app.key_id
}
```

### AWS Secrets Manager

```hcl
# security/secrets.tf
# Never store credentials in Terraform state or environment variables

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.workload}/${var.environment}/db-credentials"
  description             = "RDS credentials for ${var.workload} ${var.environment}"
  kms_key_id              = aws_kms_key.app.arn
  recovery_window_in_days = 30

  tags = local.common_tags
}

# Initial value — rotate immediately after creation
resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_initial_password
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = var.db_name
  })

  lifecycle {
    ignore_changes = [secret_string]  # Managed by rotation after initial creation
  }
}

# Enable automatic rotation using the managed Lambda rotator
resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = data.aws_lambda_function.rds_rotator.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# Resource policy — restrict access to specific roles only
data "aws_iam_policy_document" "secret_resource_policy" {
  statement {
    sid    = "DenyAllExceptAppRoles"
    effect = "Deny"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["*"]
    condition {
      test     = "StringNotLike"
      variable = "aws:PrincipalArn"
      values = [
        aws_iam_role.app_pod.arn,
        aws_iam_role.lambda.arn,
      ]
    }
  }
}

resource "aws_secretsmanager_secret_policy" "db_credentials" {
  secret_arn = aws_secretsmanager_secret.db_credentials.arn
  policy     = data.aws_iam_policy_document.secret_resource_policy.json
}
```

### Amazon GuardDuty

```hcl
# security/guardduty.tf
# Enable GuardDuty organization-wide from the delegated administrator account

resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = local.common_tags
}

# Auto-enable for all new member accounts
resource "aws_guardduty_organization_configuration" "main" {
  auto_enable_organization_members = "ALL"
  detector_id                      = aws_guardduty_detector.main.id

  datasources {
    s3_logs {
      auto_enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          auto_enable = true
        }
      }
    }
  }
}

# SNS alert for HIGH and CRITICAL findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "${var.workload}-${var.environment}-guardduty-findings"
  description = "Route GuardDuty HIGH and CRITICAL findings to SNS"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [{ numeric = [">=", 7] }]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}
```

### AWS Security Hub

```hcl
# security/securityhub.tf
# Aggregated security posture across all accounts and regions

resource "aws_securityhub_account" "main" {}

# Enable CIS AWS Foundations Benchmark
resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.4.0"

  depends_on = [aws_securityhub_account.main]
}

# Enable AWS Foundational Security Best Practices
resource "aws_securityhub_standards_subscription" "fsbp" {
  standards_arn = "arn:aws:securityhub:${var.region}::standards/aws-foundational-security-best-practices/v/1.0.0"

  depends_on = [aws_securityhub_account.main]
}

# Enable NIST 800-53 (for compliance workloads)
resource "aws_securityhub_standards_subscription" "nist" {
  standards_arn = "arn:aws:securityhub:${var.region}::standards/nist-800-53/v/5.0.0"

  depends_on = [aws_securityhub_account.main]
}

# Organization-wide Security Hub management
resource "aws_securityhub_organization_configuration" "main" {
  auto_enable           = true
  auto_enable_standards = "NONE"  # Manage standards explicitly per account type
}

# Route CRITICAL findings to PagerDuty via EventBridge
resource "aws_cloudwatch_event_rule" "security_hub_critical" {
  name        = "${var.workload}-${var.environment}-securityhub-critical"
  description = "Route CRITICAL Security Hub findings to incident management"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["CRITICAL"]
        }
        RecordState = ["ACTIVE"]
        Workflow = {
          Status = ["NEW"]
        }
      }
    }
  })

  tags = local.common_tags
}
```

### AWS Config

```hcl
# security/config.tf
# Continuous compliance monitoring and drift detection

resource "aws_config_configuration_recorder" "main" {
  name     = "${var.workload}-${var.environment}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  recording_mode {
    recording_frequency = "CONTINUOUS"

    recording_mode_override {
      description         = "Daily recording for high-volume resources"
      resource_types      = ["AWS::CloudTrail::Trail", "AWS::Config::ResourceCompliance"]
      recording_frequency = "DAILY"
    }
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.workload}-${var.environment}-delivery"
  s3_bucket_name = aws_s3_bucket.config_logs.bucket
  sns_topic_arn  = aws_sns_topic.config_changes.arn

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Managed Config rules for security baseline
resource "aws_config_config_rule" "s3_public_access_blocked" {
  name        = "s3-account-level-public-access-blocks"
  description = "Checks S3 account-level public access block settings"

  source {
    owner             = "AWS"
    source_identifier = "S3_ACCOUNT_LEVEL_PUBLIC_ACCESS_BLOCKS_PERIODIC"
  }

  depends_on = [aws_config_configuration_recorder.main]
  tags       = local.common_tags
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name        = "encrypted-volumes"
  description = "Checks that EBS volumes are encrypted"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
  tags       = local.common_tags
}

resource "aws_config_config_rule" "mfa_enabled_root" {
  name        = "root-account-mfa-enabled"
  description = "Checks that MFA is enabled on the root account"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  maximum_execution_frequency = "TwentyFour_Hours"

  depends_on = [aws_config_configuration_recorder.main]
  tags       = local.common_tags
}

resource "aws_config_config_rule" "iam_password_policy" {
  name        = "iam-password-policy"
  description = "Checks that the IAM password policy meets requirements"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  input_parameters = jsonencode({
    RequireUppercaseCharacters = "true"
    RequireLowercaseCharacters = "true"
    RequireSymbols             = "true"
    RequireNumbers             = "true"
    MinimumPasswordLength      = "16"
    PasswordReusePrevention    = "24"
    MaxPasswordAge             = "90"
  })

  depends_on = [aws_config_configuration_recorder.main]
  tags       = local.common_tags
}

# Conformance pack for CIS Level 1
resource "aws_config_conformance_pack" "cis_level1" {
  name = "${var.workload}-${var.environment}-cis-level1"

  template_body = <<-YAML
    Parameters: {}
    Resources:
      ConfigRuleForRootMFA:
        Type: AWS::Config::ConfigRule
        Properties:
          ConfigRuleName: root-mfa-enabled
          Source:
            Owner: AWS
            SourceIdentifier: ROOT_ACCOUNT_MFA_ENABLED
      ConfigRuleForEncryptedVolumes:
        Type: AWS::Config::ConfigRule
        Properties:
          ConfigRuleName: encrypted-ebs-volumes
          Source:
            Owner: AWS
            SourceIdentifier: ENCRYPTED_VOLUMES
  YAML

  depends_on = [aws_config_configuration_recorder.main]
}
```

### AWS CloudTrail

```hcl
# security/cloudtrail.tf
# Organization trail — single trail covering all accounts and regions

resource "aws_cloudtrail" "organization" {
  name                          = "${var.org}-organization-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  is_organization_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_cw.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::${aws_s3_bucket.sensitive_data.bucket}/"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }

  tags = local.common_tags
}

# CloudTrail log bucket with strict security controls
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.org}-cloudtrail-logs-${data.aws_caller_identity.current.account_id}-${var.region}"

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket                  = aws_s3_bucket.cloudtrail_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "archive-and-expire"
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
      days = 2555  # 7 years for compliance
    }
  }
}

# Alert on root account usage via CloudTrail + CloudWatch
resource "aws_cloudwatch_log_metric_filter" "root_login" {
  name           = "root-account-login"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name          = "RootAccountLoginCount"
    namespace     = "CloudTrailMetrics"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_login" {
  alarm_name          = "${var.workload}-${var.environment}-root-login"
  alarm_description   = "Alert on any root account login"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "RootAccountLoginCount"
  namespace           = "CloudTrailMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

---

## Networking

Networking follows a hub-and-spoke model: a shared network account hosts Transit Gateway and
centralized egress; spoke VPCs in workload accounts attach via TGW and route all egress through
the hub. Each workload VPC is divided into three subnet tiers (public, private, intra) across
three Availability Zones.

### VPC Design

```hcl
# locals.tf — shared networking locals used throughout the VPC module
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 3)

  # /16 base divided into /18 blocks per tier, then /20 per AZ
  vpc_cidr = var.vpc_cidr # e.g. "10.20.0.0/16"

  public_subnets  = [for i, az in local.azs : cidrsubnet(local.vpc_cidr, 4, i)]
  private_subnets = [for i, az in local.azs : cidrsubnet(local.vpc_cidr, 4, i + 4)]
  intra_subnets   = [for i, az in local.azs : cidrsubnet(local.vpc_cidr, 4, i + 8)]
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "this" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-vpc"
  })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-igw"
  })
}
```

### Subnet Layout

```hcl
# Public subnets — one per AZ, map_public_ip_on_launch for load balancers only
resource "aws_subnet" "public" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.this.id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false # ALBs use ENIs; only enable if required

  tags = merge(local.common_tags, {
    Name                     = "${var.workload}-${var.environment}-public-${local.azs[count.index]}"
    "kubernetes.io/role/elb" = "1" # required if EKS public ALBs used
  })
}

# Private subnets — for compute (EKS nodes, ECS tasks, Lambda VPC)
resource "aws_subnet" "private" {
  count = length(local.azs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = local.private_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name                              = "${var.workload}-${var.environment}-private-${local.azs[count.index]}"
    "kubernetes.io/role/internal-elb" = "1" # required for EKS internal ALBs
  })
}

# Intra subnets — isolated (no NAT route), for RDS, ElastiCache, VPC endpoints
resource "aws_subnet" "intra" {
  count = length(local.azs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = local.intra_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-intra-${local.azs[count.index]}"
  })
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-private-rt-${local.azs[count.index]}"
  })
}

resource "aws_route_table_association" "private" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table" "intra" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-intra-rt"
  })
}

resource "aws_route_table_association" "intra" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.intra[count.index].id
  route_table_id = aws_route_table.intra.id
}
```

### NAT Gateway

One NAT Gateway per AZ for high availability. Single-AZ NAT is acceptable for
non-production environments to reduce cost.

```hcl
resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-nat-eip-${local.azs[count.index]}"
  })
}

resource "aws_nat_gateway" "this" {
  count = length(local.azs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-nat-${local.azs[count.index]}"
  })

  depends_on = [aws_internet_gateway.this]
}

# Default route for private subnets — route through AZ-local NAT GW
resource "aws_route" "private_nat" {
  count = length(local.azs)

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[count.index].id
}
```

### Security Groups

```hcl
# ALB security group — accepts HTTPS from internet, allows health checks
resource "aws_security_group" "alb" {
  name        = "${var.workload}-${var.environment}-alb-sg"
  description = "External ALB — HTTPS inbound only"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-alb-sg"
  })
}

# Application security group — accepts traffic from ALB only
resource "aws_security_group" "app" {
  name        = "${var.workload}-${var.environment}-app-sg"
  description = "Application tier — traffic from ALB only"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-app-sg"
  })
}

# Database security group — accepts traffic from app tier only
resource "aws_security_group" "db" {
  name        = "${var.workload}-${var.environment}-db-sg"
  description = "Database tier — app tier only"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "PostgreSQL from app"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-db-sg"
  })
}

# VPC endpoint security group — accepts HTTPS from within VPC
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.workload}-${var.environment}-vpce-sg"
  description = "VPC interface endpoints — HTTPS from VPC CIDR"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.this.cidr_block]
  }

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-vpce-sg"
  })
}
```

### VPC Endpoints

Use VPC endpoints to keep AWS API traffic off the internet. Gateway endpoints
(S3, DynamoDB) are free; interface endpoints (ECR, Secrets Manager, SSM) incur
hourly charges per AZ.

```hcl
# Gateway endpoints — no cost, no security group required
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    aws_route_table.private[*].id,
    [aws_route_table.intra.id]
  )

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    aws_route_table.private[*].id,
    [aws_route_table.intra.id]
  )

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-dynamodb-endpoint"
  })
}

# Interface endpoints — required for private EKS nodes pulling images
resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.intra[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-ecr-api-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.intra[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-ecr-dkr-endpoint"
  })
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.intra[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-secretsmanager-endpoint"
  })
}

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.intra[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-ssm-endpoint"
  })
}
```

### Transit Gateway

Transit Gateway provides org-wide hub-and-spoke routing. The TGW lives in the
shared network account and is shared to workload accounts via AWS RAM.

```hcl
# network account — create the TGW
resource "aws_ec2_transit_gateway" "this" {
  description                     = "Organization Transit Gateway"
  amazon_side_asn                 = 64512
  auto_accept_shared_attachments  = "disable"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(local.common_tags, {
    Name = "org-tgw"
  })
}

# Share TGW to the entire organization via RAM
resource "aws_ram_resource_share" "tgw" {
  name                      = "org-tgw-share"
  allow_external_principals = false

  tags = local.common_tags
}

resource "aws_ram_resource_association" "tgw" {
  resource_arn       = aws_ec2_transit_gateway.this.arn
  resource_share_arn = aws_ram_resource_share.tgw.arn
}

resource "aws_ram_principal_association" "org" {
  principal          = data.aws_organizations_organization.this.arn
  resource_share_arn = aws_ram_resource_share.tgw.arn
}

# Separate route tables for prod and non-prod isolation
resource "aws_ec2_transit_gateway_route_table" "prod" {
  transit_gateway_id = aws_ec2_transit_gateway.this.id

  tags = merge(local.common_tags, {
    Name = "tgw-rt-prod"
  })
}

resource "aws_ec2_transit_gateway_route_table" "nonprod" {
  transit_gateway_id = aws_ec2_transit_gateway.this.id

  tags = merge(local.common_tags, {
    Name = "tgw-rt-nonprod"
  })
}

# workload account — attach the spoke VPC to TGW
resource "aws_ec2_transit_gateway_vpc_attachment" "this" {
  transit_gateway_id = var.transit_gateway_id # passed from network account output
  vpc_id             = aws_vpc.this.id
  subnet_ids         = aws_subnet.private[*].id

  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-tgw-attachment"
  })
}

# Add TGW route to private route tables for RFC 1918 ranges
resource "aws_route" "private_tgw" {
  count = length(local.azs)

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = var.transit_gateway_id
}
```

### Network ACLs

Security groups are stateful and the primary control plane. NACLs provide a
stateless secondary layer — use them for intra subnets to explicitly deny
unexpected traffic.

```hcl
resource "aws_network_acl" "intra" {
  vpc_id     = aws_vpc.this.id
  subnet_ids = aws_subnet.intra[*].id

  # Allow return traffic from ephemeral ports
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = aws_vpc.this.cidr_block
    from_port  = 0
    to_port    = 65535
  }

  # Allow all outbound within VPC
  egress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = aws_vpc.this.cidr_block
    from_port  = 0
    to_port    = 65535
  }

  # Explicit deny-all fallthrough (NACLs end with implicit deny)
  ingress {
    rule_no    = 32766
    protocol   = "-1"
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  egress {
    rule_no    = 32766
    protocol   = "-1"
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-intra-nacl"
  })
}
```

### VPC Flow Logs

Enable flow logs for all VPCs. Store in CloudWatch for short-term analysis and
optionally replicate to S3 in the log-archive account for long-term retention.

```hcl
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs/${var.workload}-${var.environment}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_iam_role" "flow_logs" {
  name = "${var.workload}-${var.environment}-vpc-flow-logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "vpc-flow-logs-cw"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "${aws_cloudwatch_log_group.flow_logs.arn}:*"
    }]
  })
}

resource "aws_flow_log" "this" {
  vpc_id          = aws_vpc.this.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn

  tags = merge(local.common_tags, {
    Name = "${var.workload}-${var.environment}-vpc-flow-logs"
  })
}

---

## Compute Services

### Amazon EKS

Use managed node groups for most workloads. Fargate profiles are appropriate for
batch or bursty workloads where node management overhead is undesirable. Always
use IRSA (IAM Roles for Service Accounts) — never run node-level instance profiles
with broad permissions.

```hcl
resource "aws_eks_cluster" "this" {
  name     = "${var.workload}-${var.environment}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.kubernetes_version # e.g. "1.32"

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.intra[*].id)
    endpoint_private_access = true
    endpoint_public_access  = false # restrict to VPN/bastion only
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  encryption_config {
    provider {
      key_arn = aws_kms_key.main.arn
    }
    resources = ["secrets"]
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_cloudwatch_log_group.eks_cluster,
  ]
}

resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.workload}-${var.environment}/cluster"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.workload}-${var.environment}-ng"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id

  instance_types = var.node_instance_types # ["m7i.xlarge"]
  capacity_type  = "ON_DEMAND"             # or "SPOT" for non-prod

  scaling_config {
    desired_size = var.node_desired_count
    min_size     = var.node_min_count
    max_size     = var.node_max_count
  }

  update_config {
    max_unavailable_percentage = 33
  }

  launch_template {
    id      = aws_launch_template.eks_node.id
    version = aws_launch_template.eks_node.latest_version
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_policy,
  ]
}

# Launch template for node customization (IMDSv2 required)
resource "aws_launch_template" "eks_node" {
  name_prefix = "${var.workload}-${var.environment}-eks-node-"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "${var.workload}-${var.environment}-eks-node" })
  }

  tag_specifications {
    resource_type = "volume"
    tags          = local.common_tags
  }

  tags = local.common_tags
}

# EKS cluster add-ons (managed by AWS, kept current)
resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "coredns"
  resolve_conflicts_on_update = "OVERWRITE"
  tags                        = local.common_tags
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "kube-proxy"
  resolve_conflicts_on_update = "OVERWRITE"
  tags                        = local.common_tags
}

resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "vpc-cni"
  resolve_conflicts_on_update = "OVERWRITE"

  configuration_values = jsonencode({
    env = {
      ENABLE_PREFIX_DELEGATION = "true" # more IPs per node
      WARM_PREFIX_TARGET       = "1"
    }
  })

  tags = local.common_tags
}

resource "aws_eks_addon" "ebs_csi" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "aws-ebs-csi-driver"
  service_account_role_arn    = aws_iam_role.ebs_csi.arn # IRSA
  resolve_conflicts_on_update = "OVERWRITE"
  tags                        = local.common_tags
}

# IRSA — link a Kubernetes service account to an IAM role
resource "aws_iam_role" "ebs_csi" {
  name = "${var.workload}-${var.environment}-ebs-csi"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.eks.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  role       = aws_iam_role.ebs_csi.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

# OIDC provider for IRSA
data "tls_certificate" "eks" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer

  tags = local.common_tags
}
```

### ECS and Fargate

Use `awsvpc` networking mode for all tasks — each task gets its own ENI and
security group. Never inject secrets as plain environment variables; use Secrets
Manager or Parameter Store references in the task definition.

```hcl
resource "aws_ecs_cluster" "this" {
  name = "${var.workload}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.workload}-${var.environment}-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu    # e.g. 1024
  memory                   = var.task_memory # e.g. 2048
  task_role_arn            = aws_iam_role.ecs_task.arn       # app permissions
  execution_role_arn       = aws_iam_role.ecs_execution.arn  # pull image + logs

  container_definitions = jsonencode([{
    name      = "app"
    image     = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"
    essential = true

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    # Inject secrets from Secrets Manager — never use plaintext environment variables
    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = "${aws_secretsmanager_secret.db_url.arn}"
      },
      {
        name      = "API_KEY"
        valueFrom = "${aws_secretsmanager_secret.api_key.arn}:api_key::"
      }
    ]

    environment = [
      { name = "ENVIRONMENT", value = var.environment },
      { name = "AWS_DEFAULT_REGION", value = var.aws_region }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_app.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "app"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = local.common_tags
}

resource "aws_ecs_service" "app" {
  name                               = "${var.workload}-${var.environment}-app"
  cluster                            = aws_ecs_cluster.this.id
  task_definition                    = aws_ecs_task_definition.app.arn
  desired_count                      = var.desired_count
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  health_check_grace_period_seconds  = 60
  propagate_tags                     = "TASK_DEFINITION"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 8080
  }

  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "ecs_app" {
  name              = "/ecs/${var.workload}-${var.environment}/app"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}
```

### AWS Lambda

Set reserved concurrency to prevent runaway costs. Attach to a VPC only when
the function needs access to private resources — cold starts increase with VPC
attachment. Use destinations for async invocations instead of try/catch logging.

```hcl
resource "aws_lambda_function" "processor" {
  function_name = "${var.workload}-${var.environment}-processor"
  role          = aws_iam_role.lambda_processor.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.processor.repository_url}:${var.image_tag}"

  memory_size                    = 512  # MB
  timeout                        = 30   # seconds
  reserved_concurrent_executions = 100  # prevent runaway scaling

  environment {
    variables = {
      ENVIRONMENT    = var.environment
      SECRET_ARN     = aws_secretsmanager_secret.processor.arn
      # Never put secret values here — reference ARNs only
    }
  }

  # VPC attachment for private resource access
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  # Dead letter queue for failed async invocations
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  # Async destinations
  dynamic "destination_config" {
    for_each = var.enable_destinations ? [1] : []
    content {
      on_failure {
        destination = aws_sqs_queue.lambda_dlq.arn
      }
      on_success {
        destination = aws_sns_topic.lambda_success.arn
      }
    }
  }

  tracing_config {
    mode = "Active" # X-Ray tracing
  }

  tags = local.common_tags

  depends_on = [aws_cloudwatch_log_group.lambda_processor]
}

resource "aws_cloudwatch_log_group" "lambda_processor" {
  name              = "/aws/lambda/${var.workload}-${var.environment}-processor"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_sqs_queue" "lambda_dlq" {
  name                      = "${var.workload}-${var.environment}-processor-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.arn

  tags = local.common_tags
}
```

### Amazon EC2

Require IMDSv2 on all instances — block IMDSv1 at the account level with a SCP
and enforce it in launch templates. Use Systems Manager Session Manager for
shell access; never open port 22.

```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "${var.workload}-${var.environment}-app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.app.arn
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
    delete_on_termination       = true
  }

  # IMDSv2 required — hop limit of 1 prevents container escape
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true # detailed monitoring
  }

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "${var.workload}-${var.environment}-app" })
  }

  tags = local.common_tags
}

resource "aws_autoscaling_group" "app" {
  name                = "${var.workload}-${var.environment}-app-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 90
    }
  }

  dynamic "tag" {
    for_each = merge(local.common_tags, { Name = "${var.workload}-${var.environment}-app" })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}
```

---

## Data Services

### Amazon RDS and Aurora

Always enable Multi-AZ, automated backups, and encryption at rest. Manage
credentials exclusively through Secrets Manager with automatic rotation —
never hardcode passwords in Terraform or environment variables.

```hcl
# Subnet group — use intra subnets (no route to internet or NAT)
resource "aws_db_subnet_group" "this" {
  name       = "${var.workload}-${var.environment}-db"
  subnet_ids = aws_subnet.intra[*].id

  tags = local.common_tags
}

# Parameter group — tune per engine version
resource "aws_db_parameter_group" "postgres" {
  name   = "${var.workload}-${var.environment}-pg16"
  family = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # log queries > 1 s
  }

  tags = local.common_tags
}

resource "aws_db_instance" "this" {
  identifier = "${var.workload}-${var.environment}-db"

  engine               = "postgres"
  engine_version       = "16.4"
  instance_class       = var.db_instance_class # e.g. "db.t4g.medium"
  allocated_storage    = var.db_storage_gb
  max_allocated_storage = var.db_storage_gb * 2 # autoscaling ceiling

  db_name  = var.db_name
  username = var.db_username
  # Never set password here — use manage_master_user_password
  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.main.arn

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az               = var.environment == "prod" ? true : false
  publicly_accessible    = false
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.main.arn
  storage_type           = "gp3"

  backup_retention_period = 14
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  performance_insights_enabled          = true
  performance_insights_kms_key_id       = aws_kms_key.main.arn
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  deletion_protection = var.environment == "prod" ? true : false
  skip_final_snapshot = var.environment == "prod" ? false : true
  final_snapshot_identifier = var.environment == "prod" ? "${var.workload}-${var.environment}-final" : null

  tags = local.common_tags
}

# Aurora cluster (preferred for new workloads — better scaling, faster failover)
resource "aws_rds_cluster" "this" {
  cluster_identifier = "${var.workload}-${var.environment}-aurora"

  engine         = "aurora-postgresql"
  engine_version = "16.4"
  engine_mode    = "provisioned"

  database_name   = var.db_name
  master_username = var.db_username
  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.main.arn

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]

  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  backup_retention_period = 14
  preferred_backup_window = "03:00-04:00"

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 16
  }

  enabled_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection             = var.environment == "prod" ? true : false
  skip_final_snapshot             = var.environment == "prod" ? false : true

  tags = local.common_tags
}

resource "aws_rds_cluster_instance" "this" {
  count = var.environment == "prod" ? 2 : 1 # writer + 1 reader in prod

  identifier         = "${var.workload}-${var.environment}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.this.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.this.engine
  engine_version     = aws_rds_cluster.this.engine_version

  performance_insights_enabled          = true
  performance_insights_kms_key_id       = aws_kms_key.main.arn
  performance_insights_retention_period = 7

  tags = local.common_tags
}
```

### Amazon S3

Block all public access at the account level (AWS Organizations SCP) and
bucket level. Enable versioning for any bucket holding state or artifacts.
Use SSE-KMS for sensitive data; SSE-S3 for non-sensitive bulk storage.

```hcl
# Block public access — apply to every bucket
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "this" {
  bucket = "${var.workload}-${var.environment}-${var.bucket_purpose}-${data.aws_caller_identity.current.account_id}"

  # Force destroy only for ephemeral/test buckets
  force_destroy = var.environment != "prod"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true # reduce KMS API costs
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# Enforce TLS-only access
resource "aws_s3_bucket_policy" "enforce_tls" {
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyHTTP"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource = [
        aws_s3_bucket.this.arn,
        "${aws_s3_bucket.this.arn}/*"
      ]
      Condition = {
        Bool = { "aws:SecureTransport" = "false" }
      }
    }]
  })
}

# Object Lock for compliance/WORM workloads
resource "aws_s3_bucket_object_lock_configuration" "compliance" {
  count  = var.enable_object_lock ? 1 : 0
  bucket = aws_s3_bucket.this.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.object_lock_retention_days
    }
  }
}
```

### ElastiCache (Redis)

Use replication groups (not single-node clusters) for all non-development
environments. Enable encryption in transit and at rest. Require an auth token
for Redis AUTH command support.

```hcl
resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.workload}-${var.environment}-redis"
  subnet_ids = aws_subnet.intra[*].id

  tags = local.common_tags
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${var.workload}-${var.environment}-redis7"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "${var.workload}-${var.environment}-redis"
  description          = "${var.workload} ${var.environment} Redis cluster"

  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.redis_node_type # e.g. "cache.t4g.small"
  num_cache_clusters   = var.environment == "prod" ? 3 : 1 # 1 primary + N replicas
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [aws_security_group.redis.id]

  port                   = 6379
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  transit_encryption_mode     = "required"
  kms_key_id             = aws_kms_key.main.arn

  # Auth token stored in Secrets Manager — retrieved at runtime
  auth_token                    = random_password.redis_auth.result
  auth_token_update_strategy    = "ROTATE"

  automatic_failover_enabled = var.environment == "prod" ? true : false
  multi_az_enabled           = var.environment == "prod" ? true : false

  snapshot_retention_limit = 7
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "sun:04:00-sun:05:00"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }

  tags = local.common_tags
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false # Redis auth token cannot contain special characters
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name       = "/${var.workload}/${var.environment}/redis/auth-token"
  kms_key_id = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth.result
}

resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/${var.workload}-${var.environment}/slow-log"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "redis_engine" {
  name              = "/aws/elasticache/${var.workload}-${var.environment}/engine-log"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}
```

### Amazon ECR

Enable image scanning on push for every repository. Use immutable tags to
prevent tag overwriting in production. Define lifecycle policies to cap
untagged image accumulation and keep only the last N tagged releases.

```hcl
resource "aws_ecr_repository" "app" {
  name                 = "${var.workload}/${var.environment}/app"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.main.arn
  }

  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep last 30 tagged releases"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = { type = "expire" }
      }
    ]
  })
}

# Cross-account pull — allow workload accounts to pull from shared ECR
resource "aws_ecr_repository_policy" "cross_account" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "CrossAccountPull"
      Effect = "Allow"
      Principal = {
        AWS = [for account_id in var.consumer_account_ids :
          "arn:aws:iam::${account_id}:root"
        ]
      }
      Action = [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ]
    }]
  })
}

---

## Monitoring and Observability

### CloudWatch Alarms and Dashboards

Alarm on actionable signals only. Use composite alarms to reduce alert noise —
a composite alarm fires only when multiple component alarms are in ALARM state
simultaneously, preventing pager fatigue from correlated events.

```hcl
# Metric alarm — CPU utilization on ECS service
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.workload}-${var.environment}-ecs-cpu-high"
  alarm_description   = "ECS service CPU utilization > 80% for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  datapoints_to_alarm = 2 # 2 of 3 periods must breach
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.this.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.workload}-${var.environment}-ecs-memory-high"
  alarm_description   = "ECS service memory utilization > 80%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.this.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# Composite alarm — only page when both CPU and memory are high
resource "aws_cloudwatch_composite_alarm" "ecs_resource_pressure" {
  alarm_name        = "${var.workload}-${var.environment}-ecs-resource-pressure"
  alarm_description = "Both CPU and memory are high — likely need to scale"
  alarm_rule        = "ALARM(${aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name})"
  alarm_actions     = [aws_sns_topic.pagerduty.arn]

  tags = local.common_tags
}

# SNS topic with KMS encryption for alarm notifications
resource "aws_sns_topic" "alerts" {
  name              = "${var.workload}-${var.environment}-alerts"
  kms_master_key_id = aws_kms_key.main.arn

  tags = local.common_tags
}

# CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.workload}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ECS CPU and Memory"
          period = 60
          stat   = "Average"
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.this.name, "ServiceName", aws_ecs_service.app.name],
            ["AWS/ECS", "MemoryUtilization", "ClusterName", aws_ecs_cluster.this.name, "ServiceName", aws_ecs_service.app.name]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ALB Request Count and Latency"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.this.arn_suffix, { stat = "Sum" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.this.arn_suffix, { stat = "p99", yAxis = "right" }]
          ]
        }
      }
    ]
  })
}
```

### CloudWatch Logs Metric Filters

```hcl
# Extract HTTP 5xx errors from application logs
resource "aws_cloudwatch_log_metric_filter" "app_errors" {
  name           = "${var.workload}-${var.environment}-5xx-errors"
  log_group_name = aws_cloudwatch_log_group.ecs_app.name
  pattern        = "[timestamp, requestId, level=\"ERROR\", ...]"

  metric_transformation {
    name          = "App5xxErrors"
    namespace     = "${var.workload}/${var.environment}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

resource "aws_cloudwatch_metric_alarm" "app_error_rate" {
  alarm_name          = "${var.workload}-${var.environment}-app-error-rate"
  alarm_description   = "Application error rate elevated"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "App5xxErrors"
  namespace           = "${var.workload}/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}
```

### AWS X-Ray

```hcl
# X-Ray group for service-level filtering
resource "aws_xray_group" "app" {
  group_name        = "${var.workload}-${var.environment}"
  filter_expression = "service(\"${var.workload}-app\") AND responsetime > 1"

  insights_configuration {
    insights_enabled      = true
    notifications_enabled = true
  }

  tags = local.common_tags
}

# Sampling rule — capture 5% of requests plus reservoir minimum
resource "aws_xray_sampling_rule" "app" {
  rule_name      = "${var.workload}-${var.environment}-default"
  priority       = 9000
  reservoir_size = 5    # minimum TPS always sampled
  fixed_rate     = 0.05 # 5% of remaining traffic
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "${var.workload}-app"
  resource_arn   = "*"
  version        = 1

  tags = local.common_tags
}
```

---

## CI/CD Integration

### GitHub Actions with OIDC

Never store long-lived AWS credentials in GitHub secrets. Use OIDC federation to
allow GitHub Actions workflows to assume an IAM role directly. The role trust
policy restricts assumption to a specific repository and optionally a specific
branch for apply operations.

```hcl
# Create the OIDC provider for GitHub Actions (once per account)
resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = local.common_tags
}

# IAM role for Terraform plan — any branch in the repo can plan
resource "aws_iam_role" "github_terraform_plan" {
  name = "${var.workload}-${var.environment}-github-tf-plan"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github_actions.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
        }
      }
    }]
  })

  tags = local.common_tags
}

# IAM role for Terraform apply — main branch only
resource "aws_iam_role" "github_terraform_apply" {
  name = "${var.workload}-${var.environment}-github-tf-apply"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github_actions.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })

  tags = local.common_tags
}
```

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  id-token: write   # required for OIDC token
  contents: read
  pull-requests: write

env:
  TF_VERSION: "1.12.0"
  AWS_REGION: us-east-1

jobs:
  plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.TF_PLAN_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        run: terraform init -backend-config="environments/${{ vars.ENVIRONMENT }}.hcl"

      - name: Terraform Plan
        id: plan
        run: |
          terraform plan \
            -var-file="environments/${{ vars.ENVIRONMENT }}.tfvars" \
            -out=tfplan \
            -no-color 2>&1 | tee plan_output.txt

      - name: Post Plan to PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('plan_output.txt', 'utf8');
            const truncated = plan.length > 60000 ? plan.slice(-60000) : plan;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Terraform Plan\n\`\`\`\n${truncated}\n\`\`\``
            });

  apply:
    name: Terraform Apply
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production   # requires manual approval in GitHub Environments
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.TF_APPLY_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        run: terraform init -backend-config="environments/${{ vars.ENVIRONMENT }}.hcl"

      - name: Terraform Apply
        run: |
          terraform apply \
            -var-file="environments/${{ vars.ENVIRONMENT }}.tfvars" \
            -auto-approve
```

---

## Terraform State Management

Store Terraform state in S3 with DynamoDB locking. Use a dedicated bootstrap
module (or the management account) to create state infrastructure outside the
modules it will manage — never store state in the same account it provisions
critical production resources for.

```hcl
# State bucket — bootstrapped once per account/region
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.org_prefix}-terraform-state-${data.aws_caller_identity.current.account_id}-${var.aws_region}"

  tags = merge(local.common_tags, { Purpose = "terraform-state" })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform_state.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyHTTP"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = ["${aws_s3_bucket.terraform_state.arn}", "${aws_s3_bucket.terraform_state.arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
      {
        Sid       = "DenyDeleteWithoutMFA"
        Effect    = "Deny"
        Principal = "*"
        Action    = ["s3:DeleteObject", "s3:DeleteObjectVersion"]
        Resource  = "${aws_s3_bucket.terraform_state.arn}/*"
        Condition = { BoolIfExists = { "aws:MultiFactorAuthPresent" = "false" } }
      }
    ]
  })
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "${var.org_prefix}-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery { enabled = true }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.terraform_state.arn
  }

  tags = local.common_tags
}
```

```hcl
# backend.tf — per-environment backend configuration
terraform {
  backend "s3" {
    bucket         = "acme-terraform-state-123456789012-us-east-1"
    key            = "workloads/myapp/prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/mrk-abc123"
    dynamodb_table = "acme-terraform-locks"
  }
}

# Cross-stack reference — read outputs from another state file
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "acme-terraform-state-123456789012-us-east-1"
    key    = "shared/network/prod/terraform.tfstate"
    region = "us-east-1"
  }
}

locals {
  vpc_id          = data.terraform_remote_state.network.outputs.vpc_id
  private_subnets = data.terraform_remote_state.network.outputs.private_subnet_ids
}
```

---

## Cost Optimization

### AWS Budgets

Set budgets at the account level and per-workload tag. Alert at 80% forecasted
and 100% actual spend.

```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "${var.workload}-${var.environment}-monthly"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Workload$${var.workload}"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
  }
}

# Anomaly detector — catch unexpected spending spikes
resource "aws_ce_anomaly_monitor" "workload" {
  name              = "${var.workload}-${var.environment}-anomaly"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "workload" {
  name      = "${var.workload}-${var.environment}-anomaly-alert"
  frequency = "IMMEDIATE"

  monitor_arn_list = [aws_ce_anomaly_monitor.workload.arn]

  subscriber {
    address = aws_sns_topic.alerts.arn
    type    = "SNS"
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = ["100"]
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }
}
```

### Spot Instances for Scale-Out

```hcl
# Mixed instance policy — on-demand base with Spot for scale-out
resource "aws_autoscaling_group" "spot_mixed" {
  name                = "${var.workload}-${var.environment}-mixed-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  min_size            = 2
  max_size            = 20
  desired_capacity    = 4

  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }

      override { instance_type = "m7i.xlarge" }
      override { instance_type = "m6i.xlarge" }
      override { instance_type = "m5.xlarge" }
    }

    instances_distribution {
      on_demand_base_capacity                  = 2
      on_demand_percentage_above_base_capacity = 0   # all scale-out uses Spot
      spot_allocation_strategy                 = "price-capacity-optimized"
    }
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}
```

---

## Terragrunt Patterns

Terragrunt manages multi-account, multi-environment deployments without
duplicating backend and provider configuration across every module directory.

### Root Configuration

```hcl
# terragrunt.hcl — repository root
locals {
  org_vars     = read_terragrunt_config(find_in_parent_folders("org.hcl"))
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  region_vars  = read_terragrunt_config(find_in_parent_folders("region.hcl"))

  org_prefix  = local.org_vars.locals.org_prefix
  account_id  = local.account_vars.locals.account_id
  aws_region  = local.region_vars.locals.aws_region
  environment = local.account_vars.locals.environment
}

remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket         = "${local.org_prefix}-terraform-state-${local.account_id}-${local.aws_region}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.aws_region
    encrypt        = true
    dynamodb_table = "${local.org_prefix}-terraform-locks"
    kms_key_id     = "alias/${local.org_prefix}-terraform-state"
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<-EOF
    provider "aws" {
      region = "${local.aws_region}"
      default_tags {
        tags = {
          ManagedBy   = "terraform"
          Environment = "${local.environment}"
          OrgPrefix   = "${local.org_prefix}"
        }
      }
      assume_role {
        role_arn     = "arn:aws:iam::${local.account_id}:role/TerraformExecutionRole"
        session_name = "terragrunt-${local.environment}"
      }
    }
  EOF
}
```

### Account and Environment Configuration

```hcl
# live/prod/account.hcl
locals {
  account_id  = "123456789012"
  environment = "prod"
}

# live/prod/us-east-1/region.hcl
locals {
  aws_region = "us-east-1"
}

# org.hcl — repository root
locals {
  org_prefix = "acme"
}
```

### Module Configuration with Dependencies

```hcl
# live/prod/us-east-1/workloads/myapp/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "git::https://github.com/acme/terraform-modules.git//modules/ecs-service?ref=v2.3.0"
}

dependency "network" {
  config_path = "../../shared/network"
  mock_outputs = {
    vpc_id             = "vpc-00000000"
    private_subnet_ids = ["subnet-00000001", "subnet-00000002", "subnet-00000003"]
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "cluster" {
  config_path = "../ecs-cluster"
  mock_outputs = {
    cluster_arn  = "arn:aws:ecs:us-east-1:123456789012:cluster/mock"
    cluster_name = "mock-cluster"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  workload     = "myapp"
  environment  = "prod"
  aws_region   = "us-east-1"

  vpc_id             = dependency.network.outputs.vpc_id
  private_subnet_ids = dependency.network.outputs.private_subnet_ids
  cluster_arn        = dependency.cluster.outputs.cluster_arn
  cluster_name       = dependency.cluster.outputs.cluster_name

  task_cpu    = 1024
  task_memory = 2048
  image_tag   = "v1.4.2"
}
```

```bash
# Apply all modules in dependency order
terragrunt run-all apply --terragrunt-working-dir live/prod/us-east-1

# Plan a single module
terragrunt plan --terragrunt-working-dir live/prod/us-east-1/workloads/myapp

# Destroy in reverse dependency order (workloads before shared infra)
terragrunt run-all destroy --terragrunt-working-dir live/prod/us-east-1/workloads
```

---

## References

### AWS Documentation

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/latest/userguide/security-best-practices.html)
- [AWS Organizations User Guide](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [AWS Prescriptive Guidance — Landing Zone](https://docs.aws.amazon.com/prescriptive-guidance/latest/migration-aws-environment/building-landing-zones.html)
- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terragrunt Documentation](https://terragrunt.gruntwork.io/docs/)

### Related Guides in This Style Guide

- [Terraform and Terragrunt](../02_language_guides/terraform.md) — module structure, variable patterns, testing
- [Terragrunt (live)](../02_language_guides/terragrunt.md) — live configuration patterns
- [AWS CloudFormation](../02_language_guides/cloudformation.md) — CloudFormation alternative to Terraform
- [AWS CDK](../02_language_guides/cdk.md) — TypeScript CDK as alternative to HCL
- [Kubernetes and Helm](../02_language_guides/kubernetes.md) — workloads deployed into EKS clusters
- [GitOps (ArgoCD and Flux)](../02_language_guides/gitops.md) — continuous delivery into EKS
- [GitHub Actions](../02_language_guides/github_actions.md) — CI/CD workflow patterns
- [Microsoft Azure](azure.md) — equivalent patterns for Azure
- [Google Cloud Platform](gcp.md) — equivalent patterns for GCP
