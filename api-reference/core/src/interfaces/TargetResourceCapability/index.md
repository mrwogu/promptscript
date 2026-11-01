# TargetResourceCapability

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetResourceCapability

Defined in: [core/src/target-capabilities.ts:38](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L38)

## Properties

### conditional?

> `readonly` `optional` **conditional?**: `boolean`

Defined in: [core/src/target-capabilities.ts:46](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L46)

Whether the resource depends on a corresponding source block or setting.

***

### kind

> `readonly` **kind**: `"commands"` \| `"skills"` \| `"agents"` \| `"hooks"` \| `"plugins"` \| `"main"` \| `"mcp"`

Defined in: [core/src/target-capabilities.ts:40](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L40)

Resource category and generated file contract.

***

### path

> `readonly` **path**: `string`

Defined in: [core/src/target-capabilities.ts:42](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L42)

Relative path; `<name>` denotes a generated entry name.

***

### versions

> `readonly` **versions**: readonly `string`[]

Defined in: [core/src/target-capabilities.ts:44](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L44)

Formatter versions that can emit this resource.