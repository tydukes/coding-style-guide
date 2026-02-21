---
title: "Crossplane Style Guide"
description: "Comprehensive standards for Crossplane composite resources, compositions, providers, and cloud-agnostic infrastructure APIs"
author: "Tyler Dukes"
tags: [crossplane, kubernetes, iac, infrastructure-as-code, multi-cloud]
category: "Language Guides"
status: "active"
search_keywords: [crossplane, kubernetes, infrastructure as code, compositions, providers, claims, xrd]
---

## Language Overview

**Crossplane** is a Kubernetes-native framework that enables platform teams to build internal cloud
platforms by composing managed cloud resources into higher-level, self-service APIs. It extends
Kubernetes with Custom Resource Definitions (CRDs) to manage external infrastructure using the
same declarative model as Kubernetes workloads.

### Key Characteristics

- **Kubernetes-Native**: Manages infrastructure through the Kubernetes API server
- **Composition-Based**: Builds higher-level abstractions from lower-level managed resources
- **Cloud-Agnostic**: Supports AWS, GCP, Azure, and other providers through a unified API
- **Self-Service**: Platform teams define APIs that application teams consume via Claims
- **GitOps-Ready**: Declarative resources integrate with ArgoCD, Flux, and other GitOps tools
- **Reconciliation Loop**: Continuously drifts infrastructure back to declared state

### Primary Use Cases

- Internal Developer Platforms (IDPs)
- Multi-cloud infrastructure abstraction
- Self-service infrastructure provisioning
- Platform-as-a-Service APIs on Kubernetes
- Standardized cloud resource templates

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Resource Naming** | | | |
| XRDs | `x{resource}s.{group}` | `xpostgresqlinstances.db.example.org` | Plural, prefixed with `x` |
| Claims | `{Resource}` (singular) | `PostgreSQLInstance` | User-facing API name |
| Compositions | `x{resource}s.{cloud}.{group}` | `xpostgresqlinstances.aws.db.example.org` | Cloud-specific |
| Providers | `provider-{cloud}` | `provider-aws` | Lowercase, hyphenated |
| **File Structure** | | | |
| XRDs | `apis/{group}/definition.yaml` | `apis/database/definition.yaml` | One per file |
| Compositions | `apis/{group}/compositions/{cloud}.yaml` | `apis/database/compositions/aws.yaml` | Per cloud |
| Claims | `claims/{namespace}/{resource}.yaml` | `claims/team-a/database.yaml` | Per namespace |
| **Versioning** | | | |
| API Versions | `v1alpha1` → `v1beta1` → `v1` | `v1alpha1` | Follow K8s conventions |
| Provider Versions | Pin major version | `version: ">=v1.0.0"` | Use version constraints |
| **Labels** | | | |
| Required | `app.kubernetes.io/managed-by: crossplane` | See examples | Standard K8s labels |
| Team | `platform.example.org/team` | `team-backend` | Ownership tracking |

---

## Project Structure

### Platform Repository Layout

```text
crossplane-platform/
├── apis/                              # Composite Resource Definitions
│   ├── database/
│   │   ├── definition.yaml            # XRD for database abstraction
│   │   ├── compositions/
│   │   │   ├── aws.yaml               # AWS RDS composition
│   │   │   ├── gcp.yaml               # GCP Cloud SQL composition
│   │   │   └── azure.yaml             # Azure Database composition
│   │   └── examples/
│   │       ├── claim-basic.yaml       # Basic usage example
│   │       └── claim-production.yaml  # Production configuration
│   ├── network/
│   │   ├── definition.yaml            # XRD for network abstraction
│   │   └── compositions/
│   │       ├── aws.yaml
│   │       ├── gcp.yaml
│   │       └── azure.yaml
│   ├── kubernetes/
│   │   ├── definition.yaml            # XRD for K8s cluster abstraction
│   │   └── compositions/
│   │       ├── aws-eks.yaml
│   │       ├── gcp-gke.yaml
│   │       └── azure-aks.yaml
│   ├── storage/
│   │   ├── definition.yaml
│   │   └── compositions/
│   │       ├── aws.yaml
│   │       ├── gcp.yaml
│   │       └── azure.yaml
│   └── cache/
│       ├── definition.yaml
│       └── compositions/
│           ├── aws.yaml
│           ├── gcp.yaml
│           └── azure.yaml
├── providers/                         # Provider configurations
│   ├── provider-aws.yaml
│   ├── provider-gcp.yaml
│   ├── provider-azure.yaml
│   ├── provider-kubernetes.yaml
│   └── provider-helm.yaml
├── config/                            # Provider credentials and config
│   ├── aws/
│   │   ├── providerconfig.yaml
│   │   └── irsa-trust-policy.json
│   ├── gcp/
│   │   ├── providerconfig.yaml
│   │   └── workload-identity.yaml
│   └── azure/
│       ├── providerconfig.yaml
│       └── managed-identity.yaml
├── policies/                          # RBAC and usage policies
│   ├── clusterroles.yaml
│   ├── namespace-claims.yaml
│   └── resource-quotas.yaml
├── tests/                             # Composition tests
│   ├── database/
│   │   ├── aws-basic.yaml
│   │   ├── gcp-basic.yaml
│   │   └── azure-basic.yaml
│   └── network/
│       ├── aws-basic.yaml
│       └── gcp-basic.yaml
└── crossplane.yaml                    # Crossplane configuration package
```

### Configuration Package

```yaml
# crossplane.yaml
# Package metadata for Crossplane configuration
apiVersion: meta.pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: platform-apis
  annotations:
    meta.crossplane.io/maintainer: "Platform Team <platform@example.org>"
    meta.crossplane.io/source: "github.com/example/crossplane-platform"
    meta.crossplane.io/license: "Apache-2.0"
    meta.crossplane.io/description: |
      Internal platform APIs for self-service cloud infrastructure
      provisioning across AWS, GCP, and Azure.
    meta.crossplane.io/readme: |
      This configuration provides composite resources for databases,
      networks, Kubernetes clusters, object storage, and caches.
spec:
  crossplane:
    version: ">=v1.17.0"
  dependsOn:
    - provider: xpkg.upbound.io/upbound/provider-family-aws
      version: ">=v1.0.0"
    - provider: xpkg.upbound.io/upbound/provider-family-gcp
      version: ">=v1.0.0"
    - provider: xpkg.upbound.io/upbound/provider-family-azure
      version: ">=v1.0.0"
```

---

## Composite Resource Definitions (XRDs)

### Database Abstraction

```yaml
# apis/database/definition.yaml
# XRD for a cloud-agnostic PostgreSQL database
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xpostgresqlinstances.database.example.org
  labels:
    platform.example.org/category: data
    platform.example.org/api-version: v1alpha1
  annotations:
    platform.example.org/description: "Self-service PostgreSQL database"
    platform.example.org/docs: "https://docs.example.org/apis/database"
spec:
  group: database.example.org
  names:
    kind: XPostgreSQLInstance
    plural: xpostgresqlinstances
  claimNames:
    kind: PostgreSQLInstance
    plural: postgresqlinstances
  connectionSecretKeys:
    - host
    - port
    - username
    - password
    - database
    - connectionString
  defaultCompositionRef:
    name: xpostgresqlinstances.aws.database.example.org
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  description: "Database configuration parameters"
                  properties:
                    engine:
                      type: string
                      description: "Database engine"
                      enum:
                        - postgres
                      default: postgres
                    engineVersion:
                      type: string
                      description: "Engine version"
                      enum:
                        - "13"
                        - "14"
                        - "15"
                        - "16"
                      default: "16"
                    storageGB:
                      type: integer
                      description: "Storage size in GB"
                      minimum: 20
                      maximum: 10000
                      default: 20
                    size:
                      type: string
                      description: "Instance size class"
                      enum:
                        - small
                        - medium
                        - large
                      default: small
                    highAvailability:
                      type: boolean
                      description: "Enable multi-AZ deployment"
                      default: false
                    backupRetentionDays:
                      type: integer
                      description: "Backup retention in days"
                      minimum: 1
                      maximum: 35
                      default: 7
                    deletionProtection:
                      type: boolean
                      description: "Prevent accidental deletion"
                      default: true
                  required:
                    - storageGB
                    - size
            status:
              type: object
              properties:
                connectionDetails:
                  type: object
                  properties:
                    host:
                      type: string
                    port:
                      type: string
                    database:
                      type: string
                instanceId:
                  type: string
                  description: "Cloud provider instance identifier"
                state:
                  type: string
                  description: "Current instance state"
```

