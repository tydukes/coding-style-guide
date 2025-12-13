---
title: "YAML Style Guide"
description: "YAML configuration standards for consistent, readable, and maintainable configuration files"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [yaml, configuration, data, serialization, kubernetes]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**YAML** (YAML Ain't Markup Language) is a human-readable data serialization language commonly used for configuration
files, infrastructure as code, and data exchange. This guide covers YAML standards for consistent and maintainable
configuration.

### Key Characteristics

- **Paradigm**: Data serialization, configuration
- **File Extension**: `.yaml`, `.yml` (prefer `.yaml`)
- **Primary Use**: Configuration files, Kubernetes manifests, CI/CD pipelines, Ansible playbooks
- **Indentation**: 2 spaces (never tabs)

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Syntax** | | | |
| Indentation | 2 spaces | `key: value` | Never tabs, always 2 spaces |
| Key-Value | `key: value` | `name: John` | Space after colon |
| Lists | `- item` | `- apple` | Dash followed by space |
| Multi-line | `\|` or `>` | `description: \| text` | `\|` preserves newlines, `>` folds |
| **Data Types** | | | |
| String | Unquoted or quoted | `name: John` or `name: "John"` | Quote when special chars |
| Number | Numeric | `count: 42`, `pi: 3.14` | Integer or float |
| Boolean | `true`/`false` | `enabled: true` | Lowercase |
| Null | `null` or `~` | `value: null` | Explicit null |
| **Collections** | | | |
| Mapping | `key: value` | `person:\n  name: John` | Nested objects |
| Sequence | `- item` | `fruits:\n  - apple` | Arrays/lists |
| Inline Map | `{key: value}` | `{name: John, age: 30}` | Flow style |
| Inline List | `[item1, item2]` | `[1, 2, 3]` | Flow style |
| **Files** | | | |
| Extension | `.yaml` preferred | `config.yaml`, `values.yaml` | Avoid `.yml` |
| Multiple Docs | `---` separator | `---\ndoc1\n---\ndoc2` | Multiple YAML docs in one file |
| **Best Practices** | | | |
| Quotes | Quote when needed | `version: "1.20"` | Avoid type coercion |
| Comments | `# comment` | `# Configuration` | Hash for comments |
| Anchors | `&anchor` | `defaults: &defaults` | Reuse with `*anchor` |
| Merge Keys | `<<: *anchor` | `<<: *defaults` | Merge referenced keys |

---

## Basic Syntax

### Indentation

Always use **2 spaces** for indentation:

```yaml
## Good - 2 spaces
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"

## Bad - 4 spaces or tabs
services:
    web:
        image: nginx:latest
```

### Key-Value Pairs

```yaml
## Simple key-value pairs
name: my-application
version: 1.0.0
environment: production

## Nested structures
database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: secret
```

---

## Data Types

### Strings

```yaml
## Unquoted strings (preferred for simple strings)
name: my-application
description: A simple web application

## Quoted strings (use when needed)
message: "String with: special characters"
path: 'C:\Windows\System32'

## Multi-line strings - literal block (preserves newlines)
script: |
  #!/bin/bash
  echo "Hello World"
  exit 0

## Multi-line strings - folded block (single line)
description: >
  This is a long description
  that will be folded into
  a single line.
```

### Numbers

```yaml
## Integers
count: 42
port: 8080

## Floats
pi: 3.14159
percentage: 99.9

## Exponential notation
scientific: 1.23e-4
```

### Booleans

```yaml
## Preferred boolean values
enabled: true
disabled: false

## Avoid these (but they work)
## legacy_enabled: yes
## legacy_disabled: no
```

### Null Values

```yaml
## Explicit null
value: null

## Implicit null (empty value)
empty_value:

## Tilde also means null
another_null: ~
```

---

## Collections

### Lists

```yaml
## Dash notation (preferred)
fruits:
  - apple
  - banana
  - orange

## Flow style (use sparingly)
colors: [red, green, blue]

## List of objects
users:
  - name: Alice
    role: admin
  - name: Bob
    role: user

## Empty list
empty_list: []
```

### Dictionaries

```yaml
## Nested dictionaries
application:
  name: my-app
  version: 1.0.0
  config:
    database:
      host: localhost
      port: 5432
    cache:
      type: redis
      ttl: 3600

## Empty dictionary
empty_dict: {}
```

---

## Kubernetes YAML

### Pod Definition

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  namespace: default
  labels:
    app: nginx
    environment: production
spec:
  containers:
    - name: nginx
      image: nginx:1.21-alpine
      ports:
        - containerPort: 80
          protocol: TCP
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 512Mi
      env:
        - name: NGINX_HOST
          value: example.com
        - name: NGINX_PORT
          value: "80"
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.21-alpine
          ports:
            - containerPort: 80
```

---

## Docker Compose YAML

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    container_name: web-server
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./html:/usr/share/nginx/html:ro
      - ./conf/nginx.conf:/etc/nginx/nginx.conf:ro
    environment:
      - NGINX_HOST=example.com
      - NGINX_PORT=80
    networks:
      - frontend
    depends_on:
      - api
    restart: unless-stopped

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: api-server
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/mydb
    networks:
      - frontend
      - backend
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    container_name: postgres-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend
    restart: unless-stopped

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

---

## GitHub Actions YAML

```yaml
name: CI Pipeline

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push myapp:${{ github.sha }}
```

---

## Ansible YAML

```yaml
---
- name: Configure web servers
  hosts: webservers
  become: true
  vars:
    nginx_version: "1.21"
    app_port: 8080

  tasks:
    - name: Update apt cache
      ansible.builtin.apt:
        update_cache: true
        cache_valid_time: 3600

    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present

    - name: Copy nginx configuration
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        owner: root
        group: root
        mode: '0644'
      notify: Reload nginx

    - name: Ensure nginx is running
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded
```

---

## Comments

```yaml
## Single-line comment

## Multi-line comment block
## that spans multiple lines
## to explain complex configuration

services:
  web:
    image: nginx:latest  # Inline comment
    ports:
      - "80:80"  # HTTP port
      - "443:443"  # HTTPS port
```

---

## Anchors and Aliases

### Reusing Configuration

```yaml
## Define anchor with &
default_settings: &defaults
  timeout: 30
  retries: 3
  log_level: info

## Reuse with *
production:
  <<: *defaults
  environment: production

staging:
  <<: *defaults
  environment: staging
  timeout: 60  # Override specific value

## List anchors
common_env: &common_env
  - name: APP_NAME
    value: my-app
  - name: LOG_LEVEL
    value: info

service_a:
  env: *common_env

service_b:
  env: *common_env
```

---

## Testing

### YAML Linting

Use [yamllint](https://yamllint.readthedocs.io/) to validate YAML files:

```bash
## Install yamllint
pip install yamllint

## Lint single file
yamllint config.yaml

## Lint all YAML files
yamllint .

## Lint with custom config
yamllint -c .yamllint.yaml config.yaml
```

### yamllint Configuration

```yaml
## .yamllint.yaml
extends: default

rules:
  line-length:
    max: 120
    level: warning
  indentation:
    spaces: 2
    indent-sequences: true
  comments:
    min-spaces-from-content: 2
  document-start:
    present: true
  truthy:
    allowed-values: ['true', 'false']
```

### Schema Validation

Validate YAML against JSON Schema:

```bash
## Install check-jsonschema
pip install check-jsonschema

## Validate against schema
check-jsonschema --schemafile schema.json config.yaml

## Validate multiple files
check-jsonschema --schemafile schema.json configs/*.yaml
```

Example schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "services"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+$"
    },
    "services": {
      "type": "object",
      "patternProperties": {
        "^[a-z][a-z0-9-]*$": {
          "type": "object",
          "required": ["image"],
          "properties": {
            "image": {
              "type": "string"
            },
            "ports": {
              "type": "array",
              "items": {
                "type": "string",
                "pattern": "^[0-9]+:[0-9]+$"
              }
            }
          }
        }
      }
    }
  }
}
```

### Testing with yq

Validate and test YAML structure:

```bash
## Check if file is valid YAML
yq eval '.' config.yaml > /dev/null

## Test specific values
version=$(yq eval '.version' config.yaml)
if [ "$version" != "1.0" ]; then
  echo "Invalid version: $version"
  exit 1
fi

## Test array length
count=$(yq eval '.services | length' config.yaml)
if [ "$count" -lt 1 ]; then
  echo "Must have at least one service"
  exit 1
fi

## Test nested values
image=$(yq eval '.services.web.image' config.yaml)
if [ -z "$image" ]; then
  echo "Web service must have image"
  exit 1
fi
```

### Unit Testing YAML

```python
## tests/test_yaml_config.py
import yaml
import pytest

def load_yaml(filename):
    with open(filename, 'r') as f:
        return yaml.safe_load(f)

def test_config_structure():
    config = load_yaml('config.yaml')

    assert 'version' in config
    assert 'services' in config
    assert isinstance(config['services'], dict)

def test_service_configuration():
    config = load_yaml('config.yaml')

    for name, service in config['services'].items():
        assert 'image' in service, f"Service {name} missing image"
        assert isinstance(service.get('environment', {}), dict)

def test_environment_specific_config():
    prod_config = load_yaml('config.production.yaml')

    assert prod_config['environment'] == 'production'
    assert prod_config['debug'] is False
    assert 'ssl' in prod_config
    assert prod_config['ssl']['enabled'] is True

@pytest.mark.parametrize("env", ["development", "staging", "production"])
def test_all_environments(env):
    config = load_yaml(f'config.{env}.yaml')

    assert config['environment'] == env
    assert 'database' in config
    assert 'host' in config['database']
```

### CI/CD Integration

```yaml
## .github/workflows/yaml-test.yml
name: YAML Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install yamllint
        run: pip install yamllint

      - name: Lint YAML files
        run: yamllint .

      - name: Install yq
        run: |
          wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
          chmod +x yq_linux_amd64
          sudo mv yq_linux_amd64 /usr/local/bin/yq

      - name: Validate structure
        run: |
          for file in config*.yaml; do
            echo "Validating $file"
            yq eval '.' "$file" > /dev/null
          done

  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install check-jsonschema
        run: pip install check-jsonschema

      - name: Validate against schema
        run: |
          check-jsonschema --schemafile schema.json config.yaml
```

### Testing with Docker Compose

Test YAML in context:

```bash
## tests/test-compose.sh
#!/bin/bash
set -e

echo "Testing docker-compose.yaml..."

## Validate syntax
docker-compose -f docker-compose.yaml config > /dev/null

## Test in dry-run mode
docker-compose -f docker-compose.yaml up --dry-run

## Validate services defined
services=$(docker-compose -f docker-compose.yaml config --services)
expected_services="web db redis"

for service in $expected_services; do
  if ! echo "$services" | grep -q "^${service}$"; then
    echo "ERROR: Service $service not found"
    exit 1
  fi
done

echo "docker-compose.yaml is valid"
```

### Pre-commit Hooks

```yaml
## .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-yaml
        args: ['--safe']

  - repo: https://github.com/adrienverge/yamllint
    rev: v1.33.0
    hooks:
      - id: yamllint
        args: ['-c', '.yamllint.yaml']

  - repo: https://github.com/python-jsonschema/check-jsonschema
    rev: 0.27.0
    hooks:
      - id: check-jsonschema
        name: Validate configs
        files: ^config.*\.yaml$
        args: ['--schemafile', 'schema.json']
```

### Diff Testing

Compare YAML configurations:

```bash
## Install dyff
brew install homeport/tap/dyff

## Compare configurations
dyff between config.staging.yaml config.production.yaml

## Output in different formats
dyff between --output human config.staging.yaml config.production.yaml
dyff between --output yaml config.staging.yaml config.production.yaml
```

### Security Scanning

Scan for secrets in YAML:

```bash
## Install detect-secrets
pip install detect-secrets

## Scan YAML files
detect-secrets scan config*.yaml

## Create baseline
detect-secrets scan --baseline .secrets.baseline config*.yaml

## Audit findings
detect-secrets audit .secrets.baseline
```

### Performance Testing

Test YAML parsing performance:

```python
## tests/test_yaml_performance.py
import yaml
import time

def test_large_yaml_performance():
    start = time.time()

    with open('large-config.yaml', 'r') as f:
        config = yaml.safe_load(f)

    duration = time.time() - start

    assert duration < 1.0, f"YAML parsing too slow: {duration}s"
    assert config is not None
```

---

## Security Best Practices

### Never Store Secrets in YAML

YAML files are often committed to version control:

```yaml
## Bad - Secrets in YAML
database:
  host: db.example.com
  password: MySecretPassword123  # ❌ Exposed in version control!
  api_key: sk-1234567890abcdef   # ❌ Hardcoded secret!

## Good - Environment variable references
database:
  host: ${DB_HOST}
  password: ${DB_PASSWORD}  # ✅ From environment
  api_key: ${API_KEY}

## Good - External secret references
database:
  host: db.example.com
  password: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    ...encrypted...
  api_key: ssm:///myapp/api-key  # AWS Systems Manager Parameter Store
```

**Key Points**:

- Never commit secrets to YAML files in version control
- Use environment variables for sensitive data
- Use secret management (Ansible Vault, Sealed Secrets, SOPS)
- Scan repositories for accidentally committed secrets
- Encrypt sensitive YAML files at rest

### Prevent YAML Injection

Untrusted YAML can execute arbitrary code in some parsers:

```python
## Bad - Unsafe YAML loading
import yaml

user_input = """
!!python/object/apply:os.system
args: ['rm -rf /']
"""
data = yaml.load(user_input)  # ❌ Code execution vulnerability!

## Good - Safe YAML loading
import yaml

user_input = """
name: John
age: 30
"""
data = yaml.safe_load(user_input)  # ✅ Safe - no code execution

## Good - Validate with schema
from yamale import make_schema, make_data, validate

schema = make_schema('schema.yaml')
data = make_data('config.yaml')
validate(schema, data)  # ✅ Validated against schema
```

**Key Points**:

- Always use `safe_load()` instead of `load()`
- Never parse untrusted YAML with `yaml.load()`
- Validate YAML against schemas
- Sanitize user inputs before YAML encoding
- Use YAML parsers with security in mind

### Validate YAML Schema

Define and enforce schemas for all YAML configurations:

```yaml
## schema.yaml (using JSON Schema)
type: object
properties:
  name:
    type: string
    pattern: '^[a-zA-Z0-9_-]+$'
  email:
    type: string
    format: email
  age:
    type: integer
    minimum: 0
    maximum: 150
required:
  - name
  - email
additionalProperties: false  # Prevent unexpected properties
```

```python
## Good - Validate YAML
import yaml
import jsonschema

with open('schema.yaml') as f:
    schema = yaml.safe_load(f)

with open('config.yaml') as f:
    config = yaml.safe_load(f)

jsonschema.validate(config, schema)  # ✅ Validated
```

**Key Points**:

- Define schemas for all YAML files
- Validate on load
- Use `additionalProperties: false` to prevent injection
- Enforce type and format constraints
- Fail fast on invalid YAML

### File Permissions

Protect YAML configuration files:

```bash
## Good - Restrictive permissions
# Application configuration
chmod 640 config.yaml
chown app:app config.yaml

# Secrets (Kubernetes secrets, etc.)
chmod 600 secrets.yaml
chown app:app secrets.yaml

# Public configuration
chmod 644 public-config.yaml
```

**Key Points**:

- Set restrictive file permissions (600-644)
- Use appropriate ownership
- Never make secrets world-readable
- Audit file access regularly
- Encrypt sensitive YAML at rest

### Kubernetes Secrets

Properly handle secrets in Kubernetes YAML:

```yaml
## Bad - Base64 is NOT encryption!
apiVersion: v1
kind: Secret
metadata:
  name: db-password
type: Opaque
data:
  password: TXlTZWNyZXRQYXNzd29yZDEyMw==  # ❌ Easily decoded!

## Good - Use Sealed Secrets or external secrets
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-password
spec:
  encryptedData:
    password: AgB...encrypted...  # ✅ Encrypted with public key

## Good - External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-password
spec:
  secretStoreRef:
    name: vault-backend
  target:
    name: db-password
  data:
    - secretKey: password
      remoteRef:
        key: secret/data/database
        property: password
```

**Key Points**:

- Don't commit Kubernetes Secrets to Git
- Use Sealed Secrets or External Secrets Operator
- Reference external secret stores (Vault, AWS Secrets Manager)
- Enable encryption at rest in etcd
- Use RBAC to restrict secret access

### YAML Bombs (Billion Laughs Attack)

Prevent denial of service from malicious YAML:

```yaml
## Bad - YAML bomb (exponential expansion)
a: &a ["lol","lol","lol","lol","lol","lol","lol","lol","lol"]
b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]
c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b]
# ... continues to expand exponentially (billions of elements)
```

```python
## Good - Limit YAML complexity
import yaml

class SafeLoader(yaml.SafeLoader):
    def __init__(self, stream):
        self._depth = 0
        super().__init__(stream)

    def construct_object(self, node, deep=False):
        self._depth += 1
        if self._depth > 50:  # ✅ Limit recursion depth
            raise yaml.YAMLError('Maximum recursion depth exceeded')
        obj = super().construct_object(node, deep)
        self._depth -= 1
        return obj

data = yaml.load(yaml_content, Loader=SafeLoader)
```

**Key Points**:

- Set maximum recursion/nesting depth
- Limit file size for YAML parsing
- Implement timeouts for parsing
- Monitor memory usage during parsing
- Reject malformed YAML early

---

## Anti-Patterns

### ❌ Avoid: Tabs for Indentation

```yaml
## Bad - Using tabs
services:
 web:
  image: nginx

## Good - Using 2 spaces
services:
  web:
    image: nginx
```

### ❌ Avoid: Inconsistent Indentation

```yaml
## Bad - Inconsistent spacing
services:
  web:
      image: nginx
    ports:
     - "80:80"

## Good - Consistent 2-space indentation
services:
  web:
    image: nginx
    ports:
      - "80:80"
```

### ❌ Avoid: Mixing Styles

```yaml
## Bad - Mixing block and flow styles
services:
  web: {image: nginx, ports: ["80:80"]}
  db:
    image: postgres
    ports:
      - "5432:5432"

## Good - Consistent block style
services:
  web:
    image: nginx
    ports:
      - "80:80"
  db:
    image: postgres
    ports:
      - "5432:5432"
```

### ❌ Avoid: Unquoted Special Values

```yaml
## Bad - Unquoted values that could be misinterpreted
version: 3.8          # Becomes float 3.8
enabled: yes          # Becomes boolean true
country: NO           # Becomes boolean false (Norway code!)
version_string: 1.20  # Becomes float 1.2

## Good - Quote strings
version: "3.8"
enabled: "yes"
country: "NO"
version_string: "1.20"
```

### ❌ Avoid: Duplicate Keys

```yaml
## Bad - Duplicate keys (last one wins)
database:
  host: localhost
  port: 5432
  host: prod-db.example.com  # ❌ Overwrites previous host

## Good - Unique keys
database:
  host: prod-db.example.com
  port: 5432
```

### ❌ Avoid: Not Using Anchors and Aliases

```yaml
## Bad - Repeated configuration
services:
  web1:
    image: nginx:latest
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
  web2:
    image: nginx:latest
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"

## Good - Use anchors and aliases
x-common-config: &common
  restart: always
  logging:
    driver: json-file
    options:
      max-size: "10m"

services:
  web1:
    <<: *common
    image: nginx:latest
  web2:
    <<: *common
    image: nginx:latest
```

### ❌ Avoid: Complex Multi-line Strings Without Proper Style

```yaml
## Bad - Unclear multi-line handling
description: This is a very long description that
spans multiple lines but doesn't specify
how line breaks should be handled

## Good - Use | for literal style or > for folded
description_literal: |
  This preserves line breaks.
  Each line appears exactly as written.
  Great for scripts or formatted text.

description_folded: >
  This folds lines into a single line.
  Line breaks become spaces.
  Great for long paragraphs.
```

---

## Advanced YAML Linting

### Advanced yamllint Configuration

`.yamllint`:

```yaml
---
extends: default

rules:
  line-length:
    max: 120
    level: warning
  indentation:
    spaces: 2
    indent-sequences: true
  comments:
    min-spaces-from-content: 2
  braces:
    min-spaces-inside: 0
    max-spaces-inside: 1
  brackets:
    min-spaces-inside: 0
    max-spaces-inside: 1
  trailing-spaces: enable
  truthy:
    allowed-values: ['true', 'false']
```

### Running yamllint

```bash
## Lint all YAML files
yamllint .

## Lint specific file
yamllint config.yaml

## Lint with custom config
yamllint -c .yamllint .

## Format output
yamllint -f parsable .
```

---

## Advanced Schema Validation

### Using JSON Schema for Complex Validation

```yaml
## config.yaml
database:
  host: localhost
  port: 5432
  username: admin
  max_connections: 100
```

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "database": {
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "port": { "type": "integer", "minimum": 1, "maximum": 65535 },
        "username": { "type": "string" },
        "max_connections": { "type": "integer", "minimum": 1 }
      },
      "required": ["host", "port"]
    }
  }
}
```

---

## Tool Configurations

### VSCode settings.json

```json
{
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yaml",
    "https://json.schemastore.org/docker-compose.json": "docker-compose*.yaml",
    "kubernetes": "k8s/**/*.yaml"
  },
  "yaml.format.enable": true,
  "yaml.format.singleQuote": false,
  "yaml.validate": true,
  "yaml.completion": true,
  "[yaml]": {
    "editor.insertSpaces": true,
    "editor.tabSize": 2,
    "editor.autoIndent": "advanced"
  }
}
```

---

## References

### Official Documentation

- [YAML Specification](https://yaml.org/spec/1.2/spec.html)
- [YAML Reference Card](https://yaml.org/refcard.html)

### Tools

- [yamllint](https://yamllint.readthedocs.io/) - YAML linter
- [yq](https://github.com/mikefarah/yq) - YAML processor (like jq for YAML)
- [YAML Validator](https://www.yamllint.com/) - Online YAML validator

### Schema Repositories

- [JSON Schema Store](https://www.schemastore.org/) - Common YAML/JSON schemas

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
