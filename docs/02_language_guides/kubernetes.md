---
title: "Kubernetes & Helm Style Guide"
description: "Container orchestration standards for Kubernetes manifests and Helm charts"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [kubernetes, helm, containers, orchestration, k8s]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**Kubernetes** is a container orchestration platform for automating deployment, scaling, and management
of containerized applications. **Helm** is the package manager for Kubernetes, using charts to define,
install, and upgrade applications.

### Key Characteristics

- **Paradigm**: Declarative infrastructure as code
- **Language**: YAML manifests
- **Version Support**: Kubernetes 1.28.x through 1.31.x
- **Package Manager**: Helm 3.x (chartless installation)
- **Modern Approach**: Helm charts for reusable application definitions

### Primary Use Cases

- Container orchestration
- Microservices deployment
- Application scaling and rolling updates
- Service discovery and load balancing
- Configuration and secret management

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Resources | `kebab-case` | `my-app-deployment`, `web-service` | Lowercase with hyphens |
| Namespaces | `kebab-case` | `production`, `staging` | Environment or team based |
| Labels | `kebab-case` keys | `app: my-app`, `env: prod` | Consistent label keys |
| Helm Charts | `kebab-case` | `my-application` | Chart directory name |
| **Resource Types** | | | |
| Deployment | Application workloads | `kind: Deployment` | Stateless apps |
| StatefulSet | Stateful workloads | `kind: StatefulSet` | Databases, persistent apps |
| Service | Network services | `kind: Service` | Load balancing, discovery |
| ConfigMap | Configuration | `kind: ConfigMap` | Non-sensitive config |
| Secret | Sensitive data | `kind: Secret` | Passwords, tokens |
| Ingress | HTTP routing | `kind: Ingress` | External access |
| **File Naming** | | | |
| Manifests | `resource-type.yaml` | `deployment.yaml`, `service.yaml` | One resource per file |
| Combined | `app-name.yaml` | `my-app.yaml` | All resources together |
| Helm Values | `values.yaml` | `values.yaml`, `values-prod.yaml` | Chart values |
| **Labels** | | | |
| app | Application name | `app: nginx` | Required label |
| version | App version | `version: "1.0.0"` | Deployment tracking |
| environment | Environment | `environment: production` | Env identification |
| **Best Practices** | | | |
| Resource Limits | Always set | `limits:` and `requests:` | CPU and memory |
| Readiness Probes | Define probes | `readinessProbe:` | Health checking |
| Namespaces | Use namespaces | Isolate workloads | Multi-tenancy |
| Helm Charts | Package with Helm | Reusable templates | DRY principle |

---

## Naming Conventions

### Resource Names

Use **kebab-case** for all Kubernetes resource names:

```yaml
## Good
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-application
  namespace: production

## Bad
metadata:
  name: webApplication  # camelCase - avoid
  name: web_application  # snake_case - avoid
```

### Namespace Conventions

```yaml
## Environment-based namespaces
production
staging
development

## Team or project-based namespaces
team-platform
team-backend
project-analytics

## System namespaces (reserved)
kube-system
kube-public
kube-node-lease
default
```

---

## Label Standards

### Required Labels

Apply these labels to ALL resources:

```yaml
metadata:
  labels:
    app.kubernetes.io/name: nginx
    app.kubernetes.io/instance: nginx-production
    app.kubernetes.io/version: "1.24.0"
    app.kubernetes.io/component: webserver
    app.kubernetes.io/part-of: ecommerce-platform
    app.kubernetes.io/managed-by: helm
```

### Label Descriptions

```yaml
app.kubernetes.io/name: "nginx"           # Application name
app.kubernetes.io/instance: "nginx-prod"  # Unique instance identifier
app.kubernetes.io/version: "1.24.0"       # Application version
app.kubernetes.io/component: "webserver"  # Component within architecture
app.kubernetes.io/part-of: "platform"     # Application group/system
app.kubernetes.io/managed-by: "helm"      # Tool managing the resource
```

