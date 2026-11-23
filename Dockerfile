# Multi-stage build for coding style guide validator

# Use the official multi-platform Terraform CLI for HCL formatting checks.
FROM hashicorp/terraform:1.17.2 AS terraform-cli

# Install CLI npm production dependencies
FROM node:26-slim AS cli-deps
WORKDIR /app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
WORKDIR /opt/node-tools
COPY docker/node-tools/package.json docker/node-tools/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Use the published uv binary instead of executing a downloaded installer.
FROM ghcr.io/astral-sh/uv:0.13.9 AS uv-cli

# Final image
FROM python:3.15-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    libatomic1 \
    shellcheck \
    && rm -rf /var/lib/apt/lists/*

COPY --from=uv-cli /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./
COPY .pre-commit-config.yaml ./

# Install locked runtime dependencies and linters from binary distributions.
RUN uv sync --frozen --no-dev --group container --no-build --no-install-project

# Add venv bin to PATH so the CLI can find Python-based linters
ENV PATH="/app/.venv/bin:${PATH}"

# Use the same Node.js runtime to install and run the JavaScript tools.
COPY --from=cli-deps /usr/local/bin/node /usr/local/bin/node
COPY --from=cli-deps /opt/node-tools /opt/node-tools
ENV PATH="/opt/node-tools/node_modules/.bin:${PATH}"

# Install hadolint (Dockerfile linter) — multi-arch binary
RUN ARCH=$(uname -m) && \
    case "${ARCH}" in \
        x86_64)  HA="x86_64" ;; \
        aarch64) HA="arm64"  ;; \
        *) echo "Unsupported arch: ${ARCH}" && exit 1 ;; \
    esac && \
    curl --proto '=https' --proto-redir '=https' -fsSL \
         "https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-${HA}" \
         -o /usr/local/bin/hadolint && \
    chmod +x /usr/local/bin/hadolint

COPY --from=terraform-cli /bin/terraform /usr/local/bin/terraform

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
