# PolicyContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: PolicyContext

> **PolicyContext** = `Pick`\<[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md), `"governance"` \| `"releases"` \| `"models"` \| `"blockedPatterns"` \| `"allowedPatterns"`\>

Defined in: [validator/src/policy/types.ts:19](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/validator/src/policy/types.ts#L19)

Project settings that policies are parsed and evaluated against: approval
roles, release environments, the model catalog and the blocked-pattern setup
of PS005.