---
title: "Microsoft Azure Best Practices Guide"
description: "Comprehensive Azure cloud provider best practices for infrastructure as code, security, networking, and cost optimization"
author: "Tyler Dukes"
tags: [azure, cloud, terraform, iac, security, networking, aks, entra-id]
category: "Cloud Providers"
status: "active"
search_keywords: [azure, microsoft, cloud provider, infrastructure, arm, bicep, security]
---

## Overview

**Microsoft Azure** is a comprehensive cloud computing platform providing infrastructure, platform, and
software services. This guide covers Azure-specific patterns, security standards, and infrastructure
best practices optimized for Terraform and Terragrunt deployments.

### Key Characteristics

- **Global Presence**: 60+ regions worldwide
- **Hybrid Capabilities**: Strong integration with on-premises via Azure Arc
- **Enterprise Focus**: Deep Microsoft ecosystem integration (Active Directory, Office 365)
- **Compliance**: 100+ compliance certifications

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Resource Naming** | | | |
| Format | `{prefix}-{workload}-{env}-{region}-{instance}` | `rg-webapp-prod-eastus-001` | Max 63 chars for most resources |
| Resource Groups | `rg-{workload}-{env}-{region}` | `rg-api-prod-eastus` | Lowercase, hyphens |
| Storage Accounts | `st{workload}{env}{region}{instance}` | `stlogsproeastus001` | 3-24 chars, no hyphens |
| Key Vaults | `kv-{workload}-{env}-{region}` | `kv-webapp-prod-eastus` | 3-24 chars |
| Virtual Networks | `vnet-{workload}-{env}-{region}` | `vnet-hub-prod-eastus` | Descriptive purpose |
| **Tagging** | | | |
| Required Tags | `Environment`, `Owner`, `CostCenter`, `Project` | See examples below | Enforce via Azure Policy |
| **Terraform** | | | |
| Provider Version | `~> 4.0` | `version = "~> 4.0"` | Pin major version |
| State Backend | Azure Storage | `azurerm` backend | Enable versioning |
| **Security** | | | |
| Authentication | Managed Identity | System or User-assigned | No service principal secrets |
| Secrets | Key Vault | `azurerm_key_vault_secret` | Never in code or state |
| Network | NSG + Private Endpoints | Defense in depth | No public endpoints |

---

## Azure Resource Hierarchy

### Management Group Structure

```hcl
# management-groups.tf
# Establishes organizational hierarchy for governance

resource "azurerm_management_group" "root" {
  display_name = "Contoso"
  name         = "contoso-root"
}

resource "azurerm_management_group" "platform" {
  display_name               = "Platform"
  name                       = "contoso-platform"
  parent_management_group_id = azurerm_management_group.root.id
}

resource "azurerm_management_group" "landing_zones" {
  display_name               = "Landing Zones"
  name                       = "contoso-landing-zones"
  parent_management_group_id = azurerm_management_group.root.id
}

resource "azurerm_management_group" "production" {
  display_name               = "Production"
  name                       = "contoso-prod"
  parent_management_group_id = azurerm_management_group.landing_zones.id
}

resource "azurerm_management_group" "development" {
  display_name               = "Development"
  name                       = "contoso-dev"
  parent_management_group_id = azurerm_management_group.landing_zones.id
}

resource "azurerm_management_group" "sandbox" {
  display_name               = "Sandbox"
  name                       = "contoso-sandbox"
  parent_management_group_id = azurerm_management_group.root.id
}
```

### Subscription Organization

```hcl
# subscriptions.tf
# Data sources for subscription references in multi-subscription deployment

data "azurerm_subscription" "connectivity" {
  subscription_id = var.connectivity_subscription_id
}

data "azurerm_subscription" "identity" {
  subscription_id = var.identity_subscription_id
}

data "azurerm_subscription" "management" {
  subscription_id = var.management_subscription_id
}

# Associate subscriptions with management groups
resource "azurerm_management_group_subscription_association" "connectivity" {
  management_group_id = azurerm_management_group.platform.id
  subscription_id     = data.azurerm_subscription.connectivity.id
}

resource "azurerm_management_group_subscription_association" "identity" {
  management_group_id = azurerm_management_group.platform.id
  subscription_id     = data.azurerm_subscription.identity.id
}

resource "azurerm_management_group_subscription_association" "management" {
  management_group_id = azurerm_management_group.platform.id
  subscription_id     = data.azurerm_subscription.management.id
}
```

---

## Resource Naming Conventions

### Naming Module

```hcl
# modules/naming/main.tf
# Centralized naming convention module

variable "workload" {
  description = "Workload or application name"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9]{2,19}$", var.workload))
    error_message = "Workload must be lowercase alphanumeric, 3-20 characters."
  }
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "region" {
  description = "Azure region short code"
  type        = string
  default     = "eastus"
}

variable "instance" {
  description = "Instance number for uniqueness"
  type        = string
  default     = "001"
}

locals {
  # Short environment codes for resource naming
  env_short = {
    dev     = "d"
    staging = "s"
    prod    = "p"
  }

  # Region short codes
  region_short = {
    eastus         = "eus"
    eastus2        = "eus2"
    westus         = "wus"
    westus2        = "wus2"
    westus3        = "wus3"
    centralus      = "cus"
    northeurope    = "neu"
    westeurope     = "weu"
    uksouth        = "uks"
    ukwest         = "ukw"
    southeastasia  = "sea"
    australiaeast  = "aue"
  }

  # Base naming components
  base_name = "${var.workload}-${var.environment}-${local.region_short[var.region]}"

  # Resource-specific names following Azure conventions
  names = {
    # Resource Group: rg-{workload}-{env}-{region}
    resource_group = "rg-${local.base_name}"

    # Virtual Network: vnet-{workload}-{env}-{region}
    virtual_network = "vnet-${local.base_name}"

    # Subnet: snet-{purpose}-{workload}-{env}-{region}
    subnet_prefix = "snet"

    # Network Security Group: nsg-{purpose}-{workload}-{env}-{region}
    nsg_prefix = "nsg"

    # Storage Account: st{workload}{env}{region}{instance} (no hyphens, max 24)
    storage_account = "st${var.workload}${local.env_short[var.environment]}${local.region_short[var.region]}${var.instance}"

    # Key Vault: kv-{workload}-{env}-{region} (max 24)
    key_vault = "kv-${substr(local.base_name, 0, 21)}"

    # App Service Plan: asp-{workload}-{env}-{region}
    app_service_plan = "asp-${local.base_name}"

    # App Service: app-{workload}-{env}-{region}
    app_service = "app-${local.base_name}"

    # Function App: func-{workload}-{env}-{region}
    function_app = "func-${local.base_name}"

    # Azure Kubernetes Service: aks-{workload}-{env}-{region}
    aks_cluster = "aks-${local.base_name}"

    # Container Registry: cr{workload}{env}{region} (no hyphens)
    container_registry = "cr${var.workload}${local.env_short[var.environment]}${local.region_short[var.region]}"

    # SQL Server: sql-{workload}-{env}-{region}
    sql_server = "sql-${local.base_name}"

    # SQL Database: sqldb-{workload}-{env}-{region}
    sql_database = "sqldb-${local.base_name}"

    # Cosmos DB: cosmos-{workload}-{env}-{region}
    cosmos_db = "cosmos-${local.base_name}"

    # Log Analytics Workspace: log-{workload}-{env}-{region}
    log_analytics = "log-${local.base_name}"

    # Application Insights: appi-{workload}-{env}-{region}
    app_insights = "appi-${local.base_name}"

    # Public IP: pip-{purpose}-{workload}-{env}-{region}
    public_ip_prefix = "pip"

    # Load Balancer: lb-{workload}-{env}-{region}
    load_balancer = "lb-${local.base_name}"

    # Application Gateway: agw-{workload}-{env}-{region}
    app_gateway = "agw-${local.base_name}"

    # Private Endpoint: pep-{service}-{workload}-{env}-{region}
    private_endpoint_prefix = "pep"

    # Managed Identity: id-{workload}-{env}-{region}
    managed_identity = "id-${local.base_name}"
  }
}

output "names" {
  description = "Map of resource names"
  value       = local.names
}

output "base_name" {
  description = "Base name for custom resource naming"
  value       = local.base_name
}

output "tags" {
  description = "Standard tags for all resources"
  value = {
    Environment = var.environment
    Workload    = var.workload
    Region      = var.region
    ManagedBy   = "terraform"
  }
}
```

### Using the Naming Module