### Custom Labels

```yaml
metadata:
  labels:
    # Standard labels
    app.kubernetes.io/name: api
    app.kubernetes.io/instance: api-production
    # Custom labels
    environment: production
    team: backend
    cost-center: engineering
```

---

## Annotation Patterns

```yaml
metadata:
  annotations:
    # Deployment metadata
    kubernetes.io/change-cause: "Update to v1.2.3"
    deployment.kubernetes.io/revision: "5"

    # Documentation
    description: "User authentication API"
    contact: "platform-team@example.com"
    documentation: "https://docs.example.com/api"

    # Monitoring and alerting
    prometheus.io/scrape: "true"
    prometheus.io/port: "9090"
    prometheus.io/path: "/metrics"

    # Service mesh (Istio/Linkerd)
    sidecar.istio.io/inject: "true"
    linkerd.io/inject: enabled
```

---

## Deployment Manifests

```yaml
---
## @module web-application-deployment
## @description Production deployment for web application
## @version 1.0.0
## @author Tyler Dukes
## @last_updated 2025-10-28

apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-application
  namespace: production
  labels:
    app.kubernetes.io/name: web-application
    app.kubernetes.io/instance: web-production
    app.kubernetes.io/version: "1.2.3"
    app.kubernetes.io/component: frontend
    app.kubernetes.io/part-of: ecommerce
    app.kubernetes.io/managed-by: helm
spec:
  replicas: 3
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: web-application
      app.kubernetes.io/instance: web-production
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web-application
        app.kubernetes.io/instance: web-production
        app.kubernetes.io/version: "1.2.3"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      serviceAccountName: web-application
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: web
          image: myregistry.com/web-application:1.2.3
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          env:
            - name: APP_ENV
              value: "production"
            - name: DATABASE_HOST
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: database_host
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database_password
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /startup
              port: http
            initialDelaySeconds: 0
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 30
          volumeMounts:
            - name: config
              mountPath: /etc/app/config
              readOnly: true
            - name: cache
              mountPath: /var/cache/app
      volumes:
        - name: config
          configMap:
            name: app-config
        - name: cache
          emptyDir: {}
```

---

## Service Definitions

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: web-application
  namespace: production
  labels:
    app.kubernetes.io/name: web-application
    app.kubernetes.io/instance: web-production
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
  selector:
    app.kubernetes.io/name: web-application
    app.kubernetes.io/instance: web-production

---
## LoadBalancer service
apiVersion: v1
kind: Service
metadata:
  name: web-application-public
  namespace: production
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
  ports:
    - name: https
      port: 443
      targetPort: http
      protocol: TCP
  selector:
    app.kubernetes.io/name: web-application
```

---

## ConfigMap and Secret Patterns

### ConfigMap

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
  labels:
    app.kubernetes.io/name: web-application
data:
  app.env: "production"
  database_host: "postgres.production.svc.cluster.local"
  database_port: "5432"
  redis_host: "redis.production.svc.cluster.local"
  log_level: "info"

  # Configuration file
  nginx.conf: |
    server {
        listen 8080;
        location / {
            proxy_pass http://backend:8080;
        }
    }
```

### Secret

```yaml
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
  labels:
    app.kubernetes.io/name: web-application
type: Opaque
stringData:
  database_password: "super-secret-password"
  api_key: "secret-api-key-12345"
  jwt_secret: "jwt-signing-secret"

## Use external secret management
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: app-secrets
  data:
    - secretKey: database_password
      remoteRef:
        key: production/database
        property: password
```

---

## Resource Limits and Requests

### Guidelines

```yaml
## Development
resources:
  requests:
    cpu: 50m       # 0.05 CPU cores
    memory: 64Mi
  limits:
    cpu: 200m      # 0.2 CPU cores
    memory: 256Mi

## Staging
resources:
  requests:
    cpu: 100m      # 0.1 CPU cores
    memory: 128Mi
  limits:
    cpu: 500m      # 0.5 CPU cores
    memory: 512Mi

## Production
resources:
  requests:
    cpu: 250m      # 0.25 CPU cores
    memory: 512Mi
  limits:
    cpu: 1000m     # 1 CPU core
    memory: 2Gi
```

