# FormatOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatOptions

Defined in: [compiler/src/types.ts:42](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L42)

Options for formatting.

## Properties

### convention?

> `optional` **convention?**: `string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [compiler/src/types.ts:44](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L44)

Output convention to use

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [compiler/src/types.ts:62](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L62)

Model catalog settings from promptscript.yaml, used to map agent models.

***

### outputPath?

> `optional` **outputPath?**: `string`

Defined in: [compiler/src/types.ts:46](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L46)

Custom output path

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [compiler/src/types.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L56)

Prettier formatting options for markdown output.

***

### targetConfig?

> `optional` **targetConfig?**: [`TargetConfig`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/TargetConfig/index.md)

Defined in: [compiler/src/types.ts:59](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L59)

Full target configuration, passed through from promptscript.yaml.

***

### version?

> `optional` **version?**: `string`

Defined in: [compiler/src/types.ts:52](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L52)

Target version or format variant.
Use 'legacy' for deprecated formats.

#### Example

```ts
'legacy' | '1.0' | '2.0'
```