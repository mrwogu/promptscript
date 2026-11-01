# listFormatters()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listFormatters()

> **listFormatters**(): `string`[]

Defined in: [formatters/src/standalone.ts:176](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/standalone.ts#L176)

List all registered formatter names.

## Returns

`string`[]

Array of formatter identifiers

## Example

```typescript
import { listFormatters } from '@promptscript/formatters';

console.log(listFormatters()); // ['github', 'claude', 'cursor', 'antigravity']
```