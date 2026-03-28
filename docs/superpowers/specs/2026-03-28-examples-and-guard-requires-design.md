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
| **Cursor** | Markdown section in `.mdc` body (all versions: modern, multifile, legacy) |
| **Factory** | Markdown section `## Examples` in SKILL.md body |
| **Gemini** | Markdown section in `GEMINI.md` |
| **Antigravity** | Markdown section in `.agent/rules/project.md` (respects 12k char limit) |
| **Windsurf** | Markdown section in `.windsurf/rules/project.md` |
| **Trae, Kiro, Continue, Zencoder** | Markdown examples in body (frontmatter restricted to known fields) |
| **Remaining 25+ (MarkdownInstructionFormatter)** | Default Markdown `## Examples` section via shared `addCommonSections()` |

#### Skill-level examples

| Formatter | Format |
|-----------|--------|
| **Claude** | Appended in `.claude/skills/{name}/SKILL.md` |
| **GitHub Copilot** | Appended in `.github/skills/{name}/SKILL.md` |
| **Factory** | Appended in `.factory/skills/{name}/SKILL.md` |
| **Gemini** | Appended in `.gemini/skills/{name}/skill.md` |
| **Formatters without skills** (Cline, Roo, Mux, Neovate, Qoder, Cursor) | Inlined in main file |

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
  1. Local guards in the same `@guards` block (lookup by key name)
  2. Guards imported via `@use` (post-merge AST — searched by guard key name, not alias)
  3. Auto-resolve from registry (for refs like `@org/guards/api-validation` — requires constructing a `PathReference` from the string since `FileLoader.resolveRef()` takes `PathReference`, not plain strings)
- **Guard name resolution with aliases:** When `@use @org/guards as sg` is used, guard entries are merged into the local `@guards` block under their original key names. `requires: ["api-validation"]` resolves against the post-merge AST, so it finds the guard by its original name, not the import alias.
- **Cycle detection** — error if A requires B and B requires A. Uses `Set<string>` for visited guards to ensure O(1) dedup.
- **Semantics** — required guards are injected as context only; their `applyTo` globs do NOT activate

### AST Shape After Resolution

The resolver adds a synthetic `__resolvedRequires` property to each guard entry that has `requires`. This property contains the resolved dependency content:

```typescript
// After resolution, the guard entry in ObjectContent becomes:
{
  "api-controllers": {
    applyTo: ["**/*.controller.ts"],
    requires: ["api-validation", "api-security"],
    content: "Kontrolery API muszą...",
    __resolvedRequires: [
      { name: "api-validation", content: "Walidacja musi..." },
      { name: "api-security", content: "Bezpieczenstwo API..." }
    ]
  }
}
```

Formatters read `__resolvedRequires` to render the required context section. The `__` prefix follows the existing convention for synthetic/internal properties (e.g., `__import__`, `__source__`, `__blocks`).

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

1. Add `'examples'` to `BLOCK_TYPES` in `constants.ts` — this is the functional gate that drives `isBlockType()`, `RESERVED_WORDS`, and syntax version checks
2. Add `'examples'` to `BlockName` union in `ast.ts` for IDE autocomplete (the `| string` catch-all already accepts it at runtime). Also fix pre-existing desync: add missing `'workflows'`, `'prompts'`, `'commands'` to the explicit union
3. Add new syntax version `1.2.0` in `syntax-versions.ts` that includes `examples`. Also update `LATEST_SYNTAX_VERSION` constant. Required because the test at `syntax-versions.spec.ts:41` verifies all `BLOCK_TYPES` appear in the latest version
4. New interface in `ast.ts` — a helper extraction type (like `SkillDefinition`), NOT an AST node, does NOT extend `BaseNode`:
   ```typescript
   interface ExampleDefinition {
     input: string | TextContent;
     output: string | TextContent;
     description?: string;
   }
   ```
5. Update `SkillDefinition` interface to include `examples?: Record<string, ExampleDefinition>`. Note: `SkillDefinition.requires` (skill-level, "skills that must exist") is semantically different from guard `requires` (guard-to-guard dependencies) — same keyword, different contexts, no typed `GuardDefinition` interface exists
6. New `CircularGuardRequiresError` class extending `ResolveError` with its own `ErrorCode.CIRCULAR_GUARD_REQUIRES = 'PS2030'` (in the resolve error range 2xxx, next available after PS2025). Do NOT reuse `CircularDependencyError` — it hardcodes `ErrorCode.CIRCULAR_DEPENDENCY` (PS2002) in its constructor. The new class accepts `chain: string[]` and optional `location: SourceLocation`
7. Update JSON schema for `promptscript.yaml` — adding `guardRequiresDepth` to validation requires regenerating the schema (verified by `pnpm schema:check`)

