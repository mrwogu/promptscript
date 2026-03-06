---
title: User-Level Configuration
description: Configure default PromptScript settings for your developer environment
---

# User-Level Configuration

PromptScript supports user-level configuration at `~/.promptscript/config.yaml`. This provides default settings that apply across all your projects, reducing repetitive configuration.

## Config File

Create `~/.promptscript/config.yaml`:

```yaml
version: '1'

registry:
  git:
    url: https://github.com/your-org/your-registry.git
    ref: main
    auth:
      type: token
      tokenEnvVar: GITHUB_TOKEN
  cache:
    enabled: true
    ttl: 3600000 # 1 hour

defaults:
  targets:
    - github
    - claude
  team: frontend
```

## Fields

### `registry`

Default registry configuration used when no project-level registry is configured.

| Field                           | Description                              |
| ------------------------------- | ---------------------------------------- |
| `registry.git.url`              | Git repository URL                       |
| `registry.git.ref`              | Branch, tag, or commit (default: `main`) |
| `registry.git.path`             | Subdirectory within repo                 |
| `registry.git.auth.type`        | Authentication: `token` or `ssh`         |
| `registry.git.auth.tokenEnvVar` | Env var containing the token             |
| `registry.git.auth.sshKeyPath`  | Path to SSH key                          |
| `registry.url`                  | HTTP registry URL                        |
| `registry.cache.enabled`        | Enable caching (default: `true`)         |
| `registry.cache.ttl`            | Cache TTL in milliseconds                |

### `defaults`

Default values used by `prs init --yes` when no CLI flags are provided.

| Field              | Description                 |
| ------------------ | --------------------------- |
| `defaults.targets` | Default compilation targets |
| `defaults.team`    | Default team namespace      |

## Priority Order

Configuration is merged from multiple sources with this priority (highest wins):

1. **CLI flags** (`--registry`, `--targets`, etc.)
2. **Environment variables** (`PROMPTSCRIPT_REGISTRY_GIT_URL`, etc.)
3. **Project config** (`promptscript.yaml`)
4. **User config** (`~/.promptscript/config.yaml`)

## Environment Variables

Override any config value with environment variables:

| Variable                        | Maps to                  |
| ------------------------------- | ------------------------ |
| `PROMPTSCRIPT_REGISTRY_GIT_URL` | `registry.git.url`       |
| `PROMPTSCRIPT_REGISTRY_GIT_REF` | `registry.git.ref`       |
| `PROMPTSCRIPT_REGISTRY_URL`     | `registry.url`           |
| `PROMPTSCRIPT_CACHE_TTL`        | `registry.cache.ttl`     |
| `PROMPTSCRIPT_CACHE_ENABLED`    | `registry.cache.enabled` |

Example:

```bash
PROMPTSCRIPT_REGISTRY_GIT_URL=https://github.com/my-org/reg.git prs init --yes
```

## How It Works with `prs init`

When running `prs init --yes`:

1. Loads user config from `~/.promptscript/config.yaml`
2. Uses `registry` from user config if no `--registry` flag provided
3. Uses `defaults.targets` if no `--targets` flag provided
4. Uses `defaults.team` if no `--team` flag provided
5. Attempts to fetch manifest from configured registry for suggestions
