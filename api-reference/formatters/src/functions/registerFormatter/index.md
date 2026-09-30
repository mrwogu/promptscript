# registerFormatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: registerFormatter()

> **registerFormatter**(`name`, `ctorOrFactory`): `void`

Defined in: [formatters/src/standalone.ts:136](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/standalone.ts#L136)

Register a custom formatter.

This is a convenience wrapper around `FormatterRegistry.register()`.
Use this to add custom formatters that can be referenced by name.

## Parameters

### name

`string`

Unique identifier for the formatter

### ctorOrFactory

[`FormatterClass`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterClass/index.md) \| [`FormatterFactory`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterFactory/index.md)

Formatter class (preferred) or factory function

## Returns

`void`

## Throws

Error if a formatter with the same name is already registered

## Example

```typescript
import { registerFormatter, BaseFormatter } from '@promptscript/formatters';

class MyFormatter extends BaseFormatter {
  name = 'my-tool';
  outputPath = '.my-tool/config.md';
  description = 'My custom formatter';
  defaultConvention = 'markdown';
  static getSupportedVersions() { return { simple: { name: 'simple', description: '...', outputPath: '...' } }; }
}

registerFormatter('my-tool', MyFormatter);

// Now it can be used by name
const formatter = getFormatter('my-tool');
```