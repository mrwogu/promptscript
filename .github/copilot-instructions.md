# PromptScript - GitHub Copilot Instructions

> Auto-generated project instructions for AI-assisted development.

## Project

PromptScript is a language and toolchain for standardizing AI instructions across enterprise organizations. It compiles `.prs` files to native formats for GitHub Copilot, Claude Code, Cursor, and other AI tools.

## Tech Stack

- **Language:** TypeScript 5.x (strict mode)
- **Runtime:** Node.js 20+
- **Monorepo:** Nx with pnpm workspaces
- **Parser:** Chevrotain
- **CLI:** Commander.js
- **Testing:** Vitest
- **Linting:** ESLint + Prettier

## Architecture

```
packages/
├── core/              # Types, errors, utilities (zero deps)
├── parser/            # Chevrotain-based parser
├── resolver/          # Inheritance & import resolution
├── validator/         # AST validation rules
├── compiler/          # Pipeline orchestration
├── formatters/        # Output formatters (GitHub, Claude, Cursor)
└── cli/               # Command-line interface
```

## Code Standards

### TypeScript

- Strict mode enabled, no `any` types
- Use `unknown` with type guards instead of `any`
- Prefer `interface` for object shapes
- Use `type` for unions and intersections
- Named exports only (no default exports)
- Explicit return types on public functions

### Naming

- Files: `kebab-case.ts`
- Classes/Interfaces: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Error Handling

- Use custom error classes extending `PSError`
- Always include location information
- Provide actionable error messages

### Testing

- Test files: `*.spec.ts` next to source
- Follow AAA pattern (Arrange, Act, Assert)
- Target >90% coverage for libraries
- Use fixtures for parser tests

## Commands

```bash
# Development
pnpm install          # Install dependencies
pnpm nx build <pkg>        # Build package
pnpm nx test <pkg>         # Run tests
pnpm nx lint <pkg>         # Lint code
pnpm nx run-many -t test   # Test all packages
pnpm nx graph              # View dependency graph

# Generate new library
pnpm nx g @nx/js:lib <name> --directory=packages/<name> --publishable --importPath=@promptscript/<name> --bundler=swc --linter=eslint --unitTestRunner=vitest
```

## Git Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/) format
- Keep commit message subject line max 70 characters
- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat(parser): add support for multiline strings`

## Configuration Files

### ESLint

- All package ESLint configs must inherit from `eslint.base.config.cjs` in the root
- Package configs should use `createBaseConfig(__dirname)` from the base config
- Do not duplicate ESLint rules in package configs - modify the base config instead

### Vite/Vitest Config

- Use `__dirname` for the `root` option in both `vite.config.ts` and `vitest.config.mts`
- Do NOT use `import.meta.dirname` - it causes TypeScript errors with current tsconfig settings
- Example: `root: __dirname,`

## Don'ts

- Don't use `any` type
- Don't use default exports
- Don't commit without tests
- Don't skip error handling
- Don't leave TODO without issue reference
- Don't create new packages manually - always use Nx generators (`nx g @nx/js:lib`)
- Don't create custom ESLint rules in package configs - extend the base config
- Don't use `import.meta.dirname` in vite/vitest configs - use `__dirname` instead
- Don't use ASCII art diagrams - always use Mermaid diagrams instead

## Diagrams

- Always use **Mermaid** syntax for diagrams in documentation
- Supported diagram types: flowchart, sequence, class, state, ER, gantt, pie, etc.
- Wrap diagrams in markdown code blocks with `mermaid` language identifier
- Example:
  ```mermaid
  flowchart LR
    A[Input] --> B[Process] --> C[Output]
  ```
