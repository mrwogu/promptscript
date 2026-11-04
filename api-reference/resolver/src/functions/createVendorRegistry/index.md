# createVendorRegistry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createVendorRegistry()

> **createVendorRegistry**(`vendorDir`): [`VendorRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/VendorRegistry/index.md)

Defined in: [resolver/src/vendor-registry.ts:89](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/vendor-registry.ts#L89)

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