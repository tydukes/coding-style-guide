---
title: "GitOps Style Guide"
description: "Comprehensive standards for ArgoCD and Flux CD covering application manifests, repository structure, and deployment patterns"
author: "Tyler Dukes"
tags: [gitops, argocd, fluxcd, kubernetes, deployment, continuous-delivery]
category: "Language Guides"
status: "active"
search_keywords: [gitops, argocd, flux, continuous deployment, kubernetes, declarative, reconciliation, git]
---

## Language Overview

**GitOps** is a paradigm for managing Kubernetes infrastructure and applications using Git as the single
source of truth. **ArgoCD** and **Flux CD** are the two leading GitOps operators that reconcile
cluster state with Git repositories.

### Key Characteristics

- **Paradigm**: Declarative infrastructure and application management
- **Language**: YAML manifests with CRDs
- **Version Support**: ArgoCD 2.x, Flux CD v2.x (Flux v2)
- **Integration**: Kubernetes, Helm, Kustomize, SOPS, Sealed Secrets
- **Modern Approach**: Pull-based continuous delivery

### Primary Use Cases

- Continuous delivery for Kubernetes applications
- Multi-cluster and multi-environment deployments
- Infrastructure as Code synchronization
- Progressive delivery (canary, blue-green)
- Secret management with GitOps workflows

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Applications | `app-environment` | `my-app-prod`, `api-staging` | Include environment suffix |
| Projects | `kebab-case` | `production`, `team-platform` | Team or environment based |
| Kustomizations | `app-env` | `frontend-prod` | Flux resource names |
| GitRepositories | `repo-name` | `apps-repo`, `infra-repo` | Source references |
| **Resource Types** | | | |
| Application | ArgoCD app | `kind: Application` | Single app deployment |
| ApplicationSet | ArgoCD templates | `kind: ApplicationSet` | Multi-app generation |
| Kustomization | Flux reconciliation | `kind: Kustomization` | Path-based sync |
| HelmRelease | Flux Helm | `kind: HelmRelease` | Chart deployment |
| **File Naming** | | | |
| ArgoCD apps | `app-name.yaml` | `web-app.yaml` | One app per file |
| Flux sources | `source.yaml` | `git-repository.yaml` | Source definitions |
| Kustomizations | `kustomization.yaml` | `apps.yaml` | Sync definitions |
| **Repository Structure** | | | |
| Apps path | `apps/` | `apps/my-app/` | Application configs |
| Infra path | `infrastructure/` | `infrastructure/` | Cluster infrastructure |
| Clusters path | `clusters/` | `clusters/prod/` | Cluster-specific |
| **Best Practices** | | | |
| Sync Policy | Automated with prune | `automated: prune: true` | Self-healing |
| Health Checks | Always define | `healthChecks:` | Deployment verification |
| Namespaces | Create automatically | `CreateNamespace=true` | Avoid manual steps |
| RBAC | Least privilege | Project-scoped | Multi-tenancy |

---

## Repository Structure

### Mono-Repository Pattern

Recommended for small to medium teams with centralized operations.

```text
gitops-repo/
├── apps/
│   ├── base/                          # Base configurations
│   │   ├── frontend/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── ingress.yaml
│   │   │   └── kustomization.yaml
│   │   ├── backend/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── kustomization.yaml
│   │   └── database/
│   │       ├── statefulset.yaml
│   │       ├── service.yaml
│   │       └── kustomization.yaml
│   └── overlays/                      # Environment-specific
│       ├── dev/
│       │   ├── frontend/
│       │   │   ├── kustomization.yaml
│       │   │   └── patch-replicas.yaml
│       │   ├── backend/
│       │   │   └── kustomization.yaml
│       │   └── kustomization.yaml
│       ├── staging/
│       │   ├── frontend/
│       │   │   ├── kustomization.yaml
│       │   │   └── patch-replicas.yaml
│       │   └── kustomization.yaml
│       └── prod/
│           ├── frontend/
│           │   ├── kustomization.yaml
│           │   ├── patch-replicas.yaml
│           │   └── patch-resources.yaml
│           └── kustomization.yaml
├── infrastructure/
│   ├── base/
│   │   ├── cert-manager/
│   │   │   ├── namespace.yaml
│   │   │   ├── helmrelease.yaml
│   │   │   └── kustomization.yaml
│   │   ├── ingress-nginx/
│   │   │   ├── namespace.yaml
│   │   │   ├── helmrelease.yaml
│   │   │   └── kustomization.yaml
│   │   └── monitoring/
│   │       ├── namespace.yaml
│   │       ├── prometheus/
│   │       └── grafana/
│   └── overlays/
│       ├── dev/
│       ├── staging/
│       └── prod/
├── clusters/
│   ├── dev/
│   │   ├── flux-system/               # Flux bootstrap
│   │   │   ├── gotk-components.yaml
│   │   │   ├── gotk-sync.yaml
│   │   │   └── kustomization.yaml
│   │   ├── apps.yaml                  # Flux Kustomization
│   │   └── infrastructure.yaml
│   ├── staging/
│   │   ├── flux-system/
│   │   ├── apps.yaml
│   │   └── infrastructure.yaml
│   └── prod/
│       ├── flux-system/
│       ├── apps.yaml
│       └── infrastructure.yaml
└── tenants/                           # Multi-tenant configs
    ├── team-a/
    │   ├── namespace.yaml
    │   ├── rbac.yaml
    │   └── apps/
    └── team-b/
        ├── namespace.yaml
        ├── rbac.yaml
        └── apps/
```

### Multi-Repository Pattern

Recommended for large organizations with separate platform and application teams.

```text
## Platform Repository (managed by platform team)
platform-gitops/
├── clusters/
│   ├── dev-cluster/
│   │   ├── flux-system/
│   │   ├── tenants.yaml
│   │   └── infrastructure.yaml
│   └── prod-cluster/
│       ├── flux-system/
│       ├── tenants.yaml
│       └── infrastructure.yaml
├── infrastructure/
│   ├── controllers/
│   ├── crds/
│   └── policies/
└── tenants/
    ├── team-frontend/
    │   └── tenant.yaml
    └── team-backend/
        └── tenant.yaml

## Application Repository (managed by app teams)
app-team-gitops/
├── apps/
│   ├── base/
│   │   └── my-app/
│   └── overlays/
│       ├── dev/
│       ├── staging/
│       └── prod/
└── releases/
    ├── dev/
    ├── staging/
    └── prod/
```

