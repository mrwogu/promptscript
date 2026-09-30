# RegistryCache

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: RegistryCache

Defined in: [resolver/src/registry-cache.ts:27](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L27)

Hierarchical cache for registry imports.
Layout: <baseDir>/registries/<host>/<owner>/<repo>/<version>/
Separate from the existing GitCacheManager flat hash cache.

## Constructors

### Constructor

> **new RegistryCache**(`baseDir`): `RegistryCache`

Defined in: [resolver/src/registry-cache.ts:28](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L28)

#### Parameters

##### baseDir

`string`

#### Returns

`RegistryCache`

## Methods

### getCachePath()

> **getCachePath**(`repoUrl`, `version`): `string`

Defined in: [resolver/src/registry-cache.ts:30](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L30)

#### Parameters

##### repoUrl

`string`

##### version

`string`

#### Returns

`string`

***

### getMeta()

> **getMeta**(`repoUrl`, `version`): `Promise`\<`CacheMeta` \| `null`\>

Defined in: [resolver/src/registry-cache.ts:92](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L92)

#### Parameters

##### repoUrl

`string`

##### version

`string`

#### Returns

`Promise`\<`CacheMeta` \| `null`\>

***

### getTagsMeta()

> **getTagsMeta**(`repoUrl`): `Promise`\<\{ `fetchedAt`: `number`; `tags`: `string`[]; \} \| `null`\>

Defined in: [resolver/src/registry-cache.ts:104](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L104)

Get cached tag list for a repo (for semver range resolution)

#### Parameters

##### repoUrl

`string`

#### Returns

`Promise`\<\{ `fetchedAt`: `number`; `tags`: `string`[]; \} \| `null`\>

***

### has()

> **has**(`repoUrl`, `version`): `Promise`\<`boolean`\>

Defined in: [resolver/src/registry-cache.ts:42](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L42)

#### Parameters

##### repoUrl

`string`

##### version

`string`

#### Returns

`Promise`\<`boolean`\>

***

### isStale()

> **isStale**(`repoUrl`, `version`, `ttlMs`): `Promise`\<`boolean`\>

Defined in: [resolver/src/registry-cache.ts:76](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L76)

#### Parameters

##### repoUrl

`string`

##### version

`string`

##### ttlMs

`number`

#### Returns

`Promise`\<`boolean`\>

***

### set()

> **set**(`repoUrl`, `version`, `commit`): `Promise`\<`string`\>

Defined in: [resolver/src/registry-cache.ts:52](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L52)

#### Parameters

##### repoUrl

`string`

##### version

`string`

##### commit

`string`

#### Returns

`Promise`\<`string`\>

***

### setTagsMeta()

> **setTagsMeta**(`repoUrl`, `tags`): `Promise`\<`void`\>

Defined in: [resolver/src/registry-cache.ts:117](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry-cache.ts#L117)

Cache tag list for a repo

#### Parameters

##### repoUrl

`string`

##### tags

`string`[]

#### Returns

`Promise`\<`void`\>