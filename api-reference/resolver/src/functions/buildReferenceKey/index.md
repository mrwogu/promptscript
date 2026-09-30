# buildReferenceKey()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: buildReferenceKey()

> **buildReferenceKey**(`repoUrl`, `relativePath`, `version`): `string`

Defined in: [resolver/src/reference-hasher.ts:21](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/reference-hasher.ts#L21)

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