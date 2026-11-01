# buildReferenceKey()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: buildReferenceKey()

> **buildReferenceKey**(`repoUrl`, `relativePath`, `version`): `string`

Defined in: [resolver/src/reference-hasher.ts:21](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/reference-hasher.ts#L21)

Build a lockfile key for a registry reference file.
Format: `<repoUrl>\0<relativePath>\0<version>`
Uses null byte separator consistent with MARKER_SEP in loader.ts.
This is the sole canonical key builder — used by both lock generation
and compile-time verification.

## Parameters

### repoUrl

`string`

### relativePath

`string`

### version

`string`

## Returns

`string`