# PrettierMarkdownOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PrettierMarkdownOptions

Defined in: [core/src/types/prettier.ts:5](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/prettier.ts#L5)

Prettier markdown formatting options.
These options control how markdown output is formatted.

## Properties

### printWidth?

> `optional` **printWidth?**: `number`

Defined in: [core/src/types/prettier.ts:25](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/prettier.ts#L25)

Maximum line width for prose wrapping.

#### Default

```ts
80
```

***

### proseWrap?

> `optional` **proseWrap?**: `"always"` \| `"never"` \| `"preserve"`

Defined in: [core/src/types/prettier.ts:13](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/prettier.ts#L13)

How to wrap prose.
- 'always': Wrap prose at printWidth
- 'never': Do not wrap prose
- 'preserve': Preserve original wrapping

#### Default

```ts
'preserve'
```

***

### tabWidth?

> `optional` **tabWidth?**: `number`

Defined in: [core/src/types/prettier.ts:19](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/prettier.ts#L19)

Number of spaces per indentation level.

#### Default

```ts
2
```