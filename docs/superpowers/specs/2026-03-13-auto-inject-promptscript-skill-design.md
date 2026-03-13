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
  2. Read SKILL.md content
  3. Pass content to Compiler via CompilerOptions.skillContent
        |
        v
Compiler.compile()
  1. Resolve -> Validate -> Format (existing pipeline)
  2. If config.includePromptScriptSkill !== false AND skillContent provided:
     For each formatter output:
       a. Look up target name in SKILL_PATH_MAP to get skill directory
       b. Build path: `${skillDir}/promptscript/SKILL.md`
       c. Check collision against outputPathOwners map
       d. If no collision: add as additional output
       e. If collision: emit PS4001 warning, skip (first-writer-wins)
  3. Return CompileResult with injected outputs included
```

### Skill path mapping

A static map in the Compiler maps target names to their native skill directory:

```typescript
const SKILL_PATH_MAP: Record<string, string> = {
  claude: '.claude/skills',
  github: '.github/skills',
  cursor: '.cursor/skills',
  windsurf: '.windsurf/skills',
  factory: '.factory/skills',
  // ... other targets follow their conventions
};
```

Targets not in the map do not receive the injected skill (no reasonable default path).

### SKILL.md resolution

The CLI compile command resolves the file path using the CLI package's directory structure:

```
<cli-package-root>/skills/promptscript/SKILL.md
```

This keeps the skill in sync with the installed `prs` version. The Compiler receives only the content string — it stays filesystem-agnostic.

### Collision handling

Uses the existing `outputPathOwners` collision detection (rule PS4001). If a user-defined skill already writes to the same path (e.g., a custom `promptscript` skill in their `.prs` files), the user's content wins. The Compiler emits a warning so the collision is visible.

## Files to modify

| Package  | File                             | Change                                                                           |
| -------- | -------------------------------- | -------------------------------------------------------------------------------- |
| core     | `src/types/config.ts`            | Add `includePromptScriptSkill?: boolean` to `PromptScriptConfig`                 |
| core     | `schema/config.json`             | Add field to JSON schema                                                         |
| compiler | `src/types.ts`                   | Add `skillContent?: string` to `CompilerOptions`                                 |
| compiler | `src/compiler.ts`                | Add `SKILL_PATH_MAP`, injection logic after formatting, before output collection |
| cli      | `src/commands/compile.ts`        | Resolve and read SKILL.md, pass content via options, respect config flag         |
| compiler | `src/__tests__/compiler.spec.ts` | Test: injection works, opt-out works, collision warns and skips                  |

## What this does NOT change

- Formatters are not modified — they remain AST-focused
- The `skill:sync` / `skill:check` scripts remain for the promptscript monorepo's own internal needs
- Existing compilation behavior is preserved — this only adds outputs, never removes them
- The SKILL.md content itself is not modified during injection (no markers added to skill files)

## Edge cases

1. **Target not in SKILL_PATH_MAP** — skill is not injected for that target; no warning needed
2. **skillContent not provided** — injection silently skipped (backwards compatible with direct Compiler API usage)
3. **Multiple targets in same compile** — each gets its own copy at its native path; collision detection handles overlap if two targets share a path
4. **User disables via config** — clean opt-out, no residual behavior

## Testing strategy

- Unit test: Compiler injects skill when `skillContent` provided and config allows
- Unit test: Compiler skips injection when `includePromptScriptSkill: false`
- Unit test: Compiler skips injection when `skillContent` not provided
- Unit test: Collision with user-defined skill emits warning and preserves user content
- Unit test: Correct paths generated per target type
