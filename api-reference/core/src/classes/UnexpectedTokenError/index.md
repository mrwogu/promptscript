# UnexpectedTokenError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: UnexpectedTokenError

Defined in: [core/src/errors/parse.ts:17](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/parse.ts#L17)

Unexpected token encountered.

## Extends

- [`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md)

## Constructors

### Constructor

> **new UnexpectedTokenError**(`token`, `location`, `expected?`): `UnexpectedTokenError`

Defined in: [core/src/errors/parse.ts:23](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/parse.ts#L23)

#### Parameters

##### token

`string`

##### location

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

##### expected?

`string`[]

#### Returns

`UnexpectedTokenError`

#### Overrides

[`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md#constructor)

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md).[`cause`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md).[`code`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md#code)

***

### expected?

> `readonly` `optional` **expected?**: `string`[]

Defined in: [core/src/errors/parse.ts:21](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/parse.ts#L21)

Expected tokens

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md#location)

***

### token

> `readonly` **token**: `string`

Defined in: [core/src/errors/parse.ts:19](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/parse.ts#L19)

The unexpected token

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md).[`format`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md#tojson)