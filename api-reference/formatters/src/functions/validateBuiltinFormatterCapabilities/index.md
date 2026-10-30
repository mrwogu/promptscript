# validateBuiltinFormatterCapabilities()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateBuiltinFormatterCapabilities()

> **validateBuiltinFormatterCapabilities**(): `string`[]

Defined in: [formatters/src/target-capability-consistency.ts:25](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/target-capability-consistency.ts#L25)

Find drift between canonical target metadata and formatter registrations.

The returned messages are intended for CI assertions and include the target
and metadata field that needs correction.

## Returns

`string`[]