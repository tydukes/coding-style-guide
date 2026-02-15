---
title: "Google Cloud Platform Best Practices Guide"
description: "Comprehensive GCP cloud provider best practices for infrastructure as code, security, networking, and cost optimization"
author: "Tyler Dukes"
tags: [gcp, google-cloud, terraform, iac, security, networking, gke, cloud-run]
category: "Cloud Providers"
status: "active"
search_keywords: [gcp, google cloud, cloud provider, infrastructure, terraform, security]
---

## Overview

**Google Cloud Platform (GCP)** is a suite of cloud computing services providing infrastructure, platform,
and serverless services. This guide covers GCP-specific patterns, security standards, and infrastructure
best practices optimized for Terraform and Terragrunt deployments.

### Key Characteristics

- **Global Network**: 40+ regions with premium-tier global backbone
- **Data & AI Leadership**: BigQuery, Vertex AI, and Cloud TPUs
- **Kubernetes Native**: GKE as the origin of Kubernetes
- **Serverless First**: Cloud Run, Cloud Functions, App Engine
- **Open Standards**: Strong commitment to open source and multi-cloud portability

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Resource Naming** | | | |
| Format | `{project}-{workload}-{env}-{region}` | `myapp-api-prod-us-central1` | Max 63 chars for most resources |
| Projects | `{org}-{workload}-{env}` | `acme-webapp-prod` | 6-30 chars, globally unique |
| GCS Buckets | `{project}-{purpose}-{env}-{region}` | `acme-logs-prod-us-central1` | Globally unique, lowercase |
| GKE Clusters | `{project}-gke-{env}-{region}` | `acme-gke-prod-us-central1` | Descriptive purpose |
| Cloud SQL | `{project}-sql-{engine}-{env}` | `acme-sql-postgres-prod` | Include engine type |
| VPC Networks | `{project}-vpc-{purpose}` | `acme-vpc-shared` | Descriptive purpose |
| **Labeling** | | | |
| Required Labels | `environment`, `owner`, `cost-center`, `project` | See examples below | Enforce via Org Policy |
| **Terraform** | | | |
| Provider Version | `~> 6.0` | `version = "~> 6.0"` | Pin major version |
| State Backend | GCS Bucket | `gcs` backend | Enable versioning |
| **Security** | | | |
| Authentication | Workload Identity | WIF or GKE WI | No exported service account keys |
| Secrets | Secret Manager | `google_secret_manager_secret` | Never in code or state |
| Network | Firewall Rules + Private Google Access | Defense in depth | No public endpoints |

---

## GCP Resource Hierarchy

### Organization Structure

```hcl
# organization.tf
# Establishes organizational hierarchy for governance

resource "google_organization_policy" "require_os_login" {
  org_id     = var.org_id
  constraint = "compute.requireOsLogin"

  boolean_policy {
    enforced = true
  }
}

resource "google_organization_policy" "disable_serial_port" {
  org_id     = var.org_id
  constraint = "compute.disableSerialPortAccess"

  boolean_policy {
    enforced = true
  }
}

resource "google_organization_policy" "uniform_bucket_access" {
  org_id     = var.org_id
  constraint = "storage.uniformBucketLevelAccess"

  boolean_policy {
    enforced = true
  }
}
```

### Folder Hierarchy

```hcl
# folders.tf
# Multi-level folder structure for environment isolation

resource "google_folder" "platform" {
  display_name = "Platform"
  parent       = "organizations/${var.org_id}"
}

resource "google_folder" "workloads" {
  display_name = "Workloads"
  parent       = "organizations/${var.org_id}"
}

resource "google_folder" "production" {
  display_name = "Production"
  parent       = google_folder.workloads.name
}

resource "google_folder" "staging" {
  display_name = "Staging"
  parent       = google_folder.workloads.name
}

resource "google_folder" "development" {
  display_name = "Development"
  parent       = google_folder.workloads.name
}

resource "google_folder" "sandbox" {
  display_name = "Sandbox"
  parent       = "organizations/${var.org_id}"
}
```

### Project Organization

```hcl
# projects.tf
# Dedicated projects per workload and environment

resource "google_project" "networking" {
  name            = "Shared Networking"
  project_id      = "${var.org_prefix}-networking-${var.environment}"
  folder_id       = google_folder.platform.name
  billing_account = var.billing_account_id

  labels = local.common_labels
}

resource "google_project" "security" {
  name            = "Security & Logging"
  project_id      = "${var.org_prefix}-security-${var.environment}"
  folder_id       = google_folder.platform.name
  billing_account = var.billing_account_id

  labels = local.common_labels
}

resource "google_project" "application" {
  name            = "Application Workload"
  project_id      = "${var.org_prefix}-app-${var.environment}"
  folder_id       = google_folder.production.name
  billing_account = var.billing_account_id

  labels = local.common_labels

  auto_create_network = false
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "cloudsql.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudkms.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
  ])

  project = google_project.application.project_id
  service = each.value

  disable_dependent_services = true
  disable_on_destroy         = false
}
```

---

## Resource Naming Conventions

### Project Naming

```hcl
# variables.tf
# Naming convention variables for GCP projects

variable "org_prefix" {
  description = "Organization prefix for resource naming"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,10}$", var.org_prefix))
    error_message = "Org prefix must be 3-11 lowercase alphanumeric characters starting with a letter."
  }
}

variable "environment" {
  description = "Environment identifier"
  type        = string

  validation {
    condition     = contains(["dev", "stg", "prod", "sandbox"], var.environment)
    error_message = "Environment must be one of: dev, stg, prod, sandbox."
  }
}

variable "region" {
  description = "GCP region for resource deployment"
  type        = string
  default     = "us-central1"

  validation {
    condition     = can(regex("^[a-z]+-[a-z]+[0-9]$", var.region))
    error_message = "Region must be a valid GCP region (e.g., us-central1, europe-west1)."
  }
}
```

### Compute Resource Naming

```hcl
# naming.tf
# Standardized naming for all GCP compute resources

locals {
  # Base naming components
  name_prefix = "${var.org_prefix}-${var.workload}-${var.environment}"
  name_suffix = var.region

  # Compute Engine instances
  # Pattern: {prefix}-{role}-{zone_suffix}-{instance}
  vm_name = "${local.name_prefix}-web-a-001"

  # Instance groups
  # Pattern: {prefix}-ig-{role}-{region}
  instance_group_name = "${local.name_prefix}-ig-web-${var.region}"

  # Instance templates
  # Pattern: {prefix}-it-{role}-{timestamp}
  instance_template_name = "${local.name_prefix}-it-web"

  # GKE clusters
  # Pattern: {prefix}-gke-{region}
  gke_cluster_name = "${local.name_prefix}-gke-${var.region}"

  # Cloud Run services
  # Pattern: {prefix}-run-{service}
  cloud_run_name = "${local.name_prefix}-run-api"

  # Cloud Functions
  # Pattern: {prefix}-fn-{function}
  cloud_function_name = "${local.name_prefix}-fn-processor"
}
```

### Storage and Database Naming

```hcl
# naming-data.tf
# Standardized naming for storage and database resources

locals {
  # GCS buckets (globally unique, no uppercase, no underscores)
  # Pattern: {project_id}-{purpose}-{env}-{region}
  gcs_bucket_name = "${var.project_id}-data-${var.environment}-${var.region}"

  # Cloud SQL instances
  # Pattern: {prefix}-sql-{engine}-{instance}
  cloud_sql_name = "${local.name_prefix}-sql-pg-primary"

  # Cloud Spanner instances
  # Pattern: {prefix}-spanner-{purpose}
  spanner_name = "${local.name_prefix}-spanner-orders"

  # Firestore databases
  # Pattern: {prefix}-firestore-{purpose}
  firestore_name = "${local.name_prefix}-firestore-users"

  # Redis instances (Memorystore)
  # Pattern: {prefix}-redis-{purpose}
  redis_name = "${local.name_prefix}-redis-cache"

  # BigQuery datasets
  # Pattern: {prefix}_{purpose}_{env} (underscores only)
  bq_dataset_name = "${replace(local.name_prefix, "-", "_")}_analytics"

  # Pub/Sub topics
  # Pattern: {prefix}-topic-{purpose}
  pubsub_topic_name = "${local.name_prefix}-topic-events"

  # Pub/Sub subscriptions
  # Pattern: {prefix}-sub-{consumer}-{topic}
  pubsub_sub_name = "${local.name_prefix}-sub-worker-events"
}
```

### Network Resource Naming

