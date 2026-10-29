# NormalizeProvenanceOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: NormalizeProvenanceOptions

Defined in: [core/src/provenance-files.ts:10](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/provenance-files.ts#L10)

Options of [normalizeProvenanceFiles](https://getpromptscript.dev/api-reference/core/src/functions/normalizeProvenanceFiles/index.md).

## Properties

### realpath?

> `optional` **realpath?**: (`path`) => `string`

Defined in: [core/src/provenance-files.ts:15](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/provenance-files.ts#L15)

Resolves symbolic links of an absolute path. Left out where there is no file system
(the browser compiler). A throwing resolver leaves the path as it is.

#### Parameters

##### path

`string`

#### Returns

`string`