# evaluateAssertions()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: evaluateAssertions()

> **evaluateAssertions**(`assertions`, `response`, `context`): [`EvalAssertionResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionResultV1/index.md)[]

Defined in: [eval/src/assertions.ts:274](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/assertions.ts#L274)

Check a response with the four deterministic assertion kinds: `equals`,
`contains`, `regex` and `json-schema`. A `field` reads one property of the
response parsed as JSON (trimmed, one fenced block unwrapped, own
properties only); without `field` the whole text is the target, except
for `json-schema`, which checks the parsed object. A response that does not
parse fails every assertion that needs the object. Reasons are at most 160
characters and quote at most 60 characters of the actual value.

## Parameters

### assertions

readonly [`DeterministicAssertion`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/DeterministicAssertion/index.md)[]

Assertions in suite order

### response

`string`

Response text

### context

[`AssertionContext`](https://getpromptscript.dev/api-reference/eval/src/interfaces/AssertionContext/index.md)

Output contract and the row's expected value

## Returns

[`EvalAssertionResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionResultV1/index.md)[]

One result per assertion, in the same order