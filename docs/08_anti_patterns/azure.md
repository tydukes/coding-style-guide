---
title: "Azure Anti-Patterns and Common Mistakes"
description: "Before/after examples showing common Azure infrastructure anti-patterns and their corrections in Terraform"
author: "Tyler Dukes"
tags: [azure, anti-patterns, terraform, security, cost-optimization, networking]
category: "Anti-Patterns"
status: "active"
search_keywords: [azure, anti-patterns, cloud, microsoft, common mistakes, best practices]
---

## Overview

This guide presents common Azure anti-patterns and mistakes, along with their correct implementations.
Each anti-pattern includes:

- **Bad Example**: The anti-pattern or mistake
- **Good Example**: The corrected implementation
- **Explanation**: Why the anti-pattern is problematic and how the correction improves it

---

## Security Anti-Patterns

### Public Network Access on PaaS Services

**Bad**: Exposing PaaS services to the public internet

```hcl
resource "azurerm_key_vault" "bad" {
  name                = "kv-webapp-prod"
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # No network restrictions - accessible from anywhere
}

resource "azurerm_storage_account" "bad" {
  name                     = "stwebappprod001"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  # Public blob access enabled
  allow_nested_items_to_be_public = true
}

resource "azurerm_mssql_server" "bad" {
  name                         = "sql-webapp-prod"
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_password

  # Public network access enabled by default
}

# Firewall rule allowing all Azure services AND public internet
resource "azurerm_mssql_firewall_rule" "bad" {
  name             = "AllowAll"
  server_id        = azurerm_mssql_server.bad.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}
```

**Good**: Use private endpoints and disable public access

```hcl
resource "azurerm_key_vault" "good" {
  name                = "kv-webapp-prod"
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Disable public access
  public_network_access_enabled = false

  # Network ACLs as defense in depth
  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }

  # Enable purge protection for production
  purge_protection_enabled   = true
  soft_delete_retention_days = 90
}

resource "azurerm_storage_account" "good" {
  name                     = "stwebappprod001"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "GRS"

  # Security settings
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = false
  min_tls_version                 = "TLS1_2"

  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]
  }
}

resource "azurerm_mssql_server" "good" {
  name                          = "sql-webapp-prod"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = "12.0"
  administrator_login           = "sqladmin"
  administrator_login_password  = var.sql_password
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false

  azuread_administrator {
    login_username              = var.sql_aad_admin
    object_id                   = var.sql_aad_admin_object_id
    azuread_authentication_only = true
  }
}

# Private endpoint for SQL Server
resource "azurerm_private_endpoint" "sql" {
  name                = "pep-sql-webapp-prod"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.data_subnet_id

  private_service_connection {
    name                           = "psc-sql"
    private_connection_resource_id = azurerm_mssql_server.good.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [var.sql_private_dns_zone_id]
  }
}
```

**Why**: Public endpoints expose services to internet-based attacks. Private endpoints ensure traffic
stays within Azure's backbone network and your VNet.

---

### Hardcoded Secrets in Terraform

**Bad**: Secrets stored in Terraform code or tfvars

```hcl
resource "azurerm_mssql_server" "bad" {
  name                         = "sql-webapp-prod"
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = "P@ssw0rd123!"  # Hardcoded secret!
}

resource "azurerm_linux_web_app" "bad" {
  name                = "app-webapp-prod"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id

  app_settings = {
    "DATABASE_PASSWORD" = "P@ssw0rd123!"  # Secret in plain text!
    "API_KEY"           = "sk-abc123xyz"   # Another hardcoded secret!
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }
}
```

**Good**: Use Key Vault and managed identities

```hcl
# Generate random password
resource "random_password" "sql_admin" {
  length           = 32
  special          = true
  override_special = "!@#$%^&*"
}

# Store password in Key Vault
resource "azurerm_key_vault_secret" "sql_password" {
  name         = "sql-admin-password"
  value        = random_password.sql_admin.result
  key_vault_id = azurerm_key_vault.main.id

  content_type    = "password"
  expiration_date = timeadd(timestamp(), "8760h")
}

resource "azurerm_mssql_server" "good" {
  name                         = "sql-webapp-prod"
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = random_password.sql_admin.result

  # Prefer Azure AD authentication
  azuread_administrator {
    login_username              = var.sql_aad_admin
    object_id                   = var.sql_aad_admin_object_id
    azuread_authentication_only = true
  }

  lifecycle {
    ignore_changes = [administrator_login_password]
  }
}

resource "azurerm_linux_web_app" "good" {
  name                = "app-webapp-prod"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    # Reference Key Vault - app retrieves secrets at runtime
    "KEY_VAULT_URI" = azurerm_key_vault.main.vault_uri
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }
}

# Grant the app access to Key Vault secrets
resource "azurerm_role_assignment" "app_keyvault" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.good.identity[0].principal_id
}
```

