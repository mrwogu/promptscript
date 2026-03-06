---
name: committing
description: Creates well-structured git commits following conventional commit format
---

<!-- PromptScript 2026-03-04T21:41:05.478Z - do not edit -->

## Commit Message Format

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

## Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Formatting, no code change
- **refactor**: Code change without fix/feature
- **perf**: Performance improvement
- **test**: Adding or fixing tests
- **chore**: Build, CI, tooling changes

## Rules

1. Subject under 50 characters, imperative mood
2. Body wraps at 72 characters, explains "why" not "what"
3. Never commit secrets or .env files
4. Create NEW commits after hook failures, don't amend
