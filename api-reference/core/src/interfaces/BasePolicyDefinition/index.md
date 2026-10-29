# BasePolicyDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BasePolicyDefinition

Defined in: [core/src/types/policy.ts:27](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L27)

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
- [`ContentRulesPolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/ContentRulesPolicy/index.md)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:31](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L31)

Human-readable description

***

### kind

> **kind**: [`PolicyKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyKind/index.md)

Defined in: [core/src/types/policy.ts:33](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L33)

Policy kind discriminator

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:29](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L29)

Unique policy name within the config

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:35](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L35)

Violation severity