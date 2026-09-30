# CLAUDE_VERSIONS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: CLAUDE\_VERSIONS

> `const` **CLAUDE\_VERSIONS**: `object`

Defined in: [formatters/src/formatters/claude.ts:27](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/claude.ts#L27)

Claude formatter version information.

## Type Declaration

### full

> `readonly` **full**: `object`

#### full.description

> `readonly` **description**: `"Multifile + skills (.claude/skills/) + agents (.claude/agents/) + commands (.claude/commands/) + local memory"` = `'Multifile + skills (.claude/skills/) + agents (.claude/agents/) + commands (.claude/commands/) + local memory'`

#### full.name

> `readonly` **name**: `"full"` = `'full'`

#### full.outputPath

> `readonly` **outputPath**: `"CLAUDE.md"` = `'CLAUDE.md'`

### multifile

> `readonly` **multifile**: `object`

#### multifile.description

> `readonly` **description**: `"Main + modular rules (.claude/rules/*.md) + commands (.claude/commands/*.md)"` = `'Main + modular rules (.claude/rules/*.md) + commands (.claude/commands/*.md)'`

#### multifile.name

> `readonly` **name**: `"multifile"` = `'multifile'`

#### multifile.outputPath

> `readonly` **outputPath**: `"CLAUDE.md"` = `'CLAUDE.md'`

### simple

> `readonly` **simple**: `object`

#### simple.description

> `readonly` **description**: `"Single file output (CLAUDE.md)"` = `'Single file output (CLAUDE.md)'`

#### simple.name

> `readonly` **name**: `"simple"` = `'simple'`

#### simple.outputPath

> `readonly` **outputPath**: `"CLAUDE.md"` = `'CLAUDE.md'`