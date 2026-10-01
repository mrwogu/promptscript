# BrowserCompiler

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: BrowserCompiler

Defined in: [browser-compiler/src/compiler.ts:158](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L158)

Browser-compatible compiler for PromptScript.

## Constructors

### Constructor

> **new BrowserCompiler**(`options`): `BrowserCompiler`

Defined in: [browser-compiler/src/compiler.ts:168](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L168)

#### Parameters

##### options

[`BrowserCompilerOptions`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/BrowserCompilerOptions/index.md)

#### Returns

`BrowserCompiler`

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [browser-compiler/src/compiler.ts:441](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L441)

Clear the resolution cache.

#### Returns

`void`

***

### compile()

> **compile**(`entryPath`): `Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileResult/index.md)\>

Defined in: [browser-compiler/src/compiler.ts:199](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L199)

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

Defined in: [browser-compiler/src/compiler.ts:434](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L434)

Get the configured formatters.

#### Returns

readonly [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)[]