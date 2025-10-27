# Example Makefile for using the coding style guide validator locally
# Place this in your repository root and run: make validate

.PHONY: help validate lint format docs metadata clean

# Docker image to use
IMAGE ?= ghcr.io/tydukes/coding-style-guide:latest

# Current directory
PWD := $(shell pwd)

help: ## Show this help message
	@echo "Coding Style Guide Validator - Local Usage"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

validate: ## Run full validation
	@echo "Running full validation..."
	@docker run --rm -v $(PWD):/workspace $(IMAGE) validate

lint: ## Run linters only
	@echo "Running linters..."
	@docker run --rm -v $(PWD):/workspace $(IMAGE) lint

format: ## Auto-format code
	@echo "Formatting code..."
	@docker run --rm -v $(PWD):/workspace $(IMAGE) format

docs: ## Build and validate documentation
	@echo "Validating documentation..."
	@docker run --rm -v $(PWD):/workspace $(IMAGE) docs

metadata: ## Validate metadata tags
	@echo "Validating metadata..."
	@docker run --rm -v $(PWD):/workspace $(IMAGE) metadata

pull: ## Pull latest container image
	@echo "Pulling latest image..."
	@docker pull $(IMAGE)

build: ## Build local container image
	@echo "Building local image..."
	@docker build -t coding-style-guide:local .

clean: ## Clean up validation artifacts
	@echo "Cleaning up..."
	@rm -rf site/ .cache/ __pycache__/
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete

# Advanced targets

validate-strict: ## Run validation in strict mode
	@echo "Running strict validation..."
	@docker run --rm -v $(PWD):/workspace -e STRICT=true $(IMAGE) validate

validate-debug: ## Run validation with debug output
	@echo "Running validation with debug output..."
	@docker run --rm -v $(PWD):/workspace -e DEBUG=true $(IMAGE) validate

shell: ## Open shell in container for debugging
	@docker run --rm -it -v $(PWD):/workspace --entrypoint /bin/bash $(IMAGE)

test-local: build ## Build and test local image
	@echo "Testing local build..."
	@docker run --rm -v $(PWD):/workspace coding-style-guide:local validate
