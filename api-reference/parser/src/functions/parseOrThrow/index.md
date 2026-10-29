# parseOrThrow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseOrThrow()

> **parseOrThrow**(`source`, `options?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [parser/src/parse.ts:231](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L231)

Parse PromptScript source code into an AST, throwing on error.

## Parameters

### source

`string`

The PromptScript source code to parse

### options?

[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md)

Parsing options

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

The parsed Program AST

## Throws

If parsing fails

## Example

```typescript
try {
  const ast = parseOrThrow(source, { filename: 'project.prs' });
  console.log(ast.meta?.fields.id);
} catch (error) {
  console.error('Parse failed:', error);
}
```