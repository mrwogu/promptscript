# promptPolicyMatches()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: promptPolicyMatches()

> **promptPolicyMatches**(`match`, `subject`, `risk`): `boolean`

Defined in: [validator/src/policy/prompt-evaluator.ts:215](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/policy/prompt-evaluator.ts#L215)

Whether a policy's `match` selects a prompt at the given policy risk.

## Parameters

### match

[`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md) \| `undefined`

### subject

[`PolicySubject`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicySubject/index.md)

### risk

[`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

## Returns

`boolean`