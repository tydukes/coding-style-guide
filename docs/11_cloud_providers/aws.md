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