```hcl
# naming-network.tf
# Standardized naming for networking resources

locals {
  # VPC networks
  # Pattern: {prefix}-vpc-{purpose}
  vpc_name = "${local.name_prefix}-vpc-main"

  # Subnets
  # Pattern: {prefix}-subnet-{purpose}-{region}
  subnet_private_name = "${local.name_prefix}-subnet-private-${var.region}"
  subnet_public_name  = "${local.name_prefix}-subnet-public-${var.region}"
  subnet_gke_name     = "${local.name_prefix}-subnet-gke-${var.region}"

  # Firewall rules
  # Pattern: {vpc}-{allow|deny}-{protocol}-{source}-{target}
  fw_allow_internal = "${local.vpc_name}-allow-tcp-internal-all"
  fw_allow_health   = "${local.vpc_name}-allow-tcp-healthcheck-lb"
  fw_deny_all       = "${local.vpc_name}-deny-all-ingress-default"

  # Cloud NAT
  # Pattern: {prefix}-nat-{region}
  nat_name = "${local.name_prefix}-nat-${var.region}"

  # Cloud Router
  # Pattern: {prefix}-router-{region}
  router_name = "${local.name_prefix}-router-${var.region}"

  # Load Balancers
  # Pattern: {prefix}-lb-{type}-{purpose}
  lb_name = "${local.name_prefix}-lb-ext-api"

  # Cloud Armor security policies
  # Pattern: {prefix}-armor-{purpose}
  armor_policy_name = "${local.name_prefix}-armor-waf"
}
```

### Service Account Naming

```hcl
# naming-iam.tf
# Standardized naming for IAM resources

locals {
  # Service accounts
  # Pattern: {workload}-{role}@{project}.iam.gserviceaccount.com
  # account_id: 6-30 chars, lowercase + hyphens
  sa_app     = "${var.workload}-app"
  sa_deploy  = "${var.workload}-deploy"
  sa_monitor = "${var.workload}-monitor"

  # Custom IAM roles
  # Pattern: {org_prefix}.{workload}.{role}
  custom_role_id = "${var.org_prefix}.${var.workload}.deployer"

  # Workload Identity Pool
  # Pattern: {prefix}-wif-pool
  wif_pool_name = "${local.name_prefix}-wif-pool"

  # Workload Identity Provider
  # Pattern: {prefix}-wif-{provider}
  wif_provider_name = "${local.name_prefix}-wif-github"
}
```

---

## Labeling Standards

### Required Labels

```hcl
# labels.tf
# Required labels for all GCP resources

locals {
  common_labels = {
    environment  = var.environment
    project      = var.project_name
    managed-by   = "terraform"
    cost-center  = var.cost_center
    owner        = var.owner_email
    team         = var.team
    created-date = formatdate("YYYY-MM-DD", timestamp())
  }
}

# Apply labels to compute resources
resource "google_compute_instance" "app" {
  name         = "${local.name_prefix}-app-001"
  machine_type = "e2-medium"
  zone         = "${var.region}-a"

  labels = merge(
    local.common_labels,
    {
      component = "application"
      tier      = "backend"
    }
  )

  boot_disk {
    initialize_params {
      image  = "debian-cloud/debian-12"
      size   = 50
      type   = "pd-ssd"
      labels = local.common_labels
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.private.id
  }

  tags = ["app", "backend", "allow-health-check"]

  metadata = {
    enable-oslogin = "TRUE"
  }

  service_account {
    email  = google_service_account.app.email
    scopes = ["cloud-platform"]
  }
}
```

### Label Enforcement with Organization Policies

```hcl
# org-policies.tf
# Enforce labeling via Organization Policy constraints

resource "google_org_policy_policy" "require_labels" {
  name   = "projects/${var.project_id}/policies/compute.requireLabels"
  parent = "projects/${var.project_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}

# Enforce labels via custom constraint
resource "google_org_policy_custom_constraint" "require_env_label" {
  name         = "custom.requireEnvironmentLabel"
  parent       = "organizations/${var.org_id}"
  display_name = "Require environment label"
  description  = "All compute resources must have an environment label"

  action_type    = "ALLOW"
  condition      = "resource.labels.environment != ''"
  method_types   = ["CREATE", "UPDATE"]
  resource_types = ["compute.googleapis.com/Instance"]
}
```

### GCS Bucket Labels

```hcl
# storage-labels.tf
# Apply labels to storage resources

resource "google_storage_bucket" "data" {
  name          = "${var.project_id}-data-${var.environment}-${var.region}"
  location      = var.region
  storage_class = "STANDARD"
  project       = var.project_id

  labels = merge(
    local.common_labels,
    {
      data-classification = "confidential"
      retention           = "90-days"
    }
  )

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 30
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age = 90
    }
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age        = 365
      with_state = "ARCHIVED"
    }
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.storage.id
  }
}
```

### BigQuery Dataset Labels

```hcl
# bigquery-labels.tf
# Apply labels to BigQuery resources

resource "google_bigquery_dataset" "analytics" {
  dataset_id    = "${replace(var.workload, "-", "_")}_analytics"
  friendly_name = "Analytics Dataset"
  description   = "Analytics data for ${var.workload}"
  location      = var.region
  project       = var.project_id

  labels = merge(
    local.common_labels,
    {
      data-classification = "internal"
      data-domain         = "analytics"
    }
  )

  default_table_expiration_ms     = 7776000000 # 90 days
  default_partition_expiration_ms = 15552000000 # 180 days

  access {
    role          = "OWNER"
    special_group = "projectOwners"
  }

  access {
    role          = "READER"
    user_by_email = google_service_account.analytics.email
  }

  delete_contents_on_destroy = false
}
```

---

## Identity & Access Management

### Service Account Management

```hcl
# service-accounts.tf
# Least-privilege service accounts for application workloads

resource "google_service_account" "app" {
  account_id   = "${var.workload}-app"
  display_name = "${var.workload} Application Service Account"
  description  = "Service account for ${var.workload} application workload"
  project      = var.project_id
}

resource "google_service_account" "deploy" {
  account_id   = "${var.workload}-deploy"
  display_name = "${var.workload} Deployment Service Account"
  description  = "Service account for CI/CD deployment pipelines"
  project      = var.project_id
}

# Bind specific roles - never use primitive roles (Owner/Editor/Viewer)
resource "google_project_iam_member" "app_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/cloudtrace.agent",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.app.email}"
}

# Use IAM conditions for time-bound or attribute-based access
resource "google_project_iam_member" "deploy_conditional" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.deploy.email}"

  condition {
    title       = "weekday_deploy_only"
    description = "Allow deployments only on weekdays during business hours"
    expression  = "request.time.getDayOfWeek('America/New_York') >= 1 && request.time.getDayOfWeek('America/New_York') <= 5"
  }
}
```

### Workload Identity Federation (GitHub Actions)

```hcl
# workload-identity.tf
# Workload Identity Federation for keyless authentication from GitHub Actions

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "${var.workload}-github-pool"
  display_name              = "GitHub Actions Pool"
  description               = "Identity pool for GitHub Actions CI/CD"
  project                   = var.project_id
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"
  description                        = "OIDC provider for GitHub Actions"
  project                            = var.project_id

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  attribute_condition = "assertion.repository_owner == '${var.github_org}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Allow GitHub Actions to impersonate the deploy service account
resource "google_service_account_iam_member" "github_impersonation" {
  service_account_id = google_service_account.deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}
```

### Workload Identity for GKE

```hcl
# gke-workload-identity.tf
# GKE Workload Identity for pod-level IAM binding

resource "google_service_account" "gke_app" {
  account_id   = "${var.workload}-gke-app"
  display_name = "GKE Application Workload Identity"
  description  = "Workload Identity SA for ${var.workload} pods"
  project      = var.project_id
}

# Bind GCP roles to the service account
resource "google_project_iam_member" "gke_app_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gke_app.email}"
}

# Allow Kubernetes SA to impersonate GCP SA
resource "google_service_account_iam_member" "gke_workload_identity" {
  service_account_id = google_service_account.gke_app.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.k8s_namespace}/${var.k8s_service_account}]"
}

# Kubernetes service account annotation
resource "kubernetes_service_account" "app" {
  metadata {
    name      = var.k8s_service_account
    namespace = var.k8s_namespace

    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.gke_app.email
    }
  }
}
```

### Custom IAM Roles

```hcl
# custom-roles.tf
# Least-privilege custom roles when predefined roles are too broad

resource "google_project_iam_custom_role" "app_deployer" {
  role_id     = "${replace(var.workload, "-", "_")}_deployer"
  title       = "${var.workload} Deployer"
  description = "Custom role for deploying ${var.workload} services"
  project     = var.project_id

  permissions = [
    "run.services.create",
    "run.services.update",
    "run.services.get",
    "run.services.list",
    "run.routes.invoke",
    "artifactregistry.repositories.downloadArtifacts",
    "artifactregistry.tags.list",
  ]
}

resource "google_project_iam_custom_role" "monitoring_viewer" {
  role_id     = "${replace(var.workload, "-", "_")}_monitoring_viewer"
  title       = "${var.workload} Monitoring Viewer"
  description = "Read-only access to monitoring data for ${var.workload}"
  project     = var.project_id

  permissions = [
    "monitoring.timeSeries.list",
    "monitoring.dashboards.get",
    "monitoring.dashboards.list",
    "monitoring.alertPolicies.get",
    "monitoring.alertPolicies.list",
    "logging.logEntries.list",
    "logging.logs.list",
  ]
}
```

