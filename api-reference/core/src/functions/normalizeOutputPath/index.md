# normalizeOutputPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeOutputPath()

> **normalizeOutputPath**(`path`): `string`

Defined in: [core/src/output-plan.ts:157](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/output-plan.ts#L157)

Normalize a project-relative output path.

Leading `./` and redundant separators are harmless and removed. Absolute
paths and parent traversal are rejected instead of being silently repaired.

## Parameters

### path

`string`

## Returns

`string`