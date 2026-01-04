#!/bin/bash
# Script to mark GitHub Actions version tag security hotspots as safe in SonarCloud
#
# Usage:
#   export SONAR_TOKEN="your-sonarcloud-token"
#   bash scripts/mark_sonar_hotspots_safe.sh
#
# Prerequisites:
#   - SONAR_TOKEN environment variable set
#   - jq installed (brew install jq)
#   - curl installed

set -euo pipefail

# Configuration
SONAR_ORG="${SONAR_ORG:-tydukes}"
SONAR_PROJECT="${SONAR_PROJECT:-coding-style-guide}"
SONAR_URL="https://sonarcloud.io/api"

# Comment to add when marking as safe
REVIEW_COMMENT="Accepted Risk: Version tags intentionally used per SECURITY.md policy. Official GitHub Actions use version tags for improved maintainability and automatic security updates via Dependabot."

# Check prerequisites
if [ -z "${SONAR_TOKEN:-}" ]; then
  echo "::error::SONAR_TOKEN environment variable not set"
  echo "Get your token from: https://sonarcloud.io/account/security"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "::error::jq is required but not installed"
  echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
  exit 1
fi

echo "🔍 Searching for open security hotspots in ${SONAR_PROJECT}..."

# Get all open hotspots
HOTSPOTS=$(curl -s -u "${SONAR_TOKEN}:" \
  "${SONAR_URL}/hotspots/search?projectKey=${SONAR_PROJECT}&status=TO_REVIEW&resolution=&ps=100" \
  | jq -r '.hotspots[]')

if [ -z "$HOTSPOTS" ] || [ "$HOTSPOTS" = "null" ]; then
  echo "✅ No open security hotspots found!"
  exit 0
fi

# Count hotspots
HOTSPOT_COUNT=$(echo "$HOTSPOTS" | jq -s 'length')
echo "📊 Found ${HOTSPOT_COUNT} open security hotspot(s)"

# Get hotspot keys for yaml:S6270 (GitHub Actions version pinning)
GITHUB_ACTIONS_HOTSPOTS=$(curl -s -u "${SONAR_TOKEN}:" \
  "${SONAR_URL}/hotspots/search?projectKey=${SONAR_PROJECT}&status=TO_REVIEW&ps=100" \
  | jq -r '.hotspots[] | select(.rule == "yaml:S6270") | .key')

if [ -z "$GITHUB_ACTIONS_HOTSPOTS" ]; then
  echo "ℹ️  No GitHub Actions version pinning hotspots found (rule: yaml:S6270)"
  echo "   Other security hotspots may exist - review them at:"
  echo "   https://sonarcloud.io/project/security_hotspots?id=${SONAR_PROJECT}"
  exit 0
fi

# Count GitHub Actions hotspots
GA_HOTSPOT_COUNT=$(echo "$GITHUB_ACTIONS_HOTSPOTS" | wc -l | tr -d ' ')
echo "🎯 Found ${GA_HOTSPOT_COUNT} GitHub Actions version pinning hotspot(s)"
echo ""

# Mark each hotspot as safe
MARKED_COUNT=0
FAILED_COUNT=0

while IFS= read -r HOTSPOT_KEY; do
  if [ -z "$HOTSPOT_KEY" ]; then
    continue
  fi

  echo "📝 Marking hotspot ${HOTSPOT_KEY} as safe..."

  # Get hotspot details
  HOTSPOT_DETAILS=$(curl -s -u "${SONAR_TOKEN}:" \
    "${SONAR_URL}/hotspots/show?hotspot=${HOTSPOT_KEY}")

  FILE_PATH=$(echo "$HOTSPOT_DETAILS" | jq -r '.component.path // "unknown"')
  LINE=$(echo "$HOTSPOT_DETAILS" | jq -r '.textRange.startLine // "?"')

  echo "   Location: ${FILE_PATH}:${LINE}"

  # Mark as safe
  RESPONSE=$(curl -s -w "\n%{http_code}" -u "${SONAR_TOKEN}:" -X POST \
    "${SONAR_URL}/hotspots/change_status" \
    -d "hotspot=${HOTSPOT_KEY}" \
    -d "status=REVIEWED" \
    -d "resolution=SAFE" \
    -d "comment=${REVIEW_COMMENT}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo "   ✅ Marked as safe"
    ((MARKED_COUNT++))
  else
    echo "   ❌ Failed (HTTP ${HTTP_CODE})"
    echo "$RESPONSE" | head -n-1
    ((FAILED_COUNT++))
  fi

  echo ""
done <<< "$GITHUB_ACTIONS_HOTSPOTS"

# Summary
echo "=================================================="
echo "Summary:"
echo "  ✅ Successfully marked: ${MARKED_COUNT}"
echo "  ❌ Failed: ${FAILED_COUNT}"
echo "=================================================="

if [ $FAILED_COUNT -gt 0 ]; then
  echo "::warning::Some hotspots failed to be marked as safe"
  echo "Please review them manually at: https://sonarcloud.io/project/security_hotspots?id=${SONAR_PROJECT}"
  exit 1
fi

echo "✅ All GitHub Actions version pinning hotspots marked as safe!"
echo "View results at: https://sonarcloud.io/project/security_hotspots?id=${SONAR_PROJECT}"
