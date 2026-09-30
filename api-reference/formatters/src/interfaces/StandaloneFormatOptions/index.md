# StandaloneFormatOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: StandaloneFormatOptions

Defined in: [formatters/src/standalone.ts:15](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/standalone.ts#L15)

Options for the standalone format function.

## Extends

- [`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

## Properties

### convention?

> `optional` **convention?**: `string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [formatters/src/types.ts:48](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L48)

Output convention to use.
Can be a built-in convention name ('xml', 'markdown') or a custom OutputConvention.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`convention`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#convention)

***

### formatter?

> `optional` **formatter?**: `string` \| [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md) \| [`FormatterFactory`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterFactory/index.md)

Defined in: [formatters/src/standalone.ts:24](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/standalone.ts#L24)

Formatter to use. Can be:
- A string name (e.g., 'github', 'claude', 'cursor')
- A Formatter instance
- A factory function that creates a Formatter

If not specified, 'github' is used as default.

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [formatters/src/types.ts:71](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L71)

Model catalog settings from promptscript.yaml, used to map agent models.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`models`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#models)

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: [formatters/src/types.ts:53](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L53)

Custom output path (overrides default).

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#outputpath)

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [formatters/src/types.ts:65](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L65)

Prettier formatting options for markdown output.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`prettier`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#prettier)

***

### targetConfig?

> `optional` **targetConfig?**: [`TargetConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetConfig/index.md)

Defined in: [formatters/src/types.ts:68](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L68)

Full target configuration, passed through from promptscript.yaml.

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`targetConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#targetconfig)

***

### version?

> `optional` **version?**: `string`

Defined in: [formatters/src/types.ts:60](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L60)

Target version or format variant.
Use 'legacy' for deprecated formats (e.g., Cursor's .cursorrules).

#### Example

```ts
'legacy' | '1.0' | '2.0'
```

#### Inherited from

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md).[`version`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md#version)