# ValidateOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateOptions

Defined in: [cli/src/types.ts:100](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/cli/src/types.ts#L100)

Options for the validate command.

## Properties

### files?

> `optional` **files?**: `string`[]

Defined in: [cli/src/types.ts:102](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/cli/src/types.ts#L102)

Specific PromptScript files to validate

***

### fix?

> `optional` **fix?**: `boolean`

Defined in: [cli/src/types.ts:108](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/cli/src/types.ts#L108)

Auto-fix syntax version issues

***

### format?

> `optional` **format?**: `string`

Defined in: [cli/src/types.ts:106](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/cli/src/types.ts#L106)

Output format: text or json, anything else is rejected

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [cli/src/types.ts:112](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/cli/src/types.ts#L112)

Skip reference integrity checks (disables PS031)

***

### skipPolicies?

> `optional` **skipPolicies?**: `boolean`

Defined in: [cli/src/types.ts:110](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/cli/src/types.ts#L110)

Skip policy evaluation

***

### strict?

> `optional` **strict?**: `boolean`

Defined in: [cli/src/types.ts:104](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/cli/src/types.ts#L104)

Treat warnings as errors