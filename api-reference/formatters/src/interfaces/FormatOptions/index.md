# FormatOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatOptions

Defined in: [formatters/src/types.ts:43](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L43)

Options for formatting.

## Extended by

- [`StandaloneFormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/StandaloneFormatOptions/index.md)

## Properties

### convention?

> `optional` **convention?**: `string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [formatters/src/types.ts:48](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L48)

Output convention to use.
Can be a built-in convention name ('xml', 'markdown') or a custom OutputConvention.

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [formatters/src/types.ts:71](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L71)

Model catalog settings from promptscript.yaml, used to map agent models.

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: [formatters/src/types.ts:53](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L53)

Custom output path (overrides default).

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [formatters/src/types.ts:65](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L65)

Prettier formatting options for markdown output.

***

### targetConfig?

> `optional` **targetConfig?**: [`TargetConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetConfig/index.md)

Defined in: [formatters/src/types.ts:68](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L68)

Full target configuration, passed through from promptscript.yaml.

***

### version?

> `optional` **version?**: `string`

Defined in: [formatters/src/types.ts:60](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L60)

Target version or format variant.
Use 'legacy' for deprecated formats (e.g., Cursor's .cursorrules).

#### Example

```ts
'legacy' | '1.0' | '2.0'
```