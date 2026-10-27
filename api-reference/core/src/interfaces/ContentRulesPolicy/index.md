# ContentRulesPolicy

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ContentRulesPolicy

Defined in: [core/src/types/policy.ts:218](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L218)

Content-rules policy: runs content checks and denied phrases on matched prompts.

## Extends

- [`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md)

## Properties

### allow?

> `optional` **allow?**: `string`[]

Defined in: [core/src/types/policy.ts:227](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L227)

Blocked-pattern sources exempt for matched prompts, as exact source text

***

### checks?

> `optional` **checks?**: [`ContentRuleCheck`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ContentRuleCheck/index.md)[]

Defined in: [core/src/types/policy.ts:223](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L223)

Validation rules to run on the prompt text

***

### deny?

> `optional` **deny?**: `string`[]

Defined in: [core/src/types/policy.ts:225](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L225)

Literal phrases the prompt text must not contain

***

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:31](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L31)

Human-readable description

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`description`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#description)

***

### kind

> **kind**: `"content-rules"`

Defined in: [core/src/types/policy.ts:219](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L219)

Policy kind discriminator

#### Overrides

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`kind`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#kind)

***

### match?

> `optional` **match?**: [`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md)

Defined in: [core/src/types/policy.ts:221](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L221)

Prompts the policy applies to

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:29](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L29)

Unique policy name within the config

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`name`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#name)

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:35](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L35)

Violation severity

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`severity`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#severity)