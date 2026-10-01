# GitCloneError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitCloneError

Defined in: [core/src/errors/resolve.ts:116](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/resolve.ts#L116)

Git clone operation failed.

## Extends

- [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)

## Constructors

### Constructor

> **new GitCloneError**(`message`, `url`, `location?`, `cause?`): `GitCloneError`

Defined in: [core/src/errors/resolve.ts:120](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/resolve.ts#L120)

#### Parameters

##### message

`string`

##### url

`string`

##### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

##### cause?

`Error`

#### Returns

`GitCloneError`

#### Overrides

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#constructor)

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`cause`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`code`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#code)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#location)

***

### url

> `readonly` **url**: `string`

Defined in: [core/src/errors/resolve.ts:118](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/resolve.ts#L118)

Git repository URL

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`format`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#tojson)