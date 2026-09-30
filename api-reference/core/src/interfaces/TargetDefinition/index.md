# TargetDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetDefinition

Defined in: [core/src/target-catalog.ts:64](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L64)

Complete metadata for a single built-in target.

## Extends

- [`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md)

## Properties

### defaultVersion

> `readonly` **defaultVersion**: `string`

Defined in: [core/src/target-capabilities.ts:50](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L50)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`defaultVersion`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#defaultversion)

***

### family

> **family**: [`TargetFamily`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetFamily/index.md)

Defined in: [core/src/target-catalog.ts:70](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L70)

Target family for classification

***

### features

> **features**: [`DefaultFeatureProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/DefaultFeatureProfile/index.md)

Defined in: [core/src/target-catalog.ts:74](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L74)

Default feature profile

***

### featureSupport

> `readonly` **featureSupport**: `Readonly`\<`Record`\<`string`, [`TargetFeatureStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetFeatureStatus/index.md)\>\>

Defined in: [core/src/target-capabilities.ts:54](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L54)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`featureSupport`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#featuresupport)

***

### hooks

> `readonly` **hooks**: [`HookCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/HookCapability/index.md)

Defined in: [core/src/target-capabilities.ts:55](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L55)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`hooks`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#hooks)

***

### mcpConfigFormat

> `readonly` **mcpConfigFormat**: `"json"` \| `"toml"` \| `null`

Defined in: [core/src/target-capabilities.ts:59](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L59)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`mcpConfigFormat`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#mcpconfigformat)

***

### mcpConfigPath

> `readonly` **mcpConfigPath**: `string` \| `null`

Defined in: [core/src/target-capabilities.ts:58](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L58)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`mcpConfigPath`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#mcpconfigpath)

***

### name

> **name**: [`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

Defined in: [core/src/target-catalog.ts:66](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L66)

Canonical target name (matches KnownTarget union member)

***

### outputPath

> **outputPath**: `string`

Defined in: [core/src/target-catalog.ts:68](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L68)

Default output file path

***

### referencesMode

> `readonly` **referencesMode**: [`TargetReferenceMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetReferenceMode/index.md)

Defined in: [core/src/target-capabilities.ts:52](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L52)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`referencesMode`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#referencesmode)

***

### resources

> `readonly` **resources**: readonly [`TargetResourceCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetResourceCapability/index.md)[]

Defined in: [core/src/target-capabilities.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L56)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`resources`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#resources)

***

### sections

> `readonly` **sections**: [`TargetSectionMap`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetSectionMap/index.md)

Defined in: [core/src/target-capabilities.ts:53](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L53)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`sections`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#sections)

***

### skillPath

> **skillPath**: [`SkillPathConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillPathConfig/index.md)

Defined in: [core/src/target-catalog.ts:72](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L72)

Skill path configuration

***

### unsupportedBlocks

> `readonly` **unsupportedBlocks**: readonly `string`[]

Defined in: [core/src/target-capabilities.ts:57](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L57)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`unsupportedBlocks`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#unsupportedblocks)

***

### versionAliases

> `readonly` **versionAliases**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/src/target-capabilities.ts:51](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L51)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`versionAliases`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#versionaliases)

***

### versions

> `readonly` **versions**: [`TargetVersionMap`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetVersionMap/index.md)

Defined in: [core/src/target-capabilities.ts:49](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L49)

#### Inherited from

[`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md).[`versions`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md#versions)