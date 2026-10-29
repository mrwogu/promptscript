# FormatOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatOptions

Defined in: [formatters/src/types.ts:47](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L47)

Options for formatting.

## Extended by

- [`StandaloneFormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/StandaloneFormatOptions/index.md)

## Properties

### convention?

> `optional` **convention?**: `string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [formatters/src/types.ts:52](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L52)

Output convention to use.
Can be a built-in convention name ('xml', 'markdown') or a custom OutputConvention.

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [formatters/src/types.ts:75](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L75)

Model catalog settings from promptscript.yaml, used to map agent models.

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: [formatters/src/types.ts:57](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L57)

Custom output path (overrides default).

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [formatters/src/types.ts:69](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L69)

Prettier formatting options for markdown output.

***

### provenance?

> `optional` **provenance?**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [formatters/src/types.ts:81](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L81)

Provenance of the resolved program. Only the prompt targets read it, and the compilers pass
it only to them, after rewriting every file so no machine path remains.

***

### targetConfig?

> `optional` **targetConfig?**: [`TargetConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetConfig/index.md)

Defined in: [formatters/src/types.ts:72](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L72)

Full target configuration, passed through from promptscript.yaml.

***

### version?

> `optional` **version?**: `string`

Defined in: [formatters/src/types.ts:64](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L64)

Target version or format variant.
Use 'legacy' for deprecated formats (e.g., Cursor's .cursorrules).

#### Example

```ts
'legacy' | '1.0' | '2.0'
```