### Network Abstraction

```yaml
# apis/network/definition.yaml
# XRD for a cloud-agnostic virtual network
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xnetworks.network.example.org
  labels:
    platform.example.org/category: networking
    platform.example.org/api-version: v1alpha1
spec:
  group: network.example.org
  names:
    kind: XNetwork
    plural: xnetworks
  claimNames:
    kind: Network
    plural: networks
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    region:
                      type: string
                      description: "Cloud region for deployment"
                    cidr:
                      type: string
                      description: "VPC CIDR block"
                      default: "10.0.0.0/16"
                      pattern: "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"
                    subnetCount:
                      type: integer
                      description: "Number of subnets to create"
                      minimum: 1
                      maximum: 6
                      default: 3
                    enableNAT:
                      type: boolean
                      description: "Enable NAT gateway for private subnets"
                      default: true
                    enableDNS:
                      type: boolean
                      description: "Enable DNS resolution"
                      default: true
                  required:
                    - region
            status:
              type: object
              properties:
                vpcId:
                  type: string
                subnetIds:
                  type: array
                  items:
                    type: string
                securityGroupId:
                  type: string
```

### Kubernetes Cluster Abstraction

```yaml
# apis/kubernetes/definition.yaml
# XRD for a cloud-agnostic Kubernetes cluster
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xkubernetesclusters.compute.example.org
  labels:
    platform.example.org/category: compute
    platform.example.org/api-version: v1alpha1
spec:
  group: compute.example.org
  names:
    kind: XKubernetesCluster
    plural: xkubernetesclusters
  claimNames:
    kind: KubernetesCluster
    plural: kubernetesclusters
  connectionSecretKeys:
    - kubeconfig
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    version:
                      type: string
                      description: "Kubernetes version"
                      enum:
                        - "1.28"
                        - "1.29"
                        - "1.30"
                        - "1.31"
                      default: "1.30"
                    nodeCount:
                      type: integer
                      description: "Number of worker nodes"
                      minimum: 1
                      maximum: 100
                      default: 3
                    nodeSize:
                      type: string
                      description: "Worker node size class"
                      enum:
                        - small
                        - medium
                        - large
                        - xlarge
                      default: medium
                    region:
                      type: string
                      description: "Cloud region"
                    networkRef:
                      type: object
                      description: "Reference to a Network claim"
                      properties:
                        name:
                          type: string
                      required:
                        - name
                  required:
                    - region
                    - nodeCount
            status:
              type: object
              properties:
                clusterName:
                  type: string
                endpoint:
                  type: string
                oidcIssuer:
                  type: string
                nodeGroupStatus:
                  type: string
```

### Object Storage Abstraction

```yaml
# apis/storage/definition.yaml
# XRD for cloud-agnostic object storage
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xobjectstores.storage.example.org
  labels:
    platform.example.org/category: storage
    platform.example.org/api-version: v1alpha1
spec:
  group: storage.example.org
  names:
    kind: XObjectStore
    plural: xobjectstores
  claimNames:
    kind: ObjectStore
    plural: objectstores
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    region:
                      type: string
                      description: "Cloud region for bucket"
                    versioning:
                      type: boolean
                      description: "Enable object versioning"
                      default: true
                    encryption:
                      type: boolean
                      description: "Enable server-side encryption"
                      default: true
                    publicAccess:
                      type: boolean
                      description: "Allow public access (discouraged)"
                      default: false
                    lifecycleRules:
                      type: array
                      description: "Object lifecycle transition rules"
                      items:
                        type: object
                        properties:
                          transitionDays:
                            type: integer
                          storageClass:
                            type: string
                            enum:
                              - infrequent-access
                              - archive
                              - glacier
                  required:
                    - region
            status:
              type: object
              properties:
                bucketName:
                  type: string
                bucketArn:
                  type: string
                region:
                  type: string
```

### Cache Abstraction

```yaml
# apis/cache/definition.yaml
# XRD for cloud-agnostic managed cache
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xcacheinstances.cache.example.org
  labels:
    platform.example.org/category: data
    platform.example.org/api-version: v1alpha1
spec:
  group: cache.example.org
  names:
    kind: XCacheInstance
    plural: xcacheinstances
  claimNames:
    kind: CacheInstance
    plural: cacheinstances
  connectionSecretKeys:
    - host
    - port
    - password
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    engine:
                      type: string
                      description: "Cache engine type"
                      enum:
                        - redis
                        - memcached
                      default: redis
                    engineVersion:
                      type: string
                      description: "Cache engine version"
                      default: "7.0"
                    size:
                      type: string
                      description: "Instance size class"
                      enum:
                        - small
                        - medium
                        - large
                      default: small
                    region:
                      type: string
                    highAvailability:
                      type: boolean
                      description: "Enable replication"
                      default: false
                  required:
                    - region
                    - size
            status:
              type: object
              properties:
                endpoint:
                  type: string
                port:
                  type: integer
                state:
                  type: string
```

---

## Compositions

### AWS Database Composition

```yaml
# apis/database/compositions/aws.yaml
# Composition mapping XPostgreSQLInstance to AWS RDS resources
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xpostgresqlinstances.aws.database.example.org
  labels:
    provider: aws
    platform.example.org/category: data
  annotations:
    platform.example.org/description: "PostgreSQL on AWS RDS"
    platform.example.org/cloud: aws
spec:
  compositeTypeRef:
    apiVersion: database.example.org/v1alpha1
    kind: XPostgreSQLInstance
  mode: Pipeline
  pipeline:
    - step: patch-and-transform
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          # Subnet Group for RDS
          - name: subnet-group
            base:
              apiVersion: rds.aws.upbound.io/v1beta1
              kind: SubnetGroup
              spec:
                forProvider:
                  region: us-east-1
                  description: "Subnet group for PostgreSQL instance"
                  tags:
                    managed-by: crossplane
                    platform: example-org
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region

          # RDS Instance
          - name: rds-instance
            base:
              apiVersion: rds.aws.upbound.io/v1beta2
              kind: Instance
              spec:
                forProvider:
                  region: us-east-1
                  engine: postgres
                  engineVersion: "16"
                  instanceClass: db.t3.micro
                  allocatedStorage: 20
                  storageType: gp3
                  storageEncrypted: true
                  publiclyAccessible: false
                  skipFinalSnapshot: false
                  autoMinorVersionUpgrade: true
                  backupRetentionPeriod: 7
                  deletionProtection: true
                  copyTagsToSnapshot: true
                  performanceInsightsEnabled: true
                  enabledCloudwatchLogsExports:
                    - postgresql
                    - upgrade
                  tags:
                    managed-by: crossplane
                    platform: example-org
                writeConnectionSecretToRef:
                  namespace: crossplane-system
            patches:
              # Region
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region

              # Engine version
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.engineVersion
                toFieldPath: spec.forProvider.engineVersion

              # Storage
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.storageGB
                toFieldPath: spec.forProvider.allocatedStorage

              # Instance size mapping
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.size
                toFieldPath: spec.forProvider.instanceClass
                transforms:
                  - type: map
                    map:
                      small: db.t3.micro
                      medium: db.t3.medium
                      large: db.r6g.large

              # High availability
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.highAvailability
                toFieldPath: spec.forProvider.multiAz

              # Backup retention
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.backupRetentionDays
                toFieldPath: spec.forProvider.backupRetentionPeriod

              # Deletion protection
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.deletionProtection
                toFieldPath: spec.forProvider.deletionProtection

              # Connection secret name
              - type: FromCompositeFieldPath
                fromFieldPath: metadata.uid
                toFieldPath: spec.writeConnectionSecretToRef.name
                transforms:
                  - type: string
                    string:
                      type: Format
                      fmt: "%s-rds"

              # Status patches
              - type: ToCompositeFieldPath
                fromFieldPath: status.atProvider.address
                toFieldPath: status.connectionDetails.host

              - type: ToCompositeFieldPath
                fromFieldPath: status.atProvider.id
                toFieldPath: status.instanceId

            connectionDetails:
              - name: host
                fromFieldPath: status.atProvider.address
                type: FromFieldPath
              - name: port
                type: FromValue
                value: "5432"
              - name: username
                fromConnectionSecretKey: username
                type: FromConnectionSecretKey
              - name: password
                fromConnectionSecretKey: password
                type: FromConnectionSecretKey
              - name: database
                type: FromValue
                value: postgres
```

