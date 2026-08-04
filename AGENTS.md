# AGENTS.md

<!-- PromptScript 2026-08-04T19:05:28.032Z | source: .promptscript/project.prs | target: factory - do not edit -->

## Project

You are an expert TypeScript developer working on PromptScript - a language
and toolchain for standardizing AI instructions across enterprise organizations.

PromptScript compiles `.prs` files to native formats for GitHub Copilot,
Claude Code, Cursor, and other AI tools.

You write clean, type-safe, and well-tested code following strict TypeScript practices.

## Tech Stack

typescript, Node.js 20+, Nx + pnpm

## Architecture

The project is organized as a monorepo with these packages:

```mermaid
flowchart TB
  subgraph packages
    core[core - Types, errors, utilities]
    parser[parser - Chevrotain-based parser]
    resolver[resolver - Inheritance & import resolution]
    validator[validator - AST validation rules]
    compiler[compiler - Pipeline orchestration]
    formatters[formatters - Output formatters]
    cli[cli - Command-line interface]
  end

  cli --> compiler
  cli --> resolver
  compiler --> resolver
  compiler --> validator
  compiler --> formatters
  resolver --> parser
  parser --> core
  resolver --> core
  validator --> core
  formatters --> core
```

## Context

### Key Libraries

- Parser: Chevrotain
- CLI: Commander.js
- Testing: Vitest
- Linting: ESLint + Prettier

- Project: PromptScript

## Engineering Standards

### Graph First

- Use code-review-graph MCP tools BEFORE Grep/Glob/Read when exploring the codebase
- Exploring code: use semantic_search_nodes or query_graph instead of Grep
- Understanding impact: use get_impact_radius instead of manually tracing imports
- Code review: use detect_changes + get_review_context instead of reading entire files
- Finding relationships: use query_graph with callers_of/callees_of/imports_of/tests_for
- Architecture questions: use get_architecture_overview + list_communities
- Fall back to Grep/Glob/Read only when the graph does not cover what you need

### TypeScript

- Strict mode enabled
- Never use `any` type - use `unknown` with type guards
- Use `unknown` with type guards instead of any
- Prefer `interface` for object shapes
- Use `type` for unions and intersections
- Named exports only, no default exports
- Explicit return types on public functions

### Naming Conventions

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Interfaces: `PascalCase`
- Functions: `camelCase`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Error Handling

- Use custom error classes extending `PSError`
- Always include location information
- Provide actionable error messages

### Testing

- Test files: `*.spec.ts` next to source
- Follow AAA (Arrange, Act, Assert) pattern
- Framework: Vitest
- Target >90% coverage for libraries
- Use fixtures for parser tests
- When refactoring formatter section methods (e.g. splitting context() into project() + techStack() + architecture()), add a test verifying that ALL input block content still appears in the output — not just the newly extracted subsections
- Golden files are snapshots of correct behavior, not correct by definition — before regenerating golden files, verify the diff represents an intentional change, not a regression that golden files would lock in

### Syntax Highlighting

- keepInSync: when adding or changing block keywords (e.g. @knowledge, @guards), always update ALL THREE syntax highlighters: (1) Pygments lexer: docs_extensions/promptscript_lexer.py, (2) VS Code TextMate grammar: apps/vscode/syntaxes/promptscript.tmLanguage.json, (3) Playground Monaco language: packages/playground/src/utils/prs-language.ts

### Workflow

- branchStrategy: gitflow — branch from main, never commit to main
- newTask: follow the new-task workflow: branch, atomic commits, full verification pipeline, push, PR, watch CI
- prMonitoring: use `gh pr checks --watch` to monitor CI status; do not consider work done until all checks pass
- verification: follow the verify workflow after any code change - all eight steps, in order

## Git Workflows

- Format: Conventional Commits
- Types: feat, fix, docs, style, refactor, test, chore
- Scope: always include package scope (core, parser, resolver, validator, compiler, formatters, cli, importer, playground, server, vscode) or domain scope (ci, docker) — scopes appear in the release changelog grouped by package
- Example: `feat(parser): add support for multiline strings`
- Reference: https://www.conventionalcommits.org/
- Max Subject Length: 70

## Configuration

- ESLint: inherit from eslint.base.config.cjs
- Vite root: \_\_dirname (not import.meta.dirname)

## Commands

