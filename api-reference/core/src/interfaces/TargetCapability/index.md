# TargetCapability

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetCapability

Defined in: [core/src/target-capabilities.ts:49](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L49)

## Extended by

- [`TargetDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetDefinition/index.md)

## Properties

### defaultVersion

> `readonly` **defaultVersion**: `string`

Defined in: [core/src/target-capabilities.ts:51](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L51)

***

### featureSupport

> `readonly` **featureSupport**: `Readonly`\<`Record`\<`string`, [`TargetFeatureStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetFeatureStatus/index.md)\>\>

Defined in: [core/src/target-capabilities.ts:55](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L55)

***

### hooks

> `readonly` **hooks**: [`HookCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/HookCapability/index.md)

Defined in: [core/src/target-capabilities.ts:56](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L56)

***

### mcpConfigFormat

> `readonly` **mcpConfigFormat**: `"json"` \| `"toml"` \| `null`

Defined in: [core/src/target-capabilities.ts:60](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L60)

***

### mcpConfigPath

> `readonly` **mcpConfigPath**: `string` \| `null`

Defined in: [core/src/target-capabilities.ts:59](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L59)

***

### referencesMode

> `readonly` **referencesMode**: [`TargetReferenceMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetReferenceMode/index.md)

Defined in: [core/src/target-capabilities.ts:53](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L53)

***

### resources

> `readonly` **resources**: readonly [`TargetResourceCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetResourceCapability/index.md)[]

Defined in: [core/src/target-capabilities.ts:57](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L57)

***

### sectionProfile

> `readonly` **sectionProfile**: [`SectionProfile`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SectionProfile/index.md)

Defined in: [core/src/target-capabilities.ts:62](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L62)

Section set the target renders.

***

### sections

> `readonly` **sections**: [`TargetSectionMap`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetSectionMap/index.md)

Defined in: [core/src/target-capabilities.ts:54](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L54)

***

### unsupportedBlocks

> `readonly` **unsupportedBlocks**: readonly `string`[]

Defined in: [core/src/target-capabilities.ts:58](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L58)

***

### versionAliases

> `readonly` **versionAliases**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/src/target-capabilities.ts:52](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L52)

***

### versions

> `readonly` **versions**: [`TargetVersionMap`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetVersionMap/index.md)

Defined in: [core/src/target-capabilities.ts:50](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L50)