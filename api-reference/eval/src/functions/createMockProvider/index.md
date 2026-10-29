# createMockProvider()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createMockProvider()

> **createMockProvider**(`script`): [`MockProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockProvider/index.md)

Defined in: [eval/src/provider.ts:98](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/provider.ts#L98)

Create a provider for tests that answers from a table keyed by case id or
from a function, with scripted usage and latency, and records every call.
It has no network code. Usage defaults to zero tokens, latency to 0 and
status to 200.

## Parameters

### script

[`MockScript`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockScript/index.md)

Answers by case id, or a function of the request and context

## Returns

[`MockProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockProvider/index.md)

The provider, with its received calls in `calls`