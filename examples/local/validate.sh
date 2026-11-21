#!/usr/bin/env bash
# Simple wrapper script for running coding style guide validation locally
# Usage: ./validate.sh [validate|lint|format|docs|metadata]

set -euo pipefail

IMAGE="${VALIDATOR_IMAGE:-ghcr.io/tydukes/coding-style-guide:latest}"
COMMAND="${1:-validate}"

echo "🔍 Running coding style guide validator..."
echo "   Image: ${IMAGE}"
echo "   Command: ${COMMAND}"
echo ""

exit_code=0
docker run --rm \
    -v "$(pwd):/workspace" \
    "${IMAGE}" \
    "${COMMAND}" || exit_code=$?

if [[ $exit_code -eq 0 ]]; then
    echo ""
    echo "✅ Validation completed successfully!"
else
    echo ""
    echo "❌ Validation failed with exit code ${exit_code}"
fi

exit $exit_code
