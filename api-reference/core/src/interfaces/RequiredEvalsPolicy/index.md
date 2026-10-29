# RequiredEvalsPolicy

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RequiredEvalsPolicy

Defined in: [core/src/types/policy.ts:191](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L191)

Required-evals policy: matched prompts need passing evals before promotion.

## Extends

- [`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:31](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L31)

Human-readable description

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`description`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#description)

***

### environments?

> `optional` **environments?**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)[]

Defined in: [core/src/types/policy.ts:199](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L199)

Environments from `releases.environments` the policy applies to. Absent means all.

#### Min Items

1

***

### kind

> **kind**: `"required-evals"`

Defined in: [core/src/types/policy.ts:192](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L192)

Policy kind discriminator

#### Overrides

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`kind`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#kind)

***

### match?

> `optional` **match?**: [`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md)

Defined in: [core/src/types/policy.ts:194](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L194)

Prompts the policy applies to

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:29](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L29)

Unique policy name within the config

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`name`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#name)

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:35](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L35)

Violation severity

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`severity`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#severity)