```
/review    - Review code for quality, type safety, and best practices
/test      - Write unit tests using Vitest
/test-unit - Write unit tests following best practices
/test-integration - Write integration tests for component boundaries
/test-coverage - Analyze test coverage and suggest improvements
/test-e2e  - Write end-to-end tests for critical user journeys
/build     - Run full verification pipeline
/newpkg    - Generate new package with Nx
/quality   - Review code for quality improvements
/refactor  - Suggest refactoring opportunities
/security-review - Review code for security vulnerabilities
/threat-model - Analyze potential security threats
/cli       - Create CLI command handler
/export    - Design public API exports
/type      - Create TypeScript type definitions
```

```bash
pnpm install              # Install dependencies
pnpm nx build <pkg>       # Build package
pnpm nx test <pkg>        # Run tests
pnpm nx lint <pkg>        # Lint code
pnpm nx run-many -t test  # Test all packages
pnpm nx graph             # View dependency graph
pnpm prs compile          # Compile .prs files (uses local dev version)
```

## Post-Work Verification (MANDATORY)

After completing ANY code changes, run ALL steps in order:

```bash
pnpm run format           # 1. Format code with Prettier
pnpm run lint             # 2. Check for linting errors
pnpm run typecheck        # 3. Verify TypeScript types
pnpm run test             # 4. Run all tests
pnpm prs validate --strict  # 5. Validate .prs files
pnpm schema:check         # 6. Verify JSON schemas are current
pnpm skill:check          # 7. Verify SKILL.md copies are in sync
pnpm grammar:check        # 8. Verify TextMate grammar covers all tokens
```

## Documentation

- Review README.md and the affected pages under docs/ before changing behavior
- Update README.md and docs/ whenever behavior changes
- Keep documented code examples runnable and in sync with the API
- Sync With Code: after modifying any function, verify it is documented - if not, add documentation; if documented, ensure it reflects current behavior
- No Vaporware: never document features that don't exist or don't work - ideas and future plans go to ROADMAP.md only

## Diagrams

- Use Mermaid (exception: packages/\*/README.md must use ASCII art because npm does not render Mermaid) for diagrams
- Types: flowchart, sequence, class, state, ER, gantt, pie

## MCP Tools: code-review-graph

This project has a knowledge graph built with code-review-graph. The graph is faster,
cheaper (fewer tokens), and gives structural context (callers, dependents, test coverage)
that file scanning cannot.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes - gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review - token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

## Don'ts

- Don't use `any` type - use `unknown` with type guards
- Don't use default exports - only named exports
- Don't commit without tests
- Don't skip error handling
- Don't leave TODO without issue reference
- Don't create packages manually - use Nx generators (nx g @nx/js:lib)
- Don't create custom ESLint rules in package configs - extend base config
- Don't use `import.meta.dirname` in vite/vitest configs - use `\_\_dirname`
- Don't reference line numbers in test names or comments
- Don't make code changes without verifying documentation consistency
- Don't document features that don't exist or don't work - ideas go to ROADMAP.md
- Don't skip the full verification pipeline (format, lint, typecheck, test, validate, schema:check)
- Don't consider work complete until all CI checks pass (use `gh pr checks --watch`)
- Don't commit directly to main - always use feature branches
- Don't edit CHANGELOG.md manually - it is managed by release-please. Manual edits break release state tracking, preventing tag creation and GitHub releases.
- Don't regenerate golden files without reviewing the diff — golden files lock in whatever behavior produced them, including regressions

## Examples

### Example: scoped-commit

Commit subject: package scope is mandatory and drives the release changelog

**Input:**

```
Added support for primitive type annotations in typed block fields
```

**Output:**

```
fix(parser): accept primitive types in typed block fields
```

### Example: unscoped-commit-rejected

A subject without a scope, rewritten with the scope of the package it touches

**Input:**

```
feat: add terminal command hook event
```

**Output:**

```
feat(formatters): add terminal command hook event
```

### Example: unknown-narrowing

Narrow `unknown` with a type guard instead of reaching for `any`

**Input:**

```
function readId(value: any): string {
  return value.id;
}
```

**Output:**

```
function isIdentified(value: unknown): value is { id: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as { id: unknown }).id === 'string'
  );
}

export function readId(value: unknown): string {
  if (!isIdentified(value)) {
    throw new PSError('Expected an object with a string id');
  }
  return value.id;
}
```

### Example: named-export

Named exports only, with an explicit return type on the public function

**Input:**

```
export default function compile(ast) {
  return format(ast);
}
```

**Output:**

```
export function compile(ast: Program): CompileResult {
  return format(ast);
}
```
