# listFormatters()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listFormatters()

> **listFormatters**(): `string`[]

Defined in: [formatters/src/standalone.ts:176](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/standalone.ts#L176)

List all registered formatter names.

## Returns

`string`[]

Array of formatter identifiers

## Example

```typescript
import { listFormatters } from '@promptscript/formatters';

console.log(listFormatters()); // ['github', 'claude', 'cursor', 'antigravity']
```