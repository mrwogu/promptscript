# isGeneratedByPromptScript()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isGeneratedByPromptScript()

> **isGeneratedByPromptScript**(`content`): `boolean`

Defined in: [core/src/utils/markers.ts:45](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/markers.ts#L45)

Check whether content starts with a PromptScript generation marker.

Only the head of the file is inspected so markers quoted inside prose are
not mistaken for a generation marker.

## Parameters

### content

`string`

File content to inspect

## Returns

`boolean`

True when the file was produced by PromptScript