### GCP Database Composition

```yaml
# apis/database/compositions/gcp.yaml
# Composition mapping XPostgreSQLInstance to GCP Cloud SQL
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xpostgresqlinstances.gcp.database.example.org
  labels:
    provider: gcp
    platform.example.org/category: data
spec:
  compositeTypeRef:
    apiVersion: database.example.org/v1alpha1
    kind: XPostgreSQLInstance
  mode: Pipeline
  pipeline:
    - step: patch-and-transform
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          - name: cloudsql-instance
            base:
              apiVersion: sql.gcp.upbound.io/v1beta2
              kind: DatabaseInstance
              spec:
                forProvider:
                  databaseVersion: POSTGRES_16
                  region: us-central1
                  deletionProtection: true
                  settings:
                    - tier: db-f1-micro
                      diskType: PD_SSD
                      diskSize: 20
                      diskAutoresize: true
                      availabilityType: ZONAL
                      backupConfiguration:
                        - enabled: true
                          startTime: "03:00"
                          pointInTimeRecoveryEnabled: true
                          backupRetentionSettings:
                            - retainedBackups: 7
                      ipConfiguration:
                        - ipv4Enabled: false
                          requireSsl: true
                      insightsConfig:
                        - queryInsightsEnabled: true
                          queryPlansPerMinute: 5
                      databaseFlags:
                        - name: log_checkpoints
                          value: "on"
                        - name: log_connections
                          value: "on"
                      userLabels:
                        managed-by: crossplane
                        platform: example-org
                writeConnectionSecretToRef:
                  namespace: crossplane-system
            patches:
              # Region
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region

              # Engine version
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.engineVersion
                toFieldPath: spec.forProvider.databaseVersion
                transforms:
                  - type: string
                    string:
                      type: Format
                      fmt: "POSTGRES_%s"

              # Storage
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.storageGB
                toFieldPath: spec.forProvider.settings[0].diskSize

              # Instance size mapping (GCP tiers)
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.size
                toFieldPath: spec.forProvider.settings[0].tier
                transforms:
                  - type: map
                    map:
                      small: db-f1-micro
                      medium: db-custom-2-8192
                      large: db-custom-4-16384

              # High availability
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.highAvailability
                toFieldPath: spec.forProvider.settings[0].availabilityType
                transforms:
                  - type: map
                    map:
                      "true": REGIONAL
                      "false": ZONAL

              # Connection secret name
              - type: FromCompositeFieldPath
                fromFieldPath: metadata.uid
                toFieldPath: spec.writeConnectionSecretToRef.name
                transforms:
                  - type: string
                    string:
                      type: Format
                      fmt: "%s-cloudsql"

            connectionDetails:
              - name: host
                fromFieldPath: status.atProvider.privateIpAddress
                type: FromFieldPath
              - name: port
                type: FromValue
                value: "5432"
              - name: username
                fromConnectionSecretKey: username
                type: FromConnectionSecretKey
              - name: password
                fromConnectionSecretKey: password
                type: FromConnectionSecretKey

          # Cloud SQL Database
          - name: cloudsql-database
            base:
              apiVersion: sql.gcp.upbound.io/v1beta1
              kind: Database
              spec:
                forProvider:
                  instanceSelector:
                    matchControllerRef: true
                  charset: UTF8
                  collation: en_US.UTF8
```

### Azure Database Composition

```yaml
# apis/database/compositions/azure.yaml
# Composition mapping XPostgreSQLInstance to Azure Database for PostgreSQL
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xpostgresqlinstances.azure.database.example.org
  labels:
    provider: azure
    platform.example.org/category: data
spec:
  compositeTypeRef:
    apiVersion: database.example.org/v1alpha1
    kind: XPostgreSQLInstance
  mode: Pipeline
  pipeline:
    - step: patch-and-transform
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          - name: resource-group
            base:
              apiVersion: azure.upbound.io/v1beta1
              kind: ResourceGroup
              spec:
                forProvider:
                  location: East US
                  tags:
                    managed-by: crossplane
                    platform: example-org
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.location

          - name: flexible-server
            base:
              apiVersion: dbforpostgresql.azure.upbound.io/v1beta2
              kind: FlexibleServer
              spec:
                forProvider:
                  resourceGroupNameSelector:
                    matchControllerRef: true
                  location: East US
                  version: "16"
                  skuName: B_Standard_B1ms
                  storageMb: 32768
                  geoRedundantBackupEnabled: false
                  backupRetentionDays: 7
                  publicNetworkAccessEnabled: false
                  administratorLogin: psqladmin
                  administratorPasswordSecretRef:
                    name: db-admin-password
                    namespace: crossplane-system
                    key: password
                  tags:
                    managed-by: crossplane
                    platform: example-org
                writeConnectionSecretToRef:
                  namespace: crossplane-system
            patches:
              # Region
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.location

              # Engine version
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.engineVersion
                toFieldPath: spec.forProvider.version

              # Storage mapping (MB to GB)
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.storageGB
                toFieldPath: spec.forProvider.storageMb
                transforms:
                  - type: math
                    math:
                      type: Multiply
                      multiply: 1024

              # Instance size mapping (Azure SKUs)
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.size
                toFieldPath: spec.forProvider.skuName
                transforms:
                  - type: map
                    map:
                      small: B_Standard_B1ms
                      medium: GP_Standard_D2ds_v4
                      large: GP_Standard_D4ds_v4

              # High availability
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.highAvailability
                toFieldPath: spec.forProvider.highAvailability[0].mode
                transforms:
                  - type: map
                    map:
                      "true": ZoneRedundant
                      "false": Disabled

              # Backup retention
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.backupRetentionDays
                toFieldPath: spec.forProvider.backupRetentionDays

              # Connection secret name
              - type: FromCompositeFieldPath
                fromFieldPath: metadata.uid
                toFieldPath: spec.writeConnectionSecretToRef.name
                transforms:
                  - type: string
                    string:
                      type: Format
                      fmt: "%s-flexibleserver"

            connectionDetails:
              - name: host
                fromFieldPath: status.atProvider.fqdn
                type: FromFieldPath
              - name: port
                type: FromValue
                value: "5432"
              - name: username
                type: FromValue
                value: psqladmin
              - name: password
                fromConnectionSecretKey: password
                type: FromConnectionSecretKey

          # Firewall rule for Azure services
          - name: firewall-rule
            base:
              apiVersion: dbforpostgresql.azure.upbound.io/v1beta1
              kind: FlexibleServerFirewallRule
              spec:
                forProvider:
                  serverIdSelector:
                    matchControllerRef: true
                  startIpAddress: "0.0.0.0"
                  endIpAddress: "0.0.0.0"
```

### AWS Network Composition

