# MissingParamError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: MissingParamError

Defined in: [core/src/errors/template.ts:13](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/template.ts#L13)

Error thrown when a required template parameter is not provided.

## Example

```
// Parent defines: projectName: string (required)
// Child uses: @inherit ./parent()  // Missing projectName
```

## Extends

- [`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md)

## Constructors

### Constructor

> **new MissingParamError**(`paramName`, `templatePath`, `options?`): `MissingParamError`

Defined in: [core/src/errors/template.ts:19](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/template.ts#L19)

#### Parameters

##### paramName

`string`

##### templatePath

`string`

##### options?

###### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### Returns

`MissingParamError`

#### Overrides

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#constructor)

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`cause`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`code`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#code)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#location)

***

### paramName

> `readonly` **paramName**: `string`

Defined in: [core/src/errors/template.ts:15](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/template.ts#L15)

Name of the missing parameter

***

### templatePath

> `readonly` **templatePath**: `string`

Defined in: [core/src/errors/template.ts:17](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/template.ts#L17)

Path of the template file

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`format`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#tojson)