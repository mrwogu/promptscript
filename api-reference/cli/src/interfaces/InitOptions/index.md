# InitOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: InitOptions

Defined in: [cli/src/types.ts:4](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L4)

Options for the init command.

## Properties

### \_forceLlm?

> `optional` **\_forceLlm?**: `boolean`

Defined in: [cli/src/types.ts:37](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L37)

Internal: force LLM flow (used by prs migrate --llm)

***

### \_forceMigrate?

> `optional` **\_forceMigrate?**: `boolean`

Defined in: [cli/src/types.ts:35](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L35)

Internal: force migrate flow (used by prs migrate)

***

### \_migrateFiles?

> `optional` **\_migrateFiles?**: `string`[]

Defined in: [cli/src/types.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L39)

Internal: specific files to migrate (used by prs migrate --files)

***

### autoImport?

> `optional` **autoImport?**: `boolean`

Defined in: [cli/src/types.ts:24](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L24)

Non-interactive static import of detected files (--auto-import)

***

### backup?

> `optional` **backup?**: `boolean`

Defined in: [cli/src/types.ts:26](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L26)

Create backup before migration

***

### dryRun?

> `optional` **dryRun?**: `boolean`

Defined in: [cli/src/types.ts:28](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L28)

Preview planned files without writing

***

### force?

> `optional` **force?**: `boolean`

Defined in: [cli/src/types.ts:20](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L20)

Force reinitialize even if already initialized

***

### hooks?

> `optional` **hooks?**: `boolean`

Defined in: [cli/src/types.ts:33](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L33)

Install auto-compile hooks for selected targets.
Defaults to `true`; pass `--no-hooks` on the CLI to opt out.

***

### inherit?

> `optional` **inherit?**: `string`

Defined in: [cli/src/types.ts:10](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L10)

Inheritance path (e.g., @company/team)

***

### interactive?

> `optional` **interactive?**: `boolean`

Defined in: [cli/src/types.ts:16](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L16)

Interactive mode (prompts for all options)

***

### migrate?

> `optional` **migrate?**: `boolean`

Defined in: [cli/src/types.ts:22](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L22)

Install migration skill for AI-assisted migration

***

### name?

> `optional` **name?**: `string`

Defined in: [cli/src/types.ts:8](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L8)

Project name (overrides auto-detection)

***

### registry?

> `optional` **registry?**: `string`

Defined in: [cli/src/types.ts:12](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L12)

Registry path or URL

***

### targets?

> `optional` **targets?**: `string`[]

Defined in: [cli/src/types.ts:14](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L14)

Target AI tools

***

### team?

> `optional` **team?**: `string`

Defined in: [cli/src/types.ts:6](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L6)

Team namespace

***

### yes?

> `optional` **yes?**: `boolean`

Defined in: [cli/src/types.ts:18](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L18)

Skip prompts, use defaults