# EvalProvider

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EvalProvider

> **EvalProvider** = (`request`, `context`) => `Promise`\<[`EvalResponse`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md)\>

Defined in: [eval/src/provider.ts:46](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L46)

Makes one model call. Throws `EvalProviderError` when the call fails;
retries, cache and budget belong to the caller.

## Parameters

### request

[`EvalRequest`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalRequest/index.md)

### context

[`EvalProviderContext`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalProviderContext/index.md)

## Returns

`Promise`\<[`EvalResponse`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md)\>