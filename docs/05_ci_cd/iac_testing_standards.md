---
title: "IaC Testing Philosophy and Standards"
description: "Language-agnostic testing philosophy and standards for Infrastructure as Code"
author: "Tyler Dukes"
tags: [iac, testing, terraform, ansible, ci-cd, quality-gates]
category: "CI/CD"
status: "active"
search_keywords: [iac testing, terratest, kitchen, inspec, infrastructure testing, compliance]
---

This document defines the organization-wide testing philosophy and standards for Infrastructure as Code (IaC).
These principles apply across all IaC tools including Terraform, Terragrunt, Ansible, Kubernetes manifests,
and other infrastructure automation technologies.

## 1. Testing Philosophy

### Why Test Infrastructure Code

Infrastructure code controls production systems, data, and availability. Bugs in infrastructure code can cause:

- **Production outages**: Misconfigured networking, load balancers, or DNS
- **Security vulnerabilities**: Exposed ports, weak encryption, misconfigured IAM
- **Data loss**: Incorrect database configurations, backup failures
- **Cost overruns**: Improperly scaled resources, orphaned infrastructure
- **Compliance violations**: Missing audit logs, inadequate access controls

**Testing infrastructure code is not optional—it's a fundamental requirement for production readiness.**

### Shift-Left Testing

Catch issues as early as possible in the development cycle:

```text
Developer's    Commit    CI        Integration   Production
  Machine       Hook    Pipeline     Testing      Deployment
     |            |        |             |             |
     ▼            ▼        ▼             ▼             ▼
  [Static]    [Lint]  [Unit Tests] [Integration] [Smoke Tests]
  $0 cost     $1       $10           $100          $1000+

  Cost of finding bugs increases exponentially as code moves right →
```

**Key Principles:**

1. **Fast Feedback Loops**: Developers get results in seconds/minutes, not hours
2. **Automated Validation**: No manual approval gates before basic checks
3. **Local Testing**: Tests run on developer machines before commit
4. **Pre-Commit Hooks**: Block invalid code from entering version control
5. **CI Pipeline Gating**: Automated quality gates at every stage

### The Cost of Production Bugs

Real-world impact of infrastructure bugs:

| Severity | Example | Impact | Cost |
|----------|---------|--------|------|
| Critical | Security group exposed to 0.0.0.0/0 | Data breach | $100K - $10M+ |
| High | Incorrect database configuration | Data loss | $50K - $500K |
| Medium | Misconfigured load balancer | Service degradation | $10K - $50K |
| Low | Suboptimal resource sizing | Cost inefficiency | $1K - $10K |

**Testing prevents these issues before they reach production.**

## 2. Testing Pyramid for IaC

IaC testing follows a modified testing pyramid optimized for infrastructure validation:

```text
          ╱╲ Smoke Tests (Production)
         ╱  ╲ < 5% of test effort
        ╱────╲
       ╱ Comp ╲ Compliance & Security
      ╱  liance╲ 10-15% of test effort
     ╱──────────╲
    ╱Integration╲ Integration Tests
   ╱   Tests     ╲ 20-30% of test effort
  ╱──────────────╲
 ╱   Unit Tests   ╲ Module/Role Tests
╱                  ╲ 50-60% of test effort
────────────────────
   Static Analysis   Lint, Format, Security Scans
   (Pre-requisite)   Run on every commit
```

### Static Analysis (Tier 0)

**Purpose**: Catch syntax errors, style violations, and obvious security issues

**Tools**:

- Terraform: `terraform fmt`, `terraform validate`, `tflint`, `tfsec`, `checkov`
- Ansible: `ansible-lint`, `yamllint`
- Kubernetes: `kubeval`, `kube-linter`

**Execution**: < 30 seconds, runs on every commit

**Example Coverage**:

- Syntax validation
- Formatting consistency
- Deprecated API usage
- Common security misconfigurations
- Secret detection

### Unit Tests (Tier 1)

**Purpose**: Verify individual modules/roles work as specified

**Characteristics**:

- Fast (< 10 minutes)
- Isolated (no external dependencies)
- Deterministic (same input = same output)
- Test module contracts and guarantees

**Tools**:

- Terraform: Terratest (Go), Native Terraform Tests (.tftest.hcl)
- Ansible: Molecule with Docker driver
- Kubernetes: Unit (Go testing framework)

**What to Test**:

