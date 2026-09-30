# validateRemoteAccess()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateRemoteAccess()

> **validateRemoteAccess**(`repoUrl`, `ref?`, `options?`): `Promise`\<[`RemoteValidation`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RemoteValidation/index.md)\>

Defined in: [resolver/src/git-registry.ts:1314](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L1314)

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