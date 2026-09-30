# FormattingConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormattingConfig

Defined in: [core/src/types/config.ts:12](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L12)

Formatting configuration for output files.
Controls how generated markdown is formatted.

## Properties

### prettier?

> `optional` **prettier?**: `string` \| `boolean` \| [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [core/src/types/config.ts:29](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L29)

Enable Prettier formatting.
- `true`: Auto-detect .prettierrc in project
- `string`: Path to Prettier config file
- `PrettierMarkdownOptions`: Explicit options

#### Example

```ts
formatting:
  prettier: true  # Auto-detect

formatting:
  prettier: "./config/.prettierrc"  # Explicit path

formatting:
  proseWrap: always
  tabWidth: 4
```

***

### printWidth?

> `optional` **printWidth?**: `number`

Defined in: [core/src/types/config.ts:44](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L44)

Explicit printWidth setting (shorthand for prettier.printWidth).

***

### proseWrap?

> `optional` **proseWrap?**: `"always"` \| `"never"` \| `"preserve"`

Defined in: [core/src/types/config.ts:34](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L34)

Explicit proseWrap setting (shorthand for prettier.proseWrap).

***

### tabWidth?

> `optional` **tabWidth?**: `number`

Defined in: [core/src/types/config.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L39)

Explicit tabWidth setting (shorthand for prettier.tabWidth).