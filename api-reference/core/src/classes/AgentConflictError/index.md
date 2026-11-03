# AgentConflictError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: AgentConflictError

Defined in: [core/src/errors/resolve.ts:72](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/resolve.ts#L72)

Conflicting agent definitions detected during composition.

## Extends

- [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)

## Constructors

### Constructor

> **new AgentConflictError**(`conflicts`, `location?`): `AgentConflictError`

Defined in: [core/src/errors/resolve.ts:80](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/resolve.ts#L80)

#### Parameters

##### conflicts

[`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

##### location?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### Returns

`AgentConflictError`

#### Overrides

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`constructor`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#constructor)

## Properties

### agentName

> `readonly` **agentName**: `string`

Defined in: [core/src/errors/resolve.ts:74](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/resolve.ts#L74)

First conflicting agent name

***

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [core/src/errors/base.ts:56](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/base.ts#L56)

Original error if wrapping another error

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`cause`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#cause)

***

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/base.ts:52](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/base.ts#L52)

Error code

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`code`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#code)

***

### conflicts

> `readonly` **conflicts**: [`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

Defined in: [core/src/errors/resolve.ts:78](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/resolve.ts#L78)

All conflicting names and their provenance

***

### location?

> `readonly` `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/errors/base.ts:54](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/base.ts#L54)

Source location where error occurred

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`location`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#location)

***

### provenance

> `readonly` **provenance**: [`AgentProvenance`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentProvenance/index.md)[]

Defined in: [core/src/errors/resolve.ts:76](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/resolve.ts#L76)

Provenance for the first conflicting name

## Methods

### format()

> **format**(): `string`

Defined in: [core/src/errors/base.ts:79](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/base.ts#L79)

Format error for display.

#### Returns

`string`

#### Inherited from

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`format`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#format)

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/errors/resolve.ts:104](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/errors/resolve.ts#L104)

Convert to JSON-serializable object.

#### Returns

`Record`\<`string`, `unknown`\>

#### Overrides

[`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md).[`toJSON`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md#tojson)