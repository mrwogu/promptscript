# parseRegistryMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseRegistryMarker()

> **parseRegistryMarker**(`marker`): \{ `path`: `string`; `repoUrl`: `string`; `version`: `string`; \} \| `null`

Defined in: [resolver/src/loader.ts:28](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/resolver/src/loader.ts#L28)

Parse a registry marker string back into its components.

## Parameters

### marker

`string`

A string starting with `__registry__:`

## Returns

\{ `path`: `string`; `repoUrl`: `string`; `version`: `string`; \} \| `null`

Parsed components or null if not a valid marker