### Secret Manager Integration

```hcl
# secrets.tf
# Secret Manager for sensitive configuration

resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.workload}-db-password"
  project   = var.project_id

  labels = local.common_labels

  replication {
    auto {
      customer_managed_encryption {
        kms_key_name = google_kms_crypto_key.secrets.id
      }
    }
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password

  lifecycle {
    ignore_changes = [secret_data]
  }
}

# Grant access to specific service account
resource "google_secret_manager_secret_iam_member" "app_access" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app.email}"
}

# Automatic rotation with Cloud Function
resource "google_secret_manager_secret" "api_key" {
  secret_id = "${var.workload}-api-key"
  project   = var.project_id

  labels = local.common_labels

  replication {
    auto {}
  }

  rotation {
    next_rotation_time = "2025-06-01T00:00:00Z"
    rotation_period    = "7776000s" # 90 days
  }

  topics {
    name = google_pubsub_topic.secret_rotation.id
  }
}
```

---

## Networking

### VPC Network Design

```hcl
# vpc.tf
# Shared VPC with custom subnet design

resource "google_compute_network" "main" {
  name                    = "${local.name_prefix}-vpc-main"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  project                 = var.project_id

  delete_default_routes_on_create = true
}

# Private subnet for general workloads
resource "google_compute_subnetwork" "private" {
  name                     = "${local.name_prefix}-subnet-private-${var.region}"
  ip_cidr_range            = var.private_subnet_cidr
  region                   = var.region
  network                  = google_compute_network.main.id
  project                  = var.project_id
  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# GKE subnet with secondary ranges for pods and services
resource "google_compute_subnetwork" "gke" {
  name                     = "${local.name_prefix}-subnet-gke-${var.region}"
  ip_cidr_range            = var.gke_subnet_cidr
  region                   = var.region
  network                  = google_compute_network.main.id
  project                  = var.project_id
  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "gke-pods"
    ip_cidr_range = var.gke_pods_cidr
  }

  secondary_ip_range {
    range_name    = "gke-services"
    ip_cidr_range = var.gke_services_cidr
  }

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Serverless VPC connector for Cloud Run / Cloud Functions
resource "google_vpc_access_connector" "serverless" {
  name          = "${local.name_prefix}-vpc-connector"
  region        = var.region
  project       = var.project_id
  ip_cidr_range = var.serverless_connector_cidr
  network       = google_compute_network.main.id

  min_instances = 2
  max_instances = 10

  machine_type = "e2-micro"
}
```

### Firewall Rules

```hcl
# firewall.tf
# Defense-in-depth firewall rules using network tags

# Deny all ingress by default
resource "google_compute_firewall" "deny_all_ingress" {
  name      = "${local.vpc_name}-deny-all-ingress"
  network   = google_compute_network.main.id
  project   = var.project_id
  priority  = 65534
  direction = "INGRESS"

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }
}

# Allow internal communication within VPC
resource "google_compute_firewall" "allow_internal" {
  name      = "${local.vpc_name}-allow-internal"
  network   = google_compute_network.main.id
  project   = var.project_id
  priority  = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
  }

  allow {
    protocol = "udp"
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.private_subnet_cidr,
    var.gke_subnet_cidr,
  ]
}

# Allow Google health check probes
resource "google_compute_firewall" "allow_health_checks" {
  name      = "${local.vpc_name}-allow-health-checks"
  network   = google_compute_network.main.id
  project   = var.project_id
  priority  = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  # Google health check IP ranges
  source_ranges = [
    "35.191.0.0/16",
    "130.211.0.0/22",
  ]

  target_tags = ["allow-health-check"]
}

# Allow IAP for SSH tunneling (replaces direct SSH access)
resource "google_compute_firewall" "allow_iap_ssh" {
  name      = "${local.vpc_name}-allow-iap-ssh"
  network   = google_compute_network.main.id
  project   = var.project_id
  priority  = 1000
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  # IAP IP range
  source_ranges = ["35.235.240.0/20"]

  target_tags = ["allow-iap-ssh"]
}
```

### Cloud NAT and Router

```hcl
# nat.tf
# Cloud NAT for private instances to reach the internet

resource "google_compute_router" "main" {
  name    = "${local.name_prefix}-router-${var.region}"
  region  = var.region
  network = google_compute_network.main.id
  project = var.project_id

  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "main" {
  name                               = "${local.name_prefix}-nat-${var.region}"
  router                             = google_compute_router.main.name
  region                             = var.region
  project                            = var.project_id
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  min_ports_per_vm                    = 64
  max_ports_per_vm                    = 2048
  enable_endpoint_independent_mapping = false
  enable_dynamic_port_allocation      = true

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
```

### Shared VPC

```hcl
# shared-vpc.tf
# Host project and service project configuration

resource "google_compute_shared_vpc_host_project" "host" {
  project = google_project.networking.project_id
}

resource "google_compute_shared_vpc_service_project" "app" {
  host_project    = google_project.networking.project_id
  service_project = google_project.application.project_id

  depends_on = [google_compute_shared_vpc_host_project.host]
}

# Grant service project access to specific subnets
resource "google_compute_subnetwork_iam_member" "app_network_user" {
  project    = google_project.networking.project_id
  region     = var.region
  subnetwork = google_compute_subnetwork.private.name
  role       = "roles/compute.networkUser"
  member     = "serviceAccount:${google_project.application.number}@cloudservices.gserviceaccount.com"
}

resource "google_compute_subnetwork_iam_member" "gke_network_user" {
  project    = google_project.networking.project_id
  region     = var.region
  subnetwork = google_compute_subnetwork.gke.name
  role       = "roles/compute.networkUser"
  member     = "serviceAccount:service-${google_project.application.number}@container-engine-robot.iam.gserviceaccount.com"
}
```

### Cloud Armor WAF

```hcl
# cloud-armor.tf
# Cloud Armor security policy for HTTPS load balancers

resource "google_compute_security_policy" "waf" {
  name    = "${local.name_prefix}-armor-waf"
  project = var.project_id

  # OWASP ModSecurity Core Rule Set
  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block XSS attacks"
  }

  rule {
    action   = "deny(403)"
    priority = 1001
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block SQL injection attacks"
  }

  rule {
    action   = "deny(403)"
    priority = 1002
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-v33-stable')"
      }
    }
    description = "Block local file inclusion"
  }

  rule {
    action   = "deny(403)"
    priority = 1003
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rfi-v33-stable')"
      }
    }
    description = "Block remote file inclusion"
  }

  # Rate limiting
  rule {
    action   = "throttle"
    priority = 2000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
    }
    description = "Rate limit to 100 requests per minute per IP"
  }

  # Geo-restriction (optional)
  rule {
    action   = "deny(403)"
    priority = 3000
    match {
      expr {
        expression = "origin.region_code == 'CN' || origin.region_code == 'RU'"
      }
    }
    description = "Block traffic from restricted regions"
  }

  # Default allow rule
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }
}
```

### Private Service Connect

```hcl
# private-service-connect.tf
# Private connectivity to Google APIs and services

resource "google_compute_global_address" "psc_apis" {
  name         = "${local.name_prefix}-psc-apis"
  purpose      = "PRIVATE_SERVICE_CONNECT"
  address_type = "INTERNAL"
  network      = google_compute_network.main.id
  project      = var.project_id
  address      = "10.0.0.5"
}

resource "google_compute_global_forwarding_rule" "psc_apis" {
  name                  = "${local.name_prefix}-psc-apis-fwd"
  target                = "all-apis"
  network               = google_compute_network.main.id
  ip_address            = google_compute_global_address.psc_apis.id
  load_balancing_scheme = ""
  project               = var.project_id
}

# DNS zone for Private Service Connect
resource "google_dns_managed_zone" "psc_googleapis" {
  name        = "${local.name_prefix}-psc-googleapis"
  dns_name    = "googleapis.com."
  project     = var.project_id
  visibility  = "private"
  description = "Private DNS zone for Google APIs via PSC"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main.id
    }
  }
}

resource "google_dns_record_set" "psc_googleapis" {
  name         = "*.googleapis.com."
  managed_zone = google_dns_managed_zone.psc_googleapis.name
  project      = var.project_id
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.psc_apis.address]
}
```

---

## Security & Compliance

### Cloud KMS Encryption

