---
title: Git Registry
description: Using Git repositories as PromptScript registries
---

# Git Registry

This example shows how to use a Git repository as a PromptScript registry for sharing configurations across teams.

## Use Cases

- **Central registry** - Share organization-wide standards via Git
- **Version control** - Pin to specific versions using Git tags
- **Access control** - Use GitHub/GitLab permissions for registry access
- **CI/CD integration** - Automatic updates on registry changes

## Basic Setup

### Public Repository

```yaml
# promptscript.yaml
version: '1'

project:
  id: my-project

input:
  entry: .promptscript/project.prs

registry:
  git:
    url: https://github.com/your-org/promptscript-registry.git
    ref: main

targets:
  - github
  - claude
```

### Private Repository with Token

```yaml
# promptscript.yaml
version: '1'

project:
  id: my-project

input:
  entry: .promptscript/project.prs

registry:
  git:
    url: https://github.com/your-org/private-registry.git
    ref: main
    auth:
      type: token
      tokenEnvVar: GITHUB_TOKEN
  cache:
    enabled: true
    ttl: 3600000 # 1 hour in milliseconds

targets:
  - github
  - claude
```

### SSH Authentication

```yaml
# promptscript.yaml
version: '1'

project:
  id: my-project

input:
  entry: .promptscript/project.prs

registry:
  git:
    url: git@github.com:your-org/private-registry.git
    ref: main
    auth:
      type: ssh
      sshKeyPath: ~/.ssh/id_ed25519

targets:
  - github
  - claude
```

## Version Pinning

### Pin to Specific Tag

```yaml
registry:
  git:
    url: https://github.com/your-org/promptscript-registry.git
    ref: v1.2.0 # Pin to release v1.2.0
```

### Pin in .prs Files

You can also pin specific imports to versions:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

# Pin to specific version
@inherit @company/base@v1.0.0

# Use latest from configured ref
@use @company/security as sec
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAkAngFoazAFYxGWYYNb9+cUewyEBwgIwUADAcWsAvkqUBifgAUIyrM1Vo5ESI34A3GLQhslAATscbwgsfn8WMgxWUQB6ACMMOBh-Dz1DfXNWKwBVZP4obHgwsGpmEn4WVkgAcwBXahgefkawALr8iPLMGNjkxgbQ0X4k1TkQEwBdBk4salF8IlJyGCpaEAYvHzZ8HQmgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Repository Structure

Recommended structure for a Git registry:

```
promptscript-registry/
├── README.md
├── CHANGELOG.md
├── @org/
│   ├── base.prs           # Organization base
│   ├── security.prs       # Security policies
│   └── compliance.prs     # Compliance rules
├── @teams/
│   ├── frontend.prs       # Frontend team config
│   ├── backend.prs        # Backend team config
│   └── mobile.prs         # Mobile team config
└── @fragments/
    ├── testing.prs        # Reusable testing rules
    └── documentation.prs  # Documentation standards
```

## CLI Commands

### Pull from Registry

```bash
# Pull using default branch from config
prs pull

# Pull from specific branch
prs pull --branch develop

# Pull from specific tag
prs pull --tag v1.0.0

# Pull from specific commit
prs pull --commit abc123def

# Force refresh (ignore cache)
prs pull --refresh

# Preview without pulling
prs pull --dry-run
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/promptscript.yml
name: PromptScript CI

on:
  push:
    paths:
      - '.promptscript/**'
      - 'promptscript.yaml'

jobs:
  compile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PromptScript
        run: npm install -g @promptscript/cli

      - name: Pull registry updates
        run: prs pull
        env:
          GITHUB_TOKEN: ${{ secrets.REGISTRY_TOKEN }}

      - name: Compile
        run: prs compile

      - name: Check for changes
        run: |
          git diff --exit-code || {
            echo "::error::Compiled files changed. Run 'prs compile' locally."
            exit 1
          }
```

### GitLab CI

```yaml
# .gitlab-ci.yml
promptscript:
  image: node:20
  script:
    - npm install -g @promptscript/cli
    - prs pull
    - prs compile
    - git diff --exit-code
  variables:
    GITHUB_TOKEN: $REGISTRY_TOKEN
  only:
    changes:
      - .promptscript/**/*
      - promptscript.yaml
```

## Complete Example

### Registry Files

**@org/base.prs**

