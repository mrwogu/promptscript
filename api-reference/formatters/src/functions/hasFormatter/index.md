# hasFormatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: hasFormatter()

> **hasFormatter**(`name`): `boolean`

Defined in: [formatters/src/standalone.ts:160](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/standalone.ts#L160)

Check if a formatter is registered.

## Parameters

### name

`string`

Formatter identifier

## Returns

`boolean`

True if the formatter is registered

## Example

```typescript
import { hasFormatter } from '@promptscript/formatters';

if (hasFormatter('my-custom-formatter')) {
  const formatter = getFormatter('my-custom-formatter');
}
```