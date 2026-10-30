# NormalizeProvenanceOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: NormalizeProvenanceOptions

Defined in: [core/src/provenance-files.ts:10](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/provenance-files.ts#L10)

Options of [normalizeProvenanceFiles](https://getpromptscript.dev/api-reference/core/src/functions/normalizeProvenanceFiles/index.md).

## Properties

### realpath?

> `optional` **realpath?**: (`path`) => `string`

Defined in: [core/src/provenance-files.ts:15](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/provenance-files.ts#L15)

Resolves symbolic links of an absolute path. Left out where there is no file system
(the browser compiler). A throwing resolver leaves the path as it is.

#### Parameters

##### path

`string`

#### Returns

`string`