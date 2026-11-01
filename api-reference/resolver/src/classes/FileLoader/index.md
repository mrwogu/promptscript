# FileLoader

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: FileLoader

Defined in: [resolver/src/loader.ts:78](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/loader.ts#L78)

File loader for loading and resolving PromptScript files.

## Constructors

### Constructor

> **new FileLoader**(`options`): `FileLoader`

Defined in: [resolver/src/loader.ts:84](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/loader.ts#L84)

#### Parameters

##### options

[`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md)

#### Returns

`FileLoader`

## Methods

### getLocalPath()

> **getLocalPath**(): `string`

Defined in: [resolver/src/loader.ts:223](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/loader.ts#L223)

Get the local path.

#### Returns

`string`

***

### getProjectRoot()

> **getProjectRoot**(): `string`

Defined in: [resolver/src/loader.ts:230](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/loader.ts#L230)

Get the project root used as the traversal safety boundary.

#### Returns

`string`

***

### getRegistryPath()

> **getRegistryPath**(): `string`

Defined in: [resolver/src/loader.ts:216](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/loader.ts#L216)

Get the registry path.

#### Returns

`string`

***

### load()

> **load**(`path`): `Promise`\<`string`\>

Defined in: [resolver/src/loader.ts:103](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/loader.ts#L103)

Load file content from disk.

#### Parameters

##### path

`string`

Absolute path to the file

#### Returns

`Promise`\<`string`\>

File content as string

#### Throws

FileNotFoundError if file doesn't exist

***

### resolveRef()

> **resolveRef**(`ref`, `fromFile`): `string`

Defined in: [resolver/src/loader.ts:155](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/loader.ts#L155)

Resolve a PathReference to an absolute path.

#### Parameters

##### ref

[`PathReference`](https://getpromptscript.dev/api-reference/core/src/interfaces/PathReference/index.md)

PathReference from AST

##### fromFile

`string`

File containing the reference (for relative resolution)

#### Returns

`string`

Absolute filesystem path

***

### toAbsolutePath()

> **toAbsolutePath**(`path`): `string`

Defined in: [resolver/src/loader.ts:125](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/loader.ts#L125)

Convert a path string to an absolute path.

Handles:
- Already absolute paths (start with /)
- Registry paths (@namespace/path)
- Relative paths (./path, ../path, or bare path)

#### Parameters

##### path

`string`

Path to convert

#### Returns

`string`

Absolute filesystem path