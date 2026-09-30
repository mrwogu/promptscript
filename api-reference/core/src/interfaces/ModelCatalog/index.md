# ModelCatalog

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelCatalog

Defined in: [core/src/model-catalog.ts:47](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L47)

Built-in profiles merged with the project's `models.profiles`.

## Properties

### profiles

> `readonly` **profiles**: readonly [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)[]

Defined in: [core/src/model-catalog.ts:49](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L49)

Every profile: built-in entries first, then custom ones in config order

## Methods

### getLatest()

> **getLatest**(`family`): [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`

Defined in: [core/src/model-catalog.ts:53](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L53)

Newest non-retired release of a family

#### Parameters

##### family

`string`

#### Returns

[`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`

***

### getProfile()

> **getProfile**(`id`): [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`

Defined in: [core/src/model-catalog.ts:51](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L51)

Find a profile by id (case-insensitive)

#### Parameters

##### id

`string`

#### Returns

[`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`

***

### getReplacement()

> **getReplacement**(`id`): [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`

Defined in: [core/src/model-catalog.ts:61](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L61)

Replacement for a profile, found by following successor links until a
current release. Undefined when the chain has no current release: no
successor, a missing one, or a loop.

#### Parameters

##### id

`string`

#### Returns

[`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`

***

### resolve()

> **resolve**(`reference`): [`ModelResolution`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelResolution/index.md) \| `undefined`

Defined in: [core/src/model-catalog.ts:55](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L55)

Resolve a profile id, floating alias, alias, API id, or display name

#### Parameters

##### reference

`string`

#### Returns

[`ModelResolution`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelResolution/index.md) \| `undefined`