# buildRegistryMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: buildRegistryMarker()

> **buildRegistryMarker**(`repoUrl`, `path`, `version`): `string`

Defined in: [resolver/src/loader.ts:49](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/resolver/src/loader.ts#L49)

Build a registry marker string from its components.

## Parameters

### repoUrl

`string`

Git repository URL

### path

`string`

Path within the repository

### version

`string`

Version tag (use empty string for latest/default)

## Returns

`string`

Marker string for Resolver to intercept