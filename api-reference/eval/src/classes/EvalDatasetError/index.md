# EvalDatasetError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: EvalDatasetError

Defined in: [eval/src/errors.ts:127](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L127)

A dataset file cannot be read or breaks a rule.

## Extends

- [`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md)

## Constructors

### Constructor

> **new EvalDatasetError**(`message`, `code`, `options?`): `EvalDatasetError`

Defined in: [eval/src/errors.ts:128](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L128)

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

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`cause`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`code`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#code)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`location`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#location)

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`format`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`EvalError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md#tojson)