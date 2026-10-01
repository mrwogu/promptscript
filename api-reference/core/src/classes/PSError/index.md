# PSError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: PSError

Defined in: [core/src/errors/base.ts:50](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L50)

Base error class for all PromptScript errors.

## Extends

- `Error`

## Extended by

- [`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md)
- [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)
- [`ValidationError`](https://getpromptscript.dev/api-reference/core/src/classes/ValidationError/index.md)
- [`MissingParamError`](https://getpromptscript.dev/api-reference/core/src/classes/MissingParamError/index.md)
- [`UnknownParamError`](https://getpromptscript.dev/api-reference/core/src/classes/UnknownParamError/index.md)
- [`ParamTypeMismatchError`](https://getpromptscript.dev/api-reference/core/src/classes/ParamTypeMismatchError/index.md)
- [`UndefinedVariableError`](https://getpromptscript.dev/api-reference/core/src/classes/UndefinedVariableError/index.md)
- [`TargetCapabilitiesError`](https://getpromptscript.dev/api-reference/core/src/classes/TargetCapabilitiesError/index.md)
- [`OutputPlanPathError`](https://getpromptscript.dev/api-reference/core/src/classes/OutputPlanPathError/index.md)

## Constructors

### Constructor

> **new PSError**(`message`, `code`, `options?`): `PSError`

Defined in: [core/src/errors/base.ts:58](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L58)

#### Parameters

##### message

`string`

##### code

`string`

##### options?

###### cause?

`Error`

###### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### Returns

`PSError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Overrides

`Error.cause`

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L52)

Error code

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L54)

Source location where error occurred

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>