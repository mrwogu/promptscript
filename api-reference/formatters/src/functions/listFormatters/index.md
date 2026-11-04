# listFormatters()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listFormatters()

> **listFormatters**(): `string`[]

Defined in: [formatters/src/standalone.ts:176](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/standalone.ts#L176)

List all registered formatter names.

## Returns

`string`[]

Array of formatter identifiers

## Example

```typescript
import { listFormatters } from '@promptscript/formatters';

console.log(listFormatters()); // ['github', 'claude', 'cursor', 'antigravity']
```