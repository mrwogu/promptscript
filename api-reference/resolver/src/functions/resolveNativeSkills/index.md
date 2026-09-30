# resolveNativeSkills()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveNativeSkills()

> **resolveNativeSkills**(`ast`, `registryPath`, `sourceFile`, `localPath?`, `options?`): `Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)\>

Defined in: [resolver/src/skills.ts:1934](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/skills.ts#L1934)

Resolve native SKILL.md files for skills defined in the AST.

For each skill in the

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

The resolved AST

### registryPath

`string`

Path to the registry

### sourceFile

`string`

The source file path (to determine relative skill location)

### localPath?

`string`

Optional path to local .promptscript directory

### options?

[`NativeSkillOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/NativeSkillOptions/index.md)

Optional skill resolution options

## Returns

`Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)\>

Updated AST with native skill content

## Skills

block, checks if a corresponding SKILL.md
file exists in the local skills directory, optionally in .agents/skills/,
or in the registry at @skills/<name>/SKILL.md. If found, the
skill's content is replaced with the native file content.