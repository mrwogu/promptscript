# hashPromptBundle()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: hashPromptBundle()

> **hashPromptBundle**(`bundle`): `string`

Defined in: [core/src/prompt-bundle-hash.ts:26](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/prompt-bundle-hash.ts#L26)

Content hash of a prompt bundle.

SHA-256 over the RFC 8785 canonical JSON of every field except `contentHash` and
`provenance`, written as `sha256-` plus 64 lowercase hex characters. `$schema` stays in the
input, so it works as the version tag of the hash.

## Parameters

### bundle

`object`

A bundle object, with or without `contentHash`

## Returns

`string`

The hash a bundle with this content must carry

## Throws

when the bundle holds a value JSON cannot carry, such as a non-finite number

## Example

```ts
const hash = hashPromptBundle(JSON.parse(text));
if (hash !== bundle.contentHash) throw new Error('hash mismatch');
```