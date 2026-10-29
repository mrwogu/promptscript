# hashContent()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: hashContent()

> **hashContent**(`content`): `string`

Defined in: [resolver/src/reference-hasher.ts:9](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/reference-hasher.ts#L9)

Compute SHA-256 hash of in-memory content.
Returns SRI-format string: "sha256-<hex>"

## Parameters

### content

`Buffer`

## Returns

`string`