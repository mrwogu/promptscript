# normalizeOutputPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeOutputPath()

> **normalizeOutputPath**(`path`): `string`

Defined in: [core/src/output-plan.ts:157](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/output-plan.ts#L157)

Normalize a project-relative output path.

Leading `./` and redundant separators are harmless and removed. Absolute
paths and parent traversal are rejected instead of being silently repaired.

## Parameters

### path

`string`

## Returns

`string`