# Multi-stage build for coding style guide validator
FROM python:3.14-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    bash \
    shellcheck \
    && rm -rf /var/lib/apt/lists/*

# Install UV
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./
COPY .pre-commit-config.yaml ./

# Install dependencies with UV
RUN uv sync --no-dev

# Copy validation scripts and configs
COPY scripts/ ./scripts/
COPY mkdocs.yml ./
COPY .markdownlint.json ./

# Create workspace directory for mounting external repos
RUN mkdir -p /workspace
WORKDIR /workspace

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Default command
CMD ["validate"]

# Metadata
LABEL org.opencontainers.image.title="Coding Style Guide Validator"
LABEL org.opencontainers.image.description="Containerized validation tools for coding standards"
LABEL org.opencontainers.image.source="https://github.com/tydukes/coding-style-guide"
LABEL org.opencontainers.image.licenses="MIT"
