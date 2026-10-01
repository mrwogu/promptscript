# parseFileOrThrow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseFileOrThrow()

> **parseFileOrThrow**(`filePath`, `options?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [parser/src/parse.ts:327](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/parser/src/parse.ts#L327)

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