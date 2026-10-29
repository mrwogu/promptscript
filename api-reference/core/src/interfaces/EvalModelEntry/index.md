# EvalModelEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalModelEntry

Defined in: [core/src/types/eval.ts:73](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L73)

One model a suite runs, with parameters merged over the prompt's own.

## Properties

### params?

> `optional` **params?**: [`ModelParams`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelParams/index.md)

Defined in: [core/src/types/eval.ts:80](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L80)

Parameters that override the prompt's parameters for this entry only

***

### ref

> **ref**: `string`

Defined in: [core/src/types/eval.ts:78](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L78)

Model reference: profile id, alias or API id.

#### Example

```ts
"gpt-5.1"
```