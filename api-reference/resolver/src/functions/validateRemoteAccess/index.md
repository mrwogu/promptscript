# validateRemoteAccess()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateRemoteAccess()

> **validateRemoteAccess**(`repoUrl`, `ref?`, `options?`): `Promise`\<[`RemoteValidation`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RemoteValidation/index.md)\>

Defined in: [resolver/src/git-registry.ts:1330](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L1330)

Validate that a remote Git repository is accessible via `git ls-remote`.

Use this before writing a lockfile entry to catch auth/network problems early
and surface actionable error messages rather than failing silently at clone time.

## Parameters

### repoUrl

`string`

Repository URL to check (HTTPS or SSH)

### ref?

`string`

Optional branch, tag, or commit to resolve

### options?

[`RemoteValidationOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RemoteValidationOptions/index.md) = `{}`

Optional Git operation timeout

## Returns

`Promise`\<[`RemoteValidation`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RemoteValidation/index.md)\>

RemoteValidation result with accessibility status and optional commit hash