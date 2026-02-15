---
title: "Azure Bicep Style Guide"
description: "Comprehensive style guide for Azure Bicep covering template structure, naming conventions, modules, security, and best practices"
author: "Tyler Dukes"
tags: [bicep, azure, infrastructure, iac, arm, modules]
category: "Language Guides"
status: "active"
search_keywords: [bicep, azure, arm templates, infrastructure as code, microsoft, azure resource manager]
---

## Language Overview

**Azure Bicep** is a domain-specific language (DSL) for deploying Azure resources declaratively. It provides a
transparent abstraction over Azure Resource Manager (ARM) templates with cleaner, more readable syntax and
first-class support for modularity.

### Key Characteristics

- **Format**: Bicep files (`.bicep`) compiled to ARM JSON
- **Type**: Declarative infrastructure as code
- **Execution**: Azure Resource Manager
- **Primary Use Cases**:
  - Azure-native infrastructure deployment
  - Modular infrastructure components
  - Multi-environment Azure deployments
  - Azure Landing Zones and governance

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| File Names | `kebab-case.bicep` | `storage-account.bicep` | Descriptive, lowercase |
| Resource Names | `camelCase` | `storageAccount` | Symbolic name in Bicep |
| Parameter Names | `camelCase` | `environmentName` | Descriptive purpose |
| Variable Names | `camelCase` | `storageAccountName` | Clear intent |
| Module Names | `camelCase` | `networkModule` | Match file name |
| Output Names | `camelCase` | `storageAccountId` | Match resource attribute |
| **File Structure** | | | |
| Parameters | Top of file | After `targetScope` | Input values |
| Variables | After parameters | Computed values | Local computations |
| Resources | After variables | Main content | Azure resources |
| Modules | With resources | Nested deployments | Reusable components |
| Outputs | End of file | Export values | Return values |
| **Best Practices** | | | |
| Modules | Reusable components | Single responsibility | One resource type |
| Parameters | Validate input | `@allowed`, `@minLength` | Constrain values |
| Deployment Scopes | Explicit scope | `targetScope = 'subscription'` | Default is resourceGroup |
| **Security** | | | |
| Secrets | Key Vault references | `@secure()` decorator | Never hardcode |
| RBAC | Least privilege | Specific resource scope | No subscription-wide |
| Encryption | Enable by default | Customer-managed keys | All storage |

---

## File Structure

### Complete Template Example

```bicep
// storage-account.bicep
// Deploys a secure storage account with blob containers

targetScope = 'resourceGroup'

// ============================================================================
// Parameters
// ============================================================================

@description('The Azure region for resources')
param location string = resourceGroup().location

@description('Environment name for resource naming and tagging')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environmentName string

@description('The name prefix for resources')
@minLength(3)
@maxLength(11)
param namePrefix string

@description('Storage account SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
])
param storageSku string = 'Standard_LRS'

@description('Enable blob versioning')
param enableVersioning bool = true

@description('Tags to apply to all resources')
param tags object = {}

// ============================================================================
// Variables
// ============================================================================

var storageAccountName = '${namePrefix}${environmentName}${uniqueString(resourceGroup().id)}'
var defaultTags = {
  Environment: environmentName
  ManagedBy: 'Bicep'
  CreatedDate: utcNow('yyyy-MM-dd')
}
var allTags = union(defaultTags, tags)

// ============================================================================
// Resources
// ============================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: take(storageAccountName, 24)
  location: location
  tags: allTags
  sku: {
    name: storageSku
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
    }
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: []
      ipRules: []
    }
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    isVersioningEnabled: enableVersioning
  }
}

resource dataContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'data'
  properties: {
    publicAccess: 'None'
  }
}

resource logsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'logs'
  properties: {
    publicAccess: 'None'
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('The resource ID of the storage account')
output storageAccountId string = storageAccount.id

@description('The name of the storage account')
output storageAccountName string = storageAccount.name

@description('The primary blob endpoint')
output primaryBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
```

---

## Naming Conventions

### File Names

```text
# Good - kebab-case, descriptive
storage-account.bicep
virtual-network.bicep
key-vault.bicep
app-service-plan.bicep
sql-database.bicep
container-registry.bicep

# Bad - inconsistent casing or unclear
StorageAccount.bicep
vnet.bicep
kv.bicep
plan.bicep
```

### Resource Symbolic Names

```bicep
// Good - camelCase, descriptive
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
}

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
}

// Bad - unclear or wrong casing
resource sa 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
}

resource KV 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
}
```

### Parameter Names

```bicep
// Good - camelCase with descriptive names and decorators
@description('The Azure region for resource deployment')
param location string = resourceGroup().location

@description('Environment name used for resource naming')
@allowed(['dev', 'staging', 'prod'])
param environmentName string

@description('The name prefix for all resources')
@minLength(3)
@maxLength(10)
param resourcePrefix string

@description('Enable diagnostic logging')
param enableDiagnostics bool = true

@description('Virtual network address space')
param vnetAddressPrefix string = '10.0.0.0/16'

// Bad - vague names or missing decorators
param env string
param prefix string
param diag bool
param addr string
```

### Variable Names

```bicep
// Good - camelCase, computed values with clear purpose
var storageAccountName = '${resourcePrefix}${environmentName}${uniqueString(resourceGroup().id)}'
var keyVaultName = 'kv-${resourcePrefix}-${environmentName}'
var appInsightsName = 'appi-${resourcePrefix}-${environmentName}'
var logAnalyticsName = 'log-${resourcePrefix}-${environmentName}'

var defaultTags = {
  Environment: environmentName
  ManagedBy: 'Bicep'
  Project: projectName
}

var subnetConfigurations = [
  {
    name: 'web-subnet'
    addressPrefix: '10.0.1.0/24'
  }
  {
    name: 'app-subnet'
    addressPrefix: '10.0.2.0/24'
  }
  {
    name: 'data-subnet'
    addressPrefix: '10.0.3.0/24'
  }
]

// Bad - unclear purpose
var name1 = '${prefix}${env}${uniqueString(resourceGroup().id)}'
var x = 'kv-${prefix}-${env}'
var temp = {}
```

### Azure Resource Naming

