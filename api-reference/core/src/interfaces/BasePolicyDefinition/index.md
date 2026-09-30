# BasePolicyDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BasePolicyDefinition

Defined in: [core/src/types/policy.ts:14](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L14)

Base policy definition shared by all kinds.

## Extended by

- [`LayerBoundaryPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/LayerBoundaryPolicy/index.md)
- [`PropertyProtectionPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/PropertyProtectionPolicy/index.md)
- [`RegistryAllowlistPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/RegistryAllowlistPolicy/index.md)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:18](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L18)

Human-readable description

***

### kind

> **kind**: [`PolicyKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyKind/index.md)

Defined in: [core/src/types/policy.ts:20](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L20)

Policy kind discriminator

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:16](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L16)

Unique policy name within the config

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:22](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/policy.ts#L22)

Violation severity