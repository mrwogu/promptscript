# GitRegistryOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GitRegistryOptions

Defined in: [resolver/src/git-registry.ts:95](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L95)

Options for GitRegistry.

## Properties

### auth?

> `optional` **auth?**: [`GitAuthOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GitAuthOptions/index.md)

Defined in: [resolver/src/git-registry.ts:111](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L111)

Authentication options

***

### cache?

> `optional` **cache?**: `object`

Defined in: [resolver/src/git-registry.ts:113](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L113)

Cache configuration

#### enabled?

> `optional` **enabled?**: `boolean`

Whether caching is enabled. Defaults to true

#### ttl?

> `optional` **ttl?**: `number`

Cache TTL in milliseconds. Defaults to 1 hour

***

### cacheDir?

> `optional` **cacheDir?**: `string`

Defined in: [resolver/src/git-registry.ts:109](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L109)

Cache directory override

***

### fallbackUrl?

> `optional` **fallbackUrl?**: `string`

Defined in: [resolver/src/git-registry.ts:103](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L103)

Fallback Git URL to try when the primary `url` fails with an auth error.
Useful when the registry references an HTTPS URL but the user authenticates
via SSH (or vice versa).

***

### path?

> `optional` **path?**: `string`

Defined in: [resolver/src/git-registry.ts:107](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L107)

Subdirectory within the repository to use as registry root

***

### ref?

> `optional` **ref?**: `string`

Defined in: [resolver/src/git-registry.ts:105](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L105)

Git ref to checkout (branch/tag/commit). Defaults to 'main'

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [resolver/src/git-registry.ts:120](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L120)

Request timeout in milliseconds for Git operations. Defaults to 60000 (1 minute)

***

### url

> **url**: `string`

Defined in: [resolver/src/git-registry.ts:97](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L97)

Git repository URL