```yaml
# apis/network/compositions/aws.yaml
# Composition mapping XNetwork to AWS VPC resources
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xnetworks.aws.network.example.org
  labels:
    provider: aws
    platform.example.org/category: networking
spec:
  compositeTypeRef:
    apiVersion: network.example.org/v1alpha1
    kind: XNetwork
  mode: Pipeline
  pipeline:
    - step: patch-and-transform
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          # VPC
          - name: vpc
            base:
              apiVersion: ec2.aws.upbound.io/v1beta1
              kind: VPC
              spec:
                forProvider:
                  region: us-east-1
                  cidrBlock: "10.0.0.0/16"
                  enableDnsSupport: true
                  enableDnsHostnames: true
                  tags:
                    managed-by: crossplane
                    Name: platform-vpc
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.cidr
                toFieldPath: spec.forProvider.cidrBlock
              - type: ToCompositeFieldPath
                fromFieldPath: status.atProvider.id
                toFieldPath: status.vpcId

          # Internet Gateway
          - name: internet-gateway
            base:
              apiVersion: ec2.aws.upbound.io/v1beta1
              kind: InternetGateway
              spec:
                forProvider:
                  region: us-east-1
                  vpcIdSelector:
                    matchControllerRef: true
                  tags:
                    managed-by: crossplane
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region

          # Public Subnet A
          - name: subnet-public-a
            base:
              apiVersion: ec2.aws.upbound.io/v1beta1
              kind: Subnet
              metadata:
                labels:
                  access: public
                  zone: a
              spec:
                forProvider:
                  region: us-east-1
                  cidrBlock: "10.0.0.0/24"
                  vpcIdSelector:
                    matchControllerRef: true
                  mapPublicIpOnLaunch: true
                  tags:
                    managed-by: crossplane
                    type: public
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.availabilityZone
                transforms:
                  - type: string
                    string:
                      type: Format
                      fmt: "%sa"

          # Private Subnet A
          - name: subnet-private-a
            base:
              apiVersion: ec2.aws.upbound.io/v1beta1
              kind: Subnet
              metadata:
                labels:
                  access: private
                  zone: a
              spec:
                forProvider:
                  region: us-east-1
                  cidrBlock: "10.0.10.0/24"
                  vpcIdSelector:
                    matchControllerRef: true
                  mapPublicIpOnLaunch: false
                  tags:
                    managed-by: crossplane
                    type: private
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.availabilityZone
                transforms:
                  - type: string
                    string:
                      type: Format
                      fmt: "%sa"

          # NAT Gateway (conditional)
          - name: nat-gateway
            base:
              apiVersion: ec2.aws.upbound.io/v1beta1
              kind: NATGateway
              spec:
                forProvider:
                  region: us-east-1
                  subnetIdSelector:
                    matchControllerRef: true
                    matchLabels:
                      access: public
                      zone: a
                  connectivityType: public
                  tags:
                    managed-by: crossplane
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region

          # Security Group
          - name: security-group
            base:
              apiVersion: ec2.aws.upbound.io/v1beta1
              kind: SecurityGroup
              spec:
                forProvider:
                  region: us-east-1
                  vpcIdSelector:
                    matchControllerRef: true
                  description: "Default security group for platform network"
                  tags:
                    managed-by: crossplane
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.region
                toFieldPath: spec.forProvider.region
              - type: ToCompositeFieldPath
                fromFieldPath: status.atProvider.id
                toFieldPath: status.securityGroupId
```

---

## Provider Configuration

### AWS Provider with IRSA

```yaml
# providers/provider-aws.yaml
# AWS provider using IAM Roles for Service Accounts
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-family-aws
spec:
  package: xpkg.upbound.io/upbound/provider-family-aws:v1.17.0
  runtimeConfigRef:
    name: aws-runtime-config
---
# Runtime configuration for pod identity
apiVersion: pkg.crossplane.io/v1beta1
kind: DeploymentRuntimeConfig
metadata:
  name: aws-runtime-config
spec:
  deploymentTemplate:
    spec:
      selector: {}
      template:
        spec:
          serviceAccountName: crossplane-provider-aws
          containers:
            - name: package-runtime
              args:
                - --debug
              resources:
                limits:
                  cpu: 500m
                  memory: 512Mi
                requests:
                  cpu: 100m
                  memory: 256Mi
---
# Provider configuration using IRSA
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: IRSA
```

### GCP Provider with Workload Identity

```yaml
# providers/provider-gcp.yaml
# GCP provider using Workload Identity Federation
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-family-gcp
spec:
  package: xpkg.upbound.io/upbound/provider-family-gcp:v1.10.0
  runtimeConfigRef:
    name: gcp-runtime-config
---
apiVersion: pkg.crossplane.io/v1beta1
kind: DeploymentRuntimeConfig
metadata:
  name: gcp-runtime-config
spec:
  deploymentTemplate:
    spec:
      selector: {}
      template:
        spec:
          serviceAccountName: crossplane-provider-gcp
          containers:
            - name: package-runtime
              resources:
                limits:
                  cpu: 500m
                  memory: 512Mi
                requests:
                  cpu: 100m
                  memory: 256Mi
---
# Provider configuration using injected credentials
apiVersion: gcp.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  projectID: my-project-id
  credentials:
    source: InjectedIdentity
```

### Azure Provider with Managed Identity

```yaml
# providers/provider-azure.yaml
# Azure provider using Pod-managed Identity
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-family-azure
spec:
  package: xpkg.upbound.io/upbound/provider-family-azure:v1.10.0
  runtimeConfigRef:
    name: azure-runtime-config
---
apiVersion: pkg.crossplane.io/v1beta1
kind: DeploymentRuntimeConfig
metadata:
  name: azure-runtime-config
spec:
  deploymentTemplate:
    spec:
      selector: {}
      template:
        spec:
          serviceAccountName: crossplane-provider-azure
          containers:
            - name: package-runtime
              resources:
                limits:
                  cpu: 500m
                  memory: 512Mi
                requests:
                  cpu: 100m
                  memory: 256Mi
---
apiVersion: azure.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: SystemAssignedManagedIdentity
  subscriptionID: 00000000-0000-0000-0000-000000000000
  tenantID: 00000000-0000-0000-0000-000000000000
```

### Kubernetes and Helm Providers

```yaml
# providers/provider-kubernetes.yaml
# In-cluster Kubernetes provider for secondary resource management
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-kubernetes
spec:
  package: xpkg.upbound.io/crossplane-contrib/provider-kubernetes:v0.15.0
---
apiVersion: kubernetes.crossplane.io/v1alpha1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: InjectedIdentity
---
# providers/provider-helm.yaml
# Helm provider for deploying charts as part of compositions
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-helm
spec:
  package: xpkg.upbound.io/crossplane-contrib/provider-helm:v0.19.0
---
apiVersion: helm.crossplane.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: InjectedIdentity
```

---

## Secret Management

### Connection Secret Propagation

```yaml
# Connection secret flow: Managed Resource -> XR -> Claim -> Application
# Step 1: Composition writes managed resource secret to crossplane-system
# Step 2: Crossplane propagates connection details to the Claim namespace

# claims/team-a/database.yaml
# Claim with publishConnectionDetailsTo
apiVersion: database.example.org/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: orders-db
  namespace: team-a
spec:
  parameters:
    storageGB: 50
    size: medium
    highAvailability: true
    backupRetentionDays: 14
  compositionSelector:
    matchLabels:
      provider: aws
  publishConnectionDetailsTo:
    name: orders-db-connection
    metadata:
      labels:
        app.kubernetes.io/managed-by: crossplane
        app.kubernetes.io/part-of: orders-service
    configRef:
      name: default
```

### External Secret Store with Vault

```yaml
# config/vault-store.yaml
# Store connection details in HashiCorp Vault
apiVersion: secrets.crossplane.io/v1alpha1
kind: StoreConfig
metadata:
  name: vault
spec:
  type: Vault
  defaultScope: crossplane-system
  vault:
    mountPath: secret
    version: v2
    auth:
      method: Token
      token:
        source: Secret
        secretRef:
          namespace: crossplane-system
          name: vault-token
          key: token
    server: https://vault.example.org
    caBundle:
      source: Secret
      secretRef:
        namespace: crossplane-system
        name: vault-ca
        key: ca.crt
---
# Reference the store in a Claim
apiVersion: database.example.org/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: orders-db
  namespace: team-a
spec:
  parameters:
    storageGB: 50
    size: medium
  publishConnectionDetailsTo:
    name: orders-db-vault
    configRef:
      name: vault
```

### Consuming Connection Secrets in Applications

```yaml
# Application deployment referencing Crossplane connection secret
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-api
  namespace: team-a
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orders-api
  template:
    metadata:
      labels:
        app: orders-api
    spec:
      containers:
        - name: api
          image: registry.example.org/orders-api:v1.2.0
          envFrom:
            - secretRef:
                name: orders-db-connection
          env:
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: orders-db-connection
                  key: host
            - name: DB_PORT
              valueFrom:
                secretKeyRef:
                  name: orders-db-connection
                  key: port
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: orders-db-connection
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: orders-db-connection
                  key: password
            - name: DB_NAME
              valueFrom:
                secretKeyRef:
                  name: orders-db-connection
                  key: database
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
```

---

## Composition Functions

### Patch and Transform Strategies

