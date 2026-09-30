# findFallbackUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findFallbackUrl()

> **findFallbackUrl**(`repoUrl`, `registries`): `string` \| `undefined`

Defined in: [resolver/src/alias-resolver.ts:226](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/alias-resolver.ts#L226)

Find the fallback URL for a given repository URL by scanning the registries config.

This is used when resolving registry imports where only the expanded `repoUrl`
is available (from the registry marker), but the `fallbackUrl` from the
original alias entry is still needed for clone retries.

## Parameters

### repoUrl

`string`

The primary repository URL to look up

### registries

[`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Registry alias configuration to search

## Returns

`string` \| `undefined`

The fallback URL if found, or undefined

## Example

```typescript
findFallbackUrl('https://github.com/acme/standards.git', {
  '@acme': { url: 'https://github.com/acme/standards.git', fallbackUrl: 'git@github.com:acme/standards.git' },
});
// 'git@github.com:acme/standards.git'
```