```bicep
// Recommended naming convention: {resource-type}-{workload}-{environment}-{region}-{instance}
var namingPrefix = '${workloadName}-${environmentName}-${location}'

// Storage Account (3-24 chars, lowercase alphanumeric only)
var storageAccountName = take('st${workloadName}${environmentName}${uniqueString(resourceGroup().id)}', 24)

// Key Vault (3-24 chars, alphanumeric and hyphens)
var keyVaultName = take('kv-${namingPrefix}', 24)

// Virtual Network
var vnetName = 'vnet-${namingPrefix}'

// Subnet
var subnetName = 'snet-${purpose}-${namingPrefix}'

// Network Security Group
var nsgName = 'nsg-${purpose}-${namingPrefix}'

// Application Service Plan
var appServicePlanName = 'asp-${namingPrefix}'

// Web App
var webAppName = 'app-${namingPrefix}'

// Function App
var functionAppName = 'func-${namingPrefix}'

// SQL Server
var sqlServerName = 'sql-${namingPrefix}'

// SQL Database
var sqlDatabaseName = 'sqldb-${namingPrefix}'

// Container Registry (5-50 chars, alphanumeric only)
var acrName = take('acr${workloadName}${environmentName}${uniqueString(resourceGroup().id)}', 50)

// AKS Cluster
var aksName = 'aks-${namingPrefix}'

// Log Analytics Workspace
var logAnalyticsName = 'log-${namingPrefix}'

// Application Insights
var appInsightsName = 'appi-${namingPrefix}'
```

---

## Parameters

### Parameter Decorators

```bicep
// Required parameter with description
@description('The name of the workload or application')
param workloadName string

// Optional parameter with default
@description('The Azure region for deployment')
param location string = resourceGroup().location

// Allowed values constraint
@description('The deployment environment')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environmentName string

// String length constraints
@description('Resource name prefix')
@minLength(3)
@maxLength(10)
param namePrefix string

// Numeric constraints
@description('Number of instances to deploy')
@minValue(1)
@maxValue(10)
param instanceCount int = 2

// Secure parameter (hidden in logs and portal)
@description('The administrator password')
@secure()
param adminPassword string

// Metadata for additional context
@description('Tags to apply to all resources')
@metadata({
  example: {
    Environment: 'prod'
    CostCenter: '12345'
  }
})
param tags object = {}
```

### Parameter Types

```bicep
// String parameter
param resourceName string

// Integer parameter
param instanceCount int = 1

// Boolean parameter
param enablePublicAccess bool = false

// Array parameter
@description('List of allowed IP addresses')
param allowedIpAddresses array = []

// Object parameter
@description('Network configuration settings')
param networkConfig object = {
  vnetAddressPrefix: '10.0.0.0/16'
  subnetAddressPrefix: '10.0.1.0/24'
}

// Union types (Bicep 0.21+)
@description('SKU tier for the resource')
param skuTier 'Basic' | 'Standard' | 'Premium' = 'Standard'

// User-defined types (Bicep 0.21+)
@description('Subnet configuration')
type subnetConfigType = {
  name: string
  addressPrefix: string
  serviceEndpoints: string[]?
}

param subnets subnetConfigType[]
```

### Parameter Files

```json
// main.bicepparam (Bicep parameter file format)
using './main.bicep'

param environmentName = 'prod'
param location = 'eastus2'
param workloadName = 'myapp'
param instanceCount = 3
param tags = {
  Environment: 'prod'
  CostCenter: '12345'
  Owner: 'platform-team'
}
```

```json
// parameters.prod.json (JSON parameter file format)
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environmentName": {
      "value": "prod"
    },
    "location": {
      "value": "eastus2"
    },
    "workloadName": {
      "value": "myapp"
    },
    "instanceCount": {
      "value": 3
    },
    "tags": {
      "value": {
        "Environment": "prod",
        "CostCenter": "12345",
        "Owner": "platform-team"
      }
    }
  }
}
```

---

## Variables

### Variable Patterns

```bicep
// Simple computed value
var storageAccountName = '${namePrefix}${environmentName}${uniqueString(resourceGroup().id)}'

// Conditional value
var skuName = environmentName == 'prod' ? 'Standard_GRS' : 'Standard_LRS'

// Complex object
var defaultTags = {
  Environment: environmentName
  ManagedBy: 'Bicep'
  DeployedAt: utcNow('yyyy-MM-dd')
  ResourceGroup: resourceGroup().name
}

// Merged objects
var allTags = union(defaultTags, customTags)

// Array construction
var subnets = [
  {
    name: 'web'
    addressPrefix: cidrSubnet(vnetAddressPrefix, 24, 0)
    serviceEndpoints: ['Microsoft.Storage', 'Microsoft.KeyVault']
  }
  {
    name: 'app'
    addressPrefix: cidrSubnet(vnetAddressPrefix, 24, 1)
    serviceEndpoints: ['Microsoft.Sql', 'Microsoft.Storage']
  }
  {
    name: 'data'
    addressPrefix: cidrSubnet(vnetAddressPrefix, 24, 2)
    serviceEndpoints: []
  }
]

// Environment-specific configuration
var environmentConfig = {
  dev: {
    vmSize: 'Standard_B2s'
    instanceCount: 1
    enableHA: false
  }
  staging: {
    vmSize: 'Standard_D2s_v3'
    instanceCount: 2
    enableHA: false
  }
  prod: {
    vmSize: 'Standard_D4s_v3'
    instanceCount: 3
    enableHA: true
  }
}

var currentConfig = environmentConfig[environmentName]
```

### Built-in Functions

