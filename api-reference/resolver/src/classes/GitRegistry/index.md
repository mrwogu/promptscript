# GitRegistry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitRegistry

Defined in: [resolver/src/git-registry.ts:173](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L173)

Git-based registry implementation.

## Implements

- [`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)

## Constructors

### Constructor

> **new GitRegistry**(`options`): `GitRegistry`

Defined in: [resolver/src/git-registry.ts:186](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L186)

#### Parameters

##### options

[`GitRegistryOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GitRegistryOptions/index.md)

#### Returns

`GitRegistry`

## Methods

### addSparsePaths()

> **addSparsePaths**(`targetDir`, `paths`): `Promise`\<`void`\>

Defined in: [resolver/src/git-registry.ts:540](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L540)

Add paths to an existing sparse checkout so their blobs are fetched
on demand. Used when a cached partial clone needs a subdirectory that
the original cone did not cover.

#### Parameters

##### targetDir

`string`

##### paths

readonly `string`[]

#### Returns

`Promise`\<`void`\>

***

### checkoutCommit()

> **checkoutCommit**(`targetDir`, `commit`): `Promise`\<`void`\>

Defined in: [resolver/src/git-registry.ts:305](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L305)

Checkout a specific commit in an already-cloned repository.
Used to enforce lockfile pinning: after cloning at a tag/branch,
checkout the exact commit recorded in the lockfile.

#### Parameters

##### targetDir

`string`

Path to the cloned repository

##### commit

`string`

Commit hash to checkout

#### Returns

`Promise`\<`void`\>

***

### cloneAtTag()

> **cloneAtTag**(`repoUrl`, `tag`, `targetDir`, `fallbackRepoUrl?`, `sparsePath?`): `Promise`\<`void`\>

Defined in: [resolver/src/git-registry.ts:411](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L411)

Clone a repo at a specific Git tag (shallow, depth=1).
When a `fallbackRepoUrl` is provided, auth errors trigger an automatic
retry with the fallback URL.

#### Parameters

##### repoUrl

`string`

Repository URL to clone

##### tag

`string` \| `undefined`

Git tag to check out, or undefined for the default branch

##### targetDir

`string`

Directory to clone into

##### fallbackRepoUrl?

`string`

Optional fallback URL to try on auth failure

##### sparsePath?

`string`

Optional subdirectory to limit the checkout to.
  Uses `--filter=blob:none --sparse` + `sparse-checkout` so only the
  blobs for that subdirectory are fetched. Falls back to a plain
  shallow clone when the server does not support partial clones.

#### Returns

`Promise`\<`void`\>

***

### cloneSparse()

> **cloneSparse**(`repoUrl`, `ref`, `targetDir`, `sparsePath`, `fallbackRepoUrl?`): `Promise`\<`void`\>

Defined in: [resolver/src/git-registry.ts:641](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L641)

Clone with sparse checkout — only fetch the requested path within the repo.
When a `fallbackRepoUrl` is provided, auth errors trigger an automatic
retry with the fallback URL.

#### Parameters

##### repoUrl

`string`

Repository URL

##### ref

`string`

Git ref (branch, tag, or commit)

##### targetDir

`string`

Directory to clone into

##### sparsePath

`string`

Subdirectory path to include in the sparse checkout

##### fallbackRepoUrl?

`string`

Optional fallback URL to try on auth failure

#### Returns

`Promise`\<`void`\>

***

### disableSparseCheckout()

> **disableSparseCheckout**(`targetDir`): `Promise`\<`void`\>

Defined in: [resolver/src/git-registry.ts:518](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L518)

Disable sparse-checkout, materializing the full working tree.
Used when a root-level import needs the whole repository but the
cached clone is partial.

#### Parameters

##### targetDir

`string`

#### Returns

`Promise`\<`void`\>

***

### exists()

> **exists**(`path`): `Promise`\<`boolean`\>

Defined in: [resolver/src/git-registry.ts:239](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L239)

Check if a file exists in the registry.

#### Parameters

##### path

`string`

Path to check (may include version tag)

#### Returns

`Promise`\<`boolean`\>

True if the file exists

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`exists`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#exists)

***

### fetch()

> **fetch**(`path`): `Promise`\<`string`\>

Defined in: [resolver/src/git-registry.ts:214](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L214)

Fetch the content of a file from the registry.

#### Parameters

##### path

`string`

Path to the file (may include version tag)

#### Returns

`Promise`\<`string`\>

File content as string

#### Throws

FileNotFoundError if the file doesn't exist

#### Throws

GitCloneError if cloning fails

#### Throws

GitRefNotFoundError if the ref doesn't exist

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`fetch`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#fetch)

***

### getCommitHash()

> **getCommitHash**(`ref?`): `Promise`\<`string`\>

Defined in: [resolver/src/git-registry.ts:380](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L380)

Get the current commit hash for a ref.

#### Parameters

##### ref?

`string`

Git ref (defaults to defaultRef)

#### Returns

`Promise`\<`string`\>

Commit hash

***

### isSparseCheckout()

> **isSparseCheckout**(`targetDir`): `Promise`\<`boolean`\>

Defined in: [resolver/src/git-registry.ts:503](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L503)

Check whether the checkout at `targetDir` uses sparse-checkout.

#### Parameters

##### targetDir

`string`

#### Returns

`Promise`\<`boolean`\>

***

### list()

> **list**(`path`): `Promise`\<`string`[]\>

Defined in: [resolver/src/git-registry.ts:263](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L263)

List files in a directory.

#### Parameters

##### path

`string`

Directory path (may include version tag)

#### Returns

`Promise`\<`string`[]\>

Array of file/directory names

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`list`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#list)

***

### listTags()

> **listTags**(`repoUrl`, `cache?`): `Promise`\<`string`[]\>

Defined in: [resolver/src/git-registry.ts:573](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L573)

List all semver tags from a remote repo.
Results are cached via RegistryCache to avoid repeated ls-remote calls.

#### Parameters

##### repoUrl

`string`

Repository URL

##### cache?

[`RegistryCache`](https://getpromptscript.dev/api-reference/resolver/src/classes/RegistryCache/index.md)

Optional RegistryCache (24-hour TTL for tag lists)

#### Returns

`Promise`\<`string`[]\>

Sorted semver tag strings

***

### refresh()

> **refresh**(`ref?`): `Promise`\<`void`\>

Defined in: [resolver/src/git-registry.ts:291](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L291)

Force refresh the cache for a specific ref.

#### Parameters

##### ref?

`string`

Git ref to refresh (defaults to defaultRef)

#### Returns

`Promise`\<`void`\>

***

### removeRemote()

> **removeRemote**(`targetDir`): `Promise`\<`void`\>

Defined in: [resolver/src/git-registry.ts:362](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L362)

Remove clone transport metadata before a repository is vendored.

#### Parameters

##### targetDir

`string`

#### Returns

`Promise`\<`void`\>

***

### resolveVersion()

> **resolveVersion**(`repoUrl`, `range`, `cache?`): `Promise`\<`string` \| `null`\>

Defined in: [resolver/src/git-registry.ts:621](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L621)

Resolve a semver range against available tags from a remote repo.

#### Parameters

##### repoUrl

`string`

Repository URL

##### range

`string` \| `string`[]

One or more semver ranges that the resolved tag must satisfy

##### cache?

[`RegistryCache`](https://getpromptscript.dev/api-reference/resolver/src/classes/RegistryCache/index.md)

Optional RegistryCache passed through to listTags

#### Returns

`Promise`\<`string` \| `null`\>

Best-matching tag string, or null if no tag satisfies the range