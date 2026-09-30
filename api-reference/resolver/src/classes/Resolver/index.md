# Resolver

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: Resolver

Defined in: [resolver/src/resolver.ts:442](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L442)

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

Defined in: [resolver/src/resolver.ts:452](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L452)

#### Parameters

##### options

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)

#### Returns

`Resolver`

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [resolver/src/resolver.ts:2259](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L2259)

Clear the resolution cache.

#### Returns

`void`

***

### getLoader()

> **getLoader**(): [`FileLoader`](https://getpromptscript.dev/api-reference/resolver/src/classes/FileLoader/index.md)

Defined in: [resolver/src/resolver.ts:2399](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L2399)

Get the file loader.

#### Returns

[`FileLoader`](https://getpromptscript.dev/api-reference/resolver/src/classes/FileLoader/index.md)

***

### invalidate()

> **invalidate**(`changedPaths`): `void`

Defined in: [resolver/src/resolver.ts:2268](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L2268)

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

Defined in: [resolver/src/resolver.ts:534](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L534)

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

Defined in: [resolver/src/resolver.ts:2304](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L2304)

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