```bicep
// String functions
var lowerName = toLower(resourceName)
var upperName = toUpper(resourceName)
var trimmedName = trim(resourceName)
var replacedName = replace(resourceName, '-', '_')
var substringName = substring(resourceName, 0, 10)
var formattedName = format('{0}-{1}-{2}', prefix, env, region)

// Unique string generation
var uniqueSuffix = uniqueString(resourceGroup().id)
var uniqueStorageName = 'st${uniqueString(subscription().subscriptionId, resourceGroup().id)}'

// GUID generation
var newGuid = guid(resourceGroup().id, deployment().name)

// Array functions
var firstItem = first(myArray)
var lastItem = last(myArray)
var arrayLength = length(myArray)
var containsItem = contains(myArray, 'item')
var flatArray = flatten(nestedArray)
var distinctArray = union(array1, array2)
var intersectArray = intersection(array1, array2)

// Object functions
var hasProperty = contains(myObject, 'propertyName')
var propertyValue = myObject.?propertyName ?? 'default'
var mergedObject = union(object1, object2)
var objectKeys = objectKeys(myObject)

// Resource group and subscription
var rgName = resourceGroup().name
var rgLocation = resourceGroup().location
var rgId = resourceGroup().id
var subId = subscription().subscriptionId
var tenantId = tenant().tenantId

// Date and time
var deploymentTime = utcNow()
var formattedDate = utcNow('yyyy-MM-dd')
var formattedDateTime = utcNow('yyyy-MM-ddTHH:mm:ssZ')

// CIDR functions (Bicep 0.20+)
var firstSubnet = cidrSubnet('10.0.0.0/16', 24, 0)  // 10.0.0.0/24
var secondSubnet = cidrSubnet('10.0.0.0/16', 24, 1) // 10.0.1.0/24
var hostIp = cidrHost('10.0.0.0/24', 5)             // 10.0.0.5

// JSON parsing
var parsedJson = json(loadTextContent('config.json'))
```

---

## Resources

### Basic Resource Declaration

```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}
```

### Child Resources

```bicep
// Method 1: Parent property
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'data'
  properties: {
    publicAccess: 'None'
  }
}

// Method 2: Nested declaration
resource storageAccountNested 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${storageAccountName}nested'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}

  resource blobServicesNested 'blobServices' = {
    name: 'default'
    properties: {}

    resource containerNested 'containers' = {
      name: 'data'
      properties: {
        publicAccess: 'None'
      }
    }
  }
}
```

### Existing Resources

```bicep
// Reference existing resource in same resource group
resource existingVnet 'Microsoft.Network/virtualNetworks@2023-05-01' existing = {
  name: 'existing-vnet'
}

// Reference existing resource in different resource group
resource existingKeyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: 'existing-keyvault'
  scope: resourceGroup('other-rg')
}

// Reference existing resource in different subscription
resource existingStorage 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: 'existingstorage'
  scope: resourceGroup('other-subscription-id', 'other-rg')
}

// Use existing resource properties
resource subnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: existingVnet
  name: 'new-subnet'
  properties: {
    addressPrefix: '10.0.10.0/24'
  }
}

output vnetId string = existingVnet.id
output keyVaultUri string = existingKeyVault.properties.vaultUri
```

### Resource Dependencies

```bicep
// Implicit dependency (automatic from references)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    // Implicit dependency on storageAccount
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
      ]
    }
  }
}

// Explicit dependency with dependsOn
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${storageAccount.name}'
  scope: storageAccount
  dependsOn: [
    logAnalyticsWorkspace
  ]
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'StorageRead'
        enabled: true
      }
    ]
  }
}
```

---

## Modules

### Module Definition

```bicep
// modules/storage-account.bicep
@description('Storage account name')
param storageAccountName string

@description('Location for resources')
param location string = resourceGroup().location

@description('Storage SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
])
param sku string = 'Standard_LRS'

@description('Tags for resources')
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

@description('The resource ID of the storage account')
output id string = storageAccount.id

@description('The name of the storage account')
output name string = storageAccount.name

@description('The primary blob endpoint')
output primaryBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
```

### Module Consumption

```bicep
// main.bicep
param environmentName string
param location string = resourceGroup().location

// Deploy storage account using module
module storageModule 'modules/storage-account.bicep' = {
  name: 'storage-deployment'
  params: {
    storageAccountName: 'st${environmentName}${uniqueString(resourceGroup().id)}'
    location: location
    sku: environmentName == 'prod' ? 'Standard_GRS' : 'Standard_LRS'
    tags: {
      Environment: environmentName
    }
  }
}

// Use module outputs
output storageAccountId string = storageModule.outputs.id
output storageAccountName string = storageModule.outputs.name
```

### Module with Different Scope

```bicep
// Deploy module to different resource group
module networkModule 'modules/virtual-network.bicep' = {
  name: 'network-deployment'
  scope: resourceGroup('network-rg')
  params: {
    vnetName: 'vnet-${environmentName}'
    location: location
  }
}

// Deploy module to subscription scope
module policyModule 'modules/policy-assignment.bicep' = {
  name: 'policy-deployment'
  scope: subscription()
  params: {
    policyDefinitionId: policyDefinitionId
  }
}

// Deploy module to management group scope
module mgmtGroupModule 'modules/management-group-policy.bicep' = {
  name: 'mgmt-policy-deployment'
  scope: managementGroup('my-management-group')
  params: {
    policyName: 'require-tags'
  }
}
```

### Module Loops

```bicep
// Deploy multiple storage accounts
param storageConfigs array = [
  {
    name: 'data'
    sku: 'Standard_LRS'
  }
  {
    name: 'logs'
    sku: 'Standard_GRS'
  }
  {
    name: 'backup'
    sku: 'Standard_RAGRS'
  }
]

module storageAccounts 'modules/storage-account.bicep' = [for config in storageConfigs: {
  name: 'storage-${config.name}'
  params: {
    storageAccountName: 'st${config.name}${uniqueString(resourceGroup().id)}'
    location: location
    sku: config.sku
    tags: tags
  }
}]

// Access outputs from module array
output storageIds array = [for i in range(0, length(storageConfigs)): storageAccounts[i].outputs.id]
```

### Bicep Registry Modules

```bicep
// Using Azure Container Registry for Bicep modules
module acrStorageModule 'br:myregistry.azurecr.io/bicep/modules/storage:v1.0.0' = {
  name: 'acr-storage-deployment'
  params: {
    storageAccountName: storageAccountName
    location: location
  }
}

// Using public Bicep registry
module publicModule 'br/public:avm/res/storage/storage-account:0.9.0' = {
  name: 'public-storage-deployment'
  params: {
    name: storageAccountName
    location: location
  }
}

// Using template specs
module templateSpecModule 'ts:11111111-1111-1111-1111-111111111111/my-rg/storageSpec:1.0.0' = {
  name: 'template-spec-deployment'
  params: {
    storageAccountName: storageAccountName
  }
}
```

---

## Deployment Scopes

### Resource Group Scope (Default)

```bicep
// resource-group-deployment.bicep
targetScope = 'resourceGroup'

param storageAccountName string
param location string = resourceGroup().location

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}
```

