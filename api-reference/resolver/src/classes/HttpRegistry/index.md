# HttpRegistry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: HttpRegistry

Defined in: [resolver/src/registry.ts:130](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L130)

Registry implementation backed by HTTP.

## Implements

- [`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)

## Constructors

### Constructor

> **new HttpRegistry**(`options`): `HttpRegistry`

Defined in: [resolver/src/registry.ts:140](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L140)

#### Parameters

##### options

[`HttpRegistryOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/HttpRegistryOptions/index.md)

#### Returns

`HttpRegistry`

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [resolver/src/registry.ts:344](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L344)

Clear the cache.

#### Returns

`void`

***

### exists()

> **exists**(`path`): `Promise`\<`boolean`\>

Defined in: [resolver/src/registry.ts:306](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L306)

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

Defined in: [resolver/src/registry.ts:273](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L273)

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

Defined in: [resolver/src/registry.ts:319](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L319)

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