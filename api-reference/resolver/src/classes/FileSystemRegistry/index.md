# FileSystemRegistry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: FileSystemRegistry

Defined in: [resolver/src/registry.ts:46](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L46)

Registry implementation backed by the local filesystem.

## Implements

- [`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)

## Constructors

### Constructor

> **new FileSystemRegistry**(`options`): `FileSystemRegistry`

Defined in: [resolver/src/registry.ts:49](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L49)

#### Parameters

##### options

[`FileSystemRegistryOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/FileSystemRegistryOptions/index.md)

#### Returns

`FileSystemRegistry`

## Methods

### exists()

> **exists**(`path`): `Promise`\<`boolean`\>

Defined in: [resolver/src/registry.ts:74](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L74)

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

Defined in: [resolver/src/registry.ts:60](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L60)

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

Defined in: [resolver/src/registry.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/registry.ts#L79)

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