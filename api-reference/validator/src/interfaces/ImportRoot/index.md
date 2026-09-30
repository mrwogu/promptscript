# ImportRoot

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ImportRoot

Defined in: [validator/src/types.ts:155](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L155)

Root directory of imported content for one lockfile dependency.

## Properties

### commit

> **commit**: `string`

Defined in: [validator/src/types.ts:159](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L159)

Commit SHA the lockfile pins for the import

***

### import

> **import**: `string`

Defined in: [validator/src/types.ts:157](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L157)

Normalized import key (matches promptscript.lock dependency keys)

***

### path

> **path**: `string`

Defined in: [validator/src/types.ts:161](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L161)

Absolute path holding the import's resolved content