# PolicyViolation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PolicyViolation

Defined in: [core/src/types/policy.ts:300](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L300)

A single policy violation.

## Properties

### kind

> **kind**: [`PolicyKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyKind/index.md)

Defined in: [core/src/types/policy.ts:304](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L304)

Policy kind

***

### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/policy.ts:314](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L314)

Location of the prompt that breaks a prompt policy

***

### message

> **message**: `string`

Defined in: [core/src/types/policy.ts:308](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L308)

Human-readable violation message

***

### policyName

> **policyName**: `string`

Defined in: [core/src/types/policy.ts:302](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L302)

Name of the violated policy

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:306](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L306)

Severity of the violation

***

### source?

> `optional` **source?**: `string`

Defined in: [core/src/types/policy.ts:312](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L312)

Source file/skill where the violation occurred

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [core/src/types/policy.ts:310](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L310)

Suggested remediation