# BasePolicyDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BasePolicyDefinition

Defined in: [core/src/types/policy.ts:32](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L32)

Base policy definition shared by all kinds.

## Extended by

- [`LayerBoundaryPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/LayerBoundaryPolicy/index.md)
- [`PropertyProtectionPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/PropertyProtectionPolicy/index.md)
- [`RegistryAllowlistPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/RegistryAllowlistPolicy/index.md)
- [`RequiredMetadataPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/RequiredMetadataPolicy/index.md)
- [`RiskFloorPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/RiskFloorPolicy/index.md)
- [`ModelAllowlistPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelAllowlistPolicy/index.md)
- [`RequiredApprovalsPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/RequiredApprovalsPolicy/index.md)
- [`RequiredEvalsPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/RequiredEvalsPolicy/index.md)
- [`MaxExperimentWeightPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/MaxExperimentWeightPolicy/index.md)
- [`ContentRulesPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/ContentRulesPolicy/index.md)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:36](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L36)

Human-readable description

***

### kind

> **kind**: [`PolicyKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyKind/index.md)

Defined in: [core/src/types/policy.ts:38](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L38)

Policy kind discriminator

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:34](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L34)

Unique policy name within the config

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:40](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L40)

Violation severity