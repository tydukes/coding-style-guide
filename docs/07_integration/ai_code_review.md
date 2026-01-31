---
title: "AI-Powered Code Review Integration"
description: "Standards and integration guide for AI-powered code review tools including GitHub Copilot, CodeRabbit, and AI assistants"
author: "Tyler Dukes"
tags: [ai, code-review, github-copilot, coderabbit, automation, integration]
category: "Integration"
status: "active"
---

## Overview

AI-powered code review tools enhance development workflows by providing automated feedback on code
quality, security, and style compliance. This guide covers configuration and best practices for
integrating GitHub Copilot, CodeRabbit, and other AI review tools.

### Supported Tools

| Tool | Purpose | Integration Level |
|------|---------|-------------------|
| GitHub Copilot | Code suggestions, workspace-aware assistance | IDE, CLI |
| CodeRabbit | Automated PR review and suggestions | GitHub/GitLab |
| Claude Code | Multi-language code review and generation | CLI, IDE |
| Amazon CodeGuru | Security and performance recommendations | AWS-native |
| Sourcery | Python-specific code improvement | GitHub, IDE |

---

## GitHub Copilot Configuration

### Workspace Configuration

Create `.github/copilot-instructions.md` to provide repository-specific context:

```markdown
# Copilot Instructions for This Repository

## Coding Standards

This repository follows The Dukes Engineering Style Guide:
- Reference: https://tydukes.github.io/coding-style-guide/
- Python: Black formatting (100 char line), flake8 linting
- TypeScript: Prettier + ESLint with strict mode
- Terraform: terraform fmt, 2-space indentation
- YAML: yamllint, 2-space indentation, 120 char max

## Project Structure

- `src/` - Application source code
- `tests/` - Test files (pytest for Python, Jest for TypeScript)
- `terraform/` - Infrastructure as Code
- `docs/` - Documentation (MkDocs)

## Naming Conventions

- Python: snake_case for functions/variables, PascalCase for classes
- TypeScript: camelCase for functions/variables, PascalCase for classes/interfaces
- Terraform: snake_case for resources, descriptive names with environment prefix

## Security Requirements

- Never hardcode secrets or credentials
- Use environment variables or secret managers
- Validate all user inputs
- Follow OWASP Top 10 guidelines

## Testing Requirements

- Minimum 80% code coverage
- Unit tests for all public functions
- Integration tests for API endpoints
- Property-based testing where appropriate
```

### VS Code Settings for Copilot

Add to `.vscode/settings.json`:

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "markdown": true,
    "plaintext": false
  },
  "github.copilot.advanced": {
    "inlineSuggestCount": 3,
    "listCount": 10,
    "debug.overrideEngine": "gpt-4"
  },
  "github.copilot.editor.enableAutoCompletions": true,
  "github.copilot.chat.localeOverride": "en",
  "github.copilot.chat.welcomeMessage": "disabled"
}
```

### Copilot Chat Custom Instructions

Create `.github/copilot-chat-instructions.md`:

```markdown
# Copilot Chat Instructions

## Response Guidelines

1. Always reference the style guide when providing code suggestions
2. Include error handling in all code examples
3. Add type hints for Python, strict types for TypeScript
4. Suggest tests for any new functionality
5. Warn about potential security issues

## Code Review Focus Areas

When reviewing code, prioritize:
1. Security vulnerabilities (injection, XSS, secrets exposure)
2. Style guide compliance
3. Error handling completeness
4. Test coverage
5. Documentation accuracy
6. Performance considerations

## Preferred Patterns

- Use dependency injection over global state
- Prefer composition over inheritance
- Use async/await over callbacks
- Apply the principle of least privilege
- Follow 12-factor app principles
```

### Copilot CLI Configuration

Create `~/.config/github-copilot/config.yml`:

```yaml
# GitHub Copilot CLI configuration
version: 1

