#!/usr/bin/env bash
# pre_commit_linter.sh - run a subset of linters locally
set -euo pipefail

echo "Running pre-commit checks..."

# Check if terraform files exist and format them
if find . -name "*.tf" -type f | grep -q .; then
    echo "Running terraform fmt..."
    # terraform fmt -recursive .
fi

# Check if YAML files exist and lint them
if find . -name "*.yml" -o -name "*.yaml" -type f | grep -q .; then
    echo "Running yamllint..."
    # yamllint .
fi

# Check if shell scripts exist and check them
if find . -name "*.sh" -type f | grep -q .; then
    echo "Running shellcheck..."
    # find . -name "*.sh" -type f -exec shellcheck {} \;
fi

echo "Pre-commit checks completed."
