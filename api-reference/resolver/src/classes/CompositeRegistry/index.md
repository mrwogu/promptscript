# CompositeRegistry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: CompositeRegistry

Defined in: [resolver/src/registry.ts:360](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L360)

Registry that combines multiple registries with fallback.

## Implements

- [`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)

## Constructors

### Constructor

> **new CompositeRegistry**(`options`): `CompositeRegistry`

Defined in: [resolver/src/registry.ts:363](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L363)

#### Parameters

##### options

[`CompositeRegistryOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CompositeRegistryOptions/index.md)

#### Returns

`CompositeRegistry`

## Methods

### exists()

> **exists**(`path`): `Promise`\<`boolean`\>

Defined in: [resolver/src/registry.ts:382](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L382)

Check if a file exists in the registry.

#### Parameters

##### path

`string`

Path to check

#### Returns

`Promise`\<`boolean`\>

True if the file exists

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`exists`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#exists)

***

### fetch()

> **fetch**(`path`): `Promise`\<`string`\>

Defined in: [resolver/src/registry.ts:367](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L367)

Fetch the content of a file from the registry.

#### Parameters

##### path

`string`

Path to the file (relative to registry root)

#### Returns

`Promise`\<`string`\>

File content as string

#### Throws

FileNotFoundError if the file doesn't exist

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`fetch`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#fetch)

***

### list()

> **list**(`path`): `Promise`\<`string`[]\>

Defined in: [resolver/src/registry.ts:391](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L391)

List files in a directory.

#### Parameters

##### path

`string`

Directory path

#### Returns

`Promise`\<`string`[]\>

Array of file/directory names

#### Implementation of

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md).[`list`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md#list)