### Subscription Scope

```bicep
// subscription-deployment.bicep
targetScope = 'subscription'

param resourceGroupName string
param location string

// Create resource group
resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: {
    Environment: 'prod'
    ManagedBy: 'Bicep'
  }
}

// Deploy resources to the new resource group
module storageModule 'modules/storage-account.bicep' = {
  name: 'storage-deployment'
  scope: rg
  params: {
    storageAccountName: 'st${uniqueString(rg.id)}'
    location: location
  }
}

// Create role assignment at subscription level
resource readerRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().id, 'reader-assignment')
  properties: {
    principalId: principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7')
    principalType: 'ServicePrincipal'
  }
}

// Create policy assignment
resource policyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: 'require-tag-policy'
  properties: {
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/96670d01-0a4d-4649-9c89-2d3abc0a5025'
    displayName: 'Require Environment Tag'
    parameters: {
      tagName: {
        value: 'Environment'
      }
    }
  }
}
```

### Management Group Scope

```bicep
// management-group-deployment.bicep
targetScope = 'managementGroup'

param policyName string
param policyDisplayName string

// Create policy definition at management group level
resource policyDefinition 'Microsoft.Authorization/policyDefinitions@2021-06-01' = {
  name: policyName
  properties: {
    displayName: policyDisplayName
    policyType: 'Custom'
    mode: 'All'
    parameters: {
      allowedLocations: {
        type: 'Array'
        metadata: {
          displayName: 'Allowed locations'
          description: 'The list of allowed locations for resources.'
        }
      }
    }
    policyRule: {
      if: {
        allOf: [
          {
            field: 'location'
            notIn: '[parameters(\'allowedLocations\')]'
          }
          {
            field: 'location'
            notEquals: 'global'
          }
        ]
      }
      then: {
        effect: 'deny'
      }
    }
  }
}

// Assign policy to management group
resource policyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: '${policyName}-assignment'
  properties: {
    policyDefinitionId: policyDefinition.id
    displayName: '${policyDisplayName} Assignment'
    parameters: {
      allowedLocations: {
        value: [
          'eastus'
          'eastus2'
          'westus2'
        ]
      }
    }
  }
}
```

### Tenant Scope

```bicep
// tenant-deployment.bicep
targetScope = 'tenant'

param managementGroupName string
param managementGroupDisplayName string
param parentManagementGroupId string = ''

// Create management group hierarchy
resource managementGroup 'Microsoft.Management/managementGroups@2021-04-01' = {
  name: managementGroupName
  properties: {
    displayName: managementGroupDisplayName
    details: !empty(parentManagementGroupId) ? {
      parent: {
        id: '/providers/Microsoft.Management/managementGroups/${parentManagementGroupId}'
      }
    } : null
  }
}

output managementGroupId string = managementGroup.id
```

---

## Loops and Conditionals

### Resource Loops

```bicep
// Loop with array
param containerNames array = ['data', 'logs', 'backup']

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = [for name in containerNames: {
  parent: blobServices
  name: name
  properties: {
    publicAccess: 'None'
  }
}]

// Loop with index
resource subnets 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = [for (subnet, i) in subnetConfigs: {
  parent: vnet
  name: subnet.name
  properties: {
    addressPrefix: cidrSubnet(vnetAddressPrefix, 24, i)
    serviceEndpoints: subnet.serviceEndpoints
  }
}]

// Loop with range
resource networkSecurityGroups 'Microsoft.Network/networkSecurityGroups@2023-05-01' = [for i in range(0, 3): {
  name: 'nsg-${i}'
  location: location
  properties: {
    securityRules: []
  }
}]

// Nested loops
param environments array = ['dev', 'staging', 'prod']
param regions array = ['eastus', 'westus2']

resource resourceGroups 'Microsoft.Resources/resourceGroups@2023-07-01' = [for env in environments: [for region in regions: {
  name: 'rg-${env}-${region}'
  location: region
}]]

// Loop with object items
param storageConfigurations object = {
  data: {
    sku: 'Standard_LRS'
    tier: 'Hot'
  }
  logs: {
    sku: 'Standard_GRS'
    tier: 'Cool'
  }
}

resource storageAccounts 'Microsoft.Storage/storageAccounts@2023-01-01' = [for config in items(storageConfigurations): {
  name: 'st${config.key}${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: config.value.sku
  }
  kind: 'StorageV2'
  properties: {
    accessTier: config.value.tier
  }
}]
```

### Conditional Resources

```bicep
// Conditional resource deployment
param deployDiagnostics bool = true

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (deployDiagnostics) {
  name: 'diag-${storageAccount.name}'
  scope: storageAccount
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'StorageRead'
        enabled: true
      }
    ]
  }
}

// Conditional based on environment
param environmentName string

resource premiumStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = if (environmentName == 'prod') {
  name: 'stpremium${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Premium_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}

// Conditional module deployment
module monitoringModule 'modules/monitoring.bicep' = if (enableMonitoring) {
  name: 'monitoring-deployment'
  params: {
    workspaceName: logAnalyticsName
    location: location
  }
}

// Conditional with loop
resource conditionalContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = [for container in containers: if (container.deploy) {
  parent: blobServices
  name: container.name
  properties: {
    publicAccess: 'None'
  }
}]
```

### Conditional Properties

```bicep
// Ternary operator for property values
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: environmentName == 'prod' ? 'Standard_GRS' : 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: environmentName == 'prod' ? 'Hot' : 'Cool'
    allowBlobPublicAccess: false
    // Conditional network rules
    networkAcls: enablePrivateEndpoint ? {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    } : {
      defaultAction: 'Allow'
    }
  }
}

// Conditional object spread
var baseProperties = {
  accessTier: 'Hot'
  supportsHttpsTrafficOnly: true
}

var prodProperties = {
  allowBlobPublicAccess: false
  minimumTlsVersion: 'TLS1_2'
  networkAcls: {
    defaultAction: 'Deny'
  }
}

resource conditionalStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: environmentName == 'prod' ? union(baseProperties, prodProperties) : baseProperties
}
```

---

## Outputs

### Basic Outputs

