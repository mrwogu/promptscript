# RegistriesConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: RegistriesConfig

> **RegistriesConfig** = `Record`\<`string`, `string` \| [`RegistryAliasEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/RegistryAliasEntry/index.md)\>

Defined in: [core/src/types/registries.ts:47](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/registries.ts#L47)

Registry alias configuration.
Maps alias names (e.g., '@acme') to Git URLs or extended entries.

## Example

```ts
registries:
  '@company': 'github.com/company/promptscript-base'
  '@internal':
    url: 'git@gitlab.internal.com:company/monorepo'
    root: 'packages/promptscript'
```