### Quality of Service (QoS) Classes

```yaml
## Guaranteed QoS - requests == limits
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 500m
    memory: 1Gi

## Burstable QoS - requests < limits
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 1Gi

## BestEffort QoS - no requests or limits (avoid in production)
```

---

## Health Probes

### Liveness Probe

Restarts container if probe fails:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
    httpHeaders:
      - name: X-Health-Check
        value: liveness
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

### Readiness Probe

Removes pod from service endpoints if probe fails:

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3
```

### Startup Probe

Delays liveness/readiness probes during slow application startup:

```yaml
startupProbe:
  httpGet:
    path: /startup
    port: 8080
  initialDelaySeconds: 0
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 30  # 30 * 5s = 150s max startup time
```

### Probe Types

```yaml
## HTTP probe
httpGet:
  path: /health
  port: 8080
  scheme: HTTP

## TCP probe
tcpSocket:
  port: 5432

## Command probe
exec:
  command:
    - /bin/sh
    - -c
    - pg_isready -U postgres
```

---

## Helm Chart Structure

```text
my-application/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration values
├── values-dev.yaml         # Development overrides
├── values-prod.yaml        # Production overrides
├── charts/                 # Dependency charts
├── templates/
│   ├── _helpers.tpl        # Template helpers
│   ├── deployment.yaml     # Deployment manifest
│   ├── service.yaml        # Service manifest
│   ├── ingress.yaml        # Ingress manifest
│   ├── configmap.yaml      # ConfigMap
│   ├── secret.yaml         # Secret
│   ├── serviceaccount.yaml # ServiceAccount
│   ├── hpa.yaml            # HorizontalPodAutoscaler
│   ├── pdb.yaml            # PodDisruptionBudget
│   └── NOTES.txt           # Post-install notes
├── .helmignore             # Files to exclude
└── README.md               # Chart documentation
```

### Chart.yaml

```yaml
apiVersion: v2
name: web-application
description: A Helm chart for web application deployment
type: application
version: 1.0.0
appVersion: "1.2.3"
keywords:
  - web
  - api
  - application
home: https://example.com
sources:
  - https://github.com/example/web-application
maintainers:
  - name: Tyler Dukes
    email: tyler@example.com
dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: redis
    version: "17.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
```

---

## values.yaml Patterns

```yaml
## values.yaml
---
## Application configuration
replicaCount: 3

image:
  repository: myregistry.com/web-application
  pullPolicy: IfNotPresent
  tag: ""  # Defaults to Chart.appVersion

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: true

service:
  type: ClusterIP
  port: 80
  targetPort: http

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: app-tls
      hosts:
        - app.example.com

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}
tolerations: []
affinity: {}

## Application-specific configuration
config:
  environment: production
  logLevel: info
  database:
    host: postgres.production.svc.cluster.local
    port: 5432

## Secret management
secrets:
  databasePassword: ""
  apiKey: ""
```

---

## Helper Templates (_helpers.tpl)

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "web-application.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "web-application.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "web-application.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "web-application.labels" -}}
helm.sh/chart: {{ include "web-application.chart" . }}
{{ include "web-application.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "web-application.selectorLabels" -}}
app.kubernetes.io/name: {{ include "web-application.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "web-application.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "web-application.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
```

---

## Helm Template Example

```yaml
## templates/deployment.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "web-application.fullname" . }}
  labels:
    {{- include "web-application.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "web-application.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "web-application.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "web-application.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          env:
            - name: APP_ENV
              value: {{ .Values.config.environment }}
            - name: LOG_LEVEL
              value: {{ .Values.config.logLevel }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

---

## Helm Commands

```bash
## Install chart
helm install my-app ./my-application -n production