---

## ArgoCD Application Manifests

### Basic Application

```yaml
---
## @module argocd-application
## @description ArgoCD Application for production web application
## @version 1.0.0
## @author Tyler Dukes
## @last_updated 2025-01-24

apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: web-app-prod
  namespace: argocd
  labels:
    app.kubernetes.io/name: web-app
    app.kubernetes.io/instance: web-app-prod
    app.kubernetes.io/part-of: ecommerce-platform
    environment: production
  annotations:
    notifications.argoproj.io/subscribe.on-sync-succeeded.slack: deployments
    notifications.argoproj.io/subscribe.on-sync-failed.slack: alerts
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: production
  source:
    repoURL: https://github.com/org/gitops-repo.git
    targetRevision: main
    path: apps/overlays/prod/web-app
    kustomize:
      namePrefix: prod-
      commonLabels:
        environment: production
      images:
        - name: myregistry.com/web-app
          newTag: v1.2.3
  destination:
    server: https://kubernetes.default.svc
    namespace: web-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
      - ServerSideApply=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
    - group: autoscaling
      kind: HorizontalPodAutoscaler
      jqPathExpressions:
        - .spec.minReplicas
```

### Application with Helm Source

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: prometheus-stack-prod
  namespace: argocd
  labels:
    app.kubernetes.io/name: prometheus-stack
    environment: production
spec:
  project: infrastructure
  source:
    repoURL: https://prometheus-community.github.io/helm-charts
    chart: kube-prometheus-stack
    targetRevision: 55.5.0
    helm:
      releaseName: prometheus
      valueFiles:
        - values.yaml
      values: |
        prometheus:
          prometheusSpec:
            retention: 30d
            storageSpec:
              volumeClaimTemplate:
                spec:
                  storageClassName: gp3
                  resources:
                    requests:
                      storage: 100Gi
        grafana:
          enabled: true
          adminPassword: ${GRAFANA_ADMIN_PASSWORD}
          ingress:
            enabled: true
            hosts:
              - grafana.example.com
        alertmanager:
          enabled: true
      parameters:
        - name: prometheus.prometheusSpec.replicas
          value: "2"
        - name: grafana.replicas
          value: "2"
  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
```

### Application with Multiple Sources

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app-with-config
  namespace: argocd
spec:
  project: default
  sources:
    - repoURL: https://github.com/org/helm-charts.git
      targetRevision: main
      path: charts/web-app
      helm:
        valueFiles:
          - $values/apps/web-app/values-prod.yaml
    - repoURL: https://github.com/org/gitops-config.git
      targetRevision: main
      ref: values
  destination:
    server: https://kubernetes.default.svc
    namespace: web-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

## ArgoCD ApplicationSet

### Generator with Clusters

```yaml
---
## @module argocd-applicationset-clusters
## @description ApplicationSet for multi-cluster deployment
## @version 1.0.0

apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: web-app-all-clusters
  namespace: argocd
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            environment: production
        values:
          revision: main
    - clusters:
        selector:
          matchLabels:
            environment: staging
        values:
          revision: develop
  template:
    metadata:
      name: "web-app-{{name}}"
      labels:
        app.kubernetes.io/name: web-app
        cluster: "{{name}}"
    spec:
      project: default
      source:
        repoURL: https://github.com/org/gitops-repo.git
        targetRevision: "{{values.revision}}"
        path: "apps/overlays/{{metadata.labels.environment}}/web-app"
      destination:
        server: "{{server}}"
        namespace: web-app
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

