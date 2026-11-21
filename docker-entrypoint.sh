#!/usr/bin/env bash
# Docker entrypoint for coding style guide validator

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    local msg="$1"
    echo -e "${BLUE}[INFO]${NC} $msg"
    return
}

log_success() {
    local msg="$1"
    echo -e "${GREEN}[SUCCESS]${NC} $msg"
    return
}

log_warning() {
    local msg="$1"
    echo -e "${YELLOW}[WARNING]${NC} $msg"
    return
}

log_error() {
    local msg="$1"
    echo -e "${RED}[ERROR]${NC} $msg"
    return
}

run_checks() {
    local args=(check --no-cache)
    if [[ ${STRICT:-false} == true ]]; then
        args+=(--strict)
    fi
    devops-style "${args[@]}"
}

# Function to run validation
run_validate() {
    log_info "Running full validation suite..."

    local exit_code=0

    # Run metadata validation (non-blocking)
    log_info "Checking metadata tags..."
    if /app/.venv/bin/python /app/scripts/validate_metadata.py .; then
        log_success "Metadata validation passed"
    else
        log_warning "Metadata validation failed (non-blocking)"
    fi

    # Run linters via the devops-style CLI
    log_info "Running linters..."
    if run_checks; then
        log_success "Linter checks passed"
    else
        log_error "Linter checks failed"
        exit_code=1
    fi

    # Check for common files
    if [[ -f "mkdocs.yml" ]]; then
        log_info "Building MkDocs documentation..."
        if /app/.venv/bin/mkdocs build --strict 2>&1; then
            log_success "Documentation build passed"
        else
            log_error "Documentation build failed"
            exit_code=1
        fi
    else
        log_info "No mkdocs.yml found, skipping docs build"
    fi

    if [[ $exit_code -eq 0 ]]; then
        log_success "All validation checks passed!"
    else
        log_error "Validation failed with errors"
    fi

    return $exit_code
}

# Function to run linters only
run_lint() {
    log_info "Running linters only..."

    if run_checks; then
        log_success "Linter checks passed"
        return 0
    else
        log_error "Linter checks failed"
        return 1
    fi
}

# Function to format code
run_format() {
    log_info "Formatting code..."

    # Run black if Python files exist
    if [[ -n "$(find . -name "*.py" -type f -print -quit)" ]]; then
        log_info "Formatting Python files with black..."
        /app/.venv/bin/black .
    fi

    # Run terraform fmt if .tf files exist
    log_info "Formatting Terraform files..."
    if ! terraform fmt -recursive .; then
        log_error "Terraform formatting failed"
        return 1
    fi

    log_success "Formatting complete"
}

# Function to validate docs
run_docs() {
    log_info "Validating documentation..."

    if [[ ! -f "mkdocs.yml" ]]; then
        log_error "No mkdocs.yml found in workspace"
        return 1
    fi

    if /app/.venv/bin/mkdocs build --strict; then
        log_success "Documentation validation passed"
        return 0
    else
        log_error "Documentation validation failed"
        return 1
    fi
}

# Function to validate metadata
run_metadata() {
    log_info "Validating metadata tags..."

    local args=(.)
    if [[ ${STRICT:-false} == true ]]; then
        args+=(--strict)
    fi
    if /app/.venv/bin/python /app/scripts/validate_metadata.py "${args[@]}"; then
        log_success "Metadata validation passed"
        return 0
    else
        log_error "Metadata validation failed"
        return 1
    fi
}

# Function to show help
show_help() {
    cat <<EOF
Coding Style Guide Validator - Container Usage

USAGE:
    docker run --rm -v "\$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest [COMMAND]

COMMANDS:
    validate    Run all validation checks (default)
    lint        Run linters only
    format      Auto-format code
    docs        Build and validate documentation
    metadata    Validate @module metadata tags
    help        Show this help message

EXAMPLES:
    # Run full validation
    docker run --rm -v "\$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest validate

    # Run linters only
    docker run --rm -v "\$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest lint

    # Format code in-place
    docker run --rm -v "\$PWD:/workspace" ghcr.io/tydukes/coding-style-guide:latest format

VOLUME MOUNTS:
    /workspace  - Your repository to validate (required)

ENVIRONMENT VARIABLES:
    STRICT      - Fail on linter warnings and standalone metadata warnings (default: false)
    DEBUG       - Print tool versions (default: false)

EOF
}

# Main entry point
main() {
    local command="${1:-validate}"

    log_info "Coding Style Guide Validator"
    log_info "Command: $command"
    log_info "Workspace: /workspace"
    echo ""

    if [[ ${DEBUG:-false} == true ]]; then
        devops-style --version
        terraform version
    fi

    case "$command" in
        validate)
            run_validate
            ;;
        lint)
            run_lint
            ;;
        format)
            run_format
            ;;
        docs)
            run_docs
            ;;
        metadata)
            run_metadata
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
