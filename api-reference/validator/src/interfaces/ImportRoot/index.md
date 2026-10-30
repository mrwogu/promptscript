# ImportRoot

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ImportRoot

Defined in: [validator/src/types.ts:167](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/validator/src/types.ts#L167)

Root directory of imported content for one lockfile dependency.

## Properties

### commit

> **commit**: `string`

Defined in: [validator/src/types.ts:171](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/validator/src/types.ts#L171)

Commit SHA the lockfile pins for the import

***

### import

> **import**: `string`

Defined in: [validator/src/types.ts:169](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/validator/src/types.ts#L169)

Normalized import key (matches promptscript.lock dependency keys)

***

### path

> **path**: `string`

Defined in: [validator/src/types.ts:173](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/validator/src/types.ts#L173)

Absolute path holding the import's resolved content