### Generator with Git Directories

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: apps-from-git
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/org/gitops-repo.git
        revision: main
        directories:
          - path: apps/overlays/prod/*
          - path: apps/overlays/staging/*
            exclude: true
  template:
    metadata:
      name: "{{path.basename}}"
    spec:
      project: default
      source:
        repoURL: https://github.com/org/gitops-repo.git
        targetRevision: main
        path: "{{path}}"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{path.basename}}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

### Generator with Matrix (Cluster + Git)

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: matrix-apps
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          - clusters:
              selector:
                matchLabels:
                  argocd.argoproj.io/secret-type: cluster
          - git:
              repoURL: https://github.com/org/gitops-repo.git
              revision: main
              directories:
                - path: apps/base/*
  template:
    metadata:
      name: "{{path.basename}}-{{name}}"
    spec:
      project: default
      source:
        repoURL: https://github.com/org/gitops-repo.git
        targetRevision: main
        path: "apps/overlays/{{metadata.labels.environment}}/{{path.basename}}"
      destination:
        server: "{{server}}"
        namespace: "{{path.basename}}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### Generator with List

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: apps-by-team
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - team: frontend
            app: web-ui
            namespace: frontend
            replicas: "3"
          - team: backend
            app: api-gateway
            namespace: backend
            replicas: "5"
          - team: data
            app: analytics
            namespace: data-platform
            replicas: "2"
  template:
    metadata:
      name: "{{team}}-{{app}}"
      labels:
        team: "{{team}}"
    spec:
      project: "{{team}}"
      source:
        repoURL: https://github.com/org/gitops-repo.git
        targetRevision: main
        path: "apps/{{team}}/{{app}}"
        kustomize:
          images:
            - name: app-image
              newTag: latest
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{namespace}}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### Generator with Pull Request

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: pr-preview-apps
  namespace: argocd
spec:
  generators:
    - pullRequest:
        github:
          owner: org
          repo: app-repo
          tokenRef:
            secretName: github-token
            key: token
          labels:
            - preview
        requeueAfterSeconds: 60
  template:
    metadata:
      name: "preview-{{branch_slug}}"
      labels:
        app.kubernetes.io/name: preview
        pull-request: "{{number}}"
    spec:
      project: previews
      source:
        repoURL: https://github.com/org/app-repo.git
        targetRevision: "{{head_sha}}"
        path: kubernetes/overlays/preview
        kustomize:
          namePrefix: "pr-{{number}}-"
          commonLabels:
            pull-request: "{{number}}"
      destination:
        server: https://kubernetes.default.svc
        namespace: "preview-{{number}}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
  syncPolicy:
    preserveResourcesOnDeletion: false
```

---

## ArgoCD Projects

### Production Project

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  description: Production applications project
  sourceRepos:
    - https://github.com/org/gitops-repo.git
    - https://github.com/org/helm-charts.git
    - https://charts.bitnami.com/bitnami
  destinations:
    - namespace: "*"
      server: https://prod-cluster.example.com
    - namespace: "!kube-system"
      server: https://prod-cluster.example.com
  clusterResourceWhitelist:
    - group: ""
      kind: Namespace
    - group: networking.k8s.io
      kind: Ingress
    - group: cert-manager.io
      kind: Certificate
    - group: cert-manager.io
      kind: ClusterIssuer
  namespaceResourceBlacklist:
    - group: ""
      kind: ResourceQuota
    - group: ""
      kind: LimitRange
  namespaceResourceWhitelist:
    - group: "*"
      kind: "*"
  roles:
    - name: admin
      description: Production admin role
      policies:
        - p, proj:production:admin, applications, *, production/*, allow
        - p, proj:production:admin, repositories, *, production/*, allow
      groups:
        - platform-admins
    - name: developer
      description: Read-only access for developers
      policies:
        - p, proj:production:developer, applications, get, production/*, allow
        - p, proj:production:developer, applications, sync, production/*, deny
      groups:
        - developers
  syncWindows:
    - kind: allow
      schedule: "0 6 * * 1-5"
      duration: 12h
      applications:
        - "*"
      namespaces:
        - "*"
      clusters:
        - "*"
      manualSync: true
    - kind: deny
      schedule: "0 18 * * 5"
      duration: 60h
      applications:
        - "*"
      manualSync: false
  orphanedResources:
    warn: true
    ignore:
      - group: ""
        kind: ConfigMap
        name: kube-root-ca.crt
```

### Team Project with Restrictions

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: team-backend
  namespace: argocd
spec:
  description: Backend team project
  sourceRepos:
    - https://github.com/org/backend-apps.git
  destinations:
    - namespace: backend-*
      server: https://kubernetes.default.svc
    - namespace: team-backend
      server: https://kubernetes.default.svc
  clusterResourceWhitelist: []
  namespaceResourceWhitelist:
    - group: ""
      kind: ConfigMap
    - group: ""
      kind: Secret
    - group: ""
      kind: Service
    - group: apps
      kind: Deployment
    - group: apps
      kind: StatefulSet
    - group: networking.k8s.io
      kind: Ingress
    - group: autoscaling
      kind: HorizontalPodAutoscaler
  sourceNamespaces:
    - team-backend
  roles:
    - name: team-admin
      policies:
        - p, proj:team-backend:team-admin, applications, *, team-backend/*, allow
      groups:
        - backend-team-leads
    - name: team-developer
      policies:
        - p, proj:team-backend:team-developer, applications, get, team-backend/*, allow
        - p, proj:team-backend:team-developer, applications, sync, team-backend/*, allow
        - p, proj:team-backend:team-developer, applications, delete, team-backend/*, deny
      groups:
        - backend-developers
```

---

## Flux CD Configuration

### GitRepository Source

```yaml
---
## @module flux-gitrepository
## @description Flux GitRepository source for applications
## @version 1.0.0

apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: apps-repo
  namespace: flux-system
spec:
  interval: 5m
  url: https://github.com/org/gitops-repo.git
  ref:
    branch: main
  secretRef:
    name: github-credentials
  ignore: |
    # Exclude files not needed for deployment
    /*
    !/apps/
    !/infrastructure/
```

### GitRepository with SSH

```yaml
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: private-repo
  namespace: flux-system
spec:
  interval: 1m
  url: ssh://git@github.com/org/private-repo.git
  ref:
    branch: main
  secretRef:
    name: ssh-credentials
  verify:
    mode: head
    secretRef:
      name: gpg-public-keys

---
apiVersion: v1
kind: Secret
metadata:
  name: ssh-credentials
  namespace: flux-system
type: Opaque
stringData:
  ## SSH key stored in external secret manager or sealed secret
  ## Never commit real private keys to Git
  identity: "${SSH_PRIVATE_KEY}"
  known_hosts: |
    github.com ecdsa-sha2-nistp256 AAAA...key-fingerprint...
```

### HelmRepository Source

```yaml
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: bitnami
  namespace: flux-system
spec:
  interval: 30m
  url: https://charts.bitnami.com/bitnami
  timeout: 3m

---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: prometheus-community
  namespace: flux-system
spec:
  interval: 30m
  url: https://prometheus-community.github.io/helm-charts

---
## OCI Helm Repository
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: podinfo
  namespace: flux-system
spec:
  interval: 5m
  type: oci
  url: oci://ghcr.io/stefanprodan/charts
```

### Kustomization for Applications

```yaml
---
## @module flux-kustomization-apps
## @description Flux Kustomization for production applications
## @version 1.0.0

apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps-prod
  namespace: flux-system
spec:
  interval: 10m
  retryInterval: 2m
  timeout: 5m
  path: ./apps/overlays/prod
  prune: true
  sourceRef:
    kind: GitRepository
    name: apps-repo
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: web-app
      namespace: web-app
    - apiVersion: apps/v1
      kind: Deployment
      name: api-gateway
      namespace: backend
  wait: true
  force: false
  targetNamespace: ""
  dependsOn:
    - name: infrastructure
  postBuild:
    substitute:
      ENVIRONMENT: production
      CLUSTER_NAME: prod-cluster
    substituteFrom:
      - kind: ConfigMap
        name: cluster-vars
      - kind: Secret
        name: cluster-secrets
  patches:
    - patch: |
        - op: replace
          path: /spec/replicas
          value: 3
      target:
        kind: Deployment
        labelSelector: "tier=frontend"
  images:
    - name: myregistry.com/web-app
      newTag: v1.2.3
```

### Kustomization with Dependencies

```yaml
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure-controllers
  namespace: flux-system
spec:
  interval: 1h
  retryInterval: 1m
  timeout: 5m
  path: ./infrastructure/controllers
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
  wait: true

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure-configs
  namespace: flux-system
spec:
  interval: 1h
  path: ./infrastructure/configs
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
  dependsOn:
    - name: infrastructure-controllers
  wait: true

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 10m
  path: ./apps/overlays/prod
  prune: true
  sourceRef:
    kind: GitRepository
    name: apps-repo
  dependsOn:
    - name: infrastructure-controllers
    - name: infrastructure-configs
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: web-app
      namespace: production
```

### HelmRelease

```yaml
---
## @module flux-helmrelease
## @description Flux HelmRelease for nginx-ingress
## @version 1.0.0

apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
spec:
  interval: 30m
  timeout: 10m
  chart:
    spec:
      chart: ingress-nginx
      version: "4.x"
      sourceRef:
        kind: HelmRepository
        name: ingress-nginx
        namespace: flux-system
      interval: 12h
  install:
    crds: CreateReplace
    createNamespace: true
    remediation:
      retries: 3
  upgrade:
    crds: CreateReplace
    cleanupOnFail: true
    remediation:
      retries: 3
      remediateLastFailure: true
  rollback:
    timeout: 10m
    cleanupOnFail: true
  values:
    controller:
      replicaCount: 2
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 512Mi
      service:
        type: LoadBalancer
        annotations:
          service.beta.kubernetes.io/aws-load-balancer-type: nlb
      metrics:
        enabled: true
        serviceMonitor:
          enabled: true
      admissionWebhooks:
        enabled: true
  valuesFrom:
    - kind: ConfigMap
      name: ingress-nginx-values
      valuesKey: values.yaml
      optional: true
    - kind: Secret
      name: ingress-nginx-secrets
      valuesKey: secrets.yaml
      optional: true
```

### HelmRelease with Multiple Values Sources

```yaml
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: prometheus-stack
  namespace: monitoring
spec:
  interval: 1h
  chart:
    spec:
      chart: kube-prometheus-stack
      version: ">=55.0.0 <56.0.0"
      sourceRef:
        kind: HelmRepository
        name: prometheus-community
        namespace: flux-system
  install:
    crds: CreateReplace
  upgrade:
    crds: CreateReplace
  values:
    prometheus:
      prometheusSpec:
        retention: 30d
        storageSpec:
          volumeClaimTemplate:
            spec:
              storageClassName: gp3
              resources:
                requests:
                  storage: 100Gi
  valuesFrom:
    - kind: ConfigMap
      name: prometheus-values-base
    - kind: ConfigMap
      name: prometheus-values-${ENVIRONMENT}
      optional: true
    - kind: Secret
      name: prometheus-secrets
  postRenderers:
    - kustomize:
        patches:
          - target:
              kind: Deployment
              name: prometheus-operator
            patch: |
              - op: add
                path: /spec/template/spec/containers/0/resources
                value:
                  requests:
                    cpu: 100m
                    memory: 256Mi
                  limits:
                    cpu: 500m
                    memory: 512Mi
```

---

## Kustomize Overlay Patterns

### Base Configuration

```yaml
---
## apps/base/web-app/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: web-app

commonLabels:
  app.kubernetes.io/name: web-app
  app.kubernetes.io/component: frontend

resources:
  - deployment.yaml
  - service.yaml
  - serviceaccount.yaml
  - configmap.yaml

configMapGenerator:
  - name: web-app-config
    literals:
      - LOG_LEVEL=info
      - APP_PORT=8080
```

### Development Overlay

```yaml
---
## apps/overlays/dev/web-app/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: web-app-dev

namePrefix: dev-

commonLabels:
  environment: development

resources:
  - ../../base/web-app

replicas:
  - name: web-app
    count: 1

images:
  - name: myregistry.com/web-app
    newTag: develop

configMapGenerator:
  - name: web-app-config
    behavior: merge
    literals:
      - LOG_LEVEL=debug
      - ENABLE_DEBUG=true

patches:
  - path: patch-resources.yaml
    target:
      kind: Deployment
      name: web-app
```

```yaml
---
## apps/overlays/dev/web-app/patch-resources.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  template:
    spec:
      containers:
        - name: web-app
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 256Mi
```

### Production Overlay

```yaml
---
## apps/overlays/prod/web-app/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: web-app-prod

namePrefix: prod-

commonLabels:
  environment: production

commonAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"

resources:
  - ../../base/web-app
  - hpa.yaml
  - pdb.yaml
  - networkpolicy.yaml

replicas:
  - name: web-app
    count: 3

images:
  - name: myregistry.com/web-app
    newTag: v1.2.3

configMapGenerator:
  - name: web-app-config
    behavior: merge
    literals:
      - LOG_LEVEL=warn
      - ENABLE_METRICS=true

secretGenerator:
  - name: web-app-secrets
    type: Opaque
    envs:
      - secrets.env

patches:
  - path: patch-resources.yaml
  - path: patch-probes.yaml
  - patch: |
      - op: add
        path: /spec/template/spec/affinity
        value:
          podAntiAffinity:
            preferredDuringSchedulingIgnoredDuringExecution:
              - weight: 100
                podAffinityTerm:
                  labelSelector:
                    matchLabels:
                      app.kubernetes.io/name: web-app
                  topologyKey: kubernetes.io/hostname
    target:
      kind: Deployment
      name: web-app
```

```yaml
---
## apps/overlays/prod/web-app/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

```yaml
---
## apps/overlays/prod/web-app/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: web-app
```

---

## Secret Management

### Sealed Secrets with ArgoCD

```yaml
---
## Install sealed-secrets controller
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: sealed-secrets
  namespace: argocd
spec:
  project: infrastructure
  source:
    repoURL: https://bitnami-labs.github.io/sealed-secrets
    chart: sealed-secrets
    targetRevision: 2.x
    helm:
      values: |
        fullnameOverride: sealed-secrets-controller
  destination:
    server: https://kubernetes.default.svc
    namespace: kube-system
  syncPolicy:
    automated:
      prune: true
      selfHeal: true

---
## Example SealedSecret
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  encryptedData:
    username: AgBy8hCi8...encrypted...data==
    password: AgCtr4Nh7...encrypted...data==
  template:
    metadata:
      labels:
        app.kubernetes.io/name: database
    type: Opaque
```

### SOPS with Flux

```yaml
---
## clusters/prod/flux-system/gotk-sync.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: flux-system
  namespace: flux-system
spec:
  interval: 10m
  path: ./clusters/prod
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
  decryption:
    provider: sops
    secretRef:
      name: sops-age

---
## Secret for SOPS age key
apiVersion: v1
kind: Secret
metadata:
  name: sops-age
  namespace: flux-system
stringData:
  age.agekey: |
    # created: 2024-01-01T00:00:00Z
    # public key: age1...
    AGE-SECRET-KEY-1...
```

```yaml
---
## .sops.yaml at repository root
creation_rules:
  - path_regex: .*\.sops\.yaml$
    encrypted_regex: ^(data|stringData)$
    age: age1abc123...public...key
  - path_regex: clusters/prod/.*
    encrypted_regex: ^(data|stringData)$
    age: age1prod...key
  - path_regex: clusters/staging/.*
    encrypted_regex: ^(data|stringData)$
    age: age1staging...key
```

```yaml
---
## secrets/database.sops.yaml (encrypted)
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
  namespace: production
type: Opaque
stringData:
  username: ENC[AES256_GCM,data:...,type:str]
  password: ENC[AES256_GCM,data:...,type:str]
sops:
  kms: []
  gcp_kms: []
  azure_kv: []
  age:
    - recipient: age1abc123...
      enc: |
        -----BEGIN AGE ENCRYPTED FILE-----
        ...
        -----END AGE ENCRYPTED FILE-----
  lastmodified: "2024-01-01T00:00:00Z"
  mac: ENC[AES256_GCM,data:...,type:str]
  version: 3.8.1
```

### External Secrets Operator

```yaml
---
## Install External Secrets Operator
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: external-secrets
  namespace: external-secrets
spec:
  interval: 1h
  chart:
    spec:
      chart: external-secrets
      version: ">=0.9.0"
      sourceRef:
        kind: HelmRepository
        name: external-secrets
        namespace: flux-system
  install:
    crds: CreateReplace
    createNamespace: true
  upgrade:
    crds: CreateReplace

---
## SecretStore for AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets

---
## ExternalSecret example
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: database-credentials
    creationPolicy: Owner
    deletionPolicy: Retain
    template:
      type: Opaque
      data:
        DATABASE_URL: "postgresql://{{ .username }}:{{ .password }}@postgres:5432/app"
  data:
    - secretKey: username
      remoteRef:
        key: prod/database/credentials
        property: username
    - secretKey: password
      remoteRef:
        key: prod/database/credentials
        property: password
```

---

## Progressive Delivery

### Argo Rollouts - Canary

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 5
  strategy:
    canary:
      canaryService: web-app-canary
      stableService: web-app-stable
      trafficRouting:
        nginx:
          stableIngress: web-app
          additionalIngressAnnotations:
            nginx.ingress.kubernetes.io/canary-by-header: X-Canary
      steps:
        - setWeight: 5
        - pause:
            duration: 5m
        - setWeight: 20
        - pause:
            duration: 5m
        - analysis:
            templates:
              - templateName: success-rate
            args:
              - name: service-name
                value: web-app-canary
        - setWeight: 50
        - pause:
            duration: 10m
        - analysis:
            templates:
              - templateName: success-rate
        - setWeight: 80
        - pause:
            duration: 10m
        - setWeight: 100
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2
        args:
          - name: service-name
            value: web-app-canary
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: web-app
          image: myregistry.com/web-app:v1.2.3
          ports:
            - containerPort: 8080

---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: production
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 1m
      count: 5
      successCondition: result[0] >= 0.95
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service-name}}",status=~"2.."}[5m])) /
            sum(rate(http_requests_total{service="{{args.service-name}}"}[5m]))
```

### Argo Rollouts - Blue-Green

```yaml
---
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api-gateway
  namespace: production
spec:
  replicas: 3
  strategy:
    blueGreen:
      activeService: api-gateway-active
      previewService: api-gateway-preview
      autoPromotionEnabled: false
      autoPromotionSeconds: 300
      scaleDownDelaySeconds: 30
      scaleDownDelayRevisionLimit: 2
      prePromotionAnalysis:
        templates:
          - templateName: smoke-tests
        args:
          - name: service-url
            value: http://api-gateway-preview:8080
      postPromotionAnalysis:
        templates:
          - templateName: success-rate
        args:
          - name: service-name
            value: api-gateway-active
      previewReplicaCount: 1
      antiAffinity:
        preferredDuringSchedulingIgnoredDuringExecution:
          weight: 100
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: api-gateway
          image: myregistry.com/api-gateway:v2.0.0
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5

---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: smoke-tests
  namespace: production
spec:
  args:
    - name: service-url
  metrics:
    - name: smoke-test
      count: 1
      provider:
        job:
          spec:
            template:
              spec:
                containers:
                  - name: smoke-test
                    image: curlimages/curl:latest
                    command:
                      - /bin/sh
                      - -c
                      - |
                        curl -f "{{args.service-url}}/health" || exit 1
                        curl -f "{{args.service-url}}/ready" || exit 1
                restartPolicy: Never
            backoffLimit: 0
```

### Flagger with Flux

```yaml
---
## Install Flagger
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: flagger
  namespace: flagger-system
spec:
  interval: 1h
  chart:
    spec:
      chart: flagger
      version: ">=1.30.0"
      sourceRef:
        kind: HelmRepository
        name: flagger
        namespace: flux-system
  install:
    createNamespace: true
  values:
    metricsServer: http://prometheus.monitoring:9090
    meshProvider: nginx

---
## Canary resource
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: web-app
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  ingressRef:
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    name: web-app
  progressDeadlineSeconds: 600
  service:
    port: 80
    targetPort: 8080
    gateways:
      - public-gateway
    hosts:
      - app.example.com
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500
        interval: 1m
    webhooks:
      - name: load-test
        url: http://flagger-loadtester.flagger-system/
        timeout: 5s
        metadata:
          cmd: "hey -z 1m -q 10 -c 2 http://web-app-canary.production:80/"
      - name: acceptance-test
        type: pre-rollout
        url: http://flagger-loadtester.flagger-system/
        timeout: 30s
        metadata:
          type: bash
          cmd: "curl -s http://web-app-canary.production:80/health | grep -q 'ok'"
```

---

## Notifications and Alerting

### ArgoCD Notifications

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token
    username: ArgoCD
    icon: https://argoproj.github.io/argo-cd/assets/logo.png

  service.webhook.github: |
    url: https://api.github.com
    headers:
      - name: Authorization
        value: token $github-token

  template.app-deployed: |
    message: |
      Application {{.app.metadata.name}} is now {{.app.status.sync.status}}.
      Revision: {{.app.status.sync.revision}}
      Health: {{.app.status.health.status}}
    slack:
      attachments: |
        [{
          "color": "#18be52",
          "title": "{{ .app.metadata.name }}",
          "title_link": "{{.context.argocdUrl}}/applications/{{.app.metadata.name}}",
          "fields": [
            {"title": "Sync Status", "value": "{{.app.status.sync.status}}", "short": true},
            {"title": "Health", "value": "{{.app.status.health.status}}", "short": true},
            {"title": "Revision", "value": "{{.app.status.sync.revision}}", "short": true}
          ]
        }]

  template.app-sync-failed: |
    message: |
      Application {{.app.metadata.name}} sync failed.
      Error: {{.app.status.operationState.message}}
    slack:
      attachments: |
        [{
          "color": "#E96D76",
          "title": "{{ .app.metadata.name }} - Sync Failed",
          "title_link": "{{.context.argocdUrl}}/applications/{{.app.metadata.name}}",
          "fields": [
            {"title": "Error", "value": "{{.app.status.operationState.message}}", "short": false}
          ]
        }]

  trigger.on-deployed: |
    - description: Application is synced and healthy
      when: app.status.operationState.phase in ['Succeeded'] and app.status.health.status == 'Healthy'
      send:
        - app-deployed

  trigger.on-sync-failed: |
    - description: Application sync has failed
      when: app.status.operationState.phase in ['Error', 'Failed']
      send:
        - app-sync-failed

  trigger.on-health-degraded: |
    - description: Application health is degraded
      when: app.status.health.status == 'Degraded'
      send:
        - app-health-degraded

  subscriptions: |
    - recipients:
        - slack:deployments
      triggers:
        - on-deployed
    - recipients:
        - slack:alerts
      triggers:
        - on-sync-failed
        - on-health-degraded
```

### Flux Notification Controller

```yaml
---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: slack
  namespace: flux-system
spec:
  type: slack
  channel: deployments
  secretRef:
    name: slack-webhook

---
apiVersion: v1
kind: Secret
metadata:
  name: slack-webhook
  namespace: flux-system
stringData:
  ## Store webhook URL in external secret manager
  address: "${SLACK_WEBHOOK_URL}"

---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: on-call
  namespace: flux-system
spec:
  providerRef:
    name: slack
  eventSeverity: error
  eventSources:
    - kind: GitRepository
      name: "*"
    - kind: Kustomization
      name: "*"
    - kind: HelmRelease
      name: "*"
  summary: "Flux reconciliation failure"

---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: deployment-notifications
  namespace: flux-system
spec:
  providerRef:
    name: slack
  eventSeverity: info
  eventSources:
    - kind: Kustomization
      name: apps-prod
    - kind: HelmRelease
      name: "*"
      namespace: production
  exclusionList:
    - ".*no changes.*"
    - ".*no updates.*"

---
## GitHub commit status provider
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: github-status
  namespace: flux-system
spec:
  type: github
  address: https://github.com/org/gitops-repo
  secretRef:
    name: github-token

---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: github-status
  namespace: flux-system
spec:
  providerRef:
    name: github-status
  eventSeverity: info
  eventSources:
    - kind: Kustomization
      name: apps-prod
```

---

## Multi-Tenancy and RBAC

### ArgoCD RBAC

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.default: role:readonly
  policy.csv: |
    # Global admin
    g, platform-admins, role:admin

    # Project-specific roles
    p, role:team-backend-admin, applications, *, team-backend/*, allow
    p, role:team-backend-admin, repositories, *, team-backend/*, allow
    p, role:team-backend-admin, clusters, get, *, allow
    p, role:team-backend-admin, projects, get, team-backend, allow
    g, backend-leads, role:team-backend-admin

    p, role:team-backend-dev, applications, get, team-backend/*, allow
    p, role:team-backend-dev, applications, sync, team-backend/*, allow
    p, role:team-backend-dev, applications, action/*, team-backend/*, allow
    p, role:team-backend-dev, logs, get, team-backend/*, allow
    p, role:team-backend-dev, exec, create, team-backend/*, deny
    g, backend-developers, role:team-backend-dev

    # Read-only for all
    p, role:readonly, applications, get, */*, allow
    p, role:readonly, repositories, get, *, allow
    p, role:readonly, clusters, get, *, allow
    p, role:readonly, projects, get, *, allow

  scopes: "[groups, email]"
