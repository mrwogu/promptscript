# EvalRegexAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalRegexAssertion

Defined in: [core/src/types/eval.ts:139](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L139)

Passes when the pattern matches the target.

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

### flags?

> `optional` **flags?**: `string`

Defined in: [core/src/types/eval.ts:152](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L152)

Regular expression flags, any of `i`, `m`, `s` and `u`, each at most once.

#### Pattern

^(?!.*(.).*\1)[imsu]{0,4}$

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

### kind

> **kind**: `"regex"`

Defined in: [core/src/types/eval.ts:140](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L140)

***

### negate?

> `optional` **negate?**: `boolean`

Defined in: [core/src/types/eval.ts:142](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L142)

Inverts the result

***

### pattern

> **pattern**: `string`

Defined in: [core/src/types/eval.ts:147](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L147)

Regular expression source.

#### Example

```ts
"\\bguarantee(d)?\\b"
```