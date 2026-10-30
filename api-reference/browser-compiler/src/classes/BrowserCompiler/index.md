# BrowserCompiler

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: BrowserCompiler

Defined in: [browser-compiler/src/compiler.ts:162](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L162)

Browser-compatible compiler for PromptScript.

## Constructors

### Constructor

> **new BrowserCompiler**(`options`): `BrowserCompiler`

Defined in: [browser-compiler/src/compiler.ts:172](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L172)

#### Parameters

##### options

[`BrowserCompilerOptions`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/BrowserCompilerOptions/index.md)

#### Returns

`BrowserCompiler`

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [browser-compiler/src/compiler.ts:456](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L456)

Clear the resolution cache.

#### Returns

`void`

***

### compile()

> **compile**(`entryPath`): `Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileResult/index.md)\>

Defined in: [browser-compiler/src/compiler.ts:204](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L204)

Compile a PromptScript file through the full pipeline.

#### Parameters

##### entryPath

`string`

Path to the entry file in the virtual file system

#### Returns

`Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileResult/index.md)\>

Compilation result with outputs, errors, and stats

***

### getFormatters()

> **getFormatters**(): readonly [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)[]

Defined in: [browser-compiler/src/compiler.ts:449](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L449)

Get the configured formatters.

#### Returns

readonly [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)[]