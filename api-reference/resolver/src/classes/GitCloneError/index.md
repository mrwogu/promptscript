# GitCloneError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitCloneError

Defined in: [resolver/src/git-registry.ts:126](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L126)

Git clone error.

## Extends

- `Error`

## Constructors

### Constructor

> **new GitCloneError**(`message`, `url`, `cause?`): `GitCloneError`

Defined in: [resolver/src/git-registry.ts:129](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L129)

#### Parameters

##### message

`string`

##### url

`string`

##### cause?

`Error`

#### Returns

`GitCloneError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [resolver/src/git-registry.ts:127](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L127)

#### Overrides

`Error.cause`

***

### url

> `readonly` **url**: `string`

Defined in: [resolver/src/git-registry.ts:131](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L131)