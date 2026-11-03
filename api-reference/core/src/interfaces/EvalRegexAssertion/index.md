# EvalRegexAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalRegexAssertion

Defined in: [core/src/types/eval.ts:143](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L143)

Passes when the pattern matches the target.

## Extends

- [`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md)

## Properties

### field?

> `optional` **field?**: `string`

Defined in: [core/src/types/eval.ts:109](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L109)

Output property the assertion reads; absent means the whole response text

#### Inherited from

[`EvalAssertionBase`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md).[`field`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionBase/index.md#field)

***

### flags?

> `optional` **flags?**: `string`

Defined in: [core/src/types/eval.ts:156](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L156)

Regular expression flags, any of `i`, `m`, `s` and `u`, each at most once.

#### Pattern

^(?!.*(.).*\1)[imsu]{0,4}$

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:107](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L107)

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

Defined in: [core/src/types/eval.ts:144](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L144)

***

### negate?

> `optional` **negate?**: `boolean`

Defined in: [core/src/types/eval.ts:146](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L146)

Inverts the result

***

### pattern

> **pattern**: `string`

Defined in: [core/src/types/eval.ts:151](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L151)

Regular expression source.

#### Example

```ts
"\\bguarantee(d)?\\b"
```