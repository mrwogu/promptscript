# hashContent()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: hashContent()

> **hashContent**(`content`): `string`

Defined in: [resolver/src/reference-hasher.ts:9](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/reference-hasher.ts#L9)

Compute SHA-256 hash of in-memory content.
Returns SRI-format string: "sha256-<hex>"

## Parameters

### content

`Buffer`

## Returns

`string`