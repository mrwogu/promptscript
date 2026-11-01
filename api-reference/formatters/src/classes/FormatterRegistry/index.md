# FormatterRegistry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: FormatterRegistry

Defined in: [formatters/src/registry.ts:12](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L12)

Registry for formatter implementations.
Allows dynamic registration and discovery of formatters.

Formatters can be registered via class constructor (preferred) or factory function.
When registered via class constructor, the static `getSupportedVersions()` method
is enforced at both compile time (via the `FormatterClass` type) and runtime.

## Constructors

### Constructor

> **new FormatterRegistry**(): `FormatterRegistry`

#### Returns

`FormatterRegistry`

## Methods

### clear()

> `static` **clear**(): `void`

Defined in: [formatters/src/registry.ts:106](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L106)

Clear all registered formatters (useful for testing).

#### Returns

`void`

***

### get()

> `static` **get**(`name`): [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md) \| `undefined`

Defined in: [formatters/src/registry.ts:57](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L57)

Get a formatter instance by name.

#### Parameters

##### name

`string`

Formatter identifier

#### Returns

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md) \| `undefined`

Formatter instance or undefined if not found

***

### getAll()

> `static` **getAll**(): [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)[]

Defined in: [formatters/src/registry.ts:66](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L66)

Get all registered formatters.

#### Returns

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)[]

Array of formatter instances

***

### has()

> `static` **has**(`name`): `boolean`

Defined in: [formatters/src/registry.ts:91](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L91)

Check if a formatter is registered.

#### Parameters

##### name

`string`

Formatter identifier

#### Returns

`boolean`

***

### list()

> `static` **list**(): `string`[]

Defined in: [formatters/src/registry.ts:74](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L74)

List all registered formatter names.

#### Returns

`string`[]

Array of formatter identifiers

***

### listDefault()

> `static` **listDefault**(): `string`[]

Defined in: [formatters/src/registry.ts:83](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L83)

List the formatter names that an "all formatters" default uses.
Prompt targets are opt-in and never part of it.

#### Returns

`string`[]

Array of formatter identifiers

***

### register()

#### Call Signature

> `static` **register**(`name`, `FormatterCtor`): `void`

Defined in: [formatters/src/registry.ts:26](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L26)

Register a formatter class.

Enforces that the class implements a static `getSupportedVersions()` method
at compile time via the `FormatterClass` type and at runtime via validation.

##### Parameters

###### name

`string`

Unique formatter identifier

###### FormatterCtor

[`FormatterClass`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterClass/index.md)

Formatter class with static getSupportedVersions()

##### Returns

`void`

##### Throws

Error if the formatter is already registered

##### Throws

Error if the class lacks a static getSupportedVersions() method

#### Call Signature

> `static` **register**(`name`, `factory`): `void`

Defined in: [formatters/src/registry.ts:36](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L36)

Register a formatter factory function.

##### Parameters

###### name

`string`

Unique formatter identifier

###### factory

[`FormatterFactory`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterFactory/index.md)

Factory function that creates formatter instances

##### Returns

`void`

##### Throws

Error if the formatter is already registered

##### Deprecated

Use the class-based overload to enforce getSupportedVersions()

***

### unregister()

> `static` **unregister**(`name`): `boolean`

Defined in: [formatters/src/registry.ts:99](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/registry.ts#L99)

Unregister a formatter (useful for testing).

#### Parameters

##### name

`string`

Formatter identifier

#### Returns

`boolean`