# Custom aliases for common patterns
aliases:
  lint: "Run linting for this project"
  test: "Run the test suite with coverage"
  sec: "Run security scanning"
  fmt: "Format all files according to style guide"

# Context providers
context:
  - type: file
    patterns:
      - "CLAUDE.md"
      - "README.md"
      - "pyproject.toml"
      - "package.json"

# Preferred tools
preferences:
  shell: bash
  package_manager: uv
  test_framework: pytest
```

---

## CodeRabbit Configuration

### Basic Configuration

Create `.coderabbit.yaml` in repository root:

```yaml
# CodeRabbit AI Code Review Configuration
# Reference: https://docs.coderabbit.ai/

language: en

reviews:
  # Review personality: chill, assertive, or supportive
  profile: chill

  # Request changes for critical issues
  request_changes_workflow: true

  # Include high-level summary in review
  high_level_summary: true

  # Disable poem mode (serious reviews only)
  poem: false

  # Show review status checks
  review_status: true

  # Collapse detailed walkthrough by default
  collapse_walkthrough: false

  # Auto-review settings
  auto_review:
    enabled: true
    # Minimum lines changed to trigger review
    ignore_title_keywords:
      - "WIP"
      - "DO NOT MERGE"
      - "[skip review]"

  # Path-based filtering
  path_filters:
    # Exclude documentation from code review
    - "!**/*.md"
    - "!docs/**"
    # Exclude generated files
    - "!**/*.generated.*"
    - "!**/node_modules/**"
    - "!**/.terraform/**"
    # Exclude lock files
    - "!**/package-lock.json"
    - "!**/yarn.lock"
    - "!**/uv.lock"
    # Exclude test fixtures
    - "!**/fixtures/**"
    - "!**/testdata/**"

  # Review specific file types
  path_instructions:
    - path: "**/*.py"
      instructions: |
        Review Python code for:
        - PEP 8 compliance with Black formatting (100 char line)
        - Type hints on all function signatures
        - Docstrings for public functions
        - Error handling patterns
        - Security vulnerabilities

    - path: "**/*.ts"
      instructions: |
        Review TypeScript code for:
        - Strict TypeScript compliance
        - Proper interface definitions
        - Null safety patterns
        - Error boundaries
        - Performance considerations

    - path: "**/*.tf"
      instructions: |
        Review Terraform code for:
        - Resource naming conventions
        - Security group configurations
        - IAM least privilege
        - Tagging compliance
        - Module structure

    - path: "**/Dockerfile"
      instructions: |
        Review Dockerfiles for:
        - Multi-stage builds
        - Non-root user execution
        - Layer optimization
        - Security scanning
        - Base image versions

chat:
  # Enable auto-reply to user comments
  auto_reply: true
```

### Advanced CodeRabbit Configuration

```yaml
# .coderabbit.yaml - Advanced configuration

language: en

# Early access features
early_access: true

