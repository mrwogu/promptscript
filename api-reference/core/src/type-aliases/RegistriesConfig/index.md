# RegistriesConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: RegistriesConfig

> **RegistriesConfig** = `Record`\<`string`, `string` \| [`RegistryAliasEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/RegistryAliasEntry/index.md)\>

Defined in: [core/src/types/registries.ts:47](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/registries.ts#L47)

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