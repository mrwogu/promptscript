---
title: Docker
description: Running PromptScript CLI in Docker containers
---

# Docker

Run PromptScript CLI in Docker containers for consistent environments across development and CI/CD.

## Quick Start

Pull the latest image and validate your PromptScript files:

```bash
# Pull the image
docker pull ghcr.io/mrwogu/promptscript:latest

# Validate files in current directory
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest validate

# Compile to all targets
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile
```

## Image Tags

| Tag      | Description                        | Example                              |
| -------- | ---------------------------------- | ------------------------------------ |
| `latest` | Latest stable release              | `ghcr.io/mrwogu/promptscript:latest` |
| `next`   | Latest pre-release (alpha/beta/rc) | `ghcr.io/mrwogu/promptscript:next`   |
| `X.Y.Z`  | Specific version                   | `ghcr.io/mrwogu/promptscript:1.0.0`  |
| `X.Y`    | Latest patch of minor version      | `ghcr.io/mrwogu/promptscript:1.0`    |
| `X`      | Latest minor of major version      | `ghcr.io/mrwogu/promptscript:1`      |

All tags are generated automatically by CI/CD when a new version is released.

For production environments, pin to a specific version:

```bash
docker pull ghcr.io/mrwogu/promptscript:1.0.0
```

## Basic Usage

### Initialize a New Project

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest \
  init --name myproject --targets github,claude
```

### Validate PromptScript Files

```bash
# Basic validation
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest validate

# Strict mode (treat warnings as errors)
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest validate --strict

# JSON output for parsing
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest validate --format json
```

### Compile to Target Formats

```bash
# Compile to all configured targets
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile

# Dry run (preview without writing files)
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile --dry-run

# Watch mode for development
docker run --rm -it -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile --watch
```

### Check Configuration

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest check
```

## Environment Variables

Configure the CLI behavior through environment variables:

| Variable               | Description                           | Example    |
| ---------------------- | ------------------------------------- | ---------- |
| `GITHUB_TOKEN`         | Authentication for private registries | `ghp_xxxx` |
| `PROMPTSCRIPT_VERBOSE` | Enable verbose output                 | `1`        |
| `NO_COLOR`             | Disable colored output                | `1`        |

### Using Environment Variables

```bash
# With private registry authentication
docker run --rm \
  -v $(pwd):/workspace \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  ghcr.io/mrwogu/promptscript:latest pull

# Verbose output
docker run --rm \
  -v $(pwd):/workspace \
  -e PROMPTSCRIPT_VERBOSE=1 \
  ghcr.io/mrwogu/promptscript:latest compile

# Disable colors (useful for CI logs)
docker run --rm \
  -v $(pwd):/workspace \
  -e NO_COLOR=1 \
  ghcr.io/mrwogu/promptscript:latest validate
```

## CI/CD Integration

### GitHub Actions

```yaml
name: PromptScript

on:
  push:
    paths:
      - '.promptscript/**'
      - 'promptscript.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/mrwogu/promptscript:latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate
        run: prs validate --strict

      - name: Compile
        run: prs compile

      - name: Check drift
        run: |
          git config --global --add safe.directory "$GITHUB_WORKSPACE"
          if ! git diff --quiet; then
            echo "::error::Compiled files are out of sync"
            exit 1
          fi
```

### GitLab CI

```yaml
promptscript:
  image: ghcr.io/mrwogu/promptscript:latest
  script:
    - prs validate --strict
    - prs compile
    - git diff --exit-code
  rules:
    - changes:
        - .promptscript/**/*
        - promptscript.yaml
```

### Jenkins

```groovy
pipeline {
    agent {
        docker {
            image 'ghcr.io/mrwogu/promptscript:latest'
        }
    }
    stages {
        stage('Validate') {
            steps {
                sh 'prs validate --strict'
            }
        }
        stage('Compile') {
            steps {
                sh 'prs compile'
            }
        }
        stage('Check Drift') {
            steps {
                sh 'git diff --exit-code'
            }
        }
    }
}
```

### Azure DevOps

```yaml
pool:
  vmImage: 'ubuntu-latest'

container: ghcr.io/mrwogu/promptscript:latest

steps:
  - checkout: self

  - script: prs validate --strict
    displayName: 'Validate PromptScript'

  - script: prs compile
    displayName: 'Compile PromptScript'

  - script: git diff --exit-code
    displayName: 'Check drift'
```

## Private Registries

When using a private PromptScript registry, pass your authentication token:

```bash
# Pull from private registry
docker run --rm \
  -v $(pwd):/workspace \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  ghcr.io/mrwogu/promptscript:latest pull

# Compile with registry access
docker run --rm \
  -v $(pwd):/workspace \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  ghcr.io/mrwogu/promptscript:latest compile
```

For CI/CD, use secrets:

```yaml
# GitHub Actions
- name: Compile with registry
  run: |
    docker run --rm \
      -v ${{ github.workspace }}:/workspace \
      -e GITHUB_TOKEN=${{ secrets.REGISTRY_TOKEN }} \
      ghcr.io/mrwogu/promptscript:latest compile
```

## Building Locally

Build the Docker image from source:

```bash
# Clone the repository
git clone https://github.com/mrwogu/promptscript.git
cd promptscript

# Build the image
docker build -t promptscript:local .

# Test your build
docker run --rm promptscript:local --version
docker run --rm -v $(pwd):/workspace promptscript:local validate
```

## Troubleshooting

### Permission Denied

If you see permission errors when writing files:

```
Error: EACCES: permission denied
```

The container runs as non-root user (UID 1000). Ensure your mounted directory is writable:

```bash
# Check current user ID
id -u

# If not 1000, you may need to adjust permissions or run as root
docker run --rm -u root -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile
```

### Git Safe Directory

If you see git errors about unsafe directories:

```
fatal: detected dubious ownership in repository
```

The image configures `/workspace` as a safe directory. Ensure you're mounting to `/workspace`:

```bash
# Correct - mount to /workspace
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile

# Incorrect - different mount point
docker run --rm -v $(pwd):/app ghcr.io/mrwogu/promptscript:latest compile
```

### Interactive Commands

For commands that require input (like `init` without flags), use `-it`:

```bash
docker run --rm -it -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest init
```

### Container Not Found

If the image pull fails:

```bash
# Verify you can access GitHub Container Registry
docker login ghcr.io

# Try pulling with explicit registry
docker pull ghcr.io/mrwogu/promptscript:latest
```

### Debug Mode

Enable verbose output for troubleshooting:

```bash
docker run --rm \
  -v $(pwd):/workspace \
  -e PROMPTSCRIPT_VERBOSE=1 \
  ghcr.io/mrwogu/promptscript:latest compile
```

### Shell Access

For debugging, access the container shell:

```bash
docker run --rm -it --entrypoint sh ghcr.io/mrwogu/promptscript:latest
```

## Image Details

| Property          | Value                        |
| ----------------- | ---------------------------- |
| Base image        | `node:25-alpine`             |
| Working directory | `/workspace`                 |
| User              | `prs` (UID 1000)             |
| Entrypoint        | `node /app/bin/prs.js`       |
| Platforms         | `linux/amd64`, `linux/arm64` |

The image includes:

- Node.js 25 runtime
- Git (required for `prs pull`)
- PromptScript CLI with production dependencies

## See Also

- [CI/CD Integration](ci.md) - npm-based CI/CD configuration
- [CLI Reference](../reference/cli.md) - Full CLI command reference
- [Configuration](../reference/config.md) - `promptscript.yaml` options
