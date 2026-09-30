# LoaderOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: LoaderOptions

Defined in: [resolver/src/loader.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L56)

Options for the file loader.

## Extended by

- [`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)

## Properties

### localPath?

> `optional` **localPath?**: `string`

Defined in: [resolver/src/loader.ts:60](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L60)

Base path for local/relative file resolution (defaults to projectRoot, then cwd)

***

### lockfile?

> `optional` **lockfile?**: [`Lockfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/Lockfile/index.md)

Defined in: [resolver/src/loader.ts:68](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L68)

Lockfile for pinning remote dependencies

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/loader.ts:62](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L62)

Project root used as the traversal safety boundary

***

### registries?

> `optional` **registries?**: [`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Defined in: [resolver/src/loader.ts:66](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L66)

Registry alias configuration for remote imports

***

### registry?

> `optional` **registry?**: [`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)

Defined in: [resolver/src/loader.ts:64](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L64)

Optional Registry implementation for file fetching

***

### registryPath

> **registryPath**: `string`

Defined in: [resolver/src/loader.ts:58](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L58)

Base path for registry lookups (@namespace/...)