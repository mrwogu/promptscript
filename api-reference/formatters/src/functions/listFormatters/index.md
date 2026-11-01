# listFormatters()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listFormatters()

> **listFormatters**(): `string`[]

Defined in: [formatters/src/standalone.ts:176](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/formatters/src/standalone.ts#L176)

List all registered formatter names.

## Returns

`string`[]

Array of formatter identifiers

## Example

```typescript
import { listFormatters } from '@promptscript/formatters';

console.log(listFormatters()); // ['github', 'claude', 'cursor', 'antigravity']
```