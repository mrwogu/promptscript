# PropertyProtectionPolicy

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PropertyProtectionPolicy

Defined in: [core/src/types/policy.ts:52](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L52)

Property-protection policy: prevents overriding specific properties.

## Extends

- [`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:31](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L31)

Human-readable description

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`description`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#description)

***

### kind

> **kind**: `"property-protection"`

Defined in: [core/src/types/policy.ts:53](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L53)

Policy kind discriminator

#### Overrides

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`kind`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#kind)

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:29](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L29)

Unique policy name within the config

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`name`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#name)

***

### properties

> **properties**: `string`[]

Defined in: [core/src/types/policy.ts:55](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L55)

Properties that cannot be overridden

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:35](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L35)

Violation severity

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`severity`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#severity)

***

### targetPattern?

> `optional` **targetPattern?**: `string`

Defined in: [core/src/types/policy.ts:57](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L57)

Glob pattern for target skills (e.g., '@core/*'). If omitted, applies to all.