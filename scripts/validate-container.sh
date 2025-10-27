#!/usr/bin/env bash
# CLI wrapper for containerized coding style guide validator

set -euo pipefail

# Default values
IMAGE_NAME="${VALIDATOR_IMAGE:-ghcr.io/tydukes/coding-style-guide:latest}"
WORKSPACE="${VALIDATOR_WORKSPACE:-$(pwd)}"
COMMAND="${1:-validate}"
STRICT="${STRICT:-false}"
DEBUG="${DEBUG:-false}"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print usage
usage() {
    cat <<EOF
${GREEN}Coding Style Guide Validator${NC} - Container CLI Wrapper

${BLUE}USAGE:${NC}
    $0 [COMMAND] [OPTIONS]

${BLUE}COMMANDS:${NC}
    validate    Run all validation checks (default)
    lint        Run linters only
    format      Auto-format code
    docs        Build and validate documentation
    metadata    Validate @module metadata tags
    help        Show this help message

${BLUE}OPTIONS:${NC}
    --workspace DIR     Directory to validate (default: current directory)
    --image IMAGE       Container image to use (default: ghcr.io/tydukes/coding-style-guide:latest)
    --strict            Fail on warnings
    --debug             Enable debug output

${BLUE}ENVIRONMENT VARIABLES:${NC}
    VALIDATOR_IMAGE     Override container image
    VALIDATOR_WORKSPACE Override workspace directory
    STRICT              Enable strict mode
    DEBUG               Enable debug mode

${BLUE}EXAMPLES:${NC}
    # Validate current directory
    $0 validate

    # Run linters on specific directory
    $0 lint --workspace /path/to/repo

    # Format code with local image
    $0 format --image coding-style-guide:local

    # Validate with strict mode
    STRICT=true $0 validate

${BLUE}DOCKER COMPOSE USAGE:${NC}
    # Run validation
    docker-compose run --rm validator

    # Run linters only
    docker-compose run --rm lint

    # Format code
    docker-compose run --rm format

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --workspace)
            WORKSPACE="$2"
            shift 2
            ;;
        --image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --strict)
            STRICT=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        help|--help|-h)
            usage
            exit 0
            ;;
        validate|lint|format|docs|metadata)
            COMMAND="$1"
            shift
            ;;
        *)
            echo -e "${YELLOW}Warning: Unknown argument '$1'${NC}" >&2
            shift
            ;;
    esac
done

# Validate workspace exists
if [[ ! -d "$WORKSPACE" ]]; then
    echo -e "${YELLOW}Error: Workspace directory not found: $WORKSPACE${NC}" >&2
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Error: Docker is not installed or not in PATH${NC}" >&2
    exit 1
fi

# Print execution details
echo -e "${BLUE}Coding Style Guide Validator${NC}"
echo -e "  Image:     ${IMAGE_NAME}"
echo -e "  Workspace: ${WORKSPACE}"
echo -e "  Command:   ${COMMAND}"
echo -e "  Strict:    ${STRICT}"
echo -e "  Debug:     ${DEBUG}"
echo ""

# Run container
docker run --rm \
    -v "${WORKSPACE}:/workspace" \
    -e STRICT="${STRICT}" \
    -e DEBUG="${DEBUG}" \
    "${IMAGE_NAME}" \
    "${COMMAND}"

exit_code=$?

if [[ $exit_code -eq 0 ]]; then
    echo -e "\n${GREEN}✓ Validation completed successfully${NC}"
else
    echo -e "\n${YELLOW}✗ Validation failed with exit code ${exit_code}${NC}"
fi

exit $exit_code
