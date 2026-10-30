# EvalModelEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalModelEntry

Defined in: [core/src/types/eval.ts:73](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L73)

One model a suite runs, with parameters merged over the prompt's own.

## Properties

### params?

> `optional` **params?**: [`ModelParams`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelParams/index.md)

Defined in: [core/src/types/eval.ts:80](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L80)

Parameters that override the prompt's parameters for this entry only

***

### ref

> **ref**: `string`

Defined in: [core/src/types/eval.ts:78](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L78)

Model reference: profile id, alias or API id.

#### Example

```ts
"gpt-5.1"
```