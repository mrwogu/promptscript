# StandaloneFormatOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: StandaloneFormatOptions

Defined in: [formatters/src/standalone.ts:15](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/standalone.ts#L15)

Options for the standalone format function.

## Extends

- [`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

## Properties

### convention?

> `optional` **convention?**: `string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [formatters/src/types.ts:52](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L52)

Output convention to use.
Can be a built-in convention name ('xml', 'markdown') or a custom OutputConvention.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`convention`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#convention)

***

### formatter?

> `optional` **formatter?**: `string` \| [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md) \| [`FormatterFactory`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterFactory/index.md)

Defined in: [formatters/src/standalone.ts:24](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/standalone.ts#L24)

Formatter to use. Can be:
- A string name (e.g., 'github', 'claude', 'cursor')
- A Formatter instance
- A factory function that creates a Formatter

If not specified, 'github' is used as default.

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [formatters/src/types.ts:75](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L75)

Model catalog settings from promptscript.yaml, used to map agent models.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`models`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#models)

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: [formatters/src/types.ts:57](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L57)

Custom output path (overrides default).

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#outputpath)

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [formatters/src/types.ts:69](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L69)

Prettier formatting options for markdown output.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`prettier`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#prettier)

***

### provenance?

> `optional` **provenance?**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [formatters/src/types.ts:81](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L81)

Provenance of the resolved program. Only the prompt targets read it, and the compilers pass
it only to them, after rewriting every file so no machine path remains.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`provenance`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#provenance)

***

### targetConfig?

> `optional` **targetConfig?**: [`TargetConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetConfig/index.md)

Defined in: [formatters/src/types.ts:72](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L72)

Full target configuration, passed through from promptscript.yaml.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`targetConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#targetconfig)

***

### version?

> `optional` **version?**: `string`

Defined in: [formatters/src/types.ts:64](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L64)

Target version or format variant.
Use 'legacy' for deprecated formats (e.g., Cursor's .cursorrules).

#### Example

```ts
'legacy' | '1.0' | '2.0'
```

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`version`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#version)