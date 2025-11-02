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
├── formatter-github/  # GitHub Copilot output
├── formatter-claude/  # Claude Code output
├── formatter-cursor/  # Cursor output
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
nx build <pkg>        # Build package
nx test <pkg>         # Run tests
nx lint <pkg>         # Lint code
nx run-many -t test   # Test all packages
nx graph              # View dependency graph

# Generate new library
nx g @nx/js:lib <name> --directory=packages/<name> --publishable --importPath=@promptscript/<name>
```

## Working on Tasks

1. Read the relevant prompt from `.github/prompts/`
2. Follow the implementation order in `MAIN.prompt.md`
3. Run tests after each component: `nx test <package>`
4. Verify build works: `nx build <package>`
5. After each implementation phase, run all tests: `nx run-many -t test`

## Git Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/) format
- Keep commit message subject line max 70 characters
- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat(parser): add support for multiline strings`

## Don'ts

- Don't use `any` type
- Don't use default exports
- Don't commit without tests
- Don't skip error handling
- Don't leave TODO without issue reference
- Don't create new packages manually - always use Nx generators (`nx g @nx/js:lib`)