```bicep
// String output
@description('The resource ID of the storage account')
output storageAccountId string = storageAccount.id

// Object output
@description('Storage account properties')
output storageAccountProperties object = {
  name: storageAccount.name
  primaryEndpoint: storageAccount.properties.primaryEndpoints.blob
  resourceGroup: resourceGroup().name
}

// Array output
@description('List of container names')
output containerNames array = [for container in containers: container.name]

// Secure output (hidden in deployment logs)
@description('Storage account connection string')
@secure()
output connectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value}'
```

### Outputs from Loops

```bicep
// Output array from resource loop
resource storageAccounts 'Microsoft.Storage/storageAccounts@2023-01-01' = [for name in storageNames: {
  name: 'st${name}${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}]

output storageAccountIds array = [for (name, i) in storageNames: storageAccounts[i].id]
output storageAccountEndpoints array = [for (name, i) in storageNames: storageAccounts[i].properties.primaryEndpoints.blob]

// Complex output structure
output storageDetails array = [for (name, i) in storageNames: {
  name: storageAccounts[i].name
  id: storageAccounts[i].id
  endpoint: storageAccounts[i].properties.primaryEndpoints.blob
}]
```

### Outputs from Modules

```bicep
// Module outputs
module networkModule 'modules/virtual-network.bicep' = {
  name: 'network-deployment'
  params: {
    vnetName: vnetName
    location: location
  }
}

output vnetId string = networkModule.outputs.vnetId
output subnetIds array = networkModule.outputs.subnetIds

// Outputs from module loops
module storageModules 'modules/storage-account.bicep' = [for config in storageConfigs: {
  name: 'storage-${config.name}'
  params: {
    storageAccountName: 'st${config.name}${uniqueString(resourceGroup().id)}'
    location: location
  }
}]

output moduleOutputs array = [for (config, i) in storageConfigs: {
  name: config.name
  id: storageModules[i].outputs.id
  endpoint: storageModules[i].outputs.primaryBlobEndpoint
}]
```

---

## Secret Management

### Key Vault References

```bicep
// Reference existing Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
  scope: resourceGroup(keyVaultResourceGroup)
}

// Get secret from Key Vault
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: keyVault.getSecret('sql-admin-password')
  }
}

// Reference Key Vault secret in module
module appService 'modules/app-service.bicep' = {
  name: 'app-service-deployment'
  params: {
    appName: appName
    location: location
    // Pass secret reference to module
    connectionString: keyVault.getSecret('app-connection-string')
  }
}
```

### Creating Key Vault with Secrets

```bicep
// Create Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

// Create secret with secure parameter
@secure()
param adminPassword string

resource adminPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'admin-password'
  properties: {
    value: adminPassword
    contentType: 'password'
    attributes: {
      enabled: true
      exp: dateTimeToEpoch(dateTimeAdd(utcNow(), 'P90D'))
    }
  }
}

// Create secret from resource output
resource storageAccountKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-account-key'
  properties: {
    value: storageAccount.listKeys().keys[0].value
    contentType: 'storage-key'
  }
}
```

### Secure Parameters

```bicep
// Secure string parameter (never logged)
@description('The administrator password for the SQL server')
@secure()
param sqlAdminPassword string

// Secure object parameter
@description('Credentials for external services')
@secure()
param credentials object

// Using secure parameters
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: sqlAdminPassword
  }
}

// Secure output
@description('Generated connection string')
@secure()
output connectionString string = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${databaseName};'
```

---

## Security Best Practices

### Network Security

```bicep
// Virtual Network with NSG
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-${subnetName}'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: 'VirtualNetwork'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

// Private Endpoint for Storage
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-${storageAccount.name}'
  location: location
  properties: {
    privateLinkServiceConnections: [
      {
        name: 'storage-connection'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: [
            'blob'
          ]
        }
      }
    ]
    subnet: {
      id: subnet.id
    }
  }
}

// Private DNS Zone
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.blob.${environment().suffixes.storage}'
  location: 'global'
}

resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}
```

### IAM and RBAC

```bicep
// Role assignment for managed identity
param principalId string

@description('Built-in role definition IDs')
var roleDefinitions = {
  contributor: 'b24988ac-6180-42a0-ab88-20f7382dd24c'
  reader: 'acdd72a7-3385-48ef-bd42-f606fba81ae7'
  storageBlobDataContributor: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
  storageBlobDataReader: '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1'
  keyVaultSecretsUser: '4633458b-17de-408a-b874-0445c86b69e6'
}

// Assign Storage Blob Data Contributor to managed identity
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, principalId, roleDefinitions.storageBlobDataContributor)
  scope: storageAccount
  properties: {
    principalId: principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitions.storageBlobDataContributor)
    principalType: 'ServicePrincipal'
  }
}

// Assign Key Vault Secrets User
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, principalId, roleDefinitions.keyVaultSecretsUser)
  scope: keyVault
  properties: {
    principalId: principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitions.keyVaultSecretsUser)
    principalType: 'ServicePrincipal'
  }
}
```

### Managed Identity

```bicep
// User-assigned managed identity
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${workloadName}-${environmentName}'
  location: location
  tags: tags
}

// App Service with managed identity
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appServiceName
  location: location
  identity: {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AZURE_CLIENT_ID'
          value: managedIdentity.properties.clientId
        }
      ]
    }
  }
}

// Function App with system-assigned identity
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
  }
}

// Output principal IDs for role assignments
output systemAssignedPrincipalId string = functionApp.identity.principalId
output userAssignedPrincipalId string = managedIdentity.properties.principalId
output userAssignedClientId string = managedIdentity.properties.clientId
```

### Encryption

```bicep
// Customer-managed key for storage
resource storageAccountCMK 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Keyvault'
      keyvaultproperties: {
        keyname: encryptionKey.name
        keyvaulturi: keyVault.properties.vaultUri
      }
      identity: {
        userAssignedIdentity: managedIdentity.id
      }
    }
  }
}

// SQL Database with TDE
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

resource tde 'Microsoft.Sql/servers/databases/transparentDataEncryption@2023-05-01-preview' = {
  parent: sqlDatabase
  name: 'current'
  properties: {
    state: 'Enabled'
  }
}
```

---

## Testing

### What-If Deployments

