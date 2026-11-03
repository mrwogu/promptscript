# replacePathTokens()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: replacePathTokens()

> **replacePathTokens**(`text`, `values`): `object`

Defined in: [core/src/utils/path-tokens.ts:33](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/utils/path-tokens.ts#L33)

Replace `{{prs.dotDir}}`, `{{prs.skillsDir}}` and `{{prs.skillDir}}` with
the given values. Escaped `\{{prs.dotDir}}` is written as `{{prs.dotDir}}`.

## Parameters

### text

`string`

### values

[`PathTokenValues`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PathTokenValues/index.md)

## Returns

`object`

The new text and the names of tokens left without a value.

### text

> **text**: `string`

### unresolved

> **unresolved**: (`"dotDir"` \| `"skillsDir"` \| `"skillDir"`)[]