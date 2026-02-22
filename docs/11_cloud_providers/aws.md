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
