---
title: "Chaos Engineering and Synthetic Monitoring Standards"
description: "Comprehensive guide to chaos engineering practices, synthetic monitoring, and resilience testing including Chaos Mesh, Litmus, Datadog Synthetics, and Checkly"
author: "Tyler Dukes"
tags: [chaos-engineering, synthetic-monitoring, resilience, chaos-mesh, litmus, datadog, checkly, sre, reliability, kubernetes, observability]
category: "CI/CD"
status: "active"
---

## Introduction

This guide provides comprehensive standards for implementing chaos engineering experiments
and synthetic monitoring to validate system resilience. It covers experiment design,
safety measures, and proactive monitoring strategies.

---

## Table of Contents

1. [Chaos Engineering Philosophy](#chaos-engineering-philosophy)
2. [Chaos Mesh for Kubernetes](#chaos-mesh-for-kubernetes)
3. [Litmus Chaos](#litmus-chaos)
4. [Chaos Monkey Patterns](#chaos-monkey-patterns)
5. [Experiment Design](#experiment-design)
6. [Safety and Blast Radius](#safety-and-blast-radius)
7. [Synthetic Monitoring Overview](#synthetic-monitoring-overview)
8. [Datadog Synthetics](#datadog-synthetics)
9. [Checkly](#checkly)
10. [Uptime and SLO Standards](#uptime-and-slo-standards)
11. [CI/CD Integration](#cicd-integration)
12. [Best Practices](#best-practices)

---

## Chaos Engineering Philosophy

### Core Principles

```text
┌─────────────────────────────────────────────────────────────────┐
│                  Chaos Engineering Workflow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │   HYPOTHESIZE │ → │   EXPERIMENT │ → │    ANALYZE   │     │
│   │              │    │              │    │              │      │
│   │  Define      │    │  Inject      │    │  Measure     │      │
│   │  steady      │    │  controlled  │    │  impact on   │      │
│   │  state       │    │  failures    │    │  steady      │      │
│   │              │    │              │    │  state       │      │
│   └──────────────┘    └──────────────┘    └──────────────┘      │
│          │                   │                   │               │
│          └───────────────────┼───────────────────┘               │
│                              │                                   │
│                       ┌──────▼──────┐                           │
│                       │   IMPROVE   │                           │
│                       │   SYSTEM    │                           │
│                       └─────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Chaos Maturity Model

```yaml
# chaos-maturity-assessment.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: chaos-maturity-levels
data:
  levels: |
    Level 0 - Ad Hoc:
      - No formal chaos practices
      - Reactive incident response only
      - No resilience testing

    Level 1 - Initial:
      - Manual failure injection in staging
      - Basic health checks exist
      - Some runbooks documented

    Level 2 - Managed:
      - Scheduled chaos experiments
      - Automated rollback mechanisms
      - Incident correlation with experiments

    Level 3 - Defined:
      - Chaos experiments in CI/CD
      - Hypothesis-driven experiments
      - Blast radius controls enforced

    Level 4 - Measured:
      - Continuous chaos in production
      - SLO-based experiment triggers
      - Automated experiment analysis

    Level 5 - Optimized:
      - AI-driven chaos selection
      - Self-healing systems validated
      - Chaos as culture embedded
```

---

## Chaos Mesh for Kubernetes

### Chaos Mesh Installation

```bash
# Install Chaos Mesh using Helm
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm repo update

# Create namespace
kubectl create namespace chaos-mesh

# Install with recommended settings
helm install chaos-mesh chaos-mesh/chaos-mesh \
  --namespace chaos-mesh \
  --set chaosDaemon.runtime=containerd \
  --set chaosDaemon.socketPath=/run/containerd/containerd.sock \
  --set dashboard.securityMode=true \
  --version 2.6.3

# Verify installation
kubectl get pods -n chaos-mesh
```

### Pod Chaos Experiments

```yaml
# Good - Pod failure experiment with safety controls
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-failure-api-service
  namespace: chaos-testing
  labels:
    experiment-type: pod-failure
    team: platform
    severity: medium
spec:
  action: pod-failure
  mode: one
  value: "1"
  duration: "30s"
  selector:
    namespaces:
      - production
    labelSelectors:
      app: api-service
      chaos-enabled: "true"
    expressionSelectors:
      - key: environment
        operator: In
        values:
          - production
          - staging
  scheduler:
    cron: "@every 4h"
```

```yaml
# Good - Pod kill experiment with percentage mode
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-worker-nodes
  namespace: chaos-testing
spec:
  action: pod-kill
  mode: fixed-percent
  value: "25"
  duration: "1m"
  gracePeriod: 30
  selector:
    namespaces:
      - production
    labelSelectors:
      app: worker
      chaos-enabled: "true"
    podPhaseSelectors:
      - Running
```

```yaml
# Good - Container kill targeting specific container
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: container-kill-sidecar
  namespace: chaos-testing
spec:
  action: container-kill
  mode: one
  containerNames:
    - envoy-sidecar
  duration: "45s"
  selector:
    namespaces:
      - production
    labelSelectors:
      app: api-gateway
```

### Network Chaos Experiments

```yaml
# Good - Network delay injection
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-delay-database
  namespace: chaos-testing
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: api-service
  delay:
    latency: "100ms"
    jitter: "20ms"
    correlation: "25"
  direction: to
  target:
    selector:
      namespaces:
        - production
      labelSelectors:
        app: postgres
    mode: all
  duration: "2m"
```

```yaml
# Good - Network partition simulation
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-partition-zones
  namespace: chaos-testing
spec:
  action: partition
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      zone: us-east-1a
  direction: both
  target:
    selector:
      namespaces:
        - production
      labelSelectors:
        zone: us-east-1b
    mode: all
  duration: "30s"
```

```yaml
# Good - Packet loss injection
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-loss-external
  namespace: chaos-testing
spec:
  action: loss
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: payment-service
  loss:
    loss: "10"
    correlation: "50"
  direction: to
  externalTargets:
    - stripe.com
    - api.stripe.com
  duration: "5m"
```

```yaml
# Good - Bandwidth limitation
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-bandwidth-limit
  namespace: chaos-testing
spec:
  action: bandwidth
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: file-upload-service
  bandwidth:
    rate: "1mbps"
    limit: 100
    buffer: 10000
  direction: to
  duration: "10m"
```

### Stress Chaos Experiments

```yaml
# Good - CPU stress test
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: cpu-stress-api
  namespace: chaos-testing
spec:
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: api-service
  stressors:
    cpu:
      workers: 2
      load: 80
  duration: "5m"
  containerNames:
    - api
```

```yaml
# Good - Memory stress test
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: memory-stress-cache
  namespace: chaos-testing
spec:
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: cache-service
  stressors:
    memory:
      workers: 4
      size: "256Mi"
      oomScoreAdj: -1000
  duration: "3m"
```

### IO Chaos Experiments

```yaml
# Good - IO delay injection
apiVersion: chaos-mesh.org/v1alpha1
kind: IOChaos
metadata:
  name: io-delay-database
  namespace: chaos-testing
spec:
  action: latency
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: postgres
  volumePath: /var/lib/postgresql/data
  path: "**/*"
  delay: "100ms"
  percent: 50
  duration: "2m"
```

```yaml
# Good - IO fault injection
apiVersion: chaos-mesh.org/v1alpha1
kind: IOChaos
metadata:
  name: io-fault-storage
  namespace: chaos-testing
spec:
  action: fault
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: object-storage
  volumePath: /data
  path: "/data/uploads/*"
  errno: 5
  percent: 10
  duration: "1m"
```

### HTTP Chaos Experiments

```yaml
# Good - HTTP abort injection
apiVersion: chaos-mesh.org/v1alpha1
kind: HTTPChaos
metadata:
  name: http-abort-external-api
  namespace: chaos-testing
spec:
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: integration-service
  target: Request
  port: 80
  method: GET
  path: /api/external/*
  abort: true
  percent: 50
  duration: "2m"
```

```yaml
# Good - HTTP delay injection
apiVersion: chaos-mesh.org/v1alpha1
kind: HTTPChaos
metadata:
  name: http-delay-upstream
  namespace: chaos-testing
spec:
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: api-gateway
  target: Response
  port: 8080
  delay: "2s"
  percent: 25
  code: 200
  duration: "5m"
```

```yaml
# Good - HTTP response replacement
apiVersion: chaos-mesh.org/v1alpha1
kind: HTTPChaos
metadata:
  name: http-error-injection
  namespace: chaos-testing
spec:
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: user-service
  target: Response
  port: 8080
  path: /api/users/*
  replace:
    code: 503
    body: '{"error": "Service temporarily unavailable"}'
    headers:
      Retry-After: "30"
  percent: 10
  duration: "3m"
```

### DNS Chaos Experiments

```yaml
# Good - DNS error injection
apiVersion: chaos-mesh.org/v1alpha1
kind: DNSChaos
metadata:
  name: dns-error-external
  namespace: chaos-testing
spec:
  action: error
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: notification-service
  patterns:
    - "smtp.sendgrid.net"
    - "*.sendgrid.net"
  duration: "1m"
```

```yaml
# Good - DNS random response
apiVersion: chaos-mesh.org/v1alpha1
kind: DNSChaos
metadata:
  name: dns-random-database
  namespace: chaos-testing
spec:
  action: random
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: api-service
  patterns:
    - "postgres.internal"
  duration: "30s"
```

### Chaos Mesh Workflow

```yaml
# Good - Sequential chaos workflow
apiVersion: chaos-mesh.org/v1alpha1
kind: Workflow
metadata:
  name: comprehensive-resilience-test
  namespace: chaos-testing
spec:
  entry: entry-point
  templates:
    - name: entry-point
      templateType: Serial
      deadline: 30m
      children:
        - network-delay-phase
        - pod-failure-phase
        - stress-test-phase
        - cleanup-phase

    - name: network-delay-phase
      templateType: NetworkChaos
      deadline: 5m
      networkChaos:
        action: delay
        mode: all
        selector:
          namespaces:
            - production
          labelSelectors:
            app: api-service
        delay:
          latency: "200ms"
        duration: "3m"

    - name: pod-failure-phase
      templateType: PodChaos
      deadline: 5m
      podChaos:
        action: pod-failure
        mode: one
        selector:
          namespaces:
            - production
          labelSelectors:
            app: api-service
        duration: "2m"

    - name: stress-test-phase
      templateType: StressChaos
      deadline: 10m
      stressChaos:
        mode: one
        selector:
          namespaces:
            - production
          labelSelectors:
            app: api-service
        stressors:
          cpu:
            workers: 2
            load: 70
        duration: "5m"

    - name: cleanup-phase
      templateType: Suspend
      deadline: 1m
      suspend:
        duration: "30s"
```

```yaml
# Good - Parallel chaos workflow
apiVersion: chaos-mesh.org/v1alpha1
kind: Workflow
metadata:
  name: multi-service-chaos
  namespace: chaos-testing
spec:
  entry: parallel-experiments
  templates:
    - name: parallel-experiments
      templateType: Parallel
      deadline: 15m
      children:
        - api-chaos
        - database-chaos
        - cache-chaos

    - name: api-chaos
      templateType: PodChaos
      podChaos:
        action: pod-kill
        mode: one
        selector:
          namespaces:
            - production
          labelSelectors:
            app: api-service
        duration: "5m"

    - name: database-chaos
      templateType: NetworkChaos
      networkChaos:
        action: delay
        mode: all
        selector:
          namespaces:
            - production
          labelSelectors:
            app: postgres
        delay:
          latency: "50ms"
        duration: "5m"

    - name: cache-chaos
      templateType: StressChaos
      stressChaos:
        mode: one
        selector:
          namespaces:
            - production
          labelSelectors:
            app: redis
        stressors:
          memory:
            workers: 1
            size: "100Mi"
        duration: "5m"
```

---

## Litmus Chaos

### Litmus Installation

```bash
# Install Litmus using Helm
helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm/
helm repo update

# Create namespace
kubectl create namespace litmus

# Install Litmus ChaosCenter
helm install chaos litmuschaos/litmus \
  --namespace litmus \
  --set portal.frontend.service.type=LoadBalancer \
  --set mongodb.persistence.enabled=true \
  --set mongodb.persistence.size=20Gi

# Verify installation
kubectl get pods -n litmus

# Get access URL
kubectl get svc -n litmus
```

### ChaosEngine Configuration

```yaml
# Good - Basic ChaosEngine
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: nginx-chaos-engine
  namespace: default
  labels:
    context: chaos-testing
spec:
  engineState: active
  annotationCheck: "true"
  appinfo:
    appns: default
    applabel: "app=nginx"
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: CHAOS_INTERVAL
              value: "10"
            - name: FORCE
              value: "false"
            - name: PODS_AFFECTED_PERC
              value: "50"
```

```yaml
# Good - ChaosEngine with probes
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: api-resilience-test
  namespace: production
spec:
  engineState: active
  appinfo:
    appns: production
    applabel: "app=api-service"
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        probe:
          - name: health-check
            type: httpProbe
            mode: Continuous
            runProperties:
              probeTimeout: 5s
              retry: 3
              interval: 2s
            httpProbe/inputs:
              url: http://api-service.production.svc:8080/health
              insecureSkipVerify: false
              method:
                get:
                  criteria: ==
                  responseCode: "200"
          - name: prometheus-check
            type: promProbe
            mode: Edge
            runProperties:
              probeTimeout: 5s
              retry: 2
            promProbe/inputs:
              endpoint: http://prometheus.monitoring.svc:9090
              query: sum(rate(http_requests_total{status=~"5.."}[1m]))
              comparator:
                type: float
                criteria: "<="
                value: "0.1"
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "120"
            - name: CHAOS_INTERVAL
              value: "15"
```

### Litmus Workflows

```yaml
# Good - Comprehensive Litmus workflow
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: resilience-workflow
  namespace: litmus
spec:
  entrypoint: resilience-test
  serviceAccountName: argo-chaos
  securityContext:
    runAsUser: 1000
    runAsNonRoot: true
  arguments:
    parameters:
      - name: adminModeNamespace
        value: litmus
  templates:
    - name: resilience-test
      steps:
        - - name: install-experiment
            template: install-experiment

        - - name: run-chaos
            template: run-chaos

        - - name: verify-results
            template: verify-results

    - name: install-experiment
      inputs:
        artifacts:
          - name: pod-delete-experiment
            path: /tmp/pod-delete.yaml
            raw:
              data: |
                apiVersion: litmuschaos.io/v1alpha1
                kind: ChaosExperiment
                metadata:
                  name: pod-delete
                  namespace: litmus
                spec:
                  definition:
                    scope: Namespaced
                    permissions:
                      - apiGroups: [""]
                        resources: ["pods"]
                        verbs: ["delete", "get", "list"]
                    image: litmuschaos/go-runner:latest
                    imagePullPolicy: Always
                    args:
                      - -c
                      - ./experiments -name pod-delete
                    command:
                      - /bin/bash
                    env:
                      - name: TOTAL_CHAOS_DURATION
                        value: "30"
                      - name: CHAOS_INTERVAL
                        value: "10"
      container:
        name: install
        image: litmuschaos/k8s:latest
        command: [kubectl, apply, -f, /tmp/pod-delete.yaml]

    - name: run-chaos
      container:
        name: run-chaos
        image: litmuschaos/litmus-checker:latest
        args:
          - -file=/tmp/chaosengine.yaml
        env:
          - name: APP_NAMESPACE
            value: production
          - name: APP_LABEL
            value: app=api-service
          - name: EXPERIMENT_NAME
            value: pod-delete

    - name: verify-results
      container:
        name: verify
        image: curlimages/curl:latest
        command:
          - /bin/sh
          - -c
          - |
            # Check application health
            status=$(curl -s -o /dev/null -w "%{http_code}" http://api-service.production.svc:8080/health)
            if [ "$status" != "200" ]; then
              echo "Health check failed with status: $status"
              exit 1
            fi
            echo "Application recovered successfully"
```

### Litmus Experiments Library

```yaml
# Good - Container kill experiment
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: container-kill-engine
  namespace: production
spec:
  engineState: active
  appinfo:
    appns: production
    applabel: "app=api-service"
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: container-kill
      spec:
        components:
          env:
            - name: TARGET_CONTAINER
              value: "api"
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: CHAOS_INTERVAL
              value: "10"
            - name: SIGNAL
              value: "SIGKILL"
```

```yaml
# Good - Network loss experiment
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: network-loss-engine
  namespace: production
spec:
  engineState: active
  appinfo:
    appns: production
    applabel: "app=api-service"
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-network-loss
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "120"
            - name: NETWORK_INTERFACE
              value: "eth0"
            - name: NETWORK_PACKET_LOSS_PERCENTAGE
              value: "50"
            - name: CONTAINER_RUNTIME
              value: "containerd"
            - name: DESTINATION_IPS
              value: "10.0.0.0/8"
```

```yaml
# Good - Disk fill experiment
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: disk-fill-engine
  namespace: production
spec:
  engineState: active
  appinfo:
    appns: production
    applabel: "app=database"
    appkind: statefulset
  chaosServiceAccount: litmus-admin
  experiments:
    - name: disk-fill
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: FILL_PERCENTAGE
              value: "80"
            - name: EPHEMERAL_STORAGE_MEBIBYTES
              value: "500"
            - name: DATA_BLOCK_SIZE
              value: "1024"
```

---

## Chaos Monkey Patterns

### AWS Chaos Monkey Configuration

```bash
#!/bin/bash
# chaos-monkey-setup.sh

# Install Chaos Monkey (Simian Army)
git clone https://github.com/Netflix/chaosmonkey.git
cd chaosmonkey

# Configure Chaos Monkey
cat > chaosmonkey.toml << 'EOF'
[chaosmonkey]
enabled = true
schedule_enabled = true
leashed = false
accounts = ["production"]
start_hour = 9
end_hour = 17
time_zone = "America/New_York"

[chaosmonkey.decryptor]
type = "aws.kms"

[chaosmonkey.outage_checker]
type = "pagerduty"
api_key_decrypt = "encrypted:AQECAHg..."

[chaosmonkey.terminator]
type = "aws.asg"

[chaosmonkey.tracker]
type = "dynamodb"
table_name = "chaosmonkey-state"
EOF

# Start Chaos Monkey
./chaosmonkey migrate
./chaosmonkey schedule
```

```python
# chaos_monkey_controller.py
"""
@module chaos_monkey_controller
@description Chaos Monkey management and safety controls
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-31
@status stable
"""

import boto3
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class ChaosMonkeyController:
    """Controller for Chaos Monkey experiments with safety controls."""

    def __init__(
        self,
        region: str = "us-east-1",
        dry_run: bool = False,
    ) -> None:
        self.ec2 = boto3.client("ec2", region_name=region)
        self.asg = boto3.client("autoscaling", region_name=region)
        self.cloudwatch = boto3.client("cloudwatch", region_name=region)
        self.dry_run = dry_run
        self.protected_tags = ["chaos-protected", "production-critical"]

    def is_safe_to_terminate(self, instance_id: str) -> bool:
        """Check if instance can be safely terminated."""
        response = self.ec2.describe_instances(InstanceIds=[instance_id])
        instance = response["Reservations"][0]["Instances"][0]
        tags = {t["Key"]: t["Value"] for t in instance.get("Tags", [])}

        if any(tag in tags for tag in self.protected_tags):
            logger.warning(f"Instance {instance_id} is protected")
            return False

        if tags.get("chaos-enabled") != "true":
            logger.warning(f"Instance {instance_id} not opted-in")
            return False

        return True

    def check_health_metrics(self, asg_name: str) -> bool:
        """Verify ASG health before chaos injection."""
        response = self.asg.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        asg = response["AutoScalingGroups"][0]

        healthy_count = sum(
            1 for i in asg["Instances"]
            if i["HealthStatus"] == "Healthy"
        )
        min_healthy = asg["MinSize"] + 1

        if healthy_count < min_healthy:
            logger.warning(
                f"ASG {asg_name} has insufficient healthy instances: "
                f"{healthy_count} < {min_healthy}"
            )
            return False

        return True

    def terminate_random_instance(
        self,
        asg_name: str,
        probability: float = 1.0,
    ) -> Optional[str]:
        """Terminate random instance with safety checks."""
        import random

        if random.random() > probability:
            logger.info("Chaos skipped due to probability")
            return None

        if not self.check_health_metrics(asg_name):
            logger.warning("Aborting: health check failed")
            return None

        response = self.asg.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        instances = response["AutoScalingGroups"][0]["Instances"]
        eligible = [
            i for i in instances
            if i["HealthStatus"] == "Healthy"
            and self.is_safe_to_terminate(i["InstanceId"])
        ]

        if not eligible:
            logger.warning("No eligible instances for termination")
            return None

        victim = random.choice(eligible)
        instance_id = victim["InstanceId"]

        if self.dry_run:
            logger.info(f"DRY RUN: Would terminate {instance_id}")
            return instance_id

        self.ec2.terminate_instances(InstanceIds=[instance_id])
        logger.info(f"Terminated instance: {instance_id}")
        return instance_id

    def run_scheduled_chaos(
        self,
        asg_name: str,
        schedule: str = "0 10 * * MON-FRI",
        probability: float = 0.5,
    ) -> None:
        """Run chaos on schedule with business hours check."""
        now = datetime.now()

        if not (9 <= now.hour < 17):
            logger.info("Outside business hours, skipping chaos")
            return

        if now.weekday() >= 5:
            logger.info("Weekend, skipping chaos")
            return

        self.terminate_random_instance(asg_name, probability)
```

### Kubernetes Chaos Monkey

```yaml
# Good - Kube-monkey configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-monkey-config
  namespace: kube-system
data:
  config.toml: |
    [kubemonkey]
    run_hour = 10
    start_hour = 10
    end_hour = 16
    time_zone = "America/New_York"
    blacklisted_namespaces = ["kube-system", "monitoring", "istio-system"]
    whitelisted_namespaces = ["production", "staging"]

    [debug]
    enabled = true
    schedule_immediate_kill = false

    [notifications]
    enabled = true
    endpoint = "https://hooks.slack.com/services/xxx"
```

```yaml
# Good - Deployment with chaos opt-in
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
  namespace: production
  labels:
    app: api-service
    kube-monkey/enabled: "true"
    kube-monkey/identifier: "api-service"
    kube-monkey/mtbf: "2"
    kube-monkey/kill-mode: "fixed"
    kube-monkey/kill-value: "1"
spec:
  replicas: 5
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
        kube-monkey/enabled: "true"
        kube-monkey/identifier: "api-service"
    spec:
      containers:
        - name: api
          image: api-service:latest
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

---

## Experiment Design

### Hypothesis Template

```yaml
# Good - Experiment hypothesis document
apiVersion: v1
kind: ConfigMap
metadata:
  name: chaos-experiment-hypothesis
  namespace: chaos-testing
data:
  experiment.yaml: |
    experiment:
      name: "API Service Pod Failure Resilience"
      id: "EXP-2025-001"
      date: "2025-01-31"
      owner: "platform-team"

    hypothesis:
      steady_state:
        description: "API responds to 99.9% of requests within 500ms"
        metrics:
          - name: "success_rate"
            query: "sum(rate(http_requests_total{status=~'2..'}[5m])) / sum(rate(http_requests_total[5m]))"
            expected: ">= 0.999"
          - name: "p99_latency"
            query: "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))"
            expected: "<= 0.5"

      prediction: |
        When 25% of API pods are terminated, the system will:
        1. Continue serving requests without errors
        2. Maintain p99 latency under 750ms during recovery
        3. Recover to steady state within 60 seconds

    experiment:
      type: "pod-failure"
      target:
        namespace: "production"
        selector: "app=api-service"
      parameters:
        mode: "fixed-percent"
        value: "25"
        duration: "2m"

    safety:
      abort_conditions:
        - "error_rate > 0.05"
        - "p99_latency > 2s"
        - "available_pods < 2"
      rollback_procedure: |
        1. Delete ChaosExperiment CR
        2. Wait for pod recovery
        3. Verify health endpoints
        4. Check dependent services

    observation:
      dashboards:
        - "https://grafana.internal/d/api-service"
      alerts:
        - "APIHighErrorRate"
        - "APIHighLatency"
      logs:
        - "kubectl logs -l app=api-service -n production --since=10m"
```

### Experiment Runbook

```python
# chaos_experiment_runner.py
"""
@module chaos_experiment_runner
@description Automated chaos experiment execution with safety controls
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-31
@status stable
"""

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Callable
import httpx
from prometheus_api_client import PrometheusConnect


class ExperimentState(Enum):
    """Experiment lifecycle states."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    ABORTED = "aborted"
    FAILED = "failed"


@dataclass
class SteadyStateMetric:
    """Definition of a steady state metric."""

    name: str
    query: str
    threshold: float
    comparator: str = ">="


@dataclass
class ExperimentConfig:
    """Chaos experiment configuration."""

    name: str
    hypothesis: str
    duration_seconds: int
    steady_state_metrics: list[SteadyStateMetric]
    abort_threshold_seconds: int = 30
    cooldown_seconds: int = 60


class ChaosExperimentRunner:
    """Execute chaos experiments with safety controls."""

    def __init__(
        self,
        prometheus_url: str,
        slack_webhook: str | None = None,
    ) -> None:
        self.prom = PrometheusConnect(url=prometheus_url)
        self.slack_webhook = slack_webhook
        self.state = ExperimentState.PENDING

    async def check_steady_state(
        self,
        metrics: list[SteadyStateMetric],
    ) -> tuple[bool, dict]:
        """Verify all steady state metrics are within thresholds."""
        results = {}
        all_pass = True

        for metric in metrics:
            result = self.prom.custom_query(metric.query)
            if not result:
                results[metric.name] = {"value": None, "pass": False}
                all_pass = False
                continue

            value = float(result[0]["value"][1])
            passes = self._evaluate_threshold(
                value,
                metric.threshold,
                metric.comparator,
            )
            results[metric.name] = {"value": value, "pass": passes}
            if not passes:
                all_pass = False

        return all_pass, results

    def _evaluate_threshold(
        self,
        value: float,
        threshold: float,
        comparator: str,
    ) -> bool:
        """Evaluate value against threshold."""
        ops = {
            ">=": lambda v, t: v >= t,
            "<=": lambda v, t: v <= t,
            ">": lambda v, t: v > t,
            "<": lambda v, t: v < t,
            "==": lambda v, t: v == t,
        }
        return ops.get(comparator, lambda v, t: False)(value, threshold)

    async def run_experiment(
        self,
        config: ExperimentConfig,
        inject_chaos: Callable[[], None],
        stop_chaos: Callable[[], None],
    ) -> dict:
        """Execute chaos experiment with full lifecycle."""
        start_time = datetime.now()
        experiment_log = {
            "name": config.name,
            "start_time": start_time.isoformat(),
            "hypothesis": config.hypothesis,
            "events": [],
        }

        try:
            self.state = ExperimentState.PENDING
            await self._notify(f"Starting experiment: {config.name}")

            passes, results = await self.check_steady_state(
                config.steady_state_metrics
            )
            experiment_log["pre_steady_state"] = results

            if not passes:
                experiment_log["events"].append({
                    "time": datetime.now().isoformat(),
                    "event": "abort",
                    "reason": "Pre-experiment steady state check failed",
                })
                self.state = ExperimentState.ABORTED
                return experiment_log

            self.state = ExperimentState.RUNNING
            inject_chaos()
            experiment_log["events"].append({
                "time": datetime.now().isoformat(),
                "event": "chaos_injected",
            })

            abort_start = None
            for _ in range(config.duration_seconds):
                await asyncio.sleep(1)

                passes, results = await self.check_steady_state(
                    config.steady_state_metrics
                )
                experiment_log["events"].append({
                    "time": datetime.now().isoformat(),
                    "event": "metric_check",
                    "results": results,
                })

                if not passes:
                    if abort_start is None:
                        abort_start = datetime.now()
                    elif (datetime.now() - abort_start).seconds > config.abort_threshold_seconds:
                        stop_chaos()
                        experiment_log["events"].append({
                            "time": datetime.now().isoformat(),
                            "event": "abort",
                            "reason": "Steady state violation exceeded threshold",
                        })
                        self.state = ExperimentState.ABORTED
                        return experiment_log
                else:
                    abort_start = None

            stop_chaos()
            experiment_log["events"].append({
                "time": datetime.now().isoformat(),
                "event": "chaos_stopped",
            })

            await asyncio.sleep(config.cooldown_seconds)
            passes, results = await self.check_steady_state(
                config.steady_state_metrics
            )
            experiment_log["post_steady_state"] = results

            self.state = (
                ExperimentState.COMPLETED
                if passes
                else ExperimentState.FAILED
            )

        except Exception as e:
            stop_chaos()
            experiment_log["events"].append({
                "time": datetime.now().isoformat(),
                "event": "error",
                "error": str(e),
            })
            self.state = ExperimentState.FAILED

        experiment_log["end_time"] = datetime.now().isoformat()
        experiment_log["state"] = self.state.value
        await self._notify(
            f"Experiment {config.name} completed: {self.state.value}"
        )

        return experiment_log

    async def _notify(self, message: str) -> None:
        """Send notification to Slack."""
        if not self.slack_webhook:
            return

        async with httpx.AsyncClient() as client:
            await client.post(
                self.slack_webhook,
                json={"text": message},
            )
```

---

## Safety and Blast Radius

### Blast Radius Controls

```yaml
# Good - Namespace isolation for chaos
apiVersion: v1
kind: Namespace
metadata:
  name: chaos-sandbox
  labels:
    chaos-mesh.org/inject: enabled
    environment: sandbox
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: chaos-isolation
  namespace: chaos-sandbox
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              chaos-mesh.org/inject: enabled
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              chaos-mesh.org/inject: enabled
```

```yaml
# Good - RBAC for chaos experiments
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: chaos-experimenter
  namespace: production
rules:
  - apiGroups: ["chaos-mesh.org"]
    resources: ["podchaos", "networkchaos"]
    verbs: ["create", "delete", "get", "list"]
    resourceNames: []
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: chaos-experimenter-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: chaos-runner
    namespace: chaos-testing
roleRef:
  kind: Role
  name: chaos-experimenter
  apiGroup: rbac.authorization.k8s.io
```

### Emergency Stop Mechanism

```yaml
# Good - Emergency stop ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: chaos-circuit-breaker
  namespace: chaos-testing
data:
  enabled: "true"
  emergency_stop: "false"
  max_concurrent_experiments: "3"
  excluded_namespaces: |
    kube-system
    monitoring
    istio-system
    cert-manager
```

```python
# circuit_breaker.py
"""
@module circuit_breaker
@description Chaos experiment circuit breaker with emergency stop
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-31
@status stable
"""

from kubernetes import client, config
from typing import NamedTuple
import logging

logger = logging.getLogger(__name__)


class CircuitState(NamedTuple):
    """Circuit breaker state."""

    enabled: bool
    emergency_stop: bool
    max_concurrent: int
    excluded_namespaces: list[str]


class ChaosCircuitBreaker:
    """Circuit breaker for chaos experiments."""

    def __init__(self, namespace: str = "chaos-testing") -> None:
        config.load_incluster_config()
        self.v1 = client.CoreV1Api()
        self.namespace = namespace
        self.config_name = "chaos-circuit-breaker"

    def get_state(self) -> CircuitState:
        """Get current circuit breaker state."""
        cm = self.v1.read_namespaced_config_map(
            name=self.config_name,
            namespace=self.namespace,
        )
        return CircuitState(
            enabled=cm.data.get("enabled", "true").lower() == "true",
            emergency_stop=cm.data.get("emergency_stop", "false").lower() == "true",
            max_concurrent=int(cm.data.get("max_concurrent_experiments", "3")),
            excluded_namespaces=cm.data.get("excluded_namespaces", "").strip().split("\n"),
        )

    def is_experiment_allowed(
        self,
        target_namespace: str,
        current_experiments: int,
    ) -> tuple[bool, str]:
        """Check if experiment is allowed to run."""
        state = self.get_state()

        if not state.enabled:
            return False, "Chaos experiments are disabled"

        if state.emergency_stop:
            return False, "Emergency stop is active"

        if target_namespace in state.excluded_namespaces:
            return False, f"Namespace {target_namespace} is excluded"

        if current_experiments >= state.max_concurrent:
            return False, f"Max concurrent experiments ({state.max_concurrent}) reached"

        return True, "Experiment allowed"

    def trigger_emergency_stop(self, reason: str) -> None:
        """Trigger emergency stop for all experiments."""
        logger.critical(f"EMERGENCY STOP triggered: {reason}")

        cm = self.v1.read_namespaced_config_map(
            name=self.config_name,
            namespace=self.namespace,
        )
        cm.data["emergency_stop"] = "true"
        cm.data["emergency_stop_reason"] = reason

        self.v1.patch_namespaced_config_map(
            name=self.config_name,
            namespace=self.namespace,
            body=cm,
        )

        self._cleanup_all_experiments()

    def _cleanup_all_experiments(self) -> None:
        """Delete all running chaos experiments."""
        custom_api = client.CustomObjectsApi()

        chaos_types = [
            ("chaos-mesh.org", "v1alpha1", "podchaos"),
            ("chaos-mesh.org", "v1alpha1", "networkchaos"),
            ("chaos-mesh.org", "v1alpha1", "stresschaos"),
            ("chaos-mesh.org", "v1alpha1", "iochaos"),
        ]

        for group, version, plural in chaos_types:
            try:
                experiments = custom_api.list_cluster_custom_object(
                    group=group,
                    version=version,
                    plural=plural,
                )
                for exp in experiments.get("items", []):
                    custom_api.delete_namespaced_custom_object(
                        group=group,
                        version=version,
                        namespace=exp["metadata"]["namespace"],
                        plural=plural,
                        name=exp["metadata"]["name"],
                    )
                    logger.info(
                        f"Deleted {plural}/{exp['metadata']['name']} "
                        f"in {exp['metadata']['namespace']}"
                    )
            except client.ApiException as e:
                logger.error(f"Failed to cleanup {plural}: {e}")

    def reset_emergency_stop(self) -> None:
        """Reset emergency stop flag."""
        cm = self.v1.read_namespaced_config_map(
            name=self.config_name,
            namespace=self.namespace,
        )
        cm.data["emergency_stop"] = "false"
        cm.data.pop("emergency_stop_reason", None)

        self.v1.patch_namespaced_config_map(
            name=self.config_name,
            namespace=self.namespace,
            body=cm,
        )
        logger.info("Emergency stop has been reset")
```

---

## Synthetic Monitoring Overview

### Monitoring Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                  Synthetic Monitoring Stack                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   API       │    │  BROWSER    │    │   SSL/DNS   │        │
│   │   CHECKS    │    │   TESTS     │    │   MONITORS  │        │
│   │             │    │             │    │             │         │
│   │  HTTP/HTTPS │    │  User       │    │  Certificate│        │
│   │  endpoints  │    │  journeys   │    │  expiry     │        │
│   │  health     │    │  flows      │    │  DNS health │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                 │
│          └──────────────────┼──────────────────┘                │
│                             │                                    │
│                      ┌──────▼──────┐                            │
│                      │   ALERTING  │                            │
│                      │   & SLOs    │                            │
│                      └─────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Datadog Synthetics

### API Tests

```yaml
# Good - Datadog API synthetic test
apiVersion: datadoghq.com/v1alpha1
kind: DatadogSynthetic
metadata:
  name: api-health-check
  namespace: monitoring
spec:
  name: "API Health Check"
  type: api
  subtype: http
  status: live
  message: "API health check failed - {{#is_alert}}ALERT{{/is_alert}}"
  tags:
    - "env:production"
    - "team:platform"
    - "service:api"
  request:
    method: GET
    url: "https://api.example.com/health"
    timeout: 30
    headers:
      Accept: "application/json"
      X-Request-ID: "synthetic-{{$randomUUID}}"
  assertions:
    - type: statusCode
      operator: is
      target: 200
    - type: responseTime
      operator: lessThan
      target: 500
    - type: header
      property: content-type
      operator: contains
      target: "application/json"
    - type: body
      operator: validatesJSONPath
      target: "$.status"
      targetValue: "healthy"
  locations:
    - aws:us-east-1
    - aws:us-west-2
    - aws:eu-west-1
    - aws:ap-northeast-1
  options:
    tick_every: 60
    min_failure_duration: 120
    min_location_failed: 2
    retry:
      count: 2
      interval: 500
    monitor_options:
      renotify_interval: 120
      escalation_message: "API still failing after 2 hours"
      include_tags: true
```

```yaml
# Good - Multi-step API test
apiVersion: datadoghq.com/v1alpha1
kind: DatadogSynthetic
metadata:
  name: api-auth-flow
  namespace: monitoring
spec:
  name: "API Authentication Flow"
  type: api
  subtype: multi
  status: live
  steps:
    - name: "Login"
      subtype: http
      request:
        method: POST
        url: "https://api.example.com/auth/login"
        body: |
          {
            "email": "synthetic@example.com",
            "password": "{{SYNTHETIC_PASSWORD}}"
          }
        headers:
          Content-Type: "application/json"
      assertions:
        - type: statusCode
          operator: is
          target: 200
        - type: body
          operator: validatesJSONPath
          target: "$.token"
      extractedValues:
        - name: AUTH_TOKEN
          type: http_body
          field: "$.token"

    - name: "Get User Profile"
      subtype: http
      request:
        method: GET
        url: "https://api.example.com/users/me"
        headers:
          Authorization: "Bearer {{AUTH_TOKEN}}"
      assertions:
        - type: statusCode
          operator: is
          target: 200
        - type: body
          operator: validatesJSONPath
          target: "$.email"
          targetValue: "synthetic@example.com"

    - name: "Logout"
      subtype: http
      request:
        method: POST
        url: "https://api.example.com/auth/logout"
        headers:
          Authorization: "Bearer {{AUTH_TOKEN}}"
      assertions:
        - type: statusCode
          operator: is
          target: 204
  locations:
    - aws:us-east-1
    - aws:eu-west-1
  options:
    tick_every: 300
```

### Browser Tests

```javascript
// Good - Datadog browser test
const { synthetics } = require("@datadog/datadog-ci");

module.exports = {
  name: "User Login Journey",
  type: "browser",
  status: "live",
  message: "Login flow failed - investigate immediately",
  tags: ["env:production", "team:frontend", "journey:login"],

  locations: ["aws:us-east-1", "aws:eu-west-1", "aws:ap-southeast-1"],

  options: {
    tick_every: 300,
    min_failure_duration: 180,
    min_location_failed: 2,
    device_ids: ["chrome.laptop_large", "firefox.laptop_large"],
    retry: {
      count: 1,
      interval: 1000,
    },
    ci: {
      executionRule: "blocking",
    },
  },

  steps: [
    {
      name: "Navigate to login page",
      type: "goToUrl",
      params: {
        url: "https://app.example.com/login",
      },
      assertions: [
        {
          type: "currentUrl",
          operator: "contains",
          target: "/login",
        },
      ],
    },
    {
      name: "Enter email",
      type: "typeText",
      params: {
        element: '[data-testid="email-input"]',
        value: "synthetic@example.com",
      },
    },
    {
      name: "Enter password",
      type: "typeText",
      params: {
        element: '[data-testid="password-input"]',
        value: "{{ SYNTHETIC_PASSWORD }}",
      },
    },
    {
      name: "Click login button",
      type: "click",
      params: {
        element: '[data-testid="login-button"]',
      },
    },
    {
      name: "Wait for dashboard",
      type: "waitForElement",
      params: {
        element: '[data-testid="dashboard"]',
        timeout: 10000,
      },
    },
    {
      name: "Verify user is logged in",
      type: "assertElementContent",
      params: {
        element: '[data-testid="user-email"]',
        value: "synthetic@example.com",
      },
    },
    {
      name: "Check page performance",
      type: "customJavascript",
      params: {
        code: `
          const timing = performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          if (loadTime > 3000) {
            throw new Error('Page load time exceeded 3s: ' + loadTime + 'ms');
          }
          return loadTime;
        `,
      },
    },
  ],
};
```

### SSL and DNS Monitoring

```yaml
# Good - SSL certificate monitoring
apiVersion: datadoghq.com/v1alpha1
kind: DatadogSynthetic
metadata:
  name: ssl-certificate-monitor
  namespace: monitoring
spec:
  name: "SSL Certificate Monitor - api.example.com"
  type: api
  subtype: ssl
  status: live
  message: |
    SSL certificate issue detected for api.example.com
    {{#is_alert}}Certificate expires in less than 30 days{{/is_alert}}
    {{#is_warning}}Certificate expires in less than 60 days{{/is_warning}}
  tags:
    - "env:production"
    - "monitor:ssl"
  request:
    host: api.example.com
    port: 443
  assertions:
    - type: certificate
      operator: isInMoreThan
      target: 30
  locations:
    - aws:us-east-1
    - aws:eu-west-1
  options:
    tick_every: 3600
    accept_self_signed: false
---
# Good - DNS monitoring
apiVersion: datadoghq.com/v1alpha1
kind: DatadogSynthetic
metadata:
  name: dns-resolution-monitor
  namespace: monitoring
spec:
  name: "DNS Resolution Monitor - api.example.com"
  type: api
  subtype: dns
  status: live
  message: "DNS resolution failed for api.example.com"
  tags:
    - "env:production"
    - "monitor:dns"
  request:
    host: api.example.com
    dnsServer: 8.8.8.8
    dnsServerPort: 53
  assertions:
    - type: recordSome
      operator: is
      property: A
      target: "10.0.1.100"
    - type: responseTime
      operator: lessThan
      target: 100
  locations:
    - aws:us-east-1
    - aws:us-west-2
    - aws:eu-west-1
  options:
    tick_every: 300
```

---

## Checkly

### API Checks

```javascript
// Good - Checkly API check with assertions
const { ApiCheck, AssertionBuilder } = require("checkly/constructs");

new ApiCheck("api-health-check", {
  name: "API Health Check",
  activated: true,
  frequency: 5,
  frequencyOffset: 1,
  degradedResponseTime: 3000,
  maxResponseTime: 10000,

  locations: ["us-east-1", "eu-west-1", "ap-northeast-1"],

  tags: ["api", "production", "critical"],

  request: {
    method: "GET",
    url: "https://api.example.com/health",
    headers: [
      {
        key: "Accept",
        value: "application/json",
      },
      {
        key: "X-Request-Source",
        value: "checkly-synthetic",
      },
    ],
    followRedirects: true,
    skipSSL: false,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(500),
      AssertionBuilder.jsonBody("$.status").equals("healthy"),
      AssertionBuilder.jsonBody("$.version").isNotEmpty(),
      AssertionBuilder.header("content-type").contains("application/json"),
    ],
  },

  alertChannels: [
    {
      type: "SLACK",
      config: {
        url: process.env.SLACK_WEBHOOK_URL,
        channel: "#alerts-production",
      },
    },
    {
      type: "PAGERDUTY",
      config: {
        serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
        severity: "critical",
      },
    },
  ],

  doubleCheck: true,
  shouldFail: false,
  useGlobalAlertSettings: false,
  alertSettings: {
    escalationType: "RUN_BASED",
    runBasedEscalation: {
      failedRunThreshold: 2,
    },
    parallelRunFailureThreshold: {
      enabled: true,
      percentage: 50,
    },
    reminders: {
      amount: 3,
      interval: 10,
    },
    sslCertificates: {
      enabled: true,
      alertThreshold: 30,
    },
  },
});
```

```javascript
// Good - Multi-step API check
const { ApiCheck, AssertionBuilder } = require("checkly/constructs");

new ApiCheck("api-order-flow", {
  name: "Order Creation Flow",
  activated: true,
  frequency: 15,
  locations: ["us-east-1", "eu-west-1"],

  request: {
    method: "POST",
    url: "https://api.example.com/orders",
    headers: [
      {
        key: "Content-Type",
        value: "application/json",
      },
      {
        key: "Authorization",
        value: "Bearer {{CHECKLY_API_TOKEN}}",
      },
    ],
    body: JSON.stringify({
      items: [
        {
          sku: "TEST-001",
          quantity: 1,
        },
      ],
      customer_id: "synthetic-customer",
    }),
    assertions: [
      AssertionBuilder.statusCode().equals(201),
      AssertionBuilder.jsonBody("$.order_id").isNotEmpty(),
      AssertionBuilder.jsonBody("$.status").equals("pending"),
    ],
  },

  setupScript: `
    const crypto = require('crypto');
    request.headers['X-Idempotency-Key'] = crypto.randomUUID();
    request.headers['X-Request-ID'] = 'checkly-' + Date.now();
  `,

  teardownScript: `
    // Clean up test order
    const orderId = response.body.order_id;
    if (orderId) {
      await fetch('https://api.example.com/orders/' + orderId, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + process.env.CHECKLY_API_TOKEN
        }
      });
    }
  `,
});
```

### Browser Checks

```javascript
// Good - Checkly browser check with Playwright
const { BrowserCheck } = require("checkly/constructs");
const { test, expect } = require("@playwright/test");

new BrowserCheck("checkout-flow", {
  name: "E-commerce Checkout Flow",
  activated: true,
  frequency: 30,
  locations: ["us-east-1", "eu-west-1"],

  tags: ["e2e", "checkout", "critical"],

  code: {
    entrypoint: "./checks/checkout-flow.spec.ts",
  },

  alertChannels: [
    {
      type: "SLACK",
      config: {
        url: process.env.SLACK_WEBHOOK_URL,
      },
    },
  ],
});

// checks/checkout-flow.spec.ts
test("complete checkout flow", async ({ page }) => {
  await page.goto("https://shop.example.com");

  await page.click('[data-testid="product-card"]:first-child');
  await expect(page.locator('[data-testid="product-title"]')).toBeVisible();

  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText("1");

  await page.click('[data-testid="cart-icon"]');
  await page.click('[data-testid="checkout-button"]');

  await page.fill('[data-testid="email"]', "synthetic@example.com");
  await page.fill('[data-testid="card-number"]', "4242424242424242");
  await page.fill('[data-testid="card-expiry"]', "12/30");
  await page.fill('[data-testid="card-cvc"]', "123");

  await page.click('[data-testid="place-order"]');

  await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible({
    timeout: 30000,
  });

  const orderId = await page
    .locator('[data-testid="order-id"]')
    .textContent();
  console.log(`Order created: ${orderId}`);
});
```

### Checkly CLI Configuration

```javascript
// checkly.config.js
const { defineConfig } = require("checkly");

module.exports = defineConfig({
  projectName: "Production Monitoring",
  logicalId: "production-monitoring",
  repoUrl: "https://github.com/example/app",

  checks: {
    activated: true,
    muted: false,
    runtimeId: "2024.02",
    frequency: 5,
    locations: ["us-east-1", "eu-west-1"],

    tags: ["production"],

    checkMatch: "**/__checks__/**/*.check.{js,ts}",
    browserChecks: {
      testMatch: "**/__checks__/**/*.spec.{js,ts}",
    },
  },

  cli: {
    runLocation: "us-east-1",
    privateRunLocation: "private-dc-1",
  },
});
```

```yaml
# Good - Checkly as Code with GitHub Actions
name: Checkly Monitoring

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run Checkly tests
        uses: checkly/checkly-action@v1
        with:
          apiKey: ${{ secrets.CHECKLY_API_KEY }}
          accountId: ${{ secrets.CHECKLY_ACCOUNT_ID }}

      - name: Deploy checks
        if: github.ref == 'refs/heads/main'
        run: npx checkly deploy --force
        env:
          CHECKLY_API_KEY: ${{ secrets.CHECKLY_API_KEY }}
          CHECKLY_ACCOUNT_ID: ${{ secrets.CHECKLY_ACCOUNT_ID }}
```

---

## Uptime and SLO Standards

### SLO Definitions

```yaml
# Good - SLO configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: service-slos
  namespace: monitoring
data:
  slos.yaml: |
    services:
      api-service:
        availability:
          target: 99.9
          window: 30d
          burn_rate_alerts:
            - severity: critical
              long_window: 1h
              short_window: 5m
              burn_rate: 14.4
            - severity: warning
              long_window: 6h
              short_window: 30m
              burn_rate: 6

        latency:
          target: 99.0
          threshold_ms: 500
          window: 30d

        error_rate:
          target: 99.5
          window: 30d

      payment-service:
        availability:
          target: 99.99
          window: 30d
          burn_rate_alerts:
            - severity: critical
              long_window: 1h
              short_window: 5m
              burn_rate: 14.4

        latency:
          target: 99.5
          threshold_ms: 200
          window: 30d
```

```yaml
# Good - Prometheus SLO recording rules
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: slo-recording-rules
  namespace: monitoring
spec:
  groups:
    - name: slo.rules
      interval: 30s
      rules:
        - record: slo:api_availability:ratio
          expr: |
            sum(rate(http_requests_total{status!~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))

        - record: slo:api_latency:ratio
          expr: |
            sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
            /
            sum(rate(http_request_duration_seconds_count[5m]))

        - record: slo:error_budget:remaining
          expr: |
            1 - (
              (1 - slo:api_availability:ratio)
              /
              (1 - 0.999)
            )

    - name: slo.alerts
      rules:
        - alert: SLOBurnRateCritical
          expr: |
            (
              slo:api_availability:ratio < 0.999
              and
              (1 - slo:api_availability:ratio) / (1 - 0.999) > 14.4
            )
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Critical SLO burn rate for API service"
            description: "Error budget is being consumed 14.4x faster than sustainable"

        - alert: ErrorBudgetExhausted
          expr: slo:error_budget:remaining < 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Error budget exhausted for API service"
            description: "Monthly error budget has been fully consumed"
```

### Multi-Region Check Strategy

```yaml
# Good - Multi-region synthetic check configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: synthetic-check-strategy
  namespace: monitoring
data:
  strategy.yaml: |
    global_checks:
      frequency_seconds: 60
      locations:
        primary:
          - us-east-1
          - eu-west-1
          - ap-northeast-1
        secondary:
          - us-west-2
          - eu-central-1
          - ap-southeast-1

      failure_policy:
        min_locations_failed: 2
        consecutive_failures: 3
        alert_delay_seconds: 120

    regional_checks:
      us:
        endpoints:
          - https://api-us.example.com/health
        locations:
          - us-east-1
          - us-west-2
        slo_target: 99.95

      eu:
        endpoints:
          - https://api-eu.example.com/health
        locations:
          - eu-west-1
          - eu-central-1
        slo_target: 99.9

      apac:
        endpoints:
          - https://api-apac.example.com/health
        locations:
          - ap-northeast-1
          - ap-southeast-1
        slo_target: 99.9
```

---

## CI/CD Integration

### Chaos in CI/CD Pipeline

```yaml
# Good - GitHub Actions chaos testing
name: Chaos Testing Pipeline

on:
  schedule:
    - cron: "0 10 * * 1-5"
  workflow_dispatch:
    inputs:
      experiment_type:
        description: "Type of chaos experiment"
        required: true
        default: "pod-failure"
        type: choice
        options:
          - pod-failure
          - network-delay
          - cpu-stress
          - memory-stress

jobs:
  chaos-test:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG }}

      - name: Verify steady state
        run: |
          echo "Checking pre-experiment steady state..."

          # Check application health
          health=$(kubectl exec -n staging deploy/api-service -- \
            curl -s localhost:8080/health | jq -r '.status')
          if [ "$health" != "healthy" ]; then
            echo "Pre-experiment health check failed"
            exit 1
          fi

          # Check error rate
          error_rate=$(curl -s "http://prometheus:9090/api/v1/query" \
            --data-urlencode 'query=sum(rate(http_requests_total{status=~"5.."}[5m]))/sum(rate(http_requests_total[5m]))' \
            | jq -r '.data.result[0].value[1]')
          if (( $(echo "$error_rate > 0.01" | bc -l) )); then
            echo "Pre-experiment error rate too high: $error_rate"
            exit 1
          fi

      - name: Apply chaos experiment
        run: |
          cat << EOF | kubectl apply -f -
          apiVersion: chaos-mesh.org/v1alpha1
          kind: PodChaos
          metadata:
            name: ci-chaos-${{ github.run_id }}
            namespace: chaos-testing
          spec:
            action: ${{ inputs.experiment_type || 'pod-failure' }}
            mode: one
            duration: '60s'
            selector:
              namespaces:
                - staging
              labelSelectors:
                app: api-service
          EOF

      - name: Monitor experiment
        run: |
          echo "Monitoring chaos experiment for 90 seconds..."
          for i in $(seq 1 18); do
            sleep 5

            # Check if experiment is still running
            status=$(kubectl get podchaos ci-chaos-${{ github.run_id }} \
              -n chaos-testing -o jsonpath='{.status.experiment.phase}')
            echo "Experiment phase: $status"

            # Check application availability
            available=$(kubectl get deploy api-service -n staging \
              -o jsonpath='{.status.availableReplicas}')
            echo "Available replicas: $available"

            if [ "$available" -lt 1 ]; then
              echo "WARNING: No available replicas"
            fi
          done

      - name: Cleanup experiment
        if: always()
        run: |
          kubectl delete podchaos ci-chaos-${{ github.run_id }} \
            -n chaos-testing --ignore-not-found

      - name: Verify recovery
        run: |
          echo "Waiting 30 seconds for recovery..."
          sleep 30

          # Verify steady state restored
          health=$(kubectl exec -n staging deploy/api-service -- \
            curl -s localhost:8080/health | jq -r '.status')
          if [ "$health" != "healthy" ]; then
            echo "Post-experiment health check failed"
            exit 1
          fi

          echo "System recovered successfully"

      - name: Upload experiment results
        uses: actions/upload-artifact@v4
        with:
          name: chaos-experiment-results
          path: results/
```

### Synthetic Tests in CI/CD

```yaml
# Good - Checkly deployment verification
name: Deploy with Synthetic Verification

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          kubectl apply -f k8s/
          kubectl rollout status deployment/api-service -n production

      - name: Wait for deployment stabilization
        run: sleep 60

      - name: Run Checkly synthetic tests
        uses: checkly/checkly-action@v1
        id: checkly
        with:
          apiKey: ${{ secrets.CHECKLY_API_KEY }}
          accountId: ${{ secrets.CHECKLY_ACCOUNT_ID }}
          filterTags: "deployment-verification"

      - name: Rollback on failure
        if: failure() && steps.checkly.outcome == 'failure'
        run: |
          echo "Synthetic tests failed, rolling back..."
          kubectl rollout undo deployment/api-service -n production
          kubectl rollout status deployment/api-service -n production

      - name: Notify on success
        if: success()
        run: |
          curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
            -H 'Content-Type: application/json' \
            -d '{"text": "Deployment verified successfully with synthetic tests"}'
```

---

## Best Practices

### Chaos Engineering Checklist

```yaml
# Good - Pre-experiment checklist
apiVersion: v1
kind: ConfigMap
metadata:
  name: chaos-experiment-checklist
  namespace: chaos-testing
data:
  checklist.md: |
    # Chaos Experiment Checklist

    ## Pre-Experiment
    - [ ] Hypothesis documented and reviewed
    - [ ] Steady state metrics defined
    - [ ] Blast radius limited and understood
    - [ ] Rollback procedure tested
    - [ ] Stakeholders notified
    - [ ] Observability dashboards ready
    - [ ] On-call engineer aware
    - [ ] Circuit breaker enabled

    ## During Experiment
    - [ ] Steady state being monitored
    - [ ] Abort conditions being checked
    - [ ] Impact being documented
    - [ ] Duration limit enforced

    ## Post-Experiment
    - [ ] Chaos stopped cleanly
    - [ ] System recovered to steady state
    - [ ] Results documented
    - [ ] Findings shared with team
    - [ ] Improvements identified
    - [ ] Follow-up actions created
```

### Synthetic Monitoring Checklist

```yaml
# Good - Synthetic monitoring standards
apiVersion: v1
kind: ConfigMap
metadata:
  name: synthetic-monitoring-standards
  namespace: monitoring
data:
  standards.md: |
    # Synthetic Monitoring Standards

    ## Check Frequency
    | Check Type        | Minimum Frequency | Recommended |
    |-------------------|-------------------|-------------|
    | Health/Heartbeat  | 1 minute          | 30 seconds  |
    | API Endpoints     | 5 minutes         | 1 minute    |
    | Browser Tests     | 15 minutes        | 5 minutes   |
    | SSL Certificates  | 1 hour            | 15 minutes  |
    | DNS Resolution    | 5 minutes         | 1 minute    |

    ## Location Requirements
    - Minimum 3 geographic locations
    - At least 2 locations per major region
    - Include locations closest to user base

    ## Alert Thresholds
    - Single location failure: Warning
    - 2+ location failures: Alert
    - 3+ consecutive failures: Page on-call

    ## Response Time Standards
    - API health checks: < 500ms
    - Page load time: < 3s
    - First contentful paint: < 1.5s
    - Time to interactive: < 5s

    ## SLO Requirements
    - Availability: 99.9% (43.8 min/month downtime)
    - Latency p99: < 500ms
    - Error rate: < 0.1%
```

### Observability During Chaos

```yaml
# Good - Chaos observability dashboard
apiVersion: v1
kind: ConfigMap
metadata:
  name: chaos-grafana-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  chaos-dashboard.json: |
    {
      "dashboard": {
        "title": "Chaos Engineering Dashboard",
        "panels": [
          {
            "title": "Active Chaos Experiments",
            "type": "stat",
            "targets": [
              {
                "expr": "count(chaos_mesh_experiments{phase='Running'})"
              }
            ]
          },
          {
            "title": "Error Rate During Chaos",
            "type": "graph",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{status=~'5..'}[1m])) / sum(rate(http_requests_total[1m]))",
                "legendFormat": "Error Rate"
              }
            ],
            "alert": {
              "conditions": [
                {
                  "evaluator": { "type": "gt", "params": [0.05] }
                }
              ]
            }
          },
          {
            "title": "P99 Latency During Chaos",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))",
                "legendFormat": "P99 Latency"
              }
            ]
          },
          {
            "title": "Pod Availability",
            "type": "graph",
            "targets": [
              {
                "expr": "sum(kube_deployment_status_replicas_available) by (deployment)",
                "legendFormat": "{{ deployment }}"
              }
            ]
          },
          {
            "title": "Experiment Timeline",
            "type": "annotations",
            "targets": [
              {
                "expr": "changes(chaos_mesh_experiments{phase='Running'}[1m])",
                "legendFormat": "Chaos Events"
              }
            ]
          }
        ]
      }
    }
