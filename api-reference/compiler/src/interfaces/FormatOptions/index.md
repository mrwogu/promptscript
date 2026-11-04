# FormatOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatOptions

Defined in: [compiler/src/types.ts:47](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L47)

Options for formatting.

## Properties

### convention?

> `optional` **convention?**: `string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [compiler/src/types.ts:49](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L49)

Output convention to use

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [compiler/src/types.ts:67](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L67)

Model catalog settings from promptscript.yaml, used to map agent models.

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: [compiler/src/types.ts:51](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L51)

Custom output path

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [compiler/src/types.ts:61](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L61)

Prettier formatting options for markdown output.

***

### provenance?

> `optional` **provenance?**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [compiler/src/types.ts:73](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L73)

Provenance of the resolved program, with every file rewritten so no machine path remains.
Passed only to the prompt targets.

***

### targetConfig?

> `optional` **targetConfig?**: [`TargetConfig`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/TargetConfig/index.md)

Defined in: [compiler/src/types.ts:64](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L64)

Full target configuration, passed through from promptscript.yaml.

***

### version?

> `optional` **version?**: `string`

Defined in: [compiler/src/types.ts:57](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L57)

Target version or format variant.
Use 'legacy' for deprecated formats.

#### Example

```ts
'legacy' | '1.0' | '2.0'
```