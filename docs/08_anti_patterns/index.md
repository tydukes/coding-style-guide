---
title: "Anti-Patterns and Common Mistakes"
description: "Before/after examples showing common anti-patterns and their corrections across
  Terraform, Ansible, Python, TypeScript, Bash, Docker, and CI/CD"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [anti-patterns, best-practices, refactoring, code-quality]
category: "Anti-Patterns"
status: "active"
version: "1.0.0"
---

## Overview

This guide presents common anti-patterns and mistakes across DevOps and software engineering
practices, along with their correct implementations. Each anti-pattern includes:

- ❌ **Bad Example**: The anti-pattern or mistake
- ✅ **Good Example**: The corrected implementation
- 📝 **Explanation**: Why the anti-pattern is problematic and how the correction improves it

---

## Terraform Anti-Patterns

### ❌ Hardcoded Values

**Bad**: Hardcoded values make modules inflexible and environment-specific

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"

  tags = {
    Name        = "production-web-server"
    Environment = "production"
  }
}
```

**Good**: Use variables for configurability

```hcl
variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "environment" {
  description = "Environment name"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "name" {
  description = "Instance name"
  type        = string
}

resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = merge(
    {
      Name        = var.name
      Environment = var.environment
    },
    var.tags
  )
}
```

**Why**: Variables make modules reusable across environments and provide validation

---

### ❌ Missing Lifecycle Rules

**Bad**: Recreating resources destroys data

```hcl
resource "aws_db_instance" "database" {
  identifier     = "mydb"
  instance_class = "db.t3.micro"
  engine         = "postgres"
}
```

**Good**: Protect critical resources with lifecycle rules

```hcl
resource "aws_db_instance" "database" {
  identifier     = "mydb"
  instance_class = "db.t3.micro"
  engine         = "postgres"

  lifecycle {
    prevent_destroy = true

    ignore_changes = [
      password,
    ]
  }

  tags = {
    CriticalData = "true"
  }
}
```

**Why**: Lifecycle rules prevent accidental deletion and ignore transient changes

---

### ❌ No Remote State

**Bad**: Local state causes collaboration and CI/CD issues

```hcl
terraform {
  required_version = ">= 1.0"
}
```

**Good**: Use remote state with locking

```hcl
terraform {
  required_version = ">= 1.0"

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

**Why**: Remote state enables team collaboration, state locking prevents corruption

---

### ❌ Missing Outputs

**Bad**: No way to access resource attributes

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}
```

**Good**: Export important values as outputs

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
}
```

**Why**: Outputs make resource attributes available to other modules and for reference

---

## Ansible Anti-Patterns

### ❌ Using Shell When Module Exists

**Bad**: Shell commands are not idempotent and error-prone

```yaml
- name: Install nginx
  shell: apt-get install -y nginx
```

**Good**: Use native modules for idempotency

```yaml
- name: Install nginx
  ansible.builtin.apt:
    name: nginx
    state: present
    update_cache: yes
  become: yes
```

**Why**: Modules are idempotent, handle errors better, and provide better reporting

---

### ❌ No Error Handling

**Bad**: Failures stop playbook execution abruptly

```yaml
- name: Download file
  ansible.builtin.get_url:
    url: "https://example.com/file.tar.gz"
    dest: "/tmp/file.tar.gz"
```

**Good**: Handle errors gracefully with blocks

```yaml
- name: Download and extract file
  block:
    - name: Download file
      ansible.builtin.get_url:
        url: "https://example.com/file.tar.gz"
        dest: "/tmp/file.tar.gz"
        timeout: 30

    - name: Extract file
      ansible.builtin.unarchive:
        src: "/tmp/file.tar.gz"
        dest: "/opt/app"
        remote_src: yes

  rescue:
    - name: Log failure
      ansible.builtin.debug:
        msg: "Failed to download or extract file"

    - name: Clean up partial download
      ansible.builtin.file:
        path: "/tmp/file.tar.gz"
        state: absent

  always:
    - name: Report status
      ansible.builtin.debug:
        msg: "Download attempt completed"
```

**Why**: Block/rescue/always provides structured error handling and cleanup

---

### ❌ Hardcoded Values in Tasks

**Bad**: Playbooks tied to specific environments

```yaml
- name: Configure application
  ansible.builtin.template:
    src: app.conf.j2
    dest: /etc/app/app.conf
  vars:
    db_host: "prod-db.example.com"
    db_port: 5432
```

