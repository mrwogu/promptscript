# getFormatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getFormatter()

> **getFormatter**(`name`): [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

Defined in: [formatters/src/standalone.ts:99](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/standalone.ts#L99)

Get a formatter instance by name.

This is a convenience wrapper around `FormatterRegistry.get()` that throws
a descriptive error if the formatter is not found.

## Parameters

### name

`string`

Formatter identifier (e.g., 'github', 'claude', 'cursor')

## Returns

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

Formatter instance

## Throws

Error if the formatter is not registered

## Example

```typescript
import { getFormatter } from '@promptscript/formatters';

const github = getFormatter('github');
const output = github.format(ast);
```