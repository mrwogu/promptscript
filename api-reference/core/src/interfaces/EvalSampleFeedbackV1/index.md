# EvalSampleFeedbackV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalSampleFeedbackV1

Defined in: [core/src/types/eval-import.ts:4](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L4)

Feedback attached to a production sample. There is no free-text field on purpose.

## Properties

### label?

> `optional` **label?**: `string`

Defined in: [core/src/types/eval-import.ts:18](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L18)

Feedback label.

#### Pattern

^[a-z][a-z0-9_-]{0,31}$

#### Example

```ts
"negative"
```

***

### name

> **name**: `string`

Defined in: [core/src/types/eval-import.ts:10](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L10)

Feedback name.

#### Pattern

^[a-z][a-z0-9_.-]{0,63}$

#### Example

```ts
"user.thumbs"
```

***

### score?

> `optional` **score?**: `number`

Defined in: [core/src/types/eval-import.ts:12](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L12)

Score, any finite number