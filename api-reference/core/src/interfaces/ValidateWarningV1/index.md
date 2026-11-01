# ValidateWarningV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateWarningV1

Defined in: [core/src/types/validate-report.ts:40](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L40)

One warning of `prs validate`. With `--strict` a warning fails the run.

## Properties

### location?

> `optional` **location?**: [`ValidateLocationV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateLocationV1/index.md)

Defined in: [core/src/types/validate-report.ts:51](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L51)

Where the warning is

***

### message

> **message**: `string`

Defined in: [core/src/types/validate-report.ts:47](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L47)

Warning message

***

### ruleId

> **ruleId**: `string`

Defined in: [core/src/types/validate-report.ts:45](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L45)

Validator rule id

#### Example

```ts
"PS008"
```

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [core/src/types/validate-report.ts:49](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L49)

Suggested fix