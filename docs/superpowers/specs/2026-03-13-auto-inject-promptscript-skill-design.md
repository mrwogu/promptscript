# Auto-inject PromptScript SKILL.md During Compilation

**Date:** 2026-03-13
**Status:** Approved

## Problem

Projects using PromptScript benefit from AI coding agents understanding `.prs` syntax. The promptscript SKILL.md teaches agents how to read, write, and troubleshoot `.prs` files. Currently, this skill must be manually copied into each project. Users often don't know it exists or forget to include it.

## Solution

The Compiler automatically injects the bundled `promptscript/SKILL.md` into compilation output, placed at each target's native skill path. Enabled by default, disabled via a config flag.

## Configuration

```yaml
# promptscript.yaml
includePromptScriptSkill: false # default: true (omit to enable)
```

A single top-level boolean on `PromptScriptConfig`. When omitted or `true`, the skill is injected. When explicitly `false`, it is skipped.

## Architecture

### Injection point

The Compiler, after formatters produce their outputs but before writing. This keeps formatters focused on AST formatting and centralizes the injection logic.

### Flow

```
CLI compile command
  1. Resolve SKILL.md path relative to CLI package install location
  2. Read SKILL.md content (warn and continue if file missing)
  3. Pass content to Compiler via CompilerOptions.skillContent
        |
        v
Compiler.compile()
  1. Resolve -> Validate -> Format (existing pipeline)
  2. If config.includePromptScriptSkill !== false AND skillContent provided:
     For each formatter:
       a. Query formatter for skill path via getSkillBasePath()
       b. If null (formatter has no skill support): skip
       c. Build path: `${skillBasePath}/promptscript/${skillFileName}`
       d. Check collision against outputPathOwners map
       e. If no collision: add as additional output
       f. If collision: emit PS4001 warning, skip (first-writer-wins)
  3. Return CompileResult with injected outputs included
```

### Skill path derivation from formatter metadata

Instead of a static map, skill paths are derived dynamically from each formatter's existing metadata. This avoids a maintenance burden (35+ targets) and handles edge cases automatically.

**MarkdownInstructionFormatter subclasses** (majority of formatters) already declare `dotDir` and `skillFileName` in their config. The base class exposes these via:

```typescript
// Added to Formatter interface
interface Formatter {
  // ... existing members ...
  /** Base path for skills, or null if formatter has no skill support */
  getSkillBasePath(): string | null;
  /** Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no support */
  getSkillFileName(): string | null;
}
```

**MarkdownInstructionFormatter** implements these by returning `${this.config.dotDir}/skills` and `this.config.skillFileName`.

**BaseFormatter** provides a default returning `null` for both (no skill support).

**Special formatters** (extend BaseFormatter directly) override as needed:

| Formatter   | `getSkillBasePath()` | `getSkillFileName()` | Notes                              |
| ----------- | -------------------- | -------------------- | ---------------------------------- |
| Claude      | `.claude/skills`     | `SKILL.md`           | Has skill support in full mode     |
| GitHub      | `.github/skills`     | `SKILL.md`           | Has skill support in full mode     |
| Cursor      | `null`               | `null`               | No skill support (uses .mdc files) |
| Antigravity | `null`               | `null`               | No skill support                   |

### Complete formatter inventory (37 targets)

Every formatter must be verified during implementation. The table below is the source of truth for expected injection paths.

**4 BaseFormatter subclasses** (require individual handling):

| #   | Formatter   | Base class    | `getSkillBasePath()` | `getSkillFileName()` | Injected path                          | Notes                              |
| --- | ----------- | ------------- | -------------------- | -------------------- | -------------------------------------- | ---------------------------------- |
| 1   | Claude      | BaseFormatter | `.claude/skills`     | `SKILL.md`           | `.claude/skills/promptscript/SKILL.md` | Override needed                    |
| 2   | GitHub      | BaseFormatter | `.github/skills`     | `SKILL.md`           | `.github/skills/promptscript/SKILL.md` | Override needed                    |
| 3   | Cursor      | BaseFormatter | `null`               | `null`               | _(skipped)_                            | No skill support (uses .mdc files) |
| 4   | Antigravity | BaseFormatter | `null`               | `null`               | _(skipped)_                            | No skill support                   |

**33 MarkdownInstructionFormatter subclasses** (handled automatically via `config.dotDir` + `config.skillFileName`):