```

### Flux Multi-Tenancy

```yaml
---
## Tenant namespace
apiVersion: v1
kind: Namespace
metadata:
  name: team-backend
  labels:
    toolkit.fluxcd.io/tenant: team-backend

---
## Tenant service account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: team-backend
  namespace: team-backend

---
## Role for tenant
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: team-backend-reconciler
  namespace: team-backend
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-backend-reconciler
  namespace: team-backend
subjects:
  - kind: ServiceAccount
    name: team-backend
    namespace: team-backend
roleRef:
  kind: Role
  name: team-backend-reconciler
  apiGroup: rbac.authorization.k8s.io

---
## Tenant Kustomization
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: team-backend-apps
  namespace: team-backend
spec:
  interval: 5m
  path: ./tenants/team-backend/apps
  prune: true
  sourceRef:
    kind: GitRepository
    name: tenant-backend-repo
    namespace: team-backend
  serviceAccountName: team-backend
  targetNamespace: team-backend
  validation: client

---
## Tenant GitRepository
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: tenant-backend-repo
  namespace: team-backend
spec:
  interval: 1m
  url: https://github.com/org/team-backend-apps.git
  ref:
    branch: main
  secretRef:
    name: team-backend-git-credentials
```

---

## Common Pitfalls

### Sync Wave Misconfiguration

```yaml
## Bad - Resources created in wrong order
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
spec:
  source:
    path: manifests/
    ## ❌ No sync waves defined - CRDs and CRs may deploy simultaneously

