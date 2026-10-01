# RegistryPathNotFoundError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: RegistryPathNotFoundError

Defined in: [core/src/errors/registry.ts:25](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/registry.ts#L25)

Path not found within registry repository.

## Extends

- [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)

## Constructors

### Constructor

> **new RegistryPathNotFoundError**(`importPath`, `available`, `location?`): `RegistryPathNotFoundError`

Defined in: [core/src/errors/registry.ts:29](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/registry.ts#L29)

#### Parameters

##### importPath

`string`

##### available

`string`[]

##### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### Returns

`RegistryPathNotFoundError`

#### Overrides

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#constructor)

## Properties

### available

> `readonly` **available**: `string`[]

Defined in: [core/src/errors/registry.ts:27](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/registry.ts#L27)

***

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

### importPath

> `readonly` **importPath**: `string`

Defined in: [core/src/errors/registry.ts:26](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/registry.ts#L26)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#location)

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