| #   | Formatter   | `dotDir`       | `skillFileName` | Injected path                               | Notes                       |
| --- | ----------- | -------------- | --------------- | ------------------------------------------- | --------------------------- |
| 5   | Adal        | `.adal`        | `SKILL.md`      | `.adal/skills/promptscript/SKILL.md`        |                             |
| 6   | Amp         | `.agents`      | `SKILL.md`      | `.agents/skills/promptscript/SKILL.md`      | Shared dotDir with #12, #13 |
| 7   | Augment     | `.augment`     | `SKILL.md`      | `.augment/skills/promptscript/SKILL.md`     |                             |
| 8   | Cline       | `.agents`      | `SKILL.md`      | `.agents/skills/promptscript/SKILL.md`      | Shared dotDir with #6, #13  |
| 9   | CodeBuddy   | `.codebuddy`   | `SKILL.md`      | `.codebuddy/skills/promptscript/SKILL.md`   |                             |
| 10  | Codex       | `.agents`      | `SKILL.md`      | `.agents/skills/promptscript/SKILL.md`      | Shared dotDir with #6, #8   |
| 11  | CommandCode | `.commandcode` | `SKILL.md`      | `.commandcode/skills/promptscript/SKILL.md` |                             |
| 12  | Continue    | `.continue`    | `SKILL.md`      | `.continue/skills/promptscript/SKILL.md`    |                             |
| 13  | Cortex      | `.cortex`      | `SKILL.md`      | `.cortex/skills/promptscript/SKILL.md`      |                             |
| 14  | Crush       | `.crush`       | `SKILL.md`      | `.crush/skills/promptscript/SKILL.md`       |                             |
| 15  | Factory     | `.factory`     | `SKILL.md`      | `.factory/skills/promptscript/SKILL.md`     |                             |
| 16  | Gemini      | `.gemini`      | `skill.md`      | `.gemini/skills/promptscript/skill.md`      | Lowercase file name         |
| 17  | Goose       | `.goose`       | `SKILL.md`      | `.goose/skills/promptscript/SKILL.md`       |                             |
| 18  | Iflow       | `.iflow`       | `SKILL.md`      | `.iflow/skills/promptscript/SKILL.md`       |                             |
| 19  | Junie       | `.junie`       | `SKILL.md`      | `.junie/skills/promptscript/SKILL.md`       |                             |
| 20  | Kilo        | `.kilocode`    | `SKILL.md`      | `.kilocode/skills/promptscript/SKILL.md`    |                             |
| 21  | Kiro        | `.kiro`        | `SKILL.md`      | `.kiro/skills/promptscript/SKILL.md`        |                             |
| 22  | Kode        | `.kode`        | `SKILL.md`      | `.kode/skills/promptscript/SKILL.md`        |                             |
| 23  | McpJam      | `.mcpjam`      | `SKILL.md`      | `.mcpjam/skills/promptscript/SKILL.md`      |                             |
| 24  | MistralVibe | `.vibe`        | `SKILL.md`      | `.vibe/skills/promptscript/SKILL.md`        |                             |
| 25  | Mux         | `.mux`         | `SKILL.md`      | `.mux/skills/promptscript/SKILL.md`         |                             |
| 26  | Neovate     | `.neovate`     | `SKILL.md`      | `.neovate/skills/promptscript/SKILL.md`     |                             |
| 27  | OpenClaw    | `skills`       | `SKILL.md`      | `skills/skills/promptscript/SKILL.md`       | No dot prefix on dotDir     |
| 28  | OpenCode    | `.opencode`    | `SKILL.md`      | `.opencode/skills/promptscript/SKILL.md`    |                             |
| 29  | OpenHands   | `.openhands`   | `SKILL.md`      | `.openhands/skills/promptscript/SKILL.md`   |                             |
| 30  | Pi          | `.pi`          | `SKILL.md`      | `.pi/skills/promptscript/SKILL.md`          |                             |
| 31  | Pochi       | `.pochi`       | `SKILL.md`      | `.pochi/skills/promptscript/SKILL.md`       |                             |
| 32  | Qoder       | `.qoder`       | `SKILL.md`      | `.qoder/skills/promptscript/SKILL.md`       |                             |
| 33  | QwenCode    | `.qwen`        | `SKILL.md`      | `.qwen/skills/promptscript/SKILL.md`        |                             |
| 34  | Roo         | `.roo`         | `SKILL.md`      | `.roo/skills/promptscript/SKILL.md`         |                             |
| 35  | Trae        | `.trae`        | `SKILL.md`      | `.trae/skills/promptscript/SKILL.md`        |                             |
| 36  | Windsurf    | `.windsurf`    | `SKILL.md`      | `.windsurf/skills/promptscript/SKILL.md`    |                             |
| 37  | Zencoder    | `.zencoder`    | `SKILL.md`      | `.zencoder/skills/promptscript/SKILL.md`    |                             |

**Implementation change coverage:**

| Layer                          | Code change                                                  | Formatters covered      |
| ------------------------------ | ------------------------------------------------------------ | ----------------------- |
| `BaseFormatter`                | Default `getSkillBasePath()` / `getSkillFileName()` → `null` | Cursor, Antigravity (2) |
| `MarkdownInstructionFormatter` | Implement from `config.dotDir` / `config.skillFileName`      | 33 formatters           |
| `ClaudeFormatter`              | Override with `.claude/skills` / `SKILL.md`                  | 1                       |
| `GitHubFormatter`              | Override with `.github/skills` / `SKILL.md`                  | 1                       |
| **Total**                      | **4 code changes**                                           | **37 formatters**       |

