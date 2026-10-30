# normalizeOutputPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeOutputPath()

> **normalizeOutputPath**(`path`): `string`

Defined in: [core/src/output-plan.ts:157](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/output-plan.ts#L157)

Normalize a project-relative output path.

Leading `./` and redundant separators are harmless and removed. Absolute
paths and parent traversal are rejected instead of being silently repaired.

## Parameters

### path

`string`

## Returns

`string`