```hcl
# kms.tf
# Customer-managed encryption keys (CMEK)

resource "google_kms_key_ring" "main" {
  name     = "${local.name_prefix}-keyring"
  location = var.region
  project  = var.project_id
}

resource "google_kms_crypto_key" "storage" {
  name            = "${local.name_prefix}-key-storage"
  key_ring        = google_kms_key_ring.main.id
  rotation_period = "7776000s" # 90 days

  purpose = "ENCRYPT_DECRYPT"

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "SOFTWARE"
  }

  labels = local.common_labels

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_kms_crypto_key" "secrets" {
  name            = "${local.name_prefix}-key-secrets"
  key_ring        = google_kms_key_ring.main.id
  rotation_period = "7776000s" # 90 days

  purpose = "ENCRYPT_DECRYPT"

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "HSM"
  }

  labels = local.common_labels

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_kms_crypto_key" "database" {
  name            = "${local.name_prefix}-key-database"
  key_ring        = google_kms_key_ring.main.id
  rotation_period = "7776000s" # 90 days

  purpose = "ENCRYPT_DECRYPT"

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "HSM"
  }

  labels = local.common_labels

  lifecycle {
    prevent_destroy = true
  }
}

# Grant service account access to encryption key
resource "google_kms_crypto_key_iam_member" "app_encrypt" {
  crypto_key_id = google_kms_crypto_key.storage.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${google_service_account.app.email}"
}
```

### VPC Service Controls

```hcl
# vpc-service-controls.tf
# Restrict data exfiltration with VPC Service Controls

resource "google_access_context_manager_service_perimeter" "main" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/servicePerimeters/${var.workload}_perimeter"
  title  = "${var.workload} Service Perimeter"

  status {
    resources = [
      "projects/${google_project.application.number}",
      "projects/${google_project.security.number}",
    ]

    restricted_services = [
      "bigquery.googleapis.com",
      "storage.googleapis.com",
      "cloudsql.googleapis.com",
      "secretmanager.googleapis.com",
      "cloudkms.googleapis.com",
    ]

    access_levels = [
      google_access_context_manager_access_level.corp_network.name,
    ]

    vpc_accessible_services {
      enable_restriction = true
      allowed_services = [
        "bigquery.googleapis.com",
        "storage.googleapis.com",
        "logging.googleapis.com",
        "monitoring.googleapis.com",
      ]
    }

    ingress_policies {
      ingress_from {
        sources {
          access_level = google_access_context_manager_access_level.corp_network.name
        }
        identity_type = "ANY_IDENTITY"
      }
      ingress_to {
        resources = ["*"]
        operations {
          service_name = "storage.googleapis.com"
          method_selectors {
            method = "google.storage.objects.get"
          }
        }
      }
    }
  }
}

resource "google_access_context_manager_access_level" "corp_network" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/accessLevels/corp_network"
  title  = "Corporate Network"

  basic {
    conditions {
      ip_subnetworks = var.corp_ip_ranges
    }
  }
}
```

### Organization Policy Constraints

```hcl
# org-constraints.tf
# Security guardrails via Organization Policy

# Restrict VM external IPs
resource "google_organization_policy" "disable_vm_external_ip" {
  org_id     = var.org_id
  constraint = "compute.vmExternalIpAccess"

  list_policy {
    deny {
      all = true
    }
  }
}

# Restrict public Cloud SQL instances
resource "google_organization_policy" "restrict_public_sql" {
  org_id     = var.org_id
  constraint = "sql.restrictPublicIp"

  boolean_policy {
    enforced = true
  }
}

# Require shielded VMs
resource "google_organization_policy" "require_shielded_vm" {
  org_id     = var.org_id
  constraint = "compute.requireShieldedVm"

  boolean_policy {
    enforced = true
  }
}

# Restrict resource locations to approved regions
resource "google_organization_policy" "restrict_locations" {
  org_id     = var.org_id
  constraint = "gcp.resourceLocations"

  list_policy {
    allow {
      values = [
        "in:us-locations",
        "in:eu-locations",
      ]
    }
  }
}

# Disable service account key creation
resource "google_organization_policy" "disable_sa_key_creation" {
  org_id     = var.org_id
  constraint = "iam.disableServiceAccountKeyCreation"

  boolean_policy {
    enforced = true
  }
}

# Enforce uniform bucket-level access
resource "google_organization_policy" "uniform_bucket_access" {
  org_id     = var.org_id
  constraint = "storage.uniformBucketLevelAccess"

  boolean_policy {
    enforced = true
  }
}
```

### Audit Logging

```hcl
# audit-logging.tf
# Organization-level audit log configuration

resource "google_organization_iam_audit_config" "all_services" {
  org_id  = var.org_id
  service = "allServices"

  audit_log_config {
    log_type = "ADMIN_READ"
  }

  audit_log_config {
    log_type = "DATA_READ"
    exempted_members = [
      "serviceAccount:${google_service_account.monitor.email}",
    ]
  }

  audit_log_config {
    log_type = "DATA_WRITE"
  }
}

# Export audit logs to centralized logging project
resource "google_logging_organization_sink" "audit" {
  name             = "${var.workload}-audit-sink"
  org_id           = var.org_id
  destination      = "storage.googleapis.com/${google_storage_bucket.audit_logs.name}"
  include_children = true

  filter = <<-EOT
    logName:"cloudaudit.googleapis.com"
    OR logName:"activity"
    OR logName:"data_access"
    OR logName:"policy"
  EOT
}

resource "google_storage_bucket" "audit_logs" {
  name          = "${var.org_prefix}-audit-logs-${var.region}"
  location      = var.region
  project       = google_project.security.project_id
  storage_class = "STANDARD"

  labels = merge(local.common_labels, {
    purpose             = "audit-logging"
    data-classification = "confidential"
  })

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  retention_policy {
    is_locked        = true
    retention_period = 31536000 # 365 days
  }

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age = 90
    }
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.storage.id
  }
}

# Grant the log sink writer access to the bucket
resource "google_storage_bucket_iam_member" "audit_writer" {
  bucket = google_storage_bucket.audit_logs.name
  role   = "roles/storage.objectCreator"
  member = google_logging_organization_sink.audit.writer_identity
}
```

---

## Compute Services

### Google Kubernetes Engine (GKE)

```hcl
# gke.tf
# Production-grade GKE cluster with Autopilot or Standard mode

resource "google_container_cluster" "primary" {
  name     = "${local.name_prefix}-gke-${var.region}"
  location = var.region
  project  = var.project_id

  network    = google_compute_network.main.name
  subnetwork = google_compute_subnetwork.gke.name

  # Remove default node pool - use separately managed node pools
  remove_default_node_pool = true
  initial_node_count       = 1

  # Release channel for automatic upgrades
  release_channel {
    channel = "REGULAR"
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Network policy (Calico)
  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = var.gke_master_cidr
  }

  # Authorized networks for API server access
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = var.corp_cidr
      display_name = "Corporate Network"
    }
  }

  # IP allocation for pods and services
  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }

  # Binary Authorization
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Logging and monitoring
  logging_config {
    enable_components = [
      "SYSTEM_COMPONENTS",
      "WORKLOADS",
    ]
  }

  monitoring_config {
    enable_components = [
      "SYSTEM_COMPONENTS",
    ]
    managed_prometheus {
      enabled = true
    }
  }

  # Maintenance window
  maintenance_policy {
    recurring_window {
      start_time = "2025-01-01T04:00:00Z"
      end_time   = "2025-01-01T08:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA"
    }
  }

  # Security configuration
  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  # Enable Dataplane V2 (eBPF)
  datapath_provider = "ADVANCED_DATAPATH"

  # Enable Shielded GKE Nodes
  node_config {
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  resource_labels = local.common_labels
}

# Standard node pool
resource "google_container_node_pool" "general" {
  name     = "general"
  cluster  = google_container_cluster.primary.id
  location = var.region

  initial_node_count = var.gke_min_nodes

  autoscaling {
    min_node_count  = var.gke_min_nodes
    max_node_count  = var.gke_max_nodes
    location_policy = "BALANCED"
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
    strategy        = "SURGE"
  }

  node_config {
    machine_type = var.gke_machine_type
    disk_size_gb = 100
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    service_account = google_service_account.gke_nodes.email

    labels = merge(local.common_labels, {
      node-pool = "general"
    })

    tags = ["gke-node", "allow-health-check"]

    metadata = {
      disable-legacy-endpoints = "true"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}
```

### Cloud Run

