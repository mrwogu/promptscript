# VirtualFileSystem

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: VirtualFileSystem

Defined in: [browser-compiler/src/virtual-fs.ts:11](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L11)

Virtual file system for storing and retrieving files in memory.

## Constructors

### Constructor

> **new VirtualFileSystem**(`initialFiles?`): `VirtualFileSystem`

Defined in: [browser-compiler/src/virtual-fs.ts:14](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L14)

#### Parameters

##### initialFiles?

`Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>

#### Returns

`VirtualFileSystem`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [browser-compiler/src/virtual-fs.ts:137](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L137)

Get the number of files in the virtual file system.

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [browser-compiler/src/virtual-fs.ts:130](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L130)

Clear all files from the virtual file system.

#### Returns

`void`

***

### clone()

> **clone**(): `VirtualFileSystem`

Defined in: [browser-compiler/src/virtual-fs.ts:162](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L162)

Clone this virtual file system.

#### Returns

`VirtualFileSystem`

***

### delete()

> **delete**(`path`): `boolean`

Defined in: [browser-compiler/src/virtual-fs.ts:83](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L83)

Delete a file from the virtual file system.

#### Parameters

##### path

`string`

#### Returns

`boolean`

***

### exists()

> **exists**(`path`): `boolean`

Defined in: [browser-compiler/src/virtual-fs.ts:53](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L53)

Check if a file exists in the virtual file system.

#### Parameters

##### path

`string`

#### Returns

`boolean`

***

### glob()

> **glob**(`pattern`): `string`[]

Defined in: [browser-compiler/src/virtual-fs.ts:98](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L98)

List files matching a glob-like pattern.
Supports basic patterns like "*.prs" and "**/*.prs".

#### Parameters

##### pattern

`string`

#### Returns

`string`[]

***

### list()

> **list**(): `string`[]

Defined in: [browser-compiler/src/virtual-fs.ts:90](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L90)

List all files in the virtual file system.

#### Returns

`string`[]

***

### merge()

> **merge**(`other`): `void`

Defined in: [browser-compiler/src/virtual-fs.ts:170](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L170)

Merge another virtual file system into this one.
Files from the other system will overwrite files in this system.

#### Parameters

##### other

`VirtualFileSystem`

#### Returns

`void`

***

### read()

> **read**(`path`): `string`

Defined in: [browser-compiler/src/virtual-fs.ts:62](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L62)

Read a file from the virtual file system.

#### Parameters

##### path

`string`

#### Returns

`string`

#### Throws

Error if the file does not exist

***

### toMap()

> **toMap**(): `Map`\<`string`, `string`\>

Defined in: [browser-compiler/src/virtual-fs.ts:144](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L144)

Get all files as a Map.

#### Returns

`Map`\<`string`, `string`\>

***

### toObject()

> **toObject**(): `Record`\<`string`, `string`\>

Defined in: [browser-compiler/src/virtual-fs.ts:151](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L151)

Get all files as a plain object.

#### Returns

`Record`\<`string`, `string`\>

***

### write()

> **write**(`path`, `content`): `void`

Defined in: [browser-compiler/src/virtual-fs.ts:76](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/virtual-fs.ts#L76)

Write a file to the virtual file system.

#### Parameters

##### path

`string`

##### content

`string`

#### Returns

`void`