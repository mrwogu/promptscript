# createVendorRegistry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createVendorRegistry()

> **createVendorRegistry**(`vendorDir`): [`VendorRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/VendorRegistry/index.md)

Defined in: [resolver/src/vendor-registry.ts:89](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/vendor-registry.ts#L89)

Create a VendorRegistry backed by the given directory.

## Parameters

### vendorDir

`string`

Absolute path to the vendor directory

## Returns

[`VendorRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/VendorRegistry/index.md)

VendorRegistry instance

## Example

```typescript
import { createVendorRegistry } from '@promptscript/resolver';

const vendor = createVendorRegistry('/project/.promptscript/vendor');
const content = await vendor.fetch('@company/base.prs');
```