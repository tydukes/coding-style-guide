---
title: "Language Interoperability Guide"
description: "Cross-language integration patterns, data exchange formats, and multi-language project structures for DevOps and full-stack applications"
author: "Tyler Dukes"
tags: [interoperability, cross-language, integration, multi-language, data-exchange, devops]
category: "Language Guides"
status: "active"
---

<!--
@module interoperability
@description Cross-language integration patterns, data exchange, and multi-language project structures
@version 1.0.0
@author Tyler Dukes
@last_updated 2026-02-14
@status stable
-->

<!-- markdownlint-disable MD013 -->

## Overview

Real-world projects rarely use a single language. Infrastructure teams combine Terraform with Python orchestration, full-stack applications pair TypeScript frontends with Python backends, and deployment pipelines weave together Bash, Docker, Ansible, and CI/CD systems. This guide covers common integration patterns, data exchange strategies, and project structures for multi-language workflows.

### Quick Navigation

- [Common Integration Patterns](#common-integration-patterns)
- [Data Exchange Formats](#data-exchange-formats)
- [Cross-Language Project Structures](#cross-language-project-structures)
- [CI/CD Integration Patterns](#cicd-integration-patterns)
- [Common Integration Challenges](#common-integration-challenges)
- [API Contract Patterns](#api-contract-patterns)
- [Database Integration Patterns](#database-integration-patterns)
- [Observability Across Languages](#observability-across-languages)

---

## Common Integration Patterns

### Python + Terraform

**Use Case**: Infrastructure provisioning with Python orchestration.

```python
import subprocess
import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def run_terraform(args: list[str], cwd: str = ".") -> subprocess.CompletedProcess:
    """Execute a Terraform command with standard error handling."""
    cmd = ["terraform", *args]
    logger.info("Running: %s", " ".join(cmd))

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=cwd,
        check=False,
    )

    if result.returncode != 0:
        logger.error("Terraform stderr: %s", result.stderr)
        raise RuntimeError(f"Terraform failed: {result.stderr}")

    return result


def deploy_infrastructure(env: str, var_dir: str = "environments") -> dict[str, Any]:
    """Deploy infrastructure using Terraform for a given environment."""
    var_file = Path(var_dir) / f"{env}.tfvars"
    if not var_file.exists():
        raise FileNotFoundError(f"Variable file not found: {var_file}")

    # Initialize Terraform
    run_terraform(["init", "-input=false"])

    # Plan and apply
    run_terraform([
        "apply",
        "-auto-approve",
        "-input=false",
        f"-var-file={var_file}",
        f"-var=environment={env}",
    ])

    # Retrieve outputs as structured data
    result = run_terraform(["output", "-json"])
    return json.loads(result.stdout)


# Use Terraform outputs in Python
outputs = deploy_infrastructure("production")
vpc_id = outputs["vpc_id"]["value"]
subnet_ids = outputs["subnet_ids"]["value"]
logger.info("VPC created: %s with %d subnets", vpc_id, len(subnet_ids))
```

```hcl
# Terraform outputs designed for Python consumption
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID for application deployment"
}

output "subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "database_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS endpoint for application connection string"
  sensitive   = true
}

output "deployment_metadata" {
  value = {
    environment  = var.environment
    region       = var.aws_region
    deployed_at  = timestamp()
    module_version = var.module_version
  }
  description = "Structured metadata for downstream consumers"
}
```

### Bash + Docker

**Use Case**: Build and deployment scripts wrapping Docker operations.

```bash
#!/bin/bash
# Deploy application with Docker
# Usage: ./deploy.sh [build|test|push|all]

set -euo pipefail

readonly IMAGE_NAME="myapp"
readonly IMAGE_TAG="${VERSION:-latest}"
readonly REGISTRY="${REGISTRY:-ghcr.io/myorg}"

log() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" >&2
}

# Build multi-stage Docker image
build_image() {
    log "Building ${IMAGE_NAME}:${IMAGE_TAG}"
    docker build \
        --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
        --tag "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" \
        --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
        --build-arg VERSION="${IMAGE_TAG}" \
        --label "org.opencontainers.image.created=$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --label "org.opencontainers.image.revision=$(git rev-parse HEAD)" \
        .
}

# Run tests in container
run_tests() {
    log "Running tests in container"
    docker run --rm \
        --volume "$(pwd)/tests:/app/tests:ro" \
        --env CI=true \
        "${IMAGE_NAME}:${IMAGE_TAG}" \
        pytest /app/tests --tb=short -q
}

# Push to registry
push_image() {
    log "Pushing ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    docker push "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
}

# Health check after deployment
health_check() {
    local url="${1:?URL required}"
    local retries=10
    local wait=5

    for i in $(seq 1 "${retries}"); do
        if curl -sf "${url}/health" > /dev/null 2>&1; then
            log "Health check passed on attempt ${i}"
            return 0
        fi
        log "Health check attempt ${i}/${retries} failed, waiting ${wait}s"
        sleep "${wait}"
    done

    log "Health check failed after ${retries} attempts"
    return 1
}

main() {
    local command="${1:-all}"

    case "${command}" in
        build) build_image ;;
        test)  run_tests ;;
        push)  push_image ;;
        all)   build_image && run_tests && push_image ;;
        *)     echo "Usage: $0 [build|test|push|all]" >&2; exit 1 ;;
    esac
}

main "$@"
```

```dockerfile
# Multi-stage Dockerfile consumed by the Bash deploy script
FROM python:3.12-slim AS builder

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen --no-dev

FROM python:3.12-slim AS runtime

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}"

WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY src/ ./src/

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### TypeScript + Python Backend

**Use Case**: Full-stack application with a TypeScript frontend calling a Python API.

```typescript
// TypeScript API client with typed responses matching Python backend
interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    type: string;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.headers, ...options?.headers },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(`API Error [${error.error.code}]: ${error.error.message}`);
    }

    return response.json();
  }

  async getUsers(page = 1, perPage = 20): Promise<PaginatedResponse<User>> {
    return this.request<PaginatedResponse<User>>(
      `/api/users?page=${page}&per_page=${perPage}`
    );
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/api/users/${id}`);
  }

  async createUser(data: Omit<User, "id" | "created_at">): Promise<User> {
    return this.request<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Usage
const client = new ApiClient("http://localhost:8000", "my-auth-token");
const { items: users, total } = await client.getUsers();
console.log(`Loaded ${users.length} of ${total} users`);
```

```python
# Python Flask API that serves the TypeScript frontend
from flask import Flask, jsonify, request
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

app = Flask(__name__)


@dataclass
class User:
    id: int
    name: str
    email: str
    created_at: str


# In-memory store for demonstration
_users: list[User] = [
    User(id=1, name="Alice", email="alice@example.com", created_at="2026-01-01T00:00:00Z"),
    User(id=2, name="Bob", email="bob@example.com", created_at="2026-01-02T00:00:00Z"),
]


@app.route("/api/users", methods=["GET"])
def list_users():
    """Return paginated list of users for TypeScript frontend."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    start = (page - 1) * per_page
    end = start + per_page

    return jsonify({
        "items": [asdict(u) for u in _users[start:end]],
        "total": len(_users),
        "page": page,
        "per_page": per_page,
    })


@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id: int):
    """Return single user by ID."""
    user = next((u for u in _users if u.id == user_id), None)
    if not user:
        return jsonify({"error": {"code": "NOT_FOUND", "message": "User not found", "type": "NotFoundError"}}), 404
    return jsonify(asdict(user))


@app.route("/api/users", methods=["POST"])
def create_user():
    """Create a new user from JSON payload."""
    data = request.get_json()
    new_user = User(
        id=len(_users) + 1,
        name=data["name"],
        email=data["email"],
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    _users.append(new_user)
    return jsonify(asdict(new_user)), 201


@app.errorhandler(Exception)
def handle_error(error):
    """Return standardized error format matching TypeScript ApiError interface."""
    return jsonify({
        "error": {
            "code": "INTERNAL_ERROR",
            "message": str(error),
            "type": type(error).__name__,
        }
    }), 500


if __name__ == "__main__":
    app.run(port=8000)
```

### Ansible + Terraform

**Use Case**: Provision infrastructure with Terraform, then configure with Ansible.

```hcl
# Terraform creates instances and generates Ansible inventory
resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.ssh_key_name
  subnet_id     = aws_subnet.public[count.index % length(aws_subnet.public)].id

  vpc_security_group_ids = [aws_security_group.web.id]

  tags = {
    Name        = "web-${count.index}"
    Role        = "webserver"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_instance" "db" {
  count         = var.db_instance_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.db_instance_type
  key_name      = var.ssh_key_name
  subnet_id     = aws_subnet.private[count.index % length(aws_subnet.private)].id

  vpc_security_group_ids = [aws_security_group.db.id]

  tags = {
    Name        = "db-${count.index}"
    Role        = "database"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Generate Ansible inventory from Terraform state
resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/templates/inventory.tpl", {
    web_servers = aws_instance.web[*].public_ip
    db_servers  = aws_instance.db[*].private_ip
    environment = var.environment
  })
  filename        = "${path.root}/../ansible/inventory/${var.environment}.ini"
  file_permission = "0644"
}

# Generate Ansible group variables
resource "local_file" "ansible_group_vars" {
  content = templatefile("${path.module}/templates/group_vars.tpl", {
    db_endpoint    = aws_db_instance.main.endpoint
    redis_endpoint = aws_elasticache_cluster.main.cache_nodes[0].address
    s3_bucket      = aws_s3_bucket.assets.id
    environment    = var.environment
  })
  filename        = "${path.root}/../ansible/group_vars/${var.environment}.yml"
  file_permission = "0644"
}
```

```ini
# templates/inventory.tpl - Ansible inventory template
[webservers]
%{ for ip in web_servers ~}
${ip} ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/deploy_key
%{ endfor ~}

[databases]
%{ for ip in db_servers ~}
${ip} ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/deploy_key
%{ endfor ~}

[all:vars]
environment=${environment}
```

```yaml
# templates/group_vars.tpl - Ansible group variables
---
db_endpoint: "${db_endpoint}"
redis_endpoint: "${redis_endpoint}"
s3_bucket: "${s3_bucket}"
environment: "${environment}"
```

```yaml
# ansible/playbooks/configure_web.yml
---
- name: Configure web servers provisioned by Terraform
  hosts: webservers
  become: true

  pre_tasks:
    - name: Wait for cloud-init to finish
      ansible.builtin.command: cloud-init status --wait
      changed_when: false

  roles:
    - role: base_hardening
      tags: [security]
    - role: nginx
      nginx_worker_processes: auto
      nginx_worker_connections: 1024
      tags: [web]
    - role: app_deployment
      app_version: "{{ lookup('env', 'APP_VERSION') | default('latest', true) }}"
      app_port: 8000
      tags: [app]
    - role: monitoring_agent
      monitoring_endpoint: "{{ lookup('env', 'MONITORING_URL') }}"
      tags: [monitoring]

  post_tasks:
    - name: Verify application health
      ansible.builtin.uri:
        url: "http://localhost:8000/health"
        status_code: 200
      retries: 5
      delay: 10
      tags: [verify]
```

```bash
#!/bin/bash
# Orchestration script: Terraform provision → Ansible configure
set -euo pipefail

readonly ENV="${1:?Usage: $0 <environment>}"

log() { echo "[$(date -u +"%H:%M:%S")] $*" >&2; }

# Step 1: Provision infrastructure
log "Provisioning infrastructure for ${ENV}"
cd infrastructure
terraform init -input=false
terraform apply -auto-approve -var-file="environments/${ENV}.tfvars"

# Step 2: Configure with Ansible
log "Configuring servers for ${ENV}"
cd ../ansible
ansible-playbook \
    -i "inventory/${ENV}.ini" \
    playbooks/configure_web.yml \
    --extra-vars "environment=${ENV}"

log "Deployment complete for ${ENV}"
```

### Python + Kubernetes

**Use Case**: Python scripts managing Kubernetes resources programmatically.

```python
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import logging
import yaml
from pathlib import Path

logger = logging.getLogger(__name__)


def get_k8s_client() -> client.CoreV1Api:
    """Load Kubernetes config and return API client."""
    try:
        config.load_incluster_config()
        logger.info("Using in-cluster Kubernetes config")
    except config.ConfigException:
        config.load_kube_config()
        logger.info("Using local kubeconfig")
    return client.CoreV1Api()


def deploy_from_manifest(manifest_path: str, namespace: str = "default") -> None:
    """Apply a Kubernetes YAML manifest."""
    apps_v1 = client.AppsV1Api()

    with open(manifest_path) as f:
        manifest = yaml.safe_load(f)

    kind = manifest["kind"]
    name = manifest["metadata"]["name"]

    if kind == "Deployment":
        try:
            apps_v1.read_namespaced_deployment(name, namespace)
            apps_v1.patch_namespaced_deployment(name, namespace, manifest)
            logger.info("Updated deployment: %s", name)
        except ApiException as e:
            if e.status == 404:
                apps_v1.create_namespaced_deployment(namespace, manifest)
                logger.info("Created deployment: %s", name)
            else:
                raise


def wait_for_rollout(name: str, namespace: str = "default", timeout: int = 300) -> bool:
    """Wait for a deployment rollout to complete."""
    apps_v1 = client.AppsV1Api()
    import time

    start = time.time()
    while time.time() - start < timeout:
        deployment = apps_v1.read_namespaced_deployment(name, namespace)
        status = deployment.status

        if (
            status.updated_replicas == deployment.spec.replicas
            and status.ready_replicas == deployment.spec.replicas
            and status.available_replicas == deployment.spec.replicas
        ):
            logger.info("Rollout complete: %s (%d replicas ready)", name, status.ready_replicas)
            return True

        logger.info(
            "Waiting for rollout: %d/%d ready",
            status.ready_replicas or 0,
            deployment.spec.replicas,
        )
        time.sleep(5)

    logger.error("Rollout timed out after %ds", timeout)
    return False


# Deploy and wait
deploy_from_manifest("k8s/deployment.yaml", namespace="production")
wait_for_rollout("myapp", namespace="production")
```

```yaml
# k8s/deployment.yaml - Kubernetes manifest managed by Python
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
    managed-by: python-deployer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: ghcr.io/myorg/myapp:latest
          ports:
            - containerPort: 8000
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "256Mi"
              cpu: "500m"
```

### GitHub Actions + Makefile

**Use Case**: CI/CD workflows delegating build logic to Makefiles for local reproducibility.

```makefile
# Makefile - single source of truth for build commands
# Used by both developers locally and GitHub Actions in CI

.PHONY: install lint test build deploy clean

PYTHON_VERSION ?= 3.12
IMAGE_NAME     ?= myapp
IMAGE_TAG      ?= $(shell git rev-parse --short HEAD)
REGISTRY       ?= ghcr.io/myorg

install:
 uv sync --frozen

lint:
 uv run black --check .
 uv run flake8
 uv run mypy src/

test:
 uv run pytest tests/ --tb=short -q --cov=src --cov-report=term-missing

build:
 docker build \
  --tag $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG) \
  --tag $(REGISTRY)/$(IMAGE_NAME):latest \
  .

deploy: build
 docker push $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
 docker push $(REGISTRY)/$(IMAGE_NAME):latest

clean:
 rm -rf .venv __pycache__ .pytest_cache .mypy_cache dist/
 docker rmi $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG) 2>/dev/null || true
```

```yaml
# .github/workflows/ci.yml - delegates to Makefile
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
      - run: make install
      - run: make lint
      - run: make test

  build:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: make build
      - run: make deploy
        env:
          REGISTRY: ghcr.io/${{ github.repository_owner }}
```

### Terraform + GitHub Actions

**Use Case**: Automated infrastructure deployment with plan review on pull requests.

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
    paths: ["infrastructure/**"]
  pull_request:
    branches: [main]
    paths: ["infrastructure/**"]

permissions:
  contents: read
  pull-requests: write

env:
  TF_WORKING_DIR: infrastructure
  AWS_REGION: us-east-1

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9"

      - name: Terraform Init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init -input=false

      - name: Terraform Plan
        id: plan
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform plan -input=false -no-color -out=tfplan
        continue-on-error: true

      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const plan = `${{ steps.plan.outputs.stdout }}`;
            const truncated = plan.length > 60000
              ? plan.substring(0, 60000) + '\n\n... (truncated)'
              : plan;

            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `### Terraform Plan\n\`\`\`\n${truncated}\n\`\`\``
            });

  apply:
    needs: plan
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9"

      - name: Terraform Apply
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: |
          terraform init -input=false
          terraform apply -auto-approve -input=false
```

### Bash + Python Script Chaining

**Use Case**: Bash orchestrating Python scripts for data processing pipelines.

```bash
#!/bin/bash
# Data processing pipeline: extract → transform → load
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly DATA_DIR="${SCRIPT_DIR}/../data"
readonly TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"

log() { echo "[$(date -u +"%H:%M:%S")] $*" >&2; }

# Step 1: Extract raw data
log "Extracting data from source"
python3 "${SCRIPT_DIR}/extract.py" \
    --source "${DATA_SOURCE_URL}" \
    --output "${DATA_DIR}/raw/${TIMESTAMP}.json"

# Step 2: Transform and validate
log "Transforming and validating data"
python3 "${SCRIPT_DIR}/transform.py" \
    --input "${DATA_DIR}/raw/${TIMESTAMP}.json" \
    --output "${DATA_DIR}/processed/${TIMESTAMP}.parquet" \
    --schema "${SCRIPT_DIR}/schemas/data_schema.json"

# Step 3: Load into destination
log "Loading data into destination"
python3 "${SCRIPT_DIR}/load.py" \
    --input "${DATA_DIR}/processed/${TIMESTAMP}.parquet" \
    --destination "${DB_CONNECTION_STRING}" \
    --table "analytics.events"

# Step 4: Verify row counts
EXPECTED=$(python3 -c "import json; print(len(json.load(open('${DATA_DIR}/raw/${TIMESTAMP}.json'))))")
LOADED=$(python3 "${SCRIPT_DIR}/verify.py" --table "analytics.events" --after "${TIMESTAMP}")

if [[ "${LOADED}" -ne "${EXPECTED}" ]]; then
    log "ERROR: Row count mismatch. Expected=${EXPECTED}, Loaded=${LOADED}"
    exit 1
fi

log "Pipeline complete: ${LOADED} rows processed"
```

```python
# extract.py - Called by Bash pipeline
"""
@module extract
@description Extract data from external API source
@version 1.0.0
@author Tyler Dukes
@last_updated 2026-02-14
@status stable
"""
import argparse
import json
import logging
from urllib.request import urlopen

logger = logging.getLogger(__name__)


def extract(source_url: str, output_path: str) -> int:
    """Fetch data from source URL and write to JSON file."""
    logger.info("Fetching data from %s", source_url)

    with urlopen(source_url) as response:
        data = json.loads(response.read().decode())

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    record_count = len(data) if isinstance(data, list) else 1
    logger.info("Extracted %d records to %s", record_count, output_path)
    return record_count


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract data from source")
    parser.add_argument("--source", required=True, help="Source URL")
    parser.add_argument("--output", required=True, help="Output file path")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    extract(args.source, args.output)
```

---

## Data Exchange Formats

### YAML to JSON Conversion

```python
"""Convert shared YAML configuration to language-specific JSON."""
import yaml
import json
from pathlib import Path


def convert_yaml_to_json(yaml_path: str, json_path: str) -> None:
    """Read YAML config and write equivalent JSON for JavaScript/TypeScript consumption."""
    with open(yaml_path) as f:
        config = yaml.safe_load(f)

    with open(json_path, "w") as f:
        json.dump(config, f, indent=2)


def generate_language_configs(source: str = "config.yaml") -> None:
    """Generate configuration files for multiple languages from a single YAML source."""
    with open(source) as f:
        config = yaml.safe_load(f)

    # JSON for TypeScript/JavaScript
    Path("frontend/src").mkdir(parents=True, exist_ok=True)
    with open("frontend/src/config.json", "w") as f:
        json.dump(config, f, indent=2)

    # Terraform tfvars
    Path("infrastructure").mkdir(parents=True, exist_ok=True)
    with open("infrastructure/generated.auto.tfvars", "w") as f:
        for key, value in config.items():
            if isinstance(value, str):
                f.write(f'{key} = "{value}"\n')
            elif isinstance(value, bool):
                f.write(f"{key} = {str(value).lower()}\n")
            elif isinstance(value, (int, float)):
                f.write(f"{key} = {value}\n")

    # Shell environment file
    with open(".env.generated", "w") as f:
        for key, value in config.items():
            f.write(f"{key.upper()}={value}\n")


# Usage
generate_language_configs("config.yaml")
```

```yaml
# config.yaml - Single source of truth for all languages
api_url: "https://api.example.com"
api_timeout: 30
debug_mode: false
max_retries: 3
log_level: "INFO"
database_pool_size: 10
```

### Environment Variables Across Languages

```bash
# .env file (shared across all languages)
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=secret-key-123
LOG_LEVEL=INFO
REDIS_URL=redis://localhost:6379/0
APP_PORT=8000
```

```python
# Python: reading shared environment variables
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
API_KEY = os.environ["API_KEY"]
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
```

```typescript
// TypeScript: reading the same .env file
import * as dotenv from "dotenv";
dotenv.config();

const config = {
  databaseUrl: process.env.DATABASE_URL!,
  apiKey: process.env.API_KEY!,
  logLevel: process.env.LOG_LEVEL ?? "INFO",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379/0",
  appPort: parseInt(process.env.APP_PORT ?? "8000", 10),
} as const;

export default config;
```

```hcl
# Terraform: reading environment variables
variable "database_url" {
  type        = string
  description = "Database connection string"
  default     = null  # Falls back to TF_VAR_database_url env var
}

variable "api_key" {
  type        = string
  description = "API key for external service"
  sensitive   = true
}

variable "app_port" {
  type        = number
  description = "Application port"
  default     = 8000
}
```

```go
// Go: reading shared environment variables
package config

import (
    "os"
    "strconv"
)

type Config struct {
    DatabaseURL string
    APIKey      string
    LogLevel    string
    RedisURL    string
    AppPort     int
}

func Load() *Config {
    port, _ := strconv.Atoi(getEnv("APP_PORT", "8000"))
    return &Config{
        DatabaseURL: os.Getenv("DATABASE_URL"),
        APIKey:      os.Getenv("API_KEY"),
        LogLevel:    getEnv("LOG_LEVEL", "INFO"),
        RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
        AppPort:     port,
    }
}

func getEnv(key, fallback string) string {
    if value, ok := os.LookupEnv(key); ok {
        return value
    }
    return fallback
}
```

### Structured Output Exchange (JSON)

```python
# Python script outputs structured JSON for downstream consumers
import json
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timezone


@dataclass
class BuildArtifact:
    name: str
    version: str
    sha256: str
    size_bytes: int
    built_at: str


def generate_build_manifest(artifacts: list[BuildArtifact]) -> str:
    """Generate a build manifest for consumption by other tools."""
    manifest = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "artifacts": [asdict(a) for a in artifacts],
    }
    return json.dumps(manifest, indent=2)


# Write manifest for Bash/CI consumption
manifest = generate_build_manifest([
    BuildArtifact("myapp", "1.2.3", "abc123...", 15_000_000, "2026-02-14T00:00:00Z"),
])
print(manifest)
```

```bash
#!/bin/bash
# Bash reads structured JSON output from Python
set -euo pipefail

# Capture Python script output
MANIFEST=$(python3 scripts/build_manifest.py)

# Parse with jq for use in deployment
VERSION=$(echo "${MANIFEST}" | jq -r '.artifacts[0].version')
SHA=$(echo "${MANIFEST}" | jq -r '.artifacts[0].sha256')

echo "Deploying version ${VERSION} (sha: ${SHA})"

# Pass to Terraform as variables
terraform apply \
    -var="app_version=${VERSION}" \
    -var="app_sha256=${SHA}" \
    -auto-approve
```

---

## Cross-Language Project Structures

### Monorepo with Multiple Languages

```text
project/
├── backend/                   # Python API
│   ├── src/
│   │   └── app/
│   │       ├── __init__.py
│   │       ├── main.py
│   │       ├── models.py
│   │       └── routes/
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/                  # TypeScript React
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/            # Terraform
│   ├── modules/
│   │   ├── networking/
│   │   ├── compute/
│   │   └── database/
│   ├── environments/
│   │   ├── dev.tfvars
│   │   ├── staging.tfvars
│   │   └── prod.tfvars
│   └── main.tf
├── ansible/                   # Configuration management
│   ├── playbooks/
│   ├── roles/
│   ├── inventory/
│   └── group_vars/
├── scripts/                   # Bash utilities
│   ├── deploy.sh
│   ├── setup.sh
│   └── data_pipeline.sh
├── shared/                    # Cross-language shared files
│   ├── config.yaml            # Single config source
│   ├── schemas/               # JSON Schema definitions
│   │   ├── user.schema.json
│   │   └── event.schema.json
│   └── .env.example
├── .github/workflows/         # CI/CD
│   ├── backend.yml
│   ├── frontend.yml
│   ├── infrastructure.yml
│   └── integration.yml
├── docker-compose.yml         # Local development
├── Makefile                   # Unified build commands
└── .editorconfig              # Consistent formatting
```

### Docker Compose for Local Multi-Language Development

```yaml
# docker-compose.yml - Local development environment
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    ports:
      - "8000:8000"
    volumes:
      - ./backend/src:/app/src
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/mydb
      - REDIS_URL=redis://redis:6379/0
      - LOG_LEVEL=DEBUG
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
    environment:
      - VITE_API_URL=http://localhost:8000

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init_db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

```sql
-- scripts/init_db.sql - Database initialization shared across languages
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    event_type  VARCHAR(100) NOT NULL,
    payload     JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);
```

### Shared JSON Schema for Cross-Language Validation

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/user.json",
  "title": "User",
  "description": "User schema shared between TypeScript frontend and Python backend",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "description": "Unique user identifier"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": ["name", "email"],
  "additionalProperties": false
}
```

```python
# Python: validate against shared schema
import jsonschema
import json


def validate_user(data: dict) -> None:
    """Validate user data against the shared JSON Schema."""
    with open("shared/schemas/user.schema.json") as f:
        schema = json.load(f)
    jsonschema.validate(instance=data, schema=schema)


# Usage
validate_user({"name": "Alice", "email": "alice@example.com"})
```

```typescript
// TypeScript: validate against the same shared schema
import Ajv from "ajv";
import addFormats from "ajv-formats";
import userSchema from "../../shared/schemas/user.schema.json";

const ajv = new Ajv();
addFormats(ajv);

const validateUser = ajv.compile(userSchema);

function createUser(data: unknown): void {
  if (!validateUser(data)) {
    throw new Error(`Validation failed: ${JSON.stringify(validateUser.errors)}`);
  }
  // proceed with validated data
}

createUser({ name: "Alice", email: "alice@example.com" });
```

---

## CI/CD Integration Patterns

### Multi-Language Validation Pipeline

```yaml
# .github/workflows/ci.yml - Validate all languages in a monorepo
name: Multi-Language CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
      infrastructure: ${{ steps.filter.outputs.infrastructure }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
            frontend:
              - 'frontend/**'
            infrastructure:
              - 'infrastructure/**'

  validate-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
      - run: make -C backend install lint test

  validate-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm test

  validate-infrastructure:
    needs: detect-changes
    if: needs.detect-changes.outputs.infrastructure == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: cd infrastructure && terraform fmt -check -recursive
      - run: cd infrastructure && terraform init -backend=false
      - run: cd infrastructure && terraform validate

  integration-test:
    needs: [validate-backend, validate-frontend]
    if: always() && !failure() && !cancelled()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
      - run: |
          # Wait for services to be ready
          timeout 60 bash -c 'until curl -sf http://localhost:8000/health; do sleep 2; done'
          timeout 60 bash -c 'until curl -sf http://localhost:3000; do sleep 2; done'
      - run: make integration-test
      - run: docker compose down -v
        if: always()
```

### Unified Makefile for Multi-Language Projects

```makefile
# Root Makefile - unified interface for multi-language monorepo
.PHONY: all install lint test build deploy clean help

# Default target
all: lint test build

# Language-specific install targets
install: install-backend install-frontend

install-backend:
 cd backend && uv sync --frozen

install-frontend:
 cd frontend && npm ci

# Unified lint across all languages
lint: lint-backend lint-frontend lint-infrastructure lint-scripts

lint-backend:
 cd backend && uv run black --check . && uv run flake8

lint-frontend:
 cd frontend && npm run lint

lint-infrastructure:
 cd infrastructure && terraform fmt -check -recursive

lint-scripts:
 shellcheck scripts/*.sh

# Unified test across all languages
test: test-backend test-frontend

test-backend:
 cd backend && uv run pytest tests/ -q

test-frontend:
 cd frontend && npm test

# Integration tests using Docker Compose
integration-test:
 docker compose up -d
 @timeout 60 bash -c 'until curl -sf http://localhost:8000/health; do sleep 2; done'
 cd backend && uv run pytest tests/integration/ -q
 docker compose down -v

# Build all artifacts
build: build-backend build-frontend

build-backend:
 docker build -t myapp-backend:latest ./backend

build-frontend:
 docker build -t myapp-frontend:latest ./frontend

# Deploy all components
deploy:
 cd infrastructure && terraform apply -auto-approve
 cd ansible && ansible-playbook -i inventory/prod.ini playbooks/deploy.yml

# Clean all build artifacts
clean:
 cd backend && rm -rf .venv __pycache__ .pytest_cache
 cd frontend && rm -rf node_modules dist
 docker compose down -v --rmi local 2>/dev/null || true

help:
 @echo "Available targets:"
 @echo "  install     - Install all dependencies"
 @echo "  lint        - Lint all languages"
 @echo "  test        - Run all unit tests"
 @echo "  build       - Build all Docker images"
 @echo "  deploy      - Deploy infrastructure and application"
 @echo "  clean       - Remove all build artifacts"
```

---

## Common Integration Challenges

### Challenge 1: Sharing Configuration Across Languages

**Problem**: The same configuration values (URLs, ports, feature flags) are needed in Python, TypeScript, Terraform, and Bash.

**Solution**: Use a single YAML source with a generator script.

```yaml
# shared/config.yaml - Single source of truth
app:
  name: "myapp"
  port: 8000
  debug: false

database:
  host: "db.example.com"
  port: 5432
  name: "mydb"
  pool_size: 10

features:
  enable_caching: true
  max_upload_mb: 50
```

```python
# scripts/generate_configs.py
"""Generate language-specific config files from shared YAML source."""
import yaml
import json
from pathlib import Path


def load_config(path: str = "shared/config.yaml") -> dict:
    """Load the shared configuration."""
    with open(path) as f:
        return yaml.safe_load(f)


def generate_typescript_config(config: dict, output: str) -> None:
    """Generate a TypeScript configuration module."""
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w") as f:
        f.write("// AUTO-GENERATED from shared/config.yaml — do not edit\n")
        f.write(f"export const config = {json.dumps(config, indent=2)} as const;\n")


def generate_terraform_tfvars(config: dict, output: str) -> None:
    """Generate Terraform variable definitions."""
    Path(output).parent.mkdir(parents=True, exist_ok=True)

    def write_value(f, key: str, value) -> None:
        if isinstance(value, str):
            f.write(f'{key} = "{value}"\n')
        elif isinstance(value, bool):
            f.write(f"{key} = {str(value).lower()}\n")
        elif isinstance(value, (int, float)):
            f.write(f"{key} = {value}\n")

    with open(output, "w") as f:
        f.write("# AUTO-GENERATED from shared/config.yaml — do not edit\n")
        for section, values in config.items():
            if isinstance(values, dict):
                for key, value in values.items():
                    write_value(f, f"{section}_{key}", value)
            else:
                write_value(f, section, values)


def generate_dotenv(config: dict, output: str) -> None:
    """Generate .env file for Bash and Docker."""
    with open(output, "w") as f:
        f.write("# AUTO-GENERATED from shared/config.yaml — do not edit\n")
        for section, values in config.items():
            if isinstance(values, dict):
                for key, value in values.items():
                    env_key = f"{section}_{key}".upper()
                    f.write(f"{env_key}={value}\n")


def main() -> None:
    config = load_config()
    generate_typescript_config(config, "frontend/src/generated-config.ts")
    generate_terraform_tfvars(config, "infrastructure/generated.auto.tfvars")
    generate_dotenv(config, ".env.generated")
    print("Generated configs for TypeScript, Terraform, and shell")


if __name__ == "__main__":
    main()
```

### Challenge 2: Standardized Error Handling Across Boundaries

**Problem**: Errors from one language must be understandable by consumers in another.

**Solution**: Define a shared error format and implement it consistently.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "StandardError",
  "description": "Shared error format across all services",
  "type": "object",
  "properties": {
    "error": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string",
          "description": "Machine-readable error code",
          "enum": ["VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED", "FORBIDDEN", "INTERNAL_ERROR", "RATE_LIMITED"]
        },
        "message": {
          "type": "string",
          "description": "Human-readable error description"
        },
        "type": {
          "type": "string",
          "description": "Error class name from source language"
        },
        "details": {
          "type": "object",
          "description": "Additional context specific to the error"
        }
      },
      "required": ["code", "message", "type"]
    }
  },
  "required": ["error"]
}
```

```python
# Python: standardized error responses
from flask import jsonify, Flask
from dataclasses import dataclass, asdict
from typing import Any

app = Flask(__name__)


@dataclass
class StandardError:
    code: str
    message: str
    type: str
    details: dict[str, Any] | None = None


def error_response(error: StandardError, status_code: int):
    """Return a standardized error response matching the shared schema."""
    body = {"error": asdict(error)}
    if body["error"]["details"] is None:
        del body["error"]["details"]
    return jsonify(body), status_code


@app.errorhandler(404)
def not_found(e):
    return error_response(
        StandardError(code="NOT_FOUND", message=str(e), type="NotFoundError"),
        404,
    )


@app.errorhandler(422)
def validation_error(e):
    return error_response(
        StandardError(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            type="ValidationError",
            details={"errors": e.description},
        ),
        422,
    )


@app.errorhandler(500)
def internal_error(e):
    return error_response(
        StandardError(code="INTERNAL_ERROR", message="An unexpected error occurred", type="InternalError"),
        500,
    )
```

```typescript
// TypeScript: consuming standardized errors
interface StandardError {
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_ERROR" | "RATE_LIMITED";
    message: string;
    type: string;
    details?: Record<string, unknown>;
  };
}

class ApiError extends Error {
  code: string;
  type: string;
  details?: Record<string, unknown>;

  constructor(err: StandardError["error"]) {
    super(err.message);
    this.code = err.code;
    this.type = err.type;
    this.details = err.details;
  }
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body: StandardError = await response.json();
    throw new ApiError(body.error);
  }

  return response.json();
}

// Usage with typed error handling
try {
  const user = await apiRequest<{ id: number; name: string }>("/api/users/999");
} catch (err) {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "NOT_FOUND":
        console.log("User not found");
        break;
      case "RATE_LIMITED":
        console.log("Too many requests, retrying...");
        break;
      default:
        console.error(`API error [${err.code}]: ${err.message}`);
    }
  }
}
```

### Challenge 3: Consistent Secrets Management

**Problem**: Secrets must be available to Python, TypeScript, Terraform, and Bash without hardcoding.

**Solution**: Use a secrets manager with language-specific clients.

```python
# Python: fetch secrets from AWS Secrets Manager
import boto3
import json
from functools import lru_cache


@lru_cache(maxsize=32)
def get_secret(secret_name: str, region: str = "us-east-1") -> dict:
    """Retrieve and cache a secret from AWS Secrets Manager."""
    client = boto3.client("secretsmanager", region_name=region)
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])


# Usage
db_creds = get_secret("prod/database")
db_url = f"postgresql://{db_creds['username']}:{db_creds['password']}@{db_creds['host']}:{db_creds['port']}/{db_creds['dbname']}"
```

```typescript
// TypeScript: fetch the same secrets
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const secretCache = new Map<string, Record<string, string>>();

async function getSecret(secretName: string): Promise<Record<string, string>> {
  const cached = secretCache.get(secretName);
  if (cached) return cached;

  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  const secret = JSON.parse(response.SecretString!);

  secretCache.set(secretName, secret);
  return secret;
}

// Usage
const dbCreds = await getSecret("prod/database");
const dbUrl = `postgresql://${dbCreds.username}:${dbCreds.password}@${dbCreds.host}:${dbCreds.port}/${dbCreds.dbname}`;
```

```hcl
# Terraform: reference the same secrets
data "aws_secretsmanager_secret_version" "db_creds" {
  secret_id = "prod/database"
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_creds.secret_string)
}

resource "aws_db_instance" "main" {
  engine   = "postgres"
  username = local.db_creds["username"]
  password = local.db_creds["password"]
  # ...
}
```

```bash
#!/bin/bash
# Bash: retrieve the same secrets via AWS CLI
set -euo pipefail

get_secret() {
    local secret_name="${1:?Secret name required}"
    aws secretsmanager get-secret-value \
        --secret-id "${secret_name}" \
        --query 'SecretString' \
        --output text
}

# Usage
DB_CREDS=$(get_secret "prod/database")
DB_HOST=$(echo "${DB_CREDS}" | jq -r '.host')
DB_PORT=$(echo "${DB_CREDS}" | jq -r '.port')
DB_NAME=$(echo "${DB_CREDS}" | jq -r '.dbname')
DB_USER=$(echo "${DB_CREDS}" | jq -r '.username')

export DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
```

---

## API Contract Patterns

### OpenAPI as Cross-Language Contract

```yaml
# shared/openapi.yaml - Contract between frontend and backend
openapi: "3.1.0"
info:
  title: "MyApp API"
  version: "1.0.0"

paths:
  /api/users:
    get:
      operationId: listUsers
      summary: List all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: per_page
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        "200":
          description: Paginated user list
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: "#/components/schemas/User"
                  total:
                    type: integer
                  page:
                    type: integer
                  per_page:
                    type: integer
    post:
      operationId: createUser
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUser"
      responses:
        "201":
          description: User created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "422":
          description: Validation error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/StandardError"

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
          format: email
        created_at:
          type: string
          format: date-time
      required: [id, name, email, created_at]

    CreateUser:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        email:
          type: string
          format: email
      required: [name, email]

    StandardError:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            type:
              type: string
          required: [code, message, type]
```

```bash
#!/bin/bash
# Generate typed clients from OpenAPI spec
set -euo pipefail

SPEC="shared/openapi.yaml"

# Generate TypeScript client
npx openapi-typescript "${SPEC}" --output frontend/src/generated/api-types.ts

# Generate Python client
openapi-python-client generate \
    --path "${SPEC}" \
    --output-path backend/src/generated/

echo "API clients generated from ${SPEC}"
```

---

## Database Integration Patterns

### Migration Management Across Languages

```python
# Python: Alembic migration that creates schema used by all services
"""
@module db_migrations
@description Database migration for shared user table
@version 1.0.0
@author Tyler Dukes
@last_updated 2026-02-14
@status stable
"""
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    """Create users table accessed by Python API and TypeScript frontend."""
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_users_email", "users", ["email"])


def downgrade() -> None:
    """Remove users table."""
    op.drop_index("idx_users_email", table_name="users")
    op.drop_table("users")
```

```hcl
# Terraform: provision the database that migrations run against
resource "aws_db_instance" "main" {
  identifier     = "${var.project}-${var.environment}"
  engine         = "postgres"
  engine_version = "16.4"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = local.db_creds["username"]
  password = local.db_creds["password"]

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  deletion_protection     = var.environment == "production"

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

output "db_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "Database endpoint for application connection strings"
}
```

```bash
#!/bin/bash
# Run migrations after Terraform provisions the database
set -euo pipefail

readonly ENV="${1:?Usage: $0 <environment>}"

# Get database endpoint from Terraform
DB_ENDPOINT=$(cd infrastructure && terraform output -raw db_endpoint)

# Get credentials from secrets manager
DB_CREDS=$(aws secretsmanager get-secret-value \
    --secret-id "${ENV}/database" \
    --query 'SecretString' \
    --output text)
DB_USER=$(echo "${DB_CREDS}" | jq -r '.username')
DB_PASS=$(echo "${DB_CREDS}" | jq -r '.password')
DB_NAME=$(echo "${DB_CREDS}" | jq -r '.dbname')

# Run Alembic migrations
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_ENDPOINT}/${DB_NAME}"
cd backend && uv run alembic upgrade head

echo "Migrations complete for ${ENV}"
```

---

## Observability Across Languages

### Structured Logging with Consistent Format

```python
# Python: structured JSON logging
import logging
import json
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Format log records as JSON for unified log aggregation."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "backend",
            "language": "python",
            "message": record.getMessage(),
            "logger": record.name,
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


# Configure logging
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logging.root.addHandler(handler)
logging.root.setLevel(logging.INFO)

logger = logging.getLogger("myapp")
logger.info("Application started on port %d", 8000)
```

```typescript
// TypeScript: matching structured JSON logging
interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  language: string;
  message: string;
  [key: string]: unknown;
}

function createLogger(service: string) {
  const log = (level: string, message: string, extra: Record<string, unknown> = {}) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      language: "typescript",
      message,
      ...extra,
    };
    console.log(JSON.stringify(entry));
  };

  return {
    info: (msg: string, extra?: Record<string, unknown>) => log("INFO", msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => log("WARNING", msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => log("ERROR", msg, extra),
  };
}

const logger = createLogger("frontend");
logger.info("Application started", { port: 3000 });
```

```bash
#!/bin/bash
# Bash: matching structured JSON logging
log_json() {
    local level="${1:?Level required}"
    local message="${2:?Message required}"

    jq -n \
        --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --arg level "${level}" \
        --arg service "scripts" \
        --arg language "bash" \
        --arg message "${message}" \
        '{timestamp: $timestamp, level: $level, service: $service, language: $language, message: $message}' \
        >&2
}

log_json "INFO" "Deployment script started"
log_json "ERROR" "Failed to connect to database"
```

---

## Best Practices Summary

### Integration Checklist

```text
✅ Use a single source of truth for shared configuration (YAML/JSON)
✅ Generate language-specific configs from the shared source
✅ Define API contracts with OpenAPI or JSON Schema
✅ Standardize error formats across all services
✅ Use consistent structured logging (JSON) across all languages
✅ Share secrets through a secrets manager, not .env files in production
✅ Use Docker Compose for local multi-service development
✅ Run path-filtered CI/CD to avoid rebuilding unchanged components
✅ Use Makefiles as a unified interface for build/test/deploy commands
✅ Validate shared schemas in CI before deployment
```

### Anti-Patterns to Avoid

```text
❌ Hardcoding URLs, ports, or credentials in any language
❌ Duplicating configuration across languages without a shared source
❌ Using language-specific error formats that other services can't parse
❌ Running all CI jobs when only one component changed
❌ Mixing secrets management approaches (env vars in dev, vault in prod)
❌ Skipping API contract validation between frontend and backend
❌ Using unstructured logs that break log aggregation queries
❌ Deploying infrastructure and application code in a single pipeline step
```
