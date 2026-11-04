# EvalLlmJudgeAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalLlmJudgeAssertion

Defined in: [core/src/types/eval.ts:171](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L171)

Passes when the majority of judge runs say pass. The rubric receives
the inputs `response`, `case_inputs`, `expected`, `criteria` and the
reserved `boundary`.

## Extends

- [`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md)

## Properties

### criteria?

> `optional` **criteria?**: `string`

Defined in: [core/src/types/eval.ts:179](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L179)

Extra criteria passed to the rubric as its `criteria` input

***

### field?

> `optional` **field?**: `string`

Defined in: [core/src/types/eval.ts:109](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L109)

Output property the assertion reads; absent means the whole response text

#### Inherited from

[`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md).[`field`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md#field)

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

#### Inherited from

[`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md).[`id`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md#id)

***

### kind

> **kind**: `"llm-judge"`

Defined in: [core/src/types/eval.ts:172](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L172)

***

### model?

> `optional` **model?**: `string`

Defined in: [core/src/types/eval.ts:181](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L181)

Model reference the judge runs on; absent means the suite judge, then the rubric's own model

***

### rubric

> **rubric**: `string`

Defined in: [core/src/types/eval.ts:177](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L177)

Prompt id of the rubric.

#### Example

```ts
"acme-support/judge-polite-reply"
```

***

### runs?

> `optional` **runs?**: [`EvalJudgeRuns`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalJudgeRuns/index.md)

Defined in: [core/src/types/eval.ts:183](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L183)

Judge runs per case; absent means the suite judge setting