```hcl
# main.tf
# Example usage of the naming module

module "naming" {
  source = "./modules/naming"

  workload    = "webapp"
  environment = "prod"
  region      = "eastus"
  instance    = "001"
}

resource "azurerm_resource_group" "main" {
  name     = module.naming.names.resource_group
  location = var.location
  tags     = module.naming.tags
}

resource "azurerm_storage_account" "main" {
  name                     = module.naming.names.storage_account
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  tags                     = module.naming.tags
}

resource "azurerm_key_vault" "main" {
  name                = module.naming.names.key_vault
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
  tags                = module.naming.tags
}
```

---

## Tagging Standards

### Required Tags Policy

```hcl
# policies/required-tags.tf
# Azure Policy to enforce required tags on all resources

resource "azurerm_policy_definition" "require_tags" {
  name         = "require-resource-tags"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Require specified tags on resources"
  description  = "Enforces required tags on all resources for governance and cost management"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Tags"
  })

  parameters = jsonencode({
    tagName = {
      type = "String"
      metadata = {
        displayName = "Tag Name"
        description = "Name of the tag to require"
      }
    }
  })

  policy_rule = jsonencode({
    if = {
      field = "[concat('tags[', parameters('tagName'), ']')]"
      exists = "false"
    }
    then = {
      effect = "deny"
    }
  })
}

# Policy initiative (policy set) for all required tags
resource "azurerm_policy_set_definition" "required_tags" {
  name         = "required-tags-initiative"
  policy_type  = "Custom"
  display_name = "Required Tags Initiative"
  description  = "Ensures all required tags are present on resources"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Tags"
  })

  policy_definition_reference {
    policy_definition_id = azurerm_policy_definition.require_tags.id
    parameter_values = jsonencode({
      tagName = { value = "Environment" }
    })
  }

  policy_definition_reference {
    policy_definition_id = azurerm_policy_definition.require_tags.id
    parameter_values = jsonencode({
      tagName = { value = "Owner" }
    })
  }

  policy_definition_reference {
    policy_definition_id = azurerm_policy_definition.require_tags.id
    parameter_values = jsonencode({
      tagName = { value = "CostCenter" }
    })
  }

  policy_definition_reference {
    policy_definition_id = azurerm_policy_definition.require_tags.id
    parameter_values = jsonencode({
      tagName = { value = "Project" }
    })
  }
}

# Assign the initiative to a management group
resource "azurerm_management_group_policy_assignment" "required_tags" {
  name                 = "required-tags"
  management_group_id  = azurerm_management_group.landing_zones.id
  policy_definition_id = azurerm_policy_set_definition.required_tags.id
  description          = "Enforce required tags on all landing zone resources"
  display_name         = "Require Tags on Resources"
  enforce              = true
}
```

### Tag Inheritance Policy

```hcl
# policies/inherit-tags.tf
# Automatically inherit tags from resource group to resources

resource "azurerm_policy_definition" "inherit_tag" {
  name         = "inherit-tag-from-rg"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Inherit tag from resource group"
  description  = "Automatically copies specified tag from resource group to resources"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Tags"
  })

  parameters = jsonencode({
    tagName = {
      type = "String"
      metadata = {
        displayName = "Tag Name"
        description = "Name of the tag to inherit from resource group"
      }
    }
  })

  policy_rule = jsonencode({
    if = {
      allOf = [
        {
          field  = "[concat('tags[', parameters('tagName'), ']')]"
          exists = "false"
        },
        {
          value  = "[resourceGroup().tags[parameters('tagName')]]"
          notEquals = ""
        }
      ]
    }
    then = {
      effect = "modify"
      details = {
        roleDefinitionIds = [
          "/providers/microsoft.authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
        ]
        operations = [
          {
            operation = "add"
            field     = "[concat('tags[', parameters('tagName'), ']')]"
            value     = "[resourceGroup().tags[parameters('tagName')]]"
          }
        ]
      }
    }
  })
}
```

---

## Identity & Access Management

### Managed Identity Configuration

```hcl
# identity/managed-identity.tf
# User-assigned managed identity for workloads

resource "azurerm_user_assigned_identity" "workload" {
  name                = module.naming.names.managed_identity
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = module.naming.tags
}

# Federated identity credential for GitHub Actions OIDC
resource "azurerm_federated_identity_credential" "github_actions" {
  name                = "github-actions-oidc"
  resource_group_name = azurerm_resource_group.main.name
  parent_id           = azurerm_user_assigned_identity.workload.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  subject             = "repo:${var.github_org}/${var.github_repo}:environment:${var.environment}"
}

# System-assigned identity example with Key Vault access
resource "azurerm_linux_web_app" "api" {
  name                = module.naming.names.app_service
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }

  app_settings = {
    "KEY_VAULT_URI" = azurerm_key_vault.main.vault_uri
  }

  tags = module.naming.tags
}

# Grant the app's managed identity access to Key Vault
resource "azurerm_key_vault_access_policy" "app_secrets" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.api.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}
```

### RBAC Role Assignments

```hcl
# identity/rbac.tf
# Role-Based Access Control patterns

# Custom role definition for application operators
resource "azurerm_role_definition" "app_operator" {
  name        = "Application Operator"
  scope       = azurerm_resource_group.main.id
  description = "Can manage application resources but not modify networking or security"

  permissions {
    actions = [
      "Microsoft.Web/sites/*",
      "Microsoft.Web/serverfarms/read",
      "Microsoft.Insights/components/*",
      "Microsoft.Insights/alertRules/*",
      "Microsoft.Resources/subscriptions/resourceGroups/read",
      "Microsoft.Support/*"
    ]
    not_actions = [
      "Microsoft.Web/sites/config/write",
      "Microsoft.Web/sites/publishxml/action"
    ]
    data_actions     = []
    not_data_actions = []
  }

  assignable_scopes = [
    azurerm_resource_group.main.id
  ]
}

# Assign built-in role to a group
resource "azurerm_role_assignment" "contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = var.developer_group_object_id
}

# Assign custom role to managed identity
resource "azurerm_role_assignment" "app_operator" {
  scope              = azurerm_resource_group.main.id
  role_definition_id = azurerm_role_definition.app_operator.role_definition_resource_id
  principal_id       = azurerm_user_assigned_identity.workload.principal_id
}

# Key Vault Secrets User role for reading secrets
resource "azurerm_role_assignment" "keyvault_secrets" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}

# Storage Blob Data Contributor for application data access
resource "azurerm_role_assignment" "storage_blob" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}
```

### Conditional Access (Entra ID)

```hcl
# identity/conditional-access.tf
# Conditional Access policies for Entra ID (requires Microsoft Graph provider)

terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
  }
}

# Named location for trusted corporate network
resource "azuread_named_location" "corporate" {
  display_name = "Corporate Network"
  ip {
    ip_ranges = var.corporate_ip_ranges
    trusted   = true
  }
}

# Conditional access policy requiring MFA for admins
resource "azuread_conditional_access_policy" "require_mfa_admins" {
  display_name = "Require MFA for Administrators"
  state        = "enabled"

  conditions {
    users {
      included_roles = [
        "62e90394-69f5-4237-9190-012177145e10", # Global Administrator
        "f28a1f50-f6e7-4571-818b-6a12f2af6b6c", # SharePoint Administrator
        "29232cdf-9323-42fd-ade2-1d097af3e4de", # Exchange Administrator
        "fe930be7-5e62-47db-91af-98c3a49a38b1", # User Administrator
      ]
      excluded_users = []
    }

    applications {
      included_applications = ["All"]
    }

    client_app_types = ["all"]

    locations {
      included_locations = ["All"]
      excluded_locations = [azuread_named_location.corporate.id]
    }
  }

  grant_controls {
    operator          = "OR"
    built_in_controls = ["mfa"]
  }
}

# Block legacy authentication
resource "azuread_conditional_access_policy" "block_legacy_auth" {
  display_name = "Block Legacy Authentication"
  state        = "enabled"

  conditions {
    users {
      included_users = ["All"]
    }

    applications {
      included_applications = ["All"]
    }

    client_app_types = [
      "exchangeActiveSync",
      "other"
    ]
  }

  grant_controls {
    operator          = "OR"
    built_in_controls = ["block"]
  }
}
```

---

## Networking

### Hub-and-Spoke Topology

