#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/target"
IMAGE="ghcr.io/tydukes/coding-style-guide:latest"
CLONE_URL="https://github.com/jenkinsci/jenkins.git"

usage() {
  echo "Usage: $(basename "$0") [--refresh]"
  echo ""
  echo "  --refresh   Delete and re-clone the target repository before validating"
  exit 0
}

REFRESH=false
for arg in "$@"; do
  case "$arg" in
    --refresh) REFRESH=true ;;
    --help|-h) usage ;;
    *) echo "Unknown argument: $arg" >&2; usage ;;
  esac
done

# Verify Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running. Start Docker and retry." >&2
  exit 1
fi

# Pull latest image
echo "==> Pulling ${IMAGE} ..."
docker pull "${IMAGE}"

# Handle --refresh
if [[ "${REFRESH}" == true && -d "${TARGET_DIR}" ]]; then
  echo "==> --refresh: removing ${TARGET_DIR} ..."
  rm -rf "${TARGET_DIR}"
fi

# Clone target if not present
if [[ ! -d "${TARGET_DIR}" ]]; then
  echo "==> Cloning ${CLONE_URL} (shallow) ..."
  git clone --depth=1 "${CLONE_URL}" "${TARGET_DIR}"
else
  echo "==> Target already present at ${TARGET_DIR} (use --refresh to re-clone)"
fi

# Run validator
echo ""
echo "==> Running validator against $(basename "${TARGET_DIR}") ..."
echo ""
docker run --rm \
  -v "${TARGET_DIR}:/workspace" \
  "${IMAGE}" \
  validate

# Exit code is passed through automatically by set -e + docker's own exit code