**Verification requirement:** During implementation, each of the 37 formatters must be verified against this table to confirm the injected path is correct. Any new formatter added before implementation must also be added to this table.

### SKILL.md resolution

The CLI compile command resolves the file path using the CLI package's directory structure:

```
<cli-package-root>/skills/promptscript/SKILL.md
```

This keeps the skill in sync with the installed `prs` version. The Compiler receives only the content string — it stays filesystem-agnostic.

**Error handling:** If the file is missing (corrupted install, custom build), the CLI logs a warning and continues without skill injection. This is a convenience feature, not a hard requirement.

### PromptScript marker

The injected SKILL.md receives the standard PromptScript marker (`<!-- PromptScript TIMESTAMP -->`), same as all other compiler outputs. This allows the overwrite-protection logic to recognize and manage it on subsequent compilations.

### Collision handling

Uses the existing `outputPathOwners` collision detection (rule PS4001). If a user-defined skill already writes to the same path (e.g., a custom `promptscript` skill in their `.prs` files), the user's content wins. The Compiler emits a warning so the collision is visible.

## Files to modify

| Package    | File                                    | Change                                                                                                                                                                 |
| ---------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core       | `src/types/config.ts`                   | Add `includePromptScriptSkill?: boolean` to `PromptScriptConfig`                                                                                                       |
| root       | `schema/config.json`                    | Add field to JSON schema (auto-generated from types)                                                                                                                   |
| compiler   | `src/types.ts`                          | Add `skillContent?: string` to `CompilerOptions`; add `getSkillBasePath()` and `getSkillFileName()` to `Formatter` interface                                           |
| formatters | `src/types.ts`                          | Add `getSkillBasePath()` and `getSkillFileName()` to formatters `Formatter` interface (mirrors compiler's)                                                             |
| compiler   | `src/compiler.ts`                       | Add injection logic after formatting; update standalone `compile()` to propagate `skillContent` (`compileAll()` propagates automatically via `...this.options` spread) |
| formatters | `src/base-formatter.ts`                 | Default `getSkillBasePath()` and `getSkillFileName()` returning `null`                                                                                                 |
| formatters | `src/markdown-instruction-formatter.ts` | Implement `getSkillBasePath()` and `getSkillFileName()` from config                                                                                                    |
| formatters | `src/formatters/claude.ts`              | Override `getSkillBasePath()` → `.claude/skills`, `getSkillFileName()` → `SKILL.md`                                                                                    |
| formatters | `src/formatters/github.ts`              | Override `getSkillBasePath()` → `.github/skills`, `getSkillFileName()` → `SKILL.md`                                                                                    |
| cli        | `src/commands/compile.ts`               | Resolve and read SKILL.md, pass content via options, respect config flag                                                                                               |
| compiler   | `src/__tests__/compiler.spec.ts`        | Tests (see testing strategy below)                                                                                                                                     |

## What this does NOT change

- Formatter `format()` methods are not modified — they remain AST-focused
- The `skill:sync` / `skill:check` scripts remain for the promptscript monorepo's own internal needs
- Existing compilation behavior is preserved — this only adds outputs, never removes them

## Edge cases

1. **Formatter has no skill support** (Cursor, Antigravity) — `getSkillBasePath()` returns `null`, injection silently skipped for that target
2. **skillContent not provided** — injection silently skipped (backwards compatible with direct Compiler API usage)
3. **Multiple targets sharing dotDir** (cline + codex + amp all use `.agents`) — first target writes the skill, subsequent ones trigger collision warning and skip (existing behavior)
4. **User disables via config** — clean opt-out, no residual behavior
5. **Gemini lowercase skill.md** — handled automatically via `getSkillFileName()`
6. **Missing SKILL.md in CLI package** — CLI warns and continues, no injection
7. **Watch mode** — SKILL.md content is read once at startup; stale content possible if `prs` is upgraded mid-watch (acceptable trade-off, documented as expected behavior)
8. **Standalone `compile()` function** — updated to accept and propagate `skillContent` through `CompileOptions`

## Testing strategy

- Unit test: Compiler injects skill when `skillContent` provided and config allows
- Unit test: Compiler skips injection when `includePromptScriptSkill: false`
- Unit test: Compiler skips injection when `skillContent` not provided
- Unit test: Collision with user-defined skill emits warning and preserves user content
- Unit test: Correct paths generated per target type (including Gemini lowercase)
- Unit test: Formatters without skill support (returning null) are silently skipped
- Unit test: Shared dotDir targets produce collision warning on second target
- Unit test: `compileAll()` propagates `skillContent`
- Unit test: Standalone `compile()` function supports `skillContent`
