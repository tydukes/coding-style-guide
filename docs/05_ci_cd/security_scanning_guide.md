---
title: "Security Scanning Guide"
description: "Comprehensive guide to SAST, DAST, SCA security testing with tool selection, severity classification, false positive handling, security gates, and remediation SLAs"
author: "Tyler Dukes"
tags: [security, scanning, sast, dast, sca, secrets, vulnerabilities, compliance, semgrep, bandit, gosec, zap, nuclei, trivy, devsecops]
category: "CI/CD"
status: "active"
---

## Introduction

This guide provides comprehensive coverage of security scanning tools and practices for DevSecOps pipelines.
It covers static analysis (SAST), dynamic analysis (DAST), software composition analysis (SCA), secret detection,
container scanning, infrastructure scanning, and compliance validation.

---

## Table of Contents

1. [Secret Detection](#secret-detection)
2. [Static Application Security Testing (SAST)](#static-application-security-testing-sast)
3. [SAST Tool Selection by Language](#sast-tool-selection-by-language)
4. [Software Composition Analysis (SCA)](#software-composition-analysis-sca)
5. [Container Security](#container-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Dynamic Application Security Testing (DAST)](#dynamic-application-security-testing-dast)
8. [Compliance Scanning](#compliance-scanning)
9. [Severity Classification](#severity-classification)
10. [False Positive Management](#false-positive-management)
11. [Security Gate Policies](#security-gate-policies)
12. [Remediation SLAs](#remediation-slas)
13. [Issue Tracker Integration](#issue-tracker-integration)
14. [CI/CD Integration](#cicd-integration)
15. [Security Policies](#security-policies)

---

## Secret Detection

### detect-secrets

**Installation**:

```bash
## Using pipx
pipx install detect-secrets

## Verify
detect-secrets --version
```

**Initialize baseline**:

```bash
## Scan current repository
detect-secrets scan > .secrets.baseline

## Audit findings
detect-secrets audit .secrets.baseline

## Update baseline
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
## macOS
brew install trufflesecurity/trufflehog/trufflehog

## Linux
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | \
  sh -s -- -b /usr/local/bin

## Verify
trufflehog --version
```

**Scan filesystem**:

```bash
## Scan current directory
trufflehog filesystem . --json

## Scan with exclusions
trufflehog filesystem . \
  --exclude-paths .trufflehog-exclude.txt \
  --json

## Scan specific branch
trufflehog git file://. \
  --branch main \
  --json
```

**.trufflehog-exclude.txt**:

```text
## Dependency directories
node_modules/
.venv/
vendor/

## Build outputs
dist/
build/
*.min.js

## Lock files
package-lock.json
yarn.lock
Pipfile.lock

## Images
*.svg
*.png
*.jpg
```

**CI/CD integration**:

```yaml
## GitHub Actions
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
## macOS
brew install gitleaks

## Linux
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.1/gitleaks_8.18.1_linux_x64.tar.gz
tar xvzf gitleaks_8.18.1_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/

## Verify
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
## Scan entire repository history
gitleaks detect --source . --verbose

## Scan specific commit range
gitleaks detect --source . --log-opts="HEAD~10..HEAD"

## Scan uncommitted changes
gitleaks protect --staged

## Generate report
gitleaks detect --report-path gitleaks-report.json --report-format json
```

---

## Static Application Security Testing (SAST)

### SonarQube/SonarCloud

**Installation (SonarQube)**:

```bash
## Docker
docker run -d --name sonarqube \
  -p 9000:9000 \
  sonarqube:lts-community

## Access at http://localhost:9000
## Default credentials: admin/admin
```

**Scanner installation**:

```bash
## macOS
brew install sonar-scanner

## Linux
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

## Source directories
sonar.sources=src
sonar.tests=tests

## Exclude patterns
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.test.ts

## Language-specific settings
sonar.python.version=3.11
sonar.javascript.node.maxspace=4096

## Coverage reports
sonar.python.coverage.reportPaths=coverage.xml
sonar.javascript.lcov.reportPaths=coverage/lcov.info

## Quality gate
sonar.qualitygate.wait=true
```

**Scan execution**:

```bash
## Scan with properties file
sonar-scanner

## Scan with inline parameters
sonar-scanner \
  -Dsonar.projectKey=my-project \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=your-token
```

### Semgrep

**Installation**:

```bash
## Using pipx
pipx install semgrep

## macOS
brew install semgrep

## Verify
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
## Scan with default rules
semgrep --config=auto .

## Scan with specific rulesets
semgrep --config=p/security-audit \
  --config=p/owasp-top-ten \
  --config=p/python \
  .

## Scan with custom rules
semgrep --config=.semgrep.yml .

## Generate SARIF report
semgrep --config=auto --sarif --output=semgrep.sarif .
```

### Bandit (Python)

**Installation**:

```bash
pipx install bandit
```

**Configuration (.bandit)**:

```yaml
## Bandit configuration
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
## Scan directory
bandit -r src/

## Scan with config
bandit -r src/ -c .bandit

## Generate reports
bandit -r src/ -f json -o bandit-report.json
bandit -r src/ -f html -o bandit-report.html

## Only show high severity
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

### gosec (Go)

**Installation**:

```bash
## Go install
go install github.com/securego/gosec/v2/cmd/gosec@latest

## Verify
gosec --version
```

**Configuration (.gosec.json)**:

```json
{
  "global": {
    "audit": "enabled",
    "nosec": "enabled",
    "showignored": false
  },
  "rules": {
    "G101": "enabled",
    "G102": "enabled",
    "G103": "enabled",
    "G104": "enabled",
    "G106": "enabled",
    "G107": "enabled",
    "G108": "enabled",
    "G109": "enabled",
    "G110": "enabled",
    "G201": "enabled",
    "G202": "enabled",
    "G203": "enabled",
    "G204": "enabled",
    "G301": "enabled",
    "G302": "enabled",
    "G303": "enabled",
    "G304": "enabled",
    "G305": "enabled",
    "G306": "enabled",
    "G307": "enabled",
    "G401": "enabled",
    "G402": "enabled",
    "G403": "enabled",
    "G404": "enabled",
    "G501": "enabled",
    "G502": "enabled",
    "G503": "enabled",
    "G504": "enabled",
    "G505": "enabled",
    "G601": "enabled"
  }
}
```

**Scanning**:

```bash
## Scan current directory
gosec ./...

## Scan with specific rules
gosec -include=G101,G102,G103 ./...

## Exclude rules
gosec -exclude=G104 ./...

## Generate reports
gosec -fmt=json -out=gosec-report.json ./...
gosec -fmt=sarif -out=gosec.sarif ./...
gosec -fmt=html -out=gosec-report.html ./...

## Scan with confidence level
gosec -confidence=medium ./...

## Scan with severity level
gosec -severity=high ./...
```

**gosec rules reference**:

```text
┌───────┬───────────────────────────────────────────────────────────────┐
│ Rule  │ Description                                                   │
├───────┼───────────────────────────────────────────────────────────────┤
│ G101  │ Look for hard coded credentials                               │
│ G102  │ Bind to all interfaces                                        │
│ G103  │ Audit the use of unsafe block                                 │
│ G104  │ Audit errors not checked                                      │
│ G106  │ Audit the use of ssh.InsecureIgnoreHostKey                    │
│ G107  │ Url provided to HTTP request as taint input                   │
│ G108  │ Profiling endpoint automatically exposed on /debug/pprof      │
│ G109  │ Potential Integer overflow made by strconv.Atoi               │
│ G110  │ Potential DoS via decompression bomb                          │
│ G201  │ SQL query construction using format string                    │
│ G202  │ SQL query construction using string concatenation             │
│ G203  │ Use of unescaped data in HTML templates                       │
│ G204  │ Audit use of command execution                                │
│ G301  │ Poor file permissions used when creating a directory          │
│ G302  │ Poor file permissions used with chmod                         │
│ G303  │ Creating tempfile using a predictable path                    │
│ G304  │ File path provided as taint input                             │
│ G305  │ File traversal when extracting zip/tar archive                │
│ G306  │ Poor file permissions used when writing to a new file         │
│ G307  │ Deferring a method which returns an error                     │
│ G401  │ Detect the usage of DES, RC4, MD5 or SHA1                     │
│ G402  │ Look for bad TLS connection settings                          │
│ G403  │ Ensure minimum RSA key length of 2048 bits                    │
│ G404  │ Insecure random number source (rand)                          │
│ G501  │ Import blocklist: crypto/md5                                  │
│ G502  │ Import blocklist: crypto/des                                  │
│ G503  │ Import blocklist: crypto/rc4                                  │
│ G504  │ Import blocklist: net/http/cgi                                │
│ G505  │ Import blocklist: crypto/sha1                                 │
│ G601  │ Implicit memory aliasing of items from a range statement      │
└───────┴───────────────────────────────────────────────────────────────┘
```

**Pre-commit integration**:

```yaml
repos:
  - repo: https://github.com/securego/gosec
    rev: v2.18.2
    hooks:
      - id: gosec
        args: ['-exclude=G104', './...']
```

**CI/CD integration**:

```yaml
## GitHub Actions
- name: Run gosec
  uses: securego/gosec@master
  with:
    args: '-no-fail -fmt sarif -out gosec.sarif ./...'

- name: Upload gosec results
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: gosec.sarif
```

---

## SAST Tool Selection by Language

### Tool Recommendation Matrix

```text
┌─────────────────┬────────────────────────────────────────────────────────────┐
│ Language        │ Recommended Tools (Primary → Secondary)                    │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Python          │ Bandit → Semgrep → SonarQube                               │
│ JavaScript/TS   │ ESLint Security → Semgrep → SonarQube                      │
│ Go              │ gosec → Semgrep → SonarQube                                │
│ Java            │ SpotBugs + FindSecBugs → Semgrep → SonarQube               │
│ C/C++           │ Flawfinder → cppcheck → SonarQube                          │
│ Ruby            │ Brakeman → Semgrep → SonarQube                             │
│ PHP             │ PHPStan + Psalm → Semgrep → SonarQube                      │
│ C#/.NET         │ Security Code Scan → Semgrep → SonarQube                   │
│ Kotlin          │ detekt → Semgrep → SonarQube                               │
│ Swift           │ SwiftLint → Semgrep                                        │
│ Rust            │ cargo-audit → Semgrep                                      │
│ Terraform       │ tfsec → Checkov → Terrascan                                │
│ CloudFormation  │ cfn-lint → Checkov                                         │
│ Kubernetes      │ kubesec → Checkov → Trivy                                  │
│ Dockerfile      │ Hadolint → Trivy                                           │
│ Shell/Bash      │ ShellCheck → Semgrep                                       │
│ SQL             │ sqlfluff → Semgrep                                         │
└─────────────────┴────────────────────────────────────────────────────────────┘
```

### Multi-Language Projects Configuration

```yaml
# .security-scan.yml - Unified security scanning configuration
version: "1.0"

languages:
  python:
    enabled: true
    tools:
      - name: bandit
        config: .bandit
        severity_threshold: medium
        fail_on_error: true
      - name: semgrep
        config: p/python
        fail_on_error: true

  javascript:
    enabled: true
    tools:
      - name: eslint-security
        config: .eslintrc.json
        fail_on_error: true
      - name: semgrep
        config: p/javascript
        fail_on_error: true

  typescript:
    enabled: true
    tools:
      - name: eslint-security
        config: .eslintrc.json
        fail_on_error: true
      - name: semgrep
        config: p/typescript
        fail_on_error: true

  go:
    enabled: true
    tools:
      - name: gosec
        config: .gosec.json
        severity_threshold: medium
        fail_on_error: true
      - name: semgrep
        config: p/golang
        fail_on_error: true

  java:
    enabled: true
    tools:
      - name: spotbugs
        config: spotbugs-exclude.xml
        fail_on_error: true
      - name: semgrep
        config: p/java
        fail_on_error: true

global:
  semgrep:
    configs:
      - p/security-audit
      - p/owasp-top-ten
      - p/secrets
    exclude_paths:
      - "**/test/**"
      - "**/tests/**"
      - "**/vendor/**"
      - "**/node_modules/**"

  sonarqube:
    enabled: true
    quality_gate: true
    server: ${SONAR_HOST_URL}
```

### Language-Specific Semgrep Rulesets

```yaml
# .semgrep/rules/python-security.yml
rules:
  - id: python-sql-injection-format-string
    languages: [python]
    message: |
      Potential SQL injection using format string.
      Use parameterized queries instead.
    severity: ERROR
    metadata:
      cwe: "CWE-89"
      owasp: "A03:2021 - Injection"
      category: security
    patterns:
      - pattern-either:
          - pattern: cursor.execute(f"...")
          - pattern: cursor.execute("..." % ...)
          - pattern: cursor.execute("..." + ...)
          - pattern: $DB.execute(f"...")
          - pattern: $DB.raw(f"...")
    fix: |
      Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))

  - id: python-dangerous-deserialization
    languages: [python]
    message: |
      Dangerous deserialization detected. pickle/marshal can execute arbitrary code.
    severity: ERROR
    metadata:
      cwe: "CWE-502"
      owasp: "A08:2021 - Software and Data Integrity Failures"
    pattern-either:
      - pattern: pickle.loads(...)
      - pattern: pickle.load(...)
      - pattern: marshal.loads(...)
      - pattern: yaml.load(..., Loader=yaml.Loader)
      - pattern: yaml.load(..., Loader=yaml.UnsafeLoader)

  - id: python-command-injection
    languages: [python]
    message: |
      Potential command injection. Use subprocess with shell=False.
    severity: ERROR
    metadata:
      cwe: "CWE-78"
      owasp: "A03:2021 - Injection"
    pattern-either:
      - pattern: os.system($CMD)
      - pattern: os.popen($CMD)
      - pattern: subprocess.call($CMD, shell=True, ...)
      - pattern: subprocess.run($CMD, shell=True, ...)
      - pattern: subprocess.Popen($CMD, shell=True, ...)

  - id: python-weak-cryptography
    languages: [python]
    message: |
      Weak cryptographic algorithm detected. Use SHA-256 or stronger.
    severity: WARNING
    metadata:
      cwe: "CWE-327"
    pattern-either:
      - pattern: hashlib.md5(...)
      - pattern: hashlib.sha1(...)
      - pattern: Crypto.Hash.MD5.new(...)
      - pattern: Crypto.Hash.SHA.new(...)
```

```yaml
# .semgrep/rules/javascript-security.yml
rules:
  - id: js-xss-innerhtml
    languages: [javascript, typescript]
    message: |
      Potential XSS via innerHTML. Use textContent or sanitize input.
    severity: ERROR
    metadata:
      cwe: "CWE-79"
      owasp: "A03:2021 - Injection"
    pattern-either:
      - pattern: $EL.innerHTML = $INPUT
      - pattern: document.write($INPUT)
      - pattern: document.writeln($INPUT)

  - id: js-prototype-pollution
    languages: [javascript, typescript]
    message: |
      Potential prototype pollution vulnerability.
    severity: ERROR
    metadata:
      cwe: "CWE-1321"
    pattern-either:
      - pattern: $OBJ[...][...] = ...
      - pattern: Object.assign($OBJ, $INPUT)
      - pattern: _.merge($OBJ, $INPUT)
      - pattern: $.extend(true, $OBJ, $INPUT)

  - id: js-insecure-randomness
    languages: [javascript, typescript]
    message: |
      Math.random() is not cryptographically secure.
      Use crypto.randomBytes() or crypto.getRandomValues().
    severity: WARNING
    metadata:
      cwe: "CWE-338"
    patterns:
      - pattern: Math.random()
      - pattern-not-inside: |
          // nosec
          ...

  - id: js-hardcoded-jwt-secret
    languages: [javascript, typescript]
    message: |
      Hardcoded JWT secret detected. Use environment variables.
    severity: ERROR
    metadata:
      cwe: "CWE-798"
    pattern-either:
      - pattern: jwt.sign($PAYLOAD, "...", ...)
      - pattern: jwt.verify($TOKEN, "...", ...)
      - pattern: |
          const secret = "..."
          ...
          jwt.sign($PAYLOAD, secret, ...)
```

```yaml
# .semgrep/rules/go-security.yml
rules:
  - id: go-sql-injection
    languages: [go]
    message: |
      Potential SQL injection. Use parameterized queries.
    severity: ERROR
    metadata:
      cwe: "CWE-89"
      owasp: "A03:2021 - Injection"
    pattern-either:
      - pattern: $DB.Query(fmt.Sprintf(...))
      - pattern: $DB.Exec(fmt.Sprintf(...))
      - pattern: $DB.QueryRow(fmt.Sprintf(...))
      - pattern: $DB.Query($QUERY + ...)
      - pattern: $DB.Exec($QUERY + ...)

  - id: go-path-traversal
    languages: [go]
    message: |
      Potential path traversal vulnerability. Validate file paths.
    severity: ERROR
    metadata:
      cwe: "CWE-22"
    patterns:
      - pattern-either:
          - pattern: os.Open($PATH)
          - pattern: os.ReadFile($PATH)
          - pattern: ioutil.ReadFile($PATH)
      - pattern-not-inside: |
          if !strings.Contains($PATH, "..") {
            ...
          }

  - id: go-ssrf
    languages: [go]
    message: |
      Potential SSRF vulnerability. Validate and allowlist URLs.
    severity: ERROR
    metadata:
      cwe: "CWE-918"
    patterns:
      - pattern-either:
          - pattern: http.Get($URL)
          - pattern: http.Post($URL, ...)
          - pattern: $CLIENT.Get($URL)
          - pattern: $CLIENT.Post($URL, ...)
      - metavariable-regex:
          metavariable: $URL
          regex: '.*\$.*'
```

---

## Software Composition Analysis (SCA)

### Snyk

**Installation**:

```bash
## npm
npm install -g snyk

## Homebrew
brew install snyk

## Authenticate
snyk auth

## Verify
snyk --version
```

**Scanning**:

```bash
## Test dependencies
snyk test

## Test and monitor
snyk monitor

## Test with severity threshold
snyk test --severity-threshold=high

## Test Docker image
snyk container test myapp:latest

## Test infrastructure as code
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
## Snyk policy file
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
## Download
VERSION=9.0.9
wget https://github.com/jeremylong/DependencyCheck/releases/download/v${VERSION}/dependency-check-${VERSION}-release.zip
unzip dependency-check-${VERSION}-release.zip
sudo mv dependency-check /opt/
export PATH=$PATH:/opt/dependency-check/bin

## Verify
dependency-check.sh --version
```

**Scanning**:

```bash
## Scan project
dependency-check.sh \
  --project "My Project" \
  --scan ./src \
  --out ./reports \
  --format HTML \
  --format JSON

## Scan with suppression file
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
## Check requirements file
safety check -r requirements.txt

## Check installed packages
safety check

## Check with policy file
safety check --policy-file .safety-policy.yml

## Generate JSON report
safety check --json --output safety-report.json
```

**.safety-policy.yml**:

```yaml
## Safety policy file
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
## macOS
brew install aquasecurity/trivy/trivy

## Ubuntu/Debian
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | \
  sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | \
  sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install trivy

## Verify
trivy --version
```

**Scanning**:

```bash
## Scan Docker image
trivy image myapp:latest

## Scan with severity filter
trivy image --severity HIGH,CRITICAL myapp:latest

## Scan filesystem
trivy fs .

## Scan Git repository
trivy repo https://github.com/user/repo

## Generate reports
trivy image --format json --output trivy-report.json myapp:latest
trivy image --format sarif --output trivy.sarif myapp:latest

## Scan Kubernetes manifests
trivy k8s --report summary cluster
```

**trivy.yaml configuration**:

```yaml
## Trivy configuration
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
## macOS
brew install grype

## Linux
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

## Verify
grype version
```

**Scanning**:

```bash
## Scan image
grype myapp:latest

## Scan with output format
grype myapp:latest -o json > grype-report.json

## Scan directory
grype dir:.

## Scan with fail on severity
grype myapp:latest --fail-on high
```

**.grype.yaml**:

```yaml
## Grype configuration
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
## Scan Terraform
checkov -d terraform/

## Scan with specific framework
checkov --framework terraform -d terraform/

## Scan CloudFormation
checkov --framework cloudformation -f template.yaml

## Scan Kubernetes
checkov --framework kubernetes -f deployment.yaml

## Generate reports
checkov -d terraform/ --output json --output-file checkov-report.json
checkov -d terraform/ --output sarif --output-file checkov.sarif

## Skip specific checks
checkov -d terraform/ --skip-check CKV_AWS_1,CKV_AWS_2
```

**.checkov.yaml**:

```yaml
## Checkov configuration
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
## macOS
brew install tfsec

## Linux
wget https://github.com/aquasecurity/tfsec/releases/download/v1.28.4/tfsec-linux-amd64
chmod +x tfsec-linux-amd64
sudo mv tfsec-linux-amd64 /usr/local/bin/tfsec

## Verify
tfsec --version
```

**Scanning**:

```bash
## Scan Terraform directory
tfsec .

## Scan with severity filter
tfsec --minimum-severity HIGH .

## Generate reports
tfsec --format json --out tfsec-report.json .
tfsec --format sarif --out tfsec.sarif .

## Run specific checks
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
## macOS
brew install terrascan

## Linux
curl -L "$(curl -s https://api.github.com/repos/tenable/terrascan/releases/latest | \
  grep -o -E 'https://.+?_Linux_x86_64.tar.gz')" > terrascan.tar.gz
tar -xf terrascan.tar.gz terrascan
sudo mv terrascan /usr/local/bin/

## Verify
terrascan version
```

**Scanning**:

```bash
## Scan Terraform
terrascan scan -t terraform -d .

## Scan with specific policy
terrascan scan -t terraform -p aws -d .

## Generate reports
terrascan scan -t terraform -d . -o json > terrascan-report.json
terrascan scan -t terraform -d . -o sarif > terrascan.sarif

## Skip rules
terrascan scan -t terraform -d . --skip-rules AWS.S3Bucket.DS.High.1043
```

---

## Dynamic Application Security Testing (DAST)

### OWASP ZAP

**Installation**:

```bash
## Docker
docker pull zaproxy/zap-stable

## Run ZAP in daemon mode
docker run -u zap -p 8080:8080 \
  -d zaproxy/zap-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 \
  -config api.disablekey=true
```

**Baseline scan**:

```bash
## Baseline scan
docker run -v $(pwd):/zap/wrk/:rw \
  zaproxy/zap-stable \
  zap-baseline.py \
  -t https://example.com \
  -r zap-baseline-report.html

## Full scan
docker run -v $(pwd):/zap/wrk/:rw \
  zaproxy/zap-stable \
  zap-full-scan.py \
  -t https://example.com \
  -r zap-full-report.html

## API scan
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
## Go install
go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest

## Verify
nuclei -version
```

**Scanning**:

```bash
## Update templates
nuclei -update-templates

## Scan target
nuclei -u https://example.com

## Scan with severity filter
nuclei -u https://example.com -severity critical,high

## Scan with specific templates
nuclei -u https://example.com -t cves/ -t vulnerabilities/

## Generate report
nuclei -u https://example.com -json -o nuclei-report.json
```

---

## Compliance Scanning

### OpenSCAP

**Installation**:

```bash
## Ubuntu/Debian
sudo apt install libopenscap8 openscap-scanner

## RHEL/CentOS
sudo yum install openscap-scanner
```

**Scanning**:

```bash
## Scan system
sudo oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_pci-dss \
  --results scan-results.xml \
  --report scan-report.html \
  /usr/share/xml/scap/ssg/content/ssg-ubuntu2004-ds.xml
```

### Chef InSpec

**Installation**:

```bash
## macOS/Linux
curl https://omnitruck.chef.io/install.sh | sudo bash -s -- -P inspec

## Verify
inspec --version
```

**Profile example**:

```ruby
## controls/example.rb
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
## Run profile
inspec exec /path/to/profile

## Run with reporter
inspec exec /path/to/profile --reporter json:inspec-report.json

## Run remote
inspec exec /path/to/profile -t ssh://user@host
```

---

## Severity Classification

### Severity Levels

```text
┌──────────┬─────────────────────────────────────────────────────────────┐
│ Severity │ Description                                                 │
├──────────┼─────────────────────────────────────────────────────────────┤
│ CRITICAL │ Actively exploited, remote code execution, data breach risk │
│          │ CVSS: 9.0-10.0 | Requires immediate action                  │
├──────────┼─────────────────────────────────────────────────────────────┤
│ HIGH     │ Easily exploitable, significant impact potential            │
│          │ CVSS: 7.0-8.9 | Fix within 7 days                           │
├──────────┼─────────────────────────────────────────────────────────────┤
│ MEDIUM   │ Requires specific conditions, moderate impact               │
│          │ CVSS: 4.0-6.9 | Fix within 30 days                          │
├──────────┼─────────────────────────────────────────────────────────────┤
│ LOW      │ Difficult to exploit, minimal impact                        │
│          │ CVSS: 0.1-3.9 | Fix within 90 days                          │
├──────────┼─────────────────────────────────────────────────────────────┤
│ INFO     │ Best practice recommendations, no immediate risk            │
│          │ CVSS: N/A | Address during regular maintenance              │
└──────────┴─────────────────────────────────────────────────────────────┘
```

### Severity Classification by Finding Type

```yaml
# severity-classification.yml
classification:
  # Authentication & Authorization
  authentication_bypass:
    severity: CRITICAL
    category: "A07:2021 - Identification and Authentication Failures"
  broken_access_control:
    severity: CRITICAL
    category: "A01:2021 - Broken Access Control"
  privilege_escalation:
    severity: CRITICAL
    category: "A01:2021 - Broken Access Control"

  # Injection
  sql_injection:
    severity: CRITICAL
    category: "A03:2021 - Injection"
  command_injection:
    severity: CRITICAL
    category: "A03:2021 - Injection"
  code_injection:
    severity: CRITICAL
    category: "A03:2021 - Injection"
  xss_stored:
    severity: HIGH
    category: "A03:2021 - Injection"
  xss_reflected:
    severity: MEDIUM
    category: "A03:2021 - Injection"
  ldap_injection:
    severity: HIGH
    category: "A03:2021 - Injection"
  xpath_injection:
    severity: HIGH
    category: "A03:2021 - Injection"

  # Cryptography
  hardcoded_secrets:
    severity: CRITICAL
    category: "A02:2021 - Cryptographic Failures"
  weak_encryption:
    severity: HIGH
    category: "A02:2021 - Cryptographic Failures"
  insecure_random:
    severity: MEDIUM
    category: "A02:2021 - Cryptographic Failures"
  missing_encryption:
    severity: HIGH
    category: "A02:2021 - Cryptographic Failures"

  # Data Exposure
  sensitive_data_exposure:
    severity: HIGH
    category: "A02:2021 - Cryptographic Failures"
  pii_exposure:
    severity: HIGH
    category: "A02:2021 - Cryptographic Failures"
  debug_info_exposure:
    severity: MEDIUM
    category: "A05:2021 - Security Misconfiguration"

  # Configuration
  security_misconfiguration:
    severity: MEDIUM
    category: "A05:2021 - Security Misconfiguration"
  default_credentials:
    severity: CRITICAL
    category: "A07:2021 - Identification and Authentication Failures"
  verbose_errors:
    severity: LOW
    category: "A05:2021 - Security Misconfiguration"

  # Dependencies
  vulnerable_dependency_critical:
    severity: CRITICAL
    category: "A06:2021 - Vulnerable and Outdated Components"
  vulnerable_dependency_high:
    severity: HIGH
    category: "A06:2021 - Vulnerable and Outdated Components"
  vulnerable_dependency_medium:
    severity: MEDIUM
    category: "A06:2021 - Vulnerable and Outdated Components"
  outdated_dependency:
    severity: LOW
    category: "A06:2021 - Vulnerable and Outdated Components"

  # SSRF & Path Traversal
  ssrf:
    severity: HIGH
    category: "A10:2021 - Server-Side Request Forgery"
  path_traversal:
    severity: HIGH
    category: "A01:2021 - Broken Access Control"

  # Deserialization
  insecure_deserialization:
    severity: CRITICAL
    category: "A08:2021 - Software and Data Integrity Failures"
```

### Automated Severity Assignment

```python
# scripts/security/severity_classifier.py
"""
Automated severity classification for security findings.

@module severity_classifier
@description Classify security findings by severity
@version 1.0.0
@author Tyler Dukes
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional
import re


class Severity(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


@dataclass
class SecurityFinding:
    """Represents a security finding."""
    id: str
    title: str
    description: str
    tool: str
    file_path: str
    line_number: int
    cwe: Optional[str] = None
    cvss: Optional[float] = None
    severity: Optional[Severity] = None


class SeverityClassifier:
    """Classify security findings by severity."""

    # Keywords indicating critical severity
    CRITICAL_KEYWORDS = [
        "remote code execution", "rce", "sql injection", "command injection",
        "authentication bypass", "privilege escalation", "hardcoded secret",
        "hardcoded password", "hardcoded credential", "insecure deserialization",
        "arbitrary file write", "arbitrary file read", "path traversal",
    ]

    # Keywords indicating high severity
    HIGH_KEYWORDS = [
        "xss", "cross-site scripting", "ssrf", "server-side request forgery",
        "weak encryption", "broken access control", "sensitive data exposure",
        "ldap injection", "xpath injection", "xml injection", "missing auth",
    ]

    # CVSS to severity mapping
    CVSS_THRESHOLDS = {
        9.0: Severity.CRITICAL,
        7.0: Severity.HIGH,
        4.0: Severity.MEDIUM,
        0.1: Severity.LOW,
        0.0: Severity.INFO,
    }

    def classify(self, finding: SecurityFinding) -> Severity:
        """Classify a finding's severity."""
        # If CVSS is provided, use it
        if finding.cvss is not None:
            return self._classify_by_cvss(finding.cvss)

        # Check for critical keywords
        text = f"{finding.title} {finding.description}".lower()
        for keyword in self.CRITICAL_KEYWORDS:
            if keyword in text:
                return Severity.CRITICAL

        # Check for high keywords
        for keyword in self.HIGH_KEYWORDS:
            if keyword in text:
                return Severity.HIGH

        # Default to medium for unclassified security issues
        return Severity.MEDIUM

    def _classify_by_cvss(self, cvss: float) -> Severity:
        """Classify severity based on CVSS score."""
        for threshold, severity in sorted(
            self.CVSS_THRESHOLDS.items(), reverse=True
        ):
            if cvss >= threshold:
                return severity
        return Severity.INFO


def classify_findings(findings: List[SecurityFinding]) -> Dict[Severity, List[SecurityFinding]]:
    """Classify and group findings by severity."""
    classifier = SeverityClassifier()
    classified: Dict[Severity, List[SecurityFinding]] = {
        s: [] for s in Severity
    }

    for finding in findings:
        severity = classifier.classify(finding)
        finding.severity = severity
        classified[severity].append(finding)

    return classified
```

---

## False Positive Management

### False Positive Handling Workflow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                   False Positive Handling Workflow                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Finding Identified                                              │
│         │                                                           │
│         ▼                                                           │
│  2. Developer Reviews                                               │
│         │                                                           │
│         ├──► Confirmed Vulnerability ──► Fix Required               │
│         │                                                           │
│         ▼                                                           │
│  3. False Positive?                                                 │
│         │                                                           │
│         ├──► Create Suppression Request                             │
│         │                                                           │
│         ▼                                                           │
│  4. Security Team Reviews                                           │
│         │                                                           │
│         ├──► Approve ──► Add to Baseline/Suppression                │
│         │                                                           │
│         └──► Reject ──► Developer Must Fix                          │
│                                                                     │
│  5. Document Decision                                               │
│         │                                                           │
│         ▼                                                           │
│  6. Update Suppression Files                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Unified Suppression Configuration

```yaml
# .security/suppressions.yml
version: "1.0"
last_updated: "2025-01-24"

suppressions:
  # Semgrep suppressions
  - tool: semgrep
    rule_id: python-sql-injection
    file: src/legacy/reports.py
    line: 45
    reason: "Legacy code with input validation at controller level"
    approved_by: "security-team"
    approved_date: "2025-01-15"
    expires: "2025-07-15"
    jira_ticket: "SEC-123"

  # Bandit suppressions
  - tool: bandit
    rule_id: B608
    file: src/utils/shell.py
    reason: "Input sanitized via allowlist pattern"
    approved_by: "security-team"
    approved_date: "2025-01-10"
    expires: "2025-07-10"
    jira_ticket: "SEC-120"

  # gosec suppressions
  - tool: gosec
    rule_id: G104
    file: internal/logger/logger.go
    reason: "Error is logged, not returned - design decision"
    approved_by: "security-team"
    approved_date: "2025-01-12"
    expires: null  # Permanent suppression
    jira_ticket: "SEC-121"

  # Trivy suppressions
  - tool: trivy
    cve: CVE-2023-12345
    package: lodash
    version: "4.17.21"
    reason: "Vulnerability not exploitable in our usage context"
    approved_by: "security-team"
    approved_date: "2025-01-05"
    expires: "2025-04-05"
    jira_ticket: "SEC-115"

# Global policies
policies:
  max_suppression_duration_days: 180
  require_jira_ticket: true
  require_security_approval: true
  auto_expire_on_file_change: true
```

### Inline Suppression Standards

```python
# Python - Bandit suppression
def execute_command(cmd: str) -> str:
    """Execute shell command with proper sanitization."""
    sanitized = sanitize_command(cmd)
    # nosec B602 - Input sanitized via allowlist pattern
    # Approved: SEC-123, Expires: 2025-07-15
    return subprocess.check_output(sanitized, shell=True)  # nosec B602


# Python - Semgrep suppression
def build_query(table: str, conditions: dict) -> str:
    """Build parameterized query."""
    # nosemgrep: python-sql-injection
    # Reason: Using parameterized query builder, not string concatenation
    return QueryBuilder(table).where(conditions).build()
```

```go
// Go - gosec suppression
func processFile(path string) error {
    // #nosec G304 - Path validated against allowlist
    // Approved: SEC-121, Expires: 2025-06-01
    data, err := os.ReadFile(path)
    if err != nil {
        return err
    }
    return process(data)
}
```

```javascript
// JavaScript - ESLint suppression
function executeUserCode(code) {
  // eslint-disable-next-line security/detect-eval-with-expression
  // Reason: Code is sandboxed via VM2 with strict timeout
  // Approved: SEC-130, Expires: 2025-08-01
  return sandbox.run(code);
}
```

### False Positive Tracking Script

```python
# scripts/security/track_suppressions.py
"""
Track and validate security suppressions.

@module track_suppressions
@description Manage and audit security suppressions
@version 1.0.0
@author Tyler Dukes
"""

import yaml
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class Suppression:
    """Represents a security suppression."""
    tool: str
    rule_id: str
    file: str
    reason: str
    approved_by: str
    approved_date: str
    expires: str | None
    jira_ticket: str


def load_suppressions(config_path: str = ".security/suppressions.yml") -> List[Suppression]:
    """Load suppressions from configuration file."""
    with open(config_path) as f:
        config = yaml.safe_load(f)

    return [
        Suppression(**s) for s in config.get("suppressions", [])
    ]


def check_expired_suppressions(suppressions: List[Suppression]) -> List[Suppression]:
    """Find expired suppressions."""
    today = datetime.now().date()
    expired = []

    for s in suppressions:
        if s.expires:
            expires_date = datetime.strptime(s.expires, "%Y-%m-%d").date()
            if expires_date < today:
                expired.append(s)

    return expired


def check_expiring_soon(
    suppressions: List[Suppression],
    days: int = 30
) -> List[Suppression]:
    """Find suppressions expiring within specified days."""
    today = datetime.now().date()
    threshold = today + timedelta(days=days)
    expiring = []

    for s in suppressions:
        if s.expires:
            expires_date = datetime.strptime(s.expires, "%Y-%m-%d").date()
            if today <= expires_date <= threshold:
                expiring.append(s)

    return expiring


def generate_report(suppressions: List[Suppression]) -> Dict[str, Any]:
    """Generate suppression audit report."""
    expired = check_expired_suppressions(suppressions)
    expiring_soon = check_expiring_soon(suppressions)

    by_tool = {}
    for s in suppressions:
        by_tool.setdefault(s.tool, []).append(s)

    return {
        "total_suppressions": len(suppressions),
        "expired": len(expired),
        "expiring_in_30_days": len(expiring_soon),
        "by_tool": {tool: len(items) for tool, items in by_tool.items()},
        "expired_details": [
            {"tool": s.tool, "rule": s.rule_id, "file": s.file, "expires": s.expires}
            for s in expired
        ],
        "expiring_details": [
            {"tool": s.tool, "rule": s.rule_id, "file": s.file, "expires": s.expires}
            for s in expiring_soon
        ],
    }


if __name__ == "__main__":
    suppressions = load_suppressions()
    report = generate_report(suppressions)

    print(f"Total suppressions: {report['total_suppressions']}")
    print(f"Expired: {report['expired']}")
    print(f"Expiring in 30 days: {report['expiring_in_30_days']}")

    if report['expired_details']:
        print("\n⚠️  Expired suppressions:")
        for item in report['expired_details']:
            print(f"  - {item['tool']}/{item['rule']}: {item['file']}")
```

---

## Security Gate Policies

### Gate Configuration

```yaml
# .security/gates.yml
version: "1.0"

gates:
  # Pre-commit gate (local development)
  pre_commit:
    enabled: true
    blocking: false  # Warn only
    checks:
      - secret_detection
      - sast_quick
    thresholds:
      critical: 0
      high: 0

  # Pull request gate
  pull_request:
    enabled: true
    blocking: true
    checks:
      - secret_detection
      - sast_full
      - dependency_scan
      - container_scan
    thresholds:
      critical: 0
      high: 0
      medium: 10
    exceptions:
      - path: "docs/**"
        skip: [sast_full, container_scan]
      - path: "tests/**"
        thresholds:
          medium: 50

  # Main branch gate
  main_branch:
    enabled: true
    blocking: true
    checks:
      - secret_detection
      - sast_full
      - dependency_scan
      - container_scan
      - infrastructure_scan
      - dast_baseline
    thresholds:
      critical: 0
      high: 0
      medium: 5
      low: 50

  # Release gate
  release:
    enabled: true
    blocking: true
    checks:
      - secret_detection
      - sast_full
      - dependency_scan
      - container_scan
      - infrastructure_scan
      - dast_full
      - compliance_scan
    thresholds:
      critical: 0
      high: 0
      medium: 0
      low: 20
    require_manual_approval: true

# Check definitions
checks:
  secret_detection:
    tools: [gitleaks, trufflehog]
    fail_on_any: true

  sast_quick:
    tools: [semgrep]
    configs: [p/security-audit]
    timeout: 300

  sast_full:
    tools: [semgrep, bandit, eslint-security, gosec]
    configs:
      semgrep: [p/security-audit, p/owasp-top-ten]
    timeout: 900

  dependency_scan:
    tools: [snyk, trivy]
    severity_threshold: high

  container_scan:
    tools: [trivy]
    severity_threshold: high
    ignore_unfixed: true

  infrastructure_scan:
    tools: [checkov, tfsec]
    frameworks: [terraform, kubernetes, dockerfile]

  dast_baseline:
    tools: [zap]
    scan_type: baseline
    target: staging

  dast_full:
    tools: [zap, nuclei]
    scan_type: full
    target: staging

  compliance_scan:
    tools: [inspec]
    profiles: [cis-benchmark, pci-dss]
```

### Gate Implementation

```python
# scripts/security/gate_checker.py
"""
Security gate checker for CI/CD pipelines.

@module gate_checker
@description Enforce security gates in pipelines
@version 1.0.0
@author Tyler Dukes
"""

import yaml
import json
import sys
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum


class GateResult(Enum):
    PASS = "pass"
    WARN = "warn"
    FAIL = "fail"


@dataclass
class Finding:
    severity: str
    tool: str
    rule_id: str
    message: str
    file: str


@dataclass
class GateCheckResult:
    gate_name: str
    result: GateResult
    findings_count: Dict[str, int]
    thresholds: Dict[str, int]
    violations: List[str]


def load_gate_config(config_path: str = ".security/gates.yml") -> dict:
    """Load gate configuration."""
    with open(config_path) as f:
        return yaml.safe_load(f)


def count_findings_by_severity(findings: List[Finding]) -> Dict[str, int]:
    """Count findings by severity level."""
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for finding in findings:
        severity = finding.severity.lower()
        if severity in counts:
            counts[severity] += 1
    return counts


def check_gate(
    gate_name: str,
    findings: List[Finding],
    config: dict
) -> GateCheckResult:
    """Check if findings pass the specified gate."""
    gate_config = config["gates"].get(gate_name)
    if not gate_config:
        raise ValueError(f"Unknown gate: {gate_name}")

    if not gate_config.get("enabled", True):
        return GateCheckResult(
            gate_name=gate_name,
            result=GateResult.PASS,
            findings_count={},
            thresholds={},
            violations=["Gate disabled"],
        )

    counts = count_findings_by_severity(findings)
    thresholds = gate_config.get("thresholds", {})
    violations = []

    for severity, threshold in thresholds.items():
        actual = counts.get(severity, 0)
        if actual > threshold:
            violations.append(
                f"{severity.upper()}: {actual} findings exceed threshold of {threshold}"
            )

    if violations:
        result = GateResult.FAIL if gate_config.get("blocking", True) else GateResult.WARN
    else:
        result = GateResult.PASS

    return GateCheckResult(
        gate_name=gate_name,
        result=result,
        findings_count=counts,
        thresholds=thresholds,
        violations=violations,
    )


def main():
    """Main entry point for gate checker."""
    import argparse

    parser = argparse.ArgumentParser(description="Security gate checker")
    parser.add_argument("--gate", required=True, help="Gate to check")
    parser.add_argument("--findings", required=True, help="Findings JSON file")
    parser.add_argument("--config", default=".security/gates.yml", help="Gate config")
    args = parser.parse_args()

    config = load_gate_config(args.config)

    with open(args.findings) as f:
        findings_data = json.load(f)

    findings = [Finding(**f) for f in findings_data]
    result = check_gate(args.gate, findings, config)

    print(f"\n{'='*60}")
    print(f"Security Gate: {result.gate_name}")
    print(f"Result: {result.result.value.upper()}")
    print(f"{'='*60}")
    print(f"\nFindings by severity:")
    for severity, count in result.findings_count.items():
        threshold = result.thresholds.get(severity, "N/A")
        status = "✓" if count <= (threshold if isinstance(threshold, int) else 999) else "✗"
        print(f"  {status} {severity.upper()}: {count} (threshold: {threshold})")

    if result.violations:
        print(f"\n⚠️  Violations:")
        for v in result.violations:
            print(f"  - {v}")

    sys.exit(0 if result.result == GateResult.PASS else 1)


if __name__ == "__main__":
    main()
```

### GitHub Actions Gate Integration

```yaml
# .github/workflows/security-gate.yml
name: Security Gate

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    outputs:
      findings_file: ${{ steps.aggregate.outputs.findings_file }}

    steps:
      - uses: actions/checkout@v4

      - name: Secret Detection
        uses: gitleaks/gitleaks-action@v2
        continue-on-error: true

      - name: SAST - Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/security-audit p/owasp-top-ten
          generateSarif: true
        continue-on-error: true

      - name: SAST - Bandit
        run: |
          pip install bandit
          bandit -r src/ -f json -o bandit-results.json || true
        continue-on-error: true

      - name: Dependency Scan
        uses: snyk/actions/python@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --json-file-output=snyk-results.json
        continue-on-error: true

      - name: Aggregate Results
        id: aggregate
        run: |
          python scripts/security/aggregate_findings.py \
            --semgrep semgrep.sarif \
            --bandit bandit-results.json \
            --snyk snyk-results.json \
            --output findings.json
          echo "findings_file=findings.json" >> $GITHUB_OUTPUT

      - name: Upload Findings
        uses: actions/upload-artifact@v4
        with:
          name: security-findings
          path: findings.json

  gate-check:
    needs: security-scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Download Findings
        uses: actions/download-artifact@v4
        with:
          name: security-findings

      - name: Determine Gate
        id: gate
        run: |
          if [[ "${{ github.event_name }}" == "pull_request" ]]; then
            echo "gate=pull_request" >> $GITHUB_OUTPUT
          else
            echo "gate=main_branch" >> $GITHUB_OUTPUT
          fi

      - name: Check Security Gate
        run: |
          python scripts/security/gate_checker.py \
            --gate ${{ steps.gate.outputs.gate }} \
            --findings findings.json \
            --config .security/gates.yml
```

---

## Remediation SLAs

### SLA Definitions

```text
┌──────────┬─────────────┬─────────────────────────────────────────────────┐
│ Severity │ SLA         │ Requirements                                    │
├──────────┼─────────────┼─────────────────────────────────────────────────┤
│ CRITICAL │ 24 hours    │ - Immediate notification to security team       │
│          │             │ - Incident response activation if needed        │
│          │             │ - Hotfix deployment within SLA                  │
│          │             │ - Post-incident review required                 │
├──────────┼─────────────┼─────────────────────────────────────────────────┤
│ HIGH     │ 7 days      │ - Security team notification within 24h        │
│          │             │ - Assigned owner within 48h                     │
│          │             │ - Fix in next sprint or hotfix                  │
│          │             │ - Testing required before deployment            │
├──────────┼─────────────┼─────────────────────────────────────────────────┤
│ MEDIUM   │ 30 days     │ - Tracked in issue tracker                      │
│          │             │ - Assigned owner within 1 week                  │
│          │             │ - Scheduled for regular release                 │
│          │             │ - Standard review process                       │
├──────────┼─────────────┼─────────────────────────────────────────────────┤
│ LOW      │ 90 days     │ - Tracked in backlog                            │
│          │             │ - Addressed during regular maintenance          │
│          │             │ - Can be grouped with related fixes             │
│          │             │ - May be deprioritized if resources limited     │
├──────────┼─────────────┼─────────────────────────────────────────────────┤
│ INFO     │ Best effort │ - Tracked for awareness                         │
│          │             │ - Addressed opportunistically                   │
│          │             │ - No SLA enforcement                            │
└──────────┴─────────────┴─────────────────────────────────────────────────┘
```

### SLA Configuration

```yaml
# .security/sla.yml
version: "1.0"

sla_definitions:
  critical:
    response_time: 1h
    resolution_time: 24h
    escalation_path:
      - security-team
      - engineering-leads
      - cto
    notifications:
      - channel: slack
        target: "#security-alerts"
      - channel: pagerduty
        target: security-oncall
      - channel: email
        target: security@example.com

  high:
    response_time: 24h
    resolution_time: 7d
    escalation_path:
      - security-team
      - engineering-leads
    notifications:
      - channel: slack
        target: "#security-alerts"
      - channel: email
        target: security@example.com

  medium:
    response_time: 1w
    resolution_time: 30d
    escalation_path:
      - security-team
    notifications:
      - channel: slack
        target: "#security-findings"

  low:
    response_time: 2w
    resolution_time: 90d
    notifications:
      - channel: slack
        target: "#security-findings"

# Escalation rules
escalation:
  # Escalate if SLA is 75% expired
  warning_threshold: 0.75
  # Escalate if SLA is 100% expired
  breach_threshold: 1.0

  actions:
    warning:
      - notify_owner
      - notify_team_lead
    breach:
      - notify_security_team
      - create_incident
      - block_deployments  # For critical/high only
```

### SLA Tracking Script

```python
# scripts/security/sla_tracker.py
"""
Track and enforce security SLAs.

@module sla_tracker
@description Monitor and report on security finding SLAs
@version 1.0.0
@author Tyler Dukes
"""

import yaml
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum


class SLAStatus(Enum):
    ON_TRACK = "on_track"
    WARNING = "warning"
    BREACHED = "breached"


@dataclass
class SLAConfig:
    response_time: timedelta
    resolution_time: timedelta


@dataclass
class TrackedFinding:
    id: str
    severity: str
    title: str
    created_at: datetime
    response_at: Optional[datetime]
    resolved_at: Optional[datetime]
    owner: Optional[str]


def parse_duration(duration_str: str) -> timedelta:
    """Parse duration string (e.g., '24h', '7d') to timedelta."""
    if duration_str.endswith('h'):
        return timedelta(hours=int(duration_str[:-1]))
    elif duration_str.endswith('d'):
        return timedelta(days=int(duration_str[:-1]))
    elif duration_str.endswith('w'):
        return timedelta(weeks=int(duration_str[:-1]))
    raise ValueError(f"Unknown duration format: {duration_str}")


def load_sla_config(config_path: str = ".security/sla.yml") -> Dict[str, SLAConfig]:
    """Load SLA configuration."""
    with open(config_path) as f:
        config = yaml.safe_load(f)

    sla_configs = {}
    for severity, sla_def in config["sla_definitions"].items():
        sla_configs[severity] = SLAConfig(
            response_time=parse_duration(sla_def["response_time"]),
            resolution_time=parse_duration(sla_def["resolution_time"]),
        )
    return sla_configs


def check_sla_status(
    finding: TrackedFinding,
    sla_config: SLAConfig,
    warning_threshold: float = 0.75
) -> Dict[str, any]:
    """Check SLA status for a finding."""
    now = datetime.now()
    elapsed = now - finding.created_at

    # Check response SLA
    response_status = SLAStatus.ON_TRACK
    if finding.response_at is None:
        response_elapsed_ratio = elapsed / sla_config.response_time
        if response_elapsed_ratio >= 1.0:
            response_status = SLAStatus.BREACHED
        elif response_elapsed_ratio >= warning_threshold:
            response_status = SLAStatus.WARNING
    else:
        response_time = finding.response_at - finding.created_at
        if response_time > sla_config.response_time:
            response_status = SLAStatus.BREACHED

    # Check resolution SLA
    resolution_status = SLAStatus.ON_TRACK
    if finding.resolved_at is None:
        resolution_elapsed_ratio = elapsed / sla_config.resolution_time
        if resolution_elapsed_ratio >= 1.0:
            resolution_status = SLAStatus.BREACHED
        elif resolution_elapsed_ratio >= warning_threshold:
            resolution_status = SLAStatus.WARNING
    else:
        resolution_time = finding.resolved_at - finding.created_at
        if resolution_time > sla_config.resolution_time:
            resolution_status = SLAStatus.BREACHED

    return {
        "finding_id": finding.id,
        "severity": finding.severity,
        "response_sla": {
            "status": response_status.value,
            "deadline": (finding.created_at + sla_config.response_time).isoformat(),
            "met": finding.response_at is not None,
        },
        "resolution_sla": {
            "status": resolution_status.value,
            "deadline": (finding.created_at + sla_config.resolution_time).isoformat(),
            "met": finding.resolved_at is not None,
        },
    }


def generate_sla_report(findings: List[TrackedFinding]) -> Dict:
    """Generate SLA compliance report."""
    sla_configs = load_sla_config()

    report = {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_findings": len(findings),
            "open_findings": 0,
            "sla_breaches": 0,
            "sla_warnings": 0,
        },
        "by_severity": {},
        "findings": [],
    }

    for finding in findings:
        if finding.severity.lower() not in sla_configs:
            continue

        sla_config = sla_configs[finding.severity.lower()]
        status = check_sla_status(finding, sla_config)
        report["findings"].append(status)

        if finding.resolved_at is None:
            report["summary"]["open_findings"] += 1

        if status["resolution_sla"]["status"] == "breached":
            report["summary"]["sla_breaches"] += 1
        elif status["resolution_sla"]["status"] == "warning":
            report["summary"]["sla_warnings"] += 1

    return report
```

---

## Issue Tracker Integration

### Jira Integration

```python
# scripts/security/jira_integration.py
"""
Jira integration for security findings.

@module jira_integration
@description Create and manage Jira issues for security findings
@version 1.0.0
@author Tyler Dukes
"""

import os
from dataclasses import dataclass
from typing import Dict, List, Optional
from jira import JIRA


@dataclass
class SecurityFinding:
    id: str
    severity: str
    title: str
    description: str
    tool: str
    file_path: str
    line_number: int
    cwe: Optional[str] = None
    recommendation: Optional[str] = None


class JiraSecurityIntegration:
    """Manage security findings in Jira."""

    SEVERITY_TO_PRIORITY = {
        "critical": "Highest",
        "high": "High",
        "medium": "Medium",
        "low": "Low",
        "info": "Lowest",
    }

    def __init__(
        self,
        server: str,
        username: str,
        api_token: str,
        project_key: str,
    ):
        self.jira = JIRA(
            server=server,
            basic_auth=(username, api_token),
        )
        self.project_key = project_key

    def create_issue(
        self,
        finding: SecurityFinding,
        labels: Optional[List[str]] = None,
        components: Optional[List[str]] = None,
    ) -> str:
        """Create a Jira issue for a security finding."""
        labels = labels or ["security", finding.tool, finding.severity.lower()]
        priority = self.SEVERITY_TO_PRIORITY.get(finding.severity.lower(), "Medium")

        description = self._format_description(finding)

        issue_dict = {
            "project": {"key": self.project_key},
            "summary": f"[{finding.severity.upper()}] {finding.title}",
            "description": description,
            "issuetype": {"name": "Bug"},
            "priority": {"name": priority},
            "labels": labels,
        }

        if components:
            issue_dict["components"] = [{"name": c} for c in components]

        issue = self.jira.create_issue(fields=issue_dict)
        return issue.key

    def _format_description(self, finding: SecurityFinding) -> str:
        """Format finding details for Jira description."""
        description = f"""
h2. Security Finding Details

||Field||Value||
|Severity|{finding.severity.upper()}|
|Tool|{finding.tool}|
|File|{finding.file_path}:{finding.line_number}|
|CWE|{finding.cwe or 'N/A'}|

h2. Description
{finding.description}

h2. Location
{{code}}
File: {finding.file_path}
Line: {finding.line_number}
{{code}}
"""

        if finding.recommendation:
            description += f"""
h2. Recommendation
{finding.recommendation}
"""

        return description

    def find_existing_issue(self, finding: SecurityFinding) -> Optional[str]:
        """Find existing issue for a finding."""
        jql = (
            f'project = {self.project_key} AND '
            f'labels = "security" AND '
            f'labels = "{finding.tool}" AND '
            f'text ~ "{finding.file_path}" AND '
            f'status not in (Done, Closed)'
        )

        issues = self.jira.search_issues(jql, maxResults=1)
        return issues[0].key if issues else None

    def create_or_update(self, finding: SecurityFinding) -> Dict[str, str]:
        """Create new issue or update existing one."""
        existing_key = self.find_existing_issue(finding)

        if existing_key:
            # Add comment to existing issue
            comment = f"Finding still present in latest scan:\n{finding.description}"
            self.jira.add_comment(existing_key, comment)
            return {"action": "updated", "key": existing_key}

        new_key = self.create_issue(finding)
        return {"action": "created", "key": new_key}


def sync_findings_to_jira(findings: List[SecurityFinding]) -> List[Dict]:
    """Sync security findings to Jira."""
    integration = JiraSecurityIntegration(
        server=os.environ["JIRA_SERVER"],
        username=os.environ["JIRA_USERNAME"],
        api_token=os.environ["JIRA_API_TOKEN"],
        project_key=os.environ["JIRA_PROJECT_KEY"],
    )

    results = []
    for finding in findings:
        result = integration.create_or_update(finding)
        result["finding_id"] = finding.id
        results.append(result)

    return results
```

### GitHub Issues Integration

```python
# scripts/security/github_issues.py
"""
GitHub Issues integration for security findings.

@module github_issues
@description Create and manage GitHub issues for security findings
@version 1.0.0
@author Tyler Dukes
"""

import os
from dataclasses import dataclass
from typing import Dict, List, Optional
from github import Github


@dataclass
class SecurityFinding:
    id: str
    severity: str
    title: str
    description: str
    tool: str
    file_path: str
    line_number: int
    cwe: Optional[str] = None
    recommendation: Optional[str] = None


class GitHubSecurityIntegration:
    """Manage security findings in GitHub Issues."""

    SEVERITY_TO_LABELS = {
        "critical": ["security", "priority:critical", "severity:critical"],
        "high": ["security", "priority:high", "severity:high"],
        "medium": ["security", "priority:medium", "severity:medium"],
        "low": ["security", "priority:low", "severity:low"],
        "info": ["security", "severity:info"],
    }

    def __init__(self, token: str, repo: str):
        self.github = Github(token)
        self.repo = self.github.get_repo(repo)

    def create_issue(
        self,
        finding: SecurityFinding,
        additional_labels: Optional[List[str]] = None,
    ) -> int:
        """Create a GitHub issue for a security finding."""
        labels = self.SEVERITY_TO_LABELS.get(
            finding.severity.lower(),
            ["security"]
        ).copy()
        labels.append(finding.tool)

        if additional_labels:
            labels.extend(additional_labels)

        body = self._format_body(finding)
        title = f"[{finding.severity.upper()}] {finding.title}"

        issue = self.repo.create_issue(
            title=title,
            body=body,
            labels=labels,
        )

        return issue.number

    def _format_body(self, finding: SecurityFinding) -> str:
        """Format finding details for issue body."""
        lines = [
            "## Security Finding Details",
            "",
            "| Field | Value |",
            "|-------|-------|",
            f"| **Severity** | {finding.severity.upper()} |",
            f"| **Tool** | {finding.tool} |",
            f"| **File** | `{finding.file_path}:{finding.line_number}` |",
            f"| **CWE** | {finding.cwe or 'N/A'} |",
            "",
            "## Description",
            "",
            finding.description,
            "",
            "## Location",
            "",
            "```",
            f"File: {finding.file_path}",
            f"Line: {finding.line_number}",
            "```",
        ]

        if finding.recommendation:
            lines.extend([
                "",
                "## Recommendation",
                "",
                finding.recommendation,
            ])

        lines.extend([
            "",
            "---",
            "*This issue was automatically created by the security scanning pipeline.*",
        ])

        return "\n".join(lines)

    def find_existing_issue(self, finding: SecurityFinding) -> Optional[int]:
        """Find existing open issue for a finding."""
        query = (
            f'repo:{self.repo.full_name} '
            f'is:issue is:open '
            f'label:security label:{finding.tool} '
            f'"{finding.file_path}" in:body'
        )

        issues = self.github.search_issues(query)
        for issue in issues:
            return issue.number

        return None

    def create_or_update(self, finding: SecurityFinding) -> Dict[str, any]:
        """Create new issue or update existing one."""
        existing_number = self.find_existing_issue(finding)

        if existing_number:
            issue = self.repo.get_issue(existing_number)
            comment = (
                f"Finding still present in latest scan:\n\n"
                f"**Tool:** {finding.tool}\n"
                f"**File:** `{finding.file_path}:{finding.line_number}`\n\n"
                f"{finding.description}"
            )
            issue.create_comment(comment)
            return {"action": "updated", "number": existing_number}

        new_number = self.create_issue(finding)
        return {"action": "created", "number": new_number}

def sync_findings_to_github(findings: List[SecurityFinding]) -> List[Dict]:
    """Sync security findings to GitHub Issues."""
    integration = GitHubSecurityIntegration(
        token=os.environ["GITHUB_TOKEN"],
        repo=os.environ["GITHUB_REPOSITORY"],
    )

    results = []
    for finding in findings:
        result = integration.create_or_update(finding)
        result["finding_id"] = finding.id
        results.append(result)

    return results
```

### CI/CD Issue Creation

```yaml
# .github/workflows/security-issues.yml
name: Security Issue Management

on:
  workflow_run:
    workflows: ["Security Gate"]
    types: [completed]

jobs:
  create-issues:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}

    steps:
      - uses: actions/checkout@v4

      - name: Download Findings
        uses: dawidd6/action-download-artifact@v2
        with:
          workflow: security-gate.yml
          name: security-findings

      - name: Create Issues for New Findings
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: |
          python scripts/security/github_issues.py \
            --findings findings.json \
            --severity-threshold medium

      - name: Post Summary
        run: |
          echo "## Security Issues Created" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          cat issue-summary.md >> $GITHUB_STEP_SUMMARY
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
## Vulnerability Disclosure Policy

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

### Standards and Guidelines

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP SAST Tools](https://owasp.org/www-community/Source_Code_Analysis_Tools)
- [OWASP DAST Tools](https://owasp.org/www-community/Vulnerability_Scanning_Tools)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Security Guidelines](https://www.nist.gov/cybersecurity)
- [Cloud Security Alliance](https://cloudsecurityalliance.org/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)

### SAST Tools

- [Semgrep Documentation](https://semgrep.dev/docs/)
- [Bandit Documentation](https://bandit.readthedocs.io/)
- [gosec Documentation](https://securego.io/)
- [SonarQube Documentation](https://docs.sonarsource.com/sonarqube/)
- [ESLint Security Plugin](https://github.com/eslint-community/eslint-plugin-security)

### DAST Tools

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Nuclei Documentation](https://docs.projectdiscovery.io/tools/nuclei/)
- [Burp Suite Documentation](https://portswigger.net/burp/documentation)

### Container and Infrastructure Security

- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Checkov Documentation](https://www.checkov.io/1.Welcome/What%20is%20Checkov.html)
- [tfsec Documentation](https://aquasecurity.github.io/tfsec/)

---

**Next Steps:**

- Review the [AI Validation Pipeline](ai_validation_pipeline.md) for complete CI/CD security integration
- See [Pre-commit Hooks Guide](precommit_hooks_guide.md) for local security checks
- Check [GitHub Actions Guide](github_actions_guide.md) for security workflows
- Explore [Observability Guide](observability_guide.md) for security monitoring integration