**Good**: Use variables and group_vars

```yaml
# group_vars/production.yml
db_host: "prod-db.example.com"
db_port: 5432
environment: "production"

# group_vars/development.yml
db_host: "dev-db.example.com"
db_port: 5432
environment: "development"

# playbook.yml
- name: Configure application
  ansible.builtin.template:
    src: app.conf.j2
    dest: /etc/app/app.conf
  notify: Restart application
```

**Why**: Separating variables makes playbooks reusable across environments

---

### ❌ No Tags for Selective Execution

**Bad**: Must run entire playbook for small changes

```yaml
- name: Update system packages
  ansible.builtin.apt:
    upgrade: dist

- name: Install application
  ansible.builtin.apt:
    name: myapp

- name: Configure application
  ansible.builtin.template:
    src: config.j2
    dest: /etc/myapp/config
```

**Good**: Tag tasks for selective execution

```yaml
- name: Update system packages
  ansible.builtin.apt:
    upgrade: dist
  tags: [system, update]

- name: Install application
  ansible.builtin.apt:
    name: myapp
  tags: [application, install]

- name: Configure application
  ansible.builtin.template:
    src: config.j2
    dest: /etc/myapp/config
  tags: [application, config]
  notify: Restart application
```

**Why**: Tags enable running specific tasks without executing entire playbook

---

## Python Anti-Patterns

### ❌ Mutable Default Arguments

**Bad**: Mutable defaults share state between calls

```python
def add_item(item, items=[]):
    items.append(item)
    return items

result1 = add_item(1)  # [1]
result2 = add_item(2)  # [1, 2] - unexpected!
```

**Good**: Use None and create new instances

```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

result1 = add_item(1)  # [1]
result2 = add_item(2)  # [2] - correct!
```

**Why**: None as default prevents shared mutable state between function calls

---

### ❌ Bare except Clauses

**Bad**: Catches everything, including KeyboardInterrupt and SystemExit

```python
try:
    process_data()
except:
    print("Something went wrong")
```

**Good**: Catch specific exceptions

```python
try:
    process_data()
except ValueError as e:
    logger.error(f"Invalid data: {e}")
    raise
except IOError as e:
    logger.error(f"File error: {e}")
    raise
except Exception as e:
    logger.exception(f"Unexpected error: {e}")
    raise
```

**Why**: Specific exceptions allow proper error handling without masking critical errors

---

### ❌ Using * Imports

**Bad**: Pollutes namespace and makes code unclear

```python
from os import *
from sys import *
from pathlib import *
```

**Good**: Import specific names or use qualified imports

```python
from pathlib import Path
import os
import sys

# or
from pathlib import (
    Path,
    PurePath,
)
```

**Why**: Explicit imports make code more maintainable and prevent naming conflicts

---

### ❌ Not Using Context Managers

**Bad**: File handles may not be closed properly

```python
f = open('file.txt', 'r')
data = f.read()
f.close()  # May not execute if exception occurs
```

**Good**: Use context managers for automatic cleanup

```python
from pathlib import Path

# Modern approach
data = Path('file.txt').read_text()

# Or with context manager
with open('file.txt', 'r') as f:
    data = f.read()
```

**Why**: Context managers ensure resources are properly released even if exceptions occur

---

### ❌ String Concatenation in Loops

**Bad**: Inefficient string building

```python
result = ""
for item in items:
    result += str(item) + ","
```

**Good**: Use join() for string building

```python
result = ",".join(str(item) for item in items)
```

**Why**: join() is O(n) instead of O(n²) for string concatenation

---

## TypeScript Anti-Patterns

### ❌ Using any Type

**Bad**: Defeats TypeScript's type safety

```typescript
function processData(data: any) {
  return data.value.toUpperCase();
}
```

**Good**: Use proper types or unknown

```typescript
interface DataWithValue {
  value: string;
}

function processData(data: DataWithValue): string {
  return data.value.toUpperCase();
}

// For truly unknown data
function processUnknownData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    const typed = data as DataWithValue;
    if (typeof typed.value === 'string') {
      return typed.value.toUpperCase();
    }
  }
  throw new Error('Invalid data structure');
}
```

**Why**: Proper types catch errors at compile time and enable IDE features

---

### ❌ Non-null Assertions Without Validation

**Bad**: Can cause runtime errors

```typescript
const user = users.find(u => u.id === id)!;
console.log(user.name);  // May crash if not found
```

