# EvalEqualsAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalEqualsAssertion

Defined in: [core/src/types/eval.ts:109](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L109)

Passes when the target equals `value`, else the row's expected value.

## Extends

- `EvalAssertionBase`

## Properties

### field?

> `optional` **field?**: `string`

Defined in: [core/src/types/eval.ts:105](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L105)

Output property the assertion reads; absent means the whole response text

#### Inherited from

`EvalAssertionBase.field`

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:103](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L103)

Assertion id, unique in the suite.

#### Pattern

^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$

#### Example

```ts
"decision-matches"
```

#### Inherited from

`EvalAssertionBase.id`

***

### ignoreCase?

> `optional` **ignoreCase?**: `boolean`

Defined in: [core/src/types/eval.ts:116](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L116)

Compare case-insensitively

***

### kind

> **kind**: `"equals"`

Defined in: [core/src/types/eval.ts:110](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L110)

***

### negate?

> `optional` **negate?**: `boolean`

Defined in: [core/src/types/eval.ts:112](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L112)

Inverts the result

***

### trim?

> `optional` **trim?**: `boolean`

Defined in: [core/src/types/eval.ts:118](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L118)

Trim both sides before comparing; default true

***

### value?

> `optional` **value?**: `string`

Defined in: [core/src/types/eval.ts:114](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L114)

Value to compare with; absent means the row's expected value