## Install with custom values
helm install my-app ./my-application \
  -f values-prod.yaml \
  -n production \
  --create-namespace

## Upgrade release
helm upgrade my-app ./my-application \
  -f values-prod.yaml \
  -n production

## Upgrade with rollback on failure
helm upgrade my-app ./my-application \
  -f values-prod.yaml \
  --atomic \
  --timeout 5m

## Dry run / template rendering
helm install my-app ./my-application \
  --dry-run \
  --debug \
  -f values-prod.yaml

## Lint chart
helm lint ./my-application

## Package chart
helm package ./my-application

## List releases
helm list -n production

## Rollback
helm rollback my-app 5 -n production

## Uninstall
helm uninstall my-app -n production
```

---

## Anti-Patterns

### ❌ Avoid: latest Tag

```yaml
## Bad - Unpredictable deployments
image: nginx:latest

## Good - Pin specific versions
image: nginx:1.24.0
image: nginx:1.24.0-alpine
```

### ❌ Avoid: No Resource Limits

```yaml
## Bad - Can cause node resource exhaustion
containers:
  - name: app
    image: myapp:1.0.0

## Good - Define limits
containers:
  - name: app
    image: myapp:1.0.0
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi
```

### ❌ Avoid: Running as Root

```yaml
## Bad - Security risk
securityContext:
  runAsUser: 0

## Good - Run as non-root
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
```

### ❌ Avoid: Missing Health Probes

```yaml
## Bad - No health checks
containers:
  - name: app
    image: myapp:1.0.0

## Good - Include probes
containers:
  - name: app
    image: myapp:1.0.0
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
```

### ❌ Avoid: Storing Secrets in ConfigMaps

```yaml
## Bad - Secrets in ConfigMap (visible in plain text)
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_password: "MySecretPassword"  # ❌ Plain text!
  api_key: "sk-1234567890"              # ❌ Plain text!

## Good - Use Secrets with proper encryption
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  database_password: "MySecretPassword"  # ✅ Base64 encoded
  api_key: "sk-1234567890"              # ✅ Base64 encoded

## Better - Use external secret management
## Sealed Secrets, External Secrets Operator, or cloud provider KMS
```

### ❌ Avoid: No Pod Disruption Budgets

```yaml
## Bad - No protection during cluster maintenance
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  # No PodDisruptionBudget - all pods could be terminated at once

## Good - Define disruption budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2  # ✅ Always keep 2 pods running
  selector:
    matchLabels:
      app: web
```

### ❌ Avoid: Missing Network Policies

```yaml
## Bad - No network restrictions (pods can talk to anything)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  # No NetworkPolicy - unrestricted network access

## Good - Restrict network traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-netpol
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - protocol: TCP
          port: 5432
```

---

## Security Best Practices

### Pod Security Standards

Use Pod Security Standards to enforce security policies.

```yaml
## Bad - Running as root with privileges
apiVersion: v1
kind: Pod
metadata:
  name: insecure-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      privileged: true  # NEVER in production!
      runAsUser: 0      # Running as root!

## Good - Non-root with security contexts
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    volumeMounts:
    - name: tmp
      mountPath: /tmp
  volumes:
  - name: tmp
    emptyDir: {}
```

### Secrets Management

Never hardcode sensitive data in manifests.

```yaml
## Bad - Secrets in plain text
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    env:
    - name: DB_PASSWORD
      value: "SuperSecret123"  # EXPOSED!
    - name: API_KEY
      value: "sk_live_abc123"   # In version control!

## Good - Use Kubernetes Secrets
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  db-password: U3VwZXJTZWNyZXQxMjM=  # base64 encoded
  api-key: c2tfbGl2ZV9hYmMxMjM=      # base64 encoded

---
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    envFrom:
    - secretRef:
        name: app-secrets

## Better - Use external secrets management
## External Secrets Operator with AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: app-secrets
  data:
  - secretKey: db-password
    remoteRef:
      key: prod/db/password
  - secretKey: api-key
    remoteRef:
      key: prod/api/key
