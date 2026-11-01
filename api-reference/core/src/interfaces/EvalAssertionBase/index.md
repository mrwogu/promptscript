# EvalAssertionBase

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalAssertionBase

Defined in: [core/src/types/eval.ts:97](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L97)

## Extended by

- [`EvalEqualsAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalEqualsAssertion/index.md)
- [`EvalContainsAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalContainsAssertion/index.md)
- [`EvalRegexAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalRegexAssertion/index.md)
- [`EvalJsonSchemaAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJsonSchemaAssertion/index.md)
- [`EvalLlmJudgeAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLlmJudgeAssertion/index.md)

## Properties

### field?

> `optional` **field?**: `string`

Defined in: [core/src/types/eval.ts:105](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L105)

Output property the assertion reads; absent means the whole response text

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:103](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L103)

Assertion id, unique in the suite.

#### Pattern

^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$

#### Example

```ts
"decision-matches"
```