# ConventionRendererOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ConventionRendererOptions

Defined in: [formatters/src/convention-renderer.ts:16](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/convention-renderer.ts#L16)

Options for creating a ConventionRenderer.

## Properties

### convention?

> `optional` **convention?**: `string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [formatters/src/convention-renderer.ts:20](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/convention-renderer.ts#L20)

Output convention to use.

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [formatters/src/convention-renderer.ts:24](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/convention-renderer.ts#L24)

Prettier formatting options.

***

### verbatim?

> `optional` **verbatim?**: `boolean`

Defined in: [formatters/src/convention-renderer.ts:30](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/convention-renderer.ts#L30)

Keep section text as written: skip the escaping done for Prettier
(`formatting.postFormat: false`).

#### Default

```ts
false
```