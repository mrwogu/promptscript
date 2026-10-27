# EvalProviderContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalProviderContext

Defined in: [eval/src/provider.ts:33](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L33)

Per-call context of a provider.

## Properties

### caseId

> **caseId**: `string`

Defined in: [eval/src/provider.ts:37](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L37)

Dataset row id of the case the call is for

***

### signal

> **signal**: `AbortSignal`

Defined in: [eval/src/provider.ts:35](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L35)

Aborts the call