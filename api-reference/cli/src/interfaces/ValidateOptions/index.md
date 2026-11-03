# ValidateOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateOptions

Defined in: [cli/src/types.ts:105](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L105)

Options for the validate command.

## Properties

### files?

> `optional` **files?**: `string`[]

Defined in: [cli/src/types.ts:107](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L107)

Specific PromptScript files to validate

***

### fix?

> `optional` **fix?**: `boolean`

Defined in: [cli/src/types.ts:113](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L113)

Auto-fix syntax version issues

***

### format?

> `optional` **format?**: `string`

Defined in: [cli/src/types.ts:111](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L111)

Output format: text or json, anything else is rejected

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [cli/src/types.ts:117](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L117)

Skip reference integrity checks (disables PS031)

***

### skipPolicies?

> `optional` **skipPolicies?**: `boolean`

Defined in: [cli/src/types.ts:115](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L115)

Skip policy evaluation

***

### strict?

> `optional` **strict?**: `boolean`

Defined in: [cli/src/types.ts:109](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L109)

Treat warnings as errors