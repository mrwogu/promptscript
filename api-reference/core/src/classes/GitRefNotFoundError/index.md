# GitRefNotFoundError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitRefNotFoundError

Defined in: [core/src/errors/resolve.ts:147](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/resolve.ts#L147)

Git ref (branch/tag/commit) not found.

## Extends

- [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)

## Constructors

### Constructor

> **new GitRefNotFoundError**(`ref`, `url`, `location?`): `GitRefNotFoundError`

Defined in: [core/src/errors/resolve.ts:153](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/resolve.ts#L153)

#### Parameters

##### ref

`string`

##### url

`string`

##### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### Returns

`GitRefNotFoundError`

#### Overrides

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#constructor)

## Properties

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

***

### ref

> `readonly` **ref**: `string`

Defined in: [core/src/errors/resolve.ts:149](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/resolve.ts#L149)

Git ref that was not found

***

### url

> `readonly` **url**: `string`

Defined in: [core/src/errors/resolve.ts:151](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/errors/resolve.ts#L151)

Git repository URL

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