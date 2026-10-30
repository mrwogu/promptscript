# EvalContainsAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalContainsAssertion

Defined in: [core/src/types/eval.ts:122](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L122)

Passes when the target contains the values.

## Extends

- [`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md)

## Properties

### field?

> `optional` **field?**: `string`

Defined in: [core/src/types/eval.ts:105](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L105)

Output property the assertion reads; absent means the whole response text

#### Inherited from

[`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md).[`field`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md#field)

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:103](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L103)

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

### ignoreCase?

> `optional` **ignoreCase?**: `boolean`

Defined in: [core/src/types/eval.ts:135](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L135)

Compare case-insensitively

***

### kind

> **kind**: `"contains"`

Defined in: [core/src/types/eval.ts:123](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L123)

***

### mode?

> `optional` **mode?**: `"all"` \| `"any"`

Defined in: [core/src/types/eval.ts:133](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L133)

Whether every value or any value must appear; default all

***

### negate?

> `optional` **negate?**: `boolean`

Defined in: [core/src/types/eval.ts:125](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L125)

Inverts the result

***

### values

> **values**: `string`[]

Defined in: [core/src/types/eval.ts:131](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L131)

Substrings to look for.

#### Min Items

1

#### Max Items

20