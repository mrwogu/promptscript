# createGitRegistry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createGitRegistry()

> **createGitRegistry**(`options`): [`GitRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/GitRegistry/index.md)

Defined in: [resolver/src/git-registry.ts:1249](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L1249)

Create a new GitRegistry instance.

## Parameters

### options

[`GitRegistryOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GitRegistryOptions/index.md)

Git registry options

## Returns

[`GitRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/GitRegistry/index.md)

GitRegistry instance

## Example

```typescript
// Public repository
const registry = createGitRegistry({
  url: 'https://github.com/org/promptscript-registry.git',
  ref: 'main',
  path: 'registry/',
});

// Private repository with token
const privateRegistry = createGitRegistry({
  url: 'https://github.com/org/private-registry.git',
  auth: {
    type: 'token',
    tokenEnvVar: 'GITHUB_TOKEN',
  },
});

// Fetch a file
const content = await registry.fetch('@company/base');

// Fetch a specific version
const v1Content = await registry.fetch('@company/base@v1.0.0');
```