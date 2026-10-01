# ResolveError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: ResolveError

Defined in: [core/src/errors/resolve.ts:9](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/resolve.ts#L9)

Error during resolution phase.

## Extends

- [`PSError`](https://getpromptscript.dev/api-reference/core/src/classes/PSError/index.md)

## Extended by

- [`FileNotFoundError`](https://getpromptscript.dev/api-reference/core/src/classes/FileNotFoundError/index.md)
- [`CircularDependencyError`](https://getpromptscript.dev/api-reference/core/src/classes/CircularDependencyError/index.md)
- [`CircularGuardRequiresError`](https://getpromptscript.dev/api-reference/core/src/classes/CircularGuardRequiresError/index.md)
- [`AgentConflictError`](https://getpromptscript.dev/api-reference/core/src/classes/AgentConflictError/index.md)
- [`GitCloneError`](https://getpromptscript.dev/api-reference/core/src/classes/GitCloneError/index.md)
- [`GitAuthError`](https://getpromptscript.dev/api-reference/core/src/classes/GitAuthError/index.md)
- [`GitRefNotFoundError`](https://getpromptscript.dev/api-reference/core/src/classes/GitRefNotFoundError/index.md)
- [`UnknownAliasError`](https://getpromptscript.dev/api-reference/core/src/classes/UnknownAliasError/index.md)
- [`RegistryPathNotFoundError`](https://getpromptscript.dev/api-reference/core/src/classes/RegistryPathNotFoundError/index.md)
- [`SemverNoMatchError`](https://getpromptscript.dev/api-reference/core/src/classes/SemverNoMatchError/index.md)
- [`LockfileIntegrityError`](https://getpromptscript.dev/api-reference/core/src/classes/LockfileIntegrityError/index.md)
- [`OfflineResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/OfflineResolveError/index.md)
- [`RateLimitError`](https://getpromptscript.dev/api-reference/core/src/classes/RateLimitError/index.md)

## Constructors

### Constructor

> **new ResolveError**(`message`, `location?`, `code?`): `ResolveError`

Defined in: [core/src/errors/resolve.ts:10](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/errors/resolve.ts#L10)

#### Parameters

##### message

`string`

##### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

##### code?

`ErrorCode` = `ErrorCode.RESOLVE_ERROR`

#### Returns

`ResolveError`

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