```bash
# Preview changes before deployment (Azure CLI)
az deployment group what-if \
  --resource-group myResourceGroup \
  --template-file main.bicep \
  --parameters @parameters.prod.json

# Subscription-level what-if
az deployment sub what-if \
  --location eastus \
  --template-file subscription.bicep \
  --parameters environmentName=prod

# Output what-if results as JSON
az deployment group what-if \
  --resource-group myResourceGroup \
  --template-file main.bicep \
  --parameters @parameters.prod.json \
  --out json > whatif-results.json
```

### Bicep Linting

```bash
# Run Bicep linter
az bicep lint --file main.bicep

# Build with warnings as errors
az bicep build --file main.bicep --stdout 2>&1 | grep -E "(Warning|Error)"

# Lint all files in directory
find . -name "*.bicep" -exec az bicep lint --file {} \;
```

### Unit Testing with PSRule

```powershell
# Install PSRule for Azure
Install-Module -Name PSRule.Rules.Azure -Scope CurrentUser

# Run PSRule analysis
Assert-PSRule -Module PSRule.Rules.Azure -InputPath . -Format File -OutputFormat NUnit3 -OutputPath results.xml

# Configuration file: ps-rule.yaml
# binding:
#   targetType:
#     - resourceType
#     - type
# input:
#   pathIgnore:
#     - ".git/**"
#     - "*.md"
# output:
#   culture:
#     - en-US
# rule:
#   include:
#     - Azure.Resource.*
#     - Azure.Storage.*
#     - Azure.KeyVault.*
```

```yaml
# ps-rule.yaml
binding:
  targetType:
    - resourceType
    - type

configuration:
  AZURE_BICEP_FILE_EXPANSION: true
  AZURE_BICEP_FILE_EXPANSION_TIMEOUT: 10

input:
  pathIgnore:
    - ".git/**"
    - "*.md"
    - "**/*.json"

output:
  culture:
    - en-US

rule:
  include:
    - Azure.Resource.*
    - Azure.Storage.*
    - Azure.KeyVault.*
    - Azure.SQL.*
    - Azure.AppService.*
```

### Integration Testing

```bicep
// test/storage-account.test.bicep
// Test module for storage account

param testName string = 'storage-test-${uniqueString(resourceGroup().id)}'

// Deploy module under test
module storageUnderTest '../modules/storage-account.bicep' = {
  name: 'storage-test-deployment'
  params: {
    storageAccountName: testName
    location: resourceGroup().location
    sku: 'Standard_LRS'
  }
}

// Assertions via outputs
output testResults object = {
  passed: true
  tests: [
    {
      name: 'Storage account created'
      result: !empty(storageUnderTest.outputs.id)
    }
    {
      name: 'Storage account name matches'
      result: storageUnderTest.outputs.name == testName
    }
    {
      name: 'Blob endpoint available'
      result: contains(storageUnderTest.outputs.primaryBlobEndpoint, 'blob.core.windows.net')
    }
  ]
}
```

```bash
# Run integration test
az deployment group create \
  --resource-group test-rg \
  --template-file test/storage-account.test.bicep \
  --query "properties.outputs.testResults.value" \
  --output json

# Clean up test resources
az group delete --name test-rg --yes --no-wait
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Bicep CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'bicep/**'
  pull_request:
    branches: [main]
    paths:
      - 'bicep/**'

permissions:
  id-token: write
  contents: read

env:
  AZURE_RESOURCEGROUP_NAME: myResourceGroup
  AZURE_LOCATION: eastus

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bicep
        run: |
          az bicep install
          az bicep version

      - name: Lint Bicep files
        run: |
          find bicep -name "*.bicep" -exec az bicep lint --file {} \;

      - name: Build Bicep files
        run: |
          find bicep -name "*.bicep" -exec az bicep build --file {} \;

      - name: Run PSRule analysis
        uses: microsoft/ps-rule@v2
        with:
          modules: PSRule.Rules.Azure
          inputPath: bicep/
          outputFormat: NUnit3
          outputPath: reports/ps-rule-results.xml

      - name: Upload PSRule results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: psrule-results
          path: reports/

  preview:
    needs: validate
    runs-on: ubuntu-latest
    environment: development
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: What-If deployment
        uses: azure/arm-deploy@v2
        with:
          resourceGroupName: ${{ env.AZURE_RESOURCEGROUP_NAME }}
          template: bicep/main.bicep
          parameters: bicep/parameters/dev.bicepparam
          additionalArguments: --what-if

  deploy-dev:
    needs: preview
    runs-on: ubuntu-latest
    environment: development
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to Dev
        uses: azure/arm-deploy@v2
        with:
          resourceGroupName: ${{ env.AZURE_RESOURCEGROUP_NAME }}
          template: bicep/main.bicep
          parameters: bicep/parameters/dev.bicepparam
          failOnStdErr: false

  deploy-prod:
    needs: deploy-dev
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to Production
        uses: azure/arm-deploy@v2
        with:
          resourceGroupName: rg-prod
          template: bicep/main.bicep
          parameters: bicep/parameters/prod.bicepparam
          failOnStdErr: false
```

