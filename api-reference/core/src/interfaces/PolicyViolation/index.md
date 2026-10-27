# PolicyViolation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PolicyViolation

Defined in: [core/src/types/policy.ts:265](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L265)

A single policy violation.

## Properties

### kind

> **kind**: [`PolicyKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyKind/index.md)

Defined in: [core/src/types/policy.ts:269](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L269)

Policy kind

***

### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/policy.ts:279](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L279)

Location of the prompt that breaks a prompt policy

***

### message

> **message**: `string`

Defined in: [core/src/types/policy.ts:273](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L273)

Human-readable violation message

***

### policyName

> **policyName**: `string`

Defined in: [core/src/types/policy.ts:267](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L267)

Name of the violated policy

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:271](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L271)

Severity of the violation

***

### source?

> `optional` **source?**: `string`

Defined in: [core/src/types/policy.ts:277](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L277)

Source file/skill where the violation occurred

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [core/src/types/policy.ts:275](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L275)

Suggested remediation