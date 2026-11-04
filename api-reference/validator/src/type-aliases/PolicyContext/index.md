# PolicyContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: PolicyContext

> **PolicyContext** = `Pick`\<[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md), `"governance"` \| `"releases"` \| `"models"` \| `"blockedPatterns"` \| `"allowedPatterns"`\>

Defined in: [validator/src/policy/types.ts:19](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/validator/src/policy/types.ts#L19)

Project settings that policies are parsed and evaluated against: approval
roles, release environments, the model catalog and the blocked-pattern setup
of PS005.