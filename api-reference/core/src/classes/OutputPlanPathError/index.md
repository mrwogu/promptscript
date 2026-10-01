# OutputPlanPathError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: OutputPlanPathError

Defined in: [core/src/output-plan.ts:119](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L119)

Error raised when a formatter emits a path that cannot be represented as a
project-relative output.

## Extends

- [`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md)

## Constructors

### Constructor

> **new OutputPlanPathError**(`path`): `OutputPlanPathError`

Defined in: [core/src/output-plan.ts:123](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L123)

#### Parameters

##### path

`string`

#### Returns

`OutputPlanPathError`

#### Overrides

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#constructor)

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`cause`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`code`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#code)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#location)

***

### path

> `readonly` **path**: `string`

Defined in: [core/src/output-plan.ts:121](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L121)

Invalid formatter path.

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`format`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#tojson)