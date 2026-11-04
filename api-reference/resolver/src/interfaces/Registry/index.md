# Registry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Registry

Defined in: [resolver/src/registry.ts:8](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/registry.ts#L8)

Registry interface for fetching PromptScript files.

## Methods

### exists()

> **exists**(`path`): `Promise`\<`boolean`\>

Defined in: [resolver/src/registry.ts:24](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/registry.ts#L24)

Check if a file exists in the registry.

#### Parameters

##### path

`string`

Path to check

#### Returns

`Promise`\<`boolean`\>

True if the file exists

***

### fetch()

> **fetch**(`path`): `Promise`\<`string`\>

Defined in: [resolver/src/registry.ts:16](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/registry.ts#L16)

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

***

### list()

> **list**(`path`): `Promise`\<`string`[]\>

Defined in: [resolver/src/registry.ts:32](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/registry.ts#L32)

List files in a directory.

#### Parameters

##### path

`string`

Directory path

#### Returns

`Promise`\<`string`[]\>

Array of file/directory names