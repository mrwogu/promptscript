# EvalDatasetError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: EvalDatasetError

Defined in: [eval/src/errors.ts:161](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/errors.ts#L161)

A dataset file cannot be read or breaks a rule.

## Extends

- [`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md)

## Constructors

### Constructor

> **new EvalDatasetError**(`message`, `code`, `options?`): `EvalDatasetError`

Defined in: [eval/src/errors.ts:162](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/errors.ts#L162)

#### Parameters

##### message

`string`

##### code

[`EvalCode`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalCode/index.md)

##### options?

###### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### Returns

`EvalDatasetError`

#### Overrides

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#constructor)

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`cause`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`code`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#code)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`location`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#location)

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`format`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#tojson)