---
## Good - Use sync waves for proper ordering
## manifests/01-crds.yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: myresources.example.com
  annotations:
    argocd.argoproj.io/sync-wave: "-1"  ## ✅ CRDs first

---
## manifests/02-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
  annotations:
    argocd.argoproj.io/sync-wave: "0"  ## ✅ Then namespace

---
## manifests/03-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  annotations:
    argocd.argoproj.io/sync-wave: "1"  ## ✅ Then deployment
```

### Missing Health Checks in Flux

```yaml
## Bad - No health checks, sync succeeds even if pods fail
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
spec:
  path: ./apps
  prune: true
  sourceRef:
    kind: GitRepository
    name: apps-repo
  ## ❌ No health checks defined

---
## Good - Health checks verify deployment success
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
spec:
  path: ./apps
  prune: true
  sourceRef:
    kind: GitRepository
    name: apps-repo
  wait: true  ## ✅ Wait for resources to be ready
  healthChecks:  ## ✅ Verify specific resources
    - apiVersion: apps/v1
      kind: Deployment
      name: web-app
      namespace: production
    - apiVersion: apps/v1
      kind: Deployment
      name: api-gateway
      namespace: production
  timeout: 5m  ## ✅ Set appropriate timeout
```

### Hardcoded Image Tags

```yaml
## Bad - Image tag hardcoded in base configuration
## apps/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  template:
    spec:
      containers:
        - name: web-app
          image: myregistry.com/web-app:v1.0.0  ## ❌ Hardcoded tag

