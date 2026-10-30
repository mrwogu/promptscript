# resolveNativeCommands()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveNativeCommands()

> **resolveNativeCommands**(`ast`, `sourceFile`, `localPath?`, `options?`): `Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)\>

Defined in: [resolver/src/skills.ts:2314](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/skills.ts#L2314)

Auto-discover command .md files from local and universal directories
and inject them into the

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

The resolved AST

### sourceFile

`string`

The source file path

### localPath?

`string`

Path to local .promptscript directory

### options?

[`NativeSkillOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/NativeSkillOptions/index.md)

Skill resolution options (reuses universalDir and logger)

## Returns

`Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)\>

Updated AST with discovered commands

## Shortcuts

block.

Scans .promptscript/commands/ and optionally .agents/commands/ for .md files.
Each file becomes a shortcut entry with the filename as command name.
Explicitly declared shortcuts in .prs files take precedence.