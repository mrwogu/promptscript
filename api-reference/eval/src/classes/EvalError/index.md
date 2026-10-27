# EvalError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: EvalError

Defined in: [eval/src/errors.ts:112](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/errors.ts#L112)

Base of every error the eval package throws.

## Extends

- [`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md)

## Extended by

- [`EvalDatasetError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalDatasetError/index.md)
- [`EvalProviderError`](https://getpromptscript.dev/api-reference/eval/src/classes/EvalProviderError/index.md)

## Constructors

### Constructor

> **new EvalError**(`message`, `code`, `options?`): `EvalError`

Defined in: [eval/src/errors.ts:113](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/errors.ts#L113)

#### Parameters

##### message

`string`

##### code

[`EvalCode`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalCode/index.md)

##### options?

###### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### Returns

`EvalError`

#### Overrides

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#constructor)

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`cause`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`code`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#code)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#location)

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`format`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#tojson)