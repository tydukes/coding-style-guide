---
title: "Local Integration Tests"
description: "Validate a real-world project against the published style guide container"
author: "Tyler Dukes"
tags: [testing, docker, integration]
category: "Testing"
status: "active"
---

## Local Integration Tests

Validates a real-world project against the published
`ghcr.io/tydukes/coding-style-guide:latest` container image.

**Target project**: [jenkinsci/jenkins](https://github.com/jenkinsci/jenkins)
— a large Java/Groovy/shell/YAML/Dockerfile project that exercises several
of this style guide's language guides.

## Prerequisites

- Docker running locally
- `git` on your `PATH`

## Usage

```bash
# First run: clones jenkinsci/jenkins then validates
./tests/local/run.sh

# Re-clone and validate (pick up upstream changes or fix a broken clone)
./tests/local/run.sh --refresh
```

## What the Script Does

1. Verifies Docker is running
2. Pulls the latest published image
3. Clones `jenkinsci/jenkins` with `--depth=1` into `tests/local/target/` (skipped if it already exists)
4. Runs `docker run … validate` against the cloned repo
5. Exits with the container's exit code

## Expected Output

- Metadata validation warnings (non-blocking)
- Linter output from `devops-style check`
- "Docs build skipped" — Jenkins has no `mkdocs.yml`, so the docs step is naturally skipped
- Exit `0` on clean validation, `1` on linter failures

## Notes

- `tests/local/target/` is git-ignored and never committed.
- Use `--refresh` to delete and re-clone if the target directory is stale or corrupted.
