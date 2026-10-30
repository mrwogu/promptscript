# EvalComparisonV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalComparisonV1

Defined in: [core/src/types/eval.ts:763](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L763)

Comparison of a candidate report against a baseline, version 1: the
JSON output of a standalone compare, or `comparison` inside a report.

## Properties

### $schema?

> `optional` **$schema?**: `"https://getpromptscript.dev/schema/eval-comparison/v1.json"`

Defined in: [core/src/types/eval.ts:769](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L769)

Schema URL, the version tag of a standalone comparison; absent inside
a report.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-comparison/v1.json"
```

***

### entries

> **entries**: [`EvalComparisonEntryV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalComparisonEntryV1/index.md)[]

Defined in: [core/src/types/eval.ts:779](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L779)

Entries sorted by suite name, then model order

***

### regression

> **regression**: `boolean`

Defined in: [core/src/types/eval.ts:777](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L777)

Whether any case regressed or a pass rate dropped beyond the tolerance

***

### tolerance

> **tolerance**: `number`

Defined in: [core/src/types/eval.ts:775](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L775)

Pass-rate drop that counts as a regression.

#### Minimum

0

#### Maximum

1