---
## Good - Use Kustomize image transformers
## apps/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  template:
    spec:
      containers:
        - name: web-app
          image: myregistry.com/web-app  ## ✅ No tag

---
## apps/overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
images:
  - name: myregistry.com/web-app
    newTag: v1.2.3  ## ✅ Tag defined per environment
```

### Missing Dependency Order

```yaml
## Bad - Apps deploy before infrastructure
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
spec:
  path: ./apps
  sourceRef:
    kind: GitRepository
    name: apps-repo
  ## ❌ No dependsOn - may deploy before cert-manager exists

---
## Good - Explicit dependency chain
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure-controllers
spec:
  path: ./infrastructure/controllers
  sourceRef:
    kind: GitRepository
    name: infra-repo
  wait: true

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure-configs
spec:
  path: ./infrastructure/configs
  sourceRef:
    kind: GitRepository
    name: infra-repo
  dependsOn:
    - name: infrastructure-controllers  ## ✅ Wait for controllers
  wait: true

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
spec:
  path: ./apps
  sourceRef:
    kind: GitRepository
    name: apps-repo
  dependsOn:
    - name: infrastructure-controllers  ## ✅ Controllers ready
    - name: infrastructure-configs      ## ✅ Configs applied
```

---

## Anti-Patterns

### Using latest Tag

```yaml
## Bad - Unpredictable deployments
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  source:
    kustomize:
      images:
        - name: myapp
          newTag: latest  ## ❌ Never use latest

