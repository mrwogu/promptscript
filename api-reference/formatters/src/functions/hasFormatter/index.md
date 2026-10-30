# hasFormatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: hasFormatter()

> **hasFormatter**(`name`): `boolean`

Defined in: [formatters/src/standalone.ts:160](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/standalone.ts#L160)

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