reviews:
  profile: assertive
  request_changes_workflow: true
  high_level_summary: true
  poem: false
  review_status: true
  collapse_walkthrough: true

  # Customize review depth
  review_depth:
    default: detailed
    # Lighter review for low-risk changes
    paths:
      "docs/**": light
      "**/*.md": light
      "**/test/**": standard

  # Security-focused review
  security:
    enabled: true
    # Fail check on critical findings
    block_on_critical: true
    # Categories to check
    categories:
      - secrets
      - sql_injection
      - xss
      - path_traversal
      - command_injection
      - ssrf

  # Performance analysis
  performance:
    enabled: true
    # Languages to analyze
    languages:
      - python
      - typescript
      - go

  # Style guide enforcement
  style:
    enabled: true
    # Reference external style guide
    style_guide_url: "https://tydukes.github.io/coding-style-guide/"

  # Custom review rules
  rules:
    - id: no-console-log
      pattern: "console\\.log\\("
      message: "Remove console.log statements before merging"
      severity: warning
      paths:
        - "src/**/*.ts"
        - "src/**/*.js"

    - id: no-todo-comments
      pattern: "TODO|FIXME|XXX|HACK"
      message: "Address TODO comments or create issues for tracking"
      severity: info

    - id: require-error-handling
      pattern: "catch\\s*\\(.*\\)\\s*\\{\\s*\\}"
      message: "Empty catch blocks should handle or log errors"
      severity: error

    - id: terraform-tags
      pattern: "resource\\s+\"aws_"
      message: "Ensure all AWS resources include required tags"
      severity: warning
      paths:
        - "**/*.tf"

  # Auto-labeling based on changes
  labels:
    - name: "security"
      patterns:
        - "**/auth/**"
        - "**/security/**"
        - "**/*secret*"
        - "**/*credential*"

    - name: "infrastructure"
      patterns:
        - "**/*.tf"
        - "**/terraform/**"
        - "**/k8s/**"

    - name: "breaking-change"
      patterns:
        - "**/api/**"
        - "**/schema/**"

  path_filters:
    - "!**/*.md"
    - "!docs/**"
    - "!**/*.lock"
    - "!**/dist/**"
    - "!**/build/**"

chat:
  auto_reply: true
  # Custom instructions for chat
  instructions: |
    When discussing code changes:
    1. Reference the style guide at https://tydukes.github.io/coding-style-guide/
    2. Provide specific line numbers for suggestions
    3. Include code examples for recommended fixes
    4. Explain the "why" behind recommendations
```

### CodeRabbit GitHub Actions Integration

```yaml
# .github/workflows/coderabbit.yml
name: CodeRabbit Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Wait for CodeRabbit review
        uses: coderabbit-ai/coderabbit-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          # Fail if critical issues found
          fail-on-critical: true
          # Wait for review to complete
          wait-for-review: true
          # Timeout in minutes
          timeout: 10
```

---

## AI Prompt Engineering for Code Reviews

### Structured Review Prompts

Create `.github/ai-review-prompts/` directory with specialized prompts:

```yaml
# .github/ai-review-prompts/security.yaml
name: Security Review Prompt
version: 1.0.0

prompt: |
  You are a senior security engineer reviewing code for vulnerabilities.

  ## Review Checklist

  ### Input Validation
  - [ ] All user inputs are validated and sanitized
  - [ ] Input length limits are enforced
  - [ ] Character encoding is properly handled

  ### Authentication & Authorization
  - [ ] Authentication is required for sensitive operations
  - [ ] Authorization checks are performed server-side
  - [ ] Session management follows best practices

  ### Data Protection
  - [ ] Sensitive data is encrypted at rest and in transit
  - [ ] Credentials are not hardcoded or logged
  - [ ] PII handling follows data protection regulations

  ### Injection Prevention
  - [ ] SQL queries use parameterized statements
  - [ ] Shell commands avoid user input interpolation
  - [ ] Template rendering prevents XSS

  ## Response Format

  For each finding:
  1. **Severity**: Critical / High / Medium / Low / Info
  2. **Location**: File path and line number
  3. **Description**: What the vulnerability is
  4. **Risk**: Potential impact if exploited
  5. **Remediation**: How to fix with code example
  6. **Reference**: CWE/OWASP identifier if applicable

examples:
  - finding: "SQL Injection vulnerability"
    severity: Critical
    location: "src/db/users.py:45"
    description: "User input directly interpolated into SQL query"
    risk: "Attacker could read/modify/delete database contents"
    remediation: |
      # Before (vulnerable)
      query = f"SELECT * FROM users WHERE id = {user_id}"

      # After (secure)
      query = "SELECT * FROM users WHERE id = %s"
      cursor.execute(query, (user_id,))
    reference: "CWE-89"
```

```yaml
# .github/ai-review-prompts/style.yaml
name: Style Guide Review Prompt
version: 1.0.0

