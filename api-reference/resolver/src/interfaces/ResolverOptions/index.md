# ResolverOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ResolverOptions

Defined in: [resolver/src/resolver.ts:335](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L335)

Options for the resolver.

## Extends

- [`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md)

## Extended by

- [`ResolveOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolveOptions/index.md)

## Properties

### cache?

> `optional` **cache?**: `boolean`

Defined in: [resolver/src/resolver.ts:337](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L337)

Whether to cache resolved ASTs. Defaults to true.

***

### cacheDir?

> `optional` **cacheDir?**: `string`

Defined in: [resolver/src/resolver.ts:347](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L347)

Base directory for the registry cache (defaults to ~/.promptscript/cache)

***

### guardRequiresDepth?

> `optional` **guardRequiresDepth?**: `number`

Defined in: [resolver/src/resolver.ts:345](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L345)

Maximum depth for guard requires resolution. Defaults to 3.

***

### localPath?

> `optional` **localPath?**: `string`

Defined in: [resolver/src/loader.ts:64](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/loader.ts#L64)

Base path for local/relative file resolution (defaults to projectRoot, then cwd)

#### Inherited from

[`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md).[`localPath`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md#localpath)

***

### lockfile?

> `optional` **lockfile?**: [`Lockfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/Lockfile/index.md)

Defined in: [resolver/src/loader.ts:72](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/loader.ts#L72)

Lockfile for pinning remote dependencies

#### Inherited from

[`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md).[`lockfile`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md#lockfile)

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [resolver/src/resolver.ts:341](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L341)

Logger for verbose/debug output

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/loader.ts:66](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/loader.ts#L66)

Project root used as the traversal safety boundary

#### Inherited from

[`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md).[`projectRoot`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md#projectroot)

***

### readOnly?

> `optional` **readOnly?**: `boolean`

Defined in: [resolver/src/resolver.ts:339](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L339)

Refuse remote registry clones and cache metadata writes.

***

### referenceRoots?

> `optional` **referenceRoots?**: `Record`\<`string`, `string`[]\>

Defined in: [resolver/src/resolver.ts:351](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L351)

Repository roots that use a cache layout other than RegistryCache

***

### registries?

> `optional` **registries?**: [`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Defined in: [resolver/src/loader.ts:70](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/loader.ts#L70)

Registry alias configuration for remote imports

#### Inherited from

[`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md).[`registries`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md#registries)

***

### registry?

> `optional` **registry?**: [`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)

Defined in: [resolver/src/loader.ts:68](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/loader.ts#L68)

Optional Registry implementation for file fetching

#### Inherited from

[`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md).[`registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md#registry)

***

### registryPath

> **registryPath**: `string`

Defined in: [resolver/src/loader.ts:62](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/loader.ts#L62)

Base path for registry lookups (@namespace/...)

#### Inherited from

[`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md).[`registryPath`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md#registrypath)

***

### skills?

> `optional` **skills?**: [`NativeSkillOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/NativeSkillOptions/index.md)

Defined in: [resolver/src/resolver.ts:343](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L343)

Options for native skill resolution

***

### skillTargets?

> `optional` **skillTargets?**: `Record`\<`string`, `string`\>

Defined in: [resolver/src/resolver.ts:357](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L357)

Map from `@use` source `path.raw` to a target output directory.
Provides a config-driven default for skills imported via

#### Use

when no
inline `into "<path>"` clause is present on the directive.

***

### vendorDir?

> `optional` **vendorDir?**: `string`

Defined in: [resolver/src/resolver.ts:349](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/resolver.ts#L349)

Vendored registry directory to prefer over cache and network access