**Why**: Hardcoded secrets end up in version control, state files, and logs. Key Vault with managed
identity eliminates secret exposure.

---

### Using Service Principal Secrets Instead of Managed Identity

**Bad**: Service principal with client secrets

```hcl
provider "azurerm" {
  features {}

  # Service principal authentication with secrets
  client_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  client_secret   = var.client_secret  # Secret that expires and must be rotated
  tenant_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  subscription_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}

resource "azurerm_linux_web_app" "bad" {
  name                = "app-webapp-prod"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id

  app_settings = {
    # Storing credentials for the app to use
    "AZURE_CLIENT_ID"     = var.app_client_id
    "AZURE_CLIENT_SECRET" = var.app_client_secret
    "AZURE_TENANT_ID"     = var.tenant_id
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }
}
```

**Good**: Use OIDC for CI/CD and managed identity for workloads

```hcl
provider "azurerm" {
  features {}

  # OIDC authentication for GitHub Actions
  use_oidc        = true
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
}

resource "azurerm_linux_web_app" "good" {
  name                = "app-webapp-prod"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    # No credentials needed - uses managed identity
    "AZURE_CLIENT_ID" = ""  # DefaultAzureCredential auto-detects managed identity
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }
}

# Grant specific permissions to the managed identity
resource "azurerm_role_assignment" "app_storage" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_web_app.good.identity[0].principal_id
}
```

**Why**: Service principal secrets must be managed, rotated, and can be leaked. Managed identities
are automatically managed by Azure with no secrets to handle.

---

### Overly Permissive RBAC

**Bad**: Assigning Owner or Contributor at subscription scope

```hcl
# Granting Owner at subscription level
resource "azurerm_role_assignment" "bad_owner" {
  scope                = "/subscriptions/${data.azurerm_subscription.current.subscription_id}"
  role_definition_name = "Owner"
  principal_id         = var.developer_group_object_id
}

# Granting Contributor to a service principal for everything
resource "azurerm_role_assignment" "bad_contributor" {
  scope                = "/subscriptions/${data.azurerm_subscription.current.subscription_id}"
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}
```

**Good**: Least privilege at the narrowest scope

```hcl
# Developers get Contributor only on their resource group
resource "azurerm_role_assignment" "dev_contributor" {
  scope                = azurerm_resource_group.app.id
  role_definition_name = "Contributor"
  principal_id         = var.developer_group_object_id
}

# App identity gets only the specific permissions needed
resource "azurerm_role_assignment" "app_storage_read" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_role_assignment" "app_keyvault_secrets" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

# Custom role for specific actions when built-in roles are too broad
resource "azurerm_role_definition" "app_operator" {
  name        = "Application Operator"
  scope       = azurerm_resource_group.app.id
  description = "Can restart and monitor applications"

  permissions {
    actions = [
      "Microsoft.Web/sites/restart/action",
      "Microsoft.Web/sites/slots/restart/action",
      "Microsoft.Insights/metrics/read",
      "Microsoft.Insights/logs/read"
    ]
    not_actions = []
  }

  assignable_scopes = [azurerm_resource_group.app.id]
}
```

**Why**: Overly permissive roles violate least privilege and increase blast radius of compromised credentials.

---

## Networking Anti-Patterns

### Flat Network Without Segmentation

**Bad**: Single subnet for all workloads

```hcl
resource "azurerm_virtual_network" "bad" {
  name                = "vnet-webapp"
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = ["10.0.0.0/16"]
}

# Single large subnet for everything
resource "azurerm_subnet" "bad" {
  name                 = "default"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.bad.name
  address_prefixes     = ["10.0.0.0/16"]
}

# No NSG - all traffic allowed
```