```hcl
# cloud-run.tf
# Fully managed serverless container deployment

resource "google_cloud_run_v2_service" "api" {
  name     = "${local.name_prefix}-run-api"
  location = var.region
  project  = var.project_id

  labels = local.common_labels

  template {
    labels = merge(local.common_labels, {
      component = "api"
    })

    service_account = google_service_account.app.email

    scaling {
      min_instance_count = var.environment == "prod" ? 2 : 0
      max_instance_count = 100
    }

    timeout = "300s"

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repo}/${var.image_name}:${var.image_tag}"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        period_seconds = 30
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.serverless.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# IAM: Allow unauthenticated access (public API) or restrict
resource "google_cloud_run_v2_service_iam_member" "public" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# IAM: Restrict to authenticated users
resource "google_cloud_run_v2_service_iam_member" "authenticated" {
  count = var.allow_unauthenticated ? 0 : 1

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.deploy.email}"
}
```

### Cloud Functions

```hcl
# cloud-functions.tf
# Event-driven serverless functions (2nd gen)

resource "google_cloudfunctions2_function" "processor" {
  name     = "${local.name_prefix}-fn-processor"
  location = var.region
  project  = var.project_id

  labels = local.common_labels

  build_config {
    runtime     = "python312"
    entry_point = "handle_event"

    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.function_zip.name
      }
    }

    environment_variables = {
      BUILD_CONFIG_TEST = "build_test"
    }
  }

  service_config {
    max_instance_count    = 100
    min_instance_count    = 0
    available_memory      = "256Mi"
    available_cpu         = "1"
    timeout_seconds       = 60
    service_account_email = google_service_account.app.email

    environment_variables = {
      PROJECT_ID  = var.project_id
      ENVIRONMENT = var.environment
    }

    secret_environment_variables {
      key        = "API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.api_key.secret_id
      version    = "latest"
    }

    ingress_settings               = "ALLOW_INTERNAL_AND_GCLB"
    all_traffic_on_latest_revision = true

    vpc_connector                 = google_vpc_access_connector.serverless.id
    vpc_connector_egress_settings = "PRIVATE_RANGES_ONLY"
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.events.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

# Pub/Sub topic for event triggering
resource "google_pubsub_topic" "events" {
  name    = "${local.name_prefix}-topic-events"
  project = var.project_id

  labels = local.common_labels

  message_retention_duration = "604800s" # 7 days

  schema_settings {
    schema   = google_pubsub_schema.events.id
    encoding = "JSON"
  }
}

resource "google_pubsub_schema" "events" {
  name       = "${local.name_prefix}-schema-events"
  project    = var.project_id
  type       = "AVRO"
  definition = file("${path.module}/schemas/events.avsc")
}

resource "google_pubsub_subscription" "events_dlq" {
  name    = "${local.name_prefix}-sub-events-dlq"
  topic   = google_pubsub_topic.events.id
  project = var.project_id

  labels = local.common_labels

  ack_deadline_seconds       = 20
  message_retention_duration = "604800s" # 7 days
  retain_acked_messages      = true

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_topic" "dead_letter" {
  name    = "${local.name_prefix}-topic-dead-letter"
  project = var.project_id
  labels  = local.common_labels
}
```

### Compute Engine

```hcl
# compute.tf
# Managed instance groups with autoscaling

resource "google_compute_instance_template" "app" {
  name_prefix  = "${local.name_prefix}-it-app-"
  machine_type = var.machine_type
  project      = var.project_id
  region       = var.region

  labels = merge(local.common_labels, {
    component = "application"
  })

  tags = ["app", "allow-health-check", "allow-iap-ssh"]

  disk {
    source_image = "debian-cloud/debian-12"
    auto_delete  = true
    boot         = true
    disk_type    = "pd-ssd"
    disk_size_gb = 50

    disk_encryption_key {
      kms_key_self_link = google_kms_crypto_key.storage.id
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.private.id
    # No external IP - use Cloud NAT for egress
  }

  service_account {
    email  = google_service_account.app.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    enable-oslogin = "TRUE"
  }

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_region_instance_group_manager" "app" {
  name               = "${local.name_prefix}-ig-app-${var.region}"
  base_instance_name = "${local.name_prefix}-app"
  region             = var.region
  project            = var.project_id

  version {
    instance_template = google_compute_instance_template.app.id
  }

  named_port {
    name = "http"
    port = 8080
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.app.id
    initial_delay_sec = 300
  }

  update_policy {
    type                         = "PROACTIVE"
    instance_redistribution_type = "PROACTIVE"
    minimal_action               = "REPLACE"
    max_surge_fixed              = 3
    max_unavailable_fixed        = 0
    replacement_method           = "SUBSTITUTE"
  }
}

resource "google_compute_region_autoscaler" "app" {
  name    = "${local.name_prefix}-as-app-${var.region}"
  region  = var.region
  project = var.project_id
  target  = google_compute_region_instance_group_manager.app.id

  autoscaling_policy {
    min_replicas    = var.min_instances
    max_replicas    = var.max_instances
    cooldown_period = 60

    cpu_utilization {
      target = 0.7
    }

    scaling_schedules {
      name                  = "workday-peak"
      min_required_replicas = var.peak_instances
      schedule              = "0 8 * * MON-FRI"
      duration_sec          = 36000 # 10 hours
      time_zone             = "America/New_York"
    }
  }
}

resource "google_compute_health_check" "app" {
  name                = "${local.name_prefix}-hc-app"
  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
  project             = var.project_id

  http_health_check {
    port         = 8080
    request_path = "/health"
  }
}
```

---

## Data Services

### Cloud SQL (PostgreSQL)

```hcl
# cloud-sql.tf
# High-availability Cloud SQL PostgreSQL instance

resource "google_sql_database_instance" "primary" {
  name                = "${local.name_prefix}-sql-pg-primary"
  database_version    = "POSTGRES_16"
  region              = var.region
  project             = var.project_id
  deletion_protection = var.environment == "prod"

  settings {
    tier              = var.sql_tier
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.sql_disk_size
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.main.id
      require_ssl                                   = true
      enable_private_path_for_google_cloud_services = true
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 4
      update_track = "stable"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    database_flags {
      name  = "log_lock_waits"
      value = "on"
    }

    database_flags {
      name  = "log_temp_files"
      value = "0"
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }

    user_labels = local.common_labels
  }

  depends_on = [google_service_networking_connection.private_vpc]
}

# Read replica for production
resource "google_sql_database_instance" "replica" {
  count = var.environment == "prod" ? 1 : 0

  name                 = "${local.name_prefix}-sql-pg-replica"
  master_instance_name = google_sql_database_instance.primary.name
  database_version     = "POSTGRES_16"
  region               = var.replica_region
  project              = var.project_id

  replica_configuration {
    failover_target = false
  }

  settings {
    tier            = var.sql_tier
    disk_type       = "PD_SSD"
    disk_size       = var.sql_disk_size
    disk_autoresize = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
      require_ssl     = true
    }

    user_labels = merge(local.common_labels, {
      role = "replica"
    })
  }
}

# Private VPC peering for Cloud SQL
resource "google_compute_global_address" "private_ip_range" {
  name          = "${local.name_prefix}-private-ip-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 20
  network       = google_compute_network.main.id
  project       = var.project_id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
}

# IAM-based database user (no password)
resource "google_sql_user" "app_iam" {
  name     = google_service_account.app.email
  instance = google_sql_database_instance.primary.name
  project  = var.project_id
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}

resource "google_sql_database" "app" {
  name     = var.database_name
  instance = google_sql_database_instance.primary.name
  project  = var.project_id
}
```

### Cloud Storage

```hcl
# storage.tf
# Secure bucket configuration with lifecycle policies

resource "google_storage_bucket" "data" {
  name          = "${var.project_id}-data-${var.environment}-${var.region}"
  location      = var.region
  storage_class = "STANDARD"
  project       = var.project_id

  labels = merge(local.common_labels, {
    data-classification = "confidential"
  })

  # Security defaults
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  # Lifecycle management
  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 30
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age = 90
    }
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age                   = 365
      num_newer_versions    = 3
      days_since_noncurrent = 30
    }
  }

  # CORS configuration (if serving web content)
  cors {
    origin          = var.allowed_origins
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  # Customer-managed encryption key
  encryption {
    default_kms_key_name = google_kms_crypto_key.storage.id
  }

  # Soft delete policy
  soft_delete_policy {
    retention_duration_seconds = 604800 # 7 days
  }
}

# Bucket notification to Pub/Sub
resource "google_storage_notification" "data_notification" {
  bucket         = google_storage_bucket.data.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.storage_events.id
  event_types    = ["OBJECT_FINALIZE", "OBJECT_DELETE"]

  depends_on = [google_pubsub_topic_iam_member.storage_publisher]
}

resource "google_pubsub_topic" "storage_events" {
  name    = "${local.name_prefix}-topic-storage-events"
  project = var.project_id
  labels  = local.common_labels
}

resource "google_pubsub_topic_iam_member" "storage_publisher" {
  topic  = google_pubsub_topic.storage_events.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:service-${data.google_project.current.number}@gs-project-accounts.iam.gserviceaccount.com"
}
```

