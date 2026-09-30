# HookDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: HookDefinition

Defined in: [formatters/src/hook-adapters.ts:51](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L51)

A parsed hook definition from the

## Hooks

block.

## Properties

### command?

> `optional` **command?**: `string`[]

Defined in: [formatters/src/hook-adapters.ts:59](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L59)

Command arguments (non-empty array).

***

### continueOnFailure?

> `optional` **continueOnFailure?**: `boolean`

Defined in: [formatters/src/hook-adapters.ts:69](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L69)

Whether to continue if the hook fails.

***

### cwd?

> `optional` **cwd?**: `string`

Defined in: [formatters/src/hook-adapters.ts:63](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L63)

Project-root or project-relative working directory.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [formatters/src/hook-adapters.ts:71](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L71)

Whether the hook is enabled.

***

### event

> **event**: [`PortableHookEvent`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/PortableHookEvent/index.md)

Defined in: [formatters/src/hook-adapters.ts:55](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L55)

Portable event name.

***

### id

> **id**: `string`

Defined in: [formatters/src/hook-adapters.ts:53](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L53)

Stable hook ID (from object key).

***

### matcher?

> `optional` **matcher?**: `string`

Defined in: [formatters/src/hook-adapters.ts:57](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L57)

Tool name matcher pattern (optional).

***

### script?

> `optional` **script?**: [`HookScriptDefinition`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookScriptDefinition/index.md)

Defined in: [formatters/src/hook-adapters.ts:61](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L61)

Portable repository-local script.

***

### statusMessage?

> `optional` **statusMessage?**: `string`

Defined in: [formatters/src/hook-adapters.ts:67](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L67)

Status message shown during execution.

***

### targets?

> `optional` **targets?**: `Partial`\<`Record`\<[`HookTarget`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/HookTarget/index.md), [`HookTargetOverride`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookTargetOverride/index.md)\>\>

Defined in: [formatters/src/hook-adapters.ts:73](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L73)

Target-specific overrides merged on top of the portable definition.

***

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [formatters/src/hook-adapters.ts:65](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L65)

Timeout in milliseconds.