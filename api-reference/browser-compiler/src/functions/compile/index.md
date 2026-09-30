# compile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: compile()

> **compile**(`files`, `entryPath`, `options?`): `Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileResult/index.md)\>

Defined in: [browser-compiler/src/index.ts:155](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L155)

Compile PromptScript files in the browser.

This is the main entry point for browser-based compilation.
It creates a virtual file system from the provided files and
runs the full compilation pipeline.

## Parameters

### files

`Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>

Map of file paths to contents

### entryPath

`string`

Path to the entry file (e.g., "project.prs")

### options?

[`CompileOptions`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileOptions/index.md) = `{}`

Compilation options

## Returns

`Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileResult/index.md)\>

Compilation result with outputs for all formatters

## Example

```typescript
const files = new Map([
  ['project.prs', '@meta { id: "demo" syntax: "1.0.0" }'],
]);

const result = await compile(files, 'project.prs');

if (result.success) {
  // Get Claude output
  const claudeOutput = result.outputs.get('CLAUDE.md');
  console.log(claudeOutput?.content);
}
```