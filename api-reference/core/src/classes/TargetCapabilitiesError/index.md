# TargetCapabilitiesError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: TargetCapabilitiesError

Defined in: [core/src/target-capabilities.ts:65](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-capabilities.ts#L65)

Base error class for all PromptScript errors.

## Extends

- [`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md)

## Constructors

### Constructor

> **new TargetCapabilitiesError**(`message`): `TargetCapabilitiesError`

Defined in: [core/src/target-capabilities.ts:66](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-capabilities.ts#L66)

#### Parameters

##### message

`string`

#### Returns

`TargetCapabilitiesError`

#### Overrides

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#constructor)

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`cause`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`code`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#code)

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#location)

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`format`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/base.ts:92](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/errors/base.ts#L92)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md#tojson)