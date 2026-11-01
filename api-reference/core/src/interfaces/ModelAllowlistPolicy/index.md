# ModelAllowlistPolicy

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelAllowlistPolicy

Defined in: [core/src/types/policy.ts:144](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L144)

Model-allowlist policy: matched prompts must use one of the listed models.

## Extends

- [`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:32](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L32)

Human-readable description

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`description`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#description)

***

### kind

> **kind**: `"model-allowlist"`

Defined in: [core/src/types/policy.ts:145](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L145)

Policy kind discriminator

#### Overrides

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`kind`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#kind)

***

### match?

> `optional` **match?**: [`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md)

Defined in: [core/src/types/policy.ts:147](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L147)

Prompts the policy applies to

***

### models

> **models**: `string`[]

Defined in: [core/src/types/policy.ts:152](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L152)

Model catalog ids or aliases

#### Min Items

1

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:30](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L30)

Unique policy name within the config

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`name`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#name)

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:36](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L36)

Violation severity

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`severity`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#severity)