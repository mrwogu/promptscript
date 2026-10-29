# ScoredSection

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ScoredSection

Defined in: [importer/src/confidence.ts:7](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/importer/src/confidence.ts#L7)

## Extended by

- [`SourcedSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/SourcedSection/index.md)

## Properties

### confidence

> **confidence**: `number`

Defined in: [importer/src/confidence.ts:11](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/importer/src/confidence.ts#L11)

***

### content

> **content**: `string`

Defined in: [importer/src/confidence.ts:9](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/importer/src/confidence.ts#L9)

***

### heading

> **heading**: `string`

Defined in: [importer/src/confidence.ts:8](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/importer/src/confidence.ts#L8)

***

### level

> **level**: [`ConfidenceLevel`](https://getpromptscript.dev/api-reference/importer/src/enumerations/ConfidenceLevel/index.md)

Defined in: [importer/src/confidence.ts:12](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/importer/src/confidence.ts#L12)

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [importer/src/confidence.ts:14](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/importer/src/confidence.ts#L14)

Optional metadata propagated from parser.

***

### targetBlock

> **targetBlock**: `string`

Defined in: [importer/src/confidence.ts:10](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/importer/src/confidence.ts#L10)