```

---

## Quick Reference

### Chaos Mesh Commands

```bash
# Install Chaos Mesh
helm install chaos-mesh chaos-mesh/chaos-mesh -n chaos-mesh

# Apply experiment
kubectl apply -f pod-chaos.yaml

# Check experiment status
kubectl get podchaos -A

# Delete experiment (emergency stop)
kubectl delete podchaos --all -A

# View Chaos Mesh dashboard
kubectl port-forward -n chaos-mesh svc/chaos-dashboard 2333:2333
```

### Litmus Commands

```bash
# Install Litmus
helm install chaos litmuschaos/litmus -n litmus

# Apply chaos engine
kubectl apply -f chaos-engine.yaml

# Check experiment status
kubectl get chaosengine -A
kubectl get chaosresult -A

# Delete all experiments
kubectl delete chaosengine --all -A
```

### Checkly CLI Commands

```bash
# Install Checkly CLI
npm install -g checkly

# Login
npx checkly login

# Test checks locally
npx checkly test

# Deploy checks
npx checkly deploy

# Trigger check run
npx checkly trigger --check api-health-check
```

### Datadog CLI Commands

```bash
# Install Datadog CI
npm install -g @datadog/datadog-ci

# Run synthetic tests
datadog-ci synthetics run-tests --search 'tag:production'

# Upload test results
datadog-ci synthetics upload-application --app-key $DD_APP_KEY

# Trigger specific test
datadog-ci synthetics trigger-ci --public-id abc-123-xyz
```
