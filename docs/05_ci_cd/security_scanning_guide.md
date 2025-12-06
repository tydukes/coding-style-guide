---
title: "Security Scanning Guide"
description: "Comprehensive guide to security scanning tools, vulnerability detection, secret scanning, dependency analysis, and security best practices for DevOps pipelines"
author: "Tyler Dukes"
date: "2025-12-01"
tags: [security, scanning, sast, dast, sca, secrets, vulnerabilities, compliance]
category: "CI/CD"
status: "active"
version: "1.0.0"
---

## Introduction

This guide provides comprehensive coverage of security scanning tools and practices for DevSecOps pipelines.
It covers static analysis (SAST), dynamic analysis (DAST), software composition analysis (SCA), secret detection,
container scanning, infrastructure scanning, and compliance validation.

---

## Table of Contents

1. [Secret Detection](#secret-detection)
2. [Static Application Security Testing (SAST)](#static-application-security-testing-sast)
3. [Software Composition Analysis (SCA)](#software-composition-analysis-sca)
4. [Container Security](#container-security)
5. [Infrastructure Security](#infrastructure-security)
6. [Dynamic Application Security Testing (DAST)](#dynamic-application-security-testing-dast)
7. [Compliance Scanning](#compliance-scanning)
8. [CI/CD Integration](#cicd-integration)
9. [Security Policies](#security-policies)

---

## Secret Detection

### detect-secrets

**Installation**:

```bash
# Using pipx
pipx install detect-secrets

# Verify
detect-secrets --version
```

**Initialize baseline**:

```bash
# Scan current repository
detect-secrets scan > .secrets.baseline

# Audit findings
detect-secrets audit .secrets.baseline

# Update baseline
detect-secrets scan --baseline .secrets.baseline
```

**.secrets.baseline** configuration:

```json
{
  "version": "1.4.0",
  "filters_used": [
    {
      "path": "detect_secrets.filters.allowlist.is_line_allowlisted"
    },
    {
      "path": "detect_secrets.filters.common.is_ignored_due_to_verification_policies",
      "min_level": 2
    },
    {
      "path": "detect_secrets.filters.heuristic.is_indirect_reference"
    },
    {
      "path": "detect_secrets.filters.heuristic.is_likely_id_string"
    },
    {
      "path": "detect_secrets.filters.heuristic.is_potential_uuid"
    }
  ],
  "results": {},
  "generated_at": "2025-12-01T10:00:00Z"
}
```

**Pre-commit integration**:

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args:
          - '--baseline'
          - '.secrets.baseline'
          - '--exclude-files'
          - '\.lock$'
          - '--exclude-files'
          - 'package-lock\.json$'
```

### TruffleHog

**Installation**:

```bash
# macOS
brew install trufflesecurity/trufflehog/trufflehog

# Linux
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | \
  sh -s -- -b /usr/local/bin

# Verify
trufflehog --version
```

**Scan filesystem**:

```bash
# Scan current directory
trufflehog filesystem . --json

# Scan with exclusions
trufflehog filesystem . \
  --exclude-paths .trufflehog-exclude.txt \
  --json

# Scan specific branch
trufflehog git file://. \
  --branch main \
  --json
```

**.trufflehog-exclude.txt**:

```text
# Dependency directories
node_modules/
.venv/
vendor/

# Build outputs
dist/
build/
*.min.js

# Lock files
package-lock.json
yarn.lock
Pipfile.lock

# Images
*.svg
*.png
*.jpg
```

**CI/CD integration**:

```yaml
# GitHub Actions
- name: TruffleHog Secret Scan
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
```

### Gitleaks

**Installation**:

```bash
# macOS
brew install gitleaks

# Linux
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.1/gitleaks_8.18.1_linux_x64.tar.gz
tar xvzf gitleaks_8.18.1_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/

# Verify
gitleaks version
```

**Configuration (.gitleaks.toml)**:

```toml
title = "Gitleaks Configuration"

[extend]
useDefault = true

[[rules]]
id = "generic-api-key"
description = "Generic API Key"
regex = '''(?i)(api[_-]?key|apikey)[_-]?[:=]\s*['"]?([a-z0-9]{32,})['"]?'''
tags = ["api", "key"]

[[rules]]
id = "aws-access-key"
description = "AWS Access Key ID"
regex = '''(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}'''
tags = ["aws", "credentials"]

[[rules]]
id = "private-key"
description = "Private Key"
regex = '''-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----'''
tags = ["private-key"]

[allowlist]
description = "Allowlist"
paths = [
  '''\.lock$''',
  '''node_modules/''',
  '''\.min\.js$''',
]

commits = [
  # Add commit hashes to ignore
]

regexes = [
  '''example\.com''',
  '''placeholder''',
]
```

**Scanning**:

```bash
# Scan entire repository history
gitleaks detect --source . --verbose

# Scan specific commit range
gitleaks detect --source . --log-opts="HEAD~10..HEAD"

# Scan uncommitted changes
gitleaks protect --staged

# Generate report
gitleaks detect --report-path gitleaks-report.json --report-format json
```

---

## Static Application Security Testing (SAST)

### SonarQube/SonarCloud

**Installation (SonarQube)**:

```bash
# Docker
docker run -d --name sonarqube \
  -p 9000:9000 \
  sonarqube:lts-community

# Access at http://localhost:9000
# Default credentials: admin/admin
```

**Scanner installation**:

```bash
# macOS
brew install sonar-scanner

# Linux
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
sudo mv sonar-scanner-5.0.1.3006-linux /opt/sonar-scanner
export PATH=$PATH:/opt/sonar-scanner/bin
```

**sonar-project.properties**:

```properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0

# Source directories
sonar.sources=src
sonar.tests=tests

# Exclude patterns
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.test.ts

# Language-specific settings
sonar.python.version=3.11
sonar.javascript.node.maxspace=4096

# Coverage reports
sonar.python.coverage.reportPaths=coverage.xml
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# Quality gate
sonar.qualitygate.wait=true
```

**Scan execution**:

```bash
# Scan with properties file
sonar-scanner

# Scan with inline parameters
sonar-scanner \
  -Dsonar.projectKey=my-project \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=your-token
```

### Semgrep

**Installation**:

```bash
# Using pipx
pipx install semgrep

# macOS
brew install semgrep

# Verify
semgrep --version
```

**Configuration (.semgrep.yml)**:

```yaml
rules:
  - id: python-sql-injection
    languages: [python]
    message: Potential SQL injection vulnerability
    severity: ERROR
    pattern: |
      cursor.execute(f"...")
    fix: Use parameterized queries

  - id: javascript-eval-usage
    languages: [javascript, typescript]
    message: Avoid using eval()
    severity: WARNING
    pattern: eval(...)

  - id: hardcoded-secret
    languages: [python, javascript, typescript]
    message: Potential hardcoded secret
    severity: ERROR
    pattern-either:
      - pattern: password = "..."
      - pattern: api_key = "..."
      - pattern: secret = "..."
```

**Scanning**:

```bash
# Scan with default rules
semgrep --config=auto .

# Scan with specific rulesets
semgrep --config=p/security-audit \
  --config=p/owasp-top-ten \
  --config=p/python \
  .

# Scan with custom rules
semgrep --config=.semgrep.yml .

# Generate SARIF report
semgrep --config=auto --sarif --output=semgrep.sarif .
```

### Bandit (Python)

**Installation**:

```bash
pipx install bandit
```

**Configuration (.bandit)**:

```yaml
# Bandit configuration
exclude_dirs:
  - /test
  - /tests
  - /.venv
  - /venv

skips:
  - B101  # assert_used
  - B601  # paramiko_calls

tests:
  - B201  # flask_debug_true
  - B301  # pickle
  - B302  # marshal
  - B303  # md5
  - B304  # insecure_cipher
  - B305  # insecure_cipher_mode
  - B306  # insecure_mktemp
  - B307  # eval
  - B308  # mark_safe
  - B501  # request_with_no_cert_validation
  - B502  # ssl_with_bad_version
  - B503  # ssl_with_bad_defaults
```

**Scanning**:

```bash
# Scan directory
bandit -r src/

# Scan with config
bandit -r src/ -c .bandit

# Generate reports
bandit -r src/ -f json -o bandit-report.json
bandit -r src/ -f html -o bandit-report.html

# Only show high severity
bandit -r src/ -ll
```

### ESLint Security Plugins (JavaScript/TypeScript)

**Installation**:

```bash
npm install --save-dev \
  eslint-plugin-security \
  eslint-plugin-no-secrets \
  eslint-plugin-xss
```

**.eslintrc.json**:

```json
{
  "plugins": ["security", "no-secrets", "xss"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "warn",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-non-literal-require": "warn",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "error",
    "no-secrets/no-secrets": "error",
    "xss/no-mixed-html": "error"
  }
}
```

---

## Software Composition Analysis (SCA)

### Snyk

**Installation**:

```bash
# npm
npm install -g snyk

# Homebrew
brew install snyk

# Authenticate
snyk auth

# Verify
snyk --version
```

**Scanning**:

```bash
# Test dependencies
snyk test

# Test and monitor
snyk monitor

# Test with severity threshold
snyk test --severity-threshold=high

# Test Docker image
snyk container test myapp:latest

# Test infrastructure as code
snyk iac test terraform/
```

**snyk.json configuration**:

```json
{
  "language-settings": {
    "python": {
      "targetFile": "requirements.txt"
    }
  },
  "exclude": {
    "global": [
      "node_modules/**",
      ".venv/**",
      "test/**"
    ]
  },
  "severity-threshold": "medium",
  "ignore-policy": ".snyk"
}
```

**.snyk policy file**:

```yaml
# Snyk policy file
version: v1.25.0

ignore:
  # Ignore specific vulnerabilities
  SNYK-PYTHON-REQUESTS-12345:
    - '*':
        reason: False positive
        expires: 2025-12-31T00:00:00.000Z

  # Ignore all low severity
  '*':
    - '*':
        reason: Low severity
        expires: 2025-12-31T00:00:00.000Z
      severity: low

patch: {}
```

### OWASP Dependency-Check

**Installation**:

```bash
# Download
VERSION=9.0.9
wget https://github.com/jeremylong/DependencyCheck/releases/download/v${VERSION}/dependency-check-${VERSION}-release.zip
unzip dependency-check-${VERSION}-release.zip
sudo mv dependency-check /opt/
export PATH=$PATH:/opt/dependency-check/bin

# Verify
dependency-check.sh --version
```

**Scanning**:

```bash
# Scan project
dependency-check.sh \
  --project "My Project" \
  --scan ./src \
  --out ./reports \
  --format HTML \
  --format JSON

# Scan with suppression file
dependency-check.sh \
  --project "My Project" \
  --scan ./src \
  --suppression dependency-check-suppressions.xml \
  --out ./reports
```

**dependency-check-suppressions.xml**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
  <suppress>
    <notes>False positive</notes>
    <cve>CVE-2021-12345</cve>
  </suppress>
  <suppress>
    <notes>Not applicable to our use case</notes>
    <gav regex="true">^org\.example:.*:.*$</gav>
    <cpe>cpe:/a:example:library</cpe>
  </suppress>
</suppressions>
```

### Safety (Python)

**Installation**:

```bash
pipx install safety
```

**Scanning**:

```bash
# Check requirements file
safety check -r requirements.txt

# Check installed packages
safety check

# Check with policy file
safety check --policy-file .safety-policy.yml

# Generate JSON report
safety check --json --output safety-report.json
```

**.safety-policy.yml**:

```yaml
# Safety policy file
security:
  # Ignore specific vulnerabilities
  ignore-vulnerabilities:
    - id: 12345
      reason: False positive
      expires: '2025-12-31'

  # Ignore packages
  ignore-packages:
    - name: example-package
      version: '1.0.0'
      reason: Known issue, waiting for patch

  # Severity threshold
  continue-on-vulnerability-error: false
```

---

## Container Security

### Trivy

**Installation**:

```bash
# macOS
brew install aquasecurity/trivy/trivy

# Ubuntu/Debian
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | \
  sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | \
  sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install trivy

# Verify
trivy --version
```

**Scanning**:

```bash
# Scan Docker image
trivy image myapp:latest

# Scan with severity filter
trivy image --severity HIGH,CRITICAL myapp:latest

# Scan filesystem
trivy fs .

# Scan Git repository
trivy repo https://github.com/user/repo

# Generate reports
trivy image --format json --output trivy-report.json myapp:latest
trivy image --format sarif --output trivy.sarif myapp:latest

# Scan Kubernetes manifests
trivy k8s --report summary cluster
```

**trivy.yaml configuration**:

```yaml
# Trivy configuration
severity:
  - CRITICAL
  - HIGH

vulnerability:
  type:
    - os
    - library

scan:
  skip-dirs:
    - /test
    - /tests

exit-code: 1
```

### Grype

**Installation**:

```bash
# macOS
brew install grype

# Linux
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Verify
grype version
```

**Scanning**:

```bash
# Scan image
grype myapp:latest

# Scan with output format
grype myapp:latest -o json > grype-report.json

# Scan directory
grype dir:.

# Scan with fail on severity
grype myapp:latest --fail-on high
```

**.grype.yaml**:

```yaml
# Grype configuration
output: json

fail-on-severity: high

ignore:
  - vulnerability: CVE-2021-12345
    fix-state: wont-fix
    package:
      name: example-package
      version: 1.0.0

registry:
  insecure-skip-tls-verify: false
  insecure-use-http: false
```

### Hadolint (Dockerfile)

**Configuration (.hadolint.yaml)**:

```yaml
ignored:
  - DL3008  # Pin versions in apt-get install
  - DL3009  # Delete apt-get lists after installing
  - DL3018  # Pin versions in apk add

trustedRegistries:
  - docker.io
  - gcr.io
  - ghcr.io
  - quay.io

failure-threshold: warning

override:
  error:
    - DL3001  # HTTPS for registry
  warning:
    - DL3002  # Last USER should not be root
  info:
    - DL3032  # yum clean
```

---

## Infrastructure Security

### Checkov

**Installation**:

```bash
pipx install checkov
```

**Scanning**:

```bash
# Scan Terraform
checkov -d terraform/

# Scan with specific framework
checkov --framework terraform -d terraform/

# Scan CloudFormation
checkov --framework cloudformation -f template.yaml

# Scan Kubernetes
checkov --framework kubernetes -f deployment.yaml

# Generate reports
checkov -d terraform/ --output json --output-file checkov-report.json
checkov -d terraform/ --output sarif --output-file checkov.sarif

# Skip specific checks
checkov -d terraform/ --skip-check CKV_AWS_1,CKV_AWS_2
```

**.checkov.yaml**:

```yaml
# Checkov configuration
framework:
  - terraform
  - cloudformation
  - kubernetes
  - dockerfile

skip-check:
  - CKV_AWS_1
  - CKV_AWS_2

soft-fail: false

output: cli

compact: false

quiet: false

directory:
  - terraform/
  - cloudformation/
```

### tfsec

**Installation**:

```bash
# macOS
brew install tfsec

# Linux
wget https://github.com/aquasecurity/tfsec/releases/download/v1.28.4/tfsec-linux-amd64
chmod +x tfsec-linux-amd64
sudo mv tfsec-linux-amd64 /usr/local/bin/tfsec

# Verify
tfsec --version
```

**Scanning**:

```bash
# Scan Terraform directory
tfsec .

# Scan with severity filter
tfsec --minimum-severity HIGH .

# Generate reports
tfsec --format json --out tfsec-report.json .
tfsec --format sarif --out tfsec.sarif .

# Run specific checks
tfsec --include-passed --include-ignored .
```

**tfsec.json configuration**:

```json
{
  "severity_overrides": {
    "aws-s3-enable-versioning": "HIGH"
  },
  "exclude": [
    "aws-vpc-no-public-ingress-sgr"
  ],
  "minimum_severity": "MEDIUM"
}
```

### Terrascan

**Installation**:

```bash
# macOS
brew install terrascan

# Linux
curl -L "$(curl -s https://api.github.com/repos/tenable/terrascan/releases/latest | \
  grep -o -E 'https://.+?_Linux_x86_64.tar.gz')" > terrascan.tar.gz
tar -xf terrascan.tar.gz terrascan
sudo mv terrascan /usr/local/bin/

# Verify
terrascan version
```

**Scanning**:

```bash
# Scan Terraform
terrascan scan -t terraform -d .

# Scan with specific policy
terrascan scan -t terraform -p aws -d .

# Generate reports
terrascan scan -t terraform -d . -o json > terrascan-report.json
terrascan scan -t terraform -d . -o sarif > terrascan.sarif

# Skip rules
terrascan scan -t terraform -d . --skip-rules AWS.S3Bucket.DS.High.1043
```

---

## Dynamic Application Security Testing (DAST)

### OWASP ZAP

**Installation**:

```bash
# Docker
docker pull zaproxy/zap-stable

# Run ZAP in daemon mode
docker run -u zap -p 8080:8080 \
  -d zaproxy/zap-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 \
  -config api.disablekey=true
```

**Baseline scan**:

```bash
# Baseline scan
docker run -v $(pwd):/zap/wrk/:rw \
  zaproxy/zap-stable \
  zap-baseline.py \
  -t https://example.com \
  -r zap-baseline-report.html

# Full scan
docker run -v $(pwd):/zap/wrk/:rw \
  zaproxy/zap-stable \
  zap-full-scan.py \
  -t https://example.com \
  -r zap-full-report.html

# API scan
docker run -v $(pwd):/zap/wrk/:rw \
  zaproxy/zap-stable \
  zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -r zap-api-report.html
```

### Nuclei

**Installation**:

```bash
# Go install
go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest

# Verify
nuclei -version
```

**Scanning**:

```bash
# Update templates
nuclei -update-templates

# Scan target
nuclei -u https://example.com

# Scan with severity filter
nuclei -u https://example.com -severity critical,high

# Scan with specific templates
nuclei -u https://example.com -t cves/ -t vulnerabilities/

# Generate report
nuclei -u https://example.com -json -o nuclei-report.json
```

---

## Compliance Scanning

### OpenSCAP

**Installation**:

```bash
# Ubuntu/Debian
sudo apt install libopenscap8 openscap-scanner

# RHEL/CentOS
sudo yum install openscap-scanner
```

**Scanning**:

```bash
# Scan system
sudo oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_pci-dss \
  --results scan-results.xml \
  --report scan-report.html \
  /usr/share/xml/scap/ssg/content/ssg-ubuntu2004-ds.xml
```

### Chef InSpec

**Installation**:

```bash
# macOS/Linux
curl https://omnitruck.chef.io/install.sh | sudo bash -s -- -P inspec

# Verify
inspec --version
```

**Profile example**:

```ruby
# controls/example.rb
control 'ssh-config' do
  impact 1.0
  title 'SSH Configuration'
  desc 'Ensure SSH is configured securely'

  describe sshd_config do
    its('PermitRootLogin') { should eq 'no' }
    its('PasswordAuthentication') { should eq 'no' }
    its('Protocol') { should eq '2' }
  end
end
```

**Scanning**:

```bash
# Run profile
inspec exec /path/to/profile

# Run with reporter
inspec exec /path/to/profile --reporter json:inspec-report.json

# Run remote
inspec exec /path/to/profile -t ssh://user@host
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Security Scans

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten

  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  infrastructure-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
          framework: terraform
          output_format: sarif
          output_file_path: checkov.sarif

      - name: Upload Checkov results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: checkov.sarif
```

### GitLab CI

```yaml
stages:
  - security

secret-scan:
  stage: security
  image: trufflesecurity/trufflehog:latest
  script:
    - trufflehog filesystem . --json --fail

sast:
  stage: security
  image: returntocorp/semgrep:latest
  script:
    - semgrep --config=auto --sarif --output=semgrep.sarif .
  artifacts:
    reports:
      sast: semgrep.sarif

dependency-scan:
  stage: security
  image: snyk/snyk:python
  script:
    - snyk test --severity-threshold=high --json > snyk-report.json || true
  artifacts:
    reports:
      dependency_scanning: snyk-report.json

container-scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy image --severity HIGH,CRITICAL --format sarif --output trivy.sarif $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  artifacts:
    reports:
      container_scanning: trivy.sarif

iac-scan:
  stage: security
  image: bridgecrew/checkov:latest
  script:
    - checkov -d terraform/ --framework terraform --output sarif --output-file checkov.sarif
  artifacts:
    reports:
      sast: checkov.sarif
```

### Jenkins

```groovy
pipeline {
    agent any

    stages {
        stage('Security Scans') {
            parallel {
                stage('Secret Scan') {
                    steps {
                        sh '''
                            docker run --rm -v $(pwd):/scan \
                                trufflesecurity/trufflehog:latest \
                                filesystem /scan --json --fail
                        '''
                    }
                }

                stage('SAST') {
                    steps {
                        sh '''
                            docker run --rm -v $(pwd):/src \
                                returntocorp/semgrep:latest \
                                semgrep --config=auto /src
                        '''
                    }
                }

                stage('Dependency Scan') {
                    steps {
                        sh '''
                            snyk test --severity-threshold=high \
                                --json > snyk-report.json || true
                        '''
                        archiveArtifacts artifacts: 'snyk-report.json'
                    }
                }

                stage('Container Scan') {
                    steps {
                        sh '''
                            trivy image --severity HIGH,CRITICAL \
                                --format json \
                                --output trivy-report.json \
                                myapp:${GIT_COMMIT}
                        '''
                        archiveArtifacts artifacts: 'trivy-report.json'
                    }
                }
            }
        }
    }
}
```

---

## Security Policies

### Security.txt

Place in `/.well-known/security.txt`:

```text
Contact: security@example.com
Expires: 2026-12-31T23:59:59.000Z
Encryption: https://example.com/pgp-key.txt
Acknowledgments: https://example.com/security-hall-of-fame
Preferred-Languages: en
Canonical: https://example.com/.well-known/security.txt
Policy: https://example.com/security-policy
```

### Vulnerability Disclosure Policy

```markdown
# Vulnerability Disclosure Policy

## Reporting

Please report security vulnerabilities to: security@example.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fixes (optional)

## Response Timeline

- **24 hours**: Initial response
- **7 days**: Preliminary assessment
- **30 days**: Fix development
- **90 days**: Public disclosure

## Safe Harbor

We will not pursue legal action against researchers who:
- Make good faith efforts to comply with this policy
- Do not access or modify user data
- Do not disrupt our services
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Security Guidelines](https://www.nist.gov/cybersecurity)
- [Cloud Security Alliance](https://cloudsecurityalliance.org/)

---

**Next Steps:**

- Review the [AI Validation Pipeline](ai_validation_pipeline.md) for complete CI/CD security integration
- See [Pre-commit Hooks Guide](precommit_hooks_guide.md) for local security checks
- Check [GitHub Actions Guide](github_actions_guide.md) for security workflows
