# Design: @examples Block & @requires Guard Dependencies

**Date:** 2026-03-28
**Status:** Approved

## Overview

Two new features for PromptScript:

1. **`@examples` block** — structured few-shot prompting with input/output pairs
2. **`requires` directive in `@guards`** — dependency tree between guard instructions

## Feature 1: @examples (Structured Few-Shot Prompting)

### Problem

Examples are currently embedded inside `content: """ """` text blocks. AI models learn best from structured "Input -> Output" patterns (few-shot prompting), but the current format provides no semantic structure for formatters to optimize.

### Solution

A dedicated `@examples` block that compiles to platform-optimal formats.

### Syntax

#### Top-level @examples

```promptscript
@examples {
  crud-refactor: {
    description: "Refaktoryzacja do BaseCrudRepository"
    input: """
      class UserService {
        async findAll() {
          return db.query('SELECT * FROM users');
        }
      }
    """
    output: """
      class UserService extends BaseCrudRepository<User> {
        constructor() { super('users'); }
      }
    """
  }

  error-handling: {
    description: "Poprawna obsługa bledow API"
    input: "try { await api.call() } catch(e) { throw e }"
    output: "try { await api.call() } catch(e) { throw new ApiError(e.message, e.status) }"
  }
}
```

#### Examples in @skills

```promptscript
@skills {
  refactoring: {
    description: "Refaktoryzacja kodu do wzorcow projektowych"
    trigger: "Kiedy uzytkownik prosi o refaktoryzacje"
    examples: {
      singleton: {
        input: "class Logger { ... }"
        output: "class Logger { private static instance... }"
      }
    }
    content: """
      Zasady refaktoryzacji...
    """
  }
}
```

### Example Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `input` | yes | string / TextContent | Input data |
| `output` | yes | string / TextContent | Expected output |
| `description` | no | string | Example description |

### Rendering Strategies (per-formatter)

| Formatter | Format |
|-----------|--------|
| **Claude** | Markdown section `## Examples` with `### Example: name` + `**Input:**` / `**Output:**` blocks |
| **GitHub Copilot** | Markdown `### Example: name` + code blocks in `.instructions.md` |
| **Cursor** | Markdown section in `.mdc` body |
| **Factory** | Markdown section `## Examples` in SKILL.md body |
| **Gemini** | Markdown section in `GEMINI.md` |
| **Antigravity** | Markdown section in `.agent/rules/project.md` (respects 12k char limit) |
| **Windsurf** | Markdown section in `.windsurf/rules/project.md` |
| **Trae, Kiro, Continue, Zencoder** | Markdown examples in body (frontmatter restricted to known fields) |
| **Remaining 25+ (base formatter)** | Default Markdown `## Examples` section |

#### Skill-level examples

| Formatter | Format |
|-----------|--------|
| **Claude** | Appended in `.claude/skills/{name}/SKILL.md` |
| **GitHub Copilot** | Appended in `.github/skills/{name}/SKILL.md` |
| **Factory** | Appended in `.factory/skills/{name}/SKILL.md` |
| **Gemini** | Appended in `.gemini/skills/{name}/skill.md` |
| **Formatters without skills** (Cline, Roo, Mux, Neovate, Qoder) | Inlined in main file |

### Default Markdown Output

```markdown
## Examples

### Example: crud-refactor
Refaktoryzacja do BaseCrudRepository

**Input:**

\`\`\`
class UserService {
  async findAll() {
    return db.query('SELECT * FROM users');
  }
}
\`\`\`

**Output:**

\`\`\`
class UserService extends BaseCrudRepository<User> {
  constructor() { super('users'); }
}
\`\`\`
```

## Feature 2: @requires Guard Dependencies

### Problem

The `@guards` mechanism activates instructions based on `applyTo` file globs. When editing `user.controller.ts`, the agent gets controller rules but NOT validation or security rules — even though writing a controller requires knowing those rules.

### Solution

A `requires` field in guard entries that declares dependencies on other guards. When a guard activates, its required guards are pulled in as context.

### Syntax

```promptscript
@guards {
  "api-controllers": {
    applyTo: ["**/*.controller.ts"]
    requires: ["api-validation", "api-security"]
    content: """
      Kontrolery API muszą...
    """
  }

  "api-validation": {
    applyTo: ["**/*.validator.ts", "**/*.dto.ts"]
    content: """
      Walidacja musi uzywac class-validator...
    """
  }

  "api-security": {
    applyTo: ["**/*.guard.ts", "**/*.middleware.ts"]
    requires: ["api-validation"]
    content: """
      Bezpieczenstwo API...
    """
  }
}
```

### Resolution Behavior

- **Recursive with depth limit** — default 3 levels, configurable in `promptscript.yaml`:
  ```yaml
  guards:
    requiresDepth: 5
  ```
- **Resolution order:**
  1. Local guards in the same `@guards` block
  2. Guards imported via `@use`
  3. Auto-resolve from registry (for refs like `@org/guards/api-validation`)
- **Cycle detection** — error if A requires B and B requires A
- **Semantics** — required guards are injected as context only; their `applyTo` globs do NOT activate

