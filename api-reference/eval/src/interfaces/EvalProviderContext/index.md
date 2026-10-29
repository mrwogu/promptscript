# EvalProviderContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalProviderContext

Defined in: [eval/src/provider.ts:33](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/provider.ts#L33)

Per-call context of a provider.

## Properties

### caseId

> **caseId**: `string`

Defined in: [eval/src/provider.ts:37](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/provider.ts#L37)

Dataset row id of the case the call is for

***

### signal

> **signal**: `AbortSignal`

Defined in: [eval/src/provider.ts:35](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/provider.ts#L35)

Aborts the call