# parseFile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseFile()

> **parseFile**(`filePath`, `options?`): [`ParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseResult/index.md)

Defined in: [parser/src/parse.ts:259](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/parser/src/parse.ts#L259)

Parse a PromptScript file from disk.

## Parameters

### filePath

`string`

Path to the .prs file

### options?

`Omit`\<[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md), `"filename"`\> = `{}`

Parsing options (filename defaults to filePath)

## Returns

[`ParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseResult/index.md)

ParseResult with AST and any errors

## Example

```typescript
const result = parseFile('./project.prs');

if (result.errors.length === 0) {
  console.log(result.ast);
}
```