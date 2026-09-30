# ResolveOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ResolveOptions

Defined in: [resolver/src/index.ts:203](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/index.ts#L203)

Options for standalone resolve function.

## Extends

- [`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)

## Properties

### cache?

> `optional` **cache?**: `boolean`

Defined in: [resolver/src/resolver.ts:306](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L306)

Whether to cache resolved ASTs. Defaults to true.

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`cache`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#cache)

***

### cacheDir?

> `optional` **cacheDir?**: `string`

Defined in: [resolver/src/resolver.ts:316](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L316)

Base directory for the registry cache (defaults to ~/.promptscript/cache)

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`cacheDir`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#cachedir)

***

### guardRequiresDepth?

> `optional` **guardRequiresDepth?**: `number`

Defined in: [resolver/src/resolver.ts:314](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L314)

Maximum depth for guard requires resolution. Defaults to 3.

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`guardRequiresDepth`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#guardrequiresdepth)

***

### localPath?

> `optional` **localPath?**: `string`

Defined in: [resolver/src/loader.ts:60](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L60)

Base path for local/relative file resolution (defaults to projectRoot, then cwd)

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`localPath`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#localpath)

***

### lockfile?

> `optional` **lockfile?**: [`Lockfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/Lockfile/index.md)

Defined in: [resolver/src/loader.ts:68](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L68)

Lockfile for pinning remote dependencies

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`lockfile`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#lockfile)

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [resolver/src/resolver.ts:310](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L310)

Logger for verbose/debug output

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`logger`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#logger)

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/loader.ts:62](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L62)

Project root used as the traversal safety boundary

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`projectRoot`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#projectroot)

***

### readOnly?

> `optional` **readOnly?**: `boolean`

Defined in: [resolver/src/resolver.ts:308](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L308)

Refuse remote registry clones and cache metadata writes.

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`readOnly`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#readonly)

***

### referenceRoots?

> `optional` **referenceRoots?**: `Record`\<`string`, `string`[]\>

Defined in: [resolver/src/resolver.ts:320](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L320)

Repository roots that use a cache layout other than RegistryCache

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`referenceRoots`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#referenceroots)

***

### registries?

> `optional` **registries?**: [`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Defined in: [resolver/src/loader.ts:66](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L66)

Registry alias configuration for remote imports

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`registries`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#registries)

***

### registry?

> `optional` **registry?**: [`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)

Defined in: [resolver/src/loader.ts:64](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L64)

Optional Registry implementation for file fetching

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#registry)

***

### registryPath

> **registryPath**: `string`

Defined in: [resolver/src/loader.ts:58](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L58)

Base path for registry lookups (@namespace/...)

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`registryPath`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#registrypath)

***

### resolver?

> `optional` **resolver?**: `Resolver`

Defined in: [resolver/src/index.ts:205](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/index.ts#L205)

Reuse an existing resolver instance

***

### skills?

> `optional` **skills?**: [`NativeSkillOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/NativeSkillOptions/index.md)

Defined in: [resolver/src/resolver.ts:312](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L312)

Options for native skill resolution

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`skills`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#skills)

***

### skillTargets?

> `optional` **skillTargets?**: `Record`\<`string`, `string`\>

Defined in: [resolver/src/resolver.ts:326](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L326)

Map from `@use` source `path.raw` to a target output directory.
Provides a config-driven default for skills imported via

#### Use

when no
inline `into "<path>"` clause is present on the directive.

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`skillTargets`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#skilltargets)

***

### vendorDir?

> `optional` **vendorDir?**: `string`

Defined in: [resolver/src/resolver.ts:318](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L318)

Vendored registry directory to prefer over cache and network access

#### Inherited from

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md).[`vendorDir`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md#vendordir)