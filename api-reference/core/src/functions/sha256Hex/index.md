# sha256Hex()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: sha256Hex()

> **sha256Hex**(`text`): `string`

Defined in: [core/src/utils/sha256.ts:33](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/utils/sha256.ts#L33)

SHA-256 of a string, as 64 lowercase hex characters.

The text is encoded as UTF-8 with `TextEncoder`, so a lone surrogate becomes U+FFFD.
Canonical JSON never holds one, because `canonicalizeJson` rejects lone surrogates. Pure TypeScript with no `node:crypto`, so it runs in the browser and
stays synchronous.

## Parameters

### text

`string`

Text to hash

## Returns

`string`

The digest in lowercase hex

## Example

```ts
sha256Hex('abc'); // 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
```