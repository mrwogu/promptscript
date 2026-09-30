# format()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/standalone.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/standalone.ts#L56)

Format a PromptScript AST using a specified or default formatter.

This is a convenience function for one-off formatting without manually
creating formatter instances. For repeated formatting operations,
consider using the formatter classes directly for better performance.

## Parameters

### ast

[`ProgramInput`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProgramInput/index.md)

The resolved PromptScript AST to format

### options?

[`StandaloneFormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/StandaloneFormatOptions/index.md) = `{}`

Format options including which formatter to use

## Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

The formatter output (path and content)

## Throws

Error if the specified formatter is not found

## Example

```typescript
import { format } from '@promptscript/formatters';

// Use default formatter (GitHub)
const output = format(ast);

// Specify formatter by name
const claudeOutput = format(ast, { formatter: 'claude' });

// Use custom options
const cursorOutput = format(ast, {
  formatter: 'cursor',
  version: 'legacy',
});
```