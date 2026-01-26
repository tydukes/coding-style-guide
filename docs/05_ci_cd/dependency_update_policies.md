---
title: "Dependency Update Policies"
description: "Comprehensive standards for automated dependency updates using Renovate and Dependabot, including update frequency, automerge policies, security handling, and rollback strategies"
author: "Tyler Dukes"
tags: [dependencies, renovate, dependabot, automation, security, updates]
category: "CI/CD"
status: "active"
---

## Introduction

Automated dependency updates keep applications secure and up-to-date while minimizing manual maintenance overhead.
This guide defines comprehensive standards for configuring Renovate and Dependabot across all project types.

---

## Table of Contents

1. [Update Frequency Standards](#update-frequency-standards)
2. [Renovate Configuration](#renovate-configuration)
3. [Dependabot Configuration](#dependabot-configuration)
4. [Automerge Policies](#automerge-policies)
5. [Security Vulnerability Handling](#security-vulnerability-handling)
6. [Dependency Grouping](#dependency-grouping)
7. [Testing Requirements](#testing-requirements)
8. [Rollback Strategies](#rollback-strategies)
9. [Notification and Escalation](#notification-and-escalation)
10. [Exemption Handling](#exemption-handling)
11. [Multi-Ecosystem Projects](#multi-ecosystem-projects)
12. [Monorepo Configuration](#monorepo-configuration)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

---

## Update Frequency Standards

### Recommended Schedules

Different dependency types require different update frequencies:

| Dependency Type | Frequency | Rationale |
|----------------|-----------|-----------|
| Security patches | Immediate | Critical vulnerabilities require urgent fixes |
| Runtime dependencies | Weekly | Balance freshness with stability |
| Development dependencies | Weekly | Lower risk, can batch updates |
| Major versions | Monthly | Requires planning and testing |
| Docker base images | Weekly | Security patches frequent |
| GitHub Actions | Weekly | New features and security fixes |
| Terraform providers | Bi-weekly | Infrastructure stability priority |

### Schedule Configuration Examples

**Renovate - Multiple Schedules**:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "schedule": ["before 6am on Monday"],
  "timezone": "America/New_York",
  "packageRules": [
    {
      "description": "Security updates - immediate",
      "matchUpdateTypes": ["patch"],
      "matchCategories": ["security"],
      "schedule": ["at any time"],
      "automerge": true
    },
    {
      "description": "Runtime dependencies - weekly",
      "matchDepTypes": ["dependencies"],
      "schedule": ["before 6am on Monday"]
    },
    {
      "description": "Dev dependencies - weekly batch",
      "matchDepTypes": ["devDependencies"],
      "schedule": ["before 6am on Monday"],
      "groupName": "dev dependencies"
    },
    {
      "description": "Major versions - monthly review",
      "matchUpdateTypes": ["major"],
      "schedule": ["before 6am on the first day of the month"]
    },
    {
      "description": "Terraform providers - bi-weekly",
      "matchManagers": ["terraform"],
      "schedule": ["before 6am on Monday", "before 6am on the 15th day of the month"]
    }
  ]
}
```

**Dependabot - Ecosystem Schedules**:

```yaml
version: 2
updates:
  # NPM - weekly Monday morning
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
      timezone: "America/New_York"

  # Python - weekly Monday morning
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"

  # Docker - weekly for security patches
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"

  # GitHub Actions - weekly
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  # Terraform - bi-weekly
  - package-ecosystem: "terraform"
    directory: "/infrastructure"
    schedule:
      interval: "weekly"
```

---

## Renovate Configuration

### Basic Renovate Configuration

**renovate.json** (repository root):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":semanticCommits",
    ":preserveSemverRanges"
  ],
  "labels": ["dependencies", "renovate"],
  "prConcurrentLimit": 10,
  "prHourlyLimit": 2,
  "minimumReleaseAge": "3 days",
  "internalChecksFilter": "strict"
}
```

### Extended Configuration

**renovate.json5** (with comments):

```json5
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",

  // Base configuration presets
  "extends": [
    "config:recommended",
    ":semanticCommits",
    ":preserveSemverRanges",
    ":rebaseStalePrs",
    ":enableVulnerabilityAlerts",
    "group:allNonMajor"
  ],

  // PR and scheduling settings
  "schedule": ["before 6am on Monday"],
  "timezone": "America/New_York",
  "prConcurrentLimit": 10,
  "prHourlyLimit": 2,
  "branchConcurrentLimit": 20,

  // Stability settings
  "minimumReleaseAge": "3 days",
  "stabilityDays": 3,
  "internalChecksFilter": "strict",

  // PR settings
  "labels": ["dependencies", "renovate"],
  "reviewers": ["team:platform"],
  "assignees": ["@me"],
  "assignAutomerge": true,

  // Commit message format
  "commitMessagePrefix": "chore(deps):",
  "commitMessageTopic": "{{depName}}",
  "commitMessageExtra": "from {{currentVersion}} to {{newVersion}}",

  // Automerge defaults
  "automerge": false,
  "automergeType": "pr",
  "automergeStrategy": "squash",

  // Package rules for different scenarios
  "packageRules": [
    // Automerge patch and minor for non-breaking
    {
      "description": "Automerge patch updates",
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "pr"
    },
    {
      "description": "Automerge minor dev dependencies",
      "matchUpdateTypes": ["minor"],
      "matchDepTypes": ["devDependencies"],
      "automerge": true
    },

    // Major versions need manual review
    {
      "description": "Major versions require review",
      "matchUpdateTypes": ["major"],
      "labels": ["type:breaking-change"],
      "automerge": false,
      "prPriority": 10
    },

    // Security updates get priority
    {
      "description": "Security updates - high priority",
      "matchCategories": ["security"],
      "labels": ["security", "priority:critical"],
      "schedule": ["at any time"],
      "automerge": true,
      "prPriority": 100
    }
  ]
}
```

### Language-Specific Renovate Rules

**JavaScript/TypeScript Projects**:

```json
{
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "description": "TypeScript ecosystem updates",
      "matchPackagePatterns": ["^typescript", "^@types/"],
      "groupName": "TypeScript packages",
      "automerge": true,
      "automergeType": "pr"
    },
    {
      "description": "ESLint and Prettier formatting",
      "matchPackagePatterns": ["^eslint", "^prettier", "^@typescript-eslint/"],
      "groupName": "linting and formatting",
      "automerge": true
    },
    {
      "description": "Testing framework updates",
      "matchPackagePatterns": ["^jest", "^@testing-library/", "^vitest"],
      "groupName": "testing packages",
      "automerge": true
    },
    {
      "description": "React ecosystem",
      "matchPackagePatterns": ["^react", "^@types/react"],
      "groupName": "React packages",
      "automerge": false
    },
    {
      "description": "Build tools",
      "matchPackagePatterns": ["^webpack", "^vite", "^esbuild", "^rollup"],
      "groupName": "build tools",
      "automerge": false
    }
  ]
}
```

**Python Projects**:

```json
{
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "description": "Python testing frameworks",
      "matchPackagePatterns": ["^pytest", "^coverage", "^tox"],
      "groupName": "Python testing",
      "automerge": true
    },
    {
      "description": "Python linting and formatting",
      "matchPackagePatterns": ["^black", "^flake8", "^mypy", "^ruff", "^isort"],
      "groupName": "Python linting",
      "automerge": true
    },
    {
      "description": "Django ecosystem",
      "matchPackagePatterns": ["^django", "^djangorestframework"],
      "groupName": "Django packages",
      "automerge": false
    },
    {
      "description": "AWS SDK updates",
      "matchPackagePatterns": ["^boto3", "^botocore", "^awscli"],
      "groupName": "AWS SDK",
      "automerge": false,
      "minimumReleaseAge": "7 days"
    }
  ]
}
```

**Terraform Projects**:

```json
{
  "extends": ["config:recommended"],
  "terraform": {
    "enabled": true
  },
  "packageRules": [
    {
      "description": "Terraform AWS provider",
      "matchManagers": ["terraform"],
      "matchPackagePatterns": ["^hashicorp/aws"],
      "groupName": "Terraform AWS provider",
      "automerge": false,
      "minimumReleaseAge": "7 days"
    },
    {
      "description": "Terraform modules - internal",
      "matchManagers": ["terraform"],
      "matchPackagePatterns": ["^github.com/your-org/"],
      "automerge": true
    },
    {
      "description": "Terraform modules - external",
      "matchManagers": ["terraform"],
      "matchSourceUrlPrefixes": ["https://registry.terraform.io/"],
      "automerge": false,
      "minimumReleaseAge": "14 days"
    }
  ]
}
```

### Renovate Self-Hosted Configuration

**config.js** (self-hosted Renovate):

```javascript
module.exports = {
  platform: 'github',
  endpoint: 'https://api.github.com/',
  token: process.env.RENOVATE_TOKEN,

  // Repository discovery
  autodiscover: true,
  autodiscoverFilter: ['org/repo-*', 'org/service-*'],

  // Global defaults
  onboarding: true,
  onboardingConfig: {
    extends: ['config:recommended'],
    labels: ['dependencies'],
  },

  // Rate limiting
  prConcurrentLimit: 10,
  prHourlyLimit: 5,

  // Logging
  logLevel: 'info',
  logFile: '/var/log/renovate/renovate.log',
  logFileLevel: 'debug',

  // Caching
  cacheDir: '/tmp/renovate-cache',
  containerbaseDir: '/tmp/containerbase',

  // Security
  allowedPostUpgradeCommands: [],
  allowCustomCrateRegistries: false,
  allowPlugins: false,

  // Scheduling
  schedule: ['before 6am'],
  timezone: 'America/New_York',
};
```

---

## Dependabot Configuration

### Basic Dependabot Configuration

**.github/dependabot.yml**:

```yaml
version: 2
registries:
  npm-npmjs:
    type: npm-registry
    url: https://registry.npmjs.org

updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
      timezone: "America/New_York"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "javascript"
    commit-message:
      prefix: "chore"
      include: "scope"
```

### Extended Multi-Ecosystem Configuration

**.github/dependabot.yml** (comprehensive):

```yaml
version: 2

# Private registry authentication
registries:
  npm-github:
    type: npm-registry
    url: https://npm.pkg.github.com
    token: ${{ secrets.GITHUB_TOKEN }}
  pypi-private:
    type: python-index
    url: https://pypi.example.com/simple/
    username: ${{ secrets.PYPI_USER }}
    password: ${{ secrets.PYPI_PASSWORD }}

updates:
  # JavaScript/TypeScript dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
      timezone: "America/New_York"
    open-pull-requests-limit: 10
    registries:
      - npm-github
    reviewers:
      - "frontend-team"
    labels:
      - "dependencies"
      - "javascript"
    commit-message:
      prefix: "chore"
      prefix-development: "chore"
      include: "scope"
    ignore:
      # Skip major version updates for stable packages
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
    groups:
      # Group related packages
      typescript:
        patterns:
          - "typescript"
          - "@types/*"
      testing:
        patterns:
          - "jest"
          - "@testing-library/*"
          - "vitest"
      linting:
        patterns:
          - "eslint*"
          - "prettier*"

  # Python dependencies
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
    open-pull-requests-limit: 10
    registries:
      - pypi-private
    reviewers:
      - "backend-team"
    labels:
      - "dependencies"
      - "python"
    commit-message:
      prefix: "chore"
    allow:
      - dependency-type: "direct"
    groups:
      pytest:
        patterns:
          - "pytest*"
          - "coverage"
      linting:
        patterns:
          - "black"
          - "flake8*"
          - "mypy*"
          - "ruff"
      aws:
        patterns:
          - "boto3"
          - "botocore"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "github-actions"
    commit-message:
      prefix: "ci"
    groups:
      actions:
        patterns:
          - "actions/*"

  # Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "docker"
    commit-message:
      prefix: "build"

  # Terraform
  - package-ecosystem: "terraform"
    directory: "/infrastructure"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "terraform"
    commit-message:
      prefix: "infra"
    groups:
      aws-providers:
        patterns:
          - "hashicorp/aws"
          - "hashicorp/awscc"

  # Go modules
  - package-ecosystem: "gomod"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "go"
    commit-message:
      prefix: "chore"
    groups:
      aws-sdk:
        patterns:
          - "github.com/aws/aws-sdk-go-v2*"

  # Cargo (Rust)
  - package-ecosystem: "cargo"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "rust"
    commit-message:
      prefix: "chore"
```

### Dependabot Alerts Configuration

**Security alerts** (repository settings):

```yaml
# Configure via GitHub repository settings
# Settings > Code security and analysis

dependency_graph: enabled
dependabot_alerts: enabled
dependabot_security_updates: enabled

# Security update settings
security_updates:
  target_branch: main
  open_pull_requests_limit: 10
  commit_message:
    prefix: "security"
```

---

## Automerge Policies

### Policy Matrix

| Update Type | Dependency Type | CI Status | Automerge | Notes |
|-------------|-----------------|-----------|-----------|-------|
| Patch | Production | Pass | Yes | Low risk |
| Patch | Development | Pass | Yes | Low risk |
| Minor | Development | Pass | Yes | Dev deps lower risk |
| Minor | Production | Pass | No | Review changelog |
| Major | Any | Pass | No | Breaking changes |
| Security | Any | Pass | Yes | Priority handling |

### Renovate Automerge Configuration

```json
{
  "extends": ["config:recommended"],

  "automerge": false,
  "automergeType": "pr",
  "automergeStrategy": "squash",
  "platformAutomerge": true,

  "packageRules": [
    {
      "description": "Automerge all patch updates",
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "pr",
      "platformAutomerge": true
    },
    {
      "description": "Automerge minor dev dependencies",
      "matchUpdateTypes": ["minor"],
      "matchDepTypes": ["devDependencies", "dev"],
      "automerge": true
    },
    {
      "description": "Automerge patch lockfile maintenance",
      "matchUpdateTypes": ["lockFileMaintenance"],
      "automerge": true,
      "schedule": ["before 6am on Sunday"]
    },
    {
      "description": "Never automerge major versions",
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["type:breaking-change", "needs-review"]
    },
    {
      "description": "Automerge security updates immediately",
      "matchCategories": ["security"],
      "automerge": true,
      "schedule": ["at any time"],
      "prPriority": 100
    },
    {
      "description": "Never automerge database packages",
      "matchPackagePatterns": ["^pg", "^mysql", "^mongodb", "^redis"],
      "automerge": false,
      "labels": ["database", "needs-review"]
    }
  ]
}
```

### GitHub Actions Auto-Merge Workflow

**.github/workflows/dependabot-automerge.yml**:

```yaml
name: Dependabot Auto-Merge

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: write
  pull-requests: write

jobs:
  metadata:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    outputs:
      dependency-names: ${{ steps.metadata.outputs.dependency-names }}
      update-type: ${{ steps.metadata.outputs.update-type }}
      ecosystem: ${{ steps.metadata.outputs.package-ecosystem }}
    steps:
      - name: Fetch Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

  automerge-patch:
    needs: metadata
    runs-on: ubuntu-latest
    if: |
      needs.metadata.outputs.update-type == 'version-update:semver-patch'
    steps:
      - name: Wait for CI
        uses: lewagon/wait-on-check-action@v1.3.4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          wait-interval: 30
          running-workflow-name: Dependabot Auto-Merge

      - name: Approve PR
        run: gh pr review --approve "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.AUTO_MERGE_TOKEN }}

      - name: Enable auto-merge
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.AUTO_MERGE_TOKEN }}

  automerge-minor-dev:
    needs: metadata
    runs-on: ubuntu-latest
    if: |
      needs.metadata.outputs.update-type == 'version-update:semver-minor' &&
      contains(needs.metadata.outputs.dependency-names, 'dev')
    steps:
      - name: Wait for CI
        uses: lewagon/wait-on-check-action@v1.3.4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          wait-interval: 30
          running-workflow-name: Dependabot Auto-Merge

      - name: Approve PR
        run: gh pr review --approve "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.AUTO_MERGE_TOKEN }}

      - name: Enable auto-merge
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.AUTO_MERGE_TOKEN }}

  notify-major:
    needs: metadata
    runs-on: ubuntu-latest
    if: needs.metadata.outputs.update-type == 'version-update:semver-major'
    steps:
      - name: Add review label
        run: gh pr edit "$PR_URL" --add-label "needs-review,type:breaking-change"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Request review
        run: gh pr edit "$PR_URL" --add-reviewer "platform-team"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Security Vulnerability Handling

### Priority Response Times

| Severity | Response Time | Automerge | Notification |
|----------|---------------|-----------|--------------|
| Critical | < 4 hours | Yes | Slack + Email |
| High | < 24 hours | Yes | Slack |
| Medium | < 7 days | Yes | Weekly digest |
| Low | < 30 days | No | Monthly digest |

### Renovate Security Configuration

```json
{
  "extends": [
    "config:recommended",
    ":enableVulnerabilityAlerts"
  ],

  "vulnerabilityAlerts": {
    "labels": ["security", "priority:critical"],
    "schedule": ["at any time"],
    "automerge": true,
    "assignees": ["@security-team"],
    "prPriority": 100,
    "platformAutomerge": true
  },

  "packageRules": [
    {
      "description": "Critical vulnerabilities - immediate",
      "matchCategories": ["security"],
      "matchVulnerabilitySeverities": ["CRITICAL"],
      "labels": ["security", "priority:critical"],
      "schedule": ["at any time"],
      "automerge": true,
      "prPriority": 100
    },
    {
      "description": "High vulnerabilities - fast track",
      "matchCategories": ["security"],
      "matchVulnerabilitySeverities": ["HIGH"],
      "labels": ["security", "priority:high"],
      "schedule": ["at any time"],
      "automerge": true,
      "prPriority": 90
    },
    {
      "description": "Medium vulnerabilities - standard",
      "matchCategories": ["security"],
      "matchVulnerabilitySeverities": ["MEDIUM"],
      "labels": ["security", "priority:medium"],
      "automerge": true,
      "prPriority": 50
    },
    {
      "description": "Low vulnerabilities - batch",
      "matchCategories": ["security"],
      "matchVulnerabilitySeverities": ["LOW"],
      "labels": ["security", "priority:low"],
      "automerge": false,
      "groupName": "low severity security updates"
    }
  ]
}
```

### Security Alert Workflow

**.github/workflows/security-alerts.yml**:

```yaml
name: Security Alert Handler

on:
  dependabot_alert:
    types: [created]
  schedule:
    - cron: '0 9 * * 1'  # Weekly security review

permissions:
  security-events: read
  issues: write

jobs:
  process-alert:
    runs-on: ubuntu-latest
    if: github.event_name == 'dependabot_alert'
    steps:
      - name: Get alert details
        id: alert
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          SEVERITY=$(gh api /repos/${{ github.repository }}/dependabot/alerts/${{ github.event.alert.number }} --jq '.security_vulnerability.severity')
          echo "severity=$SEVERITY" >> $GITHUB_OUTPUT

      - name: Create tracking issue for critical
        if: steps.alert.outputs.severity == 'critical'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh issue create \
            --title "CRITICAL: Security vulnerability in ${{ github.event.alert.dependency.package.name }}" \
            --body "## Security Alert

          **Severity**: CRITICAL
          **Package**: ${{ github.event.alert.dependency.package.name }}
          **CVE**: ${{ github.event.alert.security_advisory.cve_id }}

          ### Required Actions
          - [ ] Review vulnerability details
          - [ ] Apply patch or update dependency
          - [ ] Verify fix in staging
          - [ ] Deploy to production

          ### Timeline
          - Alert created: $(date -u +%Y-%m-%dT%H:%M:%SZ)
          - Required resolution: < 4 hours

          [View Alert](https://github.com/${{ github.repository }}/security/dependabot/${{ github.event.alert.number }})" \
            --label "security,priority:critical"

      - name: Send Slack notification for critical
        if: steps.alert.outputs.severity == 'critical'
        uses: slackapi/slack-github-action@v1.26.0
        with:
          channel-id: 'security-alerts'
          payload: |
            {
              "text": "CRITICAL Security Vulnerability Detected",
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "CRITICAL Security Alert"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {"type": "mrkdwn", "text": "*Repository:* ${{ github.repository }}"},
                    {"type": "mrkdwn", "text": "*Package:* ${{ github.event.alert.dependency.package.name }}"},
                    {"type": "mrkdwn", "text": "*Severity:* CRITICAL"},
                    {"type": "mrkdwn", "text": "*CVE:* ${{ github.event.alert.security_advisory.cve_id }}"}
                  ]
                }
              ]
            }
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}

  weekly-review:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - name: Generate security summary
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          echo "## Weekly Security Summary" > summary.md
          echo "" >> summary.md

          # Get open alerts by severity
          echo "### Open Dependabot Alerts" >> summary.md
          gh api /repos/${{ github.repository }}/dependabot/alerts \
            --jq 'group_by(.security_vulnerability.severity) | map({severity: .[0].security_vulnerability.severity, count: length}) | .[]' \
            >> summary.md

          cat summary.md
```

---

## Dependency Grouping

### Grouping Strategy

Effective grouping reduces PR noise while maintaining manageable review units:

| Group Type | Purpose | Max Size |
|------------|---------|----------|
| Ecosystem | All packages for one manager | 10 |
| Framework | Related framework packages | 5 |
| Tooling | Linting, testing, build | 10 |
| Security | Security-related updates | No limit |

### Renovate Grouping

```json
{
  "packageRules": [
    {
      "description": "Group all non-major updates",
      "matchUpdateTypes": ["minor", "patch"],
      "groupName": "all non-major dependencies",
      "groupSlug": "all-minor-patch"
    },
    {
      "description": "Group AWS SDK",
      "matchPackagePatterns": ["^@aws-sdk/"],
      "groupName": "AWS SDK",
      "groupSlug": "aws-sdk"
    },
    {
      "description": "Group React ecosystem",
      "matchPackagePatterns": ["^react", "^@types/react"],
      "groupName": "React packages",
      "groupSlug": "react"
    },
    {
      "description": "Group testing libraries",
      "matchPackagePatterns": [
        "^jest",
        "^@testing-library/",
        "^vitest",
        "^@vitest/",
        "^msw"
      ],
      "groupName": "Testing packages",
      "groupSlug": "testing"
    },
    {
      "description": "Group linting tools",
      "matchPackagePatterns": [
        "^eslint",
        "^@typescript-eslint/",
        "^prettier",
        "^stylelint"
      ],
      "groupName": "Linting and formatting",
      "groupSlug": "linting"
    },
    {
      "description": "Group TypeScript packages",
      "matchPackagePatterns": ["^typescript", "^@types/"],
      "groupName": "TypeScript ecosystem",
      "groupSlug": "typescript"
    },
    {
      "description": "Group Terraform AWS providers",
      "matchManagers": ["terraform"],
      "matchPackagePatterns": ["^hashicorp/aws"],
      "groupName": "Terraform AWS",
      "groupSlug": "terraform-aws"
    },
    {
      "description": "Group Python testing",
      "matchPackagePatterns": ["^pytest", "^coverage", "^tox"],
      "groupName": "Python testing",
      "groupSlug": "python-testing"
    }
  ]
}
```

### Dependabot Grouping

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      # Framework groups
      react:
        patterns:
          - "react"
          - "react-dom"
          - "@types/react*"
        update-types:
          - "minor"
          - "patch"

      # Testing group
      testing:
        patterns:
          - "jest"
          - "@testing-library/*"
          - "vitest"
          - "@vitest/*"
          - "msw"

      # Linting group
      linting:
        patterns:
          - "eslint*"
          - "@typescript-eslint/*"
          - "prettier*"

      # TypeScript group
      typescript:
        patterns:
          - "typescript"
          - "@types/*"
        exclude-patterns:
          - "@types/react*"

      # AWS SDK group
      aws-sdk:
        patterns:
          - "@aws-sdk/*"

      # Development dependencies (catch-all)
      dev-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
        exclude-patterns:
          - "jest"
          - "@testing-library/*"
          - "eslint*"
          - "prettier*"
          - "typescript"

  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      pytest:
        patterns:
          - "pytest*"
          - "coverage"
          - "hypothesis"

      linting:
        patterns:
          - "black"
          - "flake8*"
          - "mypy*"
          - "ruff"
          - "isort"

      aws:
        patterns:
          - "boto3"
          - "botocore"
          - "awscli"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      github-actions:
        patterns:
          - "actions/*"
```

---

## Testing Requirements

### CI Pipeline Integration

All dependency updates must pass the full CI pipeline before merge:

**.github/workflows/ci.yml** (test requirements):

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run smoke tests
        run: npm run test:smoke
```

### Renovate Test Configuration

```json
{
  "extends": ["config:recommended"],

  "prCreation": "not-pending",
  "prNotPendingHours": 1,

  "packageRules": [
    {
      "description": "Require all status checks",
      "matchUpdateTypes": ["major", "minor", "patch"],
      "requiredStatusChecks": ["test", "security-scan", "build"]
    },
    {
      "description": "Extended testing for major updates",
      "matchUpdateTypes": ["major"],
      "requiredStatusChecks": [
        "test",
        "security-scan",
        "build",
        "integration-tests",
        "e2e-tests"
      ]
    }
  ]
}
```

---

## Rollback Strategies

### Automated Rollback Detection

**.github/workflows/dependency-rollback.yml**:

```yaml
name: Dependency Rollback Check

on:
  push:
    branches: [main]
    paths:
      - 'package-lock.json'
      - 'yarn.lock'
      - 'pnpm-lock.yaml'
      - 'requirements.txt'
      - 'poetry.lock'
      - 'Pipfile.lock'

jobs:
  check-deployment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Wait for deployment
        run: sleep 300  # 5 minutes

      - name: Check application health
        id: health
        run: |
          HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${{ vars.HEALTH_CHECK_URL }})
          echo "status=$HEALTH_STATUS" >> $GITHUB_OUTPUT
          if [ "$HEALTH_STATUS" != "200" ]; then
            echo "Health check failed with status: $HEALTH_STATUS"
            exit 1
          fi

      - name: Check error rates
        id: errors
        run: |
          # Query monitoring system for error rates
          ERROR_RATE=$(curl -s "${{ vars.METRICS_URL }}/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])" | jq '.data.result[0].value[1] // 0')
          echo "error_rate=$ERROR_RATE" >> $GITHUB_OUTPUT
          if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
            echo "Error rate too high: $ERROR_RATE"
            exit 1
          fi

  rollback:
    needs: check-deployment
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Identify problematic commit
        id: commit
        run: |
          COMMIT_SHA=$(git log -1 --format="%H")
          COMMIT_MSG=$(git log -1 --format="%s")
          echo "sha=$COMMIT_SHA" >> $GITHUB_OUTPUT
          echo "message=$COMMIT_MSG" >> $GITHUB_OUTPUT

      - name: Create rollback PR
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # Create rollback branch
          git checkout -b rollback-${{ steps.commit.outputs.sha }}
          git revert HEAD --no-edit

          # Push and create PR
          git push origin rollback-${{ steps.commit.outputs.sha }}

          gh pr create \
            --title "Rollback: ${{ steps.commit.outputs.message }}" \
            --body "## Automated Rollback

          This PR reverts commit ${{ steps.commit.outputs.sha }} due to deployment health check failures.

          ### Original Commit
          - SHA: \`${{ steps.commit.outputs.sha }}\`
          - Message: ${{ steps.commit.outputs.message }}

          ### Reason
          - Health check or error rate monitoring detected issues after deployment

          ### Action Required
          - Review the reverted changes
          - Investigate root cause
          - Re-apply changes after fixing issues" \
            --label "rollback,urgent"

      - name: Send alert
        uses: slackapi/slack-github-action@v1.26.0
        with:
          channel-id: 'deployments'
          payload: |
            {
              "text": "Dependency Update Rollback Initiated",
              "blocks": [
                {
                  "type": "header",
                  "text": {"type": "plain_text", "text": "Automated Rollback"}
                },
                {
                  "type": "section",
                  "fields": [
                    {"type": "mrkdwn", "text": "*Repository:* ${{ github.repository }}"},
                    {"type": "mrkdwn", "text": "*Commit:* ${{ steps.commit.outputs.sha }}"}
                  ]
                }
              ]
            }
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Manual Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback-dependency.sh

set -euo pipefail

# Usage: ./rollback-dependency.sh <package-name> <previous-version>

PACKAGE=$1
VERSION=$2

echo "Rolling back $PACKAGE to version $VERSION"

# For npm
if [ -f "package.json" ]; then
  npm install "$PACKAGE@$VERSION" --save-exact
  npm audit
  npm test
fi

# For pip
if [ -f "requirements.txt" ]; then
  pip install "$PACKAGE==$VERSION"
  pip check
  pytest
fi

# Create rollback commit
git add .
git commit -m "fix(deps): rollback $PACKAGE to $VERSION

Rollback due to issues with newer version.
Previous version caused: <describe issue>

Related PR: <link to original update PR>"

echo "Rollback complete. Review changes and push when ready."
```

---

## Notification and Escalation

### Notification Configuration

**Renovate notifications**:

```json
{
  "extends": ["config:recommended"],

  "assignees": ["@platform-team"],
  "reviewers": ["@platform-team"],

  "packageRules": [
    {
      "description": "Security updates notify security team",
      "matchCategories": ["security"],
      "assignees": ["@security-team"],
      "reviewers": ["@security-team"]
    },
    {
      "description": "Major versions notify tech leads",
      "matchUpdateTypes": ["major"],
      "assignees": ["@tech-leads"],
      "reviewers": ["@tech-leads"]
    },
    {
      "description": "Infrastructure updates notify platform team",
      "matchManagers": ["terraform", "docker-compose", "kubernetes"],
      "assignees": ["@platform-team"],
      "reviewers": ["@platform-team"]
    }
  ]
}
```

### Slack Integration

**.github/workflows/dependency-notifications.yml**:

```yaml
name: Dependency Notifications

on:
  pull_request:
    types: [opened]

jobs:
  notify:
    runs-on: ubuntu-latest
    if: |
      github.actor == 'dependabot[bot]' ||
      github.actor == 'renovate[bot]'
    steps:
      - name: Parse PR labels
        id: labels
        run: |
          LABELS='${{ toJson(github.event.pull_request.labels.*.name) }}'
          IS_SECURITY=$(echo $LABELS | jq 'contains(["security"])')
          IS_MAJOR=$(echo $LABELS | jq 'contains(["type:breaking-change"])')
          echo "is_security=$IS_SECURITY" >> $GITHUB_OUTPUT
          echo "is_major=$IS_MAJOR" >> $GITHUB_OUTPUT

      - name: Notify security channel
        if: steps.labels.outputs.is_security == 'true'
        uses: slackapi/slack-github-action@v1.26.0
        with:
          channel-id: 'security-alerts'
          payload: |
            {
              "text": "Security Dependency Update Available",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Security Update*\n${{ github.event.pull_request.title }}\n<${{ github.event.pull_request.html_url }}|View PR>"
                  }
                }
              ]
            }
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}

      - name: Notify engineering channel for major updates
        if: steps.labels.outputs.is_major == 'true'
        uses: slackapi/slack-github-action@v1.26.0
        with:
          channel-id: 'engineering'
          payload: |
            {
              "text": "Major Dependency Update Requires Review",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Major Version Update*\n${{ github.event.pull_request.title }}\n\nBreaking changes possible. Review changelog.\n<${{ github.event.pull_request.html_url }}|View PR>"
                  }
                }
              ]
            }
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}

  weekly-summary:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - name: Generate summary
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Get dependency PRs from last week
          WEEK_AGO=$(date -d '7 days ago' +%Y-%m-%d)

          gh pr list \
            --repo ${{ github.repository }} \
            --author "dependabot[bot]" \
            --author "renovate[bot]" \
            --search "created:>=$WEEK_AGO" \
            --json number,title,state,mergedAt \
            --jq '.' > summary.json

          MERGED=$(jq '[.[] | select(.state == "MERGED")] | length' summary.json)
          OPEN=$(jq '[.[] | select(.state == "OPEN")] | length' summary.json)

          echo "merged=$MERGED" >> $GITHUB_OUTPUT
          echo "open=$OPEN" >> $GITHUB_OUTPUT

      - name: Post weekly summary
        uses: slackapi/slack-github-action@v1.26.0
        with:
          channel-id: 'engineering'
          payload: |
            {
              "text": "Weekly Dependency Update Summary",
              "blocks": [
                {
                  "type": "header",
                  "text": {"type": "plain_text", "text": "Weekly Dependency Summary"}
                },
                {
                  "type": "section",
                  "fields": [
                    {"type": "mrkdwn", "text": "*Merged:* ${{ steps.summary.outputs.merged }}"},
                    {"type": "mrkdwn", "text": "*Open:* ${{ steps.summary.outputs.open }}"}
                  ]
                }
              ]
            }
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

---

## Exemption Handling

### Pinned Version Configuration

**Renovate - Ignore specific packages**:

```json
{
  "extends": ["config:recommended"],

  "ignoreDeps": [
    "legacy-package-no-updates"
  ],

  "packageRules": [
    {
      "description": "Pin and ignore legacy database driver",
      "matchPackageNames": ["pg"],
      "matchCurrentVersion": "7.18.2",
      "enabled": false
    },
    {
      "description": "Ignore pre-release versions",
      "matchPackagePatterns": [".*"],
      "ignoreUnstable": true
    },
    {
      "description": "Pin specific package version range",
      "matchPackageNames": ["axios"],
      "allowedVersions": ">=0.21.0 <1.0.0"
    },
    {
      "description": "Delay updates for stability",
      "matchPackageNames": ["typescript"],
      "minimumReleaseAge": "30 days",
      "stabilityDays": 30
    }
  ]
}
```

**Dependabot - Ignore configuration**:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    ignore:
      # Ignore all major updates for React
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]

      # Ignore specific version
      - dependency-name: "lodash"
        versions: [">=5.0.0"]

      # Ignore all updates for legacy package
      - dependency-name: "legacy-package"

      # Ignore patch updates for stable package
      - dependency-name: "express"
        update-types: ["version-update:semver-patch"]
```

### Exemption Documentation

**DEPENDENCY_EXEMPTIONS.md**:

```markdown
# Dependency Update Exemptions

This document tracks packages exempt from automated updates and the rationale.

## Permanent Exemptions

| Package | Version | Reason | Owner | Review Date |
|---------|---------|--------|-------|-------------|
| pg | 7.18.2 | Legacy driver compatibility with internal systems | @db-team | 2025-06-01 |
| legacy-auth | 2.x | Deprecated but required for legacy API | @platform | 2025-03-01 |

## Temporary Exemptions

| Package | Version | Reason | Owner | Expiry |
|---------|---------|--------|-------|--------|
| typescript | <5.0 | Breaking changes need migration | @frontend | 2025-02-15 |
| react | 17.x | Major upgrade planned for Q2 | @frontend | 2025-04-01 |

## Version Ranges

| Package | Allowed Range | Reason |
|---------|--------------|--------|
| axios | >=0.21 <1.0 | 1.x has breaking changes in interceptors |
| webpack | ^5.0.0 | 6.x not compatible with current build |

## Review Process

1. Exemptions require approval from package owner
2. All exemptions must have review/expiry date
3. Quarterly audit of all exemptions
4. Security updates override exemptions
```

---

## Multi-Ecosystem Projects

### Full-Stack Configuration

**renovate.json** (monolithic full-stack):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],

  "enabledManagers": [
    "npm",
    "pip_requirements",
    "dockerfile",
    "docker-compose",
    "github-actions",
    "terraform"
  ],

  "packageRules": [
    {
      "description": "Frontend packages - weekly",
      "matchManagers": ["npm"],
      "matchFileNames": ["frontend/**"],
      "groupName": "Frontend dependencies",
      "schedule": ["before 6am on Monday"]
    },
    {
      "description": "Backend packages - weekly",
      "matchManagers": ["pip_requirements"],
      "matchFileNames": ["backend/**"],
      "groupName": "Backend dependencies",
      "schedule": ["before 6am on Monday"]
    },
    {
      "description": "Infrastructure - bi-weekly",
      "matchManagers": ["terraform", "docker-compose"],
      "groupName": "Infrastructure dependencies",
      "schedule": ["before 6am on the 1st and 15th day of the month"]
    },
    {
      "description": "CI/CD - weekly",
      "matchManagers": ["github-actions", "dockerfile"],
      "groupName": "CI/CD dependencies",
      "schedule": ["before 6am on Monday"]
    }
  ]
}
```

**.github/dependabot.yml** (multi-ecosystem):

```yaml
version: 2
updates:
  # Frontend (React/TypeScript)
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
      day: "monday"
    labels:
      - "dependencies"
      - "frontend"
    groups:
      react:
        patterns:
          - "react*"
          - "@types/react*"

  # Backend (Python/FastAPI)
  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "backend"
    groups:
      fastapi:
        patterns:
          - "fastapi"
          - "starlette"
          - "pydantic"

  # Infrastructure (Terraform)
  - package-ecosystem: "terraform"
    directory: "/infrastructure"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "infrastructure"

  # Docker
  - package-ecosystem: "docker"
    directories:
      - "/frontend"
      - "/backend"
      - "/services/worker"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "docker"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "ci"
```

---

## Monorepo Configuration

### Nx/Turborepo Workspaces

**renovate.json** (Nx monorepo):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":preserveSemverRanges"
  ],

  "ignorePaths": ["**/node_modules/**"],

  "packageRules": [
    {
      "description": "Shared dependencies - update root only",
      "matchFileNames": ["package.json"],
      "matchPackagePatterns": ["^@nx/", "^nx$"],
      "groupName": "Nx packages"
    },
    {
      "description": "App-specific dependencies",
      "matchFileNames": ["apps/**/package.json"],
      "additionalBranchPrefix": "apps-"
    },
    {
      "description": "Library dependencies",
      "matchFileNames": ["libs/**/package.json"],
      "additionalBranchPrefix": "libs-"
    },
    {
      "description": "Group all workspace packages together",
      "matchManagers": ["npm"],
      "matchUpdateTypes": ["minor", "patch"],
      "groupName": "all non-major dependencies",
      "groupSlug": "all-minor-patch"
    }
  ],

  "postUpdateOptions": ["npmDedupe"]
}
```

**.github/dependabot.yml** (monorepo):

```yaml
version: 2
updates:
  # Root workspace
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "root"
    groups:
      nx:
        patterns:
          - "@nx/*"
          - "nx"

  # Frontend app
  - package-ecosystem: "npm"
    directory: "/apps/frontend"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "frontend"

  # Backend app
  - package-ecosystem: "npm"
    directory: "/apps/backend"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "backend"

  # Shared UI library
  - package-ecosystem: "npm"
    directory: "/libs/ui"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "libs"

  # Shared utils library
  - package-ecosystem: "npm"
    directory: "/libs/utils"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "libs"
```

---

## Best Practices

### Configuration Checklist

**Project Setup**:

```text
[ ] Choose tool: Renovate vs Dependabot based on needs
[ ] Configure update schedules per ecosystem
[ ] Set up dependency grouping
[ ] Define automerge policies
[ ] Configure security alert handling
[ ] Set up notifications (Slack/email)
[ ] Document exemptions
[ ] Add CI requirements for dependency PRs
```

### Renovate vs Dependabot Comparison

| Feature | Renovate | Dependabot |
|---------|----------|------------|
| Grouping | Advanced | Basic (groups only) |
| Custom rules | Extensive | Limited |
| Self-hosted | Yes | No |
| Automerge | Built-in | Via Actions |
| Scheduling | Flexible | Day/time only |
| Private registries | Extensive | Supported |
| Monorepo support | Excellent | Good |
| Regex matching | Yes | No |
| Post-upgrade tasks | Yes | No |

### Security Best Practices

```json
{
  "description": "Security-focused configuration",

  "extends": [
    "config:recommended",
    ":enableVulnerabilityAlerts"
  ],

  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "schedule": ["at any time"]
  },

  "packageRules": [
    {
      "description": "Always update security patches",
      "matchCategories": ["security"],
      "automerge": true,
      "schedule": ["at any time"]
    },
    {
      "description": "Wait for stability on non-security",
      "matchCategories": ["!security"],
      "minimumReleaseAge": "3 days",
      "stabilityDays": 3
    }
  ]
}
```

### Performance Optimization

```json
{
  "description": "Performance-optimized configuration",

  "prConcurrentLimit": 10,
  "prHourlyLimit": 2,
  "branchConcurrentLimit": 20,

  "schedule": ["before 6am"],
  "timezone": "America/New_York",

  "packageRules": [
    {
      "description": "Batch non-critical updates",
      "matchUpdateTypes": ["minor", "patch"],
      "matchCategories": ["!security"],
      "groupName": "all non-major dependencies",
      "schedule": ["before 6am on Monday"]
    }
  ],

  "postUpdateOptions": ["npmDedupe"],
  "lockFileMaintenance": {
    "enabled": true,
    "schedule": ["before 6am on Sunday"]
  }
}
```

---

## Troubleshooting

### Common Issues

**PRs not being created**:

```bash
# Check Renovate logs
# GitHub: Check Actions tab for Renovate workflow
# Self-hosted: Check Renovate logs

# Verify configuration
npx renovate-config-validator

# Test configuration locally
npx renovate --dry-run --print-config owner/repo
```

**Automerge not working**:

```yaml
# Verify branch protection allows automerge
# Check required status checks are passing
# Verify bot has merge permissions

# Debug: Check PR merge status
gh pr view <number> --json mergeStateStatus,mergeable
```

**Too many PRs**:

```json
{
  "prConcurrentLimit": 5,
  "prHourlyLimit": 1,
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "groupName": "all non-major dependencies"
    }
  ]
}
```

**Version conflicts**:

```json
{
  "postUpdateOptions": ["npmDedupe"],
  "packageRules": [
    {
      "matchPackagePatterns": ["^@types/"],
      "groupName": "TypeScript types",
      "automerge": true
    }
  ]
}
```

### Debug Commands

```bash
# Validate Renovate config
npx renovate-config-validator renovate.json

# Dry run Renovate locally
LOG_LEVEL=debug npx renovate --dry-run owner/repo

# Check Dependabot status
gh api /repos/owner/repo/dependabot/alerts

# List open dependency PRs
gh pr list --author "dependabot[bot]" --author "renovate[bot]"

# Check failed automerge attempts
gh pr list --label "automerge" --state open --json number,title,mergeStateStatus
```

---

## Related Documentation

- [Dependabot Auto-Merge Configuration](./dependabot_auto_merge.md) - Auto-merge workflow setup
- [GitHub Actions Guide](./github_actions_guide.md) - CI/CD patterns
- [Security Scanning Guide](./security_scanning_guide.md) - Security automation
- [Pre-commit Hooks Guide](./precommit_hooks_guide.md) - Local validation

## References

- [Renovate Documentation](https://docs.renovatebot.com/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