```

### Network Policies

Restrict pod-to-pod communication.

```yaml
## Bad - No network policies (pods can access anything)
## Default allow-all is insecure!

## Good - Deny all, then allow specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-app-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: web-app
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
  - to:  # Allow DNS
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

### RBAC (Role-Based Access Control)

Follow principle of least privilege.

```yaml
## Bad - Cluster-admin for all service accounts
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: all-cluster-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin  # TOO PERMISSIVE!
subjects:
- kind: ServiceAccount
  name: default
  namespace: default

## Good - Scoped permissions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods", "configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["app-secrets"]  # Specific secret only
  verbs: ["get"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-role-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: production
roleRef:
  kind: Role
  name: app-role
  apiGroup: rbac.authorization.k8s.io
```

### Resource Limits and Quotas

Prevent resource exhaustion attacks.

```yaml
## Bad - No resource limits
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: myapp
    ## No limits - can consume all node resources!

## Good - Set resource requests and limits
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: myapp
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"

## Good - Enforce with ResourceQuota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "10"

## Good - Set default limits
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - default:
      memory: 512Mi
      cpu: 500m
    defaultRequest:
      memory: 256Mi
      cpu: 250m
    type: Container
```

### Image Security

Use trusted images and scan for vulnerabilities.

```yaml
## Bad - Using latest tag from untrusted registry
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: randomuser/myapp:latest  # Untrusted! Unpredictable!

## Good - Pin specific versions from trusted registry
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: gcr.io/mycompany/myapp:v1.2.3@sha256:abc123...  # SHA256 digest
    imagePullPolicy: Always

## Good - Use private registry with imagePullSecrets
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: app
    image: myregistry.azurecr.io/myapp:v1.2.3

## Enforce with admission controller
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sAllowedRepos
metadata:
  name: allowed-repositories
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
  parameters:
    repos:
    - "gcr.io/mycompany/"
    - "myregistry.azurecr.io/"
```

### Admission Control

Use admission controllers to enforce policies.

```yaml
## OPA Gatekeeper policy - Block privileged containers
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivilegedContainer
metadata:
  name: deny-privileged-containers
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
  parameters:
    excludedNamespaces:
    - kube-system

## Block images without digest
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sImageDigests
metadata:
  name: require-image-digest
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]

## Require labels
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-owner-label
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
  parameters:
    labels:
    - key: "owner"
    - key: "environment"
```

### Audit Logging

Enable comprehensive audit logging.

```yaml
## kube-apiserver audit policy
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
## Log all requests to Secrets
- level: RequestResponse
  resources:
  - group: ""
    resources: ["secrets"]

## Log all authentication and authorization failures
- level: Metadata
  omitStages:
  - "RequestReceived"
  userGroups:
  - "system:unauthenticated"

## Log pod exec and port-forward
- level: Request
  verbs: ["create"]
  resources:
  - group: ""
    resources: ["pods/exec", "pods/portforward"]
```

### Pod Disruption Budgets

Protect against accidental disruption.

```yaml
## Good - Ensure minimum availability during maintenance
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: critical-app

## Or use percentage
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb-percent
  namespace: production
spec:
  maxUnavailable: "25%"
  selector:
    matchLabels:
      app: web-app
```

---

## References

### Official Documentation

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes API Reference](https://kubernetes.io/docs/reference/kubernetes-api/)

### Best Practices

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [12 Factor App](https://12factor.net/)

### Tools

- [kubectl](https://kubernetes.io/docs/reference/kubectl/) - Kubernetes CLI
- [helm](https://helm.sh/) - Kubernetes package manager
- [kubeval](https://github.com/instrumenta/kubeval) - Kubernetes manifest validation
- [kube-linter](https://github.com/stackrox/kube-linter) - Static analysis tool
- [kustomize](https://kustomize.io/) - Template-free customization

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