```promptscript
@meta {
  id: "@org/base"
  syntax: "1.0.0"
  org: "ACME Corp"
}

@identity {
  """
  You are an AI assistant at ACME Corp.
  Follow our coding standards and best practices.
  """
}

@standards {
  code: [
    "Code review required for all changes"
    "Tests required for all code"
  ]
  git: [
    "Use conventional commits format"
  ]
}

@restrictions {
  - "Never commit secrets"
  - "Always follow security policies"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABZtQDmAegBGGODGGDW-fnACe7DIQHCAjBQAMRpSv7iJukAEEAwgFkAov1vi0pgL7LlI3pywQWOr8wMqqSiCmqgCazACu-BjUMIkq1gCSiXBwEHBYGOyJWPx2Ti5uFGH8AGLMUFDMAO7mcdT8LDwQrBJq+aw8STxwqTz8MvDFNBiMAYzwlWYRnt6sInkFA9RDIVUdMALIVeEgrjwpyQBuEDDNyQCOcRDJo2DiifXtOAUS8FGqQiAACoTYb3R7PfivNoYD57P4AXSqEkCByOAIAqgp2mwLv4IGwYdiSCRAsMoSRsAjlF5WD5knlqBAZvjWMNQmYALQAgByMFxbRYxMCahgjGSWDgfy5wmsUEaGHUZLqDWaCkYrUCwTQdSZ10lkVYHhAHnhDH81HU+CIpHIMCotBADH5OTY+D0xqAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**@teams/frontend.prs**

```promptscript
@meta {
  id: "@teams/frontend"
  syntax: "1.0.0"
}

@inherit @org/base

@identity {
  """
  You are a frontend development expert.
  Expertise: React, TypeScript, TailwindCSS
  """
}

@context {
  framework: "React 18"
  language: "TypeScript 5"
  styling: "TailwindCSS"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABDqTgB6MNTYdWPYYNb9+cAJ7sMhAcICMFAAxGlrAL7LlIiKxwxqELPxHNqAc0kAjDHBiXW1jycWI7q-MDKqkogpqoAmswArvwY1DAp-DJynDz8QQBuMFDMaCTB-ERo9lgUkfwAooRV1CG+AgBKMBiMWHT8ACrqVQDKjA5ovQMY0ADuNjwAwsPDddGmFqxWLOxEThEqmdSkMDOuANa6IJ3dTnoAHLH8UBisbokYbjCXgyNjEBP8ACsjzgWHUUBsbm+0ygcwUSxWMXMIDMAF0GMFqOp8ERSOQYFRaCAGIVaBA2Pg9CigA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Project Configuration

**promptscript.yaml**

```yaml
version: '1'

project:
  id: customer-portal
  team: frontend

inherit: '@teams/frontend'

input:
  entry: .promptscript/project.prs

registry:
  git:
    url: https://github.com/acme/promptscript-registry.git
    ref: v1.0.0
    auth:
      type: token
      tokenEnvVar: GITHUB_TOKEN
  cache:
    enabled: true
    ttl: 3600000

targets:
  - github
  - claude
  - cursor
```

**.promptscript/project.prs**

```promptscript
@meta {
  id: "customer-portal"
  syntax: "1.0.0"
}

@inherit @teams/frontend@v1.0.0

@context {
  project: "Customer Portal"

  """
  Self-service portal for ACME customers.
  Features: account management, orders, support.
  """
}

@shortcuts {
  "/portal": "Work on portal features"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHSYBXOFmYkY1ALRpm1LBijDBrfvzgBPdhkIDhARgoAGU6tYBfNWoACEVjmkQs-Wx1JwA9GGpsOrDy2AG7GZiY2rLYs7ESuwGoaNMwAVjCMWAYgAMJiElLU-AAKCkoqIJEaqhUV6vwAyjBQYDJw0sEQjDD88orK-GAK-ACC2QCyAKL8jHmS0nAUifwAYjDYItTwAhiMLCLs-CQYrBgA5jBS7HT8Cjzz13AiaL1Yi3XVFtasdnA4pTNYOD8BLvEBeF7KYRZADqCgA1jd1BCoAM1lgNvBPiBLABdBicLDULT4IikcgwKi0EAMYLzCBsfCGbFAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Troubleshooting

### Authentication Failed

```
Error: Git authentication failed
```

**Solutions:**

1. Check `GITHUB_TOKEN` is set: `echo $GITHUB_TOKEN`
2. Verify token has `repo` scope for private repos
3. For SSH, ensure key is added: `ssh-add -l`

### Ref Not Found

```
Error: Git ref not found: v2.0.0
```

**Solutions:**

1. List available tags: `git ls-remote --tags <url>`
2. Use existing branch/tag
3. Check for typos in version

### Cache Issues

```bash
# Force refresh to bypass cache
prs pull --refresh
```

## Best Practices

1. **Version your registry** - Use semantic versioning with Git tags
2. **Pin production versions** - Don't use `main` in production
3. **Document changes** - Maintain a CHANGELOG.md
4. **Test before releasing** - Validate all .prs files before tagging
5. **Use short TTL in dev** - Faster iteration with `ttl: 60000`
