# Resolver

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: Resolver

Defined in: [resolver/src/resolver.ts:476](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/resolver.ts#L476)

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

Defined in: [resolver/src/resolver.ts:486](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/resolver.ts#L486)

#### Parameters

##### options

[`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)

#### Returns

`Resolver`

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [resolver/src/resolver.ts:2304](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/resolver.ts#L2304)

Clear the resolution cache.

#### Returns

`void`

***

### getLoader()

> **getLoader**(): [`FileLoader`](https://getpromptscript.dev/api-reference/resolver/src/classes/FileLoader/index.md)

Defined in: [resolver/src/resolver.ts:2444](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/resolver.ts#L2444)

Get the file loader.

#### Returns

[`FileLoader`](https://getpromptscript.dev/api-reference/resolver/src/classes/FileLoader/index.md)

***

### invalidate()

> **invalidate**(`changedPaths`): `void`

Defined in: [resolver/src/resolver.ts:2313](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/resolver.ts#L2313)

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

Defined in: [resolver/src/resolver.ts:568](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/resolver.ts#L568)

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

Defined in: [resolver/src/resolver.ts:2349](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/resolver.ts#L2349)

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