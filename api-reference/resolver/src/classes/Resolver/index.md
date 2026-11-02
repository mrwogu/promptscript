# Resolver

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: Resolver

Defined in: [resolver/src/resolver.ts:473](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/resolver/src/resolver.ts#L473)

Resolver for PromptScript files with inheritance and import support.

Handles:
- @inherit: Single inheritance with deep merge
- @use: Import declarations
- @extend: Block modifications

## Example

```typescript
const resolver = new Resolver({
  registryPath: '/path/to/registry',
  localPath: '/path/to/project',
});

const result = await resolver.resolve('./instructions.prs');
if (result.ast) {
  console.log('Resolved successfully');
}
```

## Constructors

### Constructor

> **new Resolver**(`options`): `Resolver`

Defined in: [resolver/src/resolver.ts:483](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/resolver/src/resolver.ts#L483)

#### Parameters

##### options

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)

#### Returns

`Resolver`

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [resolver/src/resolver.ts:2293](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/resolver/src/resolver.ts#L2293)

Clear the resolution cache.

#### Returns

`void`

***

### getLoader()

> **getLoader**(): [`FileLoader`](https://getpromptscript.dev/api-reference/resolver/src/classes/FileLoader/index.md)

Defined in: [resolver/src/resolver.ts:2433](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/resolver/src/resolver.ts#L2433)

Get the file loader.

#### Returns

[`FileLoader`](https://getpromptscript.dev/api-reference/resolver/src/classes/FileLoader/index.md)

***

### invalidate()

> **invalidate**(`changedPaths`): `void`

Defined in: [resolver/src/resolver.ts:2302](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/resolver/src/resolver.ts#L2302)

Invalidate cached resolutions affected by changed files.

#### Parameters

##### changedPaths

readonly `string`[]

Files or directories that changed

#### Returns

`void`

***

### resolve()

> **resolve**(`entryPath`, `compositionContext?`): `Promise`\<[`ResolvedAST`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolvedAST/index.md)\>

Defined in: [resolver/src/resolver.ts:565](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/resolver/src/resolver.ts#L565)

Resolve a PromptScript file and all its dependencies.

#### Parameters

##### entryPath

`string`

Path to the entry file

##### compositionContext?

`CompositionResolutionContext`

#### Returns

`Promise`\<[`ResolvedAST`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolvedAST/index.md)\>

Resolved AST with sources and errors

#### Throws

CircularDependencyError if a circular dependency is detected

***

### verifyReferenceHashes()

> **verifyReferenceHashes**(`lockfile`): `Promise`\<[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)[]\>

Defined in: [resolver/src/resolver.ts:2338](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/resolver/src/resolver.ts#L2338)

Verify integrity hashes for registry reference files.
Reads each referenced file from the registry cache and compares its
hash against the lockfile entry.

#### Parameters

##### lockfile

[`Lockfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/Lockfile/index.md)

Lockfile with reference hashes

#### Returns

`Promise`\<[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)[]\>

Array of errors for mismatched references