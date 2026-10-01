# Compiler

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: Compiler

Defined in: [compiler/src/compiler.ts:259](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/compiler.ts#L259)

Compiler that orchestrates the PromptScript compilation pipeline.

Pipeline stages:
1. Resolve - Parse and resolve inheritance/imports
2. Validate - Check AST against validation rules
3. Format - Generate output for target platforms

## Example

```typescript
const compiler = new Compiler({
  resolver: { registryPath: './registry' },
  validator: { requiredGuards: ['@core/guards/compliance'] },
  formatters: [new GitHubFormatter()],
});

const result = await compiler.compile('./project.prs');
if (result.success) {
  for (const [outputPath, output] of result.outputs) {
    console.log(`Generated: ${outputPath}`);
  }
}
```

## Constructors

### Constructor

> **new Compiler**(`options`): `Compiler`

Defined in: [compiler/src/compiler.ts:270](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/compiler.ts#L270)

#### Parameters

##### options

[`CompilerOptions`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompilerOptions/index.md)

#### Returns

`Compiler`

## Methods

### compile()

> **compile**(`entryPath`): `Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)\>

Defined in: [compiler/src/compiler.ts:424](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/compiler.ts#L424)

Compile a PromptScript file through the full pipeline.

#### Parameters

##### entryPath

`string`

Path to the entry file

#### Returns

`Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)\>

Compilation result with outputs, errors, and stats

***

### compileAll()

> **compileAll**(`entryPath`): `Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)\>

Defined in: [compiler/src/compiler.ts:985](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/compiler.ts#L985)

Compile to all registered formatters.
Useful when you want to ensure all formatters are used regardless of config.

#### Parameters

##### entryPath

`string`

Path to the entry file

#### Returns

`Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)\>

Compilation result with all formatter outputs

***

### compileFile()

> **compileFile**(`filePath`): `Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)\>

Defined in: [compiler/src/compiler.ts:974](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/compiler.ts#L974)

Compile a PromptScript file from a file path.
This is an alias for compile() for consistency with the documented API.

#### Parameters

##### filePath

`string`

Path to the PromptScript file

#### Returns

`Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)\>

Compilation result

***

### getFormatters()

> **getFormatters**(): readonly [`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md)[]

Defined in: [compiler/src/compiler.ts:963](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/compiler.ts#L963)

Get the configured formatters.

#### Returns

readonly [`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md)[]

***

### watch()

> **watch**(`entryPath`, `options?`): `Promise`\<[`Watcher`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Watcher/index.md)\>

Defined in: [compiler/src/compiler.ts:1019](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/compiler.ts#L1019)

Watch for file changes and recompile automatically.

#### Parameters

##### entryPath

`string`

Path to the entry file to compile

##### options?

[`WatchOptions`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/WatchOptions/index.md) = `{}`

Watch options

#### Returns

`Promise`\<[`Watcher`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Watcher/index.md)\>

Watcher handle to control the watch process

#### Example

```typescript
const watcher = await compiler.watch('./project.prs', {
  onCompile: (result) => {
    if (result.success) {
      console.log('Compiled successfully');
    }
  },
});

// Later, stop watching
await watcher.close();
```