### Rendering Strategies (per-formatter)

| Formatter | Format |
|-----------|--------|
| **Claude** | `## Required Context` section appended in `.claude/rules/{name}.md` |
| **GitHub Copilot** | Section appended in `.github/instructions/{name}.instructions.md` |
| **Cursor** | Section appended in `.cursor/rules/{name}.mdc` body |
| **Factory** | Dependency content added inline in SKILL.md body |
| **Antigravity** | Inline in `.agent/rules/project.md` (respects 12k char limit) |
| **Remaining** | Inline append in main file |

## Package Changes

### `packages/core`

1. Add `'examples'` to `BLOCK_TYPES` in `constants.ts`
2. New interfaces in `ast.ts`:
   ```typescript
   interface ExampleDefinition {
     input: string | TextContent;
     output: string | TextContent;
     description?: string;
   }

   interface GuardRequires {
     requires?: string[];
   }
   ```
3. New `CircularGuardRequiresError` extending `PSError`

### `packages/parser`

No changes needed. The generic `@Identifier { ... }` grammar already parses `@examples { name: { input: "...", output: "..." } }` and `requires: [...]` in guards.

### `packages/validator`

1. **PS022: `circular-guard-requires`** — cycle detection in requires graph
2. **PS023: `valid-examples`** — validates each example has `input` and `output`
3. **PS024: `valid-guard-requires`** — validates referenced guards exist (local, imported, or registry)
4. **Update PS019** (`unknown-block-name`) — add `examples` to known blocks

### `packages/resolver`

1. **New module `guard-requires.ts`**:
   - Builds dependency graph from `requires` fields
   - Recursive resolution with configurable depth limit
   - Cycle detection (throws `CircularGuardRequiresError`)
   - Resolution order: local -> imports (@use) -> auto-resolve from registry
2. **Integration in `resolver.ts`** — after @use and @extend, resolve requires on @guards block
3. **Extend `ResolverConfig`** with `guardRequiresDepth: number`

### `packages/formatters`

1. **`BaseFormatter`** — new methods:
   - `extractExamples(ast)` — extracts top-level @examples
   - `extractSkillExamples(props)` — extracts examples from skill properties
   - `renderExamples(examples)` — default Markdown renderer (overridable)
   - `resolveGuardRequires(guard, allGuards, depth)` — recursive graph resolution
   - `renderRequiredContext(guards)` — default Markdown renderer (overridable)
2. **Tier 0 formatters** (Claude, GitHub, Cursor, Factory, Gemini, Antigravity, OpenCode) — override `renderExamples()` and `renderRequiredContext()` with platform-specific format
3. **Tier 1-3 formatters** — use BaseFormatter defaults

### `packages/cli`

Extend `promptscript.yaml` schema:
```yaml
guards:
  requiresDepth: 3  # default 3
```

### Syntax Highlighters (keepInSync)

1. **Pygments** (`docs_extensions/promptscript_lexer.py`) — add `examples` to block keywords
2. **VS Code TextMate** (`apps/vscode/syntaxes/promptscript.tmLanguage.json`) — add `examples`
3. **Playground Monaco** (`packages/playground/src/utils/prs-language.ts`) — add `examples`

### Documentation

1. New guide `docs/guides/examples.md`
2. New guide `docs/guides/guard-dependencies.md`
3. Update `docs/reference/blocks.md` — add @examples
4. Update `docs/reference/guards.md` — add requires
5. Update `mkdocs.yml` — new navigation entries

## Edge Cases

### @examples

| Scenario | Behavior |
|----------|----------|
| Missing `input` or `output` | Validation error PS023 with location and suggestion |
| Empty `@examples {}` | Warning PS008 (existing `empty-block` rule) |
| Skill examples + top-level examples with same name | Both rendered — skill examples in skill file, top-level in main file. No conflict |
| Very long input/output | No limit — author's responsibility. Antigravity: warning if total > 12k |
| `@examples` in parent (`@inherit`) | Merge: child overrides same-named examples, appends new ones |
| `@examples` in `@use` with `only`/`exclude` | `only: ['examples']` imports only examples, `exclude: ['examples']` skips them |

### @requires

| Scenario | Behavior |
|----------|----------|
| Cycle: A -> B -> A | Validation error PS022 with full cycle path |
| Depth limit exceeded | Warning with truncation info |
| Requires non-existent guard | Error PS024 with fuzzy match suggestion |
| Requires registry guard (`@org/guards/name`) | Auto-resolve; if not in registry — error PS024 |
| Guard requires itself | Special cycle case — error PS022 |
| Required guard has no content | Warning — guard exists but empty |
| Multiple guards require same guard | Deduplication — required guard rendered once |
| `requires` on guard without `applyTo` | Allowed — guard can be a "context library" used only via requires |

### Merge Semantics for @examples

Consistent with existing `@use` and `@inherit` semantics:
- **ObjectContent**: deep merge, source (import/parent) first, child overrides
- Same names: child wins
- New names: appended

### Strict Mode Validation

In strict mode (`prs validate --strict`):
- PS022, PS023, PS024 treated as errors (not warnings)
- Each example must have `description` (optional in normal mode)
