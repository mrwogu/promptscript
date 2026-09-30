# parseRegistryMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseRegistryMarker()

> **parseRegistryMarker**(`marker`): \{ `path`: `string`; `repoUrl`: `string`; `version`: `string`; \} \| `null`

Defined in: [resolver/src/loader.ts:26](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L26)

Parse a registry marker string back into its components.

## Parameters

### marker

`string`

A string starting with `__registry__:`

## Returns

\{ `path`: `string`; `repoUrl`: `string`; `version`: `string`; \} \| `null`

Parsed components or null if not a valid marker