```hcl
# networking/hub-vnet.tf
# Hub virtual network with shared services

resource "azurerm_virtual_network" "hub" {
  name                = "vnet-hub-${var.environment}-${var.region}"
  location            = var.location
  resource_group_name = azurerm_resource_group.connectivity.name
  address_space       = [var.hub_vnet_cidr]

  tags = merge(module.naming.tags, {
    NetworkType = "hub"
  })
}

# Gateway subnet for VPN/ExpressRoute
resource "azurerm_subnet" "gateway" {
  name                 = "GatewaySubnet"
  resource_group_name  = azurerm_resource_group.connectivity.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [cidrsubnet(var.hub_vnet_cidr, 3, 0)]
}

# Azure Firewall subnet
resource "azurerm_subnet" "firewall" {
  name                 = "AzureFirewallSubnet"
  resource_group_name  = azurerm_resource_group.connectivity.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [cidrsubnet(var.hub_vnet_cidr, 3, 1)]
}

# Azure Bastion subnet
resource "azurerm_subnet" "bastion" {
  name                 = "AzureBastionSubnet"
  resource_group_name  = azurerm_resource_group.connectivity.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [cidrsubnet(var.hub_vnet_cidr, 3, 2)]
}

# Shared services subnet (DNS, domain controllers, etc.)
resource "azurerm_subnet" "shared_services" {
  name                 = "snet-shared-services"
  resource_group_name  = azurerm_resource_group.connectivity.name
  virtual_network_name = azurerm_virtual_network.hub.name
  address_prefixes     = [cidrsubnet(var.hub_vnet_cidr, 3, 3)]
}

# Azure Firewall
resource "azurerm_public_ip" "firewall" {
  name                = "pip-fw-hub-${var.environment}-${var.region}"
  location            = var.location
  resource_group_name = azurerm_resource_group.connectivity.name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]

  tags = module.naming.tags
}

resource "azurerm_firewall" "hub" {
  name                = "fw-hub-${var.environment}-${var.region}"
  location            = var.location
  resource_group_name = azurerm_resource_group.connectivity.name
  sku_name            = "AZFW_VNet"
  sku_tier            = "Standard"
  firewall_policy_id  = azurerm_firewall_policy.hub.id
  zones               = ["1", "2", "3"]

  ip_configuration {
    name                 = "configuration"
    subnet_id            = azurerm_subnet.firewall.id
    public_ip_address_id = azurerm_public_ip.firewall.id
  }

  tags = module.naming.tags
}

# Firewall policy
resource "azurerm_firewall_policy" "hub" {
  name                = "fwpol-hub-${var.environment}-${var.region}"
  location            = var.location
  resource_group_name = azurerm_resource_group.connectivity.name

  dns {
    proxy_enabled = true
  }

  threat_intelligence_mode = "Alert"

  tags = module.naming.tags
}

# Firewall policy rule collection group
resource "azurerm_firewall_policy_rule_collection_group" "application" {
  name               = "rcg-application-rules"
  firewall_policy_id = azurerm_firewall_policy.hub.id
  priority           = 500

  application_rule_collection {
    name     = "allow-azure-services"
    priority = 100
    action   = "Allow"

    rule {
      name = "allow-azure-management"
      protocols {
        type = "Https"
        port = 443
      }
      source_addresses  = ["*"]
      destination_fqdns = [
        "management.azure.com",
        "login.microsoftonline.com",
        "graph.microsoft.com",
        "*.vault.azure.net"
      ]
    }

    rule {
      name = "allow-azure-monitor"
      protocols {
        type = "Https"
        port = 443
      }
      source_addresses  = ["*"]
      destination_fqdns = [
        "*.ods.opinsights.azure.com",
        "*.oms.opinsights.azure.com",
        "*.monitoring.azure.com"
      ]
    }
  }

  network_rule_collection {
    name     = "allow-infrastructure"
    priority = 200
    action   = "Allow"

    rule {
      name                  = "allow-dns"
      protocols             = ["UDP", "TCP"]
      source_addresses      = ["*"]
      destination_addresses = ["168.63.129.16"]
      destination_ports     = ["53"]
    }

    rule {
      name                  = "allow-ntp"
      protocols             = ["UDP"]
      source_addresses      = ["*"]
      destination_addresses = ["*"]
      destination_ports     = ["123"]
    }
  }
}
```

### Spoke Virtual Network

```hcl
# networking/spoke-vnet.tf
# Spoke virtual network for workloads

resource "azurerm_virtual_network" "spoke" {
  name                = module.naming.names.virtual_network
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = [var.spoke_vnet_cidr]

  tags = merge(module.naming.tags, {
    NetworkType = "spoke"
  })
}

# Application tier subnet
resource "azurerm_subnet" "app" {
  name                 = "snet-app-${module.naming.base_name}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = [cidrsubnet(var.spoke_vnet_cidr, 2, 0)]

  delegation {
    name = "app-service-delegation"
    service_delegation {
      name = "Microsoft.Web/serverFarms"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/action"
      ]
    }
  }
}

# Data tier subnet
resource "azurerm_subnet" "data" {
  name                 = "snet-data-${module.naming.base_name}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = [cidrsubnet(var.spoke_vnet_cidr, 2, 1)]

  private_endpoint_network_policies = "Disabled"
}

# AKS subnet
resource "azurerm_subnet" "aks" {
  name                 = "snet-aks-${module.naming.base_name}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = [cidrsubnet(var.spoke_vnet_cidr, 2, 2)]
}

# VNet peering from spoke to hub
resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                         = "peer-to-hub"
  resource_group_name          = azurerm_resource_group.main.name
  virtual_network_name         = azurerm_virtual_network.spoke.name
  remote_virtual_network_id    = azurerm_virtual_network.hub.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = false
  use_remote_gateways          = true
}

# VNet peering from hub to spoke
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  name                         = "peer-to-${var.workload}"
  resource_group_name          = azurerm_resource_group.connectivity.name
  virtual_network_name         = azurerm_virtual_network.hub.name
  remote_virtual_network_id    = azurerm_virtual_network.spoke.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = true
  use_remote_gateways          = false
}
```

### Network Security Groups

```hcl
# networking/nsg.tf
# Network Security Groups with application security groups

# Application Security Groups for logical grouping
resource "azurerm_application_security_group" "web" {
  name                = "asg-web-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = module.naming.tags
}

resource "azurerm_application_security_group" "api" {
  name                = "asg-api-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = module.naming.tags
}

resource "azurerm_application_security_group" "db" {
  name                = "asg-db-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = module.naming.tags
}

# NSG for application subnet
resource "azurerm_network_security_group" "app" {
  name                = "nsg-app-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name

  # Allow HTTPS from Application Gateway
  security_rule {
    name                       = "allow-https-from-agw"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "GatewayManager"
    destination_address_prefix = "*"
  }

  # Allow Azure Load Balancer health probes
  security_rule {
    name                       = "allow-lb-probes"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  # Allow web tier to API tier
  security_rule {
    name                                       = "allow-web-to-api"
    priority                                   = 200
    direction                                  = "Inbound"
    access                                     = "Allow"
    protocol                                   = "Tcp"
    source_port_range                          = "*"
    destination_port_range                     = "8080"
    source_application_security_group_ids      = [azurerm_application_security_group.web.id]
    destination_application_security_group_ids = [azurerm_application_security_group.api.id]
  }

  # Deny all other inbound traffic
  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = module.naming.tags
}

# NSG for data subnet
resource "azurerm_network_security_group" "data" {
  name                = "nsg-data-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name

  # Allow API tier to database
  security_rule {
    name                                       = "allow-api-to-db"
    priority                                   = 100
    direction                                  = "Inbound"
    access                                     = "Allow"
    protocol                                   = "Tcp"
    source_port_range                          = "*"
    destination_port_ranges                    = ["1433", "5432", "3306"]
    source_application_security_group_ids      = [azurerm_application_security_group.api.id]
    destination_application_security_group_ids = [azurerm_application_security_group.db.id]
  }

  # Deny all other inbound traffic
  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = module.naming.tags
}

# Associate NSGs with subnets
resource "azurerm_subnet_network_security_group_association" "app" {
  subnet_id                 = azurerm_subnet.app.id
  network_security_group_id = azurerm_network_security_group.app.id
}

resource "azurerm_subnet_network_security_group_association" "data" {
  subnet_id                 = azurerm_subnet.data.id
  network_security_group_id = azurerm_network_security_group.data.id
}
```

### Private Endpoints

