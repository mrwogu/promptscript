# RegistryAliasEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RegistryAliasEntry

Defined in: [core/src/types/registries.ts:4](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/registries.ts#L4)

Extended registry alias entry for monorepos or custom roots.

## Properties

### fallbackUrl?

> `optional` **fallbackUrl?**: `string`

Defined in: [core/src/types/registries.ts:18](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/registries.ts#L18)

Fallback Git URL to try when the primary `url` fails with an auth error.
Useful when registries reference HTTPS URLs but the user authenticates
via SSH (or vice versa).

#### Example

```ts
registries:
  '@acme':
    url: 'https://github.com/acme/standards.git'
    fallbackUrl: 'git@github.com:acme/standards.git'
```

***

### root?

> `optional` **root?**: `string`

Defined in: [core/src/types/registries.ts:20](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/registries.ts#L20)

Base path within the repository

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [core/src/types/registries.ts:33](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/registries.ts#L33)

Maximum wall-clock time in milliseconds for each Git operation
(clone, fetch, ls-remote) against this repository.
Defaults to 60000; can also be raised globally via PROMPTSCRIPT_GIT_TIMEOUT.

#### Example

```ts
registries:
  '@internal':
    url: 'git@gitlab.internal.com:company/monorepo'
    root: 'packages/promptscript'
    timeout: 600000
```

***

### url

> **url**: `string`

Defined in: [core/src/types/registries.ts:6](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/registries.ts#L6)

Git repository URL (HTTPS or SSH)