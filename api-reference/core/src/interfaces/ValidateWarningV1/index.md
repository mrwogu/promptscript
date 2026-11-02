# ValidateWarningV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateWarningV1

Defined in: [core/src/types/validate-report.ts:46](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/validate-report.ts#L46)

One warning of `prs validate`. With `--strict` a warning fails the run.

## Properties

### location?

> `optional` **location?**: [`ValidateLocationV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateLocationV1/index.md)

Defined in: [core/src/types/validate-report.ts:57](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/validate-report.ts#L57)

Where the warning is

***

### message

> **message**: `string`

Defined in: [core/src/types/validate-report.ts:53](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/validate-report.ts#L53)

Warning message

***

### ruleId

> **ruleId**: `string`

Defined in: [core/src/types/validate-report.ts:51](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/validate-report.ts#L51)

Validator rule id

#### Example

```ts
"PS008"
```

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [core/src/types/validate-report.ts:55](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/validate-report.ts#L55)

Suggested fix