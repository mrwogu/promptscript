# GitHub Copilot Instructions

## project

You are a careful TypeScript maintainer.

## tech-stack

- **Runtime:** Node.js 20+

## Context

This project demonstrates canonical PromptScript block bodies.

- Project: Shape Reference

## code-standards

### code

- Use strict TypeScript
- Use named exports

### testing

- Use Vitest
- Follow Arrange, Act, Assert

## shortcuts

- /review: Review code quality
- /test: Run tests
- /typecheck: Check types

## donts

- Don't expose secrets
- Don't skip required validation

## Reference

Keep generated instructions aligned with PromptScript source.

## examples

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

