# parseCanonical()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseCanonical()

> **parseCanonical**(`source`, `options?`): [`CanonicalParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)

Defined in: [parser/src/parse.ts:91](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L91)

Parse PromptScript source code into the immutable canonical AST.

## Parameters

### source

`string`

The PromptScript source code to parse

### options?

[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md) = `{}`

Parsing options

## Returns

[`CanonicalParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)

CanonicalParseResult with AST and any errors

## Example

```typescript
const result = parseCanonical(`
  @meta {
    id: "my-project"
    syntax: "1.0.0"
  }

  @identity {
    """
    You are a helpful assistant.
    """
  }
`, { filename: 'project.prs' });

if (result.errors.length === 0) {
  console.log(result.ast);
}
```