```hcl
# networking/private-endpoints.tf
# Private endpoints for Azure PaaS services

# Private DNS Zone for Key Vault
resource "azurerm_private_dns_zone" "keyvault" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = azurerm_resource_group.connectivity.name
  tags                = module.naming.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "keyvault_hub" {
  name                  = "link-hub"
  resource_group_name   = azurerm_resource_group.connectivity.name
  private_dns_zone_name = azurerm_private_dns_zone.keyvault.name
  virtual_network_id    = azurerm_virtual_network.hub.id
  registration_enabled  = false
}

resource "azurerm_private_dns_zone_virtual_network_link" "keyvault_spoke" {
  name                  = "link-${var.workload}"
  resource_group_name   = azurerm_resource_group.connectivity.name
  private_dns_zone_name = azurerm_private_dns_zone.keyvault.name
  virtual_network_id    = azurerm_virtual_network.spoke.id
  registration_enabled  = false
}

# Private endpoint for Key Vault
resource "azurerm_private_endpoint" "keyvault" {
  name                = "pep-kv-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.data.id

  private_service_connection {
    name                           = "psc-kv-${module.naming.base_name}"
    private_connection_resource_id = azurerm_key_vault.main.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.keyvault.id]
  }

  tags = module.naming.tags
}

# Private DNS Zone for Storage Blob
resource "azurerm_private_dns_zone" "storage_blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.connectivity.name
  tags                = module.naming.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage_blob_hub" {
  name                  = "link-hub"
  resource_group_name   = azurerm_resource_group.connectivity.name
  private_dns_zone_name = azurerm_private_dns_zone.storage_blob.name
  virtual_network_id    = azurerm_virtual_network.hub.id
  registration_enabled  = false
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage_blob_spoke" {
  name                  = "link-${var.workload}"
  resource_group_name   = azurerm_resource_group.connectivity.name
  private_dns_zone_name = azurerm_private_dns_zone.storage_blob.name
  virtual_network_id    = azurerm_virtual_network.spoke.id
  registration_enabled  = false
}

# Private endpoint for Storage Account
resource "azurerm_private_endpoint" "storage" {
  name                = "pep-st-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.data.id

  private_service_connection {
    name                           = "psc-st-${module.naming.base_name}"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.storage_blob.id]
  }

  tags = module.naming.tags
}

# Private DNS Zone for Azure SQL
resource "azurerm_private_dns_zone" "sql" {
  name                = "privatelink.database.windows.net"
  resource_group_name = azurerm_resource_group.connectivity.name
  tags                = module.naming.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "sql_hub" {
  name                  = "link-hub"
  resource_group_name   = azurerm_resource_group.connectivity.name
  private_dns_zone_name = azurerm_private_dns_zone.sql.name
  virtual_network_id    = azurerm_virtual_network.hub.id
  registration_enabled  = false
}

resource "azurerm_private_dns_zone_virtual_network_link" "sql_spoke" {
  name                  = "link-${var.workload}"
  resource_group_name   = azurerm_resource_group.connectivity.name
  private_dns_zone_name = azurerm_private_dns_zone.sql.name
  virtual_network_id    = azurerm_virtual_network.spoke.id
  registration_enabled  = false
}

# Private endpoint for Azure SQL
resource "azurerm_private_endpoint" "sql" {
  name                = "pep-sql-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.data.id

  private_service_connection {
    name                           = "psc-sql-${module.naming.base_name}"
    private_connection_resource_id = azurerm_mssql_server.main.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.sql.id]
  }

  tags = module.naming.tags
}
```

---

## Security & Compliance

### Key Vault Configuration

```hcl
# security/key-vault.tf
# Secure Key Vault configuration

resource "azurerm_key_vault" "main" {
  name                = module.naming.names.key_vault
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Security settings
  enabled_for_disk_encryption     = true
  enabled_for_deployment          = false
  enabled_for_template_deployment = false
  enable_rbac_authorization       = true
  purge_protection_enabled        = true
  soft_delete_retention_days      = 90

  # Network access - private endpoint only
  public_network_access_enabled = false

  network_acls {
    default_action             = "Deny"
    bypass                     = "AzureServices"
    ip_rules                   = []
    virtual_network_subnet_ids = []
  }

  tags = module.naming.tags
}

# Diagnostic settings for Key Vault
resource "azurerm_monitor_diagnostic_setting" "keyvault" {
  name                       = "diag-${module.naming.names.key_vault}"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AuditEvent"
  }

  enabled_log {
    category = "AzurePolicyEvaluationDetails"
  }

  metric {
    category = "AllMetrics"
  }
}

# Key Vault secrets with rotation
resource "azurerm_key_vault_secret" "db_password" {
  name            = "db-admin-password"
  value           = random_password.db_admin.result
  key_vault_id    = azurerm_key_vault.main.id
  content_type    = "password"
  expiration_date = timeadd(timestamp(), "8760h") # 1 year

  tags = {
    Purpose    = "Database admin password"
    AutoRotate = "true"
  }

  depends_on = [azurerm_private_endpoint.keyvault]
}

# Customer-managed key for encryption
resource "azurerm_key_vault_key" "encryption" {
  name         = "cmk-encryption"
  key_vault_id = azurerm_key_vault.main.id
  key_type     = "RSA"
  key_size     = 4096

  key_opts = [
    "decrypt",
    "encrypt",
    "unwrapKey",
    "wrapKey"
  ]

  rotation_policy {
    automatic {
      time_before_expiry = "P30D"
    }
    expire_after         = "P365D"
    notify_before_expiry = "P30D"
  }

  depends_on = [azurerm_private_endpoint.keyvault]
}
```

### Microsoft Defender for Cloud

```hcl
# security/defender.tf
# Microsoft Defender for Cloud configuration

# Enable Defender for Cloud plans
resource "azurerm_security_center_subscription_pricing" "defender_servers" {
  tier          = "Standard"
  resource_type = "VirtualMachines"
  subplan       = "P2"
}

resource "azurerm_security_center_subscription_pricing" "defender_storage" {
  tier          = "Standard"
  resource_type = "StorageAccounts"
  subplan       = "DefenderForStorageV2"
}

resource "azurerm_security_center_subscription_pricing" "defender_sql" {
  tier          = "Standard"
  resource_type = "SqlServers"
}

resource "azurerm_security_center_subscription_pricing" "defender_aks" {
  tier          = "Standard"
  resource_type = "KubernetesService"
}

resource "azurerm_security_center_subscription_pricing" "defender_keyvault" {
  tier          = "Standard"
  resource_type = "KeyVaults"
}

resource "azurerm_security_center_subscription_pricing" "defender_arm" {
  tier          = "Standard"
  resource_type = "Arm"
}

resource "azurerm_security_center_subscription_pricing" "defender_containers" {
  tier          = "Standard"
  resource_type = "Containers"
}

# Auto-provisioning for Log Analytics agent
resource "azurerm_security_center_auto_provisioning" "log_analytics" {
  auto_provision = "On"
}

# Security contact for alerts
resource "azurerm_security_center_contact" "security_team" {
  email               = var.security_contact_email
  phone               = var.security_contact_phone
  alert_notifications = true
  alerts_to_admins    = true
}

# Export security recommendations to Log Analytics
resource "azurerm_security_center_workspace" "main" {
  scope        = "/subscriptions/${data.azurerm_subscription.current.subscription_id}"
  workspace_id = azurerm_log_analytics_workspace.main.id
}
```

### Azure Policy for Security

