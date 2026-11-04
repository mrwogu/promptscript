# EvalComparisonV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalComparisonV1

Defined in: [core/src/types/eval.ts:791](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L791)

Comparison of a candidate report against a baseline, version 1: the
JSON output of a standalone compare, or `comparison` inside a report.

## Properties

### $schema?

> `optional` **$schema?**: `"https://getpromptscript.dev/schema/eval-comparison/v1.json"`

Defined in: [core/src/types/eval.ts:797](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L797)

Schema URL, the version tag of a standalone comparison; absent inside
a report.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-comparison/v1.json"
```

***

### entries

> **entries**: [`EvalComparisonEntryV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalComparisonEntryV1/index.md)[]

Defined in: [core/src/types/eval.ts:813](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L813)

Entries sorted by suite name, then model order

***

### regression

> **regression**: `boolean`

Defined in: [core/src/types/eval.ts:811](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L811)

Whether any case regressed or a pass rate dropped beyond the tolerance

***

### tolerance

> **tolerance**: `number`

Defined in: [core/src/types/eval.ts:809](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L809)

Pass-rate drop that counts as a regression.

#### Minimum

0

#### Maximum

1

***

### version?

> `optional` **version?**: `1`

Defined in: [core/src/types/eval.ts:803](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L803)

Format version, 1 in standalone comparisons this CLI writes. Absent
inside a report and in comparisons from older versions; read a missing
value as 1.