### Memorystore (Redis)

```hcl
# redis.tf
# Managed Redis instance for caching

resource "google_redis_instance" "cache" {
  name               = "${local.name_prefix}-redis-cache"
  tier               = var.environment == "prod" ? "STANDARD_HA" : "BASIC"
  memory_size_gb     = var.redis_memory_gb
  region             = var.region
  project            = var.project_id
  redis_version      = "REDIS_7_2"
  display_name       = "${var.workload} Cache"
  authorized_network = google_compute_network.main.id

  labels = local.common_labels

  redis_configs = {
    maxmemory-policy  = "allkeys-lru"
    notify-keyspace-events = ""
  }

  transit_encryption_mode = "SERVER_AUTHENTICATION"
  connect_mode            = "PRIVATE_SERVICE_ACCESS"

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 4
        minutes = 0
      }
    }
  }

  persistence_config {
    persistence_mode    = "RDB"
    rdb_snapshot_period = "TWELVE_HOURS"
  }

  depends_on = [google_service_networking_connection.private_vpc]
}
```

### Artifact Registry

```hcl
# artifact-registry.tf
# Container and package repository management

resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = "${var.workload}-docker"
  description   = "Docker container images for ${var.workload}"
  format        = "DOCKER"
  project       = var.project_id

  labels = local.common_labels

  docker_config {
    immutable_tags = var.environment == "prod"
  }

  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  cleanup_policies {
    id     = "delete-old-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s" # 7 days
    }
  }

  cleanup_policies {
    id     = "delete-old-tagged"
    action = "DELETE"
    condition {
      tag_state  = "TAGGED"
      older_than = "7776000s" # 90 days
      tag_prefixes = ["dev-", "test-"]
    }
  }
}

resource "google_artifact_registry_repository" "python" {
  location      = var.region
  repository_id = "${var.workload}-python"
  description   = "Python packages for ${var.workload}"
  format        = "PYTHON"
  project       = var.project_id

  labels = local.common_labels
}

# Grant CI/CD service account push access
resource "google_artifact_registry_repository_iam_member" "deploy_writer" {
  repository = google_artifact_registry_repository.docker.name
  location   = var.region
  project    = var.project_id
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deploy.email}"
}

# Grant application service account pull access
resource "google_artifact_registry_repository_iam_member" "app_reader" {
  repository = google_artifact_registry_repository.docker.name
  location   = var.region
  project    = var.project_id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.app.email}"
}
```

---

## Monitoring & Observability

### Cloud Monitoring

```hcl
# monitoring.tf
# Alert policies and notification channels

resource "google_monitoring_notification_channel" "email" {
  display_name = "${var.workload} Email Alerts"
  type         = "email"
  project      = var.project_id

  labels = {
    email_address = var.alert_email
  }
}

resource "google_monitoring_notification_channel" "pagerduty" {
  display_name = "${var.workload} PagerDuty"
  type         = "pagerduty"
  project      = var.project_id

  labels = {
    service_key = var.pagerduty_service_key
  }

  sensitive_labels {
    service_key = var.pagerduty_service_key
  }
}

# High error rate alert
resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "${var.workload} - High Error Rate"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Error rate exceeds 5%"

    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05
      duration        = "300s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.service_name"]
      }

      trigger {
        count = 1
      }
    }
  }

  alert_strategy {
    auto_close = "1800s"
  }

  notification_channels = [
    google_monitoring_notification_channel.email.name,
    google_monitoring_notification_channel.pagerduty.name,
  ]

  user_labels = local.common_labels
}

# High latency alert
resource "google_monitoring_alert_policy" "latency" {
  display_name = "${var.workload} - High Latency (P95)"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "P95 latency exceeds 2s"

    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_latencies\""
      comparison      = "COMPARISON_GT"
      threshold_value = 2000
      duration        = "300s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MAX"
        group_by_fields      = ["resource.label.service_name"]
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email.name,
  ]

  user_labels = local.common_labels
}

# CPU utilization alert for GKE
resource "google_monitoring_alert_policy" "gke_cpu" {
  display_name = "${var.workload} - GKE High CPU"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "GKE node CPU exceeds 85%"

    condition_threshold {
      filter          = "resource.type = \"k8s_node\" AND metric.type = \"kubernetes.io/node/cpu/allocatable_utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85
      duration        = "600s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.node_name"]
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email.name,
  ]

  user_labels = local.common_labels
}
```

### Cloud Logging

```hcl
# logging.tf
# Log-based metrics, sinks, and exclusions

# Log-based metric for application errors
resource "google_logging_metric" "app_errors" {
  name    = "${var.workload}_app_errors"
  project = var.project_id

  filter = <<-EOT
    resource.type = "cloud_run_revision"
    severity >= ERROR
    labels."run.googleapis.com/service_name" = "${local.name_prefix}-run-api"
  EOT

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"

    labels {
      key         = "severity"
      value_type  = "STRING"
      description = "Log severity level"
    }
  }

  label_extractors = {
    "severity" = "EXTRACT(severity)"
  }
}

# Log sink to BigQuery for analysis
resource "google_logging_project_sink" "bigquery" {
  name                   = "${var.workload}-logs-to-bq"
  project                = var.project_id
  destination            = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.logs.dataset_id}"
  unique_writer_identity = true

  filter = <<-EOT
    resource.type = "cloud_run_revision"
    OR resource.type = "k8s_container"
    OR resource.type = "cloud_function"
  EOT

  bigquery_options {
    use_partitioned_tables = true
  }
}

resource "google_bigquery_dataset" "logs" {
  dataset_id    = "${replace(var.workload, "-", "_")}_logs"
  friendly_name = "${var.workload} Application Logs"
  location      = var.region
  project       = var.project_id

  labels = local.common_labels

  default_table_expiration_ms = 7776000000 # 90 days

  access {
    role          = "OWNER"
    special_group = "projectOwners"
  }

  access {
    role          = "WRITER"
    user_by_email = google_logging_project_sink.bigquery.writer_identity
  }
}

# Log exclusion for noisy health checks
resource "google_logging_project_exclusion" "health_checks" {
  name    = "${var.workload}-exclude-health-checks"
  project = var.project_id

  filter = <<-EOT
    resource.type = "cloud_run_revision"
    httpRequest.requestUrl = "/health"
    httpRequest.status = 200
  EOT

  description = "Exclude successful health check logs to reduce costs"
}
```

### Uptime Checks

```hcl
# uptime-checks.tf
# External uptime monitoring for public endpoints

resource "google_monitoring_uptime_check_config" "api" {
  display_name = "${var.workload} API Health"
  project      = var.project_id
  timeout      = "10s"
  period       = "60s"

  http_check {
    path           = "/health"
    port           = 443
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"

    accepted_response_status_codes {
      status_class = "STATUS_CLASS_2XX"
    }
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.api_domain
    }
  }

  content_matchers {
    content = "\"status\":\"healthy\""
    matcher = "CONTAINS_STRING"
  }

  checker_type     = "STATIC_IP_CHECKERS"
  selected_regions = ["USA", "EUROPE", "ASIA_PACIFIC"]

  user_labels = local.common_labels
}

# Alert on uptime check failure
resource "google_monitoring_alert_policy" "uptime" {
  display_name = "${var.workload} - Uptime Check Failed"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Uptime check failure"

    condition_threshold {
      filter          = "resource.type = \"uptime_url\" AND metric.type = \"monitoring.googleapis.com/uptime_check/check_passed\" AND metric.labels.check_id = \"${google_monitoring_uptime_check_config.api.uptime_check_id}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "300s"

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.host"]
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.pagerduty.name,
  ]

  user_labels = local.common_labels
}
```

### Custom Dashboards

```hcl
# dashboards.tf
# Cloud Monitoring dashboard for application overview

resource "google_monitoring_dashboard" "app" {
  dashboard_json = jsonencode({
    displayName = "${var.workload} Application Dashboard"
    mosaicLayout = {
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Request Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Error Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "P95 Latency (ms)"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_latencies\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_PERCENTILE_95"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Instance Count"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/container/instance_count\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                }
              }]
            }
          }
        },
      ]
    }
  })

  project = var.project_id
}
```

---

## CI/CD Integration

### GitHub Actions with Workload Identity Federation

