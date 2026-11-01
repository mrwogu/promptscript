# promptPolicyRisk()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: promptPolicyRisk()

> **promptPolicyRisk**(`subject`, `policies`): [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [validator/src/policy/prompt-evaluator.ts:204](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/policy/prompt-evaluator.ts#L204)

The policy risk of a prompt: the higher of its effective risk (unset counts as low)
and the floor of every risk-floor policy, whatever its severity.

## Parameters

### subject

[`PolicySubject`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicySubject/index.md)

### policies

readonly [`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[]

## Returns

[`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)