```yaml
# Common patch patterns used across compositions

# Map enum values to provider-specific values
# apis/database/compositions/patches/size-mapping.yaml
apiVersion: pt.fn.crossplane.io/v1beta1
kind: Resources
resources:
  - name: example-map-transform
    patches:
      # Map abstract size to cloud-specific instance type
      - type: FromCompositeFieldPath
        fromFieldPath: spec.parameters.size
        toFieldPath: spec.forProvider.instanceClass
        transforms:
          - type: map
            map:
              small: db.t3.micro
              medium: db.t3.medium
              large: db.r6g.large
              xlarge: db.r6g.xlarge

      # String formatting for resource names
      - type: FromCompositeFieldPath
        fromFieldPath: metadata.name
        toFieldPath: metadata.annotations["crossplane.io/external-name"]
        transforms:
          - type: string
            string:
              type: Format
              fmt: "platform-%s"

      # Math transform for unit conversion (GB to MB)
      - type: FromCompositeFieldPath
        fromFieldPath: spec.parameters.storageGB
        toFieldPath: spec.forProvider.storageMb
        transforms:
          - type: math
            math:
              type: Multiply
              multiply: 1024

      # Convert string boolean to actual boolean
      - type: FromCompositeFieldPath
        fromFieldPath: spec.parameters.highAvailability
        toFieldPath: spec.forProvider.multiAz
        transforms:
          - type: convert
            convert:
              toType: bool

      # Combine multiple fields
      - type: CombineFromComposite
        combine:
          variables:
            - fromFieldPath: spec.parameters.region
            - fromFieldPath: metadata.name
          strategy: string
          string:
            fmt: "%s-%s-db"
        toFieldPath: metadata.annotations["crossplane.io/external-name"]
```

### Go Templating Function

```yaml
# Using function-go-templating for complex logic
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xnetworks.aws.network.example.org
spec:
  compositeTypeRef:
    apiVersion: network.example.org/v1alpha1
    kind: XNetwork
  mode: Pipeline
  pipeline:
    - step: create-subnets
      functionRef:
        name: function-go-templating
      input:
        apiVersion: gotemplating.fn.crossplane.io/v1beta1
        kind: GoTemplate
        source: Inline
        inline:
          template: |
            {{ $xr := .observed.composite.resource }}
            {{ $region := $xr.spec.parameters.region }}
            {{ $cidr := $xr.spec.parameters.cidr }}
            {{ $count := $xr.spec.parameters.subnetCount | default 3 }}
            {{ $zones := list "a" "b" "c" "d" "e" "f" }}

            {{ range $i := until (int $count) }}
            ---
            apiVersion: ec2.aws.upbound.io/v1beta1
            kind: Subnet
            metadata:
              name: {{ $xr.metadata.name }}-subnet-{{ index $zones $i }}
              annotations:
                gotemplating.fn.crossplane.io/composition-resource-name: subnet-{{ index $zones $i }}
              labels:
                zone: {{ index $zones $i }}
            spec:
              forProvider:
                region: {{ $region }}
                availabilityZone: {{ $region }}{{ index $zones $i }}
                cidrBlock: "10.0.{{ mul $i 16 }}.0/20"
                vpcIdSelector:
                  matchControllerRef: true
                tags:
                  managed-by: crossplane
                  zone: {{ index $zones $i }}
            {{ end }}

    - step: patch-and-transform
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          - name: vpc
            base:
              apiVersion: ec2.aws.upbound.io/v1beta1
              kind: VPC
              spec:
                forProvider:
                  cidrBlock: "10.0.0.0/16"
                  enableDnsSupport: true
                  enableDnsHostnames: true
```

### Composition Validation Function

```yaml
# Using function-cel-filter for input validation
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xpostgresqlinstances.aws.database.example.org
spec:
  compositeTypeRef:
    apiVersion: database.example.org/v1alpha1
    kind: XPostgreSQLInstance
  mode: Pipeline
  pipeline:
    # Step 1: Validate inputs
    - step: validate-inputs
      functionRef:
        name: function-cel-filter
      input:
        apiVersion: celfilter.fn.crossplane.io/v1beta1
        kind: Filters
        filters:
          # Enforce minimum storage for production
          - name: production-min-storage
            condition: |
              observed.composite.resource.spec.parameters.size == "large" &&
              observed.composite.resource.spec.parameters.storageGB < 100
            message: "Large instances require at least 100GB storage"

          # Enforce HA for large instances
          - name: large-requires-ha
            condition: |
              observed.composite.resource.spec.parameters.size == "large" &&
              !observed.composite.resource.spec.parameters.highAvailability
            message: "Large instances must enable high availability"

    # Step 2: Create resources
    - step: patch-and-transform
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          - name: rds-instance
            base:
              apiVersion: rds.aws.upbound.io/v1beta2
              kind: Instance
              spec:
                forProvider:
                  engine: postgres
```

---

## RBAC and Claims

### Namespace-Scoped Claims

```yaml
# policies/clusterroles.yaml
# RBAC for teams to create Claims in their namespaces

# ClusterRole for database consumers
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: platform:database-consumer
  labels:
    platform.example.org/role: consumer
rules:
  - apiGroups: ["database.example.org"]
    resources: ["postgresqlinstances"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]
    # Only connection secrets
---
# ClusterRole for network consumers
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: platform:network-consumer
  labels:
    platform.example.org/role: consumer
rules:
  - apiGroups: ["network.example.org"]
    resources: ["networks"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
# ClusterRole for Kubernetes cluster consumers
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: platform:kubernetes-consumer
  labels:
    platform.example.org/role: consumer
rules:
  - apiGroups: ["compute.example.org"]
    resources: ["kubernetesclusters"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
# ClusterRole for storage consumers
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: platform:storage-consumer
  labels:
    platform.example.org/role: consumer
rules:
  - apiGroups: ["storage.example.org"]
    resources: ["objectstores"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
# Aggregate role: all platform resources
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: platform:full-consumer
  labels:
    platform.example.org/role: consumer
aggregationRule:
  clusterRoleSelectors:
    - matchLabels:
        platform.example.org/role: consumer
rules: []
---
# Bind to team namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: platform-consumer
  namespace: team-a
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: platform:full-consumer
subjects:
  - kind: Group
    name: team-a-developers
    apiGroup: rbac.authorization.k8s.io
```

### Platform Admin RBAC

```yaml
# policies/platform-admin.yaml
# RBAC for platform team to manage XRDs, Compositions, and Providers

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: platform:admin
rules:
  # Manage composite resources and compositions
  - apiGroups: ["apiextensions.crossplane.io"]
    resources:
      - compositeresourcedefinitions
      - compositions
      - compositionrevisions
    verbs: ["*"]
  # Manage providers
  - apiGroups: ["pkg.crossplane.io"]
    resources:
      - providers
      - providerrevisions
      - configurations
      - configurationrevisions
      - functions
      - functionrevisions
    verbs: ["*"]
  # Manage provider configs
  - apiGroups:
      - aws.upbound.io
      - gcp.upbound.io
      - azure.upbound.io
    resources: ["*"]
    verbs: ["*"]
  # View all composite resources
  - apiGroups:
      - database.example.org
      - network.example.org
      - compute.example.org
      - storage.example.org
      - cache.example.org
    resources: ["*"]
    verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: platform-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: platform:admin
subjects:
  - kind: Group
    name: platform-team
    apiGroup: rbac.authorization.k8s.io
```

### Resource Quotas for Claims

```yaml
# policies/resource-quotas.yaml
# Limit the number and size of Claims per namespace

apiVersion: v1
kind: ResourceQuota
metadata:
  name: platform-claims-quota
  namespace: team-a
spec:
  hard:
    # Limit total Claims per resource type
    count/postgresqlinstances.database.example.org: "5"
    count/networks.network.example.org: "2"
    count/kubernetesclusters.compute.example.org: "3"
    count/objectstores.storage.example.org: "10"
    count/cacheinstances.cache.example.org: "3"
---
# LimitRange for resource sizing constraints
apiVersion: v1
kind: LimitRange
metadata:
  name: platform-limits
  namespace: team-a
spec:
  limits:
    - type: Container
      default:
        cpu: 500m
        memory: 512Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
```

---

## Usage Policies

### Composition Selection

