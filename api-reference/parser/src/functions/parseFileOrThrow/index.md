# parseFileOrThrow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseFileOrThrow()

> **parseFileOrThrow**(`filePath`, `options?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [parser/src/parse.ts:336](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/parser/src/parse.ts#L336)

Parse a PromptScript file from disk, throwing on error.

## Parameters

### filePath

`string`

Path to the .prs file

### options?

`Omit`\<[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md), `"filename"`\> = `{}`

Parsing options

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

The parsed Program AST

## Throws

If reading or parsing fails

## Example

```typescript
try {
  const ast = parseFileOrThrow('./project.prs');
  console.log(ast.meta?.fields.id);
} catch (error) {
  console.error('Failed:', error);
}
```