### `packages/parser`

No changes needed. The generic `@Identifier { ... }` grammar already parses `@examples { name: { input: "...", output: "..." } }` and `requires: [...]` in guards. The visitor produces generic `Record<string, Value>` — formatters access properties via duck-typing on `Record<string, Value>` (e.g., `obj['input']`, `obj['output']`), consistent with how skills and guards are already handled. There are no "helper extraction functions" — this is just property access with type assertions.

**Implementation note:** Add parser test fixtures for both `@examples` blocks and `requires: [...]` inside guard entries to validate the "no changes needed" claim before proceeding with downstream work.

### `packages/validator`

1. **PS022: `circular-guard-requires`** — cycle detection in requires graph
2. **PS023: `valid-examples`** — validates each example has `input` and `output`. Must handle two paths: (a) top-level `@examples` blocks via `walkBlocks()`, and (b) `examples` properties nested inside `@skills` entries via manual property traversal of skills content
3. **PS024: `valid-guard-requires`** — validates referenced guards exist (local, imported, or registry)
4. PS019 (`unknown-block-name`) updates automatically — it uses `isBlockType()` which checks `BLOCK_TYPES`, so adding `examples` there is sufficient

**Strict mode:** The CLI's `--strict` flag promotes all warnings to errors globally. New rules use `defaultSeverity: 'warning'` and strict mode promotes them automatically — no per-rule strict logic needed. The earlier claim about "description required in strict mode" is dropped — `description` remains optional in all modes for simplicity.

**Note:** The validator README has pre-existing numbering discrepancies with source code. Reconcile during implementation.

### `packages/resolver`

1. **New module `guard-requires.ts`**:
   - Builds dependency graph from `requires` fields
   - Recursive resolution with configurable depth limit
   - Cycle detection (throws `CircularGuardRequiresError`)
   - Resolution order: local -> imports (@use) -> auto-resolve from registry
   - For local/imported guards: direct key lookup on the post-merge `@guards` ObjectContent (no need for `FileLoader.resolveRef()`)
   - For registry refs (e.g., `@org/guards/api-validation`): construct a `PathReference` and use `FileLoader.resolveRef()`
   - Injects `__resolvedRequires` synthetic property into guard entries
2. **Integration in `resolver.ts`** — insert after `applyExtends()` and before `resolveNativeSkills()` in the `doResolve()` pipeline (also before `resolveNativeCommands` and `resolveNativeAgents`)
3. **Extend `ResolverOptions`** (not `ResolverConfig` which does not exist) with `guardRequiresDepth: number`

### `packages/formatters`

Formatter architecture has two class hierarchies:
- **`BaseFormatter`** — extended directly by Claude, GitHub, Cursor (each has its own section pipeline via `addCommonSections()`)
- **`MarkdownInstructionFormatter`** (extends `BaseFormatter`) — shared base for ~20 formatters (Factory, OpenCode, Gemini, Windsurf, Cline, Roo, Codex, Continue, Augment, Goose, Kilo, Amp, Trae, Junie, Kiro, and Tier 3)

Changes:

1. **`BaseFormatter`** — new protected helper methods:
   - `extractExamples(ast)` — extracts top-level @examples
   - `extractSkillExamples(props)` — extracts examples from skill properties
2. **`MarkdownInstructionFormatter`** — add `examples(ast, renderer)` and `requiredContext(ast, renderer)` section methods (returning `string | null`, consistent with existing `project()`, `techStack()`, `codeStandards()` pattern). Wire them into `addCommonSections()` at `markdown-instruction-formatter.ts:499-516`
3. **Tier 0 formatters** (Claude, GitHub, Cursor) — add `examples()` and `requiredContext()` methods to each formatter's own `addCommonSections()` pipeline with platform-specific rendering
4. **Tier 1-3 formatters** — inherit from `MarkdownInstructionFormatter`, get the default rendering automatically

### `packages/cli`

Extend `promptscript.yaml` schema — add `guardRequiresDepth` under the existing `validation` section:
```yaml
validation:
  guardRequiresDepth: 3  # default 3
```