```hcl
# security/policies.tf
# Security policies for governance

# Policy: Require HTTPS for Storage Accounts
resource "azurerm_policy_definition" "storage_https" {
  name         = "require-storage-https"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Require HTTPS traffic only for storage accounts"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Storage"
  })

  policy_rule = jsonencode({
    if = {
      allOf = [
        {
          field  = "type"
          equals = "Microsoft.Storage/storageAccounts"
        },
        {
          field    = "Microsoft.Storage/storageAccounts/supportsHttpsTrafficOnly"
          notEquals = true
        }
      ]
    }
    then = {
      effect = "deny"
    }
  })
}

# Policy: Require minimum TLS version
resource "azurerm_policy_definition" "tls_version" {
  name         = "require-minimum-tls"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Require minimum TLS 1.2 for storage accounts"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Storage"
  })

  policy_rule = jsonencode({
    if = {
      allOf = [
        {
          field  = "type"
          equals = "Microsoft.Storage/storageAccounts"
        },
        {
          field   = "Microsoft.Storage/storageAccounts/minimumTlsVersion"
          notEquals = "TLS1_2"
        }
      ]
    }
    then = {
      effect = "deny"
    }
  })
}

# Policy: Audit public network access on Key Vault
resource "azurerm_policy_definition" "keyvault_public_access" {
  name         = "audit-keyvault-public-access"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Audit Key Vaults with public network access"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Key Vault"
  })

  policy_rule = jsonencode({
    if = {
      allOf = [
        {
          field  = "type"
          equals = "Microsoft.KeyVault/vaults"
        },
        {
          field    = "Microsoft.KeyVault/vaults/publicNetworkAccess"
          notEquals = "Disabled"
        }
      ]
    }
    then = {
      effect = "audit"
    }
  })
}

# Policy initiative for security baseline
resource "azurerm_policy_set_definition" "security_baseline" {
  name         = "security-baseline"
  policy_type  = "Custom"
  display_name = "Security Baseline for Landing Zones"
  description  = "Security policies for all landing zone subscriptions"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Security"
  })

  policy_definition_reference {
    policy_definition_id = azurerm_policy_definition.storage_https.id
  }

  policy_definition_reference {
    policy_definition_id = azurerm_policy_definition.tls_version.id
  }

  policy_definition_reference {
    policy_definition_id = azurerm_policy_definition.keyvault_public_access.id
  }

  # Built-in: Require encryption on Data Lake Storage Gen2
  policy_definition_reference {
    policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/361c2074-3595-4e5d-8cab-4f21dffc835c"
  }

  # Built-in: Secure transfer to storage accounts should be enabled
  policy_definition_reference {
    policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/404c3081-a854-4457-ae30-26a93ef643f9"
  }

  # Built-in: Key Vault should use a virtual network service endpoint
  policy_definition_reference {
    policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/ea4d6841-2173-4317-9747-ff522a45120f"
  }
}

# Assign security baseline to landing zones
resource "azurerm_management_group_policy_assignment" "security_baseline" {
  name                 = "security-baseline"
  management_group_id  = azurerm_management_group.landing_zones.id
  policy_definition_id = azurerm_policy_set_definition.security_baseline.id
  description          = "Enforce security baseline on all landing zone resources"
  display_name         = "Security Baseline"
  enforce              = true

  identity {
    type = "SystemAssigned"
  }

  location = var.location
}
```

---

## Compute Services

### Azure Kubernetes Service (AKS)

```hcl
# compute/aks.tf
# Production-ready AKS cluster

resource "azurerm_kubernetes_cluster" "main" {
  name                = module.naming.names.aks_cluster
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = var.workload
  kubernetes_version  = var.kubernetes_version

  # Private cluster
  private_cluster_enabled             = true
  private_cluster_public_fqdn_enabled = false
  private_dns_zone_id                 = "System"

  # System node pool
  default_node_pool {
    name                        = "system"
    node_count                  = 3
    vm_size                     = "Standard_D4s_v5"
    vnet_subnet_id              = azurerm_subnet.aks.id
    only_critical_addons_enabled = true
    zones                        = ["1", "2", "3"]

    upgrade_settings {
      drain_timeout_in_minutes      = 0
      max_surge                     = "33%"
      node_soak_duration_in_minutes = 0
    }

    tags = module.naming.tags
  }

  # Managed identity
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.aks.id]
  }

  # Network profile
  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay"
    network_policy      = "azure"
    dns_service_ip      = "10.2.0.10"
    service_cidr        = "10.2.0.0/16"
    load_balancer_sku   = "standard"
    outbound_type       = "userDefinedRouting"
  }

  # Azure AD integration
  azure_active_directory_role_based_access_control {
    azure_rbac_enabled     = true
    admin_group_object_ids = [var.aks_admin_group_object_id]
    tenant_id              = data.azurerm_client_config.current.tenant_id
  }

  # Workload identity
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # Security
  azure_policy_enabled = true
  image_cleaner_enabled = true
  image_cleaner_interval_hours = 24

  # Monitoring
  oms_agent {
    log_analytics_workspace_id      = azurerm_log_analytics_workspace.main.id
    msi_auth_for_monitoring_enabled = true
  }

  microsoft_defender {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  # Key Vault secrets provider
  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }

  # Maintenance window
  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [2, 3, 4]
    }
  }

  maintenance_window_auto_upgrade {
    frequency   = "Weekly"
    interval    = 1
    day_of_week = "Sunday"
    start_time  = "02:00"
    utc_offset  = "+00:00"
    duration    = 4
  }

  auto_scaler_profile {
    balance_similar_node_groups      = true
    expander                         = "least-waste"
    scale_down_delay_after_add       = "10m"
    scale_down_unneeded              = "10m"
    scale_down_utilization_threshold = "0.5"
  }

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count
    ]
  }

  tags = module.naming.tags
}

# User-assigned identity for AKS
resource "azurerm_user_assigned_identity" "aks" {
  name                = "id-aks-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = module.naming.tags
}

# Grant AKS identity permissions
resource "azurerm_role_assignment" "aks_network_contributor" {
  scope                = azurerm_virtual_network.spoke.id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_user_assigned_identity.aks.principal_id
}

# User node pool for workloads
resource "azurerm_kubernetes_cluster_node_pool" "workload" {
  name                  = "workload"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D8s_v5"
  node_count            = 3
  vnet_subnet_id        = azurerm_subnet.aks.id
  zones                 = ["1", "2", "3"]

  auto_scaling_enabled = true
  min_count            = 3
  max_count            = 10

  node_labels = {
    "workload-type" = "application"
  }

  node_taints = []

  upgrade_settings {
    drain_timeout_in_minutes      = 0
    max_surge                     = "33%"
    node_soak_duration_in_minutes = 0
  }

  tags = module.naming.tags
}
```

### Azure App Service

```hcl
# compute/app-service.tf
# Secure App Service configuration

resource "azurerm_service_plan" "main" {
  name                = module.naming.names.app_service_plan
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "P1v3"
  zone_balancing_enabled = true

  tags = module.naming.tags
}

resource "azurerm_linux_web_app" "main" {
  name                = module.naming.names.app_service
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id

  # HTTPS only
  https_only = true

  # VNet integration
  virtual_network_subnet_id = azurerm_subnet.app.id

  # Managed identity
  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                         = true
    ftps_state                        = "Disabled"
    health_check_path                 = "/health"
    health_check_eviction_time_in_min = 10
    http2_enabled                     = true
    minimum_tls_version               = "1.2"
    vnet_route_all_enabled            = true
    worker_count                      = 3

    application_stack {
      python_version = "3.11"
    }

    ip_restriction_default_action = "Deny"

    ip_restriction {
      name       = "AllowApplicationGateway"
      priority   = 100
      action     = "Allow"
      ip_address = azurerm_public_ip.agw.ip_address
    }
  }

  app_settings = {
    "WEBSITE_RUN_FROM_PACKAGE"         = "1"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
    "KEY_VAULT_URI"                    = azurerm_key_vault.main.vault_uri
    "AZURE_CLIENT_ID"                  = "" # Uses managed identity
  }

  sticky_settings {
    app_setting_names = [
      "APPLICATIONINSIGHTS_CONNECTION_STRING"
    ]
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = module.naming.tags
}

# Deployment slots for blue-green deployment
resource "azurerm_linux_web_app_slot" "staging" {
  name           = "staging"
  app_service_id = azurerm_linux_web_app.main.id

  https_only = true
  virtual_network_subnet_id = azurerm_subnet.app.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                         = true
    ftps_state                        = "Disabled"
    health_check_path                 = "/health"
    http2_enabled                     = true
    minimum_tls_version               = "1.2"
    vnet_route_all_enabled            = true

    application_stack {
      python_version = "3.11"
    }
  }

  app_settings = {
    "WEBSITE_RUN_FROM_PACKAGE"         = "1"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
    "KEY_VAULT_URI"                    = azurerm_key_vault.main.vault_uri
  }

  tags = merge(module.naming.tags, {
    Slot = "staging"
  })
}
```

### Azure Functions

```hcl
# compute/functions.tf
# Azure Functions with premium plan

resource "azurerm_service_plan" "functions" {
  name                = "asp-func-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "EP1"

  tags = module.naming.tags
}

resource "azurerm_linux_function_app" "main" {
  name                = module.naming.names.function_app
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.functions.id

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key

  # HTTPS only
  https_only = true

  # VNet integration
  virtual_network_subnet_id = azurerm_subnet.app.id

  # Managed identity
  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                              = true
    ftps_state                             = "Disabled"
    minimum_tls_version                    = "1.2"
    vnet_route_all_enabled                 = true
    application_insights_connection_string = azurerm_application_insights.main.connection_string

    application_stack {
      python_version = "3.11"
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "python"
    "KEY_VAULT_URI"            = azurerm_key_vault.main.vault_uri
    "ENABLE_ORYX_BUILD"        = "true"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
  }

  tags = module.naming.tags
}

# Storage account for Functions
resource "azurerm_storage_account" "functions" {
  name                     = "stfunc${replace(module.naming.base_name, "-", "")}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  # Secure settings
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = false

  tags = module.naming.tags
}
```

