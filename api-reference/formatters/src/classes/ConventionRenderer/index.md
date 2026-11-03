# ConventionRenderer

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: ConventionRenderer

Defined in: [formatters/src/convention-renderer.ts:36](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L36)

Convention renderer for applying output conventions to formatted content.

## Constructors

### Constructor

> **new ConventionRenderer**(`conventionOrOptions?`): `ConventionRenderer`

Defined in: [formatters/src/convention-renderer.ts:41](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L41)

#### Parameters

##### conventionOrOptions?

`string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md) \| [`ConventionRendererOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/ConventionRendererOptions/index.md) = `'xml'`

#### Returns

`ConventionRenderer`

## Methods

### getConvention()

> **getConvention**(): [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [formatters/src/convention-renderer.ts:91](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L91)

Get the current convention.

#### Returns

[`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

***

### getPrettierOptions()

> **getPrettierOptions**(): `Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

Defined in: [formatters/src/convention-renderer.ts:84](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L84)

Get the current Prettier options.

#### Returns

`Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

***

### getSectionSeparator()

> **getSectionSeparator**(): `string`

Defined in: [formatters/src/convention-renderer.ts:168](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L168)

Get the section separator based on convention.
Returns '\n\n' (double newline) for all conventions.

#### Returns

`string`

***

### renderCodeBlock()

> **renderCodeBlock**(`code`, `language?`): `string`

Defined in: [formatters/src/convention-renderer.ts:149](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L149)

Render a code block.

#### Parameters

##### code

`string`

##### language?

`string` = `''`

#### Returns

`string`

***

### renderList()

> **renderList**(`items`): `string`

Defined in: [formatters/src/convention-renderer.ts:141](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L141)

Render a list of items.

#### Parameters

##### items

`string`[]

#### Returns

`string`

***

### renderSection()

> **renderSection**(`name`, `content`, `level?`): `string`

Defined in: [formatters/src/convention-renderer.ts:102](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L102)

Render a section with the convention.

#### Parameters

##### name

`string`

Section name (e.g., 'project', 'tech-stack')

##### content

`string`

Section content

##### level?

`number` = `1`

Nesting level (1 = section, 2+ = subsection)

#### Returns

`string`

***

### wrapRoot()

> **wrapRoot**(`content`): `string`

Defined in: [formatters/src/convention-renderer.ts:157](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/convention-renderer.ts#L157)

Wrap content with root wrapper if defined.

#### Parameters

##### content

`string`

#### Returns

`string`