## Good - Pin specific versions
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  source:
    kustomize:
      images:
        - name: myapp
          newTag: v1.2.3  ## ✅ Specific version
          ## Or use digest for immutability:
          digest: sha256:abc123...
```

### Disabling Prune

```yaml
## Bad - Orphaned resources accumulate
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
spec:
  prune: false  ## ❌ Deleted manifests leave orphans

## Good - Enable pruning
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
spec:
  prune: true  ## ✅ Clean up deleted resources
  ## Use labels to control what gets pruned
  commonMetadata:
    labels:
      kustomize.toolkit.fluxcd.io/prune: enabled
```

### Manual Sync Without Tracking

```yaml
## Bad - Manual syncs bypass GitOps
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  syncPolicy: {}  ## ❌ No automated sync - requires manual intervention

## Good - Automated sync with self-healing
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true  ## ✅ Reverts manual changes
    syncOptions:
      - ApplyOutOfSyncOnly=true
```

### Secrets in Git Without Encryption

```yaml
## Bad - Plain secrets in Git
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:
  password: "supersecret123"  ## ❌ NEVER commit plain secrets

## Good - Use Sealed Secrets
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
spec:
  encryptedData:
    password: AgBy8h...  ## ✅ Encrypted, safe to commit

## Good - Use SOPS
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
stringData:
  password: ENC[AES256_GCM,data:...,type:str]  ## ✅ Encrypted with SOPS
sops:
  age:
    - recipient: age1...
```

---

## CLI Commands

### ArgoCD CLI

```bash
## Login
argocd login argocd.example.com --sso

## List applications
argocd app list
argocd app list --project production

## Get application details
argocd app get my-app
argocd app get my-app -o yaml

## Sync application
argocd app sync my-app
argocd app sync my-app --prune
argocd app sync my-app --force

## Sync with specific revision
argocd app sync my-app --revision v1.2.3

## Diff application
argocd app diff my-app
argocd app diff my-app --local ./manifests

## Rollback
argocd app rollback my-app
argocd app rollback my-app 3

## History
argocd app history my-app

