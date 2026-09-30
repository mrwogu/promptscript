# GitCacheManager

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitCacheManager

Defined in: [resolver/src/git-cache-manager.ts:84](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L84)

Manager for Git repository cache.

## Constructors

### Constructor

> **new GitCacheManager**(`options?`): `GitCacheManager`

Defined in: [resolver/src/git-cache-manager.ts:88](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L88)

#### Parameters

##### options?

[`GitCacheManagerOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GitCacheManagerOptions/index.md) = `{}`

#### Returns

`GitCacheManager`

## Methods

### cleanupStale()

> **cleanupStale**(): `Promise`\<`number`\>

Defined in: [resolver/src/git-cache-manager.ts:249](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L249)

Remove all stale cache entries.

#### Returns

`Promise`\<`number`\>

Number of entries removed

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [resolver/src/git-cache-manager.ts:263](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L263)

Remove all cache entries.

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`url`, `ref`): `Promise`\<[`CacheEntry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CacheEntry/index.md) \| `null`\>

Defined in: [resolver/src/git-cache-manager.ts:124](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L124)

Get a cache entry if it exists.

#### Parameters

##### url

`string`

Git repository URL

##### ref

`string`

Git ref (branch/tag/commit)

#### Returns

`Promise`\<[`CacheEntry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CacheEntry/index.md) \| `null`\>

Cache entry or null if not found

***

### getCachePath()

> **getCachePath**(`url`, `ref`): `string`

Defined in: [resolver/src/git-cache-manager.ts:100](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L100)

Get the cache directory for a given URL and ref.

#### Parameters

##### url

`string`

Git repository URL

##### ref

`string`

Git ref (branch/tag/commit)

#### Returns

`string`

Path to the cache directory

***

### getSize()

> **getSize**(): `Promise`\<`number`\>

Defined in: [resolver/src/git-cache-manager.ts:274](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L274)

Get the total size of the cache in bytes.

#### Returns

`Promise`\<`number`\>

Total cache size in bytes

***

### isValid()

> **isValid**(`url`, `ref`): `Promise`\<`boolean`\>

Defined in: [resolver/src/git-cache-manager.ts:112](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L112)

Check if a cache entry exists and is not stale.

#### Parameters

##### url

`string`

Git repository URL

##### ref

`string`

Git ref (branch/tag/commit)

#### Returns

`Promise`\<`boolean`\>

True if cache is valid (exists and not stale)

***

### list()

> **list**(): `Promise`\<[`CacheEntry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CacheEntry/index.md)[]\>

Defined in: [resolver/src/git-cache-manager.ts:219](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L219)

List all cache entries.

#### Returns

`Promise`\<[`CacheEntry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CacheEntry/index.md)[]\>

Array of cache entries

***

### remove()

> **remove**(`url`, `ref`): `Promise`\<`void`\>

Defined in: [resolver/src/git-cache-manager.ts:206](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L206)

Remove a cache entry.

#### Parameters

##### url

`string`

Git repository URL

##### ref

`string`

Git ref (branch/tag/commit)

#### Returns

`Promise`\<`void`\>

***

### set()

> **set**(`url`, `ref`, `commitHash`): `Promise`\<`string`\>

Defined in: [resolver/src/git-cache-manager.ts:153](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L153)

Create or update a cache entry.

#### Parameters

##### url

`string`

Git repository URL

##### ref

`string`

Git ref (branch/tag/commit)

##### commitHash

`string`

Current commit hash

#### Returns

`Promise`\<`string`\>

Path to the cache directory

***

### touch()

> **touch**(`url`, `ref`, `commitHash?`): `Promise`\<`void`\>

Defined in: [resolver/src/git-cache-manager.ts:184](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L184)

Update the lastUpdated timestamp for an existing cache entry.

#### Parameters

##### url

`string`

Git repository URL

##### ref

`string`

Git ref (branch/tag/commit)

##### commitHash?

`string`

Optional new commit hash (if fetch resulted in update)

#### Returns

`Promise`\<`void`\>