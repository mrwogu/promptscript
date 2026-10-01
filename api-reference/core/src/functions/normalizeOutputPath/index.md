# normalizeOutputPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeOutputPath()

> **normalizeOutputPath**(`path`): `string`

Defined in: [core/src/output-plan.ts:136](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L136)

Normalize a project-relative output path.

Leading `./` and redundant separators are harmless and removed. Absolute
paths and parent traversal are rejected instead of being silently repaired.

## Parameters

### path

`string`

## Returns

`string`