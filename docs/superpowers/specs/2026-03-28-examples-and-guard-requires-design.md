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
  validation:
    guardRequiresDepth: 5
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
2. Add `'examples'` to `BlockName` union in `ast.ts` (keep explicit list in sync)
3. Add new syntax version entry (e.g., `1.2.0`) in `syntax-versions.ts` that includes `examples` — required because the existing test verifies all `BLOCK_TYPES` appear in the latest syntax version
4. New interfaces in `ast.ts`:
   ```typescript
   interface ExampleDefinition {
     input: string | TextContent;
     output: string | TextContent;
     description?: string;
   }
   ```
5. Update `SkillDefinition` interface to include `examples?: Record<string, ExampleDefinition>`
6. Reuse existing `CircularDependencyError` (from `errors/resolve.ts`) with a discriminant — it already accepts `chain: string[]` which is exactly what guard cycle detection needs. Add a new `ErrorCode` in the `2030+` range (e.g., `CIRCULAR_GUARD_REQUIRES = 'PS2030'`)

### `packages/parser`

No changes needed. The generic `@Identifier { ... }` grammar already parses `@examples { name: { input: "...", output: "..." } }` and `requires: [...]` in guards. The visitor produces generic `Record<string, Value>` — type narrowing to `ExampleDefinition` will use helper extraction functions in validators/formatters (same pattern as `SkillDefinition`).

### `packages/validator`

1. **PS022: `circular-guard-requires`** — cycle detection in requires graph
2. **PS023: `valid-examples`** — validates each example has `input` and `output`
3. **PS024: `valid-guard-requires`** — validates referenced guards exist (local, imported, or registry)
4. PS019 (`unknown-block-name`) updates automatically — it uses `isBlockType()` which checks `BLOCK_TYPES`, so adding `examples` there is sufficient

### `packages/resolver`

1. **New module `guard-requires.ts`**:
   - Builds dependency graph from `requires` fields
   - Recursive resolution with configurable depth limit
   - Cycle detection (throws `CircularGuardRequiresError`)
   - Resolution order: local -> imports (@use) -> auto-resolve from registry
2. **Integration in `resolver.ts`** — insert after `applyExtends()` and before `resolveNativeSkills()` in the `doResolve()` pipeline
3. **Extend `ResolverConfig`** with `guardRequiresDepth: number`

### `packages/formatters`

1. **`BaseFormatter`** — new methods:
   - `extractExamples(ast)` — extracts top-level @examples
   - `extractSkillExamples(props)` — extracts examples from skill properties
   - `renderExamples(examples)` — default Markdown renderer (overridable)
   - `renderRequiredContext(guards)` — default Markdown renderer (overridable)
   - Note: `resolveGuardRequires` stays in the resolver package — formatters receive already-resolved AST with required guard content injected into guard entries
2. **Tier 0 formatters** (Claude, GitHub, Cursor, Factory, Gemini, Antigravity, OpenCode) — override `renderExamples()` and `renderRequiredContext()` with platform-specific format
3. **Tier 1-3 formatters** — use BaseFormatter defaults

### `packages/cli`

Extend `promptscript.yaml` schema — add `guardRequiresDepth` under the existing `validation` section:
```yaml
validation:
  guardRequiresDepth: 3  # default 3
```

### Syntax Highlighters (keepInSync)

1. **Pygments** (`docs_extensions/promptscript_lexer.py`) — add `examples` to block keywords. Also fix pre-existing desync: add missing `commands`, `workflows`, `prompts` that are in `BLOCK_TYPES` but missing from Pygments
2. **VS Code TextMate** (`apps/vscode/syntaxes/promptscript.tmLanguage.json`) — no change needed, uses generic `@[a-zA-Z_][a-zA-Z0-9_-]*` pattern that matches all block names
3. **Playground Monaco** (`packages/playground/src/utils/prs-language.ts`) — no change needed, `@examples` is already present in the keyword list

### Documentation

1. New guide `docs/guides/examples.md`
2. New guide `docs/guides/guard-dependencies.md`
3. Update `docs/reference/language.md` — add @examples block documentation (note: `docs/reference/blocks.md` and `docs/reference/guards.md` do not exist; `language.md` is the language reference)
4. Update `mkdocs.yml` — new navigation entries

### Feature Matrix

Add two new `FeatureSpec` entries in `packages/formatters/src/feature-matrix.ts`:
1. `'examples'` — structured few-shot prompting examples (category: `content`)
2. `'guard-requires'` — guard dependency declarations (category: `targeting`)

## Edge Cases

### @examples

| Scenario | Behavior |
|----------|----------|
| Missing `input` or `output` | Validation error PS023 with location and suggestion |
| Empty `@examples {}` | Warning PS008 (existing `empty-block` rule) |
| Skill examples + top-level examples with same name | Both rendered — skill examples in skill file, top-level in main file. No conflict |
| Very long input/output | No limit — author's responsibility. Antigravity: warning if total > 12k |
| `@examples` in parent (`@inherit`) | Merge: parent's examples take precedence for same-named entries (consistent with existing merge semantics), new names appended |
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

**Important:** The existing `mergeProperties` in `imports.ts` gives priority to **source (import/parent)** for TextContent and primitive values. This means:
- For `@inherit`: parent's example wins if child defines one with the same name
- For `@use`: imported example wins over local one with the same name
- New names: appended
- Arrays (if used): unique concatenation
- Nested objects: deep merge with source priority

This matches the existing merge behavior for all other blocks. If "child wins" semantics are desired for `@examples` specifically, custom merge logic would need to be added — but for consistency, we follow the existing pattern where the source (import/parent) takes precedence.

### Strict Mode Validation

In strict mode (`prs validate --strict`):
- PS022, PS023, PS024 treated as errors (not warnings)
- Each example must have `description` (optional in normal mode)