1. **Resource Creation**: Expected resources are created
2. **Input Validation**: Invalid inputs are rejected
3. **Output Correctness**: Outputs match expected values
4. **Idempotency**: Multiple runs produce identical results
5. **Conditional Logic**: All code paths are exercised
6. **Error Handling**: Graceful handling of failures

**Example**: Testing a VPC Terraform module

```text
✓ Creates VPC with correct CIDR
✓ Creates 2 public subnets across AZs
✓ Creates 2 private subnets across AZs
✓ Creates Internet Gateway
✓ Creates NAT Gateways (one per AZ)
✓ Configures route tables correctly
✓ Rejects invalid CIDR blocks
✓ Validates AZ count >= 2
✓ Idempotent on re-apply
```

### Integration Tests (Tier 2)

**Purpose**: Verify multiple components work together

**Characteristics**:

- Slower (< 60 minutes)
- Uses real infrastructure (test environments)
- Tests cross-module interactions
- Validates end-to-end workflows

**What to Test**:

1. **Multi-Module Deployments**: VPC + EKS + RDS together
2. **Network Connectivity**: Subnets can reach each other
3. **Service Integration**: Application can connect to database
4. **DNS Resolution**: Service discovery works correctly
5. **Load Balancer Routing**: Traffic flows to correct targets

**Example**: Testing a three-tier application stack

```text
✓ VPC created successfully
✓ RDS instance accessible from private subnet
✓ EKS cluster deployed and healthy
✓ Application pods can connect to database
✓ Load balancer routes traffic to pods
✓ DNS resolves to load balancer
✓ HTTPS certificate validates correctly
✓ Health checks pass for all services
```

### Compliance Tests (Tier 3)

**Purpose**: Verify infrastructure meets security and regulatory requirements

**Tools**:

- InSpec: Compliance validation framework
- Chef InSpec: Security and compliance testing
- Open Policy Agent (OPA): Policy enforcement
- Cloud Custodian: Cloud governance

**What to Test**:

1. **Security Baselines**: CIS benchmarks, STIG compliance
2. **Access Controls**: Proper IAM permissions, least privilege
3. **Encryption**: Data encrypted at rest and in transit
4. **Audit Logging**: CloudTrail, audit logs enabled
5. **Network Security**: No public access to sensitive resources
6. **Compliance Standards**: SOC2, PCI-DSS, HIPAA requirements

**Example**: CIS AWS Foundations Benchmark

```text
✓ IAM password policy configured
✓ MFA enabled on root account
✓ CloudTrail enabled in all regions
✓ S3 buckets have encryption enabled
✓ VPC Flow Logs enabled
✓ Security groups don't allow 0.0.0.0/0 on sensitive ports
✓ EBS volumes encrypted
✓ RDS instances have backup enabled
```

### Smoke Tests (Tier 4)

**Purpose**: Verify deployed infrastructure is functioning

**Characteristics**:

- Runs in production (or production-like environment)
- Tests actual deployed resources
- Validates end-to-end functionality
- Runs post-deployment

**What to Test**:

1. **Service Health**: All services respond to health checks
2. **Connectivity**: External services can reach endpoints
3. **Authentication**: Auth flows work correctly
4. **Critical Paths**: Key user journeys function
5. **Performance**: Response times within SLAs

**Example**: Post-deployment smoke tests

```text
✓ HTTPS endpoint responds (200 OK)
✓ Health check endpoint healthy
✓ Database connection pool active
✓ Cache service responding
✓ Message queue accepting messages
✓ Monitoring and alerting active
✓ Backup jobs scheduled
```

## 3. Contract-Based Development

### What is a Contract?

A **contract** is an explicit, testable promise about what infrastructure code will create and how it will behave.

**Contracts define**:

- **Purpose**: What problem this module/role solves
- **Inputs**: Required and optional parameters
- **Outputs**: Values provided for use by other modules
- **Resources**: What infrastructure will be created
- **Behavior**: Guarantees about how infrastructure will function
- **Compatibility**: Which platforms, versions are supported

### CONTRACT.md Purpose

Every reusable module/role must include a `CONTRACT.md` file that explicitly states its guarantees.

**Benefits**:

1. **Testability**: Contracts are directly testable
2. **Documentation**: Self-documenting modules
3. **Versioning**: Clear breaking change policies
4. **Trust**: Consumers know exactly what to expect
5. **Quality**: Forces thoughtful module design

### Contract Structure

