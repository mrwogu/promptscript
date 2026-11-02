# PolicyContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: PolicyContext

> **PolicyContext** = `Pick`\<[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md), `"governance"` \| `"releases"` \| `"models"` \| `"blockedPatterns"` \| `"allowedPatterns"`\>

Defined in: [validator/src/policy/types.ts:19](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/validator/src/policy/types.ts#L19)

Project settings that policies are parsed and evaluated against: approval
roles, release environments, the model catalog and the blocked-pattern setup
of PS005.