**Good**: Network segmentation with NSGs

```hcl
resource "azurerm_virtual_network" "good" {
  name                = "vnet-webapp-prod"
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = ["10.0.0.0/16"]
}

# Web tier subnet
resource "azurerm_subnet" "web" {
  name                 = "snet-web"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.good.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Application tier subnet with App Service delegation
resource "azurerm_subnet" "app" {
  name                 = "snet-app"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.good.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "app-service"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

# Data tier subnet for databases
resource "azurerm_subnet" "data" {
  name                 = "snet-data"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.good.name
  address_prefixes     = ["10.0.3.0/24"]

  private_endpoint_network_policies = "Disabled"
}

# NSG for web tier
resource "azurerm_network_security_group" "web" {
  name                = "nsg-web"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# NSG for data tier - only allow app tier
resource "azurerm_network_security_group" "data" {
  name                = "nsg-data"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowAppTier"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["1433", "5432"]
    source_address_prefix      = "10.0.2.0/24"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "web" {
  subnet_id                 = azurerm_subnet.web.id
  network_security_group_id = azurerm_network_security_group.web.id
}

resource "azurerm_subnet_network_security_group_association" "data" {
  subnet_id                 = azurerm_subnet.data.id
  network_security_group_id = azurerm_network_security_group.data.id
}
```

**Why**: Flat networks allow lateral movement. Segmentation limits blast radius and enforces network-level access control.

---

### Not Using Private DNS Zones with Private Endpoints

**Bad**: Private endpoints without DNS integration

```hcl
resource "azurerm_private_endpoint" "bad" {
  name                = "pep-storage"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-storage"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  # No DNS zone group - must manually manage DNS or use IP addresses
}
```

**Good**: Private endpoints with private DNS zone integration

```hcl
# Private DNS zone for blob storage
resource "azurerm_private_dns_zone" "blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = var.resource_group_name
}

# Link DNS zone to VNet
resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  name                  = "link-${var.vnet_name}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.blob.name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
}

resource "azurerm_private_endpoint" "good" {
  name                = "pep-storage"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-storage"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  # Automatic DNS registration
  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob.id]
  }
}
```

**Why**: Without private DNS integration, applications must use private IP addresses directly,
breaking portability and complicating configuration.

---

## Cost Anti-Patterns

### Over-Provisioned Resources

**Bad**: Production sizing for all environments

```hcl
resource "azurerm_kubernetes_cluster" "bad" {
  name                = "aks-webapp-dev"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "webapp-dev"

  default_node_pool {
    name       = "system"
    node_count = 5                    # Same as production
    vm_size    = "Standard_D16s_v5"   # Expensive VM size for dev
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_mssql_database" "bad" {
  name           = "sqldb-webapp-dev"
  server_id      = azurerm_mssql_server.main.id
  sku_name       = "P6"   # Premium tier for dev environment
  max_size_gb    = 500
  zone_redundant = true   # HA in dev
}
```

**Good**: Right-size based on environment

```hcl
locals {
  env_config = {
    dev = {
      aks_node_count = 2
      aks_vm_size    = "Standard_B2ms"
      sql_sku        = "S0"
      sql_size_gb    = 10
      zone_redundant = false
    }
    staging = {
      aks_node_count = 3
      aks_vm_size    = "Standard_D4s_v5"
      sql_sku        = "S3"
      sql_size_gb    = 50
      zone_redundant = false
    }
    prod = {
      aks_node_count = 5
      aks_vm_size    = "Standard_D8s_v5"
      sql_sku        = "P2"
      sql_size_gb    = 250
      zone_redundant = true
    }
  }
  config = local.env_config[var.environment]
}

resource "azurerm_kubernetes_cluster" "good" {
  name                = "aks-webapp-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "webapp-${var.environment}"

  default_node_pool {
    name                = "system"
    node_count          = local.config.aks_node_count
    vm_size             = local.config.aks_vm_size
    auto_scaling_enabled = var.environment == "prod"
    min_count           = var.environment == "prod" ? 3 : null
    max_count           = var.environment == "prod" ? 10 : null
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_mssql_database" "good" {
  name           = "sqldb-webapp-${var.environment}"
  server_id      = azurerm_mssql_server.main.id
  sku_name       = local.config.sql_sku
  max_size_gb    = local.config.sql_size_gb
  zone_redundant = local.config.zone_redundant
}
```

