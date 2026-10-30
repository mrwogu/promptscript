# ContentRulesPolicy

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ContentRulesPolicy

Defined in: [core/src/types/policy.ts:252](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L252)

Content-rules policy: runs content checks and denied phrases on matched prompts.

## Extends

- [`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md)

## Properties

### allow?

> `optional` **allow?**: `string`[]

Defined in: [core/src/types/policy.ts:261](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L261)

Blocked-pattern sources exempt for matched prompts, as exact source text

***

### checks?

> `optional` **checks?**: [`ContentRuleCheck`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ContentRuleCheck/index.md)[]

Defined in: [core/src/types/policy.ts:257](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L257)

Validation rules to run on the prompt text

***

### deny?

> `optional` **deny?**: `string`[]

Defined in: [core/src/types/policy.ts:259](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L259)

Literal phrases the prompt text must not contain

***

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:32](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L32)

Human-readable description

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`description`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#description)

***

### kind

> **kind**: `"content-rules"`

Defined in: [core/src/types/policy.ts:253](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L253)

Policy kind discriminator

#### Overrides

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`kind`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#kind)

***

### match?

> `optional` **match?**: [`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md)

Defined in: [core/src/types/policy.ts:255](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L255)

Prompts the policy applies to

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:30](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L30)

Unique policy name within the config

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`name`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#name)

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:36](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/policy.ts#L36)

Violation severity

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`severity`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#severity)