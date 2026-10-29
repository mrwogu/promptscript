# buildRegistryMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: buildRegistryMarker()

> **buildRegistryMarker**(`repoUrl`, `path`, `version`): `string`

Defined in: [resolver/src/loader.ts:49](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/loader.ts#L49)

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