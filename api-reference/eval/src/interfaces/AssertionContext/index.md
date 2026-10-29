# AssertionContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: AssertionContext

Defined in: [eval/src/assertions.ts:27](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/assertions.ts#L27)

What a response is checked against, besides the assertions.

## Properties

### expected?

> `optional` **expected?**: `string` \| `Record`\<`string`, [`EvalExpectedValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalExpectedValue/index.md)\>

Defined in: [eval/src/assertions.ts:31](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/assertions.ts#L31)

Expected value of the row, the default value of `equals`

***

### output?

> `optional` **output?**: [`PromptBundleOutput`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleOutput/index.md)

Defined in: [eval/src/assertions.ts:29](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/assertions.ts#L29)

Output contract of the prompt, the default schema of `json-schema`

***

### timedOut?

> `optional` **timedOut?**: `Set`\<`string`\>

Defined in: [eval/src/assertions.ts:37](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/assertions.ts#L37)

Ids of assertions whose patterns ran out of time on an earlier case. They
fail at once, and an assertion that runs out is added, so a slow pattern
costs its time budget once per run instead of once per case.