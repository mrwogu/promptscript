# ExpandedAlias

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ExpandedAlias

Defined in: [resolver/src/alias-resolver.ts:17](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/alias-resolver.ts#L17)

Result of expanding a registry alias path.

## Properties

### fallbackUrl?

> `optional` **fallbackUrl?**: `string`

Defined in: [resolver/src/alias-resolver.ts:24](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/alias-resolver.ts#L24)

Fallback Git URL to try when the primary `repoUrl` fails with an auth error.
Populated from `fallbackUrl` in the registry alias entry.

***

### path

> **path**: `string`

Defined in: [resolver/src/alias-resolver.ts:26](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/alias-resolver.ts#L26)

Path within the repository (subPath, with root prepended if configured)

***

### repoUrl

> **repoUrl**: `string`

Defined in: [resolver/src/alias-resolver.ts:19](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/alias-resolver.ts#L19)

Resolved Git repository URL (HTTPS or SSH)

***

### version?

> `optional` **version?**: `string`

Defined in: [resolver/src/alias-resolver.ts:28](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/alias-resolver.ts#L28)

Optional version tag or semver string (e.g., 'v1.2.0', '1.2.3')