```markdown
# Module Contract: [Name]

## Purpose
[One paragraph describing what this module does]

## Guarantees

### Resources Created
- [List of infrastructure resources that will be created]

### Behavior Guarantees
1. [Specific, testable promise about behavior]
2. [Another guarantee]

### Input Requirements
[Document all inputs with validation rules]

### Output Guarantees
[Document all outputs and their format]

### Platform Support Matrix
[Which platforms/versions are supported]

## Breaking Changes Policy
[Semantic versioning rules and deprecation timeline]

## Testing Requirements
- [List of tests that must pass]
- [Coverage requirements]
```

**See**: CONTRACT.md Template (issue #169) for complete example

### Writing Testable Contracts

**BAD** (vague, untestable):

> "This module creates networking resources"

**GOOD** (specific, testable):

> "This module creates:
>
> - Exactly 1 VPC with DNS hostnames enabled
> - N public subnets (min 2, configurable)
> - N private subnets (min 2, configurable)
> - Subnets distributed across at least 2 availability zones
> - 1 Internet Gateway attached to public subnets
> - 1 NAT Gateway per availability zone for private subnets"

Every statement in the "GOOD" example can be verified with automated tests.

### Versioning and Compatibility

Use **Semantic Versioning** for infrastructure modules:

- **MAJOR** (v1.0.0 → v2.0.0): Breaking changes to interface, resources, or behavior
- **MINOR** (v1.0.0 → v1.1.0): New features, backward-compatible changes
- **PATCH** (v1.0.0 → v1.0.1): Bug fixes, no functional changes

**Breaking Change Examples**:

- Renaming input variables
- Removing output values
- Changing resource names (causes recreation)
- Removing resources
- Changing default values that affect behavior

**Breaking Change Policy**:

1. Announce in CHANGELOG.md at least 2 minor versions in advance
2. Mark deprecated features with warnings
3. Provide migration guides with examples
4. Maintain deprecated features for minimum 2 minor versions

## 4. Coverage Standards

### What to Measure

Coverage is not just about lines of code—it's about **guarantees tested**.

**Coverage Dimensions**:

1. **Guarantee Coverage**: % of contract promises verified by tests
2. **Resource Coverage**: % of resource types exercised in tests
3. **Input Coverage**: % of input variables tested (including edge cases)
4. **Output Coverage**: % of outputs validated
5. **Conditional Coverage**: % of conditional logic paths tested
6. **Platform Coverage**: % of supported platforms tested

### Minimum Coverage Thresholds

| Coverage Type | Minimum | Target | Critical Modules |
|---------------|---------|--------|------------------|
| Guarantee Coverage | 100% | 100% | 100% |
| Resource Coverage | 80% | 90% | 100% |
| Input Coverage | 70% | 85% | 95% |
| Output Coverage | 100% | 100% | 100% |
| Conditional Coverage | 80% | 90% | 95% |
| Platform Coverage | 2+ platforms | All supported | All supported |

**Critical Modules** include:

- Security-related modules (IAM, networking, encryption)
- Data storage modules (databases, object storage)
- Publicly published modules
- Modules used across multiple teams/projects

### Risk-Based Coverage Decisions

Not all code requires equal coverage. Use risk assessment:

**High Risk** (requires maximum coverage):

- Production infrastructure
- Security configurations
- Data storage and backups
- Network access controls
- Compliance-related resources

**Medium Risk** (requires standard coverage):

- Development/staging environments
- Non-critical applications
- Internal tools
- Monitoring and logging

**Low Risk** (can have reduced coverage):

- Temporary test environments
- Proof-of-concept code
- Development utilities
- Documentation-only changes

### Platform/OS Coverage Requirements

**Minimum Platform Coverage**: Test on at least 2 different platforms/OS distributions

**Platform Selection Guidelines**:

1. **Primary Platform**: Most commonly used in production
2. **Secondary Platform**: Second most common or most different architecture
3. **Edge Case Platform**: If claiming support, must test

**Examples**:

- **Ansible Roles**: Ubuntu 22.04 (primary) + RHEL 9 (secondary) + Windows (if supported)
- **Terraform Modules**: AWS (primary) + Azure (if multi-cloud) + GCP (if supported)
- **Kubernetes**: EKS (primary) + GKE (secondary) + on-prem (if supported)

## 5. Test Organization

### Directory Structure Standards

Organize tests in a consistent, discoverable structure:

#### Terraform Modules

```text
modules/
└── vpc/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    ├── CONTRACT.md
    ├── README.md
    ├── examples/
    │   └── complete/
    │       └── main.tf
    └── tests/
        ├── unit/
        │   └── vpc_test.go
        ├── integration/
        │   └── full_stack_test.go
        ├── compliance/
        │   └── security_baseline.rb
        └── fixtures/
            └── test_vpc.tfvars
```

#### Ansible Roles

```text
roles/
└── webserver/
    ├── tasks/
    │   └── main.yml
    ├── defaults/
    │   └── main.yml
    ├── meta/
    │   └── main.yml
    ├── CONTRACT.md
    ├── README.md
    └── molecule/
        ├── default/
        │   ├── molecule.yml
        │   ├── converge.yml
        │   └── verify.yml
        ├── compliance/
        │   ├── molecule.yml
        │   └── tests/
        │       └── test_security.rb
        └── multi-platform/
            └── molecule.yml
```

### Naming Conventions

**Test Files**:

- Unit tests: `*_test.go`, `test_*.py`, `*_spec.rb`
- Integration tests: `*_integration_test.go`, `test_*_integration.py`
- Compliance tests: `*_compliance.rb`, `security_baseline.rb`

**Test Functions/Methods**:

- Use descriptive names: `TestVPCCreatesCorrectSubnets` (not `TestVPC`)
- Follow pattern: `Test[Module][What]` or `test_[module]_[what]`
- Be specific: `TestWebserverInstallsNginxPackage` (not `TestInstall`)

### Test Data Management

**Principles**:

1. **No Secrets in Test Data**: Use fake credentials, placeholder values
2. **Realistic But Safe**: Test data resembles production but is clearly fake
3. **Version Controlled**: Test fixtures in git, not environment variables
4. **Isolated**: Each test uses independent test data
5. **Repeatable**: Same test data produces same results

**Test Data Locations**:

- **Fixtures**: `tests/fixtures/*.tfvars`, `molecule/default/vars.yml`
- **Mock Responses**: `tests/mocks/*.json`
- **Test Certificates**: `tests/fixtures/certs/*.pem` (self-signed)

**Example Test Fixture**:

```yaml
# tests/fixtures/test_config.yml
vpc_cidr: "10.0.0.0/16"
environment: "test"
project: "test-project"
# DO NOT use real values
aws_account_id: "123456789012"  # Fake account
```

### Fixture and Mock Usage

**When to Use Fixtures**:

- Consistent test data across multiple tests
- Complex configuration structures
- Known-good examples for regression testing

**When to Use Mocks**:

- External API calls (AWS API, cloud providers)
- Expensive operations (avoid real resource creation in unit tests)
- Non-deterministic responses (random values, timestamps)

**Example Mock**:

```python
# Mock AWS API responses in unit tests
@mock.patch('boto3.client')
def test_s3_bucket_creation(mock_boto):
    mock_s3 = mock_boto.return_value
    mock_s3.create_bucket.return_value = {'Location': '/test-bucket'}

    # Test code that creates S3 bucket
    result = create_bucket('test-bucket')

    assert result['Location'] == '/test-bucket'
    mock_s3.create_bucket.assert_called_once()
```

## 6. Quality Gates

### Tiered Enforcement Approach

Introduce quality gates progressively to avoid disrupting development:

```text
Phase 1          Phase 2              Phase 3
Warning Only     Advisory             Strict Enforcement
(Weeks 1-2)      (Weeks 3-4)          (Week 5+)

┌─────────┐      ┌─────────┐          ┌─────────┐
│ Lint    │      │ Lint    │          │ Lint    │
│ Fails   │──▶   │ Fails   │──▶       │ Fails   │──▶ ❌ Block Merge
│         │      │         │          │         │
│ ⚠️ Warn │      │ 🔧 Fix  │          │ 🚫 Block│
│ Continue│      │ + Comment│          │ Merge   │
└─────────┘      └─────────┘          └─────────┘

Allow Merge      Allow Merge          Block Merge
+ Warning        + MR Comment         Hard Requirement
```

### Phase 1: Warning Only (Weeks 1-2)

**Goal**: Build awareness without blocking work

**Behavior**:

- Tests run on every PR
- Failures logged but don't block merge
- Metrics collected on failure rates
- Team sees quality status but not forced to fix

**Implementation**:

```yaml
# GitLab CI
lint:terraform:
  script: terraform fmt -check || echo "⚠️ Formatting issues detected"
  allow_failure: true

# GitHub Actions
- name: Lint Terraform
  run: terraform fmt -check
  continue-on-error: true
```

**Success Criteria**: Failure rate < 20% before moving to Phase 2

### Phase 2: Advisory (Weeks 3-4)

**Goal**: Provide automated fixes and guidance

**Behavior**:

- Tests run and report failures
- Automated fix suggestions posted to MR/PR
- Failures still don't block merge (yet)
- Dashboard shows quality trends

**Implementation**:

- Post MR/PR comments with fix instructions
- Provide automated fix commands
- Link to documentation and examples
- Show quality trend (improving/degrading)

**Example MR Comment**:

```markdown
## 🔧 Terraform Formatting Issues

Formatting issues detected in 3 files. Run this command to fix:

​```bash
terraform fmt -recursive
​```

**Files affected**:
- modules/vpc/main.tf
- modules/rds/variables.tf

**Documentation**: [Terraform Style Guide](link)
```

**Success Criteria**: Failure rate < 10% before moving to Phase 3

### Phase 3: Strict Enforcement (Week 5+)

**Goal**: Enforce quality standards

**Behavior**:

- Tests run on every PR
- Failures block merge
- Exceptions require explicit approval
- Always enforced on main/production branches

**Implementation**:

```yaml
# GitLab CI
lint:terraform:
  script: terraform fmt -check
  allow_failure: false
  rules:
    - if: $ENFORCEMENT_PHASE == "strict"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH  # Always strict on main

# GitHub Actions
- name: Lint Terraform
  run: terraform fmt -check
  # No continue-on-error = blocks on failure
```

**Success Criteria**: < 5% failure rate, minimal exceptions needed

### Exceptions and Override Policies

**When Exceptions Are Allowed**:

1. **Emergency Fixes**: Production incidents requiring immediate fix
2. **External Dependencies**: Third-party module failures outside our control
3. **Tool Bugs**: Known issues in linting/testing tools
4. **Deprecation Periods**: Temporary bypass during breaking changes

**Exception Process**:

1. Create exception request (GitHub issue, Jira ticket)
2. Document reason and mitigation plan
3. Obtain approval from tech lead or higher
4. Set expiration date (max 30 days)
5. Track exceptions in dashboard
6. Review and close or extend before expiration

**Exception Request Template**:

```markdown
## Quality Gate Exception Request

**Requester**: [Name]
**Date**: [YYYY-MM-DD]
**Expiration**: [YYYY-MM-DD] (max 30 days)

### What quality gate is being bypassed?
[Specific check/test being skipped]

### Why is this exception needed?
[Detailed justification]

### What is the risk?
[Impact if bypassed check would have failed]

### Mitigation Plan
[How will risk be addressed?]

### Approval
- [ ] Tech Lead: [Name]
- [ ] Security Team (if security-related): [Name]
```

### Emergency Bypass Procedures

**For Production Incidents Only**:

1. **Verbal Approval**: Tech lead or on-call approves verbally
2. **Skip Quality Gates**: Merge with `[emergency-bypass]` in commit message
3. **Create Incident Ticket**: Document incident and bypass
4. **Post-Incident Review**: Within 24 hours, review what was bypassed
5. **Remediation**: Fix bypassed checks within 7 days

**Automated Detection**:

```yaml
# Detect emergency bypasses in CI
emergency-bypass:
  script:
    - |
      if echo "$CI_COMMIT_MESSAGE" | grep -q "\[emergency-bypass\]"; then
        echo "🚨 Emergency bypass detected"
        # Post to Slack, create ticket
        ./scripts/notify_emergency_bypass.sh
      fi
  allow_failure: true
```

## 7. CI/CD Integration Patterns

### Pipeline Stage Organization

Organize CI/CD pipelines in three tiers matching the testing pyramid:

```text
Tier 1: Validate (Fast Feedback)
├─ Lint (YAML, Terraform, Ansible)
├─ Format Check
├─ Security Scan (Static)
└─ Secret Detection
   ⏱️ < 2 minutes

Tier 2: Test (Unit & Module)
├─ Unit Tests (Terratest, Molecule)
├─ Module Contract Verification
└─ Parallel Platform Tests
   ⏱️ < 10 minutes

Tier 3: Integration (Full Stack)
├─ Integration Tests
├─ Compliance Verification (InSpec)
└─ Smoke Tests
   ⏱️ < 60 minutes
   🕒 Nightly or Pre-Release
```

### Artifact Generation and Retention

**Generated Artifacts**:

1. **Test Reports**: JUnit XML, JSON results
2. **Coverage Reports**: Cobertura, LCOV formats
3. **Compliance Evidence**: InSpec JSON, audit logs
4. **Plan Files**: Terraform plans for review
5. **Logs**: Detailed execution logs for debugging

**Retention Policy**:

| Artifact Type | Retention | Justification |
|---------------|-----------|---------------|
| Test Results | 7 days | Short-term debugging |
| Coverage Reports | 30 days | Trend analysis |
| Compliance Evidence | 90 days | Audit requirements |
| Release Artifacts | 365 days | Production traceability |
| Failed Test Logs | 14 days | Debugging failures |

**Storage Optimization**:

- Compress large artifacts (tar.gz)
- Store only on failure for debugging artifacts
- Archive to long-term storage (S3 Glacier) after retention period

### Reporting and Dashboards

**Required Dashboards**:

1. **Test Coverage Dashboard**:
   - Coverage trends over time
   - Per-module coverage breakdown
   - Platform coverage matrix

2. **Quality Gates Dashboard**:
   - Pass/fail rates by gate
   - Enforcement phase status
   - Exception tracking

3. **Pipeline Performance Dashboard**:
   - Average pipeline duration
   - Test execution times
   - Flaky test tracking

4. **Compliance Dashboard**:
   - Compliance test results
   - CIS benchmark scores
   - Security scan findings

**Tool Recommendations**:

- Grafana with GitLab/GitHub metrics
- SonarQube for code quality
- Allure for test reporting
- Custom dashboards with Prometheus + Grafana

### Feedback Mechanisms

**Merge/Pull Request Comments**:

- Test result summary
- Coverage metrics with trends
- Failed test details with logs
- Fix suggestions with commands
- Links to dashboards and documentation

**Badges**:

- Coverage badge with percentage
- Build status badge
- Compliance status badge
- Latest release badge

**Notifications**:

- Slack/Teams notifications for failures
- Email for critical compliance failures
- GitHub/GitLab notifications for reviewers
- Weekly digest of quality metrics

## 8. Developer Experience

### Pre-Commit Hooks

**Required Pre-Commit Checks**:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs

  - repo: https://github.com/ansible/ansible-lint
    rev: v6.20.0
    hooks:
      - id: ansible-lint

  - repo: https://github.com/adrienverge/yamllint
    rev: v1.32.0
    hooks:
      - id: yamllint

  - repo: https://github.com/trufflesecurity/trufflehog
    rev: v3.54.0
    hooks:
      - id: trufflehog
```

**Best Practices**:

- Keep hooks fast (< 10 seconds total)
- Only run checks on changed files
- Provide auto-fix where possible
- Allow bypass for emergencies (`git commit --no-verify`)
- Track bypass usage for metrics

### Local Testing Capabilities

**Developers Must Be Able to**:

1. **Run All Tests Locally**: No "CI-only" tests
2. **Test Individual Modules**: Don't require full stack
3. **Use Mocked Dependencies**: Avoid real cloud resources for unit tests
4. **Get Fast Feedback**: Unit tests complete in < 2 minutes locally
5. **Debug Failures**: Clear error messages and logs

**Local Testing Tools**:

- **Terraform**: `terraform test`, Terratest with local Docker
- **Ansible**: `molecule test` with Docker driver
- **GitLab CI**: `gitlab-ci-local` for running pipelines locally
- **GitHub Actions**: `act` for local action testing

**Example Local Test Commands**:

```bash
# Terraform module
cd modules/vpc
terraform test  # Run native Terraform tests
cd tests && go test -v ./...  # Run Terratest

# Ansible role
cd roles/webserver
molecule test  # Run full test sequence
molecule test -s compliance  # Run compliance tests

# GitLab CI pipeline
gitlab-ci-local  # Run full pipeline
gitlab-ci-local --job lint:terraform  # Run specific job
```

### Fast Feedback Mechanisms

**Feedback Speed Targets**:

- **Pre-Commit Hooks**: < 10 seconds
- **Lint Stage**: < 2 minutes
- **Unit Tests**: < 10 minutes
- **Integration Tests**: < 60 minutes
- **Full Pipeline**: < 90 minutes

**Optimization Strategies**:

1. **Parallel Execution**: Run tests across multiple runners
2. **Change Detection**: Only test changed modules
3. **Caching**: Cache dependencies (pip, npm, Go modules)
4. **Incremental Testing**: Run smoke tests first, full tests later
5. **Sharding**: Split large test suites across runners

### Documentation Requirements

**Every Module/Role Must Have**:

1. **README.md**: Usage examples, inputs, outputs
2. **CONTRACT.md**: Explicit guarantees and promises
3. **CHANGELOG.md**: Version history and breaking changes
4. **Testing Section**: How to run tests, what they verify

**README.md Template**:

```markdown
# Module Name

[One-sentence description]

## Usage

[Minimal working example]

## Testing

[How to run tests locally]

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|

## Outputs

| Name | Type | Description |
|------|------|-------------|

## Platform Support

- Platform 1: Tested
- Platform 2: Tested

## See Also

- [CONTRACT.md](CONTRACT.md) - Module guarantees
- [CHANGELOG.md](CHANGELOG.md) - Version history
```

## 9. Compliance & Governance

### Evidence Generation

**Required Evidence**:

1. **Test Execution Logs**: Prove tests were run
2. **Test Results**: JUnit XML, JSON reports
3. **Compliance Reports**: InSpec JSON, CIS benchmark results
4. **Coverage Reports**: Code and guarantee coverage
5. **Audit Trails**: Who approved, when, what changed

**Evidence Format**:

- **Machine-Readable**: JSON, XML for automated processing
- **Human-Readable**: HTML, PDF reports for auditors
- **Signed/Verified**: Cryptographic signatures for tamper-proofing
- **Timestamped**: Precise execution timestamps
- **Traceable**: Linked to git commits and PRs

**Example Compliance Evidence**:

```json
{
  "report_type": "compliance_verification",
  "timestamp": "2024-01-15T10:30:00Z",
  "module": "vpc-module-v1.2.0",
  "commit_sha": "abc123def456",
  "pull_request": "https://github.com/org/repo/pull/123",
  "tests_executed": {
    "total": 45,
    "passed": 45,
    "failed": 0,
    "skipped": 0
  },
  "compliance_checks": {
    "cis_aws_foundations": {
      "total": 25,
      "passed": 25,
      "failed": 0,
      "score": "100%"
    },
    "pci_dss": {
      "total": 15,
      "passed": 15,
      "failed": 0,
      "score": "100%"
    }
  },
  "evidence_files": [
    "artifacts/junit-report.xml",
    "artifacts/inspec-results.json",
    "artifacts/coverage-report.xml"
  ],
  "approved_by": "tech-lead@example.com",
  "verification_signature": "sha256:..."
}
```

### Audit Trail Maintenance

**What to Track**:

1. **Code Changes**: Git commits, PRs, approvals
2. **Test Results**: All test executions with results
3. **Quality Gate Bypasses**: Who, when, why, approval
4. **Deployment Events**: What was deployed, when, by whom
5. **Access Changes**: IAM modifications, permission grants

**Audit Trail Storage**:

- **Git History**: Permanent record of code changes
- **CI/CD Logs**: Retained per retention policy
- **Centralized Logging**: CloudWatch, Splunk, ELK stack
- **Compliance Databases**: Long-term audit storage

**Audit Trail Query Examples**:

```sql
-- Find all quality gate bypasses in last 30 days
SELECT commit_sha, author, bypass_reason, approved_by, timestamp
FROM audit_log
WHERE event_type = 'quality_gate_bypass'
  AND timestamp > NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- Find all deployments that failed compliance checks
SELECT deployment_id, module, compliance_score, deployer, timestamp
FROM deployments
WHERE compliance_score < 100
ORDER BY timestamp DESC;
```

### Regulatory Requirements

**SOC 2 Requirements**:

- Automated security testing in CI/CD
- Evidence of test execution
- Access control audit logs
- Change management records
- Incident response documentation

**PCI-DSS Requirements**:

- Network segmentation testing
- Encryption verification
- Access control validation
- Vulnerability scanning
- Quarterly compliance reviews

**HIPAA Requirements**:

- Data encryption verification
- Access audit logs
- Security risk assessments
- Breach notification procedures
- Business associate agreements

**Compliance Testing Integration**:

```yaml
# Compliance-specific test job
compliance:pci:
  stage: compliance
  script:
    - inspec exec compliance/pci-dss.rb --reporter json:pci-results.json
  artifacts:
    reports:
      junit: pci-results.json
    expire_in: 365 days  # Long retention for audit
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "schedule"
```

### Compliance-Ready Reporting

**Report Requirements**:

1. **Executive Summary**: High-level compliance status
2. **Detailed Findings**: Specific pass/fail results
3. **Evidence Links**: Artifacts, logs, screenshots
4. **Remediation Plans**: For any failures
5. **Trend Analysis**: Compliance score over time

**Report Generation**:

```bash
# Generate compliance report
inspec exec compliance/ \
  --reporter html:compliance-report.html \
  --reporter json:compliance-report.json \
  --reporter cli

# Upload to compliance dashboard
aws s3 cp compliance-report.html s3://compliance-reports/$(date +%Y-%m-%d)/
```

## 10. Continuous Improvement

### Metrics to Track

**Quality Metrics**:

1. **Test Coverage**: Overall and per-module
2. **Test Pass Rate**: % of tests passing
3. **Flaky Test Rate**: % of tests with inconsistent results
4. **Bug Escape Rate**: Bugs found in production vs. testing
5. **Mean Time to Detection (MTTD)**: Time from bug introduction to detection

**Performance Metrics**:

1. **Pipeline Duration**: Total time for full pipeline
2. **Test Execution Time**: Time per test suite
3. **Feedback Loop Time**: Commit to test results
4. **Build Success Rate**: % of pipelines passing
5. **Deployment Frequency**: How often we deploy

**Process Metrics**:

1. **Quality Gate Bypass Rate**: % of merges bypassing gates
2. **Exception Request Rate**: How many exceptions needed
3. **Pre-Commit Hook Bypass Rate**: % of commits without hooks
4. **Documentation Completeness**: % of modules with CONTRACT.md
5. **Platform Coverage**: % of modules tested on all platforms

### Review Cycles

**Weekly Reviews**:

- Test failure trends
- Flaky test identification
- Quality gate bypass analysis
- Pipeline performance

**Monthly Reviews**:

- Coverage trend analysis
- Compliance status review
- Exception requests review
- Tool and process improvements

**Quarterly Reviews**:

- Contract maintenance (update guarantees)
- Platform support review (add/remove platforms)
- Testing strategy assessment
- Regulatory compliance audit

**Annual Reviews**:

- Comprehensive testing standards review
- Tool evaluation and upgrades
- Security standards updates
- Industry best practices alignment

### Contract Maintenance

**Quarterly Contract Review**:

1. **Accuracy Check**: Do guarantees match current behavior?
2. **Completeness Check**: Are all behaviors documented?
3. **Platform Update**: Add/remove supported platforms
4. **Deprecation Planning**: Mark features for removal
5. **Test Alignment**: Do tests verify all guarantees?

**Contract Update Process**:

```markdown
## Contract Review Checklist

- [ ] Reviewed all "Guarantees" sections
- [ ] Verified platform support matrix is current
- [ ] Updated breaking changes policy
- [ ] Confirmed test coverage matches guarantees
- [ ] Updated examples and usage documentation
- [ ] Checked for deprecated features
- [ ] Planned next version changes
```

### Platform Expansion

**When to Add Platform Support**:

1. **Business Need**: New platform used in production
2. **Customer Request**: External users need different platform
3. **Risk Reduction**: Avoid vendor lock-in
4. **Compliance**: Regulatory requirement for specific platform

**Platform Addition Process**:

1. **Evaluate Feasibility**: Can module work on new platform?
2. **Update Contract**: Add platform to support matrix
3. **Add Platform Tests**: Create test scenarios
4. **Document Differences**: Platform-specific behavior
5. **Update CI/CD**: Add platform to test matrix
6. **Announce Support**: Update README, release notes

**Example Platform Addition**:

```yaml
# Before: Only testing Ubuntu
test:ansible:
  matrix:
    - PLATFORM: [ubuntu-22.04]

# After: Added RHEL support
test:ansible:
  matrix:
    - PLATFORM: [ubuntu-22.04, rhel-9]
```

---

## Summary

This document defines the organization-wide standards for Infrastructure as Code testing. Key principles:

1. **Test Everything**: IaC bugs are expensive; testing prevents them
2. **Shift Left**: Catch issues early for lowest cost
3. **Contract-Driven**: Test what you promise
4. **Progressive Enforcement**: Start permissive, tighten gradually
5. **Evidence-Based**: Generate compliance-ready artifacts
6. **Developer-Friendly**: Fast feedback, local testing, good DX
7. **Continuous Improvement**: Regular reviews, metric tracking

**See Also**:

- [Terraform Testing Guide](../02_language_guides/terraform.md#testing)
- [Ansible Testing Guide](../02_language_guides/ansible.md#testing-with-molecule)
- [GitLab CI Pipeline Architecture](../02_language_guides/gitlab_ci.md#tiered-pipeline-architecture)
- [CONTRACT.md Template](../04_templates/contract_template.md)
- [Testing Documentation Template](../04_templates/testing_docs_template.md)

---

*This living document is reviewed quarterly and updated based on lessons learned,
industry best practices, and regulatory requirements.*
