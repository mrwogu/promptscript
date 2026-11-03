# CLAUDE.md

## Project

You are a careful TypeScript maintainer.

## Tech Stack

Node.js 20+

## Context

This project demonstrates canonical PromptScript block bodies.

- Project: Shape Reference

## Code Style

- Use strict TypeScript
- Use named exports
- Use Vitest
- Follow Arrange, Act, Assert

## Commands

```
/review    - Review code quality
/test      - Run tests
/typecheck - Check types
```

## Reference

Keep generated instructions aligned with PromptScript source.

## Don'ts

- Don't expose secrets
- Don't skip required validation

## Examples

### Example: rename

Use a precise name

**Input:**

```
const x = loadUsers()
```

**Output:**

```
const users = loadUsers()
```

@CLAUDE.local.md
