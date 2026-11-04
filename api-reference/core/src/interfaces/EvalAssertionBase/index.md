# EvalAssertionBase

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalAssertionBase

Defined in: [core/src/types/eval.ts:101](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L101)

## Extended by

- [`EvalEqualsAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalEqualsAssertion/index.md)
- [`EvalContainsAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalContainsAssertion/index.md)
- [`EvalRegexAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalRegexAssertion/index.md)
- [`EvalJsonSchemaAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJsonSchemaAssertion/index.md)
- [`EvalLlmJudgeAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLlmJudgeAssertion/index.md)

## Properties

### field?

> `optional` **field?**: `string`

Defined in: [core/src/types/eval.ts:109](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L109)

Output property the assertion reads; absent means the whole response text

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:107](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L107)

Assertion id, unique in the suite.

#### Pattern

^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$

#### Example

```ts
"decision-matches"
```