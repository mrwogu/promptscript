# RESERVED_WORDS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: RESERVED\_WORDS

> `const` **RESERVED\_WORDS**: readonly \[`"meta"`, `"inherit"`, `"use"`, `"extend"`, `"identity"`, `"context"`, `"standards"`, `"restrictions"`, `"knowledge"`, `"shortcuts"`, `"commands"`, `"guards"`, `"params"`, `"skills"`, `"local"`, `"agents"`, `"workflows"`, `"hooks"`, `"mcpServers"`, `"plugins"`, `"prompts"`, `"examples"`, `"as"`, `"true"`, `"false"`, `"null"`, `"string"`, `"number"`, `"boolean"`, `"list"`, `"range"`, `"enum"`\]

Defined in: [core/src/types/constants.ts:47](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/constants.ts#L47)

Reserved words in PromptScript that cannot be used as identifiers.

## Example

```typescript
if (RESERVED_WORDS.includes(identifier)) {
  throw new Error(`'${identifier}' is a reserved word`);
}
```