**Why**: Development and test environments don't need production capacity. Right-sizing can reduce costs by 60-80%.

---

### No Auto-Shutdown for Dev/Test

**Bad**: Dev VMs running 24/7

```hcl
resource "azurerm_linux_virtual_machine" "bad" {
  name                = "vm-dev-001"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = "Standard_D4s_v5"
  admin_username      = "azureuser"

  # VM runs 24/7 even though dev team only works 8 hours

  admin_ssh_key {
    username   = "azureuser"
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  network_interface_ids = [azurerm_network_interface.main.id]
}
```

**Good**: Auto-shutdown for non-production

```hcl
resource "azurerm_linux_virtual_machine" "good" {
  name                = "vm-dev-001"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = "Standard_D4s_v5"
  admin_username      = "azureuser"

  admin_ssh_key {
    username   = "azureuser"
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"  # Standard for dev
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  network_interface_ids = [azurerm_network_interface.main.id]

  tags = {
    Environment  = "dev"
    AutoShutdown = "true"
  }
}

# Auto-shutdown schedule
resource "azurerm_dev_test_global_vm_shutdown_schedule" "good" {
  virtual_machine_id = azurerm_linux_virtual_machine.good.id
  location           = var.location
  enabled            = true

  daily_recurrence_time = "1900"   # 7 PM local time
  timezone              = "Eastern Standard Time"

  notification_settings {
    enabled         = true
    time_in_minutes = 30
    email           = var.team_email
  }
}
```

**Why**: Development VMs idle 16+ hours daily. Auto-shutdown reduces costs by 66% with no impact on developers.

---

### Missing Tags for Cost Allocation

**Bad**: Resources without cost allocation tags

```hcl
resource "azurerm_resource_group" "bad" {
  name     = "rg-webapp"
  location = var.location
  # No tags
}

resource "azurerm_storage_account" "bad" {
  name                     = "stwebapp001"
  resource_group_name      = azurerm_resource_group.bad.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  # No tags - impossible to track costs
}
```

**Good**: Comprehensive tagging strategy

```hcl
locals {
  required_tags = {
    Environment = var.environment
    Project     = var.project_name
    CostCenter  = var.cost_center
    Owner       = var.owner_email
    ManagedBy   = "terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }
}

resource "azurerm_resource_group" "good" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location
  tags     = local.required_tags
}

resource "azurerm_storage_account" "good" {
  name                     = "st${var.project_name}${var.environment}001"
  resource_group_name      = azurerm_resource_group.good.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = merge(local.required_tags, {
    DataClassification = "Internal"
    BackupPolicy       = "Daily"
  })
}

# Azure Policy to enforce required tags
resource "azurerm_policy_assignment" "require_cost_center" {
  name                 = "require-cost-center"
  scope                = azurerm_resource_group.good.id
  policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/96670d01-0a4d-4649-9c89-2d3abc0a5025"

  parameters = jsonencode({
    tagName = { value = "CostCenter" }
  })
}
```

**Why**: Without proper tagging, cost allocation and chargeback are impossible. Finance can't
determine which teams are responsible for spending.

---

## State Management Anti-Patterns

### Local State for Team Projects

**Bad**: Terraform state stored locally

```hcl
terraform {
  required_version = ">= 1.6.0"

  # No backend configured - state stored locally
  # - Can't collaborate with team
  # - No state locking
  # - State can be lost
  # - Secrets in state file on developer machines
}
```

**Good**: Remote state with Azure Storage

```hcl
terraform {
  required_version = ">= 1.6.0"

  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "sttfstateprod001"
    container_name       = "tfstate"
    key                  = "webapp/prod/terraform.tfstate"
    use_oidc             = true
  }
}
```

With secure storage account:

```hcl
resource "azurerm_storage_account" "tfstate" {
  name                     = "sttfstateprod001"
  resource_group_name      = var.state_resource_group
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "GRS"

  # Security settings
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = false

  # Enable versioning for state file recovery
  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 365
    }
  }

  # Restrict access
  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]
    ip_rules       = var.allowed_ip_ranges
  }
}
```

**Why**: Local state prevents collaboration, has no locking for concurrent operations, and can be
accidentally deleted or corrupted.

