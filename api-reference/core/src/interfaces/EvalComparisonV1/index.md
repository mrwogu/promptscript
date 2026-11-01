# EvalComparisonV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalComparisonV1

Defined in: [core/src/types/eval.ts:763](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L763)

Comparison of a candidate report against a baseline, version 1: the
JSON output of a standalone compare, or `comparison` inside a report.

## Properties

### $schema?

> `optional` **$schema?**: `"https://getpromptscript.dev/schema/eval-comparison/v1.json"`

Defined in: [core/src/types/eval.ts:769](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L769)

Schema URL, the version tag of a standalone comparison; absent inside
a report.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-comparison/v1.json"
```

***

### entries

> **entries**: [`EvalComparisonEntryV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalComparisonEntryV1/index.md)[]

Defined in: [core/src/types/eval.ts:785](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L785)

Entries sorted by suite name, then model order

***

### regression

> **regression**: `boolean`

Defined in: [core/src/types/eval.ts:783](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L783)

Whether any case regressed or a pass rate dropped beyond the tolerance

***

### tolerance

> **tolerance**: `number`

Defined in: [core/src/types/eval.ts:781](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L781)

Pass-rate drop that counts as a regression.

#### Minimum

0

#### Maximum

1

***

### version?

> `optional` **version?**: `1`

Defined in: [core/src/types/eval.ts:775](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L775)

Format version, 1 in standalone comparisons this CLI writes. Absent
inside a report and in comparisons from older versions; read a missing
value as 1.