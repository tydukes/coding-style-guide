# Multi-stage build for coding style guide validator
FROM python:3.10-slim AS base

# Install system dependencies and UV
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    shellcheck \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/install.sh | sh
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

# Copy entrypoint script with execute permissions and create workspace directory
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/
RUN mkdir -p /workspace
WORKDIR /workspace

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Default command
CMD ["validate"]

# Metadata
LABEL org.opencontainers.image.title="Coding Style Guide Validator"
LABEL org.opencontainers.image.description="Containerized validation tools for coding standards"
LABEL org.opencontainers.image.source="https://github.com/tydukes/coding-style-guide"
LABEL org.opencontainers.image.licenses="MIT"
