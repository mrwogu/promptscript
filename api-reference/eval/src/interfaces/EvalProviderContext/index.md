# EvalProviderContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalProviderContext

Defined in: [eval/src/provider.ts:33](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L33)

Per-call context of a provider.

## Properties

### caseId

> **caseId**: `string`

Defined in: [eval/src/provider.ts:37](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L37)

Dataset row id of the case the call is for

***

### sample?

> `optional` **sample?**: `number`

Defined in: [eval/src/provider.ts:39](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L39)

Run index of a judge call, from 1; 0 for the call of a case

***

### signal

> **signal**: `AbortSignal`

Defined in: [eval/src/provider.ts:35](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L35)

Aborts the call