```yaml
# .github/workflows/deploy-gcp.yml
# Keyless authentication to GCP from GitHub Actions

name: Deploy to GCP

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  id-token: write

env:
  PROJECT_ID: my-project-prod
  REGION: us-central1
  SERVICE_NAME: my-service
  ARTIFACT_REPO: my-repo

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.SA_EMAIL }}
          token_format: access_token

      - name: Configure Docker for Artifact Registry
        run: |
          gcloud auth configure-docker \
            "${{ env.REGION }}-docker.pkg.dev" \
            --quiet

      - name: Build and push container image
        run: |
          docker build \
            --tag "${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:${{ github.sha }}" \
            --tag "${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:latest" \
            .

          docker push \
            "${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}" \
            --all-tags

  deploy-staging:
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.SA_EMAIL }}

      - name: Deploy to Cloud Run (Staging)
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${{ env.SERVICE_NAME }}-staging
          image: "${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:${{ github.sha }}"
          region: ${{ env.REGION }}
          flags: "--allow-unauthenticated --cpu=2 --memory=1Gi --min-instances=0 --max-instances=10"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.SA_EMAIL }}

      - name: Deploy to Cloud Run (Production)
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${{ env.SERVICE_NAME }}
          image: "${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:${{ github.sha }}"
          region: ${{ env.REGION }}
          flags: "--no-allow-unauthenticated --cpu=2 --memory=1Gi --min-instances=2 --max-instances=100"
          tag: "rev-${{ github.sha }}"
```

### Terraform CI/CD Pipeline

```yaml
# .github/workflows/terraform-gcp.yml
# Terraform plan on PR, apply on merge to main

name: Terraform GCP

on:
  push:
    branches: [main]
    paths: ["infra/**"]
  pull_request:
    branches: [main]
    paths: ["infra/**"]

permissions:
  contents: read
  id-token: write
  pull-requests: write

env:
  TF_VERSION: "1.10"
  TF_VAR_project_id: ${{ secrets.GCP_PROJECT_ID }}
  TF_VAR_region: us-central1

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.TF_SA_EMAIL }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        working-directory: infra
        run: |
          terraform init \
            -backend-config="bucket=${{ secrets.TF_STATE_BUCKET }}" \
            -backend-config="prefix=terraform/state"

      - name: Terraform Validate
        working-directory: infra
        run: terraform validate

      - name: Terraform Plan
        id: plan
        working-directory: infra
        run: |
          terraform plan \
            -no-color \
            -out=tfplan \
            -input=false

      - name: Comment PR with Plan
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const plan = `${{ steps.plan.outputs.stdout }}`;
            const truncated = plan.length > 65000
              ? plan.substring(0, 65000) + '\n... (truncated)'
              : plan;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `### Terraform Plan\n\`\`\`hcl\n${truncated}\n\`\`\``
            });

  terraform-apply:
    needs: terraform-plan
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.TF_SA_EMAIL }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        working-directory: infra
        run: |
          terraform init \
            -backend-config="bucket=${{ secrets.TF_STATE_BUCKET }}" \
            -backend-config="prefix=terraform/state"

      - name: Terraform Apply
        working-directory: infra
        run: terraform apply -auto-approve -input=false
```

### Cloud Build Pipeline

```yaml
# cloudbuild.yaml
# Native GCP CI/CD with Cloud Build