prompt: |
  You are a code reviewer enforcing The Dukes Engineering Style Guide.
  Reference: https://tydukes.github.io/coding-style-guide/

  ## Review Focus Areas

  ### Naming Conventions
  - Variables and functions use appropriate casing for the language
  - Names are descriptive and self-documenting
  - Abbreviations are avoided unless widely understood

  ### Code Organization
  - Functions are focused and do one thing well
  - Files are appropriately sized (< 500 lines preferred)
  - Related functionality is grouped together

  ### Documentation
  - Public APIs have docstrings/JSDoc
  - Complex logic has explanatory comments
  - README files are current

  ### Error Handling
  - Errors are handled, not silently ignored
  - Error messages are actionable
  - Logging is appropriate for the error level

  ## Response Format

  Structure your review as:

  ### Summary
  Brief overview of code quality and main concerns.

  ### Style Issues
  | Location | Issue | Suggested Fix |
  |----------|-------|---------------|
  | file:line | Description | Code example |

  ### Positive Highlights
  Note any exemplary code worth highlighting.

  ### Action Items
  Prioritized list of changes needed.
```

```yaml
# .github/ai-review-prompts/performance.yaml
name: Performance Review Prompt
version: 1.0.0

prompt: |
  You are a performance optimization specialist reviewing code.

  ## Analysis Focus

  ### Algorithm Complexity
  - Identify O(n²) or worse operations
  - Flag unnecessary iterations
  - Suggest more efficient alternatives

  ### Database Operations
  - Detect N+1 query patterns
  - Identify missing indexes hints
  - Flag large result set handling issues

  ### Memory Usage
  - Identify memory leaks or retention
  - Flag large object allocations in loops
  - Suggest streaming for large data processing

  ### Concurrency
  - Identify blocking operations
  - Suggest async alternatives
  - Flag race conditions or deadlock risks

  ## Response Format

  For each performance concern:

  1. **Impact**: High / Medium / Low
  2. **Type**: CPU / Memory / I/O / Network
  3. **Location**: File and line number
  4. **Current Complexity**: O(?) if applicable
  5. **Issue Description**: What the problem is
  6. **Optimization**: Suggested improvement with code
  7. **Expected Improvement**: Estimated performance gain
```

### Custom Review Rules

Create `.github/review-rules.yaml`:

```yaml
# Custom AI review rules
version: 1.0.0

