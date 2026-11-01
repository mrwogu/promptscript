# EvalLlmJudgeAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalLlmJudgeAssertion

Defined in: [core/src/types/eval.ts:167](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L167)

Passes when the majority of judge runs say pass. The rubric receives
the inputs `response`, `case_inputs`, `expected`, `criteria` and the
reserved `boundary`.

## Extends

- [`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md)

## Properties

### criteria?

> `optional` **criteria?**: `string`

Defined in: [core/src/types/eval.ts:175](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L175)

Extra criteria passed to the rubric as its `criteria` input

***

### field?

> `optional` **field?**: `string`

Defined in: [core/src/types/eval.ts:105](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L105)

Output property the assertion reads; absent means the whole response text

#### Inherited from

[`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md).[`field`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md#field)

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

#### Inherited from

[`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md).[`id`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md#id)

***

### kind

> **kind**: `"llm-judge"`

Defined in: [core/src/types/eval.ts:168](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L168)

***

### model?

> `optional` **model?**: `string`

Defined in: [core/src/types/eval.ts:177](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L177)

Model reference the judge runs on; absent means the suite judge, then the rubric's own model

***

### rubric

> **rubric**: `string`

Defined in: [core/src/types/eval.ts:173](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L173)

Prompt id of the rubric.

#### Example

```ts
"acme-support/judge-polite-reply"
```

***

### runs?

> `optional` **runs?**: [`EvalJudgeRuns`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalJudgeRuns/index.md)

Defined in: [core/src/types/eval.ts:179](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L179)

Judge runs per case; absent means the suite judge setting