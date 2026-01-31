# =============================================================================
# PromptScript CLI Docker Image
# =============================================================================
# Multi-stage build for minimal final image size
#
# Usage:
#   docker build -t promptscript .
#   docker run --rm -v $(pwd):/workspace promptscript validate
#   docker run --rm -v $(pwd):/workspace promptscript compile
#
# For more information, see: https://getpromptscript.dev/latest/guides/docker/
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
# Build the CLI from source with all development dependencies
FROM node:25-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Enable corepack for pnpm
RUN corepack enable pnpm

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json ./

# Copy all package.json files to establish workspace structure
COPY packages/core/package.json packages/core/
COPY packages/parser/package.json packages/parser/
COPY packages/resolver/package.json packages/resolver/
COPY packages/validator/package.json packages/validator/
COPY packages/compiler/package.json packages/compiler/
COPY packages/formatters/package.json packages/formatters/
COPY packages/cli/package.json packages/cli/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 2: Runtime
# -----------------------------------------------------------------------------
# Minimal runtime image with only production dependencies
FROM node:25-alpine AS runtime

# Image metadata
LABEL org.opencontainers.image.title="PromptScript CLI" \
      org.opencontainers.image.description="CLI for PromptScript - standardize AI instructions across AI coding assistants" \
      org.opencontainers.image.url="https://getpromptscript.dev" \
      org.opencontainers.image.source="https://github.com/mrwogu/promptscript" \
      org.opencontainers.image.vendor="PromptScript" \
      org.opencontainers.image.licenses="MIT"

# Install git (required for prs pull and simple-git)
RUN apk add --no-cache git

# Set up application directory
WORKDIR /app

# Copy built CLI from builder stage
COPY --from=builder /build/dist/packages/cli/ ./

# Install production dependencies only
RUN npm install --omit=dev && \
    npm cache clean --force

# Create workspace directory and set permissions
# Use existing 'node' user (UID/GID 1000) from node:alpine base image
RUN mkdir -p /workspace && \
    chown -R node:node /workspace /app

# Switch to non-root user
USER node

# Set workspace as working directory for user files
WORKDIR /workspace

# Configure git safe directory for mounted volumes
RUN git config --global --add safe.directory /workspace

# Set entrypoint to the CLI
ENTRYPOINT ["node", "/app/bin/prs.js"]

# Default command shows help
CMD ["--help"]
