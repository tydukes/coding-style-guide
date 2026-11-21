---
title: "Release and Auto-Merge Automation"
description: "Repository policy for auto-merge, publishing credentials, trusted workflow refs,
  and partial-release recovery"
author: "Tyler Dukes"
tags: [release, automation, auto-merge, github-actions, publishing, security]
category: "CI/CD"
status: "active"
search_keywords: [release automation, auto merge, github token, npm publishing, container publishing]
---

## Automation Policy

Automation must help trusted maintainers move faster without changing the repository security model.
Branch protection, required checks, review rules, and GitHub token restrictions remain the source of
truth for whether a pull request can merge or a release can publish.

## Auto-Merge Rules

Trusted same-repository pull requests may have GitHub auto-merge enabled after CI succeeds. The
workflow does not directly approve, directly merge, or delete branches with a personal access token.
The auto-merge enablement call uses `AUTO_MERGE_TOKEN` because GitHub rejected the equivalent
`GITHUB_TOKEN` GraphQL mutation from the `workflow_run` event with `Resource not accessible by
integration`.

```yaml
trusted_auto_merge_authors:
  maintainers:
    - tydukes
  automation:
    - dependabot[bot]

required_behavior:
  merge_method: squash
  token: AUTO_MERGE_TOKEN
  same_repository_branch: true
  direct_merge: false
  auto_approve: false
  branch_protection_bypass: false
```

Outside contributors are intentionally excluded from automatic enablement. Their pull requests must
receive normal maintainer review and pass the required branch protection checks before merge.

```yaml
outside_contributor_guardrails:
  forked_pull_requests:
    auto_merge_enabled_by_workflow: false
    publish_secrets_available: false
    maintainer_review_required: true
  first_time_contributors:
    secret_bearing_workflows: maintainer_approval_required
```

## Required Checks

Branch protection should require the checks that represent the full repository risk, not only the
first workflow that completes.

```yaml
required_checks:
  - build
  - build-and-test
  - build-and-push
  - Validate Commit Messages
  - Check Python Dependencies
  - Check GitHub Actions Versions
  - Check Docker Image Versions
  - Check Pre-commit Hook Versions
  - spell-check
  - CodeQL
  - SonarCloud Code Analysis
```

Keep optional and issue-creating workflows, such as link checking and dashboard refreshes, outside
branch protection unless they become release blockers.

## Token Rules

Use `GITHUB_TOKEN` by default. It is scoped to the repository, receives workflow-level permissions,
and is the correct token for checkout, version bump commits, release creation, issue creation, and
container publishing.

```yaml
github_token_uses:
  - actions checkout
  - release version bump commits
  - changelog commits
  - GitHub release creation
  - recovery issue creation
  - ghcr container publishing
```

Use a personal access token only when GitHub documents a permission limitation that blocks the
intended operation and the repository intentionally accepts that risk. A personal access token must
be fine-grained, limited to this repository, time-bound, and documented with the exact reason and
permissions.

```yaml
personal_access_token_rules:
  default: avoid
  allowed_only_when:
    - GITHUB_TOKEN cannot perform the required GitHub operation
    - branch protection is not bypassed
    - scopes are documented
    - expiration is configured
  required_for:
    - current auto-merge workflow
  not_required_for:
    - current release workflow
```

`AUTO_MERGE_TOKEN` is limited to enabling GitHub auto-merge for trusted same-repository pull
requests. It must have repository access for this repository and pull request write permission. It
must not be used to approve reviews, merge pull requests directly, bypass required checks, or push to
protected branches.

## Release Path

Releases are manual, trusted-ref workflows. Run them from `main`; do not run release publishing from
pull requests, forks, feature branches, or code that has not been reviewed.

```bash
gh workflow run release.yml --ref main --field bump_type=patch
gh workflow run release.yml --ref main --field bump_type=auto
```

For recovery of a partially completed version, rerun the workflow with the exact version and no
leading `v`.

```bash
gh workflow run release.yml --ref main --field release_version=1.2.3
```

The release path keeps the Python package version, CLI package version, GitHub release tag,
changelog generation, and npm package publish in one workflow.

```yaml
release_steps:
  - validate main branch
  - validate NPM_TOKEN exists
  - determine version
  - update pyproject.toml
  - update cli/package.json
  - update cli/package-lock.json
  - commit version bump
  - create GitHub release
  - generate changelog
  - commit changelog
  - publish CLI to npm
```

## Container Publishing

Container images are built for pull requests but only published from release or tag events. The
`main` branch build validates documentation and code, but it does not publish `latest`.

```yaml
container_publishing:
  pull_request:
    build: true
    push: false
    platform: linux/amd64
  tag_or_release:
    build: true
    push: true
    platforms:
      - linux/amd64
      - linux/arm64
    tags:
      - semver
      - latest
```

## Partial Release Recovery

A partial release is any run where one artifact succeeds and a later artifact fails. Examples include
a GitHub release created but npm publish failed, or an npm package published but container publishing
failed.

The workflows create recovery issues when a release or release container publish fails on a trusted
ref. The issue records the intended version, completed steps, failed steps, workflow run, commit, and
recommended forward-fix path.

```yaml
recovery_issue_contents:
  - release version
  - completed jobs
  - failed jobs
  - workflow run URL
  - commit SHA
  - same-version recovery command
```

Prefer completing the same intended version. Do not create a second divergent version unless no
release artifacts were published.

```text
1. Inspect the failed workflow job.
2. Check GitHub releases, npm, and ghcr for artifacts that already exist.
3. Fix the failed automation or package state on main.
4. Rerun release.yml with release_version set to the same version.
5. Manually publish only a missing artifact if a full rerun would duplicate completed work.
```
