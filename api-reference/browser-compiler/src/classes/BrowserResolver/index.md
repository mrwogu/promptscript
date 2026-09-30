# BrowserResolver

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: BrowserResolver

Defined in: [browser-compiler/src/resolver.ts:339](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L339)

Browser-compatible resolver for PromptScript files with inheritance and import support.

This resolver uses an in-memory virtual file system instead of Node.js fs.

## Constructors

### Constructor

> **new BrowserResolver**(`options`): `BrowserResolver`

Defined in: [browser-compiler/src/resolver.ts:347](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L347)

#### Parameters

##### options

[`BrowserResolverOptions`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/BrowserResolverOptions/index.md)

#### Returns

`BrowserResolver`

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [browser-compiler/src/resolver.ts:1137](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L1137)

Clear the resolution cache.

#### Returns

`void`

***

### resolve()

> **resolve**(`entryPath`): `Promise`\<[`ResolvedAST`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/ResolvedAST/index.md)\>

Defined in: [browser-compiler/src/resolver.ts:362](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L362)

Resolve a PromptScript file and all its dependencies.

#### Parameters

##### entryPath

`string`

Path to the entry file

#### Returns

`Promise`\<[`ResolvedAST`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/ResolvedAST/index.md)\>

Resolved AST with sources and errors