---

## Data Services

### Azure SQL Database

```hcl
# data/sql.tf
# Azure SQL Database with security hardening

resource "azurerm_mssql_server" "main" {
  name                         = module.naming.names.sql_server
  resource_group_name          = azurerm_resource_group.main.name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_username
  administrator_login_password = random_password.sql_admin.result
  minimum_tls_version          = "1.2"

  # Azure AD admin
  azuread_administrator {
    login_username              = var.sql_aad_admin_login
    object_id                   = var.sql_aad_admin_object_id
    azuread_authentication_only = true
  }

  # Private endpoint only
  public_network_access_enabled = false

  identity {
    type = "SystemAssigned"
  }

  tags = module.naming.tags
}

# SQL Database
resource "azurerm_mssql_database" "main" {
  name           = module.naming.names.sql_database
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  max_size_gb    = 32
  sku_name       = "S3"
  zone_redundant = true

  # Backup retention
  short_term_retention_policy {
    retention_days           = 7
    backup_interval_in_hours = 12
  }

  long_term_retention_policy {
    weekly_retention  = "P1W"
    monthly_retention = "P1M"
    yearly_retention  = "P12M"
    week_of_year      = 1
  }

  # Threat detection
  threat_detection_policy {
    state                      = "Enabled"
    email_addresses            = [var.security_contact_email]
    email_account_admins       = true
    retention_days             = 30
    storage_account_access_key = azurerm_storage_account.audit.primary_access_key
    storage_endpoint           = azurerm_storage_account.audit.primary_blob_endpoint
  }

  tags = module.naming.tags
}

# SQL Server firewall rule - deny all (use private endpoint)
resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Auditing
resource "azurerm_mssql_server_extended_auditing_policy" "main" {
  server_id                               = azurerm_mssql_server.main.id
  storage_endpoint                        = azurerm_storage_account.audit.primary_blob_endpoint
  storage_account_access_key              = azurerm_storage_account.audit.primary_access_key
  storage_account_access_key_is_secondary = false
  retention_in_days                       = 90
  log_monitoring_enabled                  = true
}

# Vulnerability assessment
resource "azurerm_mssql_server_vulnerability_assessment" "main" {
  server_security_alert_policy_id = azurerm_mssql_server_security_alert_policy.main.id
  storage_container_path          = "${azurerm_storage_account.audit.primary_blob_endpoint}vulnerability-assessment/"
  storage_account_access_key      = azurerm_storage_account.audit.primary_access_key

  recurring_scans {
    enabled                   = true
    email_subscription_admins = true
    emails                    = [var.security_contact_email]
  }
}

resource "azurerm_mssql_server_security_alert_policy" "main" {
  server_id              = azurerm_mssql_server.main.id
  state                  = "Enabled"
  email_addresses        = [var.security_contact_email]
  email_account_admins   = true
  retention_days         = 30
  storage_endpoint       = azurerm_storage_account.audit.primary_blob_endpoint
  storage_account_access_key = azurerm_storage_account.audit.primary_access_key
}
```

### Storage Account

```hcl
# data/storage.tf
# Secure storage account configuration

resource "azurerm_storage_account" "main" {
  name                     = module.naming.names.storage_account
  resource_group_name      = azurerm_resource_group.main.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind             = "StorageV2"

  # Security settings
  min_tls_version                 = "TLS1_2"
  enable_https_traffic_only       = true
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = false
  shared_access_key_enabled       = true

  # Blob properties
  blob_properties {
    versioning_enabled       = true
    change_feed_enabled      = true
    last_access_time_enabled = true

    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 30
    }
  }

  # Network rules
  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    virtual_network_subnet_ids = []
    ip_rules                   = []
  }

  # Customer-managed key encryption
  identity {
    type = "SystemAssigned"
  }

  tags = module.naming.tags
}

# Storage account encryption with CMK
resource "azurerm_storage_account_customer_managed_key" "main" {
  storage_account_id = azurerm_storage_account.main.id
  key_vault_id       = azurerm_key_vault.main.id
  key_name           = azurerm_key_vault_key.encryption.name
}

# Blob container with lifecycle management
resource "azurerm_storage_container" "data" {
  name                  = "data"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Lifecycle management
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "archive-old-data"
    enabled = true
    filters {
      prefix_match = ["data/"]
      blob_types   = ["blockBlob"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
      snapshot {
        delete_after_days_since_creation_greater_than = 90
      }
      version {
        delete_after_days_since_creation = 90
      }
    }
  }
}

# Diagnostic settings
resource "azurerm_monitor_diagnostic_setting" "storage" {
  name                       = "diag-${module.naming.names.storage_account}"
  target_resource_id         = "${azurerm_storage_account.main.id}/blobServices/default"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
  }
}
```

---

## Monitoring & Observability

### Log Analytics & Application Insights

```hcl
# monitoring/log-analytics.tf
# Centralized monitoring infrastructure

resource "azurerm_log_analytics_workspace" "main" {
  name                = module.naming.names.log_analytics
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90
  daily_quota_gb      = 10

  tags = module.naming.tags
}

resource "azurerm_application_insights" "main" {
  name                = module.naming.names.app_insights
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = module.naming.tags
}

# Log Analytics solutions
resource "azurerm_log_analytics_solution" "container_insights" {
  solution_name         = "ContainerInsights"
  location              = var.location
  resource_group_name   = azurerm_resource_group.main.name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/ContainerInsights"
  }
}

resource "azurerm_log_analytics_solution" "security_insights" {
  solution_name         = "SecurityInsights"
  location              = var.location
  resource_group_name   = azurerm_resource_group.main.name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/SecurityInsights"
  }
}

# Data Collection Rule for custom logs
resource "azurerm_monitor_data_collection_rule" "main" {
  name                = "dcr-${module.naming.base_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name

  destinations {
    log_analytics {
      workspace_resource_id = azurerm_log_analytics_workspace.main.id
      name                  = "log-analytics-destination"
    }
  }

  data_flow {
    streams      = ["Microsoft-Syslog", "Microsoft-Perf"]
    destinations = ["log-analytics-destination"]
  }

  data_sources {
    syslog {
      facility_names = ["auth", "authpriv", "daemon", "kern", "syslog"]
      log_levels     = ["Warning", "Error", "Critical", "Alert", "Emergency"]
      name           = "syslog-datasource"
      streams        = ["Microsoft-Syslog"]
    }

    performance_counter {
      counter_specifiers = [
        "\\Processor(_Total)\\% Processor Time",
        "\\Memory\\Available Bytes",
        "\\LogicalDisk(_Total)\\% Free Space"
      ]
      name                          = "perf-datasource"
      sampling_frequency_in_seconds = 60
      streams                       = ["Microsoft-Perf"]
    }
  }

  tags = module.naming.tags
}
```

### Alert Rules

```hcl
# monitoring/alerts.tf
# Azure Monitor alert rules

# Action group for notifications
resource "azurerm_monitor_action_group" "critical" {
  name                = "ag-critical-${module.naming.base_name}"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "critical"

  email_receiver {
    name          = "sendtosecurityteam"
    email_address = var.security_contact_email
  }

  webhook_receiver {
    name        = "pagerduty"
    service_uri = var.pagerduty_webhook_url
  }

  tags = module.naming.tags
}

resource "azurerm_monitor_action_group" "warning" {
  name                = "ag-warning-${module.naming.base_name}"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "warning"

  email_receiver {
    name          = "sendtodevops"
    email_address = var.devops_contact_email
  }

  tags = module.naming.tags
}

# Metric alert for high CPU
resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "alert-high-cpu-${module.naming.base_name}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.main.id]
  description         = "Alert when CPU exceeds 80%"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "CpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.warning.id
  }

  tags = module.naming.tags
}

# Metric alert for memory
resource "azurerm_monitor_metric_alert" "high_memory" {
  name                = "alert-high-memory-${module.naming.base_name}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.main.id]
  description         = "Alert when memory exceeds 90%"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "MemoryWorkingSet"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 1500000000 # ~1.5GB
  }

  action {
    action_group_id = azurerm_monitor_action_group.warning.id
  }

  tags = module.naming.tags
}

# Log-based alert for application errors
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "app_errors" {
  name                = "alert-app-errors-${module.naming.base_name}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  description         = "Alert when application error rate exceeds threshold"
  severity            = 1
  enabled             = true

  scopes                    = [azurerm_application_insights.main.id]
  evaluation_frequency      = "PT5M"
  window_duration           = "PT5M"
  skip_query_validation     = false
  auto_mitigation_enabled   = true

  criteria {
    query = <<-QUERY
      requests
      | where resultCode >= 500
      | summarize errorCount = count() by bin(timestamp, 5m)
      | where errorCount > 10
    QUERY

    time_aggregation_method = "Count"
    threshold               = 0
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.critical.id]
  }

  tags = module.naming.tags
}

# Activity log alert for security events
resource "azurerm_monitor_activity_log_alert" "security_policy_change" {
  name                = "alert-policy-change-${module.naming.base_name}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = ["/subscriptions/${data.azurerm_subscription.current.subscription_id}"]
  description         = "Alert when Azure Policy assignment is modified"

  criteria {
    category       = "Policy"
    operation_name = "Microsoft.Authorization/policyAssignments/write"
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  tags = module.naming.tags
}
```

