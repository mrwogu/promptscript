# UnknownAliasError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: UnknownAliasError

Defined in: [core/src/errors/registry.ts:8](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/registry.ts#L8)

Unknown registry alias referenced in import.

## Extends

- [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)

## Constructors

### Constructor

> **new UnknownAliasError**(`alias`, `location?`): `UnknownAliasError`

Defined in: [core/src/errors/registry.ts:11](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/registry.ts#L11)

#### Parameters

##### alias

`string`

##### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### Returns

`UnknownAliasError`

#### Overrides

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#constructor)

## Properties

### alias

> `readonly` **alias**: `string`

Defined in: [core/src/errors/registry.ts:9](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/registry.ts#L9)

***

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`cause`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`code`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#code)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#location)

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`format`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#tojson)