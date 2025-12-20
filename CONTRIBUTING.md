# Contributing to PromptScript

First off, thank you for considering contributing to PromptScript! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Git

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/mrwogu/promptscript.git
cd promptscript

# Install dependencies
pnpm install

# Verify setup
nx run-many -t test
```

### Project Structure

```
promptscript/
├── packages/
│   ├── core/           # Types, errors, utilities
│   ├── parser/         # PromptScript parser
│   ├── resolver/       # Inheritance resolution
│   ├── validator/      # Validation rules
│   ├── compiler/       # Compilation pipeline
│   ├── formatters/     # Output formatters (GitHub, Claude, Cursor, etc.)
│   └── cli/            # CLI application
├── docs/               # Documentation
└── examples/           # Example projects
```

## Development Workflow

### Running CLI Locally

During development, you can run the CLI without building:

```bash
# Using pnpm script (recommended)
pnpm prs --help
pnpm prs init
pnpm prs compile

# Or directly with node
node -r @swc-node/register packages/cli/src/cli.ts --help
```

This uses `@swc-node/register` to transpile TypeScript on-the-fly, so changes are reflected immediately without rebuilding.

### Initializing PromptScript in the Repository

To use PromptScript in this repository itself:

```bash
pnpm prs init
```

This creates:

- `promptscript.config.yaml` - project configuration
- `.promptscript/project.prs` - AI instructions file

### Creating a Feature

1. Create a branch from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes following our [coding standards](#coding-standards)

3. Write/update tests

4. Run checks:

   ```bash
   nx affected -t test
   nx affected -t lint
   nx affected -t build
   ```

5. Commit using conventional commits:
   ```bash
   git commit -m "feat(parser): add support for multiline strings"
   ```

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code change that neither fixes nor adds
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Scope should be the package name: `feat(parser):`, `fix(cli):`, etc.

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all checks pass
4. Fill out the PR template completely
5. Request review from maintainers

### PR Title Format

```
<type>(<scope>): <description>

Examples:
feat(parser): add support for @extend syntax
fix(cli): handle missing config file gracefully
docs(readme): update installation instructions
```

## Coding Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` with type guards)
- Named exports only
- Explicit return types on public functions

```typescript
// ✅ Good
export function parseVersion(input: string): SemVer {
  // ...
}

// ❌ Bad
export default function (input) {
  // ...
}
```

### File Naming

- Files: `kebab-case.ts`
- Test files: `kebab-case.spec.ts`
- Interfaces: `PascalCase`

### Documentation

- TSDoc on all public exports
- Examples in documentation

````typescript
/**
 * Parses a PromptScript path reference.
 *
 * @param path - The path string (e.g., "@core/guards/compliance@1.0.0")
 * @returns Parsed path object
 * @throws {ParseError} If path format is invalid
 *
 * @example
 * ```typescript
 * const parsed = parsePath('@core/org');
 * // { namespace: 'core', segments: ['org'], version: undefined }
 * ```
 */
export function parsePath(path: string): ParsedPath {
  // ...
}
````

## Testing

### Running Tests

```bash
# All tests
nx run-many -t test

# Specific package
nx test parser

# With coverage
nx test parser --coverage

# Watch mode
nx test parser --watch
```

### Testing CLI End-to-End

```bash
# Run CLI in development mode
pnpm prs init
pnpm prs validate
pnpm prs compile --dry-run
```

### Writing Tests

- Use Vitest
- Follow AAA pattern (Arrange, Act, Assert)
- > 90% coverage for library packages

```typescript
describe('parseVersion', () => {
  it('should parse valid version', () => {
    // Arrange
    const input = '1.2.3';

    // Act
    const result = parseVersion(input);

    // Assert
    expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('should throw on invalid version', () => {
    expect(() => parseVersion('invalid')).toThrow(ParseError);
  });
});
```

## Documentation

- Update README.md when adding features
- Add JSDoc comments to public APIs
- Include examples for complex functionality
- Update CHANGELOG.md following Keep a Changelog format

## Publishing (Maintainers Only)

### Testing Publish Locally

Before publishing, you can test the build output:

```bash
# Build all packages
pnpm nx run-many -t build

# Check what would be published
cd dist/packages/cli
pnpm pack --dry-run
```

### Release Process

Releases are automated via GitHub Actions using Nx Release:

```bash
# Create a release (locally)
pnpm nx release --skip-publish

# Push the release commit and tags
git push && git push --tags
```

The CI pipeline will automatically publish to npm when tags are pushed.

### Workspace Dependencies

Internal dependencies use `workspace:^` protocol which pnpm automatically converts to actual version numbers (e.g., `^0.1.0`) during publish.

## Questions?

Feel free to open an issue with the `question` label.

Thank you for contributing! 🙏