steps:
  # Run tests
  - name: python:3.12-slim
    entrypoint: bash
    args:
      - -c
      - |
        pip install -r requirements.txt
        pip install pytest pytest-cov
        pytest tests/ \
          --cov=src \
          --cov-report=xml \
          --junitxml=test-results.xml

  # Build container image
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - --tag=${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/${_SERVICE}:${SHORT_SHA}
      - --tag=${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/${_SERVICE}:latest
      - --cache-from=${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/${_SERVICE}:latest
      - .

  # Push to Artifact Registry
  - name: gcr.io/cloud-builders/docker
    args:
      - push
      - --all-tags
      - ${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/${_SERVICE}

  # Deploy to Cloud Run
  - name: gcr.io/cloud-builders/gcloud
    args:
      - run
      - deploy
      - ${_SERVICE}
      - --image=${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/${_SERVICE}:${SHORT_SHA}
      - --region=${_REGION}
      - --platform=managed
      - --min-instances=2
      - --max-instances=100

substitutions:
  _REGION: us-central1
  _REPO: my-repo
  _SERVICE: my-service

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: E2_HIGHCPU_8

images:
  - ${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/${_SERVICE}:${SHORT_SHA}
  - ${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/${_SERVICE}:latest
```

### gcloud CLI Standards

```bash
#!/usr/bin/env bash
# gcloud CLI scripting best practices

set -euo pipefail

readonly PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID must be set}"
readonly REGION="${GCP_REGION:-us-central1}"
readonly SERVICE_NAME="${1:?Usage: $0 <service-name>}"

# Authenticate with service account (CI/CD)
if [[ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  gcloud auth activate-service-account \
    --key-file="${GOOGLE_APPLICATION_CREDENTIALS}" \
    --project="${PROJECT_ID}"
fi

# Set project context
gcloud config set project "${PROJECT_ID}" --quiet
gcloud config set compute/region "${REGION}" --quiet

# Use --format for machine-readable output
get_service_url() {
  local service_name="$1"
  gcloud run services describe "${service_name}" \
    --region="${REGION}" \
    --format="value(status.url)"
}

# Use --filter for server-side filtering
list_running_instances() {
  gcloud compute instances list \
    --filter="status=RUNNING AND labels.environment=${ENVIRONMENT}" \
    --format="table(name, zone, machineType, networkInterfaces[0].networkIP)" \
    --sort-by="name"
}

# Use --quiet to suppress prompts in scripts
delete_old_revisions() {
  local service_name="$1"
  local keep_count="${2:-5}"

  gcloud run revisions list \
    --service="${service_name}" \
    --region="${REGION}" \
    --format="value(REVISION)" \
    --sort-by="~creationTimestamp" \
    --limit=999 |
    tail -n "+$((keep_count + 1))" |
    while read -r revision; do
      echo "Deleting revision: ${revision}"
      gcloud run revisions delete "${revision}" \
        --region="${REGION}" \
        --quiet
    done
}

# Use JSON output for programmatic processing
get_cluster_info() {
  gcloud container clusters describe "${PROJECT_ID}-gke-${REGION}" \
    --region="${REGION}" \
    --format="json" |
    jq '{
      name: .name,
      status: .status,
      nodeCount: .currentNodeCount,
      version: .currentMasterVersion,
      endpoint: .endpoint
    }'
}

echo "Deploying ${SERVICE_NAME} to ${PROJECT_ID} in ${REGION}"
```

---

## Terraform State Management

### GCS Backend Configuration

```hcl
# backend.tf
# GCS backend with state locking

terraform {
  backend "gcs" {
    bucket = "myorg-terraform-state-prod"
    prefix = "terraform/networking"
  }
}
```

### State Bucket with Security Controls

```hcl
# state-bucket.tf
# Secure GCS bucket for Terraform state files

resource "google_storage_bucket" "terraform_state" {
  name          = "${var.org_prefix}-terraform-state-${var.environment}"
  location      = var.region
  project       = google_project.security.project_id
  storage_class = "STANDARD"

  labels = merge(local.common_labels, {
    purpose = "terraform-state"
  })

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 30
    }
  }

  soft_delete_policy {
    retention_duration_seconds = 604800 # 7 days
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.state.id
  }
}

# Restrict access to state bucket
resource "google_storage_bucket_iam_member" "state_admin" {
  bucket = google_storage_bucket.terraform_state.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.deploy.email}"
}

# Deny public access at org level
resource "google_storage_bucket_iam_member" "deny_public" {
  bucket = google_storage_bucket.terraform_state.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"

  # This binding should NOT exist - use lifecycle to prevent
  lifecycle {
    prevent_destroy = true
  }
}
```

### Provider Configuration

```hcl
# providers.tf
# Google provider with version pinning and default configuration

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project               = var.project_id
  region                = var.region
  default_labels        = local.common_labels
  add_terraform_attribution_label = true

  batching {
    send_after  = "10s"
    enable_batching = true
  }
}

provider "google-beta" {
  project               = var.project_id
  region                = var.region
  default_labels        = local.common_labels
  add_terraform_attribution_label = true
}
```

### Data Sources and Remote State

```hcl
# data.tf
# Reference remote state from other configurations

data "terraform_remote_state" "networking" {
  backend = "gcs"

  config = {
    bucket = "${var.org_prefix}-terraform-state-${var.environment}"
    prefix = "terraform/networking"
  }
}

data "terraform_remote_state" "security" {
  backend = "gcs"

  config = {
    bucket = "${var.org_prefix}-terraform-state-${var.environment}"
    prefix = "terraform/security"
  }
}

# Use outputs from remote state
locals {
  vpc_id         = data.terraform_remote_state.networking.outputs.vpc_id
  subnet_ids     = data.terraform_remote_state.networking.outputs.subnet_ids
  kms_key_id     = data.terraform_remote_state.security.outputs.kms_key_id
  sa_email       = data.terraform_remote_state.security.outputs.app_sa_email
}
```

---

## Cost Optimization

### Budget Alerts

```hcl
# budgets.tf
# Billing budget alerts per project

resource "google_billing_budget" "project" {
  billing_account = var.billing_account_id
  display_name    = "${var.project_id} Monthly Budget"

  budget_filter {
    projects               = ["projects/${data.google_project.current.number}"]
    credit_types_treatment = "EXCLUDE_ALL_CREDITS"
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = var.monthly_budget
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.2
    spend_basis       = "FORECASTED_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [
      google_monitoring_notification_channel.email.id,
    ]
    disable_default_iam_recipients = false
  }
}
```

### Committed Use Discounts

```hcl
# commitments.tf
# Committed use discounts for predictable workloads

resource "google_compute_region_commitment" "cpu_commitment" {
  name     = "${local.name_prefix}-cud-cpu"
  region   = var.region
  project  = var.project_id
  plan     = "THIRTY_SIX_MONTH"
  category = "MACHINE"
  type     = "GENERAL_PURPOSE_E2"

  resources {
    type   = "VCPU"
    amount = var.committed_vcpus
  }

  resources {
    type   = "MEMORY"
    amount = var.committed_memory_gb
  }
}
```

### Resource Right-Sizing Recommendations

```hcl
# recommender.tf
# Export right-sizing recommendations for analysis

data "google_compute_instance" "all" {
  for_each = toset(var.instance_names)
  name     = each.value
  zone     = var.zone
  project  = var.project_id
}

# Query Recommender API via gcloud for right-sizing
# Run as a scheduled Cloud Function or CI/CD job
#
# gcloud recommender recommendations list \
#   --project="${PROJECT_ID}" \
#   --location="${ZONE}" \
#   --recommender=google.compute.instance.MachineTypeRecommender \
#   --format="json" |
#   jq '.[] | {
#     instance: .content.operationGroups[0].operations[0].resource,
#     current: .content.operationGroups[0].operations[0].valueMatcher.matchesPattern,
#     recommended: .content.operationGroups[0].operations[0].value,
#     savings: .primaryImpact.costProjection.cost
#   }'
```

### Preemptible and Spot VMs

```hcl
# spot-vms.tf
# Use Spot VMs for fault-tolerant workloads

resource "google_container_node_pool" "spot" {
  name     = "spot-pool"
  cluster  = google_container_cluster.primary.id
  location = var.region

  autoscaling {
    min_node_count = 0
    max_node_count = 20
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type = "e2-standard-4"
    spot         = true

    labels = merge(local.common_labels, {
      node-pool = "spot"
      preemptible = "true"
    })

    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    service_account = google_service_account.gke_nodes.email
  }
}
```

### Storage Cost Optimization

```hcl
# storage-optimization.tf
# Autoclass and lifecycle policies for cost-efficient storage

resource "google_storage_bucket" "archive" {
  name          = "${var.project_id}-archive-${var.region}"
  location      = var.region
  project       = var.project_id
  storage_class = "STANDARD"

  labels = merge(local.common_labels, {
    purpose = "archive"
  })

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  # Autoclass automatically transitions objects between storage classes
  autoclass {
    enabled                = true
    terminal_storage_class = "ARCHIVE"
  }

  versioning {
    enabled = false
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 2555 # 7 years
    }
  }
}

# BigQuery cost controls
resource "google_bigquery_reservation" "default" {
  count = var.environment == "prod" ? 1 : 0

  name              = "${var.workload}-bq-reservation"
  project           = var.project_id
  location          = var.region
  slot_capacity     = var.bq_slot_capacity
  edition           = "STANDARD"
  ignore_idle_slots = false
}
```

---

## Terragrunt Patterns

### Environment Configuration

```hcl
# terragrunt/terragrunt.hcl
# Root configuration for GCP multi-environment deployment

locals {
  org_prefix      = "acme"
  billing_account = "012345-6789AB-CDEF01"

  # Parse environment from directory path
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  environment = local.env_vars.locals.environment
  region      = local.env_vars.locals.region
  project_id  = local.env_vars.locals.project_id
}

# Generate GCS backend configuration
remote_state {
  backend = "gcs"
  config = {
    project  = "${local.org_prefix}-terraform-admin"
    location = local.region
    bucket   = "${local.org_prefix}-terraform-state-${local.environment}"
    prefix   = "${path_relative_to_include()}/terraform.tfstate"
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

# Generate provider configuration
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<-EOF
    provider "google" {
      project = "${local.project_id}"
      region  = "${local.region}"

      default_labels = {
        environment = "${local.environment}"
        managed-by  = "terraform"
        org         = "${local.org_prefix}"
      }
    }

    provider "google-beta" {
      project = "${local.project_id}"
      region  = "${local.region}"

      default_labels = {
        environment = "${local.environment}"
        managed-by  = "terraform"
        org         = "${local.org_prefix}"
      }
    }
  EOF
}

# Common inputs for all modules
inputs = {
  org_prefix      = local.org_prefix
  project_id      = local.project_id
  environment     = local.environment
  region          = local.region
  billing_account = local.billing_account
}
```

### Per-Environment Configuration

```hcl
# terragrunt/environments/prod/env.hcl
# Production environment variables

locals {
  environment = "prod"
  region      = "us-central1"
  project_id  = "acme-app-prod"

  # Production sizing
  gke_machine_type = "e2-standard-4"
  gke_min_nodes    = 3
  gke_max_nodes    = 20
  sql_tier         = "db-custom-4-16384"
  redis_memory_gb  = 4
}
```

```hcl
# terragrunt/environments/dev/env.hcl
# Development environment variables

locals {
  environment = "dev"
  region      = "us-central1"
  project_id  = "acme-app-dev"

  # Development sizing (cost optimized)
  gke_machine_type = "e2-medium"
  gke_min_nodes    = 1
  gke_max_nodes    = 3
  sql_tier         = "db-f1-micro"
  redis_memory_gb  = 1
}
```

### Module Dependencies

```hcl
# terragrunt/environments/prod/networking/terragrunt.hcl
# VPC networking module

terraform {
  source = "../../../../modules//networking"
}

include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path   = find_in_parent_folders("env.hcl")
  expose = true
}

inputs = {
  vpc_cidr              = "10.0.0.0/16"
  private_subnet_cidr   = "10.0.1.0/24"
  gke_subnet_cidr       = "10.0.2.0/24"
  gke_pods_cidr         = "10.1.0.0/16"
  gke_services_cidr     = "10.2.0.0/20"
  serverless_connector_cidr = "10.0.10.0/28"
}
```

```hcl
# terragrunt/environments/prod/gke/terragrunt.hcl
# GKE cluster with dependency on networking

terraform {
  source = "../../../../modules//gke"
}

include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path   = find_in_parent_folders("env.hcl")
  expose = true
}

dependency "networking" {
  config_path = "../networking"
}

dependency "security" {
  config_path = "../security"
}

inputs = {
  # From networking
  vpc_id         = dependency.networking.outputs.vpc_id
  gke_subnet_id  = dependency.networking.outputs.gke_subnet_id
  gke_master_cidr = "172.16.0.0/28"

  # From security
  kms_key_id = dependency.security.outputs.kms_key_id

  # Environment-specific sizing
  machine_type = include.env.locals.gke_machine_type
  min_nodes    = include.env.locals.gke_min_nodes
  max_nodes    = include.env.locals.gke_max_nodes
}
```

```hcl
# terragrunt/environments/prod/database/terragrunt.hcl
# Cloud SQL with dependency on networking and security

terraform {
  source = "../../../../modules//database"
}

include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path   = find_in_parent_folders("env.hcl")
  expose = true
}

dependency "networking" {
  config_path = "../networking"
}

dependency "security" {
  config_path = "../security"
}

dependency "monitoring" {
  config_path = "../monitoring"
}

inputs = {
  # Networking
  vpc_id    = dependency.networking.outputs.vpc_id
  subnet_id = dependency.networking.outputs.private_subnet_id

  # Security
  kms_key_id = dependency.security.outputs.kms_key_id

  # Monitoring
  notification_channel_id = dependency.monitoring.outputs.notification_channel_id

  # Production sizing
  sql_tier      = include.env.locals.sql_tier
  sql_disk_size = 100
}
```

---

## References

### Official Documentation

- [Google Cloud Architecture Center](https://cloud.google.com/architecture)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [Google Cloud Well-Architected Framework](https://cloud.google.com/architecture/framework)
- [Google Cloud Landing Zones](https://cloud.google.com/architecture/landing-zones)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

### Related Guides

- [Terraform Style Guide](../02_language_guides/terraform.md)
- [Terragrunt Style Guide](../02_language_guides/terragrunt.md)
- [Kubernetes Style Guide](../02_language_guides/kubernetes.md)
- [GitHub Actions Guide](../02_language_guides/github_actions.md)
- [Azure Best Practices Guide](azure.md)
