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

## Self-Hosted Git Servers

PromptScript works with **any Git server**, not just GitHub. This includes self-hosted GitLab, Gitea, Bitbucket Server, Azure DevOps, and other Git-compatible servers.

### Self-Hosted GitLab

```yaml
# promptscript.yaml
version: '1'

project:
  id: my-project

input:
  entry: .promptscript/project.prs

registry:
  git:
    url: https://gitlab.your-company.com/org/promptscript-registry.git
    ref: main
    auth:
      type: token
      tokenEnvVar: GITLAB_TOKEN # Use any env var name you prefer

targets:
  - github
  - claude
```

```bash
# Set your GitLab Personal Access Token (requires read_repository scope)
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx"
prs pull
```

### Self-Hosted GitLab with SSH

```yaml
registry:
  git:
    url: git@gitlab.your-company.com:org/promptscript-registry.git
    ref: main
    auth:
      type: ssh
      sshKeyPath: ~/.ssh/id_ed25519
```

### Gitea / Forgejo

```yaml
registry:
  git:
    url: https://gitea.your-company.com/org/promptscript-registry.git
    ref: main
    auth:
      type: token
      tokenEnvVar: GITEA_TOKEN
```

### Bitbucket Server (Self-Hosted)

```yaml
registry:
  git:
    url: https://bitbucket.your-company.com/scm/org/promptscript-registry.git
    ref: main
    auth:
      type: token
      tokenEnvVar: BITBUCKET_TOKEN
```

### Azure DevOps Server

```yaml
registry:
  git:
    url: https://dev.your-company.com/org/project/_git/promptscript-registry
    ref: main
    auth:
      type: token
      tokenEnvVar: AZURE_DEVOPS_TOKEN
```

### Token Types by Provider

| Provider         | Token Type            | Required Scope    |
| ---------------- | --------------------- | ----------------- |
| GitLab           | Personal Access Token | `read_repository` |
| GitLab           | Project Access Token  | `read_repository` |
| GitLab           | Deploy Token          | `read_repository` |
| Gitea            | Access Token          | `read:repository` |
| Bitbucket Server | HTTP Access Token     | Repository read   |
| Azure DevOps     | Personal Access Token | Code (Read)       |

!!! tip "Environment Variable Naming"
The `tokenEnvVar` field accepts any environment variable name. Use a name that makes sense for your organization, such as `REGISTRY_TOKEN`, `GITLAB_TOKEN`, or `GIT_REGISTRY_PAT`.

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

# Pin to specific version (in a multi-file setup):
@inherit @company/base@1.0.0

# Use latest from configured ref:
@use @company/security as sec
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAGK7tYBfMWIDEggAoRxWZoLhotESEZBADcYWgg2QQAKD0EhEgBXKCwIZUhYH34EtABKRGdBbg8cMIgsQpYyDFZFAHoAIww4GG4La0sJFyjqGABzCDgsakVBZUEpAYx62ClBMGZqQXIMRV7qZgTWKRyCgFVmwShseHKwdZJBFlZIXoSe2Z6wfNYXbgSD7krMGtrmxjuyiMmpkgoIuj1+oNhqNxpNpjBZvNFstVutNtsQHYALoMThDRT4IikcgwKi0EAMULhNj4MyYoA" target="_blank" rel="noopener noreferrer">
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
    # Use GITLAB_TOKEN for GitLab registries, or match your tokenEnvVar config
    GITLAB_TOKEN: $REGISTRY_TOKEN
  only:
    changes:
      - .promptscript/**/*
      - promptscript.yaml
```

!!! note "Self-Hosted GitLab CI"
For self-hosted GitLab, you can use the built-in `CI_JOB_TOKEN` for repositories within the same GitLab instance:

    ```yaml
    variables:
      GITLAB_TOKEN: $CI_JOB_TOKEN
    ```

    For cross-instance access, use a Project Access Token or Deploy Token stored in CI/CD variables.

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
    "Code review required for all changes",
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuzagHMA9ACMMcGPLES4AT3YZCs+QEYKABmu7xgpcrMgAggGEAsgFFBbpWjsAXzExbmlOLAgsA2E9ORBdBPsATWYAV0EMahhM8RcASUy4OAg4AXZMrEF3b19-CjiAMWYoKGYAdwc06kEWKQhWZUEyjFYpLKk4XKlBdXgqmgxGSMZ4BvtEoJDWbhGxianRez6YWWQ4iXk-KRzsgDcIGE7sgEc0iGyZsCVM1t6cUbKeDyOgXeIAFXmU1e70+gm+PQwfxOdgkAF04soomcwfIAKraXpsO4RCBsJFEkgkKJTBEkbCowQY1jBVihbJlagQZZk1iHOIAWniADkYCSeiwqVFhjBGNksHBGUL5C4oO0MAZaS02p1tIxulEYmgWtzHoqkoEQIE0QwItQDPgiKRyDAqLQQAxxSU2PhzFagA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**@teams/frontend.prs**

```promptscript
@meta {
  id: "@teams/frontend"
  syntax: "1.0.0"
}

# In a multi-file setup, you would inherit:
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuHUnAD0Yamw6sp8sRLgBPdhkKz5ARgoAGa7tYBfMWIDEggJLihJAK5QsEAFpIWEE4fm80OkEDZm9BAHdYqClJVhwYaggsRBdBbgg0jKy85moAcxUAIwwwiVcACmoYMog4LGoDQQDBKVaMStgUsFLBcgwDMo1vbQBKMXypTn8sTtFxORBdTfWATVjBDCaDwXVNThTFgDcYKGY0PnZBIjQMrAo9QQBRQhfqfzDZAAlGAYRhYKIAFQMLwAyoxMmhwYIIRhoPEClIAMIwmEfLZ2RyseYsdhELDCD7qUgwRLUADWZhAwNB5PMAA47BIoBhWGVvBgyjBGVDYfCIIjBABWTmhFZQAplYWoqDo7TY3HbewgewAXQYSw6+CIpHIMCotBADGutAgbHw5m1QA" target="_blank" rel="noopener noreferrer">
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

# In a multi-file setup, you would inherit:
@inherit @teams/frontend@1.0.0

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMArnCzM+1ALRpm1AVHliJcAJ7sMhWfICMFAAy39rAL5ixAYkEBJcUJIKoWCHVIWEE4fgU0OkEjZgVBAHdYqClJVhwYaggsRDdBbgg0jKy8jlI4AHowajYOViluazsbCXcACmoYAHMIZWojQXVBKR6MACNYFLBtQXIMI07qhTqASjFuFnYiLGEDGeqAKxhGbLkQAGElFTVBAAVtXQdd-RAHCQBlGCgwdTDqADcIIwYDN7hgoIIptRBABBM4AWQAooJGJdVBk4BRdgAxGDYBQdOCyDCMFhLbYkDCsDCdGB8dhRbRSdFROARLQ6THiU7PMTOVhrOA4e4orBwHZc+TldkPJCnADq2gA1oI2CCdGCIbisPj4A5HCBHABdBicLB9fBEUjkGBUWggBh-dEQNj4SwGoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Troubleshooting

### Authentication Failed

```
Error: Git authentication failed
```

**Solutions:**

1. Check your token environment variable is set: `echo $GITLAB_TOKEN` (or your configured `tokenEnvVar`)
2. Verify token has the required scope:
   - GitHub: `repo` scope
   - GitLab: `read_repository` scope
   - Gitea: `read:repository` scope
3. For SSH, ensure key is added: `ssh-add -l`
4. For self-hosted servers, verify the URL is correct and accessible from your network

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