---

## CI/CD Integration

### GitHub Actions with OIDC

```yaml
# .github/workflows/azure-deploy.yml
# Azure deployment with OIDC authentication (no secrets)

name: Deploy to Azure

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  id-token: write
  contents: read

env:
  ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
  ARM_USE_OIDC: true
  TF_VERSION: "1.9.0"

jobs:
  terraform-plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    environment: ${{ github.event_name == 'pull_request' && 'staging' || 'production' }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        run: terraform init -backend-config="storage_account_name=${{ secrets.TF_STATE_STORAGE }}"
        working-directory: terraform

      - name: Terraform Validate
        run: terraform validate
        working-directory: terraform

      - name: Terraform Plan
        run: |
          terraform plan \
            -var-file="environments/${{ github.event_name == 'pull_request' && 'staging' || 'production' }}.tfvars" \
            -out=tfplan
        working-directory: terraform

      - name: Upload Plan
        uses: actions/upload-artifact@v4
        with:
          name: tfplan
          path: terraform/tfplan

  terraform-apply:
    name: Terraform Apply
    needs: terraform-plan
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Download Plan
        uses: actions/download-artifact@v4
        with:
          name: tfplan
          path: terraform

      - name: Terraform Init
        run: terraform init -backend-config="storage_account_name=${{ secrets.TF_STATE_STORAGE }}"
        working-directory: terraform

      - name: Terraform Apply
        run: terraform apply -auto-approve tfplan
        working-directory: terraform
```

### Azure DevOps Pipeline

```yaml
# azure-pipelines.yml
# Azure DevOps pipeline for Terraform deployment

trigger:
  branches:
    include:
      - main
  paths:
    include:
      - terraform/**

pr:
  branches:
    include:
      - main
  paths:
    include:
      - terraform/**

pool:
  vmImage: ubuntu-latest

variables:
  - group: azure-credentials
  - name: TF_VERSION
    value: "1.9.0"
  - name: WORKING_DIR
    value: $(System.DefaultWorkingDirectory)/terraform

stages:
  - stage: Validate
    displayName: Validate
    jobs:
      - job: TerraformValidate
        displayName: Terraform Validate
        steps:
          - task: TerraformInstaller@1
            displayName: Install Terraform
            inputs:
              terraformVersion: $(TF_VERSION)

          - task: TerraformTaskV4@4
            displayName: Terraform Init
            inputs:
              provider: azurerm
              command: init
              workingDirectory: $(WORKING_DIR)
              backendServiceArm: $(AZURE_SERVICE_CONNECTION)
              backendAzureRmResourceGroupName: $(TF_STATE_RG)
              backendAzureRmStorageAccountName: $(TF_STATE_STORAGE)
              backendAzureRmContainerName: tfstate
              backendAzureRmKey: terraform.tfstate

          - task: TerraformTaskV4@4
            displayName: Terraform Validate
            inputs:
              provider: azurerm
              command: validate
              workingDirectory: $(WORKING_DIR)

  - stage: Plan
    displayName: Plan
    dependsOn: Validate
    jobs:
      - job: TerraformPlan
        displayName: Terraform Plan
        steps:
          - task: TerraformInstaller@1
            displayName: Install Terraform
            inputs:
              terraformVersion: $(TF_VERSION)

          - task: TerraformTaskV4@4
            displayName: Terraform Init
            inputs:
              provider: azurerm
              command: init
              workingDirectory: $(WORKING_DIR)
              backendServiceArm: $(AZURE_SERVICE_CONNECTION)
              backendAzureRmResourceGroupName: $(TF_STATE_RG)
              backendAzureRmStorageAccountName: $(TF_STATE_STORAGE)
              backendAzureRmContainerName: tfstate
              backendAzureRmKey: terraform.tfstate

          - task: TerraformTaskV4@4
            displayName: Terraform Plan
            inputs:
              provider: azurerm
              command: plan
              workingDirectory: $(WORKING_DIR)
              environmentServiceNameAzureRM: $(AZURE_SERVICE_CONNECTION)
              commandOptions: >-
                -var-file=environments/$(Environment).tfvars
                -out=$(Build.ArtifactStagingDirectory)/tfplan

          - task: PublishPipelineArtifact@1
            displayName: Publish Plan
            inputs:
              targetPath: $(Build.ArtifactStagingDirectory)/tfplan
              artifact: tfplan

  - stage: Apply
    displayName: Apply
    dependsOn: Plan
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: TerraformApply
        displayName: Terraform Apply
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - task: TerraformInstaller@1
                  displayName: Install Terraform
                  inputs:
                    terraformVersion: $(TF_VERSION)

                - task: DownloadPipelineArtifact@2
                  displayName: Download Plan
                  inputs:
                    artifact: tfplan
                    path: $(Pipeline.Workspace)/tfplan

                - task: TerraformTaskV4@4
                  displayName: Terraform Init
                  inputs:
                    provider: azurerm
                    command: init
                    workingDirectory: $(WORKING_DIR)
                    backendServiceArm: $(AZURE_SERVICE_CONNECTION)
                    backendAzureRmResourceGroupName: $(TF_STATE_RG)
                    backendAzureRmStorageAccountName: $(TF_STATE_STORAGE)
                    backendAzureRmContainerName: tfstate
                    backendAzureRmKey: terraform.tfstate

                - task: TerraformTaskV4@4
                  displayName: Terraform Apply
                  inputs:
                    provider: azurerm
                    command: apply
                    workingDirectory: $(WORKING_DIR)
                    environmentServiceNameAzureRM: $(AZURE_SERVICE_CONNECTION)
                    commandOptions: $(Pipeline.Workspace)/tfplan/tfplan
```

---

## Terraform State Management

### Azure Storage Backend

```hcl
# bootstrap/state-storage.tf
# Terraform state storage with security hardening

resource "azurerm_resource_group" "tfstate" {
  name     = "rg-terraform-state-${var.environment}"
  location = var.location

  tags = {
    Purpose     = "Terraform State Management"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "azurerm_storage_account" "tfstate" {
  name                     = "sttfstate${var.environment}${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.tfstate.name
  location                 = azurerm_resource_group.tfstate.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind             = "StorageV2"

  # Security settings
  min_tls_version                 = "TLS1_2"
  enable_https_traffic_only       = true
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true

  # Blob properties for state file protection
  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 365
    }

    container_delete_retention_policy {
      days = 90
    }
  }

  # Network rules - restrict access
  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    virtual_network_subnet_ids = var.allowed_subnet_ids
    ip_rules                   = var.allowed_ip_ranges
  }

  tags = {
    Purpose     = "Terraform State Storage"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate.name
  container_access_type = "private"
}

# Lifecycle management for old state versions
resource "azurerm_storage_management_policy" "tfstate" {
  storage_account_id = azurerm_storage_account.tfstate.id

  rule {
    name    = "cleanup-old-versions"
    enabled = true
    filters {
      prefix_match = ["tfstate/"]
      blob_types   = ["blockBlob"]
    }
    actions {
      version {
        delete_after_days_since_creation = 90
      }
    }
  }
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

output "storage_account_name" {
  description = "Storage account name for Terraform backend"
  value       = azurerm_storage_account.tfstate.name
}

output "container_name" {
  description = "Container name for Terraform state"
  value       = azurerm_storage_container.tfstate.name
}

output "resource_group_name" {
  description = "Resource group containing state storage"
  value       = azurerm_resource_group.tfstate.name
}
```

### Backend Configuration

```hcl
# versions.tf
# Terraform and provider version constraints with Azure backend

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-terraform-state-prod"
    storage_account_name = "sttfstateprod"
    container_name       = "tfstate"
    key                  = "webapp/terraform.tfstate"
    use_oidc             = true
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }

  # Use OIDC authentication (recommended for CI/CD)
  use_oidc = true
}

provider "azuread" {
  use_oidc = true
}
```

