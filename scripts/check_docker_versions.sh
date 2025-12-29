#!/bin/bash
# @module check_docker_versions
# @description Check Dockerfile base image versions against Docker Hub
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOCKERFILE="Dockerfile"
OUTDATED=0

echo "Checking Docker base image versions..."
echo ""

# Function to get latest tag from Docker Hub
get_latest_tag() {
    local image="$1"
    local repo
    local tag_api_url

    # Handle official images (e.g., python) vs user/org images
    if [[ "$image" == *"/"* ]]; then
        repo="$image"
        tag_api_url="https://hub.docker.com/v2/repositories/${repo}/tags/?page_size=100"
    else
        # Official image
        repo="library/${image}"
        tag_api_url="https://hub.docker.com/v2/repositories/${repo}/tags/?page_size=100"
    fi

    # Fetch tags from Docker Hub API
    local response
    response=$(curl -s "$tag_api_url")

    # Extract the latest semantic version tag (not 'latest')
    # Filter for tags that match semantic versioning pattern
    local latest_tag
    latest_tag=$(echo "$response" | \
        grep -o '"name":"[^"]*"' | \
        sed 's/"name":"//g' | \
        sed 's/"//g' | \
        grep -E '^[0-9]+\.[0-9]+' | \
        grep -v 'rc' | \
        grep -v 'beta' | \
        grep -v 'alpha' | \
        head -n 1)

    echo "$latest_tag"
    return 0
}

# Function to extract version from tag
extract_version() {
    local tag="$1"
    # Extract version number from tags like "3.11-slim", "3.11.9-slim", etc.
    echo "$tag" | grep -oE '^[0-9]+\.[0-9]+(\.[0-9]+)?' | head -n 1
    return 0
}

# Function to compare versions
version_gt() {
    local ver1="$1"
    local ver2="$2"
    # Returns 0 (true) if $1 > $2
    if [[ "$(printf '%s\n' "$ver1" "$ver2" | sort -V | head -n 1)" != "$ver1" ]]; then
        return 0
    else
        return 1
    fi
}

# Extract all FROM statements from Dockerfile
if [[ ! -f "$DOCKERFILE" ]]; then
    echo -e "${RED}::error::Dockerfile not found!${NC}" >&2
    exit 1
fi

# Read all FROM statements
mapfile -t from_lines < <(grep "^FROM" "$DOCKERFILE")

for from_line in "${from_lines[@]}"; do
    # Extract image and tag
    image_full=$(echo "$from_line" | awk '{print $2}')

    # Skip if it's a build stage reference (FROM ... AS ...)
    if [[ "$image_full" == *" AS "* ]]; then
        image_full=$(echo "$from_line" | awk '{print $2}')
    fi

    # Split image and tag
    if [[ "$image_full" == *":"* ]]; then
        image_name="${image_full%:*}"
        current_tag="${image_full#*:}"
    else
        image_name="$image_full"
        current_tag="latest"
    fi

    echo "Checking: ${image_name}:${current_tag}"

    # Get latest tag from Docker Hub
    latest_tag=$(get_latest_tag "$image_name")

    if [[ -z "$latest_tag" ]]; then
        echo -e "${YELLOW}⚠️  Could not determine latest version for ${image_name}${NC}"
        continue
    fi

    # Extract version numbers for comparison
    current_version=$(extract_version "$current_tag")
    latest_version=$(extract_version "$latest_tag")

    if [[ -z "$current_version" ]] || [[ -z "$latest_version" ]]; then
        echo -e "${GREEN}✅ ${image_name}:${current_tag} (version comparison not applicable)${NC}"
        continue
    fi

    # Compare versions
    if version_gt "$latest_version" "$current_version"; then
        echo -e "${RED}❌ ${image_name}:${current_tag} is outdated! Latest: ${latest_version}${NC}"
        OUTDATED=1
    else
        echo -e "${GREEN}✅ ${image_name}:${current_tag} is up to date${NC}"
    fi

    echo ""
done

if [[ $OUTDATED -eq 1 ]]; then
    echo "::error::Outdated Docker base images detected!" >&2
    exit 1
fi

echo -e "${GREEN}✅ All Docker base images are up to date!${NC}"
exit 0
