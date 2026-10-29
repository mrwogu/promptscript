# promptPolicyMatches()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: promptPolicyMatches()

> **promptPolicyMatches**(`match`, `subject`, `risk`): `boolean`

Defined in: [validator/src/policy/prompt-evaluator.ts:214](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/policy/prompt-evaluator.ts#L214)

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