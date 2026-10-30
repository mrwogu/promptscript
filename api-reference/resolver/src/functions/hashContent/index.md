# hashContent()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: hashContent()

> **hashContent**(`content`): `string`

Defined in: [resolver/src/reference-hasher.ts:9](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/reference-hasher.ts#L9)

Compute SHA-256 hash of in-memory content.
Returns SRI-format string: "sha256-<hex>"

## Parameters

### content

`Buffer`

## Returns

`string`