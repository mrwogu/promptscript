# ConventionRenderer

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: ConventionRenderer

Defined in: [formatters/src/convention-renderer.ts:30](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L30)

Convention renderer for applying output conventions to formatted content.

## Constructors

### Constructor

> **new ConventionRenderer**(`conventionOrOptions?`): `ConventionRenderer`

Defined in: [formatters/src/convention-renderer.ts:34](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L34)

#### Parameters

##### conventionOrOptions?

`string` \| [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md) \| [`ConventionRendererOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/ConventionRendererOptions/index.md)

#### Returns

`ConventionRenderer`

## Methods

### getConvention()

> **getConvention**(): [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

Defined in: [formatters/src/convention-renderer.ts:81](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L81)

Get the current convention.

#### Returns

[`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)

***

### getPrettierOptions()

> **getPrettierOptions**(): `Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

Defined in: [formatters/src/convention-renderer.ts:74](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L74)

Get the current Prettier options.

#### Returns

`Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

***

### getSectionSeparator()

> **getSectionSeparator**(): `string`

Defined in: [formatters/src/convention-renderer.ts:158](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L158)

Get the section separator based on convention.
Returns '\n\n' (double newline) for all conventions.

#### Returns

`string`

***

### renderCodeBlock()

> **renderCodeBlock**(`code`, `language?`): `string`

Defined in: [formatters/src/convention-renderer.ts:139](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L139)

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

Defined in: [formatters/src/convention-renderer.ts:131](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L131)

Render a list of items.

#### Parameters

##### items

`string`[]

#### Returns

`string`

***

### renderSection()

> **renderSection**(`name`, `content`, `level?`): `string`

Defined in: [formatters/src/convention-renderer.ts:92](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L92)

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

Defined in: [formatters/src/convention-renderer.ts:147](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/convention-renderer.ts#L147)

Wrap content with root wrapper if defined.

#### Parameters

##### content

`string`

#### Returns

`string`