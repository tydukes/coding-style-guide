# Multi-stage build for coding style guide validator

# Stage 1: install CLI npm production dependencies
FROM node:20-slim AS cli-deps
WORKDIR /app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: final image
FROM python:3.15.0rc1-slim AS base

# Install system dependencies, UV, and Node.js runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    nodejs \
    npm \
    shellcheck \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./
COPY .pre-commit-config.yaml ./

# Install Python dependencies with UV
RUN uv sync --no-dev

# Install Python linter tools into the venv (black, flake8, yamllint are dev-only
# in pyproject.toml but required as runtime tools inside the container)
RUN uv pip install black flake8 yamllint

# Add venv bin to PATH so the CLI can find Python-based linters
ENV PATH="/app/.venv/bin:${PATH}"

# Install Node.js linter globals (eslint, prettier, markdownlint-cli)
RUN npm install -g eslint prettier markdownlint-cli

# Install hadolint (Dockerfile linter) — multi-arch binary
RUN ARCH=$(uname -m) && \
    case "${ARCH}" in \
        x86_64)  HA="x86_64" ;; \
        aarch64) HA="arm64"  ;; \
        *) echo "Unsupported arch: ${ARCH}" && exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-${HA}" \
         -o /usr/local/bin/hadolint && \
    chmod +x /usr/local/bin/hadolint

# Install CLI: pre-built dist + prod node_modules from cli-deps stage
COPY cli/package.json ./cli/
COPY cli/dist/ ./cli/dist/
COPY cli/bin/ ./cli/bin/
COPY cli/config/ ./cli/config/
COPY --from=cli-deps /app/cli/node_modules/ ./cli/node_modules/
RUN chmod +x /app/cli/bin/devops-style.js \
    && ln -s /app/cli/bin/devops-style.js /usr/local/bin/devops-style

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
