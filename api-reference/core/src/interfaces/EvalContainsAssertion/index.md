# EvalContainsAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalContainsAssertion

Defined in: [core/src/types/eval.ts:126](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L126)

Passes when the target contains the values.

## Extends

- [`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md)

## Properties

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

### ignoreCase?

> `optional` **ignoreCase?**: `boolean`

Defined in: [core/src/types/eval.ts:139](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L139)

Compare case-insensitively

***

### kind

> **kind**: `"contains"`

Defined in: [core/src/types/eval.ts:127](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L127)

***

### mode?

> `optional` **mode?**: `"all"` \| `"any"`

Defined in: [core/src/types/eval.ts:137](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L137)

Whether every value or any value must appear; default all

***

### negate?

> `optional` **negate?**: `boolean`

Defined in: [core/src/types/eval.ts:129](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L129)

Inverts the result

***

### values

> **values**: `string`[]

Defined in: [core/src/types/eval.ts:135](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L135)

Substrings to look for.

#### Min Items

1

#### Max Items

20