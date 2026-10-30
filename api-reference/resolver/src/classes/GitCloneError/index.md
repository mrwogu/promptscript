# GitCloneError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitCloneError

Defined in: [resolver/src/git-registry.ts:126](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L126)

Git clone error.

## Extends

- `Error`

## Constructors

### Constructor

> **new GitCloneError**(`message`, `url`, `cause?`): `GitCloneError`

Defined in: [resolver/src/git-registry.ts:129](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L129)

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

Defined in: [resolver/src/git-registry.ts:127](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L127)

#### Overrides

`Error.cause`

***

### url

> `readonly` **url**: `string`

Defined in: [resolver/src/git-registry.ts:131](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L131)