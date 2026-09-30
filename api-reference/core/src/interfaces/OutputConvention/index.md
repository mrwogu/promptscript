# OutputConvention

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputConvention

Defined in: [core/src/types/convention.ts:58](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/convention.ts#L58)

Output convention definition.

## Properties

### codeBlockDelimiter?

> `optional` **codeBlockDelimiter?**: `string`

Defined in: [core/src/types/convention.ts:89](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/convention.ts#L89)

Code block delimiter.

#### Default

```ts
'```'
```

***

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/convention.ts:67](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/convention.ts#L67)

Human-readable description.

***

### listStyle?

> `optional` **listStyle?**: `"dash"` \| `"asterisk"` \| `"bullet"` \| `"numbered"`

Defined in: [core/src/types/convention.ts:83](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/convention.ts#L83)

How to render lists.

#### Default

```ts
'dash' (- item)
```

***

### name

> **name**: `string`

Defined in: [core/src/types/convention.ts:62](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/convention.ts#L62)

Convention identifier.

***

### rootWrapper?

> `optional` **rootWrapper?**: `object`

Defined in: [core/src/types/convention.ts:94](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/convention.ts#L94)

Whether to wrap content in a root element.

#### end

> **end**: `string`

#### start

> **start**: `string`

***

### section

> **section**: [`SectionRenderer`](https://getpromptscript.dev/api-reference/core/src/interfaces/SectionRenderer/index.md)

Defined in: [core/src/types/convention.ts:72](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/convention.ts#L72)

Section rendering configuration.

***

### subsection?

> `optional` **subsection?**: [`SectionRenderer`](https://getpromptscript.dev/api-reference/core/src/interfaces/SectionRenderer/index.md)

Defined in: [core/src/types/convention.ts:77](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/convention.ts#L77)

Subsection rendering (defaults to section config if not specified).