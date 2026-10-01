# FileLoader

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: FileLoader

Defined in: [resolver/src/loader.ts:74](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L74)

File loader for loading and resolving PromptScript files.

## Constructors

### Constructor

> **new FileLoader**(`options`): `FileLoader`

Defined in: [resolver/src/loader.ts:80](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L80)

#### Parameters

##### options

[`LoaderOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md)

#### Returns

`FileLoader`

## Methods

### getLocalPath()

> **getLocalPath**(): `string`

Defined in: [resolver/src/loader.ts:219](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L219)

Get the local path.

#### Returns

`string`

***

### getProjectRoot()

> **getProjectRoot**(): `string`

Defined in: [resolver/src/loader.ts:226](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L226)

Get the project root used as the traversal safety boundary.

#### Returns

`string`

***

### getRegistryPath()

> **getRegistryPath**(): `string`

Defined in: [resolver/src/loader.ts:212](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L212)

Get the registry path.

#### Returns

`string`

***

### load()

> **load**(`path`): `Promise`\<`string`\>

Defined in: [resolver/src/loader.ts:99](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L99)

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

Defined in: [resolver/src/loader.ts:151](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L151)

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

Defined in: [resolver/src/loader.ts:121](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/loader.ts#L121)

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