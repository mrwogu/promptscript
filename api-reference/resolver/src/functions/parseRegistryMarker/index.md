# parseRegistryMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseRegistryMarker()

> **parseRegistryMarker**(`marker`): \{ `path`: `string`; `repoUrl`: `string`; `version`: `string`; \} \| `null`

Defined in: [resolver/src/loader.ts:26](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L26)

Parse a registry marker string back into its components.

## Parameters

### marker

`string`

A string starting with `__registry__:`

## Returns

\{ `path`: `string`; `repoUrl`: `string`; `version`: `string`; \} \| `null`

Parsed components or null if not a valid marker