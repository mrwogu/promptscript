# VendorRegistry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: VendorRegistry

Defined in: [resolver/src/vendor-registry.ts:22](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/vendor-registry.ts#L22)

Registry that reads from a local vendor directory (e.g. .promptscript/vendor/).
Used for offline/CI builds where network access is restricted.
Takes priority over network registries when placed first in a CompositeRegistry.

## Implements

- [`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)

## Constructors

### Constructor

> **new VendorRegistry**(`vendorDir`): `VendorRegistry`

Defined in: [resolver/src/vendor-registry.ts:23](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/vendor-registry.ts#L23)

#### Parameters

##### vendorDir

`string`

#### Returns

`VendorRegistry`

## Methods

### exists()

> **exists**(`path`): `Promise`\<`boolean`\>

Defined in: [resolver/src/vendor-registry.ts:51](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/vendor-registry.ts#L51)

Check if a file exists in the vendor directory.

#### Parameters

##### path

`string`

Path relative to the vendor directory

#### Returns

`Promise`\<`boolean`\>

True if the file exists

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`exists`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#exists)

***

### fetch()

> **fetch**(`path`): `Promise`\<`string`\>

Defined in: [resolver/src/vendor-registry.ts:32](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/vendor-registry.ts#L32)

Fetch the content of a vendored file.

#### Parameters

##### path

`string`

Path relative to the vendor directory

#### Returns

`Promise`\<`string`\>

File content as string

#### Throws

FileNotFoundError if the file is not in the vendor directory

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`fetch`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#fetch)

***

### list()

> **list**(`path`): `Promise`\<`string`[]\>

Defined in: [resolver/src/vendor-registry.ts:66](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/vendor-registry.ts#L66)

List entries in a vendor subdirectory.

#### Parameters

##### path

`string`

Directory path relative to the vendor directory

#### Returns

`Promise`\<`string`[]\>

Array of entry names, or empty array if directory does not exist

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`list`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#list)