```yaml
# Environment-based composition selection
# claims/team-a/database-dev.yaml
apiVersion: database.example.org/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: orders-db
  namespace: team-a
  labels:
    app.kubernetes.io/name: orders-db
    app.kubernetes.io/part-of: orders-service
    app.kubernetes.io/managed-by: crossplane
    platform.example.org/team: team-a
    platform.example.org/environment: development
spec:
  parameters:
    storageGB: 20
    size: small
    highAvailability: false
    backupRetentionDays: 3
    deletionProtection: false
  compositionSelector:
    matchLabels:
      provider: aws
  publishConnectionDetailsTo:
    name: orders-db-connection
```

```yaml
# claims/team-a/database-prod.yaml
apiVersion: database.example.org/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: orders-db
  namespace: team-a-prod
  labels:
    app.kubernetes.io/name: orders-db
    app.kubernetes.io/part-of: orders-service
    app.kubernetes.io/managed-by: crossplane
    platform.example.org/team: team-a
    platform.example.org/environment: production
spec:
  parameters:
    storageGB: 200
    size: large
    highAvailability: true
    backupRetentionDays: 30
    deletionProtection: true
  compositionSelector:
    matchLabels:
      provider: aws
  publishConnectionDetailsTo:
    name: orders-db-connection
```

### Multi-Cloud Claim Selection

```yaml
# Select GCP composition instead of AWS
apiVersion: database.example.org/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: analytics-db
  namespace: team-b
spec:
  parameters:
    storageGB: 100
    size: medium
    highAvailability: true
    engineVersion: "16"
  compositionSelector:
    matchLabels:
      provider: gcp
  publishConnectionDetailsTo:
    name: analytics-db-connection
---
# Select Azure composition
apiVersion: database.example.org/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: reporting-db
  namespace: team-c
spec:
  parameters:
    storageGB: 50
    size: medium
    highAvailability: false
  compositionSelector:
    matchLabels:
      provider: azure
  publishConnectionDetailsTo:
    name: reporting-db-connection
```

---

## Versioning and Upgrades

### XRD Version Strategy

```yaml
# apis/database/definition-v1beta1.yaml
# Adding a new version alongside the existing one
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xpostgresqlinstances.database.example.org
spec:
  group: database.example.org
  names:
    kind: XPostgreSQLInstance
    plural: xpostgresqlinstances
  claimNames:
    kind: PostgreSQLInstance
    plural: postgresqlinstances
  connectionSecretKeys:
    - host
    - port
    - username
    - password
    - database
    - connectionString
  versions:
    # Existing version (still served)
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    storageGB:
                      type: integer
                      default: 20
                    size:
                      type: string
                      enum: [small, medium, large]
                      default: small
                    highAvailability:
                      type: boolean
                      default: false

    # New version with additional fields
    - name: v1beta1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    storageGB:
                      type: integer
                      default: 20
                    size:
                      type: string
                      enum: [small, medium, large, xlarge]
                      default: small
                    highAvailability:
                      type: boolean
                      default: false
                    # New field in v1beta1
                    monitoring:
                      type: object
                      description: "Monitoring configuration (new in v1beta1)"
                      properties:
                        enabled:
                          type: boolean
                          default: true
                        alertEmail:
                          type: string
                          format: email
                    # New field in v1beta1
                    maintenanceWindow:
                      type: object
                      description: "Maintenance window (new in v1beta1)"
                      properties:
                        dayOfWeek:
                          type: string
                          enum: [MON, TUE, WED, THU, FRI, SAT, SUN]
                          default: SUN
                        startHour:
                          type: integer
                          minimum: 0
                          maximum: 23
                          default: 3
```

### Provider Upgrade Strategy

```yaml
# providers/provider-aws-upgrade.yaml
# Controlled provider upgrade with revision limits
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-family-aws
spec:
  package: xpkg.upbound.io/upbound/provider-family-aws:v1.17.0
  revisionActivationPolicy: Automatic
  revisionHistoryLimit: 3
  runtimeConfigRef:
    name: aws-runtime-config
  # Skip dependency resolution for faster startup
  skipDependencyResolution: false
```

### Configuration Package Versioning

```yaml
# Build and push configuration packages with versioning
# Uses the Crossplane CLI (crank)
```

```bash
#!/usr/bin/env bash
# scripts/build-package.sh
# Build and push Crossplane configuration package

set -euo pipefail

readonly REGISTRY="${REGISTRY:-xpkg.upbound.io}"
readonly PACKAGE_NAME="${PACKAGE_NAME:-example/platform-apis}"
readonly VERSION="${1:?Usage: $0 <version>}"

echo "Building configuration package v${VERSION}..."

# Validate all YAML files
find apis/ providers/ -name '*.yaml' -exec kubectl apply --dry-run=client -f {} \;

# Build the package
crossplane xpkg build \
  --package-root=. \
  --examples-root=apis/ \
  --name="platform-apis-v${VERSION}.xpkg"

# Push to registry
crossplane xpkg push \
  "${REGISTRY}/${PACKAGE_NAME}:v${VERSION}" \
  -f "platform-apis-v${VERSION}.xpkg"

# Tag as latest
crossplane xpkg push \
  "${REGISTRY}/${PACKAGE_NAME}:latest" \
  -f "platform-apis-v${VERSION}.xpkg"

echo "Published ${REGISTRY}/${PACKAGE_NAME}:v${VERSION}"
```

---

## Testing Compositions

### Claim-Based Integration Tests

```yaml
# tests/database/aws-basic.yaml
# Integration test: create and verify a database claim
apiVersion: database.example.org/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: test-db-aws
  namespace: crossplane-test
  labels:
    crossplane.io/test: "true"
spec:
  parameters:
    storageGB: 20
    size: small
    highAvailability: false
    backupRetentionDays: 1
    deletionProtection: false
  compositionSelector:
    matchLabels:
      provider: aws
  publishConnectionDetailsTo:
    name: test-db-aws-connection
```

```bash
#!/usr/bin/env bash
# scripts/test-composition.sh
# Test a composition by creating a Claim and verifying readiness

set -euo pipefail

readonly TEST_FILE="${1:?Usage: $0 <test-yaml>}"
readonly TIMEOUT="${2:-600}"
readonly NAMESPACE="crossplane-test"

# Create test namespace
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

echo "Applying test claim: ${TEST_FILE}"
kubectl apply -f "${TEST_FILE}"

# Extract resource kind and name
RESOURCE_KIND=$(yq '.kind' "${TEST_FILE}")
RESOURCE_NAME=$(yq '.metadata.name' "${TEST_FILE}")

echo "Waiting for ${RESOURCE_KIND}/${RESOURCE_NAME} to become ready..."

# Wait for Claim to be ready
kubectl wait "${RESOURCE_KIND}/${RESOURCE_NAME}" \
  --for=condition=Ready \
  --timeout="${TIMEOUT}s" \
  --namespace="${NAMESPACE}"

echo "Verifying connection secret..."
kubectl get secret -n "${NAMESPACE}" \
  "$(yq '.spec.publishConnectionDetailsTo.name' "${TEST_FILE}")" \
  -o jsonpath='{.data}' | jq 'keys'

echo "Test passed: ${RESOURCE_KIND}/${RESOURCE_NAME} is ready"

# Cleanup
echo "Cleaning up test resources..."
kubectl delete -f "${TEST_FILE}" --wait=true --timeout="${TIMEOUT}s"
kubectl delete namespace "${NAMESPACE}" --wait=true
```

### Composition Render Tests

```bash
#!/usr/bin/env bash
# scripts/render-test.sh
# Offline composition rendering test using crossplane beta render

set -euo pipefail

readonly XR_FILE="${1:?Usage: $0 <xr.yaml> <composition.yaml> <function.yaml>}"
readonly COMPOSITION_FILE="${2:?Missing composition file}"
readonly FUNCTION_FILE="${3:?Missing function file}"

echo "Rendering composition..."

# Render the composition offline (no cluster needed)
crossplane beta render \
  "${XR_FILE}" \
  "${COMPOSITION_FILE}" \
  "${FUNCTION_FILE}" \
  --observed-resources=tests/observed/ \
  --extra-resources=tests/extra/ |
  tee /tmp/rendered-output.yaml

echo ""
echo "Validating rendered resources..."

# Count resources generated
RESOURCE_COUNT=$(yq 'select(.kind != null)' /tmp/rendered-output.yaml | grep -c "^kind:")
echo "Generated ${RESOURCE_COUNT} resources"

# Validate each resource
yq -s '.' /tmp/rendered-output.yaml |
  while read -r resource_file; do
    KIND=$(yq '.kind' "${resource_file}")
    NAME=$(yq '.metadata.name' "${resource_file}")
    echo "  Validated: ${KIND}/${NAME}"
  done

echo "Render test passed"
```

