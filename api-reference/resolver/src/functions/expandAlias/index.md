# expandAlias()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: expandAlias()

> **expandAlias**(`aliasPath`, `registries`): [`ExpandedAlias`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ExpandedAlias/index.md)

Defined in: [resolver/src/alias-resolver.ts:150](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/alias-resolver.ts#L150)

Expand a registry alias path to its Git repository URL, sub-path, and version.

The `aliasPath` format is: `@alias/subpath[@version]`
- `@alias` — the registry alias name (must exist in `registries`)
- `/subpath` — the path within the repository (required)
- `@version` — optional version suffix (semver or tag, e.g., `@1.2.0`, `@v1.2.0`)

When the registry entry includes a `root`, the root is prepended to the subpath.

## Parameters

### aliasPath

`string`

Import path starting with an alias (e.g., `@acme/standards/security@1.2.0`)

### registries

[`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Registry alias configuration

## Returns

[`ExpandedAlias`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ExpandedAlias/index.md)

Expanded alias with resolved repo URL, path, and optional version

## Throws

When the alias is not found in the registries config

## Example

```typescript
expandAlias('@acme/standards/security@1.2.0', {
  '@acme': 'https://github.com/acme/prs-standards.git',
});
// { repoUrl: 'https://github.com/acme/prs-standards.git', path: 'standards/security', version: '1.2.0' }

expandAlias('@internal/auth', {
  '@internal': { url: 'git@gitlab.internal.com:company/monorepo', root: 'packages/prs' },
});
// { repoUrl: 'git@gitlab.internal.com:company/monorepo', path: 'packages/prs/auth' }
```