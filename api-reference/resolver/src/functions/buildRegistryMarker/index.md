# buildRegistryMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: buildRegistryMarker()

> **buildRegistryMarker**(`repoUrl`, `path`, `version`): `string`

Defined in: [resolver/src/loader.ts:49](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L49)

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