### CI Pipeline for Compositions

```yaml
# .github/workflows/crossplane-test.yml
# CI/CD pipeline for Crossplane platform configurations

name: Crossplane Platform Tests

on:
  push:
    branches: [main]
    paths: ["apis/**", "providers/**", "config/**"]
  pull_request:
    branches: [main]
    paths: ["apis/**", "providers/**", "config/**"]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Crossplane CLI
        run: |
          curl -sL "https://raw.githubusercontent.com/crossplane/crossplane/master/install.sh" | sh
          sudo mv crossplane /usr/local/bin/

      - name: Validate YAML syntax
        run: |
          find apis/ providers/ config/ -name '*.yaml' -exec \
            yq eval '.' {} \; > /dev/null

      - name: Validate XRD schemas
        run: |
          for xrd in apis/*/definition.yaml; do
            echo "Validating: ${xrd}"
            yq eval '.spec.versions[].schema.openAPIV3Schema' "${xrd}" > /dev/null
            echo "  Schema valid"
          done

      - name: Lint compositions
        run: |
          for composition in apis/*/compositions/*.yaml; do
            echo "Validating: ${composition}"
            # Check required fields
            yq eval '.spec.compositeTypeRef' "${composition}" > /dev/null
            yq eval '.spec.mode' "${composition}" > /dev/null
            echo "  Structure valid"
          done

      - name: Build configuration package
        run: |
          crossplane xpkg build \
            --package-root=. \
            --name=platform-apis-test.xpkg

      - name: Upload package artifact
        uses: actions/upload-artifact@v4
        with:
          name: crossplane-package
          path: platform-apis-test.xpkg

  render-test:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v4

      - name: Setup Crossplane CLI
        run: |
          curl -sL "https://raw.githubusercontent.com/crossplane/crossplane/master/install.sh" | sh
          sudo mv crossplane /usr/local/bin/

      - name: Render database compositions
        run: |
          for provider in aws gcp azure; do
            echo "Testing ${provider} database composition..."
            crossplane beta render \
              tests/database/${provider}-basic.yaml \
              apis/database/compositions/${provider}.yaml \
              tests/functions.yaml || exit 1
            echo "${provider} database composition rendered successfully"
          done

      - name: Render network compositions
        run: |
          for provider in aws gcp; do
            echo "Testing ${provider} network composition..."
            crossplane beta render \
              tests/network/${provider}-basic.yaml \
              apis/network/compositions/${provider}.yaml \
              tests/functions.yaml || exit 1
            echo "${provider} network composition rendered successfully"
          done
```

---

## GitOps Integration

### ArgoCD Application for Crossplane

```yaml
# argocd/crossplane-platform.yaml
# Deploy Crossplane platform APIs via ArgoCD
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: crossplane-platform-apis
  namespace: argocd
  labels:
    app.kubernetes.io/managed-by: argocd
    platform.example.org/component: crossplane
  annotations:
    argocd.argoproj.io/sync-wave: "10"
spec:
  project: platform
  source:
    repoURL: https://github.com/example/crossplane-platform.git
    targetRevision: main
    path: .
    directory:
      recurse: true
      include: "{apis/**/*.yaml,providers/*.yaml,config/**/*.yaml}"
  destination:
    server: https://kubernetes.default.svc
    namespace: crossplane-system
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
      - PruneLast=true
    retry:
      limit: 3
      backoff:
        duration: 30s
        factor: 2
        maxDuration: 5m
```

### ArgoCD ApplicationSet for Team Claims

```yaml
# argocd/team-claims-appset.yaml
# Auto-discover and deploy team Claims from Git
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: crossplane-team-claims
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/example/team-infrastructure.git
        revision: main
        directories:
          - path: "teams/*/claims"
  template:
    metadata:
      name: "claims-{{path.basename}}"
      labels:
        app.kubernetes.io/managed-by: argocd
        platform.example.org/component: claims
    spec:
      project: teams
      source:
        repoURL: https://github.com/example/team-infrastructure.git
        targetRevision: main
        path: "{{path}}"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{path[1]}}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

### Flux Kustomization for Crossplane

```yaml
# flux/crossplane-platform.yaml
# Deploy Crossplane platform via Flux
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: crossplane-providers
  namespace: flux-system
spec:
  interval: 10m
  path: ./providers
  prune: true
  sourceRef:
    kind: GitRepository
    name: crossplane-platform
  healthChecks:
    - apiVersion: pkg.crossplane.io/v1
      kind: Provider
      name: provider-family-aws
    - apiVersion: pkg.crossplane.io/v1
      kind: Provider
      name: provider-family-gcp
  dependsOn:
    - name: crossplane-install
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: crossplane-apis
  namespace: flux-system
spec:
  interval: 10m
  path: ./apis
  prune: true
  sourceRef:
    kind: GitRepository
    name: crossplane-platform
  dependsOn:
    - name: crossplane-providers
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: crossplane-config
  namespace: flux-system
spec:
  interval: 10m
  path: ./config
  prune: true
  sourceRef:
    kind: GitRepository
    name: crossplane-platform
  dependsOn:
    - name: crossplane-providers
```

---

## Monitoring and Troubleshooting

### Health Check Commands

```bash
#!/usr/bin/env bash
# scripts/health-check.sh
# Crossplane platform health check

set -euo pipefail

echo "=== Crossplane Platform Health Check ==="
echo ""

# Check Crossplane pods
echo "--- Crossplane System Pods ---"
kubectl get pods -n crossplane-system \
  -o custom-columns='NAME:.metadata.name,STATUS:.status.phase,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp' \
  --sort-by='.metadata.name'

echo ""

# Check providers
echo "--- Provider Status ---"
kubectl get providers \
  -o custom-columns='NAME:.metadata.name,INSTALLED:.status.conditions[?(@.type=="Installed")].status,HEALTHY:.status.conditions[?(@.type=="Healthy")].status,PACKAGE:.spec.package'

echo ""

# Check provider configs
echo "--- Provider Configs ---"
kubectl get providerconfigs --all-namespaces \
  -o custom-columns='NAME:.metadata.name,TYPE:.kind' 2>/dev/null || echo "No provider configs found"

echo ""

# Check XRDs
echo "--- Composite Resource Definitions ---"
kubectl get compositeresourcedefinitions \
  -o custom-columns='NAME:.metadata.name,ESTABLISHED:.status.conditions[?(@.type=="Established")].status,OFFERED:.status.conditions[?(@.type=="Offered")].status'

echo ""

# Check Compositions
echo "--- Compositions ---"
kubectl get compositions \
  -o custom-columns='NAME:.metadata.name,XR-KIND:.spec.compositeTypeRef.kind,XR-VERSION:.spec.compositeTypeRef.apiVersion'

echo ""

# Check Claims across all namespaces
echo "--- Active Claims ---"
for xrd in $(kubectl get xrd -o jsonpath='{.items[*].spec.claimNames.plural}'); do
  echo "  ${xrd}:"
  kubectl get "${xrd}" --all-namespaces \
    -o custom-columns=\
'NAMESPACE:.metadata.namespace,NAME:.metadata.name,READY:.status.conditions[?(@.type=="Ready")].status,SYNCED:.status.conditions[?(@.type=="Synced")].status' \
    2>/dev/null || echo "    (none)"
done

echo ""

# Check for unhealthy resources
echo "--- Unhealthy Managed Resources ---"
kubectl get managed \
  -o custom-columns='KIND:.kind,NAME:.metadata.name,READY:.status.conditions[?(@.type=="Ready")].status,SYNCED:.status.conditions[?(@.type=="Synced")].status' 2>/dev/null |
  grep -v "True.*True" |
  head -20 || echo "All managed resources healthy"

echo ""
echo "=== Health Check Complete ==="
```

### Troubleshooting Events

```bash
#!/usr/bin/env bash
# scripts/debug-claim.sh
# Debug a Crossplane claim and its managed resources

