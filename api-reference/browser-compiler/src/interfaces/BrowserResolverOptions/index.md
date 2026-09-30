# BrowserResolverOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BrowserResolverOptions

Defined in: [browser-compiler/src/resolver.ts:200](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L200)

Options for the browser resolver.

## Properties

### cache?

> `optional` **cache?**: `boolean`

Defined in: [browser-compiler/src/resolver.ts:204](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L204)

Whether to cache resolved ASTs. Defaults to true.

***

### envVars?

> `optional` **envVars?**: `Record`\<`string`, `string`\>

Defined in: [browser-compiler/src/resolver.ts:212](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L212)

Simulated environment variables for interpolation.
When provided, ${VAR} and ${VAR:-default} syntax in source files
will be replaced with values from this map.

***

### fs

> **fs**: [`VirtualFileSystem`](https://getpromptscript.dev/api-reference/browser-compiler/src/classes/VirtualFileSystem/index.md)

Defined in: [browser-compiler/src/resolver.ts:202](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L202)

Virtual file system containing all files

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [browser-compiler/src/resolver.ts:206](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L206)

Logger for verbose/debug output