# EvalFindingV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalFindingV1

Defined in: [core/src/types/eval.ts:662](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L662)

One finding of the dataset scan.

## Properties

### allowedBecause?

> `optional` **allowedBecause?**: `string`

Defined in: [core/src/types/eval.ts:696](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L696)

Reason from the suite's allow entry when the finding was downgraded

***

### code

> **code**: `string`

Defined in: [core/src/types/eval.ts:668](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L668)

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

Defined in: [core/src/types/eval.ts:694](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L694)

Line of the row in the dataset file.

#### As Type

integer

#### Minimum

1

***

### path?

> `optional` **path?**: `string`

Defined in: [core/src/types/eval.ts:688](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L688)

JSON path of the value inside the row.

#### Example

```ts
"inputs.message"
```

***

### rowId?

> `optional` **rowId?**: `string`

Defined in: [core/src/types/eval.ts:683](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L683)

Dataset row id

***

### rule?

> `optional` **rule?**: `string`

Defined in: [core/src/types/eval.ts:674](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L674)

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

Defined in: [core/src/types/eval.ts:679](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L679)

Validator rule name, for a scan finding.

#### Example

```ts
"blocked-patterns"
```

***

### severity

> **severity**: [`EvalFindingSeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalFindingSeverity/index.md)

Defined in: [core/src/types/eval.ts:681](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L681)

Severity after any downgrade