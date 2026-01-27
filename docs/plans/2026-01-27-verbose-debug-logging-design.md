# Verbose & Debug Logging

**Date:** 2026-01-27
**Status:** Approved

## Problem

CLI has `--verbose` flag and `ConsoleOutput.verbose()`/`debug()` methods, but they are not used anywhere. Users cannot see what happens during compilation.

## Solution

Add a `Logger` interface that flows through the compilation pipeline. Each component logs its actions, and CLI decides what to display based on flags.

## Log Levels

| Level | Flag | Shows |
|-------|------|-------|
| Quiet | `--quiet` | Errors only |
| Normal | (default) | Result + stats |
| Verbose | `--verbose` | + pipeline stages, files, imports, per-stage timing |
| Debug | `--debug` | + AST nodes, tokens, validation details, cache hits |

## Logger Interface

Location: `@promptscript/core/src/logger.ts`

```typescript
/**
 * Logger interface for verbose/debug output during compilation.
 */
export interface Logger {
  /**
   * Log verbose message (shown with --verbose and --debug).
   */
  verbose(message: string): void;

  /**
   * Log debug message (shown only with --debug).
   */
  debug(message: string): void;
}

/**
 * No-op logger that discards all messages.
 */
export const noopLogger: Logger = {
  verbose: () => {},
  debug: () => {},
};
```

## Data Flow

```
CLI (--verbose/--debug flags)
  │
  ├─► Creates logger using ConsoleOutput
  │
  └─► Compiler({ logger })
        │
        ├─► Resolver({ logger })
        │     └─► logs: parsing, imports, inheritance, cache
        │
        ├─► Validator({ logger })
        │     └─► logs: rules, results
        │
        └─► Formatters (via format options)
              └─► logs: target, output path, timing
```

## Example Output

### Verbose (`prs compile --verbose`)

```
[verbose] Loading configuration from promptscript.yaml
[verbose] Entry: .promptscript/project.prs
[verbose] Targets: github, claude, cursor

[verbose] === Stage 1: Resolve ===
[verbose] Parsing .promptscript/project.prs
[verbose] Resolving import: @company/standards
[verbose]   → registry/company/standards/project.prs
[verbose] Resolving inherit: @frontend/base
[verbose]   → registry/frontend/base/project.prs
[verbose] Merging 3 AST nodes
[verbose] Resolve completed (45ms)

[verbose] === Stage 2: Validate ===
[verbose] Running 12 validation rules
[verbose] Validate completed (8ms)

[verbose] === Stage 3: Format ===
[verbose] Formatting for github
[verbose]   → .github/copilot-instructions.md (42ms)
[verbose] Formatting for claude
[verbose]   → CLAUDE.md (35ms)
[verbose] Formatting for cursor
[verbose]   → .cursor/rules/project.mdc (104ms)
[verbose] Format completed (181ms)

✔ Compilation successful

  ✓ .github/copilot-instructions.md
  ✓ CLAUDE.md
  ✓ .cursor/rules/project.mdc

Stats: 234ms (resolve: 45ms, validate: 8ms, format: 181ms)
```

### Debug (`prs compile --debug`)

Shows everything from verbose, plus:

```
[debug] Tokenizing .promptscript/project.prs
[debug]   127 tokens produced
[debug] Building AST
[debug]   Document { children: 5 }
[debug]   Meta { id: "my-project", version: "1.0" }
[debug]   Section "principles" { items: 3 }
[debug] Cache lookup: @company/standards
[debug]   Cache miss, resolving...
[debug] Cache store: @company/standards (ttl: 5min)
[debug] Validator rule "meta-required"
[debug]   Checking node Document at line 1
[debug]   Result: pass
[debug] Validator rule "no-empty-blocks"
[debug]   Checking node Section at line 15
[debug]   Result: pass
[debug] Formatter "github" initialized
[debug]   Convention: default
[debug]   Output path: .github/copilot-instructions.md
```

## Implementation Plan

### Phase 1: Core Infrastructure

1. **@promptscript/core** - Add Logger interface
   - Create `src/logger.ts` with `Logger` interface and `noopLogger`
   - Export from `src/index.ts`

2. **@promptscript/cli** - Add --debug flag and LogLevel.Debug
   - Update `src/output/console.ts` - add `LogLevel.Debug`
   - Update `src/cli.ts` - add `--debug` option

### Phase 2: Compiler Integration

3. **@promptscript/compiler** - Accept and use logger
   - Add `logger?: Logger` to `CompilerOptions`
   - Log stage transitions and timing in `compiler.ts`

4. **@promptscript/resolver** - Accept and use logger
   - Add `logger?: Logger` to `ResolverOptions`
   - Log file parsing, import resolution, inheritance in `resolver.ts`

5. **@promptscript/validator** - Accept and use logger
   - Add `logger?: Logger` to `ValidatorConfig`
   - Log rule execution in `validator.ts`

### Phase 3: CLI Wiring

6. **@promptscript/cli** - Create and pass logger
   - Update `src/commands/compile.ts` to create logger from ConsoleOutput
   - Pass logger to Compiler

### Files to Modify

| Package | File | Change |
|---------|------|--------|
| core | `src/logger.ts` | **New** - Logger interface |
| core | `src/index.ts` | Export Logger |
| cli | `src/output/console.ts` | Add `LogLevel.Debug`, update `isDebug()` |
| cli | `src/cli.ts` | Add `--debug` option |
| compiler | `src/types.ts` | Add `logger?: Logger` to CompilerOptions |
| compiler | `src/compiler.ts` | Log stage transitions |
| resolver | `src/types.ts` | Add `logger?: Logger` to ResolverOptions |
| resolver | `src/resolver.ts` | Log parsing, imports, inheritance |
| validator | `src/types.ts` | Add `logger?: Logger` to ValidatorConfig |
| validator | `src/validator.ts` | Log rule execution |
| cli | `src/commands/compile.ts` | Create logger, pass to Compiler |

### Tests

- Unit tests for Logger interface (noopLogger doesn't throw)
- Integration test: compile with verbose logger, verify messages
- Integration test: compile with debug logger, verify additional messages

## Environment Variables

In addition to flags, support environment variables:

- `PROMPTSCRIPT_VERBOSE=1` - Enable verbose (existing)
- `PROMPTSCRIPT_DEBUG=1` - Enable debug (new)

## Non-Goals

- JSON format output (deferred)
- Log file output (not planned)
- Log level configuration in promptscript.yaml (not planned)