### Syntax Highlighters (keepInSync)

1. **Pygments** (`docs_extensions/promptscript_lexer.py`) — add `examples` to block keywords. Also fix pre-existing desyncs: add missing `commands`, `workflows`, `prompts`; separate `meta`/`extend` from block keywords into a directives pattern (they are control directives, not block types)
2. **VS Code TextMate** (`apps/vscode/syntaxes/promptscript.tmLanguage.json`) — no change needed, uses generic `@[a-zA-Z_][a-zA-Z0-9_-]*` pattern that matches all block names
3. **Playground Monaco** (`packages/playground/src/utils/prs-language.ts`) — `@examples` is already present. Fix pre-existing desync: remove extra keywords not in `BLOCK_TYPES` (`@guardrails`, `@tools`, `@output`, `@behavior`, `@memory`, `@project`); add missing ones (`@commands`, `@workflows`, `@prompts`, `@local`)

### Documentation

1. New guide `docs/guides/examples.md`
2. New guide `docs/guides/guard-dependencies.md`
3. Update `docs/reference/language.md` — add @examples block documentation. Also fix pre-existing incomplete block listing (missing @commands, @workflows, @prompts, @skills, @agents)
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
| `@examples` in parent (`@inherit`) | Merge: **child wins** for same-named entries (consistent with `inheritance.ts` which gives child priority: `result[key] = deepCloneValue(childVal)`), new names appended |
| `@examples` in `@use` with `only`/`exclude` | `only: ['examples']` imports only examples, `exclude: ['examples']` skips them |
| `@examples` via `@use` import | **Import (source) wins** for same-named entries (consistent with `imports.ts` where `result = { ...source }` and source is kept) |
| `@extend examples { new: {...} }` | Supported — extension system handles it via deep merge of ObjectContent. New examples are added, existing fields within an example are merged (not replaced atomically) |
| Partial field merge on same-named example | Individual fields (input, output, description) merge independently, not atomically. If child overrides only `output`, `input` comes from parent/import. This is a consequence of the existing deep-merge system |

### @requires

| Scenario | Behavior |
|----------|----------|
| Cycle: A -> B -> A | Error `CircularGuardRequiresError` with full cycle path |
| Depth limit exceeded | Warning with truncation info |
| Requires non-existent guard | Error PS024 with fuzzy match suggestion |
| Requires registry guard (`@org/guards/name`) | Auto-resolve; if not in registry — error PS024 |
| Guard requires itself | Special cycle case — `CircularGuardRequiresError` |
| Required guard has no content | Warning — guard exists but empty |
| Multiple guards require same guard | Deduplication — required guard rendered once (tracked via `Set<string>`) |
| `requires` on guard without `applyTo` | Allowed — guard can be a "context library" used only via requires |
| Same guard name from multiple `@use` imports | Post-merge AST used — import merge order determines which wins (last import's version) |
| `requires` with aliased imports (`@use X as alias`) | Resolved by original guard key name in post-merge AST, not by alias |
| `@extend guards.X { requires: ["new"] }` | Supported — array unique concatenation (new entries appended to existing requires list) |

### Merge Semantics for @examples

**Merge direction differs between `@inherit` and `@use`:**

- **`@inherit`** (from `inheritance.ts`): child (local file) wins for same-named entries. Parent blocks are spread first (`{ ...parent }`), then child entries override. This is standard OOP-like inheritance.
- **`@use`** (from `imports.ts`): source (import) wins for same-named entries. Source blocks are spread first (`{ ...source }`), then target (local) entries are iterated but source is kept for TextContent/primitives.
- New names: always appended in both cases
- Nested objects: deep merge with the winning side's priority at every leaf level

### Strict Mode Validation

The CLI `--strict` flag promotes all warnings to errors globally. New rules PS022, PS023, PS024 use `defaultSeverity: 'warning'` and are automatically promoted to errors in strict mode. No per-rule strict logic is needed.

## Numbering Systems

Two separate numbering systems are used in this spec:

- **Validator rule IDs** (PS0xx): `PS022`, `PS023`, `PS024` — used in `ValidationRule.id`, reported in validation output
- **ErrorCode constants** (PS2xxx): `PS2030` — used in thrown `ResolveError` subclasses during resolver execution

These are independent: the resolver throws `CircularGuardRequiresError` (PS2030) during resolution. The validator rule PS022 detects cycles independently during validation (which runs on the resolved AST). Both may report the same issue through different channels.