---

## Operational Anti-Patterns

### No Diagnostic Settings

**Bad**: Resources without logging

```hcl
resource "azurerm_key_vault" "bad" {
  name                = "kv-webapp-prod"
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # No diagnostic settings - can't audit access or troubleshoot issues
}

resource "azurerm_mssql_server" "bad" {
  name                         = "sql-webapp-prod"
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_password

  # No auditing - compliance risk
}
```

**Good**: Comprehensive diagnostic settings

```hcl
resource "azurerm_key_vault" "good" {
  name                = "kv-webapp-prod"
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
}

resource "azurerm_monitor_diagnostic_setting" "keyvault" {
  name                       = "diag-kv-webapp-prod"
  target_resource_id         = azurerm_key_vault.good.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

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

resource "azurerm_mssql_server" "good" {
  name                         = "sql-webapp-prod"
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_password
}

resource "azurerm_mssql_server_extended_auditing_policy" "good" {
  server_id                               = azurerm_mssql_server.good.id
  storage_endpoint                        = var.audit_storage_endpoint
  storage_account_access_key              = var.audit_storage_key
  storage_account_access_key_is_secondary = false
  retention_in_days                       = 90
  log_monitoring_enabled                  = true
}

resource "azurerm_mssql_server_security_alert_policy" "good" {
  server_id              = azurerm_mssql_server.good.id
  state                  = "Enabled"
  email_addresses        = [var.security_email]
  email_account_admins   = true
  retention_days         = 30
  storage_endpoint       = var.audit_storage_endpoint
  storage_account_access_key = var.audit_storage_key
}
```

**Why**: Without diagnostic settings, you can't audit access, detect security incidents, or troubleshoot issues effectively.

---

### No Backup Strategy

**Bad**: Production resources without backup

```hcl
resource "azurerm_mssql_database" "bad" {
  name      = "sqldb-webapp-prod"
  server_id = azurerm_mssql_server.main.id
  sku_name  = "S3"

  # Default 7-day retention only
  # No geo-redundant backup
  # No long-term retention
}

resource "azurerm_storage_account" "bad" {
  name                     = "stwebappprod001"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"  # Single region - data loss risk

  # No soft delete
  # No versioning
}
```

**Good**: Comprehensive backup and recovery

```hcl
resource "azurerm_mssql_database" "good" {
  name           = "sqldb-webapp-prod"
  server_id      = azurerm_mssql_server.main.id
  sku_name       = "S3"
  zone_redundant = true

  # Enhanced backup retention
  short_term_retention_policy {
    retention_days           = 35
    backup_interval_in_hours = 12
  }

  # Long-term retention for compliance
  long_term_retention_policy {
    weekly_retention  = "P4W"    # 4 weeks
    monthly_retention = "P12M"   # 12 months
    yearly_retention  = "P5Y"    # 5 years
    week_of_year      = 1
  }
}

resource "azurerm_storage_account" "good" {
  name                     = "stwebappprod001"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "GRS"  # Geo-redundant

  # Enable soft delete and versioning
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
}

# Backup vault for VMs
resource "azurerm_recovery_services_vault" "good" {
  name                = "rsv-webapp-prod"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"
  soft_delete_enabled = true

  cross_region_restore_enabled = true
}

resource "azurerm_backup_policy_vm" "good" {
  name                = "policy-vm-daily"
  resource_group_name = var.resource_group_name
  recovery_vault_name = azurerm_recovery_services_vault.good.name

  backup {
    frequency = "Daily"
    time      = "02:00"
  }

  retention_daily {
    count = 30
  }

  retention_weekly {
    count    = 12
    weekdays = ["Sunday"]
  }

  retention_monthly {
    count    = 12
    weekdays = ["Sunday"]
    weeks    = ["First"]
  }

  retention_yearly {
    count    = 5
    weekdays = ["Sunday"]
    weeks    = ["First"]
    months   = ["January"]
  }
}
```

**Why**: Without proper backup, data loss from human error, ransomware, or disasters is unrecoverable.

---

## References

- [Azure Security Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)
- [Azure Cost Optimization](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/cost-mgt-best-practices)
- [Azure Networking Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/network-best-practices)
- [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)
- [Microsoft Azure Best Practices Guide](../11_cloud_providers/azure.md)
