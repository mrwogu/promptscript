# PromptPolicyScope

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptPolicyScope

Defined in: [validator/src/policy/prompt-evaluator.ts:227](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/policy/prompt-evaluator.ts#L227)

Policy risk and selection that replace the subject's own, for a caller that judges one
prompt by more than its own fields, such as a release gate that also reads the source.

## Properties

### risk

> **risk**: [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [validator/src/policy/prompt-evaluator.ts:229](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/policy/prompt-evaluator.ts#L229)

Policy risk the checks and their messages use

***

### selects

> **selects**: (`match`) => `boolean`

Defined in: [validator/src/policy/prompt-evaluator.ts:231](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/policy/prompt-evaluator.ts#L231)

Whether a policy's `match` selects the prompt

#### Parameters

##### match

[`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md) \| `undefined`

#### Returns

`boolean`