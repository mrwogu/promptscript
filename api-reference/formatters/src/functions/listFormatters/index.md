# listFormatters()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listFormatters()

> **listFormatters**(): `string`[]

Defined in: [formatters/src/standalone.ts:176](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/formatters/src/standalone.ts#L176)

List all registered formatter names.

## Returns

`string`[]

Array of formatter identifiers

## Example

```typescript
import { listFormatters } from '@promptscript/formatters';

console.log(listFormatters()); // ['github', 'claude', 'cursor', 'antigravity']
```