# createMockProvider()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createMockProvider()

> **createMockProvider**(`script`): [`MockProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockProvider/index.md)

Defined in: [eval/src/provider.ts:100](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/eval/src/provider.ts#L100)

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