## Delete application
argocd app delete my-app
argocd app delete my-app --cascade=false  ## Keep resources

## Create application
argocd app create my-app \
  --repo https://github.com/org/repo.git \
  --path apps/my-app \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace my-app

## Manage clusters
argocd cluster list
argocd cluster add my-context --name my-cluster

## Manage projects
argocd proj list
argocd proj get production

## Manage repos
argocd repo list
argocd repo add https://github.com/org/repo.git --ssh-private-key-path ~/.ssh/id_rsa
```

### Flux CLI

```bash
## Bootstrap Flux
flux bootstrap github \
  --owner=org \
  --repository=gitops-repo \
  --branch=main \
  --path=clusters/prod \
  --personal

## Check prerequisites
flux check --pre

## Check installation status
flux check

## Get all resources
flux get all -A
flux get all --namespace flux-system

## Get specific resources
flux get sources git
flux get kustomizations
flux get helmreleases -A

## Reconcile resources
flux reconcile source git apps-repo
flux reconcile kustomization apps
flux reconcile helmrelease ingress-nginx -n ingress-nginx

## Suspend/resume reconciliation
flux suspend kustomization apps
flux resume kustomization apps

## Export resources
flux export source git apps-repo > git-source.yaml
flux export kustomization apps > kustomization.yaml

## Create resources
flux create source git my-app \
  --url=https://github.com/org/app.git \
  --branch=main \
  --interval=1m

flux create kustomization my-app \
  --source=GitRepository/my-app \
  --path=./deploy \
  --prune=true \
  --interval=10m

flux create helmrelease nginx \
  --source=HelmRepository/ingress-nginx \
  --chart=ingress-nginx \
  --target-namespace=ingress-nginx

## Delete resources
flux delete source git my-app
flux delete kustomization my-app

## Logs and events
flux logs --follow
flux logs --kind=Kustomization --name=apps
flux events

## Trace resources
flux trace deployment my-app -n production

## Uninstall Flux
flux uninstall
```

### Kustomize Commands

```bash
## Build and preview
kustomize build apps/overlays/prod
kustomize build apps/overlays/prod | kubectl apply --dry-run=client -f -

## Build with Helm support
kustomize build --enable-helm apps/overlays/prod

## Apply directly
kustomize build apps/overlays/prod | kubectl apply -f -

## Diff against cluster
kustomize build apps/overlays/prod | kubectl diff -f -

## Create kustomization.yaml
kustomize create --autodetect --recursive

## Edit kustomization
kustomize edit add resource deployment.yaml
kustomize edit set image myapp=myapp:v2.0.0
kustomize edit set namespace production
kustomize edit add label env:prod
```

---

## Testing

### Validating Manifests

```bash
## Validate with kubeval
kubeval apps/overlays/prod/*.yaml

## Validate with kubeconform
kubeconform -summary apps/overlays/prod/

## Test Kustomize build
kustomize build apps/overlays/prod | kubeconform -

## Validate ArgoCD applications
argocd app diff my-app --local ./apps/overlays/prod

## Flux dry-run
flux reconcile kustomization apps --dry-run
```

### Pre-commit Hooks

```yaml
---
## .pre-commit-config.yaml
repos:
  - repo: https://github.com/yannh/kubeconform
    rev: v0.6.4
    hooks:
      - id: kubeconform
        args:
          - -summary
          - -output=json

  - repo: https://github.com/python-jsonschema/check-jsonschema
    rev: 0.27.3
    hooks:
      - id: check-jsonschema
        name: Validate Flux Kustomizations
        files: "flux-system/.*\\.yaml$"
        args:
          - --schemafile
          - https://raw.githubusercontent.com/fluxcd/flux2/main/manifests/crds/kustomize.toolkit.fluxcd.io_kustomizations.yaml

  - repo: https://github.com/gruntwork-io/pre-commit
    rev: v0.1.23
    hooks:
      - id: helmlint
```

### CI/CD Integration

```yaml
---
## .github/workflows/validate.yml
name: Validate GitOps

on:
  pull_request:
    paths:
      - "apps/**"
      - "infrastructure/**"
      - "clusters/**"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Flux CLI
        uses: fluxcd/flux2/action@main

      - name: Setup kubeconform
        run: |
          curl -sL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | \
            tar xz && sudo mv kubeconform /usr/local/bin/

      - name: Validate Flux resources
        run: |
          flux check --pre

      - name: Validate Kustomize builds
        run: |
          for env in dev staging prod; do
            echo "Validating $env..."
            kustomize build apps/overlays/$env | kubeconform -summary -
          done

      - name: Validate Helm releases
        run: |
          for hr in $(find . -name "helmrelease.yaml"); do
            flux reconcile helmrelease $(basename $(dirname $hr)) --dry-run
          done
```

---

## References

### Official Documentation

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Flux CD Documentation](https://fluxcd.io/flux/)
- [Kustomize Documentation](https://kustomize.io/)
- [Argo Rollouts Documentation](https://argoproj.github.io/argo-rollouts/)
- [Flagger Documentation](https://docs.flagger.app/)

### Best Practices

- [GitOps Principles](https://opengitops.dev/)
- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)
- [Flux Security Best Practices](https://fluxcd.io/flux/security/)
- [CNCF GitOps Working Group](https://github.com/cncf/tag-app-delivery/tree/main/gitops-wg)

### Tools

- [ArgoCD CLI](https://argo-cd.readthedocs.io/en/stable/cli_installation/)
- [Flux CLI](https://fluxcd.io/flux/cmd/)
- [Sealed Secrets](https://sealed-secrets.netlify.app/)
- [SOPS](https://github.com/getsops/sops)
- [External Secrets Operator](https://external-secrets.io/)

### Related Guides

- [Kubernetes & Helm Style Guide](../02_language_guides/kubernetes.md)
- [GitHub Actions Style Guide](../02_language_guides/github_actions.md)
- [YAML Style Guide](../02_language_guides/yaml.md)
- [Metadata Schema Reference](../03_metadata_schema/schema_reference.md)

---

**Maintainer**: Tyler Dukes
