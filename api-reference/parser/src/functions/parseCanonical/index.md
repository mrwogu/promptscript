# parseCanonical()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseCanonical()

> **parseCanonical**(`source`, `options?`): [`CanonicalParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)

Defined in: [parser/src/parse.ts:91](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/parser/src/parse.ts#L91)

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