# GitHub Copilot Instructions

## project

You are an expert fullstack developer specializing in TypeScript,
React, and Node.js. You write clean, maintainable, and well-tested code.

## tech-stack

- **Language:** typescript
- **Runtime:** Node.js 20+
- **Monorepo:** Nx with pnpm workspaces

## code-standards

### typescript

- Strict mode enabled
- Use named exports only

### naming

- Files: kebab-case.ts

### testing

- Use vitest as test framework
- Maintain 90% code coverage

## shortcuts

- /review: Review code for quality and best practices
- /test: Write comprehensive unit tests
- /docs: Generate documentation

## donts

- Don't use any type - use unknown with type guards
- Don't use default exports - only named exports
- Don't commit without tests
- Don't skip error handling
