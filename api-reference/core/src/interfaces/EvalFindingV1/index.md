# EvalFindingV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalFindingV1

Defined in: [core/src/types/eval.ts:634](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L634)

One finding of the dataset scan.

## Properties

### allowedBecause?

> `optional` **allowedBecause?**: `string`

Defined in: [core/src/types/eval.ts:668](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L668)

Reason from the suite's allow entry when the finding was downgraded

***

### code

> **code**: `string`

Defined in: [core/src/types/eval.ts:640](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L640)

Eval code of the finding.

#### Pattern

^PS\d{3,4}$

#### Example

```ts
"PS6110"
```

***

### line?

> `optional` **line?**: `number`

Defined in: [core/src/types/eval.ts:666](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L666)

Line of the row in the dataset file.

#### As Type

integer

#### Minimum

1

***

### path?

> `optional` **path?**: `string`

Defined in: [core/src/types/eval.ts:660](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L660)

JSON path of the value inside the row.

#### Example

```ts
"inputs.message"
```

***

### rowId?

> `optional` **rowId?**: `string`

Defined in: [core/src/types/eval.ts:655](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L655)

Dataset row id

***

### rule?

> `optional` **rule?**: `string`

Defined in: [core/src/types/eval.ts:646](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L646)

Validator rule that fired, for a scan finding.

#### Pattern

^PS\d{3,4}$

#### Example

```ts
"PS005"
```

***

### ruleName?

> `optional` **ruleName?**: `string`

Defined in: [core/src/types/eval.ts:651](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L651)

Validator rule name, for a scan finding.

#### Example

```ts
"blocked-patterns"
```

***

### severity

> **severity**: [`EvalFindingSeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalFindingSeverity/index.md)

Defined in: [core/src/types/eval.ts:653](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L653)

Severity after any downgrade