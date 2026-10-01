# TargetResourceCapability

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetResourceCapability

Defined in: [core/src/target-capabilities.ts:37](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/target-capabilities.ts#L37)

## Properties

### conditional?

> `readonly` `optional` **conditional?**: `boolean`

Defined in: [core/src/target-capabilities.ts:45](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/target-capabilities.ts#L45)

Whether the resource depends on a corresponding source block or setting.

***

### kind

> `readonly` **kind**: `"commands"` \| `"skills"` \| `"agents"` \| `"hooks"` \| `"plugins"` \| `"main"` \| `"mcp"`

Defined in: [core/src/target-capabilities.ts:39](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/target-capabilities.ts#L39)

Resource category and generated file contract.

***

### path

> `readonly` **path**: `string`

Defined in: [core/src/target-capabilities.ts:41](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/target-capabilities.ts#L41)

Relative path; `<name>` denotes a generated entry name.

***

### versions

> `readonly` **versions**: readonly `string`[]

Defined in: [core/src/target-capabilities.ts:43](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/target-capabilities.ts#L43)

Formatter versions that can emit this resource.