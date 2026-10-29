# findRegistryEntry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findRegistryEntry()

> **findRegistryEntry**(`repoUrl`, `registries`): [`RegistryAliasEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/RegistryAliasEntry/index.md) \| `undefined`

Defined in: [resolver/src/alias-resolver.ts:259](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/alias-resolver.ts#L259)

Find the extended registry entry for a given repository URL.

Used when only the expanded `repoUrl` is available (from a registry marker)
and the per-entry settings (e.g. `timeout`) are still needed.

## Parameters

### repoUrl

`string`

The primary repository URL to look up

### registries

[`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Registry alias configuration to search

## Returns

[`RegistryAliasEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/RegistryAliasEntry/index.md) \| `undefined`

The extended entry if found, or undefined (simple string entries
  and URL mismatches both return undefined)

## Example

```typescript
findRegistryEntry('https://gitlab.com/company/monorepo.git', {
  '@internal': { url: 'https://gitlab.com/company/monorepo.git', timeout: 600000 },
});
// { url: 'https://gitlab.com/company/monorepo.git', timeout: 600000 }
```