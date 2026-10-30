# RequiredApprovalsPolicy

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RequiredApprovalsPolicy

Defined in: [core/src/types/policy.ts:173](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L173)

Required-approvals policy: matched prompts need approvals before promotion.

## Extends

- [`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md)

## Properties

### approvals

> **approvals**: [`RequiredApproval`](https://getpromptscript.dev/api-reference/core/src/interfaces/RequiredApproval/index.md)[]

Defined in: [core/src/types/policy.ts:186](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L186)

Approvals per role

#### Min Items

1

***

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:32](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L32)

Human-readable description

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`description`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#description)

***

### environments?

> `optional` **environments?**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)[]

Defined in: [core/src/types/policy.ts:181](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L181)

Environments from `releases.environments` the policy applies to. Absent means all.

#### Min Items

1

***

### kind

> **kind**: `"required-approvals"`

Defined in: [core/src/types/policy.ts:174](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L174)

Policy kind discriminator

#### Overrides

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`kind`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#kind)

***

### match?

> `optional` **match?**: [`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md)

Defined in: [core/src/types/policy.ts:176](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L176)

Prompts the policy applies to

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:30](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L30)

Unique policy name within the config

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`name`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#name)

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:36](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L36)

Violation severity

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`severity`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#severity)