**Good**: Handle null/undefined explicitly

```typescript
const user = users.find(u => u.id === id);
if (!user) {
  throw new Error(`User ${id} not found`);
}
console.log(user.name);  // Safe
```

**Why**: Explicit null checks prevent runtime errors and make intent clear

---

### ❌ Type Assertions Without Validation

**Bad**: Unsafe type coercion

```typescript
const data = JSON.parse(response) as User;
```

**Good**: Validate before asserting

```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'email' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).email === 'string'
  );
}

const parsed = JSON.parse(response);
if (!isUser(parsed)) {
  throw new Error('Invalid user data');
}
const data: User = parsed;  // Safe
```

**Why**: Runtime validation ensures type safety for external data

---

### ❌ Not Using Optional Chaining

**Bad**: Verbose null checks

```typescript
const city = user && user.address && user.address.city;
```

**Good**: Use optional chaining

```typescript
const city = user?.address?.city;
```

**Why**: Optional chaining is more concise and handles null/undefined safely

---

### ❌ Ignoring Promise Rejections

**Bad**: Unhandled promise rejections

```typescript
async function loadData() {
  const data = await fetchData();
  processData(data);
}

loadData();  // No error handling
```

**Good**: Handle promise rejections

```typescript
async function loadData(): Promise<void> {
  try {
    const data = await fetchData();
    processData(data);
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;
  }
}

loadData().catch(error => {
  console.error('Unhandled error:', error);
  // Report to error tracking service
});
```

**Why**: Proper error handling prevents silent failures and aids debugging

---

## Bash Anti-Patterns

### ❌ Not Quoting Variables

**Bad**: Breaks with spaces or special characters

```bash
file=$1
rm $file
```

**Good**: Always quote variable expansions

```bash
file="${1}"
rm "${file}"
```

**Why**: Quoting prevents word splitting and glob expansion

---

### ❌ Using ls for File Iteration

**Bad**: Breaks with spaces and special characters

```bash
for file in $(ls *.txt); do
  process "${file}"
done
```

**Good**: Use glob patterns directly

```bash
for file in *.txt; do
  [[ -f "${file}" ]] || continue
  process "${file}"
done
```

**Why**: Glob patterns handle special characters correctly and avoid parsing ls output

---

### ❌ Not Checking Command Success

**Bad**: Continues after failures

```bash
cd /some/directory
rm -rf *
```

**Good**: Check exit codes and use set -e

```bash
#!/usr/bin/env bash
set -euo pipefail

if ! cd /some/directory; then
  echo "Failed to change directory" >&2
  exit 1
fi

rm -rf ./*
```

**Why**: Checking exit codes prevents cascading failures

---

### ❌ Useless Use of cat

**Bad**: Unnecessary process creation

```bash
cat file.txt | grep "pattern"
```

**Good**: Use input redirection

```bash
grep "pattern" file.txt
# or
grep "pattern" < file.txt
```

**Why**: Eliminates unnecessary process and improves performance

---

### ❌ Not Using [[ ]] for Tests

**Bad**: [ ] is less powerful and error-prone

```bash
if [ $var = "value" ]; then
  echo "match"
fi
```

**Good**: Use [[ ]] for safer tests

```bash
if [[ "${var}" == "value" ]]; then
  echo "match"
fi
```

**Why**: [[ ]] provides pattern matching, regex support, and safer variable handling

---

## Docker Anti-Patterns

### ❌ Using latest Tag

**Bad**: Unpredictable builds and deployments

```dockerfile
FROM node:latest

COPY . .
RUN npm install
```

**Good**: Pin specific versions

```dockerfile
FROM node:20.10.0-alpine3.18

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER node
CMD ["node", "server.js"]
```

**Why**: Specific versions ensure reproducible builds and prevent breaking changes

---

### ❌ Running as Root

**Bad**: Security vulnerability

```dockerfile
FROM ubuntu:22.04

COPY app /app

CMD ["/app/server"]
```

**Good**: Create and use non-root user

```dockerfile
FROM ubuntu:22.04

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY --chown=appuser:appuser app /app

USER appuser

CMD ["/app/server"]
```

**Why**: Running as non-root reduces attack surface

---

### ❌ Not Using Multi-stage Builds

**Bad**: Large images with build dependencies

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["node", "dist/server.js"]
```

**Good**: Use multi-stage builds for smaller images

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /app/dist ./dist
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --chown=appuser:appuser package.json ./

USER appuser

CMD ["node", "dist/server.js"]
```