set -euo pipefail

readonly KIND="${1:?Usage: $0 <kind> <name> [namespace]}"
readonly NAME="${2:?Usage: $0 <kind> <name> [namespace]}"
readonly NAMESPACE="${3:-default}"

echo "=== Debugging ${KIND}/${NAME} in ${NAMESPACE} ==="
echo ""

# Show Claim status
echo "--- Claim Status ---"
kubectl get "${KIND}" "${NAME}" -n "${NAMESPACE}" -o yaml |
  yq '.status'

echo ""

# Show Claim events
echo "--- Claim Events ---"
kubectl events --for="${KIND}/${NAME}" -n "${NAMESPACE}" --sort-by='.lastTimestamp' |
  tail -20

echo ""

# Get the composite resource name
XR_NAME=$(kubectl get "${KIND}" "${NAME}" -n "${NAMESPACE}" \
  -o jsonpath='{.spec.resourceRef.name}' 2>/dev/null)

if [[ -n "${XR_NAME}" ]]; then
  XR_KIND=$(kubectl get "${KIND}" "${NAME}" -n "${NAMESPACE}" \
    -o jsonpath='{.spec.resourceRef.kind}')

  echo "--- Composite Resource: ${XR_KIND}/${XR_NAME} ---"
  kubectl get "${XR_KIND}" "${XR_NAME}" -o yaml |
    yq '.status.conditions'

  echo ""
  echo "--- Composed Resources ---"
  kubectl get "${XR_KIND}" "${XR_NAME}" -o yaml |
    yq '.spec.resourceRefs[]' 2>/dev/null

  echo ""
  echo "--- Composed Resource Status ---"
  kubectl get "${XR_KIND}" "${XR_NAME}" -o yaml |
    yq '.spec.resourceRefs[]' 2>/dev/null |
    while IFS= read -r ref; do
      REF_KIND=$(echo "${ref}" | yq '.kind')
      REF_NAME=$(echo "${ref}" | yq '.name')
      echo ""
      echo "  ${REF_KIND}/${REF_NAME}:"
      kubectl get "${REF_KIND}" "${REF_NAME}" -o yaml 2>/dev/null |
        yq '.status.conditions' || echo "    (not found)"
    done
fi
```

### Prometheus Metrics

```yaml
# monitoring/crossplane-metrics.yaml
# Prometheus ServiceMonitor for Crossplane metrics
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: crossplane
  namespace: crossplane-system
  labels:
    app: crossplane
spec:
  selector:
    matchLabels:
      app: crossplane
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
---
# PrometheusRule for Crossplane alerts
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: crossplane-alerts
  namespace: crossplane-system
spec:
  groups:
    - name: crossplane.rules
      rules:
        - alert: CrossplaneManagedResourceNotReady
          expr: |
            crossplane_managed_resource_ready{status="False"} > 0
          for: 15m
          labels:
            severity: warning
          annotations:
            summary: "Managed resource {{ $labels.name }} not ready"
            description: "Crossplane managed resource {{ $labels.kind }}/{{ $labels.name }} has been not ready for 15 minutes"

        - alert: CrossplaneProviderUnhealthy
          expr: |
            crossplane_provider_healthy{status="False"} > 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Crossplane provider {{ $labels.name }} unhealthy"
            description: "Crossplane provider {{ $labels.name }} has been unhealthy for 5 minutes"

        - alert: CrossplaneHighReconcileErrors
          expr: |
            rate(controller_runtime_reconcile_errors_total{controller=~".*crossplane.*"}[5m]) > 0.1
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "High reconciliation error rate for {{ $labels.controller }}"
```

---

## Anti-Patterns

### Overly Broad XRD Schemas

```yaml
# Bad - accepts any object without validation
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.example.org
spec:
  group: example.org
  names:
    kind: XDatabase
    plural: xdatabases
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          # No properties defined - accepts anything
```

```yaml
# Good - strict schema with validation, defaults, and descriptions
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xpostgresqlinstances.database.example.org
spec:
  group: database.example.org
  names:
    kind: XPostgreSQLInstance
    plural: xpostgresqlinstances
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    storageGB:
                      type: integer
                      description: "Storage size in GB"
                      minimum: 20
                      maximum: 10000
                      default: 20
                    size:
                      type: string
                      description: "Instance size class"
                      enum: [small, medium, large]
                      default: small
                  required:
                    - storageGB
                    - size
```

### Hardcoded Cloud-Specific Values in XRDs

```yaml
# Bad - leaking cloud-specific concepts into the abstraction
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.example.org
spec:
  versions:
    - name: v1alpha1
      schema:
        openAPIV3Schema:
          properties:
            spec:
              properties:
                # These are AWS-specific - defeats the purpose of abstraction
                instanceClass:
                  type: string
                  enum: [db.t3.micro, db.t3.medium, db.r6g.large]
                multiAz:
                  type: boolean
                subnetGroupName:
                  type: string
```

```yaml
# Good - cloud-agnostic parameters mapped in compositions
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xpostgresqlinstances.database.example.org
spec:
  versions:
    - name: v1alpha1
      schema:
        openAPIV3Schema:
          properties:
            spec:
              properties:
                parameters:
                  properties:
                    # Abstract size mapped to provider-specific types in composition
                    size:
                      type: string
                      enum: [small, medium, large]
                    # Generic HA flag mapped per provider
                    highAvailability:
                      type: boolean
                    # Region - each provider maps to its own format
                    region:
                      type: string
```

### Missing Connection Secret Keys

```yaml
# Bad - no connectionSecretKeys defined, consumers cannot access credentials
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.example.org
spec:
  group: example.org
  names:
    kind: XDatabase
    plural: xdatabases
  # Missing: connectionSecretKeys
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
```

```yaml
# Good - explicit connectionSecretKeys for consumer contracts
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xpostgresqlinstances.database.example.org
spec:
  group: database.example.org
  names:
    kind: XPostgreSQLInstance
    plural: xpostgresqlinstances
  claimNames:
    kind: PostgreSQLInstance
    plural: postgresqlinstances
  connectionSecretKeys:
    - host
    - port
    - username
    - password
    - database
    - connectionString
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
```

### Monolithic Compositions

```yaml
# Bad - single composition with everything inlined
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xapplications.example.org
spec:
  compositeTypeRef:
    apiVersion: example.org/v1alpha1
    kind: XApplication
  resources:
    # VPC, Subnets, Security Groups, RDS, ElastiCache,
    # S3 Bucket, IAM Roles, CloudWatch Alarms,
    # EKS Cluster, Node Groups... all in one
    # 500+ lines of resources
```

```yaml
# Good - compose smaller XRs together
# Step 1: Build focused abstractions
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xapplications.aws.example.org
spec:
  compositeTypeRef:
    apiVersion: example.org/v1alpha1
    kind: XApplication
  mode: Pipeline
  pipeline:
    - step: patch-and-transform
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          # Reference existing Network XR
          - name: network
            base:
              apiVersion: network.example.org/v1alpha1
              kind: XNetwork
              spec:
                parameters:
                  cidr: "10.0.0.0/16"
                  subnetCount: 3
                  enableNAT: true

          # Reference existing Database XR
          - name: database
            base:
              apiVersion: database.example.org/v1alpha1
              kind: XPostgreSQLInstance
              spec:
                parameters:
                  storageGB: 50
                  size: medium

          # Reference existing Cache XR
          - name: cache
            base:
              apiVersion: cache.example.org/v1alpha1
              kind: XCacheInstance
              spec:
                parameters:
                  engine: redis
                  size: small
```

---

## References

### Official Documentation

- [Crossplane Documentation](https://docs.crossplane.io/)
- [Crossplane GitHub Repository](https://github.com/crossplane/crossplane)
- [Upbound Marketplace](https://marketplace.upbound.io/)
- [Composition Functions](https://docs.crossplane.io/latest/composition/compositions/)
- [Crossplane CLI Reference](https://docs.crossplane.io/latest/cli/)

### Related Guides

- [Kubernetes & Helm Style Guide](kubernetes.md)
- [GitOps (ArgoCD & Flux) Style Guide](gitops.md)
- [Terraform Style Guide](terraform.md)
- [YAML Style Guide](yaml.md)