rules:
  # Python-specific rules
  python:
    - id: py-type-hints
      description: "Require type hints on function signatures"
      pattern: |
        def\s+\w+\([^)]*\)\s*:
      negative_pattern: |
        def\s+\w+\([^)]*\)\s*->\s*\w+
      message: "Add return type hint to function signature"
      severity: warning
      auto_fix: false

    - id: py-docstring
      description: "Require docstrings on public functions"
      pattern: |
        ^def\s+[a-z]
      negative_pattern: |
        ^def\s+[a-z].*:\s*\n\s+"""
      message: "Add docstring to public function"
      severity: info

  # TypeScript-specific rules
  typescript:
    - id: ts-no-any
      description: "Discourage use of 'any' type"
      pattern: |
        :\s*any\b
      message: "Replace 'any' with a specific type or 'unknown'"
      severity: warning

    - id: ts-explicit-return
      description: "Require explicit return types"
      pattern: |
        (?:async\s+)?function\s+\w+\([^)]*\)\s*\{
      negative_pattern: |
        (?:async\s+)?function\s+\w+\([^)]*\):\s*\w+
      message: "Add explicit return type to function"
      severity: warning

  # Terraform-specific rules
  terraform:
    - id: tf-tags
      description: "Require tags on AWS resources"
      pattern: |
        resource\s+"aws_
      negative_pattern: |
        tags\s*=
      message: "Add tags block to AWS resource"
      severity: error

    - id: tf-description
      description: "Require description on variables"
      pattern: |
        variable\s+"
      negative_pattern: |
        description\s*=
      message: "Add description to variable"
      severity: warning

  # General rules
  general:
    - id: no-secrets
      description: "Detect potential hardcoded secrets"
      patterns:
        - "password\\s*=\\s*[\"'][^\"']+[\"']"
        - "api_key\\s*=\\s*[\"'][^\"']+[\"']"
        - "secret\\s*=\\s*[\"'][^\"']+[\"']"
        - "token\\s*=\\s*[\"'][A-Za-z0-9+/=]{20,}[\"']"
      message: "Potential hardcoded secret detected. Use environment variables or secret manager."
      severity: critical

    - id: no-print-debug
      description: "Remove debug print statements"
      patterns:
        - "print\\("
        - "console\\.log\\("
        - "Debug\\.Log\\("
      exceptions:
        - "**/*_test.py"
        - "**/tests/**"
        - "**/debug/**"
      message: "Remove debug print/log statement before merging"
      severity: warning
```

---

## False Positive Handling

### Inline Suppression

```python
# Python: Suppress specific warnings

# coderabbit:ignore-next-line - Legacy code, scheduled for refactoring
def legacy_function():  # noqa: C901
    pass

# For multiple lines
# coderabbit:ignore-start
def intentionally_complex():
    # Complex logic with valid reason
    pass
# coderabbit:ignore-end
```

```typescript
// TypeScript: Suppress specific warnings

// coderabbit:ignore-next-line - Required for backwards compatibility
export type LegacyType = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/* coderabbit:ignore-start - Generated code */
export const generatedConstants = {
  // Auto-generated content
};
/* coderabbit:ignore-end */
```

```hcl
# Terraform: Suppress specific warnings

# coderabbit:ignore-next-line - Tags managed by external process
resource "aws_instance" "legacy" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"
}
```

### Configuration-Based Suppression

```yaml
# .coderabbit.yaml - Suppression configuration

reviews:
  # Global suppressions
  suppressions:
    - id: no-console-log
      paths:
        - "**/scripts/**"
        - "**/cli/**"
      reason: "Console output is intentional for CLI tools"

    - id: require-error-handling
      paths:
        - "**/tests/**"
      reason: "Test files may have intentional error scenarios"

    - id: no-todo-comments
      expires: "2025-06-01"
      reason: "Temporary suppression during migration phase"

  # File-level suppressions
  ignore_files:
    - path: "src/generated/**"
      reason: "Auto-generated files"
    - path: "vendor/**"
      reason: "Third-party vendored code"
    - path: "legacy/**"
      expires: "2025-12-31"
      reason: "Legacy code scheduled for removal"
```

### Creating Suppression Baseline

```bash
#!/usr/bin/env bash
# scripts/create-review-baseline.sh
# Create baseline of existing issues to focus on new code

set -euo pipefail

BASELINE_FILE=".coderabbit-baseline.json"

echo "Creating CodeRabbit baseline..."

# Run analysis and capture current findings
coderabbit analyze --output json > "${BASELINE_FILE}"

# Count findings by severity
echo "Baseline created with:"
jq -r '.findings | group_by(.severity) | .[] | "\(.[0].severity): \(length)"' "${BASELINE_FILE}"

echo ""
echo "Baseline saved to ${BASELINE_FILE}"
echo "Add to .gitignore if you don't want to track baseline changes"
```

### Dispute Resolution Process

```yaml
# .github/REVIEW_DISPUTE.md template

## AI Review Dispute Template

### Finding Details
- **Tool**: [CodeRabbit/Copilot/Other]
- **Rule ID**: [e.g., no-console-log]
- **Location**: [file:line]
- **Severity**: [Critical/High/Medium/Low]

### Reason for Dispute
[ ] False positive - code is correct as written
[ ] Intentional pattern - there's a valid reason for this approach
[ ] Context missing - AI lacks necessary context
[ ] Rule too strict - rule should be adjusted
[ ] Other: ___________

### Justification
Explain why this finding should be suppressed or the rule adjusted.

### Proposed Resolution
[ ] Add inline suppression comment
[ ] Add to baseline ignore list
[ ] Adjust rule configuration
[ ] Request rule change
[ ] Other: ___________

### Evidence
Provide any supporting evidence (links, documentation, etc.)
```

---

## Multi-Tool Integration Strategy

### Layered Review Approach

```text
┌─────────────────────────────────────────────────────────────┐
│                    PR/MR Created                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Automated Linting (Immediate)                     │
│  • Pre-commit hooks                                         │
│  • GitHub Actions / GitLab CI                               │
│  • Formatters (Black, Prettier, terraform fmt)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: AI Code Review (< 5 minutes)                      │
│  • CodeRabbit: Style, security, performance                 │
│  • GitHub Copilot: Suggestions, improvements                │
│  • Custom rules enforcement                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Security Scanning (< 10 minutes)                  │
│  • Trivy: Vulnerability scanning                            │
│  • Semgrep: Pattern-based security rules                    │
│  • Secret detection                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Human Review (Variable)                           │
│  • Focus on architecture, design, business logic            │
│  • AI findings pre-triaged                                  │
│  • Review efficiency improved                               │
└─────────────────────────────────────────────────────────────┘
```

### GitHub Actions Multi-Tool Workflow

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  # Layer 1: Automated linting
  lint:
    name: Automated Linting
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run pre-commit
        uses: pre-commit/action@v3.0.1

  # Layer 2: AI Review
  coderabbit:
    name: CodeRabbit Review
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: CodeRabbit Review
        uses: coderabbit-ai/coderabbit-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

  copilot-suggestions:
    name: Copilot Analysis
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Generate Copilot suggestions
        uses: github/copilot-code-review@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          model: gpt-4

  # Layer 3: Security scanning
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          severity: HIGH,CRITICAL
          format: sarif
          output: trivy-results.sarif

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif

  # Summary job
  review-summary:
    name: Review Summary
    runs-on: ubuntu-latest
    needs: [coderabbit, copilot-suggestions, security]
    if: always()
    steps:
      - name: Generate summary
        uses: actions/github-script@v7
        with:
          script: |
            const summary = `
            ## AI Review Summary

            | Check | Status |
            |-------|--------|
            | CodeRabbit | ${{ needs.coderabbit.result }} |
            | Copilot | ${{ needs.copilot-suggestions.result }} |
            | Security | ${{ needs.security.result }} |

            Review the comments above for detailed findings.
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
```

---

## Metrics and Monitoring

### Review Effectiveness Metrics

```yaml
# .github/ai-review-metrics.yaml
metrics:
  # Accuracy metrics
  accuracy:
    true_positives:
      description: "Valid issues identified by AI"
      target: "> 80%"

    false_positives:
      description: "Invalid issues flagged by AI"
      target: "< 10%"

    false_negatives:
      description: "Issues missed by AI but found in human review"
      target: "< 5%"

  # Efficiency metrics
  efficiency:
    review_time_saved:
      description: "Time saved compared to manual-only review"
      target: "> 30%"

    issues_per_review:
      description: "Average issues found per PR"
      baseline: 3.5

    resolution_rate:
      description: "Percentage of AI suggestions addressed"
      target: "> 90%"

  # Quality impact
  quality:
    escaped_bugs:
      description: "Bugs that reached production"
      target: "< 1 per month"

    security_findings:
      description: "Security issues caught before merge"
      baseline: 2.1

    style_violations:
      description: "Style guide violations caught"
      baseline: 5.3
```

### Dashboard Configuration

```yaml
# Example Grafana dashboard config for AI review metrics

apiVersion: 1

dashboards:
  - name: AI Code Review Metrics
    panels:
      - title: Review Accuracy
        type: gauge
        targets:
          - expr: ai_review_true_positives / (ai_review_true_positives + ai_review_false_positives)
        thresholds:
          - value: 0.7
            color: red
          - value: 0.85
            color: yellow
          - value: 0.95
            color: green

      - title: False Positive Rate
        type: timeseries
        targets:
          - expr: rate(ai_review_false_positives[7d])
        legend: "7-day rolling average"

      - title: Issues by Severity
        type: piechart
        targets:
          - expr: sum by (severity) (ai_review_findings_total)

      - title: Review Coverage
        type: stat
        targets:
          - expr: ai_reviewed_prs / total_prs * 100
        unit: percent
```

---

## Best Practices

### Configuration Management

```yaml
# Best practices for AI review tool configuration

configuration:
  version_control:
    - Store all AI tool configs in repository
    - Use semantic versioning for prompt files
    - Document changes in changelog
    - Review config changes like code

  consistency:
    - Use same rules across all AI tools
    - Align with existing linting configuration
    - Reference central style guide
    - Maintain parity between environments

  maintenance:
    - Review false positive rates monthly
    - Update rules based on team feedback
    - Deprecate outdated rules
    - Add new rules for recurring issues

  security:
    - Never include secrets in prompts
    - Review AI tool permissions regularly
    - Audit AI access to repository
    - Use minimum required permissions
```

### Team Adoption Guidelines

```markdown
## AI Code Review Adoption Checklist

### Phase 1: Pilot (Week 1-2)
- [ ] Enable AI review on 1-2 low-risk repositories
- [ ] Configure basic rules matching existing standards
- [ ] Gather initial feedback from team
- [ ] Track false positive rate

### Phase 2: Refinement (Week 3-4)
- [ ] Adjust rules based on false positives
- [ ] Add custom rules for team patterns
- [ ] Document suppression guidelines
- [ ] Train team on reviewing AI suggestions

### Phase 3: Expansion (Week 5-8)
- [ ] Enable on all active repositories
- [ ] Integrate with CI/CD pipelines
- [ ] Set up metrics dashboard
- [ ] Establish review SLAs

### Phase 4: Optimization (Ongoing)
- [ ] Monthly rule review meetings
- [ ] Quarterly effectiveness assessment
- [ ] Continuous prompt improvement
- [ ] Cross-team knowledge sharing
```

---

## Troubleshooting

### Common Issues

#### CodeRabbit Not Triggering

```yaml
# Check webhook configuration
# GitHub: Settings > Webhooks > coderabbit

# Verify .coderabbit.yaml syntax
yamllint .coderabbit.yaml

# Check if PR matches filters
reviews:
  auto_review:
    enabled: true
    # Ensure these don't exclude your PR
    ignore_title_keywords:
      - "WIP"
```

#### High False Positive Rate

```yaml
# Adjust review profile
reviews:
  profile: chill  # Less aggressive than 'assertive'

# Add more specific path instructions
path_instructions:
  - path: "legacy/**"
    instructions: "This is legacy code. Focus only on critical security issues."

# Increase baseline threshold
suppressions:
  - id: "*"
    paths: ["legacy/**"]
```

#### Review Performance Issues

```yaml
# Reduce scope for faster reviews
reviews:
  # Limit file types reviewed
  path_filters:
    - "**/*.py"
    - "**/*.ts"
    - "!**/*.test.*"

  # Reduce depth for large PRs
  review_depth:
    default: standard
    large_pr_threshold: 500  # Lines changed
    large_pr_depth: light
```

---

## References

### Tool Documentation

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [CodeRabbit Documentation](https://docs.coderabbit.ai/)
- [Amazon CodeGuru](https://docs.aws.amazon.com/codeguru/)
- [Sourcery Documentation](https://docs.sourcery.ai/)

### Security Guidelines

- [OWASP Code Review Guide](https://owasp.org/www-project-code-review-guide/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [SANS Secure Coding Guidelines](https://www.sans.org/top25-software-errors/)

### Style Guide Reference

- [The Dukes Engineering Style Guide](https://tydukes.github.io/coding-style-guide/)

---