---

## Cost Optimization

### Cost Management Policies

```hcl
# cost/policies.tf
# Azure Policy for cost governance

# Require cost center tag
resource "azurerm_policy_definition" "require_cost_center" {
  name         = "require-cost-center-tag"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Require cost center tag"
  description  = "Enforces cost center tag on all resources for cost allocation"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Cost Management"
  })

  policy_rule = jsonencode({
    if = {
      field = "tags['CostCenter']"
      exists = "false"
    }
    then = {
      effect = "deny"
    }
  })
}

# Deny expensive VM SKUs in dev
resource "azurerm_policy_definition" "restrict_vm_skus" {
  name         = "restrict-vm-skus-dev"
  policy_type  = "Custom"
  mode         = "Indexed"
  display_name = "Restrict VM SKUs in development"
  description  = "Prevents deployment of expensive VM SKUs in development subscriptions"

  management_group_id = azurerm_management_group.root.id

  metadata = jsonencode({
    version  = "1.0.0"
    category = "Cost Management"
  })

  parameters = jsonencode({
    allowedSkus = {
      type = "Array"
      metadata = {
        displayName = "Allowed VM SKUs"
        description = "List of VM SKUs allowed in development"
      }
      defaultValue = [
        "Standard_B1s",
        "Standard_B1ms",
        "Standard_B2s",
        "Standard_B2ms",
        "Standard_D2s_v5",
        "Standard_D4s_v5"
      ]
    }
  })

  policy_rule = jsonencode({
    if = {
      allOf = [
        {
          field  = "type"
          equals = "Microsoft.Compute/virtualMachines"
        },
        {
          not = {
            field = "Microsoft.Compute/virtualMachines/sku.name"
            in    = "[parameters('allowedSkus')]"
          }
        }
      ]
    }
    then = {
      effect = "deny"
    }
  })
}

# Assign to development management group
resource "azurerm_management_group_policy_assignment" "restrict_vm_skus_dev" {
  name                 = "restrict-vm-skus"
  management_group_id  = azurerm_management_group.development.id
  policy_definition_id = azurerm_policy_definition.restrict_vm_skus.id
  description          = "Restrict expensive VM SKUs in development"
  display_name         = "Restrict VM SKUs"
  enforce              = true
}
```

### Auto-shutdown for Dev/Test

```hcl
# cost/auto-shutdown.tf
# Automatic VM shutdown for dev/test environments

resource "azurerm_dev_test_global_vm_shutdown_schedule" "dev_vms" {
  for_each = var.environment == "dev" ? toset(var.vm_ids) : []

  virtual_machine_id = each.value
  location           = var.location
  enabled            = true

  daily_recurrence_time = "1900"
  timezone              = "Eastern Standard Time"

  notification_settings {
    enabled         = true
    time_in_minutes = 30
    email           = var.devops_contact_email
  }

  tags = module.naming.tags
}
```

### Reserved Instance Recommendations

```hcl
# cost/budget-alerts.tf
# Budget alerts for cost monitoring

resource "azurerm_consumption_budget_subscription" "monthly" {
  name            = "budget-${var.workload}-${var.environment}"
  subscription_id = data.azurerm_subscription.current.id

  amount     = var.monthly_budget
  time_grain = "Monthly"

  time_period {
    start_date = formatdate("YYYY-MM-01'T'00:00:00Z", timestamp())
  }

  filter {
    tag {
      name = "CostCenter"
      values = [var.cost_center]
    }
  }

  notification {
    enabled        = true
    threshold      = 50
    operator       = "GreaterThanOrEqualTo"
    threshold_type = "Actual"

    contact_emails = [var.finance_contact_email]
  }

  notification {
    enabled        = true
    threshold      = 75
    operator       = "GreaterThanOrEqualTo"
    threshold_type = "Actual"

    contact_emails = [var.finance_contact_email, var.devops_contact_email]
  }

  notification {
    enabled        = true
    threshold      = 90
    operator       = "GreaterThanOrEqualTo"
    threshold_type = "Actual"

    contact_emails = [var.finance_contact_email, var.devops_contact_email, var.manager_email]
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "GreaterThanOrEqualTo"
    threshold_type = "Forecasted"

    contact_emails = [var.finance_contact_email, var.devops_contact_email]
  }

  lifecycle {
    ignore_changes = [
      time_period
    ]
  }
}
```

---

## Terragrunt Patterns

### Multi-Subscription Configuration

```hcl
# terragrunt/terragrunt.hcl
# Root Terragrunt configuration

locals {
  # Parse the file path to extract environment and region
  parsed_path = regex(".*/environments/(?P<env>.*?)/(?P<region>.*?)/.*", get_terragrunt_dir())
  environment = local.parsed_path.env
  region      = local.parsed_path.region

  # Load environment-specific variables
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))

  # Azure configuration
  subscription_id = local.env_vars.locals.subscription_id
  tenant_id       = local.env_vars.locals.tenant_id
}

# Generate provider configuration
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
  subscription_id = "${local.subscription_id}"
  tenant_id       = "${local.tenant_id}"
  use_oidc        = true
}

provider "azuread" {
  tenant_id = "${local.tenant_id}"
  use_oidc  = true
}
EOF
}

# Configure remote state in Azure Storage
remote_state {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-terraform-state-${local.environment}"
    storage_account_name = "sttfstate${local.environment}"
    container_name       = "tfstate"
    key                  = "${path_relative_to_include()}/terraform.tfstate"
    use_oidc             = true
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

# Default inputs for all modules
inputs = {
  environment = local.environment
  region      = local.region
  tags = {
    Environment = local.environment
    ManagedBy   = "terragrunt"
    Repository  = "infrastructure"
  }
}
```

### Environment Configuration

```hcl
# terragrunt/environments/prod/env.hcl
# Production environment configuration

locals {
  environment     = "prod"
  subscription_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  tenant_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

  # Production-specific settings
  aks_node_count  = 3
  aks_vm_size     = "Standard_D8s_v5"
  sql_sku         = "S3"
  app_service_sku = "P1v3"
}
```

```hcl
# terragrunt/environments/prod/eastus/webapp/terragrunt.hcl
# Production webapp deployment

include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path   = find_in_parent_folders("env.hcl")
  expose = true
}

terraform {
  source = "../../../../modules//webapp"
}

dependency "networking" {
  config_path = "../networking"

  mock_outputs = {
    vnet_id         = "/subscriptions/xxx/resourceGroups/rg-xxx/providers/Microsoft.Network/virtualNetworks/vnet-xxx"
    app_subnet_id   = "/subscriptions/xxx/resourceGroups/rg-xxx/providers/Microsoft.Network/virtualNetworks/vnet-xxx/subnets/snet-app"
    data_subnet_id  = "/subscriptions/xxx/resourceGroups/rg-xxx/providers/Microsoft.Network/virtualNetworks/vnet-xxx/subnets/snet-data"
  }
}

dependency "monitoring" {
  config_path = "../monitoring"

  mock_outputs = {
    log_analytics_workspace_id = "/subscriptions/xxx/resourceGroups/rg-xxx/providers/Microsoft.OperationalInsights/workspaces/log-xxx"
    app_insights_connection_string = "InstrumentationKey=xxx"
  }
}

inputs = {
  workload = "webapp"

  # Network integration
  vnet_id        = dependency.networking.outputs.vnet_id
  app_subnet_id  = dependency.networking.outputs.app_subnet_id
  data_subnet_id = dependency.networking.outputs.data_subnet_id

  # Monitoring
  log_analytics_workspace_id     = dependency.monitoring.outputs.log_analytics_workspace_id
  app_insights_connection_string = dependency.monitoring.outputs.app_insights_connection_string

  # Production sizing
  app_service_sku = include.env.locals.app_service_sku
  sql_sku         = include.env.locals.sql_sku
}
```

---

## References

### Official Documentation

- [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)
- [Azure Security Benchmark](https://learn.microsoft.com/en-us/security/benchmark/azure/)
- [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)
- [Azure Landing Zones](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
- [Terraform AzureRM Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)

### Related Guides

- [Terraform Style Guide](../02_language_guides/terraform.md)
- [Terragrunt Style Guide](../02_language_guides/terragrunt.md)
- [Azure Bicep Style Guide](../02_language_guides/bicep.md)
- [GitHub Actions Guide](../02_language_guides/github_actions.md)
- [Kubernetes Style Guide](../02_language_guides/kubernetes.md)
