# PolicyViolation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PolicyViolation

Defined in: [core/src/types/policy.ts:67](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L67)

A single policy violation.

## Properties

### kind

> **kind**: [`PolicyKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyKind/index.md)

Defined in: [core/src/types/policy.ts:71](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L71)

Policy kind

***

### message

> **message**: `string`

Defined in: [core/src/types/policy.ts:75](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L75)

Human-readable violation message

***

### policyName

> **policyName**: `string`

Defined in: [core/src/types/policy.ts:69](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L69)

Name of the violated policy

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:73](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L73)

Severity of the violation

***

### source?

> `optional` **source?**: `string`

Defined in: [core/src/types/policy.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L79)

Source file/skill where the violation occurred

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [core/src/types/policy.ts:77](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L77)

Suggested remediation