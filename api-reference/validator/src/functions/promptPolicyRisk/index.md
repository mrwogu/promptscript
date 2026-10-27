# promptPolicyRisk()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: promptPolicyRisk()

> **promptPolicyRisk**(`subject`, `policies`): [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [validator/src/policy/prompt-evaluator.ts:203](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/validator/src/policy/prompt-evaluator.ts#L203)

The policy risk of a prompt: the higher of its effective risk (unset counts as low)
and the floor of every risk-floor policy, whatever its severity.

## Parameters

### subject

[`PolicySubject`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicySubject/index.md)

### policies

readonly [`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[]

## Returns

[`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)