**Why**: Multi-stage builds reduce final image size by excluding build dependencies

---

### ❌ Installing Unnecessary Packages

**Bad**: Bloated images with security vulnerabilities

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    wget \
    vim \
    git \
    build-essential
```

**Good**: Install only required packages

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

**Why**: Minimal images reduce attack surface and image size

---

### ❌ No Health Checks

**Bad**: Container appears healthy even when app crashes

```dockerfile
FROM node:20-alpine

COPY app /app

CMD ["node", "/app/server.js"]
```

**Good**: Add health checks

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "server.js"]
```

**Why**: Health checks enable container orchestrators to detect and restart failed containers

---

## GitHub Actions Anti-Patterns

### ❌ No Job Dependencies

**Bad**: Jobs run in wrong order or waste resources

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy
```

**Good**: Define job dependencies

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: npm run deploy
```

**Why**: Dependencies ensure jobs run in correct order and only when predecessors succeed

---

### ❌ Not Caching Dependencies

**Bad**: Wastes time reinstalling dependencies

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
  - run: npm install
  - run: npm test
```

**Good**: Cache dependencies

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: 'npm'

  - run: npm ci
  - run: npm test
```

**Why**: Caching significantly reduces build times

---

### ❌ Hardcoded Secrets

**Bad**: Security vulnerability

```yaml
steps:
  - run: |
      curl -H "Authorization: token ghp_xxxxxxxxxxxx" \
        https://api.github.com/repos/...
```

**Good**: Use GitHub Secrets

```yaml
steps:
  - run: |
      curl -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
        https://api.github.com/repos/...
```

**Why**: Secrets are encrypted and not visible in logs

---

### ❌ Not Using Matrix Builds

**Bad**: Duplicate job definitions

```yaml
jobs:
  test-node-18:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm test

  test-node-20:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm test
```

**Good**: Use matrix strategy

```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20, 21]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci
      - run: npm test
```

**Why**: Matrix builds reduce duplication and test multiple versions efficiently

---

### ❌ No Timeout Limits

**Bad**: Stuck jobs consume runner time

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
```

**Good**: Set reasonable timeouts

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - run: npm run build
        timeout-minutes: 10
```

**Why**: Timeouts prevent hung jobs from consuming resources

---

## CI/CD General Anti-Patterns

### ❌ Testing in Production

**Bad**: Deploying untested code

```yaml
deploy:
  stage: deploy
  script:
    - kubectl apply -f k8s/
```

**Good**: Test before deploying

```yaml
test:
  stage: test
  script:
    - npm run test
    - npm run lint
    - npm run build

deploy-staging:
  stage: deploy
  environment: staging
  needs: [test]
  script:
    - kubectl apply -f k8s/ --context=staging

deploy-production:
  stage: deploy
  environment: production
  needs: [deploy-staging]
  when: manual
  only:
    - main
  script:
    - kubectl apply -f k8s/ --context=production
```

**Why**: Staged deployments with testing catch issues before production

---

### ❌ No Rollback Strategy

**Bad**: Failed deployments require manual intervention

```yaml
deploy:
  script:
    - kubectl set image deployment/app app=myapp:${CI_COMMIT_SHA}
```

**Good**: Implement automated rollback

```yaml
deploy:
  script:
    - kubectl set image deployment/app app=myapp:${CI_COMMIT_SHA}
    - kubectl rollout status deployment/app --timeout=5m || kubectl rollout undo deployment/app
```

**Why**: Automated rollback minimizes downtime when deployments fail

---

### ❌ Long-Running Pipelines

**Bad**: 30+ minute pipelines discourage frequent commits

```yaml
test:
  script:
    - run_all_tests.sh  # Takes 45 minutes
```

**Good**: Parallelize and optimize

```yaml
unit-test:
  script:
    - npm run test:unit
  parallel: 4

integration-test:
  script:
    - npm run test:integration
  parallel: 2

e2e-test:
  script:
    - npm run test:e2e
  parallel: 2
```

**Why**: Fast pipelines enable rapid iteration and quick feedback

---

## References

### Official Documentation

- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)
- [Python Anti-Patterns](https://docs.python-guide.org/writing/gotchas/)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

### Additional Resources

- [Code Smells Catalog](https://refactoring.guru/refactoring/smells)
- [Anti-Pattern Catalog](https://sourcemaking.com/antipatterns)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
