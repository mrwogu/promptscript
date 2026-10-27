# PromptPolicyScope

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptPolicyScope

Defined in: [validator/src/policy/prompt-evaluator.ts:226](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/validator/src/policy/prompt-evaluator.ts#L226)

Policy risk and selection that replace the subject's own, for a caller that judges one
prompt by more than its own fields, such as a release gate that also reads the source.

## Properties

### risk

> **risk**: [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [validator/src/policy/prompt-evaluator.ts:228](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/validator/src/policy/prompt-evaluator.ts#L228)

Policy risk the checks and their messages use

***

### selects

> **selects**: (`match`) => `boolean`

Defined in: [validator/src/policy/prompt-evaluator.ts:230](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/validator/src/policy/prompt-evaluator.ts#L230)

Whether a policy's `match` selects the prompt

#### Parameters

##### match

[`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md) \| `undefined`

#### Returns

`boolean`