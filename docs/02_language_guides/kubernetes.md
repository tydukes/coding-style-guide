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

## Naming Conventions

### Resource Names

Use **kebab-case** for all Kubernetes resource names:

```yaml
# Good
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-application
  namespace: production

# Bad
metadata:
  name: webApplication  # camelCase - avoid
  name: web_application  # snake_case - avoid
```

### Namespace Conventions

```yaml
# Environment-based namespaces
production
staging
development

# Team or project-based namespaces
team-platform
team-backend
project-analytics

# System namespaces (reserved)
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
# @module web-application-deployment
# @description Production deployment for web application
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-10-28

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
# LoadBalancer service
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

# Use external secret management
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
# Development
resources:
  requests:
    cpu: 50m       # 0.05 CPU cores
    memory: 64Mi
  limits:
    cpu: 200m      # 0.2 CPU cores
    memory: 256Mi

# Staging
resources:
  requests:
    cpu: 100m      # 0.1 CPU cores
    memory: 128Mi
  limits:
    cpu: 500m      # 0.5 CPU cores
    memory: 512Mi

# Production
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
# Guaranteed QoS - requests == limits
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 500m
    memory: 1Gi

# Burstable QoS - requests < limits
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 1Gi

# BestEffort QoS - no requests or limits (avoid in production)
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
# HTTP probe
httpGet:
  path: /health
  port: 8080
  scheme: HTTP

# TCP probe
tcpSocket:
  port: 5432

# Command probe
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
# values.yaml
---
# Application configuration
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

# Application-specific configuration
config:
  environment: production
  logLevel: info
  database:
    host: postgres.production.svc.cluster.local
    port: 5432

# Secret management
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
# templates/deployment.yaml
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
# Install chart
helm install my-app ./my-application -n production

# Install with custom values
helm install my-app ./my-application \
  -f values-prod.yaml \
  -n production \
  --create-namespace

# Upgrade release
helm upgrade my-app ./my-application \
  -f values-prod.yaml \
  -n production

# Upgrade with rollback on failure
helm upgrade my-app ./my-application \
  -f values-prod.yaml \
  --atomic \
  --timeout 5m

# Dry run / template rendering
helm install my-app ./my-application \
  --dry-run \
  --debug \
  -f values-prod.yaml

# Lint chart
helm lint ./my-application

# Package chart
helm package ./my-application

# List releases
helm list -n production

# Rollback
helm rollback my-app 5 -n production

# Uninstall
helm uninstall my-app -n production
```

---

## Anti-Patterns

### ❌ Avoid: latest Tag

```yaml
# Bad - Unpredictable deployments
image: nginx:latest

# Good - Pin specific versions
image: nginx:1.24.0
image: nginx:1.24.0-alpine
```

### ❌ Avoid: No Resource Limits

```yaml
# Bad - Can cause node resource exhaustion
containers:
  - name: app
    image: myapp:1.0.0

# Good - Define limits
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
# Bad - Security risk
securityContext:
  runAsUser: 0

# Good - Run as non-root
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
```

### ❌ Avoid: Missing Health Probes

```yaml
# Bad - No health checks
containers:
  - name: app
    image: myapp:1.0.0

# Good - Include probes
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