### Azure DevOps Pipeline

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - bicep/**

pool:
  vmImage: ubuntu-latest

variables:
  - group: azure-credentials
  - name: resourceGroupName
    value: myResourceGroup
  - name: location
    value: eastus

stages:
  - stage: Validate
    displayName: Validate Bicep
    jobs:
      - job: ValidateBicep
        displayName: Lint and Build
        steps:
          - task: AzureCLI@2
            displayName: Install Bicep
            inputs:
              azureSubscription: $(azureServiceConnection)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                az bicep install
                az bicep version

          - task: AzureCLI@2
            displayName: Lint Bicep files
            inputs:
              azureSubscription: $(azureServiceConnection)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                find bicep -name "*.bicep" -exec az bicep lint --file {} \;

          - task: AzureCLI@2
            displayName: Build Bicep files
            inputs:
              azureSubscription: $(azureServiceConnection)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                find bicep -name "*.bicep" -exec az bicep build --file {} \;

          - task: ps-rule-assert@2
            displayName: Run PSRule
            inputs:
              inputType: inputPath
              inputPath: bicep/
              modules: PSRule.Rules.Azure
              outputFormat: NUnit3
              outputPath: $(Build.ArtifactStagingDirectory)/ps-rule-results.xml

          - task: PublishTestResults@2
            displayName: Publish PSRule Results
            inputs:
              testResultsFormat: NUnit
              testResultsFiles: '$(Build.ArtifactStagingDirectory)/ps-rule-results.xml'
              failTaskOnFailedTests: true

  - stage: DeployDev
    displayName: Deploy to Dev
    dependsOn: Validate
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployDev
        displayName: Deploy to Dev Environment
        environment: development
        strategy:
          runOnce:
            deploy:
              steps:
                - checkout: self

                - task: AzureCLI@2
                  displayName: What-If Deployment
                  inputs:
                    azureSubscription: $(azureServiceConnection)
                    scriptType: bash
                    scriptLocation: inlineScript
                    inlineScript: |
                      az deployment group what-if \
                        --resource-group $(resourceGroupName) \
                        --template-file bicep/main.bicep \
                        --parameters @bicep/parameters/dev.bicepparam

                - task: AzureResourceManagerTemplateDeployment@3
                  displayName: Deploy Bicep
                  inputs:
                    azureResourceManagerConnection: $(azureServiceConnection)
                    subscriptionId: $(subscriptionId)
                    resourceGroupName: $(resourceGroupName)
                    location: $(location)
                    templateLocation: linkedArtifact
                    csmFile: bicep/main.bicep
                    csmParametersFile: bicep/parameters/dev.bicepparam
                    deploymentMode: Incremental
```

### Deployment Script

```bash
#!/bin/bash
# deploy.sh - Bicep deployment script

set -euo pipefail

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-myResourceGroup}"
LOCATION="${LOCATION:-eastus}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
TEMPLATE_FILE="${TEMPLATE_FILE:-main.bicep}"
PARAMETERS_FILE="${PARAMETERS_FILE:-parameters/${ENVIRONMENT}.bicepparam}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Validate Bicep files
validate() {
  log_info "Validating Bicep files..."
  az bicep build --file "$TEMPLATE_FILE" --stdout > /dev/null
  log_info "Validation successful"
}

# Run what-if deployment
whatif() {
  log_info "Running what-if deployment..."
  az deployment group what-if \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$TEMPLATE_FILE" \
    --parameters "@$PARAMETERS_FILE"
}

# Deploy resources
deploy() {
  log_info "Deploying to resource group: $RESOURCE_GROUP"

  # Create resource group if it doesn't exist
  if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
    log_info "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
  fi

  # Deploy
  az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$TEMPLATE_FILE" \
    --parameters "@$PARAMETERS_FILE" \
    --name "deployment-$(date +%Y%m%d%H%M%S)"

  log_info "Deployment completed successfully"
}

# Main
case "${1:-deploy}" in
  validate) validate ;;
  whatif) whatif ;;
  deploy) validate && deploy ;;
  *)
    echo "Usage: $0 {validate|whatif|deploy}"
    exit 1
    ;;
esac
```

---

## IDE Integration

### VS Code Configuration

```json
// .vscode/settings.json
{
  "bicep.decompileOnPaste": true,
  "bicep.enableOutputTimestamps": true,

  "[bicep]": {
    "editor.defaultFormatter": "ms-azuretools.vscode-bicep",
    "editor.formatOnSave": true,
    "editor.tabSize": 2,
    "editor.insertSpaces": true,
    "editor.rulers": [120]
  },

  "files.associations": {
    "*.bicep": "bicep",
    "*.bicepparam": "bicep-params"
  },

  "editor.quickSuggestions": {
    "strings": true
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-azuretools.vscode-bicep",
    "ms-vscode.azure-account",
    "ms-azuretools.vscode-azureresourcegroups",
    "bewhite.psrule-vscode"
  ]
}
```

### bicepconfig.json

```json
{
  "analyzers": {
    "core": {
      "enabled": true,
      "rules": {
        "no-hardcoded-env-urls": {
          "level": "error"
        },
        "no-unused-params": {
          "level": "warning"
        },
        "no-unused-vars": {
          "level": "warning"
        },
        "prefer-interpolation": {
          "level": "warning"
        },
        "secure-parameter-default": {
          "level": "error"
        },
        "simplify-interpolation": {
          "level": "warning"
        },
        "use-recent-api-versions": {
          "level": "warning",
          "maxAgeInDays": 730
        },
        "use-secure-value-for-secure-inputs": {
          "level": "error"
        },
        "adminusername-should-not-be-literal": {
          "level": "error"
        },
        "outputs-should-not-contain-secrets": {
          "level": "error"
        },
        "max-outputs": {
          "level": "warning"
        },
        "max-params": {
          "level": "warning"
        },
        "max-resources": {
          "level": "warning"
        },
        "max-variables": {
          "level": "warning"
        },
        "explicit-values-for-loc-params": {
          "level": "warning"
        }
      }
    }
  },
  "moduleAliases": {
    "br": {
      "public": {
        "registry": "mcr.microsoft.com",
        "modulePath": "bicep"
      },
      "myregistry": {
        "registry": "myregistry.azurecr.io",
        "modulePath": "bicep/modules"
      }
    },
    "ts": {
      "myspecs": {
        "subscription": "00000000-0000-0000-0000-000000000000",
        "resourceGroup": "template-specs-rg"
      }
    }
  },
  "experimentalFeaturesEnabled": {
    "assertions": true,
    "extensibility": true,
    "resourceTypedParamsAndOutputs": true,
    "sourceMapping": true,
    "symbolicNameCodegen": true
  }
}
```

---

## Project Structure

### Single Module

```text
project/
├── main.bicep                    # Main deployment file
├── bicepconfig.json             # Bicep configuration
├── parameters/
│   ├── dev.bicepparam           # Development parameters
│   ├── staging.bicepparam       # Staging parameters
│   └── prod.bicepparam          # Production parameters
└── README.md                    # Documentation
```

### Multi-Module Project

```text
project/
├── bicepconfig.json             # Bicep configuration
├── main.bicep                   # Main orchestration file
├── modules/
│   ├── networking/
│   │   ├── virtual-network.bicep
│   │   ├── network-security-group.bicep
│   │   └── private-endpoint.bicep
│   ├── compute/
│   │   ├── app-service.bicep
│   │   ├── function-app.bicep
│   │   └── container-apps.bicep
│   ├── storage/
│   │   ├── storage-account.bicep
│   │   └── cosmos-db.bicep
│   ├── security/
│   │   ├── key-vault.bicep
│   │   └── managed-identity.bicep
│   └── monitoring/
│       ├── log-analytics.bicep
│       └── app-insights.bicep
├── parameters/
│   ├── dev.bicepparam
│   ├── staging.bicepparam
│   └── prod.bicepparam
├── test/
│   ├── storage-account.test.bicep
│   └── networking.test.bicep
├── .github/
│   └── workflows/
│       └── bicep-ci.yml
└── README.md
```

### Enterprise Landing Zone

```text
landing-zone/
├── bicepconfig.json
├── platform/
│   ├── management-groups/
│   │   └── main.bicep           # Management group hierarchy
│   ├── connectivity/
│   │   ├── hub-network.bicep    # Hub virtual network
│   │   ├── firewall.bicep       # Azure Firewall
│   │   └── dns.bicep            # Private DNS zones
│   ├── identity/
│   │   └── aad-config.bicep     # Azure AD configuration
│   └── management/
│       ├── log-analytics.bicep  # Central logging
│       └── automation.bicep     # Automation account
├── policies/
│   ├── definitions/
│   │   ├── require-tags.bicep
│   │   └── allowed-locations.bicep
│   └── assignments/
│       └── baseline.bicep
├── landing-zones/
│   ├── corp/
│   │   └── main.bicep           # Corporate landing zone
│   └── online/
│       └── main.bicep           # Online landing zone
├── workloads/
│   ├── app-template/
│   │   └── main.bicep           # Application template
│   └── data-template/
│       └── main.bicep           # Data platform template
└── parameters/
    ├── platform/
    │   ├── dev.bicepparam
    │   └── prod.bicepparam
    └── workloads/
        ├── app1-dev.bicepparam
        └── app1-prod.bicepparam
```

---

## Anti-Patterns

### Hardcoded Values

```bicep
// Bad - Hardcoded values
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystorageaccount123'  // Hardcoded name
  location: 'eastus'           // Hardcoded location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}

// Good - Parameterized values
@description('Storage account name')
param storageAccountName string

@description('Location for resources')
param location string = resourceGroup().location

@description('Storage SKU')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS'])
param storageSku string = 'Standard_LRS'

resource storageAccountGood 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: storageSku
  }
  kind: 'StorageV2'
  properties: {}
}
```

### Missing Validation

```bicep
// Bad - No parameter validation
param environmentName string
param instanceCount int
param prefix string

// Good - Proper validation
@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environmentNameValidated string

@description('Number of instances')
@minValue(1)
@maxValue(10)
param instanceCountValidated int = 2

@description('Resource prefix')
@minLength(3)
@maxLength(10)
param prefixValidated string
```

### Secrets in Plain Text

```bicep
// Bad - Password as plain parameter
param adminPassword string = 'P@ssw0rd123!'  // NEVER DO THIS

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: adminPassword  // Exposed in deployment logs
  }
}

// Good - Secure parameter with Key Vault
@description('Admin password')
@secure()
param adminPasswordSecure string

// Or use Key Vault reference
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
  scope: resourceGroup(keyVaultRg)
}

resource sqlServerSecure 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: keyVault.getSecret('sql-admin-password')
  }
}
```

### Missing Tags

```bicep
// Bad - No tags
resource storageAccountNoTags 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}

// Good - Comprehensive tagging
var defaultTags = {
  Environment: environmentName
  Application: applicationName
  Owner: ownerEmail
  CostCenter: costCenter
  ManagedBy: 'Bicep'
  DeployedAt: utcNow('yyyy-MM-dd')
}

resource storageAccountWithTags 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: union(defaultTags, customTags)
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {}
}
```

### Overly Permissive Network Rules

```bicep
// Bad - Allow all traffic
resource storageAccountOpen 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    networkAcls: {
      defaultAction: 'Allow'  // Anyone can access
    }
  }
}

// Good - Deny by default with specific rules
resource storageAccountSecure 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: [
        {
          id: subnet.id
          action: 'Allow'
        }
      ]
      ipRules: []
    }
  }
}
```

### Monolithic Templates

```bicep
// Bad - Everything in one file (500+ lines)
// main.bicep with all resources mixed together

// Good - Modular approach
// main.bicep - Orchestration only
module networkModule 'modules/networking/virtual-network.bicep' = {
  name: 'network-deployment'
  params: {
    vnetName: vnetName
    location: location
  }
}

module storageModule 'modules/storage/storage-account.bicep' = {
  name: 'storage-deployment'
  params: {
    storageAccountName: storageAccountName
    location: location
    subnetId: networkModule.outputs.subnetId
  }
}

module appModule 'modules/compute/app-service.bicep' = {
  name: 'app-deployment'
  params: {
    appName: appName
    location: location
    storageConnectionString: storageModule.outputs.connectionString
  }
}
```

---

## Tool Configuration

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: bicep-lint
        name: Bicep Lint
        entry: bash -c 'find . -name "*.bicep" -exec az bicep lint --file {} \;'
        language: system
        files: \.bicep$

      - id: bicep-build
        name: Bicep Build
        entry: bash -c 'find . -name "*.bicep" -exec az bicep build --file {} \;'
        language: system
        files: \.bicep$

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json

  - repo: https://github.com/adrienverge/yamllint
    rev: v1.33.0
    hooks:
      - id: yamllint
        args: [--config-file, .yamllint.yaml]
```

### EditorConfig

```ini
# .editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.bicep]
indent_size = 2

[*.{json,bicepparam}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

---

## References

### Official Documentation

- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Bicep Language Reference](https://learn.microsoft.com/azure/azure-resource-manager/bicep/bicep-functions)
- [Azure Resource Manager Templates](https://learn.microsoft.com/azure/azure-resource-manager/templates/)
- [Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/)

### Tools

- [Bicep VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-bicep)
- [PSRule for Azure](https://azure.github.io/PSRule.Rules.Azure/)
- [Azure CLI](https://learn.microsoft.com/cli/azure/)
- [Bicep Playground](https://bicepdemo.z22.web.core.windows.net/)

### Related Guides

- [Terraform Style Guide](terraform.md)
- [AWS CloudFormation Style Guide](cloudformation.md)
- [AWS CDK Style Guide](cdk.md)
- [YAML Style Guide](yaml.md)

---

**Status**: Active
